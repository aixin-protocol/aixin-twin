import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// -------- Read the entire workspace for the current user --------
export const getWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [
      masterRes,
      specialistsRes,
      skillsRes,
      installsRes,
      assignmentsRes,
      cardsRes,
      receiptsRes,
      ledgerRes,
      tasksRes,
    ] = await Promise.all([
      supabase.from("master_twins").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("specialist_twins").select("*").eq("user_id", userId).order("created_at"),
      // Public+live catalog OR any skill the user authored (any status/visibility)
      supabase
        .from("skills")
        .select("*")
        .or(`and(is_public.eq.true,status.eq.live,visibility.eq.public),author_id.eq.${userId}`)
        .order("installs", { ascending: false }),
      supabase.from("skill_installs").select("skill_id, pinned_version").eq("user_id", userId),
      supabase.from("skill_assignments").select("skill_id, specialist_id").eq("user_id", userId),
      supabase
        .from("decision_cards")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("receipts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("ledger_preview").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    return {
      masterTwin: masterRes.data,
      specialists: specialistsRes.data ?? [],
      skills: skillsRes.data ?? [],
      installs: installsRes.data ?? [],
      assignments: assignmentsRes.data ?? [],
      decisionCards: cardsRes.data ?? [],
      receipts: receiptsRes.data ?? [],
      ledger: ledgerRes.data,
      tasks: tasksRes.data ?? [],
    };
  });


// -------- Create Specialist --------
export const createSpecialist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().min(1).max(60),
        role: z.string().min(1).max(80),
        type: z.string().min(1).max(40).default("Custom"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const initials = data.name.slice(0, 2).toUpperCase();
    const { data: row, error } = await supabase
      .from("specialist_twins")
      .insert({
        user_id: userId,
        name: data.name,
        role: data.role,
        type: data.type,
        initials,
        status: "active",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// -------- Update specialist status (retire / reactivate / pause) --------
export const setSpecialistStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        specialistId: z.string().uuid(),
        status: z.enum(["active", "paused", "retired"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("specialist_twins")
      .update({ status: data.status })
      .eq("id", data.specialistId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- Delete specialist --------
export const deleteSpecialist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ specialistId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("skill_assignments").delete().eq("specialist_id", data.specialistId).eq("user_id", userId);
    const { error } = await supabase
      .from("specialist_twins")
      .delete()
      .eq("id", data.specialistId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- Install Skill --------
export const installSkill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ skillId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("skill_installs")
      .insert({ user_id: userId, skill_id: data.skillId });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

// -------- Create Skill (SkillCraft publish) --------
export const createSkill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().min(1).max(80),
        category: z.string().min(1).max(40),
        intent: z.string().max(2000).optional().default(""),
        rules: z.string().max(2000).optional().default(""),
        adapter: z.string().min(1).max(160).default("test"),
        priceCents: z.number().int().min(0).max(10_000_00).nullable().optional().default(null),
        visibility: z.enum(["public", "private"]).default("public"),
        status: z.enum(["draft", "live"]).default("live"),
        readme: z.string().max(20000).optional().default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .maybeSingle();
    const authorName = profile?.display_name || "You";
    const priceDollars = data.priceCents != null ? data.priceCents / 100 : null;
    const providerLabel = data.adapter === "live"
      ? "Live adapter"
      : data.adapter === "test"
        ? "Test adapter"
        : data.adapter.split(":").slice(0, 2).join(" · ") || data.adapter;
    const { data: row, error } = await supabase
      .from("skills")
      .insert({
        author_id: userId,
        name: data.name,
        category: data.category,
        author: authorName,
        provider: providerLabel,
        description: data.intent,
        price: priceDollars,
        price_cents: data.priceCents,
        visibility: data.visibility,
        status: data.status,
        version: 1,
        installs: 0,
        tags: ["deterministic"],
        is_public: data.visibility === "public",
        readme: data.readme || null,
        schema: { intent: data.intent } as unknown as never,
        rules: { text: data.rules } as unknown as never,
      } as unknown as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    // Snapshot v1 in skill_versions
    await supabase.from("skill_versions").insert({
      skill_id: row.id,
      created_by: userId,
      version: 1,
      name: data.name,
      category: data.category,
      intent: data.intent,
      rules: data.rules,
      adapter: data.adapter,
      price_cents: data.priceCents,
      visibility: data.visibility,
      status: data.status,
      readme: data.readme || null,
      changelog: "Initial publish",
    } as unknown as never);

    // Auto-install for the author, pinned to v1
    await supabase
      .from("skill_installs")
      .insert({ user_id: userId, skill_id: row.id, pinned_version: 1 } as unknown as never);
    return { id: row.id };
  });

// -------- Update Skill (author edits; bumps version if status=live) --------
export const updateSkill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        skillId: z.string().uuid(),
        name: z.string().min(1).max(80),
        category: z.string().min(1).max(40),
        intent: z.string().max(2000).optional().default(""),
        rules: z.string().max(2000).optional().default(""),
        adapter: z.string().min(1).max(160).default("test"),
        priceCents: z.number().int().min(0).max(10_000_00).nullable().optional().default(null),
        visibility: z.enum(["public", "private"]).default("public"),
        status: z.enum(["draft", "live"]).default("live"),
        changelog: z.string().max(500).optional().default(""),
        readme: z.string().max(20000).optional().default(""),
        bumpVersion: z.boolean().optional().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: current, error: readErr } = await supabase
      .from("skills")
      .select("*")
      .eq("id", data.skillId)
      .eq("author_id", userId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!current) throw new Error("Skill not found or not yours");
    const cur = current as unknown as { version?: number; status?: string };
    const nextVersion = data.bumpVersion && data.status === "live" ? (cur.version ?? 1) + 1 : (cur.version ?? 1);
    const priceDollars = data.priceCents != null ? data.priceCents / 100 : null;
    const providerLabel = data.adapter === "live"
      ? "Live adapter"
      : data.adapter === "test"
        ? "Test adapter"
        : data.adapter.split(":").slice(0, 2).join(" · ") || data.adapter;
    const { error: updErr } = await supabase
      .from("skills")
      .update({
        name: data.name,
        category: data.category,
        provider: providerLabel,
        description: data.intent,
        price: priceDollars,
        price_cents: data.priceCents,
        visibility: data.visibility,
        status: data.status,
        version: nextVersion,
        is_public: data.visibility === "public",
        readme: data.readme || null,
        schema: { intent: data.intent } as unknown as never,
        rules: { text: data.rules } as unknown as never,
      } as unknown as never)
      .eq("id", data.skillId)
      .eq("author_id", userId);
    if (updErr) throw new Error(updErr.message);
    if (nextVersion !== (cur.version ?? 1)) {
      await supabase.from("skill_versions").insert({
        skill_id: data.skillId,
        created_by: userId,
        version: nextVersion,
        name: data.name,
        category: data.category,
        intent: data.intent,
        rules: data.rules,
        adapter: data.adapter,
        price_cents: data.priceCents,
        visibility: data.visibility,
        status: data.status,
        readme: data.readme || null,
        changelog: data.changelog || `v${nextVersion}`,
      } as unknown as never);

    }
    return { id: data.skillId, version: nextVersion };
  });

// -------- Skill detail (public catalog page) --------
export const getSkillDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ skillId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: skill, error } = await supabase
      .from("skills")
      .select("*")
      .eq("id", data.skillId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!skill) throw new Error("Skill not found");

    const [versionsRes, installRes, assignmentsRes] = await Promise.all([
      supabase
        .from("skill_versions")
        .select("*")
        .eq("skill_id", data.skillId)
        .order("version", { ascending: false }),
      supabase
        .from("skill_installs")
        .select("pinned_version")
        .eq("skill_id", data.skillId)
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("skill_assignments")
        .select("specialist_id")
        .eq("skill_id", data.skillId)
        .eq("user_id", userId),
    ]);

    const row = skill as unknown as {
      id: string;
      name: string;
      category: string;
      author: string;
      author_id: string | null;
      provider: string;
      description: string | null;
      price_cents: number | null;
      visibility: string;
      status: string;
      version: number;
      installs: number;
      readme: string | null;
      is_public: boolean;
      created_at: string;
      rules: unknown;
      schema: unknown;
    };
    return {
      skill: {
        id: row.id,
        name: row.name,
        category: row.category,
        author: row.author,
        authorId: row.author_id,
        provider: row.provider,
        description: row.description,
        priceCents: row.price_cents,
        visibility: row.visibility,
        status: row.status,
        version: row.version,
        installs: row.installs,
        readme: row.readme ?? null,
        isPublic: row.is_public,
        createdAt: row.created_at,
        rulesText:
          typeof (row.rules as { text?: string } | null)?.text === "string"
            ? ((row.rules as { text?: string }).text as string)
            : "",
      },
      versions: versionsRes.data ?? [],
      installed: !!installRes.data,
      pinnedVersion: (installRes.data as { pinned_version?: number } | null)?.pinned_version ?? null,
      assignedTo: (assignmentsRes.data ?? []).map((a) => (a as { specialist_id: string }).specialist_id),
      isMine: row.author_id === userId,
    };
  });

// -------- Upgrade an install to the latest version --------
export const upgradeInstall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ skillId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: sk } = await supabase
      .from("skills")
      .select("version")
      .eq("id", data.skillId)
      .maybeSingle();
    const latest = ((sk as unknown as { version?: number } | null)?.version ?? 1);
    const { error } = await supabase
      .from("skill_installs")
      .update({ pinned_version: latest } as unknown as never)
      .eq("user_id", userId)
      .eq("skill_id", data.skillId);
    if (error) throw new Error(error.message);
    return { ok: true, version: latest };
  });

// -------- Read installer count for a skill (author only) --------
export const getSkillInstallerCount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ skillId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: sk } = await supabase
      .from("skills")
      .select("author_id")
      .eq("id", data.skillId)
      .maybeSingle();
    if (!sk || (sk as { author_id?: string }).author_id !== userId) throw new Error("Forbidden");
    const { count } = await supabase
      .from("skill_installs")
      .select("id", { count: "exact", head: true })
      .eq("skill_id", data.skillId);
    return { count: count ?? 0 };
  });


// -------- Assign Skill to Specialist --------
export const assignSkill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ skillId: z.string().uuid(), specialistId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("skill_assignments").insert({
      user_id: userId,
      skill_id: data.skillId,
      specialist_id: data.specialistId,
    });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

// -------- Unassign Skill from Specialist --------
export const unassignSkill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ skillId: z.string().uuid(), specialistId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("skill_assignments")
      .delete()
      .eq("user_id", userId)
      .eq("skill_id", data.skillId)
      .eq("specialist_id", data.specialistId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- Update specialist (name/role/type/status) --------
export const updateSpecialist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        specialistId: z.string().uuid(),
        name: z.string().min(1).max(60),
        role: z.string().min(1).max(80),
        type: z.string().min(1).max(40),
        status: z.enum(["active", "paused", "retired"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const initials = data.name.slice(0, 2).toUpperCase();
    const { error } = await supabase
      .from("specialist_twins")
      .update({
        name: data.name,
        role: data.role,
        type: data.type,
        status: data.status,
        initials,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.specialistId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- Seed demo workspace (reference use cases) --------
export const seedDemoWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Ensure a master twin exists (onboarding may have set one; if not, create default)
    const { data: mt } = await supabase
      .from("master_twins")
      .select("id, name")
      .eq("user_id", userId)
      .maybeSingle();
    if (!mt) {
      await supabase.from("master_twins").insert({
        user_id: userId,
        name: "Aaron",
        initials: "A",
        reputation: 4.9,
        verified_actions: 1204,
        expertise: "Investor & analyst",
      });
    } else if (mt.name && (mt as { reputation?: number }).reputation === 0) {
      await supabase
        .from("master_twins")
        .update({ reputation: 4.9, verified_actions: 1204 })
        .eq("id", mt.id);
    }

    // Insert specialists (idempotent by name+user)
    const specialists = [
      { name: "Marco", role: "Travel Specialist", type: "Travel", initials: "MA", reputation: 4.8, earned: 4210 },
      { name: "Nova", role: "Marketing Specialist", type: "Marketing", initials: "NO", reputation: 4.6, earned: 3180 },
      { name: "Ledger", role: "Finance Specialist", type: "Finance", initials: "LE", reputation: 4.9, earned: 2540 },
      { name: "Iris", role: "Support Specialist", type: "Support", initials: "IR", reputation: 4.7, earned: 1650 },
    ];
    const { data: existing } = await supabase
      .from("specialist_twins")
      .select("id, name")
      .eq("user_id", userId);
    const existingNames = new Set((existing ?? []).map((s) => s.name));
    const toInsert = specialists.filter((s) => !existingNames.has(s.name));
    if (toInsert.length) {
      await supabase
        .from("specialist_twins")
        .insert(toInsert.map((s) => ({ ...s, user_id: userId, status: "active" as const })));
    }

    // Install all public skills
    const { data: allSkills } = await supabase.from("skills").select("id, category").eq("is_public", true);
    const { data: installsExisting } = await supabase
      .from("skill_installs")
      .select("skill_id")
      .eq("user_id", userId);
    const installedIds = new Set((installsExisting ?? []).map((i) => i.skill_id));
    const newInstalls = (allSkills ?? [])
      .filter((s) => !installedIds.has(s.id))
      .map((s) => ({ user_id: userId, skill_id: s.id }));
    if (newInstalls.length) await supabase.from("skill_installs").insert(newInstalls);

    // Assign skills by category to matching specialists
    const { data: currentSpecs } = await supabase
      .from("specialist_twins")
      .select("id, name, type")
      .eq("user_id", userId);
    const byType = new Map<string, string>();
    (currentSpecs ?? []).forEach((s) => byType.set(s.type, s.id));

    const { data: assignmentsExisting } = await supabase
      .from("skill_assignments")
      .select("skill_id, specialist_id")
      .eq("user_id", userId);
    const existingPairs = new Set(
      (assignmentsExisting ?? []).map((a) => `${a.skill_id}:${a.specialist_id}`),
    );

    const newAssignments: { user_id: string; skill_id: string; specialist_id: string }[] = [];
    for (const sk of allSkills ?? []) {
      const specId = byType.get(sk.category);
      if (!specId) continue;
      if (existingPairs.has(`${sk.id}:${specId}`)) continue;
      newAssignments.push({ user_id: userId, skill_id: sk.id, specialist_id: specId });
    }
    if (newAssignments.length) await supabase.from("skill_assignments").insert(newAssignments);

    // Ledger preview baseline
    await supabase.from("ledger_preview").upsert({
      user_id: userId,
      earning_pool: 1240,
      staked: 800,
      access_bond: 200,
      burn_24h: 12.4,
    });

    // Sample pending decision cards
    const { data: pending } = await supabase
      .from("decision_cards")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "pending");
    if ((pending ?? []).length === 0) {
      const marco = byType.get("Travel");
      const nova = byType.get("Marketing");
      const cards: Array<{
        user_id: string;
        risk: "high" | "medium" | "low";
        requestor: string;
        specialist_name: string;
        specialist_id: string | null;
        title: string;
        detail: string;
        amount: number | null;
      }> = [];
      if (marco) cards.push({
        user_id: userId,
        risk: "high",
        requestor: "Marco",
        specialist_name: "Travel",
        specialist_id: marco,
        title: "Book United UA123 · SFO → CDG",
        detail: "Non-refundable · departs Aug 14",
        amount: 450,
      });
      if (nova) cards.push({
        user_id: userId,
        risk: "medium",
        requestor: "Nova",
        specialist_name: "Marketing",
        specialist_id: nova,
        title: "Publish 4 posts to LinkedIn",
        detail: "Scheduled 09:00 · brand account",
        amount: null,
      });
      if (cards.length) await supabase.from("decision_cards").insert(cards);
    }

    return { ok: true };
  });

// -------- Delegate task to a specialist (creates SIP report + task; card if approval needed) --------
export const delegateTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        specialistId: z.string().uuid(),
        skillId: z.string().uuid().optional(),
        intentText: z.string().min(1),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { validateIntent } = await import("@/lib/sip.server");

    const intent = { action: "generate_report", params: { text: data.intentText } };
    const report = validateIntent(intent);

    const { data: specialist } = await supabase
      .from("specialist_twins")
      .select("id, name")
      .eq("id", data.specialistId)
      .maybeSingle();

    const { data: task, error: taskErr } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        specialist_id: data.specialistId,
        skill_id: data.skillId ?? null,
        title: data.intentText.slice(0, 80),
        intent: data.intentText,
        intent_json: intent as unknown as never,
        value: report.risk,
        status: "pending",
      })
      .select("id")
      .single();
    if (taskErr) throw taskErr;

    if (report.requires_approval) {
      await supabase.from("decision_cards").insert({
        user_id: userId,
        task_id: task.id,
        specialist_id: data.specialistId,
        risk: report.risk,
        requestor: "Master Twin",
        specialist_name: specialist?.name ?? "Specialist",
        title: data.intentText.slice(0, 80),
        detail: report.reasons.join("; ") || "Delegated action awaiting approval",
        amount: null,
        status: "pending",
        sip_report: report as unknown as never,
      });
    } else {
      // Low-risk delegation → execute end-to-end immediately so the task
      // delivers an outcome instead of sitting in "pending".
      try {
        const { runExecution } = await import("@/lib/execution.server");
        await runExecution(
          supabase,
          userId,
          task.id,
          data.intentText,
          intent,
          "general",
          report.sip_id,
          null,
        );
      } catch (e) {
        console.error("[delegateTask] auto-execute failed", e);
        await supabase.from("tasks").update({ status: "done" }).eq("id", task.id);
      }
    }
    return { taskId: task.id };
  });

