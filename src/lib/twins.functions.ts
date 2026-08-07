import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const HatchSchema = z.object({
  name: z.string().min(1).max(80),
  expertise: z.string().min(1).max(500),
});

export const hatchMasterTwin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => HatchSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const initials = data.name.trim().charAt(0).toUpperCase() || "M";
    const { data: existing } = await supabase
      .from("master_twins")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("master_twins")
        .update({ name: data.name, expertise: data.expertise, initials })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { id: existing.id };
    }

    const { data: row, error } = await supabase
      .from("master_twins")
      .insert({
        user_id: userId,
        name: data.name,
        expertise: data.expertise,
        initials,
        reputation: 0,
        verified_actions: 0,
        status: "active",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const getMyMasterTwin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("master_twins")
      .select("id, name, expertise, initials, reputation, verified_actions, status")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });
