// Gmail delivery over the Gmail REST API (HTTPS only).
// SMTP/app-passwords cannot work here: the server runs on Cloudflare Workers,
// which has no raw TCP. We exchange a long-lived OAuth refresh token for an
// access token and call users.messages.send.

export type GmailConfig = {
  from_email?: string;
  client_id?: string;
  client_secret?: string;
  refresh_token?: string;
  // legacy field from the SMTP-era adapter — unusable, kept only for detection
  app_password?: string;
};

export type GmailSendResult =
  | { ok: true; messageId: string; to: string; from: string }
  | { ok: false; reason: string };

export function gmailConfigStatus(cfg: GmailConfig): { ready: boolean; reason?: string } {
  if (!cfg.from_email) return { ready: false, reason: "Missing 'From email'." };
  if (!cfg.client_id || !cfg.client_secret || !cfg.refresh_token) {
    return {
      ready: false,
      reason:
        "Gmail needs OAuth credentials (client ID, client secret, refresh token). App passwords use SMTP, which this runtime cannot reach.",
    };
  }
  return { ready: true };
}

async function getAccessToken(cfg: GmailConfig): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cfg.client_id!,
      client_secret: cfg.client_secret!,
      refresh_token: cfg.refresh_token!,
      grant_type: "refresh_token",
    }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !body.access_token) {
    throw new Error(
      `Google token exchange failed [${res.status}]: ${body.error_description ?? body.error ?? "unknown"}`,
    );
  }
  return body.access_token;
}

function base64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function encodeHeader(value: string): string {
  // RFC 2047 for non-ASCII subjects (Chinese titles).
  // eslint-disable-next-line no-control-regex
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${base64Url(value).replace(/-/g, "+").replace(/_/g, "/")}?=`;
}

export async function sendGmail(
  cfg: GmailConfig,
  msg: { to: string; subject: string; text: string; html?: string },
): Promise<GmailSendResult> {
  const status = gmailConfigStatus(cfg);
  if (!status.ready) return { ok: false, reason: status.reason! };
  try {
    const token = await getAccessToken(cfg);
    const boundary = `aixin_${Math.random().toString(36).slice(2)}`;
    const html = msg.html ?? `<pre style="font:14px/1.5 ui-monospace,monospace;white-space:pre-wrap">${escapeHtml(msg.text)}</pre>`;
    const mime = [
      `From: ${cfg.from_email}`,
      `To: ${msg.to}`,
      `Subject: ${encodeHeader(msg.subject)}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "",
      msg.text,
      "",
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "",
      html,
      "",
      `--${boundary}--`,
      "",
    ].join("\r\n");

    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ raw: base64Url(mime) }),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
    if (!res.ok) {
      return { ok: false, reason: `Gmail API [${res.status}]: ${body.error?.message ?? "send failed"}` };
    }
    return { ok: true, messageId: body.id ?? "sent", to: msg.to, from: cfg.from_email! };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
