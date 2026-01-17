# Compare Feature Documentation

This directory contains the research, data models, and design specs for the `/compare` page - a comprehensive, opinionated comparison of AI coding tools.

## Vision

**Not a spec sheet. A senior dev's honest take.**

The compare page combines:
- **Interactive custom components** with structured data (models, pricing, platforms)
- **Editorial personality** baked into every component (winner badges, snarky one-liners, "worth it?" verdicts)
- **Dynamic adaptation** based on user filters (solo dev vs team, terminal vs IDE, etc.)
- **Changelog-derived credibility** - "We've tracked hundreds of releases. Here's what we've learned."

## Tools in Scope (v1)

| Tool | Pricing Model | Key Differentiator |
|------|---------------|-------------------|
| [Cursor](./cursor.md) | Token consumption | Polished IDE, background agents |
| [Windsurf](./windsurf.md) | Prompt credits | Free models (SWE-1.5), predictable per-prompt |
| [Claude Code](./claude-code.md) | Subscription + API | Raw Claude power, terminal-native |
| [Gemini CLI](./gemini-cli.md) | Free tier + API | 1000 req/day free, 1M context |

## Tools to Add Later (Research Ready)

These are not in `/compare` v1 yet, but we have enough notes to add them later without redesigning the data model:

| Tool | Why It's Special | Notes |
|------|------------------|-------|
| [Codex](./codex.md) | Quota-based (shared with ChatGPT) | Prompts/5h + agent tasks + reviews/week |
| [Antigravity](./antigravity.md) | Quota-based (mostly qualitative) | 5h refresh + weekly caps, no BYOK |
| [Opencode](./opencode.md) | Router/BYOK client | Provider-dependent model menus |

## Documentation Structure

| File | Purpose |
|------|---------|
| [README.md](./README.md) | This file - overview and unified summary |
| [data-model.md](./data-model.md) | TypeScript types and data structure spec |
| [ui-design.md](./ui-design.md) | UI components and layout design |
| [cursor.md](./cursor.md) | Cursor pricing, models, and editorial |
| [windsurf.md](./windsurf.md) | Windsurf pricing, models, and editorial |
| [claude-code.md](./claude-code.md) | Claude Code pricing, models, and editorial |
| [gemini-cli.md](./gemini-cli.md) | Gemini CLI pricing, models, and editorial |
| [codex.md](./codex.md) | Codex pricing (quota), editorial |
| [antigravity.md](./antigravity.md) | Antigravity pricing (quota), editorial |
| [opencode.md](./opencode.md) | Opencode (future): router/BYOK strategy |

## Key Insights

### Pricing Models Are Fundamentally Different

These tools use **incompatible pricing models**:

| Tool | Model | What You Pay For |
|------|-------|------------------|
| **Cursor** | Token consumption | $/million tokens, varies by model. Heavy users: $60-200+/mo |
| **Windsurf** | Prompt credits | X credits per request. Model determines credit cost (0-20) |
| **Claude Code** | Subscription OR API | Claude Pro ($20) includes it, or BYOK at Anthropic rates |
| **Gemini CLI** | Free tier + API | 1000 requests/day FREE. Google One ($20) for more |

### Free Options Matter

**Windsurf** has genuinely free models:
- SWE-1.5 (0 credits) - Their in-house agentic model, near Claude 4.5-level
- DeepSeek-R1 (0 credits) - Open reasoning model
- Grok Code Fast (0 credits) - xAI's fast coding model
- GPT-5.1-Codex (0 credits) - OpenAI's coding model

**Gemini CLI** has a generous free tier:
- 1000 requests/day on Gemini Flash
- That's ~30,000/month - most devs never hit this

### Editorial Voice

The compare page uses a **snarky dev voice** - honest, witty, no marketing fluff:

> "Cursor's $20/mo sounds like a steal until you realize that's just the starting point. Daily agent users? Budget $60-100/mo."

> "Windsurf's SWE-1.5 is free. Yes, actually free. And it's genuinely good."

> "Gemini CLI: It's FREE. What are you waiting for? (The catch: Gemini reasoning.)"

## Dynamic Recommendations

Content adapts based on user persona:

| Persona | Winner | Reason |
|---------|--------|--------|
| Solo Dev | Claude Code | Maximum power, minimal overhead |
| Team | Cursor | Consistent UX, team management |
| Budget | Windsurf | Free models that actually work |
| Terminal | Claude Code | Built for the terminal |
| IDE | Cursor | The IDE is the product |
| Privacy | Cursor | SOC 2 certified |

## URL Structure

```
/compare                                     → All 4 tools, no filters
/compare?tools=cursor,windsurf               → Subset comparison  
/compare?usage=daily&models=standard         → Persona-filtered view
/compare?usage=power&models=frontier&privacy=true → Combined filters
```

**Query params:**
- `tools` - Comma-separated slugs (default: all)
- `usage` - `light` | `daily` | `power`
- `models` - `free` | `budget` | `standard` | `frontier`
- `style` - `terminal` | `ide`
- `privacy` - `true` if privacy matters

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         /compare?tools=cursor,claude-code              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
        ┌──────────────────────┐        ┌──────────────────────┐
        │   Static TypeScript  │        │    Database (SSR)    │
        │ src/data/tool-...ts  │        │   via server funcs   │
        ├──────────────────────┤        ├──────────────────────┤
        │ • Models supported   │        │ • Release count      │
        │ • Model costs        │        │ • Releases/month     │
        │ • Pricing plans      │        │ • Features added 30d │
        │ • Agent capabilities │        │ • Bugs fixed 30d     │
        │ • Editorial content  │        │ • Last release date  │
        └──────────────────────┘        └──────────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    ▼
                    ┌──────────────────────────────────┐
                    │       Compare Page (SSR)         │
                    │  Merged view of static + live    │
                    └──────────────────────────────────┘
```

## Implementation Status

- [ ] Documentation (this directory)
- [ ] Data model (`src/data/models.ts`, `src/data/tool-comparison.ts`)
- [ ] Server function (`src/server/compare.ts`)
- [ ] Route + loader (`src/routes/compare.tsx`)
- [ ] UI components (`src/components/compare/`)
- [ ] Mobile swipe UX
- [ ] URL state management
- [ ] Animations

## Updating Tool Data

When tool pricing/features change:

1. Update the relevant tool doc (e.g., `docs/compare/cursor.md`)
2. Update `src/data/tool-comparison.ts` with the new data
3. Update `lastUpdated` field
4. Verify the compare page renders correctly

The docs serve as the **source of truth** for research. The TypeScript files are the **implementation** of that research.
