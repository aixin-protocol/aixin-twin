import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plug,
  CheckCircle2,
  CircleDashed,
  AlertTriangle,
  Plus,
  Loader2,
  Send,
  Mail,
  Webhook,
  Link2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  listAdapters,
  upsertAdapter,
  setAdapterMode,
  disconnectAdapter,
  sendTestEmail,
} from "@/lib/adapters.functions";


export const Route = createFileRoute("/dashboard/adapters")({
  component: AdaptersPage,
  head: () => ({
    meta: [
      { title: "Adapters · AiXin" },
      { name: "description", content: "Connect Telegram, Gmail, webhooks and custom adapters so your Specialist Twins can act in the real world." },
      { property: "og:title", content: "Adapters · AiXin" },
      { property: "og:description", content: "Connect Telegram, Gmail, webhooks and custom adapters so your Specialist Twins can act in the real world." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type AdapterRow = {
  id: string;
  provider: string;
  kind: string;
  mode: "test" | "live";
  status: "connected" | "disconnected" | "error";
  config: Record<string, unknown>;
};

type CatalogEntry = {
  provider: string;
  kind: string;
  icon: React.ComponentType<{ className?: string }>;
  blurb: string;
  fields: Array<{ name: string; label: string; type?: "text" | "password"; placeholder?: string; help?: string }>;
  system?: boolean; // built-in, always connected
  systemMode?: "test" | "live";
  systemHint?: string;
};

const CURATED: CatalogEntry[] = [
  {
    provider: "Telegram",
    kind: "chat",
    icon: Send,
    blurb: "Talk to your Master Twin from your phone. Receives task briefings and status pings.",
    fields: [],
    system: true,
    systemMode: "live",
    systemHint: "Uses the AiXin bot. Link your chat from the dashboard Telegram card.",
  },
  {
    provider: "Gmail",
    kind: "email",
    icon: Mail,
    blurb:
      "Send real email from a Specialist via the Gmail API (HTTPS OAuth). Switch to Live to deliver outcomes to your inbox.",
    fields: [
      { name: "from_email", label: "From email", type: "text", placeholder: "you@gmail.com" },
      { name: "client_id", label: "OAuth client ID", type: "text", placeholder: "xxxx.apps.googleusercontent.com", help: "Google Cloud → APIs & Services → Credentials → OAuth client (Web)" },
      { name: "client_secret", label: "OAuth client secret", type: "password", placeholder: "GOCSPX-…" },
      { name: "refresh_token", label: "Refresh token", type: "password", placeholder: "1//0g…", help: "Scope https://www.googleapis.com/auth/gmail.send — get one via the OAuth Playground" },
    ],
  },

  {
    provider: "Webhook",
    kind: "webhook",
    icon: Webhook,
    blurb: "POST signed receipts to any HTTPS endpoint — Zapier, Make, n8n or your own service.",
    fields: [
      { name: "url", label: "Endpoint URL", type: "text", placeholder: "https://hooks.example.com/aixin" },
      { name: "secret", label: "Signing secret (optional)", type: "password", placeholder: "HMAC secret" },
    ],
  },
  {
    provider: "BSC Testnet",
    kind: "chain",
    icon: ShieldCheck,
    blurb: "Audit anchoring on chain 97. Every approved action gets a signed on-chain receipt.",
    fields: [],
    system: true,
    systemMode: "live",
    systemHint: "System adapter · already wired for every receipt.",
  },
];

const MARKETPLACE = [
  { provider: "Slack", kind: "chat", blurb: "Post decision cards and receipts to a channel." },
  { provider: "Notion", kind: "docs", blurb: "Sync outcomes to a Notion database." },
  { provider: "Stripe", kind: "payments", blurb: "Charges, refunds and payouts through the governance pipeline." },
  { provider: "Google Sheets", kind: "data", blurb: "Log every action to a spreadsheet in real time." },
  { provider: "Shopify", kind: "commerce", blurb: "Order lookup, refunds, inventory updates." },
  { provider: "HubSpot", kind: "crm", blurb: "Contact enrichment and outreach for Sales Specialists." },
  { provider: "GitHub", kind: "devops", blurb: "Open PRs and file issues from an Engineering Twin." },
  { provider: "Zendesk", kind: "support", blurb: "Ticket triage and refunds for Support Twins." },
];

function statusIcon(status: AdapterRow["status"]) {
  if (status === "connected") return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (status === "error") return <AlertTriangle className="h-4 w-4 text-destructive" />;
  return <CircleDashed className="h-4 w-4 text-muted-foreground" />;
}

function AdaptersPage() {
  const fetchAdapters = useServerFn(listAdapters);
  const { data: adapters = [] } = useQuery({
    queryKey: ["adapters"],
    queryFn: () => fetchAdapters(),
    refetchOnWindowFocus: false,
  });

  const byKey = new Map<string, AdapterRow>();
  (adapters as AdapterRow[]).forEach((a) => byKey.set(`${a.provider}:${a.kind}`, a));

  const custom = (adapters as AdapterRow[]).filter(
    (a) => !CURATED.some((c) => c.provider === a.provider && c.kind === a.kind),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Adapters</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Real-world connections your Specialist Twins use to act. Every call is signed, receipted,
            and — for high-risk actions — routed through a Decision Card before it leaves this app.
          </p>
        </div>
        <CustomAdapterDialog />
      </div>

      <Tabs defaultValue="mine" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mine">My adapters</TabsTrigger>
          <TabsTrigger value="marketplace">
            Marketplace <Badge variant="outline" className="ml-2 text-[10px]">Coming soon</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {CURATED.map((c) => (
              <AdapterCard
                key={`${c.provider}:${c.kind}`}
                catalog={c}
                row={byKey.get(`${c.provider}:${c.kind}`)}
              />
            ))}
          </div>

          {custom.length > 0 && (
            <div className="space-y-2 pt-2">
              <h2 className="text-sm font-semibold text-muted-foreground">Custom adapters</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {custom.map((row) => (
                  <AdapterCard
                    key={row.id}
                    catalog={{
                      provider: row.provider,
                      kind: row.kind,
                      icon: Link2,
                      blurb: "Custom adapter you added.",
                      fields: [],
                    }}
                    row={row}
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-2">
          <p className="text-xs text-muted-foreground">
            These providers are on the roadmap. Vote to bump priority — the top-voted lands next.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {MARKETPLACE.map((m) => (
              <Card key={m.provider}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded-md bg-secondary">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="font-display text-sm font-semibold">{m.provider}</div>
                    <Badge variant="outline" className="ml-auto text-[10px] uppercase">{m.kind}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{m.blurb}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => toast.success(`Vote recorded for ${m.provider}`)}
                  >
                    Request
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CustomAdapterDialog() {
  const qc = useQueryClient();
  const upsert = useServerFn(upsertAdapter);
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState("");
  const [kind, setKind] = useState("api");
  const [mode, setMode] = useState<"test" | "live">("test");
  const [configJson, setConfigJson] = useState("{}");

  const save = useMutation({
    mutationFn: async () => {
      let config: Record<string, unknown> = {};
      try {
        config = configJson.trim() ? JSON.parse(configJson) : {};
      } catch {
        throw new Error("Config must be valid JSON");
      }
      return upsert({
        data: { provider: provider.trim(), kind: kind.trim(), mode, status: "connected", config },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adapters"] });
      toast.success(`${provider} added`);
      setOpen(false);
      setProvider("");
      setConfigJson("{}");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-1 h-3 w-3" /> Custom adapter
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a custom adapter</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Provider</Label>
              <Input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Airtable" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Kind</Label>
              <Input value={kind} onChange={(e) => setKind(e.target.value)} placeholder="api" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Mode</Label>
            <ToggleGroup type="single" value={mode} onValueChange={(v) => v && setMode(v as "test" | "live")}>
              <ToggleGroupItem value="test">Test</ToggleGroupItem>
              <ToggleGroupItem value="live">Live</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Config (JSON)</Label>
            <Textarea
              rows={5}
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              placeholder={'{\n  "api_key": "..."\n}'}
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Stored server-side. Reference keys from Skill rules by name (e.g. <code>{`{{adapter.api_key}}`}</code>).
            </p>
          </div>
          <Button
            className="w-full"
            onClick={() => save.mutate()}
            disabled={save.isPending || !provider.trim()}
          >
            {save.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
            Save adapter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AdapterCard({ catalog, row }: { catalog: CatalogEntry; row?: AdapterRow }) {
  const qc = useQueryClient();
  const upsert = useServerFn(upsertAdapter);
  const setMode = useServerFn(setAdapterMode);
  const disconnect = useServerFn(disconnectAdapter);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    catalog.fields.forEach((f) => (init[f.name] = (row?.config?.[f.name] as string) ?? ""));
    return init;
  });

  const connect = useMutation({
    mutationFn: (mode: "test" | "live") =>
      upsert({
        data: {
          provider: catalog.provider,
          kind: catalog.kind,
          mode,
          status: "connected",
          config: values,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adapters"] });
      toast.success(`${catalog.provider} connected`);
      setOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const toggleMode = useMutation({
    mutationFn: (mode: "test" | "live") => setMode({ data: { id: row!.id, mode } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adapters"] }),
  });

  const disc = useMutation({
    mutationFn: () => disconnect({ data: { id: row!.id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adapters"] });
      toast.success("Disconnected");
    },
  });

  const testSend = useServerFn(sendTestEmail);
  const testEmail = useMutation({
    mutationFn: () => testSend({ data: {} }),
    onSuccess: (r) => toast.success(`Test email sent to ${r.to}`),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Send failed"),
  });



  const Icon = catalog.icon;
  const isConnected = row?.status === "connected" || catalog.system;
  const displayMode = catalog.system ? catalog.systemMode ?? "live" : row?.mode;

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-display font-semibold">
                {catalog.provider}
                <Badge variant="outline" className="text-[10px] uppercase">{catalog.kind}</Badge>
                {catalog.system && (
                  <Badge variant="secondary" className="text-[10px] uppercase">System</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{catalog.blurb}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {statusIcon(catalog.system ? "connected" : row?.status ?? "disconnected")}
            <span className="capitalize text-muted-foreground">
              {catalog.system ? "connected" : row?.status ?? "not connected"}
            </span>
          </div>
        </div>

        {catalog.system ? (
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="uppercase">{displayMode}</Badge>
            <span>{catalog.systemHint}</span>
          </div>
        ) : isConnected && row ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ToggleGroup
              type="single"
              value={row.mode}
              onValueChange={(v) => v && toggleMode.mutate(v as "test" | "live")}
              className="rounded-md border border-border bg-secondary/60 p-0.5"
            >
              <ToggleGroupItem value="test" className="h-7 px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                Test
              </ToggleGroupItem>
              <ToggleGroupItem value="live" className="h-7 px-3 text-xs data-[state=on]:bg-success data-[state=on]:text-success-foreground">
                Live
              </ToggleGroupItem>
            </ToggleGroup>
            <div className="flex flex-wrap items-center gap-1">
              {catalog.kind === "email" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testEmail.mutate()}
                  disabled={testEmail.isPending}
                >
                  {testEmail.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                  Send test
                </Button>
              )}
              {catalog.fields.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
                  Edit
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => disc.mutate()} disabled={disc.isPending}>
                Disconnect
              </Button>
            </div>
            {catalog.fields.length > 0 && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit {catalog.provider} credentials</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    {catalog.fields.map((f) => (
                      <div key={f.name} className="space-y-1">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">{f.label}</Label>
                        <Input
                          type={f.type ?? "text"}
                          value={values[f.name] ?? ""}
                          onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                          placeholder={f.placeholder}
                        />
                        {f.help && <p className="text-[11px] text-muted-foreground">{f.help}</p>}
                      </div>
                    ))}
                    <Button className="w-full" onClick={() => connect.mutate(row.mode)} disabled={connect.isPending}>
                      {connect.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                      Save credentials
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="w-full">
                <Plus className="mr-1 h-3 w-3" /> Connect
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect {catalog.provider}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {catalog.fields.map((f) => (
                  <div key={f.name} className="space-y-1">
                    <Label htmlFor={f.name} className="text-xs uppercase tracking-wide text-muted-foreground">
                      {f.label}
                    </Label>
                    <Input
                      id={f.name}
                      type={f.type ?? "text"}
                      value={values[f.name] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                      placeholder={f.placeholder}
                    />
                    {f.help && <p className="text-[11px] text-muted-foreground">{f.help}</p>}
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => connect.mutate("test")}
                    disabled={connect.isPending}
                  >
                    {connect.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                    Save · Test
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => connect.mutate("live")}
                    disabled={connect.isPending}
                  >
                    Save · Live
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Test keys stay in sandbox. Live keys still route every high-risk action through the SIP pipeline.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
