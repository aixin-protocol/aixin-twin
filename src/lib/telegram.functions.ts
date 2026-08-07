import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function makeCode(): string {
  // 6-char base36, uppercase, no ambiguous chars
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export const getTelegramStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("telegram_links")
      .select("chat_id, username, link_code, linked_at")
      .eq("user_id", userId)
      .maybeSingle();
    return {
      linked: !!data?.linked_at,
      chatId: data?.chat_id ?? null,
      username: data?.username ?? null,
      linkCode: data?.link_code ?? null,
    };
  });

export const generateTelegramLinkCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const code = makeCode();
    await supabase
      .from("telegram_links")
      .upsert(
        { user_id: userId, link_code: code, chat_id: null, linked_at: null },
        { onConflict: "user_id" },
      );
    return { linkCode: code };
  });

export const unlinkTelegram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await supabase.from("telegram_links").delete().eq("user_id", userId);
    return { ok: true };
  });

export const registerTelegramWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ url: z.string().url() }).parse(data))
  .handler(async ({ data }) => {
    const { setTelegramWebhook, getTelegramWebhookInfo } = await import("@/lib/telegram.server");
    const res = await setTelegramWebhook(data.url);
    const info = await getTelegramWebhookInfo();
    return { ok: res.ok, error: res.error, info: JSON.stringify(info.info ?? null) };
  });
