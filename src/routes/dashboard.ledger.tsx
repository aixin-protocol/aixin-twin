import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { readSharedLedger, resetSharedLedger } from "@/lib/ledger.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, RefreshCw, ExternalLink, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { useEffect } from "react";

export const Route = createFileRoute("/dashboard/ledger")({
  component: LedgerPage,
  head: () => ({
    meta: [
      { title: "Shared Ledger · AiXin" },
      { name: "description", content: "The single source of truth that OpenClaw baseline and AiXin governed both read and write during the demo." },
      { property: "og:title", content: "Shared Ledger · AiXin" },
      { property: "og:description", content: "One MCP endpoint. Four tools. Same tables. Different governance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type LedgerData = Awaited<ReturnType<typeof readSharedLedger>>;

const LEDGER_QUERY_KEY = ["shared-ledger"] as const;

function agentBadge(label: string) {
  if (label === "aixin-governed")
    return <Badge className="bg-primary/15 text-primary border border-primary/30">aixin-governed</Badge>;
  if (label === "openclaw-baseline")
    return <Badge className="bg-amber-500/15 text-amber-700 border border-amber-500/30 dark:text-amber-400">openclaw-baseline</Badge>;
  return <Badge variant="secondary">{label}</Badge>;
}

function LedgerPage() {
  const read = useServerFn(readSharedLedger);
  const reset = useServerFn(resetSharedLedger);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: LEDGER_QUERY_KEY,
    queryFn: () => read() as Promise<LedgerData>,
    refetchInterval: 2000,
  });

  const resetMut = useMutation({
    mutationFn: () => reset(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LEDGER_QUERY_KEY });
      toast.success("Shared ledger reset to seed state.");
    },
    onError: (e: any) => toast.error(e?.message ?? "Reset failed"),
  });

  // Keep the query lively while tab visible
  useEffect(() => {
    const handler = () => qc.invalidateQueries({ queryKey: LEDGER_QUERY_KEY });
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, [qc]);

  const data = q.data;
  const publishedOrigin =
    typeof window !== "undefined" ? window.location.origin : "https://twin-trust-orchestrator.lovable.app";
  const mcpUrl = `${publishedOrigin}/api/public/openclaw/mcp`;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <Database className="h-3.5 w-3.5" />
            Proof of common ground
          </div>
          <h1 className="mt-2 font-display text-3xl">Shared Ledger</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            OpenClaw (baseline) and AiXin (governed) both call the same MCP endpoint and write to the same
            tables below. Different <span className="font-mono">issued_by_agent</span>. Same data. This is
            the evidence surface for the head-to-head demo.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => qc.invalidateQueries({ queryKey: LEDGER_QUERY_KEY })}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm("Reset the shared demo ledger to its seed state? This wipes all agent actions and refunds.")) {
                resetMut.mutate();
              }
            }}
            disabled={resetMut.isPending}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {resetMut.isPending ? "Resetting…" : "Reset demo ledger"}
          </Button>
        </div>
      </div>

      {/* Endpoint proof */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Shared MCP endpoint (same for both agents)
          </div>
          <div className="mt-1 flex items-center gap-2">
            <code className="rounded bg-background px-2 py-1 font-mono text-sm">{mcpUrl}</code>
            <a
              href={mcpUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary underline underline-offset-2 inline-flex items-center gap-1"
            >
              open <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Tools exposed: <span className="font-mono">get_customer</span> ·{" "}
            <span className="font-mono">list_orders</span> · <span className="font-mono">list_refunds</span> ·{" "}
            <span className="font-mono">issue_refund</span>. Authorization determines who wrote the row, not
            what tools they can call.
          </div>
        </CardContent>
      </Card>

      {/* Customers */}
      <Section title="demo_customers" count={data?.customers.length}>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr>
              <Th>email</Th>
              <Th>name</Th>
              <Th>created_at</Th>
            </tr>
          </thead>
          <tbody>
            {(data?.customers ?? []).map((c) => (
              <tr key={c.email} className="border-t border-border/60">
                <Td mono>{c.email}</Td>
                <Td>{c.name}</Td>
                <Td mono>{fmt(c.created_at)}</Td>
              </tr>
            ))}
            {data && data.customers.length === 0 && <EmptyRow cols={3} />}
          </tbody>
        </table>
      </Section>

      {/* Orders */}
      <Section title="demo_orders" count={data?.orders.length}>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr>
              <Th>order_number</Th>
              <Th>customer_email</Th>
              <Th>amount</Th>
              <Th>status</Th>
              <Th>created_at</Th>
            </tr>
          </thead>
          <tbody>
            {(data?.orders ?? []).map((o) => (
              <tr key={o.order_number} className="border-t border-border/60">
                <Td mono>{o.order_number}</Td>
                <Td mono>{o.customer_email}</Td>
                <Td mono>
                  {o.currency} {Number(o.amount).toFixed(2)}
                </Td>
                <Td>
                  <Badge variant="outline">{o.status}</Badge>
                </Td>
                <Td mono>{fmt(o.created_at)}</Td>
              </tr>
            ))}
            {data && data.orders.length === 0 && <EmptyRow cols={5} />}
          </tbody>
        </table>
      </Section>

      {/* Refunds — the money row */}
      <Section
        title="demo_refunds"
        count={data?.refunds.length}
        subtitle="The row that proves the divergence. AiXin's rows carry a sip_receipt_id and status sip-approved. Baseline's don't."
      >
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr>
              <Th>order</Th>
              <Th>amount</Th>
              <Th>issued_by_agent</Th>
              <Th>governance_status</Th>
              <Th>sip_receipt_id</Th>
              <Th>created_at</Th>
            </tr>
          </thead>
          <tbody>
            {(data?.refunds ?? []).map((r) => (
              <tr key={r.id} className="border-t border-border/60">
                <Td mono>{r.order_number}</Td>
                <Td mono>${Number(r.amount).toFixed(2)}</Td>
                <Td>{agentBadge(r.issued_by_agent)}</Td>
                <Td mono>{r.governance_status}</Td>
                <Td mono className="max-w-[220px] truncate">
                  {r.sip_receipt_id ?? "—"}
                </Td>
                <Td mono>{fmt(r.created_at)}</Td>
              </tr>
            ))}
            {data && data.refunds.length === 0 && <EmptyRow cols={6} />}
          </tbody>
        </table>
      </Section>

      {/* Agent actions — the live tail */}
      <Section
        title="demo_agent_actions"
        count={data?.actions.length}
        subtitle="Every tool call from every agent — appended in real time. Newest first."
      >
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card text-left text-xs uppercase text-muted-foreground">
              <tr>
                <Th>when</Th>
                <Th>agent</Th>
                <Th>tool</Th>
                <Th>args</Th>
              </tr>
            </thead>
            <tbody>
              {(data?.actions ?? []).map((a) => (
                <tr key={a.id} className="border-t border-border/60 align-top">
                  <Td mono className="whitespace-nowrap">{fmt(a.created_at)}</Td>
                  <Td>{agentBadge(a.agent_label)}</Td>
                  <Td mono>{a.tool}</Td>
                  <Td mono className="max-w-[420px] truncate text-xs text-muted-foreground">
                    {JSON.stringify(a.args)}
                  </Td>
                </tr>
              ))}
              {data && data.actions.length === 0 && <EmptyRow cols={4} />}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  count,
  subtitle,
  children,
}: {
  title: string;
  count?: number;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between font-mono text-sm">
          <span>{title}</span>
          {typeof count === "number" && (
            <Badge variant="outline" className="font-mono">
              {count} row{count === 1 ? "" : "s"}
            </Badge>
          )}
        </CardTitle>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <CardContent className="pt-0 overflow-x-auto">{children}</CardContent>
    </Card>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-2 py-2 font-mono font-normal">{children}</th>;
}
function Td({
  children,
  mono,
  className = "",
}: {
  children: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <td className={`px-2 py-2 ${mono ? "font-mono text-xs" : ""} ${className}`}>{children}</td>
  );
}
function EmptyRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="px-2 py-6 text-center text-xs text-muted-foreground">
        No rows yet.
      </td>
    </tr>
  );
}
function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour12: false }) + " · " + d.toLocaleDateString();
}
