# Claude Code Ingestion Flow

Trigger.dev task that ingests changelog data from Claude Code's GitHub repository.

## Overview

Fetches `CHANGELOG.md` from GitHub, parses releases, enriches with LLM classification, and upserts to database.

## Phases

### Phase 1: Setup
- Load tool from database
- Validate tool is active (skip if inactive)
- Create `FetchLog` with `IN_PROGRESS` status

### Phase 2: Fetch
- Fetch changelog markdown from `tool.sourceUrl`
- Extract ETag for change detection
- Validate HTTP response

### Phase 3: Parse
- Extract structured data from markdown (synchronous)
- Parse releases, versions, dates, changes
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

## Error Handling

- Failures update `FetchLog` with error details
- Task retries handled by Trigger.dev retry logic
- Partial context recovery attempts on failure

## Configuration

- **Task ID**: `ingest-claude-code`
- **Concurrency**: 1 (prevents duplicate runs)
- **Max Duration**: 5 minutes
- **Default Tool**: `claude-code`

