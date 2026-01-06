# Plan: Meta Changelog System v2

> **Status**: In Progress
> **Created**: 2026-01-06
> **Updated**: 2026-01-06
> **Estimated Time**: 4-5 hours

## Summary

Implement a "Meta Changelog" system for changelogs.directory — the platform's own changelog displayed within the application. This includes:

1. **"What's New" Toast Notification** — Dismissible notification on first visit after a new release
2. **Epic Changelog Page** — Visually stunning, uniquely "meta" experience at `/changelog`
3. **Simplified Footer** — Just version display linking to `/changelog`

## Background

### The Meta Concept

A changelog aggregator tracking its own changelog is inherently **meta**. Rather than hiding this, we lean into it as a signature element of the brand with unique visual treatments not used elsewhere in the app.

### Previous Implementation (v1)

The v1 implementation included an expandable footer panel, but it was:
- Buried at the bottom of the page
- Boring and hard to discover
- Not visually distinct enough for a "meta" feature

### v2 Philosophy: "The System Observing Itself"

The changelog page should feel like **looking into a mirror** — a recursive, self-aware experience. Visual elements unique to this page:
- Recursive/fractal background patterns
- Terminal boot sequence that "discovers" itself
- Glitch/decrypt effects on version numbers
- Scroll-linked timeline with pulse effects

---

## Part 1: "What's New" Toast Notification

### Concept

A dismissible notification that slides in from the **bottom-right corner** when the user visits after a new version is released. Uses `localStorage` to track the last seen version.

### Visual Design

```
                                    ┌─ NEW_RELEASE ─────────────────────────┐
                                    │                                        │
                                    │  v0.4.0 — Tool Lanes Layout            │
                                    │                                        │
                                    │  Homepage redesign with horizontal     │
                                    │  tool lanes                            │
                                    │                                        │
                                    │  ┌────────────────┐  ┌──────────┐     │
                                    │  │ See what's new │  │ Dismiss  │     │
                                    │  └────────────────┘  └──────────┘     │
                                    │                                        │
                                    └────────────────────────────────────────┘
```

### Behavior

1. On app load, fetch `getPlatformChangelog()`
2. Compare latest version with `localStorage.getItem('changelog:lastSeenVersion')`
3. If different (or not set), show toast after 2s delay
4. "See what's new" → navigates to `/changelog`, sets localStorage
5. "Dismiss" → sets `localStorage` to current version, hides toast
6. Auto-dismiss after 10s (optional)

### Animation

- Slide in from bottom-right with spring physics (`y: 100 → 0`)
- Glassmorphism background (`bg-black/80 backdrop-blur-xl`)
- Subtle glow effect on the version badge
- Exit: slide down + fade out

### Technical Implementation

```typescript
const STORAGE_KEY = 'changelog:lastSeenVersion'

function useWhatsNewToast() {
  const [showToast, setShowToast] = useState(false)
  const [latestRelease, setLatestRelease] = useState<PlatformRelease | null>(null)
  
  useEffect(() => {
    getPlatformChangelog().then(changelog => {
      const lastSeen = localStorage.getItem(STORAGE_KEY)
      const latest = changelog.releases[0]
      
      if (lastSeen !== latest.version) {
        setLatestRelease(latest)
        // Delay to not interrupt initial page load
        setTimeout(() => setShowToast(true), 2000)
      }
    })
  }, [])
  
  const dismiss = () => {
    if (latestRelease) {
      localStorage.setItem(STORAGE_KEY, latestRelease.version)
    }
    setShowToast(false)
  }
  
  return { showToast, latestRelease, dismiss }
}
```

---

## Part 2: Epic Changelog Page — "The Meta Experience"

### Concept: "Inception Mode"

This is a **changelog aggregator showing its own changelog** — we lean into the meta nature with a unique visual treatment that no other page has.

### Unique Visual Elements (Not Used Elsewhere)

#### 1. Recursive Background Effect (Nested Squares)

Subtle animated pattern of nested squares that pulse outward, suggesting infinite recursion.

```tsx
function RecursiveBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 border border-white/5"
          style={{ transform: `scale(${1 + i * 0.1})` }}
          animate={{
            opacity: [0.1, 0.3, 0.1],
            scale: [1 + i * 0.1, 1.05 + i * 0.1, 1 + i * 0.1],
          }}
          transition={{
            duration: 4,
            delay: i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}
```

#### 2. "Self-Aware" Terminal Boot Sequence (~2 seconds)

On page load, a terminal-style animation that "discovers" itself:

```
> SCANNING_SELF...
> CHANGELOG_DETECTED: changelogs.directory
> LOADING_META_DATA...
> RECURSION_LEVEL: ∞
> SYSTEM_READY
```

After boot completes, terminal fades out and main content fades in.

#### 3. Glitch/Decrypt Effect on Version Numbers

Use the existing `EncryptedText` component for version reveals. Each version "decrypts" as you scroll to it, creating a sense of discovery.

#### 4. Scroll-Linked Timeline with "Pulse" Effect

Vertical timeline on the left side:
- As you scroll, a "pulse" travels down the line
- Current version in viewport glows brighter
- Uses Framer Motion's `useScroll` + `useTransform`

```tsx
const { scrollYProgress } = useScroll({ target: containerRef })
const pulseY = useTransform(scrollYProgress, [0, 1], [0, timelineHeight])
```

#### 5. Easter Egg: Konami Code

Typing the Konami code (↑↑↓↓←→←→BA) triggers a special "developer mode" view that shows the raw CHANGELOG.md in a terminal window.

### Page Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌─ RECURSIVE_BACKGROUND ─────────────────────────────────────────────────┐ │
│  │  (Subtle animated pattern - nested squares pulsing outward)            │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ TERMINAL_BOOT_SEQUENCE (~2s) ─────────────────────────────────────────┐ │
│  │  > SCANNING_SELF...                                                     │ │
│  │  > CHANGELOG_DETECTED: changelogs.directory                             │ │
│  │  > LOADING_META_DATA...                                                 │ │
│  │  > RECURSION_LEVEL: ∞                                                   │ │
│  │  > SYSTEM_READY                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│                              ┌─ META ─┐                                      │
│                         ─────┤        ├─────                                 │
│                              └────────┘                                      │
│                                                                              │
│                           ~/changelog                                        │
│                                                                              │
│              "A changelog aggregator tracking its own changelog"             │
│                                                                              │
│  ┌─ SYSTEM_STATUS ────────────────────────────────────────────────────────┐ │
│  │  ● SELF_AWARE    │    4 RELEASES    │    15 CHANGES    │    ∞ META     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ TIMELINE ─────────────────────────────────────────────────────────────┐ │
│  │                                                                         │ │
│  │  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │
│  │  │                                                                      │ │
│  │  │  ┌─ v0.4.0 ─────────────────────────────────────────────────────┐   │ │
│  │  │  │                                                               │   │ │
│  │  │  │  2026-01-06 — Tool Lanes Layout              [LATEST] [META] │   │ │
│  │  │  │                                                               │   │ │
│  │  │  │  • Homepage redesign with horizontal tool lanes               │   │ │
│  │  │  │  • Velocity badges for high-activity tools                    │   │ │
│  │  │  │  • Lane sorting by most recent activity                       │   │ │
│  │  │  │  • Responsive design with scroll snap                         │   │ │
│  │  │  │                                                               │   │ │
│  │  │  └───────────────────────────────────────────────────────────────┘   │ │
│  │  │                                                                      │ │
│  │  ○━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │
│  │  │                                                                      │ │
│  │  │  ┌─ v0.3.0 ─────────────────────────────────────────────────────┐   │ │
│  │  │  │  (Version decrypts on scroll-into-view)                       │   │ │
│  │  │  └───────────────────────────────────────────────────────────────┘   │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ FOOTER ───────────────────────────────────────────────────────────────┐ │
│  │  RECURSION_DEPTH: 1 • SELF_REFERENCE: TRUE • PARADOX_LEVEL: STABLE     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Animation Choreography

| Phase | Time | Animation |
|-------|------|-----------|
| Boot Sequence | 0-2000ms | Terminal logs stream in, progress bar fills |
| Boot Complete | 2000ms | Terminal fades out with blur |
| Header Entrance | 2000-2500ms | Title + description slide up with fade |
| Status Bar | 2500-2800ms | Stats animate in with number counters |
| Timeline | 2800ms+ | Releases stagger in from top to bottom |
| Scroll Behavior | Ongoing | Timeline pulse follows scroll, versions decrypt on enter |

---

## Part 3: Simplified Footer

### Changes

Remove the expandable changelog panel. Footer becomes simpler:

```
changelogs.directory :: v0.4.0    Home  Tools  Analytics    ● OPERATIONAL | Built by @leodoan
                        ↑
                    Links to /changelog
```

- Version badge is a link to `/changelog`
- No expand/collapse behavior
- Cleaner, less cluttered

---

## Implementation Timeline

### Phase 1: Foundation Cleanup (Sequential)

| Order | Task | Files | Time |
|-------|------|-------|------|
| 1 | Simplify footer (remove expandable) | `footer.tsx` | 10 min |
| 2 | Delete footer-changelog.tsx | `footer-changelog.tsx` | 2 min |

### Phase 2: Toast Notification (Sequential)

| Order | Task | Files | Time |
|-------|------|-------|------|
| 1 | Create What's New toast component | `src/components/shared/whats-new-toast.tsx` | 30 min |
| 2 | Add toast to root layout | `src/routes/__root.tsx` | 10 min |

### Phase 3: Changelog Page Components (Parallel)

| Task | Files | Time |
|------|-------|------|
| Create RecursiveBackground | `src/components/changelog/recursive-background.tsx` | 30 min |
| Create TerminalBootSequence | `src/components/changelog/terminal-boot.tsx` | 30 min |
| Create MetaTimeline + MetaReleaseCard | `src/components/changelog/meta-timeline.tsx` | 45 min |
| Create KonamiEasterEgg | `src/components/changelog/konami-easter-egg.tsx` | 20 min |

### Phase 4: Changelog Page Assembly (Sequential)

| Order | Task | Files | Time |
|-------|------|-------|------|
| 1 | Rewrite changelog page with new components | `src/routes/changelog.tsx` | 60 min |
| 2 | Add scroll-linked animations | `src/routes/changelog.tsx` | 30 min |
| 3 | Polish and test | All | 30 min |

### Phase 5: Verification

| Order | Task | Command/Action | Time |
|-------|------|----------------|------|
| 1 | Run linter | `pnpm biome check --write <files>` | 3 min |
| 2 | Build verification | `pnpm build` | 5 min |
| 3 | Manual testing | Browser verification | 15 min |

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/shared/footer.tsx` | MODIFY | Simplify - remove expandable, version links to `/changelog` |
| `src/components/shared/footer-changelog.tsx` | DELETE | No longer needed |
| `src/components/shared/whats-new-toast.tsx` | CREATE | Toast notification component |
| `src/routes/__root.tsx` | MODIFY | Add WhatsNewToast to RootComponent |
| `src/components/changelog/recursive-background.tsx` | CREATE | Animated nested squares pattern |
| `src/components/changelog/terminal-boot.tsx` | CREATE | Self-aware boot sequence |
| `src/components/changelog/meta-timeline.tsx` | CREATE | Scroll-linked timeline with pulse |
| `src/components/changelog/konami-easter-egg.tsx` | CREATE | Easter egg component |
| `src/routes/changelog.tsx` | REWRITE | Complete redesign with new components |

---

## Existing Foundation (Already Implemented)

These files were created in v1 and will be reused:

| File | Status | Notes |
|------|--------|-------|
| `CHANGELOG.md` | ✅ Created | Platform changelog with 4 releases |
| `public/changelog-assets/` | ✅ Created | Folder for screenshots (empty) |
| `src/lib/parsers/platform-changelog.ts` | ✅ Created | Parser using `gray-matter` |
| `src/server/platform.ts` | ✅ Created | Server functions for changelog data |
| `package.json` | ✅ Modified | `gray-matter` dependency added |

---

## Technical Considerations

### localStorage for Toast

- Key: `changelog:lastSeenVersion`
- Value: Version string (e.g., `"0.4.0"`)
- Set when user dismisses toast or clicks "See what's new"

### Scroll-Linked Animations

Using Framer Motion's scroll utilities:

```tsx
import { useScroll, useTransform, motion } from 'motion/react'

const { scrollYProgress } = useScroll({ target: containerRef })
const pulseY = useTransform(scrollYProgress, [0, 1], [0, timelineHeight])
```

### Konami Code Detection

```tsx
const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 
                     'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 
                     'KeyB', 'KeyA']

function useKonamiCode(callback: () => void) {
  const [index, setIndex] = useState(0)
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === KONAMI_CODE[index]) {
        if (index === KONAMI_CODE.length - 1) {
          callback()
          setIndex(0)
        } else {
          setIndex(i => i + 1)
        }
      } else {
        setIndex(0)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [index, callback])
}
```

### EncryptedText Integration

Reuse the existing `EncryptedText` component from `src/components/ui/encrypted-text.tsx` for version number reveals.

---

## Verification Strategy

### Code Quality
- [ ] Run `pnpm biome check --write` on all new/modified files
- [ ] Run `pnpm build` (production build succeeds)
- [ ] Check TypeScript errors with IDE diagnostics

### Toast Notification
- [ ] Toast appears 2s after page load on first visit
- [ ] Toast shows latest version info
- [ ] "See what's new" navigates to `/changelog`
- [ ] "Dismiss" hides toast and sets localStorage
- [ ] Toast doesn't appear on subsequent visits (same version)
- [ ] Toast reappears after version update

### Changelog Page
- [ ] Boot sequence plays on page load (~2s)
- [ ] Recursive background animates smoothly
- [ ] Header fades in after boot
- [ ] Timeline renders with all releases
- [ ] Version numbers decrypt on scroll-into-view
- [ ] Scroll pulse follows scroll position
- [ ] Konami code triggers easter egg
- [ ] Responsive on mobile/tablet/desktop

### Design System Compliance
- [ ] Monochrome palette maintained
- [ ] Glassmorphism effects on cards
- [ ] Typography: Inter for UI, Fira Code for technical data
- [ ] Animations: 300-500ms, easeOut curves
- [ ] Unique visual treatment not used elsewhere

---

## Success Criteria

- [ ] Toast notification shows for new versions
- [ ] `/changelog` page is visually stunning and unique
- [ ] Boot sequence creates sense of "self-awareness"
- [ ] Scroll animations feel smooth and polished
- [ ] Konami code easter egg works
- [ ] Footer simplified with version linking to `/changelog`
- [ ] All verification checks pass

---

## Related Documentation

- `docs/design/design-rules.md` — Core aesthetic principles
- `docs/design/animations/homepage.md` — Animation choreography patterns
- `docs/reference/api-patterns.md` — SSR loader patterns
- `src/components/ui/encrypted-text.tsx` — Existing decrypt effect component
- `src/components/ui/terminal-loader.tsx` — Existing terminal animation patterns

---

## Git Versioning (Pending)

Git tags have not been created yet. After this implementation is complete:

```bash
git tag -a v0.1.0 668e49f -m "feat: Windsurf integration"
git tag -a v0.2.0 837f91d -m "feat: OpenCode integration"
git tag -a v0.3.0 9f90cad -m "feat: Antigravity integration"
git tag -a v0.4.0 5ff8410 -m "feat: Tool lanes layout"
git push origin --tags
```

---

**Next Step**: Begin Phase 1 implementation (Foundation Cleanup).
