# Reduce Framer Motion Usage in Release Detail Page

## Status: COMPLETED

**Created**: January 2026
**Scope**: Conservative / Minimal Risk
**Target**: `src/routes/tools/$slug/releases/$version.tsx` and related components

## Summary

Reduce Framer Motion (motion/react) overhead in the release detail page and its child components by converting **simple opacity/transform animations** to CSS/Tailwind while preserving all complex choreography. This conservative approach prioritizes visual consistency over maximum performance gains.

## Problem Statement

The release detail page uses Framer Motion extensively for animations, which can cause:
- Increased JavaScript bundle size
- Higher CPU usage during animations (especially on mobile)
- Potential jank when multiple animations run simultaneously

However, many of these animations are simple transforms/opacity changes that CSS can handle natively with better performance.

## Files in Scope

| File | FM Usage Level | Key Patterns |
|------|----------------|--------------|
| `src/routes/tools/$slug/releases/$version.tsx` | Heavy | Stagger containers, blur transitions, `AnimatePresence mode="wait"`, FAB entry |
| `src/components/changelog/release/collapsible-section.tsx` | Medium | Height→auto animation, chevron rotation, button fade |
| `src/components/changelog/release/section-nav.tsx` | Heavy | `layoutId` pills, spring entry, viewport bracket, hover width animation |
| `src/components/changelog/release/version-list.tsx` | Heavy | Directional pagination, stagger children, `layoutId` page indicator |

## Analysis: Animation Categories

### Category A: KEEP (Irreplaceable in CSS)

These patterns have no CSS equivalent or would require significant JavaScript to replicate:

| Pattern | Files | Reason to Keep |
|---------|-------|----------------|
| `layoutId` shared element transitions | section-nav.tsx, version-list.tsx | FLIP animations impossible in pure CSS |
| Directional `AnimatePresence` with `custom={direction}` | version-list.tsx | Page slide direction based on nav |
| Spring physics on navigation entry | section-nav.tsx | Part of "premium" design language |
| `height: auto` animation | collapsible-section.tsx | CSS can't animate to `auto` reliably |
| Viewport bracket position animation | section-nav.tsx | Dynamic calculated positions |
| `AnimatePresence mode="wait"` | $version.tsx | Required for proper content swap |
| Stagger variants on sections | $version.tsx | Design requirement per docs |
| Blur transitions | $version.tsx | Conservative scope - high-visibility |

### Category B: CONVERT (Simple CSS Equivalents)

These patterns can be replaced with CSS without visual change:

| Pattern | Files | CSS Replacement |
|---------|-------|-----------------|
| `whileTap={{ scale: 0.95 }}` | section-nav.tsx (×2) | `active:scale-95 transition-transform` |
| Chevron rotation (`rotate: 180`) | collapsible-section.tsx | `transition-transform` + conditional `rotate-180` |
| Simple opacity fade (button) | collapsible-section.tsx | Evaluate - may need to keep for exit animation |
| FAB tap feedback | $version.tsx | `active:scale-90 transition-transform` |

### Category C: SKIP (Low Impact, High Risk)

| Pattern | Files | Reason to Skip |
|---------|-------|----------------|
| FAB entry spring animation | $version.tsx | Spring physics noticeable, renders once |
| Button AnimatePresence fade | collapsible-section.tsx | Exit animation requires FM for proper unmount timing |

## Implementation Plan

### Phase 1: Add CSS Utilities

**File**: `src/styles.css`

Add reusable animation utilities that match Framer Motion defaults:

```css
/* Tap feedback for interactive elements */
.tap-scale-95 {
	transition: transform 100ms ease-out;
}
.tap-scale-95:active {
	transform: scale(0.95);
}

/* Tap feedback (smaller scale) */
.tap-scale-90 {
	transition: transform 100ms ease-out;
}
.tap-scale-90:active {
	transform: scale(0.9);
}
```

**Note**: These may not be needed if Tailwind `active:scale-95` works correctly. Test first.

### Phase 2: Convert Section Nav Button Taps

**File**: `src/components/changelog/release/section-nav.tsx`

**Current** (line ~149 and ~261):
```tsx
<motion.button
  whileTap={{ scale: 0.95 }}
  className="relative shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors"
>
```

**After**:
```tsx
<motion.button
  className="relative shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors active:scale-95 transition-transform duration-100"
>
```

**Changes**:
- Remove `whileTap={{ scale: 0.95 }}` prop
- Add `active:scale-95 transition-transform duration-100` to className
- Keep `motion.button` wrapper (still needed for `layoutId` children)

**Locations**:
1. Mobile nav button (line ~149)
2. Desktop nav button (line ~261)

### Phase 3: Convert Chevron Rotation

**File**: `src/components/changelog/release/collapsible-section.tsx`

**Current** (lines 139-144):
```tsx
<motion.span
  animate={{ rotate: isExpanded ? 180 : 0 }}
  transition={{ duration: 0.3, ease: 'easeInOut' }}
>
  <ChevronDown className="size-4" />
</motion.span>
```

**After**:
```tsx
<span
  className={cn(
    "inline-block transition-transform duration-300 ease-in-out",
    isExpanded && "rotate-180"
  )}
>
  <ChevronDown className="size-4" />
</span>
```

**Changes**:
- Replace `motion.span` with regular `span`
- Remove `animate` and `transition` props
- Add Tailwind transition classes
- Add conditional `rotate-180` class

**Import cleanup**:
- After this change, check if `motion` import can be simplified
- `AnimatePresence` still needed for collapsed content animation

### Phase 4: Evaluate FAB Tap (Optional)

**File**: `src/routes/tools/$slug/releases/$version.tsx`

**Current** (lines 394-410):
```tsx
<motion.button
  whileTap={{ scale: 0.9 }}
  // ... other props
>
```

**Evaluation**:
- The FAB also has spring entry animation which we're keeping
- Adding CSS `active:scale-90` alongside FM is redundant
- **Recommendation**: Skip this change - the FM wrapper is needed anyway for spring entry

### Phase 5: Cleanup (Post-Conversion)

After Phase 2-3, verify:

1. **Import audit**: Check if any FM imports can be reduced
   - `collapsible-section.tsx`: May still need `AnimatePresence` and `motion` for height animation
   - `section-nav.tsx`: Still needs full FM for `layoutId` and spring transitions

2. **Bundle size check**: Compare before/after (expect minimal change with conservative scope)

## What We're NOT Changing

To be explicit about scope boundaries:

| Component | Pattern | Why NOT Converting |
|-----------|---------|-------------------|
| `$version.tsx` | Stagger variants (`staggerChildren: 0.1`) | Design requirement for "cinematic reveal" |
| `$version.tsx` | Blur transitions (`filter: blur(10px)`) | Conservative scope - high-visibility effect |
| `$version.tsx` | `AnimatePresence mode="wait"` | Required for proper exit→enter sequencing |
| `$version.tsx` | FAB spring entry | Premium feel, renders once per page |
| `section-nav.tsx` | `layoutId` pills | FLIP animation impossible in CSS |
| `section-nav.tsx` | Spring transitions on nav entry | Part of design language |
| `section-nav.tsx` | Viewport bracket animation | Dynamic calculated positions |
| `section-nav.tsx` | Width animation on hover (`width: auto`) | CSS can't animate to `auto` |
| `version-list.tsx` | Directional page transitions | `custom={direction}` pattern |
| `version-list.tsx` | `layoutId` page indicator | FLIP animation |
| `version-list.tsx` | Stagger on version cards | Design requirement |
| `collapsible-section.tsx` | `height: auto` animation | CSS limitation |
| `collapsible-section.tsx` | Button AnimatePresence | Exit animation needs FM |

## Expected Impact

### Performance

| Metric | Expected Change |
|--------|-----------------|
| Bundle size | Negligible (FM still imported for other patterns) |
| Animation CPU | Slight reduction (2 fewer FM animations per page) |
| Paint operations | Slight reduction (CSS transforms are compositor-only) |

**Honest Assessment**: With conservative scope, performance improvement will be **minimal**. The heavy patterns (blur, stagger, layoutId, AnimatePresence) remain and are the primary sources of any perceived slowness.

### Risk Level

| Change | Risk |
|--------|------|
| Remove `whileTap` from buttons | Very Low - CSS `active:` is well-supported |
| Convert chevron rotation | Very Low - Simple transform, same duration |
| Overall visual regression | Very Low - All conversions have CSS equivalents |

## Verification Checklist

### Code Quality
- [ ] Run `pnpm biome check --write` on all modified files
- [ ] Run `pnpm build` (ensure production build succeeds)
- [ ] Check TypeScript errors via IDE diagnostics

### Visual Regression Testing

| Test | Expected Result |
|------|-----------------|
| Tap section nav button (mobile) | Scale feedback visible |
| Tap section nav button (desktop) | Scale feedback visible |
| Expand/collapse section (mobile) | Chevron rotates smoothly |
| Timing comparison | Animations feel identical to before |

### Device Testing
- [ ] Desktop Chrome
- [ ] Desktop Safari
- [ ] iOS Safari (touch `active:` states)
- [ ] Android Chrome

### Performance Verification
- [ ] Chrome DevTools Performance panel - compare animation frame times
- [ ] No jank introduced by CSS transitions
- [ ] Touch feedback still immediate

## Future Optimization Opportunities

If more aggressive optimization is desired later, consider:

| Pattern | Potential Savings | Risk |
|---------|------------------|------|
| Remove blur transitions | Medium CPU savings | Medium - changes visual feel |
| Convert stagger to CSS `animation-delay` | Low | Medium - less flexible for dynamic lists |
| Use CSS View Transitions API | Potential replacement for many patterns | High - limited browser support (2024) |
| Lazy-load FM for specific components | Bundle size reduction | Medium - complexity increase |

## Related Documentation

- `docs/design/animations/release-detail.md` - Animation choreography requirements
- `docs/design/design-rules.md` - Design system constraints
- `docs/project/performance-notes.md` - General performance guidelines

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Jan 2026 | Conservative scope selected | Minimize visual regression risk |
| Jan 2026 | Keep FAB spring animation | Premium feel, renders once |
| Jan 2026 | Keep all `layoutId` usage | No CSS equivalent |
| Jan 2026 | Keep blur transitions | Conservative scope boundary |
