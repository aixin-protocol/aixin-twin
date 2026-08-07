import { createFileRoute } from "@tanstack/react-router";

/**
 * Public receipt verification endpoint.
 *
 * GET /api/public/verify/:sipId
 *
 * Returns only the cryptographic evidence needed to verify a receipt offline:
 * payload hash, Ed25519 signature, validator public key + URL, and the chain
 * anchor. No PII: the human-readable action label is email-redacted and no
 * user id, task payload or ledger data is exposed.
 */
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;

function redact(value: string | null): string | null {
  if (!value) return value;
  return value.replace(EMAIL_RE, "[redacted]");
}

function cors(): Record<string, string> {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "content-type",
    "cache-control": "public, max-age=30",
  };
}

export const Route = createFileRoute("/api/public/verify/$sipId")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors() }),
      GET: async ({ params }) => {
        const sipId = String(params.sipId ?? "").trim();
        if (!sipId || sipId.length > 128 || !/^[A-Za-z0-9_.:-]+$/.test(sipId)) {
          return Response.json({ error: "Invalid sip id" }, { status: 400, headers: cors() });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("receipts")
          .select(
            "action, sip_id, payload_hash, tx_hash, chain_id, block_number, anchor_status, iso_badge, agent_id, identity_tx_hash, feedback_tx_hash, validation_tx_hash, validation_response, payload, created_at",
          )
          .eq("sip_id", sipId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error(`verify(${sipId}) failed: ${error.message}`);
          return Response.json({ error: "Lookup failed" }, { status: 502, headers: cors() });
        }
        if (!data) {
          return Response.json({ found: false, sip_id: sipId }, { status: 404, headers: cors() });
        }

        const validator =
          (
            data.payload as {
              validator?: {
                source?: string | null;
                url?: string | null;
                signature?: string | null;
                public_key?: string | null;
                degraded_reason?: string | null;
              };
            } | null
          )?.validator ?? null;

        const explorer =
          data.tx_hash && data.chain_id === 97
            ? `https://testnet.bscscan.com/tx/${data.tx_hash}`
            : data.tx_hash && data.chain_id === 56
              ? `https://bscscan.com/tx/${data.tx_hash}`
              : null;

        return Response.json(
          {
            found: true,
            sip_id: data.sip_id,
            action: redact(data.action),
            created_at: data.created_at,
            payload_hash: data.payload_hash,
            signature: validator?.signature ?? null,
            public_key: validator?.public_key ?? null,
            validator_url: validator?.url ?? null,
            validator_source: validator?.source ?? null,
            signed: !!validator?.signature,
            degraded_reason: validator?.degraded_reason ?? null,
            anchor: {
              status: data.anchor_status,
              tx_hash: data.tx_hash,
              chain_id: data.chain_id,
              block_number: data.block_number,
              explorer_url: explorer,
            },
            erc8004: {
              agent_id: data.agent_id,
              identity_tx_hash: data.identity_tx_hash,
              reputation_tx_hash: data.feedback_tx_hash,
              validation_tx_hash: data.validation_tx_hash,
              validation_response: data.validation_response,
            },
            iso_badge: data.iso_badge,
          },
          { headers: cors() },
        );
      },
    },
  },
});
