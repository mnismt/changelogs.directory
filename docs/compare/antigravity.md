# Antigravity - Tool Comparison Research (Google)

> Last Updated: 2026-01-17
> Source: [Antigravity](https://antigravity.google/), [Pricing Plan](https://antigravity.google/docs/plans), Product copy (rate limits + plans text), Google AI Pro/Ultra entitlements

## Overview

**Tagline**: "The generous mystery"

**Best For**: People who want a full agent product with Google-backed capacity (and don’t need BYOK)

Antigravity is unusually hard to compare because the business model is still moving:

- It does not publish hard numeric quotas.
- It describes limits as **capacity-based** and correlated with "amount of work".
- Plans are effectively tiered by whether you have **Google AI Pro / Ultra** style entitlements.

The outcome: in practice it can feel extremely generous, but it’s not expressible as "X prompts per window".

## Editorial

### Worth It?

> "If you have Google AI Ultra, Antigravity feels like cheating. If you don’t, the quota story is fuzzy and weekly-gated. It’s the opposite of Cursor: zero transparency, lots of horsepower."

### Pros

1. **Feels extremely generous** - Especially on Ultra tiers.
2. **Full agent feature set** - Agent manager + browser integration.
3. **Unlimited tab completions + commands** - The "baseline" is high.

### Cons

1. **No hard numbers** - You can’t plan capacity ahead of time.
2. **Weekly gates** - Non-Ultra users get weekly rate limits.
3. **No BYOK** - No API keys, no custom endpoints, no buying extra throughput.

### Category Notes

| Category | Take |
|----------|------|
| Pricing | Quota-based with refresh windows, mostly qualitative. |
| Agents | Built as a product (manager + browser), not just a chat wrapper. |
| Models | Uses Gemini 3 Pro/Flash + Vertex Model Garden models (details vary). |

---

## Pricing / Limits Model

**Type**: Subscription entitlement + qualitative quotas

Antigravity describes its limits as:

- Different refresh cadences (5h vs weekly)
- Weekly rate limits (higher vs none)
- Limits correlate with agent work done per prompt

### What Antigravity Actually Promises

All plans receive:

- Core agent model: Gemini 3 Pro, Gemini 3 Flash, and other offered Vertex Model Garden models
- Unlimited tab completions
- Unlimited command requests
- Access to all product features (Agent Manager, Browser integration)

### Tiers (Qualitative)

Antigravity describes tiers by Google AI entitlements:

| Entitlement | Refresh cadence | Weekly cap | Quota quality | Notes |
|------------|-----------------|------------|--------------|-------|
| Google AI Ultra / Workspace AI Ultra for Business | Every 5 hours | None | Highest / most generous | Best lane, no weekly rate limit |
| Google AI Pro | Every 5 hours | Higher weekly cap | High / generous | Still can hit weekly limit |
| No Google AI plan | Weekly | Weekly cap | Meaningful | Weekly reset + weekly cap |

Important vendor caveat:

- Limits are determined by available capacity.
- Limits correlate with the amount of agent work (so you get more prompts on easy tasks).

---

## Models

Published descriptions are intentionally broad:

- Gemini 3 Pro, Gemini 3 Flash
- Vertex Model Garden models as the core agent model

Treat context windows and exact model availability as **unknown/variable**.

---

## BYOK

There is currently no support for:

- Bring-your-own-key (BYOK)
- Bring-your-own-endpoint
- Contracted organizational tiers (GA)

This is a meaningful differentiator vs Opencode/Claude Code API-key workflows.

---

## Data Model Notes (for `src/data/tool-comparison.ts`)

Antigravity should be represented as:

- `metering`: `quota_subscription`
- `sharedWith`: not claimed (unknown)
- `entitlements`: `["google_ai_ultra", "google_ai_pro"]` (soft modeling)
- `quotaWindows`:
  - `5h`: metric `interactive_prompts` with `quotaLevel` (highest/generous)
  - `week`: metric `interactive_prompts` with `quotaLevel` (meaningful) + weekly cap notes

---

## Links

- (Add official docs link when public.)
