import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Star, Plus, Users, Loader2, MoreHorizontal, Archive, Play, Pause, Trash2 } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createSpecialist,
  seedDemoWorkspace,
  setSpecialistStatus,
  deleteSpecialist,
} from "@/lib/workspace.functions";
import { WORKSPACE_QUERY_KEY } from "./dashboard";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/specialists/")({
  component: SpecialistsPage,
  head: () => ({
    meta: [
      { title: "Specialist Twins · AiXin" },
      { name: "description", content: "Manage your team of Specialist Twins and their assigned skills." },
      { property: "og:title", content: "Specialist Twins · AiXin" },
      { property: "og:description", content: "Manage your team of Specialist Twins and their assigned skills." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const PRESETS = [
  { name: "Marco", role: "Travel Specialist", type: "Travel" },
  { name: "Nova", role: "Marketing Specialist", type: "Marketing" },
  { name: "Ledger", role: "Finance Specialist", type: "Finance" },
  { name: "Iris", role: "Support Specialist", type: "Support" },
];

function SpecialistsPage() {
  const { t } = useI18n();
  const { state } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [showRetired, setShowRetired] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  const createFn = useServerFn(createSpecialist);
  const seedFn = useServerFn(seedDemoWorkspace);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (v: { name: string; role: string }) =>
      createFn({ data: { name: v.name, role: v.role, type: "Custom" } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEY });
      toast.success("Specialist created");
      setName("");
      setRole("");
      setOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const seedMutation = useMutation({
    mutationFn: () => seedFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEY });
      toast.success("Demo workspace seeded");
    },
  });

  const create = () => {
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), role: role.trim() || "Specialist" });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("spec.title")}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{t("spec.sub")}</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> {t("spec.new")}
        </Button>
      </div>

      {!state.hydrated ? (
        <Card className="p-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Loading Specialist Twins…</p>
        </Card>
      ) : state.specialists.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-4 font-display text-lg font-semibold">{t("spec.empty.title")}</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{t("spec.empty.sub")}</p>
          <Button className="mt-4" variant="outline" disabled={seedMutation.isPending} onClick={() => seedMutation.mutate()}>
            {seedMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("cmd.seed")}
          </Button>
        </Card>
      ) : (
        <>
          {(() => {
            const active = state.specialists.filter((s) => s.status !== "retired");
            const retired = state.specialists.filter((s) => s.status === "retired");
            return (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {active.map((sp) => (
                    <SpecialistCard key={sp.id} specialist={sp} />
                  ))}
                </div>
                {retired.length > 0 && (
                  <div className="mt-6">
                    <Button variant="ghost" size="sm" onClick={() => setShowRetired((v) => !v)} className="h-7 px-2 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
                      {showRetired ? "Hide" : "Show"} retired ({retired.length})
                    </Button>
                    {showRetired && (
                      <div className="mt-3 grid gap-4 opacity-70 md:grid-cols-2">
                        {retired.map((sp) => (
                          <SpecialistCard key={sp.id} specialist={sp} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("spec.new")}</DialogTitle>
            <DialogDescription>Create a new Specialist Twin and assign skills later.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Marco" />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Travel Specialist" />
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setName(p.name); setRole(p.role); }}
                  className="h-7 rounded-full px-3 text-xs"
                >
                  {p.name}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SpecialistCard({ specialist }: { specialist: ReturnType<typeof useWorkspace>["state"]["specialists"][0] }) {
  const { t } = useI18n();
  const { state } = useWorkspace();
  const skillNames = specialist.assignedSkills
    .map((id) => state.skills.find((s) => s.id === id)?.name)
    .filter((name): name is string => Boolean(name));

  const statusFn = useServerFn(setSpecialistStatus);
  const deleteFn = useServerFn(deleteSpecialist);
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEY });

  const statusMut = useMutation({
    mutationFn: (status: "active" | "paused" | "retired") =>
      statusFn({ data: { specialistId: specialist.id, status } }),
    onSuccess: (_r, status) => {
      invalidate();
      toast.success(status === "retired" ? "Twin retired" : status === "paused" ? "Twin paused" : "Twin reactivated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteFn({ data: { specialistId: specialist.id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Twin deleted");
      setConfirmDelete(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const isRetired = specialist.status === "retired";
  const isPaused = specialist.status === "paused";
  const statusLabel = isRetired ? "Retired" : isPaused ? "Paused" : "Active";
  const statusVariant: "secondary" | "outline" = specialist.status === "active" ? "secondary" : "outline";

  return (
    <Card className="p-5 transition hover:shadow-warm">
      <CardContent className="p-0">
        <div className="flex items-start justify-between">
          <Link
            to="/dashboard/specialists/$id"
            params={{ id: specialist.id }}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-md -m-1 p-1 hover:bg-secondary/60"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary font-display text-sm font-semibold text-primary-foreground">
              {specialist.initials}
            </div>
            <div className="min-w-0">
              <div className="truncate font-display font-semibold hover:underline">{specialist.name}</div>
              <div className="truncate text-xs text-muted-foreground">{specialist.role}</div>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <Badge variant={statusVariant} className="text-[10px]">{statusLabel}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Twin actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isRetired || isPaused ? (
                  <DropdownMenuItem onClick={() => statusMut.mutate("active")}>
                    <Play className="mr-2 h-3.5 w-3.5" /> Reactivate
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => statusMut.mutate("paused")}>
                    <Pause className="mr-2 h-3.5 w-3.5" /> Pause
                  </DropdownMenuItem>
                )}
                {!isRetired && (
                  <DropdownMenuItem onClick={() => statusMut.mutate("retired")}>
                    <Archive className="mr-2 h-3.5 w-3.5" /> Retire
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete permanently
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("spec.assignedSkills")}</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {skillNames.length ? skillNames.map((n) => (
              <span key={n} className="rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px]">{n}</span>
            )) : (
              <span className="text-xs text-muted-foreground">No skills assigned</span>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Reputation</div>
            <div className="mt-0.5 font-medium">
              <Star className="mr-1 inline h-3 w-3 fill-warning text-warning" />
              {specialist.reputation.toFixed(1)}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Earned</div>
            <div className="mt-0.5 font-medium text-success">${specialist.earned.toLocaleString()}</div>
          </div>
        </div>

        <div className="mt-4">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to="/dashboard/specialists/$id" params={{ id: specialist.id }}>View details</Link>
          </Button>
        </div>
      </CardContent>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {specialist.name}?</DialogTitle>
            <DialogDescription>
              This permanently removes the Specialist Twin and its skill assignments. Prior receipts and audit logs
              remain in the ledger. Consider "Retire" if you may reactivate later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteMut.mutate()}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}