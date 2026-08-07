import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Zap, FileText, ArrowLeft, Send, Loader2, Pencil, Plus, X, Info } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  delegateTask,
  updateSpecialist,
  assignSkill,
  unassignSkill,
} from "@/lib/workspace.functions";
import { WORKSPACE_QUERY_KEY } from "./dashboard";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/specialists/$id")({
  component: SpecialistDetailPage,
  head: () => ({
    meta: [
      { title: "Specialist Twin · AiXin" },
      { name: "description", content: "Specialist Twin detail view with assigned skills, tasks, and signed SIP log." },
      { property: "og:title", content: "Specialist Twin · AiXin" },
      { property: "og:description", content: "Specialist Twin detail view with assigned skills, tasks, and signed SIP log." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function SpecialistDetailPage() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const { state } = useWorkspace();
  const specialist = state.specialists.find((s) => s.id === id);
  if (!state.hydrated) {
    return (
      <div className="mx-auto grid min-h-[50vh] max-w-5xl place-items-center text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading Specialist Twin…
        </div>
      </div>
    );
  }
  if (!specialist) throw notFound();

  const assignedSet = new Set(specialist.assignedSkills);
  const assignedSkills = state.skills.filter((s) => assignedSet.has(s.id));
  // Assignable = anything the user can already use: installed skills OR skills
  // they authored (drafts/live, public/private). Skip already-assigned ones.
  const availableSkills = state.skills.filter(
    (s) => (s.installed || s.isMine) && !assignedSet.has(s.id),
  );
  const tasks = specialist.delegatedTasks;
  const logs = specialist.actionLog;

  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link to="/dashboard/specialists"><ArrowLeft className="mr-2 h-4 w-4" /> {t("spec.back")}</Link>
      </Button>

      <Card className="overflow-hidden border-0 bg-gradient-hero-dark text-sidebar-foreground shadow-warm">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div
              className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-primary font-display text-2xl font-semibold text-primary-foreground"
            >
              {specialist.initials}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-semibold">{specialist.name}</h1>
                <Badge className="border-sidebar-border/60 bg-sidebar-accent/60 text-sidebar-foreground/90">{specialist.role}</Badge>
              </div>
              <p className="mt-1 text-sm text-sidebar-foreground/70">{specialist.type} · {t("spec.status")}: {specialist.status}</p>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <span><Star className="mr-1 inline h-3.5 w-3.5 fill-warning text-warning" /> {specialist.reputation.toFixed(1)}</span>
                <span className="text-success font-medium">${specialist.earned.toLocaleString()} {t("spec.earned")}</span>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="bg-sidebar-accent/60 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="font-display font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" /> {t("spec.assignedSkills")}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setAddOpen(true)}
                  disabled={availableSkills.length === 0}
                >
                  <Plus className="mr-1 h-3 w-3" /> Add
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                {assignedSkills.length ? assignedSkills.map((s) => (
                  <AssignedSkillRow key={s.id} skillId={s.id} name={s.name} provider={s.provider} specialistId={specialist.id} />
                )) : <p className="text-sm text-muted-foreground">{t("spec.noSkills")}</p>}
              </div>
              {availableSkills.length === 0 && assignedSkills.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  All installed skills assigned. Install more from the{" "}
                  <Link to="/dashboard/skills" className="underline hover:text-foreground">Marketplace</Link>.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="font-display font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{t("spec.tasks")}</span>
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="What are delegated tasks?">
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>{t("spec.tasksHint")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <DelegateForm specialistId={specialist.id} />
              <div className="mt-3 space-y-2">
                {tasks.length ? tasks.map((task) => (
                  <Link
                    key={task.id}
                    to="/dashboard/tasks/$id"
                    params={{ id: task.id }}
                    className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:bg-secondary/50"
                  >
                    <div>
                      <div className="font-medium">{task.title}</div>
                      <div className="text-xs text-muted-foreground">{task.status}</div>
                    </div>
                    {task.value && <Badge variant="outline" className="text-[10px]">{task.value}</Badge>}
                  </Link>
                )) : <p className="text-sm text-muted-foreground">{t("spec.noTasks")}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="font-display font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> {t("spec.sipLog")}</div>
              <div className="mt-3 space-y-2">
                {logs.length ? logs.map((log) => (
                  <div key={log.id} className="rounded-md border border-border bg-secondary/50 p-3 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{log.action}</span>
                      <span className="text-muted-foreground">{log.time}</span>
                    </div>
                    <div className="mt-1 text-muted-foreground">{log.sipId}</div>
                    <div className="mt-1 truncate text-success">{log.receiptHash}</div>
                  </div>
                )) : <p className="text-sm text-muted-foreground">{t("spec.noLogs")}</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <EditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        specialist={specialist}
      />
      <AddSkillDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        specialistId={specialist.id}
        available={availableSkills}
      />
    </div>
  );
}

function AssignedSkillRow({
  skillId,
  name,
  provider,
  specialistId,
}: {
  skillId: string;
  name: string;
  provider: string;
  specialistId: string;
}) {
  const unassign = useServerFn(unassignSkill);
  const queryClient = useQueryClient();
  const mut = useMutation({
    mutationFn: () => unassign({ data: { skillId, specialistId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEY });
      toast.success("Skill removed");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  return (
    <div className="group flex items-center justify-between rounded-md border border-border bg-secondary p-2.5 text-sm">
      <div className="min-w-0">
        <div className="truncate font-medium">{name}</div>
        <div className="truncate text-xs text-muted-foreground">{provider}</div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-60 hover:opacity-100"
        disabled={mut.isPending}
        onClick={() => mut.mutate()}
        aria-label={`Remove ${name}`}
      >
        {mut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
      </Button>
    </div>
  );
}

function AddSkillDialog({
  open,
  onOpenChange,
  specialistId,
  available,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  specialistId: string;
  available: ReturnType<typeof useWorkspace>["state"]["skills"];
}) {
  const assign = useServerFn(assignSkill);
  const queryClient = useQueryClient();
  const mut = useMutation({
    mutationFn: (skillId: string) => assign({ data: { skillId, specialistId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEY });
      toast.success("Skill assigned");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign a skill</DialogTitle>
          <DialogDescription>Choose from your installed skills.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] space-y-2 overflow-y-auto py-2">
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No installed skills available. Install skills from the Marketplace first.
            </p>
          ) : (
            available.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-md border border-border p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{s.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{s.category} · {s.provider}</div>
                </div>
                <Button size="sm" disabled={mut.isPending} onClick={() => mut.mutate(s.id)}>
                  {mut.isPending && mut.variables === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Assign"}
                </Button>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  open,
  onOpenChange,
  specialist,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  specialist: ReturnType<typeof useWorkspace>["state"]["specialists"][0];
}) {
  const [name, setName] = useState(specialist.name);
  const [role, setRole] = useState(specialist.role);
  const [type, setType] = useState(specialist.type);
  const [status, setStatus] = useState<"active" | "paused" | "retired">(specialist.status);

  const update = useServerFn(updateSpecialist);
  const queryClient = useQueryClient();
  const mut = useMutation({
    mutationFn: () =>
      update({ data: { specialistId: specialist.id, name: name.trim(), role: role.trim(), type: type.trim(), status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEY });
      toast.success("Specialist updated");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Specialist</DialogTitle>
          <DialogDescription>Change name, role, type, or status.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="sp-name">Name</Label>
            <Input id="sp-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="sp-role">Role</Label>
            <Input id="sp-role" value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="sp-type">Type</Label>
            <Input id="sp-type" value={type} onChange={(e) => setType(e.target.value)} placeholder="Travel, Finance, Custom…" />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending || !name.trim() || !role.trim() || !type.trim()}>
            {mut.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DelegateForm({ specialistId }: { specialistId: string }) {
  const [text, setText] = useState("");
  const delegate = useServerFn(delegateTask);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (intentText: string) => delegate({ data: { specialistId, intentText } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEY });
      toast.success("Delegated · SIP validated");
      setText("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  return (
    <div className="mt-3 space-y-2 rounded-md border border-dashed border-border p-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Delegate a task in natural language…"
        className="min-h-[60px] text-sm"
      />
      <Button
        size="sm"
        className="w-full"
        disabled={!text.trim() || mutation.isPending}
        onClick={() => mutation.mutate(text.trim())}
      >
        {mutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Send className="mr-1 h-3 w-3" />}
        Delegate
      </Button>
    </div>
  );
}
