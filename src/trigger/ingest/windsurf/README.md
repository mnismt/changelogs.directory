# Windsurf Ingestion Flow

Trigger.dev task that ingests Windsurf’s public changelog (`https://windsurf.com/changelog`) and normalizes each release into the shared `Tool → Release → Change` schema.

## Overview

- Single-page crawl (no pagination) that reads all release blocks (`div[id][class*="scroll-mt-10"]`).
- Preserves full HTML in `Release.rawContent`, normalizes URLs to absolute, and extracts change candidates from headings or fallback paragraphs.
- Caches the newest slug/hash in Redis to support incremental runs.
- Reuses the shared LLM enrichment step for change classification, impact, and summaries.

## Files

- Task: `src/trigger/ingest/windsurf/index.ts`
- Steps:
	- `steps/setup.ts`
	- `steps/fetch-page.ts`
	- `steps/parse.ts`
	- `steps/filter.ts`
	- `steps/enrich.ts`
	- `steps/upsert.ts`
	- `steps/finalize.ts`
- Parser & utilities:
	- `src/lib/parsers/windsurf-changelog.ts`
	- `src/trigger/ingest/windsurf/cache.ts`
	- `src/trigger/ingest/windsurf/config.ts`

## Phases

### Phase 1: Setup
- Load `Tool` (`slug: windsurf`) and ensure it is active.
- Create `FetchLog` with `IN_PROGRESS`.

### Phase 2: Fetch Page
- Resolve source config (base URL, selectors, max releases per run).
- Read latest cached slug/hash from Redis (`windsurf:<namespace>:latest-release:<slug>`).
- Fetch `/changelog` once (single page).

### Phase 3: Parse
- Use `parseWindsurfChangelog` to extract:
	- Version from the release container `id` (e.g., `1.12.36` → `windsurf-1.12.36`).
	- Date from `time` or header text.
	- Raw HTML with normalized absolute URLs.
	- Changes from h2–h4 headings; falls back to h1 + paragraphs when no subsections exist.
	- Change descriptions preserve paragraph breaks for model announcement posts.
- Track newest release (slug + hash) for cache updates.

### Phase 4: Filter
- Skip releases whose stored `contentHash` matches parsed hash.

### Phase 5: Enrich
- Call `enrichReleaseWithLLM` per release (same as other tools).
- Uses previous release context when available.

### Phase 6: Upsert
- Idempotent upsert by `(toolId, version)`.
- Re-create `Change` rows when content hashes differ.

### Phase 7: Finalize
- Update `Tool.lastFetchedAt`.
- Update `FetchLog` with metrics.
- Persist newest release `{ slug, contentHash, releaseDate }` to Redis.

## Configuration

Tool seed (`prisma/seed.ts`):
```ts
sourceType: 'CUSTOM_API',
sourceUrl: 'https://windsurf.com/changelog',
sourceConfig: {
	baseUrl: 'https://windsurf.com',
	startPath: '/changelog',
	releaseSelector: 'div[id][class*="scroll-mt-10"]',
	bodySelector: '.prose',
	maxReleasesPerRun: 200,
}
```

Environment variables:
```bash
# Optional – enables Redis-backed incremental caching
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
# Optional – namespace cache keys per environment
CACHE_NAMESPACE=dev
```

Without Redis the pipeline still works but will scan all releases each run (bounded by `maxReleasesPerRun`).

### Operational Flags

- Payload `forceFullRescan`: bypasses cached release and processes the full page.

## Scheduling

- Task ID: `ingest-windsurf`
- Schedule ID: `ingest-windsurf-schedule`
- Cron: `0 */6 * * *`
- Concurrency: 1
- Max duration: 20 minutes

## Testing

- Parser fixtures: `tests/fixtures/windsurf-changelog/*.html`
- Parser tests: `tests/lib/parsers/windsurf-changelog.test.ts`
- Step tests: `tests/trigger/ingest/windsurf/steps/*.test.ts`

Run targeted tests:
```bash
pnpm test tests/lib/parsers/windsurf-changelog.test.ts \
  tests/trigger/ingest/windsurf/steps/*.test.ts
```
