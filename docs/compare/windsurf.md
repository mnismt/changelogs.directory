# Windsurf - Tool Comparison Research

> Last Updated: 2026-01-16
> Source: [windsurf.com/pricing](https://windsurf.com/pricing), [docs.windsurf.com/windsurf/models](https://docs.windsurf.com/windsurf/models)

## Overview

**Tagline**: "The free lunch"

**Best For**: Budget-conscious devs who want premium capabilities without premium prices

Windsurf (by Cognition, the Devin team) has made aggressive moves in the AI editor space. Their killer feature? **Genuinely free models** including their in-house SWE-1.5, which is competitive with frontier models.

## Editorial

### Worth It?

> "If you're budget-conscious, Windsurf is the answer. SWE-1.5 is free and actually good - near Claude 4.5-level performance at 13x the speed. For $15/mo, you get 500 credits to use on premium models when you need them. That's half the cost of Cursor Pro."

### Pros

1. **Free models that work** - SWE-1.5, DeepSeek-R1, Grok Code Fast. Zero credits. Actually usable.
2. **Predictable pricing** - Credits per request, not tokens. You know what each request costs.
3. **Aggressive pricing** - Pro at $15/mo is the cheapest premium tier in the market.

### Cons

1. **Newer, less mature** - Not as polished as Cursor. Some rough edges.
2. **Cognition's track record** - Devin had a rocky launch. Trust issues linger.
3. **Claude Opus is expensive** - 20 credits/request for Opus 4.1. Burns fast.

### Category Notes

| Category | Take |
|----------|------|
| Models | SWE-1.5 is the sleeper hit. Free, fast, and genuinely good. |
| Pricing | The free model strategy is brilliant. Use SWE-1.5 for most work, premium for hard problems. |
| Agents | Solid agent capabilities, but no background agents like Cursor. |

---

## Pricing Model

**Type**: Credits-per-request (fixed)

**How it works**: Each request costs X credits based on model tier. Windsurf markets this as “prompt credits”. The key idea: the unit is **credits per request**, not tokens, and conversation length generally doesn’t change the sticker price.

**Normalization note for `/compare`**: map this to `ToolMetering.type = "credits_per_request"`.

### Plans

| Plan | Monthly | Credits | Add-ons |
|------|---------|---------|---------|
| **Free** | $0 | 25/mo | — |
| **Pro** | $15 | 500/mo | $10/250 credits |
| **Teams** | $30/user | 500/user/mo | $40/1000 pooled |
| **Enterprise** | $60/user | 1000/user/mo | $40/1000 pooled |

### Real-World Costs

| Usage Pattern | Typical Monthly Cost |
|---------------|---------------------|
| Light (free models only) | $0-15 |
| Daily (mostly free + some premium) | $15-40 |
| Heavy (premium models) | $40-100+ |

### Credit Costs by Model

**Rule**: Keep costs as credits. Dont try to back-calculate tokens.

#### Free Models (0 Credits)

| Model | Credits | Notes |
|-------|---------|-------|
| **SWE-1.5** | 0 | Windsurf's best agentic model. Near Claude 4.5-level. |
| **SWE-1** | 0 | Previous gen, still solid. |
| **GPT-5.1-Codex** | 0 | OpenAI's coding model. |
| **GPT-5.1-Codex Mini** | 0 | Faster, lighter. |
| **xAI Grok Code Fast** | 0 | Fast coding assistance. |
| **DeepSeek-R1** | 0 | Open reasoning model. |
| **DeepSeek-V3-0324** | 0 | Open model. |

#### Budget Models (0.25-0.5 Credits)

| Model | Credits |
|-------|---------|
| SWE-1.5 Fast | 0.5 |
| GLM 4.7 | 0.25 |
| gpt-oss 120B (Medium) | 0.25 |
| Qwen3-Coder | 0.5 |
| Kimi K2 | 0.5 |
| Minimax M2/M2.1 | 0.5 |
| GPT-5.1 (Low Reasoning) | 0.5 |

#### Standard Models (1-2 Credits)

| Model | Credits |
|-------|---------|
| Claude Sonnet 4.5 | 2 |
| Claude Haiku 4.5 | 1 |
| Gemini 2.5 Pro | 1 |
| Gemini 3 Pro (Low-High) | 1-2 |
| Gemini 3 Flash (Low-High) | 0.75-1.75 |
| GPT-5.2 (No-Medium Reasoning) | 1-2 |
| GPT-4o | 1 |
| GPT-4.1 | 1 |
| o3 | 1 |

#### Premium Models (3-8 Credits)

| Model | Credits |
|-------|---------|
| Claude Sonnet 4.5 (Thinking) | 3 |
| Claude Opus 4.5 | 4 |
| Claude Opus 4.5 (Thinking) | 5 |
| GPT-5.2 (High Reasoning) | 3 |
| GPT-5.2 (Extra High Reasoning) | 8 |
| GPT-5.2 (High Reasoning Fast) | 6 |
| GPT-5.2 (Extra High Reasoning Fast) | 16 |

#### Ultra Expensive Models (20 Credits)

| Model | Credits | Notes |
|-------|---------|-------|
| Claude Opus 4.1 | 20 | Most expensive. Use sparingly. |
| Claude Opus 4.1 (Thinking) | 20 | Extended reasoning. |

#### BYOK (Bring Your Own Key)

| Model | Notes |
|-------|-------|
| Claude 4 Opus | BYOK only |
| Claude 4 Opus (Thinking) | BYOK only |
| Claude 3.5 Sonnet | BYOK on Free tier |
| Claude 3.7 Sonnet | BYOK on Free tier |

### Cost Example

Using Claude Sonnet 4.5 (2 credits/request):
- 50 requests/day × 30 days = 1500 credits/mo
- 500 included + 1000 add-on ($40) = **$55/mo total**

Using SWE-1.5 (FREE):
- Unlimited requests = **$15/mo flat** (or $0 on Free tier)

### Free Trial

- 2-week Pro trial
- 100 credits during trial

### Team/Enterprise Features

| Feature | Teams | Enterprise |
|---------|-------|------------|
| Centralized billing | ✅ | ✅ |
| Admin dashboard | ✅ | ✅ |
| Priority support | ✅ | Higher |
| SSO | ❌ | ✅ |
| SCIM | ❌ | ✅ |
| RBAC | ❌ | ✅ |
| Longer context | ❌ | ✅ |

---

## Models

### SWE-1.5 - The Headline Model

Windsurf's in-house frontier model built specifically for software engineering:
- **Performance**: Near Claude 4.5-level
- **Speed**: 13x faster than comparable models
- **Cost**: FREE (0 credits)
- **Best for**: General agentic coding, most daily tasks

This is Windsurf's biggest differentiator. They're giving away a competitive model for free.

### Model Availability by Plan

Some models have different costs or availability per plan:

| Model | Free | Pro | Teams | Enterprise |
|-------|------|-----|-------|------------|
| SWE-1.5 | ✅ | ✅ | ✅ | ✅ |
| Claude Sonnet 4.5 | ❌ | ✅ (2 cr) | ✅ (3 cr) | ✅ |
| Claude 3.5 Sonnet | BYOK | ✅ (2 cr) | ✅ | ✅ |

*Note: Some models cost more credits on Teams tier.*

---

## Agent Capabilities

| Capability | Supported | Notes |
|------------|-----------|-------|
| File editing | ✅ | Multi-file support |
| Terminal | ✅ | Integrated |
| Browser Previews | ✅ | Built-in previews |
| App Deploys | ✅ | 1/day (Free), 10/day (Pro) |
| MCP | ✅ | Full support |
| Background agents | ❌ | Not available |
| Codebase search | ✅ | Fast Context feature |
| Workflows | ✅ | Automated sequences |

### Unique Features

- **Cascade**: Their agentic assistant (like Cursor's Agent)
- **Fast Context**: Optimized codebase indexing
- **App Deploys**: One-click deployment
- **Memories & Rules**: Persistent context across sessions
- **AGENTS.md**: Custom agent instructions

---

## Platforms & Integrations

### Platforms

| Platform | Supported |
|----------|-----------|
| Windows | ✅ |
| macOS | ✅ |
| Linux | ✅ |
| Web | ❌ |

### IDE Plugins

Windsurf also offers plugins for:
- JetBrains IDEs

---

## Privacy & Security

| Feature | Status |
|---------|--------|
| Local mode | ❌ |
| No training on code | ✅ |
| SOC 2 certified | ❓ (Not prominently advertised) |
| Admin controls | ✅ (Teams+) |

---

## Gotchas

1. **Claude Opus 4.1 = 20 credits** - Thats effectively $0.80/request on Pro. 25 requests = 500 credits = your entire monthly allowance.

2. **Free tier is very limited** - 25 credits/month is only ~12 Claude Sonnet requests. Fine for trying, not for working.

3. **Teams costs MORE per credit** - Some models have higher credit costs on Teams tier (e.g., Claude Sonnet 4.5: 2 credits on Pro, 3 credits on Teams).

4. **Credits don't roll over** - Monthly credits expire. Only add-on credits carry over.

---

## Links

- [Pricing Page](https://windsurf.com/pricing)
- [Models Documentation](https://docs.windsurf.com/windsurf/models)
- [Plans & Credit Usage](https://docs.windsurf.com/windsurf/accounts/usage)
