import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { listTasks, deleteTask, resetDemoData } from "@/lib/tasks.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TelegramCard } from "@/components/dashboard/TelegramCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Radio,
  Play,
  MessageSquare,
  Trash2,
  RotateCcw,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/tasks/")({
  component: TasksPage,
  head: () => ({
    meta: [
      { title: "Tasks · AiXin" },
      { name: "description", content: "Every task your twins have run — with the full SIP trace, decision cards, and on-chain receipts." },
      { property: "og:title", content: "Tasks · AiXin" },
      { property: "og:description", content: "Persistent, auditable history of every intent your twins have executed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type TaskRow = {
  id: string;
  title: string;
  intent: string | null;
  status: string;
  value: string | null;
  created_at: string;
  specialist_id: string | null;
};

function TasksPage() {
  const fetchTasks = useServerFn(listTasks);
  const removeTask = useServerFn(deleteTask);
  const wipeAll = useServerFn(resetDemoData);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const reload = async () => {
    const rows = (await fetchTasks()) as TaskRow[];
    setTasks(rows);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const rows = (await fetchTasks()) as TaskRow[];
      if (mounted) {
        setTasks(rows);
        setLoading(false);
      }
    })();
    const ch = supabase
      .channel("tasks:list")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, async () => {
        const rows = (await fetchTasks()) as TaskRow[];
        setTasks(rows);
      })
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, [fetchTasks]);

  const onDelete = async (id: string) => {
    setBusyId(id);
    try {
      await removeTask({ data: { taskId: id } });
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success("Task deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const onReset = async () => {
    setResetting(true);
    try {
      await wipeAll();
      await reload();
      toast.success("Demo data reset — ready for a fresh run.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-2 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Every intent your twins have run. Persistent trace · signed receipts · on-chain proofs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={resetting || tasks.length === 0}>
                {resetting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="mr-1.5 h-3.5 w-3.5" />}
                Reset demo data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset demo data?</AlertDialogTitle>
                <AlertDialogDescription>
                  Deletes every task, decision card, receipt, reputation entry, and chat message on this account. Your twins, skills, and integrations stay intact. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onReset}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard/ask">
              New goal <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : tasks.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No tasks yet. Start one from Ask AiXin.</p>
              <Button asChild className="mt-4">
                <Link to="/dashboard/ask">Ask AiXin</Link>
              </Button>
            </Card>
          ) : (
            tasks.map((t) => (
              <div
                key={t.id}
                className="group relative rounded-lg border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
              >
                <Link
                  to="/dashboard/tasks/$id"
                  params={{ id: t.id }}
                  className="block"
                >
                  <div className="flex items-center justify-between gap-2 pr-8">
                    <StatusPill status={t.status} />
                    <span className="font-mono text-[10px] text-muted-foreground">{t.id.slice(0, 8)}</span>
                  </div>
                  <div className="mt-2 truncate pr-8 text-sm font-medium">{t.title}</div>
                  <div className="mt-0.5 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{new Date(t.created_at).toLocaleString()}</span>
                    <span className="inline-flex items-center gap-1 text-primary">
                      Open <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      aria-label="Delete task"
                      className="absolute right-2 top-2 rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus:opacity-100"
                      disabled={busyId === t.id}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {busyId === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Removes the task, its trace, decision card, outcome, chat, and any linked receipt. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(t.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3">
          <TelegramCard />
          <Card className="p-4 text-xs text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
              <MessageSquare className="h-3.5 w-3.5 text-primary" /> Follow-up thread
            </div>
            Every task has a persistent chat with your Master Twin. Open a task to chat, or reply on Telegram once linked.
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
    pending: { label: "pending", cls: "border-amber-500/40 bg-amber-500/10 text-amber-700", icon: Clock },
    running: { label: "running", cls: "border-primary/40 bg-primary/10 text-primary", icon: Radio },
    executing: { label: "executing", cls: "border-primary/40 bg-primary/10 text-primary", icon: Play },
    awaiting_input: { label: "awaiting input", cls: "border-amber-500/40 bg-amber-500/10 text-amber-700", icon: Clock },
    done: { label: "done", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700", icon: CheckCircle2 },
    rejected: { label: "rejected", cls: "border-destructive/40 bg-destructive/10 text-destructive", icon: XCircle },
  };
  const v = map[status] ?? map.pending;
  const Icon = v.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${v.cls}`}>
      <Icon className="h-3 w-3" /> {v.label}
    </span>
  );
}
