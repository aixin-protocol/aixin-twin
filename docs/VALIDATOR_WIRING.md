# Wiring the app to @aixin-protocol/validator-server

The Committer preset "Track B · Validator wiring" adds:

- `src/lib/validator-client.ts` — the client used by server functions
- `AIXIN_VALIDATOR_URL` entry in `.env.example`

## Manual follow-ups (once merged)

1. Replace direct calls to `sip.server.ts` in delegation flows with:
   ```ts
   import { validateIntent, issueReceipt } from '@/lib/validator-client';
   ```
2. Set `AIXIN_VALIDATOR_URL` in production (Docker Compose sets it to
   `http://validator:3001` automatically).
3. When `AIXIN_ANCHOR_*` env vars are present on the validator container,
   receipts will include a real BSC Testnet `anchor.txHash`.

## Fallback

If `AIXIN_VALIDATOR_URL` is unset the client falls back to the in-process
`sip.server.ts` implementation, so local dev still works without the
sidecar.
