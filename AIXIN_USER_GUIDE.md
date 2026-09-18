# AiXin User Guide — From Sign-Up to Your First Real Result
# AiXin 用户指南 —— 从注册到拿到第一个真实结果

> A living guide for new **and returning** users. Updated as the product grows.
> 一份持续更新的指南，面向**新用户和老用户**，随产品迭代不断完善。
>
> Who this is for: anyone — no technical background needed. If you can use a chat app, you can use AiXin.
> 适合所有人 —— 无需任何技术背景。会用聊天软件，就会用 AiXin。
>
> New here? Start at Step 1. **Already registered? Jump to "Welcome back"** in your language below.
> 新用户请从第 1 步开始。**已注册过？请直接跳到下方对应语言的"老用户看这里"。**

---

## English

### What AiXin does, in one paragraph

AiXin gives you digital twins — an AI team that works for you. You have one **Master Twin** (your chief of staff) and **Specialist Twins** (your workers). You tell them what result you want in plain language; they do the work. The special part: **anything important waits for your approval first, and everything they do leaves a signed, verifiable receipt** — like a signed delivery slip you can check any time, even on the public blockchain. Nothing is ever sent from your email; replies are prepared as drafts for you.

### The golden rule to remember

> **Nothing irreversible happens without your approval. Every action leaves a receipt you can verify.**

---

### What's new and improved (since the version ~3 weeks ago)

A quick changelog if you last used AiXin about three weeks ago. Everything listed here is live today.

| New / improved | Where to find it | Why it matters to you |
| --- | --- | --- |
| **Jobs page — "What I can do for you"** | Sidebar → **Jobs** | Pick a finished result instead of designing a skill. One tap sets up the twin and the skill for you. |
| **First real result in ~2 minutes** | Right after hatching your Master Twin (also on the Jobs page) | Two jobs need nothing connected, so you see real work with a receipt immediately. |
| **Build the store team, step by step** | Sidebar → **Build the store team** (`/dashboard/recipe`) | A ten-step walkthrough for someone who has never used an agent, with a live tick per step so it can't claim progress you don't have. See **Step 5d** below. |
| **My store morning round** | Jobs → **My store morning round** | One 07:30 message (text and voice) from four Specialists: orders to ship, money owed, unread customer mail, and what needs your signature. Read-only; a source you haven't connected says so. |
| **Bring my past customers back** | Jobs → **Bring my past customers back** | Finds customers who bought once and went quiet 60+ days ago and drafts one personal note each from their real order facts. Approval-gated, capped per run, one draft per customer ever. |
| **Plain-language rules (new this release)** | Skill builder → step **Rules** | Guardrails are now simple switches and numbers — "always ask me first", "never send, leave a draft", "office hours only", "ask me before spending more than…". No syntax to learn. Advanced users can still switch on **edit the rule text myself**. |
| **"Nothing can carry this one out yet" warning** | Skill builder → final step | You're told honestly at creation time when a skill can't really execute, instead of getting a made-up report later. |
| **Your results so far + Copy my case study** | Bottom of the **Jobs** page | Your real counts of runs, receipts, anchors, approvals and rejections — one tap copies a quotable paragraph. |
| **Public Proof page** | Website footer → **Proof** | Live counters anyone can check: signed receipts, on-chain anchors, approvals honoured, emails sent on your behalf (0, by design). |
| **Run AiXin from Telegram (new this release)** | Your Telegram chat with the bot | Send `/jobs` to see your jobs, `/run 4` to run one, `/pending` to see what needs you, `/approve <code>` or `/reject <code> <reason>` — same approvals, same signed receipts. |
| **"Needs a human" list (new this release)** | Sidebar → **Money** (Business jobs), below your invoices | When a tool refuses — a refund with nothing behind it, an impossible amount — AiXin stops and records it here instead of guessing. Mark it "I'm on it" or "handled". |
| **Enquiries AiXin followed up (new this release)** | Sidebar → **Money**, bottom | Every follow-up AiXin drafted for you, so you can mark what it turned into. The amount is only ever the one you type in. |
| **Build your own app on AiXin (for developers)** | `DEVELOPER_API.md` in the project | Your own app can hand AiXin a job and get back the result with its receipt — money jobs still wait for your approval. |
| **Scheduled runs with voice notes** | Sidebar → **Scheduled runs** | A 06:00 overnight report in your Telegram, spoken aloud if you want it. |
| **Hear your briefing on demand (new)** | Your Telegram chat → send `/voice` | The same report the 06:00 schedule sends, as text plus a real spoken voice note. If speech isn't available it sends the text and says so. |
| **More connections: Outlook, any mailbox, WeChat Work, Feishu, DingTalk, Google Sheets, Stripe (new)** | Sidebar → **External tool connections** | Inbox triage now works on Microsoft 365 / Outlook exactly as on Gmail — read, sort, draft, never send. Your unpaid invoices can be imported from Stripe instead of typed in. Every card has a **Test connection** button that really talks to the provider, so a wrong setting shows as an error instead of silently doing nothing. |
| **Shopify store: order watch + approval-gated refunds (new)** | Sidebar → **External tool connections** → Shopify, then **Jobs** → *Watch my shop orders* | Reads your orders through Shopify's official Admin API (no password stored): paid-but-unshipped after 48h, payments that never arrived, part-refunded orders still in dispute, and the money still waiting to ship. Refunds are separate and always wait for your signed approval. |
| **Webhooks that don't get lost (new)** | Sidebar → **External tool connections** → Webhook | If your receiving system is briefly down, the delivery is parked and retried automatically (1, 5, 15, 60, 180 minutes) instead of disappearing. |
| **Business jobs: invoices, inbox, enquiries, watch** | Sidebar → **Money** and **Jobs** | Chase overdue invoices (approval-gated), triage unread mail into drafts, follow up new enquiries, and a read-only overnight watch. |
| **Answers that refuse rather than guess** | Sidebar → **Answer questions** | Replies come only from material you approved, with citations — or it tells you it doesn't know. |
| **Inspectable memory** | Sidebar → **What it remembers** | Every note shows what it may be used for, how often it was used, and an optional forget-by date. |

---

### Welcome back — what changed for returning users (5 minutes to catch up)

If you registered before and found it hard to make your twin do something meaningful, that feedback was heard. The flow has been rebuilt around **results, not configuration**:

**What's new:**

1. **A Jobs page — "What I can do for you".** In the sidebar, press **Jobs** (wand icon). Each card is a finished result (chase overdue invoices, triage my inbox, follow up enquiries, overnight watch, daily briefing, price outlook) — not a technical skill you must design. One tap on **Set up** creates the right Specialist Twin and installs the skill for you automatically. No more five-step authoring just to get started.
2. **First result in two minutes.** New sign-ups now get a real result immediately after hatching their Master Twin. You can do the same any time from the Jobs page — the overnight watch and price outlook need nothing connected.
3. **A guard against skills that can't run.** The advanced skill builder now tells you **at creation time** when nothing behind AiXin can actually carry out your skill — instead of letting you publish it and handing back a made-up generic report. If you see the "not runnable yet" notice, pick a job from the Jobs page instead.
4. **Your results so far.** At the bottom of the Jobs page, a live card counts your real runs, signed receipts, on-chain anchors, approvals and rejections — with a **Copy my case study** button that turns your own numbers into a quotable paragraph.
5. **Telegram is now a full front door.** Once Telegram is linked you can ask for work and approve it by message — `/jobs`, `/run <number>`, `/pending`, `/approve <code>`, `/reject <code> <reason>`. The dashboard stays your audit trail; approving in chat is governed exactly the same way.
6. **Scheduled runs with voice.** Put any working job on a schedule (alarm clock icon) — e.g. an overnight report at 06:00 to your Telegram, optionally as a voice note.

**How to craft a skill now (the easy path first):**

- **Easy path (recommended):** Jobs page → pick a card → **Set up** → **Do it now**. The twin, skill, and assignment are all created for you. The card always shows the one thing still missing (e.g. connect Gmail), with a link straight to it.
- **Custom path (advanced):** **Skills** page → **Open the skill builder** (the "Advanced" door at the bottom of the Jobs page also leads here). The wizard walks intent → what goes in/out → rules → connection → publish. **The Rules step is now plain language** — switch on things like "always ask me first", "never send — leave a draft", "office hours only", "known contacts only", and type a spending limit or a cap on items per run. AiXin turns your choices into the exact guardrails it checks before every run; if you'd rather write them by hand, switch on **Advanced: edit the rule text myself**. **Watch for the runnable notice on the final step** — it tells you honestly whether your skill can execute today or is design-only for now.

**How to check an outcome is real and matches your request:**

1. Open the task from the **Tasks** page (or the link you're taken to after a run). Check the **status** — done, blocked, or waiting for you. "Blocked" is honest: it means something was missing, not that it pretended to work.
2. Read the **result text** — real jobs are built only from your real data (your invoices, your unread mail, your stored enquiry facts). A result that mentions your actual invoice numbers or email subjects is real work; a generic essay is a sign you ran a design-only skill.
3. For email jobs, open **Gmail → Drafts** — the draft is physically there. AiXin never sends; **emails sent on your behalf: 0, by design**.
4. Scroll to the **signed receipt** on the task. For anchored actions, tap through to the public blockchain record (BscScan).
5. Share the receipt's **public verify link** — anyone can confirm it with no account.
6. Cross-check your totals any time on the public **Proof** page (website footer) and your **Your results so far** card on the Jobs page.

**Your 5-minute catch-up checklist:**

- [ ] Open the **Jobs** page and press **Set up** → **Do it now** on the overnight watch — see a real result with a receipt
- [ ] If you made skills before that never did anything, re-run them as jobs instead (the builder now warns you about skills that can't execute)
- [ ] Connect Telegram (Connections page) and set a 06:00 overnight report under **Scheduled runs**
- [ ] Add a real invoice on the **Money** page, run the invoice chase, and approve it from the Decision Card
- [ ] Press **Copy my case study** on the Jobs page — your real numbers, ready to share

---

### Step 1 — Create your account (1 minute)

1. Open the AiXin website and press **Get started** (or **Sign in** if you already have an account).
2. Enter your email and a password, then confirm via the email link if asked.
3. You land on the **welcome screen** (onboarding). This is a one-time setup.

### Step 2 — Hatch your Master Twin (1 minute)

On the welcome screen:

1. Give your Master Twin a **name** — any name you like (e.g. "AiXin", "小助手").
2. Pick a **language** for its replies — English or 中文.
3. Press **Hatch**.

Your Master Twin is your chief of staff. It receives your requests, decides which Specialist Twin should do the work, and checks everything before it reaches you.

### Step 3 — Get your first real result now (2 minutes)

Right after hatching, AiXin offers you the jobs that need **nothing connected** — no email, no Telegram, nothing to set up:

| Job | What you get | Honest limit |
|---|---|---|
| **Overnight business watch** | A scan of your workspace: anything stuck, waiting for you, or failed — summarised with severity | It only *looks*. It never changes anything. |
| **Price outlook** (e.g. BTC) | A real forecast from live market data | An outlook, not financial advice. |

1. Press **Run it** on either job.
2. Wait a few seconds. AiXin automatically creates the right Specialist Twin, gives it the skill, and runs it.
3. You land on the result page — with a **signed receipt** at the bottom.

🎉 That's your first outcome. You can also press **Skip** to go straight to the full jobs list.

### Step 4 — The Jobs page: "What I can do for you"

This is your home base for getting outcomes. In the left sidebar, press **Jobs** (wand icon). Each card is a result you can want:

| Card | What it does | Needs connected | Approval? |
|---|---|---|---|
| Chase overdue invoices | Finds unpaid invoices past due, writes the reminder from invoice facts only, leaves it as an email draft | Your invoices + Gmail | ✅ Always — money is involved |
| Triage my inbox | Reads recent unread mail, sorts by priority, labels it, drafts replies | Gmail | Never sends anything |
| Follow up new enquiries | Drafts a follow-up from the stored enquiry facts | Your leads + Gmail | ✅ Yes |
| Watch my shop orders | Reads your Shopify orders and tells you what needs you: paid-but-unshipped over 48h, missing payments, disputed part-refunds, value waiting to ship | Shopify | Runs itself (read-only) |
| Overnight business watch | Read-only scan of anything stuck or failed | Nothing | Runs itself |
| Daily briefing | A morning summary to your Telegram | Telegram | Runs itself |
| Price outlook | Market forecast | Nothing | Runs itself |

Each card tells you **the one thing still missing** (e.g. "connect Gmail") with a link to exactly where to do it.

**To use a job:**
1. Press **Set up** (one tap — AiXin creates the Specialist Twin and installs the skill for you).
2. If the card says something is missing, tap the link and connect it (see Step 5).
3. Press **Do it now**.
4. If the job needs approval, you'll get a **Decision Card** — see Step 6.

### Step 5 — Connect your tools (only when a job needs it)

Go to **Connections** (plug icon) in the sidebar:

- **Telegram** — link your account so your twin can message you reports and voice notes. Follow the bot link and press Start.
- **Gmail** — connect with Google so jobs can read unread mail and *draft* replies. AiXin can never send email — drafts only, by design.
- **Microsoft 365 / Outlook** — if your mail is on Outlook rather than Gmail, connect it here instead. Inbox triage behaves identically: it reads unread mail, marks each one by priority, and leaves a reply draft. There is no way for it to send.
- **Any other mailbox (IMAP)** — for mailboxes that are neither Gmail nor Outlook. Note: this one only completes its connection test on a self-hosted AiXin installation.
- **WeChat Work, Feishu, DingTalk** — for teams in mainland China: notifications and approvals in the tools you already use.
- **Google Sheets** — point AiXin at a shared sheet (price list, stock, bookings) so the answering job can quote from it.
- **Stripe** — paste a read-only key and AiXin can list your unpaid invoices. It only ever reads: it never charges, refunds or cancels anything.
- **Shopify** — paste your store address (`your-store.myshopify.com`) and an Admin API access token. Order watching needs only read access; approval-gated refunds also need write access to orders. AiXin never stores your Shopify password and never signs in as you — it uses the official API that Shopify invites apps to use.
- **Invoices & leads** — add them on the **Money** page (banknote icon) so the money jobs have real facts to work from — or press **Import from Stripe** and skip the typing.

Every connection has a **Test connection** button. It really contacts the provider and tells you what it saw. If something is wrong, it says so instead of quietly pretending to be connected.

### Step 5c — A worked example: an online shop, start to finish

This is the fastest path from "nothing set up" to money and time actually saved. It takes about five minutes.

**The situation.** You sell online through Shopify. Around sixty orders a week, one person packing them. Two things quietly cost you money: an order that sat unshipped for three days (a refund request and a bad review), and a refund argument you lose because you answered it late.

**What you do, once:**

1. **Connections → Shopify.** In your Shopify admin: *Settings → Apps and sales channels → Develop apps → Create an app → Configure Admin API scopes*. Tick `read_orders` (enough for watching). Tick `write_orders` too if you want AiXin to be able to issue refunds after your approval. Install the app and copy the **Admin API access token** (`shpat_…`).
2. Back in AiXin, paste your store address (`your-store.myshopify.com`) and that token, press **Test connection** — it should report your shop name and how many orders it can see — then set the connection to **Live**.
3. **Jobs → Watch my shop orders → Set up.** One tap creates the Specialist Twin ("Shopfloor") and gives it the skill.
4. **Scheduled runs → add a run at 07:30**, channel Telegram. Now the watch arrives before you start packing.

**What you get every morning:** a short message listing, by order number, the paid orders that have not shipped in over 48 hours, any payment that never arrived, part-refunded orders still in dispute, and the total value still waiting to ship. It is read-only: it ships nothing, cancels nothing, refunds nothing, and messages no customer.

**When a customer wants their money back:** tell AiXin (in the dashboard or in Telegram) *"Refund order #1042 for 59.90"*. It reads the order from your store first, then stops with a **Decision Card** showing the order total, what has already been refunded, what is still refundable, the customer, and any risk flags. Nothing has been paid at this point.

Approve it and the refund is created in Shopify, Shopify notifies the customer, and you get a signed receipt anchored on-chain. Before paying, AiXin re-reads the order and re-checks the amount — if you approved more than is still refundable, it refuses your own approval, pays nothing, and records the refusal on the **Money** page under "needs a human".

**The tangible outcome.** Orders that would have sat for days are caught the next morning, and refunds are correct, notified and provable. Nothing about your shop is touched without either a read-only scan or your signature.

### Step 5d — The store team: one Master Twin, four Specialists (the full example)

Step 5c was one Specialist doing one job. This is the whole team working one morning together — and it is the example to follow if you have never used an agent before.

**Who does what.** AiXin (your Master Twin) never does the work itself; it decides who does. You end up with four Specialists, each able to touch only its own connection, so one of them failing cannot reach the others:

| Specialist | Owns | Through |
|---|---|---|
| Shopfloor / 店务 | Orders, fulfilment, refunds | Shopify |
| Money / 财务 | Invoices and money owed | Stripe + your own invoice records |
| Inbox / 收件箱 | Unread customer mail, draft replies | Gmail or Outlook |
| Chief of Staff / 参谋长 | The round-up and the morning report | Telegram |

**Follow it on screen.** Open **Build the store team** in the sidebar (`/dashboard/recipe`). It is the same ten steps written below, each with a live tick so it can never claim a step is done when it is not, and a button straight to the screen that step names.

1. Connect your shop — `/dashboard/adapters` → Shopify → **Test connection** → Live.
2. Connect your mailbox — Gmail (read + draft only; AiXin has no send path).
3. Link the chat where you want the report — Telegram, on the dashboard.
4. `/dashboard/jobs` → **Set up** on **My store morning round**. One tap creates the Chief of Staff Specialist, the skill, the install and the assignment.
5. Press **Do it now** and read it: orders needing shipment, money still owed, unread customer mail by subject, and anything waiting for your signature — in one message. A source you have not connected says **not connected**; it is never dropped and never invented. Nothing is changed.
6. `/dashboard/assistant` → add a **07:30** schedule for it, tick **voice**, save. Press **Preview report now** to see exactly what will arrive before you trust it.
7. `/dashboard/jobs` → **Set up** on **Bring my past customers back**.
8. Press **Do it now**. Because it writes to real customers, it stops and asks.
9. `/dashboard/governance` → read the Decision Card: customers who bought exactly once and have been quiet for 60+ days, with their real order numbers and amounts, capped at ten per run. Approve, or reject with a reason (the reason is signed too).
10. Check it really happened: the task trail, the result facts, the draft in your **Drafts** folder, the signed receipt, and the anchor on BscScan.

**One draft per customer, ever.** Even if you run the win-back every day, no customer is written to twice — the limit is enforced in the database, not by good intentions. It writes the note; you decide and send it. It will not run a campaign.

**Make it yours.** Keep the shape, swap the sources:

| If you run… | Do this instead |
|---|---|
| A clinic or salon | Swap the shop for your booking mailbox: the round reports unanswered enquiries; win-back becomes patients not seen in 6 months. |
| A studio or agency | Money is the part that pays — unpaid invoices and quiet clients. Keep the round and the invoice chase, skip the order section. |
| A wholesaler | Orders and money matter most, customer mail less. Widen the win-back window to 90 days; buying cycles are longer. |
| Anything else | One rule: if no connection can read the facts, and you have no way to check the result afterwards, it is not a job for a twin yet. |

**What this does not do.** It does not pick products, set prices, find suppliers, buy ads, post marketing, or promise profit. Any tool that claims those while holding your passwords is the model AiXin exists to replace.


### Step 5b — Run everything from Telegram (optional)

Once Telegram is linked (Step 5), your chat with the bot becomes a second control room:

| Send this | What happens |
|---|---|
| `/help` | The menu of everything you can do in chat |
| `/jobs` | Your jobs, numbered, each showing whether it waits for approval and what it still needs |
| `/run 4` | Runs job number 4 now (add a note after the number, e.g. `/run 6 BTC`) |
| `/pending` | Decisions waiting for you, each with a short code |
| `/approve a1b2c3d4` | Approves that decision — it runs, and the receipt is signed and anchored |
| `/reject a1b2c3d4 too expensive` | Rejects it. A reason is required, and the rejection is signed and recorded too |

Anything else you type goes into the conversation of the task it relates to. Nothing in chat skips approval — the same rules apply as in the dashboard.

### Step 6 — Approving work: the Decision Card

When a job touches money or something irreversible, it **stops and waits for you**:

1. You'll see the task marked **waiting for approval** on the **Tasks** page (list icon), or a prompt in Telegram.
2. Open it. The Decision Card shows: what the twin wants to do, the evidence it based this on, and the risk level.
3. Press **Approve** to let it proceed, or **Reject** (with a reason — the rejection is signed and recorded too).

If you approve against the twin's own recommendation, you'll be asked to say why — that's recorded on the receipt as well.

### Step 7 — See the proof: receipts and verification

Every completed action produces a **signed receipt**:

- Open any finished task to see its receipt — a digital signature plus (for anchored actions) a link to the public blockchain record.
- Anyone — a client, a partner, an investor — can verify a receipt from its public link, **without an account**.
- The **Proof** page (linked in the website footer) shows live counters of everything AiXin has verifiably done.

### Step 8 — Set it on a schedule

Once a job works, put it on autopilot (still governed):

1. Go to **Scheduled runs** (alarm clock icon) in the sidebar.
2. Create an **Overnight report**, set the time (e.g. 06:00), choose Telegram, and optionally tick **voice note**.
3. Press **Preview report now** to see exactly what you'd receive.
4. From then on, the report arrives every morning — work needing approval still waits for you.

### Other pages you'll use

| Sidebar page | What it's for |
|---|---|
| **Ask AiXin** (sparkles, top) | Type any request in plain language — the Master Twin routes it |
| **Command Center** | Overview of your workspace at a glance |
| **Tasks** | Every job, its status, and its receipts |
| **Money** | Your invoices, leads, and money jobs |
| **Q&A** | Approved source material your twin answers from — with citations, and it refuses when the material doesn't cover the question |
| **Memory** | Everything your twin is allowed to remember — each note shows its allowed use, usage count, and optional forget-by date. You can read and delete any of it |
| **Specialists / Skills** | Your team and their skills (the skill builder lives here, behind **Advanced**) |

### If something goes wrong — it's a feature

- **"No live adapter" / BLOCKED** — the job needs a connection you haven't made. Nothing fake is produced; connect the tool and re-run.
- **Anchoring pending** — the blockchain record is being confirmed; it retries automatically.
- **A refusal from Q&A** — your twin only answers from your approved material. Add a source and ask again.

AiXin would rather show you an honest "I couldn't" than a made-up "done".

### Your first-week checklist

- [ ] Sign up and hatch your Master Twin
- [ ] Run the overnight watch or price outlook (first result in ~2 minutes)
- [ ] Connect Telegram; set a 06:00 overnight report with voice note
- [ ] In Telegram, send `/jobs`, then `/run 4` — and approve something with `/approve`
- [ ] Add 2–3 real invoices on the Money page; run the invoice chase; approve it from the Decision Card
- [ ] Connect Gmail; run inbox triage; check the drafts in your Gmail
- [ ] Open a finished task and verify its receipt from the public link
- [ ] On the Jobs page, press **Copy my case study** — your real numbers so far, ready to paste anywhere

---

## 中文

### 一段话说明 AiXin 是什么

AiXin 为你提供数字分身 —— 一支为你工作的 AI 团队。你有一个**主分身**（你的大管家）和多个**专家分身**（你的员工）。你用大白话告诉他们你想要什么结果，他们去干活。最特别的是：**凡是比较重要的操作，都会先等你批准；而且他们做的每一件事都会留下一张可验证的签名回执** —— 就像一张签了名的送货单，你随时可以查验，甚至能在公开的区块链上查到。你的邮箱绝不会替你发出任何邮件 —— 回复只会以草稿形式准备好，等你来定。

### 记住这条黄金法则

> **任何不可逆的操作，都必须先经过你批准。每一个行动都会留下一张你可以验证的回执。**

---

### 新增与改进功能（相较约三周前的版本）

如果你上次使用 AiXin 大约在三周前，这里是一份速查更新表。以下功能均已上线可用。

| 新增 / 改进 | 在哪里找到 | 对你的意义 |
| --- | --- | --- |
| **任务页 —— "我能为你做什么"** | 侧边栏 → **任务** | 直接挑选一个成品结果，无需自己设计技能。一键即可为你创建分身并安装技能。 |
| **约 2 分钟拿到第一个真实结果** | 孵化主分身之后（任务页也可随时进行） | 有两项任务无需连接任何工具，因此你能立刻看到带回执的真实成果。 |
| **大白话规则（本次新增）** | 技能创建器 → **规则**步骤 | 护栏现在只是开关和数字 —— "每次都先问我""永不发送 — 只留草稿""仅在工作时间运行""超过此金额先问我"。无需学习任何语法；高级用户仍可打开**我要自己编辑规则文本**。 |
| **"目前还没有工具能执行这项任务"提示** | 技能创建器 → 最后一步 | 在创建时就如实告知该技能能否真正执行，而不是事后给你一份编造的报告。 |
| **你的成果统计 + 复制我的案例** | **任务**页底部 | 真实的运行次数、签名回执、上链锚定、批准与拒绝数量 —— 一键复制成可引用的段落。 |
| **公开的证明页** | 网站页脚 → **证明** | 任何人都能核查的实时计数：签名回执、上链锚定、已遵守的批准、代你发送的邮件（按设计为 0）。 |
| **在 Telegram 里直接指挥（本次新增）** | 与机器人的 Telegram 对话 | 发送 `/jobs` 查看任务、`/run 4` 立即执行、`/pending` 查看待批准、`/approve <代码>` 或 `/reject <代码> <理由>` —— 审批规则和签名收据完全一致。 |
| **"需要您处理"清单（本次新增）** | 侧边栏 → **资金**（业务任务），发票下方 | 当工具拒绝执行时——退款缺少凭证、金额不合理——AiXin 会停下并记录在这里，而不是自行猜测。你可以标记"我来处理"或"已处理"。 |
| **AiXin 已跟进的询问（本次新增）** | 侧边栏 → **资金** 页底部 | AiXin 为你起草的每一次跟进，方便你标记最终结果。金额只会是你自己填写的数字。 |
| **用 AiXin 开发自己的应用（开发者）** | 项目中的 `DEVELOPER_API.md` | 你的应用可以把任务交给 AiXin，并取回结果与回执；涉及金钱的任务仍需你批准。 |
| **定时运行与语音简报** | 侧边栏 → **定时运行** | 每天 06:00 把夜间报告发到你的 Telegram，还可以朗读出来。 |
| **随时听取简报（新增）** | 在 Telegram 里发送 `/voice` | 与 06:00 定时报告相同的内容，同时发送文字和真实语音。若语音不可用，会只发文字并如实说明。 |
| **更多连接：Outlook、任意邮箱、企业微信、飞书、钉钉、Google Sheets、Stripe（新增）** | 侧边栏 → **外部工具连接** | 收件箱整理现在在 Microsoft 365 / Outlook 上与 Gmail 完全一致 —— 读取、分类、起草，绝不发送。未付发票可直接从 Stripe 导入，无需手工录入。每张卡片都有**测试连接**按钮，真正访问服务商，配置错误会明确报错，而不是悄悄无动作。 |
| **Shopify 店铺：订单监控 + 需批准的退款（新增）** | 侧边栏 →**外部工具连接** → Shopify，然后**任务** →*盯着我的店铺订单* | 通过 Shopify 官方 Admin API 读取订单（不保存任何密码）：已付款但超过 48 小时未发货、款项未到账、部分退款仍有争议，以及等待发货的金额。退款是独立请求，始终等待您签署批准。 |
| **不会丢失的 Webhook（新增）** | 侧边栏 → **外部工具连接** → Webhook | 若你的接收系统短暂宕机，推送会被暂存并自动重试（1、5、15、60、180 分钟），不会消失。 |
| **业务任务：发票、收件箱、询盘、巡检** | 侧边栏 → **资金** 与 **任务** | 催收逾期发票（需批准）、把未读邮件整理成草稿、跟进新询盘，以及只读的夜间巡检。 |
| **不知道就拒答，绝不猜测** | 侧边栏 → **问答** | 只依据你已批准的资料作答并给出出处，否则直接说不知道。 |
| **可查看的记忆** | 侧边栏 → **它记住了什么** | 每条记录都显示允许用于什么、被使用过几次，以及可选的遗忘日期。 |

---

### 老用户看这里 —— 有哪些变化（5 分钟上手）

如果你之前注册过，觉得很难让分身做出有意义的事 —— 这个反馈我们听到了。整个流程已经围绕**结果而不是配置**重新设计：

**新变化：**

1. **任务页 ——"我能为你做什么"。** 点击左侧菜单的**任务**（魔法棒图标）。每张卡片就是一个现成的结果（催收逾期发票、整理收件箱、跟进询盘、夜间巡检、每日简报、价格展望）—— 不再是需要你从零设计的技术技能。点一次**一键设置**，AiXin 就会自动创建对应的专家分身并装好技能。再也不用先走完五步创建流程才能开始。
2. **两分钟拿到第一个结果。** 新用户孵化主分身后会立即获得一个真实结果。老用户随时可以在任务页做同样的事 —— 夜间巡检和价格展望无需连接任何工具。
3. **防止技能"跑不起来"的保护。** 高级技能创建器现在会在**创建时**就明确告诉你：当前 AiXin 是否真的有能力执行这个技能 —— 而不是让你发布之后，拿回一份编造的通用报告。如果看到"暂时无法运行"的提示，请改用任务页里的现成任务。
4. **"你的成果"统计卡。** 任务页底部有一张实时统计卡：你的真实运行次数、签名回执、上链记录、批准与拒绝次数 —— 点击**复制我的案例**，就能把你自己的真实数字变成一段可引用的话。
5. **Telegram 成为完整入口。** 关联 Telegram 后，你可以直接在聊天里派活和批准：`/jobs`、`/run <编号>`、`/pending`、`/approve <代码>`、`/reject <代码> <理由>`。仪表盘仍是审计记录；聊天里的批准同样经过 SIP 治理。
6. **定时运行 + 语音。** 在**定时运行**页（闹钟图标）把任何跑通的任务设为自动执行 —— 例如每天 06:00 发夜间报告到你的 Telegram，还可以附带语音。

**现在如何创建技能（先走简单的路）：**

- **简单路径（推荐）：** 任务页 → 选一张卡片 → **一键设置** → **立即执行**。分身、技能、分配全部自动完成。卡片始终会显示还缺哪一样东西（如连接 Gmail），并附直达链接。
- **自定义路径（高级）：** **技能**页 → **打开技能创建器**（任务页底部的"高级"入口也通到这里）。向导会带你走完：意图 → 输入输出 → 规则 → 连接 → 发布。**「规则」这一步现在全是大白话** —— 直接打开开关，例如"每次都先问我""永不发送 — 只留草稿""仅在工作时间运行""仅联系已知联系人"，再填写金额上限或每次处理的数量上限。AiXin 会把你的选择转换成每次运行前实际检查的护栏；若你更想手写，可打开**高级：我要自己编辑规则文本**。**请留意最后一步的可运行提示** —— 它会诚实告诉你这个技能今天能否真正执行，还是暂时只能作为设计稿。

**如何确认结果是真的、并且符合你的要求：**

1. 从**任务**页打开任务（运行后也会自动跳转到结果页）。先看**状态** —— 完成、已阻止、还是等待你批准。"已阻止"是诚实的：说明缺了什么东西，而不是假装跑过了。
2. 读**结果正文** —— 真实任务只用你的真实数据（你的发票、你的未读邮件、你存的询盘事实）。结果里出现你真实的发票号或邮件主题，才是真干了活；一篇泛泛而谈的文章，多半说明你跑的是一个"设计稿"技能。
3. 邮件类任务：打开 **Gmail → 草稿箱** —— 草稿真实地躺在那里。AiXin 绝不发送邮件；**替你发出的邮件数：0，这是设计使然**。
4. 在任务页面下拉到**签名回执**。已上链的行动，可以点进公开的区块链记录（BscScan）查验。
5. 把回执的**公开验证链接**发给任何人 —— 对方无需注册即可验证。
6. 随时在公开的 **Proof（证明）** 页面（网站页脚）和任务页的**"你的成果"**统计卡上核对总数。

**老用户 5 分钟上手清单：**

- [ ] 打开**任务**页，在"夜间巡检"上点**一键设置** → **立即执行** —— 看到带签名回执的真实结果
- [ ] 如果你以前创建过"跑不出东西"的技能，改用任务页里的对应任务重新跑（创建器现在会提前提示哪些技能无法执行）
- [ ] 在**外部工具连接**页连接 Telegram，并在**定时运行**里设置 06:00 夜间报告
- [ ] 在**资金**页添加一张真实发票，运行催收任务，并在决策卡上批准
- [ ] 在任务页点击**复制我的案例** —— 你的真实数据，随时可分享

---

### 第 1 步 —— 注册账号（1 分钟）

1. 打开 AiXin 网站，点击 **开始使用**（已有账号则点 **登录**）。
2. 输入邮箱和密码，如收到确认邮件请按提示确认。
3. 进入**欢迎页面**（新手引导），这是一次性设置。

### 第 2 步 —— 孵化你的主分身（1 分钟）

在欢迎页面：

1. 给你的主分身起一个**名字** —— 随便什么名字都行（例如"小爱"、"助手"）。
2. 选择回复**语言** —— 中文或 English。
3. 点击**孵化**。

主分身是你的大管家：接收你的请求、决定由哪个专家分身来做、并在结果送到你手上之前检查一切。

### 第 3 步 —— 立刻拿到第一个真实结果（2 分钟）

孵化完成后，AiXin 会直接提供**无需连接任何工具**的任务 —— 不用邮箱、不用 Telegram，零配置：

| 任务 | 你会得到什么 | 诚实说明 |
|---|---|---|
| **夜间业务巡检** | 扫描你的工作区：卡住的任务、等你批准的事、失败的投递 —— 按严重程度汇总 | 只看不改，绝不改动任何数据 |
| **价格展望**（如 BTC） | 基于实时行情数据的真实预测 | 仅供参考，不构成投资建议 |

1. 在任意任务上点击**立即运行**。
2. 稍等几秒：AiXin 会自动创建对应的专家分身、装好技能并真实执行。
3. 你会来到结果页面 —— 底部有一张**签名回执**。

🎉 这就是你的第一个成果。也可以点**跳过**，直接进入完整任务列表。

### 第 4 步 —— 任务页："我能为你做什么"

这是你的主阵地。点击左侧菜单的 **任务**（魔法棒图标）。每张卡片就是一个你想要的结果：

| 卡片 | 做什么 | 需要连接 | 需要批准？ |
|---|---|---|---|
| 催收逾期发票 | 找出所有逾期未付的发票，只根据发票事实写催款提醒，存为邮件草稿 | 你的发票 + Gmail | ✅ 一定需要 —— 涉及资金 |
| 整理我的收件箱 | 读取最近的未读邮件，按优先级分类、打标签、起草回复 | Gmail | 绝不发送任何邮件 |
| 跟进新询盘 | 只根据已存的询盘事实起草跟进邮件 | 你的询盘 + Gmail | ✅ 需要 |
| 盯着我的店铺订单 | 读取你的 Shopify 订单，并列出需要你处理的事项：已付款超 48 小时未发货、款项未到账、部分退款仍有争议、等待发货的金额 | Shopify | 自动运行（只读） |
| 夜间业务巡检 | 只读扫描卡住或失败的事项 | 无需连接 | 自动运行 |
| 每日简报 | 每天早上发总结到你的 Telegram | Telegram | 自动运行 |
| 价格展望 | 行情预测 | 无需连接 | 自动运行 |

每张卡片都会告诉你**还缺哪一样东西**（例如"连接 Gmail"），并附链接直达设置位置。

**使用方法：**
1. 点击**一键设置** —— AiXin 自动创建专家分身并安装技能。
2. 如果卡片提示缺少什么，点链接去连接（见第 5 步）。
3. 点击**立即执行**。
4. 如果任务需要批准，你会收到一张**决策卡** —— 见第 6 步。

### 第 5 步 —— 连接你的工具（仅在任务需要时）

点击左侧菜单的**外部工具连接**（插头图标）：

- **Telegram** —— 关联账号后，分身可以给你发报告和语音。按提示打开机器人并点 Start。
- **Gmail** —— 用 Google 账号授权后，任务可以读取未读邮件并*起草*回复。AiXin 永远不能发送邮件 —— 只能起草，这是设计使然。
- **Microsoft 365 / Outlook** —— 如果你用的是 Outlook 而不是 Gmail，就连接这一项。收件箱整理的行为完全一致：读取未读邮件、按优先级标记、留下回复草稿。它没有任何发送能力。
- **任意其他邮箱（IMAP）** —— 适用于既非 Gmail 也非 Outlook 的邮箱。注意：此项的连接测试仅在自建部署的 AiXin 上能够完成。
- **企业微信、飞书、钉钉** —— 面向中国大陆团队：在你已经在用的工具里接收通知与批准。
- **Google Sheets** —— 指定一个已共享的表格（价目表、库存、预约），问答任务即可据此引用作答。
- **Stripe** —— 填入只读密钥，AiXin 即可列出你的未付发票。它只读取：绝不收费、退款或取消任何事项。
- **Shopify** —— 填入店铺地址（`your-store.myshopify.com`）与 Admin API 访问令牌。订单监控只需读取权限；需批准的退款还需要订单写入权限。AiXin 绝不保存你的 Shopify 密码，也绝不以你的身份登录 —— 它使用的是 Shopify 官方开放给应用的接口。
- **发票与询盘** —— 在**资金**页（钞票图标）添加，资金类任务才有真实事实可用；也可以直接点**从 Stripe 导入**，省去手工录入。

每一项连接都有**测试连接**按钮。它会真正访问对应服务并告诉你看到了什么。若配置有误，它会明确报错，而不是假装已连接。

### 第 5c 步 —— 完整实例：一家网店，从头到尾

这是从"什么都没设置"到真正省下时间和钱的最快路径，约五分钟。

**场景。** 你用 Shopify 做网店。每周约六十单，只有一个人打包。真正悄悄让你亏钱的只有两件事：一张订单压了三天没发货（换来退款请求和差评），以及因为回复太慢而输掉的退款争议。

**只需设置一次：**

1. **外部工具连接 → Shopify。** 在 Shopify 后台：*设置 → 应用与销售渠道 → 开发应用 → 创建应用 → 配置 Admin API 权限*。勾选 `read_orders`（仅监控即可）；若希望 AiXin 在你批准后能执行退款，再勾选 `write_orders`。安装应用并复制 **Admin API 访问令牌**（`shpat_…`）。
2. 回到 AiXin，填入店铺地址（`your-store.myshopify.com`）与该令牌，点击**测试连接** —— 它应报告你的店铺名称以及能看到多少订单 —— 然后把连接设为 **Live**。
3. **任务 → 盯着我的店铺订单 → 一键设置。** 一次点击即创建专家分身（"店务"）并安装技能。
4. **定时运行 → 新增 07:30 的运行**，通道选 Telegram。这样你开始打包之前就会收到巡检结果。

**你每天早上会收到：** 一条简短消息，按订单号列出已付款但超过 48 小时未发货的订单、款项未到账的订单、部分退款仍有争议的订单，以及等待发货的总金额。它是只读的：不发货、不取消、不退款、不联系客户。

**当客户要求退款时：** 在面板或 Telegram 里告诉 AiXin：*「给订单 #1042 退款 59.90」*。它会先从店铺读取该订单，然后停下并给出一张**决策卡**，显示订单总额、已退金额、仍可退金额、客户信息与风险标记。此时尚未付出任何款项。

你批准后，退款会在 Shopify 中真实生成，由 Shopify 通知客户，你会得到一份已签名并上链的回执。付款之前，AiXin 会重新读取订单并再次核对金额 —— 如果你批准的金额超过仍可退金额，它会拒绝你自己的批准、不付任何款项，并把这次拒绝记录在**资金**页的"需要人工处理"中。

**可见成果。** 原本会压好几天的订单第二天早上就被发现；退款金额正确、已通知客户、可被验证。对你的店铺，除了只读扫描，任何改动都必须有你的签名。

### 第 5d 步 —— 店铺团队：一位主孪生，四位专家（完整实例）

第 5c 步是一位专家做一件事。这里是整个团队在同一个早晨协同工作 —— 如果你从未用过智能体，就照这个例子做。

**各自负责什么。** AiXin（你的主孪生）自己从不动手，只决定由谁来做。最终你会有四位专家，每位只能接触自己的那条连接，因此其中一位出问题也波及不到其他人：

| 专家 | 负责 | 通过 |
|---|---|---|
| 店务 | 订单、发货、退款 | Shopify |
| 财务 | 发票与应收款项 | Stripe 与你自己的发票记录 |
| 收件箱 | 未读客户邮件、草稿回复 | Gmail 或 Outlook |
| 参谋长 | 汇总与晨间报告 | Telegram |

**跟着屏幕做。** 打开侧边栏的**搭建店铺团队**（`/dashboard/recipe`）。内容就是下面这十步，每一步都有实时状态，绝不会在未完成时声称已完成，并配有直达该页面的按钮。

1. 连接店铺 —— `/dashboard/adapters` → Shopify → **测试连接** → 设为 live。
2. 连接邮箱 —— Gmail（仅读取与草稿；AiXin 根本没有发送通道）。
3. 绑定接收报告的聊天 —— 在仪表盘绑定 Telegram。
4. `/dashboard/jobs` → 在**店铺晨间巡店**上点击**帮我设置好**。一次点击即创建参谋长专家、技能、安装与分配。
5. 点击**现在就做**并读一读：待发货订单、仍未收回的款项、按主题列出的未读客户邮件、等待你签署的事项 —— 全在一条消息里。未连接的来源会写明**未连接**，既不会被丢弃也不会被编造。什么都没有改动。
6. `/dashboard/assistant` → 为它新增 **07:30** 的计划，勾选**语音**并保存。点击**立即预览报告**，在信任它之前先看清会收到什么。
7. `/dashboard/jobs` → 在**唤回我的老客户**上点击**帮我设置好**。
8. 点击**现在就做**。因为会写给真实客户，它会停下来征求你的同意。
9. `/dashboard/governance` → 阅读决策卡：只买过一次、已沉寂 60 天以上的客户，附真实订单号与金额，每次运行上限十位。批准，或填写理由后拒绝（理由同样会被签名）。
10. 验证它是否真的发生：任务轨迹、结果中的事实、邮箱**草稿箱**里的那封信、签名回执，以及 BscScan 上的链上锚定。

**每位客户一生只写一封。** 即使你每天运行唤回，也不会有客户被写第二次 —— 这一限制由数据库强制执行，而不是靠自觉。它写信，你决定并发送。它不会去跑营销活动。

**改成适合你的版本。** 保留结构，替换来源：

| 如果你经营… | 就这样改 |
|---|---|
| 诊所或美容院 | 把店铺换成预约邮箱：巡店报告仍未回复的询盘；唤回针对半年未回访的客户。 |
| 工作室或代理机构 | 「应收款项」才是赚钱的部分 —— 未付发票与沉寂客户。保留巡店与发票催收，跳过订单部分。 |
| 批发商 | 订单与款项最重要，客户邮件次之。把唤回窗口放宽到 90 天，采购周期更长。 |
| 其他行业 | 一条规则：如果没有连接能读到事实，事后你也无法验证结果，那它现在还不适合交给孪生。 |

**它不做的事。** 不选品、不定价、不找供应商、不投广告、不发营销内容、不承诺利润。任何一边握着你的密码、一边宣称能做这些的工具，正是 AiXin 要取代的那种模式。


### 第 5b 步 —— 在 Telegram 里完成一切（可选）

关联 Telegram 后（第 5 步），聊天窗口就是你的第二个控制台：

| 发送 | 会发生什么 |
|---|---|
| `/help` | 显示聊天里可用的全部指令 |
| `/jobs` | 按编号列出你的任务，并标明是否需要批准、还缺什么 |
| `/run 4` | 立即执行第 4 个任务（编号后可加备注，例如 `/run 6 BTC`） |
| `/pending` | 列出等待你决定的事项，每条带一个短代码 |
| `/approve a1b2c3d4` | 批准该事项 —— 立即执行，回执签名并上链 |
| `/reject a1b2c3d4 太贵了` | 拒绝该事项。必须写理由，拒绝同样被签名记录 |

其他文字消息会进入相关任务的对话。聊天不会绕过任何审批 —— 规则与仪表盘完全相同。

### 第 6 步 —— 批准工作：决策卡

当任务涉及资金或不可逆操作时，它会**停下来等你**：

1. 在**任务**页（列表图标）会看到"等待批准"的任务，Telegram 里也会收到提示。
2. 打开它。决策卡会显示：分身想做什么、依据的证据、风险等级。
3. 点**批准**让它继续，或点**拒绝**（可附原因 —— 拒绝也会被签名记录）。

如果你不顾分身自己的建议而批准，需要说明原因 —— 同样会记录在回执上。

### 第 7 步 —— 查看证明：回执与验证

每个完成的行动都会生成一张**签名回执**：

- 打开任意已完成的任务，可看到数字签名，以及（已上链的）公开区块链记录链接。
- 任何人 —— 客户、合作伙伴、投资人 —— 都可以通过公开链接验证回执，**无需注册账号**。
- 网站页脚的 **Proof（证明）** 页面展示 AiXin 已被验证的所有实时统计。

### 第 8 步 —— 设置定时运行

任务跑通后，可以设置成自动运行（仍受治理约束）：

1. 点击左侧菜单的**定时运行**（闹钟图标）。
2. 新建一个**夜间报告**，设定时间（如 06:00），选择 Telegram，可勾选**同时发送语音**。
3. 点击**立即预览报告**，看到的内容就是你将收到的。
4. 此后报告每天早晨准时送达 —— 需要批准的工作依然会等你。

### 你会用到的其他页面

| 菜单页面 | 用途 |
|---|---|
| **问 AiXin**（顶部星光图标） | 用大白话输入任何请求，主分身自动分派 |
| **指挥中心** | 工作区总览 |
| **任务** | 每个任务的状态和回执 |
| **资金** | 发票、询盘和资金类任务 |
| **问答** | 分身只能依据你批准的素材回答 —— 附带引用；素材没覆盖的问题会明确拒绝回答 |
| **记忆** | 分身被允许记住的一切 —— 每条笔记都标明允许用途、使用次数和可选的到期删除日期，你可以随时查看和删除 |
| **专家分身 / 技能** | 你的团队和他们的技能（技能创建器在**高级**入口后面） |

### 遇到问题？这正是设计的一部分

- **"没有可用的连接" / 已阻止** —— 任务需要的工具还没连接。系统不会编造结果；连接好工具后重新运行即可。
- **上链待确认** —— 区块链记录正在确认中，会自动重试。
- **问答拒绝回答** —— 分身只依据你批准的素材作答。添加素材后再问一次。

AiXin 宁可诚实地告诉你"我做不到"，也不会交一份编造的"已完成"。

### 第一周清单

- [ ] 注册并孵化主分身
- [ ] 运行夜间巡检或价格展望（约 2 分钟拿到第一个结果）
- [ ] 连接 Telegram；设置 06:00 夜间报告并开启语音
- [ ] 在 Telegram 里发送 `/jobs`，再 `/run 4`，并用 `/approve` 批准一次
- [ ] 在资金页添加 2–3 张真实发票；运行催收任务；在决策卡上批准
- [ ] 连接 Gmail；运行收件箱整理；到 Gmail 里检查草稿
- [ ] 打开一个已完成的任务，通过公开链接验证回执
- [ ] 在任务页点击**复制我的案例** —— 你的真实数据，可随时粘贴分享

---

*Last updated: 2026-09-18 (plain-language rules) · 最后更新：2026-09-18（大白话规则）*
*Built from the live product — every screen and step above exists today. 基于当前线上产品编写 —— 上述每个页面和步骤均已真实可用。*
