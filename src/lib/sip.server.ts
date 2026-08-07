// Server-only SIP (Signal Intent Protocol) deterministic validator.
// Fail-secure: any unknown field, missing field, or rule violation → rejected.
// No LLM call happens here; the LLM emitted the intent-signal upstream.

export type IntentJSON = {
  action: string;
  specialist?: string;
  skill?: string;
  params?: Record<string, unknown>;
  amount?: number;
  currency?: string;
};

export type SIPReport = {
  sip_id: string;
  schema_ok: boolean;
  rules_passed: number;
  rules_total: number;
  risk: "low" | "medium" | "high";
  requires_approval: boolean;
  reasons: string[];
  intent: IntentJSON;
};

const KNOWN_ACTIONS = new Set([
  "book_flight",
  "book_hotel",
  "monitor_price",
  "publish_post",
  "schedule_posts",
  "analyze_engagement",
  "execute_trade",
  "generate_report",
  "issue_refund",
  "triage_ticket",
  "daily_briefing",
  "forecast_price",
]);


const HIGH_RISK_ACTIONS = new Set([
  "book_flight",
  "book_hotel",
  "execute_trade",
  "issue_refund",
  "publish_post",
]);

function makeSipId(): string {
  const rand = crypto.getRandomValues(new Uint8Array(6));
  return `sip_${Array.from(rand).map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export function validateIntent(raw: unknown): SIPReport {
  const reasons: string[] = [];
  const intent = (raw ?? {}) as IntentJSON;
  const rules_total = 6;
  let passed = 0;

  // Rule 1: schema — must have an action string
  const schema_ok = typeof intent.action === "string" && intent.action.length > 0;
  if (schema_ok) passed++;
  else reasons.push("intent.action is missing or not a string");

  // Rule 2: action is known
  const knownAction = schema_ok && KNOWN_ACTIONS.has(intent.action);
  if (knownAction) passed++;
  else if (schema_ok) reasons.push(`unknown action: ${intent.action}`);

  // Rule 3: amount, if present, is a positive number under $10,000 hard cap
  const amountOk =
    intent.amount === undefined ||
    (typeof intent.amount === "number" && intent.amount > 0 && intent.amount < 10000);
  if (amountOk) passed++;
  else reasons.push("amount must be a positive number under 10000");

  // Rule 4: currency, if present, is a 3-letter code
  const currencyOk =
    intent.currency === undefined || /^[A-Z]{3}$/.test(String(intent.currency));
  if (currencyOk) passed++;
  else reasons.push("currency must be a 3-letter ISO code");

  // Rule 5: params, if present, is a plain object
  const paramsOk =
    intent.params === undefined ||
    (typeof intent.params === "object" && intent.params !== null && !Array.isArray(intent.params));
  if (paramsOk) passed++;
  else reasons.push("params must be an object");

  // Rule 6: no extraneous top-level fields
  const allowed = new Set(["action", "specialist", "skill", "params", "amount", "currency"]);
  const extras = Object.keys(intent).filter((k) => !allowed.has(k));
  const noExtras = extras.length === 0;
  if (noExtras) passed++;
  else reasons.push(`unexpected fields: ${extras.join(", ")}`);

  const allOk = passed === rules_total;
  const highRisk = allOk && HIGH_RISK_ACTIONS.has(intent.action);
  const mediumRisk =
    allOk && !highRisk && (intent.amount !== undefined || intent.action === "schedule_posts");

  const risk: "low" | "medium" | "high" = !allOk
    ? "high"
    : highRisk
      ? "high"
      : mediumRisk
        ? "medium"
        : "low";

  return {
    sip_id: makeSipId(),
    schema_ok,
    rules_passed: passed,
    rules_total,
    risk,
    requires_approval: !allOk || highRisk || mediumRisk,
    reasons,
    intent,
  };
}

export function hashPayload(payload: unknown): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  return crypto.subtle.digest("SHA-256", data).then((buf) => {
    const bytes = Array.from(new Uint8Array(buf));
    return "0x" + bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  });
}
