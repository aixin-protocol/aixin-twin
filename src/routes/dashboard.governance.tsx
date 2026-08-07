import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useWorkspace, type DecisionCard } from "@/lib/workspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Check, X, FileText, AlertTriangle, Activity, Loader2, Compass, Coins, Package, Network, ExternalLink } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { decideOnCard } from "@/lib/sip.functions";
import { WORKSPACE_QUERY_KEY } from "./dashboard";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/governance")({
  component: GovernancePage,
  head: () => ({
    meta: [
      { title: "Governance & SIP · AiXin" },
      { name: "description", content: "Signal Intent Protocol (SIP), Decision Cards, and audit receipts." },
      { property: "og:title", content: "Governance & SIP · AiXin" },
      { property: "og:description", content: "Signal Intent Protocol (SIP), Decision Cards, and audit receipts." },
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

const PIPELINE = [
  { step: 1, title: "Natural-language intent", desc: "User asks the twin to do something." },
  { step: 2, title: "Structured intent JSON", desc: "LLM parses into schema (no execution)." },
  { step: 3, title: "Deterministic validation", desc: "Rules engine checks schema + policy." },
  { step: 4, title: "Human Decision Card", desc: "High-risk actions pause for approval." },
  { step: 5, title: "Signed receipt", desc: "Action is executed and anchored on-chain." },
];

const TOP_INVARIANTS = [
  { title: "Outcome Contract", desc: "Machine-readable objective, budget, guardrails, revocation key — signed at delegation." },
  { title: "Bounded Loops", desc: "Hard caps on steps, spend, scope, wall-clock. Exceed → auto-halt to Decision Card." },
  { title: "Pre-flight Reflection", desc: "Before each SIP call the twin self-checks intent vs. contract. Drift → refuse." },
  { title: "Revocation & Attestation", desc: "Owner can revoke on-chain; every loop emits a TOP attestation into the receipt." },
];

const FLYWHEEL = [
  { icon: Package, title: "Skill listing fee", desc: "Every SIP-compliant skill published to the AiXin marketplace burns $AXN." },
  { icon: ShieldCheck, title: "Validation staking", desc: "ERC-8004 validators stake $AXN to sign attestations; slashed on bad calls." },
  { icon: Coins, title: "Receipt anchoring", desc: "Per-receipt micro-fee in $AXN — paid by any agent (AiXin, OpenClaw, Hermes) anchoring to the Trust Graph." },
  { icon: Network, title: "Reputation access", desc: "Read-heavy consumers (insurers, enterprises, marketplaces) stake $AXN for query throughput on the reputation graph." },
];

const ADOPTION = [
  { label: "aixin.json manifest", value: "Declare skills, outcome contracts, risk tiers, revocation keys — one file at the repo root." },
  { label: "@aixin/sdk (10-min drop-in)", value: "wrapSip(handler) + wrapTop(agent) — any LangChain / AutoGen / custom agent becomes SIP+TOP compliant." },
  { label: "Marketplace badge", value: "\"SIP+TOP verified\" badge in ClawHub / Hermes Store — signals audit-grade governance to end users." },
  { label: "On-chain settlement", value: "Compliant agents emit receipts to the same BSC registries. Their reputation compounds into the AiXin Trust Graph." },
];

function GovernancePage() {
  const { t } = useI18n();
  const { state } = useWorkspace();
  const pending = state.decisionCards.filter((c) => c.status === "pending");
  const history = state.decisionCards.filter((c) => c.status !== "pending");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("gov.title")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t("gov.sub")}</p>
      </div>

      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-xs">
        <div className="font-display text-sm font-semibold">The AiXin Protocol = SIP + TOP</div>
        <p className="mt-1 text-muted-foreground max-w-3xl">
          Like HTTP + TLS or SMTP + DKIM, real trust protocols come in pairs. <span className="font-medium text-foreground">SIP</span> governs the <em>action</em> — the pilot's checklist. <span className="font-medium text-foreground">TOP</span> governs the <em>agent</em> — the flight envelope it must stay inside. Together they make an autonomous twin safe by default.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="font-display font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> SIP · {t("gov.pipeline")}</div>
          <p className="mt-2 text-xs text-muted-foreground max-w-3xl">
            <span className="font-medium text-foreground">Signal Intent Protocol</span> — the deterministic contract that converts an LLM's intent-signal into a governed, auditable action.
            <span className="block mt-1"><span className="font-medium">Signal</span>: LLM output is probabilistic — treat it as a signal, not a decision. <span className="font-medium">Intent</span>: captured as strict typed JSON — a contract, not prose. <span className="font-medium">Protocol</span>: like ERC-8004 or HTTPS — adopted, not replaced.</span>
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            {PIPELINE.map((p) => (
              <div key={p.step} className="relative rounded-lg border border-border bg-secondary/50 p-3 text-center">
                <div className="mx-auto grid h-6 w-6 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">{p.step}</div>
                <div className="mt-2 text-xs font-medium">{p.title}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">{p.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="font-display font-semibold flex items-center gap-2"><Compass className="h-4 w-4 text-primary" /> TOP · Twin Operating Protocol</div>
          <p className="mt-2 text-xs text-muted-foreground max-w-3xl">
            Four invariants baked into every twin's DNA. SIP asks <em>"is this specific action safe?"</em> — TOP asks <em>"is this agent still operating inside the outcome it was hired to deliver?"</em> Drift, runaway loops, and scope creep are stopped before they ever reach SIP.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {TOP_INVARIANTS.map((inv, i) => (
              <div key={inv.title} className="rounded-lg border border-border bg-secondary/50 p-3">
                <div className="grid h-6 w-6 place-items-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">{i + 1}</div>
                <div className="mt-2 text-xs font-medium">{inv.title}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">{inv.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="font-display font-semibold flex items-center gap-2"><Coins className="h-4 w-4 text-primary" /> Economic flywheel · $AXN</div>
          <p className="mt-2 text-xs text-muted-foreground max-w-3xl">
            The protocols are open. The moat is the on-chain Trust Graph every compliant agent — AiXin, OpenClaw, Hermes — settles into. Four $AXN sinks turn open adoption into token demand.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {FLYWHEEL.map((f) => (
              <div key={f.title} className="rounded-lg border border-border bg-secondary/50 p-3">
                <f.icon className="h-4 w-4 text-primary" />
                <div className="mt-2 text-xs font-medium">{f.title}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">{f.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="font-display font-semibold flex items-center gap-2"><Network className="h-4 w-4 text-primary" /> Adoption surface · how other agents plug in</div>
          <p className="mt-2 text-xs text-muted-foreground max-w-3xl">
            Compliance for an existing agent framework (LangChain, AutoGen, ClawHub skill, Hermes plugin) is a ~10-minute drop-in — not a rewrite. That's how the protocol goes viral.
          </p>
          <div className="mt-4 space-y-2">
            {ADOPTION.map((a) => (
              <div key={a.label} className="flex flex-col gap-1 rounded-lg border border-border bg-secondary/50 p-3 sm:flex-row sm:items-start sm:gap-4">
                <div className="w-full shrink-0 font-mono text-[11px] font-semibold text-primary sm:w-56">{a.label}</div>
                <div className="text-xs text-muted-foreground">{a.value}</div>
              </div>
            ))}
          </div>
          <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-sidebar p-3 font-mono text-[10px] leading-relaxed text-sidebar-foreground/90">{`// aixin.json  — drop at your agent repo root
{
  "agent": { "name": "claw-travel", "domain": "travel.openclaw.ai" },
  "sip": { "schema": "./schemas/travel.intent.json", "version": "1.0" },
  "top": {
    "outcome_contract": "./contracts/travel.outcome.json",
    "bounds": { "max_steps": 25, "max_spend_usd": 2000, "wallclock_s": 600 },
    "revocation_key": "0xA1x1N..."
  },
  "registries": { "identity": "bsc:0x...", "reputation": "bsc:0x...", "validation": "bsc:0x..." }
}`}</pre>
        </CardContent>
      </Card>


      <section>
        <div className="font-display font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> {t("gov.pending")} ({pending.length})</div>
        <div className="mt-3 space-y-3">
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending Decision Cards.</p>
          ) : (
            pending.map((card) => <DecisionCardItem key={card.id} card={card} />)
          )}
        </div>
      </section>

      <section>
        <div className="font-display font-semibold flex items-center gap-2"><Activity className="h-4 w-4 text-info" /> {t("gov.history")}</div>
        <div className="mt-3 space-y-3">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No decisions yet.</p>
          ) : (
            history.map((card) => <DecisionCardItem key={card.id} card={card} readonly />)
          )}
        </div>
      </section>

      <section>
        <div className="font-display font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-success" /> {t("gov.receipts")}</div>
        <div className="mt-3 space-y-2">
          {state.receipts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No anchored receipts yet.</p>
          ) : (
            state.receipts.map((r) => {
              const url = bscScanUrl(r.chainId ?? null, r.txHash ?? null);
              return (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 font-mono text-xs">
                  <div className="min-w-0">
                    <div className="font-medium text-foreground">{r.action}</div>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 inline-flex items-center gap-1 text-success hover:underline"
                      >
                        {r.hash} <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <div className="mt-0.5 text-success">{r.hash}</div>
                    )}
                  </div>
                  <div className="ml-3 flex flex-col items-end gap-1 text-right text-muted-foreground">
                    <div>{r.time}</div>
                    {r.anchorStatus === "anchored" ? (
                      <Badge className="text-[9px]">BSC Testnet · anchored</Badge>
                    ) : r.anchorStatus === "simulated" ? (
                      <Badge variant="outline" className="text-[9px]">simulated anchor</Badge>
                    ) : r.anchorStatus === "failed" ? (
                      <Badge variant="destructive" className="text-[9px]">anchor failed</Badge>
                    ) : null}
                    {r.isoBadge && <Badge variant="secondary" className="text-[9px]">ISO 42001</Badge>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function DecisionCardItem({ card, readonly }: { card: DecisionCard; readonly?: boolean }) {
  const decide = useServerFn(decideOnCard);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (args: { decision: "approve" | "reject"; reason?: string }) =>
      decide({ data: { cardId: card.id, decision: args.decision, reason: args.reason } }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEY });
      const rec = (res as { receipt?: { tx_hash?: string | null; anchor_status?: string } } | undefined)?.receipt;
      if (res && "status" in res && res.status === "approved") {
        toast.success(
          rec?.anchor_status === "anchored"
            ? `Approved · anchored on BSC Testnet: ${rec.tx_hash?.slice(0, 10)}…`
            : "Approved · receipt recorded (simulated anchor)",
        );
      } else if (res && "status" in res && res.status === "rejected") {
        toast.success(
          rec?.anchor_status === "anchored"
            ? `Rejected · reason anchored on BSC Testnet: ${rec.tx_hash?.slice(0, 10)}…`
            : "Rejected · reason recorded in signed receipt",
        );
      } else {
        toast("Decision recorded");
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const rec = card.evidence?.recommendation;

  const onReject = () => {
    const suggested =
      rec === "reject"
        ? "Duplicate refund — ledger shows customer already made whole."
        : rec === "hold"
        ? "Insufficient evidence — rejecting until customer clarifies."
        : "Rejected on human review.";
    const heading = rec
      ? `AI recommendation: ${rec.toUpperCase()}.\n\nReason for rejection (will be signed & anchored in the audit receipt):`
      : "Reason for rejection (will be signed & anchored in the audit receipt):";
    const reason = window.prompt(heading, suggested);
    if (reason === null) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error("A rejection reason is required for the audit trail.");
      return;
    }
    mutation.mutate({ decision: "reject", reason: trimmed });
  };

  const onApprove = () => {
    // Every approval captures a rationale — the human decision is the binding,
    // signed, on-chain act. Pre-fill differs when the human overrides an AI
    // REJECT/HOLD recommendation vs. confirming an AI APPROVE.
    const isOverride = rec === "reject" || rec === "hold";
    const suggested = isOverride
      ? rec === "reject"
        ? "Customer contacted again and confirmed non-receipt of prior refund — re-issuing after verification."
        : "Additional context received out-of-band — proceeding with approval."
      : "Confirmed — proceeding as recommended.";
    const heading = isOverride
      ? `You are OVERRIDING the AI recommendation (${rec!.toUpperCase()}).\n\nReason for approval (will be signed & anchored in the audit receipt):`
      : "Reason for approval (will be signed & anchored in the audit receipt):";
    const reason = window.prompt(heading, suggested);
    if (reason === null) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error("An approval rationale is required for the audit trail.");
      return;
    }
    mutation.mutate({ decision: "approve", reason: trimmed });
  };

  const ev = card.evidence;
  const recTone =
    ev?.recommendation === "reject"
      ? { label: "Recommend: REJECT", cls: "border-destructive/50 bg-destructive/10 text-destructive" }
      : ev?.recommendation === "hold"
      ? { label: "Recommend: HOLD for clarification", cls: "border-warning/50 bg-warning/10 text-warning-foreground" }
      : ev?.recommendation === "approve"
      ? { label: "Recommend: APPROVE", cls: "border-success/50 bg-success/10 text-success" }
      : null;

  return (
    <Card className={`p-4 ${card.risk === "high" ? "border-warning/50 bg-warning/5" : "border-border"}`}>
      <CardContent className="flex flex-col gap-4 p-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={card.risk === "high" ? "destructive" : "secondary"} className="text-[10px]">{card.risk.toUpperCase()} RISK</Badge>
              {ev?.duplicate_risk && <Badge variant="destructive" className="text-[10px]">DUPLICATE</Badge>}
              <span className="font-display font-semibold">{card.title}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {card.requestor} → {card.specialist}
            </div>
          </div>
          {!readonly ? (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={mutation.isPending} onClick={onReject}>
                <X className="h-4 w-4" /> Reject
              </Button>
              <Button size="sm" disabled={mutation.isPending} onClick={onApprove}>

                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve
              </Button>
            </div>
          ) : (
            <Badge variant={card.status === "approved" ? "default" : "outline"} className="w-fit text-[10px]">
              {card.status}
            </Badge>
          )}
        </div>

        {ev ? (
          <div className="grid gap-3">
            <section>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">The request</div>
              <p className="mt-1 text-sm leading-relaxed">
                {ev.customer?.name ?? ev.customer?.email ?? ev.email ?? "A customer"}
                {" "}is asking to refund
                {ev.order ? (
                  <> order <span className="font-medium">{ev.order.order_number}</span> for <span className="font-medium">${ev.order.amount.toFixed(2)} {ev.order.currency}</span></>
                ) : ev.order_number ? (
                  <> order <span className="font-medium">{ev.order_number}</span></>
                ) : (
                  <> a recent order</>
                )}
                {ev.order ? <>, currently status <span className="font-medium">"{ev.order.status}"</span>.</> : "."}
              </p>
            </section>

            <section>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ledger evidence</div>
              <div className="mt-1 grid gap-2 sm:grid-cols-3">
                <EvidenceStat label="Paid" value={`$${ev.totals.paid.toFixed(2)}`} />
                <EvidenceStat label="Already refunded" value={`$${ev.totals.refunded.toFixed(2)}`} tone={ev.totals.refunded > 0 ? "warn" : "muted"} />
                <EvidenceStat label="Net owed" value={`$${ev.totals.net_owed.toFixed(2)}`} tone={ev.totals.net_owed === 0 ? "warn" : "ok"} />
              </div>
              {ev.prior_refunds.length > 0 && (
                <div className="mt-2 rounded-md border border-border/60 bg-background/60 p-2 text-xs">
                  <div className="font-medium text-foreground">Prior refunds on this order:</div>
                  <ul className="mt-1 space-y-1">
                    {ev.prior_refunds.map((r) => (
                      <li key={r.id} className="text-muted-foreground">
                        • ${Number(r.amount).toFixed(2)} issued by <span className="font-mono">{r.issued_by_agent ?? "unknown"}</span>
                        {" "}· {r.governance_status ?? "n/a"} · {new Date(r.created_at).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {ev.flags.length > 0 && (
              <section>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Risk flags</div>
                <ul className="mt-1 space-y-1 text-sm">
                  {ev.flags.map((f, i) => (
                    <li key={i} className="flex gap-2 text-foreground">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {recTone && (
              <div className={`rounded-md border p-3 text-sm ${recTone.cls}`}>
                <div className="font-semibold">{recTone.label}</div>
                <p className="mt-1 text-xs opacity-90">
                  {ev.recommendation === "reject"
                    ? "Approving would issue a duplicate payout. The ledger shows this customer has already been made whole. Reject, or escalate to a human before any further money moves."
                    : ev.recommendation === "hold"
                    ? "Evidence is inconclusive. Ask the customer for the specific order number and reason before approving."
                    : "Ledger shows a valid, unrefunded order. Safe to approve — the receipt will be signed and anchored on BSC Testnet."}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="whitespace-pre-line rounded-md border border-border/50 bg-background/60 p-3 text-sm leading-relaxed text-foreground/90">
            {card.detail}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function EvidenceStat({ label, value, tone = "muted" }: { label: string; value: string; tone?: "muted" | "ok" | "warn" }) {
  const cls =
    tone === "warn" ? "text-warning" : tone === "ok" ? "text-success" : "text-foreground";
  return (
    <div className="rounded-md border border-border/60 bg-background/60 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-display text-lg font-semibold ${cls}`}>{value}</div>
    </div>
  );
}
