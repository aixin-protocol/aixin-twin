// Server-only client for the external AiXin reference validator server
// (@aixin-protocol/validator-server). When AIXIN_VALIDATOR_URL is set, the
// app delegates SIP validation + Ed25519 receipt signing to it. Otherwise
// it falls back to the in-process deterministic validator so the app keeps
// working self-contained.
import { validateIntent, hashPayload, type SIPReport } from "@/lib/sip.server";

export type ValidatorSignedReceipt = {
  sip_id: string;
  payload_hash: string;
  signature: string | null;
  public_key: string | null;
  validator_url: string | null;
  source: "external" | "local";
  /** Why the receipt is unsigned, when source === "local". */
  degraded_reason?: string | null;
};

export async function validateWithValidator(intent: unknown): Promise<SIPReport> {
  const url = process.env.AIXIN_VALIDATOR_URL;
  if (!url) return validateIntent(intent);
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/v1/validate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ intent }),
    });
    if (!res.ok) throw new Error(`validator ${res.status}`);
    const body = (await res.json()) as { report?: SIPReport };
    if (!body.report) throw new Error("validator returned no report");
    return body.report;
  } catch (err) {
    console.warn("[validator] falling back to local validate:", err);
    return validateIntent(intent);
  }
}

export async function signReceiptWithValidator(payload: unknown, sipId: string): Promise<ValidatorSignedReceipt> {
  const url = process.env.AIXIN_VALIDATOR_URL;
  const payload_hash = await hashPayload(payload);
  if (!url) {
    return {
      sip_id: sipId,
      payload_hash,
      signature: null,
      public_key: null,
      validator_url: null,
      source: "local",
      degraded_reason: "AIXIN_VALIDATOR_URL not configured — receipt hashed but not signed",
    };
  }
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/v1/sign`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sip_id: sipId, payload }),
    });
    if (!res.ok) throw new Error(`validator ${res.status}`);
    const body = (await res.json()) as {
      payload_hash?: string;
      signature?: string;
      public_key?: string;
    };
    return {
      sip_id: sipId,
      payload_hash: body.payload_hash ?? payload_hash,
      signature: body.signature ?? null,
      public_key: body.public_key ?? null,
      validator_url: url,
      source: "external",
    };
  } catch (err) {
    console.warn("[validator] sign fallback (local hash only):", err);
    return {
      sip_id: sipId,
      payload_hash,
      signature: null,
      public_key: null,
      validator_url: url,
      source: "local",
      degraded_reason: `Validator unreachable (${err instanceof Error ? err.message : String(err)}) — receipt hashed but not signed`,
    };
  }
}
