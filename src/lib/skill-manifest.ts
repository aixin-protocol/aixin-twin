// Client-safe helpers for the SKILL.md manifest + capability contract.
// A Skill's "capability contract" is derived deterministically from its
// name/category/adapter so buyers can see exactly what it may do before
// installing it.

export type RiskTier = "low" | "medium" | "high";

export type CapabilityContract = {
  sipAction: string;
  risk: RiskTier;
  requiresApproval: boolean;
  permissions: string[];
  sideEffects: string[];
};

const HIGH_RISK_ACTIONS = new Set([
  "book_flight",
  "book_hotel",
  "execute_trade",
  "issue_refund",
  "publish_post",
]);

/** Derive the SIP action a skill maps to, from its name + category. */
export function deriveSipAction(name: string, category: string): string {
  const hay = `${name} ${category}`.toLowerCase();
  if (/briefing|digest/.test(hay)) return "daily_briefing";
  if (/refund/.test(hay)) return "issue_refund";
  if (/trade|invest|portfolio/.test(hay)) return "execute_trade";
  if (/hotel/.test(hay)) return "book_hotel";
  if (/book|flight|trip|travel/.test(hay)) return "book_flight";
  if (/ticket|triage|support/.test(hay)) return "triage_ticket";
  if (/post|social|content|campaign|marketing/.test(hay)) return "publish_post";
  if (/monitor|price\s*watch|alert/.test(hay)) return "monitor_price";
  return "generate_report";
}

function adapterLabel(adapter: string): string {
  if (adapter === "live") return "Live adapter";
  if (adapter === "test") return "Test adapter (sandbox)";
  return adapter.split(":").join(" · ");
}

function isLiveAdapter(adapter: string): boolean {
  return adapter === "live" || adapter.endsWith(":live");
}

export function deriveCapabilityContract(input: {
  name: string;
  category: string;
  adapter: string;
  rules?: string | null;
}): CapabilityContract {
  const sipAction = deriveSipAction(input.name, input.category);
  const live = isLiveAdapter(input.adapter);
  const rules = (input.rules ?? "").toLowerCase();
  const movesMoney = /issue_refund|execute_trade|book_/.test(sipAction) || /amount|refund|charge|payout/.test(rules);

  const risk: RiskTier = HIGH_RISK_ACTIONS.has(sipAction)
    ? "high"
    : movesMoney || live
      ? "medium"
      : "low";

  const permissions: string[] = [`Emit SIP intent \`${sipAction}\``];
  if (movesMoney) permissions.push("Read customer, order and payment records");
  if (live) permissions.push("Call live adapter credentials on your behalf");
  else permissions.push("Call sandbox adapters only — no real credentials");
  permissions.push("Write a signed receipt anchored to BSC Testnet");

  const sideEffects: string[] = [];
  if (movesMoney) sideEffects.push("Writes a ledger row (refund / trade / booking)");
  if (live) sideEffects.push(`Sends real requests through ${adapterLabel(input.adapter)}`);
  else sideEffects.push("No real-world side effects — sandbox execution");
  sideEffects.push("Appends an immutable task event trail");

  return {
    sipAction,
    risk,
    requiresApproval: risk !== "low",
    permissions,
    sideEffects,
  };
}

export function buildSkillManifest(input: {
  name: string;
  category: string;
  author: string;
  version: number;
  intent: string;
  rules: string;
  adapter: string;
  priceCents: number | null;
  visibility: "public" | "private";
}): string {
  const contract = deriveCapabilityContract(input);
  const price = input.priceCents && input.priceCents > 0 ? `$${(input.priceCents / 100).toFixed(2)}/mo` : "Free";
  return `---
name: ${input.name}
category: ${input.category}
author: ${input.author}
version: ${input.version}
sip_action: ${contract.sipAction}
adapter: ${input.adapter}
risk: ${contract.risk}
requires_approval: ${contract.requiresApproval}
price: ${price}
visibility: ${input.visibility}
---

# ${input.name}

## What it does
${input.intent || "_No intent described yet._"}

## Deterministic rules
${input.rules ? input.rules.split(/;\s*|\n/).filter(Boolean).map((r) => `- ${r.trim()}`).join("\n") : "_No rules defined yet._"}

## Permissions requested
${contract.permissions.map((p) => `- ${p}`).join("\n")}

## Side effects
${contract.sideEffects.map((s) => `- ${s}`).join("\n")}

## Governance
Every run passes through the Signal Intent Protocol: the model proposes JSON, deterministic
code validates schema and business rules, and ${contract.requiresApproval ? "a Decision Card pauses for your approval" : "low-risk runs execute automatically"}.
Each outcome emits a signed receipt anchored to BSC Testnet.
`;
}

/** Parse the YAML-ish frontmatter block of a SKILL.md manifest. */
export function parseManifestFrontmatter(md: string): Record<string, string> {
  const match = /^---\n([\s\S]*?)\n---/.exec(md.trim());
  if (!match) return {};
  const out: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
}

/** Strip the frontmatter so the body can be rendered. */
export function manifestBody(md: string): string {
  return md.trim().replace(/^---\n[\s\S]*?\n---\n?/, "").trim();
}
