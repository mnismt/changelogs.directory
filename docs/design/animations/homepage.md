# Homepage Transition Flow (`/`)

This document outlines the "Terminal Boot Sequence" — the complex, multi-stage animation that introduces the application.

## 1. Core Concept: "The Boot Sequence"

The homepage is designed to feel like a developer's terminal initializing. It does not simply "load"; it executes a sequence of commands to reveal the content.

-   **Metaphor**: System Initialization / Shell Startup.
-   **Goal**: To immerse the user immediately in the "dev-vibe" universe.
-   **Key Elements**:
    -   **Hero**: The brand statement.
    -   **Connector**: The visual thread linking the brand to the data.
    -   **Prompt**: The interactive shell command (`$ view releases`).
    -   **Feed**: The output of the command (the release stream).

## 2. Animation Choreography (The State Machine)

The page is driven by a strict React state machine:
`type AnimationStep = 'hero' | 'connector' | 'prompt' | 'expanding' | 'done'`

### Phase 1: Hero Initialization (`hero`)
-   **Action**: The `HeroSection` mounts and plays its internal reveal animation.
-   **Trigger**: `onAnimationComplete` callback from `HeroSection`.
-   **Transition**: Sets state to `connector`.

### Phase 2: The Connector (`connector`)
-   **Visual**: A vertical line (`1px` wide) grows downwards from the Hero section.
-   **Animation**: CSS transition `height: 0 -> 12` (h-12), `opacity: 0 -> 1`.
-   **Duration**: `600ms`.
-   **Transition**: Auto-advances to `prompt` after timeout.

### Phase 3: The Command Prompt (`prompt`)
-   **Visual**: A terminal prompt appears at the end of the connector line.
-   **Effect**:
    -   **Sparkles**: A burst of `SparklesCore` particles appears above the prompt to draw attention.
    -   **Typewriter**: The text `view releases` is typed out character-by-character.
    -   **Cursor**: A blinking green underscore (`_`) mimics a waiting shell.
-   **Duration**: `1000ms` (typing + pause).
-   **Transition**: Auto-advances to `expanding` after timeout.

### Phase 4: Feed Expansion (`expanding`)
-   **Visual**: The main content area (The Feed) "unfolds" from the prompt.
-   **Animation**:
    -   **Grid Expansion**: The feed container uses CSS Grid `grid-template-rows: 0fr -> 1fr` for a smooth height transition.
    -   **Connector Extension**: A second vertical line grows from the prompt into the feed (`h-0 -> h-12`).
-   **Duration**: `1000ms`.
-   **Transition**: Sets state to `done`.

### Phase 5: Tool Lanes Stagger (`done`)
-   **State**: The feed container is expanded; Tool Lanes begin their entrance.
-   **Visual**: Each tool lane (horizontal row of release cards) appears with a staggered delay.
-   **Animation**:
    -   **Lane Entrance**: Each `ToolLane` uses `animate-in fade-in slide-in-from-bottom-2 duration-500`.
    -   **Stagger Delay**: Lanes are staggered with `animationDelay: 200 + index * 100` (first lane at 200ms, second at 300ms, etc.).
    -   **Card Layout**: Release cards within each lane are laid out horizontally with `snap-x snap-mandatory` scroll behavior.
-   **Interaction**: Desktop users see navigation arrows on lane hover (visible only when `releases.length > 4`).

### Phase 6: System Ready
-   **State**: All lanes are visible and interactive.
-   **Interaction**:
    -   **Horizontal Scroll**: Users swipe/scroll horizontally through releases within each lane.
    -   **Navigation Arrows**: Desktop shows left/right arrows on lane hover for keyboard-friendly navigation.
    -   **Velocity Badge**: Lanes with releases published today show a "🔥 X today" indicator.

## 3. Tool Lanes Layout

The homepage feed uses a **Tool Lanes** layout where each tool gets its own horizontal lane.

### Component Hierarchy
```
ToolLanesFeed
├── ToolLane (Claude Code)
│   ├── Lane Header (logo, name, vendor, velocity badge, "View all" link)
│   ├── LaneNavigation (left/right arrows, desktop only)
│   └── Scroll Container
│       ├── LaneReleaseCard (v1.0.20)
│       ├── LaneReleaseCard (v1.0.19)
│       └── ...
├── ToolLane (Codex)
│   └── ...
└── ToolLane (Cursor)
    └── ...
```

### Lane Features
-   **Horizontal Scroll**: CSS `overflow-x-auto` with `snap-x snap-mandatory` for smooth card snapping.
-   **Hidden Scrollbar**: `scrollbar-hide` class + inline styles for cross-browser support.
-   **Desktop Navigation**: Arrow buttons appear on lane hover when more than 4 cards exist.
-   **Velocity Badge**: Shows "🔥 X today" when a tool has releases published today.
-   **Tool Logo**: Monochrome by default, colorizes on lane hover (tool-specific brand colors).

### Card Design
-   **Minimal**: Fixed width (`w-52`), shows version, date, change count, and semantic indicators.
-   **Semantic Indicators**: Badges for breaking changes (red), security updates (amber), deprecations (yellow).
-   **Hover State**: Border highlights and subtle scale transform.

## 4. Aesthetic Details

### The "Dev-Vibe" Elements
-   **Monochrome Palette**: Strictly black, white, and gray. No brand colors except for semantic indicators (green cursor) and tool logo hover states.
-   **Fira Code**: Used for the prompt (`$ view releases`), version numbers, and stats to reinforce the terminal aesthetic.
-   **Sparkles**: Used sparingly to add "magic" to the otherwise rigid terminal interface.
-   **Tool Logos**: Monochrome by default; colorize on lane hover to add visual interest without breaking the aesthetic.

### Technical Implementation
-   **State Management**: `useState<AnimationStep>` controls the boot sequence flow.
-   **Timing**: `setTimeout` is used to sequence the phases (Connector -> Prompt -> Expanding).
-   **CSS Transitions**: Used for high-performance layout changes (opacity, height, grid-rows).
-   **Lane Staggering**: Each lane uses `animationDelay` based on its index for sequential entrance.
-   **Horizontal Scroll State**: `useRef` + `onScroll` callback tracks scroll position for navigation arrow visibility.

## 5. Why It Works
-   **Narrative**: It tells a story: "System Start" -> "Command Input" -> "Data Output" -> "Organized by Tool".
-   **Pacing**: The boot sequence is fast enough to not be annoying (approx. 2.5s total) but slow enough to be appreciated.
-   **Focus**: It guides the user's eye vertically down the page, landing exactly where the content begins.
-   **Scanability**: Tool Lanes allow users to quickly scan recent activity per tool without information overload.
-   **Discoverability**: Horizontal scroll within lanes encourages exploration; velocity badges highlight active tools.
