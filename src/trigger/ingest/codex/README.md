# Codex Ingestion Flow

Trigger.dev task that ingests release notes from OpenAI Codex via the GitHub Releases API.

## Overview

Fetches releases from `https://api.github.com/repos/openai/codex/releases`, parses version info and body sections (Highlights, Merged PRs), handles pre-releases (alpha/beta/rc), enriches with LLM classification, and upserts into the database.

Key differences from Claude Code:
- Source is GitHub Releases API (not CHANGELOG.md)
- No git-history date step; uses `published_at` from API
- Pre-release handling via `isPrerelease` boolean on Release
- Version strings stripped from tag prefix `rust-v` (e.g., `rust-v0.55.0` → `0.55.0`)

## Files

- Task: `src/trigger/ingest/codex/index.ts`
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
- Load tool from database (`slug: codex` by default)
- Validate `isActive`
- Create `FetchLog` with `IN_PROGRESS`

### Phase 2: Fetch (GitHub Releases API)
- Paginated GET: `/repos/:owner/:repo/releases?per_page=100&page=N`
- Filters drafts by default; pre-releases filter configurable via `tool.sourceConfig.includePreReleases` (default: true)
- GitHub token support (5000/hr vs 60/hr)

### Phase 3: Parse
- Strip version prefix from tags (e.g., `rust-v0.55.0` → `0.55.0`)
- Parse body sections:
  - `## Highlights` → high-impact items (FEATURE/IMPROVEMENT bias)
  - `## Merged PRs` → PR-linked items; builds links to `.../pull/<number>`
  - Fallback: flat bullet list
- Set `releaseDate` from `published_at`
- Compute `contentHash` from `body`
- Version sort handles pre-releases (alpha/beta/rc) with ordering like:
  - `0.54.0-alpha.1` < `0.54.0-alpha.2` < `0.54.0`
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

## Configuration

Tool seed (see `prisma/seed.ts`):
```ts
sourceType: 'GITHUB_RELEASES',
sourceUrl: 'https://api.github.com/repos/openai/codex/releases',
sourceConfig: {
  versionPrefix: 'rust-v',
  includePreReleases: true,
}
```

Environment variables:
```bash
# Increases GitHub API rate limit to 5,000/hour
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Scheduling

- Task ID: `ingest-codex`
- Schedule ID: `ingest-codex-schedule`
- Cron: `0 */6 * * *` (every 6 hours)
- Concurrency: 1
- Max duration: 5 minutes

## Notes

- Some alpha releases have empty bodies; pipeline creates the release with 0 changes.
- UI can filter pre-releases via `Release.isPrerelease`.
- `versionSort` ensures stable releases sort after pre-releases of the same base version.
