import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listAdapters = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("adapters")
      .select("*")
      .eq("user_id", userId)
      .order("created_at");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertAdapter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        provider: z.string().min(1).max(60),
        kind: z.string().min(1).max(40),
        mode: z.enum(["test", "live"]),
        status: z.enum(["connected", "disconnected", "error"]).default("connected"),
        config: z.record(z.string(), z.unknown()).default({}),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Manual upsert on (user_id, provider, kind)
    const { data: existing } = await supabase
      .from("adapters")
      .select("id")
      .eq("user_id", userId)
      .eq("provider", data.provider)
      .eq("kind", data.kind)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase
        .from("adapters")
        .update({
          mode: data.mode,
          status: data.status,
          config: data.config as never,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { id: existing.id };
    }
    const { data: row, error } = await supabase
      .from("adapters")
      .insert({
        user_id: userId,
        provider: data.provider,
        kind: data.kind,
        mode: data.mode,
        status: data.status,
        config: data.config as never,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const setAdapterMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), mode: z.enum(["test", "live"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("adapters")
      .update({ mode: data.mode, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const disconnectAdapter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("adapters")
      .update({ status: "disconnected", updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Send a real test email through the user's connected Gmail adapter so the
// credentials can be verified before a Specialist relies on them.
export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ to: z.string().email().optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: adapter } = await supabase
      .from("adapters")
      .select("id, config, mode, status")
      .eq("user_id", userId)
      .eq("provider", "Gmail")
      .eq("kind", "email")
      .maybeSingle();
    if (!adapter || adapter.status !== "connected") throw new Error("Gmail adapter is not connected.");
    const { sendGmail } = await import("@/lib/gmail.server");
    const cfg = (adapter.config ?? {}) as Record<string, unknown>;
    const to = data.to ?? (cfg.from_email as string | undefined);
    if (!to) throw new Error("No recipient address — set the From email first.");
    const res = await sendGmail(cfg as never, {
      to,
      subject: "AiXin · Gmail adapter test",
      text: "Your Gmail adapter is wired correctly. Specialist Twins can now deliver outcomes to this inbox.",
    });
    if (!res.ok) throw new Error(res.reason);
    return { ok: true as const, to: res.to, messageId: res.messageId };
  });
