# Plans Reference

> Data source-of-truth for each tool's plans. Mirror of `src/data/tool-plans.ts`.
> Last verified: 2026-06-09

When pricing changes, update **both** this file and `src/data/tool-plans.ts`, then bump `lastVerified` in both places. See [README.md](./README.md) for architecture.

---

## API-equivalent value methodology

Each fixed-price plan delivers a quantity of model usage that, if purchased on the underlying provider's API, would cost a different amount than the sticker price. We track that delta as `apiValueUSD` on each plan.

**API rate cards used (May 2026, per 1M tokens, USD)**

- **Anthropic**: Opus 4.7 $5 / $25 in/out · Sonnet 4.6 $3 / $15 · Haiku 4.5 $1 / $5
- **OpenAI Codex**: GPT-5.3-Codex $1.75 / $14.00 (cached input $0.175)
- **Google**: Gemini 3.1 Pro $2 / $12 (≤200K) · Gemini 3 Flash $0.50 / $3

**Assumptions**

- Input:output ratio of ~10:1 (typical agentic coding workload).
- Claude figures weight cache reads at 0.1× input price (90%+ of Claude Code tokens are cache reads).
- "Typical" assumes a steady working developer; "heavy" assumes maxed-out usage anchored to public OpenUsage telemetry and community reports.
- Where a vendor publishes a $ credit pool (Cursor), we use that figure directly.
- Subsidy multiplier = midpoint(apiValueUSD) ÷ price. Anything ≥ 1.1× shows a green chip on the UI.

**Anchor data points** (real-world heavy use, OpenUsage telemetry)

- Codex Team ($30/seat): 550M tokens / 30d → ~$700–$1,400 API value
- Claude Team Premium 5x ($100/seat): 2.4B tokens / 30d → ~$1,000–$2,000 API value per seat

## Token efficiency multiplier

Raw $ subsidy is misleading across tools because they aren't equally efficient with tokens. Codex needs ~4× fewer tokens than Claude Code to complete the same task, so a $1 of Codex tokens does the work of $4 of Claude tokens.

We expose this as `tokenEfficiency` on each tool group (default 1, baseline = Claude Code).

**Effective subsidy** = raw subsidy × tokenEfficiency. The UI's per-plan chip shows the effective multiplier (with a Zap icon for tools where efficiency > 1) so cross-tool comparisons are apples-to-apples.

| Tool | Token efficiency | Why |
|---|---|---|
| Claude Code | 1× (baseline) | Heavy cache-read workload, large context per tool call |
| Codex | 4× | More compact prompting, higher signal/noise per turn |
| Others | 1× (provisional) | Insufficient public data for a confident estimate |

**Implication**: Codex Pro $200 (raw 4–10× subsidy) is **the best heavy-user deal across all tools tracked** when efficiency-adjusted (~30–50× effective). Claude Max 20x retains the highest **raw** $ subsidy.

## 90-day uptime

Reliability sourced from each vendor's public status page, sampled 2026-05-29. `UptimeIndicator` color-codes the dot by tier: emerald ≥ 99.9% (industry-standard), amber 99–99.9% (below standard), red < 99% (poor). Tools with no published number fall back to a "live" pulse; a tool being sunset shows a `DeprecationBadge` instead.

| Tool | 90-day uptime | Tier | Source (component) |
|---|---|---|---|
| Codex (OpenAI) | 99.96% | emerald | OpenAI status |
| Windsurf (Cognition) | 99.95% | emerald | status.windsurf.com (Cascade) |
| Cursor (Anysphere) | 99.64% | amber | status.cursor.com (IDE; range 99.33–99.87% across 6 components) |
| Claude Code (Anthropic) | 99.0% | amber | Anthropic status |

We show **measured** uptime only — never a contractual SLA target substituted for a real number. Tools omitted from the indicator:

- **Gemini CLI / Antigravity (Google)** — Google's Cloud status dashboard publishes incident history and a 99.5% Vertex Gemini SLA *target*, but no rolling 90-day measured percentage. (Gemini CLI also shows a deprecation badge — sunsets 2026-06-18.)
- **Opencode (SST)** — a local/BYOK CLI with no first-party hosted service to measure.

The gap matters for production: 99.98% ≈ 9 minutes of downtime/month; 99.08% ≈ 6.7 hours.

---

## Official providers

CLIs from the model vendor — the model and the agent ship together.

### Claude Code (Anthropic)

- **Token efficiency**: 1× (baseline)
- **90-day uptime**: 99.0% (amber tier)

| Plan | Price | Typical API value | Heavy API value | Subsidy |
|---|---|---|---|---|
| Pro | $20/mo ($17 annual) | $25–80 | $100–150 | 3–6× |
| Max 5x | $100/mo | $300–600 | $1,500–3,000 | 5–22× |
| Max 20x | $200/mo | $800–1,500 | $3,500–5,500 | 6–22× ✦ (highest raw $) |
| Team Premium | $100/seat/mo ($125 monthly) | $250–500 | $1,000–2,000 | 4–15× |
| API (BYOK) | PAYG | — | — | 1× |

- **Models**: Claude Sonnet 4.6, Claude Opus 4.8, Claude Haiku 4.5
- **Window**: 5h rolling + weekly active-compute cap
- **Quota shared with**: claude.ai web/desktop
- **Gotchas**:
  - Team Standard ($20/seat) does NOT include Claude Code — only Team Premium does (5-seat min).
  - Subsidy multipliers are inflated by cache-read accounting; raw output tokens deliver closer to 2–4× value.
  - 90-day uptime trails OpenAI by ~1pp — Claude.ai 98.67%, Code 99.17% vs Codex 99.98%.
  - Weekly active-compute cap is the most common surprise; bites Max 20x users running long agent sessions.
- **Source**: https://claude.com/pricing

### Codex (OpenAI)

- **Token efficiency**: 4× — multiply raw subsidies below for apples-to-apples comparison
- **90-day uptime**: 99.96% (emerald tier — best in class)

| Plan | Price | Typical API value | Heavy API value | Raw subsidy | Effective subsidy |
|---|---|---|---|---|---|
| ChatGPT Go | $8/mo | $8–20 | $20–50 | 2–5× | 8–20× |
| ChatGPT Plus | $20/mo | $25–60 | $80–150 | 2–6× | 8–24× |
| ChatGPT Pro 5x | $100/mo | $125–300 | $400–750 | 4–7× | 16–28× |
| ChatGPT Pro 20x | $200/mo | $500–900 | $1,500–2,500 | 4–10× | **16–40× ✦ best heavy-user deal** |
| Business | $25/seat/mo ($20 annual) | $50–120 | $200–400 | 3–10× | 12–40× |
| API (BYOK) | PAYG | — | — | 1× | 1× |

- **Models**: GPT-5.5 (default), GPT-5.4, GPT-5.4-mini, GPT-5.3-Codex, GPT-5.3-Codex-Spark (Pro tiers)
- **Window**: 5h rolling for interactive + agent tasks; weekly window for code reviews
- **Quota shared with**: ChatGPT (web, desktop, mobile)
- **Gotchas**:
  - Switched from per-message to token-based credits in Apr 2026.
  - No overage on subscriptions — hitting the cap means waiting for the next window.
  - Cloud agent tasks are not available on API-key usage.
  - Codex is ~4× more token-efficient than Claude Code per task — apply the efficiency multiplier for fair $ comparison across tools.
- **Source**: https://developers.openai.com/codex/pricing

### Gemini CLI (Google)

| Plan | Price | Typical API value | Heavy API value | Subsidy |
|---|---|---|---|---|
| Free (Google login) | $0 | $0–10 | $0–20 | ∞ |
| Free (API key, Flash only) | $0 | $0–5 | $0–10 | ∞ |
| AI Plus | $4.99/mo (400 GB) | $10–25 | $40–80 | 2–16× (Gemini app only — not CLI) |
| AI Pro | $19.99/mo (5 TB) | $30–80 | $150–300 | 3–11× |
| AI Ultra (5x) | $99.99/mo (20 TB) | $150–300 | $500–1,000 | 3–7× |
| AI Ultra (20x) | $199.99/mo (30 TB) | $300–600 | $1,000–2,500 | 2–7× ⚠ |
| Vertex / API PAYG | PAYG | — | — | 1× |

- **Models**: Gemini 3.1 Pro, Gemini 3 Flash
- **Window**: Daily quota with per-minute caps (60 rpm on Google login, 10 rpm on API-key free)
- **Quota shared with**: Google AI consumer subscriptions (when applicable)
- **Gotchas**:
  - Most generous free tier of any tool tracked.
  - AI Ultra heavy users report frequent throttling; effective value is below nameplate.
  - Consumer Google AI plans don't formally apply to CLI yet — entitlements aren't always wired through.
- **Source**: https://geminicli.com/docs/resources/quota-and-pricing/

---

## Harnesses

Editors and agents that route to multiple model providers.

### Cursor (Anysphere)

| Plan | Price | Typical API value | Heavy API value | Subsidy |
|---|---|---|---|---|
| Hobby | $0 | — | — | — |
| Pro | $20/mo | $20 | $20 | 1× (at cost) |
| Pro+ | $60/mo | $60–70 | $60–70 | 1× |
| Ultra | $200/mo | $400 | $400 | 2× |
| Teams | $40/seat/mo | $40 | $40 | 1× |
| Enterprise | custom | — | — | — |

- **Models**: Claude (Sonnet / Opus / Haiku 4.x), GPT-5 family, Gemini 3 Pro/Flash, Grok Code, Composer 1
- **Window**: Plan price = monthly $ credit pool since June 2025; token-metered with no hard cap
- **Quota shared with**: nothing — standalone editor
- **Gotchas**:
  - Honest pricing model: Pro/Pro+/Teams are at-cost (sticker price = API credit pool). No hidden subsidy on premium models.
  - Ultra is the only Cursor plan with a real subsidy (2×).
  - Auto mode is unlimited and uses its own published rates ($1.25 in / $6 out per 1M).
  - Max Mode is a packaging variant with bigger context and higher token costs, not a separate model.
  - No BYOK.
- **Source**: https://cursor.com/pricing

### Windsurf (Cognition)

| Plan | Price | Typical API value | Heavy API value | Subsidy |
|---|---|---|---|---|
| Free | $0 | — | — | — |
| Pro | $20/mo | $25–50 | $80–150 | 2–6× |
| Teams | $40/seat/mo | $40–80 | $150–300 | 1.5–6× |
| Enterprise | $60/seat/mo | $60–150 | $250–500 | 1.7–6× |

- **Models**: SWE-1 / SWE-1.5 / SWE-1.5 mini (free credits), Claude Sonnet/Opus/Haiku, GPT-5 family, Gemini 3, GLM / Qwen / Kimi / MiniMax / DeepSeek (premium credits)
- **Window**: March 2026 switched from credits-per-request to monthly quotas
- **Quota shared with**: nothing — standalone editor; JetBrains plugin available
- **Gotchas**:
  - Tab completion is unlimited on all paid tiers.
  - SWE-family models are free credits; Claude/GPT consume premium credits.
  - Monthly credits don't roll over (only purchased add-ons do).
- **Source**: https://windsurf.com/pricing

### Antigravity (Google)

| Plan | Price | Typical API value | Heavy API value | Subsidy |
|---|---|---|---|---|
| Free | $0 | $0–10 | $0–20 | ∞ |
| AI Pro | $20/mo | $20–50 | $50–150 | 2–7× ⚠ |
| AI Ultra | $249.99/mo | $250–500 | $700–1,500 | 1.5–4× ⚠ |

- **Models**: Gemini 3.1 Pro, Gemini 3.1 Flash, Claude Sonnet 4.6, Claude Opus 4.6, GPT-OSS 120B (Vertex Model Garden)
- **Window**: 5h refresh on Pro/Ultra; weekly refresh on Free; weekly cap on Pro (none on Ultra)
- **Quota shared with**: Google AI Pro / Ultra entitlements
- **Gotchas**:
  - Multi-day lockouts reported on Pro and Ultra; effective value below nameplate.
  - Free tier was cut from 250 → 20 req/day since launch.
  - Credits added Mar 2026 ($0.01 each, $199 for 20k).
  - Vendor explicitly states rate limits are "not guaranteed".
  - No BYOK.
- **Source**: https://antigravity.google/pricing

### Opencode (SST)

| Plan | Price | Typical API value | Heavy API value | Subsidy |
|---|---|---|---|---|
| Open source / self-host | $0 | — | — | — |
| Opencode Zen | PAYG | — | — | 1× |
| Opencode Go | $10/mo (intro $5) | $60 | $60 | 6× |
| BYOK any LLM | PAYG | — | — | 1× |

- **Models**: Provider-dependent — Go offers GLM, Kimi, Qwen, DeepSeek, MiniMax; BYOK supports Anthropic / OpenAI / Gemini / Copilot / etc.
- **Window**: Depends on configured provider (BYOK passes through upstream limits)
- **Quota shared with**: upstream provider account when BYOK
- **Gotchas**:
  - SST publicly states "$60 of Zen tokens for $10/mo" — explicit 6× subsidy on open-weight models only.
  - Router/client, not a single-provider product — no single "Opencode model menu".
  - Zero data retention.
  - Go pricing is intro-priced ($5 first month).
- **Source**: https://opencode.ai/

---

## Sources

- [Anthropic API pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [Claude Code costs docs](https://code.claude.com/docs/en/costs)
- [OpenAI Codex pricing](https://developers.openai.com/codex/pricing)
- [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Cursor pricing](https://cursor.com/pricing)
- [Windsurf usage docs](https://docs.windsurf.com/windsurf/accounts/usage)
- [Antigravity plans](https://antigravity.google/docs/plans)
- [Opencode Go docs](https://opencode.ai/docs/go/)
