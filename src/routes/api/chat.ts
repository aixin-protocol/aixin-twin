import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, tool, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";
import { resolveChatModel } from "@/lib/ai-gateway.server";

type ChatBody = { messages?: unknown };

const SYSTEM_PROMPT = `You are AiXin, the Master Twin for the AiXin trust platform. You are the single accountable orchestrator for a user's team of Specialist Twins (Marco: Travel, Nova: Marketing, Ledger: Finance, Iris: Support, plus any custom specialists).

Your job:
- Understand the user's goal in natural language.
- Think step-by-step. Explain your reasoning briefly before acting.
- Delegate to the RIGHT specialist via A2A using the delegate_to_specialist tool. Match the task to the specialist's role.
- Every consequential action (spending money, booking, publishing, moving funds) runs through the Signal Intent Protocol (SIP). Deterministic rules decide the risk tier; HIGH risk actions produce a Decision Card that the human must approve — you cannot bypass it.
- Cite evidence: reference specialist names, skills, and (after approval) BSC Testnet transaction hashes and ERC-8004 events.
- Keep messages concise. Use short paragraphs and bullets.

Style: warm, competent, direct. Never invent transaction hashes or receipts — only reference values returned by tools.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("Authorization") ?? "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
        if (!token) return new Response("Unauthorized", { status: 401 });

        const supabaseUrl = process.env.SUPABASE_URL;
        const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!supabaseUrl || !publishableKey) return new Response("Server misconfigured", { status: 500 });
        const resolved = resolveChatModel("chat");
        if (!resolved) {
          return new Response("No LLM configured (set AIXIN_LLM_BASE_URL or LOVABLE_API_KEY)", {
            status: 500,
          });
        }

        const supabase = createClient(supabaseUrl, publishableKey, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr || !userData?.user) return new Response("Unauthorized", { status: 401 });
        const userId = userData.user.id;

        const body = (await request.json()) as ChatBody;
        if (!Array.isArray(body.messages)) return new Response("messages required", { status: 400 });
        const incoming = body.messages as UIMessage[];

        // Persist the latest user message (idempotent by (user_id, message_id))
        const lastUser = [...incoming].reverse().find((m) => m.role === "user");
        if (lastUser) {
          await supabase.from("chat_messages").upsert(
            {
              user_id: userId,
              message_id: lastUser.id,
              role: "user",
              parts: lastUser.parts as unknown as object,
            },
            { onConflict: "user_id,message_id" },
          );
        }

        const model = resolved.model;

        const tools = {
          list_specialists: tool({
            description:
              "List all Specialist Twins on the user's team, with their role, type, reputation, and assigned skills.",
            inputSchema: z.object({}),
            execute: async () => {
              const [{ data: specs }, { data: assignments }, { data: skills }] = await Promise.all([
                supabase
                  .from("specialist_twins")
                  .select("id, name, role, type, initials, reputation, status")
                  .eq("user_id", userId)
                  .order("created_at"),
                supabase.from("skill_assignments").select("skill_id, specialist_id").eq("user_id", userId),
                supabase.from("skills").select("id, name, category").eq("is_public", true),
              ]);
              const skillMap = new Map((skills ?? []).map((s) => [s.id, s]));
              return (specs ?? []).map((s) => ({
                id: s.id,
                name: s.name,
                role: s.role,
                type: s.type,
                reputation: s.reputation,
                status: s.status,
                skills: (assignments ?? [])
                  .filter((a) => a.specialist_id === s.id)
                  .map((a) => skillMap.get(a.skill_id)?.name)
                  .filter(Boolean),
              }));
            },
          }),
          search_marketplace: tool({
            description:
              "Search the Skill Marketplace for skills the user has NOT yet installed. Useful when the user asks for a capability the team doesn't have.",
            inputSchema: z.object({
              query: z.string().describe("keywords to match against skill names or descriptions"),
            }),
            execute: async ({ query }) => {
              const { data: installs } = await supabase
                .from("skill_installs")
                .select("skill_id")
                .eq("user_id", userId);
              const installed = new Set((installs ?? []).map((i) => i.skill_id));
              const { data: skills } = await supabase
                .from("skills")
                .select("id, name, category, description, price")
                .eq("is_public", true)
                .limit(200);
              const q = query.toLowerCase();
              return (skills ?? [])
                .filter((s) => !installed.has(s.id))
                .filter(
                  (s) =>
                    s.name.toLowerCase().includes(q) ||
                    (s.description ?? "").toLowerCase().includes(q) ||
                    (s.category ?? "").toLowerCase().includes(q),
                )
                .slice(0, 8);
            },
          }),
          delegate_to_specialist: tool({
            description:
              "Delegate a task to one Specialist Twin via A2A. The Signal Intent Protocol validates the intent and, if it is high-risk (e.g. spending money, booking non-refundable, publishing to a live channel, moving funds), a Decision Card is created for the human to approve on the Governance page. This tool NEVER executes a high-risk action directly — it always returns the SIP report.",
            inputSchema: z.object({
              specialistId: z.string().uuid().describe("id from list_specialists"),
              task: z.string().min(3).describe("natural-language task for the specialist"),
              amount: z
                .number()
                .optional()
                .describe("monetary amount in USD if the action spends money"),
              action: z
                .enum([
                  "book_flight",
                  "book_hotel",
                  "publish_post",
                  "send_email",
                  "transfer_funds",
                  "generate_report",
                  "analyze",
                  "schedule",
                ])
                .describe("normalized action verb — pick the closest match"),
            }),
            execute: async ({ specialistId, task, amount, action }) => {
              const { validateIntent } = await import("@/lib/sip.server");
              const intent = {
                action,
                params: { task, ...(amount !== undefined ? { amount } : {}) },
                ...(amount !== undefined ? { amount } : {}),
              } as Record<string, unknown>;
              const report = validateIntent(intent);

              const { data: specialist } = await supabase
                .from("specialist_twins")
                .select("id, name, type")
                .eq("id", specialistId)
                .maybeSingle();

              const { data: taskRow, error: taskErr } = await supabase
                .from("tasks")
                .insert({
                  user_id: userId,
                  specialist_id: specialistId,
                  title: task.slice(0, 80),
                  intent: task,
                  intent_json: intent as unknown as never,
                  value: report.risk,
                  status: "pending",
                })
                .select("id")
                .single();
              if (taskErr) throw new Error(taskErr.message);

              let decisionCardId: string | null = null;
              if (report.requires_approval) {
                const { data: card, error: cardErr } = await supabase
                  .from("decision_cards")
                  .insert({
                    user_id: userId,
                    task_id: taskRow.id,
                    specialist_id: specialistId,
                    risk: report.risk,
                    requestor: "AiXin (Master Twin)",
                    specialist_name: specialist?.name ?? "Specialist",
                    title: task.slice(0, 80),
                    detail: report.reasons.join("; ") || `${action} delegated via chat`,
                    amount: amount ?? null,
                    status: "pending",
                    sip_report: report as unknown as never,
                  })
                  .select("id")
                  .single();
                if (cardErr) throw new Error(cardErr.message);
                decisionCardId = card.id;
              } else {
                // No approval needed — actually run the task so it doesn't sit
                // in "pending" with no Decision Card for the user to act on.
                try {
                  const { runExecution } = await import("@/lib/execution.server");
                  await runExecution(
                    supabase as never,
                    userId,
                    taskRow.id,
                    task,
                    intent,
                    specialist?.type ?? "general",
                    report.sip_id,
                    null,
                  );
                } catch (e) {
                  console.error("[chat delegate] auto-execute failed", e);
                  await supabase.from("tasks").update({ status: "done" }).eq("id", taskRow.id);
                }
              }

              return {
                specialist: specialist?.name ?? "Specialist",
                specialistType: specialist?.type,
                task,
                sip: {
                  sipId: report.sip_id,
                  risk: report.risk,
                  requiresApproval: report.requires_approval,
                  reasons: report.reasons,
                },
                decisionCardId,
                taskId: taskRow.id,
                nextStep: report.requires_approval
                  ? "Awaiting human approval on the Governance page."
                  : "Executed autonomously; receipt available in Reputation Ledger.",
              };
            },
          }),
          get_pending_decisions: tool({
            description: "List pending Decision Cards awaiting the user's approval.",
            inputSchema: z.object({}),
            execute: async () => {
              const { data } = await supabase
                .from("decision_cards")
                .select("id, risk, title, detail, amount, specialist_name, created_at")
                .eq("user_id", userId)
                .eq("status", "pending")
                .order("created_at", { ascending: false })
                .limit(10);
              return data ?? [];
            },
          }),
        };

        const modelMessages = await convertToModelMessages(incoming);
        const result = streamText({
          model,
          system: SYSTEM_PROMPT,
          messages: modelMessages,
          tools,
          stopWhen: stepCountIs(50),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: incoming,
          onFinish: async ({ messages }) => {
            const assistant = [...messages].reverse().find((m) => m.role === "assistant");
            if (!assistant) return;
            await supabase.from("chat_messages").upsert(
              {
                user_id: userId,
                message_id: assistant.id,
                role: "assistant",
                parts: assistant.parts as unknown as object,
              },
              { onConflict: "user_id,message_id" },
            );
          },
        });
      },
    },
  },
});
