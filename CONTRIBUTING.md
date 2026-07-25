# Contributing to AiXin Twin

Thanks for your interest! Please read the [Code of Conduct](CODE_OF_CONDUCT.md).

## Development

```bash
bun install
bun run dev       # http://localhost:8080
bun run build     # production build
bun run typecheck
```

## Project layout

- `src/routes/` — TanStack Start file-based routes
- `src/lib/` — server functions (`*.functions.ts`) and shared client code
- `src/integrations/supabase/` — auto-generated Supabase client (do not edit)
- `supabase/migrations/` — database schema

## Protocol changes

This repo is the **reference implementation**. Any spec change belongs in
[aixin-protocol/aixin-protocol](https://github.com/aixin-protocol/aixin-protocol)
via the AIP process — not here.

## Signing your work

We use the [Developer Certificate of Origin](https://developercertificate.org/).
Sign commits with `git commit -s`.
