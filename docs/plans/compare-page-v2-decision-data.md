# Compare Page v2 Plan (Decision vs Data)

## Status: 🟡 PLANNED

**Created**: January 24, 2026

## Why This Exists

The current `/compare` page reads like a long report. The content is good, but the UX does not answer the primary question fast enough:

> "Which tool should I pick?"

v2 refactors `/compare` into an answer-first interface while preserving the site’s "Directory" aesthetic and cinematic dev-vibe.

This plan is an iteration on `docs/plans/compare-page-v1.md` and follows the compare vision in `docs/compare/README.md`.

## Primary Outcome

Increase viewers + engaged users by making `/compare`:

- Immediately decisive (winner + why) for devs and vibe coders
- Still credible (evidence is one click away)
- Shareable (URL represents the verdict config)
- Scannable (no "where am I?" while scrolling)

## Audience

- **Primary**: Working devs + vibe coders choosing a daily tool
- **Secondary**: Senior devs validating the choice via architecture deep dives

## Non-Goals (v2)

- Adding more tools (Windsurf/Gemini/etc.)
- Redesigning the compare data model
- Converting quotas/credits/tokens into a single unit (explicitly avoided by `docs/compare/data-model.md`)

## Core UX Change

Shift the page mental model from "article" to "utility":

- Inputs (filters) live in a sticky "command bar"
- Output (recommended tool) is always visible near the top
- Evidence (tables + charts + deep dives) lives in a dedicated mode

## Two Modes

### 1) Decision Mode (Default)

Purpose: Answer the question in one screen.

Content:
- Sticky **Command Bar** (filters + mode toggle + share)
- **Recommendation Output Panel** (winner + reasons + gotcha)
- **Category Winners Strip** (Cost / Agents / Search / Velocity / Privacy / UX)
- Short “Why not the others” (alternatives + quick tradeoffs)

Behavior:
- Filter changes update the recommendation immediately
- Category chips jump to the relevant evidence section and (optionally) flip into Data mode

### 2) Data Mode

Purpose: Show the proof (dense, scannable).

Content:
- Pricing (existing) + mechanics / caveats
- Capabilities matrix (existing) with deep-dive details
- Velocity (existing, DB-backed) with clear “live vs static” labeling
- Verdict (full) + per-tool pros/cons (reuse existing `VerdictSection`)

Behavior:
- Sticky tool headers on dense sections (so users don’t lose column context)
- Section navigation (desktop sidebar + mobile floating bar)

## URL + State Design

### Existing Params (keep)

Already implemented in `src/routes/compare.tsx`:

- `tools` (comma-separated slugs)
- `usage` (`light|daily|power`)
- `models` (`free|budget|standard|frontier`)
- `style` (`terminal|ide`)
- `privacy` (`true|false`)

### New Param (add)

- `view` (`decision|data`)

Rules:
- Default `view=decision` when missing
- All changes use `replace: true` and `resetScroll: false` (preserve reading position)
- URLs must be shareable and reproduce the same view + verdict on refresh

SEO note (later): ensure canonical points to `view=decision` when appropriate.

## Layout / Information Architecture

### Above The Fold

1. Breadcrumb + stats (“Directory” framing)
2. Compact tool identity row (logos + taglines)
3. Sticky Command Bar:
   - `$_ compare --usage=daily --models=standard ...`
   - View toggle (Decision/Data)
   - Share button
4. Recommendation Output Panel
5. Category Winners Strip

### Sections (Data Mode)

In Data mode, sections become explicit anchors:

1. Pricing
2. Capabilities
3. Velocity
4. Verdict

## Component + File Plan

### Routing

- Update `src/routes/compare.tsx` search schema to include `view`
- Parse `initialView` from URL and pass to the page

### Compare Page Orchestration

Refactor `src/components/compare/compare-page.tsx` into:

- A shared top header (hero + tool identity)
- A sticky Command Bar
- Mode switch rendering

New/updated components (expected):

- `src/components/compare/compare-command-bar.tsx`
  - Wrap existing `PersonaFilters` inside a sticky container (reuse the sticky filter pattern)
  - Shows a prompt-like string that mirrors active filters
  - Contains the Decision/Data toggle + share button

- `src/components/compare/compare-view-toggle.tsx`
  - LayoutId “sliding pill” toggle (reuse patterns from tool page `ViewToggle`)
  - Writes `view` into search params

- `src/components/compare/decision/recommendation-panel.tsx`
  - Renders winner + reasons + gotcha + alternatives
  - Uses existing verdict logic from `src/components/compare/verdict-section.tsx` (extract compute function)

- `src/components/compare/decision/category-winners.tsx`
  - Computes winners per category based on existing data:
    - Cost: realCosts + lowest helper
    - Agents/Search/Privacy: capabilities + privacy fields
    - Velocity: DB stats
    - UX: editorial heuristic (static note in data file, or a simple mapping)
  - Each chip is a link/jump to Data sections

- `src/components/compare/compare-section-nav.tsx`
  - Desktop sidebar + mobile floating bar
  - Same behavior as changelog section nav, but for compare sections

- `src/components/compare/shared/sticky-tool-header.tsx`
  - Keeps tool slugs/logos visible while scrolling inside tables

### Reuse / Refactor Targets

- Extract tool identity card rendering from `src/components/compare/compare-page.tsx` into a shared component (e.g. `src/components/compare/shared/tool-identity-card.tsx`) so it can be reused in sticky headers.

- Make `PersonaFilters` more “operational” (CLI Builder Pattern):
  - Refactor into a "Command Toolbar" aesthetic
  - No container box (integrates directly into command bar)
  - Horizontal layout with CLI-style arguments (`--usage`, `--models`)
  - Dense, monospace interactive toggles
  - High-contrast active states (green text + glow)

### Deep Dive Interaction (Mobile-safe)

Current deep-dive details are tooltip-driven in `src/components/compare/capabilities-section.tsx`.

Change to a unified interaction that supports:

- Desktop: hover tooltip + click/tap to “pin”
- Mobile: tap to open (popover-style)
- Keyboard: focus + open via Enter/Space

Implementation approach:

- Create `src/components/compare/shared/deep-dive.tsx` wrapping shadcn Tooltip/Popover with shared styling.
- Keep the existing “terminal overlay” look.

## Visual + Motion Guidelines (Must Match Site)

Follow `docs/design/design-rules.md`:

- Monochrome, structured, glass panes (`bg-black/40`, `backdrop-blur`)
- Monospace for data and system framing
- Green accents only for semantic “good/winner/ready”
- Cinematic motion (0.5-0.8s, heavier spring) for toggles and sticky transitions

Use existing motion patterns:

- View toggle “sliding pill” via `layoutId`
- Sticky control clone (sentinel-based)
- Section nav with viewport bracket on desktop

## Accessibility

- Ensure essential labels are not low-opacity (avoid `/50` on core UI)
- All toggles, filters, and deep-dive triggers keyboard accessible
- Visible focus rings
- Mobile overlays trap focus and close with Escape

## Analytics (Optional but Recommended)

Track lightweight events:

- `compare_view_changed` (decision/data)
- `compare_filter_changed` (usage/models/style/privacy)
- `compare_share_clicked`
- `compare_deep_dive_opened` (capability id)

## Testing / Verification

Manual acceptance checklist:

- Decision mode shows a winner + reasons without scrolling (desktop + mobile)
- Toggling Decision/Data preserves scroll position
- URL reproduction: open shared URL and get same view + verdict
- Deep dives are usable on mobile (tap) and keyboard (focus)
- Dense tables remain scannable (sticky tool header)

Automation (later): add Playwright coverage for URL state + view toggling.

## Implementation Steps

1. Add `view` to route search schema + loader (`src/routes/compare.tsx`)
2. Implement Decision/Data view toggle + URL sync
3. Build Command Bar (sticky) and embed filters + view toggle + share
4. Implement Decision mode panels (recommendation + category winners)
5. Implement Data mode navigation (section nav + sticky tool header)
6. Upgrade deep dives to be mobile + keyboard friendly
7. Polish animations + contrast pass
8. Verify (manual) on desktop + mobile widths
