# Release Page Transition Flow (`/tools/$slug/releases/$version`)

This document outlines the design philosophy and animation choreography for the individual Release Details page.

## 1. Core Concept: "The Deep Dive"

If the Tool Page is the "System Dashboard," the Release Page is a **Deep Dive** into a specific system event. It maintains the context of the parent tool while focusing entirely on the changelog data.

-   **Metaphor**: Opening a specific log file or inspecting a system deployment.
-   **Goal**: To provide a focused, cinematic reading experience without losing context.
-   **Key Elements**:
    -   **Context Persistence**: The background and hero section remain stable.
    -   **System Stats**: The dashboard updates to reflect the specific release status.
    -   **Stream**: The changelog is presented as a continuous, staggered data stream.

## 2. Animation Choreography

### A. Context Persistence (The "No-Flicker" Transition)
The most critical aspect of this flow is what *doesn't* animate.
-   **Stable Elements**: The Global Background (Parallax + Grid) and the `ToolHero` (Title, Logo) are lifted to the parent layout (`/tools/$slug`).
-   **Effect**: When navigating from Tool Index -> Release, these elements do not re-render or flash. They provide a solid anchor.

### B. System Stats Context Switch
The `ToolHero` dynamically updates its "System Status" based on the route:
1.  **Status Indicator**:
    -   **From**: `STATUS: ACTIVE` (Green Pulse)
    -   **To**: `STATUS: DEPLOYED` (Cyan Glow)
    -   **Transition**: Smooth cross-fade (`AnimatePresence`).
2.  **Action Button**:
    -   **From**: `[ OPEN_HOMEPAGE ]`
    -   **To**: `[ OPEN_CHANGELOG ]` (Links to external source).
3.  **Stats**:
    -   **From**: `TOTAL_RELEASES: [N]`
    -   **To**: `CHANGES: [N]`

### C. Content Entrance (Cinematic Stagger)
The release content enters with a heavy, sequential animation to simulate data loading:
1.  **Container**: `staggerChildren: 0.15` ensures a rhythmic reveal.
2.  **ReleaseSummary**:
    -   **Position**: First in the stagger sequence.
    -   **Motion**: Slide Up + Fade In.
3.  **Sections (New Features, Improvements, etc.)**:
    -   **Motion**: Slide Up (`y: 30` -> `0`) + Fade In (`opacity: 0` -> `1`).
    -   **Blur**: A subtle blur effect (`blur(10px)` -> `0`) adds a "focusing" feel.
    -   **Easing**: `[0.2, 0.8, 0.2, 1]` (Custom cubic bezier) for a premium, "heavy" feel.

### D. Terminal Boot Sequence (Loading State)
When data is fetching (e.g., initial load), a "Terminal Boot" sequence replaces the generic skeleton:
-   **Visuals**: A dark, translucent window with scrolling system logs (`> INITIALIZING...`, `> DECRYPTING...`).
-   **Progress**: A spring-animated progress bar and hex dump background.
-   **Vibe**: Reinforces the "dev-vibe" and "system access" metaphor.

### E. Optimistic Version Switching
To ensure navigation feels instant:
-   **Interaction**: Clicking a version in the history list immediately triggers a "Loading" state.
-   **Visual Feedback**:
    -   **Pending**: The version card turns **Yellow** (Border + Background) with a pulsing yellow dot.
    -   **Active**: Once loaded, it snaps to **Green** (Active state).
-   **Zero Delay**: The artificial delay is removed to prioritize perceived performance.

### F. Version History Navigation
The version history list adapts its layout and interaction model based on the device:

1.  **Mobile (< 768px)**:
    -   **Layout**: **Horizontal Scrollable List** (`snap-x`).
    -   **Goal**: Conserve vertical space and provide a touch-friendly swipe experience.
    -   **Interaction**: Users swipe to view more versions; a "Load More" button appends data.

2.  **Desktop (>= 768px)**:
    -   **Layout**: **Paginated Grid** (15 items/page).
    -   **Animation**:
        -   **Directional Slide**: Grid slides Left/Right based on Next/Prev action.
        -   **Blur Transition**: Content blurs out (`blur(10px)`) and fades in.
        -   **Staggered Entrance**: Items cascade in (`staggerChildren: 0.05`).
        -   **Active Indicator**: The active page background slides smoothly between numbers (`layoutId`).

### G. Section Navigation (v0.5.x)

The release page includes a section navigation system for jumping between change types (Features, Bugfixes, Breaking Changes, etc.).

**Hook**: `useSectionObserver` — See [hooks.md](../../reference/hooks.md) for API details.

#### Mobile: Floating Terminal Bar
-   **Position**: Fixed at `top-[4.5rem]`, full-width with horizontal scroll.
-   **Visibility**: Appears after scrolling past 300px (`SCROLL_THRESHOLD_MOBILE`).
-   **Aesthetic**: Terminal-inspired with `$_` prefix indicator, glassmorphism background.
-   **Entry Animation**:
    ```tsx
    initial={{ y: -40, opacity: 0, filter: 'blur(8px)', scale: 0.95 }}
    animate={{ y: 0, opacity: 1, filter: 'blur(0px)', scale: 1 }}
    transition={{ type: 'spring', stiffness: 260, damping: 25 }}
    ```
-   **Active State**: Pill background with `layoutId="section-nav-active-mobile"` for smooth transitions.
-   **Visible State**: Subtle pulse animation for in-view but not active sections.
-   **Breaking Changes**: Amber color scheme (`text-amber-200`, `ring-amber-500/30`) with glow effects.

#### Desktop: Sidebar TOC with Viewport Bracket
-   **Position**: Fixed left sidebar (`left-4` on md, `left-8` on xl), vertically centered.
-   **Visibility**: Appears after scrolling past 100px (`SCROLL_THRESHOLD_DESKTOP`).
-   **Viewport Bracket**: Animated vertical bar showing which sections are currently in view (minimap-style).
    ```tsx
    // Bracket position calculated from visible section indices
    const bracketStyle = useMemo(() => {
      const visibleIndices = sections
        .filter(({ type }) => visibleSections.has(type))
        .map((_, index) => index)
      const top = Math.min(...visibleIndices) * ITEM_HEIGHT + 8
      const height = (Math.max(...visibleIndices) - Math.min(...visibleIndices) + 1) * ITEM_HEIGHT
      return { top, height }
    }, [sections, visibleSections])
    ```
-   **Hover Behavior**: Compact mode (icons + counts only) → expands to show labels on hover.
-   **XL+ Screens**: Labels always visible via `xl:!w-auto xl:!opacity-100`.
-   **Scroll-based Opacity** (non-intrusive reading):
    -   **Idle State**: Dims to 30% opacity when user is reading (not scrolling).
    -   **Active State**: Brightens to 100% immediately on scroll or hover.
    -   **Timing**: Fast fade-in (100ms), slow fade-out (400ms) for smooth UX.
    ```tsx
    opacity: isVisibleDesktop ? (isHovered || isScrolling ? 1 : 0.3) : 0
    transition: { opacity: { duration: isScrolling || isHovered ? 0.1 : 0.4 } }
    ```

### H. Version Picker Sheet (v0.5.0)

Mobile-first bottom sheet for version selection, replacing inline version lists on small screens.

**Component**: `VersionPickerSheet` wrapping `BottomSheet`.

-   **Trigger**: Tap on version badge in hero section.
-   **Entry Animation**: Spring from `y: 100%` with drag-to-dismiss.
-   **Fuzzy Search**: Filter versions by typing in search input.
-   **Month Grouping**: Versions grouped by release month (e.g., `// JANUARY 2026`).
-   **Auto-scroll**: Scrolls to current version on open via `scrollIntoView({ block: 'center' })`.
-   **Current Indicator**: Green glowing dot next to active version.
-   **Dismiss**: Drag down 100px or velocity > 500px/s, or tap backdrop, or press Escape.

### I. Collapsible Sections (v0.5.0)

Change sections support mobile-optimized collapsing to reduce initial content load.

**Component**: `CollapsibleSection`.

-   **Auto-collapse**: Sections with >5 items (`COLLAPSE_THRESHOLD`) collapse on mobile.
-   **Progressive Rendering**: Items load in batches to prevent jank:
    ```tsx
    // Start with 10 items, then add 20 more per frame
    useEffect(() => {
      if (renderCount < total) {
        requestAnimationFrame(() => {
          setRenderCount(prev => Math.min(prev + 20, total))
        })
      }
    }, [renderCount, total])
    ```
-   **Expand Animation**: Height + opacity animation with `AnimatePresence`:
    ```tsx
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: 'auto', opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
    ```
-   **Toggle Button**: Shows "Showing 5 of N • Tap to expand" on mobile.

### J. Release Summary Interaction (v0.6.0)

The release summary uses a bifurcated interaction model to optimize for screen real estate while maintaining the "dev-vibe".

#### Desktop: Inline Terminal
-   **Visual**: A `TerminalWindow` component that renders the summary as if it were a text file (`summary.txt`) being `cat`ed to the console.
-   **Behavior**: Always visible, inline with the content flow.
-   **Aesthetics**:
    -   Command prompt: `$ cat summary.txt`
    -   Blinking cursor at the end of the stream.
    -   Monospace font with syntax highlighting cues.

#### Mobile: File Preview + Sheet
-   **Problem**: Terminal windows consume too much vertical space on mobile, pushing actual changes below the fold.
-   **Solution**: A compact "File Card" that expands into a Bottom Sheet.
-   **Interaction**:
    1.  **Idle State**: A compact button resembling a file system entry.
        -   **Icon**: Terminal/File icon.
        -   **Metadata**: `summary.txt`, `1.2 KB` (simulated).
        -   **Preview**: Truncated first line of the summary.
    2.  **Active State**: Tapping the card opens `SummarySheet`.
        -   **Transition**: Standard bottom sheet spring animation.
        -   **Content**: Full terminal view rendered inside the sheet.
        -   **Header**: Sticky header with file metadata.

### K. Share System (v0.8.1)

Release pages include a share system for distributing changelogs across platforms.

**Components**: `SharePalette` (desktop), `ShareSheet` (mobile), `ShareProvider` (context bridge).

#### Desktop: Command Palette (v0.8.1)
- **Trigger**: `[ SHARE ]` button in the release hero section opens centered modal.
- **Aesthetic**: Terminal-inspired with `$ share v0.50.7` header, `>_` prompts, section comments (`// clipboard`, `// social`).
- **Options**:
  - `copy_link` — Copies canonical URL (⌘C).
  - `copy_as_markdown` — Full changelog export (⌘M).
  - `share_to_x` — Opens Twitter/X intent (1).
  - `share_to_bluesky` — Opens Bluesky intent (2).
  - `share_to_reddit` — Opens Reddit submit page (3).
  - `share_to_hn` — Opens Hacker News submit page (4).
- **Keyboard Navigation**: ↑↓ to navigate, Enter to select, 1-4 for quick share, Esc to close.
- **Animation Choreography**:
  ```tsx
  // Container entrance
  initial: { opacity: 0, scale: 0.96, y: -8, filter: 'blur(8px)' }
  animate: { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }
  transition: { type: 'spring', stiffness: 400, damping: 30, staggerChildren: 0.03 }
  
  // Item entrance
  initial: { opacity: 0, x: -8 }
  animate: { opacity: 1, x: 0 }
  ```
- **Visual States**:
  - **Idle**: Monochrome icons, muted text.
  - **Selected**: Green `>_` prompt, icon glow (`drop-shadow`), white text.
  - **Copied**: Green checkmark icon, `bg-green-500/10` background.

#### Mobile: Bottom Sheet
- **Trigger**: Share button in MobileDock (appears on release pages).
- **Entry Animation**: Spring from bottom with drag-to-dismiss.
- **Options**: Same as desktop, with larger touch targets (48px) and colored platform icons for recognition.
- **Visual Feedback**: Background color transitions to `bg-green-500/10` on copy success.

#### Cross-Tree Communication
The MobileDock (in root layout) and ShareProvider (in route) use DOM attributes as a bridge:
- `ShareProvider` sets `data-share-available="true"` on `document.body`
- `MobileDock` observes via `MutationObserver`
- Share action triggered via `CustomEvent('share-release')`

See [hooks.md](../../reference/hooks.md#useshare) for API details.

## 3. Visual Aesthetics ("Dev-Vibe")

### Breadcrumbs as Navigation
-   **Structure**: `~ / tools / [slug] / [version]`
-   **Behavior**: The breadcrumb acts as the primary "Back" button. Clicking the slug returns to the Tool Index.
-   **Style**: Monospace, with the active version highlighted in white.

### The "Stream" Layout
-   **No Accordions**: Unlike typical changelogs, we avoid hiding content behind clicks.
-   **Flat List**: All changes are visible, grouped by type (Features, Fixes, etc.).
-   **Terminal Badges**:
    -   **Breaking**: Red border/text.
    -   **Security**: Blue border/text.
    -   **Style**: `uppercase tracking-wider text-[10px]`.

## 4. Technical Implementation

-   **Route Layout**: `src/routes/tools/$slug.tsx` handles the persistent layout.
-   **Data Fetching**: `useMatches` allows the `ToolHero` (in the layout) to "peek" at the child route's data (the release) to update stats without prop drilling.
-   **Animation**: `framer-motion` handles the complex staggering and layout transitions.
