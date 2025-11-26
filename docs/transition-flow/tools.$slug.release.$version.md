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
2.  **Sections (New Features, Improvements, etc.)**:
    -   **Motion**: Slide Up (`y: 30` -> `0`) + Fade In (`opacity: 0` -> `1`).
    -   **Blur**: A subtle blur effect (`blur(10px)` -> `0`) adds a "focusing" feel.
    -   **Easing**: `[0.2, 0.8, 0.2, 1]` (Custom cubic bezier) for a premium, "heavy" feel.

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
