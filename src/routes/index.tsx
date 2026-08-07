import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { LangToggle } from "@/components/site/LangToggle";
import { Logo } from "@/components/site/Logo";
import {
  Sparkles,
  Users,
  ShieldCheck,
  GitBranch,
  FileSignature,
  ArrowRight,
  Plane,
  Megaphone,
  Wallet,
  CircleCheck,
  ScanLine,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "AiXin — The trust layer for agentic AI" },
      {
        name: "description",
        content:
          "Hatch one Master Twin, govern a team of specialists, and anchor every action with a signed receipt. Bilingual EN/中文.",
      },
      { property: "og:title", content: "AiXin — The trust layer for agentic AI" },
      {
        property: "og:description",
        content:
          "Signal Intent Protocol, Decision Cards, and receipts anchored on BSC. Trust, made programmable.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

function Landing() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#pillars" className="hover:text-foreground">{t("nav.product")}</a>
            <a href="#flow" className="hover:text-foreground">{t("nav.governance")}</a>
            <a href="#cases" className="hover:text-foreground">{t("nav.marketplace")}</a>
            <a href="#token" className="hover:text-foreground">{t("nav.reputation")}</a>
          </nav>
          <div className="flex items-center gap-3">
            <LangToggle />
            <Link
              to="/auth"
              search={{ mode: "signin" }}
              className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
            >
              {t("nav.signin")}
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-warm transition hover:brightness-105"
            >
              {t("nav.getstarted")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid-cream opacity-40" />
        <div className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-[-10%] h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 lg:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {t("hero.eyebrow")}
            </div>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              {t("hero.title")}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {t("hero.sub")}
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-warm transition hover:brightness-105"
              >
                {t("hero.cta.primary")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/auth"
                search={{ mode: "signin" }}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
              >
                {t("hero.cta.secondary")}
              </Link>
            </div>
            <div className="mt-6 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {t("hero.badge")}
            </div>
          </div>

          {/* Hero visual: Master twin + specialists */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="rounded-3xl border border-border bg-card p-3 shadow-warm">
              <div className="rounded-2xl bg-sidebar p-6 text-sidebar-foreground">
                <div className="flex items-center justify-between border-b border-sidebar-border pb-4">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-sidebar-foreground/60">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    Command Center · Live delegation
                  </div>
                  <div className="text-xs font-mono text-sidebar-foreground/60">bsc-testnet</div>
                </div>
                <div className="grid gap-6 pt-6 lg:grid-cols-[1fr_2fr]">
                  <div className="space-y-3">
                    <div className="text-[11px] font-mono uppercase tracking-widest text-sidebar-foreground/50">
                      Master Twin
                    </div>
                    <div className="rounded-xl border border-sidebar-border bg-sidebar-accent p-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-coral">
                          <Sparkles className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">AiXin</div>
                          <div className="font-mono text-[11px] text-sidebar-foreground/60">
                            0x71C…9f · trust 4.92
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono uppercase tracking-widest text-sidebar-foreground/50">
                      Delegation feed
                    </div>
                    <FeedRow icon={<Plane className="h-3.5 w-3.5" />} tone="ok" text="Travel Twin · booked SFO→PVG · receipt #a19f" />
                    <FeedRow icon={<Megaphone className="h-3.5 w-3.5" />} tone="warn" text="Marketing Twin · paused · Decision Card open" />
                    <FeedRow icon={<Wallet className="h-3.5 w-3.5" />} tone="ok" text="Finance Twin · reconciled 42 invoices · receipt #a1a0" />
                    <FeedRow icon={<ShieldCheck className="h-3.5 w-3.5" />} tone="ok" text="SIP · schema OK · rules 12/12 · anchored" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section id="pillars" className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight md:text-4xl">
            {t("pillars.title")}
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Pillar icon={<Sparkles />} t={t("pillars.1.t")} d={t("pillars.1.d")} />
            <Pillar icon={<Users />} t={t("pillars.2.t")} d={t("pillars.2.d")} />
            <Pillar icon={<GitBranch />} t={t("pillars.3.t")} d={t("pillars.3.d")} />
            <Pillar icon={<ShieldCheck />} t={t("pillars.4.t")} d={t("pillars.4.d")} />
            <Pillar icon={<FileSignature />} t={t("pillars.5.t")} d={t("pillars.5.d")} />
          </div>
        </div>
      </section>

      {/* Flow */}
      <section id="flow" className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <h2 className="max-w-3xl font-display text-3xl font-semibold tracking-tight md:text-4xl">
            {t("flow.title")}
          </h2>
          <div className="mt-12 grid gap-3 md:grid-cols-5">
            {[t("flow.1"), t("flow.2"), t("flow.3"), t("flow.4"), t("flow.5")].map((step, i) => (
              <div key={i} className="relative rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="font-mono text-[11px] uppercase tracking-widest text-primary">
                  Step {i + 1}
                </div>
                <div className="mt-2 text-sm font-medium leading-snug">{step}</div>
                {i < 4 && (
                  <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="cases" className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{t("cases.title")}</h2>
            <p className="mt-3 text-muted-foreground">{t("cases.sub")}</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <CaseCard icon={<Plane className="h-5 w-5" />} title={t("cases.travel")} desc={t("cases.travel.d")} />
            <CaseCard icon={<Megaphone className="h-5 w-5" />} title={t("cases.marketing")} desc={t("cases.marketing.d")} />
            <CaseCard icon={<Wallet className="h-5 w-5" />} title={t("cases.finance")} desc={t("cases.finance.d")} />
          </div>
        </div>
      </section>

      {/* Token / Ledger Preview */}
      <section id="token" className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-primary">
                <ScanLine className="h-3.5 w-3.5" />
                {t("token.badge")}
              </div>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                {t("token.title")}
              </h2>
              <p className="mt-4 text-muted-foreground">{t("token.sub")}</p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-warm">
              <div className="grid gap-4 sm:grid-cols-2">
                <LedgerCell label="Earning pool" value="1,240.00" unit="AXN" />
                <LedgerCell label="Staked · 1.6× mult" value="800.00" unit="AXN" />
                <LedgerCell label="Access bond" value="200.00" unit="AXN" />
                <LedgerCell label="Burn (24h)" value="12.40" unit="AXN" tone="warn" />
              </div>
              <div className="mt-5 rounded-xl border border-border bg-secondary/60 p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono uppercase tracking-widest">Latest receipt</span>
                  <span className="inline-flex items-center gap-1 text-success">
                    <CircleCheck className="h-3.5 w-3.5" /> anchored
                  </span>
                </div>
                <div className="mt-2 font-mono text-xs">
                  0xa19f…c3b7 · bsc-testnet · block 42,981,203
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60 bg-sidebar text-sidebar-foreground">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            {t("hero.title")}
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-warm hover:brightness-105"
            >
              {t("hero.cta.primary")} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signin" }}
              className="inline-flex items-center gap-2 rounded-full border border-sidebar-border px-6 py-3 text-sm font-semibold text-sidebar-foreground hover:bg-sidebar-accent"
            >
              {t("hero.cta.secondary")}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-6 py-10 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="text-sm text-muted-foreground">{t("footer.tagline")}</span>
          </div>
          <div className="text-xs text-muted-foreground">{t("footer.copy")}</div>
        </div>
      </footer>
    </div>
  );
}

function Pillar({ icon, t, d }: { icon: React.ReactNode; t: string; d: string }) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-warm">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
        <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      </div>
      <div className="mt-4 font-display text-base font-semibold">{t}</div>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d}</p>
    </div>
  );
}

function CaseCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-coral text-primary-foreground">
          {icon}
        </div>
        <div className="font-display text-lg font-semibold">{title}</div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{desc}</p>
      <button className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary hover:gap-1.5 transition-all">
        Install skills <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function LedgerCell({
  label,
  value,
  unit,
  tone = "default",
}: {
  label: string;
  value: string;
  unit: string;
  tone?: "default" | "warn";
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/50 p-4">
      <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <div className={`font-display text-2xl font-semibold ${tone === "warn" ? "text-destructive" : ""}`}>
          {value}
        </div>
        <div className="font-mono text-xs text-muted-foreground">{unit}</div>
      </div>
    </div>
  );
}

function FeedRow({
  icon,
  text,
  tone,
}: {
  icon: React.ReactNode;
  text: string;
  tone: "ok" | "warn";
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/50 px-3 py-2 font-mono text-xs">
      <span
        className={`grid h-6 w-6 place-items-center rounded ${
          tone === "warn" ? "bg-warning/20 text-warning" : "bg-primary/15 text-primary"
        }`}
      >
        {icon}
      </span>
      <span className="text-sidebar-foreground/80">{text}</span>
    </div>
  );
}
