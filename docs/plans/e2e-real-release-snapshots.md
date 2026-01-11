# Plan: Real Release Snapshots for CI E2E

> **Status**: 🟡 Planned

## Goal

Make CI E2E tests **stable** and **realistic** by seeding a deterministic dataset derived from production releases, without pulling the entire production database.

### Requirements (from discussion)

- Seed **real production-derived releases** for:
  - `codex`: **50–60 releases**
  - `cursor`: **50–60 releases**
- Keep **full rawContent fidelity** (no truncation, no sanitization, no rewriting).
- Avoid sensitive tables/data:
  - Do **not** export/import `User`, `Waitlist`, `Session`, `Account`, `Verification`, `EmailLog`.
- Dataset should include **real change type distribution** (FEATURE/BUGFIX/etc.) as stored in production.
- CI must remain deterministic: no live scraping, no network calls, no dependence on production DB availability.

## Non-goals

- Not attempting to mirror all tools or all historical production releases.
- Not building a generic “prod clone” workflow.
- Not adding ingestion pipeline runs in CI.

## Current Context

- E2E browser tests use Playwright with the dev server started via `webServer`.
- Tool page release loading uses pagination/infinite scroll:
  - `limit=20` on first page; subsequent pages use `offset=releases.length`.
  - Implemented in `src/routes/tools/$slug/index.tsx` and backed by `getToolReleasesPaginated` in `src/server/tools.ts`.
- Current CI failure root cause: `pnpm seed:local` uses Bun but Bun isn’t installed on the runner.

## Proposed Solution Overview

1. Create a **curated snapshot fixture** from production (tools+releases+changes for `codex` and `cursor`), stored in-repo as a **gzip-compressed JSON** file.
2. Add an **importer seed script** that loads the snapshot into the CI Postgres service after migrations.
3. Update Playwright tests to **assert pagination/infinite scroll** using the guaranteed 50–60 releases.
4. Update CI workflow:
   - Ensure Bun is installed (for any remaining Bun-based scripts).
   - Ensure `pnpm prisma db seed` works reliably (prefer Node/tsx for Prisma seeding entrypoint).

## Data Model Scope

### Included tables (only)

- `Tool`
- `Release`
- `Change`

### Excluded tables

- `User`, `Session`, `Account`, `Verification`
- `Waitlist`
- `EmailLog`
- `FetchLog` (not needed for E2E and can balloon quickly)

## Fixture Format

### File

- `tests/fixtures/e2e-db.snapshot.json.gz`

### JSON shape (proposed)

```ts
type Snapshot = {
  meta: {
    createdAt: string // ISO
    source: "production"
    tools: string[] // ["codex", "cursor"]
    releaseCounts: Record<string, number>
    schemaVersion: number
  }
  tools: Array<{
    slug: string
    name: string
    vendor: string
    description: string | null
    homepage: string
    repositoryUrl: string
    sourceType: string
    sourceUrl: string
    sourceConfig: unknown | null
    tags: string[]
    isActive: boolean
    lastFetchedAt: string | null
  }>
  releases: Array<{
    toolSlug: string
    version: string
    versionSort: string
    releaseDate: string | null
    publishedAt: string
    sourceUrl: string
    rawContent: string
    contentHash: string
    title: string | null
    summary: string | null
    headline: string
    isPrerelease: boolean
  }>
  changes: Array<{
    toolSlug: string
    version: string
    type: string
    title: string
    description: string | null
    platform: string | null
    component: string | null
    isBreaking: boolean
    isSecurity: boolean
    isDeprecation: boolean
    impact: string | null
    links: unknown | null
    media: unknown | null
    order: number
  }>
}
```

Notes:
- Use `(toolSlug, version)` as the stable logical foreign key, matching the Prisma unique constraint `@@unique([toolId, version])`.
- Preserve all production values verbatim, especially `rawContent`.
- Use gzip only for storage efficiency; content remains unchanged when decompressed.

## Snapshot Generation (maintainer-only, local)

### New script

- `scripts/export-e2e-snapshot.ts` (run locally)

### Inputs

- `DATABASE_URL` pointing to production **read-only** connection if possible.
- Tool slugs: fixed to `codex` and `cursor`.
- Count per tool: 60 (configurable via CLI flag).

### Export rules

- Export tools by slug.
- Export the latest N releases per tool (order by `releaseDate desc`, then `versionSort desc`).
- Export all changes for those releases (preserve `order`).
- Exclude non-required columns and excluded tables.

### Output

- Write JSON to stdout or a file.
- Compress to `tests/fixtures/e2e-db.snapshot.json.gz`.

### Safety checks

- Assert no excluded table data is included.
- Assert all releases reference included tools.
- Assert each release has `contentHash` and `rawContent` present.
- Assert snapshot counts match requested counts (or log why fewer were exported).

## Snapshot Importer (CI + local)

### New script

- `prisma/seed-e2e-snapshot.ts`

### Import strategy

Because CI DB is ephemeral, the simplest and most deterministic import is:

1. Delete existing data for the snapshot tool slugs:
   - `Change.deleteMany` where `release.tool.slug in ["codex", "cursor"]`
   - `Release.deleteMany` where `tool.slug in ["codex", "cursor"]`
   - `Tool.deleteMany` where `slug in ["codex", "cursor"]` (optional if you prefer upserts)
2. Insert tools.
3. Insert releases, mapping `toolSlug -> toolId`.
4. Insert changes, mapping `(toolSlug, version) -> releaseId`.

This guarantees the DB exactly matches the snapshot.

### Performance

- Use `createMany` in batches where possible (`Release`, `Change`) to keep CI time reasonable.
- For referential mapping, build in-memory maps from created records.

### Determinism

- Preserve ordering fields:
  - `Release.versionSort`, `Release.releaseDate`, `Release.publishedAt`
  - `Change.order`

## CI Workflow Changes

### Workflow file

- `.github/workflows/e2e.yml`

### Updates

1. Install Bun (fix current failure).
   - Use `oven-sh/setup-bun`.
2. Set up DB:
   - Keep the Postgres service container.
   - Run `pnpm prisma migrate deploy`.
3. Seed snapshot:
   - Run `pnpm prisma db seed` (after we update Prisma seed entry) OR add an explicit script `pnpm seed:e2e`.

### Prisma seed entry

- Ensure `pnpm prisma db seed` works with Node/tsx so it is consistent across environments.
- Keep Bun-based `seed:local` if desired for dev speed, but CI should not rely on Bun implicitly.

## Playwright Test Updates

### New/updated assertions

- Add a dedicated test for pagination/infinite scroll:
  - Visit `/tools/codex`
  - Assert initial number of release cards is ~20
  - Scroll until the sentinel triggers
  - Assert count increases (e.g. `> 20`, then `> 40`)

- Add similar coverage for `/tools/cursor` if needed.

- Ensure release detail navigation is deterministic:
  - Instead of conditional click, assert at least one release exists and click.

### Flake prevention

- Prefer stable selectors (`data-testid`) where available.
- Avoid `waitForTimeout` where possible; use `expect(locator).toHaveCount(...)` with timeouts.

## Documentation

- Update `docs/guides/testing.md` to document:
  - How the snapshot works
  - How to regenerate it (maintainer-only)
  - How to run E2E locally with the snapshot

## Rollout Plan

1. Implement snapshot export script + importer seed script.
2. Generate and commit initial snapshot (`codex`+`cursor` @ 60 releases each).
3. Update CI workflow to:
   - install Bun
   - run migrations
   - import snapshot
   - run Playwright
4. Tighten Playwright tests for pagination and release detail.
5. Verify locally and in CI.

## Verification Checklist

- CI:
  - `pnpm prisma migrate deploy` succeeds.
  - Snapshot import succeeds.
  - Playwright tests pass reliably (retry budget stays low).

- Local:
  - Can import snapshot into local DB and run `pnpm test:e2e`.

## Open Questions

- Which branch/repo policy governs updating the snapshot (monthly vs on-demand)?
- Do we want to include a small amount of other-tool data for homepage lanes (optional)?
