# Subscribe Page Transition Flow (`/subscribe`)

This document outlines the "Subscription Command Center" — the animation choreography for the dedicated subscribe page.

## 1. Core Concept: "The Subscription Terminal"

The subscribe page serves as the **primary onboarding experience** for new subscribers. It presents subscription features and social proof in a terminal-inspired layout.

-   **Metaphor**: A terminal running `subscribe.sh` — executing a subscription workflow.
-   **Goal**: Convert visitors into subscribers by showcasing value and building trust.
-   **Key Elements**:
    -   **Hero**: Headline with blinking cursor, status badge.
    -   **Features Grid**: Four feature cards showing current and upcoming capabilities.
    -   **Social Proof**: Subscriber count, growth chart, recent signups.
    -   **Subscribe Form**: Email input with terminal animation on submit.

## 2. Animation Choreography

The page uses a staggered "boot-up" sequence to reveal content progressively.

### A. Status Badge & Hero (0ms - 200ms)

1.  **Status Badge**:
    -   **Visual**: "Open for signups" badge with pulsing green dot.
    -   **Animation**: Fade in with gradient lines extending left/right.
    -   **Duration**: `500ms`, `delay: 0ms`.

2.  **Hero Headline**:
    -   **Visual**: "> Subscribe to the feed" with blinking cursor.
    -   **Animation**: Slide up (`y: 20 -> 0`) with fade in.
    -   **Cursor**: Green block cursor blinking at 0.8s intervals.
    -   **Duration**: `500ms`.

3.  **Subheadline**:
    -   **Visual**: Description with `//` prefix.
    -   **Animation**: Fade in following hero.

### B. Section Headers (300ms+)

Each section has a header with:
-   **Visual**: Green dot indicator + uppercase label.
-   **Animation**: Slide up with fade in.
-   **Stagger**: 300ms, 700ms, 900ms for each section.

### C. Features Grid (400ms - 800ms, staggered)

Four feature cards enter sequentially:

| Card | Delay | Status |
|------|-------|--------|
| Weekly Digest | 400ms | `active` (green) |
| Breaking Alerts | 500ms | `coming-soon` (amber) |
| Tool Subscriptions | 600ms | `coming-soon` (amber) |
| Release Filters | 700ms | `coming-soon` (amber) |

**Card Animation**:
-   **Entrance**: Slide up (`y: 20 -> 0`) with fade in.
-   **Duration**: `500ms` each.
-   **Hover**: Border brightens, gradient glow appears.

### D. Social Proof Section (800ms - 1200ms)

1.  **Terminal Frame**:
    -   **Visual**: Window chrome with `community_stats.sh` title.
    -   **Animation**: Fade in with slide up.
    -   **Delay**: `800ms`.

2.  **Subscriber Count**:
    -   **Visual**: Large number with "developers subscribed" label.
    -   **Animation**: Scale from 0.5 to 1 with fade in.
    -   **Delay**: `1000ms`.

3.  **Growth Chart**:
    -   **Visual**: Area chart showing last 30 days.
    -   **Animation**: Draw animation from left to right.
    -   **Duration**: `1500ms`.

4.  **Recent Signups**:
    -   **Visual**: Staggered list with encrypted email reveal.
    -   **Animation**: Slide in from left (`x: -10 -> 0`).
    -   **Stagger**: `100ms` between each item.
    -   **Delay**: Starting at `1200ms`.

### E. Subscribe Form (1000ms)

1.  **Terminal Frame**:
    -   **Visual**: Window chrome with `subscribe.sh` title.
    -   **Animation**: Fade in with slide up.
    -   **Delay**: `1000ms`.

2.  **Prompt Text**:
    -   **Visual**: `~ % Enter your email to join the feed`.
    -   **Animation**: Immediate visibility after frame.

3.  **Form Transition** (on submit):
    -   **Phase 1**: Form fades out (`height: 0`, `opacity: 0`).
    -   **Phase 2**: Terminal output expands (`height: auto`, `opacity: 1`).
    -   **Duration**: `400ms` with `circOut` easing.

### F. Feature Preview (User Interaction)

When a user clicks "Preview" on an active feature card:

1.  **Layout Shift**:
    *   The `FeaturePreview` container renders below the main grid, spanning full width.
    *   **Animation**: Height expands from 0 to auto (`duration: 0.4s`, `ease: easeOut`).
2.  **Scroll Behavior**:
    *   The page automatically smooth-scrolls to position the preview at the top of the viewport.
    *   **Delay**: 100ms after render to allow layout calculation.

### G. Footer (1200ms)

-   **Visual**: "No spam, ever" disclaimer.
-   **Animation**: Fade in.
-   **Delay**: `1200ms`.

## 3. Subscribe Flow (Terminal Animation)

When the user submits the form, the existing `SubscribeTerminal` component takes over:

### Boot Sequence
1.  **Command Display**: `changelogs --subscribe --force`
2.  **Typing Animation**: `subscribe --email=<user-email>` typed character by character at 40ms intervals.

### Execution Steps
| Step | Label | Duration |
|------|-------|----------|
| 1 | Initializing secure connection... | 400ms |
| 2 | Validating email syntax... | 500ms |
| 3 | Registering to notification queue... | ~API call time |
| 4 | Subscription active. | 300ms |

### Final States
-   **Success**: Green confirmation box with "SUBSCRIPTION CONFIRMED" and "Welcome to the directory."
-   **Error**: Red error box with specific error message.

## 4. Component Structure

```
SubscribePage
├── SubscribeHeader
│   ├── Status Badge (pulsing green)
│   ├── Headline (with blinking cursor)
│   └── Subheadline (with // prefix)
├── Content Grid (lg:5 columns)
│   ├── Left Column (lg:3)
│   │   ├── SectionHeader ("What you get")
│   │   ├── FeaturesGrid
│   │   │   ├── FeatureCard (Weekly Digest - active)
│   │   │   ├── FeatureCard (Breaking Alerts - coming-soon)
│   │   │   ├── FeatureCard (Tool Subscriptions - coming-soon)
│   │   │   └── FeatureCard (Release Filters - coming-soon)
│   │   ├── SectionHeader ("Join the feed")
│   │   └── SubscribeForm
│   │       └── SubscribeTerminal (on submit)
│   └── Right Column (lg:2)
│       ├── SectionHeader ("System status")
│       └── SystemMonitor (flex-1, equals height of left col)
│           ├── Status Header
│           ├── Stats Grid (Subscribers, Growth)
│           ├── Recent Signups List
│           └── System Healthy Footer (fixed at bottom)
├── FeaturePreview (Full Width, AnimatePresence)
│   └── WeeklyDigestPreview (HTML iframe)
└── Footer
```

## 5. Aesthetic Details

### Terminal Aesthetic
-   **Window Chrome**: macOS-style dots (red, yellow, green) with script title.
-   **Background**: `bg-white/[0.02] backdrop-blur-xl`.
-   **Borders**: `border-white/10` with hover states.

### Color Accents
-   **Active Features**: Green (`green-500`) with pulse animation.
-   **Coming Soon**: Amber (`amber-500`) static indicator.
-   **Interactive Elements**: Green for positive states, red for errors.

### Typography
-   **Headlines**: `font-mono`, large sizes with tracking-tight.
-   **Body**: `font-mono`, smaller sizes with muted colors.
-   **Commands**: `font-mono`, with `$` prefix in muted green.

## 6. Mobile Adaptation

### Responsive Grid
-   **Desktop**: 5-column grid with 3:2 split.
-   **Mobile**: Single column, stacked vertically.

### Mobile Order
1. Hero
2. Features Grid (2x2 on tablet, 1-column on phone)
3. Social Proof
4. Subscribe Form

### Touch Interactions
-   Feature cards maintain hover states on tap.
-   Subscribe form is full-width on mobile.

## 7. Technical Implementation

-   **SSR**: Stats loaded via `Route.useLoaderData()` for immediate render.
-   **Motion**: `framer-motion` handles all entrance animations.
-   **Charts**: `recharts` with `AnimationDuration={1500}` for chart reveals.
-   **Form State**: React `useState` manages form → terminal transition.
