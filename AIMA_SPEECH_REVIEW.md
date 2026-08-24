# AiXin — Vetting Report on Dr. Aima's Training Script
# AiXin — 艾玛博士培训讲稿审阅报告

Date: 24 Aug 2026 · Reviewer: AiXin core team (against the live codebase + ROADMAP truth labels)
Scope: "What Is AiXin? 15-Minute Training Speech" (Aurian CEAA draft docx). Because this is **training material** — not a one-off speech — every claim a trainee repeats must survive the question "can you show me?"

---

## 1. Verdict / 总体结论

| Dimension 维度 | Rating 评级 | Notes 说明 |
|---|---|---|
| Vision & framing 愿景与定位 | ✅ Faithful 忠实 | "Not another chatbot", digital twins for ordinary people, human-centred — matches Track 1 of the curriculum. |
| 爱/信 brand story 品牌故事 | ✅ Faithful 忠实 | Love + trust is exactly why the trust layer exists. |
| Product mechanics 产品机制 | ⚠️ Incomplete 不完整 | The script never mentions SIP, Decision Cards, signed receipts or public verification — the things that make AiXin *AiXin* and not OpenClaw/Hermes. A trainee finishing this session cannot explain the product's core. |
| Claims accuracy 说法准确性 | ⚠️ 3 over-claims 三处过度承诺 | Autonomous income, self-learning, and $AXN settlement are stated as present tense; in the live system they are gated, manual, or planned. |
| Demo-ability 可演示性 | ⚠️ Missing 缺失 | A training session needs a "show, don't tell" moment. The script has none. |

Overall: **approve with corrections.** The heart is right; the trust machinery and truth labels must be added before this is used to train community leaders.

总体：**修正后可用。** 初心与定位都对，但必须补上信任机制与事实标签，才能用于培训社区领袖。

---

## 2. What is faithful — keep it / 讲得准的地方 —— 保留

- "AiXin uses AI, but it is much more than an AI tool." ✅ — matches M1 exactly.
- Digital Twins for ordinary people, not just tech experts. ✅ — matches the whole Track 1 audience design.
- The trainer / consultant / mother / retired professional examples. ✅ — these map 1:1 to the OPC and template modules (M17–M20).
- "Our Digital Twin is not created to replace us. It is created to expand our time and capabilities." ✅ — this is the human-in-the-loop philosophy; keep verbatim.
- The closing three takeaways. ✅ — correct, and they become *stronger* once the receipts paragraph (Insert A) is added.

---

## 3. Claims that need correction / 需要修正的说法

| # | Script says 讲稿原文 | Reality in the live system (Aug 2026) 当前系统实情 | Fix 修正 | Label 标签 |
|---|---|---|---|---|
| 1 | "Even when you are… sleeping… this digital version of you can continue to answer questions, assist customers, connect resources, and even **create income**." | Answering, drafting and low-risk tasks run automatically. Anything consequential — money, publishing, booking, trading — **stops at a Decision Card and waits for your approval**. This is a feature, not a limitation. | Add one sentence (see Insert A). | 🟢 Live, human-gated |
| 2 | "Over time, it can **learn**: what you are good at… how you communicate… what you believe in…" | There is no automatic self-learning memory yet. The twin represents what **you explicitly teach it**: your onboarding profile, the skills you install, the rules and adapters you connect. | Reframe as "you teach it" (Amend D). | 🔵 Planned (auto-learning) |
| 3 | "Within the AiXin ecosystem, **$AXN can become** part of the value exchange and settlement system." | $AXN settlement is **planned, not live**. What exists today: a Ledger Preview (clearly labelled simulated balances), reputation entries, and ERC-8004 feedback on BSC Testnet. Never present token settlement as working. | Replace with labelled version (Replace C). | 🔵 Planned |
| 4 | "AiXin aims to help every individual build a **digital identity** that can continue to grow…" | True and demonstrable: every hatched twin is registered with an **ERC-8004 on-chain identity on BSC Testnet**. Say "on testnet today" — it is honest and impressive. | Keep + add "on BSC Testnet today". | 🟢 Live (testnet) |
| 5 | "(Is it personal agent / assistant like **OpenClaw & Hermes**?)" — the draft leaves this bracketed and unanswered | This is the single most important comparison question a trainee will face. OpenClaw-style agents act autonomously with no deterministic validation and no receipts — when they go wrong, there is nothing to verify. AiXin's answer is SIP. | Answer it head-on (Insert B). | — |
| 6 | (Entire script) | No mention of SIP validation, Decision Cards, signed receipts, or public verification. For a *speech* this is a simplification; for **training** it is a gap — graduates cannot answer "why AiXin and not a free agent?" | Add the trust-layer paragraph (Insert A). | — |
| 7 | "remain available 24 hours a day" | Fine, with one honest clause: every run is bounded by budgets (steps / tokens / time / monthly cap) and an operator kill switch, so a twin can never run away with your wallet. | Optional one clause. | 🟢 Live |
| 8 | "contributions… can be recorded, and the contributors may receive appropriate **rewards**" | Reputation recording is live (reputation entries + on-chain feedback on testnet). Monetary rewards are planned. Keep the sentence but let Replace C carry the money part. | Keep + label. | 🟢 / 🔵 |

---

## 4. Ready-to-paste fixes / 可直接粘贴的修改

### Insert A — after "It is not only designed to answer our questions." (§1)
### 插入 A —— 放在第一节 "AiXin 不只是回答问题的工具" 之后

> **EN:** Here is what makes AiXin different from every AI tool you have tried. Before your Digital Twin takes any consequential action — spending money, publishing content, making a booking — the platform checks that action against fixed, deterministic rules. We call this the Secure Intent Pipeline, or SIP. If the action is risky, it stops and asks you first, with a Decision Card that shows the evidence. Whatever you decide — approve or reject — AiXin signs a receipt and anchors it on a public blockchain. Anyone can verify that receipt. Your twin never acts behind your back, and it never needs to — because every action can be proven.
>
> **ZH（可直接朗读）:** AiXin 和你用过的所有 AI 工具有一个根本区别：当你的数字孪生要执行任何重要动作 —— 比如动钱、发布内容、下订单 —— 平台会先用一套固定、确定的规则去校验这个动作。我们叫它「安全意图管线」，简称 SIP。如果动作有风险，它会停下来，用一张「决策卡」把证据摆在你面前，先问过你。无论你批准还是拒绝，AiXin 都会生成一张加密签名的回执，并锚定到公开的区块链上，任何人都可以验证。你的孪生永远不会背着你行动 —— 也不需要，因为每个动作都能被证明。

### Insert B — answering the OpenClaw / Hermes question (§1)
### 插入 B —— 回答「它是不是像 OpenClaw / Hermes 那样的个人智能体？」

> **EN:** You may have seen personal agents like OpenClaw or Hermes. They are powerful, but they act first and you find out later — there is no independent validation, no approval gate, and no receipt you can verify. If such an agent refunds the same customer twice, nobody can prove what happened or why. AiXin twins are just as capable, but every consequential action passes through SIP, your approval, and a signed, verifiable receipt. Same capability — with accountability.
>
> **ZH:** 你可能见过 OpenClaw、Hermes 这样的个人智能体。它们很强大，但它们是先行动、你后知道 —— 没有独立校验，没有审批关卡，也没有可验证的回执。如果这样的智能体把同一个客户退款退了两次，没人能证明发生了什么、为什么发生。AiXin 的孪生能力一样强，但每个重要动作都要经过 SIP 校验、你的审批，以及一张签名可验证的回执。能力相同，但多了问责。

### Replace C — the $AXN paragraph (§3, "Third")
### 替换 C —— 第三节「第三」中的 $AXN 段落

> **EN:** When genuine value is created, every contribution is recorded — today, as reputation that follows each twin, anchored on-chain on BSC Testnet. And looking ahead, the ecosystem plans to introduce $AXN as part of value exchange and settlement. That part is under design, not live yet — and when it arrives, it will sit on the same foundation of receipts and verification you can already use today.
>
> **ZH:** 当真实的价值被创造出来，每一份贡献都会被记录 —— 今天，它以「声誉」的形式跟随每个孪生，并锚定在 BSC 测试链上。展望未来，生态计划引入 $AXN 作为价值交换与结算的一部分。这部分还在设计中，尚未上线 —— 而当它到来时，它会建立在你今天就能使用的回执与验证体系之上。

### Amend D — the "Over time, it can learn…" paragraph (§1)
### 修改 D —— 第一节「它会逐渐学习……」段落

> **EN:** It does not only know your name. You teach it — step by step, and always under your control: what you are good at, whom you can help, what products or services you provide, and the rules it must never break. Everything your twin knows comes from what you chose to give it — and it never acts beyond the skills and tools you connected.
>
> **ZH:** 它不只是知道你的名字。由你来教它 —— 一步一步，而且始终在你的掌控之下：你擅长什么、你能帮助谁、你提供什么产品或服务、以及它永远不能违反的规则。你的孪生所会的一切，都来自你主动教给它的内容 —— 它绝不会超出你安装的技能和连接的工具去行动。

---

## 5. Add a live demo moment / 增加一个现场演示环节

Training sticks when the audience *sees* a receipt. After Insert A, do this (3 minutes):

1. Open the app, delegate one real task (e.g. a daily briefing or a refund review).
2. Show the **Decision Card** with its evidence.
3. Approve it, then open **`/verify/<sip_id>`** in a browser and hand the phone to the audience: payload hash, signature, BscScan link — visible to anyone, no login needed.
4. Say: "No other agent platform can show you this page." / 说：「没有其他智能体平台能给你看这一页。」

Fallback if the network fails: pre-screenshot a receipt page and the matching BscScan transaction. Full click-by-click walkthrough for the trainer: `AIXIN_EDUCATION.md` **§17 — The complete journey** (added with this review).

---

## 6. Where each part maps in the curriculum / 讲稿与课程的对应

| Script section 讲稿段落 | Curriculum module 对应模块 | Status 状态 |
|---|---|---|
| §1 More than an AI tool | M1 What AiXin is / M2 Trust pipeline | 🟢 |
| §2 Why everyone needs a twin | M17 OPC time-and-money map | 🟢 |
| §3 Three core values | M3 Receipts & verification / M11 Ecosystem | 🟢 / 🔵 ($AXN) |
| §4 vs traditional platforms | M15 Capabilities / M19 Best practices | 🟢 |
| §5 Ordinary people | M16 First twin in 30 min (+ §17 walkthrough) | 🟢 |
| §6 Vision & 爱/信 | M12 Community & investor story | 🟢 |

---

*This review follows the curriculum's truth-labelling rule: never teach a Sandbox or Planned capability as if it were live. The same rule protects Dr. Aima's credibility on stage.*
*本审阅遵循课程的事实标签规则：绝不把沙盒或规划中的能力讲成已上线。这同样保护艾玛博士在台上的信誉。*
