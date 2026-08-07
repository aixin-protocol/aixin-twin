// Server-only: gather shared-ledger evidence for a refund intent so the
// Decision Card + task thread twin have real facts to reason about instead
// of paraphrasing the user's prompt. This is what turns a "vibes" Decision
// Card into an auditable one — mirrors what a governed executor would see
// through the aixin-payments MCP tools (get_customer, list_orders,
// list_refunds), but read directly from Postgres for speed.

export type RefundEvidence = {
  is_refund_intent: boolean;
  email: string | null;
  order_number: string | null;
  customer: { email: string; name: string | null } | null;
  order: {
    order_number: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
  } | null;
  prior_refunds: Array<{
    id: string;
    amount: number;
    reason: string | null;
    issued_by_agent: string | null;
    governance_status: string | null;
    created_at: string;
  }>;
  totals: { paid: number; refunded: number; net_owed: number };
  flags: string[]; // human-readable risk flags
  duplicate_risk: boolean;
  recommendation: "reject" | "hold" | "approve";
  detail_markdown: string; // ready-to-paste into decision_cards.detail
};

const REFUND_RE = /\brefund|charge[- ]?back|return .* money|退款|退货\b/i;
// Stop at the first char that isn't a valid domain char; \w already excludes '.'
// and we don't allow trailing '.' so "demo@aixin.local." trims cleanly.
const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/;
const ORDER_RE = /\bORD[-_]?\d{3,}\b/i;

function stripTrailingPunct(s: string) {
  return s.replace(/[.,;:!?)\]}'"`]+$/g, "");
}

export async function gatherRefundEvidence(intentText: string): Promise<RefundEvidence | null> {
  if (!REFUND_RE.test(intentText)) return null;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const emailRaw = intentText.match(EMAIL_RE)?.[0] ?? null;
  const email = emailRaw ? stripTrailingPunct(emailRaw).toLowerCase() : null;
  const orderNumberFromText = intentText.match(ORDER_RE)?.[0]?.toUpperCase() ?? null;

  // Look up customer
  let customer: RefundEvidence["customer"] = null;
  if (email) {
    const { data } = await supabaseAdmin
      .from("demo_customers")
      .select("email, name")
      .eq("email", email)
      .maybeSingle();
    customer = data ?? null;
  }

  // Resolve the target order: explicit ORD-#### wins; fall back to most-recent for the customer.
  let order: RefundEvidence["order"] = null;
  if (orderNumberFromText) {
    const { data } = await supabaseAdmin
      .from("demo_orders")
      .select("order_number, amount, currency, status, created_at")
      .eq("order_number", orderNumberFromText)
      .maybeSingle();
    order = data ?? null;
  }
  if (!order && email) {
    const { data } = await supabaseAdmin
      .from("demo_orders")
      .select("order_number, amount, currency, status, created_at")
      .eq("customer_email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    order = data ?? null;
  }

  const orderNumber = order?.order_number ?? orderNumberFromText ?? null;

  // Prior refunds on that order
  let priorRefunds: RefundEvidence["prior_refunds"] = [];
  if (orderNumber) {
    const { data } = await supabaseAdmin
      .from("demo_refunds")
      .select("id, amount, reason, issued_by_agent, governance_status, created_at")
      .eq("order_number", orderNumber)
      .order("created_at", { ascending: false });
    priorRefunds = data ?? [];
  }

  const paid = order?.amount ?? 0;
  const refunded = priorRefunds.reduce((s, r) => s + Number(r.amount ?? 0), 0);
  const netOwed = Math.max(0, paid - refunded);

  const flags: string[] = [];
  if (!customer && email) flags.push(`Customer ${email} not found in ledger`);
  if (!order) flags.push(orderNumberFromText ? `Order ${orderNumberFromText} not found` : "No matching order found");
  if (order?.status === "refunded") flags.push(`Order status is already "refunded"`);
  if (priorRefunds.length > 0) flags.push(`${priorRefunds.length} prior refund${priorRefunds.length === 1 ? "" : "s"} already issued totalling $${refunded.toFixed(2)}`);
  if (refunded >= paid && paid > 0) flags.push("Customer has been made whole — refunding again would overpay");
  if (paid > 0 && paid >= 200) flags.push(`Order amount ≥ $200 policy threshold ($${paid.toFixed(2)})`);

  const duplicateRisk = priorRefunds.length > 0 || order?.status === "refunded";
  const recommendation: RefundEvidence["recommendation"] =
    duplicateRisk || refunded >= paid && paid > 0 ? "reject" :
    flags.length > 0 ? "hold" : "approve";

  const md: string[] = [];
  md.push("REFUND REQUEST — evidence from shared ledger");
  md.push("");
  if (customer) md.push(`• Customer: ${customer.name ?? customer.email} <${customer.email}>`);
  else if (email) md.push(`• Customer: ${email} — NOT FOUND in ledger`);
  if (order) {
    md.push(`• Order: ${order.order_number} · $${order.amount.toFixed(2)} ${order.currency} · status "${order.status}" · placed ${new Date(order.created_at).toLocaleDateString()}`);
  } else if (orderNumberFromText) {
    md.push(`• Order: ${orderNumberFromText} — NOT FOUND`);
  }
  md.push(`• Paid $${paid.toFixed(2)}  ·  Already refunded $${refunded.toFixed(2)}  ·  NET OWED $${netOwed.toFixed(2)}`);
  if (priorRefunds.length > 0) {
    md.push("");
    md.push("Prior refunds on this order:");
    for (const r of priorRefunds) {
      md.push(`   – $${Number(r.amount).toFixed(2)} · by ${r.issued_by_agent ?? "unknown"} · ${r.governance_status ?? "n/a"} · ${new Date(r.created_at).toLocaleString()}`);
    }
  }
  if (flags.length > 0) {
    md.push("");
    md.push("Risk flags:");
    for (const f of flags) md.push(`   ⚠ ${f}`);
  }
  md.push("");
  md.push(
    recommendation === "reject"
      ? "RECOMMENDATION: REJECT — approving would issue a duplicate refund. The customer has already been made whole; escalate to human review before any further payout."
      : recommendation === "hold"
      ? "RECOMMENDATION: HOLD — evidence is inconclusive. Ask the customer for the specific order number and reason before approving."
      : "RECOMMENDATION: APPROVE — ledger shows a valid, unrefunded order.",
  );


  return {
    is_refund_intent: true,
    email,
    order_number: orderNumber,
    customer,
    order,
    prior_refunds: priorRefunds,
    totals: { paid, refunded, net_owed: netOwed },
    flags,
    duplicate_risk: duplicateRisk,
    recommendation,
    detail_markdown: md.join("\n"),
  };
}
