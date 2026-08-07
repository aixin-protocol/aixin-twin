import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Logo } from "@/components/site/Logo";
import { useI18n } from "@/lib/i18n";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "signin" ? ("signin" as const) : ("signup" as const),
  }),
  head: () => ({
    meta: [
      { title: "Sign up · AiXin" },
      { name: "description", content: "Create your AiXin account and hatch your Master Twin in under 2 minutes." },
      { property: "og:title", content: "Sign up · AiXin" },
      { property: "og:description", content: "Create your AiXin account and hatch your Master Twin." },
    ],
  }),
});

function AuthPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<"signup" | "signin">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const routeAfterAuth = async (announce: boolean) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data: twin } = await supabase
      .from("master_twins")
      .select("id")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    const dest = twin ? "/dashboard/ask" : "/onboarding";
    if (announce) {
      toast.success(twin ? "Signed in. Welcome back." : "Email confirmed. Continue to onboarding.");
    }
    navigate({ to: dest, replace: true });
  };

  useEffect(() => {
    let active = true;
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || event !== "SIGNED_IN" || !session?.user) return;
      void routeAfterAuth(true);
    });
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setNotice(null);
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        if (data.session) {
          await routeAfterAuth(false);
          toast.success("Account created. Continue to onboarding.");
        } else {
          const message = "Confirmation email sent. Click the email link; this page will continue automatically when confirmation is complete.";
          setNotice({ type: "success", message });
          toast.success(message);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await routeAfterAuth(false);
      }
    } catch (err) {
      const message = getAuthErrorMessage(err);
      setNotice({ type: "error", message });
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const showSocialUnavailable = (provider: "Google" | "WeChat") => {
    const message =
      provider === "Google"
        ? "Google sign-in is not active in this preview yet. Use email and password for this test."
        : "WeChat sign-in is not supported in this backend. Use email and password for now.";
    setNotice({ type: "error", message });
    toast.error(message);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo variant="dark" />
          <Link to="/" className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground">
            ← {t("auth.backhome")}
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col px-6 py-16">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-warm">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {mode === "signup" ? t("auth.signup.title") : t("auth.signin.title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup" ? t("auth.signup.sub") : t("auth.signin.sub")}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground">{t("auth.email")}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">{t("auth.password")}</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-coral px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-warm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signup" ? "Create account & continue" : "Sign in"}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {notice && (
            <div
              className={`mt-4 flex gap-2 rounded-lg border px-3 py-2.5 text-sm ${
                notice.type === "success"
                  ? "border-success/40 bg-success/10 text-foreground"
                  : "border-destructive/40 bg-destructive/10 text-foreground"
              }`}
              role="status"
              aria-live="polite"
            >
              {notice.type === "success" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              )}
              <span>{notice.message}</span>
            </div>
          )}

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            {t("auth.or")}
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg bg-card px-3 py-2.5 text-sm font-medium hover:bg-accent"
              onClick={() => showSocialUnavailable("Google")}
            >
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-lg bg-card px-3 py-2.5 text-sm font-medium hover:bg-accent"
              onClick={() => showSocialUnavailable("WeChat")}
            >
              微信
            </Button>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t("auth.terms")}
          </p>

          <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
            {mode === "signup" ? (
              <>
                {t("auth.have")}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setNotice(null);
                    setMode("signin");
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  {t("auth.signin.link")}
                </button>
              </>
            ) : (
              <>
                {t("auth.new")}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setNotice(null);
                    setMode("signup");
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  {t("auth.signup.link")}
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function getAuthErrorMessage(err: unknown) {
  const raw = err instanceof Error ? err.message : "Authentication failed";
  const message = raw.toLowerCase();
  if (message.includes("weak_password") || message.includes("known to be weak") || message.includes("pwned")) {
    return "That password is too common or has appeared in a breach. Choose a stronger, unique password.";
  }
  if (message.includes("security purposes") || message.includes("rate limit")) {
    return "Too many email attempts. Please wait a moment, then try again.";
  }
  if (message.includes("invalid login credentials")) {
    return "Incorrect email or password, or the account is not confirmed yet.";
  }
  if (message.includes("email not confirmed")) {
    return "Please confirm your email first, then sign in.";
  }
  return raw;
}
