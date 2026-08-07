# AiXin Roadmap

> Last updated: 2026-07-31
> Current phase: **Track A ✅ · Track B 🟡 real persistence + live anchor shipped · Testnet Go-Live (Phase 3.5) 🔴 in progress · Core protocol / Trust Graph (Phase 4) 🔜 · Post-launch (Phases 5–6) 🔜**

>
> **Single source of truth.** This file is the canonical roadmap for both
> `aixin-protocol/aixin-protocol` and `aixin-protocol/aixin-twin`. Any change
> here MUST be mirrored to the protocol repo in the same commit — do not keep
> a divergent copy. If the protocol repo drifts, this file wins.

## Repo map

| Repo | Purpose | Status |
| --- | --- | --- |
| `aixin-protocol/aixin-protocol` | Protocol specs, CLI, SDKs (JS/Python), reference validator server, whitepapers, ERC-8004 contracts | ✅ Active, 3 packages published |
| `aixin-protocol/aixin-twin` | Reference implementation web app (this Lovable project) extracted into its own repo | 🟡 Scaffold shipped; live demo tx pending |

## Core protocol focus

> ⭐ **[Phase 4 — Trust Graph & Contracts](#phase-4--core-protocol-trust-graph--contracts-track-d)** is the heart of AiXin:
> the queryable, cryptographically-verifiable trust graph over audited on-chain contracts.
> It is listed in numeric order below (after Phase 3.5) so the phase sequence reads
> 0 → 1 → 2 → 3 → 3.5 → 4 → 5 → 6 with nothing skipped, but it is the highest-value
> body of work on this roadmap and the reason AiXin is a protocol, not just a governed app.

## At a glance

| Phase | Track | Goal | Status |
| --- | --- | --- | --- |
| 0 — Foundation | — | Brand, i18n, auth, SIP validator, Decision Cards, anchor contract | ✅ Shipped |
| 1 — Protocol publication | — | Whitepaper v3, AIP-1/AIP-2, spec site | ✅ Shipped |
| 2 — Reference tooling | A | CLI, JS/Python SDKs, validator-server, reverse adapter, quickstart | ✅ Shipped |
| 3 — Reference implementation | B | `aixin-twin` open-source app; realism fixes + two pre-IDO blockers | 🟡 In progress |
| **3.5 — Testnet go-live** | B | Real signatures, real chain txs, real adapters — no silent fakes | 🔴 In progress |
| **⭐ 4 — Core protocol: Trust Graph & Contracts** | D | Queryable, cryptographically-verifiable trust graph over audited contracts — what makes AiXin a *protocol* | 🔜 Next after go-live |
| **5 — Post-launch: Go-to-market** | C | Demo, decks, waitlist, use-case videos, investor handout | 🟡 Baseline shipped |
| **6 — Post-launch: Tokenomics & launch** | — | $AXN contract, ledger migration, mainnet bundle, TGE | 🔜 Post-audit |


## Shipped foundation (Phases 0–2)

**Phase 0 — Foundation**
- [x] Brand / design system (#FAF9F6 cream, #D97757 coral, #1A1814 dark, Sora/Inter/JetBrains Mono)
- [x] Bilingual i18n (EN + ZH)
- [x] Landing page, auth, onboarding
- [x] Master Twin + Specialist Twins data model
- [x] SIP (Signal Intent Protocol) deterministic validator
- [x] Decision Cards + signed receipts
- [x] BSC Testnet audit anchor contract + `anchor.server.ts`

**Phase 1 — Protocol publication**
- [x] Whitepaper v3
- [x] AIP-1 / AIP-2 normative specs
- [x] `spec.aixin.io` static site (works at `aixin-protocol.github.io/aixin-protocol`; DNS for custom domain deferred)

**Phase 2 — Track A: Reference tooling**
- [x] `@aixin-protocol/cli`
- [x] `@aixin-protocol/sdk-js`
- [x] `aixin-protocol-sdk` (Python) — *Trusted Publisher pending on PyPI; code ready*
- [x] `@aixin-protocol/validator-server` v1.0.0-rc.1
- [x] `@aixin-protocol/validator-server` v1.1.0 with BSC Testnet anchoring
- [x] Reverse manifest adapter (`@aixin-protocol/adapter` v0.1.0)
- [x] Quickstart page on spec site

## Phase 3 — Reference implementation open-source (Track B)
> Goal: extract the Lovable-built AiXin app into a standalone, self-hostable `aixin-twin` repo.

**Scaffolding (done):**
- [x] Create `aixin-protocol/aixin-twin` GitHub repo
- [x] Strip Lovable-specific bits and document generic Vite/TanStack Start setup (scaffold preset)
- [x] Add `docker-compose.yml` for one-liner self-host
- [x] Publish container image workflow (`ghcr.io/aixin-protocol/aixin-twin`)
- [x] Wire the app to `@aixin-protocol/validator-server` via `AIXIN_VALIDATOR_URL`
- [x] Reference-implementation PRD checked into `aixin-twin`
- [x] Decision Card approve flow signs via validator-server (Ed25519) and anchors to BSC Testnet with BscScan link in Governance UI

**UX polish (done):**
- [x] Specialist Twin lifecycle (pause / retire / delete + "Show retired" toggle)
- [x] Skill persistence + specialist assignment picker in SkillCraft
- [x] Chat UI overhaul ("Twin at Work" panel, animated status ring)
- [x] **"Ask AiXin" intent-first home at `/dashboard/ask`** — Master Twin hero, domain tiles (Travel · Marketing · Money · Work · Health · Something else), editable goal-starters, animated Chain-of-Thought thinking phase, propose→approve plan card flagging capability gaps, "working 24/7" living state with channel toggles (WhatsApp · WeChat · App). Default landing after sign-in and onboarding.
- [x] Collapsible sidebar (icon rail ↔ full nav, `localStorage` persisted); "Ask AiXin" pinned at top
- [x] Shared Ledger panel at `/dashboard/ledger` (live tables + reset) proving AiXin and OpenClaw hit the same MCP substrate
- [x] Reset demo data (cascading delete of tasks/cards/receipts, seed restore for ORD-1001)
- [x] Telegram bot loop (`@aixinchrisbot`) mirroring task threads deterministically

**Earnings transparency (done):**
- [x] Deterministic per-receipt earning breakdown in `src/lib/earnings.ts` (base + anchor bonus + ERC-8004 receipts + SIP quality × stake multiplier), used by both server (`sip.functions.ts`) and Reputation UI so the Earning Pool total reconciles line-by-line with each signed receipt.
- [x] "How earnings are calculated" card on `/dashboard/reputation` showing the last action's breakdown, lifetime total, and formula.
- [x] Per-receipt `+$X.XX $AXN` badge on every signed receipt row.

**Sneak-preview closeout (Phase 3):**
- [x] Live end-to-end loop wired (delegate → validator Ed25519 sig → BSC Testnet anchor → ERC-8004 identity/reputation/validation).
- [x] Persistent tasks + task_events with Realtime, task history at `/dashboard/tasks`.
- [x] ISO badge corrected to **ISO/IEC 42001** everywhere (legacy "ISO 27001" strings removed on receipts/governance UI).
- [ ] **Realistic intent capture** — before Plan, ask domain-specific follow-ups (Travel: from/to/dates/pax/budget; Marketing: channels/audience/dates; Money: amount/currency/counterparty). No plan is produced until required slots are filled. *Blocks a believable demo.*
- [ ] **Task management UX** — start a new task while another runs, resume an in-flight task from `/dashboard/tasks` back into the live activity view, archive/delete tasks, "Running" badge in sidebar. *Blocks multi-task demo.* (delete shipped; parallel + resume + badge still open)
- [ ] **On-chain evidence panel** per task — plain-language "what this tx proves" tooltip on every hash (audit anchor = payload hash committed; ERC-8004 Identity = agent registered; Reputation = feedback score signed; Validation = validator request+response). Link each to BscScan with the exact function called.
- [ ] **ERC-8004 visibility** — surface the three registry txs (Identity / Reputation / Validation) on the Reputation page and the task receipt drawer with contract addresses + BscScan links, not just the audit anchor. Backend already writes them via `erc8004.server.ts`; UI needs to show them.
- [ ] **Full ZH i18n coverage (pre-IDO blocker)** — every dashboard route, modal, empty state, toast, error message, tooltip and seeded demo copy must render in Simplified Chinese when the language toggle is set to 中文. Audit for hardcoded English strings across `src/routes/**` and `src/components/**`, move them into `src/lib/i18n.tsx`, then walk every page in both locales before sign-off.
- [ ] **Mobile-first responsive pass (pre-IDO blocker)** — every page must render cleanly at 375px / 414px / 768px: no horizontal scroll, no clipped headers, no overflowing tables or Decision Cards. Apply the grid + `min-w-0` + `shrink-0` header pattern, make tables scroll or stack as cards, and verify the sidebar, SkillCraft modal, Ask AiXin, Governance, Ledger, Tasks and Specialist detail on a real phone viewport before sign-off.
- [ ] Cut `v0.1.0` tag on `aixin-twin` (triggers `container.yml` → first published GHCR image).

## Phase 3.5 — Testnet go-live (no simulation where possible)
> Goal: everything that does **not** depend on the unminted $AXN token runs for real
> against BSC Testnet and real third-party APIs. The only remaining simulation after this
> phase is the clearly-labelled **Ledger Preview** (earn / stake / bond / burn / payout).
> Rule of thumb: if a code path can silently fall back to a fake hash or fake success, it
> must either become real or fail loudly with a visible "degraded" badge.

**3.5.a — Cryptographic truth (highest priority)**
- [ ] **Deploy `@aixin-protocol/validator-server` to a public URL** and set `AIXIN_VALIDATOR_URL`. Today the secret is unset, so `validator-client.server.ts` silently falls back to the in-process validator and every receipt is stored with `signature: null` / `public_key: null` — receipts are *hashed but not signed*. This is the single biggest gap to "live".
- [ ] **Publish the validator public key** (`/v1/pubkey` + `spec.aixin.io/keys`) so any third party can verify a receipt signature offline.
- [x] **Remove silent fallbacks** — `signReceiptWithValidator` now returns a `degraded_reason`, persisted on the receipt payload; the Reputation UI shows a red "Unsigned" badge with that reason instead of making an unsigned receipt look signed.
- [x] **Receipt verification endpoint + UI** — public `GET /api/public/verify/:sipId` (PII-redacted, CORS-enabled) returning payload hash, signature, validator pubkey/URL, anchor tx and ERC-8004 txs, plus a bilingual `/verify/:sipId` page and a "Verify" link on every receipt row on `/dashboard/reputation`.
- [x] **Anchor retry queue** — fake keccak hashes are gone (`anchor.server.ts` returns `txHash: null` and the UI shows "Not anchored"); a durable retry now exists: `POST /api/public/anchor/retry` (apikey-guarded, batches 10, max 12 attempts, records `anchor_attempts` / `anchor_last_error` / `anchor_last_attempt_at` on each receipt) scheduled by `pg_cron` every 15 minutes, plus `GET` for queue depth.

**3.5.b — On-chain surface**
- [ ] **Register the Master Twin + each Specialist Twin in ERC-8004 Identity at creation time** (persist `agent_id` on the `twins` row) instead of registering ad-hoc per action.
- [ ] **Register a distinct validator agent** in Identity — validation currently self-validates (`agentValidatorId === agentServerId`), which is not a real trust claim.
- [ ] **Surface all four txs per action** (Audit Anchor · Identity · Reputation · Validation) with contract addresses + BscScan deep links on the Reputation page and task receipt drawer.
- [ ] **On-chain evidence explainer** — plain-language "what this tx proves" per hash (moved up from Phase 3).
- [ ] **Chain health banner** — show gas balance of the anchoring wallet; alert when the faucet balance can no longer cover anchoring. Add a low-balance top-up runbook.
- [ ] **Contract verification on BscScan** (source + ABI published) for `AuditAnchor` and the three ERC-8004 registries, so the demo links show decoded functions, not raw input.

**3.5.c — Real execution, not theatre**
- [ ] **Adapter execution is real or blocked** — `execution.server.ts` still emits "Invoking {domain} adapters" as a narration event for any intent with no real tool. Every skill must declare a real adapter; intents with no live adapter must halt with an explicit "no live adapter — cannot execute" outcome instead of an AI-written artifact that looks like a result.
- [ ] **Remove the AI-generated outcome artifact as a success path** — keep it only as an explicitly labelled "draft / not executed" artifact.
- [x] **Gmail adapter live send** (real SMTP/API send + message id in the receipt).
- [ ] **Webhook adapter live POST** with HMAC signing + delivery status/retries recorded in the receipt.
- [ ] **Telegram adapter promoted from demo bot to per-user adapter credential** (link/unlink flow, delivery receipts).
- [ ] **Drop WhatsApp / WeChat channel toggles** from Ask AiXin until a real provider is wired (currently unbacked UI). Ship Telegram + email + in-app only.
- [x] **Adapter connectivity test** — a "Test connection" button per adapter that performs a real round-trip and stores `last_verified_at`; a stale/failed adapter blocks Live skills.
- [ ] **Remove demo-only seed data from the live path** (ORD-1001 refund fixtures) behind an explicit "Demo workspace" flag so a real testnet account starts empty.

**3.5.d — Production readiness**
- [ ] **Security pass** — run the security scan; confirm RLS + GRANTs on every table (`tasks`, `task_events`, `task_messages`, `task_outcomes`, `receipts`, `decision_cards`, `ledger_entries`, `adapters`, `skills`, `skill_versions`, `telegram_links`), and confirm adapter credentials are stored encrypted/server-only and never returned to the client.
- [ ] **Rate limiting + auth on `/api/public/*`** (OpenClaw MCP, Telegram webhook): verify Telegram secret token, cap MCP requests, and scope the MCP ledger to the demo workspace only.
- [ ] **Error budget & observability** — persist server-function failures, anchor failures and validator outages to a `system_events` table with an admin view; no more silent `console.error`.
- [ ] **Idempotency keys** on refund/execution writes so a double-approve cannot double-pay.
- [ ] **Auth hardening** — enable leaked-password protection, confirm no anonymous sign-ups, and either wire real Google OAuth or remove the dead WeChat sign-in button.
- [ ] **Terms / privacy / testnet disclaimer** page: "BSC Testnet only · no real funds · $AXN not minted".
- [ ] **Full ZH i18n coverage** (pre-IDO blocker — carried from Phase 3, must be green before go-live).
- [ ] **Mobile-first responsive pass** at 375/414/768px (pre-IDO blocker — carried from Phase 3).
- [ ] **End-to-end testnet acceptance run**: fresh account → onboard → connect a real adapter → install/author a skill → assign → delegate → Decision Card approve *and* reject → signed receipt (real signature) → 4 txs on BscScan → outcome delivered through a real channel. Record hashes in `TESTNET_RUN.md`.
- [ ] **Publish to `testnet.aixin.io`** (or the Lovable published URL) with a public status page listing contract addresses, validator pubkey and chain id.
- [ ] Cut `v0.1.0` tag on `aixin-twin` → first published GHCR image.

**Explicitly still simulated after Phase 3.5 (token-dependent, by design):**
- Earning pool, staking multiplier, access bonding, burn, payouts — all non-tradeable **Ledger Preview** entries.
- [ ] **Single simulation boundary** — one `LEDGER_PREVIEW` badge component used everywhere a token-dependent number is shown, so nothing else in the app is allowed to say "simulated".

## Phase 4 — Core protocol: Trust Graph & Contracts (Track D)
> Goal: turn the receipt trail into a queryable, cryptographically-verifiable trust graph
> anchored by audited on-chain contracts. This is what makes AiXin a *protocol*, not just
> a governed app. Lives primarily in `aixin-protocol/aixin-protocol`.

**Contracts (on-chain):**
- [x] ERC-8004 Identity / Reputation / Validation registries deployed to BSC Testnet
- [x] `AuditAnchor` contract deployed to BSC Testnet (payload-hash commitments)
- [ ] **Anchoring fee module** — per-anchor fee in $AXN, split between validator stake pool and burn address; parameterised via governance.
- [ ] **Validator staking module** — stake $AXN to run a validator; slashable on signed-but-invalid receipts; rewards from anchoring fees.
- [ ] Third-party contract audit (Identity + Reputation + Validation + Anchor + Fee + Staking as one bundle)
- [ ] Mainnet deployment plan + multisig ownership handover

**Trust Graph (off-chain, verifiable):**
- [ ] **Trust Graph indexer** — subgraph / worker that reads every anchor tx + ERC-8004 event and reconstructs the (agent → skill → receipt → validator → outcome) graph.
- [ ] **Verified sources registry** — signed manifest of "trusted skill publishers" (org DID + Ed25519 pubkey); consumed by validator-server to raise/lower SIP quality scores.
- [ ] **Public Trust Graph API** (`api.aixin.io/graph`) — read-only GraphQL over the indexed graph so any third party can independently verify a receipt without trusting our app.
- [ ] **Trust Graph explorer UI** at `spec.aixin.io/graph` — search by agent DID, receipt hash, or validator; renders the provenance chain with BscScan links at every edge.
- [ ] Reference client: `@aixin-protocol/graph-client` (JS + Python) so integrators can query the graph in three lines.

**Spec work:**
- [ ] AIP-3: Anchoring fee & validator staking economics
- [ ] AIP-4: Verified Sources Registry format
- [ ] AIP-5: Trust Graph query surface

## Post-launch

### Phase 5 — Go-to-market (Track C, sneak preview in days)
- [x] OpenClaw baseline agent harness shipped to `aixin-protocol/aixin-protocol/demos/openclaw-baseline/` — shared MCP ledger, duplicate-refund trap scenario, and PowerShell setup guide for the honest side-by-side demo.
- [x] Live head-to-head demo script (`DEMO_SCRIPT.md`) + investor addendum deck (`AiXin_Demo_Deck_v7_Live_Demo_Addendum.pptx`).
- [x] CEO + COO master decks aligned to v7 (Ask AiXin front door, ISO/IEC 42001, Telegram loop).
- [ ] Investor demo deck refresh (Ask AiXin screenshots + live BscScan tx + earnings-explained panel) — final pass after Phase 3 realism fixes.
- [ ] Waitlist landing + CRO copy
- [ ] Reference use-case videos (Travel, Marketing, Finance) — filmed after the realism fixes above
- [ ] Sneak-preview run-of-show doc (5-min demo script) — polished for external distribution
- [ ] "Repos & Artifacts" investor handout (URLs + versions + commit hashes)

### Phase 6 — Tokenomics & launch
- [ ] $AXN token contract (post-audit — bundled with Phase 4 audit)
- [ ] Pre-IDO ledger-preview → real ledger migration (unfreeze non-tradeable balances)
- [ ] Exchange / launch partner integration
- [ ] Mainnet launch of Identity / Reputation / Validation / Anchor / Fee / Staking bundle
- [ ] Token generation event (TGE)

## Minimum to go live (sneak preview)

Ordered by dependency — do 1–6 before recording anything:

1. **Slot-filling before Plan** in `/dashboard/ask` so vague intents ("plan a trip to Paris") trigger a short follow-up form instead of jumping to a fabricated itinerary.
2. **Task manager**: parallel runs, resume-from-history, archive/delete, "N running" badge.
3. **On-chain evidence panel**: per-tx explainer + ERC-8004 registry txs surfaced on Reputation + task drawer.
4. **Copy pass**: replace remaining simulation language with "reference simulation" labels where the backend isn't real yet (channel delivery to WhatsApp/WeChat, token payouts).
5. **Full ZH i18n coverage** — no English leaks anywhere when the toggle is 中文 (pre-IDO blocker).
6. **Mobile-first responsive pass** — every page verified at 375/414/768px (pre-IDO blocker).
7. Record demo tx + earnings screenshots.
8. Cut `v0.1.0`, publish GHCR image.
9. Refresh investor deck + run-of-show.
