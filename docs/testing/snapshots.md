# E2E Test Snapshots

> **Last verified**: 2026-01-11

This document describes the production-derived snapshot system used for E2E browser tests.

## Overview

Browser E2E tests need realistic data to test pagination, navigation, and rendering. Instead of using minimal seed data or mocks, we use **production-derived snapshots**.

### Why Snapshots?

| Approach | Pros | Cons |
|----------|------|------|
| Minimal seed | Fast, simple | Unrealistic, can't test pagination |
| Full prod clone | Most realistic | Large, slow, contains sensitive data |
| **Curated snapshot** | Realistic, deterministic, safe | Requires maintenance |

### What's Included

| Data | Details |
|------|---------|
| **Tools** | All 7 registry tools |
| **Releases** | 60 for codex/cursor (pagination tests), 3 for others |
| **Changes** | All changes for included releases |
| **rawContent** | Full content preserved (no truncation) |

### What's Excluded

| Data | Reason |
|------|--------|
| User, Session, Account | Privacy, not needed for UI tests |
| Waitlist, EmailLog | Privacy |
| FetchLog | Too large, not needed |
| Other tools | Minimal dataset for speed |

---

## Snapshot File

**Location**: `tests/fixtures/e2e-db.snapshot.json.gz`

**Format**: Gzip-compressed JSON

**Size**: ~150-300 KB (compressed)

### JSON Structure

```typescript
type Snapshot = {
  meta: {
    createdAt: string;           // ISO timestamp of export
    source: "production";        // Always "production"
    tools: string[];             // ["codex", "cursor"]
    releaseCounts: Record<string, number>;  // {"codex": 60, "cursor": 60}
    schemaVersion: number;       // Schema version for compatibility
  };
  tools: Array<{
    slug: string;
    name: string;
    vendor: string;
    description: string | null;
    homepage: string;
    repositoryUrl: string;
    sourceType: string;
    sourceUrl: string;
    sourceConfig: unknown | null;
    tags: string[];
    isActive: boolean;
    lastFetchedAt: string | null;
    logoUrl: string | null;
  }>;
  releases: Array<{
    toolSlug: string;            // Foreign key to tools
    version: string;
    versionSort: string;
    releaseDate: string | null;
    publishedAt: string;
    sourceUrl: string;
    rawContent: string;          // Full content preserved
    contentHash: string;
    title: string | null;
    summary: string | null;
    headline: string;
    isPrerelease: boolean;
  }>;
  changes: Array<{
    toolSlug: string;            // Foreign key
    version: string;             // Foreign key (with toolSlug)
    type: string;
    title: string;
    description: string | null;
    platform: string | null;
    component: string | null;
    isBreaking: boolean;
    isSecurity: boolean;
    isDeprecation: boolean;
    impact: string | null;
    links: unknown | null;
    media: unknown | null;
    order: number;
  }>;
};
```

### Key Design Decisions

1. **Use `toolSlug` as foreign key** instead of database IDs
   - IDs change between environments
   - Slugs are stable and human-readable

2. **Use `(toolSlug, version)` for changes**
   - Maps to Prisma's `@@unique([toolId, version])` constraint
   - Enables clean import without ID lookups

3. **Preserve `rawContent` verbatim**
   - No truncation, sanitization, or rewriting
   - Tests see exactly what production sees

4. **Gzip compression**
   - Reduces file size ~90%
   - Transparent to import script

---

## Generating a New Snapshot

### Prerequisites

- Access to production database (read-only recommended)
- `DATABASE_URL` environment variable set

### Export Script

**File**: `scripts/export-e2e-snapshot.ts`

```bash
# Set production database URL
export DATABASE_URL="postgresql://..."

# Run export
pnpm tsx scripts/export-e2e-snapshot.ts
```

**What it does**:
1. Connects to the database specified by `DATABASE_URL`
2. Fetches all tools from `TOOL_SLUGS` in the registry
3. Fetches 60 releases for codex/cursor (pagination tests), 3 for others
4. Fetches all changes for those releases
5. Writes compressed JSON to `tests/fixtures/e2e-db.snapshot.json.gz`

### Configuration

In the export script:

```typescript
// All tools from registry
const TARGET_TOOLS = [
  "claude-code",
  "codex",
  "cursor",
  "windsurf",
  "opencode",
  "antigravity",
  "gemini-cli",
];

// Tools needing deep release data for pagination tests
const DEEP_DATA_TOOLS = ["codex", "cursor"];
const DEEP_RELEASES_COUNT = 60;
const MINIMAL_RELEASES_COUNT = 3;
```

To add a new tool: add it to `TOOL_REGISTRY` in `src/lib/tool-registry.tsx` and update `TARGET_TOOLS` in the export script.

### Safety Checks

The export script:
- Only exports specified tools
- Does not include User, Session, or other sensitive tables
- Logs counts for verification

### When to Regenerate

Regenerate the snapshot when:
- Schema changes affect Release or Change models
- You need fresh production data for tests
- Tests fail due to stale data

Typical frequency: Monthly or on-demand.

---

## Importing the Snapshot

### Import Script

**File**: `prisma/seed-e2e-snapshot.ts`

```bash
# Ensure DATABASE_URL points to test/local database
pnpm seed:e2e
```

**What it does**:
1. Reads and decompresses the snapshot file
2. Deletes existing data for snapshot tools (clean slate)
3. Inserts tools, mapping `slug` → `id`
4. Inserts releases, mapping `toolSlug` → `toolId`
5. Inserts changes, mapping `(toolSlug, version)` → `releaseId`

### Import Strategy

```
1. Delete existing data for snapshot tools
   ├── Change.deleteMany (where release.tool.slug in [...])
   ├── Release.deleteMany (where tool.slug in [...])
   ├── FetchLog.deleteMany (where tool.slug in [...])
   └── Tool.deleteMany (where slug in [...])

2. Insert tools → build toolIdMap (slug → id)

3. Insert releases → build releaseIdMap (slug:version → id)

4. Insert changes (using releaseIdMap for foreign keys)
```

This guarantees the database exactly matches the snapshot.

### Performance

- Uses `createMany` for changes (batched inserts)
- Processes releases in chunks of 50
- Total import time: ~5-10 seconds

---

## CI Integration

### Workflow

In `.github/workflows/e2e.yml`:

```yaml
- name: Setup Database
  env:
    DATABASE_URL: postgresql://postgres:postgres@localhost:5432/changelogs_test
  run: |
    pnpm prisma migrate deploy
    pnpm seed:e2e  # ← Imports snapshot
```

### Why Not Seed Full Production Data?

1. **Size**: Full database is too large for CI
2. **Speed**: Import would take too long
3. **Privacy**: Production has user data
4. **Determinism**: Tests should be reproducible

---

## Local Development

### Using the Snapshot Locally

```bash
# 1. Ensure local database is running
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres

# 2. Set DATABASE_URL
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/changelogs"

# 3. Apply migrations
pnpm prisma migrate deploy

# 4. Import snapshot
pnpm seed:e2e

# 5. Run E2E tests
pnpm test:e2e
```

### Mixing with Dev Data

If you want both snapshot data and other development data:

```bash
# Import snapshot first
pnpm seed:e2e

# Then run normal seed (adds other tools)
pnpm seed:local
```

Note: Normal seed may update data for tools also in the snapshot. The snapshot import runs a clean slate for included tools.

---

## Troubleshooting

### Snapshot File Not Found

**Error**:
```
Snapshot not found at tests/fixtures/e2e-db.snapshot.json.gz
```

**Fix**:
1. Check file exists in repo
2. If missing, regenerate from production

### Import Fails with Schema Error

**Error**:
```
Unknown field in JSON
```

**Fix**:
1. Schema may have changed since snapshot was created
2. Regenerate snapshot with current schema:
   ```bash
   pnpm tsx scripts/export-e2e-snapshot.ts
   ```

### Tests Fail: Wrong Release Count

**Error**:
```
Expected 20 release cards, got 0
```

**Fix**:
1. Snapshot may not be imported
2. Run `pnpm seed:e2e` before tests
3. Verify database has data: `pnpm prisma studio`

### Snapshot Too Large

If the snapshot grows too large:

1. Reduce `RELEASES_PER_TOOL` in export script
2. Consider removing less-used tools
3. Check if `rawContent` has grown unexpectedly

---

## Maintenance

### Updating the Snapshot

1. Set `DATABASE_URL` to production (read-only)
2. Run export: `pnpm tsx scripts/export-e2e-snapshot.ts`
3. Commit the new snapshot file
4. Run tests locally to verify: `pnpm test:e2e`

### Adding More Tools to Snapshot

When adding a new tool to the registry:

1. Add the tool to `TOOL_REGISTRY` in `src/lib/tool-registry.tsx`
2. Add the slug to `TARGET_TOOLS` in `scripts/export-e2e-snapshot.ts`
3. To include in "deep data" set (60 releases for pagination tests):
   - Add slug to `DEEP_DATA_TOOLS` array in the export script
4. Run export: `pnpm tsx scripts/export-e2e-snapshot.ts`
5. Commit the updated snapshot file
6. Tests will automatically include the new tool (uses `TOOL_SLUGS.length`)

### Schema Migrations

When the schema changes:

1. If adding optional fields: Usually compatible
2. If adding required fields: Regenerate snapshot
3. If removing fields: Update snapshot JSON structure

---

## File Reference

| File | Purpose |
|------|---------|
| `tests/fixtures/e2e-db.snapshot.json.gz` | The snapshot data |
| `scripts/export-e2e-snapshot.ts` | Export from production |
| `prisma/seed-e2e-snapshot.ts` | Import into database |

---

## Related Documentation

- [E2E Architecture](e2e-architecture.md)
- [Browser Tests](browser-tests.md)
- [Troubleshooting](troubleshooting.md)
