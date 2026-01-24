# Implementation Plan: Test Section Observer Hook & Release Detail Page

> **Created**: 2026-01-11
> **Status**: 🟡 In Progress
> **Estimated Time**: 2-3 hours

## Summary

Create comprehensive tests for the `useSectionObserver` hook and release detail page functionality. This includes unit tests for the hook's core logic (IntersectionObserver-based section tracking) and E2E tests for the full release detail page experience, with special focus on the **critical version-switching bug** that was recently fixed.

## Background

### The Bug That Was Fixed

The desktop sidebar section navigation was getting stuck after navigating between versions via client-side routing. The bug occurred because:

1. When navigating from v1.0.0 → v1.1.0, React doesn't unmount the component (same route pattern)
2. The `useSectionObserver` hook's effect ran and found **stale refs** from the old version's DOM elements still in the Map
3. It set up an IntersectionObserver watching those old elements
4. React then unmounted the old elements and mounted new ones
5. The observer never updated → sidebar stayed stuck on old state

**The fix**: Clear the refs Map at the start of the effect (`sectionRefs.clear()`) and implement a retry mechanism with increasing delays (50ms, 100ms, ..., 500ms) to wait for React to mount new elements and populate fresh refs.

### Why Testing Is Critical

This bug was:
- **Silent**: No console errors, failed quietly
- **Context-specific**: Only occurred during client-side navigation, not initial page load
- **Race condition**: Timing-dependent, making it hard to debug
- **User-facing**: Broke a core navigation feature

Comprehensive tests will:
1. **Prevent regression** of this specific bug
2. **Document expected behavior** for future maintainers
3. **Catch similar timing issues** in other hooks
4. **Increase confidence** in the section observer implementation

## Approach

### Unit Tests (Hook in Isolation)

Test the `useSectionObserver` hook using:
- **Vitest** with **jsdom** environment for DOM APIs
- **@testing-library/react** with `renderHook` for testing hooks
- **Mock IntersectionObserver** that can be triggered programmatically

Focus areas:
- Initial state (null activeSection, empty visibleSections)
- Section visibility tracking when elements intersect
- Active section selection (topmost visible)
- **Version change handling** (reset state, clear refs, retry mechanism)
- scrollToSection callback functionality

### E2E Tests (Full Page Experience)

Test the release detail page using **Playwright** with:
- Real browser (Chromium)
- Seeded database with multiple versions
- User interaction simulation

Focus areas:
- Page load and content rendering
- Section navigation sidebar behavior
- Scroll tracking and active section updates
- **Version switching via client-side navigation** (the bug scenario)
- Keyboard navigation (n/p keys)
- Mobile version picker FAB

## Implementation Timeline

### Phase 1: Unit Test Infrastructure (Sequential)

These must be completed in order as they build on each other.

| Order | Task | Files | Time | Reason |
|-------|------|-------|------|--------|
| 1 | Create test setup for React hooks | `tests/hooks/setup.ts` | 10 min | Configure cleanup after each test |
| 2 | Create IntersectionObserver mock | `tests/hooks/mocks/intersection-observer.ts` | 30 min | Reusable mock with trigger capabilities |
| 3 | Write unit tests for useSectionObserver | `tests/hooks/use-section-observer.test.ts` | 60 min | Test all core behaviors and edge cases |

### Phase 2: E2E Test Infrastructure (Sequential)

| Order | Task | Files | Time | Reason |
|-------|------|-------|------|--------|
| 1 | Add data-testid to release page | `src/routes/tools/$slug/releases/$version.tsx` | 15 min | Enable stable selectors |
| 2 | Add data-testid to SectionNav | `src/components/changelog/release/section-nav.tsx` | 10 min | Enable sidebar testing |
| 3 | Add data-testid to VersionPickerSheet | `src/components/changelog/release/version-picker-sheet.tsx` | 5 min | Enable mobile FAB testing |
| 4 | Write E2E tests for release detail | `tests/e2e/pages/release-detail.spec.ts` | 60 min | Comprehensive page tests |

### Phase 3: Verification & Documentation (Sequential)

| Order | Task | Command/File | Time |
|-------|------|--------------|------|
| 1 | Run unit tests | `pnpm test tests/hooks/` | 2 min |
| 2 | Run E2E tests | `pnpm test:e2e release-detail.spec.ts` | 5 min |
| 3 | Format/lint all changes | `pnpm biome check --write tests/` | 2 min |
| 4 | Update testing documentation | `docs/guides/testing.md` | 10 min |
| 5 | Update E2E documentation | `docs/testing/browser-tests.md` | 10 min |

## Files to Create/Modify

### New Files

| File | Purpose | Complexity |
|------|---------|------------|
| `tests/hooks/setup.ts` | Vitest setup for React hook tests with jsdom | Low |
| `tests/hooks/mocks/intersection-observer.ts` | Mock IntersectionObserver with trigger capabilities | Medium |
| `tests/hooks/use-section-observer.test.ts` | Unit tests for the hook (7 test cases) | Medium |
| `tests/e2e/pages/release-detail.spec.ts` | E2E tests for release detail page (15+ test cases) | High |

### Modified Files

| File | Change | Complexity |
|------|--------|------------|
| `src/routes/tools/$slug/releases/$version.tsx` | Add `data-testid` attributes for sections and content | Low |
| `src/components/changelog/release/section-nav.tsx` | Add `data-testid` and `data-active` attributes | Low |
| `src/components/changelog/release/version-picker-sheet.tsx` | Add `data-testid` for sheet | Low |
| `docs/guides/testing.md` | Document hook testing patterns | Low |
| `docs/testing/browser-tests.md` | Document release detail E2E coverage | Low |

## Detailed Implementation

### 1. Hook Test Setup (`tests/hooks/setup.ts`)

```typescript
// Configure jsdom environment for React hook tests
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Cleanup after each test to prevent state leakage
afterEach(() => {
  cleanup()
})
```

### 2. IntersectionObserver Mock (`tests/hooks/mocks/intersection-observer.ts`)

```typescript
import { vi } from 'vitest'

type IntersectionCallback = (entries: IntersectionObserverEntry[]) => void

// Store active observers for programmatic triggering
export const mockObservers = new Map<Element, {
  callback: IntersectionCallback
  options: IntersectionObserverInit | undefined
}>()

// Create a controllable mock
export function createMockIntersectionObserver() {
  return vi.fn().mockImplementation((
    callback: IntersectionCallback, 
    options?: IntersectionObserverInit
  ) => {
    const observed = new Set<Element>()
    
    return {
      observe: vi.fn((element: Element) => {
        observed.add(element)
        mockObservers.set(element, { callback, options })
      }),
      unobserve: vi.fn((element: Element) => {
        observed.delete(element)
        mockObservers.delete(element)
      }),
      disconnect: vi.fn(() => {
        for (const el of observed) {
          mockObservers.delete(el)
        }
        observed.clear()
      }),
      takeRecords: vi.fn(() => []),
      root: null,
      rootMargin: options?.rootMargin ?? '',
      thresholds: Array.isArray(options?.threshold) 
        ? options.threshold 
        : [options?.threshold ?? 0],
    }
  })
}

// Helper to trigger intersection events
export function triggerIntersection(element: Element, isIntersecting: boolean) {
  const observer = mockObservers.get(element)
  if (observer) {
    observer.callback([{
      target: element,
      isIntersecting,
      intersectionRatio: isIntersecting ? 1 : 0,
      boundingClientRect: element.getBoundingClientRect(),
      intersectionRect: element.getBoundingClientRect(),
      rootBounds: null,
      time: Date.now(),
    } as IntersectionObserverEntry])
  }
}

export function clearMockObservers() {
  mockObservers.clear()
}
```

### 3. Hook Unit Tests (`tests/hooks/use-section-observer.test.ts`)

```typescript
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSectionObserver } from '@/hooks/use-section-observer'
import { 
  createMockIntersectionObserver, 
  triggerIntersection,
  clearMockObservers 
} from './mocks/intersection-observer'
import type { ChangeType } from '@/generated/prisma/client'

describe('useSectionObserver', () => {
  let mockObserver: ReturnType<typeof createMockIntersectionObserver>
  
  beforeEach(() => {
    mockObserver = createMockIntersectionObserver()
    vi.stubGlobal('IntersectionObserver', mockObserver)
  })
  
  afterEach(() => {
    clearMockObservers()
    vi.unstubAllGlobals()
  })
  
  it('should initialize with null activeSection and empty visibleSections', () => {
    const sectionRefs = new Map<ChangeType, HTMLDivElement | null>()
    
    const { result } = renderHook(() => 
      useSectionObserver(sectionRefs, {}, 'v1.0.0')
    )
    
    expect(result.current.activeSection).toBeNull()
    expect(result.current.visibleSections.size).toBe(0)
  })
  
  it('should track visible sections when they intersect', async () => {
    const sectionRefs = new Map<ChangeType, HTMLDivElement | null>()
    const featureEl = document.createElement('div')
    const bugfixEl = document.createElement('div')
    document.body.appendChild(featureEl)
    document.body.appendChild(bugfixEl)
    
    sectionRefs.set('FEATURE', featureEl)
    sectionRefs.set('BUGFIX', bugfixEl)
    
    const { result } = renderHook(() => 
      useSectionObserver(sectionRefs, {}, 'v1.0.0')
    )
    
    // Wait for observer setup (retry mechanism)
    await waitFor(() => {
      expect(mockObserver).toHaveBeenCalled()
    }, { timeout: 1000 })
    
    // Simulate FEATURE becoming visible
    act(() => {
      triggerIntersection(featureEl, true)
    })
    
    expect(result.current.visibleSections.has('FEATURE')).toBe(true)
    expect(result.current.activeSection).toBe('FEATURE')
    
    // Cleanup
    document.body.removeChild(featureEl)
    document.body.removeChild(bugfixEl)
  })
  
  it('should select topmost visible section as active', async () => {
    const sectionRefs = new Map<ChangeType, HTMLDivElement | null>()
    const featureEl = document.createElement('div')
    const bugfixEl = document.createElement('div')
    document.body.appendChild(featureEl)
    document.body.appendChild(bugfixEl)
    
    sectionRefs.set('FEATURE', featureEl)
    sectionRefs.set('BUGFIX', bugfixEl)
    
    const { result } = renderHook(() => 
      useSectionObserver(sectionRefs, {}, 'v1.0.0')
    )
    
    await waitFor(() => expect(mockObserver).toHaveBeenCalled(), { timeout: 1000 })
    
    // Both sections visible - FEATURE should be active (higher priority)
    act(() => {
      triggerIntersection(featureEl, true)
      triggerIntersection(bugfixEl, true)
    })
    
    expect(result.current.activeSection).toBe('FEATURE')
    
    // FEATURE scrolls out - BUGFIX becomes active
    act(() => {
      triggerIntersection(featureEl, false)
    })
    
    expect(result.current.activeSection).toBe('BUGFIX')
    
    document.body.removeChild(featureEl)
    document.body.removeChild(bugfixEl)
  })
  
  it('should reset state and clear refs when version changes (critical bug regression)', async () => {
    const sectionRefs = new Map<ChangeType, HTMLDivElement | null>()
    const featureEl = document.createElement('div')
    document.body.appendChild(featureEl)
    sectionRefs.set('FEATURE', featureEl)
    
    const { result, rerender } = renderHook(
      ({ version }) => useSectionObserver(sectionRefs, {}, version),
      { initialProps: { version: 'v1.0.0' } }
    )
    
    await waitFor(() => expect(mockObserver).toHaveBeenCalled(), { timeout: 1000 })
    
    act(() => {
      triggerIntersection(featureEl, true)
    })
    
    expect(result.current.activeSection).toBe('FEATURE')
    
    // Change version - this should trigger the bug fix
    rerender({ version: 'v2.0.0' })
    
    // State should reset
    expect(result.current.activeSection).toBeNull()
    expect(result.current.visibleSections.size).toBe(0)
    
    // Refs should be cleared (the critical fix)
    expect(sectionRefs.size).toBe(0)
    
    document.body.removeChild(featureEl)
  })
  
  it('should handle multiple visibility changes correctly', async () => {
    const sectionRefs = new Map<ChangeType, HTMLDivElement | null>()
    const featureEl = document.createElement('div')
    const improvementEl = document.createElement('div')
    const bugfixEl = document.createElement('div')
    
    document.body.appendChild(featureEl)
    document.body.appendChild(improvementEl)
    document.body.appendChild(bugfixEl)
    
    sectionRefs.set('FEATURE', featureEl)
    sectionRefs.set('IMPROVEMENT', improvementEl)
    sectionRefs.set('BUGFIX', bugfixEl)
    
    const { result } = renderHook(() => 
      useSectionObserver(sectionRefs, {}, 'v1.0.0')
    )
    
    await waitFor(() => expect(mockObserver).toHaveBeenCalled(), { timeout: 1000 })
    
    // Simulate scrolling: FEATURE visible
    act(() => {
      triggerIntersection(featureEl, true)
    })
    expect(result.current.activeSection).toBe('FEATURE')
    
    // Scroll down: FEATURE + IMPROVEMENT visible
    act(() => {
      triggerIntersection(improvementEl, true)
    })
    expect(result.current.activeSection).toBe('FEATURE') // Still topmost
    expect(result.current.visibleSections.size).toBe(2)
    
    // Scroll more: FEATURE out, IMPROVEMENT + BUGFIX visible
    act(() => {
      triggerIntersection(featureEl, false)
      triggerIntersection(bugfixEl, true)
    })
    expect(result.current.activeSection).toBe('IMPROVEMENT')
    expect(result.current.visibleSections.has('FEATURE')).toBe(false)
    expect(result.current.visibleSections.has('IMPROVEMENT')).toBe(true)
    expect(result.current.visibleSections.has('BUGFIX')).toBe(true)
    
    // Cleanup
    document.body.removeChild(featureEl)
    document.body.removeChild(improvementEl)
    document.body.removeChild(bugfixEl)
  })
  
  it('should provide scrollToSection function', () => {
    const sectionRefs = new Map<ChangeType, HTMLDivElement | null>()
    
    const { result } = renderHook(() => 
      useSectionObserver(sectionRefs, {}, 'v1.0.0')
    )
    
    expect(typeof result.current.scrollToSection).toBe('function')
  })
  
  it('should handle empty refs gracefully', async () => {
    const sectionRefs = new Map<ChangeType, HTMLDivElement | null>()
    
    const { result } = renderHook(() => 
      useSectionObserver(sectionRefs, {}, 'v1.0.0')
    )
    
    // Should not crash with empty refs
    expect(result.current.activeSection).toBeNull()
    expect(result.current.visibleSections.size).toBe(0)
  })
})
```

### 4. Required `data-testid` Attributes

#### In `src/routes/tools/$slug/releases/$version.tsx`:

```typescript
// Main content wrapper (around line 256)
<motion.div
  data-testid="release-content"
  initial="hidden"
  animate="visible"
  // ... rest of props
>

// Version List at bottom (around line 392)
<VersionList
  data-testid="version-list"
  toolSlug={slug}
  currentVersion={version}
  versions={allVersions}
/>
```

#### In `src/components/changelog/release/section-nav.tsx`:

```typescript
// Add to the nav container
<nav data-testid="section-nav" className="...">
  {/* ... */}
</nav>

// Add to each nav item button
<button
  data-active={isActive ? "true" : "false"}
  // ... rest of props
>
```

#### In `src/components/changelog/release/version-picker-sheet.tsx`:

```typescript
// Add to the sheet container
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent data-testid="version-picker-sheet" /* ... */>
    {/* ... */}
  </SheetContent>
</Sheet>
```

### 5. E2E Tests (`tests/e2e/pages/release-detail.spec.ts`)

```typescript
import { expect, test } from '@playwright/test'

const TEST_TOOL = 'codex'

test.describe('Release Detail Page', () => {
  test.describe('Page Load & Content', () => {
    test('loads release page with content', async ({ page }) => {
      await page.goto(`/tools/${TEST_TOOL}`)
      
      const releaseLink = page.getByRole('link', { name: /Version .* released/i }).first()
      await releaseLink.click()
      
      await expect(page).toHaveURL(/\/tools\/.*\/releases\/.*/)
      await expect(page.locator('[data-testid="release-content"]')).toBeVisible()
    })
    
    test('displays change sections correctly', async ({ page }) => {
      await page.goto(`/tools/${TEST_TOOL}`)
      const releaseLink = page.getByRole('link', { name: /Version .* released/i }).first()
      await releaseLink.click()
      
      // Should have at least one change section
      const sections = page.locator('[data-testid^="section-"]')
      await expect(sections.first()).toBeVisible()
    })
    
    test('has correct meta tags', async ({ page }) => {
      await page.goto(`/tools/${TEST_TOOL}`)
      const releaseLink = page.getByRole('link', { name: /Version .* released/i }).first()
      await releaseLink.click()
      
      const ogImage = page.locator('meta[property="og:image"]')
      await expect(ogImage).toHaveCount(1)
      
      const content = await ogImage.getAttribute('content')
      expect(content).toContain('/og/tools/')
      expect(content).toContain('/releases/')
    })
  })
  
  test.describe('Section Navigation Sidebar', () => {
    test('sidebar is visible on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.goto(`/tools/${TEST_TOOL}`)
      
      const releaseLink = page.getByRole('link', { name: /Version .* released/i }).first()
      await releaseLink.click()
      
      await expect(page).toHaveURL(/\/releases\//)
      
      const sidebar = page.locator('[data-testid="section-nav"]')
      await expect(sidebar).toBeVisible({ timeout: 5000 })
    })
    
    test('sidebar highlights active section on scroll', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.goto(`/tools/${TEST_TOOL}`)
      
      const releaseLink = page.getByRole('link', { name: /Version .* released/i }).first()
      await releaseLink.click()
      
      await page.waitForSelector('[data-testid="section-nav"]', { timeout: 5000 })
      
      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 500))
      await page.waitForTimeout(500) // Wait for intersection observer
      
      // Check that an active indicator exists
      const activeItem = page.locator('[data-testid="section-nav"] [data-active="true"]')
      await expect(activeItem).toBeVisible()
    })
    
    test('clicking sidebar item scrolls to section', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.goto(`/tools/${TEST_TOOL}`)
      
      const releaseLink = page.getByRole('link', { name: /Version .* released/i }).first()
      await releaseLink.click()
      
      await page.waitForSelector('[data-testid="section-nav"]', { timeout: 5000 })
      
      // Click on a section nav item
      const navItem = page.locator('[data-testid="section-nav"] button').first()
      await navItem.click()
      
      // Wait for smooth scroll
      await page.waitForTimeout(500)
    })
  })
  
  test.describe('Version Switching - Critical Bug Regression', () => {
    test('sidebar works correctly after client-side navigation between versions', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 })
      
      // 1. Navigate to tool page
      await page.goto(`/tools/${TEST_TOOL}`)
      
      // 2. Click on first release
      const firstReleaseLink = page.getByRole('link', { name: /Version .* released/i }).first()
      await firstReleaseLink.click()
      await expect(page).toHaveURL(/\/releases\//)
      
      // 3. Wait for sidebar and verify it works
      await page.waitForSelector('[data-testid="section-nav"]', { timeout: 5000 })
      
      // Scroll to verify observer is working
      await page.evaluate(() => window.scrollTo(0, 300))
      await page.waitForTimeout(500)
      
      const activeItemBefore = page.locator('[data-testid="section-nav"] [data-active="true"]')
      await expect(activeItemBefore).toBeVisible()
      
      // 4. Click on a different version in Version List
      const versionList = page.locator('[data-testid="version-list"]')
      await expect(versionList).toBeVisible()
      
      const differentVersion = versionList.locator('a').nth(1) // Second version
      await differentVersion.click()
      
      // Wait for new page content to load
      await page.waitForTimeout(1000)
      
      // 5. Scroll and verify sidebar STILL works (this was the bug)
      await page.evaluate(() => window.scrollTo(0, 0)) // Scroll to top first
      await page.waitForTimeout(300)
      
      await page.evaluate(() => window.scrollTo(0, 500)) // Scroll down
      await page.waitForTimeout(500)
      
      // The sidebar should update and show an active section
      const activeItemAfter = page.locator('[data-testid="section-nav"] [data-active="true"]')
      await expect(activeItemAfter).toBeVisible({ timeout: 5000 })
    })
    
    test('sidebar resets and re-initializes on version switch', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.goto(`/tools/${TEST_TOOL}`)
      
      const releaseLink = page.getByRole('link', { name: /Version .* released/i }).first()
      await releaseLink.click()
      
      await page.waitForSelector('[data-testid="section-nav"]', { timeout: 5000 })
      
      const urlBefore = page.url()
      
      const versionList = page.locator('[data-testid="version-list"]')
      const differentVersion = versionList.locator('a').nth(1)
      await differentVersion.click()
      
      await page.waitForURL((url) => url.href !== urlBefore)
      await page.waitForTimeout(500)
      
      // Sidebar should still be visible
      await expect(page.locator('[data-testid="section-nav"]')).toBeVisible()
    })
  })
  
  test.describe('Keyboard Navigation', () => {
    test('pressing "n" navigates to next version', async ({ page }) => {
      await page.goto(`/tools/${TEST_TOOL}`)
      const releaseLink = page.getByRole('link', { name: /Version .* released/i }).first()
      await releaseLink.click()
      
      await page.keyboard.press('n')
      await page.waitForTimeout(500)
    })
    
    test('pressing "p" navigates to previous version', async ({ page }) => {
      await page.goto(`/tools/${TEST_TOOL}`)
      const releaseLink = page.getByRole('link', { name: /Version .* released/i }).first()
      await releaseLink.click()
      
      await page.keyboard.press('p')
      await page.waitForTimeout(500)
    })
  })
  
  test.describe('Mobile Version Picker', () => {
    test('FAB opens version picker on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
      await page.goto(`/tools/${TEST_TOOL}`)
      
      const releaseLink = page.getByRole('link', { name: /Version .* released/i }).first()
      await releaseLink.click()
      
      const fab = page.locator('button[aria-label="Open version picker"]')
      await expect(fab).toBeVisible({ timeout: 5000 })
      
      await fab.click()
      
      const sheet = page.locator('[data-testid="version-picker-sheet"]')
      await expect(sheet).toBeVisible()
    })
  })
})
```

## Technical Considerations

### IntersectionObserver Mock Accuracy

**Challenge**: Mocking `IntersectionObserver` doesn't perfectly replicate browser behavior (async timing, threshold calculations, etc.).

**Mitigation**:
- Unit tests verify **logic** (ref management, state updates, version changes)
- E2E tests verify **behavior** (actual scrolling, real observer, timing)
- This dual-layer approach provides comprehensive coverage

### Test Data Dependencies

**Challenge**: E2E tests depend on seeded database with specific tools and versions.

**Mitigation**:
- Use `TOOLS_TO_TEST = ['codex', 'cursor']` (tools with 60 releases in E2E snapshot)
- Use pattern matching (`/Version .* released/i`) instead of exact text
- Use `data-testid` for stable selectors (not affected by content changes)

### Timing and Race Conditions

**Challenge**: The hook uses a retry mechanism with delays, E2E tests involve animations and scrolling.

**Mitigation**:
- Unit tests: Use `waitFor` with generous timeouts (1000ms)
- E2E tests: Use explicit `page.waitForSelector` and `page.waitForTimeout`
- Playwright's auto-waiting for most assertions reduces flakiness

### jsdom Environment Configuration

**Challenge**: Vitest defaults to `node` environment, need `jsdom` for DOM APIs.

**Solution**: Use inline directive `// @vitest-environment jsdom` at the top of test files. This is preferred over modifying `vite.config.ts` because:
- Other tests don't need jsdom (server functions, parsers)
- Explicit per-file configuration is clearer
- No risk of breaking existing tests

### React 19 Compatibility

**Challenge**: Testing Library React 19 support may have edge cases.

**Current status**: `@testing-library/react@16.2.0` supports React 19.

**Mitigation**: Monitor for warnings, update if needed.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Flaky E2E tests due to timing | Medium | Medium | Use generous timeouts, explicit waits, Playwright retries (2 in CI) |
| Mock doesn't match real observer | Low | Low | Supplement with E2E tests using real browser |
| Test data changes break tests | Low | Medium | Use patterns and `data-testid`, not exact values |
| jsdom conflicts with other tests | Low | Medium | Use inline `@vitest-environment` directive per file |
| Hook tests are slow (DOM manipulation) | Low | Low | jsdom is fast, ~100ms per test acceptable |

## Verification Strategy

### Unit Tests

```bash
# Run hook tests specifically
pnpm test tests/hooks/use-section-observer.test.ts

# Run with coverage
pnpm test --coverage tests/hooks/

# Expected output:
# ✓ tests/hooks/use-section-observer.test.ts (7 tests) 800ms
#   ✓ should initialize with null activeSection and empty visibleSections
#   ✓ should track visible sections when they intersect
#   ✓ should select topmost visible section as active
#   ✓ should reset state and clear refs when version changes
#   ✓ should handle multiple visibility changes correctly
#   ✓ should provide scrollToSection function
#   ✓ should handle empty refs gracefully
```

### E2E Tests

```bash
# Run release detail tests
pnpm exec playwright test release-detail.spec.ts

# Run in headed mode for debugging
pnpm exec playwright test release-detail.spec.ts --headed

# Run specific test group
pnpm exec playwright test release-detail.spec.ts --grep "Version Switching"

# Run with UI for step-by-step debugging
pnpm exec playwright test release-detail.spec.ts --ui

# Expected output:
# ✓ Release Detail Page > Page Load & Content (3 tests)
# ✓ Release Detail Page > Section Navigation Sidebar (3 tests)
# ✓ Release Detail Page > Version Switching - Critical Bug Regression (2 tests)
# ✓ Release Detail Page > Keyboard Navigation (2 tests)
# ✓ Release Detail Page > Mobile Version Picker (1 test)
# Total: 11 tests passed
```

### Code Quality

```bash
# Format all test files
pnpm biome check --write tests/hooks/ tests/e2e/pages/release-detail.spec.ts

# Verify TypeScript types
pnpm exec tsc --noEmit tests/hooks/use-section-observer.test.ts
```

## Open Questions

1. **Should we test with different rootMargin and threshold options?**
   - **Answer**: Not critical. Default values are sufficient for current use case. Can add later if custom options are used.

2. **Should we add visual regression tests for the sidebar?**
   - **Answer**: Out of scope for this plan. Current tests verify functionality. Visual tests would require screenshot comparison setup.

3. **Should we test the retry mechanism's specific timing (50ms, 100ms, ...)?**
   - **Answer**: No. Testing exact delays is brittle and unnecessary. We verify the mechanism works (retries until elements found), not the exact timing.

4. **Should we add tests for the scrollToSection function?**
   - **Answer**: Yes, but simple - just verify it exists (done). E2E tests verify actual scrolling behavior.

## Documentation Updates

After implementation, update:

| Document | Update |
|----------|--------|
| `docs/guides/testing.md` | Add "Testing Custom Hooks" section with `useSectionObserver` as example |
| `docs/testing/browser-tests.md` | Document release detail page E2E coverage, add to test matrix |
| `docs/reference/hooks.md` | Update `useSectionObserver` documentation to reference tests |

## Success Criteria

- [ ] Unit tests pass: 7 test cases for `useSectionObserver`
- [ ] E2E tests pass: 11+ test cases for release detail page
- [ ] **Critical bug regression test passes** (version switching)
- [ ] Tests run in CI without flakiness (3 consecutive successful runs)
- [ ] Code coverage for `use-section-observer.ts` > 80%
- [ ] All tests complete in < 10 seconds (unit) and < 60 seconds (E2E)
- [ ] No warnings or errors in test output
- [ ] Documentation updated with testing patterns
- [ ] `data-testid` attributes added without breaking existing functionality

## Expected Results

| Metric | Expected |
|--------|----------|
| Unit test duration | < 1 second |
| E2E test duration | 30-60 seconds |
| Unit test pass rate | 100% |
| E2E test pass rate | 100% (may need retries in CI) |
| Code coverage (hook) | > 80% |
| Total test count | 18+ (7 unit + 11+ E2E) |

---

## Notes

- This testing plan was created after fixing a critical version-switching bug in the `useSectionObserver` hook
- The bug was caused by stale refs from previous version's DOM elements
- Tests focus heavily on the regression scenario to prevent future occurrences
- Both unit and E2E tests are necessary due to the timing-dependent nature of the bug
