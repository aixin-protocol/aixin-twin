# AiXin — China Tester Fix Report / 中国区测试修复说明

**Build tested / 测试版本:** aixin-sandbox.lovable.app
**Report date / 报告日期:** 2026-08-09 feedback (Aaron, JiaJia) → fixes verified 2026-08-10
**Retest URL / 复测地址:** https://aixin-sandbox.lovable.app/

---

## 1. Summary / 概要

**EN.** Six of the seven reported issues are fixed and verified with automated tests. One (the black overlay on Windows 7 / Chrome 109) is only partially improved: that browser generation is below our support baseline, and the app now tells the user so instead of rendering a broken page.

**中文。** 反馈的 7 个问题中，6 个已修复并通过自动化测试验证。剩余 1 个（Windows 7 / Chrome 109 上的黑色遮罩）只做了部分改善：该浏览器版本低于我们的支持基线，应用现在会明确提示用户升级，而不是显示错乱页面。

---

## 2. What was fixed / 已修复项

| # | Reported issue / 反馈问题 | Root cause / 根本原因 | Fix / 修复方式 | How to retest / 如何复测 |
|---|---|---|---|---|
| 1 | Repeated crash "Failed to execute 'insertBefore' on 'Node'" when creating an Expert / task / assigning a skill.<br>创建专家、创建任务或分配技能时反复崩溃。 | The browser's machine translation (Chrome/Edge/QQ/360/UC) rewrote text nodes that React still owned. The page also declared `lang="en"` while showing Chinese, so the browser always offered to translate.<br>浏览器自动翻译改写了 React 正在管理的文本节点；页面 `lang` 一直是 `en`，导致浏览器总是提示翻译。 | `<html lang>` now follows the in-app EN/中文 switcher, and the document declares `translate="no"`, `class="notranslate"` and `<meta name="google" content="notranslate">`.<br>页面语言随应用内语言开关同步，并声明禁止自动翻译。 | Switch to 中文, then create an Expert, create a task, and assign a skill. No crash, and the browser no longer offers to translate.<br>切换到中文后依次创建专家、创建任务、分配技能，不再崩溃，也不再弹出翻译提示。 |
| 2 | Blurry text, ghosting, semi-transparent panels.<br>文字模糊、重影、面板半透明。 | Theme colors used `oklch()`, unsupported on older Chromium.<br>主题色使用 `oklch()`，旧版 Chromium 不支持。 | Every theme token now ships an sRGB hex fallback before the `oklch()` value.<br>所有主题色都补充了 sRGB 十六进制回退值。 | Open the dashboard: surfaces are solid cream/dark, text has full contrast.<br>打开控制台页面，背景为实色，文字对比度正常。 |
| 3 | Pop-ups taller than the screen; the confirm button could not be reached.<br>弹窗高度超出屏幕，看不到确认按钮。 | Dialogs had no height cap on small viewports.<br>弹窗在小屏幕没有高度上限。 | All dialogs are capped at 92% of viewport height with internal scrolling and sticky footer actions.<br>所有弹窗限制为视口高度 92%，内部滚动，操作按钮固定可见。 | On a phone (or a 375×600 window) open Install skill / Create expert and scroll to the confirm button.<br>用手机或 375×600 窗口打开“安装技能/创建专家”，可滚动到确认按钮。 |
| 4 | Task output mixed Chinese and English.<br>任务输出中英文混杂。 | The server generated prose without knowing the UI language.<br>服务端生成内容时不知道界面语言。 | The UI locale is now sent with every delegation and stored on the intent; server-generated reports, chat replies, and trace events follow it.<br>界面语言随每次委派发送并记录在意图中，服务端生成的报告、对话回复与审计事件均按该语言输出。 | In 中文 mode, run a task end-to-end: title, trace, outcome, and email body are all Chinese.<br>中文模式下完整跑一个任务，标题、审计轨迹、结果与邮件正文均为中文。 |
| 5 | "Adapter / 适配器" was not understandable.<br>“适配器”一词难以理解。 | Literal translation of an engineering term.<br>直译工程术语。 | Renamed to 外部工具连接（适配器） with a plain-language explainer on the page.<br>改为“外部工具连接（适配器）”，并在页面加入通俗说明。 | Open 外部工具连接 in the sidebar and read the intro line.<br>打开侧边栏“外部工具连接”查看说明。 |
| 6 | Results labelled "Draft" looked like a failure.<br>结果显示“草稿”，看起来像失败。 | Tasks are intentionally not executed when no real tool is connected — the reason was never shown.<br>未连接真实工具时任务不会真正执行，但没有解释。 | The task page now explains why the outcome is a draft and links directly to connect the required tool.<br>任务页现在说明草稿原因，并提供直达连接工具的链接。 | Run a task without Gmail connected: the notice and link appear.<br>未连接 Gmail 时运行任务，会出现说明与链接。 |

---

## 3. Partially fixed / 部分修复

**Black overlay on Windows 7 (Chrome 109) — Aaron.**
The sRGB fallbacks above improve it, but Chrome 109 on Windows 7 is below our support baseline (it lacks the modern CSS the product relies on and no longer receives security updates). The app now shows a dismissible bilingual banner on such browsers recommending the latest Chrome/Edge or a current QQ/360/UC browser on Windows 10+.

**Windows 7（Chrome 109）黑色遮罩 —— Aaron。**
上述 sRGB 回退有所改善，但 Windows 7 上的 Chrome 109 低于我们的支持基线（缺少产品依赖的现代 CSS，且已停止安全更新）。应用现在会在此类浏览器上显示可关闭的中英提示，建议升级到最新 Chrome/Edge 或 Windows 10 及以上的 QQ/360/UC 浏览器。

---

## 4. Verification evidence / 验证证据

| Check / 检查项 | Result / 结果 |
|---|---|
| `e2e/translate-repro.py` — forces an aggressive machine-translation stand-in (MutationObserver rewriting every text node) across `/`, `/auth`, `/dashboard`, `/verify/:id` | 15/15 passed — no `insertBefore` / `removeChild` / React DOM crash |
| `e2e/ui-smoke.py` — landing, single H1, ZH toggle, 375/414/768px overflow, auth, route guard, public verify, dialog inside 375×600 | 11/11 passed |
| `src/lib/locale-output.test.ts` — every English string the server emits must translate to Chinese with no English leaks | 26 passed |
| `src/lib/translate-guard.test.ts` — source asserts `notranslate` declarations and the dialog height cap stay in place | 6 passed |
| Full unit suite / 全部单元测试 | 56 passed |

---

## 5. What to retest first / 建议优先复测

1. Switch to 中文 and create an Expert → create a task → assign a skill (issue #1).
   切换中文后：创建专家 → 创建任务 → 分配技能。
2. Repeat the same flow on a phone, checking every pop-up's confirm button (issue #3).
   在手机上重复同一流程，检查每个弹窗的确认按钮。
3. Run a task to completion in 中文 and read the outcome + email (issue #4).
   中文模式下完整运行一个任务，查看结果与邮件。
4. Note your browser and OS version in any new report — it decides whether an issue is a bug or an unsupported browser.
   反馈时请附上浏览器与操作系统版本，便于判断是缺陷还是浏览器不支持。
