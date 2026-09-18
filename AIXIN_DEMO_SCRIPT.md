# AiXin — Demo Script / 演示脚本

_Last updated: 18 September 2026. Every number quoted here is read live from the app's own records — replace with the numbers on screen on the day._

---

# Part 1 — English

## 0. Before you walk in (10 minutes, the night before)

| Check | Where | Why it matters |
|---|---|---|
| Master Twin hatched, 4 Specialists exist (Chief of Staff, Inbox, Money, Desk) | `/dashboard` | The demo assumes a populated account |
| At least 2 overdue invoices present | `/dashboard/money` | Act 2 needs something real to chase |
| Telegram linked, `/jobs` replies in chat | Your Telegram | Act 4 runs entirely from your phone |
| Gmail connected (read + draft) | `/dashboard/adapters` | Act 2 lands a real draft |
| One 06:00 overnight report saved with voice on | `/dashboard/assistant` | Act 1's voice note |
| Two browser tabs open: `/dashboard/jobs` and `/proof` | — | You never search for a page on stage |

Fallbacks, decided in advance: if Gmail is slow, run **Overnight business watch** instead (needs nothing connected). If the chain is slow, the receipt still appears as *signed, anchoring pending* — say so out loud; that honesty is the product.

## 1. The one-sentence frame (30 sec)

> "Everyone is shipping AI agents that act on your business. Nobody can show you what theirs actually did. AiXin can — every action it takes is signed, approval-gated, and provable by a stranger on a public blockchain."

Then the hook:

> "Jarvis was an assistant you hope behaves. AiXin is an assistant that proves it did."

## 2. Act 1 — "While you slept" (90 sec)

Open Telegram on the projector. Send `/voice`.

AiXin replies with the briefing as text **and speaks it as a voice note**. Play 15 seconds.

Say: *"That report was not written by a language model guessing. It's assembled from my real records overnight — tasks that finished, decisions waiting for me, receipts that anchored, deliveries that failed. If nothing happened, it says nothing happened."*

Switch language and send `/voice` again in Chinese if the room is bilingual — same twin, Chinese in, Chinese out.

## 3. Act 2 — The money job that waits for you (2 min)

Go to `/dashboard/money`.

1. Press **Import from Stripe**. Invoices appear — *"I didn't type these. AiXin read them from Stripe. Read-only: it cannot charge, refund or void anything, by construction."*
2. Press **Chase overdue invoices**.
3. A **Decision Card** appears — *awaiting approval*. Say: *"Money is involved, so it stops here. Not because it's unsure — because the rule says a human decides. Read what it plans to say: every figure comes from the invoice, nothing invented."*
4. Approve it. Open Gmail → the reminder is sitting **in Drafts**. *"It is still a draft. AiXin has never sent an email on my behalf — the counter on the proof page says zero, and it's counted from records, not from a promise."*
5. Open the receipt → click the BscScan link. *"That's this decision, on a public chain, right now. Anyone in this room can check it on their own phone."*

### Act 2b — "It plugs into what you already use" (45 sec, optional)

Open `/dashboard/adapters` and scroll the connection cards: Telegram, Gmail, **Microsoft 365 / Outlook**, **any other mailbox (IMAP)**, **WeChat Work**, **Feishu**, **DingTalk**, **Google Sheets**, **Stripe**, Webhook.

Say: *"The inbox job doesn't care which mailbox you're on — Gmail or Outlook, identical behaviour: it reads, sorts, drafts, and has no ability to send. For mainland teams the approvals arrive in WeChat Work, Feishu or DingTalk."*

Press **Test connection** on one card. It really contacts the provider and reports what it saw.

> *"Every connection has to prove itself before AiXin will call it live. A wrong setting shows up here as an error — it never becomes a job that silently does nothing."*

Honest limits to say out loud if asked: the any-mailbox (IMAP) test only completes on a self-hosted install; DingTalk has no read endpoint, so its test posts one clearly-labelled test line and never your data; and if a webhook receiver is down, the delivery is parked and retried automatically rather than lost.

### Act 2c — The shop that refunds only when you say so (2 min, highest-impact act)

**The real-world story to tell first (15 sec):** *"I run a small online store. Sixty orders a week, one person packing them. The two things that actually cost me money are an order that sat unshipped for three days, and a refund argument I lose because I answered it late. Watch."*

**Setup done before the demo:** on `/dashboard/adapters` → **Shopify**, paste your store domain and Admin API access token, press **Test connection** (it reads the shop and counts recent orders), set it to **Live**. On `/dashboard/jobs` press **Set up** on **Watch my shop orders**.

1. On `/dashboard/jobs`, press **Do it now** on **Watch my shop orders**. Say: *"This reads the store through Shopify's own Admin API — the automation Shopify explicitly invites. No password stored, no browser pretending to be me, no terms of service broken."*
2. Read the result out loud: paid-but-not-shipped for over 48 hours (with the order numbers), payments that never arrived, part-refunded orders still in dispute, and the total value waiting to ship. *"Those are real orders, counted from the store. No sentence in there was written by a language model."*
3. Now the money half. Ask AiXin: **"Refund order #1042 for 59.90"**. It stops — **Decision Card, high risk, awaiting approval**. Read the card: the order total, what has already been refunded, what is still refundable, the customer, and the flags. *"It read all of that from the store before asking me. It is not guessing, and it is not paying."*
4. Approve it. The refund appears **in Shopify**, the customer is notified by Shopify itself, and the receipt is signed and anchored. Click through to BscScan.
5. The line that lands: *"Before it paid, it re-read the order and re-checked the amount against what was still refundable. If I had approved too much, it would have refused my own approval — and logged that refusal. That is the difference between an assistant and a governed one."*

**The tangible outcome to state plainly:** *"Three days of unshipped orders found in nine seconds, and a refund that is correct, notified, and provable — on a shop I did not have to give my password to."*

### Act 2d — The store team: four Specialists, one morning (2.5 min, the act that answers "but what would I actually use it for?")

**Frame it first (20 sec):** *"Everything so far was one Specialist doing one job. This is the team. And before anyone asks: no, AiXin will not build you a profitable store — it does not pick products, set prices, buy ads or post marketing, and I will not pretend otherwise. What it does is the unglamorous work that actually decides whether a shop makes money: money not collected, orders not shipped, customers not answered, and buyers who never came back."*

**Setup before the demo:** Shopify, Gmail and Telegram connected and live. On `/dashboard/jobs`, **Set up** both **My store morning round** and **Bring my past customers back**. On `/dashboard/assistant`, a 07:30 schedule for the morning round with **voice** ticked.

1. Open `/dashboard/recipe` for two seconds. *"That is the whole build, screen by screen, with a live tick against each step. Nobody has to remember this talk."*
2. Press **Do it now** on **My store morning round**. Read the one result out loud — four sections, four owners: **Shopfloor** on orders needing shipment, **Money** on invoices still unpaid (from Stripe and from your own records), **Inbox** on unread customer mail listed by subject only, **Chief of Staff** on what is waiting for your signature and what failed to deliver overnight.
3. Point at any section you deliberately left disconnected: *"It says 'not connected'. It did not quietly drop it and it did not invent it. That sentence is the product."*
4. Say: *"Nothing was changed. Read-only, by construction — the artifact literally records `changed_anything: false`. This is the message that arrives in my chat at 07:30 every morning, in text and read aloud."*
5. Now the money half. Press **Do it now** on **Bring my past customers back**. It stops: **Decision Card, high risk**. Read it: customers who bought exactly once and have been quiet for 60+ days, with their real order numbers and amounts, capped at ten per run.
6. Approve. Drafts appear **in your Drafts folder** — not sent. Open one: it quotes their actual order, and nothing else. No discount it invented, no promise it cannot keep.
7. The line that lands: *"One draft per customer, ever — it cannot nag them twice even if I run it every day. It writes the note; I decide and I send. That is not a campaign tool with a safety switch, it is the other way round."*

**The tangible outcome to state plainly:** *"One message at 07:30 that replaces four logins, and ten personal notes to customers I had written off — each one waiting for my signature, each one provable afterwards."*


## 4. Act 3 — It knows what it doesn't know (60 sec)

Run the **Q&A** job with a question your approved material does not cover.

It refuses, and says why.

> "Every other demo you'll see today would have answered that. Confidently. Wrongly. Refusing is the feature you're actually buying."

## 5. Act 4 — The whole business, from a chat (90 sec)

Phone on the projector, Telegram:

- `/jobs` → numbered list, each showing what it still needs
- `/run 1` → a real governed run starts
- `/pending` → what's waiting
- `/approve <code>` → approved

> "Same pipeline, same signature, same on-chain receipt as the dashboard. There is deliberately no cheaper path through AiXin — a shortcut would be a hole in the audit trail."

## 6. Act 5 — The proof page (45 sec)

Open `/proof`.

> "This is not a marketing page. These are counters over real records: 71 governed actions, 71 anchored on-chain, 66 approvals honoured, 5 rejections respected, and zero emails sent on anyone's behalf. Small numbers — and every single one of them is checkable. No competitor can put this page up."

Then press **Copy my case study** on `/dashboard/jobs` and paste it into the chat. *"That's a pilot report, generated from what actually happened."*

## 7. Close (30 sec)

> "Three surfaces, one trust rail: consumers use the platform, businesses run governed jobs, developers build on the headless API. The agent gold rush is running on unbounded trust — root access to your life, no record of what happened. In September 2026 that stopped being theoretical: the first breach carried out by an autonomous agent was filed with a regulator, and the EU's penalties are already in force. When that bill lands, the only agents left standing are the ones that can prove what they did.
>
> AiXin is built to be provable first and clever second. And it already runs the jobs a solo business does every week."

## 8. Questions you will get — honest answers

| Question | Answer |
|---|---|
| "Can it make me money on Fiverr/Upwork?" | No, and I won't build it that way. Those platforms forbid automated accounts, the work is open-ended, and there's no honest receipt for "the buyer was happy". AiXin does defined, repeatable, consequential work where a right answer exists. |
| "Why so few numbers on the proof page?" | Because they're real. A number I can't point you to on-chain isn't worth showing you. |
| "Is it certified / compliant?" | No. We align with the direction of the EU AI Act and agent rules; we hold no certification and I won't claim one. |
| "Is the token live?" | No. Token mechanics are designed and conditional. Nothing about them is live. |
| "Can it call my phone?" | Not yet — that needs a telephony provider and number filing. Today voice is Telegram voice notes, which is the same experience without the phone bill. |
| "What happens when it can't do something?" | It stops and says so — `BLOCKED, no live adapter`. The skill builder even warns you at creation time. It never invents a result to look useful. |

---

# 第二部分 — 中文

## 0. 上台前（前一晚，10 分钟）

| 检查项 | 位置 | 原因 |
|---|---|---|
| 主分身已孵化，4 个专家分身已存在（幕僚长、收件箱、财务、客服台） | `/dashboard` | 演示需要一个有内容的账户 |
| 至少 2 张逾期发票 | `/dashboard/money` | 第二幕需要真实数据 |
| Telegram 已连接，`/jobs` 有回复 | 您的 Telegram | 第四幕全程用手机 |
| Gmail 已连接（读取 + 草稿） | `/dashboard/adapters` | 第二幕需要生成真实草稿 |
| 已保存 06:00 夜间报告并开启语音 | `/dashboard/assistant` | 第一幕的语音留言 |
| 打开两个标签页：`/dashboard/jobs` 与 `/proof` | — | 台上不必临时找页面 |

预先定好的备选：Gmail 慢就改跑**夜间业务巡查**（无需任何连接）。链上慢时凭证仍显示「已签名，等待上链」——请当众说明；这种坦诚本身就是产品。

## 1. 一句话定调（30 秒）

> 「所有人都在做能替你操作业务的 AI 代理，却没人能给你看它到底做了什么。AiXin 可以——它的每一个动作都经过签名、需要批准，并且陌生人也能在公链上验证。」

钩子：

> 「贾维斯是你**希望**它守规矩的助手；AiXin 是能**证明**自己守了规矩的助手。」

## 2. 第一幕——「你睡觉的时候」（90 秒）

投屏打开 Telegram，发送 `/voice`。

AiXin 回复文字简报**并发送语音留言**。播放 15 秒。

说明：*「这份报告不是大模型猜的，而是从我的真实记录里整理出来的：完成的任务、等我批准的决策、已上链的凭证、失败的投递。什么都没发生时，它就说什么都没发生。」*

## 3. 第二幕——会等你的财务任务（2 分钟）

进入 `/dashboard/money`。

1. 点击**从 Stripe 导入**。*「这些不是我手工输入的，是 AiXin 从 Stripe 读来的。只读——它在设计上就无法收费、退款或作废。」*
2. 点击**催收逾期发票**。
3. 出现**决策卡**（等待批准）。*「涉及钱，所以它停下来。不是因为它没把握，而是规则规定由人决定。看内容：每个数字都来自发票，没有一处编造。」*
4. 批准。打开 Gmail →提醒邮件在**草稿箱**里。*「它仍然是草稿。AiXin 从未代我发出过一封邮件——证明页上的计数是 0，而且这个 0 来自真实记录。」*
5. 打开凭证 →点击 BscScan 链接。*「这就是刚才这个决策，此刻就在公链上。在场任何人都可以用自己的手机核验。」*

### 第二幕之二——「接入你已经在用的工具」（45 秒，可选）

打开 `/dashboard/adapters`，滚动连接卡片：Telegram、Gmail、**Microsoft 365 / Outlook**、**任意其他邮箱（IMAP）**、**企业微信**、**飞书**、**钉钉**、**Google Sheets**、**Stripe**、Webhook。

*「收件箱任务不在意你用哪个邮箱——Gmail 或 Outlook，行为完全一致：读取、分类、起草，并且没有任何发送能力。中国大陆团队的批准可以直接在企业微信、飞书或钉钉里收到。」*

在任一张卡片上点击**测试连接**：它会真正访问服务商并报告看到的结果。

> 「每一项连接都必须先自证，AiXin 才会把它标为可用。配置错误会在这里显示为错误——绝不会变成一个悄悄什么都不做的任务。」

如被问到，请如实说明限制：任意邮箱（IMAP）的连接测试仅在自建部署上可完成；钉钉没有读取接口，因此测试会发送一条清楚标注的测试信息，绝不涉及你的数据；若 Webhook 接收方宕机，推送会被暂存并自动重试，而不会丢失。

### 第二幕之三——只有你同意才会退款的店铺（2 分钟，冲击力最强）

**先讲真实场景（15 秒）：** *「我经营一家小网店。每周六十单，只有一个人打包。真正让我亏钱的只有两件事：一张订单压了三天没发货，以及因为回复太慢而输掉的退款争议。请看。」*

**演示前准备：** 在 `/dashboard/adapters` → **Shopify** 填入店铺域名与 Admin API 访问令牌，点击**测试连接**（会读取店铺并统计近期订单），并设为 **Live**。在 `/dashboard/jobs` 上对**盯着我的店铺订单**点击**设置**。

1. 在 `/dashboard/jobs` 对**盯着我的店铺订单**点击**立即执行**。*「这是通过 Shopify 官方 Admin API 读取店铺——也就是 Shopify 明确允许的自动化方式。不保存密码、不用浏览器假装成我、不违反任何平台条款。」*
2. 朗读结果：已付款但超过 48 小时未发货（含订单号）、款项未到账、部分退款仍有争议，以及等待发货的总金额。*「这些都是店铺里的真实订单。其中没有一句话是语言模型写的。」*
3. 接着是涉及金钱的一半。对 AiXin 说：**「给订单 #1042 退款 59.90」**。它会停下——**决策卡，高风险，等待批准**。念出卡片内容：订单总额、已退金额、仍可退金额、客户信息与风险标记。*「这些都是它在询问我之前从店铺读来的。它不是在猜，也没有付款。」*
4. 批准。退款在 **Shopify 中真实生成**，由 Shopify 自身通知客户，回执被签名并上链。点开 BscScan。
5. 最有力的一句：*「付款之前，它会重新读取订单，并把金额与仍可退金额再核对一次。如果我批准得太多，它会拒绝我自己的批准，并把这次拒绝记录下来。这就是普通助手与受治理助手的区别。」*

**明确说出可见成果：** *「九秒钟找出压了三天的未发货订单，并完成一笔金额正确、已通知客户、可被验证的退款——而且我从未把店铺密码交出去。」*

### 第二幕 d——店铺团队：四位专家，一个早晨（2.5 分钟，回答「那我到底能用它做什么」的一幕）

**先定调（20 秒）：** *「到目前为止都是一位专家做一件事。现在是整个团队。还有一点先说清楚：AiXin 不会帮你打造一家赚钱的店——它不选品、不定价、不投广告、不发营销内容，我也不会假装它能。它做的是真正决定店铺赚不赚钱的琐碎工作：未收回的款、未发出的货、未回复的客户，以及再也没回来的买家。」*

**演示前准备：** Shopify、Gmail、Telegram 均已连接并设为 live。在 `/dashboard/jobs` 设置好**店铺晨间巡店**与**唤回我的老客户**。在 `/dashboard/assistant` 添加 07:30 的巡店计划并勾选**语音**。

1. 打开 `/dashboard/recipe` 停留两秒。*「整个搭建过程都在这里，一屏一步，每步都有实时状态。没人需要记住我这段讲解。」*
2. 点击**店铺晨间巡店**的「现在就做」。朗读这一份结果——四个部分、四位负责人：**店务**负责待发货订单，**财务**负责仍未收回的款项（来自 Stripe 与你自己的记录），**收件箱**只列出未读客户邮件的主题，**参谋长**负责等待你签署的事项与隔夜投递失败。
3. 指向你故意没连接的那一部分：*「它写着「未连接」。它没有悄悄跳过，也没有编造。这句话本身就是产品。」*
4. 说：*「什么都没有改动。按构造就是只读——产物里明确记录 `changed_anything: false`。这就是每天早上 07:30 发到我聊天里的消息，含文字与朗读。」*
5. 接着是涉及金钱的一半。点击**唤回我的老客户**的「现在就做」。它会停下：**决策卡，高风险**。念出内容：只买过一次、已沉寂 60 天以上的客户，附真实订单号与金额，每次运行上限十位。
6. 批准。草稿出现在**邮箱草稿箱**——并未发送。打开一封：它只引用客户真实的订单，别无其他。没有编造的折扣，没有做不到的承诺。
7. 最有力的一句：*「每位客户一生只写一封——就算我每天运行，也不可能骚扰同一个人两次。它写信，我决定并发送。这不是加了安全开关的营销工具，而是恰好相反。」*

**明确说出可见成果：** *「一条 07:30 的消息，替代四次登录；十封写给我早已放弃的客户的个性化问候——每封都等我签署，事后每封都可验证。」*


## 4. 第三幕——它知道自己不知道什么（60 秒）

用一个已批准资料未覆盖的问题运行**问答**任务。它会拒答，并说明原因。

> 「今天您看到的其他演示都会回答这个问题——自信且错误。拒答，才是您真正买的东西。」

## 5. 第四幕——一个聊天窗口管理整个业务（90 秒）

投屏手机 Telegram：`/jobs` → `/run 1` → `/pending` → `/approve <code>`。

> 「与仪表盘完全相同的管线、签名与上链凭证。AiXin 刻意不留任何更省事的通道——捷径就是审计链上的漏洞。」

## 6. 第五幕——证明页（45 秒）

打开 `/proof`。

> 「这不是宣传页，而是对真实记录的计数：71 次受治理动作、71 次上链、66 次批准被执行、5 次拒绝被尊重、0 封代发邮件。数字不大——但每一个都可核验。没有任何竞争对手能放出这样一页。」

然后在 `/dashboard/jobs` 点击**复制我的案例**并粘贴出来。

## 7. 收尾（30 秒）

> 「三个入口，一条信任轨道：消费者用平台，企业跑受治理的任务，开发者基于无界面 API 构建。这场代理热潮建立在无边界的信任之上——对你生活的最高权限，却没有任何记录。2026 年 9 月起这不再是假设：首例由自主代理实施的数据泄露已向监管机构备案，欧盟的罚则也已生效。等这笔账单落地时，还能站住的只有能证明自己做过什么的代理。
>
> AiXin 先做到可证明，再谈聪明。而它今天已经能承担个体企业每周都要做的工作。」

## 8. 常见提问与诚实回答

| 问题 | 回答 |
|---|---|
| 「能帮我在 Fiverr 上赚钱吗？」 | 不能，我也不会那样做。那些平台禁止自动化账号，工作是开放式的，也无法为「买家满意」开出诚实凭证。AiXin 做的是有正确答案、可重复、有后果的明确工作。 |
| 「证明页数字为什么这么小？」 | 因为它们是真的。无法带您在链上查到的数字，不值得展示。 |
| 「拿到认证 / 合规了吗？」 | 没有。我们对齐欧盟《AI 法案》与代理监管的方向，但不持有任何认证，也不会声称有。 |
| 「代币上线了吗？」 | 没有。代币机制仅为设计且有条件，没有任何部分已上线。 |
| 「能打电话给我吗？」 | 还不能，需要电信服务商与号码报备。今天的语音是 Telegram 语音留言，体验相同但不产生话费。 |
| 「做不到的时候会怎样？」 | 它会停下并说明——`BLOCKED，无可用连接`。技能构建器甚至在创建时就会提醒您。它绝不会为了显得有用而编造结果。 |
