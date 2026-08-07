import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Star, ShieldCheck, Plane, Megaphone, Wallet, ArrowRight, Zap, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { seedDemoWorkspace } from "@/lib/workspace.functions";
import { WORKSPACE_QUERY_KEY } from "./dashboard";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/")({
  component: CommandCenter,
  head: () => ({
    meta: [
      { title: "Command Center · AiXin" },
      { name: "description", content: "Master Twin overview, team stats, and live delegation feed." },
      { property: "og:title", content: "Command Center · AiXin" },
      { property: "og:description", content: "Master Twin overview, team stats, and live delegation feed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function CommandCenter() {
  const { t } = useI18n();
  const { state } = useWorkspace();
  const seed = useServerFn(seedDemoWorkspace);
  const queryClient = useQueryClient();
  const seedMutation = useMutation({
    mutationFn: () => seed(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEY });
      toast.success("Demo workspace seeded");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to seed"),
  });

  const stats = {
    specialists: state.specialists.filter((s) => s.status === "active").length,
    skills: state.skills.filter((s) => s.installed).length,
    earnings: state.ledger.earningPool.toLocaleString(),
    pending: state.decisionCards.filter((c) => c.status === "pending").length,
  };

  const hasTeam = state.specialists.length > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Master Twin hero card */}
      <Card className="overflow-hidden border-0 bg-gradient-hero-dark text-sidebar-foreground shadow-warm">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-coral font-display text-2xl font-semibold text-primary-foreground">
              {state.masterTwin.initials || "A"}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-semibold">{state.masterTwin.name || "Master Twin"}</h1>
                <Badge className="border-sidebar-border/60 bg-sidebar-accent/60 text-sidebar-foreground/90">
                  {t("cmd.masterTwin")}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-sidebar-foreground/70">
                {t("cmd.orchestrating", { specialists: stats.specialists, skills: stats.skills })}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-sidebar-foreground/60">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                  {state.masterTwin.reputation.toFixed(1)} · {t("cmd.verifiedActions", { count: state.masterTwin.verifiedActions })}
                </span>
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" />
                  {t("cmd.erc8004")}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("cmd.activeSpecialists")} value={stats.specialists} />
        <StatCard label={t("cmd.skillsDeployed")} value={stats.skills} />
        <StatCard label={t("cmd.earningsMonth")} value={`$${stats.earnings}`} tone="success" />
        <StatCard label={t("cmd.pendingApprovals")} value={stats.pending} tone={stats.pending > 0 ? "warning" : "default"} />
      </div>

      {!hasTeam ? (
        <Card className="p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold">{t("cmd.empty.title")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t("cmd.empty.sub")}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/dashboard/skills">
                {t("cmd.empty.cta")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" disabled={seedMutation.isPending} onClick={() => seedMutation.mutate()}>
              {seedMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("cmd.seed")}
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Team */}
          <section>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-primary">{t("cmd.yourTeam")}</div>
                <h2 className="font-display text-xl font-semibold">{t("cmd.teamTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("cmd.teamSub")}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard/specialists">{t("cmd.manage")}</Link>
              </Button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {state.specialists.slice(0, 2).map((sp) => (
                <SpecialistRow key={sp.id} specialist={sp} />
              ))}
            </div>
          </section>

          {/* Feed */}
          <section>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{t("cmd.feed")}</div>
            <div className="mt-3 space-y-2">
              {state.feed.length === 0 ? (
                <p className="text-sm text-muted-foreground">No delegation events yet.</p>
              ) : (
                state.feed.slice(0, 6).map((item) => <FeedRow key={item.id} item={item} />)
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "success" | "warning";
}) {
  const valueClass =
    tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <Card>
      <CardContent className="p-5">
        <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className={`mt-1 font-display text-3xl font-semibold ${valueClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function SpecialistRow({ specialist }: { specialist: ReturnType<typeof useWorkspace>["state"]["specialists"][0] }) {
  const skillNames = specialist.assignedSkills
    .map((id) => useWorkspace().state.skills.find((s) => s.id === id)?.name)
    .filter(Boolean);

  return (
    <Link
      to="/dashboard/specialists/$id"
      params={{ id: specialist.id }}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
    >
      <Card className="p-5 transition hover:shadow-warm hover:border-primary/40 cursor-pointer">
        <div className="flex items-start gap-3">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg font-display text-sm font-semibold text-white"
            style={{ background: stringToColor(specialist.id) }}
          >
            {specialist.initials}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="font-display font-semibold">{specialist.name}</div>
              <Badge variant="secondary" className="text-[10px]">
                {specialist.status === "active" ? "Test" : "Paused"}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">{specialist.role}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skillNames.slice(0, 4).map((name) => (
                <span key={name} className="rounded-md border border-border bg-secondary px-2 py-0.5 text-[10px]">
                  {name}
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                <Star className="mr-1 inline h-3 w-3 fill-warning text-warning" />
                {specialist.reputation.toFixed(1)}
              </span>
              <span className="font-medium text-success">${specialist.earned.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function FeedRow({ item }: { item: ReturnType<typeof useWorkspace>["state"]["feed"][0] }) {
  const icon =
    item.actor.includes("Travel") ? <Plane className="h-3.5 w-3.5" /> :
    item.actor.includes("Marketing") ? <Megaphone className="h-3.5 w-3.5" /> :
    item.actor.includes("Finance") ? <Wallet className="h-3.5 w-3.5" /> :
    <Zap className="h-3.5 w-3.5" />;
  const toneClass =
    item.tone === "warn" ? "bg-warning/15 text-warning" :
    item.tone === "info" ? "bg-info/15 text-info" :
    "bg-primary/15 text-primary";
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs">
      <span className={`grid h-6 w-6 place-items-center rounded ${toneClass}`}>{icon}</span>
      <span className="text-foreground/80">
        <span className="font-medium">{item.actor}</span> · {item.message}
      </span>
      <span className="ml-auto text-muted-foreground">{item.time}</span>
    </div>
  );
}

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const c = (hash & 0x00ffffff).toString(16).padStart(6, "0");
  return `#${c}`;
}
