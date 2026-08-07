import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getTaskDetail } from "@/lib/tasks.functions";
import { getTaskThread, postTaskMessage, markThreadRead } from "@/lib/task-thread.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  MessageSquare,
  ExternalLink,
  Package,
  Activity,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/tasks/$id")({
  component: TaskDetailPage,
  head: () => ({
    meta: [
      { title: "Task · AiXin" },
      { name: "description", content: "Task outcome, live trace, and follow-up thread with your Master Twin." },
      { property: "og:title", content: "Task · AiXin" },
      { property: "og:description", content: "Outcome, trace, and follow-up chat." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Detail = Awaited<ReturnType<typeof getTaskDetail>>;
type Thread = Awaited<ReturnType<typeof getTaskThread>>;

function TaskDetailPage() {
  const { id: taskId } = Route.useParams();
  const fetchDetail = useServerFn(getTaskDetail);
  const fetchThread = useServerFn(getTaskThread);
  const markRead = useServerFn(markThreadRead);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);

  const refresh = async () => {
    const [d, th] = await Promise.all([
      fetchDetail({ data: { taskId } }),
      fetchThread({ data: { taskId } }),
    ]);
    setDetail(d as Detail);
    setThread(th as Thread);
  };

  useEffect(() => {
    refresh();
    markRead({ data: { taskId } }).catch(() => {});
    const ch = supabase
      .channel(`task:${taskId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "task_events", filter: `task_id=eq.${taskId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "task_messages", filter: `task_id=eq.${taskId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "task_outcomes", filter: `task_id=eq.${taskId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `id=eq.${taskId}` }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  if (!detail || !thread) {
    return (
      <div className="mx-auto max-w-5xl p-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      </div>
    );
  }
  if (!detail.task) {
    return <div className="mx-auto max-w-5xl p-8 text-sm text-muted-foreground">Task not found.</div>;
  }

  const outcome = thread.outcome;
  const receipt = detail.receipt as { tx_hash?: string | null; anchor_status?: string | null } | null;
  const bscUrl = receipt?.anchor_status === "anchored" && receipt.tx_hash
    ? `https://testnet.bscscan.com/tx/${receipt.tx_hash}` : null;

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-2 py-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard/tasks"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> All tasks</Link>
        </Button>
        <Badge variant="outline" className="font-mono text-[10px] uppercase">
          {detail.task.status}
        </Badge>
      </div>

      <Card className="p-5">
        <div className="text-sm font-semibold">{detail.task.title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{detail.task.intent}</div>
      </Card>

      {/* Outcome artifact */}
      {outcome ? (
        <Card className="border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary">
            <Package className="h-3.5 w-3.5" /> Outcome
          </div>
          <div className="mt-2 font-display text-lg font-semibold">{outcome.title}</div>
          <p className="mt-1 whitespace-pre-line text-sm text-foreground/90">{outcome.summary}</p>

          <details className="mt-3 rounded-lg border border-border bg-background/60 p-3">
            <summary className="cursor-pointer text-xs font-medium">Artifact JSON</summary>
            <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
              {JSON.stringify(outcome.artifact, null, 2)}
            </pre>
          </details>

          {Array.isArray(outcome.next_actions) && outcome.next_actions.length > 0 && (
            <div className="mt-3">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Suggested next actions</div>
              <ul className="mt-1 space-y-1">
                {(outcome.next_actions as string[]).map((n, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 text-primary" /> {n}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {bscUrl && (
            <a
              href={bscUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Signed receipt on BscScan <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </Card>
      ) : detail.task.status === "executing" ? (
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" /> Twin is executing… outcome will appear here.
          </div>
        </Card>
      ) : null}

      {/* Follow-up thread */}
      <Card className="p-5">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" /> Chat with Master Twin about this task
        </div>
        <ThreadView messages={thread.messages} taskId={taskId} onSent={refresh} />
      </Card>

      {/* Trace */}
      <Card className="p-5">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          <Activity className="h-3.5 w-3.5" /> Trace · {detail.events.length} events
        </div>
        <ol className="mt-3 space-y-2">
          {detail.events.map((e) => (
            <li key={e.id} className="flex items-start gap-3 rounded-lg border border-border/60 px-3 py-2">
              <span className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">#{e.seq}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{e.title}</span>
                  <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-widest">{e.phase}</Badge>
                  {e.chip && (
                    <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-widest">{e.chip}</Badge>
                  )}
                </div>
                {e.detail && <div className="mt-0.5 whitespace-pre-line text-xs text-muted-foreground">{e.detail}</div>}
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function ThreadView({
  messages,
  taskId,
  onSent,
}: {
  messages: Thread["messages"];
  taskId: string;
  onSent: () => void;
}) {
  const send = useServerFn(postTaskMessage);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const submit = async () => {
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      await send({ data: { taskId, body: body.trim() } });
      setBody("");
      await onSent();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-3">
      <div
        ref={scrollRef}
        className="max-h-96 space-y-2 overflow-y-auto rounded-lg border border-border/60 bg-background/50 p-3"
      >
        {messages.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            Ask your Master Twin anything about this task.
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                m.sender === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground"
              }`}
            >
              <div className="whitespace-pre-line">{m.body}</div>
              <div className="mt-1 flex items-center gap-1 text-[9px] uppercase tracking-widest opacity-60">
                {m.source === "telegram" && "· telegram"}
                {m.sender === "twin" && <CheckCircle2 className="h-2.5 w-2.5" />}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Ask a follow-up, request a change…"
          rows={2}
          className="flex-1 resize-none"
        />
        <Button onClick={submit} disabled={sending || !body.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
