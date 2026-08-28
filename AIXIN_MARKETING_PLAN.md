# AiXin Marketing Plan — Sep to Dec 2026

> Authored 2026-08-28. Companion to [`AIXIN_PLAN_2026H2.md`](./AIXIN_PLAN_2026H2.md)
> (roadmap + budget) and [`ROADMAP.md`](./ROADMAP.md).
> Marketing budget: **US$27,900–79,700** (mid ≈ US$53,800), phased to the same five gates.
>
> Rule for every asset in this plan: **nothing is claimed that the product cannot demonstrate.**
> Features are labelled 🟢 Live / 🟡 Sandbox / 🔵 Planned in public material, exactly as in the
> Academy. Targets below are internal planning targets, not forecasts or promises to investors.

---

## 1. Positioning

**AiXin is the trust layer for agentic AI.**

Other products race to make agents more capable. AiXin makes agent actions *acceptable to a
sceptical third party*: every consequential action passes LLM intent → deterministic validation →
human approval on an evidence-rich Decision Card → an Ed25519-signed receipt anchored to chain.
Approvals and rejections are both signed. When no live adapter can perform the action, the run
halts as `blocked` and the output is labelled "draft — not executed" instead of faking success.

One-line pitch: **"Your twin does the work. The receipt proves it."**

| Dimension | AiXin | Capability-first agents (OpenClaw, Hermes, DeepSeek Harness) |
| --- | --- | --- |
| Optimises for | Evidence a sceptic accepts | Capability and runtime composability |
| Approval | The product: fail-secure, evidence-rich, signed either way | A plugin or a policy setting |
| When no tool can do the job | Halts, labels output a draft | Usually returns confident prose |
| Audit trail | Signed receipts, anchored, publicly verifiable | In-process logs |
| Relationship | A trust layer that can run *on top of* a harness | The harness itself |

That last row is the whole strategy: we do not compete with harnesses, we govern them. It is why
`dsh` appears on the roadmap as an optional runtime rather than a rival.

## 2. Audiences and the message each one needs

| Audience | What they care about | Message | Proof asset |
| --- | --- | --- | --- |
| China SMB / OPC operators | Hours and money saved this month | "Delegate the weekly grind; approve the risky part in one tap." | ROI calculator (`/learn/roi`), Daily Briefing arriving on their own phone |
| Education (BangBang) | Safety, parent trust, teacher workload | "Every AI action a parent sees is logged, signed and reviewable." | Trial case study, Progress Report with a verifiable receipt |
| Web3 / crypto-native | Verifiability, on-chain proof | "Read the graph. Verify the receipt. Don't trust us." | Trust Graph explorer, public `/verify/:sipId` links |
| Skill creators | Can I earn from this? | "Publish a skill, get paid per install and per run." | Marketplace commerce, creator earnings page, template library |
| Investors | Is the usage real? | "Anchored receipts are a metric you can audit yourself." | Monthly transparency report, BscScan links, delivery logs |
| Community leaders / trainers | Can I teach this correctly? | "Here is the curriculum, with truth labels so you never over-promise." | Academy, `AIXIN_EDUCATION.md`, `AIMA_TRAINING_V2.md` |

## 3. Phased campaign

### Sep — Proof phase (Gate 1)
The goal is one thing: replace claims with links.

- **Live testnet demo film** (3–4 min): intent → Decision Card → signed receipt → BscScan. No cuts.
- **Verifiable receipt links** published with every claim — `/verify/:sipId` is public.
- **Academy launch push** across community channels; trainer track for Dr. Aima's cohort.
- **Skill-creator recruitment**: open call, template library, 1:1 onboarding for the first 20.
- **BangBang trial comms**: parent and teacher onboarding, weekly case-study capture.
- Metrics: 500 anchored receipts · 100 active trial families · 20 recruited creators.

### Oct — Trust phase (Gate 2)
- **Trust Graph explorer launch** — the flagship developer/investor moment.
- **AIP-3 / AIP-4 / AIP-5 publication** with a short plain-language explainer per AIP.
- **"Audit engaged" announcement** — name the scope, not just the intent.
- **Three use-case videos**: Operations, Finance, Tutor — each a real run with a real receipt.
- Metrics: 1,000 graph queries · repo stars · 3 published case studies.

### Nov — Creator phase (Gate 3)
- **Marketplace opens** with paid skills, entitlements and payouts.
- **Creator earnings story**: real numbers from the first payouts, no projections.
- **Template library push** — the six Specialist Twin bundles as one-click starts.
- **Referral loop**: creators earn on installs; operators earn on referred runs.
- Metrics: 30 skills published by people outside the core team · first payout executed.

### Dec — IDO phase (Gate 4)
- **Token narrative tied to usage**, in this order: receipts anchored → runs executed → skills
  published → paying pilots → *then* the token. Never the reverse.
- **AMA circuit** across CN and global channels; one technical AMA on the audit report.
- **Listing announcement** and launch-week content calendar (day-by-day, prepared in Nov).
- **Transparency page** live before the sale: what is 🟢 Live, what is 🔵 Planned, what the money funds.
- Metrics: 5,000 waitlist · sale participation · listing executed.

### Dec — Post-launch (Gate 5)
- Community governance kickoff; monthly transparency report becomes routine.
- Support rota published so response expectations are explicit.
- Metrics: 1,000 monthly active twins.

## 4. Channels

| Channel | Role | Cadence |
| --- | --- | --- |
| WeChat official account + Mini Program | Primary China surface; BangBang distribution | 2 posts/week |
| X / Twitter | Global protocol and token narrative | Daily during Oct–Dec |
| Telegram | Community HQ, support, AMA hosting | Continuous |
| Discord | Skill creators and developers | Continuous |
| GitHub | Credibility: specs, SDKs, reference app, roadmap | Every release |
| Chinese dev communities (掘金, CSDN, 知乎) | Technical reach | 1 long-form/month |
| Email / waitlist | Owned audience for the sale | Weekly from Oct |

Every asset ships bilingual EN + ZH on the same day. A ZH asset that lags the EN one is treated as
a bug, consistent with the project's standing i18n quality gate.

## 5. Metrics — measured from the product, not from a slide

Each number is read from existing tables, so it cannot be inflated:

| Metric | Source | Sep | Oct | Nov | Dec |
| --- | --- | --- | --- | --- | --- |
| Anchored receipts | receipt + anchor records | 500 | 1,500 | 3,500 | 8,000 |
| Runs executed | `run_usage` | 800 | 2,500 | 6,000 | 15,000 |
| Skills published (external) | marketplace | 0 | 5 | 30 | 60 |
| Deliveries succeeded | `delivery_logs` | 400 | 1,200 | 3,000 | 7,000 |
| Active twins (monthly) | twins + tasks | 150 | 350 | 700 | 1,000 |
| Waitlist | landing | 800 | 2,000 | 3,500 | 5,000 |
| Paying pilots | commerce | 0 | 2 | 8 | 15 |

## 6. Budget allocation

| Line | Low | High | Timing |
| --- | --- | --- | --- |
| KOL + community campaigns (CN + global) | 15,000 | 40,000 | Oct–Dec |
| Content production (video, demo films, case studies) | 4,000 | 10,000 | Sep–Dec |
| Waitlist landing + CRO copy | 400 | 700 | Sep |
| Translation + bilingual asset pass | 1,500 | 4,000 | Sep–Dec |
| Events / AMA circuit (optional) | 4,000 | 15,000 | Nov–Dec |
| Paid acquisition experiments (optional) | 3,000 | 10,000 | Nov–Dec |
| **Total** | **27,900** | **79,700** | |

Optional lines are cut first if funding is tight; the proof-phase assets are not optional because
they are what makes every later claim checkable.

## 7. What we will not do

- No token price talk, no yield promises, no "AI agent economy" projections without a source.
- No demo of 🔵 Planned features — deterministic replay in particular stays off every stage until
  it ships.
- No screenshots of simulated balances presented as real earnings; the ledger preview is labelled
  as a preview until it is migrated at Gate 5.
- No claim of an audit before the report exists.

---

# 中文版

## 1. 定位

**AiXin 是智能体 AI 的信任层。**

其他产品竞相让智能体更强；AiXin 让智能体的行为**能被持怀疑态度的第三方接受**：每一个重大动作都经过
自然语言意图 → 确定性校验 → 证据充分的决策卡人工批准 → Ed25519 签名回执并上链锚定。批准与拒绝都签名。
当没有可用外部工具连接时，运行以 `blocked` 中止，产出标记为「草稿 —— 未执行」，而不是伪装成功。

一句话：**「你的孪生完成工作，回执负责证明。」**

我们不与执行框架（OpenClaw、Hermes、DeepSeek Harness）竞争，而是治理它们 —— 这也是 `dsh`
在路线图中作为可选运行时、而非竞品出现的原因。

## 2. 受众与信息

| 受众 | 关注点 | 信息 | 证据 |
| --- | --- | --- | --- |
| 中国中小企业 / 一人公司 | 本月省下的时间与钱 | 「把每周重复劳动交出去，风险动作一键批准。」 | ROI 计算器、真实到手机的每日简报 |
| 教育（BangBang） | 安全、家长信任、教师负担 | 「家长看到的每一个 AI 动作都可记录、可签名、可复核。」 | 试点案例、带可验证回执的进度报告 |
| Web3 / 加密原生 | 可验证性、链上证明 | 「查图谱、验回执，不必信我们。」 | 信任图谱浏览器、公开 `/verify/:sipId` |
| 技能创作者 | 能否赚钱 | 「发布技能，按安装与运行分成。」 | 市场交易、创作者收益页、模板库 |
| 投资人 | 使用数据是否真实 | 「锚定回执是你可以自己审计的指标。」 | 月度透明报告、BscScan 链接、投递日志 |
| 社区领袖 / 讲师 | 能否讲对 | 「课程已备好，并带真实标签，绝不夸大。」 | 学院、`AIXIN_EDUCATION.md`、`AIMA_TRAINING_V2.md` |

## 3. 分阶段战役

- **9 月 — 证据阶段（G1）**：测试网实录演示片；每条主张附可验证回执链接；学院上线推广与讲师培训；
  首批 20 位技能创作者招募；BangBang 试点家长/教师上线沟通。
  指标：500 条锚定回执 · 100 个活跃试点家庭 · 20 位创作者。
- **10 月 — 信任阶段（G2）**：信任图谱浏览器发布；AIP-3/4/5 发布并配通俗解读；公布审计签约范围；
  三支用例视频（运营 / 财务 / 辅导），全部为真实运行。指标：1,000 次图谱查询 · 3 篇案例。
- **11 月 — 创作者阶段（G3）**：市场开放付费技能、权益与分成；用首批真实结算数字讲创作者故事；
  六个专家孪生组合作为一键起点；推荐分成闭环。指标：外部发布 30 个技能 · 首次分成落地。
- **12 月 — IDO 阶段（G4）**：代币叙事严格建立在真实使用数据之上（回执 → 运行 → 技能 → 付费试点 →
  才是代币）；AMA 巡回，含一场关于审计报告的技术 AMA；上市公告与发行周日历；售前上线透明页，
  明确标注 🟢 已上线 / 🔵 规划中。指标：5,000 名候补名单。
- **12 月 — 上线后（G5）**：社区治理启动；月度透明报告常态化；公布支持轮值。指标：1,000 个月活孪生。

## 4. 渠道

微信公众号 + 小程序（中国主阵地，每周 2 篇）、X/Twitter（10–12 月每日）、Telegram（社区总部与 AMA）、
Discord（创作者与开发者）、GitHub（每次发布）、中文技术社区（每月一篇长文）、邮件候补名单（10 月起每周）。
所有素材中英同日发布 —— 中文滞后视为缺陷。

## 5. 指标（读自产品，不读自幻灯片）

锚定回执、运行次数、外部发布技能数、成功投递数、月活孪生、候补名单、付费试点 —— 全部来自现有数据表，
9/10/11/12 月目标见英文表格。以上为内部规划目标，不构成对投资人的预测或承诺。

## 6. 预算

KOL 与社区 15,000–40,000；内容制作 4,000–10,000；候补落地页与文案 400–700；翻译与双语素材 1,500–4,000；
活动与 AMA（可选）4,000–15,000；付费投放（可选）3,000–10,000。**合计 27,900–79,700 美元。**

## 7. 我们不做的事

不谈币价、不承诺收益、不引用无来源的行业预测；不演示 🔵 规划中的功能（尤其是确定性回放）；
不把模拟余额当作真实收益展示；审计报告出来之前不宣称已审计。
