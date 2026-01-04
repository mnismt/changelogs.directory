# Ingestion Pipeline Reference

> **Last verified**: 2025-12-05

This document provides a deep dive into the 7-phase changelog ingestion pipeline architecture used by all tools on Changelogs.directory.

## Architecture Overview

Every tool (Claude Code, Codex, Cursor) follows the same 7-phase pipeline:

```
┌─────────┐    ┌───────┐    ┌───────┐    ┌────────┐    ┌────────┐    ┌────────┐    ┌──────────┐
│ Setup   │ →  │ Fetch │ →  │ Parse │ →  │ Filter │ →  │ Enrich │ →  │ Upsert │ →  │ Finalize │
└─────────┘    └───────┘    └───────┘    └────────┘    └────────┘    └────────┘    └──────────┘
    1              2            3             4             5             6              7
```

**Phase Details**:
1. **Setup**: Load tool metadata, create FetchLog
2. **Fetch**: Get raw changelog data from source (source-specific)
3. **Parse**: Extract structured data from raw content (source-specific)
4. **Filter**: Skip unchanged releases (via content hash)
5. **Enrich**: LLM classification and summarization
6. **Upsert**: Save releases and changes to database
7. **Finalize**: Update FetchLog with metrics and status

**Key Principles**:
- **Idempotent**: Safe to re-run without duplicates
- **Resumable**: Can retry failed phases
- **Observable**: Comprehensive logging at each step
- **Graceful degradation**: LLM failures fall back to keyword classification

---

## Phase 1: Setup

**Purpose**: Initialize ingestion context and create audit log.

**File**: `steps/setup.ts` (generic, works for all tools)

**Steps**:
1. Query database for `Tool` record by slug
2. Validate `tool.isActive === true`
3. Create `FetchLog` record with `status: IN_PROGRESS`
4. Return `IngestionContext` object

**Output** (`IngestionContext`):
```typescript
{
  prisma: PrismaClient,    // Prisma v7+ requires driver adapter in workers
  tool: Tool,              // slug, sourceType, sourceUrl, sourceConfig
  fetchLog: FetchLog,      // id, startedAt
  startTime: number        // Date.now() for duration calculation
}
```

> **Prisma v7+**: Trigger.dev workers must initialize PrismaClient with a driver adapter:
> ```typescript
> import { PrismaPg } from '@prisma/adapter-pg'
> const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
> const prisma = new PrismaClient({ adapter })
> ```

**Error Handling**:
- Tool not found → Return `{ skipped: true, reason: 'Tool not found' }`
- Tool inactive → Return `{ skipped: true, reason: 'Tool is not active' }`

---

## Phase 2: Fetch

**Purpose**: Retrieve raw changelog data from external source.

**File**: `steps/fetch.ts` or `steps/fetch-pages.ts` (source-specific)

**Variants**:

### A. CHANGELOG_MD (Claude Code pattern)
```typescript
// Fetch raw markdown from GitHub
const response = await fetch(tool.sourceUrl, {
  headers: {
    'User-Agent': 'Changelogs.directory Bot',
    'If-None-Match': lastETag, // Caching
  },
})
const markdown = await response.text()
```

**Output**: `{ markdown: string, etag: string | null }`

### B. GITHUB_RELEASES (Codex pattern)
```typescript
// Paginated GitHub API requests
let page = 1
const allReleases: GitHubRelease[] = []

while (page <= maxPages) {
  const response = await fetch(
    `${tool.sourceUrl}?per_page=100&page=${page}`,
    { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
  )
  const releases = await response.json()
  if (releases.length === 0) break
  allReleases.push(...releases)
  page++
}
```

**Output**: `{ releases: GitHubRelease[] }`

### C. CUSTOM_API (Cursor pattern)
```typescript
// Multi-page HTML crawler with Redis caching
const pages = []
let pageNumber = 1

while (pageNumber <= maxPagesPerRun) {
  const pageUrl = pageNumber === 1 
    ? baseUrl 
    : `${baseUrl}/page/${pageNumber}`
  
  const response = await fetch(pageUrl)
  if (response.status === 404) break  // End of pagination
  
  const html = await response.text()
  pages.push({ url: pageUrl, pageNumber, html })

  // Check if reached cached release (incremental)
  const cachedSlug = await getCachedNewestRelease(toolSlug)
  if (foundInPage(html, cachedSlug)) break

  pageNumber++
}
```

**Output**: `{ pages: Array<{ url, pageNumber, html }>, cachedSlug }`

**Notes**:
- Selector `main#main.section.section--longform article` avoids duplicate articles from React hydration
- Cache keys: `cursor:latest-release:<toolSlug>` (no namespace; dev/prod share cache)
- User-Agent: `ChangelogsDirectoryBot/1.0 (+https://changelogs.directory)`
- Timeout: 30 seconds per request

### D. CUSTOM_API with Playwright (Antigravity pattern)

For client-side rendered SPAs (Angular, React, Vue), use Playwright to render JavaScript before extracting HTML:

```typescript
// src/trigger/ingest/<tool>/browser.ts
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

**Configuration** in `trigger.config.ts`:
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

**Output**: `{ html: string, fetchedAt: Date }`

**Notes**:
- Tasks using Playwright should set `maxDuration: 1200` (20 minutes) for browser launch and rendering
- Wait for specific selector (e.g., `.grid-body.grid-container`) to ensure content is rendered
- Always close browser in `finally` block to prevent resource leaks

**Reference**: See `src/trigger/ingest/antigravity/` for complete implementation.

---

## Phase 3: Parse

**Purpose**: Extract structured `ParsedRelease[]` from raw content.

**File**: `steps/parse.ts` (source-specific, calls parser library)

**Common Parser Interface**:
```typescript
interface ParsedRelease {
  version: string           // "2.0.31"
  versionSort: string       // "0002.0000.0031.0000" (for semantic sorting)
  releaseDate?: Date        // From source or Git history
  title?: string            // Optional title
  headline: string          // One-line summary
  summary?: string          // 1-2 sentences (LLM generates if missing)
  rawContent: string        // Original markdown/HTML
  contentHash: string       // SHA256 for change detection
  changes: ParsedChange[]   // Array of bullet points
  isPrerelease?: boolean    // For GitHub Releases
  sourceUrl?: string        // Direct link to this release
}

interface ParsedChange {
  title: string             // "Fix: Database connection pooling"
  description?: string      // Extended description
  type?: ChangeType         // FEATURE, BUGFIX, etc. (refined by LLM)
}
```

**Parsers by Source Type**:

| Source Type | Parser | Location |
|-------------|--------|----------|
| CHANGELOG_MD | `parseChangelogMd()` | `src/lib/parsers/changelog-md.ts` |
| GITHUB_RELEASES | `parseGitHubReleases()` | `src/lib/parsers/github-releases.ts` |
| CUSTOM_API | Custom implementation | `src/trigger/ingest/<tool>/steps/parse.ts` |

**Version Sorting**:
Semantic version sorting requires padding each segment:
```typescript
// Input: "2.0.31"
// Output: "0002.0000.0031.0000"

function createVersionSort(version: string): string {
  return version
    .split(/[.-]/)
    .map(segment => segment.padStart(4, '0'))
    .join('.')
    .padEnd(20, '.0000') // Ensure 4 segments minimum
}
```

**Content Hashing**:
```typescript
import { createHash } from 'crypto'

const contentHash = createHash('sha256')
  .update(rawContent)
  .digest('hex')
```

**Output**: `{ releases: ParsedRelease[] }`

---

## Phase 4: Filter

**Purpose**: Skip releases that haven't changed (optimize LLM costs and database writes).

**File**: `steps/filter.ts` (generic, works for all tools)

**Algorithm**:
```typescript
// 1. Query existing releases from database
const existingReleases = await prisma.release.findMany({
  where: {
    toolId: ctx.tool.id,
    version: { in: parsedVersions },
  },
  select: { version: true, contentHash: true },
})

// 2. Build lookup map
const hashMap = new Map(
  existingReleases.map(r => [r.version, r.contentHash])
)

// 3. Filter unchanged releases
const toEnrich = parsedReleases.filter(release => {
  const existingHash = hashMap.get(release.version)
  return !existingHash || existingHash !== release.contentHash
})
```

**Output**: `{ releasesToEnrich: ParsedRelease[], releasesSkipped: number }`

**Benefits**:
- Saves ~$0.05-0.10 per run by skipping LLM calls for unchanged releases
- Reduces database writes
- Faster ingestion (no unnecessary upserts)

**Special Case**: `retryVersions` parameter
Can force re-processing of specific versions even if unchanged:
```typescript
const toEnrich = parsedReleases.filter(release => {
  if (retryVersions.includes(release.version)) return true // Force retry
  const existingHash = hashMap.get(release.version)
  return !existingHash || existingHash !== release.contentHash
})
```

---

## Phase 5: Enrich

**Purpose**: Use LLM to classify changes and generate concise summaries.

**File**: `steps/enrich.ts` (generic, works for all tools)

**LLM Provider**: Google Vertex AI (Gemini 2.5 Flash)

**Cost**: ~$0.075 per 1M input tokens, ~$0.30 per 1M output tokens

**Process**:
```typescript
for (const release of releasesToEnrich) {
  const enriched = await enrichReleaseWithLLM(release, {
    previousRelease, // For context
    telemetry: braintrustLogger, // For observability
  })

  // LLM outputs:
  // - Change types: FEATURE, BUGFIX, IMPROVEMENT, SECURITY, BREAKING, DEPRECATION
  // - Impact levels: MAJOR, MINOR, PATCH
  // - Flags: isBreaking, isSecurity, isDeprecation
  // - Confidence scores (0-1)
  // - Headline: ≤140 characters
  // - Summary: ≤400 characters
  // - Key highlights: up to 3
}
```

**Fallback Logic**:
If LLM fails or confidence is low (<0.7), falls back to keyword-based classification:

```typescript
function classifyByKeywords(changeTitle: string): ChangeType {
  const lowerTitle = changeTitle.toLowerCase()

  if (lowerTitle.match(/fix|bug|patch|resolve|correct/)) return 'BUGFIX'
  if (lowerTitle.match(/feat|add|new|introduce/)) return 'FEATURE'
  if (lowerTitle.match(/improve|enhance|optimize|refactor/)) return 'IMPROVEMENT'
  if (lowerTitle.match(/security|vulnerability|cve/)) return 'SECURITY'
  if (lowerTitle.match(/breaking|incompatible/)) return 'BREAKING'
  if (lowerTitle.match(/deprecate|remove|delete/)) return 'DEPRECATION'
  return 'OTHER'
}
```

**Output**: `{ enrichedReleases: EnrichedRelease[] }`

**Observability**:
- Braintrust logging for LLM calls
- Cost tracking per run
- Fallback rate monitoring

---

## Phase 6: Upsert

**Purpose**: Save or update releases and changes in database.

**File**: `steps/upsert.ts` (generic, works for all tools)

**Algorithm**:
```typescript
for (const release of enrichedReleases) {
  const existing = await prisma.release.findUnique({
    where: { toolId_version: { toolId: ctx.tool.id, version: release.version } }
  })

  if (existing) {
    // Content changed: delete old changes, update release
    await prisma.change.deleteMany({ where: { releaseId: existing.id } })
    await prisma.release.update({
      where: { id: existing.id },
      data: {
        ...releaseData,
        changes: { create: release.changes },
      },
    })
  } else {
    // New release
    await prisma.release.create({
      data: {
        ...releaseData,
        tool: { connect: { id: ctx.tool.id } },
        changes: { create: release.changes },
      },
    })
  }
}
```

**Metrics Tracked**:
- `releasesNew`: Count of new releases created
- `releasesUpdated`: Count of existing releases updated
- `changesCreated`: Total changes inserted

**Output**: `{ releasesNew, releasesUpdated, changesCreated }`

**Transaction Isolation**:
- Each release upsert is atomic
- Changes are deleted/recreated in single transaction
- Prevents partial updates on failure

---

## Phase 7: Finalize

**Purpose**: Update audit logs and tool metadata.

**File**: `steps/finalize.ts` (generic, works for all tools)

**Success Path**:
```typescript
await prisma.tool.update({
  where: { id: ctx.tool.id },
  data: { lastFetchedAt: new Date() },
})

await prisma.fetchLog.update({
  where: { id: ctx.fetchLog.id },
  data: {
    status: 'SUCCESS',
    completedAt: new Date(),
    duration: Date.now() - ctx.startTime,
    releasesFound: parseResult.releases.length,
    releasesNew: upsertResult.releasesNew,
    releasesUpdated: upsertResult.releasesUpdated,
    changesCreated: upsertResult.changesCreated,
  },
})
```

**Failure Path** (called in catch block):
```typescript
await handleFailure(ctx, error)

// Updates FetchLog:
// - status: 'FAILED'
// - error: error.message
// - completedAt: new Date()
```

**Output**: None (side effects only)

---

## Error Handling

### Retry Strategy

Configured in `trigger.config.ts`:
```typescript
export default defineConfig({
  retries: {
    maxAttempts: 3,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 10000,
  }
})
```

**Backoff**: 1s → 2s → 4s

### Transient vs Permanent Errors

**Transient** (retryable):
- Network timeouts
- Rate limit errors (429)
- Temporary database connection errors

**Permanent** (not retryable):
- Tool not found (404)
- Invalid sourceUrl (invalid JSON, HTML parse errors)
- Database schema errors (missing columns)

---

## Performance Considerations

### Typical Run Times

| Tool | Releases | With LLM | Without LLM |
|------|----------|----------|-------------|
| Claude Code | ~141 | 2-5 min | 10-30 sec |
| Codex | ~50 | 1-2 min | 5-15 sec |
| Cursor | ~80 | 2-3 min | 10-20 sec |

### Optimization Strategies

1. **Filter Phase**: Skip unchanged releases (saves 80%+ of LLM calls)
2. **Caching**: Use ETags for CHANGELOG_MD, Redis for CUSTOM_API
3. **Parallel LLM Calls**: Enrich up to 5 releases concurrently
4. **Database Indexes**: Ensure `toolId_version` unique index exists
5. **Connection Pooling**: Prisma handles connection reuse automatically

### Cost Estimation

**Per Run** (141 releases, 500 changes):
- LLM: $0.05-0.10
- Trigger.dev: Free tier (<100,000 task runs/month)
- Database: Neon free tier (<0.5 GB)

**Monthly** (every 6 hours = 4x/day):
- LLM: $6-12/month
- Trigger.dev: Free
- Database: Free (if under 0.5 GB)

---

## Monitoring & Telemetry

### Trigger.dev Dashboard

- **Runs** tab: View all ingestion runs
- **Logs** tab: Real-time step-by-step logs
- **Duration**: Track performance over time

### FetchLog Table

Query recent runs:
```sql
SELECT
  t.slug,
  fl.status,
  fl.duration,
  fl.releases_found,
  fl.releases_new,
  fl.releases_updated,
  fl.changes_created,
  fl.started_at
FROM fetch_log fl
JOIN tool t ON fl.tool_id = t.id
ORDER BY fl.started_at DESC
LIMIT 10;
```

### Braintrust (LLM Observability)

If configured, tracks:
- LLM input/output tokens
- Cost per release
- Fallback rate
- Classification accuracy

---

## Advanced: Custom Source Types

### Implementing RSS_FEED (Future)

1. **Fetch**: Use RSS parser library
```typescript
import Parser from 'rss-parser'
const parser = new Parser()
const feed = await parser.parseURL(tool.sourceUrl)
```

2. **Parse**: Map RSS items to `ParsedRelease`
```typescript
const releases = feed.items.map(item => ({
  version: extractVersion(item.title),
  releaseDate: new Date(item.isoDate),
  rawContent: item.content,
  contentHash: createHash('sha256').update(item.content).digest('hex'),
  headline: item.title,
  changes: parseBullets(item.content),
}))
```

3. **Reuse**: All other phases (filter, enrich, upsert, finalize) work as-is

---

## See Also

- [guides/adding-a-tool.md](../guides/adding-a-tool.md) - Practical guide for adding tools
- [reference/parsers.md](parsers.md) - Parser development patterns
- [reference/database-schema.md](database-schema.md) - Database schema details
- [guides/environment-variables.md](../guides/environment-variables.md) - LLM and API credentials

---

**Questions?** Open an issue on GitHub or consult the [documentation index](../README.md).
