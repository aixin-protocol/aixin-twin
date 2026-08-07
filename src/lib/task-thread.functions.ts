import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getTaskThread = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ taskId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [msgs, outcome] = await Promise.all([
      supabase
        .from("task_messages")
        .select("*")
        .eq("task_id", data.taskId)
        .eq("user_id", userId)
        .order("created_at"),
      supabase
        .from("task_outcomes")
        .select("*")
        .eq("task_id", data.taskId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    return { messages: msgs.data ?? [], outcome: outcome.data };
  });

export const postTaskMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ taskId: z.string().uuid(), body: z.string().min(1).max(4000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Verify ownership
    const { data: task } = await supabase
      .from("tasks")
      .select("id, user_id, intent, intent_json, title, status")
      .eq("id", data.taskId)
      .maybeSingle();
    if (!task || task.user_id !== userId) throw new Error("Task not found");

    // Insert user message
    await supabase.from("task_messages").insert({
      task_id: data.taskId,
      user_id: userId,
      sender: "user",
      source: "app",
      body: data.body,
    });

    const { createTaskThreadReply } = await import("@/lib/task-thread.server");
    const { reply } = await createTaskThreadReply({ supabase, userId, task });

    await supabase.from("task_messages").insert({
      task_id: data.taskId,
      user_id: userId,
      sender: "twin",
      source: "app",
      body: reply,
    });

    // Telegram mirror. Keep this non-blocking for the app, but emit a task
    // event on success/failure so inconsistent delivery is visible in the trace.
    const { mirrorTaskMessageToTelegram } = await import("@/lib/telegram.server");
    const mirror = await mirrorTaskMessageToTelegram({
      supabase,
      userId,
      taskId: data.taskId,
      taskTitle: task.title,
      body: reply,
    });
    if (!mirror.ok) console.error("[task-thread] Telegram mirror failed", mirror.error);

    return { ok: true };
  });

export const getUnreadCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ count: msgCount }, { count: outCount }] = await Promise.all([
      supabase
        .from("task_messages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("sender", "twin")
        .is("read_at", null),
      supabase
        .from("task_outcomes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]);
    return { unreadMessages: msgCount ?? 0, recentOutcomes: outCount ?? 0 };
  });

export const markThreadRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ taskId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("task_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("task_id", data.taskId)
      .eq("user_id", userId)
      .eq("sender", "twin")
      .is("read_at", null);
    return { ok: true };
  });
