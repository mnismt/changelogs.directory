# Codex Ingestion Testing Guide

## Implementation Status

✅ **Completed** - All core components implemented:

1. ✅ Database migration for `isPrerelease` column
2. ✅ GitHub Releases API fetcher (`src/lib/github/releases.ts`)
3. ✅ GitHub Releases parser (`src/lib/parsers/github-releases.ts`)
4. ✅ Shared utility functions (`src/lib/parsers/changelog-md-utils.ts`)
5. ✅ Codex ingestion pipeline (`src/trigger/ingest/codex/`)
6. ✅ Database seed with Codex tool
7. ✅ Updated upsert step to handle `isPrerelease` and `sourceUrl` fields

## Testing Checklist

### 1. Verify Database Setup

```bash
# Check that Codex tool exists
pnpm prisma studio
# Navigate to "tool" table and verify:
# - slug: "codex"
# - sourceType: "GITHUB_RELEASES"
# - sourceConfig: { "versionPrefix": "rust-v", "includePreReleases": true }
# - isActive: true
```

### 2. Manual Ingestion Test

**Option A: Via Trigger.dev Dashboard** (Recommended)

1. Start Trigger.dev dev server:
   ```bash
   pnpm trigger:dev
   ```

2. Open Trigger.dev dashboard: http://localhost:3000/

3. Find and trigger the `ingest-codex` task

4. Monitor logs for:
   - Successful GitHub API fetch
   - Release parsing (should see ~50-100 releases)
   - Pre-release detection
   - Database upsert

**Option B: Via Code**

```typescript
// In src/trigger/ingest/codex/index.ts, temporarily add:
if (process.env.TEST_INGESTION) {
  ingestCodex.trigger({}).then(console.log)
}
```

Then run:
```bash
TEST_INGESTION=true pnpm trigger:dev
```

### 3. Verify Ingested Data

```bash
pnpm prisma studio
```

**Check Release Table:**
- [ ] At least 50 Codex releases exist
- [ ] Versions are correctly parsed (e.g., "0.55.0", not "rust-v0.55.0")
- [ ] `isPrerelease` is `true` for alpha versions (e.g., "0.54.0-alpha.3")
- [ ] `isPrerelease` is `false` for stable versions (e.g., "0.55.0")
- [ ] `versionSort` values ensure correct ordering:
  - `0.54.0-alpha.1` → `000054000-a001`
  - `0.54.0-alpha.2` → `000054000-a002`
  - `0.54.0` → `000054000-z`
- [ ] `sourceUrl` points to GitHub release page (e.g., `https://github.com/openai/codex/releases/tag/rust-v0.55.0`)

**Check Change Table:**
- [ ] Changes extracted from "Highlights" and "Merged PRs" sections
- [ ] PR references linked correctly (e.g., `#6222` → `https://github.com/openai/codex/pull/6222`)
- [ ] Empty release bodies handled gracefully (0 changes)

**Check FetchLog Table:**
- [ ] Status: `SUCCESS`
- [ ] Metrics populated (releasesNew, releasesUpdated, changesCreated)
- [ ] No errors

### 4. Test Filtering & Sorting

**Query to test version sorting:**

```sql
SELECT version, "versionSort", "isPrerelease", "releaseDate"
FROM release
WHERE "toolId" = (SELECT id FROM tool WHERE slug = 'codex')
ORDER BY "versionSort" DESC
LIMIT 20;
```

**Expected result**: Stable releases appear first, then pre-releases in correct alpha order.

**Query to test pre-release filtering:**

```sql
-- Count stable vs pre-releases
SELECT 
  "isPrerelease",
  COUNT(*) as count
FROM release
WHERE "toolId" = (SELECT id FROM tool WHERE slug = 'codex')
GROUP BY "isPrerelease";
```

### 5. Test Scheduled Ingestion

The task is configured to run every 6 hours via cron: `0 */6 * * *`

**Verify schedule in Trigger.dev dashboard:**
- Task ID: `ingest-codex-schedule`
- Cron expression: `0 */6 * * *`
- Status: Active

### 6. Test Idempotency

Run ingestion twice in a row:

1. First run: Should create new releases
2. Second run: Should skip unchanged releases (check `releasesSkipped` in logs)

**Expected behavior:**
- `releasesNew`: 0 (on second run)
- `releasesSkipped`: ~50-100 (on second run)
- `changesCreated`: 0 (on second run)

### 7. Test Error Handling

**GitHub API rate limit simulation:**

```bash
# Temporarily remove GITHUB_TOKEN
unset GITHUB_TOKEN
pnpm trigger:dev
# Trigger ingest-codex
```

**Expected**:
- Warning log: "GITHUB_TOKEN not set - using unauthenticated requests"
- Ingestion should still work (60 requests/hour limit)

**Invalid tool slug:**

```typescript
ingestCodex.trigger({ toolSlug: 'invalid-tool' })
```

**Expected**:
- Error: "Tool with slug 'invalid-tool' not found in database"
- FetchLog status: `FAILED`

## Edge Cases to Test

### Empty Release Body

Some alpha versions have empty bodies. Verify:
- [ ] Release is created with 0 changes
- [ ] Summary is empty or "No details available"
- [ ] No errors thrown

### Mixed Section Formats

Some releases have only "Highlights", some have only "Merged PRs", some have both.

**Test query:**
```sql
SELECT r.version, COUNT(c.id) as change_count
FROM release r
LEFT JOIN change c ON c."releaseId" = r.id
WHERE r."toolId" = (SELECT id FROM tool WHERE slug = 'codex')
GROUP BY r.id, r.version
ORDER BY change_count DESC
LIMIT 10;
```

### Pre-release Alpha Numbers

Verify correct sorting of alpha.1, alpha.2, ..., alpha.11:
```sql
SELECT version, "versionSort", "isPrerelease"
FROM release
WHERE "toolId" = (SELECT id FROM tool WHERE slug = 'codex')
  AND version LIKE '%alpha%'
ORDER BY "versionSort" DESC;
```

## Performance Benchmarks

**Expected metrics** (for ~100 releases):

- Fetch time: 5-10 seconds
- Parse time: < 1 second
- Filter time: < 1 second
- Enrich time (with LLM): 30-60 seconds
- Upsert time: 10-20 seconds
- **Total duration**: 60-120 seconds

**Check logs for:**
- GitHub API rate limit remaining (should be > 4900/5000 with token)
- Number of pages fetched (typically 1-2)

## Troubleshooting

### Issue: "GitHub API error: 404"

**Cause**: Invalid repository URL or private repository

**Fix**: Verify `tool.repositoryUrl` is correct

### Issue: "Version sort order is wrong"

**Cause**: Pre-release detection not working

**Debug**:
```sql
SELECT version, "versionSort", "isPrerelease"
FROM release
WHERE "toolId" = (SELECT id FROM tool WHERE slug = 'codex')
  AND "versionSort" LIKE '%000054000%'
ORDER BY "versionSort" DESC;
```

**Expected pattern**:
- Stable: `000054000-z`
- Alpha: `000054000-a###` (where ### is padded number)

### Issue: "No changes extracted from release"

**Cause**: Parser unable to detect bullet points

**Debug**: Check `release.rawContent` for format:
```sql
SELECT version, "rawContent"
FROM release
WHERE "toolId" = (SELECT id FROM tool WHERE slug = 'codex')
  AND id NOT IN (SELECT DISTINCT "releaseId" FROM change)
LIMIT 1;
```

Look for:
- Missing "## Highlights" or "## Merged PRs" headers
- Non-standard bullet format (should be `- ` or `* `)

## Next Steps After Testing

1. ✅ Verify all tests pass
2. Create UI pages for Codex (`/tools/codex`)
3. Add pre-release filtering to UI
4. Test version comparison/diff view
5. Deploy to production
6. Monitor FetchLog for errors
7. Set up alerts for failed ingestions

## Success Criteria

- [ ] Codex tool exists in database
- [ ] At least 50 releases ingested successfully
- [ ] Pre-releases correctly tagged (`isPrerelease: true`)
- [ ] Version sorting works correctly (alpha.1 < alpha.2 < stable)
- [ ] Changes extracted with PR links
- [ ] FetchLog shows `SUCCESS` status
- [ ] Scheduled task runs every 6 hours
- [ ] Idempotent (re-running doesn't duplicate data)
- [ ] No GitHub API rate limit errors (with `GITHUB_TOKEN`)

---

**Status**: Implementation complete - Ready for testing
**Date**: 2025-11-05
