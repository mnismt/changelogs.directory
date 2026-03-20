# E2E Test Architecture

> **Last verified**: 2026-03-20

This document describes the architecture and design of the end-to-end testing suite for changelogs.directory.

## Overview

The E2E testing suite uses a **two-tier approach**:

1. **Configuration Validation** (Static) - Fast Vitest tests that validate file existence and configuration consistency without a browser
2. **Browser E2E Tests** (Dynamic) - Playwright tests that verify actual UI rendering and user flows, organized by route structure

This design enables:
- **Fast feedback** - Config tests run in ~500ms, catching missing assets immediately
- **Realistic testing** - Browser tests use production-derived data snapshots
- **CI efficiency** - Config tests fail fast before expensive browser tests run
- **Maintainability** - Route-based test organization mirrors the application structure

---

## Test Categories

### 1. Configuration Validation (Static)

**Purpose**: Catch missing or misconfigured tool assets before they cause runtime errors.

| Characteristic | Value |
|----------------|-------|
| Runner | Vitest |
| Location | `tests/e2e/config/` |
| Duration | ~500ms |
| Requirements | None (reads files only) |
| CI Stage | First (fast fail) |

**What it validates**:
- Every tool has a logo component file
- Every tool has a background image
- Every tool has an OG image switch case
- Every tool has an ingestion pipeline
- `TOOL_REGISTRY` and `prisma/seed.ts` are in sync

See [config-validation.md](config-validation.md) for details.

### 2. Browser E2E Tests (Dynamic)

**Purpose**: Verify actual UI rendering, navigation, and user flows.

| Characteristic | Value |
|----------------|-------|
| Runner | Playwright |
| Location | `tests/e2e/routes/` |
| Duration | ~30-60s |
| Requirements | Database with seeded data |
| CI Stage | Second (after config validation) |

**What it tests**:
- Homepage loads with hero, logo showcase, filters
- Tools directory displays all tool cards
- Tool detail pages load with releases
- Pagination/infinite scroll works
- OG image endpoints return valid PNGs
- Navigation between pages works
- Desktop/Mobile specific interactions

See [browser-tests.md](browser-tests.md) for details.

---

## Directory Structure

```
tests/e2e/
├── config/                      # Configuration validation (Vitest)
│   ├── tool-assets.test.ts     # Logo, images, OG, pipelines
│   └── database-sync.test.ts   # Registry ↔ seed.ts sync
├── routes/                      # Browser E2E (Playwright) - Mirrors src/routes/
│   ├── index.spec.ts           # Homepage
│   ├── og/
│   │   └── index.spec.ts       # OG image endpoint tests
│   └── tools/
│       ├── index.spec.ts       # /tools page tests
│       └── $slug/
│           ├── index.spec.ts   # Tool detail tests
│           └── releases/
│               └── $version/
│                   ├── desktop.spec.ts # Release page (desktop)
│                   └── mobile.spec.ts  # Release page (mobile)
└── utils/                       # Shared utilities
    ├── registry.ts             # TOOL_REGISTRY access helpers
    ├── fixtures.ts             # Custom Playwright fixtures
    └── release-helpers.ts      # Shared release page helpers

tests/fixtures/
└── e2e-db.snapshot.json.gz     # Production-derived test data
```

---

## Playwright Configuration

**File**: `playwright.config.ts`

```typescript
export default defineConfig({
  testDir: "./tests/e2e/pages",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
```

### Key Settings

| Setting | Local | CI | Purpose |
|---------|-------|-----|---------|
| `retries` | 0 | 2 | Handle flakiness in CI |
| `workers` | auto | 1 | Sequential execution in CI for stability |
| `reuseExistingServer` | true | false | Use running dev server locally |
| `trace` | on-first-retry | on-first-retry | Debug info on failures |
| `screenshot` | only-on-failure | only-on-failure | Visual debugging |
| `video` | retain-on-failure | retain-on-failure | Playback for debugging |

### Web Server

Playwright automatically starts the dev server before tests:
- **Command**: `pnpm dev`
- **URL**: `http://localhost:5173`
- **Timeout**: 120 seconds (allows for slow builds)

In local development, if the dev server is already running, Playwright reuses it.

---

## CI Integration

**File**: `.github/workflows/e2e.yml`

The CI workflow runs E2E tests in two stages:

### Stage 1: Configuration Validation

```yaml
config-validation:
  name: Configuration Validation
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
    - run: pnpm install
    - run: pnpm prisma generate
    - run: pnpm test:e2e:config
```

**Purpose**: Fast fail if tool configuration is incomplete. No database needed.

### Stage 2: Browser Tests

```yaml
browser-tests:
  name: Browser E2E Tests
  runs-on: ubuntu-latest
  needs: config-validation  # Only runs if config passes

  services:
    postgres:
      image: postgres:15
      env:
        POSTGRES_PASSWORD: postgres
        POSTGRES_DB: changelogs_test
      ports:
        - 5432:5432

  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
    - uses: oven-sh/setup-bun@v1
    - run: pnpm install
    - run: pnpm exec playwright install --with-deps chromium
    - name: Setup Database
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/changelogs_test
      run: |
        pnpm prisma migrate deploy
        pnpm seed:e2e
    - run: pnpm test:e2e
    - uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/
```

**Key points**:
- Runs **after** config validation passes (`needs: config-validation`)
- Spins up PostgreSQL service container
- Installs Bun (required for seed scripts)
- Seeds database with E2E snapshot (`pnpm seed:e2e`)
- Uploads artifacts on failure (reports, screenshots)

---

## Data Flow

### Test Data Strategy

Browser tests need realistic data to test pagination, rendering, and navigation. Instead of minimal seed data or mocks, we use **production-derived snapshots**.

```
Production DB
     │
     ▼ (scripts/export-e2e-snapshot.ts)
     │
tests/fixtures/e2e-db.snapshot.json.gz
     │
     ▼ (prisma/seed-e2e-snapshot.ts)
     │
CI PostgreSQL / Local DB
     │
     ▼ (pnpm dev starts)
     │
Playwright tests run
```

### Snapshot Contents

| Data | Count | Purpose |
|------|-------|---------|
| Tools | 7 (all registry tools) | Test tool pages, OG images |
| Releases | 60 for codex/cursor, 3 for others | Test pagination + basic rendering |
| Changes | All for releases | Test release detail pages |

See [snapshots.md](snapshots.md) for full documentation.

---

## Running Tests Locally

### Quick Start

```bash
# 1. Seed database with E2E snapshot
pnpm seed:e2e

# 2. Run browser tests (starts dev server automatically)
pnpm test:e2e

# Or run with UI for debugging
pnpm test:e2e:ui
```

### Prerequisites

1. **PostgreSQL running** with `DATABASE_URL` set
2. **Migrations applied**: `pnpm prisma migrate deploy`
3. **Dependencies installed**: `pnpm install`

### Running Specific Tests

```bash
# Run only homepage tests
pnpm exec playwright test homepage.spec.ts

# Run only OG image tests
pnpm exec playwright test og-images.spec.ts

# Run tests matching pattern
pnpm exec playwright test --grep "pagination"
```

---

## Adding New E2E Tests

### For a New Page

1. Create `tests/e2e/pages/{page-name}.spec.ts`
2. Follow existing patterns (see [browser-tests.md](browser-tests.md))
3. Use `data-testid` attributes for stable selectors
4. Run locally to verify: `pnpm test:e2e`

### For a New Tool

When adding a new tool to the registry, the config validation tests will automatically fail until you:

1. Add logo component file
2. Add background image
3. Add OG image switch case
4. Add ingestion pipeline
5. Add to database seed

Run `pnpm test:e2e:config` to see exactly what's missing.

---

## Debugging Failed Tests

### Playwright UI Mode

```bash
pnpm test:e2e:ui
```

Opens interactive UI where you can:
- Step through test execution
- See DOM snapshots at each step
- Inspect element selectors
- View network requests

### Trace Viewer

After a test fails, view the trace:

```bash
pnpm exec playwright show-trace test-results/{test-name}/trace.zip
```

### CI Artifacts

When tests fail in CI, download:
- `playwright-report/` - HTML report with screenshots
- `test-results/` - Traces and videos

---

## Performance Considerations

| Test Type | Target Duration | Actual |
|-----------|-----------------|--------|
| Config validation | < 1s | ~500ms |
| Browser tests (local) | < 60s | ~30-45s |
| Browser tests (CI) | < 3min | ~2min |
| Full suite (CI) | < 5min | ~3min |

### Optimization Strategies

1. **Config tests first** - Fast fail before browser tests
2. **Parallel execution** - Local tests run in parallel
3. **Minimal snapshot** - All 7 tools, with deep data (60 releases) only for codex/cursor
4. **Single browser** - Chromium only (sufficient coverage)
5. **Reuse dev server** - Don't restart for each test file

---

## Related Documentation

- [Config Validation Tests](config-validation.md)
- [Browser Tests](browser-tests.md)
- [Snapshots](snapshots.md)
- [Troubleshooting](troubleshooting.md)
- [Adding a Tool Guide](../guides/adding-a-tool.md)
