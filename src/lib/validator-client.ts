// src/lib/validator-client.ts
// Thin client that routes intent validation and receipt issuance through the
// reference @aixin-protocol/validator-server. Falls back to local in-process
// validation when AIXIN_VALIDATOR_URL is unset (development ergonomics).

const BASE = process.env.AIXIN_VALIDATOR_URL;

export type IntentPayload = Record<string, unknown>;

export type ValidatorReceipt = {
  aixin: '1';
  kind: 'receipt';
  id: string;
  intentId: string;
  payloadHash: string;
  signedAt: string;
  signature: string;
  publicKey: string;
  anchor?: { chain: string; txHash: string; contract?: string } | null;
};

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Validator ${path} failed [${res.status}]: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function validatorHealth(): Promise<{ ok: boolean; base: string | null }> {
  if (!BASE) return { ok: false, base: null };
  try {
    const res = await fetch(`${BASE}/v1/health`);
    return { ok: res.ok, base: BASE };
  } catch {
    return { ok: false, base: BASE };
  }
}

export async function validateIntent(intent: IntentPayload) {
  if (!BASE) {
    const { validateIntentLocal } = await import('./sip.server');
    return validateIntentLocal(intent);
  }
  return post<{ valid: boolean; errors?: unknown[] }>('/v1/validate', { intent });
}

export async function issueReceipt(
  intent: IntentPayload,
  opts: { anchor?: boolean } = {},
): Promise<ValidatorReceipt> {
  if (!BASE) {
    const { issueReceiptLocal } = await import('./sip.server');
    return issueReceiptLocal(intent);
  }
  const qs = opts.anchor ? '?anchor=1' : '';
  return post<ValidatorReceipt>(`/v1/receipts${qs}`, { intent });
}

export async function anchorStatus() {
  if (!BASE) return { mode: 'disabled', reason: 'AIXIN_VALIDATOR_URL not set' };
  const res = await fetch(`${BASE}/v1/anchor/status`);
  return res.json();
}
