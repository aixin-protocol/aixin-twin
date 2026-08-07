export function Logo({ className = "", variant = "light" }: { className?: string; variant?: "light" | "dark" }) {
  const isDark = variant === "dark";
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-coral shadow-warm">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s-7-4.5-9-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 5.5-9 10-9 10Z" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className={`font-display text-base font-semibold tracking-tight ${isDark ? "text-sidebar-foreground" : ""}`}>AiXin</div>
        <div className={`-mt-0.5 text-[10px] font-mono uppercase tracking-widest ${isDark ? "text-sidebar-foreground/50" : "text-muted-foreground"}`}>爱信</div>
      </div>
    </div>
  );
}
