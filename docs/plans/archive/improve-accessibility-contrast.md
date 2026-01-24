# Plan: Improve Accessibility & Text Contrast

> **Status**: Planning  
> **Created**: 2026-01-11  
> **Priority**: High (User Feedback)

## Problem Statement

Multiple users have reported accessibility issues with text contrast, especially on the tools pages and homepage. Key problems:

### Issue 1: Essential Text Fails WCAG AA Compliance

**Affected Elements**:
- Stat card labels ("Status", "Total Tools", "Total Releases")
- Filter section headers ("FILTER_BY_TYPE", "FILTER_BY_DATE", "FILTER_BY_VERSION")
- Tool vendor names (Google, Anthropic, OpenAI)
- Breadcrumb navigation
- Metadata labels ("LATEST_VER:", "TOTAL_RELEASES:", "CHANGES:")
- Timeline timestamps and secondary text

**Root cause**: The design system uses `--muted-foreground: oklch(0.5 0 0)` (~#808080) which achieves only **3.9:1 contrast ratio** on the deep black background. Combined with aggressive opacity modifiers (`/50`, `/40`, `/30`), contrast drops to **1.6:1 or lower**, well below the WCAG AA requirement of **4.5:1**.

**Evidence**:
```
Current contrast ratios on oklch(0.09 0 0) background:
- text-muted-foreground           → ~3.9:1  ❌ (needs 4.5:1)
- text-muted-foreground/50        → ~1.6:1  ❌❌
- text-muted-foreground/40        → ~1.4:1  ❌❌
- text-[color]-500/50             → ~2.0:1  ❌❌
```

### Issue 2: Homepage Appears Almost Entirely Black

**Error**: The grid pattern background is barely visible, making the entire homepage look like a black void.

**Root cause**: 
1. Grid pattern uses `#80808012` (only 7% opacity gray)
2. A 90% opacity black overlay (`bg-background/90`) further obscures the grid
3. The combined effect renders the grid nearly invisible (~1.1:1 contrast)

**Code path**:
- `src/routes/__root.tsx:126` - Grid pattern with 7% opacity
- `src/routes/__root.tsx:127` - 90% black overlay

### Issue 3: Inconsistent Opacity Usage Across Components

**Pattern**: Opacity modifiers are used inconsistently:
- Some use `/50` for essential content (labels, descriptions)
- Others use `/40` for important metadata
- Some use `/30` for dimming effects (nearly illegible)

This creates confusion about what's decorative vs. essential content and makes it difficult to scan the interface.

---

## Solution Overview

Following a **balanced approach** that maintains the terminal aesthetic while ensuring essential content meets WCAG AA standards:

- **Essential content** (labels, metadata, descriptions): Meet WCAG AA (4.5:1)
- **Decorative elements** (separators like `/`, `~`, `•`): Can remain low-contrast
- **Interactive states** (hover, focus): Maintain visual hierarchy through brightness

### Core Strategy

1. **Update CSS Variables**: Brighten `--muted-foreground` to achieve 4.5:1+ contrast
2. **Remove Aggressive Opacity Modifiers**: Replace `/50`, `/40`, `/30` on essential text with full colors or `/70`+ minimum
3. **Improve Homepage Grid Visibility**: Reduce overlay opacity and brighten grid pattern
4. **Preserve Terminal Aesthetic**: Keep decorative elements low-contrast to maintain the "dev-vibe"

---

## Detailed Implementation Plan

### Phase 1: Update Design System Colors (Sequential - Foundation)

**File**: `src/styles.css`

#### Change 1: Brighten Muted Foreground

**Line 73** (`.dark` section):

**Before**:
```css
--muted-foreground: oklch(0.5 0 0); /* #808080 - gray text */
```

**After**:
```css
--muted-foreground: oklch(0.65 0 0); /* #A0A0A0 - accessible gray */
```

**Rationale**: 
- `oklch(0.65 0 0)` ≈ #A0A0A0 achieves ~5.7:1 contrast on `oklch(0.09 0 0)` background
- Passes WCAG AA (4.5:1) with comfortable margin
- Minimal change to preserve monochrome aesthetic

#### Change 2: Slightly Brighten Border

**Line 84**:

**Before**:
```css
--border: oklch(0.25 0 0); /* rgba(255,255,255,0.1) equivalent */
```

**After**:
```css
--border: oklch(0.3 0 0); /* Slightly more visible borders */
```

**Rationale**: Improves subtle border visibility without being intrusive.

---

### Phase 2: Fix Homepage Grid Visibility (Independent)

**File**: `src/routes/__root.tsx`

#### Change 1: Brighten Grid Pattern

**Line ~126**:

**Before**:
```tsx
bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)]
```

**After**:
```tsx
bg-[linear-gradient(to_right,#80808020_1px,transparent_1px),linear-gradient(to_bottom,#80808020_1px,transparent_1px)]
```

**Rationale**: Increases grid opacity from 7% to 12% (~70% increase in visibility).

#### Change 2: Reduce Overlay Opacity

**Line ~127**:

**Before**:
```tsx
<div className="fixed inset-0 z-[-1] pointer-events-none bg-background/90">
```

**After**:
```tsx
<div className="fixed inset-0 z-[-1] pointer-events-none bg-background/80">
```

**Rationale**: Allows more of the grid to show through while maintaining depth.

---

### Phase 3: Fix Route Files (Parallel - Can be delegated)

#### Subagent A: Tools Index Page

**File**: `src/routes/tools/index.tsx`

| Line | Element | Current | Fix | Reason |
|------|---------|---------|-----|--------|
| 116 | Title prefix | `text-muted-foreground/50` | Keep as-is | Decorative `~/` |
| 150 | "Status" label | `text-muted-foreground/50` | `text-muted-foreground` | Essential label |
| 166 | "Total Tools" label | `text-muted-foreground/50` | `text-muted-foreground` | Essential label |
| 182 | "Total Releases" label | `text-muted-foreground/50` | `text-muted-foreground` | Essential label |

**Changes**: 3 replacements

#### Subagent B: Homepage Route

**File**: `src/routes/index.tsx`

| Line | Element | Current | Fix | Reason |
|------|---------|---------|-----|--------|
| 285 | Terminal `$` prompt | `text-muted-foreground/50` | Keep as-is | Decorative prompt |
| 341 | Search placeholder | `placeholder:text-muted-foreground/50` | `placeholder:text-muted-foreground/70` | User input hint |
| 404, 409, 413 | Stat separators | `text-muted-foreground/50` | Keep as-is | Decorative `/` chars |

**Changes**: 1 replacement

#### Subagent C: Tool Detail Route

**File**: `src/routes/tools/$slug/index.tsx`

| Line | Element | Current | Fix | Reason |
|------|---------|---------|-----|--------|
| 219 | Empty state hint | `text-xs opacity-50` | `text-sm opacity-70` | User guidance |

**Changes**: 1 replacement (also increases font size from xs to sm)

---

### Phase 4: Fix Component Files (Parallel - Can be delegated)

#### Subagent D: Tool Hero Component

**File**: `src/components/changelog/tool/tool-hero.tsx`

| Line | Element | Current | Fix | Reason |
|------|---------|---------|-----|--------|
| 88 | Breadcrumbs | `text-muted-foreground/60` | `text-muted-foreground` | Navigation |
| 262 | "(LATEST)" label | `text-muted-foreground/60` | `text-muted-foreground` | Status indicator |
| 320 | "↗ LATEST:" label | `text-muted-foreground/40` | `text-muted-foreground/70` | Metadata label |
| 320 (hover) | Hover state | `group-hover:text-muted-foreground/60` | `group-hover:text-muted-foreground` | Interactive feedback |
| 329 | "LATEST_VER:" label | `text-muted-foreground/40` | `text-muted-foreground/70` | Metadata label |
| 341 | "CHANGES:" / "TOTAL_RELEASES:" | `text-muted-foreground/40` | `text-muted-foreground/70` | Metadata label |

**Changes**: 6 replacements

#### Subagent E: Filter Bar Component

**File**: `src/components/changelog/tool/filter-bar.tsx`

| Line | Element | Current | Fix | Reason |
|------|---------|---------|-----|--------|
| 65 | Section header text | `text-[10px] ... text-muted-foreground/50` | `text-xs ... text-muted-foreground` | Label + size increase |
| 206 | "FILTER_BY_TYPE" | `text-green-500/50` | `text-green-500/80` | Section header |
| 250 | "FILTER_BY_DATE" | `text-blue-500/50` | `text-blue-500/80` | Section header |
| 361 | "FILTER_BY_VERSION" | `text-purple-500/50` | `text-purple-500/80` | Section header |
| 227 | Inactive button text | `text-foreground/60` | `text-foreground/80` | Button label |
| 272 | Date range inactive | `text-foreground/60` | `text-foreground/80` | Button label |
| 303 | Stable only inactive | `text-foreground/60` | `text-foreground/80` | Button label |
| 231 | Dimmed filter effect | `opacity-30` | `opacity-50` | Hover dim state |
| 326, 340 | "FROM" / "TO" labels | `text-[9px] ... text-muted-foreground/50` | `text-xs ... text-muted-foreground` | Input labels + size |
| 404 | "Clear all" button | `text-red-400/70` | `text-red-400` | Action button |

**Changes**: 10+ replacements (includes font size increases)

#### Subagent F: Shared Components

**File**: `src/components/shared/header.tsx`

| Line | Element | Current | Fix | Reason |
|------|---------|---------|-----|--------|
| 158 | Breadcrumb separator | `text-muted-foreground/40` | Keep as-is | Decorative `/` |

**File**: `src/components/shared/footer.tsx`

| Line | Element | Current | Fix | Reason |
|------|---------|---------|-----|--------|
| 25 | Top border | `border-border/40` | `border-border/60` | Structural element |

**File**: `src/components/shared/logo-showcase.tsx`

| Line | Element | Current | Fix | Reason |
|------|---------|---------|-----|--------|
| 122 | Tool names in marquee | `text-muted-foreground/60` | `text-muted-foreground` | Content labels |

**File**: `src/components/home/hero-section.tsx`

| Line | Element | Current | Fix | Reason |
|------|---------|---------|-----|--------|
| 130 | Hero subtitle | `text-muted-foreground/80` | Keep as-is | Already reasonable |
| 170 | Glow effect | `opacity-10` | Keep as-is | Decorative effect |

**Changes**: 3 replacements

#### Subagent G: Timeline Components

**File**: `src/components/changelog/timeline/timeline-item.tsx`

| Line | Element | Current | Fix | Reason |
|------|---------|---------|-----|--------|
| 58 (approx) | Timeline footer | `opacity-70` | `opacity-80` | Metadata text |

**File**: `src/components/changelog/release-card.tsx`

Review after CSS variable change - may not need edits if `text-muted-foreground` is used without modifiers.

**Changes**: 1+ replacement

#### Subagent H: Tool Card Component

**File**: `src/components/tools/tool-card.tsx`

| Line | Element | Current | Fix | Reason |
|------|---------|---------|-----|--------|
| 124 | Arrow icon | `text-foreground/50` | `text-foreground/70` | Interactive indicator |
| 142 | Footer border | `border-border/40` | `border-border/60` | Structural element |

**Changes**: 2 replacements

---

### Phase 5: Code Quality & Verification (Sequential - After all changes)

#### Step 1: Run Biome Formatter

```bash
pnpm biome check --write src/styles.css
pnpm biome check --write src/routes/__root.tsx
pnpm biome check --write src/routes/index.tsx
pnpm biome check --write src/routes/tools/index.tsx
pnpm biome check --write "src/routes/tools/\$slug/index.tsx"
pnpm biome check --write src/components/changelog/tool/tool-hero.tsx
pnpm biome check --write src/components/changelog/tool/filter-bar.tsx
pnpm biome check --write src/components/shared/header.tsx
pnpm biome check --write src/components/shared/footer.tsx
pnpm biome check --write src/components/shared/logo-showcase.tsx
pnpm biome check --write src/components/home/hero-section.tsx
pnpm biome check --write src/components/changelog/timeline/timeline-item.tsx
pnpm biome check --write src/components/changelog/release-card.tsx
pnpm biome check --write src/components/tools/tool-card.tsx
```

#### Step 2: Build Verification

```bash
# Ensure no TypeScript errors
pnpm build
```

#### Step 3: Visual Verification

Run dev server and manually verify:
```bash
pnpm dev
```

Test pages:
- [ ] `/` - Homepage grid is visible, hero text is readable
- [ ] `/tools` - Stat labels are clear, tool cards are legible
- [ ] `/tools/claude-code` - Hero metadata, breadcrumbs readable
- [ ] `/tools/claude-code` (filters) - All filter labels are clear
- [ ] Timeline view - Release card metadata is visible

#### Step 4: Contrast Ratio Testing

Using browser DevTools or axe-core extension, verify:

**Essential Elements (Must meet 4.5:1)**:
- [ ] Stat card labels ("Status", "Total Tools", "Total Releases")
- [ ] Filter section headers ("FILTER_BY_TYPE", etc.)
- [ ] Breadcrumb navigation
- [ ] Metadata labels ("LATEST_VER:", "CHANGES:", etc.)
- [ ] Tool vendor names
- [ ] Search placeholder text
- [ ] Empty state messages
- [ ] Tool names in marquee

**Large Text (Must meet 3:1)**:
- [ ] Page headings
- [ ] Tool names
- [ ] Release titles

**Decorative (No requirement)**:
- [ ] Separators (`/`, `~`, `•`)
- [ ] Background grid pattern
- [ ] Glow effects

---

### Phase 6: Documentation Updates (Parallel - Can be done concurrently)

#### Update Design Rules

**File**: `docs/design/design-rules.md`

**Add new section after line 36** (after "Gradients"):

```markdown
### 4. Accessibility

While maintaining the monochrome dev-vibe, ensure essential content meets WCAG 2.1 Level AA standards:

-   **Text Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text (18px+ or 14px+ bold)
-   **Color Values**:
    -   `--muted-foreground: oklch(0.65 0 0)` achieves 5.7:1 contrast on the dark background
    -   Use full `text-muted-foreground` for essential labels and metadata
-   **Opacity Modifiers**:
    -   `/50` and below: **Decorative only** (separators, ornaments)
    -   `/70`+: Acceptable for secondary content with full `text-muted-foreground` fallback
    -   Avoid on essential text (labels, navigation, metadata)
-   **Interactive States**: Maintain sufficient contrast in hover/focus states (use brighter colors or reduce opacity less)

**Guidelines**:
-   Essential content: Labels, navigation, metadata, user guidance → Full color or `/70`+ minimum
-   Decorative content: Separators (`/`, `~`), ornaments, background patterns → Can use `/50` or lower
-   When in doubt, test with browser DevTools color picker contrast ratio
```

**Update Implementation Checklist** (line 129):

Add to existing checklist:
```markdown
6.  [ ] Does essential text meet WCAG AA contrast (4.5:1)?
7.  [ ] Are opacity modifiers (/50, /40) only used for decorative elements?
```

#### Create Accessibility Guide

**File**: `docs/design/accessibility.md` (NEW)

```markdown
# Accessibility Guidelines

## Contrast Requirements

### WCAG 2.1 Level AA Standards

All essential user interface components must meet these minimum contrast ratios:

| Text Size | Minimum Contrast | Example |
|-----------|------------------|---------|
| Normal text (\u003c18px) | 4.5:1 | Labels, metadata, descriptions |
| Large text (≥18px or ≥14px bold) | 3:1 | Headings, tool names |
| UI Components (borders, icons) | 3:1 | Buttons, form inputs |

### Current Color System

On dark background `oklch(0.09 0 0)` (#0A0A0A):

| Color Variable | Value | Hex | Contrast Ratio | Status |
|----------------|-------|-----|----------------|--------|
| `--foreground` | `oklch(1 0 0)` | #FFFFFF | 18.9:1 | ✅ AAA |
| `--muted-foreground` | `oklch(0.65 0 0)` | #A0A0A0 | 5.7:1 | ✅ AA |
| `--border` | `oklch(0.3 0 0)` | #4D4D4D | 2.4:1 | ⚠️ UI only |

### Opacity Modifier Rules

| Modifier | Use Case | Contrast Impact | Allowed For |
|----------|----------|-----------------|-------------|
| Full color (no modifier) | Essential content | Best | Labels, navigation, metadata |
| `/80` | Secondary content | Good | Hover states, less critical info |
| `/70` | Tertiary content | Acceptable | Secondary metadata with context |
| `/60` | Decorative hints | Low | Non-essential visual separators |
| `/50` and below | **Decorative only** | Very low | Separators (`/`, `~`, `•`), ornaments |

### Examples

**✅ Correct Usage**:
```tsx
// Essential label - full contrast
\u003cspan className="text-muted-foreground"\u003eTOTAL_RELEASES:\u003c/span\u003e

// Decorative separator - low contrast allowed
\u003cspan className="text-muted-foreground/50"\u003e/\u003c/span\u003e

// Interactive state - maintains readability
\u003cbutton className="text-foreground/80 hover:text-foreground"\u003e
```

**❌ Incorrect Usage**:
```tsx
// Essential label with too low contrast
\u003cspan className="text-muted-foreground/40"\u003eTOTAL_RELEASES:\u003c/span\u003e

// User guidance text that's hard to read
\u003cp className="text-sm opacity-30"\u003eTry adjusting your filters\u003c/p\u003e
```

## Testing

### Browser DevTools

1. Inspect element with low contrast
2. Open Styles panel
3. Click color swatch
4. Check "Contrast ratio" in color picker
5. Verify it meets 4.5:1 (or 3:1 for large text)

### Automated Testing

```bash
# Install axe DevTools browser extension
# Or use axe-core in E2E tests (planned)
```

### Manual Verification Checklist

After making design changes:

- [ ] Navigation (header, breadcrumbs, footer links)
- [ ] Form labels and placeholders
- [ ] Button text and states
- [ ] Metadata labels (timestamps, counts, stats)
- [ ] Error messages and empty states
- [ ] Filter controls and section headers

## Exceptions

Purely decorative elements don't require contrast compliance:
- Background patterns and textures
- Visual separators (slashes, dots, lines)
- Glow effects and shadows
- Logo watermarks

## Resources

- [WCAG 2.1 Contrast Requirements](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [OKLCH Color Picker](https://oklch.com/)
```

---

## File Change Summary

| File | Change Type | Lines Changed | Description |
|------|-------------|---------------|-------------|
| `src/styles.css` | Modify | 2 | Update `--muted-foreground` and `--border` |
| `src/routes/__root.tsx` | Modify | 2 | Brighten grid, reduce overlay |
| `src/routes/index.tsx` | Modify | 1 | Fix placeholder contrast |
| `src/routes/tools/index.tsx` | Modify | 3 | Fix stat labels |
| `src/routes/tools/$slug/index.tsx` | Modify | 1 | Fix empty state |
| `src/components/changelog/tool/tool-hero.tsx` | Modify | 6 | Fix metadata labels |
| `src/components/changelog/tool/filter-bar.tsx` | Modify | 10+ | Fix all filter labels, sizes |
| `src/components/shared/header.tsx` | Review | 0 | Keep decorative separators |
| `src/components/shared/footer.tsx` | Modify | 1 | Fix border visibility |
| `src/components/shared/logo-showcase.tsx` | Modify | 1 | Fix tool names |
| `src/components/home/hero-section.tsx` | Review | 0 | Already acceptable |
| `src/components/changelog/timeline/timeline-item.tsx` | Modify | 1 | Fix footer opacity |
| `src/components/changelog/release-card.tsx` | Review | TBD | Verify after CSS change |
| `src/components/tools/tool-card.tsx` | Modify | 2 | Fix arrow and border |
| `docs/design/design-rules.md` | Modify | ~20 | Add accessibility section |
| `docs/design/accessibility.md` | Create | ~150 | New comprehensive guide |

**Total files**: 16 (14 code + 2 docs)  
**Estimated changes**: ~50 lines of code

---

## Risk Assessment

### Risk 1: Brighter Colors Feel "Too Stark"

**Likelihood**: Medium  
**Impact**: Low (subjective)  
**Mitigation**: 
- `oklch(0.65 0 0)` is the minimum for AA compliance
- Can adjust to `0.6` if feedback suggests it's too bright
- Opacity modifiers still allow visual hierarchy
- Decorative elements retain low contrast for depth

### Risk 2: Breaking Visual Hierarchy

**Likelihood**: Low  
**Impact**: Medium  
**Mitigation**:
- Hover states use full `text-foreground` (brightest)
- Active states use `text-foreground/80` or color accents
- Ratio between states is maintained (full → /80 → /70)
- Test all interactive components after changes

### Risk 3: Unintended Side Effects from CSS Variable Change

**Likelihood**: Low  
**Impact**: Medium  
**Mitigation**:
- `--muted-foreground` is used consistently across codebase
- Full build + visual regression testing required
- Can revert CSS change independently if issues arise
- Opacity modifier changes are localized to specific components

### Risk 4: Font Size Changes Break Layouts

**Likelihood**: Very Low  
**Impact**: Low  
**Mitigation**:
- Only increasing `text-[9px]` → `text-xs` and `text-[10px]` → `text-xs`
- These are label elements with flexible containers
- Test filter bar responsiveness on mobile

---

## Verification Strategy

### Automated Testing

```bash
# Run build to catch TypeScript errors
pnpm build

# Future: Add axe-core E2E tests
# pnpm test:e2e:a11y
```

### Manual Testing Checklist

#### Homepage (`/`)
- [ ] Grid pattern is visible (not black void)
- [ ] Hero title and subtitle are readable
- [ ] Terminal prompt aesthetic is preserved
- [ ] Search placeholder is legible
- [ ] Stats bar separators are appropriately subtle

#### Tools Directory (`/tools`)
- [ ] "~/tools" title is clear
- [ ] Description paragraph is readable
- [ ] Stat card labels are easily readable
  - [ ] "SYSTEM_READY" status
  - [ ] "Total Tools" label
  - [ ] "Total Releases" label
- [ ] Tool card vendor names are clear
- [ ] Tool descriptions are readable
- [ ] Version numbers and release counts are visible

#### Tool Detail Page (`/tools/claude-code`)
- [ ] Breadcrumbs are readable
- [ ] Tool name and description are clear
- [ ] Status bar metadata is visible:
  - [ ] "STATUS: ACTIVE"
  - [ ] "LATEST_VER:" label
  - [ ] "TOTAL_RELEASES:" label
- [ ] Filter section headers are clear:
  - [ ] "FILTER_BY_TYPE"
  - [ ] "FILTER_BY_DATE"
  - [ ] "FILTER_BY_VERSION"
- [ ] Filter button labels are readable (inactive and active states)
- [ ] Date range "FROM" / "TO" labels are visible
- [ ] "Clear all" button is readable

#### Timeline View
- [ ] Release card titles are clear
- [ ] Timestamps are readable
- [ ] Change summaries are visible
- [ ] Footer metadata is legible

#### Interactive States
- [ ] Hover effects maintain or improve contrast
- [ ] Focus states are visible
- [ ] Active filter pills stand out
- [ ] Dimmed filters are still somewhat readable (opacity-50)

### Contrast Ratio Validation

Using browser DevTools, verify these achieve ≥4.5:1:

**Critical Elements**:
- [ ] `text-muted-foreground` on `bg-background`
- [ ] Filter section headers
- [ ] Stat card labels
- [ ] Breadcrumb links
- [ ] Metadata labels in hero
- [ ] Search placeholder

**Large Text (≥3:1)**:
- [ ] Page titles
- [ ] Tool names
- [ ] Section headings

### Browser Compatibility

Test in:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Implementation Order

### Stage 1: Foundation (Sequential)
1. **Phase 1**: Update CSS variables (`src/styles.css`)
2. **Visual check**: Verify no catastrophic layout breaks
3. **Phase 2**: Fix homepage grid visibility

### Stage 2: Component Updates (Parallel - Can use subagents)
4. **Phase 3**: Fix route files (3 files)
5. **Phase 4**: Fix component files (8 files)
   - Can be split across multiple subagents
   - Each file is independent

### Stage 3: Quality Assurance (Sequential)
6. **Phase 5**: Run formatters, build, manual testing
7. **Phase 6**: Update documentation (can start earlier)

**Estimated time**: 2-3 hours total (mostly manual verification)

---

## Success Metrics

### Quantitative
- [ ] All essential text achieves ≥4.5:1 contrast ratio
- [ ] Large text achieves ≥3:1 contrast ratio
- [ ] No TypeScript or build errors
- [ ] No visual regressions in E2E tests

### Qualitative
- [ ] Terminal aesthetic is preserved
- [ ] Visual hierarchy remains clear
- [ ] Decorative elements maintain subtlety
- [ ] Users report improved readability
- [ ] No new complaints about "everything is too bright"

---

## Open Questions

1. **User Testing**: Should we create before/after screenshots for user feedback before finalizing?
2. **Axe-core Integration**: Prioritize adding automated accessibility testing after this PR?
3. **Light Mode**: Does light mode need similar adjustments? (Currently not primary theme)

---

## Related Documentation

- `docs/design/design-rules.md` - Core design philosophy
- `docs/design/animations/` - Page-specific animation flows
- `docs/testing/e2e-architecture.md` - E2E testing structure
- `docs/guides/adding-a-tool.md` - Tool addition workflow

---

## Future Work

After this plan is implemented, consider:

1. **Automated Accessibility Testing**: Add axe-core to E2E suite
2. **Color Contrast CI Check**: Add pre-commit hook or CI job to validate contrast ratios
3. **User Preference**: Add optional "High Contrast Mode" toggle for users needing even higher ratios
4. **Design System Documentation**: Create a living style guide with contrast examples
