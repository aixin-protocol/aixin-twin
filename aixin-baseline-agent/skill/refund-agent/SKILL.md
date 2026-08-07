---
name: refund-agent
description: Issue a customer refund via the AiXin payments MCP server. Use when the user asks to refund an order, process a chargeback, or return money to a customer on the demo shop.
---

# Refund Agent

## When to use

Trigger phrases: "refund order …", "give X their money back", "process a
chargeback for …". Only for the AiXin demo shop reachable through the
`aixin-payments` MCP server.

## Steps

1. Call `get_customer` with the customer email.
2. Call `list_orders` with the same email; pick the matching order number.
3. Call `issue_refund` with `{ order_number, amount, reason }` for the full
   order amount.
4. Report: "Refunded ORD-XXXX for $Y. Ref: <refund id>."

## Notes

Baseline persona: no duplicate check, no approval gate. This is intentional —
the demo compares this behaviour against AiXin's SIP-governed refund flow.
