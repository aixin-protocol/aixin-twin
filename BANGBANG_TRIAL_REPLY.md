# BangBang trial version — our reply to management
# 邦邦 App 试用版 —— 我方回复与进度说明

Date / 日期: 2026-08-20 · From / 发件方: AiXin team · To / 收件方: BangBang management 邦邦管理层
Reference / 参考文件: `BANGBANG_APP_PRD.md`（完整需求与架构设计）、`BANGBANG_ON_AIXIN.md`（平台分工）

---

## 1. Summary / 结论先说

- Your request and the requirements in *BangBangKH_Workflow and Content for APP Trial Version Development & Testing (2026.8.15)* have been **fully reviewed and accepted into scope for the trial version**.
  贵方的需求文档已完整评审，并纳入试用版开发范围。
- The trial design is specified in the PRD (`BANGBANG_APP_PRD.md`) — roles, screens, AI modules, compliance envelope, and test plan.
  试用版设计已在 PRD 中定稿：角色权限、页面清单、AI 能力、合规要求、测试计划。
- **Target: a working trial version running in the AiXin sandbox by mid-September 2026**, ready for your Phase 1 internal testing.
  目标：**2026 年 9 月中旬**在 AiXin 沙盒环境上线可用的试用版，供贵方第一阶段内部测试。
- The trial moves the demo mockup to a real application: real accounts, real data isolation, real AI modules, real audit trail — not a click-through prototype.
  试用版将演示原型升级为**真实应用**：真实账号、真实数据隔离、真实 AI 能力、真实审计留痕，而非点击式样机。

---

## 2. Our understanding of your requirements / 我们对贵方需求的理解

### 2.1 What you asked for / 核心诉求

| # | Your requirement 贵方要求 | Our understanding 我们的理解 |
| --- | --- | --- |
| 1 | A complete app test version, not a mockup 需要完整可测的 App 版本 | Installable/openable build with working end-to-end flows for every role |
| 2 | Internal testing first, then grayscale to parents 先内测，再对家长灰度 | Two gated builds: P0 for internal testing, P1 for grayscale |
| 3 | All four roles must work 四类角色齐备 | 学生 / 家长 / 教师 / 机构 — with account linking and strict data visibility |
| 4 | Full AI module coverage AI 功能全覆盖 | 14 modules specified; delivered in three stages so testing can start early |
| 5 | Device compatibility, including old phones 设备兼容（含老旧机型） | Shared core + WeChat Mini Program + packaged Android/iOS shell; low-end Android in the device matrix |
| 6 | Installation package 安装包分发 | Packaged mobile shell (APK / iOS build) alongside the Mini Program |
| 7 | Youth mode, anti-addiction, content safety 青少年模式与内容安全 | Enforced in the client shell + fail-closed safety gate on the server |
| 8 | Bug fixing, stress testing, regression 缺陷修复、压力与回归测试 | Bug taxonomy with SLAs + regression suite + concurrency targets |
| 9 | Policies, agreements, declarations 政策、协议与声明 | Privacy policy, user agreement, permission disclosure, AI-content declaration |

### 2.2 Your four phases, mapped / 四阶段对应关系

| Your phase 贵方阶段 | Our build 我方交付 | Gate 验收口径 |
| --- | --- | --- |
| Phase 1 内部测试 | **P0 trial build** — photo problem recognition + error analysis, all-subject grading, math practice generation + PDF export, error notebook, AI chat, student profile v1, youth mode | All roles usable end-to-end; no fatal/major defects open |
| Phase 2 真实用户灰度 | **P1 build** — composition generation/polishing, English oral dialogue, emotional analysis + parent monitoring, class analytics | Invite-only rollout, compliance spot-checks pass |
| Phase 3 修复与压力测试 | **P2 build** + stress/regression/release lock | Concurrency targets met, full regression green |
| Phase 4 文档与协议定稿 | Compliance document pack | Policies and declarations signed off by the operating entity |

---

## 3. The trial version to be launched in the sandbox / 沙盒试用版说明

### 3.1 What it is / 是什么

The trial version is the BangBang app **built on the AiXin Digital Twin platform** and hosted in AiXin's sandbox environment. BangBang owns the product surface and curriculum; AiXin provides the twins, skills, governance, safety screening, multi-tenancy, WeChat channel and audit evidence.
试用版是**基于 AiXin 数字孪生平台构建的邦邦 App**，运行在 AiXin 沙盒环境。邦邦负责产品界面与课程内容；AiXin 提供数字孪生、技能、治理流程、内容安全、多租户隔离、微信通道与审计凭证。

### 3.2 What will be usable in mid-September / 9 月中旬可用范围

| Area 范围 | In the trial 试用版包含 |
| --- | --- |
| Access 登录 | Real registration/login/logout, role switching, student↔parent↔teacher↔institution linking |
| Student 学生端 | Photo problem recognition, step-by-step explanation, error analysis, homework submission, error notebook, AI tutoring chat, math practice + printable PDF |
| Parent 家长端 | Linked child view, homework and grading results, learning profile v1, usage/screen-time visibility, notifications |
| Teacher 教师端 | Class roster, assignment review, AI grading with teacher override (always recorded), class-level view |
| Institution 机构端 | Organisation setup, member/role management, model pinning, safety mode, usage overview |
| Safety 安全 | Fail-closed content screening on every AI output; off-syllabus/medical/political/adult topics refused; youth mode + time limits |
| Evidence 留痕 | Every consequential action (teacher override, report publication, escalation) recorded with a signed receipt |
| Channel 通道 | WeChat notifications (Mini Program subscribe messages / Official Account replies) |
| Shells 客户端 | Shared H5/React core, running in the WeChat Mini Program container and in the packaged mobile shell |

### 3.3 What is deliberately **not** in the mid-September trial / 本次试用版暂不包含

To keep the internal-testing date honest, these are staged into P1/P2 as agreed in the PRD:
为保证 9 月中旬如期内测，以下按 PRD 分期交付：

- Composition animated short video 作文动画短视频（P2）
- 升学路径 pathway report and institution guidance-keyword injection（P2）
- English oral scoring at full accuracy（P1；试用版先提供文本对话）
- Deep emotional-analysis parent dashboard（P1）
- Production-grade concurrency and HA GPU serving（sandbox is a demo host, not sized for full class-hour load 沙盒为演示主机，未做班级并发容量）
- Licensed domestic content-safety vendor（trial runs the local baseline gate; the licensed classifier is required before real minors' data 试用期使用本地基线筛查，正式上线前须接入持牌厂商）

### 3.5 When the remaining items are delivered / 未包含部分的交付时间表

Taking the mid-September trial (P0) as **T0 ≈ 15 Sept 2026**:
以 9 月中旬 P0 试用版上线为基准（T0 ≈ 2026-09-15）：

| Batch 批次 | Contents 内容 | Delivery 交付时间 |
| --- | --- | --- |
| **T0 + 2 weeks**<br>约 9 月底 | Phase 1 defect closure (no fatal/major), device-compatibility fixes, performance budgets met, role-isolation matrix green; English oral **dialogue with basic scoring**; parent emotional-wellbeing panel **v1 (summary level)**<br>内测缺陷清零、机型兼容与性能达标、角色隔离测试全绿；英语口语对话+基础评分；家长情绪面板 v1 | Gate 1 review 一号关口评审 |
| **T0 + 5–6 weeks**<br>约 10 月下旬 | **P1 complete**: Chinese composition generation/polishing, English oral scoring at target accuracy, full emotional-analysis + parent monitoring, class-level teacher analytics; grayscale-ready build<br>P1 全量：作文生成/润色、口语评分达标、情绪分析与家长监护、班级学情分析 | Start of grayscale 进入灰度 |
| **T0 + 10–11 weeks**<br>约 12 月初 | **P2 complete**: composition animated short video, 升学路径 pathway report, institution guidance-keyword injection, institution backend depth<br>P2 全量：作文动画短视频、升学路径报告、机构引导关键词、机构后台完整功能 | Feature-complete 功能封版 |
| **T0 + 13–14 weeks**<br>约 12 月底 / 1 月初 | Concurrency targets (50 → 300 concurrent consultations), HA GPU serving, full regression, release lock, compliance document pack<br>并发容量、GPU 高可用、全量回归、版本锁定、合规文档包 | Release lock 发布锁定 |

**Honest answer on "everything within 2 weeks after mid-September" / 关于“9 月中旬后两周内全部完成”的坦率答复**

Two weeks after T0 is realistic for **hardening plus the lighter P1 items** (row 1 above) — that is what we will commit to.
It is **not** realistic for the whole remaining scope. Three items are irreducibly larger than two weeks:
两周内可完成的是**内测加固 + P1 轻量功能**（上表第一行），我方承诺该范围；但**全部剩余范围**无法在两周内完成，以下三项客观上需要更长时间：

1. **Composition animated short video 作文动画短视频** — video generation, per-frame + narration safety screening, async job infrastructure. 4–5 weeks of build plus quality tuning. 视频生成、逐帧与旁白安全审核、异步任务体系。
2. **English oral scoring at target accuracy 英语口语评分达标** — needs a labelled pronunciation set and iteration against it; accuracy cannot be rushed without misleading students. 需要标注语音集与多轮调优。
3. **Concurrency + HA serving 并发与高可用** — depends on GPU capacity procurement and queued serving; the sandbox host is not the production topology. 依赖 GPU 容量采购与排队式推理服务。

Plus items **outside our control**: the licensed content-safety vendor contract, ICP·算法备案·内容安全备案 (6–12 weeks, external), Mini Program and app-store registrations.
另有不受我方控制的外部事项：持牌内容安全厂商签约、ICP 与算法/内容安全备案（外部流程 6–12 周）、小程序与应用商店账号注册。

If BangBang needs the December dates pulled earlier, the two available levers are (a) adding a second engineering pod to run P1 and P2 in parallel, or (b) dropping the composition video from the trial and shipping it as a post-launch feature. Either is workable — it is a decision for you, not a technical blocker.
若贵方希望提前 12 月节点，可选方案：(a) 增加一个开发小组，P1 与 P2 并行；(b) 将作文动画短视频移出试用版，作为上线后功能迭代。二者均可执行，请贵方决策。


### 3.4 Ground rules for the trial / 试用期约定

1. **No real minors' PII in the sandbox.** Test accounts and anonymised data only, until the filings and the licensed safety vendor are in place.
   沙盒阶段**不得录入真实未成年人个人信息**，仅使用测试账号与匿名数据。
2. **No AI result is invented.** When recognition confidence is low or a subject is unsupported, the app says so in Chinese and offers "让老师看看" instead of guessing.
   AI 不臆造结果：识别置信度低或超纲时明确提示，并提供转人工选项。
3. **Compliance filings (ICP·算法备案·内容安全备案) attach to the operating entity**, not to the sandbox. Hosting on AiXin does not transfer them.
   合规备案归属实际运营主体，沙盒托管不代表已完成备案。

---

## 4. What we need from BangBang / 需贵方配合事项

| # | Item 事项 | Needed by 需求时间 |
| --- | --- | --- |
| 1 | P0 golden set: grades/subjects in scope + expected answers, and the person who signs off pedagogical accuracy 内测题库与教学准确性签核人 | before build freeze 内测前 |
| 2 | Internal test cohort: how many users per role, from which centres 内测人员名单（按角色） | 2 weeks before mid-Sept 提前两周 |
| 3 | Operating entity for the filings, and 备案 status 运营主体与备案进度 | ASAP 尽快 |
| 4 | Licensed content-safety vendor selection and contract 持牌内容安全厂商选定 | before grayscale 灰度前 |
| 5 | Distribution preference for the installation package (direct APK / Chinese Android stores / both) 安装包分发方式 | before packaging 打包前 |
| 6 | Institution guidance keywords: author and approval cadence 机构引导关键词的编写与审核机制 | before P2 |
| 7 | WeChat Mini Program and Official Account accounts + template message IDs 微信小程序/公众号账号与模板消息 ID | before notifications go live 通知上线前 |

---

## 5. Next steps / 下一步

1. BangBang confirms this reply and the PRD scope. 邦邦确认本回复与 PRD 范围。
2. AiXin starts the P0 build immediately; weekly written progress note. AiXin 立即启动 P0 开发，每周书面进度同步。
3. Mid-September: sandbox trial version handed over with a test guide, test accounts and a bug-reporting channel. 9 月中旬交付沙盒试用版，附测试指引、测试账号与缺陷反馈通道。
4. Phase 1 internal testing runs; defects triaged by 致命/严重/轻微/体验建议 with agreed SLAs. 进入第一阶段内测，按缺陷等级与 SLA 处理。
5. Gate 1 review together, then proceed to grayscale planning. 共同评审 Gate 1，再启动灰度计划。

---

*Full specification: `BANGBANG_APP_PRD.md`. Platform division of labour: `BANGBANG_ON_AIXIN.md`. Delivery tracking: `ROADMAP.md` → Phase 3.7.*
*完整规格见 `BANGBANG_APP_PRD.md`；平台分工见 `BANGBANG_ON_AIXIN.md`；交付跟踪见 `ROADMAP.md` 第 3.7 阶段。*
