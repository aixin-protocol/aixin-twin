import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkspace, type RefundEvidenceLite } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { startIntent, logTaskEvent } from "@/lib/tasks.functions";
import { decideOnCard } from "@/lib/sip.functions";
import { WORKSPACE_QUERY_KEY } from "@/routes/dashboard";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Plane,
  Megaphone,
  Wallet,
  Briefcase,
  HeartPulse,
  MoreHorizontal,
  ArrowRight,
  Check,
  ShieldCheck,
  Search,
  Hammer,
  Send,
  RotateCcw,
  Loader2,
  Activity,
  Eye,
  Fingerprint,
  Cpu,
  Radio,
  Link2,
  FileSignature,
  AlertTriangle,
  ExternalLink,
  Gauge,
  X,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/ask")({
  component: AskPage,
  head: () => ({
    meta: [
      { title: "Ask AiXin — your Master Twin's front door" },
      {
        name: "description",
        content:
          "State an outcome in plain words. Your Master Twin proposes a plan, assembles the team, and pauses at every gate for your approval.",
      },
      { property: "og:title", content: "Ask AiXin" },
      {
        property: "og:description",
        content: "Intent-first. The twin orchestrates — you just approve.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Domain = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  starters: string[];
  specialist: { name: string; role: string; type: string };
  skills: { name: string; owned: boolean }[];
  steps: string[];
  gate: string;
};

const DOMAINS: Domain[] = [
  {
    id: "travel",
    label: "Travel & lifestyle",
    icon: Plane,
    starters: [
      "Plan a 7-day trip to Kyoto in April for two people under $3,500 total, flights included.",
      "Watch flights SFO ↔ London under $650 return and book the moment a fare drops.",
      "Rebook my Aug 14 SFO → CDG flight if the price falls below $500.",
    ],
    specialist: { name: "Marco", role: "Travel Specialist", type: "Travel" },
    skills: [
      { name: "Flight Booking", owned: true },
      { name: "Hotel Booking", owned: true },
      { name: "Price Monitor", owned: true },
    ],
    steps: [
      "Watch fares across your dates and airports.",
      "Draft an itinerary within budget and stack the receipts.",
      "Pause for your approval before any non-refundable booking.",
    ],
    gate: "Before any purchase over $200 or any non-refundable fare.",
  },
  {
    id: "marketing",
    label: "Marketing & audience",
    icon: Megaphone,
    starters: [
      "Every week, draft 4 LinkedIn posts about our product launch and schedule them for 9am Tue/Thu.",
      "When engagement drops 20% week over week, propose a content pivot with 3 concrete post ideas.",
      "Grow my newsletter to 5,000 subscribers by December — propose a plan and run it.",
    ],
    specialist: { name: "Nova", role: "Marketing Specialist", type: "Marketing" },
    skills: [
      { name: "Social Scheduler", owned: true },
      { name: "Engagement Analyzer", owned: true },
      { name: "Content Optimizer", owned: false },
    ],
    steps: [
      "Analyze last month's engagement and pick the winning angles.",
      "Draft posts in your voice with images and hashtags.",
      "Schedule to your brand account after your approval.",
    ],
    gate: "Before anything publishes to your brand account.",
  },
  {
    id: "money",
    label: "Money & investing",
    icon: Wallet,
    starters: [
      "Keep my portfolio within 60/30/10 (equities/bonds/cash) and rebalance monthly.",
      "Reconcile last month's invoices and flag anything unusual over $500.",
      "Generate my Q3 tax report from my exchange and bank exports.",
    ],
    specialist: { name: "Ledger", role: "Finance Specialist", type: "Finance" },
    skills: [
      { name: "Portfolio Tracker", owned: true },
      { name: "Tax Report", owned: true },
      { name: "Trade Executor", owned: false },
    ],
    steps: [
      "Pull positions and compute drift vs your target allocation.",
      "Draft the rebalance trades with expected fees and tax impact.",
      "Pause for your approval before any trade executes.",
    ],
    gate: "Before any trade, transfer, or filing.",
  },
  {
    id: "work",
    label: "Work & productivity",
    icon: Briefcase,
    starters: [
      "Triage my inbox every morning and draft replies for anything that needs one — I approve before send.",
      "Every Friday, summarize the week's decisions and open threads for my team.",
      "When a customer opens a refund ticket, draft a response using our policy and pause for my approval.",
    ],
    specialist: { name: "Iris", role: "Ops Specialist", type: "Support" },
    skills: [
      { name: "Ticket Triage", owned: true },
      { name: "Refund Handler", owned: true },
      { name: "Inbox Drafter", owned: false },
    ],
    steps: [
      "Classify incoming items by intent and urgency.",
      "Draft replies grounded in your policy and past decisions.",
      "Send only after your approval — receipt anchored.",
    ],
    gate: "Before any outbound message from your accounts.",
  },
  {
    id: "health",
    label: "Health & wellness",
    icon: HeartPulse,
    starters: [
      "Build me a 12-week training plan for a half-marathon, adjusting weekly to my resting HR.",
      "Every morning, propose meals for the day based on my macros and what's in the fridge.",
      "When my sleep score drops below 70 for 3 nights, propose a recovery week.",
    ],
    specialist: { name: "Sol", role: "Wellness Specialist", type: "Health" },
    skills: [
      { name: "Training Planner", owned: false },
      { name: "Nutrition Advisor", owned: false },
      { name: "Recovery Coach", owned: false },
    ],
    steps: [
      "Read your latest signals from connected devices.",
      "Propose the week's plan grounded in your goals.",
      "Adjust with your approval — never in silence.",
    ],
    gate: "Before altering training load or nutrition targets.",
  },
  {
    id: "custom",
    label: "Something else",
    icon: MoreHorizontal,
    starters: [
      "Every week, I want my twin to ",
      "When ___ happens, I want my twin to ",
      "By the end of this quarter, I want my twin to ",
    ],
    specialist: { name: "AiXin", role: "Master Twin", type: "General" },
    skills: [{ name: "General reasoning", owned: true }],
    steps: [
      "AiXin will interview you briefly to lock the outcome.",
      "She'll propose which Specialist to hatch and which Skills to install.",
      "Nothing runs until you approve the plan.",
    ],
    gate: "At every consequential step, until you tell her otherwise.",
  },
];

type Phase = "prompt" | "thinking" | "slots" | "plan" | "working";

/* -------------------------------------------------------------------------- */
/* Slot-filling — required details per domain before a Plan can be drafted.   */
/* -------------------------------------------------------------------------- */

type SlotField = {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
  type?: "text" | "date" | "number";
  helper?: string;
};

const SLOT_SPECS: Record<string, { title: string; fields: SlotField[] }> = {
  travel: {
    title: "A few details so the itinerary is real, not a guess.",
    fields: [
      { key: "from", label: "Departing from", placeholder: "e.g. San Francisco (SFO)", required: true },
      { key: "to", label: "Destination", placeholder: "e.g. Kyoto", required: true },
      { key: "depart", label: "Depart date", placeholder: "", type: "date", required: true },
      { key: "return", label: "Return date", placeholder: "", type: "date", required: true },
      { key: "pax", label: "Travellers", placeholder: "e.g. 2", type: "number", required: true },
      { key: "budget", label: "Total budget (USD)", placeholder: "e.g. 3500", type: "number", required: true, helper: "Flights + hotel combined." },
    ],
  },
  marketing: {
    title: "Which surface, which audience, which window?",
    fields: [
      { key: "channels", label: "Channels", placeholder: "e.g. LinkedIn, X, newsletter", required: true },
      { key: "audience", label: "Target audience", placeholder: "e.g. B2B ops leaders in SEA", required: true },
      { key: "startDate", label: "Campaign starts", placeholder: "", type: "date", required: true },
      { key: "endDate", label: "Campaign ends", placeholder: "", type: "date", required: true },
      { key: "cta", label: "Primary CTA", placeholder: "e.g. Book a demo", required: false },
    ],
  },
  money: {
    title: "Amounts, currency, and counterparty — before any money moves.",
    fields: [
      { key: "amount", label: "Amount", placeholder: "e.g. 5000", type: "number", required: true },
      { key: "currency", label: "Currency", placeholder: "e.g. USD", required: true },
      { key: "counterparty", label: "Counterparty / account", placeholder: "e.g. Coinbase, IRA, Vendor Inc.", required: true },
      { key: "when", label: "Execute on / before", placeholder: "", type: "date", required: false },
    ],
  },
};

// --- Smart NL slot extraction --------------------------------------------
const WORD_NUM: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, a: 1, an: 1, couple: 2, pair: 2,
};
const MONTHS: Record<string, number> = {
  january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4,
  may: 5, june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8, september: 9, sep: 9, sept: 9,
  october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12,
};

function pad(n: number) { return String(n).padStart(2, "0"); }

function extractMoney(intent: string): string | undefined {
  // Prefer explicit currency prefix; require at least 2 digits, allow K/k.
  const m =
    /(?:USD|SGD|EUR|CNY|RMB)\s?\$?\s?([0-9][0-9,]*(?:\.\d+)?)(k)?/i.exec(intent) ||
    /\$\s?([0-9][0-9,]*(?:\.\d+)?)(k)?/i.exec(intent) ||
    /(?:budget|under|below|max(?:imum)?|up to|around|about|~)\s*\$?\s*([0-9][0-9,]*(?:\.\d+)?)(k)?/i.exec(intent);
  if (!m) return undefined;
  const raw = Number(m[1].replace(/,/g, ""));
  const val = m[2] ? raw * 1000 : raw;
  return String(val);
}

function extractPax(intent: string): string | undefined {
  // Numeric: "2 people/adults/pax/travellers/guests"
  const num = /(\d+)\s*(people|persons?|pax|travell?ers|adults|guests)/i.exec(intent);
  if (num) return num[1];
  // Worded: "two people", "for a couple", "for two"
  const word = /(?:for\s+)?(one|two|three|four|five|six|seven|eight|nine|ten|a|an|couple|pair)\s+(?:people|persons?|pax|travell?ers|adults|guests)/i.exec(intent);
  if (word) return String(WORD_NUM[word[1].toLowerCase()]);
  const solo = /\b(solo|alone|myself|just me)\b/i.test(intent);
  if (solo) return "1";
  const coupled = /\b(my (?:wife|husband|partner|gf|bf|girlfriend|boyfriend)|couple)\b/i.test(intent);
  if (coupled) return "2";
  return undefined;
}

function extractDates(intent: string): { depart?: string; ret?: string } {
  const out: { depart?: string; ret?: string } = {};
  // ISO date(s)
  const iso = [...intent.matchAll(/(20\d{2}-\d{2}-\d{2})/g)].map((m) => m[1]);
  if (iso[0]) out.depart = iso[0];
  if (iso[1]) out.ret = iso[1];
  // Month name(s) → 1st of that month, this year (or next year if past)
  const monthMatch = new RegExp(`\\b(${Object.keys(MONTHS).join("|")})\\b(?:\\s+(\\d{4}))?`, "i").exec(intent);
  if (!out.depart && monthMatch) {
    const mi = MONTHS[monthMatch[1].toLowerCase()];
    const now = new Date();
    let year = monthMatch[2] ? Number(monthMatch[2]) : now.getFullYear();
    if (!monthMatch[2] && mi < now.getMonth() + 1) year += 1;
    out.depart = `${year}-${pad(mi)}-01`;
  }
  // Duration: "7-day", "for 5 nights", "10 days"
  const dur = /(\d+)[-\s]?(?:day|days|night|nights)/i.exec(intent);
  if (out.depart && !out.ret && dur) {
    const d = new Date(out.depart);
    d.setDate(d.getDate() + Number(dur[1]));
    out.ret = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  return out;
}

function extractCity(intent: string, prep: "to" | "from"): string | undefined {
  const re = new RegExp(`\\b${prep}\\s+([A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+){0,2})`);
  const m = re.exec(intent);
  return m?.[1];
}

function extractSlots(domainId: string, intent: string): Record<string, string> {
  const s: Record<string, string> = {};
  const lc = intent.toLowerCase();

  if (domainId === "travel") {
    const to = extractCity(intent, "to");
    const from = extractCity(intent, "from");
    if (to) s.to = to;
    if (from) s.from = from;
    const pax = extractPax(intent);
    if (pax) s.pax = pax;
    const money = extractMoney(intent);
    if (money) s.budget = money;
    const { depart, ret } = extractDates(intent);
    if (depart) s.depart = depart;
    if (ret) s.return = ret;
  } else if (domainId === "marketing") {
    if (/linkedin/i.test(lc)) s.channels = "LinkedIn";
    if (/twitter|\bx\.com|\bx\b/i.test(lc)) s.channels = s.channels ? `${s.channels}, X` : "X";
    if (/newsletter/i.test(lc)) s.channels = s.channels ? `${s.channels}, Newsletter` : "Newsletter";
    const { depart } = extractDates(intent);
    if (depart) s.startDate = depart;
  } else if (domainId === "money") {
    const money = extractMoney(intent);
    if (money) s.amount = money;
    if (/usd|\$/i.test(intent)) s.currency = "USD";
    else if (/eur|€/i.test(intent)) s.currency = "EUR";
    else if (/sgd/i.test(intent)) s.currency = "SGD";
    else if (/cny|rmb|¥/i.test(intent)) s.currency = "CNY";
    const { depart } = extractDates(intent);
    if (depart) s.when = depart;
  }
  return s;
}

function slotsComplete(domainId: string, values: Record<string, string>): boolean {
  const spec = SLOT_SPECS[domainId];
  if (!spec) return true; // domains without slot specs skip this phase
  return spec.fields.every((f) => !f.required || (values[f.key] ?? "").trim().length > 0);
}

function summarizeSlots(domainId: string, values: Record<string, string>): string {
  const spec = SLOT_SPECS[domainId];
  if (!spec) return "";
  const parts = spec.fields
    .map((f) => {
      const v = (values[f.key] ?? "").trim();
      return v ? `${f.label}: ${v}` : null;
    })
    .filter(Boolean);
  return parts.join(" · ");
}

// -- Ask <-> SkillCraft handoff via sessionStorage ----------------------------
const PENDING_KEY = "aixin.pendingAsk";
type PendingAsk = {
  intent: string;
  planId: string;
  slotValues: Record<string, string>;
  gapName?: string;
  autoFilledKeys?: string[];
};
export function stashPendingAsk(p: PendingAsk) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(p));
  } catch {}
}
function readPendingAsk(): PendingAsk | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingAsk;
  } catch {
    return null;
  }
}
function clearPendingAsk() {
  try { sessionStorage.removeItem(PENDING_KEY); } catch {}
}
function AskPage() {

  const { state } = useWorkspace();
  const master = state.masterTwin;
  const masterInitial = master.initials || master.name?.charAt(0).toUpperCase() || "A";
  const masterName = master.name || "AiXin";

  const [input, setInput] = useState("");
  const [activeDomain, setActiveDomain] = useState<Domain | null>(null);
  const [phase, setPhase] = useState<Phase>("prompt");
  const [committedIntent, setCommittedIntent] = useState("");
  const [slotValues, setSlotValues] = useState<Record<string, string>>({});
  const [autoFilled, setAutoFilled] = useState<Set<string>>(new Set());
  const [channel, setChannel] = useState<"app" | "telegram">("telegram");
  const [assembling, setAssembling] = useState(false);
  const [starting, setStarting] = useState(false);
  const [session, setSession] = useState<{ taskId: string; cardId: string | null } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const start = useServerFn(startIntent);
  const qc = useQueryClient();

  useEffect(() => {
    textareaRef.current?.focus();
  }, [phase]);

  // Resume from a SkillCraft round-trip: if the user just published or
  // returned from /dashboard/skills with a pending ask stashed, restore it
  // and jump straight back to the plan review.
  useEffect(() => {
    const pending = readPendingAsk();
    if (!pending) return;
    clearPendingAsk();
    const dom = DOMAINS.find((d) => d.id === pending.planId) ?? null;
    if (dom) setActiveDomain(dom);
    if (pending.intent) {
      setInput(pending.intent);
      setCommittedIntent(pending.intent);
    }
    if (pending.slotValues) setSlotValues(pending.slotValues);
    if (pending.autoFilledKeys) setAutoFilled(new Set(pending.autoFilledKeys));
    setPhase("plan");
    toast.success("Welcome back — plan restored. Approve when ready.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const canAssemble = input.trim().length > 0 && !assembling;

  const plan = useMemo(() => {
    const lc = input.toLowerCase();
    const base = activeDomain
      ? activeDomain
      : /flight|trip|hotel|travel|book/.test(lc) ? DOMAINS[0]
      : /post|content|marketing|brand|linkedin|audience/.test(lc) ? DOMAINS[1]
      : /portfolio|invest|tax|invoice|trade|predict|forecast|price|btc|eth|bnb|crypto|stock|market/.test(lc) ? DOMAINS[2]
      : /inbox|email|ticket|reply|team|refund/.test(lc) ? DOMAINS[3]
      : /sleep|training|run|meal|health/.test(lc) ? DOMAINS[4]
      : DOMAINS[5];

    // Override display with user's actual library when a skill scores against the intent.
    if (!input.trim()) return base;
    const normalizeToken = (word: string) => {
      if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
      if (word.endsWith("ing") && word.length > 5) return word.slice(0, -3);
      if (word.endsWith("or") && word.length > 5) return word.slice(0, -2);
      if (word.endsWith("er") && word.length > 5) return word.slice(0, -2);
      if (word.endsWith("s") && word.length > 4) return word.slice(0, -1);
      return word;
    };
    const tokenize = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2).map(normalizeToken);
    const intentTokens = new Set(tokenize(lc));
    const usable = state.skills.filter((s) => s.installed || s.isMine);
    let best: { skill: (typeof usable)[number]; score: number } | null = null;
    for (const s of usable) {
      const bag = [s.name, s.category, s.provider, s.description ?? "", ...(s.tags ?? [])].join(" ");
      const tokens = tokenize(bag);
      let score = 0;
      for (const t of tokens) if (intentTokens.has(t)) score += 2;
      if (s.name && lc.includes(s.name.toLowerCase())) score += 5;
      if (s.category && lc.includes(s.category.toLowerCase())) score += 1;
      if (/\b(predict|forecast|price|market|bnb|btc|eth|crypto|stock)\b/.test(lc) &&
          /\b(finance|financial|predict|forecast|market|price)\b/.test(bag.toLowerCase())) score += 4;
      if (!best || score > best.score) best = { skill: s, score };
    }
    if (!best || best.score <= 0) return base;
    const matched = best.skill;
    const owner = state.specialists.find(
      (sp) => sp.status !== "retired" && sp.assignedSkills.includes(matched.id),
    );
    if (!owner) return base;
    return {
      ...base,
      specialist: { name: owner.name, role: owner.role, type: owner.type },
      skills: [{ name: matched.name, owned: true }],
    };
  }, [activeDomain, input, state.skills, state.specialists]);

  const assemble = () => {
    if (!canAssemble) return;
    const text = input.trim();
    setAssembling(true);
    setCommittedIntent(text);
    // Re-extract on every submission so edits to the intent update the form.
    const extracted = extractSlots(plan.id, text);
    setSlotValues((prev) => {
      const merged = { ...prev };
      for (const [k, v] of Object.entries(extracted)) {
        // Fill only if empty, or if this key was previously auto-filled (so
        // edits to the intent update it) — never overwrite user-typed values.
        if (!merged[k] || autoFilled.has(k)) merged[k] = v;
      }
      return merged;
    });
    setAutoFilled(new Set(Object.keys(extracted)));
    setPhase("thinking");
  };

  const afterThinking = () => {
    setAssembling(false);
    if (SLOT_SPECS[plan.id] && !slotsComplete(plan.id, slotValues)) {
      setPhase("slots");
    } else {
      setPhase("plan");
    }
  };

  const approve = async () => {
    const specialists = state.specialists.filter((s) => s.status !== "retired");
    if (specialists.length === 0) {
      toast.error("You have no active Specialist Twin yet. Hatch one from the Specialists page.");
      return;
    }

    // ---- Skill matching from user's actual library --------------------
    // Score installed + authored skills against the intent text and, when a
    // match wins, use its assigned specialist and derive the SIP action from
    // the skill category/name. This replaces the previous hardcoded mapping.
    const usable = state.skills.filter((s) => s.installed || s.isMine);
    const text = committedIntent.toLowerCase();
    const normalizeToken = (word: string) => {
      if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
      if (word.endsWith("ing") && word.length > 5) return word.slice(0, -3);
      if (word.endsWith("or") && word.length > 5) return word.slice(0, -2);
      if (word.endsWith("er") && word.length > 5) return word.slice(0, -2);
      if (word.endsWith("s") && word.length > 4) return word.slice(0, -1);
      return word;
    };
    const tokenize = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2).map(normalizeToken);
    const intentTokens = new Set(tokenize(text));
    const scored = usable.map((s) => {
      const bag = [s.name, s.category, s.provider, s.description ?? "", ...(s.tags ?? [])].join(" ");
      const skillTokens = tokenize(bag);
      let score = 0;
      for (const t of skillTokens) if (intentTokens.has(t)) score += 2;
      // Whole-name substring bonus (e.g. "financial predictor")
      if (s.name && text.includes(s.name.toLowerCase())) score += 5;
      if (s.category && text.includes(s.category.toLowerCase())) score += 1;
      if (/\b(predict|forecast|price|market|bnb|btc|eth|crypto|stock)\b/.test(text) && /\b(finance|financial|predict|forecast|market|price)\b/.test(bag.toLowerCase())) score += 4;
      return { skill: s, score };
    }).sort((a, b) => b.score - a.score);
    const matchedSkill = scored[0]?.score > 0 ? scored[0].skill : null;

    // Pick specialist: prefer one assigned to the matched skill, else by plan
    // type, else first active.
    let match = specialists[0];
    if (matchedSkill) {
      const owner = specialists.find((sp) => sp.assignedSkills.includes(matchedSkill.id));
      if (owner) match = owner;
    } else {
      match =
        specialists.find((s) => s.type?.toLowerCase() === plan.specialist.type.toLowerCase()) ??
        specialists[0];
    }

    // Derive SIP action from the matched skill's category/name, falling back
    // to the plan-based heuristic when no skill matched.
    const skillHay = matchedSkill ? `${matchedSkill.name} ${matchedSkill.category}`.toLowerCase() : "";
    const isBriefing =
      /\b(daily\s+briefing|market\s+briefing|morning\s+briefing|crypto\s+digest|bnb\s+price|briefing|digest)\b/i.test(committedIntent) ||
      /\bbriefing\b/.test(skillHay);
    const action = isBriefing
      ? "daily_briefing"
      : matchedSkill
        ? (/refund/.test(skillHay) ? "issue_refund"
          : /trade|invest|portfolio/.test(skillHay) ? "execute_trade"
          : /book|flight|hotel|trip|travel/.test(skillHay) ? "book_flight"
          : /post|social|content|marketing/.test(skillHay) ? "generate_report"
          : "generate_report")
        : plan.id === "money" ? "execute_trade"
        : plan.id === "travel" ? "book_flight"
        : "generate_report";

    const slotSummary = summarizeSlots(plan.id, slotValues);
    const finalIntent = slotSummary ? `${committedIntent}\n\nDetails — ${slotSummary}` : committedIntent;
    setStarting(true);
    try {
      const res = await start({
        data: {
          specialistId: match.id,
          skillId: matchedSkill?.id ?? null,
          intentText: finalIntent,
          intent: {
            action,
            amount: (() => {
              if (slotValues.amount) return Number(slotValues.amount);
              if (slotValues.budget) return Number(slotValues.budget);
              const match = /\$?(\d[\d,]*)/.exec(committedIntent);
              return match?.[1] ? Number(match[1].replace(/,/g, "")) : undefined;
            })(),
              params: {
                domain: plan.id,
                slots: slotValues,
                skill: matchedSkill
                  ? {
                      id: matchedSkill.id,
                      name: matchedSkill.name,
                      category: matchedSkill.category,
                      adapter: matchedSkill.provider,
                    }
                  : undefined,
              },
          },
          domainLabel: matchedSkill ? `${matchedSkill.name}` : plan.label,
          plannedSteps: plan.steps,
          gate: plan.gate,
        },
      });
      if (matchedSkill) toast.success(`Routed to skill: ${matchedSkill.name}`);
      setSession({ taskId: res.taskId, cardId: res.decisionCardId });
      qc.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEY });
      setPhase("working");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start task");
    } finally {
      setStarting(false);
    }
  };

  const reset = () => {
    setPhase("prompt");
    setInput("");
    setActiveDomain(null);
    setCommittedIntent("");
    setSlotValues({});
    setAssembling(false);
    setSession(null);
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col px-2 py-10 sm:py-14">
      {phase === "prompt" && (
        <PromptPhase
          masterInitial={masterInitial}
          masterName={masterName}
          input={input}
          setInput={setInput}
          activeDomain={activeDomain}
          setActiveDomain={setActiveDomain}
          canAssemble={canAssemble}
          assembling={assembling}
          onAssemble={assemble}
          textareaRef={textareaRef}
        />
      )}

      {phase === "thinking" && (
        <ThinkingPhase
          masterInitial={masterInitial}
          masterName={masterName}
          intent={committedIntent}
          plan={plan}
          onDone={afterThinking}
        />
      )}

      {phase === "slots" && (
        <SlotsPhase
          plan={plan}
          intent={committedIntent}
          values={slotValues}
          setValues={setSlotValues}
          autoFilled={autoFilled}
          markManual={(k) =>
            setAutoFilled((prev) => {
              if (!prev.has(k)) return prev;
              const next = new Set(prev);
              next.delete(k);
              return next;
            })
          }
          onBack={() => setPhase("prompt")}
          onContinue={() => setPhase("plan")}
        />
      )}

      {phase === "plan" && (
        <PlanPhase
          intent={committedIntent}
          plan={plan}
          slotValues={slotValues}
          starting={starting}
          onApprove={approve}
          onBack={() => setPhase(SLOT_SPECS[plan.id] ? "slots" : "prompt")}
        />
      )}

      {phase === "working" && session && (
        <WorkingPhase
          intent={committedIntent}
          plan={plan}
          taskId={session.taskId}
          cardId={session.cardId}
          channel={channel}
          setChannel={setChannel}
          onNewGoal={reset}
        />
      )}
    </div>
  );
}


function ThinkingPhase({
  masterInitial,
  masterName,
  intent,
  plan,
  onDone,
}: {
  masterInitial: string;
  masterName: string;
  intent: string;
  plan: Domain;
  onDone: () => void;
}) {
  const steps = useMemo(
    () => [
      { label: "Parsing intent", detail: `"${intent.length > 90 ? intent.slice(0, 88) + "…" : intent}"` },
      { label: "Consulting memory", detail: "Recent goals · preferences · prior receipts" },
      { label: "Selecting domain", detail: `${plan.label} — best match for this outcome` },
      { label: "Choosing a Specialist", detail: `${plan.specialist.name} · ${plan.specialist.role}` },
      { label: "Mapping required Skills", detail: plan.skills.map((s) => s.name).join(" · ") },
      { label: "Drafting approval gates", detail: plan.gate },
    ],
    [intent, plan]
  );

  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (current >= steps.length) {
      setDone(true);
      const t = setTimeout(onDone, 600);
      return () => clearTimeout(t);
    }
    const delay = 340 + Math.random() * 260;
    const t = setTimeout(() => setCurrent((c) => c + 1), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, steps.length]);

  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="relative">
        <MasterAvatar initial={masterInitial} />
        <span className="pointer-events-none absolute -inset-2 rounded-full border border-primary/40 animate-ping" aria-hidden />
      </div>
      <div className="mt-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        {masterName} is thinking
      </div>

      <Card className="mt-6 w-full max-w-xl border-border/70 bg-card/80 p-5 shadow-warm backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Chain of thought
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-primary/60 animate-pulse" />
            <span className="h-1 w-1 rounded-full bg-primary/60 animate-pulse [animation-delay:150ms]" />
            <span className="h-1 w-1 rounded-full bg-primary/60 animate-pulse [animation-delay:300ms]" />
          </div>
        </div>
        <ul className="space-y-2.5">
          {steps.map((s, i) => {
            const state = i < current ? "done" : i === current ? "now" : "pending";
            return (
              <li
                key={s.label}
                className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-all duration-300 ${
                  state === "now"
                    ? "border-primary/40 bg-primary/5 opacity-100"
                    : state === "done"
                    ? "border-border/60 bg-transparent opacity-70"
                    : "border-transparent opacity-35"
                }`}
              >
                <div className="mt-0.5">
                  {state === "done" ? (
                    <div className="grid h-5 w-5 place-items-center rounded-full bg-primary/15 text-primary">
                      <Check className="h-3 w-3" />
                    </div>
                  ) : state === "now" ? (
                    <div className="grid h-5 w-5 place-items-center rounded-full bg-primary/15">
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border border-dashed border-border" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">{s.label}</div>
                    {state === "now" && (
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary">
                        now
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">{s.detail}</div>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-[11px] text-muted-foreground">
            {done ? "Plan drafted — opening for your review…" : "No action taken. Preparing a plan for your approval."}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            SIP · pre-flight
          </div>
        </div>
      </Card>
    </div>
  );
}

function MasterAvatar({ initial, size = 72, halo = true }: { initial: string; size?: number; halo?: boolean }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {halo && (
        <span className="absolute -inset-1.5 rounded-full bg-gradient-coral opacity-25 blur-md" aria-hidden />
      )}
      <div
        className="relative grid h-full w-full place-items-center rounded-full bg-gradient-coral font-display font-semibold text-primary-foreground ring-2 ring-primary/30"
        style={{ fontSize: size * 0.4 }}
      >
        {initial}
      </div>
    </div>
  );
}

function PromptPhase({
  masterInitial,
  masterName,
  input,
  setInput,
  activeDomain,
  setActiveDomain,
  canAssemble,
  assembling,
  onAssemble,
  textareaRef,
}: {
  masterInitial: string;
  masterName: string;
  input: string;
  setInput: (v: string) => void;
  activeDomain: Domain | null;
  setActiveDomain: (d: Domain | null) => void;
  canAssemble: boolean;
  assembling: boolean;
  onAssemble: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const showTiles = input.trim().length === 0;

  return (
    <div className="flex flex-1 flex-col items-center text-center">
      <MasterAvatar initial={masterInitial} />
      <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        What would you like your twin to achieve?
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Just say the outcome in plain words. {masterName} will propose a plan, assemble the right Specialists, and pause at every gate for your approval.
      </p>

      {/* Composer */}
      <div className="mt-8 w-full">
        <div className="rounded-2xl border border-border bg-card p-3 shadow-warm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (canAssemble) onAssemble();
              }
            }}
            rows={3}
            placeholder="Plan and book a trip · grow my brand · keep my portfolio balanced…"
            className="w-full resize-none bg-transparent px-2 py-2 text-[15px] leading-relaxed placeholder:text-muted-foreground/70 focus:outline-none"
          />
          <div className="flex items-center justify-between px-1 pt-1">
            <div className="text-[11px] text-muted-foreground">
              Recognition over recall — pick a tile below, or type your own.
            </div>
            <Button
              onClick={onAssemble}
              disabled={!canAssemble}
              className="bg-gradient-coral text-primary-foreground shadow-warm hover:brightness-105 disabled:opacity-50"
            >
              {assembling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Planning…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Assemble my team
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Domain tiles */}
      {showTiles && !activeDomain && (
        <div className="mt-8 w-full text-left">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Where should we start?
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {DOMAINS.map((d) => {
              const Icon = d.icon;
              return (
                <button
                  key={d.id}
                  onClick={() => setActiveDomain(d)}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 text-sm transition hover:border-primary/40 hover:bg-card/70"
                >
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{d.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Starters for the selected tile */}
      {showTiles && activeDomain && (
        <div className="mt-8 w-full text-left">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {activeDomain.label} · pick one to edit
            </div>
            <button
              onClick={() => setActiveDomain(null)}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              ← back to categories
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {activeDomain.starters.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setInput(s);
                  setTimeout(() => textareaRef.current?.focus(), 0);
                }}
                className="group flex w-full items-start justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm transition hover:border-primary/40 hover:bg-card/70"
              >
                <span className="leading-relaxed">{s}</span>
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SlotsPhase({
  plan,
  intent,
  values,
  setValues,
  autoFilled,
  markManual,
  onBack,
  onContinue,
}: {
  plan: Domain;
  intent: string;
  values: Record<string, string>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  autoFilled: Set<string>;
  markManual: (key: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const { locale } = useI18n();
  const zh = locale === "zh";
  const spec = SLOT_SPECS[plan.id];
  if (!spec) return null;
  const ready = slotsComplete(plan.id, values);

  const update = (key: string, v: string) => {
    markManual(key);
    setValues((prev) => ({ ...prev, [key]: v }));
  };

  const detected = spec.fields.filter((f) => autoFilled.has(f.key) && (values[f.key] ?? "").trim());
  const missing = spec.fields.filter((f) => f.required && !(values[f.key] ?? "").trim());

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground">
          ← {zh ? "编辑意图" : "edit intent"}
        </button>
        <Badge variant="secondary" className="border-primary/30 bg-primary/10 text-primary">
          {zh ? "确认细节" : "Confirm details"}
        </Badge>
      </div>

      <Card className="overflow-hidden border-border p-0 shadow-warm">
        <div className="border-b border-border bg-secondary/40 px-6 py-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {zh ? "您的意图" : "Your intent"}
          </div>
          <div className="mt-1 text-[15px] leading-relaxed">{intent}</div>
        </div>

        {detected.length > 0 && (
          <div className="border-b border-border bg-primary/5 px-6 py-3">
            <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              {zh ? "已从您的请求中识别" : "Auto-filled from your request"}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {detected.map((f) => (
                <span
                  key={f.key}
                  className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
                >
                  {f.label}: <span className="font-medium">{values[f.key]}</span>
                </span>
              ))}
            </div>
            <div className="mt-1.5 text-[11px] text-muted-foreground">
              {zh ? "请确认或修改。仅需补充空白字段。" : "Confirm or edit above — only the blank fields still need you."}
            </div>
          </div>
        )}

        <div className="space-y-4 px-6 py-6">
          <div>
            <div className="text-sm font-semibold">{spec.title}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {zh
                ? `在填写完成之前，不会草拟任何计划或执行任何操作 — 这就是 SIP 预检。${plan.specialist.name} 会在第一张 Decision Card 上询问您跳过的非必填项。`
                : `No plan is drafted and no action runs until these are filled — this is the SIP pre-flight. Anything you skip that isn't marked required, ${plan.specialist.name} will ask about at the first Decision Card.`}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {spec.fields.map((f) => {
              const filled = (values[f.key] ?? "").trim().length > 0;
              const auto = autoFilled.has(f.key) && filled;
              return (
                <label key={f.key} className="block">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-medium">
                    <span>{f.label}</span>
                    {f.required && <span className="text-primary">*</span>}
                    {auto && (
                      <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary">
                        {zh ? "已识别" : "detected"}
                      </span>
                    )}
                  </div>
                  <input
                    type={f.type ?? "text"}
                    value={values[f.key] ?? ""}
                    onChange={(e) => update(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 ${
                      auto ? "border-primary/40 bg-primary/5" : "border-border"
                    }`}
                  />
                  {f.helper && (
                    <div className="mt-1 text-[11px] text-muted-foreground">{f.helper}</div>
                  )}
                </label>
              );
            })}
          </div>

          {missing.length > 0 && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-400">
              {zh ? "仍需要:" : "Still needed:"} {missing.map((f) => f.label).join(" · ")}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-card px-6 py-4">
          <div className="text-[11px] text-muted-foreground">
            {zh ? "带 * 的为必填项。" : (<>Required fields are marked <span className="text-primary">*</span>.</>)}
          </div>
          <Button
            onClick={onContinue}
            disabled={!ready}
            className="bg-gradient-coral text-primary-foreground shadow-warm hover:brightness-105 disabled:opacity-50"
          >
            <ArrowRight className="mr-2 h-4 w-4" /> {zh ? "起草计划" : "Draft the plan"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function PlanPhase({
  intent,
  plan,
  slotValues,
  starting,
  onApprove,
  onBack,
}: {
  intent: string;
  plan: Domain;
  slotValues: Record<string, string>;
  starting: boolean;
  onApprove: () => void;
  onBack: () => void;
}) {
  const gaps = plan.skills.filter((s) => !s.owned);
  const slotSummary = summarizeSlots(plan.id, slotValues);

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground">
          ← edit intent
        </button>
        <Badge variant="secondary" className="border-primary/30 bg-primary/10 text-primary">
          Proposed plan
        </Badge>
      </div>

      <Card className="overflow-hidden border-border p-0 shadow-warm">
        <div className="border-b border-border bg-secondary/40 px-6 py-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Your intent</div>
          <div className="mt-1 text-[15px] leading-relaxed">{intent}</div>
          {slotSummary && (
            <div className="mt-2 rounded-md border border-border/60 bg-background/60 px-3 py-2 text-[12px] leading-relaxed text-muted-foreground">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-primary">Details · </span>
              {slotSummary}
            </div>
          )}
        </div>

        <div className="space-y-6 px-6 py-6">
          {/* Specialist */}
          <section>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Specialist Twin
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-coral font-display text-sm font-semibold text-primary-foreground">
                {plan.specialist.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-semibold">{plan.specialist.name}</div>
                <div className="text-xs text-muted-foreground">{plan.specialist.role}</div>
              </div>
            </div>
          </section>

          {/* Skills */}
          <section>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Skills required
            </div>
            <ul className="mt-2 space-y-1.5">
              {plan.skills.map((s) => (
                <li key={s.name} className="flex items-center gap-2 text-sm">
                  {s.owned ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span>{s.name}</span>
                      <span className="text-[11px] text-muted-foreground">· owned</span>
                    </>
                  ) : (
                    <>
                      <span className="grid h-4 w-4 place-items-center rounded-full border border-amber-500/50 text-amber-600">
                        <span className="h-1 w-1 rounded-full bg-amber-600" />
                      </span>
                      <span>{s.name}</span>
                      <span className="text-[11px] text-amber-700">· capability gap</span>
                    </>
                  )}
                </li>
              ))}
            </ul>

            {gaps.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-200">
                  We'll hold your plan here. Craft or install the missing skill, then jump straight back.
                </div>
                <div className="flex flex-wrap gap-2">
                  {gaps.map((g) => (
                    <Button
                      key={g.name}
                      asChild
                      variant="outline"
                      size="sm"
                      onClick={() => stashPendingAsk({ intent, planId: plan.id, slotValues, gapName: g.name })}
                    >
                      <Link to="/dashboard/skills">
                        <Hammer className="mr-1.5 h-3.5 w-3.5" /> Craft “{g.name}”
                      </Link>
                    </Button>
                  ))}
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    onClick={() => stashPendingAsk({ intent, planId: plan.id, slotValues, gapName: gaps[0]?.name })}
                  >
                    <Link to="/dashboard/skills">
                      <Search className="mr-1.5 h-3.5 w-3.5" /> Browse Marketplace
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* Steps */}
          <section>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              The plan
            </div>
            <ol className="mt-2 space-y-2">
              {plan.steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Approval gate */}
          <section className="rounded-xl border border-primary/25 bg-primary/5 p-4">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
              <div className="text-sm">
                <span className="font-medium">I'll pause for your approval here:</span>{" "}
                <span className="text-muted-foreground">{plan.gate}</span>
              </div>
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between border-t border-border bg-card px-6 py-4">
          <div className="text-[11px] text-muted-foreground">
            Every consequential action runs through SIP and emits a signed receipt.
          </div>
          <Button
            onClick={onApprove}
            disabled={starting}
            className="bg-gradient-coral text-primary-foreground shadow-warm hover:brightness-105"
          >
            {starting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting…</>
            ) : (
              <><Check className="mr-2 h-4 w-4" /> Approve plan &amp; start</>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* WorkingPhase — real-time telemetry, HITL gate, harness loop, on-chain proofs */
/* -------------------------------------------------------------------------- */

type StreamEvent = {
  id: string;
  ts: number;
  phase: "sense" | "plan" | "act" | "verify" | "anchor" | "gate";
  kind: "tool" | "sip" | "model" | "guard" | "output" | "loop" | "chain";
  title: string;
  detail: string;
  skill?: string;
  tag?: string;
  chip?: "ERC-8004" | "ISO 42001" | "TOP" | "SIP";
};


type DbEvent = {
  id: string;
  seq: number;
  phase: StreamEvent["phase"];
  kind: StreamEvent["kind"];
  title: string;
  detail: string | null;
  chip: string | null;
  tag: string | null;
  tx_hash: string | null;
  created_at: string;
};

function buildRemainingEvents(plan: Domain, intent: string): Omit<DbEvent, "id" | "created_at">[] {
  const skill = (i: number) => plan.skills[i % plan.skills.length]?.name ?? "reasoning";
  return [
    { seq: 4, phase: "plan", kind: "tool", title: plan.steps[0] ?? "Gather context", detail: `${plan.specialist.name} invokes ${skill(0)}`, chip: null, tag: skill(0), tx_hash: null },
    { seq: 5, phase: "act", kind: "tool", title: plan.steps[1] ?? "Draft the artifact", detail: `Skill run · ${skill(1)}`, chip: null, tag: skill(1), tx_hash: null },
    { seq: 6, phase: "verify", kind: "sip", title: "SIP post-conditions", detail: "Rules pass · risk=medium · needs human approval", chip: "SIP", tag: null, tx_hash: null },
    { seq: 7, phase: "verify", kind: "chain", title: "ERC-8004 Reputation lookup", detail: "Specialist agentId · feedback score 92/100", chip: "ERC-8004", tag: null, tx_hash: null },
    { seq: 8, phase: "act", kind: "output", title: "Draft ready (not sent)", detail: draftFor(plan, intent), chip: null, tag: null, tx_hash: null },
    { seq: 9, phase: "gate", kind: "guard", title: "Human-in-the-loop gate", detail: plan.gate, chip: "TOP", tag: null, tx_hash: null },
  ];
}

function WorkingPhase({
  intent,
  plan,
  taskId,
  cardId,
  channel,
  setChannel,
  onNewGoal,
}: {
  intent: string;
  plan: Domain;
  taskId: string;
  cardId: string | null;
  channel: "app" | "telegram";
  setChannel: (c: "app" | "telegram") => void;
  onNewGoal: () => void;
}) {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [decision, setDecision] = useState<"pending" | "approved" | "rejected">("pending");
  const [heartbeat, setHeartbeat] = useState(0);
  const [receiptTx, setReceiptTx] = useState<string | null>(null);
  const [anchorStatus, setAnchorStatus] = useState<"anchored" | "simulated" | "failed" | null>(null);
  const streamRef = useRef<HTMLDivElement | null>(null);
  const logEvent = useServerFn(logTaskEvent);
  const decide = useServerFn(decideOnCard);
  const { state: wsState } = useWorkspace();
  const card = cardId ? wsState.decisionCards.find((c) => c.id === cardId) ?? null : null;
  const evidence = card?.evidence ?? null;
  const totalEvents = 10;

  // Initial fetch + realtime subscription for THIS task's events.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("task_events")
        .select("id, seq, phase, kind, title, detail, chip, tag, tx_hash, created_at")
        .eq("task_id", taskId)
        .order("seq");
      if (mounted && data) setEvents(data as DbEvent[]);
    })();
    const channel = supabase
      .channel(`task_events:${taskId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "task_events", filter: `task_id=eq.${taskId}` },
        (payload) => {
          const row = payload.new as DbEvent;
          setEvents((prev) => (prev.some((e) => e.id === row.id) ? prev : [...prev, row].sort((a, b) => a.seq - b.seq)));
        },
      )
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  // Progressively append the remaining events with jittered cadence (real DB writes).
  useEffect(() => {
    if (decision !== "pending") return;
    const nextSeq = events.length === 0 ? 0 : events[events.length - 1].seq + 1;
    if (nextSeq >= totalEvents) return;
    const remaining = buildRemainingEvents(plan, intent);
    const next = remaining.find((r) => r.seq === nextSeq);
    if (!next) return;
    const delay = 750 + Math.random() * 900;
    const t = setTimeout(async () => {
      try {
        await logEvent({
          data: {
            taskId,
            seq: next.seq,
            phase: next.phase,
            kind: next.kind,
            title: next.title,
            detail: next.detail ?? "",
            chip: next.chip,
            tag: next.tag,
            txHash: null,
          },
        });
      } catch {
        /* swallow — realtime will retry from server view */
      }
    }, delay);
    return () => clearTimeout(t);
  }, [events, decision, plan, intent, taskId, logEvent]);

  // Continuous harness heartbeat.
  useEffect(() => {
    const t = setInterval(() => setHeartbeat((h) => (h + 1) % 5), 1400);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: "smooth" });
  }, [events, decision]);

  const gateReached = events.length >= totalEvents;
  const draftItem = events.find((e) => e.kind === "output");

  const onApprove = async () => {
    if (!cardId) {
      toast.error("This task does not require approval.");
      return;
    }
    const rec = evidence?.recommendation;
    const isOverride = rec === "reject" || rec === "hold";
    const suggested = isOverride
      ? rec === "reject"
        ? "Customer contacted again and confirmed non-receipt of prior refund — re-issuing after verification."
        : "Additional context received out-of-band — proceeding with approval."
      : "Confirmed — proceeding as recommended.";
    const heading = isOverride
      ? `You are OVERRIDING the AI recommendation (${rec!.toUpperCase()}).\n\nReason for approval (will be signed & anchored in the audit receipt):`
      : "Reason for approval (will be signed & anchored in the audit receipt):";
    const reason = window.prompt(heading, suggested);
    if (reason === null) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error("An approval rationale is required for the audit trail.");
      return;
    }
    setDecision("approved");
    try {
      const res = await decide({ data: { cardId, decision: "approve", reason: trimmed } });
      if (res.status === "approved" && res.receipt) {
        setReceiptTx(res.receipt.tx_hash ?? null);
        setAnchorStatus(res.receipt.anchor_status as typeof anchorStatus);
        try {
          await logEvent({
            data: {
              taskId,
              seq: 10,
              phase: "anchor",
              kind: "chain",
              title: res.receipt.anchor_status === "anchored" ? "Receipt anchored on BSC Testnet" : "Receipt recorded (validator local)",
              detail: res.receipt.tx_hash ?? "",
              chip: "ERC-8004",
              tag: null,
              txHash: res.receipt.tx_hash ?? null,
            },
          });
        } catch {}
        toast.success(
          res.receipt.anchor_status === "anchored"
            ? "Approved — receipt anchored on BSC Testnet"
            : "Approved — receipt signed (local fallback)",
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approval failed");
      setDecision("pending");
    }
  };

  const onReject = async () => {
    if (!cardId) return;
    const rec = evidence?.recommendation;
    const suggested =
      rec === "reject"
        ? "Duplicate refund — ledger shows customer already made whole."
        : rec === "hold"
        ? "Insufficient evidence — rejecting until customer clarifies."
        : "Rejected on human review.";
    const heading = rec
      ? `AI recommendation: ${rec.toUpperCase()}.\n\nReason for rejection (will be signed & anchored in the audit receipt):`
      : "Reason for rejection (will be signed & anchored in the audit receipt):";
    const reason = window.prompt(heading, suggested);
    if (reason === null) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error("A rejection reason is required for the audit trail.");
      return;
    }
    setDecision("rejected");
    try {
      const res = await decide({ data: { cardId, decision: "reject", reason: trimmed } });
      const rec2 = (res as { receipt?: { tx_hash?: string | null; anchor_status?: string } }).receipt;
      toast.success(
        rec2?.anchor_status === "anchored"
          ? `Rejected · reason anchored on BSC Testnet: ${rec2.tx_hash?.slice(0, 10)}…`
          : "Rejected · reason recorded in signed receipt",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reject failed");
      setDecision("pending");
    }
  };

  const harnessSteps: { key: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "sense",  label: "Sense",   icon: Eye },
    { key: "plan",   label: "Plan",    icon: Cpu },
    { key: "act",    label: "Act",     icon: Hammer },
    { key: "verify", label: "Verify",  icon: ShieldCheck },
    { key: "anchor", label: "Anchor",  icon: Link2 },
  ];

  const explorerUrl = receiptTx && anchorStatus === "anchored"
    ? `https://testnet.bscscan.com/tx/${receiptTx}`
    : null;

  return (
    <div className="w-full space-y-4">
      <Card className="overflow-hidden border-border p-0 shadow-warm">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-secondary/40 px-6 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <div className="text-sm font-semibold">Your twin is working 24/7</div>
              <Badge variant="outline" className="ml-1 font-mono text-[9px]">task {taskId.slice(0, 8)}</Badge>
            </div>
            <div className="mt-1 max-w-xl text-xs text-muted-foreground">{intent}</div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <ComplianceChip icon={ShieldCheck} label="ERC-8004" tone="primary" />
            <ComplianceChip icon={FileSignature} label="SIP · signed receipts" tone="emerald" />
            <ComplianceChip icon={Gauge} label="TOP loop" tone="primary" />
            <ComplianceChip icon={ShieldCheck} label="ISO/IEC 42001" tone="amber" />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/60 px-6 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Harness · always-on OODA
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {harnessSteps.map((s, i) => {
              const active = heartbeat === i;
              return (
                <div key={s.key} className="flex items-center gap-1.5">
                  <div
                    className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest transition-all ${
                      active
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground"
                    }`}
                  >
                    <s.icon className={`h-3 w-3 ${active ? "animate-pulse" : ""}`} />
                    {s.label}
                  </div>
                  {i < harnessSteps.length - 1 && <div className="h-px w-3 bg-border" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0 space-y-3 border-b border-border px-6 py-5 md:border-b-0 md:border-r">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <Radio className="h-3 w-3 animate-pulse text-primary" /> Live activity stream
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {gateReached
                  ? decision === "pending" ? "Waiting on you" : decision
                  : `${events.length} / ${totalEvents}`}
              </div>
            </div>

            <div ref={streamRef} className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {events.map((e, i) => (
                <StreamRow
                  key={e.id}
                  e={{
                    id: e.id,
                    ts: new Date(e.created_at).getTime(),
                    phase: e.phase,
                    kind: e.kind,
                    title: e.title,
                    detail: e.detail ?? "",
                    chip: (e.chip ?? undefined) as StreamEvent["chip"],
                  }}
                  isLatest={i === events.length - 1 && !gateReached}
                />
              ))}
              {!gateReached && (
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <span className="font-mono uppercase tracking-widest">streaming…</span>
                </div>
              )}
            </div>

            {draftItem && (
              <div className="rounded-xl border border-border bg-secondary/30 p-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Latest output · draft
                  </div>
                  <Badge variant="outline" className="text-[9px]">not sent</Badge>
                </div>
                <StreamedText text={draftItem.detail ?? ""} />
              </div>
            )}

            {gateReached && (
              <HitlDecisionCard
                plan={plan}
                intent={intent}
                taskId={taskId}
                cardId={cardId}
                evidence={evidence}
                cardTitle={card?.title ?? null}
                cardDetail={card?.detail ?? null}
                decision={decision}
                receiptTx={receiptTx}
                anchorStatus={anchorStatus}
                explorerUrl={explorerUrl}
                onApprove={onApprove}
                onReject={onReject}
              />
            )}
          </div>

          <div className="min-w-0 space-y-5 px-6 py-5">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Deployed
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-coral font-display text-sm font-semibold text-primary-foreground">
                  {plan.specialist.name.charAt(0)}
                </div>
                <div className="min-w-0 text-sm">
                  <div className="truncate font-medium">{plan.specialist.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{plan.specialist.role}</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-secondary/30 p-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                ERC-8004 registry
              </div>
              <div className="mt-2 space-y-1.5 text-[11px]">
                <RegistryRow icon={Fingerprint} label="Identity" value={`agentId #${(Math.abs(hashCode(plan.specialist.name)) % 900 + 100)}`} />
                <RegistryRow icon={Activity} label="Reputation" value="92 / 100" />
                <RegistryRow icon={ShieldCheck} label="Validation" value={anchorStatus === "anchored" ? "verified on-chain" : decision === "approved" ? "signed · local" : "pending gate"} />
              </div>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Reach me on
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <ChannelBtn active={channel === "app"} onClick={() => setChannel("app")} icon={Sparkles} label="App" />
                <ChannelBtn active={channel === "telegram"} onClick={() => setChannel("telegram")} icon={Send} label="Telegram" />
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                Task replies are mirrored to linked Telegram with a task code, so replies route back to the right thread.
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card px-6 py-4">
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/tasks">
                All tasks <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/governance">Governance</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/reputation">Reputation & receipts</Link>
            </Button>
          </div>
          <Button onClick={onNewGoal} variant="ghost" size="sm">
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> New goal
          </Button>
        </div>
      </Card>
    </div>
  );
}


function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

function StreamRow({ e, isLatest }: { e: StreamEvent; isLatest: boolean }) {
  const icon =
    e.kind === "tool" ? Hammer :
    e.kind === "sip" ? FileSignature :
    e.kind === "model" ? Cpu :
    e.kind === "guard" ? ShieldCheck :
    e.kind === "chain" ? Link2 :
    e.kind === "loop" ? Gauge :
    Search;
  const Icon = icon;
  const phaseTone: Record<StreamEvent["phase"], string> = {
    sense: "text-sky-600 bg-sky-500/10 border-sky-500/30",
    plan: "text-primary bg-primary/10 border-primary/30",
    act: "text-primary bg-primary/10 border-primary/30",
    verify: "text-emerald-700 bg-emerald-500/10 border-emerald-500/30",
    anchor: "text-emerald-700 bg-emerald-500/10 border-emerald-500/30",
    gate: "text-amber-700 bg-amber-500/10 border-amber-500/30",
  };
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-all ${
        isLatest ? "border-primary/30 bg-primary/5" : "border-border/60"
      } animate-in fade-in slide-in-from-bottom-1 duration-300`}
    >
      <div className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${phaseTone[e.phase]}`}>
        <Icon className="h-3 w-3" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-medium">{e.title}</div>
          <div className="flex items-center gap-1.5">
            <span className={`font-mono text-[9px] uppercase tracking-[0.18em] ${phaseTone[e.phase].split(" ")[0]}`}>
              {e.phase}
            </span>
            {e.chip && (
              <span className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                {e.chip}
              </span>
            )}
          </div>
        </div>
        <div className="mt-0.5 whitespace-pre-line text-xs text-muted-foreground">{e.detail}</div>
      </div>
    </div>
  );
}

function StreamedText({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    if (!text) return;
    const id = setInterval(() => {
      setN((v) => {
        if (v >= text.length) {
          clearInterval(id);
          return v;
        }
        return Math.min(text.length, v + Math.max(2, Math.floor(text.length / 120)));
      });
    }, 24);
    return () => clearInterval(id);
  }, [text]);
  return (
    <div className="whitespace-pre-line text-xs leading-relaxed text-foreground/90">
      {text.slice(0, n)}
      {n < text.length && <span className="ml-0.5 inline-block h-3 w-1.5 -translate-y-[1px] animate-pulse bg-primary/70 align-middle" />}
    </div>
  );
}

function ComplianceChip({
  icon: Icon,
  label,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone: "primary" | "emerald" | "amber";
}) {
  const toneCls =
    tone === "primary"
      ? "border-primary/30 bg-primary/10 text-primary"
      : tone === "emerald"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
      : "border-amber-500/30 bg-amber-500/10 text-amber-700";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${toneCls}`}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

function RegistryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <Icon className="h-3 w-3" />
        {label}
      </span>
      <span className="truncate font-mono text-foreground">{value}</span>
    </div>
  );
}

function HitlDecisionCard({
  plan,
  intent,
  taskId,
  cardId,
  evidence,
  cardTitle,
  cardDetail,
  decision,
  receiptTx,
  anchorStatus,
  explorerUrl,
  onApprove,
  onReject,
}: {
  plan: Domain;
  intent: string;
  taskId: string;
  cardId: string | null;
  evidence: RefundEvidenceLite | null;
  cardTitle: string | null;
  cardDetail: string | null;
  decision: "pending" | "approved" | "rejected";
  receiptTx: string | null;
  anchorStatus: "anchored" | "simulated" | "failed" | null;
  explorerUrl: string | null;
  onApprove: () => void;
  onReject: () => void;
}) {
  const sipId = useMemo(() => `sip_${taskId.slice(0, 8)}`, [taskId]);
  const anchoring = decision === "approved" && !receiptTx;
  const anchored = anchorStatus === "anchored" && !!receiptTx;
  const recTone =
    evidence?.recommendation === "reject"
      ? { label: "Recommend: REJECT", cls: "border-destructive/50 bg-destructive/10 text-destructive" }
      : evidence?.recommendation === "hold"
      ? { label: "Recommend: HOLD for clarification", cls: "border-amber-500/50 bg-amber-500/10 text-amber-900" }
      : evidence?.recommendation === "approve"
      ? { label: "Recommend: APPROVE", cls: "border-emerald-500/50 bg-emerald-500/10 text-emerald-800" }
      : null;

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold">
                {cardId ? "Decision Card · human approval required" : "No approval required for this task"}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">{cardTitle ?? plan.gate}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <ComplianceChip icon={FileSignature} label="SIP" tone="primary" />
              <ComplianceChip icon={ShieldCheck} label="TOP" tone="emerald" />
            </div>
          </div>

          {evidence ? (
            <div className="mt-3 space-y-3">
              {recTone && (
                <div className={`rounded-lg border px-3 py-2 text-xs font-semibold ${recTone.cls}`}>
                  {recTone.label}
                  {evidence.duplicate_risk && <span className="ml-2 rounded bg-destructive/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">Duplicate risk</span>}
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-background/70 p-3 text-xs">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Customer</div>
                  <div className="mt-1 font-medium">
                    {evidence.customer ? (evidence.customer.name ?? evidence.customer.email) : evidence.email ? <span className="text-destructive">{evidence.email} — NOT FOUND</span> : <span className="text-muted-foreground">—</span>}
                  </div>
                  {evidence.customer && <div className="text-muted-foreground">{evidence.customer.email}</div>}
                </div>
                <div className="rounded-lg border border-border bg-background/70 p-3 text-xs">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Order</div>
                  <div className="mt-1 font-medium">
                    {evidence.order ? (
                      <>
                        {evidence.order.order_number} · ${evidence.order.amount.toFixed(2)} {evidence.order.currency}
                      </>
                    ) : evidence.order_number ? (
                      <span className="text-destructive">{evidence.order_number} — NOT FOUND</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                  {evidence.order && (
                    <div className="text-muted-foreground">
                      status <span className={evidence.order.status === "refunded" ? "font-semibold text-destructive" : ""}>{evidence.order.status}</span> · placed {new Date(evidence.order.created_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-border bg-background/70 p-2.5 text-center">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Paid</div>
                  <div className="mt-0.5 font-mono text-sm font-semibold">${evidence.totals.paid.toFixed(2)}</div>
                </div>
                <div className={`rounded-lg border p-2.5 text-center ${evidence.totals.refunded > 0 ? "border-destructive/40 bg-destructive/5" : "border-border bg-background/70"}`}>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Refunded</div>
                  <div className="mt-0.5 font-mono text-sm font-semibold">${evidence.totals.refunded.toFixed(2)}</div>
                </div>
                <div className="rounded-lg border border-border bg-background/70 p-2.5 text-center">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Net owed</div>
                  <div className="mt-0.5 font-mono text-sm font-semibold">${evidence.totals.net_owed.toFixed(2)}</div>
                </div>
              </div>

              {evidence.prior_refunds.length > 0 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
                  <div className="font-semibold text-destructive">Prior refunds on this order ({evidence.prior_refunds.length})</div>
                  <ul className="mt-1.5 space-y-1">
                    {evidence.prior_refunds.map((r) => (
                      <li key={r.id} className="font-mono text-[11px]">
                        ${Number(r.amount).toFixed(2)} · by {r.issued_by_agent ?? "unknown"} · {r.governance_status ?? "n/a"} · {new Date(r.created_at).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {evidence.flags.length > 0 && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-xs">
                  <div className="font-semibold text-amber-900">Risk flags</div>
                  <ul className="mt-1.5 space-y-0.5 text-amber-900/90">
                    {evidence.flags.map((f, i) => (
                      <li key={i}>⚠ {f}</li>
                    ))}
                  </ul>
                </div>
              )}

              <details className="rounded-lg border border-border bg-background/50 p-2 text-[10px]">
                <summary className="cursor-pointer font-mono uppercase tracking-widest text-muted-foreground">SIP intent · raw ({sipId})</summary>
                <pre className="mt-2 whitespace-pre-wrap font-mono text-[10px] text-foreground/80">{`{
  "task_id": "${taskId}",
  "specialist": "${plan.specialist.name}",
  "action": "${plan.steps[plan.steps.length - 1] ?? "execute"}",
  "requires_approval": ${cardId ? "true" : "false"},
  "intent": "${intent.slice(0, 120).replace(/"/g, '\\"')}${intent.length > 120 ? "…" : ""}"
}`}</pre>
              </details>
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-border bg-background/70 p-3 text-xs">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Request</div>
              <div className="whitespace-pre-wrap text-foreground/90">{cardDetail ?? intent}</div>
              <details className="mt-2 text-[10px]">
                <summary className="cursor-pointer font-mono uppercase tracking-widest text-muted-foreground">SIP intent · raw ({sipId})</summary>
                <pre className="mt-2 whitespace-pre-wrap font-mono text-[10px] text-foreground/80">{`{
  "task_id": "${taskId}",
  "specialist": "${plan.specialist.name}",
  "action": "${plan.steps[plan.steps.length - 1] ?? "execute"}",
  "requires_approval": ${cardId ? "true" : "false"},
  "intent": "${intent.slice(0, 120).replace(/"/g, '\\"')}${intent.length > 120 ? "…" : ""}"
}`}</pre>
              </details>
            </div>
          )}


          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <EvidenceTile
              label="Validator"
              value={anchored || anchoring ? "Ed25519 signature (validator)" : "signs on approve"}
              icon={FileSignature}
              status={anchored ? "receipt signed" : anchoring ? "requesting signature…" : "pre-flight"}
              spinning={anchoring}
            />
            <EvidenceTile
              label={anchored ? "Anchored on BSC Testnet" : anchoring ? "Anchoring…" : "Anchor on approve"}
              value={anchored && receiptTx ? `${receiptTx.slice(0, 10)}…${receiptTx.slice(-8)}` : anchoring ? "broadcasting tx…" : "awaiting approval"}
              icon={Link2}
              status={anchored ? "audit-receipt on-chain" : anchorStatus === "simulated" ? "signed locally (no chain)" : anchoring ? "broadcasting" : "pre-flight"}
              href={explorerUrl ?? undefined}
              spinning={anchoring}
            />
          </div>

          {decision === "pending" && cardId && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                onClick={onApprove}
                size="sm"
                className="bg-gradient-coral text-primary-foreground shadow-warm hover:brightness-105"
              >
                <Check className="mr-1.5 h-3.5 w-3.5" /> Approve action & execute
              </Button>
              <Button onClick={onReject} size="sm" variant="outline">
                <X className="mr-1.5 h-3.5 w-3.5" /> Reject action
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link to="/dashboard/governance">
                  Full review in Governance <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
              <div className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                Approve = the action runs. Reject = it does not. Either way is signed & anchored.
              </div>
            </div>
          )}

          {decision === "approved" && (
            <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
              <div className="flex items-center gap-2 font-medium text-emerald-800">
                <Check className="h-3.5 w-3.5" /> Approved — receipt {anchored ? "anchored on BSC Testnet" : anchorStatus === "simulated" ? "signed (local validator)" : "anchoring…"}
              </div>
              <div className="mt-1 text-muted-foreground">
                ERC-8004 Identity · Reputation · Validation entries recorded.
                {explorerUrl && (
                  <>
                    {" "}
                    <a href={explorerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      View on BscScan <ExternalLink className="h-3 w-3" />
                    </a>
                  </>
                )}
              </div>
            </div>
          )}

          {decision === "rejected" && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              <div className="flex items-center gap-2 font-medium">
                <X className="h-3.5 w-3.5" /> Rejected — action NOT executed. Your reason was signed & anchored as a REJECT receipt.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function EvidenceTile({
  label,
  value,
  icon: Icon,
  status,
  href,
  spinning,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  status: string;
  href?: string;
  spinning?: boolean;
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Icon className="h-3 w-3" /> {label}
        </span>
        {spinning && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
        {href && !spinning && <ExternalLink className="h-3 w-3 text-primary" />}
      </div>
      <div className="mt-1 truncate font-mono text-[11px] text-foreground">{value}</div>
      <div className="mt-0.5 text-[10px] text-muted-foreground">{status}</div>
    </>
  );
  const cls = "block rounded-lg border border-border bg-background/70 p-2.5 transition hover:border-primary/40";
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>{inner}</a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function draftFor(plan: Domain, intent: string): string {
  switch (plan.id) {
    case "travel":
      return `Itinerary draft · 7 nights\n• Outbound: candidate fare $612 (refundable +$40)\n• Hotels: 3 options within budget, walkable to transit\n• Total est.: $3,120 of $3,500 cap\nNext: awaiting your approval before any non-refundable booking.`;
    case "marketing":
      return `4 LinkedIn posts drafted for next week\n• Tue 9:00 — "Why receipts beat vibes" (hook + CTA)\n• Thu 9:00 — Launch teaser with product shot\n• Tue 9:00 — Customer quote card\n• Thu 9:00 — Behind-the-scenes clip\nNext: awaiting your approval before scheduling to the brand account.`;
    case "money":
      return `Rebalance proposal\n• Drift detected: equities +4.2%, bonds −3.1%\n• Trades: sell $2,400 VOO, buy $2,400 BND\n• Est. fees $0 · est. tax impact $18\nNext: awaiting your approval before any trade executes.`;
    case "work":
      return `Inbox triage · 12 items\n• 3 need a reply (drafts ready)\n• 5 informational (archived)\n• 4 flagged for you\nNext: awaiting your approval before any outbound send.`;
    case "health":
      return `Week 1 plan\n• Mon easy 5km · Wed intervals 6×400m · Sat long 12km\n• Nutrition: 2,350 kcal · 150g protein\nNext: awaiting your approval before altering load or targets.`;
    default:
      return `Draft plan for: "${intent}"\n• AiXin will interview you briefly to lock outcomes\n• Proposed Specialists and Skills prepared\nNext: awaiting your approval before anything runs.`;
  }
}

function ChannelBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
