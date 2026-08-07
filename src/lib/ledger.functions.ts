import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// The shared ledger the OpenClaw baseline agent and AiXin's governed executor
// both write to via /api/public/openclaw/mcp. Read via service-role so the
// demo can display the same rows regardless of the current viewer — the data
// is intentionally global demo data, not per-user.
export const readSharedLedger = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [customers, orders, refunds, actions] = await Promise.all([
      supabaseAdmin
        .from("demo_customers")
        .select("email, name, created_at")
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("demo_orders")
        .select("order_number, customer_email, amount, currency, status, created_at")
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("demo_refunds")
        .select("id, order_number, amount, reason, issued_by_agent, governance_status, sip_receipt_id, created_at")
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("demo_agent_actions")
        .select("id, agent_label, tool, args, result, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    return {
      customers: customers.data ?? [],
      orders: orders.data ?? [],
      refunds: refunds.data ?? [],
      actions: actions.data ?? [],
    };
  });

// Reset the shared demo ledger back to the seed state:
//   - Demo Customer at demo@aixin.local
//   - ORD-1001, $129 USD, status=refunded
//   - one prior refund from `system-baseline`
//   - agent-action log wiped
export const resetSharedLedger = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Wipe children first, then parents.
    await supabaseAdmin.from("demo_agent_actions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("demo_refunds").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("demo_orders").delete().neq("order_number", "__none__");
    await supabaseAdmin.from("demo_customers").delete().neq("email", "__none__");

    await supabaseAdmin.from("demo_customers").insert({
      email: "demo@aixin.local",
      name: "Demo Customer",
    });
    await supabaseAdmin.from("demo_orders").insert({
      order_number: "ORD-1001",
      customer_email: "demo@aixin.local",
      amount: 129.0,
      currency: "USD",
      status: "refunded",
    });
    await supabaseAdmin.from("demo_refunds").insert({
      order_number: "ORD-1001",
      amount: 129.0,
      reason: "Original refund on record",
      issued_by_agent: "system-baseline",
      governance_status: "executed",
    });

    return { ok: true };
  });
