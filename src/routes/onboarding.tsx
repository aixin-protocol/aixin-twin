import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Logo } from "@/components/site/Logo";
import { useI18n } from "@/lib/i18n";
import { ArrowRight, Sparkles, CircleCheck } from "lucide-react";
import { hatchMasterTwin } from "@/lib/twins.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  head: () => ({
    meta: [
      { title: "Hatch your Master Twin · AiXin" },
      { name: "description", content: "Three quick steps: name your Master Twin, describe its expertise, and hatch." },
      { property: "og:title", content: "Hatch your Master Twin · AiXin" },
      { property: "og:description", content: "Name, expertise, hatch. Your Master Twin orchestrates every Specialist." },
    ],
  }),
});

const EXPERTISE_PRESETS = [
  "Investor & analyst",
  "Travel & lifestyle",
  "Growth marketer",
  "Operations manager",
];

function OnboardingPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [expertise, setExpertise] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const hatch = useServerFn(hatchMasterTwin);

  useEffect(() => {
    let active = true;
    import("@/integrations/supabase/client").then(async ({ supabase }) => {
      const { data: sess } = await supabase.auth.getSession();
      if (!active) return;
      if (!sess.session) {
        navigate({ to: "/auth", search: { mode: "signin" } });
        return;
      }
      const { data: twin } = await supabase
        .from("master_twins")
        .select("id")
        .eq("user_id", sess.session.user.id)
        .maybeSingle();
      if (active && twin) navigate({ to: "/dashboard/ask", replace: true });
    });
    return () => { active = false; };
  }, [navigate]);

  const stepLabel = useMemo(
    () => (step === 1 ? t("onb.step1") : step === 2 ? t("onb.step2") : t("onb.step3")),
    [step, t],
  );

  const canContinue = step === 1 ? name.trim().length > 0 : step === 2 ? expertise.trim().length > 0 : true;

  const next = async () => {
    if (step < 3) {
      setStep((s) => (s + 1) as 1 | 2 | 3);
      return;
    }
    try {
      setSubmitting(true);
      await hatch({ data: { name: name.trim(), expertise: expertise.trim() } });
      toast.success(t("onb.hatch"));
      navigate({ to: "/dashboard/ask" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to hatch");
    } finally {
      setSubmitting(false);
    }
  };
  const back = () => {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3);
  };

  const initial = name.trim().charAt(0).toUpperCase() || "M";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo variant="dark" />
          <div className="font-mono text-[11px] uppercase tracking-widest text-sidebar-foreground/60">
            {t("onb.label")}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-xl flex-col px-6 py-14">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-warm">
          <div className="font-mono text-[11px] uppercase tracking-widest text-primary">
            {t("onb.step")} {step} / 3
          </div>
          <div className="mt-1 text-sm font-medium">{stepLabel}</div>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-gradient-coral transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          <div className="mt-8">
            <h1 className="font-display text-3xl font-semibold tracking-tight">{t("onb.title")}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("onb.sub")}</p>
          </div>

          <div className="mt-8">
            {step === 1 && (
              <div>
                <label className="text-xs font-medium">{t("onb.name.label")}</label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("onb.name.ph")}
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="mt-2 text-xs text-muted-foreground">{t("onb.name.hint")}</p>
              </div>
            )}

            {step === 2 && (
              <div>
                <label className="text-xs font-medium">{t("onb.exp.label")}</label>
                <textarea
                  autoFocus
                  value={expertise}
                  onChange={(e) => setExpertise(e.target.value)}
                  placeholder={t("onb.exp.ph")}
                  rows={4}
                  className="mt-1.5 w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <div className="mt-4 text-xs text-muted-foreground">{t("onb.exp.presets")}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {EXPERTISE_PRESETS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setExpertise(p)}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        expertise === p
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground hover:bg-accent"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="rounded-xl border border-border bg-secondary/40 p-6 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-xl bg-success/25 font-display text-2xl font-semibold text-success">
                  {initial}
                </div>
                <div className="mt-3 font-display text-xl font-semibold">{name || "Master"}</div>
                <div className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {t("onb.badge")}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{expertise || "—"}</div>
                <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-success">
                  <CircleCheck className="h-3.5 w-3.5" /> {t("onb.ready")}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={back}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                {t("onb.back")}
              </button>
            ) : (
              <Link
                to="/auth"
                search={{ mode: "signin" }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← {t("onb.exit")}
              </Link>
            )}

            <button
              onClick={next}
              disabled={!canContinue || submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-coral px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-warm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {step === 3 ? (
                <>
                  <Sparkles className="h-4 w-4" />
                  {t("onb.hatch")}
                </>
              ) : (
                <>
                  {t("onb.continue")}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
