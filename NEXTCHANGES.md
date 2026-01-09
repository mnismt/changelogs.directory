# Next Changes

Features and improvements saved for upcoming releases.

---

## v0.5.2 — Desktop Section Navigation

> Desktop sidebar TOC with viewport bracket indicator

**Features:**
- Fixed left sidebar showing change type sections
- Viewport bracket (minimap-style) indicating visible sections
- Compact mode on medium screens (icon + count only)
- Expands on hover to show full labels
- Full labels always visible on XL+ screens

**Files with TODO comments:**
- `src/components/changelog/release/section-nav.tsx` — Desktop nav commented out
- `src/hooks/use-section-observer.ts` — `visibleSections` tracking ready

**To enable:**
1. Uncomment `SECTION_LABELS`, `SCROLL_THRESHOLD_DESKTOP`, `ITEM_HEIGHT` constants
2. Uncomment `isVisibleDesktop`, `isHovered` state
3. Uncomment `bracketStyle` useMemo
4. Uncomment desktop `<motion.nav>` JSX block (see git history for full implementation)
