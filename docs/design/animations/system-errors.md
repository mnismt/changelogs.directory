# System Error Pages (`/404`, `/500`)

This document outlines the "System Fault" sequence — the animation choreography for error states that maintain the terminal aesthetic while communicating critical failures.

## 1. Core Concept: "Critical Failure"

Error pages are designed to feel like a system crash or path lookup failure in a terminal. They use glitch effects, CRT artifacts, and hex dumps to communicate failure while staying on-brand.

-   **Metaphor**: Terminal Error / System Fault / Path Not Found.
-   **Goal**: Communicate the error clearly while maintaining the dev-vibe aesthetic.
-   **Key Elements**:
    -   **GlitchText**: Visual instability to signal system fault.
    -   **TerminalWindow**: Frames error output as a shell command response.
    -   **ScanlineOverlay**: CRT monitor artifact to add retro-tech texture.
    -   **HexDump Stream**: Live scrolling hex data for visual decoration.

## 2. Animation Choreography

### 404 Page: "PATH_NOT_FOUND"

**Entry Sequence**: ~1.6s total, staggered reveals

#### Phase 1: Status Code Glitch (0ms - 500ms)
-   **Element**: Large "404" text with `GlitchText` effect
-   **Animation**: 
    -   Fade in with color separation (cyan/red displacement)
    -   Horizontal jitter effect (`translateX` oscillation)
-   **Duration**: `500ms`
-   **Easing**: `ease-out`

#### Phase 2: Error Message Decrypt (300ms - 1000ms)
-   **Element**: "PATH_NOT_FOUND" text
-   **Animation**: `EncryptedText` character-by-character decryption
-   **Duration**: `700ms` (overlaps with Phase 1)
-   **Characters**: Random → Final text reveal

#### Phase 3: Terminal Window Entrance (600ms - 1100ms)
-   **Element**: `TerminalWindow` container
-   **Animation**:
    -   Scale from `0.95` → `1`
    -   Opacity from `0` → `1`
-   **Duration**: `500ms`
-   **Easing**: `ease-out`

#### Phase 4: Command Output (900ms - 1400ms)
-   **Element**: Shell command (`cd <path>`) with error response
-   **Animation**: Typewriter effect for command line
-   **Duration**: `500ms`
-   **Interaction**: Shows the actual attempted path from URL

#### Phase 5: Suggestions Stagger (1200ms - 1600ms)
-   **Element**: `ls -la --suggestions` with clickable links
-   **Animation**: Each link fades in with `100ms` stagger
-   **Duration**: `400ms` total (4 links × 100ms)
-   **Interaction**: Navigate to `/`, `/tools`, `/compare`, `/analytics`

#### Background Effects
-   **SparklesCore**: Red-tinted particles (`#ef4444`)
-   **ScanlineOverlay**: Persistent CRT lines across entire viewport
-   **Keyboard Listener**: Press Enter → navigate home (router-based)

### 500 Page: "SYSTEM_FAULT"

**Entry Sequence**: ~1s total, immediate urgency

#### Phase 1: Terminal Window Drop (0ms - 500ms)
-   **Element**: `TerminalWindow` with red header
-   **Animation**:
    -   Scale from `0.95` → `1`
    -   Opacity from `0` → `1`
-   **Duration**: `500ms`
-   **Easing**: `ease-out`

#### Phase 2: Warning Icon Pulse (200ms - 700ms)
-   **Element**: Triangle alert icon
-   **Animation**:
    -   Scale pulse: `1` → `1.1` → `1` (loop)
    -   Red glow (`drop-shadow`)
-   **Duration**: `500ms` (overlaps with Phase 1)
-   **Repeat**: Continuous pulse every 2s

#### Phase 3: Title Decrypt (400ms - 1000ms)
-   **Element**: "SYSTEM_FAULT" text
-   **Animation**: `EncryptedText` rapid decryption
-   **Duration**: `600ms`
-   **Style**: Mono font, red accent

#### Phase 4: Error Code Randomize (400ms - 1000ms)
-   **Element**: Error code (e.g., `ERR_0xA3F2B1`)
-   **Animation**: Random hex cycling → final code
-   **Duration**: `600ms`
-   **Parallel**: Runs simultaneously with Phase 3

#### Phase 5: Hex Dump Stream (800ms - ongoing)
-   **Element**: Scrolling hex dump decoration
-   **Animation**: 
    -   Lines fade in from top
    -   Auto-scroll downward (typewriter effect)
-   **Duration**: Continuous (stops after ~2s)
-   **Style**: Gray mono text, non-interactive

#### Interactive Elements
-   **Stack Trace Toggle**: Collapsible (dev mode only)
-   **Buttons**:
    -   "Go home" → Full page reload (`window.location.href = '/'`)
    -   "Try again" → Resets error state + router retry
-   **Layout**: Centered card with `min-h-[calc(100vh-4rem)]`

## 3. Component Usage Guide

### GlitchText
**Purpose**: Visual instability to signal error severity.

**When to Use**:
- Critical status codes (`404`, `500`)
- High-impact error headers (`SYSTEM_FAULT`, `PATH_NOT_FOUND`)

**Properties**:
- `text`: String to display
- `className`: Optional styling (defaults to large heading)

**Visual Effect**:
- Horizontal color separation (cyan left, red right)
- Slight translateX jitter

### TerminalWindow
**Purpose**: Frames content as a terminal command output.

**When to Use**:
- Error logs
- CLI simulation (404 `cd` command)
- Technical data presentation

**Properties**:
- `title`: Window header text
- `variant`: `"default"` (gray) or `"error"` (red-tinted)
- `children`: Command output or error message

**Visual Style**:
- macOS-style traffic light dots (red/yellow/green)
- Glassmorphism background (`bg-black/40 backdrop-blur-xl`)
- Red border for error variant (`border-red-950/30`)

### ScanlineOverlay
**Purpose**: Adds CRT monitor texture for retro-tech immersion.

**When to Use**:
- Full-page utility screens (404, 500, Analytics)
- Anywhere retro terminal aesthetic is needed

**Properties**: None (auto-applies to entire viewport)

**Visual Effect**:
- Horizontal scanlines (`repeating-linear-gradient`)
- Subtle opacity (`opacity-[0.02]`)
- Pointer-events-none (doesn't block interaction)

## 4. Error State Styling Rules

### Color Palette

| State | Background | Accent | Border |
|-------|-----------|--------|--------|
| **Normal** | `bg-black/40` | Green (`#22c55e`) | `border-white/10` |
| **Error/Fault** | `bg-black/40` | Red (`#ef4444`) | `border-red-950/30` |

### Semantic Indicators
-   **Red**: System errors, path failures, critical faults
-   **Glitch Effects**: Reserved for error pages only (avoid overuse)
-   **Scanlines**: Used on error pages + analytics for "system monitor" feel

### Typography
-   **Error Codes**: `Fira Code` (mono), `text-2xl` - `text-6xl`
-   **Status Messages**: `Inter` (sans), `text-lg` - `text-xl`
-   **Terminal Output**: `Fira Code` (mono), `text-sm` - `text-base`

## 5. Layout Patterns

### Centered Error Card (500 Page)
```tsx
<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
  <TerminalWindow variant="error" title="SYSTEM_FAULT">
    {/* Error content */}
  </TerminalWindow>
</div>
```

**Key Details**:
- `min-h-[calc(100vh-4rem)]`: Full viewport minus header
- Flexbox centering: `flex items-center justify-center`
- Ensures error is always visible without scrolling

### Full-Height Error Screen (404 Page)
```tsx
<div className="relative min-h-screen">
  <ScanlineOverlay />
  <SparklesCore particleColor="#ef4444" />
  <div className="container mx-auto px-4 pt-32">
    {/* Error content flows naturally */}
  </div>
</div>
```

**Key Details**:
- `min-h-screen`: Full viewport
- Background effects as siblings (fixed positioning)
- Content flows naturally with padding

## 6. Interaction Patterns

### Navigation from Error
-   **Primary**: "Go home" button (router navigation)
-   **Secondary**: Clickable suggestions (404 page)
-   **Keyboard**: Enter key → go home (404 page only)

### Error Recovery (500 Page)
-   **"Try again"**: Resets error boundary state, triggers retry
-   **"Go home"**: Full page reload to clear all state (`window.location.href = '/'`)

**Why Full Reload for "Go Home"?**
The `AppErrorBoundary` is a class component that wraps `<Outlet />`. Client-side navigation doesn't remount it, so error state persists. Full page reload ensures clean reset.

## 7. Accessibility

### Keyboard Navigation
-   All buttons are keyboard-accessible (Tab navigation)
-   Enter key on 404 → navigate home

### Screen Readers
-   Error codes are announced as text
-   `TerminalWindow` title provides context
-   Action buttons have clear labels ("Go home", "Try again")

### Reduced Motion
**TODO**: Add `prefers-reduced-motion` support
- Disable glitch effects
- Disable scanline overlay
- Use simple fade transitions

## 8. Why It Works

-   **On-Brand**: Maintains terminal aesthetic even in failure states
-   **Clear Communication**: Error type is immediately obvious (404 vs 500)
-   **Helpful**: 404 provides navigation suggestions; 500 provides retry options
-   **Immersive**: Glitch effects and scanlines reinforce the "system fault" metaphor
-   **Not Frustrating**: Fast animations (~1s) don't delay error recovery

## 9. Testing

### Manual Testing Routes
-   **404**: Visit any non-existent path (e.g., `/this-does-not-exist`)
-   **500**: Use test route `/crash` (dev only - should be deleted in production)

### Verification Checklist
- [ ] 500 page is centered on screen (not top-left)
- [ ] "Go home" button clears error and navigates
- [ ] Glitch effects are visible but not excessive
- [ ] Scanlines are subtle (not distracting)
- [ ] All text is readable over background effects
- [ ] Keyboard navigation works (Tab, Enter)
