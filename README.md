# AiXin Twin — Reference Implementation

> The reference open-source implementation of the [AiXin Protocol](https://github.com/aixin-protocol/aixin-protocol) (SIP + TOP).
>
> A bilingual (EN / 中文) web app that hatches a Master Twin, orchestrates Specialist Twins, and routes every consequential action through the Signal Intent Protocol with signed receipts and optional BSC audit anchoring.

## Stack

- **Frontend:** React 19 + TanStack Start v1 + Vite 7 + Tailwind v4 + shadcn/ui
- **Backend:** Supabase (Postgres + Auth + Storage) with RLS
- **Protocol:** `@aixin-protocol/sdk-js` + `@aixin-protocol/validator-server`
- **Anchoring:** BSC Testnet via viem

## Quick start (self-host)

```bash
git clone https://github.com/aixin-protocol/aixin-twin.git
cd aixin-twin
cp .env.example .env   # fill in Supabase + validator URL
docker compose up
```

Open http://localhost:3000.

## Env vars

See `.env.example`. The minimum set:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase project
- `AIXIN_VALIDATOR_URL` — reference validator server (default `http://validator:3001` in Compose)
- `AIXIN_ANCHOR_*` — optional, enables real BSC Testnet anchoring

## License

Business Source License 1.1 → converts to Apache-2.0 after 3 years. See `LICENSE`.
