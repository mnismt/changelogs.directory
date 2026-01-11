# OpenCode Ingestion Flow

Trigger.dev task that ingests release notes from OpenCode via the GitHub Releases API.

## Overview

Fetches releases from `https://api.github.com/repos/anomalyco/opencode/releases`, parses version info from release bodies, respects pre-release filtering from `sourceConfig`, enriches with LLM classification, and upserts into the database.

Key differences from Claude Code:
- Source is GitHub Releases API (not CHANGELOG.md)
- No git-history date step; uses `published_at` from API
- Pre-release handling via `includePreReleases` in `sourceConfig` (default: false)
- Version strings stripped from tag prefix `v` (e.g., `v1.2.0` → `1.2.0`)

## Files

- Task: `src/trigger/ingest/opencode/index.ts`
- Steps:
  - `steps/fetch.ts` (GitHub Releases API)
  - `steps/parse.ts` (normalize + pre-release handling)
  - `steps/filter.ts`
  - `steps/enrich.ts`
  - `steps/upsert.ts` (writes `isPrerelease`, `sourceUrl`)
  - `steps/finalize.ts`
- Parsers & utils:
  - `src/lib/github/releases.ts` (API fetcher)
  - `src/lib/parsers/github-releases.ts` (parser)
  - `src/lib/parsers/changelog-md-utils.ts` (shared helpers)

## Phases

### Phase 1: Setup
- Load tool from database (`slug: opencode` by default)
- Validate `isActive`
- Create `FetchLog` with `IN_PROGRESS`

### Phase 2: Fetch (GitHub Releases API)
- Paginated GET: `/repos/:owner/:repo/releases?per_page=100&page=N`
- Filters drafts by default; pre-releases filter configurable via `tool.sourceConfig.includePreReleases` (default: false)
- GitHub token support (5000/hr vs 60/hr)
- **Caching with ETag support:**
  - Always makes conditional request to GitHub with `If-None-Match: <etag>` header
  - 304 response → uses cached releases (data unchanged, ~300ms)
  - 200 response → fetches fresh data, updates cache (new releases, ~2-5s)
  - Cache TTL: 90 days (Redis)

### Phase 3: Parse
- Strip version prefix from tags (e.g., `v1.2.0` → `1.2.0`)
- Normalize null/empty bodies to empty string (some releases have `body: null`)
- Parse body sections into bullet changes
- Set `releaseDate` from `published_at`
- Compute `contentHash` from `body`
- Mark `isPrerelease: true` when `prerelease` is true from API

### Phase 4: Filter
- Batch-compare by `toolId + version` and `contentHash`
- Skip unchanged releases to avoid redundant enrichment

### Phase 5: Enrich
- LLM classification + summaries (batched per release)
- Falls back to keyword classification if LLM unavailable

### Phase 6: Upsert
- Idempotent upsert by `(toolId, version)`
- Writes: `versionSort`, `releaseDate`, `isPrerelease`, `sourceUrl` (GitHub release page), `rawContent`, `contentHash`, `title`, `summary`
- Replaces `changes` when content changed

### Phase 7: Finalize
- Update `Tool.lastFetchedAt`
- Update `FetchLog` with metrics and `SUCCESS`
- On error: `FAILED` with details

## Operational Overrides
- `forceFullRescan` is not wired for OpenCode; runs always use the cached GitHub releases flow.
- If you need a full refresh, clear cached releases (Redis) and re-run the task.

## Configuration

Tool seed (see `prisma/seed.ts`):
```ts
sourceType: 'GITHUB_RELEASES',
sourceUrl: 'https://api.github.com/repos/anomalyco/opencode/releases',
sourceConfig: {
  versionPrefix: 'v',
  includePreReleases: false,
}
```

Environment variables:
```bash
# Increases GitHub API rate limit to 5,000/hour
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Scheduling

- Task ID: `ingest-opencode`
- Schedule ID: `ingest-opencode-schedule`
- Cron: `0 */6 * * *` (every 6 hours)
- Concurrency: 1
- Max duration: 30 minutes

## Notes

- Pre-releases are excluded by default; set `includePreReleases: true` in `sourceConfig` to ingest them.
- `versionSort` ensures stable releases sort after pre-releases of the same base version.
