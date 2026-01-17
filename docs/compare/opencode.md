# Opencode - Tool Comparison Research (Future)

> Last Updated: 2026-01-16
> Status: Not in /compare v1 (Black is waitlist)
> Source: https://opencode.ai/black, https://opencode.ai/docs/providers/

## Why Opencode Is Different

Opencode is not a single-provider "bundle" like Cursor/Windsurf.

It’s closer to a **terminal-native client + router**:

- You can connect it to **many providers** (Anthropic, OpenAI, Gemini, GitHub Copilot, etc.)
- The available model list is **provider-dependent** (and can change any time)
- Pricing is a mix of:
  - **BYOK** pass-through provider costs, and/or
  - **Opencode Black** subscription plans with included usage

If we treat Opencode like a normal tool with a fixed model list, we’ll either:

- maintain an ever-growing static catalog (pain), or
- ship misleading comparison data (worse)

## Recommendation: Model It As A Router + Pricing Modes

### 1) Tool Type

In compare terms, Opencode should be represented as:

- **Tool archetype**: router/client
- **Value props**: local workflow, flexibility, provider choice
- **Model support**: "depends on your configured providers" (not a fixed list)

### 2) Pricing Modes

Represent Opencode pricing as **two parallel modes**:

1) **BYOK (Pass-through)**
   - Cost is whatever the upstream provider charges
   - Opencode is the client; pricing is not tool-determined

2) **Black Subscription (Bundled usage)**
   - Flat monthly plans (e.g. $20 / $100 / $200)
   - Included usage is described as "more usage" not necessarily token-exact
   - Still ultimately maps onto provider models behind the scenes

Important: Black is not public at the time of writing (waitlist), so it should not be part of v1 comparisons yet.

## Centralized Models, But Curated

Opencode uses `models.dev` as its provider/model registry.

That’s useful, but we should **not** import the entire catalog into our UI.

### Proposed strategy

- Keep `src/data/models.ts` as **our canonical, curated model registry** for compare
- Optionally add an ingestion path later to sync **metadata** from models.dev
- For router tools (Opencode), show:
  - **Supported providers** (chips/badges)
  - A **curated shortlist** of "recommended coding models" from our registry
  - Avoid listing every possible provider model

This prevents compare from turning into a 300-row model dump.

## Variants & Limits: Keep Tool Packaging Separate

Some tools expose "variants" that are not different base models.

Example: Cursor "Claude Sonnet 4" vs "Claude Sonnet 4 1M".

For Opencode, this becomes even more important:

- The canonical model is upstream (`claude-4-sonnet`)
- Any limits (context caps, output caps, tier gating) are **tool/provider packaging**

So:

- `src/data/models.ts` should represent the **base model identity**
- `src/data/tool-comparison.ts` should represent **offerings/variants**

## Compare UI Guidance (If/When Added)

If Opencode is added later, the compare page should avoid pretending there is a single "Opencode model menu".

Recommended presentation:

- **Models section**: "You bring providers → you choose models"
- Show provider badges and a curated recommended shortlist
- **Pricing section**: two blocks/tabs
  - "Subscription (Black)" and "BYOK costs"

## Open Questions (Defer)

- Does Opencode Black publish token-equivalent included usage, or only multipliers?
- Should we treat GitHub Copilot as a provider vs a separate compare tool?
- Do we need a separate router/tool archetype type in `docs/compare/data-model.md`, or keep it implicit?
