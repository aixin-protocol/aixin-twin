// Shared MCP streamable-http endpoint used by BOTH the OpenClaw baseline
// agent and (for parity) AiXin's own governed executor. Same ledger, same
// tools, different governance path. Attribution comes from the API key.
import { createFileRoute } from "@tanstack/react-router";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, Mcp-Session-Id",
  "Access-Control-Max-Age": "86400",
};

type JsonRpcReq = { jsonrpc: "2.0"; id?: number | string | null; method: string; params?: any };

const TOOLS = [
  {
    name: "get_customer",
    description: "Look up a customer by email.",
    inputSchema: {
      type: "object",
      properties: { email: { type: "string" } },
      required: ["email"],
    },
  },
  {
    name: "list_orders",
    description: "List orders for a customer email.",
    inputSchema: {
      type: "object",
      properties: { email: { type: "string" } },
      required: ["email"],
    },
  },
  {
    name: "list_refunds",
    description: "List refunds already issued for an order number.",
    inputSchema: {
      type: "object",
      properties: { order_number: { type: "string" } },
      required: ["order_number"],
    },
  },
  {
    name: "issue_refund",
    description:
      "Issue a refund for an order. Writes a demo_refunds row attributed to your agent. Duplicate refunds are NOT blocked at the API layer — governance is the caller's job.",
    inputSchema: {
      type: "object",
      properties: {
        order_number: { type: "string" },
        amount: { type: "number" },
        reason: { type: "string" },
      },
      required: ["order_number", "amount"],
    },
  },
];

function rpc(id: any, result: any) {
  return { jsonrpc: "2.0" as const, id, result };
}
function rpcErr(id: any, code: number, message: string) {
  return { jsonrpc: "2.0" as const, id, error: { code, message } };
}
function textContent(obj: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] };
}

async function authorize(request: Request) {
  const h = request.headers.get("authorization") ?? "";
  const key = h.replace(/^Bearer\s+/i, "").trim();
  if (!key) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("demo_api_keys")
    .select("agent_label")
    .eq("key_hash", key)
    .maybeSingle();
  return data?.agent_label ?? null;
}

async function runTool(agent: string, name: string, args: any) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let result: unknown;

  if (name === "get_customer") {
    const { data } = await supabaseAdmin
      .from("demo_customers")
      .select("email, name, created_at")
      .eq("email", String(args?.email ?? ""))
      .maybeSingle();
    result = data ?? { error: "not_found" };
  } else if (name === "list_orders") {
    const { data } = await supabaseAdmin
      .from("demo_orders")
      .select("order_number, customer_email, amount, currency, status, created_at")
      .eq("customer_email", String(args?.email ?? ""));
    result = { orders: data ?? [] };
  } else if (name === "list_refunds") {
    const { data } = await supabaseAdmin
      .from("demo_refunds")
      .select("id, order_number, amount, reason, issued_by_agent, governance_status, created_at")
      .eq("order_number", String(args?.order_number ?? ""));
    result = { refunds: data ?? [] };
  } else if (name === "issue_refund") {
    const { data, error } = await supabaseAdmin
      .from("demo_refunds")
      .insert({
        order_number: String(args?.order_number ?? ""),
        amount: Number(args?.amount ?? 0),
        reason: args?.reason ? String(args.reason) : null,
        issued_by_agent: agent,
        governance_status: agent === "aixin-governed" ? "sip-approved" : "executed",
      })
      .select("id, order_number, amount, issued_by_agent, created_at")
      .single();
    result = error ? { error: error.message } : { refund: data };
  } else {
    throw new Error(`unknown tool: ${name}`);
  }

  await supabaseAdmin.from("demo_agent_actions").insert({
    agent_label: agent,
    tool: name,
    args: args ?? {},
    result: result as any,
  });
  return textContent(result);
}

function withCors(body: Response) {
  const headers = new Headers(body.headers);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v));
  return new Response(body.body, { status: body.status, statusText: body.statusText, headers });
}

export const Route = createFileRoute("/api/public/openclaw/mcp")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => {
        let body: JsonRpcReq;
        try {
          body = (await request.json()) as JsonRpcReq;
        } catch {
          return withCors(Response.json(rpcErr(null, -32700, "Parse error")));
        }
        const { id, method, params } = body;
        try {
          if (method === "initialize") {
            return withCors(
              Response.json(
                rpc(id, {
                  protocolVersion: "2024-11-05",
                  capabilities: { tools: {} },
                  serverInfo: { name: "aixin-payments-mcp", version: "1.0.0" },
                }),
              ),
            );
          }
          if (method === "tools/list") {
            return withCors(Response.json(rpc(id, { tools: TOOLS })));
          }
          if (method?.startsWith("notifications/")) {
            return withCors(new Response(null, { status: 204 }));
          }
          if (method === "tools/call") {
            const agent = await authorize(request);
            if (!agent) {
              return withCors(
                new Response(
                  JSON.stringify(rpcErr(id, -32001, "Unauthorized: send Authorization: Bearer <api-key>")),
                  { status: 401, headers: { "content-type": "application/json" } },
                ),
              );
            }
            const name = params?.name as string;
            const args = params?.arguments ?? {};
            const out = await runTool(agent, name, args);
            return withCors(Response.json(rpc(id, out)));
          }
          return withCors(Response.json(rpcErr(id, -32601, `Method not found: ${method}`)));
        } catch (e: any) {
          return withCors(Response.json(rpcErr(id, -32000, e?.message ?? "server error")));
        }
      },

    },
  },
});
