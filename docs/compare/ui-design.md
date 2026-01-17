# UI Design Specification

> This document specifies the UI components, layout, and interactions for the compare page.

## Design Principles

Following the [Design Rules](../design/design-rules.md):

1. **Terminal/Hacker Aesthetic** - Monochrome, monospace for data, dense information
2. **Snarky Dev Voice** - Editorial personality in every component
3. **Full Complexity** - Show the full picture, trust users to understand
4. **Dynamic Filtering** - Content adapts to persona selection

---

## Page Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ HEADER: Tool Selector + Share Button                                │
├─────────────────────────────────────────────────────────────────────┤
│ HERO: Quick Take (taglines, winner badges)                         │
├─────────────────────────────────────────────────────────────────────┤
│ FILTERS: Persona selectors (usage, model tier, style, privacy)     │
├─────────────────────────────────────────────────────────────────────┤
│ SECTION: Pricing                                                    │
│ ├── Cost Estimator (persona-based)                                 │
│ ├── Pricing Mechanics (collapsible deep-dive)                      │
│ └── Worth It? Cards                                                │
├─────────────────────────────────────────────────────────────────────┤
│ SECTION: Models                                                     │
│ ├── Free Models Highlight                                          │
│ ├── Model Availability Grid                                        │
│ └── Model Filter Bar                                               │
├─────────────────────────────────────────────────────────────────────┤
│ SECTION: Agent Capabilities                                         │
│ ├── Capability Matrix                                              │
│ └── Winner Badges                                                  │
├─────────────────────────────────────────────────────────────────────┤
│ SECTION: Development Velocity (from changelog DB)                   │
│ ├── Releases/Month Bars                                            │
│ └── Change Type Breakdown                                          │
├─────────────────────────────────────────────────────────────────────┤
│ SECTION: Honest Pros & Cons                                         │
│ └── Per-Tool Cards                                                 │
├─────────────────────────────────────────────────────────────────────┤
│ SECTION: The Verdict                                                │
│ └── Dynamic Recommendations by Persona                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

```
src/components/compare/
├── compare-page.tsx                # Main page orchestrator
├── persona-filters.tsx             # Usage/model tier/style filters
├── tool-selector.tsx               # Add/remove tools from comparison
│
├── hero/
│   ├── quick-take-hero.tsx         # Taglines + winner badges
│   └── tool-tagline-card.tsx       # Individual tool summary
│
├── pricing/
│   ├── pricing-section.tsx         # Full pricing section
│   ├── cost-estimator.tsx          # Persona-based cost estimates
│   ├── pricing-mechanics.tsx       # Collapsible deep-dive
│   └── worth-it-card.tsx           # Per-tool "worth it?" verdict
│
├── models/
│   ├── models-section.tsx          # Model availability section
│   ├── model-grid.tsx              # Full model × tool matrix
│   ├── free-models-highlight.tsx   # Callout for free options
│   └── model-filter-bar.tsx        # Filter by provider/tier
│
├── capabilities/
│   ├── capabilities-section.tsx    # Agent powers comparison
│   ├── capability-row.tsx          # Single capability row
│   └── capability-winner.tsx       # Winner badge with reason
│
├── velocity/
│   ├── velocity-section.tsx        # Changelog-derived stats
│   ├── velocity-bars.tsx           # Release frequency chart
│   └── change-breakdown.tsx        # Features/bugs/breaking
│
├── pros-cons/
│   ├── pros-cons-section.tsx       # Honest pros/cons
│   └── pros-cons-card.tsx          # Per-tool pros/cons
│
├── verdict/
│   ├── verdict-section.tsx         # Dynamic recommendations
│   └── persona-verdict.tsx         # "For X, use Y"
│
├── mobile/
│   └── tool-card-swiper.tsx        # Swipeable cards for mobile
│
└── shared/
    ├── winner-badge.tsx            # "🏆 Winner: X"
    ├── share-button.tsx            # Copy URL
    └── section-header.tsx          # Consistent section headers
```

---

## Key Components

### 1. Quick Take Hero

The hero section with taglines and quick verdict.

```
┌─────────────────────────────────────────────────────────────────────┐
│  COMPARE: Cursor vs Windsurf vs Claude Code vs Gemini CLI          │
│  ─────────────────────────────────────────────────────────────────  │
│  "Four tools. Hundreds of releases tracked. Here's the honest take."│
└─────────────────────────────────────────────────────────────────────┘

┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   CURSOR    │ │  WINDSURF   │ │ CLAUDE CODE │ │ GEMINI CLI  │
│             │ │             │ │             │ │             │
│ "The        │ │ "The free   │ │ "The raw    │ │ "The free   │
│  polished   │ │  lunch"     │ │  power"     │ │  lunch      │
│  one"       │ │             │ │             │ │  (actually)"│
│             │ │  ⭐ Budget  │ │  ⭐ Terminal│ │  🏆 FREE    │
│  ⭐ IDE     │ │             │ │             │ │             │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

**Styling:**
- Monospace font for taglines
- Subtle gradient border on cards
- Staggered entrance animation
- Award badges with semantic colors

### 2. Persona Filters

Interactive filters that update content dynamically.

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚙️  CUSTOMIZE COMPARISON                                           │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Your usage:                                                        │
│  [Light] [Daily Agent ←] [Power User]                              │
│                                                                     │
│  Models you'll use:                                                 │
│  [Free/Budget] [Standard ←] [Frontier]                             │
│                                                                     │
│  Preferences:                                                       │
│  [Terminal] [IDE]    [Privacy matters □]                           │
└─────────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Updates URL query params on change
- Content sections re-render with filtered data
- Verdicts change based on selections
- Use `layoutId` for smooth transitions

### 3. Pricing Section

The most complex section - handles incompatible pricing models.

```
┌─────────────────────────────────────────────────────────────────────┐
│  💰 THE REAL COST                                                   │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  ─── FOR DAILY AGENT USERS (STANDARD MODELS) ───                   │
│                                                                     │
│  ┌─────────────┬────────────┬────────────┬─────────────┐           │
│  │   Cursor    │  Windsurf  │Claude Code │ Gemini CLI  │           │
│  ├─────────────┼────────────┼────────────┼─────────────┤           │
│  │   ~$80/mo   │   ~$45/mo  │   ~$30/mo  │     $0   🏆 │           │
│  │   Tokens    │   Credits  │  Pro sub   │  Free tier  │           │
│  └─────────────┴────────────┴────────────┴─────────────┘           │
│                                                                     │
│  💬 "Windsurf's credit model is more predictable. Cursor's         │
│      token model can surprise you on long conversations."          │
│                                                                     │
│  [▼ How does billing actually work?]                               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  📊 PRICING MECHANICS (expanded)                                    │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  CURSOR — Token Consumption                                         │
│  ─────────────────────────────                                      │
│  Pay for every token. Pro includes $20 of usage.                   │
│  Claude Sonnet: $3/1M input, $15/1M output                         │
│  Daily agent user: ~$60-100/mo total                               │
│                                                                     │
│  WINDSURF — Prompt Credits                                          │
│  ─────────────────────────                                          │
│  Fixed credits per prompt. Pro includes 500 credits.               │
│  Claude Sonnet: 2 credits/prompt                                   │
│  50 prompts/day × 30 = 1500 credits = ~$55/mo                      │
│  BUT: SWE-1.5 is FREE. Use that for most work.                     │
│                                                                     │
│  ... etc                                                            │
└─────────────────────────────────────────────────────────────────────┘
```

### 4. Model Grid

Full model availability matrix with free models highlighted.

```
┌─────────────────────────────────────────────────────────────────────┐
│  🧠 MODEL AVAILABILITY                                              │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Filter: [All] [Free ←] [Claude] [OpenAI] [Google]                 │
│                                                                     │
│  ─── FREE MODELS (0 cost) ───                        [7 available] │
│  "Yes, actually free. Use these first."                            │
│                                                                     │
│  │ Model            │ Cursor │ Windsurf │ Claude │ Gemini │        │
│  ├──────────────────┼────────┼──────────┼────────┼────────│        │
│  │ SWE-1.5          │   —    │  ✓ FREE  │   —    │   —    │        │
│  │ DeepSeek-R1      │   —    │  ✓ FREE  │   —    │   —    │        │
│  │ GPT-5.1-Codex    │ tokens │  ✓ FREE  │   —    │   —    │        │
│  │ Gemini Flash     │ tokens │ 0.75 cr  │   —    │✓ FREE  │        │
│                                                                     │
│  ─── CLAUDE MODELS ───                                              │
│                                                                     │
│  │ Model            │ Cursor      │ Windsurf  │ Claude  │          │
│  ├──────────────────┼─────────────┼───────────┼─────────│          │
│  │ Sonnet 4.5       │ $3/$15/1M   │ 2 cr      │ Incl.   │          │
│  │ Sonnet (Think)   │ —           │ 3 cr      │ Incl.   │          │
│  │ Opus 4.1         │ $5/$20/1M   │ 20 cr ⚠️  │ Max     │          │
└─────────────────────────────────────────────────────────────────────┘
```

### 5. Velocity Section

Changelog-derived stats from the database.

```
┌─────────────────────────────────────────────────────────────────────┐
│  📊 DEVELOPMENT VELOCITY                                            │
│  ─────────────────────────────────────────────────────────────────  │
│  "We've tracked every release. Here's who ships fastest."          │
│                                                                     │
│  RELEASES PER MONTH                                                 │
│  ├─────────────────────────────────────────────────────────────┐   │
│  │  Claude Code  ████████████████████████  5.2/mo         🏆  │   │
│  │  Cursor       ████████████████░░░░░░░░  4.1/mo             │   │
│  │  Windsurf     ███████████░░░░░░░░░░░░░  2.8/mo             │   │
│  │  Gemini CLI   █████░░░░░░░░░░░░░░░░░░░  1.3/mo             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  LAST 30 DAYS                                                       │
│  │ Tool        │ Features │ Bugfixes │ Breaking │                  │
│  ├─────────────┼──────────┼──────────┼──────────│                  │
│  │ Claude Code │ +47      │ +89      │ 2        │                  │
│  │ Cursor      │ +31      │ +52      │ 0        │                  │
│  │ Windsurf    │ +23      │ +41      │ 1        │                  │
│  │ Gemini CLI  │ +8       │ +12      │ 0        │                  │
│                                                                     │
│  💬 "Claude Code ships fast and breaks things. Cursor is more      │
│      measured. Gemini is still finding its rhythm."                │
└─────────────────────────────────────────────────────────────────────┘
```

### 6. Verdict Section

Dynamic recommendations based on selected filters.

```
┌─────────────────────────────────────────────────────────────────────┐
│  🎯 THE VERDICT                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Based on your selections (Daily Agent, Standard Models):          │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  🏆 RECOMMENDED: Windsurf                                   │   │
│  │                                                              │   │
│  │  "For daily agent use on standard models, Windsurf's        │   │
│  │   credit model is more predictable than Cursor's tokens.    │   │
│  │   Plus, SWE-1.5 is free and handles most tasks."            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ALTERNATIVES:                                                      │
│  • Gemini CLI — If budget is $0 and you can accept Gemini         │
│  • Claude Code — If you're already on Claude Pro                   │
│  • Cursor — If you want the most polished UX                       │
│                                                                     │
│  [Share this comparison →]                                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Mobile Design

On mobile (< 768px), use swipeable tool cards:

```
┌─────────────────────────┐
│  ← CURSOR (1/4) →       │
│  ─────────────────────  │
│                         │
│  "The polished one"     │
│                         │
│  💰 ~$80/mo             │
│  (Daily Agent)          │
│                         │
│  ✓ File edit            │
│  ✓ Terminal             │
│  ✗ Browser              │
│  ✓ Background agents    │
│                         │
│  PROS:                  │
│  • Tab completion...    │
│  • Background agents... │
│                         │
│  CONS:                  │
│  • Electron RAM...      │
│  • Token burn...        │
│                         │
│  [●○○○]                 │
└─────────────────────────┘
```

**Interactions:**
- Swipe left/right between tools
- Dot indicators for position
- Same sections as desktop, just vertical within each card
- Sticky filter bar at top

---

## Animations

Following [animation patterns](../design/design-rules.md#ux--animation):

### Page Load

1. Background grid fades in (0-500ms)
2. Hero title types in (500-1000ms)
3. Tool cards stagger in from below (1000-1500ms)
4. Filter bar slides in (1500ms)
5. Sections reveal on scroll

### Filter Changes

- Selected filter button scales up slightly
- Content sections cross-fade (200ms)
- Winner badges animate with spring physics
- Numbers count up when estimates change

### Section Expansion

- Pricing mechanics expands with height animation
- Content fades in after expansion
- Chevron rotates 180°

### Mobile Swipe

- Cards slide with momentum
- Snap to nearest card
- Dot indicator animates smoothly

---

## Accessibility

- All interactive elements keyboard accessible
- Filter buttons have clear focus states
- Color is not the only indicator (use icons + text)
- Screen reader announcements for filter changes
- Sufficient contrast on all text (see design rules)

---

## Implementation Notes

### URL State

Use TanStack Router search params:

```typescript
const searchSchema = z.object({
  tools: z.string().optional(),
  usage: z.enum(['light', 'daily', 'power']).optional(),
  models: z.enum(['free', 'budget', 'standard', 'frontier']).optional(),
  style: z.enum(['terminal', 'ide']).optional(),
  privacy: z.coerce.boolean().optional(),
})
```

### SSR Considerations

- Static data (tools, pricing) available immediately
- Velocity stats fetched in loader (SSR)
- Filter state parsed from URL on server
- No loading states for initial data

### Component Props

```typescript
interface CompareSectionProps {
  tools: ToolComparison[]
  filters: FilterState
  velocity?: VelocityStats[]  // From DB
}

interface FilterState {
  usage: 'light' | 'daily' | 'power'
  models: 'free' | 'budget' | 'standard' | 'frontier'
  style?: 'terminal' | 'ide'
  privacy: boolean
}
```
