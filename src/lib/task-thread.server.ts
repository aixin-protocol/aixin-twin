import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";

type SB = SupabaseClient<Database>;

type TaskForThread = {
  id: string;
  title: string;
  intent: string | null;
  intent_json?: Json | null;
  status?: string | null;
};

type OutcomeRow = {
  title: string;
  summary: string;
  artifact: Json;
  next_actions?: Json | null;
};

type ThreadReplyResult = {
  reply: string;
  createdOutcome: boolean;
};

const PLAN_REQUEST_RE =
  /(plan|recovery|entire|full|whole|outcome|deliverable|artifact|details|send it|show me|where is|what did you do|计划|方案|结果|恢复|完整|全部)/i;

export async function createTaskThreadReply({
  supabase,
  userId,
  task,
}: {
  supabase: SB;
  userId: string;
  task: TaskForThread;
}): Promise<ThreadReplyResult> {
  const [{ data: history }, { data: existingOutcome }] = await Promise.all([
    supabase
      .from("task_messages")
      .select("sender, body, created_at")
      .eq("task_id", task.id)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(14),
    supabase
      .from("task_outcomes")
      .select("title, summary, artifact, next_actions")
      .eq("task_id", task.id)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const orderedHistory = (history ?? []).reverse();
  const lastUser = [...orderedHistory].reverse().find((m) => m.sender === "user")?.body ?? "";
  const userAskedForPlan = PLAN_REQUEST_RE.test(lastUser);

  if (!existingOutcome && userAskedForPlan) {
    const outcome = await generateMissingOutcome(task, orderedHistory);
    const { error } = await supabase.from("task_outcomes").insert({
      task_id: task.id,
      user_id: userId,
      title: outcome.title,
      summary: outcome.summary,
      artifact: outcome.artifact as unknown as Json,
      next_actions: outcome.next_actions as unknown as Json,
    });
    if (error) throw error;

    await appendOutcomeEvent(supabase, userId, task.id, outcome.title);
    await supabase.from("tasks").update({ status: "done" }).eq("id", task.id).eq("user_id", userId);

    return { reply: formatOutcomeReply(outcome), createdOutcome: true };
  }

  if (existingOutcome && userAskedForPlan) {
    return { reply: formatExistingOutcomeReply(existingOutcome as OutcomeRow), createdOutcome: false };
  }

  const { data: pendingCard } = await supabase
    .from("decision_cards")
    .select("id")
    .eq("task_id", task.id)
    .eq("user_id", userId)
    .eq("status", "pending")
    .maybeSingle();

  return {
    reply: await generateConversationalReply(
      task,
      orderedHistory,
      existingOutcome as OutcomeRow | null,
      Boolean(pendingCard),
    ),
    createdOutcome: false,
  };
}

async function appendOutcomeEvent(supabase: SB, userId: string, taskId: string, title: string) {
  const { data: lastEvt } = await supabase
    .from("task_events")
    .select("seq")
    .eq("task_id", taskId)
    .eq("user_id", userId)
    .order("seq", { ascending: false })
    .limit(1)
    .maybeSingle();
  await supabase.from("task_events").insert({
    task_id: taskId,
    user_id: userId,
    seq: (lastEvt?.seq ?? -1) + 1,
    phase: "verify",
    kind: "output",
    title: "Outcome artifact delivered",
    detail: title,
    chip: "OUTPUT",
  });
}

async function generateMissingOutcome(
  task: TaskForThread,
  history: Array<{ sender: string; body: string }>,
): Promise<{ title: string; summary: string; artifact: Record<string, unknown>; next_actions: string[] }> {
  const fallback = fallbackOutcome(task, history);
  const { resolveChatModel } = await import("@/lib/ai-gateway.server");
  const resolved = resolveChatModel("chat");
  if (!resolved) return fallback;

  try {
    const { generateText } = await import("ai");
    const model = resolved.model;
    const convo = history.map((m) => `${m.sender === "user" ? "User" : "Twin"}: ${m.body}`).join("\n");
    const { text } = await generateText({
      model,
      prompt: [
        "You are the AiXin Master Twin. The user is frustrated because a prior reply promised a deliverable but did not provide it.",
        "Your job is to deliver the actual task outcome now. Do not apologize more than once. Do not say you will do it later. Do not claim anything was sent elsewhere.",
        `Task title: ${task.title}`,
        `Original intent: ${task.intent ?? task.title}`,
        `Structured task context: ${JSON.stringify(task.intent_json ?? {}).slice(0, 1600)}`,
        "Recent thread:",
        convo,
        "",
        "Write the complete practical deliverable as markdown. If this is a sleep/recovery task, include a clear recovery plan with phases, schedule, habits, measurement, escalation criteria, and next check-in. If another domain, adapt to that domain. Be specific and usable.",
      ].join("\n"),
    });
    const plan = text.trim() || fallback.artifact.deliverable_markdown;
    return {
      title: titleFromPlan(plan, fallback.title),
      summary: summaryFromPlan(plan, fallback.summary),
      artifact: {
        deliverable_markdown: plan,
        generated_from: "task_thread_recovery",
        task_title: task.title,
        original_intent: task.intent ?? task.title,
      },
      next_actions: [
        "Review the recovery plan and tell AiXin what feels unrealistic.",
        "Ask AiXin to convert this into a daily checklist.",
        "Open a Decision Card for any consequential action that needs approval.",
      ],
    };
  } catch (error) {
    console.error("[task-thread] missing outcome generation failed", error);
    return fallback;
  }
}

async function generateConversationalReply(
  task: TaskForThread,
  history: Array<{ sender: string; body: string }>,
  outcome: OutcomeRow | null,
  hasPendingCard = false,
): Promise<string> {
  // Pull refund evidence out of intent_json (populated at startIntent time)
  // so the twin's first reply is grounded in real ledger facts, not paraphrase.
  const intentJson = (task.intent_json ?? {}) as Record<string, unknown>;
  let evidence = intentJson.refund_evidence as
    | {
        detail_markdown?: string;
        recommendation?: string;
        duplicate_risk?: boolean;
        flags?: string[];
        totals?: { paid: number; refunded: number; net_owed: number };
        order?: { order_number: string; amount: number; status: string } | null;
        customer?: { email: string; name: string | null } | null;
        prior_refunds?: Array<{ amount: number; issued_by_agent: string | null; created_at: string }>;
      }
    | undefined;

  // Defensive re-fetch: if the stored evidence is missing or came back empty
  // (e.g. an older task created before the email-parsing fix), rebuild it now
  // from the intent text so follow-up replies stay grounded in real ledger data.
  if (task.intent && (!evidence || (!evidence.customer && !evidence.order))) {
    try {
      const { gatherRefundEvidence } = await import("@/lib/refund-evidence.server");
      const fresh = await gatherRefundEvidence(task.intent);
      if (fresh) evidence = fresh;
    } catch (e) {
      console.error("[task-thread] evidence re-fetch failed", e);
    }
  }

  const { resolveChatModel: resolveThreadModel } = await import("@/lib/ai-gateway.server");
  const resolvedThreadModel = resolveThreadModel("chat");
  if (!resolvedThreadModel) {
    if (evidence?.detail_markdown) return evidence.detail_markdown;
    return outcome
      ? formatExistingOutcomeReply(outcome)
      : "I do not have an outcome artifact for this task yet. Ask me for the full plan and I will generate it here in the thread.";
  }
  try {
    const { generateText } = await import("ai");
    const model = resolvedThreadModel.model;
    const convo = history.map((m) => `${m.sender === "user" ? "User" : "Twin"}: ${m.body}`).join("\n");
    const evidenceBlock = evidence
      ? [
          "SHARED-LEDGER EVIDENCE (already fetched via MCP tools — DO NOT ask the user for it, cite it directly):",
          evidence.detail_markdown ?? JSON.stringify(evidence).slice(0, 1600),
          `duplicate_risk=${evidence.duplicate_risk ? "YES" : "no"} · recommendation=${evidence.recommendation ?? "n/a"}`,
        ].join("\n")
      : "No refund evidence attached to this task.";
    const { text } = await generateText({
      model,
      prompt: [
        hasPendingCard
          ? "You are the AiXin Master Twin explaining a pending Decision Card to the user."
          : "You are the AiXin Master Twin discussing this task with the user. There is NO Decision Card for this task — it did not require human approval. NEVER tell the user to click Approve or Reject, and never reference a Decision Card as if it exists. If the task has not produced an outcome yet, say plainly that it is still running (or that no outcome artifact exists yet) and offer to generate the full result here in the thread.",
        hasPendingCard
          ? "IMPORTANT — chat is advisory, not an execution channel. The binding human decision happens when the user clicks Approve or Reject on the Decision Card (that action is signed by the validator and anchored on BSC Testnet). You do NOT execute refunds, approvals, or rejections from chat. You do NOT re-argue the case once the user has stated their intent."
          : "Chat is advisory. Do not claim to have executed anything that is not in the evidence or outcome below.",
        hasPendingCard
          ? "If the user says they authorise, approve, override, or want to proceed (in English or Chinese: 授权, 批准, 同意, 继续): DO NOT lecture or repeat the recommendation. Acknowledge their intent in one sentence, then tell them exactly where to record it: 'To make this binding, click Approve on the Decision Card above and enter your rationale — it will be signed and anchored on-chain.' Then stop."
          : "If the user says they authorise or want to proceed: acknowledge in one sentence and continue with the task result — there is no approval step to point them to.",
        hasPendingCard
          ? "If the user is still asking questions or hasn't decided: answer the actual question first in one crisp sentence, then give a 3–5 bullet evidence summary drawn from the ledger, then end with your recommendation (Approve / Reject / Hold) and the ONE reason it matters."
          : "Answer the user's actual question first in one crisp sentence, then give a short bullet summary of what is known about this task. Do not end with an Approve/Reject/Hold recommendation.",
        "Never say you lack information if the SHARED-LEDGER EVIDENCE below already contains it. Quote the specific numbers, order, customer, prior-refund count and dollar totals.",
        "Never invent data not in the evidence. Never promise to send anything later. Never claim to have executed anything.",
        "",
        `Task: ${task.intent ?? task.title}`,
        evidenceBlock,
        outcome
          ? `Outcome context: ${outcome.title} — ${outcome.summary}\nArtifact: ${JSON.stringify(outcome.artifact).slice(0, 1200)}`
          : "",
        "Recent conversation:",
        convo,
      ]
        .filter(Boolean)
        .join("\n"),
    });
    return text.trim() || evidence?.detail_markdown || "I have the task context open. Ask me for the full plan and I will provide it here.";
  } catch (error) {
    console.error("[task-thread] AI reply failed", error);
    if (evidence?.detail_markdown) return evidence.detail_markdown;
    return outcome ? formatExistingOutcomeReply(outcome) : fallbackOutcome(task, history).artifact.deliverable_markdown as string;
  }
}


function formatExistingOutcomeReply(outcome: OutcomeRow): string {
  const artifact = outcome.artifact as Record<string, unknown> | null;
  const markdown = typeof artifact?.deliverable_markdown === "string" ? artifact.deliverable_markdown : null;
  if (markdown) return markdown;

  return [
    `${outcome.title}`,
    "",
    outcome.summary,
    "",
    "Artifact:",
    JSON.stringify(outcome.artifact, null, 2),
    "",
    Array.isArray(outcome.next_actions) && outcome.next_actions.length > 0
      ? `Next actions:\n${(outcome.next_actions as string[]).map((a) => `- ${a}`).join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function formatOutcomeReply(outcome: { title: string; summary: string; artifact: Record<string, unknown>; next_actions: string[] }) {
  const markdown = typeof outcome.artifact.deliverable_markdown === "string" ? outcome.artifact.deliverable_markdown : "";
  return markdown || `${outcome.title}\n\n${outcome.summary}`;
}

function fallbackOutcome(task: TaskForThread, history: Array<{ sender: string; body: string }>) {
  const recent = history.map((m) => m.body).join(" ").toLowerCase();
  const isSleep = /sleep|insomnia|rest|recovery|疲|睡|休息/.test(`${task.title} ${task.intent ?? ""} ${recent}`.toLowerCase());
  const markdown = isSleep ? sleepRecoveryPlan(task) : genericRecoveryPlan(task);
  return {
    title: isSleep ? "Sleep recovery plan" : "Recovery plan",
    summary: isSleep
      ? "A practical sleep recovery plan is ready, with immediate stabilisation, a 7-day reset, tracking, and escalation criteria."
      : "A practical recovery plan is ready, with immediate stabilisation, next actions, tracking, and escalation criteria.",
    artifact: {
      deliverable_markdown: markdown,
      generated_from: "fallback_task_thread_recovery",
      task_title: task.title,
      original_intent: task.intent ?? task.title,
    },
    next_actions: ["Confirm the plan", "Ask for adjustments", "Set the next check-in"],
  };
}

function sleepRecoveryPlan(task: TaskForThread) {
  return [
    "Sleep recovery plan",
    "",
    `Context: ${task.intent ?? task.title}`,
    "",
    "1. Tonight: stabilise",
    "- Pick one fixed wake-up time and keep it for the next 7 days.",
    "- Stop caffeine after lunch and avoid alcohol as a sleep aid.",
    "- Create a 30-minute wind-down: dim lights, shower or reading, no work messages.",
    "- If awake for more than about 20 minutes, leave the bed briefly and return only when sleepy.",
    "",
    "2. Days 1–3: remove the biggest blockers",
    "- Track bedtime, wake time, awakenings, caffeine, alcohol, exercise, and stress level.",
    "- Get outdoor light within 60 minutes of waking.",
    "- Move intense exercise earlier; use only gentle stretching close to bedtime.",
    "- Keep the bedroom cool, dark, and quiet.",
    "",
    "3. Days 4–7: rebuild rhythm",
    "- Adjust bedtime earlier only when you are actually sleepy, not just tired.",
    "- Keep naps under 20 minutes and before mid-afternoon.",
    "- Use one repeatable pre-sleep routine so your body learns the cue.",
    "",
    "4. Measurement",
    "- Target: consistent wake time, fewer long awakenings, and better daytime energy.",
    "- Review after 7 days using the tracked notes rather than memory.",
    "",
    "5. Escalation",
    "- If sleep problems persist, worsen, or involve breathing pauses, chest pain, severe mood changes, or unsafe drowsiness, speak with a qualified clinician.",
    "",
    "Next check-in: tell me your usual bedtime, wake time, caffeine timing, and what wakes you up most often, and I will tighten this into a personalised day-by-day plan.",
  ].join("\n");
}

function genericRecoveryPlan(task: TaskForThread) {
  return [
    "Recovery plan",
    "",
    `Context: ${task.intent ?? task.title}`,
    "",
    "1. Stabilise: identify the immediate blocker, stop any action that increases risk, and preserve the current state.",
    "2. Reconstruct: list what was requested, what is missing, what was already attempted, and what evidence exists.",
    "3. Deliver: produce the smallest complete artifact that answers the original intent, then iterate only on explicit changes.",
    "4. Verify: check the artifact against the task objective, constraints, and any SIP approval conditions.",
    "5. Follow up: ask for one concrete correction or approval for the next consequential action.",
  ].join("\n");
}

function titleFromPlan(plan: string, fallback: string) {
  const first = plan
    .split("\n")
    .map((line) => line.replace(/^#+\s*/, "").trim())
    .find(Boolean);
  return first ? first.slice(0, 80) : fallback;
}

function summaryFromPlan(plan: string, fallback: string) {
  const compact = plan.replace(/[#*_`-]/g, "").replace(/\s+/g, " ").trim();
  return compact ? compact.slice(0, 300) : fallback;
}