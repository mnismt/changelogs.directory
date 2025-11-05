# Claude Code Ingestion Flow

Trigger.dev task that ingests changelog data from Claude Code's GitHub repository.

## Overview

Fetches `CHANGELOG.md` from GitHub, extracts release dates from Git history, parses releases, enriches with LLM classification, and upserts to database.

## Phases

### Phase 1: Setup
- Load tool from database
- Validate tool is active (skip if inactive)
- Create `FetchLog` with `IN_PROGRESS` status

### Phase 2: Fetch
- Fetch changelog markdown from `tool.sourceUrl`
- Extract ETag for change detection
- Validate HTTP response

### Phase 2.5: Fetch Release Dates from Git History
- **NEW**: Analyze Git commit history to extract version-to-date mappings
- Parse repository URL from `tool.sourceUrl`
- Fetch commit history for `CHANGELOG.md` via GitHub API
- Extract version numbers from commit patches (e.g., `+## 2.0.33`)
- Build `Map<version, Date>` mapping versions to commit dates
- Supports optional `GITHUB_TOKEN` env var for higher rate limits (5000/hr vs 60/hr)
- **Graceful degradation**: If GitHub API fails, continues without dates
- **Use case**: Solves the problem of changelogs without dates in headers (e.g., Claude Code)

### Phase 3: Parse
- Extract structured data from markdown (synchronous)
- Parse releases, versions, dates, changes
- **Date priority**: Header dates → Git commit dates → undefined
- No LLM calls (fast extraction only)

### Phase 4: Filter
- Batch query existing releases from database
- Filter out releases with matching `contentHash`
- Only return releases that need enrichment (new or changed)
- Prevents redundant LLM calls for unchanged releases

### Phase 5: Enrich
- Classify changes with LLM (batched per release)
- Generate summaries and highlights
- Process filtered releases in parallel
- Falls back to keyword classification if LLM unavailable

### Phase 6: Upsert
- For each release:
  - Check if exists (by `toolId + version`)
  - If unchanged (content hash match): skip
  - If changed: update release, delete old changes, create new changes
  - If new: create release with changes

### Phase 7: Finalize
- Update `Tool.lastFetchedAt`
- Update `FetchLog` with `SUCCESS` status and metrics
- On failure: update `FetchLog` with `FAILED` status and error details

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          INGESTION PIPELINE                              │
└─────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────┐
  │  Phase 1: Setup │
  │ ───────────────│
  │ • Load tool     │
  │ • Validate      │
  │ • Create log    │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  Phase 2: Fetch │
  │ ───────────────│
  │ • Fetch CHANGELOG.md from GitHub                 │
  │ • Extract ETag                                    │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────────────────────────────────────┐
  │  Phase 2.5: Fetch Release Dates (Git History)   │
  │ ────────────────────────────────────────────────│
  │ • Parse repo URL from sourceUrl                  │
  │ • Fetch commit history via GitHub API            │
  │   GET /repos/:owner/:repo/commits?path=CHANGELOG.md │
  │ • For each commit:                                │
  │   - Fetch commit detail with patch                │
  │   - Extract versions from patch (+## X.Y.Z)       │
  │   - Map version → commit date                     │
  │ • Build Map<version, Date>                        │
  │ • Gracefully degrade if API fails                 │
  └────────┬────────────────────────────────────────┘
           │
           ▼
  ┌─────────────────────────────────────────────────┐
  │  Phase 3: Parse                                  │
  │ ────────────────────────────────────────────────│
  │ • Parse markdown into structured releases         │
  │ • Extract version, changes, rawContent            │
  │ • Date priority:                                  │
  │   1. Header date (## 2.0.31 - 2024-01-15)        │
  │   2. Git commit date (from Phase 2.5)            │
  │   3. undefined (no date available)                │
  │ • Compute contentHash for change detection        │
  └────────┬────────────────────────────────────────┘
           │
           ▼
  ┌─────────────────┐
  │ Phase 4: Filter │
  │ ────────────────│
  │ • Query existing releases by contentHash          │
  │ • Filter unchanged (skip enrichment)              │
  │ • Return only new/changed releases                │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Phase 5: Enrich │
  │ ────────────────│
  │ • LLM classification (parallel batched)           │
  │ • Generate summaries and highlights               │
  │ • Fallback to keyword classification              │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Phase 6: Upsert │
  │ ────────────────│
  │ • Upsert releases to database                     │
  │ • Create/update changes                           │
  │ • Track metrics (new/updated/skipped)             │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │Phase 7: Finalize│
  │ ────────────────│
  │ • Update Tool.lastFetchedAt                       │
  │ • Update FetchLog (SUCCESS/FAILED)                │
  │ • Record metrics                                  │
  └─────────────────┘
```

## Git History Date Extraction (Phase 2.5)

### Problem
Claude Code's `CHANGELOG.md` has version headers without dates:
```markdown
## 2.0.33
- Added feature X
```

Result: All releases show "Date unknown" in the UI.

### Solution
Trace release dates through Git commit history:

1. **Fetch commit history** for `CHANGELOG.md`:
   ```
   GET /repos/anthropics/claude-code/commits?path=CHANGELOG.md&per_page=100
   ```

2. **Analyze each commit's patch** to detect new versions:
   ```diff
   @@ -1,3 +1,7 @@
   +## 2.0.33
   +- Added feature X
   +
    ## 2.0.32
   ```
   → Detects version `2.0.33` was added in this commit

3. **Map version to commit date**:
   ```typescript
   versionDates.set('2.0.33', new Date('2024-01-15T10:30:00Z'))
   ```

4. **Parser uses as fallback**:
   ```typescript
   releaseDate = headerDate ?? versionDates.get(version) ?? undefined
   ```

### Benefits
- ✅ Accurate dates for all recent releases
- ✅ Backward compatible (works with or without Git dates)
- ✅ Graceful degradation (continues if GitHub API fails)
- ✅ Reusable for other GitHub-based changelog scrapers
- ✅ Efficient (caching prevents redundant API calls)

### Rate Limits
- **Unauthenticated**: 60 requests/hour (not sufficient for production)
- **Authenticated** (with `GITHUB_TOKEN`): 5,000 requests/hour ✅
- **Recommendation**: Set `GITHUB_TOKEN` environment variable

### Configuration
Optional environment variable:
```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

## Error Handling

- Failures update `FetchLog` with error details
- Task retries handled by Trigger.dev retry logic
- Partial context recovery attempts on failure
- **Phase 2.5 failures are non-blocking** (gracefully continues without dates)

## Configuration

- **Task ID**: `ingest-claude-code`
- **Schedule ID**: `ingest-claude-code-schedule`
- **Schedule**: Every 6 hours (cron: `0 */6 * * *`)
- **Concurrency**: 1 (prevents duplicate runs)
- **Max Duration**: 5 minutes
- **Default Tool**: `claude-code`

