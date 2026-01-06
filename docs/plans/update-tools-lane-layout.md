# Update Tools Lane Layout Plan

## Status: ✅ COMPLETED

**Implemented**: January 2026

## Summary

Transform the homepage feed from a mixed chronological grid to a **tool-organized lanes layout** where each tool gets its own horizontal scrollable row. Lanes are sorted by most recent activity, with velocity badges for high-activity tools (≥2 releases today). Cards are minimal (version + date + change count), and the hero section is preserved above the lanes.

## Implementation Summary

### Files Created

| File | Description |
|------|-------------|
| `src/components/home/tool-lanes-feed.tsx` | Main container orchestrating all lanes |
| `src/components/home/tool-lane.tsx` | Single lane with header + scroll container |
| `src/components/home/lane-release-card.tsx` | Minimal card component |
| `src/components/home/lane-navigation.tsx` | Arrow buttons for desktop |
| `src/components/home/velocity-badge.tsx` | "🔥 X today" indicator |

### Files Modified

| File | Changes |
|------|---------|
| `src/server/tools.ts` | Added `getReleasesGroupedByTool` server function |
| `src/routes/index.tsx` | Updated loader to use grouped releases, replaced grid with `<ToolLanesFeed>` |
| `src/components/home/hero-section.tsx` | Fixed hydration mismatch in typewriter effect |
| `src/components/logo/antigravity.tsx` | Fixed SVG attributes (camelCase for React) |

### Key Features Implemented

- **Horizontal lanes**: Each tool has its own scrollable row
- **Lane sorting**: Most recently active tools appear first
- **Velocity badges**: Shows "🔥 X today" for tools with ≥2 releases today
- **Minimal cards**: Version, relative date, change count, and badges (breaking/security/deprecation)
- **Arrow navigation**: Desktop-only, appears on hover
- **Scroll snap**: Smooth horizontal scrolling with snap points
- **Tool filters**: Client-side filtering to show/hide lanes
- **Change type filters**: Server-side filtering via `getReleasesGroupedByTool`
- **Search**: Client-side version search within lanes
- **Accessibility**: Semantic `<ul>/<li>` structure with ARIA labels

## Design Decisions (Confirmed)

| Decision | Choice |
|----------|--------|
| **Lane Ordering** | Most recently active first |
| **Velocity Badge** | Show "🔥 X today" if ≥2 releases today |
| **Empty Lane** | Show lane with "No matching releases" message |
| **Card Density** | Minimal: Version + date + change count only |
| **Hero Section** | Keep as-is, lanes below |

## Visual Specification

### Desktop (≥768px)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              [HERO SECTION - unchanged]                      │
│                         Latest release featured card                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ $ view releases                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─ Terminal Frame ─────────────────────────────────────────────────────────┐│
│ │ Filters + Search (unchanged)                                             ││
│ ├──────────────────────────────────────────────────────────────────────────┤│
│ │                                                                          ││
│ │ ┌─ Lane: OpenCode ────────────────────────────────────────────────────┐ ││
│ │ │ [Logo] OpenCode  ANOMALY  🔥 6 today                    View all → │ ││
│ │ │ ◀ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──   ▶  │ ││
│ │ │   │v1.0.203│ │v1.0.202│ │v1.0.201│ │v1.0.200│ │v1.0.199│ │v1.     │ ││
│ │ │   │ 11d    │ │ 11d    │ │ 12d    │ │ 12d    │ │ 13d    │ │ 13     │ ││
│ │ │   │ 4 chgs │ │ 5 chgs │ │ 2 chgs │ │ 3 chgs │ │ 1 chg  │ │ ..     │ ││
│ │ │   └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └──      │ ││
│ │ └────────────────────────────────────────────────────────────────────┘ ││
│ │                                                                          ││
│ │ ┌─ Lane: Claude Code ─────────────────────────────────────────────────┐ ││
│ │ │ [Logo] Claude Code  ANTHROPIC                           View all → │ ││
│ │ │   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                      │ ││
│ │ │   │v1.0.30 │ │v1.0.29 │ │v1.0.28 │ │v1.0.27 │  (no arrows - fits) │ ││
│ │ │   │ 2d     │ │ 5d     │ │ 1w     │ │ 2w     │                      │ ││
│ │ │   │ 8 chgs │ │ 12 chgs│ │ 5 chgs │ │ 3 chgs │                      │ ││
│ │ │   └────────┘ └────────┘ └────────┘ └────────┘                      │ ││
│ │ └────────────────────────────────────────────────────────────────────┘ ││
│ │                                                                          ││
│ │ ┌─ Lane: Cursor (filtered - no matches) ──────────────────────────────┐ ││
│ │ │ [Logo] Cursor  ANYSPHERE                                View all → │ ││
│ │ │                                                                      │ ││
│ │ │              No releases matching current filters                    │ ││
│ │ │                                                                      │ ││
│ │ └────────────────────────────────────────────────────────────────────┘ ││
│ │                                                                          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### Mobile (<768px)

```
┌─────────────────────────────┐
│     [HERO - compact]        │
├─────────────────────────────┤
│ $ view releases             │
├─────────────────────────────┤
│ ┌─ Terminal Frame ─────────┐│
│ │ [Search...] [Filters]    ││
│ ├──────────────────────────┤│
│ │                          ││
│ │ ┌─ OpenCode ───────────┐ ││
│ │ │ [Logo] OpenCode      │ ││
│ │ │ 🔥 6 today  View all→│ ││
│ │ │ ┌──────┐ ┌──────┐ ┌─ │ ││
│ │ │ │1.0.  │ │1.0.  │ │1.│←│  ← Swipe
│ │ │ │ 203  │ │ 202  │ │ 2│ ││
│ │ │ │ 11d  │ │ 11d  │ │ 1│ ││
│ │ │ │4 chgs│ │5 chgs│ │2 │ ││
│ │ │ └──────┘ └──────┘ └──│ ││
│ │ └──────────────────────┘ ││
│ │                          ││
│ │ ┌─ Claude Code ────────┐ ││
│ │ │ [Logo] Claude Code   │ ││
│ │ │           View all → │ ││
│ │ │ ┌──────┐ ┌──────┐ ┌─ │ ││
│ │ │ │1.0.30│ │1.0.29│ │1.│←│
│ │ │ └──────┘ └──────┘ └──│ ││
│ │ └──────────────────────┘ ││
│ │                          ││
│ │    ↓ scroll for more     ││
│ └──────────────────────────┘│
└─────────────────────────────┘
```

## Component Specifications (Implemented)

### 1. `LaneReleaseCard` (Minimal Card)

```tsx
interface LaneReleaseCardProps {
  toolSlug: string
  version: string
  formattedVersion?: string
  releaseDate: Date | string | null
  changeCount: number
  hasBreaking?: boolean
  hasSecurity?: boolean
  hasDeprecation?: boolean
  isLaneHovered?: boolean  // For window controls
}
```

**Styling**:
- Glassmorphism: `bg-card/60 backdrop-blur-sm border-border/40`
- Hover: `hover:border-foreground/30 hover:bg-card/80`
- Window controls: Gray by default, colored when `isLaneHovered`
- Responsive widths: `w-36 sm:w-44 lg:w-52`

### 2. `ToolLane` (Lane Container)

```tsx
interface ToolLaneProps {
  tool: {
    slug: string
    name: string
    vendor: string | null
    totalReleases: number
    velocity: { today: number }
  }
  releases: LaneRelease[]
  hasMatchingReleases: boolean
  animationDelay?: number
}
```

**Features**:
- Lane header with logo, name, vendor, velocity badge, "View all →"
- Horizontal scroll container with snap (`<ul>` for accessibility)
- Arrow navigation (desktop only, on hover)
- Empty state when `!hasMatchingReleases`

### 3. `VelocityBadge`

```tsx
interface VelocityBadgeProps {
  releasesToday: number
  threshold?: number  // Default: 2
}
```

**Rendering**:
- If `releasesToday >= threshold`: Show `🔥 {count} today`
- Otherwise: Don't render (return null)

### 4. `LaneNavigation`

```tsx
interface LaneNavigationProps {
  side: 'left' | 'right'
  onClick: () => void
  disabled: boolean
  visible: boolean  // Only show on hover
}
```

**Styling**:
- Absolute positioned on lane edges
- Fade in/out on lane hover
- Disabled state when at scroll boundary

### 5. `ToolLanesFeed` (Container)

```tsx
interface ToolLanesFeedProps {
  data: GroupedReleasesData
  selectedTools: string[]
  searchQuery: string
}
```

**Responsibilities**:
- Render lanes in order (most recent activity first)
- Apply client-side filters (tool selection, search)
- Handle lane visibility based on tool filters

## Backend Implementation

### Server Function: `getReleasesGroupedByTool`

Located in `src/server/tools.ts`:

```typescript
const groupedReleasesSchema = z.object({
  releasesPerTool: z.number().int().min(1).max(20).default(8),
  changeTypes: z.array(z.enum([...])).optional(),
  toolSlugs: z.array(z.string().min(1)).optional(),
  includePrereleases: z.boolean().default(true),
})

export const getReleasesGroupedByTool = createServerFn({ method: 'GET' })
  .inputValidator(...)
  .handler(async ({ data }) => {
    // 1. Get all active tools
    // 2. For each tool, fetch latest N releases + velocity (parallel)
    // 3. Sort by most recent activity
    // 4. Return tools with releases and pagination
  })
```

**Returns**:
```typescript
{
  tools: Array<{
    id: string
    slug: string
    name: string
    vendor: string | null
    totalReleases: number
    velocity: { today: number }
    latestReleaseDate: Date | null
    releases: Array<{
      id: string
      version: string
      formattedVersion: string
      releaseDate: Date | null
      _count: { changes: number }
      changesByType: Record<string, number>
      hasBreaking: boolean
      hasSecurity: boolean
      hasDeprecation: boolean
    }>
  }>
  pagination: {
    totalTools: number
    totalReleases: number
  }
}
```

## Verification Checklist (All Passed)

### Code Quality
- [x] Run `pnpm biome check` on all modified files
- [x] Run `pnpm build` (ensure production build succeeds)
- [x] Check TypeScript errors with IDE diagnostics

### SSR Verification
- [x] F5 refresh: Lanes load with data (server-rendered)
- [x] Client navigation: No "DATABASE_URL not set" error
- [x] View source: Lane data visible in initial HTML

### Design System Compliance
- [x] Monochrome palette maintained
- [x] Glassmorphism effects on cards (`bg-card/60 backdrop-blur-sm`)
- [x] Typography: Inter for UI, Fira Code for versions/counts
- [x] Animations: 400-500ms, easeOut curves
- [x] Responsive: Mobile (2 cards), Tablet (3), Desktop (4-5)

### Functional Testing
- [x] Lanes sorted by most recent activity
- [x] Velocity badge shows for ≥2 releases today
- [x] Empty lanes show "No matching releases" message
- [x] Change type filters work across all lanes
- [x] Tool icon filters hide/show lanes
- [x] Search filters cards within lanes
- [x] Arrow navigation works on desktop
- [x] Touch swipe works on mobile
- [x] Scroll-snap feels smooth

### Accessibility
- [x] Semantic `<ul>/<li>` structure (not `role="group"`)
- [x] ARIA labels on lanes and cards
- [x] Focus indicators visible
- [x] Keyboard navigation works

### Bug Fixes Applied
- [x] Fixed hydration mismatch in hero section typewriter effect
- [x] Fixed SVG attributes in antigravity.tsx (camelCase for React)

## Related Documentation

- `docs/reference/api-patterns.md` - SSR loader patterns used
- `docs/design/design-rules.md` - Design system compliance
- `docs/design/animations/homepage.md` - Animation choreography (needs update)
