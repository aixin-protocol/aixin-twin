# What Is AiXin? — Training Speech (Revised v2, with Live Demo)
# 什么是 AiXin？—— 培训讲稿（修订版 v2，含现场演示）

**Based on:** Dr. Aima's draft "What Is AiXin? 15-Minute Training Speech" (Aurian CEAA docx)
**Revised by:** AiXin core team, 24 Aug 2026, per `AIMA_SPEECH_REVIEW.md`
**New length:** ~18 minutes speaking + 3-minute live demo (was 15 minutes, no demo)

---

## How to read this document / 如何阅读本文档

| Marker 标记 | Meaning 含义 |
|---|---|
| 🟢 **[ADDED]** | New content that was not in the original draft 原稿没有的新增内容 |
| 🟡 **[CHANGED]** | Original wording modified — the ~~struck-through~~ text is the original, the **bold** text is the replacement 原句被修改 —— 删除线是原文，粗体是改后 |
| 🔴 **[REMOVED]** | Original content deleted 原稿内容被删除 |
| *(no marker)* | Original text kept exactly as Dr. Aima wrote it 无标记 = 原文保留 |

**Summary of changes / 修改总览**

| # | Location 位置 | Type 类型 | What changed 改了什么 | Why (review ref) 原因 |
|---|---|---|---|---|
| 1 | §1 question list | 🟡 Changed | The bracketed, unanswered "(Is it a personal agent like OpenClaw & Hermes?)" is now a real question that gets answered | A trainee will be asked this on day one (Review #5) |
| 2 | §1, after "…answer our questions." | 🟢 Added | **Insert B** — AiXin vs OpenClaw/Hermes, head-on answer | The core differentiator was missing (Review #5, #6) |
| 3 | §1, after Insert B | 🟢 Added | **Insert A** — the trust layer: SIP validation, Decision Cards, signed receipts, public verification | A graduate must be able to explain why AiXin is AiXin (Review #6) |
| 4 | §1 opening vision | 🟡 Changed | "…and even create income" now carries an approval clause | Consequential actions are human-gated today; this is a feature (Review #1) |
| 5 | §1 "Over time, it can learn…" | 🟡 Changed | Reframed as "**You** teach it" (Amend D) | No automatic self-learning in the live system; the twin represents what you explicitly give it (Review #2) |
| 6 | §3 "Second" (24 hours) | 🟡 Changed | Added budget / kill-switch clause | Every run is bounded — honest and reassuring (Review #7) |
| 7 | §3 "Third" ($AXN) | 🟡 Changed | Replaced with **Replace C** — reputation recording is live today; $AXN settlement is labelled as planned | Never present token settlement as working (Review #3, #8) |
| 8 | §3 "First" (digital identity) | 🟢 Added | One sentence: every twin is registered with an on-chain identity (ERC-8004) on BSC Testnet today | True, demonstrable, impressive (Review #4) |
| 9 | New §7 before Conclusion | 🟢 Added | **Live demo moment (3 min)** — delegate a task, show the Decision Card, approve, show `/verify/<sip_id>` | Training sticks when the audience *sees* a receipt (Review §5) |
| 10 | Conclusion | 🟢 Added | Optional 4th takeaway line about receipts | Review note: the three takeaways stay verbatim; the receipt line is optional reinforcement |
| 11 | Nothing removed | — | 🔴 No content was deleted. All original sections survive; the two weakest claims were reworded in place rather than cut | Preserve Dr. Aima's voice and flow |

---

# The Revised Speech / 修订后的讲稿

## What Is AiXin?

### Training Speech (~18 minutes + 3-minute live demo)

Dear family members and friends, good day to everyone.

Thank you for taking the time to join us today.

Today, I would like to introduce you to a new platform that may influence the way we live, work, and create value in the future.

This platform is called AiXin.

The topic of today's sharing is very simple:

What exactly is AiXin?
And what does AiXin have to do with each one of us?

Before we begin, I would like to invite you to imagine something.

What if, one day, there is another version of you in the digital world?

It understands your experience, knowledge, profession, products, services, ideas, and values.

Even when you are resting, sleeping, travelling, or spending time with your family, this digital version of you can continue to answer questions, assist customers, connect resources, and even 🟡 **[CHANGED]** ~~create income~~ **help create income — and before it takes any important action, it stops and asks for your approval first. I will show you exactly how that works in a few minutes.**

Would such a digital version of you be valuable?

This is what AiXin is helping us to build.

### 1. AiXin Is More Than an AI Tool

When people first hear about AiXin, they may ask:

"Is it another version of ChatGPT?"
"Is it a chatbot?"
🟡 **[CHANGED]** ~~(Is it personal agent / assistant like OpenClaw & Hermes?)~~ **"Is it a personal agent, like OpenClaw or Hermes?"**
"Is it a tool for writing articles or creating images?"

The answer is:

AiXin uses artificial intelligence, but it is much more than an AI tool.

With a normal AI tool, we ask a question and receive an answer. When we close the application, the relationship may end there.

AiXin is not only designed to answer our questions.

🟢 **[ADDED — Insert B, answering the OpenClaw / Hermes question]**

> You may have seen personal agents like OpenClaw or Hermes. They are powerful, but they act first and you find out later — there is no independent validation, no approval gate, and no receipt you can verify. If such an agent refunds the same customer twice, nobody can prove what happened or why. AiXin twins are just as capable, but every consequential action passes through independent validation, your approval, and a signed, verifiable receipt. Same capability — with accountability.
>
> **（中文可朗读版）** 你可能见过 OpenClaw、Hermes 这样的个人智能体。它们很强大，但它们是先行动、你后知道 —— 没有独立校验，没有审批关卡，也没有可验证的回执。如果这样的智能体把同一个客户退款退了两次，没人能证明发生了什么、为什么发生。AiXin 的孪生能力一样强，但每个重要动作都要经过独立校验、你的审批，以及一张签名可验证的回执。能力相同，但多了问责。

🟢 **[ADDED — Insert A, the trust layer]**

> Here is what makes AiXin different from every AI tool you have tried. Before your Digital Twin takes any consequential action — spending money, publishing content, making a booking — the platform checks that action against fixed, deterministic rules. We call this the Secure Intent Pipeline, or SIP. If the action is risky, it stops and asks you first, with a Decision Card that shows the evidence. Whatever you decide — approve or reject — AiXin signs a receipt and anchors it on a public blockchain. Anyone can verify that receipt. Your twin never acts behind your back, and it never needs to — because every action can be proven.
>
> **（中文可朗读版）** AiXin 和你用过的所有 AI 工具有一个根本区别：当你的数字孪生要执行任何重要动作 —— 比如动钱、发布内容、下订单 —— 平台会先用一套固定、确定的规则去校验这个动作。我们叫它「安全意图管线」，简称 SIP。如果动作有风险，它会停下来，用一张「决策卡」把证据摆在你面前，先问过你。无论你批准还是拒绝，AiXin 都会生成一张加密签名的回执，并锚定到公开的区块链上，任何人都可以验证。你的孪生永远不会背着你行动 —— 也不需要，因为每个动作都能被证明。

It is designed to help every individual build a personal:

**Digital Twin.**

What is a Digital Twin?

In simple words, it is a digital version of you that can represent you, understand you, 🟡 **[CHANGED]** ~~learn from you~~ **be taught by you**, and assist you in the digital world.

It does not only know your name.

🟡 **[CHANGED — Amend D]** ~~Over time, it can learn:~~ **You teach it — step by step, and always under your control:**

~~What you are good at; what experience you have; whom you can help; what products or services you provide; how you communicate; what you believe in; and what kind of value you want to create.~~

> **what you are good at; whom you can help; what products or services you provide; and the rules it must never break. Everything your twin knows comes from what you chose to give it — and it never acts beyond the skills and tools you connected.**
>
> **（中文可朗读版）** 由你来教它 —— 一步一步，而且始终在你的掌控之下：你擅长什么、你能帮助谁、你提供什么产品或服务、以及它永远不能违反的规则。你的孪生所会的一切，都来自你主动教给它的内容 —— 它绝不会超出你安装的技能和连接的工具去行动。

Therefore, we can explain AiXin in one simple sentence:

AiXin is a platform that helps every person transform their knowledge, experience, abilities, and personal value into digital assets.

### 2. Why Does Everyone Need a Digital Twin?

*(This entire section is unchanged from Dr. Aima's original — the trainer, consultant, beauty consultant, health adviser, insurance adviser, property agent, lawyer, accountant, entrepreneur, content creator and senior-person examples are all kept verbatim. 本节完全保留原文。)*

In the past, the value of an individual was limited in many ways.

We only have 24 hours a day.

We can only serve a limited number of people at one time.

We cannot be available at every moment to answer customers' questions.

We may have a great deal of experience, but we may not know how to organise, preserve, or pass it on.

Sometimes, we are capable and experienced, but we do not know how to present or promote ourselves.

As a result, much of our knowledge and experience remains only in our minds.

When we do not have the time or energy, or when we are not physically present, our ability to create value also stops.

A Digital Twin can help us overcome these limitations.

Let us look at a simple example.

Imagine that you are a trainer.

You may have accumulated ten or twenty years of teaching experience.

In the past, students could only learn from you when you were personally standing in front of the classroom.

With a Digital Twin, your courses, experience, ideas, case studies, and communication style can gradually be transferred into your personal intelligent system.

In the future, even when you are not online, your Digital Twin may help your students to:

Answer basic questions;
understand their learning needs;
recommend suitable courses;
provide initial guidance;
and connect them with the real you when deeper support is required.

Let us take another example.

If you are a business consultant, your Digital Twin may first understand a customer's challenges, organise their needs, and determine whether your professional services are suitable for them.

It can then connect qualified customers directly to you.

The same applies if you are a beauty consultant, health adviser, insurance adviser, property agent, lawyer, accountant, entrepreneur, content creator, or even a senior person with a lifetime of valuable experience.

As long as you have knowledge, experience, a story, or useful resources, your value can be digitalised, preserved, and multiplied.

AiXin is not designed only for technology experts.

AiXin is designed for ordinary individuals, professionals, entrepreneurs, business owners, and content creators.

### 3. The Three Core Values of AiXin

If we want to understand AiXin in the simplest way, we can look at its three core values.

**First: AiXin Helps Us Build a Digital Identity**

Today, we have different accounts on different platforms.

We have one identity on WeChat, another identity on TikTok, Xiaohongshu, Facebook, or Instagram, and different information on different e-commerce platforms.

However, these accounts do not necessarily belong completely to us.

If a platform changes its rules, suspends our account, or closes down, the content, customers, and relationships we have accumulated may also be affected.

AiXin aims to help every individual build a digital identity that can continue to grow over time.

This digital identity is not only a name and profile picture.

It may include:

Our knowledge, experience, abilities, reputation, relationships, and records of contribution.

🟢 **[ADDED]** And this is already real today: when you create your Digital Twin on AiXin, it is registered with an on-chain identity — following the ERC-8004 standard — on the BSC Testnet, a public blockchain. Your twin's identity does not live only in our database; anyone can look it up and confirm it exists.

> **（中文可朗读版）** 这一点今天已经可以演示：当你在 AiXin 创建数字孪生时，它会按照 ERC-8004 标准，在 BSC 测试链这条公开区块链上注册一个链上身份。你的孪生身份不只存在我们的数据库里 —— 任何人都能查到、确认它真实存在。

In the future, we will not only have a social media account.

We will have a genuine digital life asset that can represent who we are.

**Second: AiXin Helps Us Build a Personal Intelligent Agent**

Our digital identity tells people who we are.

Our personal intelligent agent helps us do things.

It can gradually learn our professional knowledge and the way we provide our services.

It can become our personal digital assistant and remain available 24 hours a day 🟡 **[CHANGED]** **— and always within limits you set. Every task your twin runs is bounded by a budget of steps, time and spend, and you hold a kill switch that can stop it instantly. A twin can never run away with your time or your wallet.**

When we are in a meeting, it can assist with enquiries.

When we are resting, it can provide basic answers.

When we are unable to manage a large amount of information, it can help organise it.

When someone needs our product or service, it can help identify that need.

Most importantly, our Digital Twin is not created to replace us.

It is created to expand our time and capabilities.

It allows us to focus our precious time on matters that require human judgement, trust, care, and emotional connection.

Therefore, we should not only worry about being replaced by AI.

We should learn how to make AI our partner.

**Third: AiXin Connects Value With Rewards**

AiXin is not designed merely for Digital Twins to chat with people.

More importantly, when a Digital Twin identifies a genuine need, it can help connect the person with suitable knowledge, products, services, or resources.

For example:

If someone wants to learn business management, the system may connect them with a suitable trainer.

If someone needs health management support, it may connect them with an appropriate professional.

If someone is looking for a business opportunity or partnership, it may connect them with relevant resources.

🟡 **[CHANGED — Replace C]** ~~When a genuine service, transaction, or collaboration is completed, the value contributed by different participants can be recorded, and the contributors may receive appropriate rewards. Within the AiXin ecosystem, $AXN can become part of the value exchange and settlement system.~~

> **When genuine value is created, every contribution is recorded — today, as reputation that follows each twin, anchored on-chain on BSC Testnet. And looking ahead, the ecosystem plans to introduce $AXN as part of value exchange and settlement. That part is under design, not live yet — and when it arrives, it will sit on the same foundation of receipts and verification you can already use today.**
>
> **（中文可朗读版）** 当真实的价值被创造出来，每一份贡献都会被记录 —— 今天，它以「声誉」的形式跟随每个孪生，并锚定在 BSC 测试链上。展望未来，生态计划引入 $AXN 作为价值交换与结算的一部分。这部分还在设计中，尚未上线 —— 而当它到来时，它会建立在你今天就能使用的回执与验证体系之上。

Therefore, AiXin is not only building another traffic-based platform.

It is building a digital economic ecosystem where:

Value can be discovered, connected, recorded, and rewarded.

### 4. How Is AiXin Different From Traditional Platforms?

*(Unchanged from the original 本节保留原文。)*

Traditional platforms usually focus heavily on traffic and attention.

Those with a large number of followers are more likely to be seen.

Those who can spend more money on advertising may receive greater exposure.

However, many people with genuine knowledge, experience, and ability may not know how to attract followers or manage online traffic.

AiXin focuses more on the genuine value that each person can create.

In the AiXin ecosystem, a person's knowledge, experience, reputation, relationships, and contributions can gradually be accumulated.

You may teach someone today.

You may help a customer tomorrow.

You may connect a valuable collaboration the day after.

These contributions should not simply disappear over time.

They should become part of your long-term digital assets.

AiXin introduces a new way of thinking:

In the future, a person's most important assets will not only be money and property. They will also include knowledge, reputation, relationships, contributions, and a personal Digital Twin.

### 5. What Does AiXin Mean to an Ordinary Person?

*(Unchanged from the original 本节保留原文。)*

Some people may say:

"I am not an expert."
"I am not an entrepreneur."
"Do I really need AiXin?"

My answer is yes.

Every person has their own unique value.

A mother may have valuable parenting experience.

A retired professional may have decades of industry knowledge.

A salesperson may understand what customers truly need.

A small business owner may know how to produce an excellent product.

A young person may be talented in design, video production, communication, or new technology.

In the past, these experiences may not have been organised, recorded, or recognised.

AiXin wants to make technology available not only to large corporations, but also to every ordinary person.

You do not need to understand complicated technology at the beginning.

You can start with a few simple steps:

Understand yourself;
organise your life and work experience;
identify your strengths and expertise;
think about whom you can help;
and gradually build your own Digital Twin.

Joining AiXin is not simply about registering an account.

It is also a journey of rediscovering yourself.

We begin to ask:

Who am I?
What value do I have?
Whom can I help?
What do I want to leave behind in this world?

### 6. What Does AiXin Ultimately Want to Create?

*(Unchanged from the original 本节保留原文。)*

AiXin aims to create a human-centred intelligent economic ecosystem that is built upon trust and driven by meaningful value contribution.

In this ecosystem, AI is not a distant or frightening technology.

It is a tool that serves humanity.

Technology helps us preserve wisdom.

Digital Twins help us multiply our abilities.

The platform helps us connect needs with solutions.

The value system helps us record contributions.

But trust between people remains the foundation of the entire ecosystem.

This is also why we call it AiXin.

In Chinese, "Ai" means love.

It represents warmth, care, connection, and the willingness to contribute to others.

"Xin" means trust.

It also represents credibility, information, and belief.

Technology without warmth cannot go very far.

Traffic without trust cannot build a sustainable ecosystem.

AiXin brings together the efficiency of artificial intelligence and the warmth of humanity.

### 7. 🟢 **[ADDED] Let Me Show You (Live Demonstration — 3 minutes) 现场演示环节**

> Words are easy. Receipts are proof. If the room has a screen, do this live; if not, use the pre-taken screenshots.

1. Open the AiXin app and delegate one real task to your twin — for example, a daily briefing or a refund review.
2. Show the audience the **Decision Card**: the proposed action, and the evidence behind it.
3. Approve it. Then open **`/verify/<sip_id>`** in a browser and hand the phone to the audience: the payload hash, the cryptographic signature, and the BscScan blockchain link — visible to anyone, no login needed.
4. Say: **"No other agent platform can show you this page."**
   说：「没有其他智能体平台能给你看这一页。」

**Fallback 备用方案:** if the network fails, show a pre-screenshot receipt page next to the matching BscScan transaction. Full click-by-click trainer walkthrough: `AIXIN_EDUCATION.md` **§17 — The complete journey: from sign-up to a verified receipt**.

### Conclusion

Dear family members and friends, if there are only three things you remember from today's sharing, I hope you will remember these:

First, AiXin helps every individual build a personal Digital Twin.

Second, AiXin helps us transform our knowledge, experience, abilities, and reputation into digital assets that can continue to grow.

Third, AiXin allows value to be discovered, needs to be connected, and contributions to be rewarded.

🟢 **[ADDED — optional fourth line]** And because every important action leaves a signed, verifiable receipt, you never have to take my word for any of this — you can check it yourself.

The future may not be an age in which humans compete against artificial intelligence.

The future may be an age in which people learn to work, grow, and create value together with their own Digital Twins.

By learning about AiXin today, we are not simply learning about a new platform.

We are beginning to consider how we can preserve our wisdom, multiply our value, and build a digital life that can continue into the future.

AiXin is more than an intelligent platform.

It is another version of us in the digital world.

It is also a bridge that enables every ordinary person to enter the new era of the intelligent economy.

Thank you, everyone.

I am Dr. Aima.

In the sessions ahead, I will continue to guide you step by step—to understand AiXin, build your own Digital Twin, and discover your unique position and value in this new intelligent economic era.

Thank you.

---

## Trainer's pre-session checklist / 讲师课前检查表

🟢 **[ADDED]**

| # | Check 检查项 | Where 位置 |
|---|---|---|
| 1 | Sign in and confirm your Master Twin is live | App → Ask AiXin |
| 2 | Run the demo task once before the session; save the `/verify/<sip_id>` URL | App → Governance / Tasks |
| 3 | Screenshot the receipt page + BscScan transaction as offline fallback | Browser |
| 4 | Rehearse Insert A and Insert B in both languages | This document, §1 |
| 5 | If asked about $AXN, use the Replace C wording: "planned, not live yet" | This document, §3 |

*Truth-labelling rule 事实标签规则: never teach a Sandbox or Planned capability as if it were live. This rule protects your credibility on stage — every claim in this speech survives the question "can you show me?" 绝不把沙盒或规划中的能力讲成已上线。这条规则保护你在台上的信誉 —— 这份讲稿里的每个说法都经得起「能演示给我看吗？」这个问题。*
