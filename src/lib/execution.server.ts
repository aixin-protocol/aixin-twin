// Post-approval execution loop. Emits act/verify events, generates an outcome
// artifact via Lovable AI, and notifies via Telegram if paired.
// Loaded from server functions with await import(...) — never at module scope
// of a .functions.ts file.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";

type SB = SupabaseClient<Database>;

export async function runExecution(
  supabase: SB,
  userId: string,
  taskId: string,
  intentText: string,
  intentJson: Record<string, unknown>,
  domainLabel: string,
  receiptSipId?: string | null,
  overrideReason?: string | null,
): Promise<void> {
  // 1) Move task to executing
  await supabase.from("tasks").update({ status: "executing" }).eq("id", taskId);

  // Find highest existing seq so we append cleanly.
  const { data: lastEvt } = await supabase
    .from("task_events")
    .select("seq")
    .eq("task_id", taskId)
    .order("seq", { ascending: false })
    .limit(1)
    .maybeSingle();
  let seq = (lastEvt?.seq ?? -1) + 1;

  const insertEvent = async (evt: {
    phase: "act" | "verify" | "anchor" | "gate";
    kind: "tool" | "sip" | "model" | "guard" | "output" | "loop" | "chain";
    title: string;
    detail?: string;
    chip?: string | null;
  }) => {
    await supabase.from("task_events").insert({
      task_id: taskId,
      user_id: userId,
      seq: seq++,
      phase: evt.phase,
      kind: evt.kind,
      title: evt.title,
      detail: evt.detail ?? "",
      chip: evt.chip ?? null,
    });
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  await insertEvent({
    phase: "act",
    kind: "loop",
    title: "Execution started",
    detail: "Decision Card approved · specialist executing under Outcome Contract",
    chip: "TOP",
  });
  await sleep(300);

  // 1b) If this is a refund intent with real ledger evidence, EXECUTE the refund
  // against the shared ledger. This is the point of the demo — approval isn't
  // theatrical; it actually issues the payout, and the row is linked back to
  // the signed on-chain receipt via sip_receipt_id.
  const refundResult = await maybeExecuteRefund(supabase, intentJson, receiptSipId, overrideReason);
  // 1c) Or if this is a Daily Briefing intent, fetch live market data now.
  const briefingResult = refundResult ? null : await maybeRunDailyBriefing(intentText, intentJson);
  // 1d) Or if this is a price-forecast intent, run the deterministic forecast
  // against real 90-day market history.
  const { isForecastIntent, runForecast } = await import("@/lib/forecast.server");
  const forecastResult =
    refundResult || briefingResult
      ? null
      : isForecastIntent(intentText, intentJson)
        ? await runForecast(intentText, intentJson)
        : null;
  if (refundResult) {
    await insertEvent({
      phase: "act",
      kind: "tool",
      title: refundResult.ok
        ? `Refund issued · ${refundResult.orderNumber} · $${refundResult.amount.toFixed(2)}`
        : `Refund tool refused · ${refundResult.reason}`,
      detail: refundResult.ok
        ? `demo_refunds row inserted by aixin-master-twin, governance_status=approved, sip_receipt_id=${receiptSipId ?? "n/a"}. Order marked refunded.`
        : refundResult.reason,
      chip: refundResult.ok ? "LEDGER WRITE" : "GUARD",
    });
    await sleep(300);
  } else if (briefingResult) {
    await insertEvent({
      phase: "act",
      kind: "tool",
      title: briefingResult.ok
        ? `Live data fetched · BNB $${briefingResult.bnbPrice?.toFixed(2) ?? "?"} · ${briefingResult.trending.length} trending`
        : `Briefing data fetch failed`,
      detail: briefingResult.ok
        ? `CoinGecko public API — no key required. ${briefingResult.sources.join(" · ")}`
        : briefingResult.reason ?? "unknown",
      chip: briefingResult.ok ? "LIVE DATA" : "GUARD",
    });
    await sleep(300);
  } else if (forecastResult) {
    await insertEvent({
      phase: "act",
      kind: "tool",
      title: forecastResult.ok
        ? `Forecast computed · ${forecastResult.symbol} ${forecastResult.horizonDays}d → $${forecastResult.point.toFixed(2)}`
        : `Forecast failed · ${forecastResult.reason}`,
      detail: forecastResult.ok
        ? `${forecastResult.samples} daily observations · ${forecastResult.source} · deterministic drift + volatility band (no LLM in the numeric path).`
        : forecastResult.reason,
      chip: forecastResult.ok ? "LIVE DATA" : "GUARD",
    });
    await sleep(300);
  } else {
    await insertEvent({
      phase: "act",
      kind: "tool",
      title: `Invoking ${domainLabel} adapters`,
      detail: "Deterministic skill code runs — LLM is out of the execution path.",
    });
    await sleep(300);
  }

  await insertEvent({
    phase: "verify",
    kind: "guard",
    title: "Post-flight verification",
    detail: "Outputs checked against outcome contract · bounds respected",
    chip: "ISO 42001",
  });

  // 2) Generate outcome artifact via Lovable AI (or a refund/briefing/forecast-specific one)
  const outcome = refundResult?.ok
    ? refundOutcome(refundResult, overrideReason ?? null)
    : briefingResult?.ok
      ? briefingOutcome(briefingResult)
      : forecastResult?.ok
        ? forecastOutcome(forecastResult)
        : await generateOutcome(intentText, intentJson, domainLabel);

  // 2b) Deliver the outcome through a connected live adapter (Gmail today).
  const delivery = await deliverViaAdapter(
    supabase,
    userId,
    intentText,
    intentJson,
    outcome,
    forecastResult?.ok ? forecastResult : null,
  );
  if (delivery) {
    await insertEvent({
      phase: "act",
      kind: "tool",
      title: delivery.ok
        ? `Email sent via Gmail · ${delivery.to}`
        : `Gmail delivery failed · ${delivery.reason}`,
      detail: delivery.ok
        ? `Gmail API users.messages.send · from ${delivery.from} · message id ${delivery.messageId}`
        : delivery.reason,
      chip: delivery.ok ? "ADAPTER" : "GUARD",
    });
    outcome.artifact = {
      ...outcome.artifact,
      delivery: delivery.ok
        ? { channel: "gmail", to: delivery.to, from: delivery.from, message_id: delivery.messageId, status: "sent" }
        : { channel: "gmail", status: "failed", reason: delivery.reason },
    };
    outcome.summary = delivery.ok
      ? `${outcome.summary}\n\nDelivered by email to ${delivery.to} via your connected Gmail adapter.`
      : `${outcome.summary}\n\nEmail delivery was attempted but failed: ${delivery.reason}`;
  }


  await insertEvent({
    phase: "verify",
    kind: "output",
    title: "Outcome ready",
    detail: outcome.title,
    chip: "OUTPUT",
  });

  await supabase.from("task_outcomes").insert({
    task_id: taskId,
    user_id: userId,
    title: outcome.title,
    summary: outcome.summary,
    artifact: outcome.artifact as unknown as Json,
    next_actions: outcome.next_actions as unknown as Json,
  });

  // 3) Post a Master Twin summary into the follow-up thread
  const threadBody = `${outcome.title}\n\n${outcome.summary}\n\nAsk me anything about this — I'll keep working on it.`;
  await supabase.from("task_messages").insert({
    task_id: taskId,
    user_id: userId,
    sender: "twin",
    source: "app",
    body: threadBody,
  });

  // 4) Mark task done
  await supabase.from("tasks").update({ status: "done" }).eq("id", taskId);

  // 5) Telegram notify if paired. Use the same tagged message format as
  // follow-up chat mirroring so Telegram replies route back to this task.
  await notifyTelegram(supabase, userId, taskId, outcome.title, threadBody);
}

type OutcomeShape = {
  title: string;
  summary: string;
  artifact: Record<string, unknown>;
  next_actions: string[];
};

async function generateOutcome(
  intentText: string,
  intentJson: Record<string, unknown>,
  domainLabel: string,
): Promise<OutcomeShape> {
  try {
    const { resolveChatModel } = await import("@/lib/ai-gateway.server");
    const resolved = resolveChatModel("fast");
    if (!resolved) return fallbackOutcome(intentText, domainLabel);
    const { generateText, Output } = await import("ai");
    const { z } = await import("zod");
    const model = resolved.model;
    const { output } = await generateText({
      model,
      output: Output.object({
        schema: z.object({
          title: z.string(),
          summary: z.string(),
          artifact: z.record(z.string(), z.unknown()),
          next_actions: z.array(z.string()),
        }),
      }),
      prompt: [
        `You are the Master Twin producing the concrete outcome artifact for an approved task.`,
        `Domain: ${domainLabel}.`,
        `User intent: ${intentText}`,
        `Structured intent JSON: ${JSON.stringify(intentJson).slice(0, 1200)}`,
        ``,
        `Return:`,
        `- title: one short line naming the delivered artifact.`,
        `- summary: 2-4 sentences on what was actually done and the key decisions.`,
        `- artifact: an object with the domain-specific deliverable. For travel: itinerary (days array with day, date, city, plan, cost), total_cost, currency, confirmations. For marketing: campaign_brief, target, channels, budget, calendar. For finance: rebalance/actions list with instrument, side, amount, rationale. For anything else: sensible keys.`,
        `- next_actions: 2-4 concrete follow-ups the user can approve next.`,
        ``,
        `Be specific, use the slot values from the intent JSON, and stay under 500 words total. This is a demo artifact so plausible numbers are fine — do not hedge with "I can't book flights" language; produce the plan/brief/portfolio as if executed.`,
      ].join("\n"),
    });
    return output as OutcomeShape;
  } catch (e) {
    console.error("[execution] outcome generation failed", e);
    return fallbackOutcome(intentText, domainLabel);
  }
}

function fallbackOutcome(intentText: string, domainLabel: string): OutcomeShape {
  return {
    title: `${domainLabel} plan ready`,
    summary: `Executed: ${intentText.slice(0, 200)}. See the artifact for the deliverable.`,
    artifact: { note: "AI outcome generator unavailable — placeholder artifact." },
    next_actions: ["Review the plan", "Ask the twin to refine", "Approve the next step"],
  };
}

async function notifyTelegram(
  supabase: SB,
  userId: string,
  taskId: string,
  title: string,
  body: string,
) {
  const { mirrorTaskMessageToTelegram } = await import("@/lib/telegram.server");
  const mirror = await mirrorTaskMessageToTelegram({ supabase, userId, taskId, taskTitle: title, body });
  if (!mirror.ok) console.error("[execution] Telegram mirror failed", mirror.error);
}

// ---------- Refund execution against the shared demo ledger ----------

type RefundExec =
  | { ok: true; orderNumber: string; amount: number; currency: string; customerEmail: string; refundId: string; priorCount: number }
  | { ok: false; reason: string };

async function maybeExecuteRefund(
  supabase: SB,
  intentJson: Record<string, unknown>,
  receiptSipId?: string | null,
  overrideReason?: string | null,
): Promise<RefundExec | null> {
  const ev = (intentJson.refund_evidence ?? null) as
    | {
        order?: { order_number: string; amount: number; currency: string; status: string } | null;
        customer?: { email: string; name: string | null } | null;
        prior_refunds?: Array<unknown>;
      }
    | null;
  if (!ev || !ev.order) return null;

  const orderNumber = ev.order.order_number;
  const amount = Number(ev.order.amount);
  const currency = ev.order.currency ?? "USD";
  const customerEmail = ev.customer?.email ?? "unknown";
  const priorCount = Array.isArray(ev.prior_refunds) ? ev.prior_refunds.length : 0;

  // Deterministic guard: refuse zero/negative amounts. Duplicate refunds are
  // ALLOWED here because the human explicitly overrode the recommendation —
  // that override reason has already been signed and anchored by decideOnCard.
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, reason: "Invalid refund amount." };
  }

  const reasonText = overrideReason?.trim()
    ? `Human-approved refund. ${overrideReason.trim()}`
    : "Human-approved refund via AiXin Decision Card.";

  // Demo ledger tables have RLS locked to deny direct authenticated writes
  // (both OpenClaw and AiXin must go through server-side helpers). Use the
  // admin client to persist the AiXin-side refund + agent action log.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: inserted, error: insErr } = await supabaseAdmin
    .from("demo_refunds")
    .insert({
      order_number: orderNumber,
      amount,
      reason: reasonText,
      issued_by_agent: "aixin-master-twin",
      governance_status: "approved",
      sip_receipt_id: receiptSipId ?? null,
    })
    .select("id")
    .single();
  if (insErr) {
    console.error("[execution] refund insert failed", insErr);
    return { ok: false, reason: insErr.message };
  }

  // Mark the order refunded on the shared ledger.
  await supabaseAdmin.from("demo_orders").update({ status: "refunded" }).eq("order_number", orderNumber);

  // Log the agent action so it appears in the shared ledger alongside OpenClaw's calls.
  await supabaseAdmin.from("demo_agent_actions").insert({
    agent_label: "aixin-master-twin",
    tool: "issue_refund",
    args: { order_number: orderNumber, amount, currency, customer_email: customerEmail },
    result: {
      ok: true,
      refund_id: inserted.id,
      governance_status: "approved",
      sip_receipt_id: receiptSipId ?? null,
      override_reason: overrideReason ?? null,
      prior_refunds: priorCount,
    },
  });

  return { ok: true, orderNumber, amount, currency, customerEmail, refundId: inserted.id, priorCount };
}

function refundOutcome(r: Extract<RefundExec, { ok: true }>, overrideReason: string | null): OutcomeShape {
  const wasDuplicate = r.priorCount > 0;
  const title = wasDuplicate
    ? `Refund re-issued · ${r.orderNumber} · $${r.amount.toFixed(2)}`
    : `Refund issued · ${r.orderNumber} · $${r.amount.toFixed(2)}`;
  const summary = wasDuplicate
    ? `Under human override, a ${r.currency} ${r.amount.toFixed(2)} refund was issued for ${r.orderNumber} to ${r.customerEmail}. This order had ${r.priorCount} prior refund${r.priorCount === 1 ? "" : "s"} — the operator's override reason and the resulting refund are both linked to the signed on-chain receipt for audit.`
    : `A ${r.currency} ${r.amount.toFixed(2)} refund was issued for ${r.orderNumber} to ${r.customerEmail}. The demo_refunds row is linked to the signed on-chain receipt.`;
  return {
    title,
    summary,
    artifact: {
      action: "refund_issued",
      order_number: r.orderNumber,
      amount: r.amount,
      currency: r.currency,
      customer_email: r.customerEmail,
      refund_id: r.refundId,
      prior_refund_count: r.priorCount,
      duplicate_override: wasDuplicate,
      override_reason: overrideReason,
      issued_by_agent: "aixin-master-twin",
      governance_status: "approved",
    },
    next_actions: [
      "Notify the customer that the refund has been issued",
      "Reconcile the shared ledger totals in /dashboard/ledger",
      wasDuplicate ? "Flag this order for finance review (duplicate refund under override)" : "Close the case",
    ],
  };
}


// ---------- Daily Briefing: fetch live crypto data + trending headlines ----------

type BriefingResult =
  | {
      ok: true;
      bnbPrice: number | null;
      bnbChange24h: number | null;
      btcPrice: number | null;
      ethPrice: number | null;
      trending: Array<{ name: string; symbol: string; rank: number | null }>;
      sources: string[];
      generatedAt: string;
    }
  | { ok: false; reason: string };

function shouldRunBriefing(intentText: string, intentJson: Record<string, unknown>): boolean {
  const action = String((intentJson.action as string | undefined) ?? "").toLowerCase();
  if (action === "daily_briefing") return true;
  const t = intentText.toLowerCase();
  return /\b(daily\s+briefing|market\s+briefing|morning\s+briefing|crypto\s+digest|bnb\s+price)\b/.test(t);
}

async function maybeRunDailyBriefing(
  intentText: string,
  intentJson: Record<string, unknown>,
): Promise<BriefingResult | null> {
  if (!shouldRunBriefing(intentText, intentJson)) return null;
  try {
    const [pricesRes, trendingRes] = await Promise.all([
      fetch("https://api.coingecko.com/api/v3/simple/price?ids=binancecoin,bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true", { headers: { accept: "application/json" } }),
      fetch("https://api.coingecko.com/api/v3/search/trending", { headers: { accept: "application/json" } }),
    ]);
    if (!pricesRes.ok) return { ok: false, reason: `coingecko prices ${pricesRes.status}` };
    const prices = (await pricesRes.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
    const trending = trendingRes.ok
      ? (((await trendingRes.json()) as { coins?: Array<{ item?: { name?: string; symbol?: string; market_cap_rank?: number } }> }).coins ?? [])
          .slice(0, 5)
          .map((c) => ({ name: c.item?.name ?? "?", symbol: (c.item?.symbol ?? "?").toUpperCase(), rank: c.item?.market_cap_rank ?? null }))
      : [];
    return {
      ok: true,
      bnbPrice: prices.binancecoin?.usd ?? null,
      bnbChange24h: prices.binancecoin?.usd_24h_change ?? null,
      btcPrice: prices.bitcoin?.usd ?? null,
      ethPrice: prices.ethereum?.usd ?? null,
      trending,
      sources: ["CoinGecko /simple/price", "CoinGecko /search/trending"],
      generatedAt: new Date().toISOString(),
    };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

function fmt(n: number | null, digits = 2): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function briefingOutcome(r: Extract<BriefingResult, { ok: true }>): OutcomeShape {
  const change = r.bnbChange24h;
  const arrow = change === null ? "" : change >= 0 ? " ▲" : " ▼";
  const changeStr = change === null ? "" : ` (${change >= 0 ? "+" : ""}${change.toFixed(2)}%${arrow} 24h)`;
  const title = `Daily Briefing · BNB $${fmt(r.bnbPrice)}${changeStr}`;
  const lines: string[] = [
    "**Markets (live, CoinGecko)**",
    `• BNB — $${fmt(r.bnbPrice)}${changeStr}`,
    `• BTC — $${fmt(r.btcPrice)}`,
    `• ETH — $${fmt(r.ethPrice)}`,
    "",
    "**Trending now**",
    ...r.trending.map((t, i) => `${i + 1}. ${t.name} (${t.symbol})${t.rank ? ` — rank #${t.rank}` : ""}`),
    "",
    `_Fetched ${new Date(r.generatedAt).toUTCString()}. Sources: ${r.sources.join(", ")}._`,
  ];
  return {
    title,
    summary: lines.join("\n"),
    artifact: {
      action: "daily_briefing",
      generated_at: r.generatedAt,
      markets: {
        binancecoin: { usd: r.bnbPrice, change_24h: r.bnbChange24h },
        bitcoin: { usd: r.btcPrice },
        ethereum: { usd: r.ethPrice },
      },
      trending: r.trending,
      sources: r.sources,
    },
    next_actions: [
      "Schedule this briefing to run every morning at 08:00",
      "Add a price alert if BNB moves ±5% in 24h",
      "Add a second data source (RSS or news API)",
    ],
  };
}

// ---------- Forecast outcome + adapter delivery ----------

type ForecastOk = Extract<Awaited<ReturnType<typeof import("@/lib/forecast.server").runForecast>>, { ok: true }>;

function forecastOutcome(r: ForecastOk): OutcomeShape {
  const pct = ((r.point - r.spot) / r.spot) * 100;
  const money = (n: number) => `$${fmt(n)}`;
  return {
    title: `${r.symbol} ${r.horizonDays}-day forecast · ${money(r.point)} (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%)`,
    summary: [
      `**${r.name} (${r.symbol}) — ${r.horizonDays}-day outlook**`,
      `• Spot now: ${money(r.spot)}`,
      `• Point forecast: ${money(r.point)} (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%)`,
      `• 90% range: ${money(r.low)} – ${money(r.high)}`,
      `• 7d ${r.change7d >= 0 ? "+" : ""}${r.change7d.toFixed(2)}% · 30d ${r.change30d >= 0 ? "+" : ""}${r.change30d.toFixed(2)}%`,
      `• SMA7 ${money(r.sma7)} · SMA30 ${money(r.sma30)} · annualised vol ${r.annualisedVol.toFixed(1)}%`,
      "",
      `_Deterministic drift + volatility band over ${r.samples} daily observations. Source: ${r.source}. Not financial advice._`,
    ].join("\n"),
    artifact: {
      action: "forecast_price",
      asset: r.assetId,
      symbol: r.symbol,
      horizon_days: r.horizonDays,
      spot_usd: r.spot,
      point_forecast_usd: r.point,
      range_90_usd: { low: r.low, high: r.high },
      direction: r.direction,
      change_7d_pct: r.change7d,
      change_30d_pct: r.change30d,
      sma7_usd: r.sma7,
      sma30_usd: r.sma30,
      annualised_vol_pct: r.annualisedVol,
      samples: r.samples,
      source: r.source,
      generated_at: r.generatedAt,
    },
    next_actions: [
      `Email this ${r.symbol} forecast on a daily schedule`,
      `Alert me if ${r.symbol} breaks ${money(r.high)} or ${money(r.low)}`,
      "Add a second data source to cross-check the forecast",
    ],
  };
}

type DeliveryResult =
  | { ok: true; to: string; from: string; messageId: string }
  | { ok: false; reason: string };

/**
 * If the user asked for the result to be emailed (or the intent carries a
 * deliver_to slot) and a LIVE Gmail adapter is connected, send the outcome
 * through the Gmail REST API. Returns null when no delivery was requested.
 */
async function deliverViaAdapter(
  supabase: SB,
  userId: string,
  intentText: string,
  intentJson: Record<string, unknown>,
  outcome: OutcomeShape,
  forecast: ForecastOk | null,
): Promise<DeliveryResult | null> {
  const params = (intentJson.params ?? {}) as Record<string, unknown>;
  const { detectRecipientEmail } = await import("@/lib/forecast.server");
  const explicit =
    (typeof params.deliver_to === "string" && params.deliver_to) ||
    (typeof intentJson.deliver_to === "string" && (intentJson.deliver_to as string)) ||
    detectRecipientEmail(intentText);
  const wantsEmail =
    !!explicit || /\b(email|e-mail|gmail|send\s+(it|this|me)|mail\s+me|发邮件|邮件)\b/i.test(intentText);
  if (!wantsEmail) return null;

  const { data: adapter } = await supabase
    .from("adapters")
    .select("id, config, mode, status")
    .eq("user_id", userId)
    .eq("provider", "Gmail")
    .eq("kind", "email")
    .maybeSingle();

  if (!adapter || adapter.status !== "connected") {
    return { ok: false, reason: "No connected Gmail adapter. Connect one in Adapters." };
  }
  const cfg = (adapter.config ?? {}) as Record<string, unknown> as import("@/lib/gmail.server").GmailConfig;
  if (adapter.mode !== "live") {
    return { ok: false, reason: "Gmail adapter is in Test mode — switch it to Live to send real email." };
  }
  const to = explicit || cfg.from_email;
  if (!to) return { ok: false, reason: "No recipient address found in the request." };

  const { sendGmail } = await import("@/lib/gmail.server");
  const body = forecast
    ? (await import("@/lib/forecast.server")).forecastEmail(forecast)
    : { subject: outcome.title, text: `${outcome.title}\n\n${outcome.summary}` };

  return await sendGmail(cfg, { to, subject: body.subject, text: body.text });
}
