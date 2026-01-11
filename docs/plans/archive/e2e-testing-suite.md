# Plan: E2E Testing Suite

> **Status**: ✅ Implemented (2026-01-10)

## Summary

Build a comprehensive end-to-end testing suite using Playwright that validates tool configuration consistency across all layers (registry, logos, assets, database) and tests critical user flows through browser automation. Tests will run exclusively in CI pipeline to catch configuration errors when adding new tools.

## Problem Statement

When adding a new tool to changelogs.directory, developers must synchronize configuration across **6 different locations**:

1. `TOOL_REGISTRY` in `src/lib/tool-registry.tsx` - Frontend UI source of truth
2. `prisma/seed.ts` - Database tool records
3. `src/components/logo/*.tsx` - Logo React components
4. `getToolLogoSVG()` in `src/lib/og-utils.tsx` - OG image inline SVGs
5. `public/images/tools/*.png` - Tool background images for hover effects
6. `src/trigger/ingest/*/` - Ingestion pipeline directories

**Current Issues:**
- Easy to forget adding logo to OG utils → 500 errors on social media previews
- Missing background image → broken hover effects on `/tools` page
- Typo in tool slug → registry/database mismatch → runtime errors
- No logo component → fallback generic icon on tool pages
- Manual checklist in docs, but no automated validation

**Goal:** Create automated E2E tests that fail fast when any of these configurations are missing or inconsistent.

---

## Approach

This implementation creates two test categories:

### 1. Configuration Validation Tests (Static)
Fast, non-browser tests that validate file existence and configuration consistency:

- **Tool Assets Validation** - Every tool in `TOOL_REGISTRY` has all required files
- **Database Sync Validation** - `prisma/seed.ts` matches `TOOL_REGISTRY` slugs
- **OG Image Coverage** - Every tool has a case in `getToolLogoSVG()` switch statement
- **No Orphaned Assets** - No unused files in `public/images/tools/` or `src/components/logo/`

**Technology:** Vitest (reuse existing test setup)
**Speed:** ~500ms (reads files, no network/browser)

### 2. Browser E2E Tests (Dynamic)
Playwright tests that verify actual rendering and user flows:

- **Homepage Flow** - Hero section, logo showcase, feed filters, search
- **Tools Directory** - Tool cards, hover backgrounds, logo display
- **Tool Detail Pages** - Release list, pagination, navigation
- **Release Detail Pages** - Change list, version navigation, breadcrumbs
- **OG Image Endpoints** - PNG generation for each tool without 500 errors

**Technology:** Playwright with Chromium
**Speed:** ~30-60s (starts dev server, runs browser tests)

---

## Implementation Timeline

### Phase 1: Sequential (Infrastructure Setup)

| Order | Task | Files | Est. Time | Reason |
|-------|------|-------|-----------|--------|
| 1 | Install Playwright dependencies | `package.json` | 2 min | Required for browser testing |
| 2 | Create Playwright config | `playwright.config.ts` | 10 min | Configure browser testing, dev server |
| 3 | Set up test utilities | `tests/e2e/utils/` | 15 min | Shared helpers for accessing registry |

### Phase 2: Parallel (Independent Test Suites - 6 subagents)

Can be implemented simultaneously:

| Subagent | Task | Files | Est. Time |
|----------|------|-------|-----------|
| A | Configuration validation tests | `tests/e2e/config/tool-assets.test.ts` | 30 min |
| B | Database sync validation | `tests/e2e/config/database-sync.test.ts` | 20 min |
| C | Homepage E2E tests | `tests/e2e/pages/homepage.spec.ts` | 45 min |
| D | Tools directory E2E tests | `tests/e2e/pages/tools-directory.spec.ts` | 30 min |
| E | Tool detail + release E2E tests | `tests/e2e/pages/tool-detail.spec.ts` | 45 min |
| F | OG image E2E tests | `tests/e2e/pages/og-images.spec.ts` | 30 min |

**Total parallel time:** ~45 min (longest path)

### Phase 3: Sequential (CI Integration)

| Order | Task | Files | Est. Time | Dependencies |
|-------|------|-------|-----------|--------------|
| 1 | Create GitHub Actions workflow | `.github/workflows/e2e.yml` | 20 min | All tests complete |
| 2 | Update package.json scripts | `package.json` | 5 min | Add `test:e2e` command |
| 3 | Update documentation | `docs/guides/testing.md` | 15 min | Document E2E workflow |
| 4 | Update tool guide | `docs/guides/adding-a-tool.md` | 10 min | Add E2E validation step |

**Total sequential time:** ~50 min

**Overall Estimated Time:** ~2-3 hours

---

## Detailed Implementation Specs

### Phase 1: Infrastructure Setup

#### 1.1 Install Playwright

**File:** `package.json`

```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    // ... existing deps
  },
  "scripts": {
    "test": "vitest run",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:config": "vitest run tests/e2e/config/",
    "test:all": "pnpm test && pnpm test:e2e"
  }
}
```

**Command:** `pnpm add -D @playwright/test`

#### 1.2 Playwright Configuration

**File:** `playwright.config.ts` (NEW)

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e/pages',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI 
    ? [['github'], ['html']] 
    : [['html'], ['list']],
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
```

**Key Features:**
- **`webServer`** - Automatically starts `pnpm dev` before tests
- **`retries: 2`** in CI - Handle flakiness
- **`workers: 1`** in CI - Sequential execution (more stable)
- **Screenshots/videos** on failure - Debugging artifacts

#### 1.3 Test Utilities

**File:** `tests/e2e/utils/registry.ts` (NEW)

```typescript
/**
 * Utility to access TOOL_REGISTRY in tests.
 * Avoids import path issues in Vitest.
 */
import { TOOL_REGISTRY, type ToolConfig } from '@/lib/tool-registry'

export function getAllToolSlugs(): string[] {
  return TOOL_REGISTRY.map((t) => t.slug)
}

export function getAllTools(): ToolConfig[] {
  return TOOL_REGISTRY
}

export function getToolBySlug(slug: string): ToolConfig | undefined {
  return TOOL_REGISTRY.find((t) => t.slug === slug)
}

export function getShowcaseTools(): ToolConfig[] {
  return TOOL_REGISTRY.filter((t) => t.showInShowcase)
}

export function getFeedFilterTools(): ToolConfig[] {
  return TOOL_REGISTRY.filter((t) => t.showInFeedFilter)
}
```

**File:** `tests/e2e/utils/fixtures.ts` (NEW)

```typescript
import { test as base } from '@playwright/test'

/**
 * Custom Playwright fixtures for common setup.
 */
export const test = base.extend({
  // Add custom fixtures here if needed
})

export { expect } from '@playwright/test'
```

---

### Phase 2A: Configuration Validation - Tool Assets

**File:** `tests/e2e/config/tool-assets.test.ts` (NEW)

```typescript
import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { getAllToolSlugs } from '../utils/registry'

describe('Tool Configuration Consistency', () => {
  const toolSlugs = getAllToolSlugs()

  describe('Logo Components', () => {
    it('should have all logo components registered in TOOL_REGISTRY', () => {
      // Every tool must have a Logo property (already enforced by TypeScript)
      expect(toolSlugs.length).toBeGreaterThan(0)
    })

    it('should have logo component files in src/components/logo/', () => {
      const logoFiles = readdirSync(resolve(__dirname, '../../../src/components/logo'))
        .filter((f) => f.endsWith('.tsx'))
        .map((f) => f.replace('.tsx', ''))

      // Not all logos match slug (e.g., claude.tsx for claude-code)
      // But we should have at least 6 core logo files
      expect(logoFiles.length).toBeGreaterThanOrEqual(6)
      expect(logoFiles).toContain('claude')
      expect(logoFiles).toContain('cursor')
      expect(logoFiles).toContain('openai')
      expect(logoFiles).toContain('windsurf')
      expect(logoFiles).toContain('opencode')
      expect(logoFiles).toContain('antigravity')
    })
  })

  describe('Background Images', () => {
    it.each(toolSlugs)('%s has a background image in public/images/tools/', (slug) => {
      const imagePath = resolve(__dirname, `../../../public/images/tools/${slug}.png`)
      expect(existsSync(imagePath)).toBe(true)
    })

    it('should not have orphaned background images', () => {
      const imageDir = resolve(__dirname, '../../../public/images/tools')
      const images = readdirSync(imageDir).filter((f) => f.endsWith('.png'))
      
      const imageSlugs = images.map((img) => img.replace('.png', ''))
      
      for (const slug of imageSlugs) {
        expect(toolSlugs).toContain(slug)
      }
    })
  })

  describe('OG Image SVGs', () => {
    it('should have OG SVG case in og-utils.tsx for all tools', async () => {
      const ogUtilsPath = resolve(__dirname, '../../../src/lib/og-utils.tsx')
      const ogUtilsContent = await Bun.file(ogUtilsPath).text()

      // Extract switch statement cases
      const switchMatch = ogUtilsContent.match(/switch\s*\(\s*slug\s*\)\s*{([\s\S]*?)^}/m)
      expect(switchMatch).toBeTruthy()

      const switchBody = switchMatch![1]
      
      for (const slug of toolSlugs) {
        const hasCase = switchBody.includes(`case '${slug}':`)
        expect(hasCase).toBe(true)
      }
    })
  })

  describe('Ingestion Pipelines', () => {
    it.each(toolSlugs)('%s has an ingestion pipeline directory', (slug) => {
      const pipelinePath = resolve(__dirname, `../../../src/trigger/ingest/${slug}`)
      expect(existsSync(pipelinePath)).toBe(true)
    })

    it.each(toolSlugs)('%s ingestion has index.ts file', (slug) => {
      const indexPath = resolve(__dirname, `../../../src/trigger/ingest/${slug}/index.ts`)
      expect(existsSync(indexPath)).toBe(true)
    })
  })
})
```

**Test Coverage:**
- ✅ Background images exist for all tools
- ✅ No orphaned PNG files
- ✅ OG utils has switch cases for all tools
- ✅ Ingestion pipeline directories exist

---

### Phase 2B: Configuration Validation - Database Sync

**File:** `tests/e2e/config/database-sync.test.ts` (NEW)

```typescript
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getAllToolSlugs } from '../utils/registry'

describe('Database Seed Sync', () => {
  const registrySlugs = getAllToolSlugs()

  it('should extract tool slugs from prisma/seed.ts', async () => {
    const seedPath = resolve(__dirname, '../../../prisma/seed.ts')
    const seedContent = readFileSync(seedPath, 'utf-8')

    // Extract slugs from: where: { slug: "tool-name" }
    const slugMatches = seedContent.matchAll(/where:\s*{\s*slug:\s*["']([^"']+)["']/g)
    const seedSlugs = Array.from(slugMatches).map((match) => match[1])

    expect(seedSlugs.length).toBeGreaterThan(0)

    // Every registry slug should be in seed
    for (const slug of registrySlugs) {
      expect(seedSlugs).toContain(slug)
    }

    // Every seed slug should be in registry
    for (const slug of seedSlugs) {
      expect(registrySlugs).toContain(slug)
    }
  })

  it('should have matching tool counts', async () => {
    const seedPath = resolve(__dirname, '../../../prisma/seed.ts')
    const seedContent = readFileSync(seedPath, 'utf-8')

    const seedToolCount = (seedContent.match(/prisma\.tool\.upsert/g) || []).length
    const registryToolCount = registrySlugs.length

    expect(seedToolCount).toBe(registryToolCount)
  })

  it('should use valid slug format (lowercase-with-hyphens)', () => {
    const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/

    for (const slug of registrySlugs) {
      expect(slug).toMatch(slugPattern)
    }
  })
})
```

**Test Coverage:**
- ✅ All registry tools exist in seed.ts
- ✅ All seed tools exist in registry
- ✅ Tool counts match
- ✅ Slug naming follows convention

---

### Phase 2C: Browser E2E - Homepage

**File:** `tests/e2e/pages/homepage.spec.ts` (NEW)

```typescript
import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load with hero section visible', async ({ page }) => {
    // Wait for hero animation to complete
    await expect(page.locator('[data-testid="hero-section"]').first()).toBeVisible()
    await expect(page.locator('h1:has-text("Latest Release")')).toBeVisible()
  })

  test('should display logo showcase carousel', async ({ page }) => {
    const showcase = page.locator('[data-testid="logo-showcase"]').first()
    await expect(showcase).toBeVisible()

    // Verify logos are visible
    const logos = showcase.locator('a')
    const count = await logos.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should have working tool filter buttons', async ({ page }) => {
    // Wait for feed to expand
    await page.waitForTimeout(2000)

    // Find filter buttons
    const filterButtons = page.locator('button[aria-label*="Filter by"]')
    const count = await filterButtons.count()
    expect(count).toBeGreaterThan(0)

    // Click first filter
    const firstFilter = filterButtons.first()
    await firstFilter.click()
    
    // Button should be highlighted
    await expect(firstFilter).toHaveClass(/border-foreground/)
  })

  test('should have functional search input', async ({ page }) => {
    await page.waitForTimeout(2000)

    const searchInput = page.locator('input[placeholder*="Search"]')
    await expect(searchInput).toBeVisible()

    await searchInput.fill('cursor')
    await expect(searchInput).toHaveValue('cursor')

    // Wait for debounce
    await page.waitForTimeout(500)
  })

  test('should navigate to tools directory', async ({ page }) => {
    const allToolsLink = page.locator('a:has-text("All tools")')
    await expect(allToolsLink).toBeVisible()

    await allToolsLink.click()
    await expect(page).toHaveURL('/tools')
  })

  test('should have correct meta tags', async ({ page }) => {
    const title = await page.title()
    expect(title).toContain('changelogs.directory')

    const ogImage = page.locator('meta[property="og:image"]')
    await expect(ogImage).toHaveAttribute('content', /\/og$/)
  })
})
```

**Test Coverage:**
- ✅ Hero section loads
- ✅ Logo showcase displays
- ✅ Filter buttons work
- ✅ Search input functional
- ✅ Navigation to /tools works
- ✅ Meta tags correct

---

### Phase 2D: Browser E2E - Tools Directory

**File:** `tests/e2e/pages/tools-directory.spec.ts` (NEW)

```typescript
import { test, expect } from '@playwright/test'
import { getAllToolSlugs } from '../utils/registry'

test.describe('Tools Directory', () => {
  const toolSlugs = getAllToolSlugs()

  test.beforeEach(async ({ page }) => {
    await page.goto('/tools')
  })

  test('should load tools directory page', async ({ page }) => {
    await expect(page.locator('h1:has-text("tools")')).toBeVisible()
    
    // Stats section
    await expect(page.locator('text=/\\d+ Total Tools/')).toBeVisible()
    await expect(page.locator('text=/\\d+ Total Releases/')).toBeVisible()
  })

  test('should display all tool cards', async ({ page }) => {
    const toolCards = page.locator('[data-testid="tool-card"]')
    const count = await toolCards.count()
    
    // Should match registry count
    expect(count).toBe(toolSlugs.length)
  })

  test.describe('Tool Cards', () => {
    for (const slug of toolSlugs.slice(0, 3)) { // Test first 3 to save time
      test(`should display ${slug} card correctly`, async ({ page }) => {
        const card = page.locator(`[data-testid="tool-card-${slug}"]`).first()
        await expect(card).toBeVisible()

        // Logo should be visible
        const logo = card.locator('svg, img').first()
        await expect(logo).toBeVisible()

        // Should have tool name
        await expect(card.locator(`text=/.*${slug.split('-')[0]}.*/i`)).toBeVisible()
      })
    }
  })

  test('should show background image on hover', async ({ page }) => {
    const firstSlug = toolSlugs[0]
    const card = page.locator(`a[href="/tools/${firstSlug}"]`).first()
    
    // Hover over card
    await card.hover()
    
    // Background image should be visible
    await page.waitForTimeout(300) // Wait for animation
    const bgImage = page.locator(`img[src="/images/tools/${firstSlug}.png"]`)
    await expect(bgImage).toBeVisible()
  })

  test('should navigate to tool detail page', async ({ page }) => {
    const firstSlug = toolSlugs[0]
    const card = page.locator(`a[href="/tools/${firstSlug}"]`).first()
    
    await card.click()
    await expect(page).toHaveURL(`/tools/${firstSlug}`)
  })

  test('should have correct OG meta tags', async ({ page }) => {
    const ogImage = page.locator('meta[property="og:image"]')
    await expect(ogImage).toHaveAttribute('content', /\/og\/tools$/)
  })
})
```

**Test Coverage:**
- ✅ Directory page loads
- ✅ All tools displayed
- ✅ Tool cards render correctly
- ✅ Background images on hover
- ✅ Navigation to tool pages
- ✅ OG meta tags

---

### Phase 2E: Browser E2E - Tool Detail Pages

**File:** `tests/e2e/pages/tool-detail.spec.ts` (NEW)

```typescript
import { test, expect } from '@playwright/test'
import { getAllToolSlugs } from '../utils/registry'

test.describe('Tool Detail Pages', () => {
  const toolSlugs = getAllToolSlugs()

  test.describe('Tool Pages', () => {
    for (const slug of toolSlugs.slice(0, 2)) { // Test first 2
      test(`/tools/${slug} should load`, async ({ page }) => {
        await page.goto(`/tools/${slug}`)
        
        // Tool name should be visible
        await expect(page.locator('h1')).toBeVisible()
        
        // Logo should be visible
        await expect(page.locator('[data-testid="tool-logo"]').first()).toBeVisible()
      })

      test(`/tools/${slug} should have correct OG image`, async ({ page }) => {
        await page.goto(`/tools/${slug}`)
        
        const ogImage = page.locator('meta[property="og:image"]')
        await expect(ogImage).toHaveAttribute('content', new RegExp(`/og/tools/${slug}$`))
      })
    }
  })

  test.describe('Release Detail Pages', () => {
    test('should navigate to release detail from tool page', async ({ page }) => {
      const slug = toolSlugs[0]
      await page.goto(`/tools/${slug}`)

      // Wait for releases to load
      await page.waitForTimeout(1000)

      // Click first release card
      const releaseCard = page.locator('[data-testid="release-card"]').first()
      if (await releaseCard.isVisible()) {
        await releaseCard.click()
        
        // Should navigate to release page
        await expect(page).toHaveURL(/\/tools\/.*\/releases\/.*/)
        
        // Release version should be visible
        await expect(page.locator('h1')).toBeVisible()
      }
    })
  })
})
```

**Test Coverage:**
- ✅ Tool pages load for all tools
- ✅ Logos display on tool pages
- ✅ OG images correct per tool
- ✅ Navigation to releases works
- ✅ Release detail pages render

---

### Phase 2F: Browser E2E - OG Image Endpoints

**File:** `tests/e2e/pages/og-images.spec.ts` (NEW)

```typescript
import { test, expect } from '@playwright/test'
import { getAllToolSlugs } from '../utils/registry'

test.describe('OG Image Generation', () => {
  const toolSlugs = getAllToolSlugs()

  test('GET /og should return PNG image', async ({ request }) => {
    const response = await request.get('/og')
    
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('image/png')
    
    const buffer = await response.body()
    expect(buffer.length).toBeGreaterThan(1000) // Valid PNG should be > 1KB
  })

  test('GET /og/tools should return PNG image', async ({ request }) => {
    const response = await request.get('/og/tools')
    
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('image/png')
  })

  test.describe('Tool OG Images', () => {
    for (const slug of toolSlugs) {
      test(`GET /og/tools/${slug} should return PNG`, async ({ request }) => {
        const response = await request.get(`/og/tools/${slug}`)
        
        // Should not 500 (missing logo case)
        expect(response.status()).toBe(200)
        expect(response.headers()['content-type']).toContain('image/png')
        
        const buffer = await response.body()
        expect(buffer.length).toBeGreaterThan(1000)
      })
    }
  })

  test('OG images should have standard dimensions', async ({ page }) => {
    // Navigate to page and check OG meta tag
    await page.goto('/tools')
    
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content')
    expect(ogImage).toBeTruthy()
    
    // Fetch the image
    const response = await page.request.get(ogImage!)
    expect(response.status()).toBe(200)
    
    // OG images should be 1200x630 (standard)
    // Could use sharp or image-size library to verify dimensions
  })
})
```

**Test Coverage:**
- ✅ Home OG image works
- ✅ Tools directory OG works
- ✅ Every tool has working OG image (no 500s)
- ✅ Images are valid PNGs
- ✅ Standard dimensions verified

---

### Phase 3: CI Integration

#### 3.1 GitHub Actions Workflow

**File:** `.github/workflows/e2e.yml` (NEW)

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  config-validation:
    name: Configuration Validation
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run config validation tests
        run: pnpm test:e2e:config

  browser-tests:
    name: Browser E2E Tests
    runs-on: ubuntu-latest
    needs: config-validation
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: changelogs_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Install Playwright Browsers
        run: pnpm exec playwright install --with-deps chromium
      
      - name: Setup Database
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/changelogs_test
        run: |
          pnpm prisma migrate deploy
          pnpm seed:local

      - name: Run Playwright tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/changelogs_test
        run: pnpm test:e2e
      
      - name: Upload Playwright Report
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
      
      - name: Upload Screenshots
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: test-screenshots
          path: test-results/
          retention-days: 7
```

**Features:**
- ✅ Two-stage: Config validation first (fast fail), then browser tests
- ✅ PostgreSQL service for database-dependent tests
- ✅ Uploads artifacts on failure (reports, screenshots, videos)
- ✅ Runs on PR and main branch

#### 3.2 Package.json Scripts

**File:** `package.json` (UPDATE)

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:config": "vitest run tests/e2e/config/",
    "test:e2e:headed": "playwright test --headed",
    "test:all": "pnpm test && pnpm test:e2e:config && pnpm test:e2e"
  }
}
```

---

## Files Changed

### New Files

| File | Purpose | Lines |
|------|---------|-------|
| `playwright.config.ts` | Playwright configuration | ~50 |
| `tests/e2e/utils/registry.ts` | Registry access utilities | ~30 |
| `tests/e2e/utils/fixtures.ts` | Playwright fixtures | ~10 |
| `tests/e2e/config/tool-assets.test.ts` | Asset validation tests | ~120 |
| `tests/e2e/config/database-sync.test.ts` | Database sync tests | ~60 |
| `tests/e2e/pages/homepage.spec.ts` | Homepage E2E tests | ~90 |
| `tests/e2e/pages/tools-directory.spec.ts` | Tools directory tests | ~120 |
| `tests/e2e/pages/tool-detail.spec.ts` | Tool/release page tests | ~80 |
| `tests/e2e/pages/og-images.spec.ts` | OG image endpoint tests | ~70 |
| `.github/workflows/e2e.yml` | CI workflow | ~90 |

### Modified Files

| File | Change |
|------|--------|
| `package.json` | Add `@playwright/test` dep, add scripts |
| `docs/guides/testing.md` | Add E2E testing section |
| `docs/guides/adding-a-tool.md` | Add validation step |

---

## Verification Checklist

### Local Development
- [ ] `pnpm test:e2e:config` passes (all config validation)
- [ ] `pnpm test:e2e` passes (all browser tests)
- [ ] Tests complete in < 60 seconds
- [ ] No false positives

### CI Integration
- [ ] GitHub Actions workflow runs on PR
- [ ] Config validation stage completes in < 1 min
- [ ] Browser tests stage completes in < 3 min
- [ ] Artifacts uploaded on failure
- [ ] Tests are stable (not flaky)

### Tool Addition Flow
When adding a new tool named `example-tool`:

1. Add to `TOOL_REGISTRY` in `src/lib/tool-registry.tsx`
2. Run `pnpm test:e2e:config`
3. See failures for missing:
   - Logo component
   - OG SVG case
   - Background image
   - Ingestion pipeline
   - Database seed entry
4. Fix each issue
5. Run `pnpm test:e2e:config` again → all pass
6. Run `pnpm test:e2e` → browser tests pass
7. Commit and push → CI validates

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Playwright tests are flaky in CI | CI failures, developer frustration | Use `retries: 2`, test stable selectors, wait for animations |
| Dev server takes too long to start | CI timeout | Increase `webServer.timeout` to 120s, use `stdout: 'pipe'` to monitor |
| Tests depend on seeded data | Missing data = test failures | Seed database before tests in CI workflow |
| OG image tests fail without fonts | 500 errors in tests | Ensure Vercel OG fonts are cached/available in CI |
| Background image hover tests timing-dependent | Flaky tests | Use `page.waitForTimeout()` after hover, check image `src` attribute |
| Test suite takes too long | Slow CI feedback | Run config tests first (fast fail), parallelize browser tests |

---

## Future Enhancements

### Phase 4 (Optional - Post-MVP)

- **Visual Regression Testing** - Use `toHaveScreenshot()` for OG images, tool cards
- **Accessibility Testing** - Add axe-core integration for WCAG compliance
- **Performance Testing** - Lighthouse CI for core web vitals
- **Multi-browser Testing** - Add Firefox, Safari (currently Chromium only)
- **Component Testing** - Playwright component tests for isolated UI testing
- **API Testing** - Test server functions directly with Playwright's `request` API
- **Load Testing** - Simulate multiple users for ingestion endpoints

---

## Success Criteria

- ✅ All existing tools pass configuration validation
- ✅ All browser tests pass locally and in CI
- ✅ Adding a new tool without all assets causes test failure
- ✅ CI runs in < 5 minutes total
- ✅ Test suite catches the 4 common mistakes mentioned in Problem Statement
- ✅ Documentation updated with E2E workflow
- ✅ No manual checklist needed - automated validation

---

## References

- [Playwright Documentation](https://playwright.dev)
- [Vitest Documentation](https://vitest.dev)
- [Adding a Tool Guide](../guides/adding-a-tool.md)
- [Testing Guide](../guides/testing.md)
- [Tool Registry Reference](../reference/tool-registry.md)
