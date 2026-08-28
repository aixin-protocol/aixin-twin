# AiXin — Aug–Dec 2026 delivery plan, budget and skill pipeline

> Authored 2026-08-28. Cost basis: **lean / Lovable-built**. Target: **$AXN IDO before end of Dec 2026**.
> Companion documents: [`ROADMAP.md`](./ROADMAP.md) (canonical task list),
> [`AIXIN_MARKETING_PLAN.md`](./AIXIN_MARKETING_PLAN.md) (go-to-market),
> `AiXin_Budget_Roadmap_Aug_Dec_2026.xlsx` (line-by-line costing, live formulas).
>
> **Truth labels** used throughout: 🟢 Live · 🟡 Sandbox · 🔵 Planned. Nothing is described as
> shipped before it is. Any third-party fee that cannot be sourced today is marked `[CONFIRM]`.

---

## 1. Executive summary

| Question | Answer |
| --- | --- |
| What ships by Dec 2026? | Testnet-complete reference app, the Trust Graph (indexer + read API + explorer), marketplace commerce, 12 production skills, 6 Specialist Twin bundles, audited contracts, and the $AXN TGE. |
| What does it cost? | **Must-fund US$169k–468k** (mid case ≈ **US$318k**). Of that, **US$50k–150k is recoverable market-making / LP float**, not burn. |
| Recommended raise | **≈ US$514k** — must-fund high case plus a one-month buffer. Cuts to ≈ US$310k if the token launch is deferred to 2027. |
| Where does the money go? | Token launch ≈ 50% of mid case, security/audit ≈ 11%, marketing ≈ 15%, build ≈ 7%, ops ≈ 6%, infra ≈ 2%, contingency ≈ 8%. |
| Biggest risk | Audit slippage in Oct–Nov. It gates both the $AXN contract and the listing. Mitigation: engage the auditor at Gate 2 and hold a hard go/no-go. |

Build effort across the whole plan is **241 effort days** driven through Lovable — no full-time
engineering payroll is assumed. Where a human is genuinely required (China ops/BD, community
moderation, legal, audit), it is a named contract line.

---

## 2. Roadmap — five gates

```text
        Aug            Sep            Oct            Nov            Dec
        |              |              |              |              |
Build   prep ─────────►G1 testnet ───►G2 protocol ──►G3 commerce ──►G4 IDO ──►G5 ops
        |              complete       + audit        + skills       TGE
        |              |              |              |              |
Money   2k             23k            46k            75k            199k   (mid, cumulative 347k)
        |              |              |              |              |
Market  positioning    proof phase    trust phase    creator phase  IDO phase
```

### Gate 1 — Sep 2026: testnet complete
*Entry:* Phase 3.5.a–c shipped (signing, on-chain surface, real adapters) — already 🟢.

- Phase 3.5.d production readiness: monitoring, retry queues, error budget, alerting.
- W1/W2/W4/W6 hardening: tool registry, skill-scope enforcement, run budgets, prompt traces.
- BangBang trial live in the sandbox (contractual mid-September commitment).
- First 8 skills live (China SMB set + education set).

*Exit label:* 🟢 Live on testnet. No silent fallbacks anywhere in the receipt path.

### Gate 2 — Oct 2026: protocol + audit + IDO decision
*Entry:* Gate 1 signed off.

- **Trust Graph indexer** — ingest anchor and registry events into a queryable store.
- **Trust Graph read API** (`api.aixin.io/graph`) — public, read-only.
- **Trust Graph explorer** (`spec.aixin.io/graph`) — the investor-visible proof surface.
- AIP-3 (anchoring fee / validator staking), AIP-4 (verified sources registry), AIP-5 (graph query surface).
- **Third-party contract audit engaged** — anchor + ERC-8004 + $AXN.
- **IDO go/no-go decision.** No-go branch: hold Gates 3 and 5, defer Gate 4 to 2027, cut ≈ US$205k.

### Gate 3 — Nov 2026: commerce + skills complete
*Entry:* audit findings triaged.

- **W5 marketplace commerce** — checkout, entitlements, publisher payouts.
- Metered usage billing off the existing `run_usage` rows.
- All **12 priority skills** live; **6 Specialist Twin bundles** shipped.
- Audit remediation pass and re-review.

### Gate 4 — Dec 2026: IDO / TGE
*Entry:* clean audit report, legal sign-off.

- $AXN token contract deployed; ledger-preview → real ledger migration.
- Launchpad listing, market making / LP seed, KYC vendor for the sale.
- Launch-week campaign (see the marketing plan).
- Mainnet bundle: Identity / Reputation / Validation / Anchor / Fee / Staking.

### Gate 5 — Dec 2026: post-launch operations
- Runrate infrastructure, support rota, community governance kickoff.
- Monthly transparency report anchored to real usage numbers.
- Ledger-preview retired so no simulated balance remains in the product.

### Explicitly carried, explicitly optional
| Item | Why it is not must-fund |
| --- | --- |
| W3 `dsh-bridge` (self-hosted DeepSeek Harness runtime) | Not on the BangBang trial or IDO critical path. |
| W6 deterministic replay | 🔵 Planned only — must never be demoed as working until it is. |
| Bug bounty, events, paid acquisition | Accelerators; cut first if funding is tight. |

---

## 3. Budget — lean basis

All figures USD. Low / High are genuine ranges, not padding; mid is the average.
Full line detail with live formulas is in `AiXin_Budget_Roadmap_Aug_Dec_2026.xlsx`.

| Block | Low | High | Mid | Share of mid | What it buys |
| --- | --- | --- | --- | --- | --- |
| Build | 19,100 | 29,100 | 24,100 | 7% | 241 effort days of Lovable build: Trust Graph, commerce, 12 skills, 6 bundles, BangBang, $AXN contract, subscription + credit headroom |
| Security | 18,600 | 56,200 | 37,400 | 11% | Contract audit `[CONFIRM]`, remediation, optional bounty pot |
| Token launch | 83,000 | 263,000 | 173,000 | 50% | Legal/token counsel, launchpad fee, market-making / LP float, KYC vendor — all `[CONFIRM]` |
| Marketing | 27,900 | 79,700 | 53,800 | 15% | KOL + community, content and video, waitlist/CRO, bilingual asset pass, events, paid tests |
| Ops | 14,000 | 29,000 | 21,500 | 6% | Part-time China ops/BD, community moderation and support, Academy trainer support |
| Infra | 5,150 | 11,600 | 8,375 | 2% | BSC RPC, hosting/domains/CDN, Lovable Cloud, China GPU box for self-hosted Qwen, messaging fees, gas float |
| Contingency | 15,355 | 42,520 | 28,938 | 8% | 10% of every must-fund line |
| **Total** | **183,105** | **511,120** | **347,113** | 100% | |
| of which **must-fund** | **168,905** | **467,720** | **318,313** | | Required to reach a credible IDO |
| of which optional | 14,200 | 43,400 | 28,800 | | Accelerators |
| of which **recoverable float** | 50,000 | 150,000 | | | Market-making / LP seed — a balance-sheet item, not spend |

### Cash curve (mid case)

| Month | Build | Security | Token launch | Infra | Marketing | Ops | Contingency | Month | Cumulative |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Aug 2026 | 1,205 | — | — | 838 | 2,690 | — | — | 4,733 | 4,733 |
| Sep 2026 | 7,230 | — | — | 1,884 | 8,070 | 5,375 | — | 22,559 | 27,292 |
| Oct 2026 | 6,025 | 13,090 | 8,650 | 1,884 | 10,760 | 5,375 | — | 45,784 | 73,076 |
| Nov 2026 | 6,025 | 16,830 | 17,300 | 1,884 | 13,450 | 5,375 | 14,469 | 75,333 | 148,409 |
| Dec 2026 | 3,615 | 7,480 | 147,050 | 1,885 | 18,830 | 5,375 | 14,469 | 198,704 | 347,113 |

Read across: **under US$75k is needed before the IDO decision at the end of October.** The
funding requirement is back-loaded into the token launch itself, which means the go/no-go at
Gate 2 is a real option, not a formality.

### Funding scenarios

| Scenario | Total needed | What you get |
| --- | --- | --- |
| Minimum viable (no token in 2026) | ≈ US$113k mid | Testnet complete, Trust Graph live, commerce, 12 skills, 6 bundles, BangBang trial. No audit-gated token work. |
| Plan of record (IDO in Dec) | ≈ US$318k mid, US$468k high | Everything above plus audited contracts, listing, market making, TGE. |
| Recommended raise | **≈ US$514k** | High case plus one month of buffer, so a Nov audit slip does not become a missed launch. |

`[CONFIRM]` lines to replace with real quotes before this goes to investors: contract audit,
token counsel, launchpad fee, market-making float, KYC vendor, KOL package, content production.

---

## 4. Skills to prioritise

Twelve skills across three segments. Sequencing rule, enforced in code today: **no skill ships
without a live adapter path.** Anything without one halts as `blocked / no_live_adapter` and its
output is labelled "draft — not executed" (`src/lib/execution-capability.ts`).

| # | Skill | Segment | Adapter | Risk | Decision Card | Status | Month | Days |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Daily Briefing (harden + WeChat delivery) | China SMB / OPC | Telegram, WeChat, Gmail | Low | No | 🟢 Live | Sep | 4 |
| 2 | Customer Reply Desk | China SMB / OPC | Gmail, WeChat | Medium | Yes (send) | 🔵 New | Sep | 7 |
| 3 | Invoice & Reconciliation Watcher | China SMB / OPC | Gmail, webhook | Medium | Yes (money) | 🔵 New | Oct | 8 |
| 4 | Lead Qualifier + follow-up drafts | China SMB / OPC | Gmail, WeChat | Low | No (draft) | 🔵 New | Oct | 6 |
| 5 | Homework Photo Recognition | BangBang education | Tenant API, vision model | Low | No | 🟡 Partial | Sep | 8 |
| 6 | Math Practice Generator | BangBang education | Tenant API | Low | No | 🟡 Partial | Sep | 5 |
| 7 | AI Tutoring Session | BangBang education | Tenant API, WeChat | Low | No | 🟡 Partial | Sep | 7 |
| 8 | Parent / Teacher Progress Report | BangBang education | WeChat, Gmail | Medium | Yes (send) | 🔵 New | Sep | 6 |
| 9 | Financial Predictor (harden) | Web3 | Gmail, CoinGecko | Low | No | 🟢 Live | Oct | 4 |
| 10 | Portfolio Briefing | Web3 | Telegram, webhook | Low | No | 🔵 New | Oct | 5 |
| 11 | On-chain Monitor & Alert | Web3 | Webhook, Telegram | Low | No | 🔵 New | Nov | 6 |
| 12 | Treasury / DAO Report | Web3 | Gmail, webhook | Medium | Yes (send) | 🔵 New | Nov | 6 |

**Total: 72 effort days, US$5,300–7,900** in build credits (the workbook's `Skills` sheet
auto-reconciles this against the `Budget` sheet, so the two can never drift).

### Why these twelve

- **Recurring, boring, and provable.** Each replaces a task an operator does every week, so the
  ROI story is arithmetic, not adjectives.
- **Adapter coverage already exists.** Gmail, Telegram, WeChat and signed webhooks are 🟢 live;
  nothing on the list depends on an integration that has not been built.
- **Each risk tier is represented.** Low-risk skills demonstrate speed; the medium-risk money and
  send actions demonstrate the Decision Card — which is the product.
- **Three segments, one engine.** The same SIP pipeline serves an OPC operator, a parent, and a
  DAO treasurer. That is the marketplace argument.

### Specialist Twin bundles (all six by Nov 2026)

| Bundle | Default skills | Adapters | Default run budget | For |
| --- | --- | --- | --- | --- |
| Operations | Daily Briefing; Portfolio Briefing | Telegram, WeChat | 20 runs/mo, 100k tokens | Founders, OPC operators |
| Customer Desk | Customer Reply Desk; Lead Qualifier | Gmail, WeChat | 60 runs/mo, 300k tokens | SMB support and sales |
| Finance | Invoice & Reconciliation Watcher; Treasury / DAO Report | Gmail, webhook | 30 runs/mo, 150k tokens | Bookkeeping, treasury |
| Tutor | Homework Photo Recognition; Math Practice; AI Tutoring; Progress Report | Tenant API, WeChat | 200 runs/mo, 600k tokens | BangBang students, parents, teachers |
| Growth | Lead Qualifier; Daily Briefing | Gmail, WeChat | 40 runs/mo, 200k tokens | Marketing and BD |
| Analyst | Financial Predictor; On-chain Monitor; Portfolio Briefing | Webhook, Telegram, Gmail | 60 runs/mo, 300k tokens | Web3 desks and DAOs |

A bundle is a pre-configured Specialist Twin: name, role, assigned skills, required adapters and
a run budget. The user hatches their Master Twin, picks a bundle, connects the adapters it names,
and has a working team in minutes instead of assembling skills by hand.

---

## 5. Dependencies and risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Audit slips past Nov | Blocks $AXN and the listing → no Dec IDO | Engage auditor at Gate 2; hold the go/no-go; buffer in the recommended raise |
| Third-party quotes exceed the high case | Funding gap | Every `[CONFIRM]` line is replaced with a quote before the raise closes |
| BangBang trial scope creep | Diverts Sep build days | P0 scope is frozen per `BANGBANG_TRIAL_REPLY.md`; P1/P2 stay post-September |
| Adapter provider changes (WeChat, Gmail) | Skills halt as blocked | Fail-secure behaviour is already the designed outcome, not an outage |
| Market conditions at TGE | Weak launch | Token narrative is tied to real usage metrics, not promises; Gate 2 can defer |

---

# 中文版

> 撰写日期 2026-08-28。成本基础：**精简 / 由 Lovable 构建**。目标：**2026 年 12 月底前完成 $AXN IDO**。
> 真实标签：🟢 已上线 · 🟡 沙盒 · 🔵 规划中。任何今天无法取得报价的第三方费用均标记 `[CONFIRM]`。

## 1. 摘要

| 问题 | 回答 |
| --- | --- |
| 12 月前交付什么？ | 测试网完备的参考应用、信任图谱（索引器 + 只读 API + 浏览器）、市场交易能力、12 个生产级技能、6 个专家孪生组合、已审计合约，以及 $AXN TGE。 |
| 需要多少钱？ | **必须投入 16.9 万–46.8 万美元**（中值约 **31.8 万美元**）。其中 **5 万–15 万美元为可回收的做市 / 流动性资金**，并非支出。 |
| 建议融资额 | **约 51.4 万美元** —— 高值加一个月缓冲。若代币发行延至 2027，可降至约 31 万美元。 |
| 钱花在哪？ | 代币发行约 50%、安全审计约 11%、市场营销约 15%、开发约 7%、运营约 6%、基础设施约 2%、备用金约 8%。 |
| 最大风险 | 10–11 月审计延期，它同时卡住 $AXN 合约与上市。对策：在 Gate 2 就签约审计方，并严格执行 go/no-go 决策。 |

全部开发工作量为 **241 个有效工作日**，通过 Lovable 完成，不假设全职工程薪资。确实需要人的部分
（中国运营/BD、社区维护、法律、审计）都单列为合同费用。

## 2. 路线图 —— 五道关口

| 关口 | 月份 | 主题 | 主要交付 |
| --- | --- | --- | --- |
| G1 | 2026-09 | 测试网完备 | Phase 3.5.d 生产就绪；W1/W2/W4/W6 加固；BangBang 试点在沙盒上线；前 8 个技能上线 |
| G2 | 2026-10 | 协议 + 审计 | 信任图谱索引器 + 只读 API + 浏览器；AIP-3/4/5；签约合约审计；**IDO go/no-go 决策** |
| G3 | 2026-11 | 交易 + 技能 | W5 市场交易（结算、权益、创作者分成）；按用量计费；12 个技能与 6 个专家孪生组合全部上线 |
| G4 | 2026-12 | IDO / TGE | $AXN 合约部署；上市与做市；发行周营销；主网合约包 |
| G5 | 2026-12 | 上线后运营 | 常态化基础设施、支持轮值、社区治理；下线模拟账本 |

**可选、非必须**：W3 `dsh-bridge`（自托管 DeepSeek Harness 运行时）、W6 确定性回放（🔵 仅规划中，
在真正可用前绝不可作为演示）、漏洞赏金、线下活动、付费投放。

## 3. 预算（精简基础，美元）

| 板块 | 低 | 高 | 中值 | 占比 |
| --- | --- | --- | --- | --- |
| 开发 | 19,100 | 29,100 | 24,100 | 7% |
| 安全审计 | 18,600 | 56,200 | 37,400 | 11% |
| 代币发行 | 83,000 | 263,000 | 173,000 | 50% |
| 市场营销 | 27,900 | 79,700 | 53,800 | 15% |
| 运营 | 14,000 | 29,000 | 21,500 | 6% |
| 基础设施 | 5,150 | 11,600 | 8,375 | 2% |
| 备用金 | 15,355 | 42,520 | 28,938 | 8% |
| **合计** | **183,105** | **511,120** | **347,113** | 100% |
| 其中**必须投入** | **168,905** | **467,720** | **318,313** | |
| 其中可回收资金 | 50,000 | 150,000 | | 做市 / 流动性 |

现金曲线（中值）：8 月 4,733 → 9 月 22,559 → 10 月 45,784 → 11 月 75,333 → 12 月 198,704，
累计 347,113。**10 月底 IDO 决策前累计需求不足 7.5 万美元**，因此 go/no-go 是真实可行的选择权。

## 4. 优先技能与专家孪生

排序规则（代码中已强制执行）：**没有可用外部工具连接的技能不上线**；否则运行以
`blocked / no_live_adapter` 中止，产出标记为「草稿 —— 未执行」。

| # | 技能 | 分区 | 外部工具连接 | 风险 | 决策卡 | 状态 | 月份 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 每日简报（加固 + 微信投递） | 中国中小企业 / 一人公司 | Telegram、微信、Gmail | 低 | 否 | 🟢 | 9 月 |
| 2 | 客户回复台 | 中国中小企业 | Gmail、微信 | 中 | 是（发送） | 🔵 | 9 月 |
| 3 | 发票与对账监控 | 中国中小企业 | Gmail、Webhook | 中 | 是（资金） | 🔵 | 10 月 |
| 4 | 线索甄别与跟进草稿 | 中国中小企业 | Gmail、微信 | 低 | 否（草稿） | 🔵 | 10 月 |
| 5 | 作业拍照识别 | BangBang 教育 | 租户 API、视觉模型 | 低 | 否 | 🟡 | 9 月 |
| 6 | 数学练习生成 | BangBang 教育 | 租户 API | 低 | 否 | 🟡 | 9 月 |
| 7 | AI 辅导会话 | BangBang 教育 | 租户 API、微信 | 低 | 否 | 🟡 | 9 月 |
| 8 | 家长 / 教师进度报告 | BangBang 教育 | 微信、Gmail | 中 | 是（发送） | 🔵 | 9 月 |
| 9 | 金融预测（加固） | Web3 | Gmail、CoinGecko | 低 | 否 | 🟢 | 10 月 |
| 10 | 投资组合简报 | Web3 | Telegram、Webhook | 低 | 否 | 🔵 | 10 月 |
| 11 | 链上监控与提醒 | Web3 | Webhook、Telegram | 低 | 否 | 🔵 | 11 月 |
| 12 | 金库 / DAO 报告 | Web3 | Gmail、Webhook | 中 | 是（发送） | 🔵 | 11 月 |

合计 **72 个工作日、5,300–7,900 美元**。

**六个专家孪生组合**（11 月前全部上线）：运营、客户台、财务、辅导、增长、分析。每个组合预置
名称、角色、指派技能、所需外部工具连接与运行预算 —— 用户孵化主孪生后选一个组合、连接工具，
几分钟内就有一支可用团队。

## 5. 风险

| 风险 | 影响 | 对策 |
| --- | --- | --- |
| 审计延至 11 月后 | 阻断 $AXN 与上市 | Gate 2 即签约；严格执行 go/no-go；融资含缓冲 |
| 第三方报价超出高值 | 资金缺口 | 融资交割前用真实报价替换所有 `[CONFIRM]` |
| BangBang 试点范围扩张 | 占用 9 月开发资源 | P0 范围已冻结，P1/P2 排在 9 月之后 |
| 外部工具方（微信、Gmail）变更 | 技能中止 | 失败即安全是设计结果，不是故障 |
| TGE 时市场环境不佳 | 发行疲弱 | 代币叙事绑定真实使用数据；Gate 2 可延期 |
