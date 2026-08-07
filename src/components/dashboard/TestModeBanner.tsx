"use client";

import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace";
import { AlertCircle, Zap } from "lucide-react";

export function TestModeBanner() {
  const { t } = useI18n();
  const { state } = useWorkspace();

  if (state.mode === "live") {
    return (
      <div className="flex items-center gap-2 border-b border-success/20 bg-success/10 px-6 py-2 text-xs font-medium text-success">
        <Zap className="h-3.5 w-3.5" />
        {t("dash.mode.live")}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 border-b border-warning/20 bg-warning/10 px-6 py-2 text-xs font-medium text-warning-foreground">
      <AlertCircle className="h-3.5 w-3.5" />
      {t("dash.mode.test")}
    </div>
  );
}
