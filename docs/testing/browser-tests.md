# Browser E2E Tests

> **Last verified**: 2026-01-11

This document describes the Playwright browser tests that verify UI rendering and user flows.

## Overview

Browser tests use Playwright to automate a real browser and test the application as a user would experience it. They require:

- A running dev server (started automatically by Playwright)
- A seeded database (use `pnpm seed:e2e`)

---

## Test Files

### `homepage.spec.ts`

Tests the landing page (`/`).

| Test | What it verifies |
|------|------------------|
| `hero section is visible` | Hero section and H1 are visible |
| `logo showcase carousel displays logos` | Logo carousel renders with SVG logos |
| `tool filter buttons work` | Filter buttons are clickable, show pressed state |
| `search input is functional` | Search input accepts text |
| `navigate to tools directory` | "All tools" link navigates to `/tools` |
| `has correct meta tags` | Title contains "changelogs.directory", OG image exists |

**Selectors used**:
- `[data-testid="hero-section"]`
- `[data-testid="logo-showcase"]`
- `button[aria-label*="Filter by"]`
- `input[placeholder*="Search"]`
- `a:has-text("All tools")`

---

### `tools-directory.spec.ts`

Tests the tools listing page (`/tools`).

| Test | What it verifies |
|------|------------------|
| `page loads with heading and stats` | Heading, "Total Tools", "Total Releases" visible |
| `all tool cards are displayed` | Card count matches `TOOL_SLUGS.length` |
| `tool cards render correctly with logos` | Each card has visible logo |
| `background image appears on hover` | Hover triggers background image visibility |
| `clicking a tool card navigates to tool detail page` | Click navigates to `/tools/{slug}` |
| `page has correct OG meta tags` | OG image URL contains `/og/tools` |

**Selectors used**:
- `[data-testid="tool-card"]`
- `[data-testid="tool-card-{slug}"]`
- `[data-testid="tool-card-bg-{slug}"]`
- `a[href="/tools/{slug}"]`

**Note**: The test expects tool cards matching `TOOL_SLUGS.length` because the E2E snapshot includes all registered tools.

---

### `tool-detail.spec.ts`

Tests individual tool pages (`/tools/{slug}`).

| Test | What it verifies |
|------|------------------|
| `tool page loads for {slug}` | H1 and tool logo visible |
| `has og:image meta tag for {slug}` | OG image URL contains `/og/tools/{slug}` |
| `pagination and infinite scroll works for codex` | Initial 20 cards, scroll loads more |
| `navigate to release detail` | Click release link navigates to release page |

**Selectors used**:
- `[data-testid="tool-logo"]`
- `[data-testid="release-card"]`
- `a` with role `link` and name matching `/Version .* released/i`

**Pagination test details**:
- Initial load: 20 release cards
- After scroll: > 20 cards
- Uses `codex` or `cursor` which have 60 releases each in the snapshot (other tools have minimal releases for faster CI)

---

### `release-detail.spec.ts`

Tests release detail pages (`/tools/{slug}/releases/{version}`).

| Test | What it verifies |
|------|------------------|
| `loads release page with content` | Release content renders and is visible |
| `displays change sections` | Change sections render with stable test IDs |
| `sidebar highlights active section on scroll` | Section nav reacts to scrolling |
| `sidebar works after client-side version navigation` | Regression coverage for version-switching bug |
| `pressing n/p navigates versions` | Keyboard shortcuts change versions |
| `FAB opens version picker on mobile` | Mobile version sheet opens correctly |

**Notes**:
- Keyboard shortcuts are handled at the document level with a fallback redirect if client-side navigation fails; keep E2E assertions focused on the release content being visible after keypresses.
- Active-section checks should scroll to a real section and wait for the `[data-active="true"]` marker rather than relying on arbitrary scroll offsets.

**Selectors used**:
- `[data-testid="release-content"]`
- `[data-testid="section-nav"]`
- `[data-testid^="section-"]`
- `[data-testid="version-list"]`
- `[data-testid="version-picker-sheet"]`

---

### `og-images.spec.ts`

Tests OG image generation endpoints.

| Test | What it verifies |
|------|------------------|
| `GET /og returns PNG` | Status 200, content-type image/png, size > 1KB |
| `GET /og/tools returns PNG` | Status 200, content-type image/png |
| `GET /og/tools/{slug} returns PNG` | For each tool: status 200, content-type image/png |
| `OG image meta tag on /tools page is valid` | Meta tag URL is fetchable, returns valid PNG |

**Why this matters**:
- Missing OG image case = 500 error on social shares
- These tests catch issues before they reach production

---

## Data TestIDs Reference

Components should use `data-testid` attributes for stable test selectors.

| TestID | Component | File |
|--------|-----------|------|
| `hero-section` | Hero section container | Homepage |
| `logo-showcase` | Logo carousel | Homepage |
| `tool-card` | Tool card wrapper | Tools directory |
| `tool-card-{slug}` | Specific tool card | Tools directory |
| `tool-card-bg-{slug}` | Hover background image | Tools directory |
| `tool-logo` | Tool logo on detail page | Tool detail |
| `release-card` | Release card wrapper | Tool detail |
| `release-content` | Release page content wrapper | Release detail |
| `section-nav` | Desktop section navigation | Release detail |
| `section-{type}` | Release change section wrapper | Release detail |
| `version-list` | Version list container | Release detail |
| `version-picker-sheet` | Mobile version picker sheet | Release detail |

### Adding New TestIDs

When adding new components that need testing:

```tsx
// In component
<div data-testid="new-component">
  ...
</div>

// In test
const element = page.locator('[data-testid="new-component"]');
await expect(element).toBeVisible();
```

---

## Writing New Tests

### Basic Test Structure

```typescript
import { expect, test } from "@playwright/test";

test.describe("Page Name", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/path");
  });

  test("descriptive test name", async ({ page }) => {
    // Arrange: Set up any preconditions
    
    // Act: Perform the action
    await page.locator("selector").click();
    
    // Assert: Verify the result
    await expect(page.locator("result-selector")).toBeVisible();
  });
});
```

### Best Practices

#### Use Stable Selectors

**Prefer**:
```typescript
// data-testid (most stable)
page.locator('[data-testid="hero-section"]')

// Semantic roles
page.getByRole("heading", { name: /tools/i })
page.getByRole("link", { name: "All tools" })

// Text content (for user-facing text)
page.getByText("Total Releases")
```

**Avoid**:
```typescript
// Class names (can change)
page.locator(".hero-container")

// Complex CSS selectors
page.locator("div > div:nth-child(2) > span")
```

#### Wait for Elements Properly

**Prefer**:
```typescript
// Auto-waiting assertions
await expect(page.locator("selector")).toBeVisible();
await expect(page.locator("selector")).toHaveCount(5);
```

**Avoid**:
```typescript
// Arbitrary timeouts
await page.waitForTimeout(2000);
```

#### Test User Flows, Not Implementation

**Good**: Test that clicking a link navigates to the correct page
**Bad**: Test that a specific Redux action was dispatched

---

## Running Tests

### All Browser Tests

```bash
pnpm test:e2e
```

### Specific Test File

```bash
pnpm exec playwright test homepage.spec.ts
```

### Specific Test

```bash
pnpm exec playwright test --grep "pagination"
```

### UI Mode (Debugging)

```bash
pnpm test:e2e:ui
```

Opens interactive UI where you can:
- Step through tests
- See DOM snapshots
- Inspect selectors
- Re-run individual tests

### Headed Mode

```bash
pnpm test:e2e:headed
```

Runs tests with visible browser window.

---

## Debugging Failed Tests

### View Test Report

After running tests, open the HTML report:

```bash
pnpm exec playwright show-report
```

### View Traces

For failed tests with traces:

```bash
pnpm exec playwright show-trace test-results/path/to/trace.zip
```

### Screenshots

Failed tests automatically capture screenshots. Find them in `test-results/`.

### Console Logs

Add debugging output:

```typescript
test("my test", async ({ page }) => {
  await page.goto("/");
  
  // Log page content
  console.log(await page.content());
  
  // Log element count
  const count = await page.locator("selector").count();
  console.log(`Found ${count} elements`);
});
```

---

## Common Patterns

### Testing Navigation

```typescript
test("navigate to page", async ({ page }) => {
  await page.goto("/");
  
  await page.locator('a[href="/tools"]').click();
  
  await expect(page).toHaveURL("/tools");
});
```

### Testing Form Input

```typescript
test("search works", async ({ page }) => {
  const searchInput = page.locator('input[placeholder*="Search"]');
  
  await searchInput.fill("cursor");
  
  await expect(searchInput).toHaveValue("cursor");
});
```

### Testing Hover Effects

```typescript
test("hover shows background", async ({ page }) => {
  const card = page.locator('[data-testid="tool-card-codex"]');
  const background = page.locator('[data-testid="tool-card-bg-codex"]');
  
  await card.hover();
  
  await expect(background).toBeVisible();
});
```

### Testing API Endpoints

```typescript
test("API returns data", async ({ request }) => {
  const response = await request.get("/og");
  
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");
});
```

### Testing Infinite Scroll

```typescript
test("infinite scroll loads more", async ({ page }) => {
  await page.goto("/tools/codex");
  
  const cards = page.locator('[data-testid="release-card"]');
  
  // Initial count
  await expect(cards).toHaveCount(20);
  
  // Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  
  // Wait for more to load
  await expect(cards).not.toHaveCount(20, { timeout: 10000 });
  
  const newCount = await cards.count();
  expect(newCount).toBeGreaterThan(20);
});
```

---

## Related Documentation

- [E2E Architecture](e2e-architecture.md)
- [Snapshots](snapshots.md)
- [Troubleshooting](troubleshooting.md)
- [Playwright Documentation](https://playwright.dev)
