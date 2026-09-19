# AiXin community update: AiXin vs Instinct, our moats, and what we build next

Status: presentation draft for the AiXin community (leaders and members). No code changed by this document. On approval, saved as `AIXIN_VS_INSTINCT_COMMUNITY_UPDATE.md` at the project root (bilingual EN/ZH) and mirrored to both repos (aixin-protocol + aixin-twin). Per your instruction: no reviewer discussion — straight comparison, moats, and plans. Truth labels 🟢 Live / 🟡 Sandbox / 🔵 Planned throughout; no invented numbers, no certification claims.

**Verification links convention:** every 🟢 claim links to the live app so readers can check it themselves. Base URL: https://aixin-sandbox.lovable.app
- Public (no sign-in): `/proof` — live counters; `/verify/<receipt-id>` — per-receipt verification with its BscScan testnet transaction link; `/api/public/proof` and `/api/public/keys` — machine-readable counters and the published Ed25519 public key.
- Sign-in required (marked 🔒): dashboard surfaces such as Decision Cards and the Ledger — a reader must create a free account; every anchored receipt shown there carries its own BscScan testnet link (https://testnet.bscscan.com).

**Live examples — click straight through (real records, pulled from the live database 2026-09-19):**
- A real signed receipt, no login needed — a governed "lead follow-up draft" action, approved by its owner: https://aixin-sandbox.lovable.app/verify/sip_6a58802867f4
- Its BSC Testnet anchor transaction (block 131,741,208, chain id 97): https://testnet.bscscan.com/tx/0x025b48af97fcb389d5dc4366448e0ece686f51049a971d7151adc5e1f47b4d15
- Its ERC-8004 agent-identity transaction: https://testnet.bscscan.com/tx/0x0468fe647f71527c662ed6bbd95dd9698eb2b7f2031789a5f7c41167b5b49109
- Its on-chain validation record (validator score 80): https://testnet.bscscan.com/tx/0xd9e649f8c01d8df03a25e39deee03031f7e739f19b9f542b157883163c751dd2
- The Decision Card and full governed trail for that same action live at https://aixin-sandbox.lovable.app/dashboard/tasks/628a8bfc-1ebe-49c6-84dd-5c038b2c5879 — **owner's account only, by design**: tasks are private to their owner, so anyone else sees "task not found". That privacy is itself the product. For the community call, the owner screen-shares this page; for readers, the public verify page above is the no-login equivalent.
- The published Ed25519 public key for offline signature checks: https://aixin-sandbox.lovable.app/api/public/keys

---

## Presentation draft (EN)

### Opening — the news, and why it matters to us

You have likely seen it: Instinct, a consumer AI agent, raised a $250M Series B at a $2.5B valuation (co-led by Index Ventures and Benchmark; ~$350M raised in total). Some of you asked: is this competition? Our answer: **it is validation — and a contrast that makes AiXin's reason for existing easier to explain than ever.**

Instinct proved millions of people want an agent that acts for them. AiXin exists because an agent that acts for you must also be **accountable to you**. Those are two halves of one category. The market just priced the first half at $2.5B. The second half is ours to build — and regulation is making it mandatory.

### Part 1 — AiXin vs Instinct today: similarities

| | Both |
| --- | --- |
| Category | Agents that take real actions on your behalf — not chatbots |
| Surfaces | Conversational front door (Instinct: SMS/WhatsApp/phone; AiXin: Telegram + dashboard + API) |
| Real-world work | Money, email, commerce, monitoring — actual tools, not toy demos |
| Scheduling | Work that runs while you sleep (morning briefings, overnight watches) |
| Belief | The future is agents doing tangible jobs, judged by finished outcomes |

### Part 2 — AiXin vs Instinct today: differences (with live proof)

| Dimension | Instinct | AiXin — and where you can verify it |
| --- | --- | --- |
| Authority model | Broad: holds credentials, drives a browser, acts first | Narrow but real: acts through official APIs you connect, gated by risk — connect them yourself under Adapters 🔒 https://aixin-sandbox.lovable.app/dashboard/adapters |
| Asking permission | Rarely pauses — ease comes from never stopping | Decision Cards gate anything irreversible 🔒 https://aixin-sandbox.lovable.app/dashboard/tasks |
| Proof of action | The completed task, self-reported | Ed25519-signed receipt per governed action 🟢 — public key published at https://aixin-sandbox.lovable.app/api/public/keys; verify any receipt at https://aixin-sandbox.lovable.app/verify/ + receipt id (linked from every row on the public Proof page https://aixin-sandbox.lovable.app/proof) |
| On-chain anchoring | None | Every governed action anchored to BSC Testnet 🟢 — each verify page links its transaction on https://testnet.bscscan.com; live anchored counter at https://aixin-sandbox.lovable.app/proof |
| Agent identity | None | Receipts carry ERC-8004 agent identity 🟢 — visible on each verify page |
| Undo | None — actions are not reversible by design | 🔵 Compensation registry + one-tap undo planned (Part 5) |
| Email | Sends as you | Draft-only, sends always gated 🟢 — the "emails sent on your behalf: 0 — by design" counter is public at https://aixin-sandbox.lovable.app/proof |
| Memory | Broad access, retained after disconnect | Purpose-limited, inspectable, user-editable 🟢 🔒 https://aixin-sandbox.lovable.app/dashboard/memory |
| Answers | Fluent | Cited or refused 🟢 🔒 https://aixin-sandbox.lovable.app/dashboard/qa |
| Target user | Consumers | Solo businesses and SMBs — money at stake on every action |
| Maturity | Finished product, viral growth | 🟡 Shipped governed agent across Gmail, Stripe, Shopify, Telegram — plus a trust layer that is 🟢 live and verifiable at the links above |
| Funding | ~$350M total at a $2.5B valuation | Seed stage (~$300k raised so far) — the comparison is Part 3 |

Read the table as two different bets: **Instinct bets trust can be added later. AiXin bets trust cannot be retrofitted — it must be architecture.** The bet is being tested now, and both claims are externally checkable: Spain's data protection agency (AEPD) published the first breach notification executed by an autonomous AI agent on 14 Sep 2026 ([SecurityWeek, 16 Sep 2026](https://www.securityweek.com/first-agentic-ai-data-breach-reported-to-spanish-regulator/); [Help Net Security, 17 Sep 2026](https://www.helpnetsecurity.com/2026/09/17/spain-ai-agent-data-breach/)), and the EU AI Act is in force with enforcement powers live — penalties of up to €35M or 7% of global turnover are set out in [Article 99](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-99) of [Regulation (EU) 2024/1689 (consolidated text)](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX%3A02024R1689-20260727), with human oversight mandatory under [Article 14](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-14) and automatic record-keeping under [Article 12](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-12).

### Part 3 — The race and the raise: an honest answer to "why aren't you finished too?"

This is the question investors and community members will ask. Here is the fair answer, with checked figures.

**The checked facts on Instinct (Aug 26, 2026 reporting):**
- Founded 2025; private beta since February 2026 — about 7 months of product, not years.
- Funding sequence: ~$100M early round (Conviction Partners, Greenoaks) → **$75M Series A led by Kleiner Perkins at a >$500M valuation** → **$250M Series B co-led by Index Ventures and Benchmark at $2.5B** → ~$350M total. The valuation re-rated from ~$100M to $2.5B in weeks — one VC analyst called it "an option premium on a founder", not a valuation.
- Sources: TechCrunch, WSJ via SiliconANGLE/PYMNTS, Forbes via IBTimes.

**The fair comparison:**
1. **Instinct was never ahead on technology — it was ahead on capital.** At the $500M mark it already held ~$175M; we hold ~$300k. That is a ~580:1 resource ratio. "Why aren't you finished?" has the same answer as "why hasn't a self-funded builder finished the same house as a developer with 500x the budget" — and our build includes the part they skipped.
2. **Their speed was bought with the thing we refuse to spend: unbounded trust.** Holding user credentials, driving a browser, acting without asking — that is fast to build precisely because it skips the governance layer. Our ~4 months went into the layer that cannot be retrofitted: the deterministic gate, signed receipts, on-chain anchoring, agent identity. We built the hard-to-copy half first.
3. **What $300k bought is verifiable, not claimed.** Every receipt, anchor and counter at https://aixin-sandbox.lovable.app/proof exists and is third-party checkable. Instinct's $350M has produced no equivalent artefact — there is nothing to independently verify.
4. **Finishing is the cheap part, and it is now a capital question, not a research question.** Our remaining work (Part 5–7) is composition on proven rails — primitive capabilities, undo, plain-words intent, self-hosted inference. That is exactly what seed capital accelerates.

**Is a $1M–$2M raise fair to announce? Yes — with honest framing:**
- It is a seed-sized ask against a competitor's $350M, funding a specific published roadmap (R1–R4 product, H1–H3 infrastructure, named pilots) — not an open-ended burn.
- The claim to make: "$300k built the governance layer competitors cannot retrofit; the next $1M–$2M finishes the agent on top of it — verifiable at every step, because every action ships with a receipt you can check."
- The claim NOT to make: any implication that $1–2M produces an Instinct-scale outcome or a $2.5B valuation. Our funding deck already states this honestly (~US$514k must-fund; $1–2M is the accelerated case including pilots, China/Malaysia deployment and the marketplace). Speed of follow-on funding depends on traction, not on the announcement.
- That framing is defensible precisely because the community can check the receipts behind it.

**How the $1M–$2M would be used (illustrative mid-case $1.5M; consistent with AIXIN_PLAN_2026H2, where $514k is the must-fund floor and $1–2M is the accelerated case):**

| Use | Share | What it buys |
| --- | --- | --- |
| Product completion — R1–R4 | ~40% | Primitive capability layer, compensation registry + undo, known-targets allowlist, plain-words intent + miss log: the work that brings AiXin to parity with Instinct on *ease* (any words in, composed plan out) while staying ahead on *accountability* |
| GPU hardware + self-hosted inference (H1) | ~12% | One owned inference node (4× L20/L40S-class GPUs) or a 12-month cloud-GPU pilot, running Qwen for twin reasoning — converts the largest variable cost (per-token model billing) into fixed capacity |
| China + Malaysia deployment (H2–H3) | ~10% | Domestic endpoints (DashScope/DeepSeek), regional hosting, WeChat/WeChat Work and WhatsApp-class channel adapters, data-residency alignment |
| Named pilots (BangBang + 2–3 SMB/OPC) | ~15% | Onboarding, support and the case-study evidence investors ask for next |
| Security + smart-contract audit reserve (Gate 2) | ~10% | Independent audit before any token decision — token work stays conditional and is never presented as live |
| Community, marketplace and business development | ~8% | Skill marketplace commerce, community-leader enablement, developer-API partnerships |
| Buffer | ~5% | FX, hardware lead-times, pilot overruns |

**The parity-and-better statement this funds:** on par with Instinct in the moments that matter — one conversation, any words, finished outcomes — and ahead where it counts for a business: every action gated, signed, anchored, undoable where possible, and verifiable by anyone. Hardware is included deliberately: owning inference is both a cost moat (cost per governed action falls as coverage grows) and a data-residency moat (China and Malaysia deployments run in-country).

### Part 4 — Our differentiators and defensible moats (each with live proof)

These are things Instinct does not have — and structurally will not prioritise, because its goals (maximum ease, consumer delight) and ours (responsible authority for businesses) are different:

1. **Signed, anchored, publicly verifiable receipts** 🟢 — anyone can check a receipt without an account: https://aixin-sandbox.lovable.app/proof (live counters, each receipt linked to its verify page) and https://aixin-sandbox.lovable.app/api/public/keys (the Ed25519 public key for offline verification). *Why it matters to an investor:* due diligence usually means taking a startup's word for its numbers. Ours are checkable on-chain without asking us — a counter that reads 71 and verifies is worth more than a slide that reads 71,000 and doesn't. A year of verifiable receipts cannot be retrofitted; a confirmation dialog can be built in a week.
2. **The gate is code, not policy** 🟢 — deterministic validation, risk tiers and Decision Cards are ordinary tested code; the model cannot talk its way past the gate. See the governed pipeline end-to-end on any task 🔒 https://aixin-sandbox.lovable.app/dashboard/tasks. *Why it matters:* the AEPD's write-up of the first agent breach stresses exactly this — agent risk "cannot be managed solely through manual intervention" ([SecurityWeek](https://www.securityweek.com/first-agentic-ai-data-breach-reported-to-spanish-regulator/)). A gate the model cannot bypass is the architectural answer to that finding.
3. **Four invariants in code** 🟢 — draft-only email (public zero-counter: https://aixin-sandbox.lovable.app/proof), approval-gated money, cited-only answers 🔒 https://aixin-sandbox.lovable.app/dashboard/qa, inspectable purpose-limited memory 🔒 https://aixin-sandbox.lovable.app/dashboard/memory. *Why it matters:* the EU AI Act makes human oversight ([Article 14](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-14)) and automatic logging ([Article 12](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-12)) legal requirements for high-risk AI — our invariants are those requirements, already running.
4. **A safe open skills marketplace** 🟢 — skills carry method, not authority; authority lives only in gated capabilities 🔒 https://aixin-sandbox.lovable.app/dashboard/skills. *Why it matters:* it lets capability grow like an app store without growing the attack surface — the property Instinct's broad-permission model structurally lacks, and the property regulators look for first.
5. **ERC-8004 agent identity** 🟢 — receipts carry a verifiable agent identity; visible on every verify page (example: the identity transaction at https://testnet.bscscan.com/tx/0x0468fe647f71527c662ed6bbd95dd9698eb2b7f2031789a5f7c41167b5b49109). *Why it matters:* "which agent did this, and who answers for it?" is the first question after any incident — the AEPD breach notification is precisely a case of an unattributable agent. We ship attribution.
6. **Regulatory alignment as architecture** — EU AI Act (penalties to €35M / 7% of turnover, [Article 99](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-99); enforcement powers live since Aug 2026), China's AI governance rules, Malaysia's data-protection framework, and the management-system discipline of [ISO/IEC 42001:2023](https://webstore.iec.ch/en/publication/90574) (the first international AI management-system standard): all converge on human oversight, logging, traceability, accountability. AiXin's architecture *is* that convergence, built from day one. **Honest limit, stated on stage:** we claim alignment work in progress and verifiability — never certification. *Why it matters:* enterprises and regulators procure against these articles; a product whose receipts already satisfy them skips the compliance retrofit competitors will face.
7. **Business-first distribution** 🟢 — jobs solo businesses run weekly — invoice chase, inbox triage, lead follow-up, overnight watch, store morning round — each shipped with its executor, risk tier and receipt 🔒 https://aixin-sandbox.lovable.app/dashboard/jobs. *Why it matters:* businesses pay for accountable outcomes, not delight; willingness to pay is real here, and every paid job mints another verifiable receipt that compounds moat #1.

The honest statement of our position: **Instinct asks for your trust. AiXin shows its work — and hands you the link.**

### Part 5 — The coming weeks: making AiXin more powerful (the PAA adoption)

We recently completed a deep architecture study (against the Personal Agent Architecture design — the clearest articulation of the trusted-agent thesis anywhere). We are adopting its best ideas, in order:

1. **Primitive capability layer** 🔵 — ~15–20 gated primitives (read a collection, send a message, create a draft, make a payment, set a timer, ask a human…). Every job becomes a composition of primitives; users author skills as recipes, not code; the platform grows capability by composition instead of one-off engineering. Our existing executors become the first primitive-backed skills — zero user-visible regression.
2. **Compensation registry + undo** 🔵 — before any reversible action fires, its undo is recorded. Decision Cards then show: what will happen, what it costs, and **how to take it back**. This is the visible difference from Instinct: not "we ask first" but "you can always undo".
3. **Known-targets allowlist** 🔵 — no payee, recipient or URL may originate from untrusted content. Prompt-injection defence becomes a database lookup, not a judgement call.
4. **Plain-words intent** 🔵 — say "chase my unpaid invoices" in any words; the twin composes the plan from skills and primitives, and on a miss names the exact gap and the route to fix it, logging every miss to drive what we build next.
5. **Escalation discipline and standing grants with expiry** 🔵 — confirmations that respect your attention; permissions that scope down and expire.

Target: within weeks, the same governed rail — wider real-world authority, with undo and targets allowlist behind it.

### Part 6 — Coming weeks: from cloud to self-hosted in China and Malaysia

Model cost is the largest running cost of any agent platform. Our path to optimise it and to localise:

1. **Model-agnostic execution** 🟢 — the stack already runs against any OpenAI-compatible endpoint via environment configuration (Lovable AI gateway today; local Qwen, DashScope or DeepSeek when self-hosted). Governance — SIP, signing, anchoring, receipts — is deterministic code and unaffected by which model runs.
2. **Self-hosted GPU pilot** 🔵 — Docker-based deployment on your own infrastructure (Ubuntu/Alibaba Cloud today; the runbook exists) running Qwen for twin reasoning at a fraction of per-token cloud cost. Recommended models documented per workload.
3. **China deployment** 🔵 — domestic endpoints (DashScope/Qwen, DeepSeek), China-friendly hosting, WeChat/WeChat Work channel adapters already on the roadmap; data residency aligned with Chinese rules.
4. **Malaysia deployment** 🔵 — regional hosting and the same adapter seam (WhatsApp-class channels via official APIs), aligned with Malaysia's data-protection requirements.
5. **Cost effect** 🔵 — self-hosted inference shifts the largest variable cost from per-token billing to fixed GPU capacity; combined with the capability layer, cost per governed action falls while coverage grows.

### Part 7 — The roadmap at a glance

```text
NOW (🟢 live — verify it: https://aixin-sandbox.lovable.app/proof)
  Governed agent: SIP gate · Decision Cards · Ed25519 receipts · BSC anchoring
  Real jobs: invoice chase · inbox triage · lead follow-up · overnight watch
  Surfaces: dashboard · Telegram control room · public Proof page · developer API

WEEKS (🔵 adopting PAA)
  R1 Primitive capability layer   → skills become compositions, users author freely
  R2 Compensation registry + undo → "take it back" on every reversible action
  R3 Known-targets allowlist      → injection-proof action targets
  R4 Plain-words intent + miss log→ any words in, composed plan out, demand-driven builds

THIS QUARTER (🔵 infrastructure + market)
  H1 Self-hosted GPU pilot (Qwen) → model cost optimisation, env already model-agnostic
  H2 China deployment             → domestic endpoints, WeChat channels, data residency
  H3 Malaysia deployment          → regional hosting, localised channels
  G   Gates: testnet complete → protocol/audit → commerce + skills/bundles → TGE decision
      (token work stays conditional on the audit gate and is never presented as live)

FUNDING
  Seed acceleration: US$1M–2M → ships R1–R4 + H1–H3 + named pilots
  Every dollar's output verifiable at /proof — the only raise in the category
  whose progress investors can check on-chain.
```

### Closing

Instinct's raise is the market confirming that agents that act are the future. Our thesis is the other half: **agents that act for businesses must prove what they did.** That half has no $2.5B winner yet — and every regulatory signal, in the EU, China, Malaysia and beyond, moves in our direction. Instinct asks for trust. AiXin shows its work — and every link in this document is the proof. Help us build the agent businesses can finally depend on.

---

## 中文版

### 开场 — 消息与它对我们的意义

您可能已经看到：消费级 AI 代理 Instinct 以 25 亿美元估值完成 2.5 亿美元 B 轮融资（Index Ventures 与 Benchmark 联合领投；累计融资约 3.5 亿美元）。有人问：这是竞争吗？我们的回答：**这是验证——也是让 AiXin 存在的理由比以往任何时候都更容易讲清楚的对照。**

Instinct 证明了数百万人需要能代自己行动的代理。AiXin 的存在是因为：替您行动的代理，必须**向您问责**。这是同一个赛道的两半。市场刚刚为前半部分定价 25 亿美元；后半部分由我们来建设——而监管正在让它成为必需。

### 第一部分 — 今天 AiXin 与 Instinct 的相似之处

| | 两者共有 |
| --- | --- |
| 赛道 | 能代您采取真实行动的代理——不是聊天机器人 |
| 入口 | 对话式（Instinct：短信/WhatsApp/电话；AiXin：Telegram + 仪表盘 + API） |
| 真实工作 | 资金、邮件、电商、监控——真工具，不是玩具演示 |
| 定时任务 | 您睡觉时它工作（晨报、夜间巡查） |
| 信念 | 代理做实事，以完成的结果论英雄 |

### 第二部分 — 今天 AiXin 与 Instinct 的差异（附可验证链接）

| 维度 | Instinct | AiXin——以及您可以在哪里亲自验证 |
| --- | --- | --- |
| 权限模型 | 广泛：保管凭证、驱动浏览器、先行动 | 有限但真实：通过您连接的官方 API 行动，按风险分级把关——在"外部工具连接"页自行连接 🔒 https://aixin-sandbox.lovable.app/dashboard/adapters |
| 请求许可 | 极少暂停——便利来自从不停顿 | 决策卡把关一切不可撤销的动作 🔒 https://aixin-sandbox.lovable.app/dashboard/tasks |
| 行动证明 | 完成的任务，自我报告 | 每个受治理动作均有 Ed25519 签名凭证 🟢——公钥公开于 https://aixin-sandbox.lovable.app/api/public/keys；任一凭证可在 https://aixin-sandbox.lovable.app/verify/ 加凭证编号验证（公开证明页每行均有链接 https://aixin-sandbox.lovable.app/proof） |
| 链上锚定 | 无 | 每个受治理动作锚定 BSC 测试网 🟢——每个验证页都链接其在 https://testnet.bscscan.com 上的交易；实时锚定计数见 https://aixin-sandbox.lovable.app/proof |
| 代理身份 | 无 | 凭证携带 ERC-8004 代理身份 🟢——每个验证页可见 |
| 撤销 | 无——设计上不可逆 | 🔵 补偿登记 + 一键撤销已规划（第五部分） |
| 邮件 | 以您的名义发送 | 只起草、发送必经批准 🟢——"代您发出的邮件：0，设计如此"计数公开于 https://aixin-sandbox.lovable.app/proof |
| 记忆 | 广泛访问、断开后仍保留 | 限定用途、可查、可改、可删 🟢 🔒 https://aixin-sandbox.lovable.app/dashboard/memory |
| 回答 | 流畅 | 必须引用，否则拒答 🟢 🔒 https://aixin-sandbox.lovable.app/dashboard/qa |
| 目标用户 | 消费者 | 个体企业与中小企业——每个动作都关乎真金白银 |
| 成熟度 | 成熟产品、病毒式增长 | 🟡 已上线的受治理代理（Gmail、Stripe、Shopify、Telegram）+ 🟢 已上线可验证的信任层（链接如上） |
| 融资 | 累计约 3.5 亿美元 / 25 亿美元估值 | 种子期（迄今约 30 万美元）——对比见第三部分 |

把这张表读成两种不同的赌注：**Instinct 赌信任以后可以补上；AiXin 赌信任无法事后加装——它必须是架构本身。** 这场赌局正在被检验，且两个论断都可外部查证：西班牙数据保护局（AEPD）于 2026 年 9 月 14 日公布了首例由自主 AI 代理实施的数据泄露通报（[SecurityWeek，2026-09-16](https://www.securityweek.com/first-agentic-ai-data-breach-reported-to-spanish-regulator/)；[Help Net Security，2026-09-17](https://www.helpnetsecurity.com/2026/09/17/spain-ai-agent-data-breach/)）；欧盟《AI 法案》已生效且执法权已启动——最高 3500 万欧元或全球营收 7% 的罚则见[第 99 条](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-99)，[条例 (EU) 2024/1689 合并文本](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX%3A02024R1689-20260727)，人工监督义务见[第 14 条](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-14)，自动记录义务见[第 12 条](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-12)。

### 第三部分 — 竞赛与融资：诚实回答"你们为什么还没做完？"

这是投资者和社区成员都会问的问题。以下是经过核实的公平答案。

**关于 Instinct 的已核实事实（2026 年 8 月 26 日报道）：**
- 2025 年创立；2026 年 2 月开始邀请制内测——产品历程约 7 个月，而非数年。
- 融资顺序：约 1 亿美元早期轮（Conviction Partners、Greenoaks）→ **Kleiner Perkins 领投 7500 万美元 A 轮，估值超 5 亿美元** → **Index Ventures 与 Benchmark 联合领投 2.5 亿美元 B 轮，估值 25 亿美元** → 累计约 3.5 亿美元。估值在数周内从约 1 亿美元重估至 25 亿美元——一位风投分析师称之为"对创始人的期权溢价"，而非估值。
- 来源：TechCrunch、华尔街日报（经 SiliconANGLE/PYMNTS 转引）、福布斯（经 IBTimes 转引）。

**公平的对比：**
1. **Instinct 从未在技术上领先——它领先在资本上。** 估值到 5 亿美元时它已持有约 1.75 亿美元；我们持有约 30 万美元，资源比约 580:1。"你们为什么没做完？"的答案，与"自筹的建设者为什么没像预算多 500 倍的开发商那样盖完同一栋楼"相同——而且我们的建设还包含他们跳过的那一层。
2. **他们的速度是用我们拒绝花的东西买来的：无边界信任。** 保管用户凭证、驱动浏览器、不问就行动——之所以建得快，正是因为跳过了治理层。我们约 4 个月的时间投在了无法事后加装的那一层：确定性关口、签名凭证、链上锚定、代理身份。我们先把难以复制的那一半建完了。
3. **30 万美元换来的东西是可验证的，而不是宣称的。** https://aixin-sandbox.lovable.app/proof 上的每个凭证、每个锚定、每个计数都真实存在，且可被第三方独立核对。Instinct 的 3.5 亿美元没有产出任何同等的、可独立验证的产物。
4. **把产品做完是便宜的部分，而且现在是资本问题，不是科研问题。** 我们剩下的工作（第五至第七部分）是在已验证轨道上的组合——原子能力、撤销、自然语言意图、自托管推理。这正是种子资金能够加速的事情。

**宣布募集 100 万–200 万美元是否公平？是的——但要用诚实的框架：**
- 这是相对于竞争对手 3.5 亿美元的种子规模融资，对应一份公开的具体路线图（R1–R4 产品、H1–H3 基础设施、具名试点）——不是开放式烧钱。
- 应该这样说："30 万美元建成了竞争者无法事后加装的治理层；接下来的 100 万–200 万美元在其之上把代理做完——每一步都可验证，因为每个动作都附带您可以核对的凭证。"
- 不应这样说：任何暗示 100–200 万美元就能达到 Instinct 规模或 25 亿美元估值的说法。我们的融资演示已经如实说明（必需资金约 51.4 万美元；100–200 万美元是含试点、中马部署与市场建设的加速方案）。后续融资速度取决于业绩，而不取决于公告本身。
- 这个框架之所以站得住脚，正是因为社区可以核对它背后的每一张凭证。

**真实样本链接——直接点击查看（取自 2026-09-19 实时数据库的真实记录）：**
- 一张真实的签名凭证，无需登录——一个经主人批准的"线索跟进草稿"受治理动作：https://aixin-sandbox.lovable.app/verify/sip_6a58802867f4
- 它的 BSC 测试网锚定交易（区块 131,741,208，链 ID 97）：https://testnet.bscscan.com/tx/0x025b48af97fcb389d5dc4366448e0ece686f51049a971d7151adc5e1f47b4d15
- 它的 ERC-8004 代理身份交易：https://testnet.bscscan.com/tx/0x0468fe647f71527c662ed6bbd95dd9698eb2b7f2031789a5f7c41167b5b49109
- 它的链上验证记录（验证者评分 80）：https://testnet.bscscan.com/tx/0xd9e649f8c01d8df03a25e39deee03031f7e739f19b9f542b157883163c751dd2
- 同一动作的决策卡与完整治理轨迹位于 https://aixin-sandbox.lovable.app/dashboard/tasks/628a8bfc-1ebe-49c6-84dd-5c038b2c5879 —— **仅限属主账号，这是设计使然**：任务只对属主可见，其他人会看到"未找到任务"。这种隐私本身就是产品的一部分。社区会议时请属主共享屏幕演示此页；对读者而言，上面的公开验证页就是免登录的等效证明。
- 用于离线验签的 Ed25519 公钥：https://aixin-sandbox.lovable.app/api/public/keys

**100 万–200 万美元的用途（以 150 万美元为中位示例；与 AIXIN_PLAN_2026H2 一致：51.4 万美元为必需底线，100–200 万为加速方案）：**

| 用途 | 占比 | 换来什么 |
| --- | --- | --- |
| 产品完成——R1–R4 | 约 40% | 原子能力层、补偿登记 + 撤销、目标白名单、自然语言意图 + 未达成日志：让 AiXin 在"易用"上与 Instinct 持平（随心表述、组合成计划），同时在"问责"上保持领先 |
| GPU 硬件 + 自托管推理（H1） | 约 12% | 一台自有推理节点（4 张 L20/L40S 级 GPU）或 12 个月云 GPU 试点，用 Qwen 承担孪生推理——把最大的可变成本（按 token 计费）转为固定产能 |
| 中国 + 马来西亚部署（H2–H3） | 约 10% | 国内端点（DashScope/DeepSeek）、区域托管、微信/企业微信与 WhatsApp 类通道适配器、数据驻留合规 |
| 具名试点（邦邦 + 2–3 家中小企业/个体） | 约 15% | 入驻、支持，以及投资者下一步要看的案例证据 |
| 安全 + 智能合约审计储备（关口 2） | 约 10% | 任何代币决策前的独立审计——代币工作以审计为前提，绝不宣称已上线 |
| 社区、市场与商务拓展 | 约 8% | 技能市场商业化、社区领袖赋能、开发者 API 合作 |
| 缓冲 | 约 5% | 汇率、硬件交期、试点超支 |

**这笔资金换来的"持平且更强"：** 在关键体验上与 Instinct 持平——一次对话、随心表述、交付完成的结果；在企业最在意的地方领先——每个动作皆把关、签名、锚定、可撤销（在可撤销处），且任何人可验证。硬件被刻意纳入：拥有推理产能既是成本护城河（覆盖面扩大时每个受治理动作的成本下降），也是数据驻留护城河（中国与马来西亚部署在本国境内运行）。

### 第四部分 — 我们的差异化与护城河（每条附可验证链接）

这些是 Instinct 没有的——而且按其目标（极致便利、消费者愉悦）结构性上不会优先做的：

1. **签名、锚定、公开可验证的凭证** 🟢——任何人无需账号即可核对：https://aixin-sandbox.lovable.app/proof（实时计数，每张凭证链至其验证页）与 https://aixin-sandbox.lovable.app/api/public/keys（用于离线验签的 Ed25519 公钥）。*对投资者为何重要：* 尽职调查通常只能相信创业公司的自述数字；我们的数字无需问我们即可在链上核对——一个能被验证的 71，胜过一张写着 71,000 却无法核实的幻灯片。确认弹窗一周就能做出来；一年可验证的凭证无法补出来。
2. **关口是代码，不是政策** 🟢——确定性校验、风险分级与决策卡是有测试的普通代码；模型无法说情绕过。任一任务上可见完整的受治理流程 🔒 https://aixin-sandbox.lovable.app/dashboard/tasks。*为何重要：* AEPD 对首例代理泄露的分析强调的正是这一点——代理风险"无法仅靠人工干预来管理"（[SecurityWeek](https://www.securityweek.com/first-agentic-ai-data-breach-reported-to-spanish-regulator/)）。模型无法绕过的关口，正是对该发现的架构级回答。
3. **四条写进代码的铁律** 🟢——邮件只起草（公开的零计数：https://aixin-sandbox.lovable.app/proof）、资金必批准、回答必引用 🔒 https://aixin-sandbox.lovable.app/dashboard/qa、记忆限定用途且可查 🔒 https://aixin-sandbox.lovable.app/dashboard/memory。*为何重要：* 欧盟《AI 法案》把人工监督（[第 14 条](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-14)）和自动日志（[第 12 条](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-12)）列为高风险 AI 的法律要求——我们的铁律就是这些要求，且已在运行。
4. **安全的开放技能市场** 🟢——技能只承载方法、不承载权限；权限只存在于受治理的能力层 🔒 https://aixin-sandbox.lovable.app/dashboard/skills。*为何重要：* 它让能力像应用商店一样增长，而不扩大攻击面——这正是 Instinct 的宽权限模式结构性缺失、也是监管者首先审查的性质。
5. **ERC-8004 代理身份** 🟢——凭证携带可验证的代理身份，每个验证页可见（示例身份交易：https://testnet.bscscan.com/tx/0x0468fe647f71527c662ed6bbd95dd9698eb2b7f2031789a5f7c41167b5b49109）。*为何重要：* 任何事故之后的第一个问题都是"这是哪个代理干的、谁负责？"——AEPD 的泄露通报正是一起无法归因的代理事件。我们交付的就是可归因性。
6. **合规即架构**——欧盟《AI 法案》（罚金至 3500 万欧元/全球营收 7%，[第 99 条](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-99)；执法权 2026 年 8 月已生效）、中国 AI 治理规则、马来西亚数据保护框架，以及 [ISO/IEC 42001:2023](https://webstore.iec.ch/en/publication/90574)（首个国际 AI 管理体系标准）的管理体系规范：都指向人工监督、日志、可追溯、问责。AiXin 的架构从第一天起就是这个方向。**必须在台上诚实说明：** 我们宣称的是合规对齐工作进行中与可验证性——绝不宣称已获认证。*为何重要：* 企业与监管者按这些条款采购；凭证已满足这些条款的产品，将跳过竞争对手绕不开的合规改造。
7. **业务优先的分发** 🟢——个体企业每周都在跑的任务——催收发票、收件箱整理、线索跟进、夜间巡查、店面晨报——每项都带着执行器、风险分级与凭证上线 🔒 https://aixin-sandbox.lovable.app/dashboard/jobs。*为何重要：* 企业为可问责的结果付费，而非为惊喜付费；这里的付费意愿是真实的，且每个付费任务都会再铸造一张可验证凭证，持续加固第一条护城河。

我们立场的诚实表述：**Instinct 要求您信任它；AiXin 用行动自证——并把链接交到您手上。**

### 第五部分 — 未来数周：让 AiXin 更强大（PAA 采纳计划）

我们近期完成了一次深度架构研究（对照 Personal Agent Architecture——可信赖代理论题最清晰的表达）。我们按以下顺序采纳其最好的思想：

1. **原子能力层** 🔵——约 15–20 个受治理的原语（读取集合、发消息、建草稿、付款、设定时器、请示人类……）。每个任务都由原语组合而成；用户像写菜谱一样创作技能，无需写代码；平台靠组合增长能力，而非逐个工程开发。现有执行器成为首批由原语支撑的技能——用户侧零回归。
2. **补偿登记 + 撤销** 🔵——任何可逆动作执行前先记录其撤销方式。决策卡将显示：会发生什么、代价是什么、**如何撤回**。这是与 Instinct 可见的区别：不是"先问您"，而是"您随时可以撤销"。
3. **已知目标白名单** 🔵——收款方、收件人、URL 一律不得来自不可信内容。提示注入防御从"判断题"变成"数据库查询"。
4. **自然语言意图** 🔵——用自己的话说"催收我的未付发票"；孪生从技能与原语组合出计划；缺什么就明确指出差距并给出补齐路径，并记录每次"未达成"以驱动我们下一步建什么。
5. **升级纪律与带过期时间的常设授权** 🔵——确认尊重您的注意力；权限有范围、会过期。

目标：数周之内，同一条治理轨道——更广的真实世界权限，背后是撤销机制与目标白名单。

### 第六部分 — 未来数周：从云托管到中国与马来西亚自托管

模型成本是任何代理平台最大的运行成本。我们的优化与本地化路径：

1. **模型无关的执行** 🟢——技术栈已支持任意 OpenAI 兼容端点（今天用 Lovable AI 网关；自托管时用本地 Qwen、DashScope 或 DeepSeek）。治理——SIP、签名、锚定、凭证——是确定性代码，与用哪个模型无关。
2. **自托管 GPU 试点** 🔵——在自己的基础设施上以 Docker 部署（今天即可跑 Ubuntu/阿里云；操作手册已备），用 Qwen 承担孪生推理，成本仅为按 token 云计费的零头。各工作负载的推荐模型已写入文档。
3. **中国部署** 🔵——国内端点（DashScope/Qwen、DeepSeek）、中国友好托管、微信/企业微信通道适配器已在路线图上；数据驻留符合中国规则。
4. **马来西亚部署** 🔵——区域托管与同一适配器接缝（经官方 API 的 WhatsApp 类通道），符合马来西亚数据保护要求。
5. **成本效果** 🔵——自托管推理把最大的可变成本从按 token 计费转为固定 GPU 容量；配合能力层，每个受治理动作的成本下降，而覆盖面扩大。

### 第七部分 — 路线图一览

```text
现在（🟢 已上线——亲自验证：https://aixin-sandbox.lovable.app/proof）
  受治理代理：SIP 关口 · 决策卡 · Ed25519 凭证 · BSC 锚定
  真实任务：催收发票 · 收件箱整理 · 线索跟进 · 夜间巡查
  入口：仪表盘 · Telegram 控制室 · 公开证明页 · 开发者 API

数周内（🔵 采纳 PAA）
  R1 原子能力层        → 技能变为组合，用户自由创作
  R2 补偿登记 + 撤销    → 每个可逆动作都能"撤回"
  R3 目标白名单         → 注入免疫的动作目标
  R4 自然语言意图 + 未达成日志 → 随心表述，组合成计划，按需求决定建设顺序

本季度（🔵 基础设施 + 市场）
  H1 自托管 GPU 试点（Qwen）→ 模型成本优化，环境配置已模型无关
  H2 中国部署              → 国内端点、微信通道、数据驻留
  H3 马来西亚部署          → 区域托管、本地化通道
  G   关口：测试网完成 → 协议/审计 → 商业化 + 技能/组合 → TGE 决策
      （代币工作以审计关口为前提，绝不宣称已上线）

融资
  种子加速轮：100 万–200 万美元 → 交付 R1–R4 + H1–H3 + 具名试点
  每一分钱的产出都可在 /proof 验证——本赛道唯一一场
  进展可由投资者在链上自行核对的融资。
```

### 结语

Instinct 的融资是市场在确认"能行动的代理"就是未来。我们的论题是另一半：**替企业行动的代理，必须证明自己做了什么。** 这一半还没有 25 亿美元的赢家——而来自欧盟、中国、马来西亚及全球的每一个监管信号，都在向我们这边移动。Instinct 要求信任；AiXin 自证其行——本文档中的每一个链接都是证据。请与我们一同建设企业终于可以托付的代理。

---

## Build steps after approval

1. Save the draft verbatim as `AIXIN_VS_INSTINCT_COMMUNITY_UPDATE.md` at the project root.
2. Mirror it to both repos (aixin-protocol + aixin-twin) via the existing mirror endpoint.
3. No ROADMAP.md changes in this pass — the R/H phases above already match the plan structure; fold R1–R4 and H1–H3 into ROADMAP.md when their build starts (mirror immediately after, per standing rule).
4. Before presenting: re-read the live /proof counters and confirm every linked route still resolves; the funding figures in Part 3 were checked against 2026-08-26/27 press (TechCrunch, WSJ via SiliconANGLE/PYMNTS, Forbes via IBTimes) — re-check if presenting weeks later; no other numbers may be added without a live source.
5. Note for sign-in links (🔒): a reader without an account sees the sign-in page first; consider a read-only demo account for the community call if you want click-through access.
