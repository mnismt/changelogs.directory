# Plan: Add Google Antigravity Tool

> **Status**: ✅ Implemented (2026-01-04)

## Summary

Add Google Antigravity (Google's AI-powered IDE agent) to the changelogs directory with a custom HTML parser and **Playwright integration** for client-side rendered content.

## Approach

This implementation requires:

1. **Playwright integration** - The changelog is a client-side rendered Angular SPA
2. **Custom HTML parser** - Sibling-pair structure (version + description divs)
3. **Standard ingestion pipeline** - 7-phase Trigger.dev task
4. **Version formatter** - Strip `antigravity-` prefix for display

### Antigravity Changelog Structure

Source URL: `https://antigravity.google/changelog`

The HTML is client-side rendered Angular. After Playwright renders the JavaScript:

```html
<div class="grid-body grid-container">
  <!-- Each release is a sibling pair: version + description -->
  <div class="version">
    <p class="body">1.13.3<br/>Dec 19, 2025</p>
  </div>
  <div class="description main-left-container">
    <h3 class="heading-7">Google Workspace Support</h3>
    <div class="accordion body">
      <div class="changes">
        <p>Higher, more frequently refreshed rate limits...</p>
      </div>
      <div class="expandable-items">
        <details>
          <summary>Improvements (1)</summary>
          <ul><li class="caption">...</li></ul>
        </details>
        <details>
          <summary>Fixes (0)</summary>
          <ul></ul>
        </details>
        <details>
          <summary>Patches (0)</summary>
          <ul></ul>
        </details>
      </div>
    </div>
  </div>
  <!-- Next release... -->
</div>
```

---

## Implementation Timeline

### Phase 1: Sequential (Dependencies)

| Order | Task | Files |
|-------|------|-------|
| 1 | Add Playwright dependencies | `package.json` |
| 2 | Configure Trigger.dev for Playwright | `trigger.config.ts` |
| 3 | Add Antigravity tool to seed | `prisma/seed.ts` |
| 4 | Create and register logo | `src/components/logo/antigravity.tsx`, `src/lib/tool-logos.tsx` |

### Phase 2: Parallel (Independent Work)

| Task | Files |
|------|-------|
| Create Antigravity HTML parser | `src/lib/parsers/antigravity-changelog.ts` |
| Create ingestion pipeline with Playwright | `src/trigger/ingest/antigravity/` (12 files) |
| Create parser tests | `tests/lib/parsers/antigravity-changelog.test.ts`, `tests/fixtures/` |
| Add version formatter | `src/lib/version-formatter.ts` |

### Phase 3: Sequential (Verification)

| Order | Task |
|-------|------|
| 1 | Run database seed |
| 2 | Run all tests |
| 3 | Test ingestion locally with Trigger.dev dev |
| 4 | Deploy to production |

---

## Key Implementation Details

### Playwright for SPA Rendering

The Antigravity changelog requires JavaScript to render. Initial HTTP fetch returns an empty HTML shell.

**File**: `src/trigger/ingest/antigravity/browser.ts`

```typescript
import { chromium } from 'playwright'

export async function fetchRenderedPage(
  url: string,
  options: { waitForSelector?: string; waitForTimeout?: number } = {}
): Promise<string> {
  const { waitForSelector, waitForTimeout = 5000 } = options
  const browser = await chromium.launch({ headless: true })

  try {
    const context = await browser.newContext({
      userAgent: 'ChangelogsDirectoryBot/1.0 (+https://changelogs.directory)',
    })
    const page = await context.newPage()

    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    })

    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 10000 })
    } else {
      await page.waitForTimeout(waitForTimeout)
    }

    return await page.content()
  } finally {
    await browser.close()
  }
}
```

**Configuration**: `trigger.config.ts`

```typescript
import { playwright } from '@trigger.dev/build/extensions/playwright'

build: {
  external: [
    'chromium-bidi/lib/cjs/bidiMapper/BidiMapper',
    'chromium-bidi/lib/cjs/cdp/CdpConnection',
  ],
  extensions: [
    playwright({ browsers: ['chromium'] }),
  ],
}
```

### Category Mapping

Antigravity has three categories: Improvements, Fixes, Patches. We map them to existing ChangeTypes:

```typescript
function mapCategoryToChangeType(category: string): ChangeType {
  switch (category.toLowerCase()) {
    case 'improvements': return 'IMPROVEMENT'
    case 'fixes': return 'BUGFIX'
    case 'patches': return 'BUGFIX'  // Map to existing type
    default: return 'OTHER'
  }
}
```

### Sibling-Pair Parser Pattern

Unlike Cursor (nested structure), Antigravity uses adjacent sibling divs:

```typescript
const versionDivs = gridBody.querySelectorAll('div.version')

for (const versionDiv of versionDivs) {
  const descriptionDiv = versionDiv.nextElementSibling
  if (!descriptionDiv?.classList.contains('description')) continue

  const release = transformRelease(versionDiv, descriptionDiv)
}
```

### Version Formatting

Versions are stored as `antigravity-1.13.3` and displayed as `v1.13.3`:

```typescript
function formatAntigravityVersion(version: string): string {
  const versionPart = version.replace(/^antigravity-/, '')
  return `v${versionPart}`
}
```

### Task Configuration

Higher timeout for Playwright browser rendering:

```typescript
export const ingestAntigravity = task({
  id: 'ingest-antigravity',
  queue: { concurrencyLimit: 1 },
  maxDuration: 1200,  // 20 minutes (for Playwright)
})

export const ingestAntigravitySchedule = schedules.task({
  id: 'ingest-antigravity-schedule',
  cron: '0 */6 * * *',  // Every 6 hours
})
```

---

## Files Changed

### Dependencies & Configuration

| File | Change |
|------|--------|
| `package.json` | Add `playwright`, `chromium-bidi` |
| `trigger.config.ts` | Add playwright extension and externals |

### Database & Assets

| File | Change |
|------|--------|
| `prisma/seed.ts` | Add Antigravity tool upsert |
| `src/components/logo/antigravity.tsx` | **CREATE** - Google "A" logo |
| `src/lib/tool-logos.tsx` | Register logo in logoMap |
| `public/images/tools/antigravity.png` | Tool page background |

### Parser

| File | Change |
|------|--------|
| `src/lib/parsers/antigravity-changelog.ts` | **CREATE** - HTML parser |
| `src/lib/version-formatter.ts` | Add Antigravity formatter |

### Ingestion Pipeline

| File | Change |
|------|--------|
| `src/trigger/ingest/antigravity/index.ts` | **CREATE** - Main task + schedule |
| `src/trigger/ingest/antigravity/types.ts` | **CREATE** - TypeScript interfaces |
| `src/trigger/ingest/antigravity/config.ts` | **CREATE** - Source config resolver |
| `src/trigger/ingest/antigravity/cache.ts` | **CREATE** - Redis caching |
| `src/trigger/ingest/antigravity/browser.ts` | **CREATE** - Playwright utility |
| `src/trigger/ingest/antigravity/steps/setup.ts` | **CREATE** |
| `src/trigger/ingest/antigravity/steps/fetch-page.ts` | **CREATE** - Uses Playwright |
| `src/trigger/ingest/antigravity/steps/parse.ts` | **CREATE** |
| `src/trigger/ingest/antigravity/steps/filter.ts` | **CREATE** |
| `src/trigger/ingest/antigravity/steps/enrich.ts` | **CREATE** |
| `src/trigger/ingest/antigravity/steps/upsert.ts` | **CREATE** |
| `src/trigger/ingest/antigravity/steps/finalize.ts` | **CREATE** |

### Tests

| File | Change |
|------|--------|
| `tests/fixtures/antigravity-changelog/sample.html` | **CREATE** - HTML fixture |
| `tests/lib/parsers/antigravity-changelog.test.ts` | **CREATE** - Parser tests |
| `tests/helpers/fixtures.ts` | Add fixture loader |

---

## Verification Checklist

- [x] Tool appears in database
- [x] Logo displays correctly
- [x] Playwright renders changelog page
- [x] Parser extracts all releases
- [x] Categories mapped correctly (Patches → BUGFIX)
- [x] Version formatter works (antigravity-1.13.3 → v1.13.3)
- [x] All 166 tests pass
- [x] Production build succeeds
- [x] Ingestion runs successfully
- [x] Releases appear on `/tools/antigravity`
