# E2E Testing Troubleshooting

> **Last verified**: 2026-01-11

Common issues and solutions for E2E testing.

---

## CI Failures

### Config Validation: Missing Logo Component

**Error**:
```
AssertionError: Logo component not found: src/components/logo/undefined
```

**Cause**: New tool added to `TOOL_REGISTRY` without updating `LOGO_COMPONENT_MAP` in the test file.

**Fix**:
1. Open `tests/e2e/config/tool-assets.test.ts`
2. Add mapping:
   ```typescript
   const LOGO_COMPONENT_MAP: Record<string, string> = {
     // ... existing
     "new-tool": "new-tool.tsx",
   };
   ```
3. Create the logo component file if it doesn't exist

---

### Config Validation: Missing OG Case

**Error**:
```
AssertionError: Missing case for 'new-tool' in getToolLogoSVG() switch statement
```

**Cause**: Tool added without OG image support.

**Fix**:
1. Open `src/lib/og-utils.tsx`
2. Add case to `getToolLogoSVG()`:
   ```typescript
   case "new-tool":
     return `<svg>...</svg>`;
   ```

---

### Browser Tests: Empty Database

**Error**:
```
Expected 20 release cards, got 0
```

**Cause**: E2E snapshot not imported before tests.

**Fix**:
1. Ensure CI workflow runs `pnpm seed:e2e` before tests
2. Check that the snapshot file exists: `tests/fixtures/e2e-db.snapshot.json.gz`
3. If missing, regenerate: `pnpm tsx scripts/export-e2e-snapshot.ts`

---

### Browser Tests: Bun Not Found

**Error**:
```
sh: bun: command not found
```

**Cause**: Bun not installed in CI runner.

**Fix**:
Ensure workflow includes Bun setup:
```yaml
- uses: oven-sh/setup-bun@v1
  with:
    bun-version: latest
```

---

### Browser Tests: Dev Server Timeout

**Error**:
```
Timed out waiting for server at http://localhost:5173
```

**Cause**: Dev server takes too long to start.

**Possible fixes**:
1. Increase timeout in `playwright.config.ts`:
   ```typescript
   webServer: {
     timeout: 180 * 1000,  // 3 minutes
   }
   ```
2. Check for build errors in CI logs
3. Ensure all dependencies are installed

---

### Browser Tests: Postgres Connection

**Error**:
```
Can't reach database server at localhost:5432
```

**Cause**: PostgreSQL service not ready or misconfigured.

**Fix**:
1. Check service configuration in workflow:
   ```yaml
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
   ```
2. Ensure `DATABASE_URL` matches service configuration

---

## Local Failures

### Playwright Not Installed

**Error**:
```
browserType.launch: Executable doesn't exist
```

**Fix**:
```bash
pnpm exec playwright install chromium
```

---

### Dev Server Already Running

**Error**:
```
Port 5173 is already in use
```

**Fix** (either):
1. Stop existing dev server
2. Or let Playwright reuse it (default in local mode)

---

### Database Not Seeded

**Error**:
```
Tool not found: codex
```

**Fix**:
```bash
pnpm seed:e2e
```

---

### Migrations Not Applied

**Error**:
```
The table `Tool` does not exist in the current database
```

**Fix**:
```bash
pnpm prisma migrate deploy
```

---

## Flaky Tests

### Element Not Visible in Time

**Error**:
```
Timeout 30000ms exceeded waiting for element
```

**Common causes**:
1. Selector changed in code
2. Animation delay
3. Network latency

**Fixes**:
1. Increase timeout for specific assertion:
   ```typescript
   await expect(element).toBeVisible({ timeout: 60000 });
   ```
2. Use auto-waiting assertions instead of `waitForTimeout`
3. Check if `data-testid` was removed from component

---

### Hover State Not Triggered

**Error**:
```
Expected background image to be visible
```

**Cause**: Hover not triggering in headless mode.

**Fix**:
```typescript
// Ensure element is in viewport first
await card.scrollIntoViewIfNeeded();
await card.hover();
// Add small delay for animation
await page.waitForTimeout(100);
await expect(background).toBeVisible();
```

---

### Infinite Scroll Not Loading

**Error**:
```
Expected count > 20, got 20
```

**Cause**: Scroll doesn't trigger intersection observer.

**Fix**:
```typescript
// Scroll multiple times to ensure trigger
await page.evaluate(() => {
  window.scrollTo(0, document.body.scrollHeight);
});
await page.waitForTimeout(500);

// Or use locator-based scroll
const sentinel = page.locator('[data-testid="load-more-sentinel"]');
await sentinel.scrollIntoViewIfNeeded();
```

---

## Debugging Tools

### Playwright UI Mode

Interactive debugging with DOM snapshots:

```bash
pnpm test:e2e:ui
```

Features:
- Step through test execution
- See DOM at each step
- Pick selectors from page
- Re-run individual tests

---

### Trace Viewer

View detailed trace of failed test:

```bash
pnpm exec playwright show-trace test-results/path/to/trace.zip
```

Includes:
- Network requests
- Console logs
- DOM snapshots
- Action timeline

---

### Headed Mode

Watch tests run in real browser:

```bash
pnpm test:e2e:headed
```

---

### Debug Single Test

Run specific test with debugging:

```bash
pnpm exec playwright test --grep "pagination" --debug
```

---

### Console Output

Add logging to tests:

```typescript
test("debug test", async ({ page }) => {
  await page.goto("/");
  
  // Log page title
  console.log("Title:", await page.title());
  
  // Log element count
  const count = await page.locator('[data-testid="tool-card"]').count();
  console.log("Tool cards:", count);
  
  // Log page content (truncated)
  const content = await page.content();
  console.log("HTML:", content.substring(0, 500));
});
```

---

### Screenshot on Demand

Capture screenshot during test:

```typescript
await page.screenshot({ path: "debug-screenshot.png" });
```

---

## Getting Help

### Check Existing Issues

Search for similar errors in:
- GitHub Issues
- Playwright GitHub Issues
- Stack Overflow

### Collect Debug Information

When reporting issues, include:
1. Full error message
2. Test file and test name
3. Playwright version: `pnpm exec playwright --version`
4. Node version: `node --version`
5. Trace file (if available)

---

## Related Documentation

- [E2E Architecture](e2e-architecture.md)
- [Browser Tests](browser-tests.md)
- [Snapshots](snapshots.md)
- [Playwright Debugging Guide](https://playwright.dev/docs/debug)
