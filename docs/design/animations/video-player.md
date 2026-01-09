# Video Player (`CinematicVideoPlayer`)

This document outlines the design, behavior, and interaction patterns for the `CinematicVideoPlayer` component — a viewport-aware video player with minimal controls that maintains the application's "dev-vibe" aesthetic.

## 1. Core Concept: "Cinematic Playback"

The video player is designed to feel like a **high-end media utility**, not a consumer video player. It prioritizes:

-   **Minimal UI**: Only essential controls (play/pause, fullscreen)
-   **Viewport awareness**: Auto-plays when scrolled into view, pauses when out of view
-   **Aesthetic consistency**: Glassmorphism, monochrome palette, subtle vignette
-   **Performance**: Automatic pause when off-screen saves system resources

## 2. Visual Design

### Container
-   **Border**: `border-border/40` (subtle, minimal)
-   **Corners**: `rounded-md` (reduced from standard `rounded-xl` for sharper aesthetic)
-   **Background**: `bg-black/20` (barely visible fallback)
-   **Vignette**: Radial gradient overlay (`transparent 50%` → `rgba(0,0,0,0.25) 100%`)
    -   Creates subtle edge darkening for cinematic feel
    -   Does not interfere with video content
    -   `pointer-events-none` to allow video interaction

### Control Bar
-   **Position**: Absolute, bottom-center (`bottom-4 left-1/2 -translate-x-1/2`)
-   **Shape**: Pill-shaped (`rounded-full`)
-   **Material**: Glassmorphism
    -   Background: `bg-black/60`
    -   Blur: `backdrop-blur-xl`
    -   Border: `border-white/10`
-   **Padding**: Compact (`px-2 py-1.5`)
-   **Always visible**: No hover-to-reveal behavior

### Buttons
-   **Size**: Icon-only, `size-4` (16px icons)
-   **Padding**: `p-1.5` around each icon
-   **Color**: 
    -   Default: `text-white/80`
    -   Hover: `text-white`
-   **Divider**: `w-px h-4 bg-white/20` between buttons

## 3. Control Interactions

### Play/Pause Button
-   **Icon**: Toggles between `<Play />` and `<Pause />` from `lucide-react`
-   **State**: Controlled by `isPlaying` boolean
-   **Behavior**:
    -   Syncs with viewport autoplay (play icon when paused, pause icon when playing)
    -   Manual click overrides autoplay
    -   Video element's native play/pause methods used
-   **Animation**:
    -   Hover: `scale: 1.1`
    -   Tap: `scale: 0.9`
    -   Transition: Spring (`stiffness: 400, damping: 25`)
-   **Accessibility**: `aria-label` dynamically set to "Pause video" or "Play video"

### Fullscreen Button
-   **Icon**: `<Maximize />` from `lucide-react`
-   **Behavior**:
    -   Uses browser Fullscreen API
    -   Toggles fullscreen on the **container** (not just video element)
    -   Preserves vignette and controls in fullscreen mode
    -   Graceful failure if Fullscreen API not supported (`.catch(() => {})`)
-   **Animation**: Same spring-based scale as play/pause
-   **Accessibility**: `aria-label="Toggle fullscreen"`

### No Volume Control
-   Videos are **always muted** (`muted` attribute on `<video>`)
-   Rationale: Changelog videos are typically silent demos/screencasts
-   Simplifies UI by removing volume button and slider

## 4. Viewport-Aware Autoplay

### Implementation
Uses Motion's `useInView` hook with a **50% visibility threshold**:

```typescript
const isInView = useInView(containerRef, { amount: 0.5 })
```

### Behavior
-   **On enter view** (50% visible):
    -   `video.play()` is called
    -   `isPlaying` state set to `true`
    -   Play button updates to pause icon
-   **On exit view** (less than 50% visible):
    -   `video.pause()` is called
    -   `isPlaying` state set to `false`
    -   Pause button updates to play icon

### Edge Cases
-   If video fails to play (e.g., browser policy), promise rejection is silently caught
-   Manual play/pause by user is respected
-   Multiple videos on page: Only those in viewport attempt to play (resource-efficient)

## 5. Animation Choreography

### Control Bar Entrance
-   **Trigger**: Immediately when player mounts
-   **Animation**:
    -   `initial`: `{ opacity: 0, y: 10 }`
    -   `animate`: `{ opacity: 1, y: 0 }`
    -   `transition`: `{ delay: 0.3 }` (300ms delay for stagger)
-   **Purpose**: Controls fade in after video container is rendered, avoiding visual clutter during page load

### Button Micro-interactions
-   **Hover**: Scale to 110% (`scale: 1.1`)
-   **Tap/Click**: Scale to 90% (`scale: 0.9`)
-   **Spring**: `stiffness: 400, damping: 25` for tactile feedback
-   **Duration**: ~200-300ms (automatic spring timing)

### No Video Transitions
-   Video content itself does not animate in/out
-   Container entrance is handled by parent components (e.g., `MetaTimeline` stagger)

## 6. Props Interface

```typescript
interface CinematicVideoPlayerProps {
  src: string              // Video source URL (required)
  poster?: string          // Poster image URL (optional)
  className?: string       // Additional Tailwind classes (optional)
  maxWidth?: string | number  // Max width constraint (e.g., "800px" or 800)
  loop?: boolean           // Default: true
}
```

### Prop Details
-   **`src`**: Must be a valid video URL. No format validation — relies on browser support.
-   **`poster`**: Static image shown before first play. Not used if autoplay succeeds immediately.
-   **`className`**: Applied to container `<div>`. Use for spacing (`mb-6`, `mx-auto`).
-   **`maxWidth`**: Applied via inline styles. Supports both string (`"600px"`) and number (`600`).
-   **`loop`**: Video loops indefinitely when true. Default is `true` for demo videos.

## 7. Usage Examples

### Basic Usage (Changelog)
```tsx
<CinematicVideoPlayer
  src={release.video}
  maxWidth={release.videoWidth}
  className="mb-6 mx-auto w-full max-sm:!max-w-full"
/>
```

### With Poster Image
```tsx
<CinematicVideoPlayer
  src="/videos/demo.mp4"
  poster="/images/poster.jpg"
  maxWidth="800px"
/>
```

### Custom Styling
```tsx
<CinematicVideoPlayer
  src="/videos/feature.webm"
  className="rounded-lg shadow-2xl"
  loop={false}
/>
```

## 8. Integration Points

### Current Usage
-   **`/changelog` page**: Used in `MetaTimeline` component for release videos
    -   File: `src/components/changelog/meta-timeline.tsx`
    -   Replaces: Basic `<video>` element with `autoPlay loop muted`

### Potential Usage
-   **`/tools/$slug` page**: Tool hero videos or feature demos
-   **`/tools/$slug/releases/$version` page**: Release-specific media
-   **Marketing content**: If product tour videos are added

## 9. Accessibility

### ARIA Labels
-   Play/Pause: `aria-label={isPlaying ? 'Pause video' : 'Play video'}`
-   Fullscreen: `aria-label="Toggle fullscreen"`

### Keyboard Support
-   **Not implemented**: Native `<video>` keyboard controls are disabled (no `controls` attribute)
-   **Future enhancement**: Add keyboard shortcuts (Space = play/pause, F = fullscreen)

### Screen Readers
-   Video element includes `<track kind="captions" />` placeholder
-   No captions loaded by default (videos are silent demos)

## 10. Performance Considerations

### Viewport Pausing
-   Videos pause when scrolled out of view → **reduces CPU/GPU usage**
-   Especially important on pages with multiple videos (changelog feed)

### No Preload
-   Video does not use `preload="auto"` → **saves bandwidth**
-   Videos load on-demand when scrolled into view

### Muted by Default
-   Required for autoplay to work in modern browsers
-   Avoids unexpected audio playback

## 11. Browser Compatibility

### Fullscreen API
-   Supported in all modern browsers (Chrome, Firefox, Safari, Edge)
-   Graceful degradation: If not supported, button click does nothing (no error thrown)

### Autoplay Policy
-   Muted videos can autoplay in all modern browsers
-   Non-muted videos would require user interaction first

### Intersection Observer (via `useInView`)
-   Polyfilled by Motion library
-   Works in all supported browsers

## 12. Technical Implementation

### Component Location
`src/components/ui/cinematic-video-player.tsx`

### Dependencies
-   **motion/react**: `motion`, `useInView` for animations and viewport detection
-   **lucide-react**: `Play`, `Pause`, `Maximize` icons
-   **React**: `useEffect`, `useRef`, `useState` hooks
-   **@/lib/utils**: `cn()` utility for className merging

### Video Element Attributes
```tsx
<video
  ref={videoRef}
  src={src}
  poster={poster}
  loop={loop}
  muted              // Always muted (no audio control)
  playsInline        // Prevents fullscreen on iOS
  className="w-full h-auto"
>
  <track kind="captions" />
</video>
```

## 13. Design Rationale

### Why Always-Visible Controls?
-   **Discoverability**: Users immediately see they can interact with the video
-   **Consistency**: Matches the "utility tool" aesthetic (vs. consumer media player that hides controls)
-   **No hover states on mobile**: Always-visible controls work on touch devices

### Why 50% Visibility Threshold?
-   **User intent**: If user scrolls video halfway into view, they likely want to see it
-   **Performance**: Prevents videos from playing when barely visible (top/bottom edge)
-   **Smooth UX**: Video starts playing before it's fully visible (feels responsive)

### Why No Progress Bar?
-   **Minimal aesthetic**: Progress bars add visual clutter
-   **Looping videos**: Most changelog videos are short loops (no need to scrub)
-   **Future enhancement**: Could be added behind a toggle or for longer videos

### Why Glassmorphism for Controls?
-   **Consistency**: Matches "Floating Dock" and other overlay UI elements
-   **Legibility**: Blurred background ensures controls are readable over any video content
-   **Depth**: Creates layering effect (video → vignette → controls)

## 14. Future Enhancements

Potential additions that maintain the "dev-vibe" aesthetic:

-   **Progress bar**: Thin monochrome bar at bottom (only for videos > 30s)
-   **Playback speed**: `1.0x`, `1.5x`, `2.0x` toggle (monospace text)
-   **Keyboard shortcuts**: Space (play/pause), F (fullscreen), M (mute)
-   **Picture-in-picture**: For long tutorial videos
-   **Timestamp display**: `00:42 / 02:15` in monospace font
-   **Loading state**: Terminal-style loader while buffering

## 15. Relationship to Design System

### Aligns With:
-   **Monochrome palette**: Controls are black/white/gray only
-   **Glassmorphism**: Control bar matches dock/bottom sheet aesthetic
-   **Cinematic timing**: 300ms delay on control entrance, spring-based interactions
-   **Typography**: Could use `Fira Code` for future timestamp display
-   **Borders**: Uses `border-white/10` consistent with system

### Extends:
-   **Viewport awareness**: First component to auto-pause based on scroll position
-   **Media handling**: Establishes pattern for rich media (could extend to audio, 3D models)
-   **Fullscreen pattern**: Reusable approach for immersive content

---

**Last Updated**: January 10, 2026  
**Component Version**: 1.0.0  
**Status**: ✅ Production-ready
