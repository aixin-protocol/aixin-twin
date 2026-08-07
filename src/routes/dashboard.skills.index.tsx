import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useWorkspace, type Skill } from "@/lib/workspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Download,
  Wand2,
  Check,
  Package,
  Loader2,
  UserPlus,
  Sparkles,
  Lightbulb,
  ArrowLeft,
  Pencil,
  Lock,
  Globe,
  FileEdit,
  ArrowUpCircle,
  FileText,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  installSkill,
  assignSkill,
  createSkill,
  updateSkill,
  upgradeInstall,
} from "@/lib/workspace.functions";
import { listAdapters } from "@/lib/adapters.functions";
import { useQuery } from "@tanstack/react-query";
import { suggestSkillDraft } from "@/lib/skillcraft.functions";
import { buildSkillManifest } from "@/lib/skill-manifest";
import { WORKSPACE_QUERY_KEY } from "./dashboard";
import { toast } from "sonner";

const DOMAIN_TO_CATEGORY: Record<string, "Travel" | "Marketing" | "Finance" | "Support"> = {
  travel: "Travel",
  marketing: "Marketing",
  money: "Finance",
  work: "Support",
  health: "Support",
  custom: "Finance",
};

const CATEGORY_SUGGESTIONS = [
  "Travel",
  "Marketing",
  "Finance",
  "Support",
  "Legal",
  "HR",
  "Operations",
  "Sales",
  "Engineering",
  "Product",
  "Research",
  "Compliance",
];

type CraftPrefill = {
  name?: string;
  category?: string;
  intentContext?: string;
};

export const Route = createFileRoute("/dashboard/skills/")({
  component: SkillsPage,
  head: () => ({
    meta: [
      { title: "Skills & Marketplace · AiXin" },
      { name: "description", content: "Install skills, browse the marketplace, or craft a new skill with SkillCraft." },
      { property: "og:title", content: "Skills & Marketplace · AiXin" },
      { property: "og:description", content: "Install skills, browse the marketplace, or craft a new skill with SkillCraft." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function SkillsPage() {
  const { t } = useI18n();
  const { state } = useWorkspace();
  const navigate = useNavigate();
  const [craftOpen, setCraftOpen] = useState(false);
  const [prefill, setPrefill] = useState<CraftPrefill | null>(null);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [pendingAsk, setPendingAsk] = useState<{ gapName?: string; intent?: string; planId?: string } | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("aixin.pendingAsk");
      if (!raw) return;
      const p = JSON.parse(raw) as { gapName?: string; intent?: string; planId?: string };
      setPendingAsk(p);
      const category = p.planId ? DOMAIN_TO_CATEGORY[p.planId] : undefined;
      setPrefill({ name: p.gapName, category, intentContext: p.intent });
      setCraftOpen(true);
    } catch {
      /* ignore */
    }
  }, []);

  const installed = state.skills.filter((s) => s.installed);
  const mine = state.skills.filter((s) => s.isMine);
  const market = state.skills.filter(
    (s) => !s.installed && !s.isMine && s.status === "live" && s.visibility === "public",
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {pendingAsk?.intent && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 text-sm">
            <div className="font-medium text-primary">Your plan is on hold — finish this Skill to resume.</div>
            <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">"{pendingAsk.intent}"</div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/dashboard/ask" })}>
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to plan
          </Button>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("skills.title")}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{t("skills.sub")}</p>
        </div>
        <Button
          onClick={() => {
            setPrefill(null);
            setEditing(null);
            setCraftOpen(true);
          }}
        >
          <Wand2 className="mr-2 h-4 w-4" /> {t("skills.craft")}
        </Button>
      </div>

      <Tabs defaultValue="installed">
        <TabsList>
          <TabsTrigger value="installed">{t("skills.installed")} ({installed.length})</TabsTrigger>
          <TabsTrigger value="marketplace">{t("skills.marketplace")} ({market.length})</TabsTrigger>
          <TabsTrigger value="mine">My Skills ({mine.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="installed" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {installed.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                installed
                onEdit={(s) => {
                  setEditing(s);
                  setPrefill(null);
                  setCraftOpen(true);
                }}
              />
            ))}
            {installed.length === 0 && (
              <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                {t("skills.empty")}
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="marketplace" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {market.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
            {market.length === 0 && (
              <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                {t("skills.marketEmpty")}
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="mine" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mine.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                installed={skill.installed}
                onEdit={(s) => {
                  setEditing(s);
                  setPrefill(null);
                  setCraftOpen(true);
                }}
              />
            ))}
            {mine.length === 0 && (
              <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                You haven't published a Skill yet. Click <b>{t("skills.craft")}</b> to create one.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <SkillCraftDialog
        open={craftOpen}
        onOpenChange={(v) => {
          setCraftOpen(v);
          if (!v) {
            setPrefill(null);
            setEditing(null);
          }
        }}
        prefill={prefill}
        editing={editing}
        returnToAsk={!!pendingAsk?.intent}
      />
    </div>
  );
}

function SkillCard({
  skill,
  installed,
  onEdit,
}: {
  skill: Skill;
  installed?: boolean;
  onEdit?: (s: Skill) => void;
}) {
  const { t } = useI18n();
  const { state } = useWorkspace();
  const install = useServerFn(installSkill);
  const assign = useServerFn(assignSkill);
  const upgrade = useServerFn(upgradeInstall);
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const installMut = useMutation({
    mutationFn: () => install({ data: { skillId: skill.id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEY });
      toast.success(`Installed ${skill.name} — now assign it to a specialist`);
      if (state.specialists.length > 0) setPickerOpen(true);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const assignMut = useMutation({
    mutationFn: (specialistId: string) => assign({ data: { skillId: skill.id, specialistId } }),
    onSuccess: (_data, specialistId) => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEY });
      const sp = state.specialists.find((s) => s.id === specialistId);
      toast.success(`${skill.name} assigned to ${sp?.name ?? "specialist"}`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const upgradeMut = useMutation({
    mutationFn: () => upgrade({ data: { skillId: skill.id } }),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEY });
      toast.success(`Updated to v${(r as { version?: number }).version ?? skill.version}`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const assignedTo = skill.assignedTo ?? [];
  const assignedSpecs = state.specialists.filter((sp) => assignedTo.includes(sp.id));
  const unassignedSpecs = state.specialists.filter((sp) => !assignedTo.includes(sp.id));

  const isDraft = skill.status === "draft";
  const isPrivate = skill.visibility === "private";
  const updateAvailable =
    !!installed && skill.pinnedVersion != null && skill.pinnedVersion < skill.version;
  const priceLabel =
    skill.priceCents != null && skill.priceCents > 0
      ? `$${(skill.priceCents / 100).toFixed(skill.priceCents % 100 === 0 ? 0 : 2)}`
      : skill.price != null && skill.price > 0
        ? `$${skill.price}/mo`
        : "Free";

  return (
    <Card className="transition hover:shadow-warm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {isDraft && (
              <Badge variant="outline" className="gap-1 border-amber-500/40 text-[10px] text-amber-700">
                <FileEdit className="h-3 w-3" /> Draft
              </Badge>
            )}
            {isPrivate && !isDraft && (
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Lock className="h-3 w-3" /> Private
              </Badge>
            )}
            {!isPrivate && !isDraft && skill.isMine && (
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Globe className="h-3 w-3" /> Public
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px]">
              {skill.category}
            </Badge>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 font-display font-semibold">
          {skill.name}
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-normal text-muted-foreground">
            v{skill.version}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">{skill.author}</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {skill.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-border bg-secondary px-2 py-0.5 text-[10px] uppercase"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
          <span className="text-muted-foreground">{skill.installs.toLocaleString()} installs</span>
          <span className="font-medium">{priceLabel}</span>
        </div>

        {updateAvailable && (
          <div className="mt-3 flex items-center justify-between rounded-md border border-primary/40 bg-primary/10 px-2 py-1.5 text-[11px]">
            <span className="flex items-center gap-1 text-primary">
              <ArrowUpCircle className="h-3.5 w-3.5" /> Update to v{skill.version} available
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-[11px]"
              disabled={upgradeMut.isPending}
              onClick={() => upgradeMut.mutate()}
            >
              {upgradeMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Update"}
            </Button>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant={installed ? "secondary" : "default"}
            size="sm"
            className="min-w-[7rem] flex-1"
            disabled={installed || installMut.isPending}
            onClick={() => installMut.mutate()}
          >
            {installed ? (
              <>
                <Check className="mr-1 h-3 w-3 shrink-0" /> <span className="truncate">Installed</span>
              </>
            ) : installMut.isPending ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 shrink-0 animate-spin" /> <span className="truncate">Installing</span>
              </>
            ) : (
              <>
                <Download className="mr-1 h-3 w-3 shrink-0" /> <span className="truncate">Install</span>
              </>
            )}
          </Button>
          <Button size="sm" variant="outline" className="min-w-0 flex-1" asChild>
            <Link to="/dashboard/skills/$id" params={{ id: skill.id }}>
              <FileText className="mr-1 h-3 w-3 shrink-0" /> <span className="truncate">{t("skills.viewDetails")}</span>
            </Link>
          </Button>
          {skill.isMine && onEdit && (
            <Button size="sm" variant="outline" className="shrink-0" onClick={() => onEdit(skill)}>
              <Pencil className="mr-1 h-3 w-3 shrink-0" /> Edit
            </Button>
          )}
        </div>



        {installed && (
          <div className="mt-3 space-y-2 rounded-md border border-border bg-muted/30 p-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Assigned to
              </span>
              <span className="text-[10px] text-muted-foreground">
                {assignedSpecs.length}/{state.specialists.length}
              </span>
            </div>
            {assignedSpecs.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {assignedSpecs.map((sp) => (
                  <Badge key={sp.id} variant="secondary" className="text-[10px]">
                    {sp.initials} · {sp.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-muted-foreground">Not assigned yet — pick a specialist below.</div>
            )}
            {state.specialists.length === 0 ? (
              <div className="text-[11px] text-muted-foreground">
                Create a Specialist Twin first to assign this skill.
              </div>
            ) : unassignedSpecs.length > 0 ? (
              <Select
                key={`${skill.id}-${assignedTo.length}`}
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                onValueChange={(v) => {
                  setPickerOpen(false);
                  assignMut.mutate(v);
                }}
                disabled={assignMut.isPending}
              >
                <SelectTrigger className="h-8 text-xs">
                  <UserPlus className="mr-1 h-3 w-3" />
                  <SelectValue placeholder={assignMut.isPending ? "Assigning…" : "Assign to specialist…"} />
                </SelectTrigger>
                <SelectContent>
                  {unassignedSpecs.map((sp) => (
                    <SelectItem key={sp.id} value={sp.id}>
                      {sp.name} · {sp.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-[11px] text-muted-foreground">Assigned to all specialists.</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const STEPS = [
  { key: "intent", title: "Intent", desc: "What user request does this skill handle?" },
  { key: "schema", title: "Schema", desc: "Define the JSON intent structure." },
  { key: "rules", title: "Rules", desc: "Add deterministic guardrails." },
  { key: "adapter", title: "Adapter", desc: "Pick Test or Live integration." },
  { key: "publish", title: "Publish", desc: "Pricing, visibility, and publish." },
];

type CraftBlueprint = {
  name: string;
  intent: string;
  rules: string;
  adapter: "test" | "live";
};

const BLUEPRINTS: Record<string, CraftBlueprint[]> = {
  Travel: [
    {
      name: "Flight Rebooker",
      intent:
        "When the user says 'rebook my flight if it's delayed more than 2 hours', find alternatives within the same class and price band.",
      rules:
        "delay_minutes >= 120; new_fare <= original_fare * 1.15; airline in approved_carriers; refund_original = true",
      adapter: "test",
    },
  ],
  Marketing: [
    {
      name: "Campaign Budget Guard",
      intent:
        "When the user says 'boost the top-performing ad', reallocate budget from low-ROAS creatives to the winner.",
      rules:
        "roas >= 2.5; daily_spend_delta <= 500; brand_safety_score >= 0.9; requires_approval_if amount > 1000",
      adapter: "test",
    },
  ],
  Finance: [
    {
      name: "Expense Sorter",
      intent: "When receipts arrive, categorize and post them to the correct GL account.",
      rules:
        "amount > 0; currency in ['USD','EUR','SGD']; category in chart_of_accounts; requires_approval_if amount > 2500",
      adapter: "test",
    },
  ],
  Support: [
    {
      name: "Refund Handler",
      intent: "When a customer asks for a refund within policy, issue it; otherwise open a ticket for review.",
      rules:
        "days_since_purchase <= 30; amount <= 500; reason in policy_allowlist; requires_approval_if amount > 200",
      adapter: "test",
    },
  ],
};

function SkillCraftDialog({
  open,
  onOpenChange,
  prefill,
  editing,
  returnToAsk,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  prefill?: CraftPrefill | null;
  editing?: Skill | null;
  returnToAsk?: boolean;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Finance");
  const [intent, setIntent] = useState("");
  const [rules, setRules] = useState("");
  const [adapter, setAdapter] = useState<"test" | "live">("test");
  const [intentContext, setIntentContext] = useState<string>("");
  const [priceCents, setPriceCents] = useState<number | null>(null);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [status, setStatus] = useState<"draft" | "live">("live");
  const [changelog, setChangelog] = useState("");
  const [readme, setReadme] = useState("");
  const [readmeEdited, setReadmeEdited] = useState(false);
  const [adapterId, setAdapterId] = useState<string>("");
  const adaptersQuery = useQuery({
    queryKey: ["adapters"],
    queryFn: () => listAdapters(),
    enabled: open,
  });
  const connectedAdapters = (adaptersQuery.data ?? []).filter(
    (a) => a.status === "connected",
  );

  const isEdit = !!editing;

  const selectedAdapter = connectedAdapters.find((a) => a.id === adapterId);
  const adapterKey = selectedAdapter
    ? `${selectedAdapter.provider}:${selectedAdapter.kind}:${selectedAdapter.mode}`
    : adapter;
  const generatedManifest = buildSkillManifest({
    name: name.trim() || "Untitled Skill",
    category,
    author: "You",
    version: isEdit ? (editing?.version ?? 1) + 1 : 1,
    intent,
    rules,
    adapter: adapterKey,
    priceCents,
    visibility,
  });
  const effectiveReadme = readmeEdited ? readme : generatedManifest;


  // Apply prefill or editing values when the dialog opens.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setCategory(editing.category);
      setAdapter("test");
      setPriceCents(editing.priceCents);
      setVisibility(editing.visibility);
      setStatus(editing.status);
      setChangelog("");
      setIntent("");
      setRules("");
      setStep(0);
      return;
    }
    if (prefill) {
      if (prefill.name) setName(prefill.name);
      if (prefill.category) setCategory(prefill.category);
      if (prefill.intentContext) setIntentContext(prefill.intentContext);
      setStep(0);
    }
  }, [open, prefill, editing]);

  const create = useServerFn(createSkill);
  const update = useServerFn(updateSkill);
  const suggest = useServerFn(suggestSkillDraft);
  const queryClient = useQueryClient();

  const publishMut = useMutation({
    mutationFn: () => {
      if (isEdit && editing) {
        return update({
          data: {
            skillId: editing.id,
            name: name.trim() || editing.name,
            category,
            intent,
            rules,
            adapter: adapterKey,
            priceCents,
            visibility,
            status,
            changelog,
            readme: effectiveReadme,
            bumpVersion: true,
          },
        });
      }
      return create({
        data: {
          name: name.trim() || "Untitled Skill",
          category,
          intent,
          rules,
          adapter: adapterKey,
          priceCents,
          visibility,
          status,
          readme: effectiveReadme,
        },
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEY });
      if (isEdit) {
        const v = (res as { version?: number }).version;
        toast.success(`"${name}" updated${v ? ` to v${v}` : ""}`);
      } else {
        toast.success(`Skill "${name || "Untitled"}" ${status === "draft" ? "saved as draft" : "published"}`);
      }
      const publishedName = name;
      setStep(0);
      setName("");
      setIntent("");
      setRules("");
      setChangelog("");
      setReadme("");
      setReadmeEdited(false);
      onOpenChange(false);
      if (!isEdit && returnToAsk) {
        toast.success(`Returning to your plan — "${publishedName}" is ready to assign`);
        navigate({ to: "/dashboard/ask" });
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const suggestMut = useMutation({
    mutationFn: () =>
      suggest({
        data: {
          name,
          category,
          intentContext,
          currentIntent: intent,
          currentRules: rules,
        },
      }),
    onSuccess: (draft) => {
      if (draft.name && !isEdit) setName(draft.name);
      if (draft.intent) setIntent(draft.intent);
      if (draft.rules) setRules(draft.rules);
      if (draft.adapter) setAdapter(draft.adapter);
      toast.success("AI draft ready — review each step and edit as needed.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "AI draft failed — try again in a moment"),
  });

  const blueprints = BLUEPRINTS[category] ?? [];

  const applyBlueprint = (b: CraftBlueprint) => {
    if (!isEdit) setName(b.name);
    setIntent(b.intent);
    setRules(b.rules);
    setAdapter(b.adapter);
    toast.success(`Loaded "${b.name}" blueprint — edit any field to make it yours`);
  };

  const publish = () => publishMut.mutate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${editing?.name}` : t("craft.title")}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Editing v${editing?.version}. Publishing changes will create v${(editing?.version ?? 1) + 1} and notify installers.`
              : t("craft.sub")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 py-2">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`flex-1 rounded py-1 text-center text-[10px] font-medium ${i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {i + 1}. {s.title}
            </div>
          ))}
        </div>

        {intentContext && !isEdit && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-[11px]">
            <span className="font-mono uppercase tracking-widest text-primary">Context from your ask</span>
            <div className="mt-0.5 line-clamp-2 text-muted-foreground">"{intentContext}"</div>
          </div>
        )}

        {step < 4 && (
          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {name.trim() ? (
                  <>
                    AI draft the whole Skill from <em>“{name.trim()}”</em>
                    {category ? (
                      <>
                        {" "}
                        in <em>{category}</em>
                      </>
                    ) : null}
                  </>
                ) : (
                  <>Enter a Skill name below, then AI-draft every step in one click</>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs"
                onClick={() => suggestMut.mutate()}
                disabled={suggestMut.isPending || !name.trim()}
                title="Fills Intent, Rules and Adapter across all tabs"
              >
                {suggestMut.isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Drafting…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3" /> AI draft
                  </>
                )}
              </Button>
            </div>
            {step === 0 && blueprints.length > 0 && !isEdit && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  <Lightbulb className="mr-1 inline h-3 w-3" /> or a starter:
                </span>
                {blueprints.map((b) => (
                  <button
                    key={b.name}
                    onClick={() => applyBlueprint(b)}
                    className="rounded-full border border-primary/30 bg-background px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-primary/10"
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="min-h-[220px] space-y-4 py-2">
          {step === 0 && (
            <>
              <div>
                <Label>{t("craft.name")}</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Expense Sorter"
                  disabled={isEdit}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  A short verb-noun name works best — Refund Handler, Flight Rebooker, Expense Sorter.
                  {isEdit && " Name is fixed after publishing to preserve installer references."}
                </p>
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  list="skillcraft-category-options"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Type any category — Finance, Travel, Legal, HR, Ops, Marketing…"
                />
                <datalist id="skillcraft-category-options">
                  {CATEGORY_SUGGESTIONS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {CATEGORY_SUGGESTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${
                        category === c
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-muted"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Free-form — tap a chip or type your own. AI draft uses whatever you enter here.
                </p>
              </div>
            </>
          )}
          {step === 1 && (
            <div>
              <Label>{t("craft.intent")}</Label>
              <Textarea
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder={blueprints[0]?.intent ?? "When the user says '…', do …"}
                rows={4}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Describe the trigger in plain English: <em>"When the user says X, do Y."</em>
              </p>
            </div>
          )}
          {step === 2 && (
            <div>
              <Label>{t("craft.rules")}</Label>
              <Textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder={blueprints[0]?.rules ?? "amount > 0; destination in allowlist; requires_approval_if amount > 1000"}
                rows={4}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Deterministic guardrails checked by SIP before execution. Use <code>requires_approval_if …</code>{" "}
                to trigger a Decision Card.
              </p>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Connected adapter</Label>
                <Select
                  value={adapterId || "__none"}
                  onValueChange={(v) => {
                    if (v === "__none") {
                      setAdapterId("");
                      return;
                    }
                    setAdapterId(v);
                    const a = connectedAdapters.find((x) => x.id === v);
                    if (a?.mode === "test" || a?.mode === "live") setAdapter(a.mode);
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pick from your connected adapters" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">None (use generic Test/Live)</SelectItem>
                    {connectedAdapters.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.provider} · {a.kind} · {a.mode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {connectedAdapters.length === 0 ? (
                    <>No connected adapters yet. Connect one in <a href="/dashboard/adapters" className="underline">Adapters</a>.</>
                  ) : (
                    <>Executor will route this skill through the selected adapter.</>
                  )}
                </p>
              </div>
              <div>
                <Label>{t("craft.adapter")}</Label>
                <div className="mt-1 flex gap-2">
                  <Button
                    variant={adapter === "test" ? "default" : "outline"}
                    onClick={() => setAdapter("test")}
                    className="flex-1"
                  >
                    Test adapter
                  </Button>
                  <Button
                    variant={adapter === "live" ? "default" : "outline"}
                    onClick={() => setAdapter("live")}
                    className="flex-1"
                  >
                    Live adapter
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {adapter === "test"
                    ? "Runs against sandbox data. No real charges."
                    : "Uses real API credentials and may incur costs."}
                </p>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label>Pricing</Label>
                  <div className="mt-1 flex gap-2">
                    <Button
                      size="sm"
                      variant={priceCents == null || priceCents === 0 ? "default" : "outline"}
                      onClick={() => setPriceCents(null)}
                      className="flex-1"
                    >
                      Free
                    </Button>
                    <Button
                      size="sm"
                      variant={priceCents != null && priceCents > 0 ? "default" : "outline"}
                      onClick={() => setPriceCents(priceCents && priceCents > 0 ? priceCents : 999)}
                      className="flex-1"
                    >
                      Paid
                    </Button>
                  </div>
                  {priceCents != null && priceCents > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={(priceCents / 100).toFixed(2)}
                        onChange={(e) => {
                          const n = parseFloat(e.target.value);
                          setPriceCents(Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null);
                        }}
                        className="h-8"
                      />
                      <span className="text-xs text-muted-foreground">/mo</span>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Visibility</Label>
                  <div className="mt-1 flex gap-2">
                    <Button
                      size="sm"
                      variant={visibility === "public" ? "default" : "outline"}
                      onClick={() => setVisibility("public")}
                      className="flex-1"
                    >
                      <Globe className="mr-1 h-3.5 w-3.5" /> Public
                    </Button>
                    <Button
                      size="sm"
                      variant={visibility === "private" ? "default" : "outline"}
                      onClick={() => setVisibility("private")}
                      className="flex-1"
                    >
                      <Lock className="mr-1 h-3.5 w-3.5" /> Private
                    </Button>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {visibility === "public"
                      ? "Anyone can discover and install this Skill."
                      : "Only you can see and install this Skill."}
                  </p>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <div className="mt-1 flex gap-2">
                  <Button
                    size="sm"
                    variant={status === "draft" ? "default" : "outline"}
                    onClick={() => setStatus("draft")}
                    className="flex-1"
                  >
                    <FileEdit className="mr-1 h-3.5 w-3.5" /> Draft
                  </Button>
                  <Button
                    size="sm"
                    variant={status === "live" ? "default" : "outline"}
                    onClick={() => setStatus("live")}
                    className="flex-1"
                  >
                    <Check className="mr-1 h-3.5 w-3.5" /> Live
                  </Button>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {status === "draft"
                    ? "Draft skills are only visible to you and won't appear in the marketplace."
                    : "Live skills are ready to run. Public+Live skills appear in the marketplace."}
                </p>
              </div>
              {isEdit && (
                <div>
                  <Label>Changelog (for v{(editing?.version ?? 1) + 1})</Label>
                  <Input
                    value={changelog}
                    onChange={(e) => setChangelog(e.target.value)}
                    placeholder="What changed in this version?"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Installers see this and get an <b>Update available</b> badge.
                  </p>
                </div>
              )}
              <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm">
                <div className="font-medium">Preview</div>
                <div className="mt-1 text-muted-foreground">
                  {name || "Untitled Skill"} · {category || "(no category)"} · {visibility} · {status}
                  {isEdit && ` · v${(editing?.version ?? 1) + 1}`}
                </div>
                <div className="mt-2 whitespace-pre-wrap font-mono text-xs">{intent || "(no intent set)"}</div>
                <div className="mt-2 whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                  {rules || "(no rules set)"}
                </div>
                <div className="mt-2 font-mono text-xs">
                  Adapter: {adapter} · {priceCents && priceCents > 0 ? `$${(priceCents / 100).toFixed(2)}/mo` : "Free"}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Label>SKILL.md manifest</Label>
                  {readmeEdited && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[11px]"
                      onClick={() => {
                        setReadme("");
                        setReadmeEdited(false);
                      }}
                    >
                      Regenerate
                    </Button>
                  )}
                </div>
                <Textarea
                  value={effectiveReadme}
                  onChange={(e) => {
                    setReadme(e.target.value);
                    setReadmeEdited(true);
                  }}
                  rows={12}
                  className="mt-1 font-mono text-[11px]"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Auto-generated from your answers. Installers read this on the Skill detail page before
                  they consent to its permissions.
                </p>
              </div>
            </div>

          )}
        </div>

        <DialogFooter>
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)}>Next</Button>
          ) : (
            <Button onClick={publish} disabled={publishMut.isPending}>
              {publishMut.isPending ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" /> {isEdit ? "Saving" : "Publishing"}
                </>
              ) : (
                <>
                  <Plus className="mr-1 h-4 w-4" />{" "}
                  {isEdit ? `Publish v${(editing?.version ?? 1) + 1}` : status === "draft" ? "Save draft" : "Publish"}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
