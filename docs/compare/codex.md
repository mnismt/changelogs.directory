# Codex - Tool Comparison Research

> Last Updated: 2026-01-17
> Source: https://developers.openai.com/codex/pricing/

## Overview

**Tagline**: "The ChatGPT tax"

**Best For**: People already paying for ChatGPT who want agent tasks + code reviews

Codex is OpenAI’s coding agent product. The key thing to understand is that it’s **quota-shaped**, not token-metered:

- Limits are expressed as **ranges per time window**
- Your actual throughput depends on task complexity (repo size, long context, cloud vs local)
- Codex usage is **shared with your ChatGPT plan quota** (this is the real gotcha)

## Editorial

### Worth It?

> "If you already have ChatGPT Pro, Codex is basically free power. If you're on Plus, you'll feel the ceiling fast. And if you’re trying to buy Codex capacity without paying the ChatGPT tax… you can’t."

### Pros

1. **Cloud tasks** - The right abstraction for longer-running agent work.
2. **Code reviews** - A distinct quota bucket (weekly) makes reviews feel "safe".
3. **Works with ChatGPT ecosystem** - Same account, familiar UX.

### Cons

1. **Shared quota with ChatGPT** - Your chat usage competes with your coding usage.
2. **Limits are ranges** - You won’t know the real cap until you hit it.
3. **Not token-transparent** - Hard to predict cost/throughput compared to Cursor.

### Category Notes

| Category | Take |
|----------|------|
| Pricing | Subscription-shaped, quota-behaved. Ranges, time windows, shared pool. |
| Agents | Cloud tasks are great for long jobs, but they're quota-gated. |
| Models | Model menu is less important than quota throughput. |

---

## Pricing Model

**Type**: Subscription quota (shared with ChatGPT)

**How it works**: Your ChatGPT plan includes a quota for Codex usage. Those limits are expressed as ranges per time window, and vary based on how heavy your requests are.

### Published Usage Limits (FAQ)

Codex publishes three relevant metrics:

- **Interactive prompts** ("Local messages") per **5 hours**
- **Agent tasks** ("Cloud tasks") per **5 hours**
- **Code reviews** per **week**

Important context from OpenAI:

- Small/simple tasks use less quota.
- Large codebases, long-running tasks, and extended sessions use more quota.
- Cloud tasks are not available on API-key usage.

### Plans (Codex)

> The numbers below are ranges published by OpenAI. Treat them as directional.

| Plan | Interactive prompts / 5h | Agent tasks / 5h | Code reviews / week | Notes |
|------|--------------------------|------------------|---------------------|-------|
| ChatGPT Plus | 45-225 | 10-60 | 10-25 | Shared with ChatGPT usage |
| ChatGPT Pro | 300-1500 | 50-400 | 100-250 | Shared with ChatGPT usage |
| ChatGPT Business | 45-225 | 10-60 | 10-25 | Shared with ChatGPT usage |
| ChatGPT Enterprise & Edu | N/A | N/A | N/A | No fixed limits: usage scales with credits |
| API key | Usage-based | Not available | Not available | Pay-as-you-go tokens, but no Codex Cloud Tasks |

---

## Models

Codex is ultimately backed by OpenAI models, but the compare-relevant point is:

- Your experience is dominated by **quota throughput**, not which model string is selected.

In `/compare`, treat Codex as a **quota-first tool**, with models as secondary detail.

---

## Gotchas

1. **The ChatGPT tax is real** - Buying Codex implicitly means buying a ChatGPT plan.

2. **Local vs cloud matters** - Cloud tasks have their own quota, but aren’t available via API key.

3. **Ranges hide cliffs** - You might get 200 prompts in a window on easy tasks or 40 on heavy tasks.

---

## Data Model Notes (for `src/data/tool-comparison.ts`)

Codex should be represented as:

- `metering`: `quota_subscription`
- `sharedWith`: `["chatgpt"]`
- `quotaWindows`:
  - `5h`: `interactive_prompts` + `agent_tasks` (ranges)
  - `week`: `code_reviews` (ranges)

---

## Links

- https://developers.openai.com/codex/pricing/
