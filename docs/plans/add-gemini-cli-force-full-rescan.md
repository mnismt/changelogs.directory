# Implementation Plan: Add forceFullRescan to Gemini CLI ingestion

> **Created**: 2026-01-11
> **Status**: ✅ Completed
> **Completed**: 2026-01-11
> **Estimated Time**: 1-2 hours

## Summary

Add a `forceFullRescan` payload flag to the Gemini CLI ingestion task to support full-refresh ingestion. When enabled, it must:

1. Bypass GitHub Releases cache/ETag usage during fetch.
2. Bypass the filter phase that skips unchanged releases.
3. Still upsert releases even when content hashes are unchanged (re-enrich + rewrite changes).

## Goals

- Match the payload shape used by Cursor: `forceFullRescan?: boolean`.
- Keep existing release selection rules (respect `includePreReleases`).
- Ensure forced runs fully refresh LLM enrichment and database state.

## Non-goals

- Changing schedules or task IDs.
- Introducing new source types or parsers.
- Updating unrelated tools (Codex/OpenCode) unless explicitly requested later.

## Background

Gemini CLI uses the `GITHUB_RELEASES` pipeline and currently relies on Redis + ETag caching via `fetchGitHubReleases()` and on Phase 4 filtering to skip unchanged releases. For full-refresh ingestion (e.g., after DB reset or data correction), we need an explicit opt-in path to:

- Ignore cached ETag/releases when fetching.
- Re-enrich and re-upsert all releases even if content hashes match.

## Approach

Implement a `forceFullRescan` flag following Cursor/Windsurf/Antigravity patterns, and thread it through Gemini CLI steps plus the shared GitHub releases fetch helper.

### Phase 1: Context + payload wiring (Sequential)

| Order | Task | Files | Reason |
|------:|------|-------|--------|
| 1 | Add `forceFullRescan` to Gemini `IngestionContext` | `src/trigger/ingest/gemini-cli/types.ts` | Steps need the flag | 
| 2 | Accept payload flag and attach to ctx | `src/trigger/ingest/gemini-cli/index.ts` | Entry point wiring |
| 3 | Align setup return type with ctx extension | `src/trigger/ingest/gemini-cli/steps/setup.ts` | Match Cursor pattern |

### Phase 2: Behavior changes (Sequential)

| Order | Task | Files | Reason |
|------:|------|-------|--------|
| 1 | Bypass GitHub cache/ETag when forced | `src/lib/github/releases.ts` | Fetch must ignore cache |
| 2 | Pass bypass option from Gemini fetch step | `src/trigger/ingest/gemini-cli/steps/fetch.ts` | Connect ctx flag |
| 3 | Bypass filter phase when forced | `src/trigger/ingest/gemini-cli/steps/filter.ts` | Full-refresh requires reprocessing |
| 4 | Upsert even when content hash unchanged | `src/trigger/ingest/gemini-cli/steps/upsert.ts` | Ensure data is rewritten |

### Phase 3: Tests + docs (Parallel)

| Subtask | Files | Notes |
|--------|-------|-------|
| Add GitHub releases cache-bypass tests | `tests/lib/github/releases.test.ts` (new) | Assert no `If-None-Match` + no cache read when forced |
| Add Gemini forced-run tests | `tests/trigger/ingest/gemini-cli/index.test.ts` (new) | Ensure filter is bypassed and upsert re-runs |
| Document operational flag | `src/trigger/ingest/gemini-cli/README.md` | Add `forceFullRescan` description |

## Detailed Implementation Notes

### 1) `src/lib/github/releases.ts`

Add an optional `bypassCache?: boolean` to `FetchGitHubReleasesOptions` and implement:

- When `bypassCache` is true:
  - Skip `getCachedReleases()` usage.
  - Do not set `If-None-Match` header.
  - Still cache results via `setCachedReleases(...)` after successful fetch.

This keeps the behavior opt-in and avoids affecting other tools.

### 2) Gemini CLI fetch step

In `src/trigger/ingest/gemini-cli/steps/fetch.ts`, pass `bypassCache: ctx.forceFullRescan` into `fetchGitHubReleases(...)`. Keep `includePreReleases` logic unchanged (still honoring `tool.sourceConfig`).

### 3) Gemini filter step

If `ctx.forceFullRescan` is true, return the parsed releases as-is and set `releasesSkipped` to `0`. Log that the filter was bypassed.

### 4) Gemini upsert step

Currently, unchanged content hashes skip updates. For forced runs, do not skip; instead update the release and recreate changes. The conditional should be:

- If `existingRelease.contentHash === parsedRelease.contentHash` **and** `!ctx.forceFullRescan`, then skip.

### 5) Gemini task entry point

Update `ingestGeminiCli.run` to accept `{ toolSlug?: string; forceFullRescan?: boolean }` and attach the flag to the context (use `ctx: IngestionContext | null` to keep error handling clean).

## Testing Strategy

### Unit Tests

- `tests/lib/github/releases.test.ts`:
  - Mock `getCachedReleases` / `setCachedReleases` and ensure `bypassCache` avoids `If-None-Match` and ignores cached data.
  - Validate that caching still occurs after a forced fetch.

### Ingestion Tests

- `tests/trigger/ingest/gemini-cli/index.test.ts`:
  - Mock `fetchGitHubReleases` to return a stable list.
  - Seed one existing release with identical `contentHash`.
  - Run ingestion with `forceFullRescan: true` and assert:
    - Filter phase is bypassed (no releases skipped).
    - Upsert updates existing release despite unchanged hash.

## Validation Commands

- `pnpm biome check --write src/lib/github/releases.ts src/trigger/ingest/gemini-cli/index.ts src/trigger/ingest/gemini-cli/steps/* src/trigger/ingest/gemini-cli/types.ts`
- `pnpm test tests/lib/github/releases.test.ts tests/trigger/ingest/gemini-cli/index.test.ts`

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Forced runs are expensive (LLM cost/time) | Medium | Only enabled explicitly via payload flag; log a warning when enabled |
| Cache bypass affects other tools | Low | Opt-in flag only; default unchanged |
| Upsert still skips unchanged releases | Medium | Explicit conditional on `!ctx.forceFullRescan` |

## Success Criteria

- Gemini ingestion accepts `forceFullRescan` payload flag.
- Forced run bypasses GitHub cache/ETag and filter phase.
- Forced run re-upserts releases even when content hashes are unchanged.
- Tests added for cache bypass and forced Gemini runs.
- Gemini CLI README documents the operational flag.

## Open Questions

None (semantics confirmed with user).

## Completion Notes

- `forceFullRescan` payload wired through Gemini CLI ingestion context and steps.
- `fetchGitHubReleases` supports `bypassCache` for forced runs.
- Filter/upsert phases honor forced reprocessing.
- Tests added: `tests/lib/github/releases.test.ts`, `tests/trigger/ingest/gemini-cli/index.test.ts`.
- Gemini CLI README documents the operational flag.
