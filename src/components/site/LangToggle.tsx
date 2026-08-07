import { useI18n } from "@/lib/i18n";

export function LangToggle() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-background/60 p-0.5 text-xs font-medium backdrop-blur">
      <button
        onClick={() => setLocale("en")}
        className={`rounded-full px-2.5 py-1 transition ${
          locale === "en" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
        }`}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
      <button
        onClick={() => setLocale("zh")}
        className={`rounded-full px-2.5 py-1 transition ${
          locale === "zh" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
        }`}
        aria-pressed={locale === "zh"}
      >
        中文
      </button>
    </div>
  );
}
