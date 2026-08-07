import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { resolveChatModel } from "@/lib/ai-gateway.server";

const SuggestInput = z.object({
  name: z.string().max(120).optional().default(""),
  category: z.string().max(40).optional().default(""),
  intentContext: z.string().max(2000).optional().default(""),
  currentIntent: z.string().max(2000).optional().default(""),
  currentRules: z.string().max(2000).optional().default(""),
});

const SuggestSchema = z.object({
  name: z.string(),
  intent: z.string(),
  rules: z.string(),
  adapter: z.enum(["test", "live"]),
  rationale: z.string(),
});

type SuggestDraft = z.infer<typeof SuggestSchema>;

function extractJson(text: string): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  // Strip ```json ... ``` or ``` ... ``` fences
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  // Otherwise, find first { and last }
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) return trimmed.slice(first, last + 1);
  return null;
}

function coerceDraft(raw: unknown, fallbackName: string): SuggestDraft {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const asString = (v: unknown, fb = "") => (typeof v === "string" ? v : v == null ? fb : String(v));
  const adapterRaw = asString(obj.adapter, "test").toLowerCase();
  const adapter: "test" | "live" = adapterRaw === "live" ? "live" : "test";
  return {
    name: asString(obj.name, fallbackName || "Untitled Skill").trim() || fallbackName || "Untitled Skill",
    intent: asString(obj.intent, "").trim(),
    rules: asString(obj.rules, "").trim(),
    adapter,
    rationale: asString(obj.rationale, "AI drafted this skill from your context.").trim().slice(0, 280),
  };
}

function heuristicDraft(input: z.infer<typeof SuggestInput>): SuggestDraft {
  const nm = input.name.trim() || "New Skill";
  const cat = input.category || "General";
  return {
    name: nm,
    intent: `When the user asks to ${nm.toLowerCase()}, gather the required inputs from context and produce a governed proposal for approval.`,
    rules: `requires_approval_if amount > 100; requires_approval_if irreversible = true; requires_approval_if category = "${cat}"`,
    adapter: "test",
    rationale: "Fallback draft — AI response could not be parsed as JSON.",
  };
}

export const suggestSkillDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SuggestInput.parse(d))
  .handler(async ({ data }): Promise<SuggestDraft> => {
    const resolved = resolveChatModel("fast");
    if (!resolved) {
      throw new Error("No LLM configured (set AIXIN_LLM_BASE_URL or LOVABLE_API_KEY)");
    }

    const system = [
      "You are SkillCraft, an expert co-author of governed AI Skills for the AiXin protocol.",
      "A Skill is a small deterministic capability a Specialist Twin runs under a Signal Intent Protocol (SIP) gate.",
      "Rules are checked by deterministic code before execution; use plain semicolon-separated predicates.",
      "Prefer conservative approval gates (requires_approval_if amount > N, requires_approval_if irreversible = true).",
      "Never invent business rules that require external secrets the user has not mentioned.",
      "Tailor the draft to the user's Skill name and any provided intent context — do NOT return a generic template.",
      "",
      "Respond with ONLY a single JSON object (no prose, no markdown fences) matching exactly this shape:",
      `{`,
      `  "name": string (2-4 word verb-noun),`,
      `  "intent": string (1-2 sentences: "When the user says X, do Y."),`,
      `  "rules": string (semicolon-separated predicates; use requires_approval_if <expr> for high-risk gates),`,
      `  "adapter": "test" | "live",`,
      `  "rationale": string (one line, <= 280 chars)`,
      `}`,
    ].join("\n");

    const userPrompt = [
      `Skill name (user is drafting): ${data.name || "(not set yet)"}`,
      `Category: ${data.category || "(unspecified)"}`,
      data.intentContext ? `User's higher-level goal that prompted this Skill:\n${data.intentContext}` : "",
      data.currentIntent ? `Current intent draft:\n${data.currentIntent}` : "",
      data.currentRules ? `Current rules draft:\n${data.currentRules}` : "",
      "",
      "Return a concrete, opinionated draft for THIS skill name. If the name is a Trade Executor, write trade-execution rules — not expense sorting.",
      "Return ONLY the JSON object.",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const { text } = await generateText({
        model: resolved.model,
        system,
        prompt: userPrompt,
      });

      const jsonStr = extractJson(text) ?? text;
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        // Last-chance repair: strip trailing commas
        try {
          parsed = JSON.parse(jsonStr.replace(/,\s*([}\]])/g, "$1"));
        } catch {
          return heuristicDraft(data);
        }
      }
      const draft = coerceDraft(parsed, data.name);
      if (!draft.intent || !draft.rules) {
        const fb = heuristicDraft(data);
        return { ...fb, ...draft, intent: draft.intent || fb.intent, rules: draft.rules || fb.rules };
      }
      return draft;
    } catch (err) {
      console.error("[suggestSkillDraft] AI call failed:", err);
      return heuristicDraft(data);
    }
  });
