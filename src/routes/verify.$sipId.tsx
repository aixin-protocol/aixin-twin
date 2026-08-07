import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { LangToggle } from "@/components/site/LangToggle";
import { Logo } from "@/components/site/Logo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, ShieldAlert, ExternalLink, ArrowLeft } from "lucide-react";

type VerifyResponse = {
  found: boolean;
  sip_id: string;
  action?: string | null;
  created_at?: string;
  payload_hash?: string;
  signature?: string | null;
  public_key?: string | null;
  validator_url?: string | null;
  signed?: boolean;
  degraded_reason?: string | null;
  anchor?: {
    status: string;
    tx_hash: string | null;
    chain_id: number | null;
    block_number: number | null;
    explorer_url: string | null;
  };
  erc8004?: {
    agent_id: number | null;
    identity_tx_hash: string | null;
    reputation_tx_hash: string | null;
    validation_tx_hash: string | null;
    validation_response: number | null;
  };
  iso_badge?: boolean;
};

export const Route = createFileRoute("/verify/$sipId")({
  component: VerifyPage,
  head: () => ({
    meta: [
      { title: "Verify receipt · AiXin" },
      {
        name: "description",
        content: "Independently verify an AiXin signed receipt: payload hash, Ed25519 signature, validator key and BSC Testnet anchor.",
      },
      { property: "og:title", content: "Verify receipt · AiXin" },
      {
        property: "og:description",
        content: "Independently verify an AiXin signed receipt: payload hash, signature, validator key and on-chain anchor.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function Row({ label, value, mono = true }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-border/60 py-2 last:border-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-3">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={`min-w-0 break-all text-sm ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function VerifyPage() {
  const { sipId } = Route.useParams();
  const { t } = useI18n();

  const { data, isLoading, error } = useQuery<VerifyResponse>({
    queryKey: ["verify", sipId],
    queryFn: async () => {
      const res = await fetch(`/api/public/verify/${encodeURIComponent(sipId)}`);
      if (res.status === 404) return (await res.json()) as VerifyResponse;
      if (!res.ok) throw new Error(`verify failed (${res.status})`);
      return (await res.json()) as VerifyResponse;
    },
  });

  const signed = !!data?.signed;
  const anchored = data?.anchor?.status === "anchored";

  return (
    <main className="min-h-screen bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <Logo />
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <LangToggle />
        </div>
      </header>

      <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> {t("verify.back")}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("verify.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("verify.subtitle")}</p>

        <Card className="mt-6">
          <CardContent className="p-4 sm:p-6">
            {isLoading && <p className="text-sm text-muted-foreground">{t("verify.loading")}</p>}
            {error && <p className="text-sm text-destructive">{t("verify.error")}</p>}
            {data && !data.found && (
              <div>
                <Badge variant="outline" className="border-destructive/30 bg-destructive/15 text-destructive">
                  {t("verify.notFound")}
                </Badge>
                <p className="mt-3 break-all font-mono text-xs text-muted-foreground">{sipId}</p>
              </div>
            )}

            {data?.found && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      signed
                        ? "border-success/30 bg-success/15 text-success"
                        : "border-destructive/30 bg-destructive/15 text-destructive"
                    }
                  >
                    {signed ? (
                      <ShieldCheck className="mr-1 h-3 w-3" />
                    ) : (
                      <ShieldAlert className="mr-1 h-3 w-3" />
                    )}
                    {signed ? t("verify.signatureValid") : t("rep.unsigned")}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={anchored ? "border-success/30 bg-success/15 text-success" : "border-border bg-muted text-muted-foreground"}
                  >
                    {anchored ? t("rep.anchored") : t("rep.notAnchored")}
                  </Badge>
                  {data.iso_badge && <Badge variant="secondary">ISO/IEC 42001</Badge>}
                </div>

                {!signed && data.degraded_reason && (
                  <p className="text-xs text-destructive">{data.degraded_reason}</p>
                )}

                <div>
                  <Row label={t("verify.action")} value={data.action ?? "—"} mono={false} />
                  <Row label="SIP ID" value={data.sip_id} />
                  <Row label={t("verify.payloadHash")} value={data.payload_hash ?? "—"} />
                  <Row label={t("verify.signature")} value={data.signature ?? t("verify.none")} />
                  <Row label={t("verify.publicKey")} value={data.public_key ?? t("verify.none")} />
                  <Row label={t("verify.validator")} value={data.validator_url ?? t("verify.inProcess")} mono={false} />
                  <Row
                    label={t("verify.anchorTx")}
                    value={
                      data.anchor?.explorer_url ? (
                        <a
                          href={data.anchor.explorer_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          {data.anchor.tx_hash} <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        t("rep.notAnchored")
                      )
                    }
                  />
                  <Row
                    label={t("verify.chain")}
                    value={data.anchor?.chain_id ? `${data.anchor.chain_id}${data.anchor.block_number ? ` · block ${data.anchor.block_number}` : ""}` : "—"}
                  />
                  {data.erc8004?.identity_tx_hash && (
                    <Row label="ERC-8004 Identity" value={data.erc8004.identity_tx_hash} />
                  )}
                  {data.erc8004?.reputation_tx_hash && (
                    <Row label="ERC-8004 Reputation" value={data.erc8004.reputation_tx_hash} />
                  )}
                  {data.erc8004?.validation_tx_hash && (
                    <Row label="ERC-8004 Validation" value={data.erc8004.validation_tx_hash} />
                  )}
                  <Row
                    label={t("verify.createdAt")}
                    value={data.created_at ? new Date(data.created_at).toLocaleString() : "—"}
                    mono={false}
                  />
                </div>

                <p className="rounded-md border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
                  {t("verify.howTo")}{" "}
                  <code className="break-all font-mono">GET /api/public/verify/{data.sip_id}</code>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
