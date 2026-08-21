# AiXin Roadmap

> Last updated: 2026-08-08
> Current phase: **Track A ✅ · Track B 🟡 real persistence + live anchor shipped · pre-IDO blockers (ZH i18n + mobile-first) ✅ cleared · Testnet Go-Live (Phase 3.5) 🔴 in progress · Core protocol / Trust Graph (Phase 4) 🔜 · Post-launch (Phases 5–6) 🔜**

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
- [x] **Realistic intent capture** — before Plan, ask domain-specific follow-ups (Travel: from/to/dates/pax/budget; Marketing: channels/audience/dates; Money: amount/currency/counterparty). No plan is produced until required slots are filled. *Blocks a believable demo.*
- [x] **Task management UX** — start a new task while another runs, resume an in-flight task from `/dashboard/tasks` back into the live activity view, archive/delete tasks, "Running" badge in sidebar and mobile nav. *Shipped.*
- [ ] **On-chain evidence panel** per task — plain-language "what this tx proves" tooltip on every hash (audit anchor = payload hash committed; ERC-8004 Identity = agent registered; Reputation = feedback score signed; Validation = validator request+response). Link each to BscScan with the exact function called.
- [x] **ERC-8004 visibility** — the three registry txs (Identity / Reputation / Validation) plus the audit anchor are surfaced with contract addresses + BscScan links on the Reputation page and the task receipt panel via the shared `OnChainEvidence` component.
- [x] **Full ZH i18n coverage (pre-IDO blocker)** — dashboard routes, modals, empty states, toasts, error messages, tooltips and seeded demo copy render in Simplified Chinese; static strings live in `src/lib/i18n*.ts(x)` and dynamic DB/AI content goes through `td()`, with task outcomes and chat replies generated in the user's locale. Verified in both locales by `e2e/ui-smoke.py`.
- [x] **Mobile-first responsive pass (pre-IDO blocker)** — dashboard shell is mobile-first: the dark rail is desktop-only and replaced by a hamburger drawer (`MobileNav`), compact top bar with wrap-safe mode toggle, tighter banner/page padding, and a full-width Ask composer action. No horizontal overflow at 375 / 414 / 768px (asserted in `e2e/ui-smoke.py`).
- [x] **China tester hardening pass (2026-08-09 feedback)** — six of seven reported issues fixed and verified: (1) machine-translation crashes (`insertBefore`) stopped by syncing `<html lang>` with the in-app EN/中文 switcher plus `translate="no"` / `notranslate` / `<meta name="google" content="notranslate">`; (2) blurry/ghosting/transparent surfaces fixed with sRGB hex fallbacks ahead of every `oklch()` theme token; (3) all dialogs capped at `92dvh` with internal scrolling and sticky footer actions; (4) mixed EN/ZH task output fixed — the UI locale travels with `delegateTask` / `runSipValidate` into `intent_json`, so server-generated reports, chat replies and trace events follow it; (5) "Adapter" reworded to **外部工具连接（适配器）** with a plain-language explainer; (6) "Draft" outcomes now explain why they were not executed and link straight to connecting the required tool. Verified by `e2e/translate-repro.py` (15/15, forced MutationObserver translator), `e2e/ui-smoke.py` (11/11, incl. a 375×600 dialog-fits assertion), `src/lib/locale-output.test.ts` (26) and `src/lib/translate-guard.test.ts` (6). Findings and retest steps documented bilingually in `CHINA_TESTER_FIX_REPORT.md`.
- [x] **Legacy-browser notice** — `LegacyBrowserNotice` feature-detects `oklch()` / `dvh` support and shows a dismissible bilingual upgrade banner instead of rendering a broken page (Windows 7 / Chrome 109 is below the support baseline).
- [ ] Cut `v0.1.0` tag on `aixin-twin` (triggers `container.yml` → first published GHCR image).

## Phase 3.5 — Testnet go-live (no simulation where possible)
> Goal: everything that does **not** depend on the unminted $AXN token runs for real
> against BSC Testnet and real third-party APIs. The only remaining simulation after this
> phase is the clearly-labelled **Ledger Preview** (earn / stake / bond / burn / payout).
> Rule of thumb: if a code path can silently fall back to a fake hash or fake success, it
> must either become real or fail loudly with a visible "degraded" badge.

**3.5.a — Cryptographic truth (highest priority)**
- [x] **Receipts are really signed (Ed25519)** — `src/lib/receipt-signer.server.ts` derives an Ed25519 key from the `AIXIN_SIGNING_SEED` secret and signs every receipt's `payload_hash` in-process, so approvals and rejections carry a verifiable signature instead of `signature: null`. `validator-client.server.ts` prefers an external `@aixin-protocol/validator-server` when `AIXIN_VALIDATOR_URL` is set and falls back to in-process signing with a recorded reason — it never silently returns an unsigned receipt. Round-trip + tamper tests in `src/lib/receipt-signer.test.ts`.
- [x] **Publish the validator public key** — public `GET /api/public/keys` (CORS, cached) returns the Ed25519 public key as hex / base64 / JWK with the key id, signing scheme and chain id, so any third party can verify a receipt signature offline; `/api/public/verify/:sipId` now returns `algorithm` + `keys_url`.
- [ ] **Deploy `@aixin-protocol/validator-server` to a public URL** and set `AIXIN_VALIDATOR_URL` — optional hardening: moves the signing key out of the app process into a standalone validator (needed before third-party validators are a thing).

- [x] **Remove silent fallbacks** — `signReceiptWithValidator` now returns a `degraded_reason`, persisted on the receipt payload; the Reputation UI shows a red "Unsigned" badge with that reason instead of making an unsigned receipt look signed.
- [x] **Receipt verification endpoint + UI** — public `GET /api/public/verify/:sipId` (PII-redacted, CORS-enabled) returning payload hash, signature, validator pubkey/URL, anchor tx and ERC-8004 txs, plus a bilingual `/verify/:sipId` page and a "Verify" link on every receipt row on `/dashboard/reputation`.
- [x] **Anchor retry queue** — fake keccak hashes are gone (`anchor.server.ts` returns `txHash: null` and the UI shows "Not anchored"); a durable retry now exists: `POST /api/public/anchor/retry` (apikey-guarded, batches 10, max 12 attempts, records `anchor_attempts` / `anchor_last_error` / `anchor_last_attempt_at` on each receipt) scheduled by `pg_cron` every 15 minutes, plus `GET` for queue depth.

**3.5.b — On-chain surface**
- [x] **Register the Master Twin + each Specialist Twin in ERC-8004 Identity at creation time** — `src/lib/identity.server.ts` (`ensureTwinIdentity`) registers on hatch / create-specialist / demo-seed and persists `agent_id`, `agent_domain` and `identity_tx_hash` on the twin row (`master_twins` gained those columns); the approval path is now only a backfill.
- [x] **Register a distinct validator agent** in Identity — `ensureValidatorAgentId()` registers `validator.aixin.agent` once and caches it in the new `chain_agents` table; `requestAndRespondValidation` now passes it as `agentValidatorId`, and each receipt records `validation.validator_agent_id` + `self_validated` so a fallback to self-validation is visible instead of implied.
- [x] **Surface all four txs per action** (Audit Anchor · Identity · Reputation · Validation) with contract addresses + BscScan deep links — shared `src/components/dashboard/OnChainEvidence.tsx` renders all four rows on `/dashboard/reputation` and on the task receipt panel, with an explicit "not written" state per missing tx (never implied proof).
- [x] **On-chain evidence explainer** — bilingual plain-language "what this tx proves" line per hash, plus contract address links and the receipt payload hash.
- [x] **Chain health banner** — `ChainHealthBanner` + `getChainStatus` read the anchoring wallet's live tBNB balance from BSC Testnet and warn (low / empty / unconfigured) with a faucet top-up link on `/dashboard/reputation`. Private key stays server-side.

- [ ] **Contract verification on BscScan** (source + ABI published) — needs a BscScan API key + the exact compiler settings used at deploy time (blocked on user input) for `AuditAnchor` and the three ERC-8004 registries, so the demo links show decoded functions, not raw input.

**3.5.c — Real execution, not theatre**
- [x] **Adapter execution is real or blocked** — `execution.server.ts` no longer narrates "Invoking {domain} adapters". `src/lib/execution-capability.ts` classifies every approved run: only a real deterministic tool (ledger refund write, live CoinGecko briefing, deterministic forecast) counts as executed. Anything else halts with a `BLOCKED` guard event ("No live adapter for {domain} — cannot execute", with instructions to connect a real adapter) and the task is persisted with the new `blocked` status instead of `done`. Rules unit-tested in `src/lib/execution-capability.test.ts`.
- [x] **Remove the AI-generated outcome artifact as a success path** — when nothing was executed the artifact is explicitly labelled: title prefixed "Draft (not executed) / 草稿（未执行）", a bilingual "nothing was sent, booked, paid or written" notice at the top of the summary, and machine-readable `_executed: false` / `_status: "draft_not_executed"` markers on the artifact. The generator prompt is now proposal-only — it may not claim completed real-world actions or invent confirmation numbers.

- [x] **Gmail adapter live send** (real SMTP/API send + message id in the receipt).
- [x] **Email delivery confirmation + error surface** — the Plan step confirms/edits the recipient (mail icon, invalid-state highlight, "use adapter address" shortcut, opt-out toggle), follow-up chat requests ("please send to my email") deliver the existing artifact, and Task detail shows the sent recipient + message id or the exact Gmail failure reason. Decision logic extracted to `src/lib/delivery-rules.ts` with 13 regression tests in `src/lib/delivery-rules.test.ts`.
- [x] **Delivery observability** — every send attempt (task run, chat thread, adapter test) is recorded in `delivery_logs` via `src/lib/delivery-log.server.ts` and surfaced as a bilingual "Delivery log" panel on Adapters and per-task on Task detail (recipient, message id, failure code/reason).
- [x] **Local UI e2e smoke test** — `python3 e2e/ui-smoke.py` drives real Chromium over landing / ZH toggle / 375-414-768px widths / auth / dashboard route guard / public receipt verification / console errors (10/10 passing); see `e2e/README.md`.
- [x] **Webhook adapter live POST** — `src/lib/webhook.server.ts` performs a real HTTPS POST signed with `X-AiXin-Signature: t=<ts>,v1=<hmac_sha256(ts.body)>` (Stripe-style, verifiable by the receiver), plus `X-AiXin-Delivery` idempotency id, https-only enforcement, 1 attempt + 2 backoff retries (4xx except 429 are permanent). A LIVE webhook adapter receives every task outcome; the HTTP status, delivery id, signature and per-attempt log land in the task trace and in `outcome.artifact.webhook_delivery`, and every attempt is recorded in `delivery_logs`. "Send test" on the adapter card performs a real signed round-trip and flips the adapter to `error` on failure. Signing unit-tested in `src/lib/webhook.test.ts`.
- [x] **Telegram adapter promoted from demo bot to per-user adapter credential** — the Telegram adapter card now accepts the user's own `bot_token` + `chat_id` ("Use my own bot"); `resolveTelegramTarget()` prefers the workspace bot over the shared AiXin demo bot and sends directly to `api.telegram.org`. Every mirror/test send writes a `delivery_logs` receipt (channel `telegram`, own-bot vs shared-bot provider) and a task trace event, with a real "Send test" round-trip on the card.
- [x] **Drop WhatsApp / WeChat channel toggles** from Ask AiXin — the living-state channel row is now Telegram + in-app only (no unbacked provider UI).
- [x] **Adapter connectivity test** — a "Test connection" button per adapter that performs a real round-trip and stores `last_verified_at`; a stale/failed adapter blocks Live skills.
- [x] **Remove demo-only seed data from the live path** — `profiles.demo_workspace` (default **false**) gates every demo surface: `gatherRefundEvidence` is skipped for real accounts (no ORD-1001 evidence on Decision Cards or in task threads), `readSharedLedger` returns empty with `demo: false`, and `resetSharedLedger` refuses unless the flag is on. A "Demo workspace" switch on the Shared Ledger page turns it on explicitly; seeding the demo workspace sets it. A fresh testnet account starts completely empty.

**3.5.d — Production readiness**
- [x] **Security pass** — scan is clean apart from two intentional server-only findings (`chain_agents` and the `demo_*` fixtures are service-role only, `USING(false)` for clients). RLS is enabled with owner-scoped (`auth.uid() = user_id`) policies and explicit GRANTs on every app table (`tasks`, `task_events`, `task_messages`, `task_outcomes`, `receipts`, `decision_cards`, `ledger_preview`, `adapters`, `skills`, `skill_versions`, `skill_installs`, `skill_assignments`, `telegram_links`, `delivery_logs`, `reputation_entries`, `chat_messages`, `user_roles`, twins, `profiles`). Adapter credentials no longer leave the server: `listAdapters` strips every secret-shaped config key (token / secret / password / key / credential / refresh) and returns only `secret_keys` (which credentials are set), with the Adapters UI showing a "Saved — leave blank to keep" placeholder; blank re-submits keep the stored value.
- [ ] **Rate limiting + auth on `/api/public/*`** (OpenClaw MCP, Telegram webhook): verify Telegram secret token, cap MCP requests, and scope the MCP ledger to the demo workspace only.
- [ ] **Error budget & observability** — persist server-function failures, anchor failures and validator outages to a `system_events` table with an admin view; no more silent `console.error`.
- [ ] **Idempotency keys** on refund/execution writes so a double-approve cannot double-pay.
- [ ] **Auth hardening** — enable leaked-password protection, confirm no anonymous sign-ups, and either wire real Google OAuth or remove the dead WeChat sign-in button.
- [ ] **Terms / privacy / testnet disclaimer** page: "BSC Testnet only · no real funds · $AXN not minted".
- [x] **Full ZH i18n coverage** (pre-IDO blocker — shipped in Phase 3; re-verify before go-live).
- [x] **Mobile-first responsive pass** at 375/414/768px (pre-IDO blocker — shipped in Phase 3; asserted by `e2e/ui-smoke.py`).
- [ ] **End-to-end testnet acceptance run**: fresh account → onboard → connect a real adapter → install/author a skill → assign → delegate → Decision Card approve *and* reject → signed receipt (real signature) → 4 txs on BscScan → outcome delivered through a real channel. Record hashes in `TESTNET_RUN.md`.
- [ ] **Publish to `testnet.aixin.io`** (or the Lovable published URL) with a public status page listing contract addresses, validator pubkey and chain id.
- [ ] Cut `v0.1.0` tag on `aixin-twin` → first published GHCR image.

**Explicitly still simulated after Phase 3.5 (token-dependent, by design):**
- Earning pool, staking multiplier, access bonding, burn, payouts — all non-tradeable **Ledger Preview** entries.
- [ ] **Single simulation boundary** — one `LEDGER_PREVIEW` badge component used everywhere a token-dependent number is shown, so nothing else in the app is allowed to say "simulated".

## Phase 3.6 — Platform building blocks for apps built on AiXin (BangBang first)
> Goal: apps like **BangBang** (K–9 tutoring, China) are *built on* AiXin — their brains are
> Digital Twins + Skills and their plumbing is platform. Anything every China-facing app needs
> becomes a shared building block here; anything that is a product experience stays in the app.
> Design rule: **infrastructure is shared, experience is specific.** See `BANGBANG_ON_AIXIN.md`.

- [x] **Multi-tenancy** — `organizations` + `organization_members` with roles (owner / admin / teacher / parent / student), `has_org_role()` security-definer helpers and row-level isolation. BangBang's four roles are org roles, enforced in RLS rather than UI.
- [x] **Content-safety gate (platform)** — `src/lib/content-safety.server.ts`, modes `off` / `local` / `vendor`, **fail-closed**, on the output path of every generation. Audit trail stores SHA-256 hashes only, never content. The `local` baseline is for internal testing and is explicitly labelled non-compliant.
- [x] **Per-organisation approved model pinning** — filings name a specific model, so each tenant pins its approved model id; falls back to the env-driven self-hosted Qwen endpoint.
- [x] **Partner API** — `POST /api/public/v1/generate` and `POST /api/public/v1/safety-check`, org-scoped key auth (`X-AiXin-Key-Id` + bearer secret, SHA-256 stored). Non-streaming by design so output is screened before it leaves the server.
- [x] **WeChat channel adapter (platform, not BangBang-specific)** — WeChat joins Telegram / Gmail / Webhook in the adapter catalogue (`WeChat` / `channel`). Two surfaces: Mini Program **订阅消息** (`message/subscribe/send`, template-bound, fields truncated to WeChat's 20-char cap) and Official Account **客服消息** (`message/custom/send`, chunked at 1800 chars). Cached `access_token`; typed failure codes (`no_credentials` / `no_recipient` / `no_template` / `token_error` / `api_error` / `network_error`) recorded verbatim in `delivery_logs` — no simulated success. Inbound `GET|POST /api/public/wechat/webhook?app_id=…` verifies WeChat's sha1 signature *before* any database access, dedupes by `MsgId` (WeChat retries 3×), acknowledges inside WeChat's 5s window and pushes the governed reply out-of-band so latency never bypasses SIP. AppSecret + verify token never leave the server. Pure helpers unit-tested in `src/lib/wechat.test.ts` (6 tests); bilingual EN/ZH adapter card with a real "Send test" round-trip.
- [ ] **WeChat as a delivery target for task outcomes** — route approved Specialist Twin outcomes to WeChat the way Gmail and Webhook already are (Deliver-to picker, per-task delivery banner, receipt reference).
- [ ] **Mini Program / web client SDK** — typed client (`generate`, `safetyCheck`, task status, receipts) extracted **from** the working BangBang Mini Program rather than designed for a hypothetical second consumer. Deliberately sequenced after app #1 exists.
- [ ] **Per-org rate limits + quota accounting** on `/api/public/v1/*` so several apps can share one deployment fairly.
- [ ] **Org-scoped member invitations** — teacher / parent / student onboarding as a platform flow, no bespoke per-app code.
- [ ] **Queued model serving (vLLM) + published concurrency figure** — replaces the single-process Ollama demo host; the measured concurrent-session number, not a guess, sizes the GPU purchase.

**Stays app-specific (BangBang builds it, AiXin does not abstract it yet)**
- WeChat **Mini Program UI** and parent/teacher screens — the product experience.
- K–9 curriculum, syllabus mapping and pedagogical accuracy.
- Youth-Mode / anti-addiction enforcement (must live in the client shell).
- ICP / 备案 / 算法备案 / education licences — attach to the operating entity.

## Phase 3.7 — BangBang app build (app #1 on AiXin)
> Goal: move BangBang from the demo mockup to a real, installable trial version that students,
> parents, teachers and institution staff can actually use. Full specification —
> product, architecture, AI catalogue, compliance, test plan, costs — in `BANGBANG_APP_PRD.md`.
> Staged **P0 → P1 → P2** so a testable build exists in weeks, not quarters.

- [x] **PRD (architecture + design)** — `BANGBANG_APP_PRD.md`: four-role model and permission matrix, screen inventory, 14 AI modules staged P0/P1/P2 with quality bars, data model with RLS, request path through safety + SIP, one-core/two-shell client strategy, compliance envelope (青少年模式 / 防代写 / minors' data / filings), test plan mapped 1:1 onto BangBang's four testing phases, 28-week milestone plan and $315k–$675k cost range. Mirrored to both repos.
- [ ] **M0 Foundations** — org + roles + linking (class enrolment, verified guardianship), auth incl. role switching, shared H5 core skeleton, Mini Program + Capacitor shells building, storage buckets with org-scoped policies.
- [ ] **M1 P0 trial build** — photo problem recognition + error analysis, all-subject grading, math practice + PDF export, error notebook, AI chat, student profile v1, Youth Mode.
- [ ] **M2 Phase 1 hardening** — role-isolation test matrix green at the API level, device compatibility, performance budgets, bug closure to no fatal/major.
- [ ] **M3 P1 trial build** — composition generation/polishing, English oral dialogue (ASR + scoring), emotional analysis + parent monitoring, class analytics.
- [ ] **M4 Grayscale** — invite-only rollout to named users per role, structured feedback loop, analytics accuracy validation, compliance spot-checks.
- [ ] **M5 P2 build** — composition animated short video, 升学路径 pathway report (SIP-governed publication), institution guidance keywords, institution backend depth.
- [ ] **M6 Stress + regression + release lock** — concurrency targets (50 → 300 concurrent consultations, batch grading / composition / PDF), full-coverage regression, version freeze.
- [ ] **M7 Compliance documentation** — privacy policy, user agreement, minors' clause, permission-usage descriptions, AI content declaration, evidence pack for 备案.



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

**Agent framework hardening (borrowed from DeepSeek Harness — see [`AIXIN_DSH_INTEGRATION.md`](./AIXIN_DSH_INTEGRATION.md)):**
- [ ] **Dynamic per-agent tool registry** — replace the fixed Zod `tool()` literal in `src/routes/api/chat.ts` with a registry assembled per request from the caller's installed Skills + connected Adapters. Prerequisite for Skill-contributed tools.
- [ ] **SIP interceptor seam** — move SIP validation from inside individual tool bodies to a uniform pre-execute hook over the tool loop, so a new tool cannot structurally skip governance.
- [ ] **`session.event` → `task_events` mapping prototype** — field-level spike before any bridge work; unresolved today.
- [ ] **`dsh-bridge` service (opt-in, self-hosted only)** — thin HMAC-authenticated HTTP service on the GPU box that owns a `DeepSeekHarness` subprocess over stdio JSON-RPC; `POST /run` + SSE event mirror. Operator-installed Cordis profiles only — never wire-supplied plugin lists.
- [ ] **Adapter `provider=dsh`** — dsh as an execution runtime behind the existing adapter seam. SIP stays upstream; dsh approval policy = deny; `execution-capability.ts` still blocks when no dsh adapter is connected.
- [ ] **Specialist Twins as dsh sessions** — one session per Specialist, tool scope derived from assigned Skills, turning "assigned skills" from display metadata into enforced scope.
- [ ] **Log-derived prompt assembly** ("model-visible means logged") — prompts derived from the durable trace so traces are provably complete.
- [ ] Explicitly out of scope: rebuilding AiXin on dsh (edge Worker runtime cannot host it), and dsh on the BangBang trial critical path.

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
3. ~~**On-chain evidence panel**~~ — ✅ shipped (per-tx explainer + all four registry txs on Reputation + task receipt panel).
4. **Copy pass**: replace remaining simulation language with "reference simulation" labels where the backend isn't real yet (channel delivery to WhatsApp/WeChat, token payouts).
5. ~~**Full ZH i18n coverage**~~ — ✅ shipped (no English leaks when the toggle is 中文).
6. ~~**Mobile-first responsive pass**~~ — ✅ shipped (verified at 375/414/768px).
7. Record demo tx + earnings screenshots.
8. Cut `v0.1.0`, publish GHCR image.
9. Refresh investor deck + run-of-show.
