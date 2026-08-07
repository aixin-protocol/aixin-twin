import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Copy, Unlink, CheckCircle2, Loader2 } from "lucide-react";
import {
  getTelegramStatus,
  generateTelegramLinkCode,
  unlinkTelegram,
} from "@/lib/telegram.functions";
import { toast } from "sonner";

type Status = Awaited<ReturnType<typeof getTelegramStatus>>;

export function TelegramCard() {
  const getStatus = useServerFn(getTelegramStatus);
  const genCode = useServerFn(generateTelegramLinkCode);
  const unlink = useServerFn(unlinkTelegram);
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      const s = await getStatus();
      setStatus(s);
    } catch {}
  };
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onGen = async () => {
    setBusy(true);
    try {
      await genCode();
      await refresh();
    } finally {
      setBusy(false);
    }
  };
  const onUnlink = async () => {
    setBusy(true);
    try {
      await unlink();
      toast.success("Telegram unlinked");
      await refresh();
    } finally {
      setBusy(false);
    }
  };
  const onCopy = (code: string) => {
    navigator.clipboard.writeText(`/link ${code}`);
    toast.success("Copied. Paste it into the AiXin bot on Telegram.");
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Send className="h-3.5 w-3.5 text-primary" /> Telegram
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Get task outcomes on your phone and chat back with your Master Twin.
          </p>
        </div>
        {status?.linked ? (
          <Badge className="bg-success/15 text-success">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Linked
          </Badge>
        ) : (
          <Badge variant="outline">Not linked</Badge>
        )}
      </div>

      {status?.linked ? (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 p-3 text-xs">
          <span className="font-mono">@{status.username ?? "linked"}</span>
          <Button variant="ghost" size="sm" onClick={onUnlink} disabled={busy}>
            <Unlink className="mr-1 h-3 w-3" /> Unlink
          </Button>
        </div>
      ) : status?.linkCode ? (
        <div className="mt-3 space-y-2 text-xs">
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Your one-time code
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="font-mono text-xl font-semibold tracking-widest">{status.linkCode}</span>
              <Button size="sm" variant="outline" onClick={() => onCopy(status.linkCode!)}>
                <Copy className="mr-1 h-3 w-3" /> Copy /link
              </Button>
            </div>
          </div>
          <ol className="ml-4 list-decimal space-y-1 text-muted-foreground">
            <li>
              Open{" "}
              <a
                className="text-primary underline"
                href="https://t.me/aixinchrisbot"
                target="_blank"
                rel="noreferrer"
              >
                @aixinchrisbot
              </a>{" "}
              on Telegram.
            </li>
            <li>
              Send <code className="rounded bg-muted px-1">/link {status.linkCode}</code>.
            </li>
            <li>Come back here — status will flip to Linked.</li>
          </ol>
          <Button size="sm" variant="ghost" onClick={onGen} disabled={busy}>
            Regenerate code
          </Button>
        </div>
      ) : (
        <Button className="mt-3" size="sm" onClick={onGen} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
          Pair Telegram
        </Button>
      )}
    </Card>
  );
}
