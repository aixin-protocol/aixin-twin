# BangBang on AiXin — honest assessment and delivery path

Date: 2026-08-16 · Owner: AiXin team · Audience: BangBang stakeholders (business + technical)

---

## 1. The one-paragraph answer

BangBang **can** run its AI and responsible-AI layer on AiXin infrastructure — self-hosted GPU, local Qwen, no
foreign AI gateway, every AI output screened, audited, and (optionally) cryptographically signed and anchored.
BangBang **cannot** simply "become an app inside AiXin": the four-role K–9 tutoring product, curriculum content,
WeChat Mini Program and mobile shells are BangBang's product surface and must be built as BangBang's app. The
realistic split is: **BangBang builds the product, AiXin is the governed AI backend it calls.**

---

## 2. What AiXin genuinely provides today

| Capability | Status | Notes |
| --- | --- | --- |
| Local model inference (Qwen via Ollama / any OpenAI-compatible endpoint) | Shipped | `AIXIN_LLM_BASE_URL` / `AIXIN_LLM_API_KEY` / `AIXIN_LLM_MODEL`; no foreign gateway in the request path |
| Per-organisation approved model pinning | Shipped this iteration | Organisation → Approved model |
| Content-safety gate on every AI output | Shipped this iteration | Modes: off / local baseline / licensed vendor; **fail-closed** |
| Content-safety audit trail (hash-only, no content stored) | Shipped this iteration | Organisation → Content-safety audit trail |
| Multi-tenant isolation (organisations, roles, row-level security) | Shipped this iteration | Roles: owner, admin, teacher, parent, student |
| Partner API for an external app | Shipped this iteration | `POST /api/public/v1/generate`, `POST /api/public/v1/safety-check` |
| Human-approval pipeline (SIP: validate → approve → signed receipt) | Shipped earlier | Decision Cards, Ed25519 receipts, optional BSC anchoring |
| Delivery adapters + delivery logs (email, webhook, Telegram) | Shipped earlier | Every send/failure is logged |
| Self-hosted deployment (Docker Compose, GPU override, Alibaba Cloud ECS runbook) | Shipped earlier | `SELF_HOSTING.md`, `DEPLOY_RUNBOOK.md` |

## 3. What AiXin does **not** provide (be clear with stakeholders)

1. **The BangBang product.** Four-role tutoring UX, curriculum knowledge base, homework capture, offline sync,
   WeChat Mini Program, Capacitor/native shell — none of this exists in AiXin and is not on its roadmap.
2. **Filing-grade content safety by itself.** AiXin's SIP validates *intent shape*; the new safety gate is the
   *enforcement point*, but the classifier must be a licensed domestic vendor (Aliyun 内容安全 / 绿网 or equivalent).
   The built-in "local baseline" mode is for internal testing only and must not be presented as compliant.
3. **Compliance status.** ICP/备案, 算法备案, AI 内容安全备案, and minors'-data obligations attach to the entity
   operating the service. Hosting on AiXin's sandbox does not transfer or satisfy them.
4. **Production capacity today.** The current sandbox GPU box is a demo host: single Ollama process, no request
   queue, no HA, no autoscaling. It is not sized for concurrent classroom traffic.

## 4. Recommended shape

```text
   BangBang app (PWA / Mini Program / native shell)
   product UX, curriculum, accounts, payments
                    │  HTTPS, org-scoped API key
                    ▼
   AiXin governed AI backend  (self-hosted, in-country)
   ├─ approved model pinning ──► local Qwen (vLLM/Ollama on GPU)
   ├─ content-safety gate ─────► licensed vendor endpoint (fail-closed)
   ├─ audit trail (hash-only) + delivery logs
   └─ optional SIP: human approval + signed receipt + on-chain anchor
```

Sandbox as the **production home** is workable only after section 6 is done, and only if BangBang accepts that the
operating entity for the service is the one carrying the compliance and liability obligations.

## 5. How BangBang calls AiXin

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
- `POST /api/public/v1/safety-check` screens text BangBang produced itself (student answers, tutor chat, captions).

Both endpoints are **non-streaming on purpose**: the output is screened before it leaves the server. The AiXin
dashboard chat streams and is therefore screened after the fact — do not use it as the compliance path.

## 6. Gap list before "production home" is an honest claim

| # | Gap | Owner | Rough effort |
| --- | --- | --- | --- |
| 1 | Licensed content-safety vendor contract + proxy endpoint | BangBang (contract), AiXin (wiring) | 1–2 weeks after contract |
| 2 | Replace Ollama with a queued serving stack (vLLM) and publish a concurrency figure | AiXin | 2–3 weeks |
| 3 | Capacity sizing against real class-hour load, plus HA (2+ GPU hosts, health-checked) | Joint | 2–4 weeks |
| 4 | Minors' data handling: retention policy, PII minimisation, guardian consent records | Joint (legal-led) | Legal-gated |
| 5 | ICP/备案 + 算法备案 + AI 内容安全备案 under the operating entity | BangBang | 2–12 weeks, external |
| 6 | Tenant API hardening: per-org rate limits, quota accounting, request signing | AiXin | 1‏2 weeks |
| 7 | Org-scoped member invitation UX (teacher/parent/student onboarding) | AiXin | 1–2 weeks |

## 7. Recommendation

- **Phase 1 (now):** run BangBang's internal pilot against the AiXin sandbox, safety mode `local`, small cohort,
  no real minors' PII. Proves the integration and produces audit evidence for the filings.
- **Phase 2:** switch safety mode to `vendor` with the licensed classifier, move serving to vLLM, and re-test.
- **Phase 3 (production):** deploy the same AiXin stack into the entity that will hold the filings — either
  BangBang's own China cloud account or a clearly contracted AiXin-operated environment with sized HA GPUs.

Anything the&lt;qt;claims full compliance before items 1, 4 and 5 above are closed would be inaccurate, and we will
not present it that way.
