import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Download, Check, ShieldCheck, Zap, FileText, History, Loader2, UserPlus, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace";
import { getSkillDetail, installSkill, assignSkill } from "@/lib/workspace.functions";
import { buildSkillManifest, deriveCapabilityContract, manifestBody } from "@/lib/skill-manifest";
import { WORKSPACE_QUERY_KEY } from "./dashboard";

export const Route = createFileRoute("/dashboard/skills/$id")({
  component: SkillDetailPage,
  head: () => ({
    meta: [
      { title: "Skill detail · AiXin" },
      { name: "description", content: "Read a Skill's manifest, capability contract, permissions and version history before installing it." },
      { property: "og:title", content: "Skill detail · AiXin" },
      { property: "og:description", content: "Read a Skill's manifest, capability contract, permissions and version history before installing it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const RISK_STYLES: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/30",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  low: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
};

function SkillDetailPage() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { state } = useWorkspace();
  const detail = useServerFn(getSkillDetail);
  const install = useServerFn(installSkill);
  const assign = useServerFn(assignSkill);
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const query = useQuery({
    queryKey: ["skill-detail", id],
    queryFn: () => detail({ data: { skillId: id } }),
  });

  const installMut = useMutation({
    mutationFn: () => install({ data: { skillId: id } }),
    onSuccess: () => {
      setConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["skill-detail", id] });
      toast.success(t("skillDetail.installed"));
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const assignMut = useMutation({
    mutationFn: (specialistId: string) => assign({ data: { skillId: id, specialistId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["skill-detail", id] });
      toast.success(t("skillDetail.assigned"));
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (query.isLoading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center gap-2 p-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> {t("common.loading")}
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-4">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/dashboard/skills" })}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> {t("skillDetail.back")}
        </Button>
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("skillDetail.notFound")}
        </div>
      </div>
    );
  }

  const { skill, versions, installed, isMine, assignedTo } = query.data;
  const latestVersion = versions[0] as { adapter?: string; intent?: string | null; rules?: string | null } | undefined;
  const adapter = latestVersion?.adapter ?? "test";
  const contract = deriveCapabilityContract({
    name: skill.name,
    category: skill.category,
    adapter,
    rules: skill.rulesText,
  });

  const readme =
    skill.readme ||
    buildSkillManifest({
      name: skill.name,
      category: skill.category,
      author: skill.author,
      version: skill.version,
      intent: skill.description ?? "",
      rules: skill.rulesText,
      adapter,
      priceCents: skill.priceCents,
      visibility: (skill.visibility as "public" | "private") ?? "public",
    });

  const specialists = state.specialists;
  const unassigned = specialists.filter((s) => !assignedTo.includes(s.id));

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate({ to: "/dashboard/skills" })}>
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> {t("skillDetail.back")}
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-semibold">{skill.name}</h1>
            <Badge variant="secondary">v{skill.version}</Badge>
            <Badge variant="outline" className={RISK_STYLES[contract.risk]}>
              {t("skillDetail.risk")}: {contract.risk}
            </Badge>
            <Badge variant="outline">
              {skill.visibility === "public" ? (
                <>
                  <Globe className="mr-1 h-3 w-3" /> {t("skillDetail.public")}
                </>
              ) : (
                <>
                  <Lock className="mr-1 h-3 w-3" /> {t("skillDetail.private")}
                </>
              )}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {skill.category} · {t("skillDetail.by")} {skill.author} · {skill.installs} {t("skillDetail.installs")} ·{" "}
            {skill.priceCents && skill.priceCents > 0 ? `$${(skill.priceCents / 100).toFixed(2)}/mo` : t("skillDetail.free")}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {installed ? (
            <Button variant="secondary" disabled>
              <Check className="mr-1.5 h-4 w-4" /> {t("skillDetail.installedBtn")}
            </Button>
          ) : (
            <Button onClick={() => setConfirmOpen(true)}>
              <Download className="mr-1.5 h-4 w-4" /> {t("skillDetail.install")}
            </Button>
          )}
          {isMine && (
            <Button variant="outline" asChild>
              <Link to="/dashboard/skills">{t("skillDetail.editInCraft")}</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Capability contract */}
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h2 className="font-display text-base font-semibold">{t("skillDetail.contract")}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <ContractTile label={t("skillDetail.sipAction")} value={contract.sipAction} mono />
            <ContractTile label={t("skillDetail.adapter")} value={adapter} mono />
            <ContractTile
              label={t("skillDetail.approval")}
              value={contract.requiresApproval ? t("skillDetail.approvalYes") : t("skillDetail.approvalNo")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("skillDetail.permissions")}
              </div>
              <ul className="mt-2 space-y-1.5 text-sm">
                {contract.permissions.map((p) => (
                  <li key={p} className="flex gap-2">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("skillDetail.sideEffects")}
              </div>
              <ul className="mt-2 space-y-1.5 text-sm">
                {contract.sideEffects.map((s) => (
                  <li key={s} className="flex gap-2">
                    <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment */}
      {installed && (
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <h2 className="font-display text-base font-semibold">{t("skillDetail.assignedTo")}</h2>
            {assignedTo.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {specialists
                  .filter((sp) => assignedTo.includes(sp.id))
                  .map((sp) => (
                    <Badge key={sp.id} variant="secondary">
                      {sp.initials} · {sp.name}
                    </Badge>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("skillDetail.notAssigned")}</p>
            )}
            {unassigned.length > 0 && (
              <Select onValueChange={(v) => assignMut.mutate(v)} disabled={assignMut.isPending}>
                <SelectTrigger className="h-9 w-full sm:w-72">
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                  <SelectValue placeholder={t("skillDetail.assignPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {unassigned.map((sp) => (
                    <SelectItem key={sp.id} value={sp.id}>
                      {sp.name} · {sp.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
      )}

      {/* SKILL.md */}
      <Card>
        <CardContent className="space-y-3 p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="font-display text-base font-semibold">SKILL.md</h2>
          </div>
          <Markdown source={manifestBody(readme)} />
        </CardContent>
      </Card>

      {/* Version history */}
      <Card>
        <CardContent className="space-y-3 p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h2 className="font-display text-base font-semibold">{t("skillDetail.history")}</h2>
          </div>
          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("skillDetail.noHistory")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {versions.map((v) => {
                const ver = v as { id: string; version: number; changelog: string | null; created_at: string; adapter: string };
                return (
                  <li key={ver.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm">
                    <span className="font-mono text-xs">v{ver.version}</span>
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">{ver.changelog || "—"}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(ver.created_at).toLocaleDateString()}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Install consent */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("skillDetail.consentTitle")}</DialogTitle>
            <DialogDescription>{t("skillDetail.consentSub")}</DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm">
            {contract.permissions.map((p) => (
              <li key={p} className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            {contract.requiresApproval ? t("skillDetail.consentApproval") : t("skillDetail.consentAuto")}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => installMut.mutate()} disabled={installMut.isPending}>
              {installMut.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> {t("skillDetail.installing")}
                </>
              ) : (
                t("skillDetail.consentAccept")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContractTile({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-sm ${mono ? "font-mono text-xs" : ""}`}>{value}</div>
    </div>
  );
}

/** Minimal markdown renderer for headings, lists and paragraphs. */
function Markdown({ source }: { source: string }) {
  const lines = source.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];

  const flush = (key: string) => {
    if (list.length) {
      blocks.push(
        <ul key={key} className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
          {list.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };

  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (line.startsWith("- ")) {
      list.push(line.slice(2));
      return;
    }
    flush(`l${i}`);
    if (!line) return;
    if (line.startsWith("### ")) {
      blocks.push(<h4 key={i} className="font-display text-sm font-semibold">{line.slice(4)}</h4>);
    } else if (line.startsWith("## ")) {
      blocks.push(<h3 key={i} className="font-display text-sm font-semibold">{line.slice(3)}</h3>);
    } else if (line.startsWith("# ")) {
      blocks.push(<h2 key={i} className="font-display text-base font-semibold">{line.slice(2)}</h2>);
    } else {
      blocks.push(<p key={i} className="text-sm text-muted-foreground">{line.replace(/_/g, "")}</p>);
    }
  });
  flush("last");

  return <div className="space-y-2">{blocks}</div>;
}
