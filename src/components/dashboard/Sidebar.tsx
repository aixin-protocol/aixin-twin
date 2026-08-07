"use client";

import { Link, useRouterState } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace";
import {
  LayoutGrid,
  Users,
  Zap,
  ShieldCheck,
  Award,
  Plug,
  GitBranch,
  Sparkles,
  ListChecks,
  Database,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useEffect, useState } from "react";

const primary = { to: "/dashboard/ask", icon: Sparkles, key: "dash.ask" };

const nav = [
  { to: "/dashboard", icon: LayoutGrid, key: "dash.commandCenter", exact: true },
  { to: "/dashboard/tasks", icon: ListChecks, key: "dash.tasks" },
  { to: "/dashboard/specialists", icon: Users, key: "dash.specialists" },
  { to: "/dashboard/skills", icon: Zap, key: "dash.skills" },
  { to: "/dashboard/governance", icon: ShieldCheck, key: "dash.governance" },
  { to: "/dashboard/ledger", icon: Database, key: "dash.ledger" },
  { to: "/dashboard/reputation", icon: Award, key: "dash.reputation" },
  { to: "/dashboard/adapters", icon: Plug, key: "dash.adapters" },
  { to: "/dashboard/committer", icon: GitBranch, key: "dash.committer" },
];

const STORAGE_KEY = "aixin.sidebar.collapsed";

export function Sidebar() {
  const { t } = useI18n();
  const { state } = useWorkspace();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "1") setCollapsed(true);
    } catch {}
  }, []);
  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  const master = state.masterTwin;

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <aside
      className={`flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} px-3 pt-4`}>
        {!collapsed && (
          <div className="font-mono text-[10px] uppercase tracking-widest text-sidebar-foreground/50">
            {t("dash.workspace")}
          </div>
        )}
        <button
          onClick={toggle}
          className="grid h-8 w-8 place-items-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          title={collapsed ? "Expand" : "Collapse"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <div className={`${collapsed ? "px-2" : "px-3"} pt-3`}>
        {/* Ask AiXin — primary */}
        <Link
          to={primary.to}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
            isActive(primary.to)
              ? "bg-gradient-coral text-primary-foreground shadow-warm"
              : "bg-sidebar-accent/40 text-sidebar-foreground hover:bg-sidebar-accent/70"
          } ${collapsed ? "justify-center px-2" : ""}`}
          title={t(primary.key)}
        >
          <primary.icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{t(primary.key)}</span>}
        </Link>

        <div className={`mt-4 ${collapsed ? "" : "px-1"} font-mono text-[10px] uppercase tracking-widest text-sidebar-foreground/40`}>
          {!collapsed && "INSPECT"}
        </div>

        <nav className="mt-2 space-y-1">
          {nav.map((item) => {
            const active = isActive(item.to, item.exact);
            return (
              <Link
                key={item.to}
                to={item.to}
                title={t(item.key)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                } ${collapsed ? "justify-center px-2" : ""}`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{t(item.key)}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className={`mt-auto border-t border-sidebar-border p-3 ${collapsed ? "flex justify-center" : ""}`}>
        <div className={`flex items-center ${collapsed ? "" : "gap-3"}`} title={master.name || "Master Twin"}>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-coral font-display text-sm font-semibold text-primary-foreground">
            {master.initials || "M"}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{master.name || "Master Twin"}</div>
              <div className="text-xs text-sidebar-foreground/50">{t("cmd.masterTwin")}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
