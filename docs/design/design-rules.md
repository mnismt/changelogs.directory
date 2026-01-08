# Design Rules & Guidelines

This document outlines the design philosophy, aesthetic principles, and UX guidelines for `changelogs.directory`. All UI/UX decisions must align with these rules to maintain the project's distinct "dev-vibe".

## Core Concept: "The Directory"

The overarching metaphor for the application is a **Terminal Directory Listing**. We are not building a marketing site; we are building a utility.

-   **Structure over Flash**: The layout should feel like a structured file system or a command-line interface (CLI).
-   **Information Density**: Prefer dense, organized grids over large, sparse carousels.
-   **System Status**: Use UI elements that mimic system stats (e.g., "Total Objects", "System Ready", "Memory Usage").
-   **Navigation**: Breadcrumbs should look like file paths (e.g., `~/tools/claude-code`).

## Visual Aesthetics

### 1. Monochrome "Dev-Vibe"
The palette is strictly monochrome, inspired by high-end developer tools (Cursor, Vercel, Linear).

-   **Backgrounds**: Deep blacks (`#0A0A0A`, `#000000`). No colorful backgrounds.
-   **Foregrounds**: White (`#FFFFFF`) for primary text, varying shades of gray for secondary text.
-   **Accents**: Use subtle glows or specific semantic colors (Green for "Ready", Red for "Error") sparingly.
-   **Gradients**: Use alpha-masks and fade-outs, not color gradients.

### 2. Typography
-   **Headings & UI**: `Inter` (Sans-serif) for readability.
-   **Data & Code**: `Fira Code` (Monospace) for **everything** technical:
    -   Tool names
    -   Version numbers (`v1.0.0`)
    -   Dates (`2d ago`)
    -   Stats & Counters
    -   Breadcrumbs

### 3. Layout & Spacing
-   **Grid Systems**: Use CSS Grid for robust, responsive layouts.
-   **Borders**: Thin, subtle borders (`border-white/10`) to define structure.
-   **Glassmorphism**: Use `backdrop-blur` and semi-transparent backgrounds (`bg-black/40`) to create depth without clutter.
-   **Mobile Adaptation**:
    -   **Lists**: Convert long vertical grids into **horizontal scrollable lists** (`overflow-x-auto`) on mobile to conserve vertical space.
    -   **Controls**: Use compact, icon-only toggles on mobile; expand to text labels on desktop.
    -   **Floating Dock**:
        -   **Position**: Fixed at bottom-center (`bottom-6`), floating above content.
        -   **Aesthetic**: High-grade glassmorphism (`backdrop-blur-xl`, `bg-black/60`) with a subtle white border (`border-white/10`).
        -   **Interaction**:
            -   **Active State**: Smooth sliding background (`layoutId`) and a glowing green dot indicator.
            -   **Animations**: Spring-based entry (`y: 100` -> `0`) and scale effects on tap/hover.
        -   **Content**: Essential navigation icons + primary action (Subscribe).
    -   **Toast Notifications**:
        -   **Position**: Fixed at `bottom-24` on mobile (to clear the Floating Dock), `bottom-6 right-6` on desktop.
        -   **Aesthetic**: Glassmorphism matching the dock (`bg-black/80`, `backdrop-blur-xl`, `border-border/40`).
        -   **Mobile Gestures**: Support swipe-to-dismiss (swipe down 50px+ to dismiss).
        -   **Swipe Indicator**: Show a subtle drag handle bar and "Swipe to dismiss" hint on mobile.
        -   **Animation**: Spring-based entry (`y: 100` → `0`), elastic snap-back on drag.

## UX & Animation

### 1. The "Cinematic" Feel
Animations should be slow, smooth, and deliberate. Avoid snappy, jerky movements.

-   **Duration**: `500ms` - `700ms` for major transitions.
-   **Easing**: `ease-out` for natural deceleration.
-   **Scale**: Use subtle scale effects (e.g., `scale-110` -> `scale-100`) to create a "breathing" effect.

### 2. Global Background Effect
The application features an immersive global background system.

-   **Behavior**: When hovering over a tool card, the **entire page background** transitions to that tool's imagery.
-   **Implementation**:
    -   Fixed position layer (`z-[-1]`).
    -   `AnimatePresence` for smooth cross-fading.
    -   **Opacity**: Low (`0.2` - `0.3`) to ensure text readability.
    -   **Grayscale**: Images should be desaturated to fit the monochrome theme.

### 3. Micro-interactions
-   **Hover States**:
    -   **Cards**: Subtle border glow, background lighten, or reveal of hidden elements (arrows).
    -   **Buttons**: Text color shift or background fill.
-   **Staggered Entrance**: When loading lists (like the Tools grid), stagger the entrance of items (`staggerChildren: 0.05`) for a cascading effect.
-   **Pagination Transitions**:
    -   **Directional Slide**: Content should slide left/right based on navigation direction.
    -   **Blur & Fade**: Apply a subtle blur (`blur(10px)`) during exit/enter to mask the transition.
    -   **Active Indicator**: Use `layoutId` to smoothly animate the active state background between pagination buttons.

### 4. System States & Feedback

The application uses distinct visual states to communicate system status.

#### Normal State (Default)
-   **Background**: `bg-black/40` with `backdrop-blur-xl` (glassmorphism)
-   **Accents**: Green (`#22c55e`) for success, active states
-   **Borders**: `border-white/10`
-   **Typography**: `Inter` for UI, `Fira Code` for technical data

#### Fault State (Errors)
-   **Background**: Maintains `bg-black/40` but adds red accents
-   **Accents**: Red (`#ef4444`) for critical errors
-   **Borders**: `border-red-950/30` for error containers
-   **Effects**: Glitch, scanlines, hex dumps

#### Component Usage for System States

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| **GlitchText** | Visual instability to signal error severity | Critical errors, status codes (404, 500), high-impact headers |
| **TerminalWindow** | Frames content as terminal output | Error logs, CLI simulation, technical data presentation |
| **ScanlineOverlay** | CRT monitor aesthetic for retro-tech immersion | Full-page utility screens (404, 500, Analytics) |

**Guidelines**:
-   **Glitch effects**: Reserved for error pages only — avoid overuse to maintain impact
-   **Red accents**: Use sparingly for semantic meaning (errors, warnings, critical actions)
-   **Scanlines**: Apply to "system monitor" interfaces (errors, analytics, data-heavy views)

## Implementation Checklist

When implementing new UI features, ask:

1.  [ ] Does this look like a developer tool or a terminal?
2.  [ ] Is it monochrome?
3.  [ ] Are technical details in monospace?
4.  [ ] Is the animation smooth and cinematic (not instant)?
5.  [ ] Does it respect the global background system?

## Deeper Context: Page-Specific Flows

For detailed documentation on how specific pages implement these design rules, including animation choreography and state machines, see:

-   **[Homepage Flow](animations/homepage.md)**: The "Terminal Boot Sequence" with its multi-stage animation.
-   **[Tools Page Flow](animations/tools-index.md)**: The "Directory Listing" with staggered entrance and global background effects.
-   **[Tool Detail Flow](animations/tools-detail.md)**: Tool-specific page with release feed.
-   **[Release Page Flow](animations/release-detail.md)**: The "Deep Dive" with context persistence and cinematic data stream.
-   **[Analytics Page Flow](animations/analytics.md)**: The "Network Operations Center" with real-time data streams and system status monitoring.
-   **[Error Pages Flow](animations/system-errors.md)**: The "System Fault" sequence with glitch effects and terminal aesthetics for 404/500 pages.

These documents provide concrete examples of how the abstract principles above are applied in practice.
