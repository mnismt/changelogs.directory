# Compare Page v1 Plan

## Status: ✅ COMPLETED (v1.6 "Deep Dive" Upgrade)

**Implemented**: January 2026
**Refactored**: January 24, 2026 (v1.5 "Nuance" Update)
**Deep Dive**: January 24, 2026 (v1.6 Technical Detail Update)

## Summary

Build and deploy the v1 of the `/compare` page, specifically targeting **Cursor**, **Codex**, and **Claude Code**. The page provides a detailed side-by-side comparison including pricing, capabilities, velocity, and dynamic "verdicts" based on user personas.

**v1.6 Update**: Implemented "Deep Dive" architectural comparisons. Moved beyond simple feature checkboxes to technical "Terminal Overlay" tooltips. These tooltips explain architectural differences (e.g., "Native RAG" vs "Agentic Grep") to satisfy "Senior Dev" personas.

## Metrics

| Metric | Value |
|--------|-------|
| **Total Files Touched** | 18 |
| **Total Lines of Code** | ~2,800+ |
| **Components Created** | 8 |
| **Data Definitions** | 2 files (900+ lines) |

## Implementation Details

### 1. Data Layer (Updated)

| File | Type | Description |
|------|------|-------------|
| `src/data/tool-comparison.ts` | **Refactored** | **Rich Data Store**. Added `capabilityDetails` to support technical deep-dives. refined search architecture definitions (distinguishing "Native RAG" from "Agentic Grep"). Renamed `backgroundAgents` to `cloudAgents` to reflect universal support. |
| `src/data/models.ts` | **New** | **Canonical Models**. Enums and objects defining AI models (Claude 3.5 Sonnet, GPT-4o, etc.), their providers, and capabilities. |

### 2. UI Components (Updated)

| File | Type | Key Features |
|------|------|--------------|
| `src/components/compare/verdict-section.tsx` | **Modified** | **Logic Engine**. Updated recommendations to reflect "Power User" cost realities (e.g., warning about Cursor's $200+ costs). |
| `src/components/compare/capabilities-section.tsx` | **Refactored** | **Cinematic Tooltips**. Implemented "Terminal Overlay" design. Hovering over capabilities reveals architectural details in a glassmorphic, animated tooltip (`bg-black/95`). |
| `src/components/compare/persona-filters.tsx` | **New** | **State UI**. Interactive toggles for Usage Frequency (Daily/Occasional), Model Preference, Coding Style, and Privacy requirements. Updates URL Search Params. |
| `src/components/compare/velocity-section.tsx` | **New** | **Data Visualization**. Renders release frequency charts. Hybrid component: takes DB stats (`server/compare.ts`) but falls back to static estimates if DB is empty. |
| `src/components/compare/compare-page.tsx` | **Modified** | **Orchestrator**. Added URL state synchronization (`useNavigate`, `useState`) so specific filter configurations are shareable. |
| `src/components/compare/pricing-section.tsx` | **New** | **Cost Calculator**. Displays monthly/yearly pricing. Logic to highlight "Lowest Cost" options based on the user's selected usage frequency. |
| `src/components/compare/tool-logo.tsx` | **New** | **Asset Helper**. Maps tool slugs to specific brand assets/logos. |
| `src/components/compare/shared/section-header.tsx` | **New** | **UI Component**. Reusable section header with consistent typography and spacing. |

### 3. Server & Routing (179 lines)

| File | Type | Description |
|------|------|-------------|
| `src/server/compare.ts` | **New** | **Server Functions**. `getToolComparisonData` fetches dynamic release stats from the Postgres DB and merges them with the static data from `tool-comparison.ts`. |
| `src/routes/compare.tsx` | **Modified** | **Route Definition**. TanStack Router loader. Validates URL search params (`usage`, `models`, `style`, `privacy`). Prefetches data on the server. |

### 4. Documentation & Research

| File | Type | Description |
|------|------|-------------|
| `docs/compare/README.md` | **Modified** | **Project Docs**. Detailed explanation of the compare system architecture, data flow, and future roadmap (v2/v3). |
| `docs/compare/*.md` | **Refactored** | **Technical Deep Dive**. Updated `cursor.md`, `claude-code.md`, and `codex.md` to reflect specific architectural findings (chunking strategies, agent behaviors) used in the new tooltips. |
| `docs/compare/reports/*` | **New** | **Research Artifacts**. Detailed research notes on Cursor, Codex, and Claude Code pricing/limits generated during the planning phase. |

## Key Logic Implemented

### Deep Dive Tooltips (v1.6)
To better serve senior engineers, we moved key capabilities to a "Show, Don't Tell" model:
- **Data Structure**: `capabilityDetails` maps specific features (Search, Agents) to technical markdown.
- **Visuals**: Used a "Terminal" aesthetic for tooltips (Monospace font, high contrast, dashed underlines).
- **Architecture**: Explicitly calls out implementation details like "Tree-sitter Chunking" vs "Iterative Grep".

### Verdict Scoring Algorithm (`verdict-section.tsx`)
We implemented a weighted scoring system that evaluates each tool against selected personas:
- **Privacy First**: Heavily penalizes tools with cloud-only data storage; boosts "Local/Zero-retention" tools.
- **Budget**: Compares monthly subscription costs; flags free tiers.
- **Power User**: Boosts tools with "Agentic" capabilities and high context windows.

### Hybrid Data Strategy (`server/compare.ts`)
To ensure the page is useful immediately even without a fully populated database:
1. **Static Data**: Features, Pricing, and Pros/Cons are hardcoded in `src/data/`.
2. **Dynamic Data**: "Velocity" (release counts, frequency) is fetched from the DB.
3. **Merge Strategy**: The server function merges these two sources before sending to the client.

## Next Steps / Debt

- **Mobile Experience**: Optimize "Deep Dive" tooltips for touch devices (tap-to-reveal).
- **Velocity Section**: Populate `Release` records in DB for the target tools.
- **Pricing Detail**: Apply "Deep Dive" tooltip treatment to Pricing section (Credits vs Tokens).
