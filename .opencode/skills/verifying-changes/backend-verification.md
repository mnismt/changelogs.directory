# Backend Verification

**For General Subagent**: This guide is used by general subagents spawned from the main thread.

Verify database state, server functions, and data integrity using scripts and SQL queries.

## Quick SQL Queries

### Run via Prisma

```bash
# Single query
pnpm prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Tool\";"

# Multi-line query
pnpm prisma db execute --stdin << 'EOF'
SELECT t.name, COUNT(r.id) as release_count
FROM "Tool" t
LEFT JOIN "Release" r ON t.id = r."toolId"
GROUP BY t.id;
EOF
```

### Run via tsx Script

For complex verification, create a script:

```bash
pnpm tsx scripts/verify-data.ts
```

## Data Verification Queries

### Tool Verification

```sql
-- All tools with release counts
SELECT slug, name, "isActive", "lastFetchedAt",
  (SELECT COUNT(*) FROM "Release" WHERE "toolId" = t.id) as releases
FROM "Tool" t;

-- Tools missing releases (should have data)
SELECT slug, name FROM "Tool"
WHERE "isActive" = true
  AND id NOT IN (SELECT DISTINCT "toolId" FROM "Release");

-- Tools with stale data (not fetched in 24h)
SELECT slug, name, "lastFetchedAt" FROM "Tool"
WHERE "isActive" = true
  AND ("lastFetchedAt" IS NULL OR "lastFetchedAt" < NOW() - INTERVAL '24 hours');
```

### Release Verification

```sql
-- Latest releases per tool
SELECT t.slug, r.version, r."publishedAt"
FROM "Release" r
JOIN "Tool" t ON r."toolId" = t.id
ORDER BY r."publishedAt" DESC
LIMIT 10;

-- Releases missing changes
SELECT t.slug, r.version FROM "Release" r
JOIN "Tool" t ON r."toolId" = t.id
WHERE r.id NOT IN (SELECT DISTINCT "releaseId" FROM "Change");

-- Check version sorting is correct
SELECT version, "versionSort" FROM "Release"
WHERE "toolId" = '<tool-id>'
ORDER BY "versionSort" DESC
LIMIT 10;
```

### Change Verification

```sql
-- Changes per release
SELECT r.version, COUNT(c.id) as change_count
FROM "Release" r
LEFT JOIN "Change" c ON r.id = c."releaseId"
WHERE r."toolId" = '<tool-id>'
GROUP BY r.id
ORDER BY r."versionSort" DESC;

-- Change type distribution
SELECT type, COUNT(*) FROM "Change"
WHERE "releaseId" = '<release-id>'
GROUP BY type;

-- Breaking/security changes
SELECT c.title, r.version FROM "Change" c
JOIN "Release" r ON c."releaseId" = r.id
WHERE c."isBreaking" = true OR c."isSecurity" = true
ORDER BY r."publishedAt" DESC
LIMIT 10;
```

### FetchLog Verification

```sql
-- Latest fetch status per tool
SELECT t.slug, f.status, f."startedAt", f."releasesFound", f."releasesNew"
FROM "FetchLog" f
JOIN "Tool" t ON f."toolId" = t.id
WHERE f."startedAt" = (
  SELECT MAX("startedAt") FROM "FetchLog" WHERE "toolId" = t.id
);

-- Failed fetches in last 24h
SELECT t.slug, f."errorMessage", f."startedAt"
FROM "FetchLog" f
JOIN "Tool" t ON f."toolId" = t.id
WHERE f.status = 'FAILED'
  AND f."startedAt" > NOW() - INTERVAL '24 hours';
```

## Server Function Testing

### Via curl

Server functions use POST to `/_server`:

```bash
# Test a GET server function (check network tab for exact payload format)
curl -X POST "http://localhost:5173/_server" \
  -H "Content-Type: application/json" \
  -d '{"_serverFnId": "getTools", "data": {}}'
```

### Via tsx Script

More reliable - import and call directly:

```typescript
// scripts/test-server-fn.ts
import { getTools } from '../src/server/tools'

async function test() {
  const tools = await getTools()
  console.log('Tools:', tools.length)
  
  // Verify expected data
  if (tools.length === 0) {
    console.error('No tools found!')
    process.exit(1)
  }
  
  console.log('Server function working')
}

test()
```

```bash
pnpm tsx scripts/test-server-fn.ts
```

### Common Server Function Tests

```typescript
// Test tool retrieval
import { getToolWithReleases } from '../src/server/tools'

const tool = await getToolWithReleases({ data: { slug: 'claude-code' } })
console.assert(tool !== null, 'Tool should exist')
console.assert(tool.releases.length > 0, 'Should have releases')

// Test release with changes
import { getReleaseWithChanges } from '../src/server/tools'

const release = await getReleaseWithChanges({ 
  data: { toolSlug: 'claude-code', version: '1.0.0' } 
})
console.assert(release !== null, 'Release should exist')
console.assert(release.changes.length > 0, 'Should have changes')
```

## Data Integrity Checks

### Orphaned Records

```sql
-- Releases without valid tool
SELECT id, version FROM "Release"
WHERE "toolId" NOT IN (SELECT id FROM "Tool");

-- Changes without valid release
SELECT id, title FROM "Change"
WHERE "releaseId" NOT IN (SELECT id FROM "Release");

-- FetchLogs without valid tool
SELECT id FROM "FetchLog"
WHERE "toolId" NOT IN (SELECT id FROM "Tool");
```

### Duplicate Detection

```sql
-- Duplicate versions per tool (should be 0)
SELECT "toolId", version, COUNT(*) FROM "Release"
GROUP BY "toolId", version
HAVING COUNT(*) > 1;

-- Duplicate content hashes (re-ingested same content)
SELECT "contentHash", COUNT(*) FROM "Release"
GROUP BY "contentHash"
HAVING COUNT(*) > 1;
```

### Content Hash Validation

```sql
-- Releases where hash might be stale
SELECT r.version, r."contentHash", LENGTH(r."rawContent") as content_length
FROM "Release" r
WHERE r."toolId" = '<tool-id>'
ORDER BY r."versionSort" DESC
LIMIT 5;
```

## Ingestion Verification Checklist

After running ingestion for a tool:

```bash
# 1. Check FetchLog status
pnpm prisma db execute --stdin <<< "
SELECT status, \"releasesFound\", \"releasesNew\", \"errorMessage\"
FROM \"FetchLog\"
WHERE \"toolId\" = '<tool-id>'
ORDER BY \"startedAt\" DESC
LIMIT 1;
"

# 2. Verify releases exist
pnpm prisma db execute --stdin <<< "
SELECT COUNT(*) as total_releases FROM \"Release\"
WHERE \"toolId\" = '<tool-id>';
"

# 3. Verify changes were parsed
pnpm prisma db execute --stdin <<< "
SELECT r.version, COUNT(c.id) as changes
FROM \"Release\" r
LEFT JOIN \"Change\" c ON r.id = c.\"releaseId\"
WHERE r.\"toolId\" = '<tool-id>'
GROUP BY r.id
ORDER BY r.\"versionSort\" DESC
LIMIT 5;
"

# 4. Check LLM classification ran
pnpm prisma db execute --stdin <<< "
SELECT c.type, COUNT(*) FROM \"Change\" c
JOIN \"Release\" r ON c.\"releaseId\" = r.id
WHERE r.\"toolId\" = '<tool-id>'
GROUP BY c.type;
"
```

## Verification Script Template

Create reusable verification scripts:

```typescript
// scripts/verify-tool.ts
import { getPrisma } from '../src/server/db'

async function verifyTool(slug: string) {
  const prisma = getPrisma()
  
  // 1. Tool exists
  const tool = await prisma.tool.findUnique({
    where: { slug },
    include: { _count: { select: { releases: true } } }
  })
  
  if (!tool) {
    console.error(`Tool "${slug}" not found`)
    process.exit(1)
  }
  console.log(`Tool: ${tool.name}`)
  console.log(`   Releases: ${tool._count.releases}`)
  
  // 2. Has releases
  if (tool._count.releases === 0) {
    console.error('No releases found')
    process.exit(1)
  }
  
  // 3. Latest release has changes
  const latestRelease = await prisma.release.findFirst({
    where: { toolId: tool.id },
    orderBy: { versionSort: 'desc' },
    include: { _count: { select: { changes: true } } }
  })
  
  console.log(`   Latest: ${latestRelease?.version} (${latestRelease?._count.changes} changes)`)
  
  if (latestRelease?._count.changes === 0) {
    console.warn('Latest release has no changes')
  }
  
  // 4. Check fetch status
  const lastFetch = await prisma.fetchLog.findFirst({
    where: { toolId: tool.id },
    orderBy: { startedAt: 'desc' }
  })
  
  if (lastFetch?.status === 'FAILED') {
    console.error(`Last fetch failed: ${lastFetch.errorMessage}`)
  } else {
    console.log(`Last fetch: ${lastFetch?.status} at ${lastFetch?.startedAt}`)
  }
}

const slug = process.argv[2]
if (!slug) {
  console.error('Usage: pnpm tsx scripts/verify-tool.ts <slug>')
  process.exit(1)
}

verifyTool(slug)
```

```bash
pnpm tsx scripts/verify-tool.ts claude-code
```

## Common Issues

| Issue | Check | Fix |
|-------|-------|-----|
| No releases | Query Release table | Run ingestion task |
| Empty changes | Query Change table | Check parser output |
| Fetch failed | Query FetchLog | Check error message, source URL |
| Stale data | Check lastFetchedAt | Trigger manual ingestion |
| Wrong classification | Query Change types | Re-run LLM enrichment |

## Database Connection Issues

```bash
# Verify connection
pnpm prisma db pull

# Regenerate client after schema changes
pnpm prisma generate

# Check migration status
pnpm prisma migrate status
```
