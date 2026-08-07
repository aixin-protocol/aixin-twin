import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { validateIntent } from "@/lib/sip.server";
import type { Json } from "@/integrations/supabase/types";

const asJson = (v: unknown) => v as unknown as Json;

const EventInput = z.object({
  taskId: z.string().uuid(),
  seq: z.number().int().min(0),
  phase: z.enum(["sense", "plan", "act", "verify", "anchor", "gate"]),
  kind: z.enum(["tool", "sip", "model", "guard", "output", "loop", "chain"]),
  title: z.string().min(1),
  detail: z.string().optional().default(""),
  chip: z.string().optional().nullable(),
  tag: z.string().optional().nullable(),
  txHash: z.string().optional().nullable(),
});

// ---- Start an intent: creates a real task + decision card + seeds trace ----
export const startIntent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        specialistId: z.string().uuid(),
        skillId: z.string().uuid().optional().nullable(),
        intentText: z.string().min(1),
        intent: z.record(z.string(), z.unknown()),
        domainLabel: z.string(),
        plannedSteps: z.array(z.string()).default([]),
        gate: z.string().optional().default(""),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const report = validateIntent(data.intent);

    // If this looks like a refund, pre-fetch shared-ledger evidence so the
    // Decision Card carries real facts (customer, order, prior refunds,
    // duplicate flags) instead of paraphrased intent text.
    const { gatherRefundEvidence } = await import("@/lib/refund-evidence.server");
    const evidence = await gatherRefundEvidence(data.intentText);

    const { data: specialist } = await supabase
      .from("specialist_twins")
      .select("id, name, type")
      .eq("id", data.specialistId)
      .maybeSingle();

    const enrichedIntentJson = {
      ...data.intent,
      domain: data.domainLabel,
      plan: data.plannedSteps,
      ...(evidence ? { refund_evidence: evidence } : {}),
    };

    const forceApproval = Boolean(evidence);
    const forcedRisk: "low" | "medium" | "high" =
      evidence?.duplicate_risk ? "high" : evidence?.recommendation === "hold" ? "medium" : report.risk;

    const { data: task, error: taskErr } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        specialist_id: data.specialistId,
        skill_id: data.skillId ?? null,
        title: evidence?.order_number
          ? `Refund ${evidence.order_number}${evidence.customer ? ` · ${evidence.customer.email}` : ""}`
          : data.intentText.slice(0, 80),
        intent: data.intentText,
        intent_json: asJson(enrichedIntentJson),
        value: forcedRisk,
        status: "running",
      })
      .select("id")
      .single();
    if (taskErr) throw taskErr;

    let cardId: string | null = null;
    if (report.requires_approval || forceApproval) {
      const cardTitle = evidence?.order_number
        ? `Refund ${evidence.order_number} · $${evidence.totals.paid.toFixed(2)}${evidence.duplicate_risk ? " · DUPLICATE RISK" : ""}`
        : data.intentText.slice(0, 80);
      const cardDetail = evidence?.detail_markdown
        ?? (data.gate || report.reasons.join("; ") || `Delegated: ${report.intent.action}`);

      const { data: card, error: cardErr } = await supabase
        .from("decision_cards")
        .insert({
          user_id: userId,
          task_id: task.id,
          specialist_id: data.specialistId,
          risk: forcedRisk,
          requestor: "Master Twin",
          specialist_name: specialist?.name ?? "Specialist",
          title: cardTitle,
          detail: cardDetail,
          amount: evidence?.totals?.paid ?? (typeof report.intent.amount === "number" ? report.intent.amount : null),
          status: "pending",
          sip_report: asJson({ ...report, evidence }),
        })
        .select("id")
        .single();
      if (cardErr) throw cardErr;
      cardId = card.id;
    }

    // Seed the opening trace events (real rows, realtime-published).
    const opening = [
      { phase: "sense", kind: "loop", title: "Harness loop engaged", detail: "OODA · Sense → Plan → Act → Verify → Anchor", chip: "TOP" },
      { phase: "sense", kind: "model", title: "Parsing intent", detail: data.intentText.slice(0, 140) },
      ...(evidence
        ? [
            {
              phase: "sense" as const,
              kind: "tool" as const,
              title: "Shared-ledger evidence gathered",
              detail: [
                evidence.customer ? `customer=${evidence.customer.email}` : "customer=not-found",
                evidence.order ? `order=${evidence.order.order_number} $${evidence.order.amount} ${evidence.order.status}` : "order=not-found",
                `prior_refunds=${evidence.prior_refunds.length}`,
                `net_owed=$${evidence.totals.net_owed.toFixed(2)}`,
              ].join(" · "),
              chip: "MCP",
            },
          ]
        : []),
      { phase: "sense", kind: "sip", title: "SIP schema check", detail: `Intent JSON validated · risk=${forcedRisk} · requires_approval=${report.requires_approval || forceApproval}`, chip: "SIP" },
      { phase: "sense", kind: "guard", title: "Responsible-AI guardrails", detail: "PII scrub · policy scope · reversibility check", chip: "ISO 42001" },
      ...(evidence?.duplicate_risk
        ? [
            {
              phase: "gate" as const,
              kind: "guard" as const,
              title: "Duplicate refund detected — HOLD",
              detail: `Recommendation: ${evidence.recommendation.toUpperCase()}. ${evidence.flags.join(" · ")}`,
              chip: "POLICY",
            },
          ]
        : []),
    ].map((e, i) => ({
      task_id: task.id,
      user_id: userId,
      seq: i,
      phase: e.phase,
      kind: e.kind,
      title: e.title,
      detail: e.detail,
      chip: e.chip ?? null,
    }));
    await supabase.from("task_events").insert(opening);

    // Auto-execute when SIP found no reason to require human approval and no
    // ledger evidence forced a card. This is what makes low-risk skills like
    // "Daily Briefing" actually run end-to-end without a Decision Card.
    if (!cardId) {
      try {
        const { runExecution } = await import("@/lib/execution.server");
        await runExecution(
          supabase,
          userId,
          task.id,
          data.intentText,
          enrichedIntentJson,
          data.domainLabel,
          report.sip_id,
          null,
        );
      } catch (e) {
        console.error("[startIntent] auto-execute failed", e);
        await supabase.from("tasks").update({ status: "done" }).eq("id", task.id);
      }
    }

    return { taskId: task.id, decisionCardId: cardId, report: asJson(report), evidence };
  });


// ---- Append a single trace event (client-driven cadence) ----
export const logTaskEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => EventInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Verify caller owns the task.
    const { data: t } = await supabase
      .from("tasks")
      .select("id, user_id")
      .eq("id", data.taskId)
      .maybeSingle();
    if (!t || t.user_id !== userId) throw new Error("Task not found");

    const { data: row, error } = await supabase
      .from("task_events")
      .insert({
        task_id: data.taskId,
        user_id: userId,
        seq: data.seq,
        phase: data.phase,
        kind: data.kind,
        title: data.title,
        detail: data.detail ?? "",
        chip: data.chip ?? null,
        tag: data.tag ?? null,
        tx_hash: data.txHash ?? null,
      })
      .select("id, created_at")
      .single();
    if (error) throw error;
    return row;
  });

// ---- Read one task + its events + latest receipt ----
export const getTaskDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ taskId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [taskRes, eventsRes, cardRes, receiptRes] = await Promise.all([
      supabase.from("tasks").select("*").eq("id", data.taskId).eq("user_id", userId).maybeSingle(),
      supabase.from("task_events").select("*").eq("task_id", data.taskId).eq("user_id", userId).order("seq"),
      supabase.from("decision_cards").select("*").eq("task_id", data.taskId).eq("user_id", userId).maybeSingle(),
      supabase.from("receipts").select("*").eq("task_id", data.taskId).eq("user_id", userId).maybeSingle(),
    ]);
    return {
      task: taskRes.data,
      events: eventsRes.data ?? [],
      card: cardRes.data,
      receipt: receiptRes.data,
    };
  });

// ---- List tasks for history ----
export const listTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("tasks")
      .select("id, title, intent, status, value, created_at, specialist_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    return data ?? [];
  });

// ---- Delete a single task (cascades events/messages/outcomes/decision_cards) ----
export const deleteTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ taskId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // receipts.task_id is SET NULL on task delete — clean them (and linked
    // reputation entries) explicitly so demo resets don't leave orphans.
    const { data: receipts } = await supabase
      .from("receipts")
      .select("id")
      .eq("task_id", data.taskId)
      .eq("user_id", userId);
    const receiptIds = (receipts ?? []).map((r) => r.id);
    if (receiptIds.length) {
      await supabase.from("reputation_entries").delete().in("receipt_id", receiptIds).eq("user_id", userId);
      await supabase.from("receipts").delete().in("id", receiptIds).eq("user_id", userId);
    }
    const { error } = await supabase.from("tasks").delete().eq("id", data.taskId).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Wipe ALL demo data for the current user ----
export const resetDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    // Children first, then parents.
    await supabase.from("reputation_entries").delete().eq("user_id", userId);
    await supabase.from("receipts").delete().eq("user_id", userId);
    await supabase.from("task_outcomes").delete().eq("user_id", userId);
    await supabase.from("task_messages").delete().eq("user_id", userId);
    await supabase.from("task_events").delete().eq("user_id", userId);
    await supabase.from("decision_cards").delete().eq("user_id", userId);
    await supabase.from("tasks").delete().eq("user_id", userId);
    await supabase.from("chat_messages").delete().eq("user_id", userId);
    return { ok: true };
  });
