import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { WorkspaceProvider, useWorkspace, type SkillTag } from "@/lib/workspace";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { TestModeBanner } from "@/components/dashboard/TestModeBanner";
import { getWorkspace } from "@/lib/workspace.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth", search: { mode: "signin" } });
  },
  head: () => ({
    meta: [
      { title: "AiXin Workspace" },
      { name: "description", content: "Command Center for your Master Twin and Specialist Twins." },
      { property: "og:title", content: "AiXin Workspace" },
      { property: "og:description", content: "Command Center for your Master Twin and Specialist Twins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});


export const WORKSPACE_QUERY_KEY = ["workspace"] as const;

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function shortHash(h: string | null) {
  if (!h) return "";
  if (h.length <= 12) return h;
  return `${h.slice(0, 6)}…${h.slice(-4)}`;
}

function Hydrator() {
  const { dispatch } = useWorkspace();
  const navigate = useNavigate();
  const fetchWs = useServerFn(getWorkspace);
  const { data, error } = useQuery({
    queryKey: WORKSPACE_QUERY_KEY,
    queryFn: () => fetchWs(),
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    if (!error) return;
    if (/unauthorized/i.test(String((error as Error).message))) {
      void supabase.auth.signOut().finally(() => {
        navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
      });
    }
  }, [error, navigate]);


  useEffect(() => {
    if (!data) return;
    const assignmentsBySpec = new Map<string, string[]>();
    const assignmentsBySkill = new Map<string, string[]>();
    for (const a of data.assignments) {
      const specialistAssignments = assignmentsBySpec.get(a.specialist_id) ?? [];
      specialistAssignments.push(a.skill_id);
      assignmentsBySpec.set(a.specialist_id, specialistAssignments);
      const skillAssignments = assignmentsBySkill.get(a.skill_id) ?? [];
      skillAssignments.push(a.specialist_id);
      assignmentsBySkill.set(a.skill_id, skillAssignments);
    }
    const installedSet = new Set(data.installs.map((i) => i.skill_id));
    const pinnedByInstall = new Map(data.installs.map((i) => [i.skill_id, i.pinned_version]));
    const currentUserId = data.masterTwin?.user_id ?? "";


    dispatch({
      type: "SET_WORKSPACE",
      payload: {
        hydrated: true,
        masterTwin: data.masterTwin
          ? {
              id: data.masterTwin.id,
              name: data.masterTwin.name,
              initials: data.masterTwin.initials || data.masterTwin.name.charAt(0).toUpperCase(),
              reputation: Number(data.masterTwin.reputation) || 0,
              verifiedActions: data.masterTwin.verified_actions || 0,
              status: "active",
            }
          : {
              id: "master",
              name: "",
              initials: "M",
              reputation: 0,
              verifiedActions: 0,
              status: "active",
            },
        specialists: data.specialists.map((sp) => ({
          id: sp.id,
          initials: sp.initials,
          name: sp.name,
          role: sp.role,
          type: sp.type,
          status: sp.status,
          assignedSkills: assignmentsBySpec.get(sp.id) ?? [],
          reputation: Number(sp.reputation) || 0,
          earned: Number(sp.earned) || 0,
          delegatedTasks: data.tasks
            .filter((task) => task.specialist_id === sp.id)
            .map((task) => ({
              id: task.id,
              skillId: task.skill_id ?? "",
              title: task.title,
              intent: task.intent,
              value: task.value ?? undefined,
              status: task.status,
              createdAt: task.created_at,
            })),
          actionLog: data.receipts
            .filter((r) => r.specialist_id === sp.id)
            .slice(0, 10)
            .map((r) => ({
              id: r.id,
              action: r.action,
              receipt: shortHash(r.tx_hash),
              sipId: r.sip_id,
              receiptHash: shortHash(r.tx_hash),
              time: formatTime(r.created_at),
            })),
        })),
        skills: data.skills.map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category,
          author: s.author,
          provider: s.provider,
          description: s.description ?? null,
          price: s.price,
          priceCents: (s as { price_cents?: number | null }).price_cents ?? null,
          visibility: ((s as { visibility?: string }).visibility ?? "public") as "public" | "private",
          status: ((s as { status?: string }).status ?? "live") as "draft" | "live",
          version: (s as { version?: number }).version ?? 1,
          authorId: (s as { author_id?: string | null }).author_id ?? null,
          isMine: !!(s as { author_id?: string | null }).author_id && (s as { author_id?: string | null }).author_id === currentUserId,
          pinnedVersion: pinnedByInstall.get(s.id) ?? null,
          installs: s.installs,
          tags: (s.tags?.length ? s.tags : ["deterministic"]) as SkillTag[],
          installed: installedSet.has(s.id),
          assignedTo: assignmentsBySkill.get(s.id) ?? [],
        })),

        decisionCards: data.decisionCards.map((c) => {
          const report = (c.sip_report ?? null) as { evidence?: unknown } | null;
          const evidence = (report && typeof report === "object" && "evidence" in report ? report.evidence : null) as
            | import("@/lib/workspace").RefundEvidenceLite
            | null;
          return {
            id: c.id,
            risk: c.risk,
            requestor: c.requestor,
            specialist: c.specialist_name,
            title: c.title,
            detail: c.detail ?? "",
            amount: c.amount ?? undefined,
            status: c.status,
            evidence: evidence ?? null,
          };
        }),
        receipts: data.receipts.map((r) => ({
          id: r.id,
          action: r.action,
          hash: shortHash(r.tx_hash) || r.payload_hash.slice(0, 12),
          txHash: r.tx_hash,
          chainId: r.chain_id,
          anchorStatus: (r.anchor_status as "anchored" | "simulated" | "failed" | null) ?? null,
          time: formatTime(r.created_at),
          isoBadge: r.iso_badge,
        })),
        feed: data.receipts.slice(0, 8).map((r) => ({
          id: r.id,
          actor: data.specialists.find((s) => s.id === r.specialist_id)?.name ?? "System",
          message: `${r.action} · receipt ${shortHash(r.tx_hash) || r.sip_id}`,
          tone: r.anchor_status === "anchored" ? ("ok" as const) : r.anchor_status === "simulated" ? ("info" as const) : ("warn" as const),
          time: formatTime(r.created_at),
        })),
        ledger: {
          earningPool: Number(data.ledger?.earning_pool ?? 0),
          staked: Number(data.ledger?.staked ?? 0),
          accessBond: Number(data.ledger?.access_bond ?? 0),
          burn24h: Number(data.ledger?.burn_24h ?? 0),
          latestReceipt: data.receipts[0]
            ? {
                id: data.receipts[0].id,
                action: data.receipts[0].action,
                hash: shortHash(data.receipts[0].tx_hash) || data.receipts[0].payload_hash.slice(0, 12),
                time: formatTime(data.receipts[0].created_at),
                isoBadge: data.receipts[0].iso_badge,
              }
            : undefined,
        },
      },
    });
  }, [data, dispatch]);
  return null;
}

function DashboardLayout() {
  return (
    <WorkspaceProvider>
      <Hydrator />
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <TestModeBanner />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
