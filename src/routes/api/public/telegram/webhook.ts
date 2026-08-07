import { createFileRoute } from "@tanstack/react-router";
import {
  extractTelegramTaskCode,
  sendTaskTelegramMessage,
  sendTelegramMessage,
  verifyTelegramSecret,
} from "@/lib/telegram.server";

type TgUser = { id: number; username?: string; first_name?: string };
type TgMessage = {
  message_id: number;
  chat: { id: number; type: string };
  from?: TgUser;
  text?: string;
  reply_to_message?: TgMessage;
};
type TgUpdate = {
  update_id: number;
  message?: TgMessage;
  edited_message?: TgMessage;
};

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secretHeader = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
        if (!verifyTelegramSecret(secretHeader)) {
          return new Response("Unauthorized", { status: 401 });
        }
        const update = (await request.json()) as TgUpdate;
        const message = update.message ?? update.edited_message;
        const text = message?.text?.trim();
        const chatId = message?.chat?.id;
        if (!message || !chatId || !text) return Response.json({ ok: true, ignored: true });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Handle /start and /link commands
        const linkMatch = text.match(/^\/(?:link|start)\s+([A-Z0-9]{4,8})/i);
        if (linkMatch) {
          const code = linkMatch[1].toUpperCase();
          const { data: link, error } = await supabaseAdmin
            .from("telegram_links")
            .select("user_id, link_code, linked_at")
            .eq("link_code", code)
            .maybeSingle();
          if (error || !link) {
            await sendTelegramMessage(chatId, "❌ Invalid or expired code. Generate a fresh one from AiXin → Tasks → Telegram.");
            return Response.json({ ok: true });
          }
          await supabaseAdmin
            .from("telegram_links")
            .update({
              chat_id: chatId,
              username: message.from?.username ?? message.from?.first_name ?? null,
              linked_at: new Date().toISOString(),
            })
            .eq("user_id", link.user_id);
          await sendTelegramMessage(
            chatId,
            "✅ Linked!\n\nYour AiXin Master Twin will DM you here whenever a task completes or needs input. Reply to any message and it lands in the task thread.",
          );
          return Response.json({ ok: true });
        }

        if (text === "/start") {
          await sendTelegramMessage(
            chatId,
            "👋 Hi — I'm your AiXin Master Twin.\n\nTo pair with your account, go to AiXin → Tasks → Telegram, copy your 6-char code, and send /link CODE here.",
          );
          return Response.json({ ok: true });
        }

        // Any other message: post into the referenced task thread. Telegram
        // users often keep multiple tasks open; route by the task code in the
        // message they replied to, or a typed "task abc12345" code. Fall back
        // to the newest task only when no code is present.
        const { data: link } = await supabaseAdmin
          .from("telegram_links")
          .select("user_id, linked_at")
          .eq("chat_id", chatId)
          .maybeSingle();
        if (!link?.user_id || !link.linked_at) {
          await sendTelegramMessage(chatId, "You're not linked yet. Send /link CODE where CODE is from AiXin → Tasks → Telegram.");
          return Response.json({ ok: true });
        }

        const taskCode = extractTelegramTaskCode(text, message.reply_to_message?.text);
        const { data: candidateTasks } = await supabaseAdmin
          .from("tasks")
          .select("id, title, intent, intent_json, status, created_at")
          .eq("user_id", link.user_id)
          .order("created_at", { ascending: false })
          .limit(taskCode ? 50 : 1);
        const task = taskCode
          ? candidateTasks?.find((candidate) => candidate.id.toLowerCase().startsWith(taskCode))
          : candidateTasks?.[0];
        if (!task) {
          await sendTelegramMessage(
            chatId,
            taskCode
              ? `I couldn't find task ${taskCode}. Open the task in AiXin or reply to a recent task-tagged message.`
              : "You have no tasks yet. Start one in AiXin → Ask AiXin.",
          );
          return Response.json({ ok: true });
        }

        // Insert user message from telegram
        await supabaseAdmin.from("task_messages").insert({
          task_id: task.id,
          user_id: link.user_id,
          sender: "user",
          source: "telegram",
          body: text,
        });

        // Generate twin reply using the same guarded task-thread logic as the app.
        let reply = "Got it — I'll follow up in the app.";
        try {
          const { createTaskThreadReply } = await import("@/lib/task-thread.server");
          const result = await createTaskThreadReply({ supabase: supabaseAdmin, userId: link.user_id, task });
          reply = result.reply;
        } catch (e) {
          console.error("[tg webhook] AI reply failed", e);
        }

        await supabaseAdmin.from("task_messages").insert({
          task_id: task.id,
          user_id: link.user_id,
          sender: "twin",
          source: "telegram",
          body: reply,
        });

        await sendTaskTelegramMessage({ chatId, taskId: task.id, taskTitle: task.title, body: reply });
        return Response.json({ ok: true });
      },
    },
  },
});
