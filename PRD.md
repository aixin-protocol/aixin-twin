# AiXin Twin — Reference Implementation PRD

> Product Requirements Document for `aixin-protocol/aixin-twin` — the
> reference web application that demonstrates the AiXin Protocol end-to-end.
>
> Status: **v2.0** · Last updated: **2026-08-29**
>
> **Truth labels** used throughout: 🟢 Live · 🟡 Sandbox / Preview · 🔵 Planned.
> Nothing is described as shipped before it is. Companion documents:
> [`ROADMAP.md`](./ROADMAP.md) (canonical task list, single source of truth),
> [`AIXIN_PLAN_2026H2.md`](./AIXIN_PLAN_2026H2.md) (Aug–Dec 2026 budget and gates),
> [`AIXIN_EDUCATION.md`](./AIXIN_EDUCATION.md) (curriculum).
>
> v2.0 supersedes v1.0 (2026-07-25). Major corrections: the default post-login
> surface is the intent-first **Ask AiXin** home (not the Command Center);
> signing and execution happen **in-app** (the validator sidecar is an optional
> protocol component, not the primary path); real channel adapters (Telegram,
> WeChat, Gmail, signed webhooks) are live; the skill lifecycle, Decision Card
> evidence flow, delivery observability, and the AiXin Academy are documented
> for the first time.

---

## 1. Vision

AiXin is the **trust layer for agentic AI**. `aixin-twin` is the canonical,
self-hostable reference implementation: a bilingual (EN + zh-CN) web app where
a user hatches one **Master Twin** that orchestrates a team of **Specialist
Twins**, each equipped with governed **Skills**. Every consequential action
runs through the **Signal Intent Protocol (SIP)** and produces a signed
receipt, anchored to BSC Testnet when chain credentials are configured.

The reference app exists to:

1. Prove the protocol is implementable by a single team in a normal web stack.
2. Give integrators a working template to fork or study.
3. Anchor investor / user demos in something you can run today.

## 2. Relationship to the protocol

| Concern | Owned by | Package / module |
| --- | --- | --- |
| Wire formats, canonicalization, signing primitives | Protocol repo | `@aixin-protocol/sdk-js`, `aixin-protocol-sdk` |
| Standalone validation + receipt signing service | Protocol repo | `@aixin-protocol/validator-server` (optional sidecar) |
| CLI (scaffold, validate, sign) | Protocol repo | `@aixin-protocol/cli` |
| Reverse manifest ingestion | Protocol repo | `@aixin-protocol/adapter` |
| Product UX, auth, storage, orchestration, in-app SIP pipeline, receipt signing, adapter execution | **This repo** | `aixin-twin` |
| BSC Testnet audit-anchor contract | Protocol repo | `contracts/ERC8004.sol`, `AuditAnchor.sol` |

**Rule of thumb**: wire-level rules and signing primitives live in the
protocol; screen behavior and business orchestration live here. The app does
not depend on the validator sidecar to function — `src/lib/sip.server.ts`
(validation) and `src/lib/receipt-signer.server.ts` (Ed25519 signing) run
in-app, and the sidecar can be wired in via `AIXIN_VALIDATOR_URL` for
deployments that want a separate attestation service.

## 3. Personas

- **Founder / Solo Operator (OPC)** — hatches a Master Twin to run a vertical;
  delegates recurring work (briefings, customer replies, invoices).
- **China SMB operator** — same engine, Chinese-first UI, WeChat delivery.
- **BangBang education roles** — student, parent, teacher; served by the Tutor
  bundle through the tenant API and WeChat (sandbox trial).
- **Web3 desk / DAO treasurer** — portfolio briefings, on-chain monitors,
  treasury reports.
- **Integrator / Developer** — forks `aixin-twin` or consumes the protocol
  packages directly.
- **Community leader / investor** — evaluates the trust surface: receipts,
  reputation, Trust Graph, Academy.

## 4. Scope

### 4.1 Shipped (🟢 Live)

**Entry & home**
- Bilingual marketing landing, auth (email + password recovery), 3-step
  onboarding that hatches the Master Twin.
- **Ask AiXin** (`/dashboard/ask`) — the default post-login surface: a single
  intent prompt with Trust Theatre (compliance badges), plan preview, and
  live task events via realtime.
- **Chat** (`/dashboard/chat`) — ChatGPT-style conversation with the Master
  Twin, including governed delegation (skills can never bypass SIP).

**Twins, skills, tasks**
- Command Center (`/dashboard`) — master twin, specialist team, running-tasks
  ticker, live delegation feed.
- Specialist Twins: list, drill-down, skill assignments, signed action log,
  ERC-8004 identity registration.
- Skills: marketplace with **lifecycle** (public/private visibility,
  free/paid pricing metadata, dev/live status, versioning via
  `skill_versions`), per-skill detail pages, SKILL.md manifests, install
  consent, and the 5-canvas **SkillCraft** builder.
- Tasks: list + detail with **chat threads** (`task_messages`), outcomes
  (`task_outcomes`), and event timeline (`task_events`).

**Governance & receipts**
- SIP pipeline (see §5.2). Decision Cards for medium/high-risk intents with
  an **evidence panel** (real ledger/order data), override-rationale capture
  when approving against a recommendation, and **signed rejections** recorded
  as audit events — approval and rejection are symmetric.
- Receipts: Ed25519-signed in-app; public verification at `/verify/$sipId`
  and `/api/public/verify/$sipId`.
- BSC Testnet anchoring with tx links to BscScan, anchor **retry queue**
  (`/api/public/anchor.retry`), gas/chain-health monitoring, and a
  chain-health banner.
- Fail-secure execution: a skill without a live adapter path halts as
  `blocked / no_live_adapter`; output is labelled "draft — not executed"
  (`src/lib/execution-capability.ts`). No silent fallbacks in the receipt path.

**Adapters & delivery (🟢 tested)**
- **Telegram** — bot integration (@aixinchrisbot), account linking, status
  conversations, delivery.
- **Gmail** — OAuth connection, real email delivery (e.g. Financial Predictor
  reports).
- **WeChat** — channel adapter + public webhook (`/api/public/wechat/webhook`).
- **Signed webhooks** — HMAC-SHA256 outbound delivery.
- **BSC** — chain reads/anchor. **CoinGecko** — market data for finance skills.
- **Delivery observability** — `delivery_logs` table + UI banners/cards
  showing attempted/succeeded/failed delivery per task.

**Economy & reputation**
- Reputation page: ERC-8004 cards, earn/burn breakdowns, BscScan-linked
  signature status.
- **Ledger Preview** (🟡 simulated balances; clearly labelled; retired at
  Gate 5 when the real $AXN ledger lands).
- Shared demo ledger (`/dashboard/ledger`) backing the governed-vs-ungoverned
  refund demo against the `aixin-baseline-agent` (OpenClaw comparison).

**Platform & operations**
- Organizations (multi-member orgs, roles, org API keys).
- Run budgets (`run_budgets`, `run_usage`) and prompt traces (`prompt_traces`)
  — W2/W4 of the DSH-alignment workstreams.
- Tool registry (`src/lib/tool-registry.ts`) — W1.
- **AiXin Academy** (`/learn`) — 14 modules across Foundation / Builder /
  Community / Monetisation tracks, quizzes, certification workflow, ROI
  calculator, Twin templates, glossary.
- Public APIs: `/api/public/v1/generate`, `/api/public/v1/safety-check`,
  OpenClaw MCP bridge (`/api/public/openclaw/mcp`), API keys endpoint.
- Self-hosting: Dockerfile, docker compose, Caddy, RunPod/Aliyun/Ubuntu/
  Windows runbooks (`SELF_HOSTING.md`, `DEPLOY_RUNBOOK.md`).
- Bilingual EN/zh-CN across every page; mobile-first responsive layout.

### 4.2 Sandbox / Preview (🟡)

| Feature | State |
| --- | --- |
| Ledger Preview | Simulated balances, clearly labelled; retired post-TGE |
| BangBang education trial | P0 scope frozen for the mid-September sandbox trial (`BANGBANG_TRIAL_REPLY.md`); tenant API + WeChat path |
| W6 deterministic replay | Planned only — must never be demoed as working until it is |

### 4.3 Planned (🔵 — not shipped, do not present as live)

| Feature | Gate (per `AIXIN_PLAN_2026H2.md`) |
| --- | --- |
| Trust Graph indexer + read API (`api.aixin.io/graph`) + explorer | G2 · Oct 2026 |
| AIP-3 (anchoring fee / validator staking), AIP-4 (verified sources), AIP-5 (graph queries) | G2 · Oct 2026 |
| Marketplace commerce (checkout, entitlements, publisher payouts) + metered billing | G3 · Nov 2026 |
| Remaining priority skills (12 total) + 6 Specialist Twin bundles | G1–G3 · Sep–Nov 2026 |
| $AXN token contract, ledger migration, IDO/TGE, mainnet bundle | G4 · Dec 2026 (post-audit) |
| W3 `dsh-bridge` self-hosted runtime | Optional, not on critical path |

### 4.4 Out of scope

- Real token minting / trading before the audited TGE.
- Mobile-native apps (responsive web + WeChat Mini Program path instead).
- Non-EVM anchor chains.

## 5. Architecture

```text
+--------------------------------------------------------------+
|  aixin-twin (this repo)                                      |
|  TanStack Start + Vite · React 19 · Tailwind v4 · shadcn/ui  |
|                                                              |
|  Routes: / /auth /onboarding /dashboard/* /learn/* /verify/* |
|  Server: createServerFn RPC + /api/public/* server routes    |
|                                                              |
|  sip.server.ts (validate)  receipt-signer.server.ts (Ed25519)|
|  execution.server.ts ──────┬── adapters: gmail / telegram /  |
|  delegation.server.ts      │   wechat / webhook / bsc / cg   |
|  tool-registry / run-budget│                                 |
+----------------------------┼---------------------------------+
|  Lovable Cloud (Supabase): Postgres + RLS + Auth + Realtime  |
+----------------------------┼---------------------------------+
                             │ optional
              +--------------▼--------------+      +-----------+
              | @aixin-protocol/validator-  |      | BSC       |
              | server sidecar              +----->| Testnet   |
              | (AIXIN_VALIDATOR_URL)       |      | anchor    |
              +-----------------------------+      +-----------+
```

### 5.1 Runtime

- **Frontend**: React 19 + TanStack Router (file-based routes) + Tailwind v4
  + shadcn/ui; bilingual via `src/lib/i18n*.ts`.
- **Server**: TanStack Start server functions on a Cloudflare
  Workers-compatible runtime (`nodejs_compat`); public webhooks/APIs under
  `src/routes/api/`.
- **Auth + Data**: Lovable Cloud (Supabase): Postgres with RLS on every table,
  Auth, Realtime for task events/chat.
- **LLM**: Lovable AI Gateway by default; self-hosted Qwen supported via env
  (`src/lib/ai-gateway.server.ts`).

### 5.2 SIP pipeline (5 steps)

1. **Intent draft** — LLM turns natural language into a candidate SIP intent
   (slot extraction with realistic intent capture).
2. **Schema check** — validated against the AIP-1 schema.
3. **Policy check** — deterministic rules in `src/lib/sip.server.ts` (risk
   tier, amounts, skill scopes, run budgets).
4. **Human gate** — medium/high-risk intents produce a **Decision Card** with
   an evidence panel; approval-against-recommendation requires an override
   rationale; rejections are signed too.
5. **Execute + Receipt** — the action runs through a live adapter (or halts
   `blocked`); the receipt is Ed25519-signed, persisted, and anchored to BSC
   Testnet with a retry queue on failure.

## 6. Key user flows

### 6.1 Hatch + onboard
Sign up → 3-step onboarding → Master Twin hatched → land on **Ask AiXin**
with an empty team.

### 6.2 Install → Assign → Delegate → Decide → Receipt → Verify
1. Open **Skills / Marketplace**, inspect a skill (manifest, adapters,
   permissions) and install with explicit consent.
2. Assign the skill to a Specialist Twin; connect the adapters it names.
3. From **Ask AiXin** or **Chat**, delegate in natural language.
4. SIP validates; medium/high risk produces a Decision Card with evidence;
   approve (with rationale if overriding) or reject (signed either way).
5. Execution runs through the live adapter; delivery is logged; the signed
   receipt appears in Reputation/Governance with a BscScan link.
6. Anyone can verify the receipt publicly at `/verify/$sipId`.

### 6.3 Channel conversations
Link Telegram (or WeChat) → ask the Master Twin for task status → receive
outcomes and delivery confirmations in the channel; threads are persisted in
`task_messages`.

### 6.4 Academy certification
Learn track → module lessons + quizzes → certification workflow → shareable
record; ROI calculator and Twin templates support the monetisation track.

### 6.5 Reputation
Every signed action moves the specialist's ERC-8004 reputation card; failures
and vetoes are recorded with reasons — reputation is earned, not asserted.

## 7. Data model (Supabase, high-level)

Core: `master_twins`, `specialist_twins`, `skills`, `skill_versions`,
`skill_installs`, `skill_assignments`, `adapters`.
Governance: `tasks`, `task_events`, `task_messages`, `task_outcomes`,
`decision_cards`, `receipts`, `delivery_logs`, `prompt_traces`,
`content_safety_events`.
Economy: `reputation_entries`, `ledger_preview`, `run_budgets`, `run_usage`.
Platform: `profiles`, `user_roles`, `organizations`, `organization_members`,
`org_api_keys`, `telegram_links`, `chain_agents`.
Demo: `demo_customers`, `demo_orders`, `demo_refunds`, `demo_agent_actions`,
`demo_api_keys`.

All user-facing tables have RLS enabled and `GRANT`s scoped to
`authenticated` (plus `service_role` where server code needs it).

## 8. Non-functional requirements

- **Fail-secure**: validator, adapter, or anchor failure blocks execution
  rather than silently proceeding; the failure itself is recorded.
- **Truth-labelling**: test-mode banner whenever the ledger is in preview or
  anchor is simulated; docs use 🟢/🟡/🔵 and never describe planned work as
  shipped.
- **Bilingual**: every user-facing string exists in `en` and `zh-CN`.
- **Mobile-first**: every page renders correctly at phone widths; both are
  pre-IDO quality gates verified before any release or demo.
- **Self-hostable**: `docker compose up` (app + Postgres; validator sidecar
  optional); China-friendly runbooks for Aliyun/RunPod and local
  Ubuntu/Windows 11.
- **Deterministic core**: SIP validation and receipt canonicalization are
  byte-identical to the JS/Python SDK reference outputs.
- **A11y**: shadcn primitives, keyboard-navigable Decision Cards.

## 9. Success metrics

- Time-to-first-signed-receipt on a fresh account: **< 10 minutes**.
- 100% of consequential actions produce a signed receipt (measurable in
  `receipts` / `tasks`).
- 100% of adapter deliveries produce a `delivery_logs` row (success or
  failure) — observability, not silent drops.
- Reference use cases (SMB briefing, customer reply, finance report) each
  assembled from an empty account via Install → Assign → Delegate → Decide →
  Receipt.

## 10. Milestones

Superseded by the five-gate Aug–Dec 2026 plan in
[`AIXIN_PLAN_2026H2.md`](./AIXIN_PLAN_2026H2.md):

| Gate | Month | Theme |
| --- | --- | --- |
| G1 | Sep 2026 | Testnet complete + BangBang sandbox trial + first 8 skills |
| G2 | Oct 2026 | Trust Graph + contract audit engaged + **IDO go/no-go** |
| G3 | Nov 2026 | Marketplace commerce + 12 skills + 6 bundles |
| G4 | Dec 2026 | $AXN IDO / TGE (post-audit) |
| G5 | Dec 2026 | Post-launch ops; Ledger Preview retired |

The task-level truth remains [`ROADMAP.md`](./ROADMAP.md).

## 11. References

- Protocol repo: <https://github.com/aixin-protocol/aixin-protocol>
- Reference app repo: <https://github.com/aixin-protocol/aixin-twin>
- Spec site: <https://aixin-protocol.github.io/aixin-protocol/>
  (custom domain `spec.aixin.io` deferred)
- Live app: <https://aixin-sandbox.lovable.app>

---

# 中文版

# AiXin Twin —— 参考实现产品需求文档

> `aixin-protocol/aixin-twin` 的产品需求文档 —— 端到端演示 AiXin 协议的参考 Web 应用。
>
> 版本:**v2.0** · 更新日期:**2026-08-29**
>
> 真实标签:🟢 已上线 · 🟡 沙盒 / 预览 · 🔵 规划中。任何功能在真正交付前都不会被描述为已上线。
> 配套文档:[`ROADMAP.md`](./ROADMAP.md)(权威任务清单)、
> [`AIXIN_PLAN_2026H2.md`](./AIXIN_PLAN_2026H2.md)(2026 年 8–12 月预算与关口)、
> [`AIXIN_EDUCATION.md`](./AIXIN_EDUCATION.md)(课程体系)。
>
> v2.0 取代 v1.0(2026-07-25)。主要更正:登录后的默认页面是以意图为先的
> **Ask AiXin** 首页(而非指挥中心);签名与执行在**应用内**完成(验证器 sidecar
> 是可选的协议组件,而非主路径);真实渠道外部工具连接(Telegram、微信、Gmail、
> 签名 Webhook)已上线;首次记录技能生命周期、决策卡证据流程、投递可观测性与
> AiXin 学院。

## 1. 愿景

AiXin 是**智能体 AI 的信任层**。`aixin-twin` 是可自托管的规范参考实现:一个中英双语
Web 应用,用户在其中孵化一个**主孪生**,指挥一支**专家孪生**团队,每个专家孪生
配备受治理的**技能**。每一个有后果的动作都经过**信号意图协议(SIP)**,并产出
已签名回执;配置链上凭证后回执会锚定到 BSC 测试网。

## 2. 与协议的关系

| 关注点 | 归属 | 包 / 模块 |
| --- | --- | --- |
| 线路格式、规范化、签名原语 | 协议仓库 | `@aixin-protocol/sdk-js`、`aixin-protocol-sdk` |
| 独立校验 + 回执签名服务 | 协议仓库 | `@aixin-protocol/validator-server`(可选 sidecar) |
| CLI(脚手架、校验、签名) | 协议仓库 | `@aixin-protocol/cli` |
| 逆向清单接入 | 协议仓库 | `@aixin-protocol/adapter` |
| 产品 UX、认证、存储、编排、应用内 SIP 管线、回执签名、外部工具执行 | **本仓库** | `aixin-twin` |
| BSC 测试网审计锚定合约 | 协议仓库 | `contracts/ERC8004.sol`、`AuditAnchor.sol` |

应用不依赖验证器 sidecar 即可运行 —— `src/lib/sip.server.ts`(校验)与
`src/lib/receipt-signer.server.ts`(Ed25519 签名)均在应用内执行;需要独立
证明服务的部署可通过 `AIXIN_VALIDATOR_URL` 接入 sidecar。

## 3. 用户角色

- **创始人 / 一人公司(OPC)** —— 孵化主孪生运营一个垂直业务,委派周期性工作
  (简报、客户回复、发票)。
- **中国中小企业运营者** —— 同一引擎,中文优先界面,微信投递。
- **BangBang 教育角色** —— 学生、家长、教师;通过租户 API 与微信由辅导组合服务
  (沙盒试点)。
- **Web3 团队 / DAO 财务** —— 投资组合简报、链上监控、金库报告。
- **集成商 / 开发者** —— Fork `aixin-twin` 或直接使用协议包。
- **社区领袖 / 投资者** —— 审视信任面:回执、声誉、信任图谱、学院。

## 4. 范围

### 4.1 已交付(🟢 已上线)

**入口与首页**
- 双语营销落地页、认证(邮箱 + 密码找回)、三步 onboarding 孵化主孪生。
- **Ask AiXin**(`/dashboard/ask`)—— 登录后的默认页面:单一意图输入框,
  带信任剧场(合规徽章)、计划预览,以及基于 Realtime 的实时任务事件。
- **聊天**(`/dashboard/chat`)—— 与主孪生的 ChatGPT 式对话,包含受治理委派
  (技能永远无法绕过 SIP)。

**孪生、技能、任务**
- 指挥中心(`/dashboard`)—— 主孪生、专家团队、运行中任务滚动条、实时委派流。
- 专家孪生:列表、详情、技能指派、已签名动作日志、ERC-8004 身份注册。
- 技能:市场与完整**生命周期**(公开/私有可见性、免费/付费定价、开发/上线状态、
  基于 `skill_versions` 的版本管理)、技能详情页、SKILL.md 清单、安装授权,
  以及 5 步 **SkillCraft** 构建器。
- 任务:列表 + 详情,含**对话线程**(`task_messages`)、结果(`task_outcomes`)
  与事件时间线(`task_events`)。

**治理与回执**
- SIP 管线(见 §5.2)。中/高风险意图产生**决策卡**,带**证据面板**
  (真实账本/订单数据);违背建议批准时要求填写推翻理由;**拒绝同样被签名**
  记录为审计事件 —— 批准与拒绝是对称的。
- 回执:应用内 Ed25519 签名;`/verify/$sipId` 与 `/api/public/verify/$sipId`
  提供公开验证。
- BSC 测试网锚定,附 BscScan 交易链接、锚定**重试队列**
  (`/api/public/anchor.retry`)、Gas/链健康监控与链健康横幅。
- 失败即安全:没有可用外部工具连接的技能以 `blocked / no_live_adapter` 中止;
  产出标记为「草稿 —— 未执行」。回执路径中不存在静默降级。

**外部工具连接与投递(🟢 已测试)**
- **Telegram** —— 机器人集成(@aixinchrisbot)、账号绑定、状态对话与投递。
- **Gmail** —— OAuth 连接、真实邮件投递(如金融预测报告)。
- **微信** —— 渠道外部工具连接 + 公开 Webhook(`/api/public/wechat/webhook`)。
- **签名 Webhook** —— HMAC-SHA256 出站投递。
- **BSC** —— 链上读取/锚定。**CoinGecko** —— 金融技能的市场数据。
- **投递可观测性** —— `delivery_logs` 表 + UI 横幅/卡片,按任务展示
  已尝试/成功/失败的投递状态。

**经济与声誉**
- 声誉页:ERC-8004 卡片、收益/销毁明细、带 BscScan 链接的签名状态。
- **账本预览**(🟡 模拟余额,明确标注;Gate 5 真实 $AXN 账本上线后退役)。
- 共享演示账本(`/dashboard/ledger`),支撑与 `aixin-baseline-agent`
  (OpenClaw 对照)的受治理 vs 无治理退款演示。

**平台与运维**
- 组织(多成员组织、角色、组织 API 密钥)。
- 运行预算(`run_budgets`、`run_usage`)与提示追踪(`prompt_traces`)。
- 工具注册表(`src/lib/tool-registry.ts`)。
- **AiXin 学院**(`/learn`)—— 基础 / 构建者 / 社区 / 变现四个方向共 14 个模块,
  含测验、认证流程、ROI 计算器、孪生模板与术语表。
- 公开 API:`/api/public/v1/generate`、`/api/public/v1/safety-check`、
  OpenClaw MCP 桥接、API 密钥端点。
- 自托管:Dockerfile、docker compose、Caddy,以及 RunPod/阿里云/Ubuntu/Windows
  运行手册(`SELF_HOSTING.md`、`DEPLOY_RUNBOOK.md`)。
- 全站中英双语;移动端优先的响应式布局。

### 4.2 沙盒 / 预览(🟡)

| 功能 | 状态 |
| --- | --- |
| 账本预览 | 模拟余额,明确标注;TGE 后退役 |
| BangBang 教育试点 | P0 范围已冻结,目标 9 月中旬沙盒试点;租户 API + 微信路径 |
| W6 确定性回放 | 仅规划中 —— 真正可用前绝不可作为演示 |

### 4.3 规划中(🔵 未交付,不得宣称为已上线)

| 功能 | 关口 |
| --- | --- |
| 信任图谱索引器 + 只读 API + 浏览器 | G2 · 2026-10 |
| AIP-3 / AIP-4 / AIP-5 | G2 · 2026-10 |
| 市场交易(结算、权益、创作者分成)+ 按用量计费 | G3 · 2026-11 |
| 其余优先技能(共 12 个)+ 6 个专家孪生组合 | G1–G3 · 2026-09 至 11 |
| $AXN 代币合约、账本迁移、IDO/TGE、主网合约包 | G4 · 2026-12(审计后) |
| W3 `dsh-bridge` 自托管运行时 | 可选,不在关键路径上 |

### 4.4 明确不做

- 审计后 TGE 之前的真实代币铸造 / 交易。
- 原生移动应用(以响应式 Web + 微信小程序路径替代)。
- 非 EVM 锚定链。

## 5. 架构

见英文版 §5 架构图。要点:

- **前端**:React 19 + TanStack Router(文件式路由)+ Tailwind v4 + shadcn/ui。
- **服务端**:TanStack Start 服务端函数,运行于 Cloudflare Workers 兼容运行时;
  公开 Webhook/API 位于 `src/routes/api/`。
- **认证与数据**:Lovable Cloud(Supabase):Postgres 全表 RLS、Auth、Realtime。
- **LLM**:默认 Lovable AI Gateway;可通过环境变量切换为自托管 Qwen。

### 5.2 SIP 管线(五步)

1. **意图起草** —— LLM 将自然语言转为候选 SIP 意图(带真实感槽位抽取)。
2. **模式校验** —— 按 AIP-1 模式校验。
3. **策略校验** —— `src/lib/sip.server.ts` 中的确定性规则(风险等级、金额、
   技能范围、运行预算)。
4. **人工关卡** —— 中/高风险意图产生带证据面板的**决策卡**;违背建议批准需
   填写理由;拒绝同样签名。
5. **执行 + 回执** —— 动作通过真实外部工具连接执行(否则以 `blocked` 中止);
   回执经 Ed25519 签名、持久化,并锚定 BSC 测试网(失败进入重试队列)。

## 6. 关键用户流程

### 6.1 孵化与入门
注册 → 三步 onboarding → 孵化主孪生 → 落在 **Ask AiXin** 首页。

### 6.2 安装 → 指派 → 委派 → 决策 → 回执 → 验证
1. 打开**技能 / 市场**,查看技能(清单、外部工具连接、权限)并显式授权安装。
2. 将技能指派给专家孪生,并连接其所需的外部工具连接。
3. 在 **Ask AiXin** 或**聊天**中用自然语言委派。
4. SIP 校验;中/高风险产生带证据的决策卡;批准(推翻建议需填理由)或拒绝
   (均签名)。
5. 通过真实外部工具连接执行;投递留痕;已签名回执出现在声誉/治理页,
   附 BscScan 链接。
6. 任何人可在 `/verify/$sipId` 公开验证回执。

### 6.3 渠道对话
绑定 Telegram(或微信)→ 向主孪生询问任务状态 → 在渠道内收到结果与投递确认;
对话持久化于 `task_messages`。

### 6.4 学院认证
学习路径 → 模块课程 + 测验 → 认证流程 → 可分享记录;ROI 计算器与孪生模板
支持变现方向。

### 6.5 声誉
每一个已签名动作都会更新专家孪生的 ERC-8004 声誉卡;失败与否决连同原因一并
记录 —— 声誉是挣来的,不是宣称的。

## 7. 数据模型(Supabase,高层)

核心:`master_twins`、`specialist_twins`、`skills`、`skill_versions`、
`skill_installs`、`skill_assignments`、`adapters`。
治理:`tasks`、`task_events`、`task_messages`、`task_outcomes`、
`decision_cards`、`receipts`、`delivery_logs`、`prompt_traces`、
`content_safety_events`。
经济:`reputation_entries`、`ledger_preview`、`run_budgets`、`run_usage`。
平台:`profiles`、`user_roles`、`organizations`、`organization_members`、
`org_api_keys`、`telegram_links`、`chain_agents`。
演示:`demo_customers`、`demo_orders`、`demo_refunds`、`demo_agent_actions`、
`demo_api_keys`。

所有面向用户的表均启用 RLS,并按 `authenticated`(及服务器代码需要的
`service_role`)授予权限。

## 8. 非功能性需求

- **失败即安全**:校验器、外部工具连接或锚定失败会阻断执行而非静默继续;
  失败本身被记录。
- **真实标注**:账本预览或模拟锚定时展示测试模式横幅;文档使用 🟢/🟡/🔵,
  绝不把规划中的工作描述为已交付。
- **双语**:所有面向用户的字符串均有 `en` 与 `zh-CN`。
- **移动端优先**:每个页面在手机宽度下正确渲染;两者都是发布或演示前必须
  验证的 IDO 前质量门。
- **可自托管**:`docker compose up`(应用 + Postgres;验证器 sidecar 可选);
  提供阿里云/RunPod 及本地 Ubuntu/Windows 11 的中国友好运行手册。
- **确定性核心**:SIP 校验与回执规范化与 JS/Python SDK 参考输出字节一致。
- **无障碍**:shadcn 原语,决策卡支持键盘操作。

## 9. 成功指标

- 新账号首个已签名回执耗时:**< 10 分钟**。
- 100% 有后果的动作产出已签名回执(可在 `receipts` / `tasks` 中度量)。
- 100% 的外部工具连接投递产生 `delivery_logs` 记录(无论成功或失败)。
- 参考用例(中小企业简报、客户回复、金融报告)均可从空账号经
  安装 → 指派 → 委派 → 决策 → 回执 完整走通。

## 10. 里程碑

由 [`AIXIN_PLAN_2026H2.md`](./AIXIN_PLAN_2026H2.md) 的五关口计划取代:

| 关口 | 月份 | 主题 |
| --- | --- | --- |
| G1 | 2026-09 | 测试网完备 + BangBang 沙盒试点 + 前 8 个技能 |
| G2 | 2026-10 | 信任图谱 + 签约合约审计 + **IDO go/no-go** |
| G3 | 2026-11 | 市场交易 + 12 个技能 + 6 个组合 |
| G4 | 2026-12 | $AXN IDO / TGE(审计后) |
| G5 | 2026-12 | 上线后运营;账本预览退役 |

任务级真相仍以 [`ROADMAP.md`](./ROADMAP.md) 为准。

## 11. 参考

- 协议仓库:<https://github.com/aixin-protocol/aixin-protocol>
- 参考应用仓库:<https://github.com/aixin-protocol/aixin-twin>
- 规范站点:<https://aixin-protocol.github.io/aixin-protocol/>(自定义域名暂缓)
- 线上应用:<https://aixin-sandbox.lovable.app>
