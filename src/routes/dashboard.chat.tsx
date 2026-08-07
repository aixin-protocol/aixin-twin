import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getChatHistory, clearChatHistory } from "@/lib/chat.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Users,
  ShieldAlert,
  ShieldCheck,
  Search,
  Loader2,
  Trash2,
  ArrowRight,
  Brain,
  Check,
  Square,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/chat")({
  component: ChatPage,
  head: () => ({
    meta: [
      { title: "Chat with AiXin — AiXin Master Twin" },
      {
        name: "description",
        content:
          "Talk to your Master Twin. Watch her reason, delegate to Specialist Twins via A2A, and route high-risk actions through the Signal Intent Protocol.",
      },
      { property: "og:title", content: "Chat with AiXin — AiXin Master Twin" },
      {
        property: "og:description",
        content:
          "Every thought, every A2A delegation, every SIP check — visible and receipt-anchored.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const CHAT_HISTORY_KEY = ["chat-history"] as const;

function ChatPage() {
  const fetchHistory = useServerFn(getChatHistory);
  const clearHistoryFn = useServerFn(clearChatHistory);
  const queryClient = useQueryClient();
  const { data: history, isLoading } = useQuery({
    queryKey: CHAT_HISTORY_KEY,
    queryFn: () => fetchHistory(),
    staleTime: Infinity,
  });

  if (isLoading || !history) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading conversation…
      </div>
    );
  }

  return (
    <ChatSurface
      initial={history as unknown as UIMessage[]}
      onClear={async () => {
        await clearHistoryFn();
        await queryClient.invalidateQueries({ queryKey: CHAT_HISTORY_KEY });
      }}
    />
  );
}

function ChatSurface({ initial, onClear }: { initial: UIMessage[]; onClear: () => Promise<void> }) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: async ({ messages, id, body }) => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          const headers: Record<string, string> = {};
          if (token) headers.Authorization = `Bearer ${token}`;
          return {
            body: { id, messages, ...body },
            headers,
          };
        },
      }),
    [],
  );

  const { messages, sendMessage, status, error, stop } = useChat({
    messages: initial,
    transport,
    onError: (err) => {
      const msg = err.message || "Something went wrong";
      if (/402/.test(msg)) toast.error("AI credits exhausted. Add credits in workspace settings.");
      else if (/429/.test(msg)) toast.error("Rate limited. Try again in a moment.");
      else toast.error(msg);
    },
  });

  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);
  useEffect(() => {
    textareaRef.current?.focus();
  }, [status]);

  const busy = status === "submitted" || status === "streaming";

  const submit = () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    sendMessage({ text });
  };

  const suggestions = [
    "Introduce my team and what each Specialist Twin can do.",
    "Book a flight from SFO to Paris for August 14 (budget $650).",
    "Draft and schedule 4 LinkedIn posts about our launch this week.",
    "Any pending decisions I need to review?",
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card/40 px-6 py-4">
        <div className="flex items-center gap-3">
          <AiXinAvatar size={44} active={busy} />
          <div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold">AiXin</div>
              <Badge
                variant="secondary"
                className="border-emerald-500/30 bg-emerald-500/10 text-[10px] font-medium uppercase tracking-widest text-emerald-700"
              >
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {busy ? "Working" : "Active"}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Master Twin · orchestrates Specialists via A2A · gated by SIP
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground">
          <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear
        </Button>
      </div>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8">
          {messages.length === 0 ? (
            <EmptyState onPick={(s) => setInput(s)} suggestions={suggestions} />
          ) : (
            <div className="space-y-6">
              {messages.map((m, idx) => (
                <MessageRow
                  key={m.id}
                  message={m}
                  isLast={idx === messages.length - 1}
                  streaming={busy && idx === messages.length - 1}
                />
              ))}
              {status === "submitted" && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-3">
                  <AiXinAvatar size={32} active />
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    <span className="italic">AiXin is thinking…</span>
                  </div>
                </div>
              )}
              {error && (
                <Card className="border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                  {error.message}
                </Card>
              )}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-card/40 px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 shadow-sm focus-within:border-primary/40">
            <Textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Ask AiXin to do something — book a flight, publish a post, pay an invoice…"
              className="min-h-[44px] max-h-40 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm shadow-none focus-visible:ring-0"
              disabled={busy}
            />
            {busy ? (
              <Button size="icon" variant="ghost" onClick={stop} title="Stop">
                <Square className="h-3.5 w-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={submit}
                disabled={!input.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="mt-2 text-center text-[11px] text-muted-foreground">
            AiXin proposes. SIP validates. High-risk actions pause for your approval.
          </div>
        </div>
      </div>
    </div>
  );
}

function AiXinAvatar({ size = 40, active = false }: { size?: number; active?: boolean }) {
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      {active && (
        <span
          className="absolute inset-0 animate-ping rounded-full bg-primary/30"
          aria-hidden
        />
      )}
      <div
        className={`relative grid h-full w-full place-items-center rounded-full bg-gradient-coral font-display font-semibold text-primary-foreground ring-2 ${
          active ? "ring-primary/60" : "ring-primary/20"
        }`}
        style={{ fontSize: size * 0.4 }}
      >
        A
      </div>
    </div>
  );
}

function EmptyState({
  onPick,
  suggestions,
}: {
  onPick: (s: string) => void;
  suggestions: string[];
}) {
  return (
    <div className="mx-auto max-w-2xl py-12 text-center">
      <AiXinAvatar size={64} />
      <h1 className="mt-4 font-display text-2xl font-semibold">Talk to your Master Twin</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        AiXin will reason out loud, delegate to the right Specialist via A2A, and route high-risk actions through
        the Signal Intent Protocol for your approval — every step visible, every action receipted.
      </p>
      <div className="mt-8 grid gap-2 text-left">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="group flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm transition hover:border-primary/40 hover:bg-card/70"
          >
            <span>{s}</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  );
}

type Part = UIMessage["parts"][number];

function MessageRow({
  message,
  isLast,
  streaming,
}: {
  message: UIMessage;
  isLast: boolean;
  streaming: boolean;
}) {
  if (message.role === "user") {
    const text = message.parts
      .filter((p): p is Extract<Part, { type: "text" }> => p.type === "text")
      .map((p) => p.text)
      .join("");
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm">
          {text}
        </div>
      </div>
    );
  }

  const toolParts = message.parts.filter((p) => p.type.startsWith("tool-")) as ToolUIPart[];
  const reasoningParts = message.parts.filter(
    (p): p is Extract<Part, { type: "reasoning" }> => p.type === "reasoning",
  );
  const textParts = message.parts.filter(
    (p): p is Extract<Part, { type: "text" }> => p.type === "text",
  );
  const hasThinking = toolParts.length > 0 || reasoningParts.length > 0;

  return (
    <div className="flex gap-3">
      <AiXinAvatar size={32} active={streaming && isLast} />
      <div className="min-w-0 flex-1 space-y-3">
        {hasThinking && (
          <TwinAtWork
            tools={toolParts}
            reasoning={reasoningParts.map((r) => r.text).join("\n\n")}
            live={streaming && isLast}
          />
        )}
        {textParts.map((p, i) => (
          <div
            key={i}
            className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground"
          >
            {p.text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Twin at Work panel ----

function TwinAtWork({
  tools,
  reasoning,
  live,
}: {
  tools: ToolUIPart[];
  reasoning: string;
  live: boolean;
}) {
  const [open, setOpen] = useState(live);
  useEffect(() => {
    if (live) setOpen(true);
  }, [live]);

  const activeIdx = tools.findIndex(
    (t) => t.state === "input-streaming" || t.state === "input-available",
  );
  const doneCount = tools.filter((t) => t.state === "output-available").length;

  return (
    <Card className="overflow-hidden border-border/70 bg-card/50 p-0 shadow-none">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left"
      >
        <div className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
          <Brain className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1">
          <div className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Twin at Work
          </div>
          <div className="text-xs text-foreground">
            {live
              ? tools[activeIdx]
                ? (TOOL_META[tools[activeIdx].type]?.label ?? "Working…")
                : "Reasoning…"
              : `${tools.length || (reasoning ? 1 : 0)} step${
                  (tools.length || 1) === 1 ? "" : "s"
                } · ${doneCount} complete`}
          </div>
        </div>
        {live && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="relative border-t border-border/60 bg-background/40 px-4 py-4">
          <div className="absolute bottom-6 left-[26px] top-6 w-px bg-border" aria-hidden />
          <ol className="space-y-3">
            {reasoning?.trim() && (
              <StepRow
                icon={<Brain className="h-3 w-3" />}
                label="Reasoning"
                state="done"
                detail={reasoning}
                mono
              />
            )}
            {tools.map((tool, i) => {
              const meta = TOOL_META[tool.type] ?? {
                label: tool.type.replace(/^tool-/, ""),
                icon: Sparkles,
              };
              const Icon = meta.icon;
              const state: StepState =
                tool.state === "output-available"
                  ? "done"
                  : tool.state === "output-error"
                    ? "error"
                    : i === activeIdx
                      ? "active"
                      : "pending";
              return (
                <StepRow
                  key={tool.toolCallId + i}
                  icon={<Icon className="h-3 w-3" />}
                  label={meta.label}
                  state={state}
                  detail={<ToolDetail part={tool} />}
                />
              );
            })}
          </ol>
        </div>
      )}
    </Card>
  );
}

type StepState = "pending" | "active" | "done" | "error";

function StepRow({
  icon,
  label,
  state,
  detail,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  state: StepState;
  detail?: React.ReactNode;
  mono?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const badge =
    state === "done" ? (
      <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
        <Check className="h-3 w-3" />
      </span>
    ) : state === "active" ? (
      <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
      </span>
    ) : state === "error" ? (
      <span className="grid h-5 w-5 place-items-center rounded-full bg-destructive/15 text-destructive">
        <ShieldAlert className="h-3 w-3" />
      </span>
    ) : (
      <span className="grid h-5 w-5 place-items-center rounded-full border border-border bg-background text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40" />
      </span>
    );

  return (
    <li className="relative pl-8">
      <span className="absolute left-0 top-0">{badge}</span>
      <button
        onClick={() => detail && setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-left"
        disabled={!detail}
      >
        <span className="text-muted-foreground">{icon}</span>
        <span className={`text-[13px] ${state === "active" ? "font-medium text-foreground" : "text-foreground"}`}>
          {label}
        </span>
        {state === "active" && (
          <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-primary">
            NOW
          </span>
        )}
        {detail && (
          <ChevronRight
            className={`ml-auto h-3 w-3 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
          />
        )}
      </button>
      {open && detail && (
        <div className={`mt-2 text-xs text-muted-foreground ${mono ? "whitespace-pre-wrap leading-relaxed" : ""}`}>
          {detail}
        </div>
      )}
    </li>
  );
}

// ---- Tool part types ----
type ToolUIPart = {
  type: `tool-${string}`;
  toolCallId: string;
  state:
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error"
    | "output-denied";
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

const TOOL_META: Record<string, { label: string; icon: typeof Users }> = {
  "tool-list_specialists": { label: "Reading your team", icon: Users },
  "tool-search_marketplace": { label: "Searching the Skill Marketplace", icon: Search },
  "tool-delegate_to_specialist": { label: "A2A · Delegating to Specialist", icon: ArrowRight },
  "tool-get_pending_decisions": { label: "Checking pending Decision Cards", icon: ShieldCheck },
};

function ToolDetail({ part }: { part: ToolUIPart }) {
  if (part.type === "tool-delegate_to_specialist" && part.state === "output-available") {
    return <DelegateSummary output={part.output as DelegateOutput} />;
  }
  if (part.type === "tool-list_specialists" && part.state === "output-available") {
    return <TeamSummary output={part.output as TeamMember[]} />;
  }
  return (
    <div className="space-y-2">
      {part.input != null && (
        <pre className="overflow-x-auto rounded bg-muted/60 p-2 text-[11px] leading-relaxed">
          {JSON.stringify(part.input, null, 2)}
        </pre>
      )}
      {part.state === "output-available" && (
        <pre className="overflow-x-auto rounded bg-muted/60 p-2 text-[11px] leading-relaxed">
          {JSON.stringify(part.output, null, 2)}
        </pre>
      )}
      {part.state === "output-error" && part.errorText && (
        <div className="text-destructive">{part.errorText}</div>
      )}
    </div>
  );
}

type TeamMember = { id: string; name: string; role: string; type: string; skills: string[] };
function TeamSummary({ output }: { output: TeamMember[] }) {
  if (!Array.isArray(output) || output.length === 0) return null;
  return (
    <div className="grid gap-1.5">
      {output.map((s) => (
        <div key={s.id} className="flex items-center justify-between">
          <div>
            <span className="font-medium text-foreground">{s.name}</span>
            <span className="text-muted-foreground"> · {s.role}</span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {s.skills?.length ?? 0} skill{s.skills?.length === 1 ? "" : "s"}
          </span>
        </div>
      ))}
    </div>
  );
}

type DelegateOutput = {
  specialist: string;
  specialistType?: string;
  task: string;
  sip: {
    sipId: string;
    risk: "low" | "medium" | "high";
    requiresApproval: boolean;
    reasons: string[];
  };
  decisionCardId: string | null;
  taskId: string;
  nextStep: string;
};

function DelegateSummary({ output }: { output: DelegateOutput }) {
  const risk = output.sip.risk;
  const riskColor =
    risk === "high"
      ? "bg-destructive/10 text-destructive border-destructive/30"
      : risk === "medium"
        ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
        : "bg-emerald-500/10 text-emerald-700 border-emerald-500/30";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ArrowRight className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium text-foreground">Master Twin → {output.specialist}</span>
        {output.specialistType && (
          <Badge variant="secondary" className="text-[10px]">
            {output.specialistType}
          </Badge>
        )}
      </div>
      <div className="rounded-md bg-muted/40 px-2 py-1.5">"{output.task}"</div>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest ${riskColor}`}
        >
          <ShieldAlert className="h-3 w-3" /> SIP · {risk} risk
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">{output.sip.sipId}</span>
      </div>
      {output.sip.reasons.length > 0 && (
        <ul className="ml-4 list-disc space-y-0.5">
          {output.sip.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
      {output.decisionCardId ? (
        <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 px-2.5 py-2">
          <div>
            <div className="font-medium text-foreground">Decision Card created</div>
            <div className="text-[11px] text-muted-foreground">
              High-risk action paused for your approval.
            </div>
          </div>
          <Button asChild size="sm" className="h-7">
            <Link to="/dashboard/governance">Review →</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-2.5 py-1.5 text-emerald-700">
          Executed autonomously — receipt available in the Reputation Ledger.
        </div>
      )}
    </div>
  );
}
