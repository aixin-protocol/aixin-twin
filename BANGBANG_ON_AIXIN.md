# BangBang **built on** AiXin — architecture, division of labour, and delivery path

Date: 2026-08-16 · Owner: AiXin team · Audience: BangBang stakeholders (business + technical)
Supersedes the earlier "BangBang calls AiXin" framing.

---

## 0. Read this first (one page, no jargon)

BangBang is a K–9 tutoring app for Chinese families with four kinds of user: **student, parent, teacher, admin**.
AiXin is the platform BangBang is **built on** — not a separate service it phones up.

Think of it like this:

| Analogy | Meaning for BangBang |
| --- | --- |
| AiXin is the **electrical grid and wiring** | AI models, safety screening, permissions, audit trail, message channels |
| BangBang is the **building** | The tutoring experience, the curriculum, the brand, the parents and schools |
| BangBang-specific rooms | Four-role UX, syllabus content, Mini Program screens |
| Shared wiring reused by every future building | Digital twins, skills, WeChat channel, content safety, receipts |

**What changed from our earlier note.** We previously described BangBang as an external app that *calls* AiXin over an
API. That understated AiXin. The tutoring brains — the tutor, the homework marker, the progress reporter — are
**AiXin Digital Twins and Skills**, configured rather than coded from scratch. What stays BangBang-specific is the
*product surface*: the screens a child and parent actually touch, and the curriculum inside them.

**The two decisions in this document.**

1. **The WeChat channel is a platform capability.** Built once in AiXin, usable by every app. *Shipped this iteration.*
2. **The Mini Program UI stays BangBang-specific.** We will not invent a generic "tutoring UI framework" before a
   second app exists to justify it. A reusable client SDK gets extracted *from* BangBang once it is real.

---

## 1. Honest division of labour

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  BANGBANG-SPECIFIC  (built for BangBang, owned by BangBang)                  │
│                                                                              │
│  WeChat Mini Program UI · parent/teacher web screens · K–9 curriculum content │
│  syllabus mapping · pricing & packaging · brand, copy, onboarding             │
│  Youth-Mode screen-time enforcement (must live in the client shell)           │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                │  configuration + platform APIs
┌───────────────────────────────▼──────────────────────────────────────────────┐
│  AiXIN PLATFORM  (built once, reused by every app on AiXin)                   │
│                                                                              │
│  Digital Twins        Master Twin + Specialist Twins (tutor, marker, reporter)│
│  Skills               versioned manifests, install consent, test/live modes   │
│  SIP governance       intent → deterministic validation → approval → receipt  │
│  Content safety       off / local baseline / licensed vendor, fail-closed     │
│  Multi-tenancy        organisations, roles, row-level isolation               │
│  Channel adapters     WeChat ✦ new, Telegram, Gmail, signed Webhook           │
│  Model layer          org-pinned approved model → self-hosted Qwen (in-country)│
│  Evidence             Ed25519 receipts, delivery logs, optional BSC anchor    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Who builds what, precisely

| Layer | Who owns it | Reusable by other apps? | Why that call |
| --- | --- | --- | --- |
| Tutor / marker / progress-report twins | AiXin (configured per app) | **Yes** — twin + skill pattern | These are prompts, skills and adapters, not bespoke code |
| Curriculum & syllabus knowledge base | BangBang | No | Domain content and pedagogical accuracy; liability sits with BangBang |
| Four-role permissions | AiXin (org roles + RLS) | **Yes** | Isolation must be enforced in the database, never in UI |
| WeChat delivery + inbound events | AiXin (**shipped**) | **Yes** | Every China-facing app needs it; one hardened path beats four |
| Mini Program screens | BangBang | Later, via SDK | UX is the product; abstracting too early produces a bad framework |
| Content-safety screening | AiXin (**shipped**) | **Yes** | It is an enforcement point, must be unavoidable and identical everywhere |
| Approved-model pinning | AiXin (**shipped**) | **Yes** | Filings name a specific model; the platform must pin it per tenant |
| ICP / 备案 / education licences | BangBang's operating entity | n/a | Legal, attaches to the entity operating the service |

---

## 2. Why WeChat is platform and the Mini Program UI is not

This is the central design decision, so here is the reasoning in full.

| Question | WeChat **channel** | Mini Program **UI** |
| --- | --- | --- |
| Does every China app need it? | Yes — WeChat is the delivery surface | No — each app's screens differ |
| Is the behaviour app-independent? | Yes: authenticate, send, verify, log, retry | No: layout, tone, pedagogy are the product |
| Cost of getting it wrong once | High: leaked AppSecret, unlogged sends, silent failures | Contained: a screen looks wrong |
| Does an abstraction exist to fit into? | Yes: AiXin's existing adapter contract | No: would have to be invented from zero |
| Verdict | **Build as platform now** | **Build for BangBang; extract an SDK from it later** |

The general rule we are applying: **make infrastructure shared, make experience specific.** Premature UI abstraction
is the most common way platforms acquire a framework nobody wants. Extracting an SDK from one working consumer is
cheaper and produces a better API than designing one for a hypothetical second consumer.

---

## 3. What shipped this iteration

### 3.1 WeChat channel adapter (platform)

WeChat now sits in the same adapter catalogue as Telegram, Gmail and Webhook — same connect/test/live flow, same
credential redaction, same delivery log, same "real or fail loudly" rule.

| Piece | Location | Notes |
| --- | --- | --- |
| Pure helpers (text chunking, template-field truncation, inbound XML, dedupe key) | `src/lib/wechat.ts` | No network, no secrets — unit-tested (`src/lib/wechat.test.ts`, 6 tests) |
| Send + token cache + signature verification | `src/lib/wechat.server.ts` | Server-only; cached `access_token`, typed failure codes |
| Inbound webhook | `src/routes/api/public/wechat/webhook.ts` | Verifies WeChat's sha1 signature before anything else |
| Adapter card + "Send test" | `/dashboard/adapters` (`WeChat` / `channel`) | Bilingual EN/ZH; AppSecret and verify token never returned to the browser |

**Two surfaces, one adapter:**

| Surface | WeChat API used | When BangBang uses it |
| --- | --- | --- |
| `miniprogram` | 订阅消息 `message/subscribe/send` | "Homework marked", "weekly report ready" — template-bound, user-consented |
| `official_account` | 客服消息 `message/custom/send` | Free-text replies inside the 48-hour service window |

**Message flow, outbound:**

```text
Specialist Twin produces an outcome
        │
        ▼
Content-safety gate ──── blocked ──► safe refusal + audited (hash only, never the text)
        │ passed
        ▼
WeChat adapter (org/user credentials, test|live)
        │
        ├─ Mini Program subscribe message  (template id, truncated fields)
        └─ Official Account text message   (chunked at 1800 chars)
        │
        ▼
delivery_logs row: channel=wechat, recipient=openid, msgid | errcode+errmsg
```

**Message flow, inbound:**

```text
WeChat server ──► GET  /api/public/wechat/webhook?app_id=…  → sha1 signature check → echostr
WeChat server ──► POST /api/public/wechat/webhook?app_id=…  → sha1 signature check
                                                             → parse XML, dedupe by MsgId
                                                             → log as inbound delivery
                                                             → immediate ack (< 5s)
                                                             → governed reply sent out-of-band
```

Design choices worth naming:

- **Signature first, parse second.** Nothing touches the database before WeChat's signature is verified against the
  verify token stored on the adapter row.
- **Idempotency by `MsgId`.** WeChat retries up to three times; a stable dedupe key stops triple-processing.
- **Fast ack, governed reply later.** WeChat demands a reply within 5 seconds — far too little time for
  validation → approval → receipt. So the webhook acknowledges immediately and the real answer is pushed back
  through the adapter after the SIP pipeline completes. Governance is never traded for latency.
- **No simulated success.** Every failure returns a typed code (`no_credentials`, `no_recipient`, `no_template`,
  `token_error`, `api_error`, `network_error`) which lands verbatim in the delivery log.

### 3.2 Already in place from the previous iteration

| Capability | Status |
| --- | --- |
| Organisations, roles (owner/admin/teacher/parent/student), row-level isolation | Shipped |
| Per-organisation approved model pinning | Shipped |
| Content-safety gate: off / local baseline / licensed vendor, **fail-closed** | Shipped |
| Safety audit trail storing SHA-256 hashes only, never content | Shipped |
| Partner API `POST /api/public/v1/generate` and `/safety-check` (non-streaming by design) | Shipped |
| SIP: validate → human approval → Ed25519 receipt → optional BSC anchor | Shipped |
| Self-hosted deployment (Docker Compose, GPU override, Alibaba Cloud ECS runbook) | Shipped |

---

## 4. How BangBang is assembled on AiXin

```text
Step 1  Create the BangBang organisation           → org roles map to student/parent/teacher/admin
Step 2  Pin the approved model                     → self-hosted Qwen, in-country, named in the filing
Step 3  Set content safety to vendor (or local)    → fail-closed; nothing reaches a child unscreened
Step 4  Configure Specialist Twins                 → 讲解 tutor · 作业批改 marker · 学情报告 reporter
Step 5  Install skills + curriculum knowledge      → BangBang content, AiXin skill mechanics
Step 6  Connect the WeChat adapter                 → Mini Program templates + Official Account
Step 7  Build the Mini Program UI (BangBang)       → calls the partner API with an org-scoped key
Step 8  Governance where stakes are high           → refunds, escalations, teacher overrides via SIP
```

Steps 1–6 are configuration on platform capabilities. Only step 7 — and the curriculum inside step 5 — is a
BangBang build. That is the substance of "built on AiXin".

---

## 5. Roadmap items added as platform work

| Item | What it is | Owner |
| --- | --- | --- |
| WeChat channel adapter | Shipped this iteration (above) | AiXin |
| WeChat as a first-class delivery target for twins | Route task outcomes to WeChat like Gmail/Telegram | AiXin |
| Mini Program / web client SDK | Typed client for the partner API: generate, safety-check, receipts, task status | AiXin |
| Per-org rate limits + quota accounting | Fair sharing across apps on one deployment | AiXin |
| Org-scoped member invitations | Teacher/parent/student onboarding without bespoke code | AiXin |
| Queued model serving (vLLM) + published concurrency figure | Replaces single-process Ollama | AiXin |

See `ROADMAP.md` → **Phase 3.6 — Platform building blocks for apps built on AiXin**.

---

## 6. What AiXin still does not give BangBang

1. **Filing-grade content safety by itself.** The gate is the enforcement point; the classifier must be a licensed
   domestic vendor (Aliyun 内容安全 / 绿网 or equivalent). The built-in "local baseline" mode is for internal testing
   and must never be presented as compliant.
2. **Compliance status.** ICP/备案, 算法备案, AI 内容安全备案 and minors'-data obligations attach to the entity
   operating the service. Hosting on AiXin's sandbox does not transfer them.
3. **Production capacity today.** The sandbox GPU box is a demo host: one Ollama process, no request queue, no HA.
   It is not sized for concurrent classroom traffic.
4. **The curriculum.** Pedagogical accuracy is BangBang's responsibility and its differentiator.

### Gap list before "production" is an honest claim

| # | Gap | Owner | Rough effort |
| --- | --- | --- | --- |
| 1 | Licensed content-safety vendor contract + proxy endpoint | BangBang (contract), AiXin (wiring) | 1–2 weeks after contract |
| 2 | Queued serving stack (vLLM) + published concurrency figure | AiXin | 2–3 weeks |
| 3 | Capacity sizing against real class-hour load, plus HA (2+ GPU hosts) | Joint | 2–4 weeks |
| 4 | Minors' data: retention policy, PII minimisation, guardian consent records | Joint (legal-led) | Legal-gated |
| 5 | ICP/备案 + 算法备案 + AI 内容安全备案 under the operating entity | BangBang | 6–12 weeks, external |
| 6 | Partner API hardening: per-org rate limits, quota accounting, request signing | AiXin | 1–2 weeks |
| 7 | Mini Program client SDK extracted from the BangBang build | AiXin | 1–2 weeks after step 7 above |
| 8 | Org-scoped member invitation UX | AiXin | 1–2 weeks |

---

## 7. Calling AiXin from the BangBang Mini Program

Mint a key in **Dashboard → Organisation → Partner API keys** (shown once).

```bash
curl -X POST https://<aixin-host>/api/public/v1/generate \
  -H "X-AiXin-Key-Id: ax_xxxxxxxx" \
  -H "Authorization: Bearer axs_xxxxxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"用小学四年级能懂的话解释分数加法","purpose":"tutor_explain","locale":"zh"}'
```

- `200 { text, model, safety }` — screened output, safe to show a student.
- `422 { error: "content_safety_blocked", safety }` — nothing generated is returned; the block is audited.
- `POST /api/public/v1/safety-check` screens text BangBang produced itself (student answers, chat, captions).

Both endpoints are **non-streaming on purpose**: output is screened before it leaves the server. The AiXin dashboard
chat streams and is therefore screened after the fact — do not use it as the compliance path.

---

## 8. Recommendation

- **Phase 1 (now):** BangBang internal pilot on the AiXin sandbox — safety mode `local`, small cohort, no real
  minors' PII. Proves the twin + skill + WeChat path and produces audit evidence for the filings.
- **Phase 2:** switch safety to `vendor` with the licensed classifier, move serving to vLLM, re-test, extract the
  Mini Program client SDK from the working BangBang build.
- **Phase 3 (production):** deploy the same AiXin stack into the entity that will hold the filings — BangBang's own
  China cloud account, or a clearly contracted AiXin-operated environment with sized HA GPUs.

Anything claiming full compliance before items 1, 4 and 5 in section 6 are closed would be inaccurate, and we will
not present it that way.
