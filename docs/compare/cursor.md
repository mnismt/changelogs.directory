# Cursor - Tool Comparison Research

> Last Updated: 2026-01-16
> Source: [cursor.com/pricing](https://cursor.com/pricing), [cursor.com/docs/models](https://cursor.com/docs/models)

## Overview

**Tagline**: "The polished one"

**Best For**: IDE lovers who want everything integrated

Cursor is a VS Code fork that's become the gold standard for AI-native code editors. It's polished, feature-rich, and has a strong community. The downside? The pricing model can surprise you.

## Editorial

### Worth It?

> "Yes, if you code 4+ hours/day. Tab completion alone saves 30min daily. At $20/mo, that's a no-brainer. But that $20 is just the starting point - daily agent users should budget $60-100/mo."

### Pros

1. **Tab completion is addictive** - Feels like it reads your mind. Once you use it, you can't go back.
2. **Background agents** - Queue up work while you're in meetings. Set it and forget it.
3. **Polished UX** - It just works. No config rabbit holes. Familiar VS Code feel.

### Cons

1. **Another Electron app** - RAM usage is... noticeable.
2. **Token burn adds up** - The "$20/mo" headline is misleading for heavy users.
3. **Locked in** - No terminal-only mode. You use their editor or nothing.

### Category Notes

| Category | Take |
|----------|------|
| Models | Access to all frontier models, but Claude Sonnet is the default for a reason. |
| Pricing | The $20 → $60 jump is rough. Most devs are fine on Pro, but daily agent users need Pro+. |
| Agents | Background agents are the killer feature - set it and forget it. |

---

## Pricing Model

**Type**: Token-metered (no hard cap)

**How it works**: Cursor is token-metered. You pay for tokens in/out (and cache read/write on supported models). Plans include a dollar amount of usage credit, but there is no hard cap — you just run out of included credit and keep paying.

In `/compare`, this should be represented as:

- Metering: `token_metered`
- Badge: `noHardCap`
- Model variants: handled under **Models** (Max Mode variants are packaging)
- Routing modes (Auto): handled under **Pricing Model** (its “Cursor picks the model”)

### Plans

| Plan | Monthly | Included Usage | Target User |
|------|---------|----------------|-------------|
| **Hobby** | $0 | Limited | Trying it out |
| **Pro** | $20 | $20 of tokens | Tab completion users |
| **Pro+** | $60 | $60 of tokens | Daily agent users |
| **Ultra** | $200 | $200 of tokens | Power users / automation |

### Real-World Costs (Based on Cursor's Own Data)

| Usage Pattern | Typical Monthly Cost |
|---------------|---------------------|
| Daily Tab users | ~$20 (stays within Pro) |
| Limited Agent users | ~$20 (often within Pro) |
| Daily Agent users | $60–$100 |
| Power users (automation) | $200+ |

### Auto Mode (Routing)

Cursor also offers **Auto mode**: Cursor selects the premium model "best fit" for the task and can switch models when output quality degrades.

This is not a model. It is a **routing mode** with its own published token rates.

Auto token rates (per 1M tokens):

- Input + cache write: $1.25
- Output: $6.00
- Cache read: $0.25

In `/compare`, represent this as:

- Metering: `token_metered.routingModes[]` (e.g. `id: "auto"`)

### Token Rates (Per 1M Tokens)

| Model | Input | Cache Write | Cache Read | Output |
|-------|-------|-------------|------------|--------|
| Claude 4 Sonnet | $3 | $3.75 | $0.30 | $15 |
| Claude 4 Sonnet 1M | $6 | $7.50 | $0.60 | $22.50 |
| Claude 4.5 Haiku | $1 | $1.25 | $0.10 | $5 |
| Claude 4.5 Opus | $5 | $6.25 | $0.50 | $20 |
| Claude 4.5 Sonnet | $3 | $3.75 | $0.30 | $15 |
| Composer 1 | $1.25 | $1.25 | $0.125 | $10 |
| Gemini 2.5 Flash | $0.30 | $0.30 | $0.03 | $2.50 |
| Gemini 3 Flash | $0.50 | $0.50 | $0.05 | $3 |
| Gemini 3 Pro | $2 | $2 | $0.20 | $12 |
| GPT-5 | $1.25 | $1.25 | $0.125 | $10 |
| GPT-5 Fast | $2.50 | $2.50 | $0.25 | $20 |
| GPT-5 Mini | $0.25 | $0.25 | $0.025 | $2 |
| GPT-5-Codex | $1.25 | $1.25 | $0.125 | $10 |
| GPT-5.1 Codex | $1.25 | $1.25 | $0.125 | $10 |
| GPT-5.1 Codex Max | $1.25 | $1.25 | $0.125 | $10 |
| GPT-5.1 Codex Mini | $0.25 | $0.25 | $0.025 | $2 |
| GPT-5.2 | $1.75 | $1.75 | $0.175 | $14 |
| GPT-5.2 Codex | $1.25 | $1.25 | $0.125 | $10 |
| Grok Code | $0.20 | $0.20 | $0.02 | $1.50 |

### Cost Example

Using Claude Sonnet for a typical exchange:
- 2000 tokens input × $3/1M = $0.006
- 1000 tokens output × $15/1M = $0.015
- **Total per exchange: ~$0.02**
- 50 exchanges/day × 30 days = **$30/mo beyond included $20**

### Free Trial

- 14 days
- Full Pro features

### Team/Enterprise

| Plan | Per User/Month | Features |
|------|----------------|----------|
| Teams | $40 | Shared chats, centralized billing, analytics, SAML/OIDC SSO |
| Enterprise | Custom | Pooled usage, SCIM, audit logs, priority support |

---

## Models

### Canonical Models vs Tool Variants

Cursor exposes a curated model menu, but some entries are **tool variants**, not different base models.

Example: Claude Sonnet with 200k vs 1M context is the same underlying model, but Cursor packages a higher-context variant as **Max Mode**.

In `/compare`, treat these as:

- Canonical model: `claude-4-sonnet`
- Tool variants: `default` vs `max` (context caps + cost differences)

### Default Context vs Max Mode

Cursor has two modes for some models:
- **Default Context**: Standard context window
- **Max Mode**: Extended context window (more tokens, higher costs)

| Model | Default Context | Max Mode | Capabilities |
|-------|-----------------|----------|--------------|
| Claude 4 Sonnet | 200k | - | ∞ 👁 📁 |
| Claude 4 Sonnet (Max variant) | - | 1M | ∞ 👁 📁 |
| Claude 4.5 Haiku | 200k | - | 👁 📁 |
| Claude 4.5 Opus | 200k | 200k | ∞ 👁 📁 |
| Claude 4.5 Sonnet | 200k | 1M | ∞ 👁 📁 |
| Composer 1 | 200k | - | ∞ 📁 |
| Gemini 2.5 Flash | 200k | 1M | ∞ 👁 📁 |
| Gemini 3 Flash | 200k | 1M | ∞ 👁 📁 |
| Gemini 3 Pro | 200k | 1M | ∞ 👁 📁 |
| GPT-5 | 272k | - | ∞ 👁 📁 |
| GPT-5 Fast | 272k | - | ∞ 👁 📁 |
| GPT-5 Mini | 272k | - | ∞ 👁 📁 |
| GPT-5-Codex | 272k | - | ∞ 👁 📁 |
| GPT-5.1 Codex | 272k | - | ∞ 👁 📁 |
| GPT-5.1 Codex Max | 272k | - | ∞ 👁 📁 |
| GPT-5.1 Codex Mini | 272k | - | ∞ 👁 📁 |
| GPT-5.2 | 272k | - | ∞ 👁 📁 |
| GPT-5.2 Codex | 272k | - | ∞ 👁 📁 |
| Grok Code | 256k | - | ∞ 👁 |

*Capabilities: ∞ = Long context, 👁 = Vision, 📁 = File uploads*

### Model Providers

- **Anthropic**: Claude 4 Sonnet, Claude 4 Sonnet 1M (variant), Claude 4.5 Haiku, Claude 4.5 Opus, Claude 4.5 Sonnet
- **OpenAI**: GPT-5, GPT-5 Fast, GPT-5 Mini, GPT-5-Codex, GPT-5.1 Codex, GPT-5.1 Codex Max, GPT-5.1 Codex Mini, GPT-5.2, GPT-5.2 Codex, Composer 1
- **Google**: Gemini 2.5 Flash, Gemini 3 Flash, Gemini 3 Pro
- **xAI**: Grok Code

---

## Agent Capabilities

| Capability | Supported | Notes |
|------------|-----------|-------|
| File editing | ✅ | Multi-file support |
| Terminal | ✅ | Integrated terminal |
| Browser | ❌ | No browser automation |
| MCP | ✅ | Full MCP support |
| Background agents | ✅ | **Killer feature** - queue work |
| Codebase search | ✅ | Indexed semantic search |

---

## Platforms & Integrations

### Platforms

| Platform | Supported |
|----------|-----------|
| Windows | ✅ |
| macOS | ✅ |
| Linux | ✅ |
| Web | ❌ |

### IDE Integration

Cursor **is** the IDE. It's a VS Code fork, so:
- Native app experience
- Full VS Code extension compatibility
- No separate terminal/CLI mode

---

## Privacy & Security

| Feature | Status |
|---------|--------|
| Local mode | ❌ |
| No training on code | ✅ |
| SOC 2 certified | ✅ |
| Privacy mode | ✅ (Org-wide controls on Teams+) |

---

## Gotchas

1. **Token burn on long conversations** - Each message in a conversation includes context from previous messages. Long threads get expensive fast.

2. **Max mode costs more** - Max Mode is a tool variant (bigger context cap), not a new model. It burns more tokens and sometimes has its own rates (e.g. Claude Sonnet 1M).

3. **Auto mode hides the sausage** - Cursor picks a premium model based on demand/reliability. Great for quality, terrible for cost predictability.

4. **No BYOK option** - You can't bring your own API keys. You're locked into Cursor's pricing.

5. **Pro+ jump is steep** - Going from $20 to $60 is a 3x increase. Many users feel stuck in the middle.

---

## Links

- [Pricing Page](https://cursor.com/pricing)
- [Models Documentation](https://cursor.com/docs/models)
- [Account & Billing](https://cursor.com/docs/account/pricing)
