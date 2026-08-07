import { createFileRoute } from "@tanstack/react-router";

/**
 * Durable anchor retry queue.
 *
 * POST /api/public/anchor/retry
 *
 * Picks up receipts that were never written to chain (tx_hash IS NULL and
 * anchor_status in pending/failed/simulated) and retries the on-chain anchor.
 * Called by pg_cron every 15 minutes with the project apikey header; also safe
 * to call manually. Never returns PII — only sip ids, statuses and tx hashes.
 */

const MAX_BATCH = 10;
const MAX_ATTEMPTS = 12;

function guard(request: Request): boolean {
  const key = request.headers.get("apikey") ?? "";
  const allowed = [process.env.SUPABASE_ANON_KEY, process.env.SUPABASE_PUBLISHABLE_KEY].filter(
    (v): v is string => Boolean(v),
  );
  return allowed.length > 0 && allowed.includes(key);
}

export const Route = createFileRoute("/api/public/anchor/retry")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!guard(request)) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { anchorReceipt } = await import("@/lib/anchor.server");

        const { data: pending, error } = await supabaseAdmin
          .from("receipts")
          .select("id, sip_id, payload_hash, anchor_attempts")
          .is("tx_hash", null)
          .in("anchor_status", ["pending", "failed", "simulated"])
          .lt("anchor_attempts", MAX_ATTEMPTS)
          .order("created_at", { ascending: true })
          .limit(MAX_BATCH);

        if (error) {
          console.error(`anchor-retry lookup failed: ${error.message}`);
          return Response.json({ error: "Lookup failed" }, { status: 502 });
        }

        const results: Array<{ sip_id: string; status: string; tx_hash: string | null }> = [];

        for (const row of pending ?? []) {
          const anchor = await anchorReceipt(row.sip_id, row.payload_hash);
          const attempts = (row.anchor_attempts ?? 0) + 1;

          await supabaseAdmin
            .from("receipts")
            .update({
              tx_hash: anchor.txHash,
              chain_id: anchor.chainId,
              block_number: anchor.blockNumber ? Number(anchor.blockNumber) : null,
              anchor_status: anchor.status,
              anchor_attempts: attempts,
              anchor_last_error: anchor.reason ?? null,
              anchor_last_attempt_at: new Date().toISOString(),
            })
            .eq("id", row.id);

          results.push({ sip_id: row.sip_id, status: anchor.status, tx_hash: anchor.txHash });
        }

        const anchored = results.filter((r) => r.status === "anchored").length;
        return Response.json({
          scanned: results.length,
          anchored,
          still_unanchored: results.length - anchored,
          results,
        });
      },
      GET: async ({ request }) => {
        if (!guard(request)) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { count } = await supabaseAdmin
          .from("receipts")
          .select("id", { count: "exact", head: true })
          .is("tx_hash", null)
          .in("anchor_status", ["pending", "failed", "simulated"]);
        return Response.json({ queue_depth: count ?? 0, max_attempts: MAX_ATTEMPTS });
      },
    },
  },
});
