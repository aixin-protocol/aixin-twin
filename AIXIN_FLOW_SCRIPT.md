# AiXin — Presenter Scripts for the Two Flow Diagrams

Companion to `AIXIN_EDUCATION.md`. Two speaking scripts, English first, then 中文.
Say the **bold** lines out loud; the italic lines are your own notes, not for the audience.

Truth labels used: 🟢 live today · 🟡 in the sandbox by 31 Aug 2026 · 🔵 planned mid-Sep 2026.

---

## Diagram A — The Ten-Step Operational Journey (sign-up → verified receipt)

*Total speaking time: 8–10 minutes. One breath per box. Never skip the diamond — that box is the product.*

### Opening (20 seconds, before you point at anything)

> **"This chart is one user, one real task, from the moment they sign up to the moment a total stranger can verify what happened. Ten steps. Nine of them look like any normal app. The one in the middle — the diamond — is the only reason AiXin exists."**

### Step-by-step narration

| Box | What you say | Note to self |
|---|---|---|
| **1. Sign up · /auth** | **"You create an account. Email and password, or Google. Nothing about you is on-chain — only your actions will be."** | Pre-empt the privacy question here, once, so it doesn't come back later. |
| **2. Hatch Master Twin · /onboarding** | **"Your first twin is the Master Twin — we call her AiXin. She is not a chatbot; she is a manager. She never does the work herself, she decides who does it and whether it is allowed."** | The org-chart analogy starts here and must stay consistent all the way down. |
| **3. Create Specialist · /dashboard/specialists** | **"Now you hire a staff member — a Specialist Twin. Finance, marketing, support, whatever your business actually needs. Each one has a role and a boundary."** | If asked "how many?" — start with one. |
| **4. Install Skill + consent · /dashboard/skills** | **"A skill is a capability with a written manifest — what it can do, what tools it needs, what it must never touch. You see that manifest and you consent before it is installed. No silent permissions."** | Point out the word *consent* on the box. This is where "how do I know it won't overreach" is answered. |
| **5. Assign skill to Specialist** | **"Installing gives you the skill. Assigning gives one named specialist the right to use it. Those are two separate decisions on purpose."** | This separation is the answer to "can a rogue skill act on its own?" — no, it needs an assignment. |
| **6. Connect and test adapter · /dashboard/adapters** | **"An adapter — 外部工具连接 — is the wire to the real world: Telegram, Gmail, a signed webhook, WeChat, the blockchain. You connect it and you press Test. If there is no live, tested adapter, the twin cannot reach the outside world at all."** | Say the last sentence slowly — it's the honesty guarantee. |
| **7. Delegate intent · /dashboard/ask** | **"Now the user simply types what they want in plain language. 'Refund the order for this customer.' That sentence is an *intent* — a request, not a command that runs."** | Emphasise: typing it does nothing yet. |
| **SIP validation — 6 deterministic rules** *(the diamond)* | **"Here is the heart of it. Before anything can happen, the intent is turned into structured data and checked by six fixed rules — is the action one we recognise, is the amount sane and under the hard cap, is the currency valid, are the parameters well-formed, are there any extra fields that shouldn't be there. This is code, not a model. The same intent gets the same verdict every time, and anything unknown fails closed — it is treated as high risk, not waved through."** | If you say one thing they remember, say: *"the checker is not the AI."* |
| **low risk → 9. Auto-execute** | **"If it is genuinely routine and low risk, it runs — and it still leaves a record."** | |
| **medium / high risk → 8. Decision Card** | **"Anything that spends money, sends something on your behalf, or touches the outside world stops here and becomes a Decision Card: what was asked, what the evidence says, what the system recommends, and why. Nothing has been written yet."** | This is the demo moment — show a real card if you have signal. |
| **approve / reject + reason → Sign Ed25519 receipt + anchor BSC Testnet** | **"You approve or you reject — and both are recorded. A rejection is signed too, with your reason. If you approve against the recommendation, you are asked for an override rationale. Then the decision is cryptographically signed and anchored to the BNB Smart Chain testnet. 🟢"** | The most persuasive fact in the whole deck: *rejections get receipts too.* |
| **9. Auto-execute** | **"Only now does the work actually happen, through the adapter you tested in step 6."** | |
| **Outcome + delivery logs** | **"You see the outcome and the delivery log — was the email actually sent, did the webhook return 200. No pretending."** | |
| **10. Anyone verifies · /verify/:sipId** | **"And this is the finish line. A public link. No account, no login. Your client, your auditor, your regulator opens it and checks the signature and the chain record themselves. They don't have to trust the AI, and they don't have to trust us."** | Close on this box. Hand the phone over and let someone else open it. |

### Closing line

> **"Nine steps of ordinary software, one diamond of governance, and a receipt at the end that outlives the conversation. That's AiXin: not a smarter agent — an accountable one."**

### If the demo misbehaves (say it out loud, don't hide it)

- Task shows **BLOCKED / no live adapter** → **"Perfect — this is the system refusing to fake success. No tested adapter, no action."**
- Anchor shows **pending** → **"The signature exists now; the chain confirmation is queued and retried. Signed first, anchored second."**
- Twin asks for approval on something small → **"It errs toward asking. That's the setting we chose."**

---

## Diagram B — The Capability Map (who talks to whom)

*Total speaking time: 4–5 minutes. This one is architecture, not sequence — trace the arrows, don't count steps.*

### Opening

> **"The first chart was time. This one is structure — who is allowed to talk to whom. Read it top to bottom, and watch the dotted lines, because that's where the governance lives."**

### Node-by-node narration

| Node / arrow | What you say |
|---|---|
| **User / 用户 → intent 意图** | **"Everything starts as a human intent. Not a script, not a cron job — a person saying what they want."** |
| **Master Twin (AiXin) — orchestrates** | **"The Master Twin receives it. Her job is triage and delegation: understand the request, decide which specialist owns it, and never act directly."** |
| **A2A delegation 委派 → Specialist Twins (Finance / Marketing)** | **"She delegates agent-to-agent to a Specialist Twin. Each specialist is scoped — Finance can't run your marketing, Marketing can't move money. Scope is enforced in code, not by prompt politeness. 🟡"** |
| **Specialist Twin → Skill 技能 (SKILL.md manifest)** | **"A specialist can only use skills you installed and assigned to her. Each skill carries a manifest — its declared capabilities and limits — and the manifest is what the platform enforces."** |
| **Skill → 外部工具连接 Adapters (Telegram · Gmail · Webhook · WeChat · BSC)** | **"Skills reach the world only through adapters. Five today. If the adapter isn't connected and tested, the chain stops here and the run is blocked."** |
| **Adapters → Real world 真实世界** | **"And here is the only door to reality — messages, emails, API calls, chain writes. One door, and it's instrumented."** |
| **Dotted lines → SIP governance kernel 治理内核** | **"Now the important part. See the dotted lines from the Master Twin, from every specialist, and from the skills — every one of them runs through the SIP governance kernel. There is no side path. A skill cannot buy itself a cheaper route to execution than an explicit delegation gets."** |
| **"every consequential action 每个重要动作"** | **"Not every keystroke — every *consequential* action. Reading a price is cheap. Sending money, publishing, emailing a client: those all hit the kernel and may stop for your approval."** |

### The one-sentence takeaway

> **"Capability flows downward — user, manager, specialist, skill, adapter, world — but governance cuts across every layer. That's the difference between an agent that can do a lot and a platform you can put your name on."**

### Comparison answer, if someone asks "isn't this just OpenClaw / Hermes?"

> **"Those are autonomy-first assistants: the goal is to act with as little friction as possible, and there is no receipt at the end. AiXin is governance-first: approval and proof are the product, not the overhead. Same tools, different pipeline — and a signed record either way."**

---

# 中文版

## 图一 —— 十步操作流程（注册 → 可验证回执）

*讲解时长：8–10 分钟。每个方框讲一口气。中间的菱形不能跳过——那才是产品本身。*

### 开场（20 秒）

> **「这张图讲的是一个用户、一件真实的任务，从注册到一个完全不认识你的人也能自己验证发生了什么。一共十步。其中九步看起来跟普通应用没区别。中间那个菱形，才是 AiXin 存在的唯一理由。」**

| 方框 | 讲解词 | 备注 |
|---|---|---|
| **1. 注册 · /auth** | **「先注册账号：邮箱密码，或者用 Google。你的个人信息不会上链——上链的只有行为记录。」** | 在这里一次性回答隐私问题。 |
| **2. 孵化主孪生 · /onboarding** | **「第一个孪生是主孪生，我们叫她 AiXin。她不是聊天机器人，她是管理者：自己不干活，只负责决定谁来干、以及这件事是否被允许。」** | 组织架构的比喻从这里开始，全程保持一致。 |
| **3. 创建专家孪生 · /dashboard/specialists** | **「接着你'招人'——创建专家孪生。财务、市场、客服，看你的业务真正需要什么。每一个都有角色，也有边界。」** | 建议先从一个开始。 |
| **4. 安装技能 + 授权同意 · /dashboard/skills** | **「技能都带一份 SKILL.md 说明书：能做什么、需要哪些工具、绝对不能碰什么。你先看到说明书，同意之后才安装。没有偷偷拿到的权限。」** | 强调"同意"两个字。 |
| **5. 把技能分配给专家孪生** | **「安装 = 你拥有这个技能；分配 = 某一位指定的专家才有权使用它。这是刻意分成两个决定的。」** | 回答"技能会不会自己乱来"——不会，它必须被分配。 |
| **6. 连接并测试外部工具连接 · /dashboard/adapters** | **「外部工具连接就是通向现实世界的那根线：Telegram、Gmail、签名 Webhook、微信、区块链。连上之后必须点'测试'。没有已连通、已测试的连接，孪生根本触达不到外部世界。」** | 最后一句慢一点讲——这是"诚实执行"的保证。 |
| **7. 下达意图 · /dashboard/ask** | **「用户只需要用日常语言说出想要什么：'给这位客户的订单退款'。这句话是一个*意图*——是请求，不是马上执行的命令。」** | 强调：光打字什么都不会发生。 |
| **SIP 校验 —— 6 条确定性规则**（菱形） | **「核心在这里。意图先被转成结构化数据，再由六条固定规则检查：动作是不是我们认识的、金额是否合理并低于硬性上限、货币代码是否合法、参数格式是否正确、有没有不该出现的多余字段。这是代码，不是模型。同样的意图每次得到同样的结论；任何看不懂的东西一律判为高风险——失败即关闭，绝不放行。」** | 只让他们记住一句：**「做校验的不是 AI。」** |
| **低风险 → 9. 自动执行** | **「确实是常规低风险的，就直接执行——但依然留下记录。」** | |
| **中/高风险 → 8. 决策卡** | **「凡是花钱、代表你对外发送、或者触碰外部世界的动作，都在这里停下来变成一张决策卡：请求是什么、证据是什么、系统建议怎么做、为什么。此刻还没有写入任何东西。」** | 这是演示的高光时刻。 |
| **批准 / 拒绝 + 理由 → Ed25519 签名回执 + 锚定 BSC 测试网** | **「你可以批准，也可以拒绝——两者都会被记录。拒绝同样会被签名，并附上你的理由；如果你要批准一个系统建议拒绝的动作，系统会要求你填写覆盖理由。随后这个决定被加密签名，并锚定到 BNB 智能链测试网。🟢」** | 全场最有说服力的一句：**拒绝也有回执。** |
| **9. 自动执行** | **「到这一刻，工作才真正通过第 6 步测试过的连接发生。」** | |
| **结果 + 投递日志** | **「你能看到结果和投递日志：邮件到底发出去了没有、Webhook 是否返回 200。不演戏。」** | |
| **10. 任何人可验证 · /verify/:sipId** | **「这是终点线：一个公开链接。不需要账号、不需要登录。你的客户、审计师、监管方自己打开，自己核对签名和链上记录。他们不必信任 AI，也不必信任我们。」** | 结尾就落在这一格，把手机递给现场任意一个人打开。 |

### 收尾

> **「九步普通软件，一颗治理菱形，最后留下一张比这场对话活得更久的回执。这就是 AiXin：不是更聪明的智能体，而是负得起责任的智能体。」**

### 演示出状况时（照实说）

- 任务显示 **BLOCKED / 无可用连接** → **「太好了，这正是系统拒绝伪装成功：没有测试过的连接，就不动作。」**
- 锚定显示 **pending** → **「签名此刻已经存在，链上确认在队列里自动重试。先签名，后上链。」**
- 小事也要审批 → **「它宁可多问一次。这是我们主动选的设定。」**

---

## 图二 —— 能力地图（谁可以和谁对话）

*讲解时长 4–5 分钟。这张是结构图，不是时间线——顺着箭头讲，别数步骤。*

### 开场

> **「上一张讲的是时间，这一张讲的是结构：谁有权和谁对话。从上往下看，重点看虚线——治理就住在虚线里。」**

| 节点 / 箭头 | 讲解词 |
|---|---|
| **用户 → 意图** | **「一切从人的意图开始。不是脚本，不是定时任务，是一个人说出他想要什么。」** |
| **主孪生 AiXin —— 编排者** | **「主孪生接收意图。她的职责是分派：理解请求、决定归谁负责，并且永远不亲自动手。」** |
| **A2A 委派 → 专家孪生（财务 / 市场）** | **「她通过 A2A 把任务委派给专家孪生。每个专家都有权限范围——财务不能做市场，市场不能动钱。范围由代码强制执行，不靠提示词客气。🟡」** |
| **专家孪生 → 技能（SKILL.md 说明书）** | **「专家只能使用你已安装并分配给她的技能。每个技能都带说明书，声明能力与限制，平台强制执行的正是这份说明书。」** |
| **技能 → 外部工具连接（Telegram · Gmail · Webhook · 微信 · BSC）** | **「技能只能通过外部工具连接触达世界，今天有五种。连接没接好、没测试，链路就在这里停住，任务被阻断。」** |
| **外部工具连接 → 真实世界** | **「这是通往现实的唯一一道门——消息、邮件、API 调用、链上写入。只有一道门，而且全程被记录。」** |
| **虚线 → SIP 治理内核** | **「关键在这里：主孪生、每一个专家孪生、以及技能，全部都有虚线指向 SIP 治理内核。没有旁路。技能不可能给自己买到一条比正式委派更便宜的执行捷径。」** |
| **「每个重要动作」** | **「不是每一次按键，而是每一个*有后果*的动作。查个价格很便宜；付钱、发布、给客户发邮件——这些都会进入治理内核，并且可能停下来等你批准。」** |

### 一句话总结

> **「能力自上而下流动——用户、管理者、专家、技能、连接、真实世界；治理则横切每一层。这就是'能做很多事的智能体'和'你敢署名的平台'之间的区别。」**

### 如果有人问「这不就是 OpenClaw / Hermes 吗？」

> **「那些是自主优先的助理：目标是尽量少摩擦地行动，最后没有回执。AiXin 是治理优先：审批和证明本身就是产品，而不是负担。同样的工具，不同的管道——而且无论批准还是拒绝，都留下签名记录。」**
