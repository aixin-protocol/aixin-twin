# Ask AiXin — Intent-First Home

> Addendum to PRD.md. Documents the default screen the user lands on
> after sign-in and onboarding in the AiXin reference implementation.

## Why

A control-panel dashboard forces the user to know what to click. AiXin's
promise is a governed *agent*, not a form. The front door is therefore a
single intent prompt — one text box, one Master Twin — that turns any
natural-language goal into a proposed team of Specialist Twins with the
Skills they need, gated by a Decision Card before anything runs.

## Route

`/dashboard/ask` — default landing after `/auth` sign-in and after
`/onboarding` completes.

## Flow (three phases)

### 1. Prompt phase
- Centered Master Twin (Aria) avatar with pulsing status ring.
- Large multi-line composer.
- **Domain tiles** to mitigate the blank-prompt problem:
  Travel · Marketing · Money · Work · Health · Something else.
  Each tile reveals editable goal-starters the user can tweak.

### 2. Thinking phase (~2–3s)
Animated Chain of Thought reveals 6 internal steps sequentially:
1. Parsing intent
2. Consulting memory
3. Selecting domain
4. Choosing Specialist
5. Mapping Skills
6. Drafting approval gates

Each step shows a spinner while "now", then a check when done.

### 3. Plan phase
- Proposed **team** (Specialist Twins) with roles.
- Required **Skills**, with a "capability gap" indicator for any skill
  the user has not installed yet (links directly to Marketplace / SkillCraft).
- Numbered **steps** the twins will run.
- **SIP approval gate** — the plan cannot execute without user approval;
  high-risk actions inside the plan produce Decision Cards downstream.

### 4. Working phase (post-approval)
- Live "working 24/7" status indicator.
- Deployed Specialist(s) visible.
- **Channel toggles** for notifications: App · WhatsApp · WeChat.

## Navigation

The left sidebar collapses to a slim icon rail (persisted to
`localStorage`). "Ask AiXin" is pinned at the top of the nav. "Chat with
Aria" is removed from the main menu — the Ask AiXin flow is the primary
conversation surface; the chat page remains reachable for open-ended
follow-ups.

## Data / SIP integration

The Plan phase emits a canonical SIP `plan.approve` intent that goes
through the deterministic validator (`sip.server.ts` / `@aixin-protocol/
validator-server`) exactly like any other Decision Card, so approval is
already Ed25519-signed and BSC-anchored — no separate code path.

## Reference screens

- Prompt: Master Twin hero + domain tiles.
- Thinking: pinging halo + Chain-of-Thought card revealing steps one at a time.
- Plan: team, skills (with gaps), steps, approval gate.
- Working: live status + channel toggles.
