"use client";

import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace";
import { Logo } from "@/components/site/Logo";
import { LangToggle } from "@/components/site/LangToggle";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Bell, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getUnreadCount } from "@/lib/task-thread.functions";


export function TopBar() {
  const { t } = useI18n();
  const { state, dispatch } = useWorkspace();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchUnread = useServerFn(getUnreadCount);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let alive = true;
    let ch: ReturnType<typeof supabase.channel> | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;

    const load = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      try {
        const r = await fetchUnread();
        if (alive) setUnread(r.unreadMessages);
      } catch {}
    };

    const start = async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive || !data.session) return;
      load();
      ch = supabase
        .channel("topbar:unread")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "task_messages" }, load)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "task_outcomes" }, load)
        .subscribe();
      interval = setInterval(load, 20000);
    };
    start();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setUnread(0);
    });

    return () => {
      alive = false;
      if (interval) clearInterval(interval);
      if (ch) supabase.removeChannel(ch);
      sub.subscription.unsubscribe();
    };
  }, [fetchUnread]);

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
  };


  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar px-6 text-sidebar-foreground">
      <div className="flex items-center gap-4">
        <Logo variant="dark" />
        <Badge
          variant="outline"
          className="hidden border-sidebar-border/60 bg-sidebar-accent/50 text-sidebar-foreground/80 sm:inline-flex"
        >
          {t("dash.seedRound")}
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        <ToggleGroup
          type="single"
          value={state.mode}
          onValueChange={(v) => {
            if (v === "test" || v === "live") dispatch({ type: "SET_MODE", mode: v });
          }}
          className="rounded-lg border border-sidebar-border bg-sidebar-accent/30 p-0.5"
        >
          <ToggleGroupItem
            value="test"
            aria-label="Test mode"
            className="h-7 px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Test
          </ToggleGroupItem>
          <ToggleGroupItem
            value="live"
            aria-label="Live mode"
            className="h-7 px-3 text-xs data-[state=on]:bg-success data-[state=on]:text-success-foreground"
          >
            Live
          </ToggleGroupItem>
        </ToggleGroup>
        <LangToggle />
        <Link
          to="/dashboard/tasks"
          className="relative grid h-8 w-8 place-items-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 font-mono text-[9px] font-semibold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
        <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-coral font-display text-xs font-semibold text-primary-foreground">
          {state.masterTwin.initials || "A"}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="h-8 gap-1.5 px-2 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden text-xs sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
