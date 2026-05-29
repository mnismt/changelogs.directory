# Compare Page

> A directory of pricing plans for the AI coding tools we track, with an
> API-equivalent value read on every plan.
> Live at: `/compare` · Last verified: 2026-05-29

## What this is

A single page listing every paid tier and free option for each tool we track, grouped into two buckets:

- **Official providers** — vendor's own CLI for their own model: Claude Code, Codex, Gemini CLI
- **Harnesses** — editor/IDE/agent that routes to multiple model providers: Cursor, Windsurf, Antigravity, Opencode

For each plan we also estimate the **API-equivalent value** — what the same usage would cost on the underlying provider's pay-as-you-go API — and render it as a value bar so the subsidy (or lack of one) is visible at a glance. The methodology lives in [plans.md](./plans.md).

Devs can scan all the plans at once, see which subscription is actually subsidized, and jump straight to the vendor's pricing page — without bouncing between tabs.

## What this is NOT

The original editorial design (long since removed) framed `/compare` as an opinionated product:

- "Senior dev's honest take" tone with snark and winner badges
- Persona filters (`?usage=daily&style=terminal`) with a dynamic winner per persona
- "Worth it?" verdict sections, pros/cons, category-by-category takes
- Discriminated-union data model with quota windows, metric/entitlement IDs, shared pools
- Sticky command bar, mobile swipe carousel, URL state management
- Live integration with the release/changelog DB (velocity/release-count panel)

All of that was scrapped: **devs want details, not surface**. Concrete numbers and direct links beat opinionated framing.

The Cards/Table toggle that exists today is **not** a return to that — it's a pure lens over the same static data (a browsy grid vs. an alignable matrix), with no opinion, persona state, or URL coupling.

## File map

```
docs/compare/
├── README.md         ← this file (philosophy + architecture)
└── plans.md          ← per-tool plan data + value/uptime methodology

src/data/
└── tool-plans.ts     ← the data (source of truth), in TypeScript

src/lib/
├── tool-logos.tsx        ← getToolLogo / isMonochromeLogo / hover classes
├── tool-registry.tsx     ← per-tool logo + monochrome metadata
└── model-providers.tsx   ← map model names → provider logos (incl. in-house)

src/routes/
└── compare.tsx       ← the page (hero + desktop view toggle + mobile)

src/components/compare/
├── plans-card.tsx              ← desktop card + ALL shared primitives
│                                 (ValueBar, PlanRow, ModelRow, UptimeIndicator,
│                                  DeprecationBadge, ValueLegend, EfficiencyNote,
│                                  getHeadlineValue, getGroupMaxValue, …)
├── plans-table.tsx             ← desktop table view (expandable rows)
├── compare-view-toggle.tsx     ← desktop Cards ⇄ Table segmented control
├── hover-context.tsx           ← desktop cross-card tier hover-highlighting
├── tool-headline-chip.tsx      ← the "~Nx value" headline chip
│
│   # mobile (< md) — desktop is untouched by these
├── compare-mobile.tsx          ← mobile orchestrator (row list + compare mode)
├── compare-section.tsx         ← glass "settings group" container for a bucket
├── compare-row.tsx             ← glanceable full-width tap-target row
├── section-segmented-control.tsx ← Official/Harness filter + compare toggle
├── compare-tray.tsx            ← floating tray for pin-2-to-compare mode
├── tool-detail-sheet.tsx       ← single-tool drill-down BottomSheet
└── two-up-compare-sheet.tsx    ← side-by-side compare of 2 pinned tools
```

`plans-card.tsx` is the largest file on purpose: it owns the desktop card **and** exports the shared rendering primitives (value bars, plan rows, model rows, the value legend, the subsidy math). The table view and both mobile sheets import those primitives so every surface renders identical numbers and never diverges.

## Data shape

Defined in `src/data/tool-plans.ts`:

```ts
type ApiValueRange = [low: number, high: number]
type ApiValueEstimate = { typical: ApiValueRange; heavy: ApiValueRange }

type ToolPlan = {
  name: string                              // "Pro", "Max 5x", "ChatGPT Pro"
  priceUSD: number | "custom"               // 0 renders as "Free"
  period?: "month" | "year" | "one-time"
  quota?: string                            // headline limit, optional
  notes?: string                            // one-line caveat, optional
  apiValueUSD?: ApiValueEstimate            // est. API-equivalent value (the bar)
  subsidyNote?: string                      // one-line context on the best plan
}

type ToolPlanGroup = {
  slug: string                              // matches Tool.slug in DB
  name: string
  vendor: string
  bucket: "official" | "harness"
  tagline: string                           // factual one-liner, no snark
  plans: ToolPlan[]
  models: string[]                          // model names accessible
  sourceUrl: string                         // vendor's pricing page
  lastVerified: string                      // ISO date
  gotchas?: string[]                        // factual "good to know" notes
  tokenEfficiency?: number                  // default 1 (Claude Code baseline)
  uptime90d?: number                        // measured 90-day uptime %, optional
  uptimeAsOf?: string                       // ISO date uptime was sampled
  bestPlan?: string                         // editorial override of auto best-pick
  deprecated?: {                            // tool being sunset
    sunsetDate: string
    successor?: string
    announcementUrl?: string
  }
}

export const TOOL_PLANS: ToolPlanGroup[] = [...]
```

Still a flat array — no discriminated unions, no quota-window types, no entitlement enums. Unusual pricing (e.g. Opencode Go's intro month) goes in `notes`.

## Page structure

`src/routes/compare.tsx`:

1. Hero: H1 + one-line subtitle with the verification month.
2. **Desktop (`>= md`)**: a centered `CompareViewToggle` (Cards / Table), then either:
   - **Cards** — two `Section`s (Official, Harnesses), each a responsive `md:grid-cols-2 xl:grid-cols-3` grid of `<PlansCard>`.
   - **Table** — a single `<PlansTable>` spanning both buckets.
3. **Mobile (`< md`)**: `<CompareMobile>` — a normalized row list with a sticky bucket filter, a drill-down sheet per tool, and an opt-in "pin 2 to compare" mode.

The whole tree is wrapped in `<CompareHoverProvider>` (powers desktop cross-card tier highlighting). No loader, no React Query, no server function — the data is static, so it's a pure SSR-friendly render.

## Card layout (desktop)

`PlansCard` in `src/components/compare/plans-card.tsx`. The redesign traded a dense table for a scannable hierarchy:

```
┌──────────────────────────────────────────────┐
│ [logo] Tool Name                 [bucket tag] │
│        Vendor                                 │
│ Tagline (one factual sentence).               │
│                                               │
│ ┌── HERO STRIP (best value) ───────────────┐  │
│ │ Best plan · $price   ▇▇▇▇▇▇   get ~$X · Nx│  │
│ │ subsidy note                              │  │
│ └───────────────────────────────────────────┘ │
│                                               │
│ Pro      $20   ▇▇░░░  3×                      │  ← compact one-line rows
│ Max 5x   $100  ▇▇▇▇░  9×   [best]             │
│ Max 20x  $200  ▇▇▇▇▇ 23×                      │
│                                               │
│ ▸ ◎◎◎ 3 models            (disclosure)        │
│ ▸ ⚠ 2 things to know       (disclosure)       │
│                                               │
│ 🔗 pricing source     ● 99.08%  ·  2026-05-29 │
└──────────────────────────────────────────────┘
```

- **Hero strip** anchors the eye on the best-value plan (or "Starts at …" for free/BYOK/custom tools).
- **Compact plan rows** are one line each: `name · price · mini value bar · ratio`, with a `best` chip and hover cross-highlighting. Quota/notes move to a row tooltip.
- **Disclosures** (native `<details>`/`<summary>`, SSR-friendly) tuck the full model list and the "good to know" notes behind chevrons.
- **Footer** shows the source link, the `UptimeIndicator` (if `uptime90d` is set) or a `DeprecationBadge` (if sunset), and the verified date.

## Table view (desktop)

`PlansTable` in `src/components/compare/plans-table.tsx` — the compare-as-matrix lens:

- One row per tool; columns aligned (Tool · Models · Best plan · Price · API value · Status) so values stack vertically for true cross-tool reading.
- Every value bar shares **one global dollar scale** (the largest "get" across all tools), so a $4.5k bar really is longer than a $1.2k one. (Cards use a per-tool scale, since a card only compares a tool to itself.)
- **Rows are expandable** — click a row to reveal an inline drill-down (tagline, models grouped by provider, every plan with its value bar, and the gotchas), reusing the same `PlanRow`/`ModelRow` primitives as the mobile sheet. The expanded plans use the per-tool scale. It's a multi-open accordion (a `Set` of slugs), so several tools can be open at once.

## Model provider icons

`src/lib/model-providers.tsx` maps each model-name string to the provider logo that represents it (`detectModelProvider` → `getProviderLogo`), grouped first-seen via `groupModelsByProvider`. Detection is **tool-aware**: passing the tool slug lets a harness's in-house models render with the tool's own mark instead of a blank dot —

- **Cursor** → its `Composer` model renders the Cursor mark.
- **Opencode** → its `Zen`/`Go` open-weight tiers render the Opencode mark; the `BYOK (Claude, GPT, Gemini…)` line reads as **Multi**, not Claude (the multi/BYOK check runs before the frontier-family checks).
- **Windsurf** → its `SWE-*` models render the Windsurf mark.

Provider clusters appear in the card's models disclosure, the table's Models column, and the mobile detail sheet.

## Uptime & deprecation indicators

- `UptimeIndicator` color-codes the measured 90-day uptime: emerald `≥ 99.9%`, amber `99–99.9%` (below the industry-standard 99.9%), red `< 99%`. Tools with no published number fall back to a "live" pulse.
- `DeprecationBadge` replaces the status when a tool is being sunset (e.g. Gemini CLI → Antigravity CLI), linking the official announcement.
- We only show a **measured** uptime — never a contractual SLA target dressed up as one. See [plans.md](./plans.md#90-day-uptime) for which tools publish numbers and which don't.

## Update process

When a vendor changes pricing:

1. Edit the entry in `src/data/tool-plans.ts` (the source of truth).
2. Mirror the change in [plans.md](./plans.md) and bump `lastVerified` in both.
3. If you touched the API-value estimate, sanity-check it against the rate cards + assumptions in plans.md.
4. Skim the rendered card **and** the table row on `/compare` to confirm — `curl -s http://localhost:5173/compare | grep …` for a quick SSR check.

When adding a new tool:

1. Append a `ToolPlanGroup` to `TOOL_PLANS` (see `docs/guides/adding-a-tool.md` for the DB side).
2. Make sure `slug` matches `Tool.slug` in `prisma/schema.prisma` (see `prisma/seed.ts`).
3. Confirm `getToolLogo(slug)` returns a logo; if not, add it under `src/components/logo/` and wire it into `src/lib/tool-registry.tsx` (flag `isMonochrome` if the mark needs `fill-foreground`).
4. If the tool has an in-house model, teach `detectModelProvider` (in `src/lib/model-providers.tsx`) to recognize it by slug.
5. Add the matching entry to [plans.md](./plans.md).

## Tracked tools

| Slug | Bucket | Vendor | Uptime | Notes |
|------|--------|--------|--------|-------|
| `claude-code` | Official | Anthropic | 99.08% (amber) | |
| `codex` | Official | OpenAI | 99.98% (emerald) | 4× token-efficient |
| `gemini-cli` | Official | Google | — | Sunsets 2026-06-18 → Antigravity CLI |
| `cursor` | Harness | Anysphere | 99.64% (amber) | in-house: Composer |
| `windsurf` | Harness | Cognition | 99.95% (emerald) | in-house: SWE-* |
| `antigravity` | Harness | Google | — | no public uptime |
| `opencode` | Harness | SST / Anomaly | — | local/BYOK; in-house: Zen/Go |

Note: Antigravity is a Google product but lives in **Harness** because it's a multi-provider IDE (Claude / GPT-OSS / Gemini), not a CLI for one model.

## Related

- `docs/compare/plans.md` — plan data + value/uptime methodology
- `src/data/tool-plans.ts` — TypeScript implementation (source of truth)
- `src/routes/compare.tsx` — page entry
- `src/components/compare/plans-card.tsx` — desktop card + shared primitives
- `src/components/compare/plans-table.tsx` — desktop table view
- `src/lib/model-providers.tsx` — model → provider-logo mapping
- `prisma/seed.ts` — canonical tool slugs
```
