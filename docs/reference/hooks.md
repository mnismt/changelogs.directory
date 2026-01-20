# Custom Hooks Reference

React hooks for scroll-based animations, intersection observers, and utilities.

## useSectionObserver

IntersectionObserver-based hook for tracking which sections are visible in the viewport. Used by the Release page Section Navigation (TOC).

**File**: `src/hooks/use-section-observer.ts`

### Signature

```tsx
function useSectionObserver(
  sectionRefs: Map<ChangeType, HTMLDivElement | null>,
  options?: UseSectionObserverOptions
): {
  activeSection: ChangeType | null
  visibleSections: Set<ChangeType>
  scrollToSection: (type: ChangeType) => void
}

interface UseSectionObserverOptions {
  rootMargin?: string  // Default: '-20% 0px -20% 0px'
  threshold?: number   // Default: 0
}
```

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `activeSection` | `ChangeType \| null` | The topmost visible section (used for active indicator) |
| `visibleSections` | `Set<ChangeType>` | All sections currently in viewport (used for viewport bracket) |
| `scrollToSection` | `(type: ChangeType) => void` | Smooth scroll to a section with header offset |

### Usage

```tsx
import { useRef } from 'react'
import { useSectionObserver } from '@/hooks/use-section-observer'
import type { ChangeType } from '@/generated/prisma/client'

function ReleasePage() {
  const sectionRefs = useRef<Map<ChangeType, HTMLDivElement | null>>(new Map())
  
  const { activeSection, visibleSections, scrollToSection } = useSectionObserver(
    sectionRefs.current
  )

  // Set refs via callback
  const setSectionRef = (type: ChangeType) => (el: HTMLDivElement | null) => {
    sectionRefs.current.set(type, el)
  }

  return (
    <>
      <SectionNav
        activeSection={activeSection}
        visibleSections={visibleSections}
        onSectionClick={scrollToSection}
      />
      
      {sections.map((section) => (
        <div key={section.type} ref={setSectionRef(section.type)}>
          {/* Section content */}
        </div>
      ))}
    </>
  )
}
```

### How It Works

1. **IntersectionObserver** monitors all section elements with configurable `rootMargin`
2. **visibleSections** tracks all sections currently intersecting the viewport
3. **activeSection** is determined by section order (BREAKING → SECURITY → FEATURE → ... → OTHER)
4. **scrollToSection** calculates scroll position with 120px header offset

### When to Use

- Release page table of contents (Section Navigation)
- Any multi-section page requiring scroll-based highlighting
- Minimap/viewport bracket indicators

### Tests

- Unit: `tests/hooks/use-section-observer.test.ts`
- E2E: `tests/e2e/pages/release-detail.spec.ts`

---

## useScrollReveal

Hook for scroll-triggered reveal animations using IntersectionObserver. Returns a ref and visibility state for entrance animations.

**File**: `src/hooks/use-scroll-reveal.ts`

### Signature

```tsx
function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options?: UseScrollRevealOptions
): {
  ref: RefObject<T>
  isVisible: boolean
}

interface UseScrollRevealOptions {
  threshold?: number     // Default: 0.1 (10% visible to trigger)
  rootMargin?: string    // Default: '-50px'
  triggerOnce?: boolean  // Default: true
}
```

### Usage

```tsx
import { useScrollReveal } from '@/hooks/use-scroll-reveal'

function AnimatedCard() {
  const { ref, isVisible } = useScrollReveal()

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
    >
      Content reveals on scroll
    </div>
  )
}
```

### With Framer Motion

```tsx
import { motion } from 'framer-motion'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'

function AnimatedSection() {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.2 })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
      animate={isVisible ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
    >
      Cinematic entrance
    </motion.div>
  )
}
```

### When to Use

- Staggered entrance animations on scroll
- Lazy-loading content visibility
- When you need more control than Framer Motion's `whileInView`

### vs Framer Motion's `whileInView`

| Feature | useScrollReveal | whileInView |
|---------|-----------------|-------------|
| Control over timing | Full control | Limited |
| Conditional logic | ✅ `isVisible` state | ❌ Declarative only |
| Multiple elements | Need separate hooks | Built-in stagger |
| SSR hydration | Handles gracefully | May flash |

**Use `useScrollReveal`** when you need:
- Complex conditional animations
- Integration with non-Framer components
- Custom intersection thresholds

**Use `whileInView`** when you need:
- Simple reveal animations
- Built-in stagger with `staggerChildren`
- Less boilerplate

---

## useMediaQuery

Simple hook for responsive breakpoint detection.

**File**: `src/hooks/use-media-query.ts`

### Signature

```tsx
function useMediaQuery(query: string): boolean
```

### Usage

```tsx
const isMobile = useMediaQuery('(max-width: 768px)')
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
```

---

## useDebounce

Debounces a value by the specified delay.

**File**: `src/hooks/use-debounce.ts`

### Signature

```tsx
function useDebounce<T>(value: T, delay: number): T
```

### Usage

```tsx
const [search, setSearch] = useState('')
const debouncedSearch = useDebounce(search, 300)

useEffect(() => {
  // Only fires 300ms after user stops typing
  fetchResults(debouncedSearch)
}, [debouncedSearch])
```

---

## Animation Patterns

These hooks support the project's animation philosophy. See [design-rules.md](../design/design-rules.md) for timing guidelines.

### Recommended Spring Configs

```tsx
// Snappy (UI feedback)
{ type: 'spring', stiffness: 300, damping: 30 }

// Standard (most animations)
{ type: 'spring', stiffness: 260, damping: 25 }

// Smooth (content transitions)
{ type: 'spring', stiffness: 200, damping: 25 }
```

### Cinematic Entrance Pattern

```tsx
// blur + scale + translate for "focusing" effect
initial={{ opacity: 0, y: 30, filter: 'blur(10px)', scale: 0.95 }}
animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
```

---

## useShare

Hook for cross-tree share availability detection and triggering. Used by MobileDock to communicate with route-level ShareProvider.

**File**: `src/contexts/share-context.tsx`

### Signature

```tsx
function useShare(): {
  isAvailable: boolean
  onShare: () => void
}
```

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `isAvailable` | `boolean` | Whether share is available on current page |
| `onShare` | `() => void` | Dispatch share event to open share UI |

### Usage (MobileDock)

```tsx
import { useShare } from '@/contexts/share-context'

function MobileDock() {
  const { isAvailable, onShare } = useShare()

  return (
    <nav>
      {isAvailable && (
        <button onClick={onShare}>
          <Share2 />
        </button>
      )}
    </nav>
  )
}
```

### ShareProvider

Wrap route content to enable sharing on that page.

```tsx
import { ShareProvider } from '@/contexts/share-context'

function ReleasePage() {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <ShareProvider onShare={() => setSheetOpen(true)}>
      <ReleaseContent />
      <ShareSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </ShareProvider>
  )
}
```

### How It Works

1. `ShareProvider` sets `data-share-available="true"` on `document.body` on mount
2. `useShare` observes this attribute via `MutationObserver`
3. `onShare()` dispatches `CustomEvent('share-release')`
4. `ShareProvider` listens for this event and calls its `onShare` prop

This pattern enables communication between the MobileDock (rendered in root layout) and route components (separate React trees).

### When to Use

- Mobile dock share button integration
- Any cross-tree feature availability detection
- When React context can't span component boundaries

---

**Last Updated**: 2026-01-20
