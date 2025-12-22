# Cursor Ingestion Flow

Trigger.dev task that ingests Cursor’s public changelog (`https://cursor.com/changelog`) and normalizes each article into the shared `Tool → Release → Change` schema.

## Overview

- Crawls every `<article>` inside `#main.section.section--longform` across paginated URLs (`/changelog`, `/changelog/page/2`, …).
- Preserves the full HTML (including images/videos) in `Release.rawContent` while extracting change candidates from headings/lists.
- Computes a deterministic content hash per article and stores the latest slug/hash in Redis so subsequent runs stop once previously ingested posts are seen.
- Reuses the shared LLM enrichment step for change classification, impact, and summaries.

## Files

- Task: `src/trigger/ingest/cursor/index.ts`
- Steps:
	- `steps/setup.ts`
	- `steps/fetch-pages.ts` (HTML crawler + pagination guard)
	- `steps/parse.ts` (article → release/change candidates)
	- `steps/filter.ts`
	- `steps/enrich.ts`
	- `steps/upsert.ts`
	- `steps/finalize.ts` (metrics + cache write)
- Parser & utilities:
	- `src/lib/parsers/cursor-changelog.ts`
	- `src/trigger/ingest/cursor/cache.ts`
	- `src/trigger/ingest/cursor/config.ts`

## Slug Format

Cursor changelog slugs can be:
- **Version numbers**: `major-minor` (e.g., `2-2`, `1-7`)
- **Named releases**: alphanumeric with hyphens (e.g., `enterprise-dec-2025`, `claude-support`)

The parser validates slugs with pattern `/^[a-z0-9]+(?:-[a-z0-9]+)*$/i`.

## Phases

### Phase 1: Setup
- Load `Tool` (`slug: cursor`) and ensure it is active.
- Create `FetchLog` with `IN_PROGRESS`.

### Phase 2: Fetch Pages (HTML)
- Resolve source config (base URL, selectors, pagination limits).
- Read latest cached slug/hash from Redis (`cursor:latest-release:<slug>`).
- Fetch `/changelog` and subsequent `/page/N` until:
	- Cached slug is encountered (incremental run), or
	- `maxPagesPerRun` (steady-state) / `initialPageCount` (first backfill) exhausted, or
	- Site returns 404 (end of pagination).
- Requests send `User-Agent: ChangelogsDirectoryBot/1.0`.

### Phase 3: Parse
- Use `node-html-parser` to extract:
	- Title from `h1`, `h2`, or `h3` (checks in order; Cursor switched from h2 to h1).
	- Permalink and datetime from `<time>` attribute.
	- Article HTML (`rawContent`) with normalized absolute URLs.
	- Change candidates from `h3/h4` sections (fallback to list items / body text).
- Generate deterministic `version` (`cursor-<slug>`), `versionSort`, and `contentHash`.
- Track the newest release (slug + content hash) for cache updates.

### Phase 4: Filter
- Batch query existing releases by version.
- Skip records whose stored `contentHash` matches the parsed hash.

### Phase 5: Enrich
- Call `enrichReleaseWithLLM` per release to classify change types, impact, and summaries (same flow as other tools).

### Phase 6: Upsert
- Idempotent upsert by `(toolId, version)`:
	- Re-create `Change` rows when content hashes differ.
	- Preserve `rawContent`, `summary`, `releaseDate`, and `sourceUrl` (article permalink).

### Phase 7: Finalize
- Update `Tool.lastFetchedAt`.
- Update `FetchLog` with metrics.
- Persist `{ slug, contentHash, releaseDate }` for the newest article to Redis for the next incremental crawl.

## Configuration

Tool seed (`prisma/seed.ts`):
```ts
sourceType: 'CUSTOM_API',
sourceUrl: 'https://cursor.com/changelog',
sourceConfig: {
  baseUrl: 'https://cursor.com',
  startPath: '/changelog',
  articleSelector: 'main#main.section.section--longform article',  // Uses main tag to avoid duplicate articles from React hydration
  bodySelector: '.prose',
  maxPagesPerRun: 6,
  initialPageCount: 40,
}
```

Environment variables:
```bash
# Optional – enables Redis-backed incremental caching (Upstash recommended)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Cache keys use format `cursor:latest-release:<toolSlug>` (no namespace prefix; dev and prod share cache since they read from the same source).

Without Redis the pipeline still works but always performs the configured page scan.

### Operational Flags

- `forceFullRescan` payload flag: bypasses cached releases and performs a full scan (useful after a DB reset or when cache is suspected to be stale).

## Scheduling

- Task ID: `ingest-cursor`
- Schedule ID: `ingest-cursor-schedule`
- Cron: `0 */6 * * *` (every 6 hours, aligned with other tools)
- Concurrency: 1
- Max duration: 5 minutes

## Testing

- Parser fixtures: `tests/fixtures/cursor-changelog/*.html`
- Parser tests: `tests/lib/parsers/cursor-changelog.test.ts`
- Step tests: `tests/trigger/ingest/cursor/steps/*.test.ts` (fetch-pages, parse, finalize, etc.)

Run targeted tests:
```bash
pnpm test tests/lib/parsers/cursor-changelog.test.ts \
  tests/trigger/ingest/cursor/steps/*.test.ts
```
