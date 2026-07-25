# AiXin Twin — Reference Implementation PRD

> Product Requirements Document for `aixin-protocol/aixin-twin` — the
> reference web application that demonstrates the AiXin Protocol end-to-end.
>
> Status: v1.0 · Last updated: 2026-07-25
>
> This PRD is **adapted** from the original AiXin PRD (which described the app
> and protocol as one monolith). Since then the protocol has been extracted
> into `aixin-protocol/aixin-protocol` and published as independent packages
> (`@aixin-protocol/cli`, `@aixin-protocol/sdk-js`, `aixin-protocol-sdk`,
> `@aixin-protocol/validator-server`, `@aixin-protocol/adapter`). This
> document describes how the reference app consumes those packages instead of
> re-implementing them.

## 1. Vision

AiXin is the **trust layer for agentic AI**. `aixin-twin` is the canonical,
self-hostable reference implementation: a bilingual (EN + zh-CN) web app where
a user hatches one **Master Twin** that orchestrates a team of **Specialist
Twins**, each equipped with governed **Skills**. Every consequential action
runs through the **Signal Intent Protocol (SIP)** and emits a signed,
optionally chain-anchored receipt.

The reference app exists to:

1. Prove the protocol is implementable by a single team in a normal web stack.
2. Give integrators a working template to fork or study.
3. Anchor investor / user demos in something you can `docker compose up`.

## 2. Relationship to the protocol

| Concern | Owned by | Package |
| --- | --- | --- |
| Wire formats, canonicalization, signing | Protocol repo | `@aixin-protocol/sdk-js`, `aixin-protocol-sdk` |
| Intent validation + receipt signing service | Protocol repo | `@aixin-protocol/validator-server` |
| CLI (scaffold, validate, sign) | Protocol repo | `@aixin-protocol/cli` |
| Reverse manifest ingestion | Protocol repo | `@aixin-protocol/adapter` |
| Product UX, auth, storage, orchestration | **This repo** | `aixin-twin` |
| BSC Testnet audit-anchor contract | Protocol repo | `contracts/AuditAnchor.sol` |

**Rule of thumb**: if it's a wire-level rule or a signing primitive it lives
in the protocol. If it's screen behavior or business orchestration it lives
here.

## 3. Personas

- **Founder / Solo Operator** — hatches a Master Twin to run a specific
  vertical (Travel, Marketing, Finance).
- **Integrator / Developer** — forks `aixin-twin` to embed governed agents
  into their own product; wants clean seams and typed protocol clients.
- **Auditor / Regulator** — inspects Decision Cards, receipts, and anchor
  transactions to prove an action was authorised and reproducible.

## 4. Scope

### In scope (v1)
- Bilingual marketing landing + auth + 3-step onboarding (hatch Master Twin).
- Command Center: master twin, specialist team, live delegation feed.
- Specialist Twins list + drill-down (assigned skills, delegated task, signed
  SIP action log).
- Skills library, Marketplace, and 5-canvas SkillCraft builder.
- Governance: 5-step SIP pipeline visualization, Decision Card approve/reject,
  audit trail with receipt hashes and (when configured) BSC Testnet tx links.
- Reputation & Token: ERC-8004 reputation cards + clearly-labelled
  **Ledger Preview** for pre-IDO simulated flows (earn, stake, burn, payout).
- Reverse-adapt existing OpenAI / LangChain / OpenAPI tools into AiXin
  SkillManifests via `@aixin-protocol/adapter`.

### Out of scope (v1)
- Real token minting / trading.
- Multi-tenant SaaS billing.
- Mobile-native apps.
- Non-EVM anchor chains.

## 5. Architecture

```text
+---------------------------+        +------------------------------+
|  aixin-twin (this repo)   |        |  @aixin-protocol/validator-  |
|  TanStack Start + Vite    | HTTP   |  server (sidecar)            |
|  React 19 · Tailwind v4   +------->+  /v1/intents  /v1/receipts   |
|  shadcn/ui · i18n         |        |  /v1/anchor                  |
|                           |        +---------------+--------------+
|  createServerFn RPC       |                        |
|  Supabase (auth+db+RLS)   |                        v
|                           |               +------------------+
|  validator-client.ts <----+-------------- |  BSC Testnet     |
|  (falls back to local sip)|               |  AuditAnchor.sol |
+---------------------------+               +------------------+
```

### Runtime
- **Frontend**: React 19 + TanStack Router (file-based routes under
  `src/routes/`) + Tailwind v4 + shadcn/ui.
- **Server**: TanStack Start server functions (`createServerFn`) running on
  Cloudflare Workers-compatible runtime (`nodejs_compat`).
- **Auth + Data**: Supabase (Postgres + RLS + Auth). One `master_twins` row
  per user; specialist_twins, skills, decision_cards, receipts,
  reputation_entries, ledger_entries, adapters.
- **Protocol side**: `@aixin-protocol/validator-server` reachable at
  `AIXIN_VALIDATOR_URL` (Docker Compose wires it as `http://validator:3001`).
- **Anchor**: optional; when `AIXIN_ANCHOR_*` env vars are set on the
  validator sidecar, receipts include a real BSC Testnet tx hash.

### SIP pipeline (5 steps)
1. **Intent draft** — LLM turns natural language into a candidate SIP JSON.
2. **Schema check** — `@aixin-protocol/sdk-js` validates against the AIP-1
   schema.
3. **Policy check** — deterministic rules (risk tier, spending caps, allow
   lists). Runs in `src/lib/sip.server.ts` or delegated to validator server.
4. **Human gate** — high-risk intents produce a **Decision Card** requiring
   approval before execution.
5. **Execute + Receipt** — action runs, receipt is signed (Ed25519 via the
   validator), optionally anchored to BSC Testnet.

## 6. Key user flows

### 6.1 Hatch + onboard
Sign up → 3-step onboarding → `master_twins` row created → land on Command
Center with empty specialist list.

### 6.2 Install → Assign → Delegate → Approve → Receipt
1. Open **Skills / Marketplace**, install a skill (or reverse-adapt an
   existing OpenAI/LangChain tool via the adapter).
2. Open a Specialist Twin, **assign** the skill.
3. From Command Center, **delegate** a natural-language task.
4. LLM produces a SIP intent; if risk ≥ medium, a **Decision Card** appears.
5. User approves; validator signs the receipt; UI shows the tx hash and
   (when anchor is live) a BscScan link.

### 6.3 Reputation
Every successful signed action bumps the specialist's ERC-8004 reputation
card. Failures and vetoed Decision Cards are also recorded (with reason).

## 7. Data model (Supabase, high-level)
- `master_twins` (1 per user)
- `specialist_twins` (n per master)
- `skills`, `skill_marketplace`, `adapters`
- `decision_cards`, `receipts`, `sip_logs`
- `reputation_entries`, `ledger_entries`, `staking_positions`
- `governance_proposals`, `user_profiles`

All tables have RLS on and `GRANT`s scoped to `authenticated`.

## 8. Non-functional requirements
- **Self-hostable in one command**: `docker compose up` brings up app +
  validator + Postgres.
- **Deterministic core**: SIP validation and receipt canonicalization MUST
  be byte-identical to the JS/Python SDK reference outputs.
- **Fail-secure**: any validator or anchor failure blocks execution rather
  than silently proceeding.
- **Bilingual**: every user-facing string exists in `en` and `zh-CN`
  (see `src/lib/i18n.tsx`).
- **A11y**: shadcn primitives, keyboard-navigable Decision Cards.
- **Test-mode banner** visible whenever anchor is simulated or ledger is
  in preview mode — never hide the demo boundary from users.

## 9. Success metrics
- Time-to-first-signed-receipt on a fresh install: **< 10 minutes**.
- 100% of consequential actions produce a receipt (measured in `sip_logs`).
- Reference use cases (Travel, Marketing, Finance) each assembled from an
  empty account via Install → Assign → Delegate → Approve → Receipt.

## 10. Milestones (this repo)
- **M0** — Scaffold + Docker + CI shipped (done).
- **M1** — Live end-to-end loop against `validator-server` sidecar, real
  BSC Testnet tx surfaced in the Governance screen.
- **M2** — First tagged release (`v0.1.0`), container image on GHCR.
- **M3** — Integrator docs + fork guide + 3 use-case walkthroughs.

## 11. Open questions
- Do we ship a hosted demo at `twin.aixin.io` or leave hosting to forkers?
- Should reputation cards be per-specialist or aggregate per master by v1?
- Multi-tenant / org support: v1 punt, or minimal invite flow?

## 12. References
- Protocol repo: <https://github.com/aixin-protocol/aixin-protocol>
- Spec site: <https://aixin-protocol.github.io/aixin-protocol/> (custom
  domain `spec.aixin.io` deferred)
- Whitepaper v3, AIP-1 (Intent), AIP-2 (Receipt) — in the protocol repo.
- License: BSL 1.1 (see `LICENSE`).
