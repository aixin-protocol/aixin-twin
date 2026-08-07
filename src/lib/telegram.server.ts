// Server-only Telegram helpers. Gateway-backed via Lovable connector.
import { createHash, timingSafeEqual } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
type SB = SupabaseClient<Database>;

function auth() {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY;
  if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY) return null;
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": TELEGRAM_API_KEY,
    "Content-Type": "application/json",
  };
}

export function deriveTelegramWebhookSecret(): string | null {
  const key = process.env.TELEGRAM_API_KEY;
  if (!key) return null;
  return createHash("sha256").update(`telegram-webhook:${key}`).digest("base64url");
}

export function verifyTelegramSecret(actual: string | null): boolean {
  const expected = deriveTelegramWebhookSecret();
  if (!expected || !actual) return false;
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const TG_MAX = 3800; // safety margin under Telegram's 4096 char cap

function chunkText(text: string, size = TG_MAX): string[] {
  if (text.length <= size) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > size) {
    // Prefer to split on a paragraph or newline boundary
    let cut = remaining.lastIndexOf("\n\n", size);
    if (cut < size * 0.5) cut = remaining.lastIndexOf("\n", size);
    if (cut < size * 0.5) cut = size;
    chunks.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut).replace(/^\s+/, "");
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  extra?: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string; sentParts?: number }> {
  const h = auth();
  if (!h) return { ok: false, error: "telegram_not_configured" };
  const parts = chunkText(text);
  try {
    let sentParts = 0;
    for (const part of parts) {
      // Send as plain text — arbitrary AI output contains characters (<, >, &, unclosed tags)
      // that break Telegram's HTML parse_mode and cause the whole message to be rejected.
      const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({
          chat_id: chatId,
          text: part,
          disable_web_page_preview: true,
          ...extra,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error("[telegram] sendMessage failed", res.status, body);
        return { ok: false, error: `${res.status}: ${body}` };
      }
      sentParts += 1;
    }
    return { ok: true, sentParts };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function extractTelegramTaskCode(...texts: Array<string | null | undefined>): string | null {
  for (const text of texts) {
    if (!text) continue;
    const explicit = /\btask\s+([0-9a-f]{8})\b/i.exec(text);
    if (explicit) return explicit[1].toLowerCase();
    const bracketed = /\[([0-9a-f]{8})\]/i.exec(text);
    if (bracketed) return bracketed[1].toLowerCase();
  }
  return null;
}

export function formatTaskTelegramMessage({
  taskId,
  taskTitle,
  body,
}: {
  taskId: string;
  taskTitle?: string | null;
  body: string;
}): string {
  const shortId = taskId.slice(0, 8);
  const cleanTitle = taskTitle?.trim();
  const header = cleanTitle ? `Task ${shortId} · ${cleanTitle.slice(0, 80)}` : `Task ${shortId}`;
  return [
    header,
    "",
    body.trim(),
    "",
    "Reply to this message to keep the conversation on this task.",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function sendTaskTelegramMessage({
  chatId,
  taskId,
  taskTitle,
  body,
}: {
  chatId: number | string;
  taskId: string;
  taskTitle?: string | null;
  body: string;
}) {
  return sendTelegramMessage(chatId, formatTaskTelegramMessage({ taskId, taskTitle, body }));
}

export async function mirrorTaskMessageToTelegram({
  supabase,
  userId,
  taskId,
  taskTitle,
  body,
}: {
  supabase: SB;
  userId: string;
  taskId: string;
  taskTitle?: string | null;
  body: string;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const { data: link, error } = await supabase
    .from("telegram_links")
    .select("chat_id, linked_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!link?.chat_id || !link.linked_at) return { ok: true, skipped: true };

  const result = await sendTaskTelegramMessage({ chatId: link.chat_id, taskId, taskTitle, body });
  await appendTelegramDeliveryEvent(supabase, userId, taskId, result.ok, result.error);
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

async function appendTelegramDeliveryEvent(
  supabase: SB,
  userId: string,
  taskId: string,
  ok: boolean,
  error?: string,
) {
  const { data: lastEvt } = await supabase
    .from("task_events")
    .select("seq")
    .eq("task_id", taskId)
    .eq("user_id", userId)
    .order("seq", { ascending: false })
    .limit(1)
    .maybeSingle();
  await supabase.from("task_events").insert({
    task_id: taskId,
    user_id: userId,
    seq: (lastEvt?.seq ?? -1) + 1,
    phase: "act",
    kind: "tool",
    title: ok ? "Telegram mirror delivered" : "Telegram mirror failed",
    detail: ok ? "Master Twin reply sent to the linked Telegram chat." : error?.slice(0, 500) ?? "Unknown Telegram delivery error.",
    chip: "TELEGRAM",
  });
}

export async function setTelegramWebhook(url: string): Promise<{ ok: boolean; error?: string }> {
  const h = auth();
  if (!h) return { ok: false, error: "telegram_not_configured" };
  const secret = deriveTelegramWebhookSecret();
  if (!secret) return { ok: false, error: "no_secret" };
  try {
    const res = await fetch(`${GATEWAY_URL}/setWebhook`, {
      method: "POST",
      headers: h,
      body: JSON.stringify({
        url,
        secret_token: secret,
        allowed_updates: ["message", "edited_message"],
      }),
    });
    const body = await res.text();
    if (!res.ok) return { ok: false, error: `${res.status}: ${body}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function getTelegramWebhookInfo(): Promise<{ ok: boolean; info?: unknown; error?: string }> {
  const h = auth();
  if (!h) return { ok: false, error: "telegram_not_configured" };
  try {
    const res = await fetch(`${GATEWAY_URL}/getWebhookInfo`, { method: "POST", headers: h, body: "{}" });
    const body = await res.json();
    return { ok: true, info: body };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
