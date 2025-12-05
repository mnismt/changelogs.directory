# Tools Slug Page Transition Flow (`/tools/$slug`)

This document outlines the design philosophy and animation choreography for the individual Tool Detail page.

## 1. Core Concept: "The System Dashboard"

While the Tools Directory (`/tools`) acts as a file explorer, the Tool Slug page acts as a **System Status Dashboard** for a specific tool. It provides a deep dive into the tool's lifecycle (changelog) with a cinematic, high-tech presentation.

-   **Metaphor**: A sci-fi system monitor or HUD.
-   **Goal**: To make reading a changelog feel like analyzing system telemetry.
-   **Key Elements**:
    -   **Persistent Layout**: The Hero and Background remain stable when navigating to child routes (Releases).
    -   **Hero**: Cinematic entrance with "typing" stats.
    -   **Status**: A live "BOOTING" -> "ACTIVE" system check.
    -   **Timeline**: A continuous stream of updates.

## 2. Animation Choreography

The page uses a layered animation strategy to build immersion.

### A. The "Breathing" Background
The global background image isn't static; it feels alive.
-   **Parallax**: Moves slightly with scroll (`useScroll` + `useTransform`) to create depth.
-   **Breathing**: Continuously pulses in scale (`1` -> `1.05` -> `1`) and opacity (`0.03` -> `0.05`) over `10s`.
-   **Effect**: Subliminal motion that prevents the page from feeling dead.

### B. Hero Entrance (Staggered)
Elements load sequentially to simulate a system initialization:
1.  **Breadcrumbs**: Fade in + Slide Up.
2.  **Logo**: Pops in with a spring animation.
3.  **Title**: Slides in from the left.
4.  **Stats Bar**:
    -   **Width**: Expands from `0%` to `100%` (`ease: "circOut"`), mimicking a loading bar.
    -   **Content**: Fades in after the bar is fully expanded.

### C. System Status Check
A dedicated status indicator in the header simulates a boot sequence:
1.  **Phase 1 (Booting)**:
    -   **Text**: "SYSTEM_CHECK..."
    -   **Indicator**: Yellow pulsing dot.
    -   **Duration**: `3000ms`.
2.  **Phase 2 (Active)**:
    -   **Transition**: Smooth cross-fade (`AnimatePresence`).
    -   **Text**: "STATUS: ACTIVE"
    -   **Indicator**: Green dot with a glowing shadow (`box-shadow`).

### D. Release Card Design (Grid View)
The release cards are designed to look like "terminal windows" or data modules.
-   **Aesthetic**: Glassmorphism (`bg-black/40`, `backdrop-blur-md`) with a subtle border (`border-white/10`).
-   **Typography**: `Fira Code` for version numbers and dates, emphasizing the technical nature.
-   **Badges**: "Breaking" and "Security" badges use a terminal-like appearance (red background with border).
-   **Interaction**:
    -   **Hover**: Card lifts slightly (`y: -4`), border brightens, and a subtle glow effect is applied.
    -   **No Redundant Actions**: The "Read full changelog" button has been removed to reduce visual clutter. The entire card is clickable, adhering to a "data-first" philosophy where the content itself is the interface.

## 3. Micro-Interactions (The "Physical" Feel)

Interactive elements use "heavy" physics to feel tactile and premium.

### Filter Bar & View Toggle
-   **Sticky Behavior**: The filter bar sticks to the top of the viewport on scroll, ensuring controls are always accessible.
-   **Accordion Functionality**:
    -   **Mobile (< 768px)**: Filter sections (Type, Date, Version) are **collapsed by default** to save screen space. Users can expand them to view options.
    -   **Desktop (>= 768px)**: Filter sections are **expanded by default** for immediate access.
    -   **Animation**: Smooth height transition (`AnimatePresence`) when expanding/collapsing.
-   **Sliding Background**:
    -   **Technique**: `framer-motion`'s `layoutId`.
    -   **Behavior**: A white background "slides" physically from the active item to the new selection.
    -   **Physics**: High mass (`1.2`), low stiffness (`200`), moderate damping (`25`). This creates a "heavy" feel, accelerating slowly and braking smoothly.
-   **Text Contrast**: Text color inverts (Black on White) instantly when active to maintain readability.

### Timeline Items
-   **Responsive Layout**:
    -   **Mobile (< 768px)**: **One-sided layout**. All content sits to the right of the timeline to maximize horizontal space for text.
    -   **Desktop (>= 768px)**: **Zigzag layout**. Items alternate left and right for a balanced, dynamic reading flow.
-   **Entrance**: As the user scrolls, items slide in from the side (`x: -32` -> `0`) while fading in.
-   **Magnetic Feel**: Items slide in towards the center line, creating a "magnetic" attachment effect.

### Header Tool Badge
When viewing a tool page, the global header dynamically displays the tool's identity:
-   **Badge Composition**: Small logo icon + tool name, separated from main site branding by a `/` divider.
-   **Logo Animation**: On hover, the logo scales (`scale: 1.1`) and rotates slightly (`rotate: 3deg`) with smooth transitions.
-   **Entrance**: Fade-in and slide-in-from-left animation when the badge appears.
-   **Purpose**: Provides persistent context about which tool changelog the user is viewing without cluttering the main navigation.

### Filter Navigation Behavior
Filter interactions are optimized to preserve user context:
-   **Scroll Preservation**: Changing filters or view modes uses `replace: true` and `resetScroll: false` to maintain scroll position.
-   **History Management**: Filter changes replace the current history entry instead of creating new ones, preventing browser back/forward clutter.
-   **Seamless Experience**: Users can explore different filter combinations without losing their place in the content.

## 4. Technical Implementation

-   **State Management**: `useState` for the boot sequence (`'BOOTING'` | `'READY'`).
-   **Layout Animation**: `layoutId` shares the active background state across separate DOM elements (buttons).
-   **Scroll Effects**: `useScroll` drives the parallax background.
-   **Orchestration**: `staggerChildren` in `motion.div` variants handles the hero sequence.
