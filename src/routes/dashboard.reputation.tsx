import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, TrendingUp, Flame, Lock, Coins, Info, ExternalLink, CheckCircle2, CircleDashed, Calculator, ScanLine } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getWorkspace } from "@/lib/workspace.functions";
import { computeEarning } from "@/lib/earnings";

export const Route = createFileRoute("/dashboard/reputation")({
  component: ReputationPage,
  head: () => ({
    meta: [
      { title: "Reputation & Ledger · AiXin" },
      { name: "description", content: "ERC-8004 reputation cards, signed receipts, and simulated $AXN Ledger Preview." },
      { property: "og:title", content: "Reputation & Ledger · AiXin" },
      { property: "og:description", content: "ERC-8004 reputation cards, signed receipts, and simulated $AXN Ledger Preview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function bscScanUrl(chainId: number | null, txHash: string | null) {
  if (!txHash) return null;
  if (chainId === 97) return `https://testnet.bscscan.com/tx/${txHash}`;
  if (chainId === 56) return `https://bscscan.com/tx/${txHash}`;
  return null;
}

function ReputationPage() {
  const { t } = useI18n();
  const { state } = useWorkspace();
  const fetchWs = useServerFn(getWorkspace);
  const { data } = useQuery({
    queryKey: ["workspace"],
    queryFn: () => fetchWs(),
    refetchOnWindowFocus: false,
  });

  const receipts = data?.receipts ?? [];
  const ledger = state.ledger;

  const anchored = receipts.filter((r) => r.anchor_status === "anchored").length;
  const simulated = receipts.filter((r) => r.anchor_status === "simulated").length;

  // Deterministic per-receipt earning breakdown (matches server logic in
  // sip.functions.ts so the UI totals reconcile with the ledger).
  const perReceipt = receipts.map((r) => ({
    id: r.id,
    breakdown: computeEarning({
      anchored: r.anchor_status === "anchored",
      ercIdentity: !!r.identity_tx_hash,
      ercFeedback: !!r.feedback_tx_hash,
      ercValidation: !!r.validation_tx_hash,
      validationScore: r.validation_response ?? null,
      staked: ledger.staked,
    }),
  }));
  const earnedFromReceipts = perReceipt.reduce((s, x) => s + x.breakdown.total, 0);
  const latest = perReceipt[0]?.breakdown;

  const cards = [
    { label: t("rep.score"), value: state.masterTwin.reputation.toFixed(1), icon: Star, tone: "warning" as const },
    { label: t("rep.verified"), value: state.masterTwin.verifiedActions.toLocaleString(), icon: TrendingUp, tone: "success" as const },
    { label: t("rep.burn24h"), value: `$${ledger.burn24h.toLocaleString()}`, icon: Flame, tone: "destructive" as const },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("rep.title")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t("rep.sub")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <c.icon className={`h-4 w-4 ${c.tone === "warning" ? "text-warning" : c.tone === "success" ? "text-success" : "text-destructive"}`} />
                <span className="font-mono text-[11px] uppercase tracking-widest">{c.label}</span>
              </div>
              <div className="mt-2 font-display text-3xl font-semibold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="flex items-start gap-3 p-4">
          <Info className="mt-0.5 h-5 w-5 text-warning" />
          <div className="text-sm">
            <div className="font-medium">{t("rep.simNotice")}</div>
            <div className="text-muted-foreground">{t("rep.simDesc")}</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="font-display font-semibold flex items-center gap-2"><Coins className="h-4 w-4 text-primary" /> {t("rep.ledger")}</div>
            <div className="mt-4 space-y-3">
              <LedgerRow label={t("rep.earningPool")} value={`$${ledger.earningPool.toLocaleString()}`} />
              <LedgerRow label={t("rep.staked")} value={`$${ledger.staked.toLocaleString()}`} />
              <LedgerRow label={t("rep.accessBond")} value={`$${ledger.accessBond.toLocaleString()}`} />
              <LedgerRow label={t("rep.burn24h")} value={`$${ledger.burn24h.toLocaleString()}`} tone="destructive" />
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" disabled>{t("rep.stake")}</Button>
              <Button variant="outline" size="sm" className="flex-1" disabled>{t("rep.burn")}</Button>
              <Button size="sm" className="flex-1" disabled>{t("rep.payout")}</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5">
            <div className="font-display font-semibold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" /> How earnings are calculated
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Every approved Decision Card mints a signed receipt and pays into the Earning Pool. The reward is deterministic — the ledger below shows exactly why the last action earned what it did.
            </p>
            {latest ? (
              <div className="mt-4 space-y-2">
                {latest.lines.map((l) => (
                  <div key={l.label} className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0">
                    <div>
                      <div className="text-sm font-medium">{l.label}</div>
                      {l.hint && <div className="text-[11px] text-muted-foreground">{l.hint}</div>}
                    </div>
                    <div className="font-mono text-sm text-foreground">{l.value}</div>
                  </div>
                ))}
                <div className="mt-2 flex items-center justify-between rounded-md bg-primary/10 px-3 py-2">
                  <div className="text-sm font-medium">Last action earned</div>
                  <div className="font-display text-lg font-semibold text-primary">
                    +${latest.total.toFixed(2)} <span className="text-xs font-mono text-muted-foreground">$AXN</span>
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Lifetime from {perReceipt.length} receipts: <span className="font-mono text-foreground">${earnedFromReceipts.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                Approve a Decision Card in Governance to see a live earnings breakdown here.
                <div className="mt-2 font-mono text-[11px]">
                  formula: base + anchor + ERC-8004 + quality, ×(1 + stake bonus)
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="font-display font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4 text-success" /> Signed receipts
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
                <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-success" /> {anchored} anchored</span>
                <span className="inline-flex items-center gap-1"><CircleDashed className="h-3 w-3" /> {simulated} simulated</span>
              </div>
            </div>

            <div className="mt-4 space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {receipts.length === 0 && (
                <p className="text-sm text-muted-foreground">No receipts anchored yet. Approve a Decision Card to sign the first one.</p>
              )}
              {receipts.map((r, idx) => {
                const url = bscScanUrl(r.chain_id, r.tx_hash);
                const earned = perReceipt[idx]?.breakdown.total ?? 0;
                const validator = (r.payload as { validator?: { signature?: string | null; degraded_reason?: string | null; public_key?: string | null } } | null)?.validator;
                const unsigned = !validator?.signature;
                const badgeTone =
                  r.anchor_status === "anchored"
                    ? "bg-success/15 text-success border-success/30"
                    : r.anchor_status === "simulated"
                    ? "bg-muted text-muted-foreground border-border"
                    : "bg-destructive/15 text-destructive border-destructive/30";
                return (
                  <div key={r.id} className="rounded-md border border-border bg-secondary/40 p-3 font-mono text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-foreground">{r.action}</span>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">+${earned.toFixed(2)} $AXN</span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] uppercase ${
                            unsigned
                              ? "border-destructive/30 bg-destructive/15 text-destructive"
                              : "border-success/30 bg-success/15 text-success"
                          }`}
                          title={validator?.degraded_reason ?? (unsigned ? "Receipt hashed but not signed" : "Ed25519 signed by validator")}
                        >
                          {unsigned ? t("rep.unsigned") : t("rep.signed")}
                        </Badge>
                        <Badge variant="outline" className={`text-[9px] uppercase ${badgeTone}`}>
                          {r.anchor_status === "anchored" ? r.anchor_status : t("rep.notAnchored")}
                        </Badge>
                      </div>
                    </div>
                    <div className={`mt-1 truncate ${r.tx_hash ? "text-success" : "text-muted-foreground"}`}>
                      {r.tx_hash ?? r.payload_hash}
                    </div>
                    {unsigned && (
                      <div className="mt-1 text-[10px] text-destructive">
                        {validator?.degraded_reason ?? t("rep.unsignedHint")}
                      </div>
                    )}

                    {/* ERC-8004 registry events */}
                    {(r.identity_tx_hash || r.feedback_tx_hash || r.validation_tx_hash) && (
                      <div className="mt-2 grid grid-cols-1 gap-1 rounded border border-border/60 bg-background/40 p-2 text-[10px]">
                        <div className="flex items-center justify-between gap-2 text-muted-foreground">
                          <span className="uppercase tracking-widest">ERC-8004</span>
                          {r.agent_id != null && <span>agentId #{r.agent_id}</span>}
                        </div>
                        {r.identity_tx_hash && (
                          <Erc8004Row label="Identity" hash={r.identity_tx_hash} chainId={r.chain_id} />
                        )}
                        {r.feedback_tx_hash && (
                          <Erc8004Row label="Reputation" hash={r.feedback_tx_hash} chainId={r.chain_id} />
                        )}
                        {r.validation_tx_hash && (
                          <Erc8004Row
                            label={`Validation${r.validation_response != null ? ` · ${r.validation_response}/100` : ""}`}
                            hash={r.validation_tx_hash}
                            chainId={r.chain_id}
                          />
                        )}
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
                      <span>{new Date(r.created_at).toLocaleString()}</span>
                      <div className="flex flex-wrap items-center gap-2">
                        {r.iso_badge && <Badge variant="secondary" className="text-[9px]">ISO 42001</Badge>}
                        <Link
                          to="/verify/$sipId"
                          params={{ sipId: r.sip_id }}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <ScanLine className="h-3 w-3" /> {t("rep.verify")}
                        </Link>
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            Anchor tx <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-xs text-muted-foreground">{t("rep.bscNote")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LedgerRow({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "destructive" }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-display font-semibold ${tone === "destructive" ? "text-destructive" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

function Erc8004Row({ label, hash, chainId }: { label: string; hash: string; chainId: number | null }) {
  const url = bscScanUrl(chainId, hash);
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 truncate text-primary hover:underline">
          {hash.slice(0, 10)}…<ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <span className="truncate">{hash.slice(0, 10)}…</span>
      )}
    </div>
  );
}
