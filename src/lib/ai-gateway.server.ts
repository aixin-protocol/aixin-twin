import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

export function createLovableAiGatewayRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  let resolveRunId: (value: string | undefined) => void = () => {};
  let runIdResolved = false;
  const runIdReady = new Promise<string | undefined>((resolve) => {
    resolveRunId = resolve;
  });
  const publishRunId = (value?: string) => {
    const next = value?.trim() || undefined;
    if (!runId && next) runId = next;
    if (!runIdResolved) {
      runIdResolved = true;
      resolveRunId(runId);
    }
  };
  if (runId) publishRunId(runId);
  return {
    fetch: async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) {
        headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      }
      try {
        const response = await fetch(input, { ...init, headers });
        publishRunId(response.headers.get(LOVABLE_AIG_RUN_ID_HEADER) ?? undefined);
        return response;
      } catch (error) {
        publishRunId(undefined);
        throw error;
      }
    },
    getRunId: () => runId,
    waitForRunId: () => (runId ? Promise.resolve(runId) : runIdReady),
  };
}

export function createLovableAiGatewayProvider(lovableApiKey: string, initialRunId?: string) {
  const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);
  const provider = createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    supportsStructuredOutputs: false,
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    fetch: runIdFetch.fetch,
  });
  return Object.assign(provider, {
    getRunId: runIdFetch.getRunId,
    waitForRunId: runIdFetch.waitForRunId,
  });
}

/**
 * "chat"  — Master Twin conversation / task threads (tool calling, long context)
 * "fast"  — short structured generations (outcome artifacts, skill drafts)
 */
export type ModelRole = "chat" | "fast";

const HOSTED_MODELS: Record<ModelRole, string> = {
  chat: "openai/gpt-5.5",
  fast: "google/gemini-2.5-flash",
};

/**
 * Resolve the LLM for a role.
 *
 * Self-hosted (China-friendly) mode: when AIXIN_LLM_BASE_URL is set, every AI
 * feature talks to that OpenAI-compatible endpoint (local Ollama running Qwen,
 * DashScope, DeepSeek, ...) and no Lovable key is needed.
 *
 * Otherwise the hosted Lovable AI Gateway is used, exactly as before.
 *
 * Returns null when neither is configured, so callers can degrade gracefully.
 * Must be called from a server-only boundary (reads process.env).
 */
export function resolveChatModel(role: ModelRole, initialRunId?: string) {
  const localBaseUrl = process.env.AIXIN_LLM_BASE_URL?.trim();
  if (localBaseUrl) {
    const provider = createOpenAICompatible({
      name: "aixin-local",
      baseURL: localBaseUrl,
      apiKey: process.env.AIXIN_LLM_API_KEY?.trim() || "ollama",
      supportsStructuredOutputs: false,
    });
    const modelId = process.env.AIXIN_LLM_MODEL?.trim() || "qwen2.5:7b-instruct";
    return {
      mode: "local" as const,
      modelId,
      model: provider(modelId),
      gateway: undefined,
    };
  }

  const lovableKey = process.env.LOVABLE_API_KEY;
  if (!lovableKey) return null;

  const gateway = createLovableAiGatewayProvider(lovableKey, initialRunId);
  const modelId = HOSTED_MODELS[role];
  return {
    mode: "hosted" as const,
    modelId,
    model: gateway(modelId),
    gateway,
  };
}
