# Testing Guide

> **Last verified**: 2025-12-05

This guide covers testing strategies for Changelogs.directory, including unit tests, integration tests, and ingestion pipeline testing.

## Testing Philosophy

**What to test**:
- ✅ Parsers (critical business logic)
- ✅ Server functions (database queries)
- ✅ Utility functions (version formatting, hashing)
- ✅ Ingestion pipeline steps (fetch, parse, filter logic)

**What NOT to test**:
- ❌ Third-party libraries (Prisma, Trigger.dev, TanStack Router)
- ❌ Simple components with no logic
- ❌ Configuration files
- ❌ Type definitions

**Goal**: High confidence in critical paths, not 100% coverage.

---

## Quick Commands

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test path/to/file.test.ts

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage

# Run only tests matching pattern
pnpm test --grep "parser"
```

---

## Unit Testing

### Testing Parsers

Parsers are the most critical components to test since they handle external data formats.

#### Example: Testing Markdown Parser

**File**: `tests/lib/parsers/changelog-md.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { parseChangelogMd } from '@/lib/parsers/changelog-md'

describe('parseChangelogMd', () => {
	it('should parse standard changelog format', () => {
		const markdown = `
# Changelog

## 2.0.31

- Fix: Database connection pooling
- Feature: Add dark mode support

## 2.0.30

- Improvement: Faster page loads
`
		const result = parseChangelogMd(markdown)

		expect(result.releases).toHaveLength(2)
		expect(result.releases[0].version).toBe('2.0.31')
		expect(result.releases[0].changes).toHaveLength(2)
		expect(result.releases[0].changes[0].title).toContain('Database connection')
	})

	it('should handle missing version numbers gracefully', () => {
		const markdown = `
# Changelog

##  (invalid)

- Fix: Something
`
		const result = parseChangelogMd(markdown)

		expect(result.releases).toHaveLength(0)
		expect(result.errors).toBeDefined()
	})

	it('should generate correct version sort strings', () => {
		const markdown = `
## 10.0.1
## 2.0.10
## 2.0.2
`
		const result = parseChangelogMd(markdown)

		// Verify semantic version sorting (not lexicographic)
		expect(result.releases[0].versionSort).toBe('0010.0000.0001.0000')
		expect(result.releases[1].versionSort).toBe('0002.0000.0010.0000')
		expect(result.releases[2].versionSort).toBe('0002.0000.0002.0000')
	})
})
```

#### Example: Testing Version Formatter

**File**: `tests/lib/version-formatter.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { formatVersionForDisplay } from '@/lib/version-formatter'

describe('formatVersionForDisplay', () => {
	it('should format Codex versions correctly', () => {
		const version = 'codex-rs-abc123def456-1-rust-v0.0.25'
		const result = formatVersionForDisplay(version, 'codex')
		expect(result).toBe('v0.0.25')
	})

	it('should format Cursor versions correctly', () => {
		const version = 'cursor-2-1'
		const result = formatVersionForDisplay(version, 'cursor')
		expect(result).toBe('v2.1')
	})

	it('should format Claude Code versions correctly', () => {
		const version = '2.0.31'
		const result = formatVersionForDisplay(version, 'claude-code')
		expect(result).toBe('v2.0.31')
	})
})
```

---

### Testing Server Functions

Server functions should be tested with a test database to verify query logic.

#### Setup Test Database

**File**: `tests/setup.ts`

```typescript
import { PrismaClient } from '@/generated/prisma/client'
import { beforeAll, afterAll } from 'vitest'

const prisma = new PrismaClient({
	datasources: {
		db: {
			url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
		},
	},
})

beforeAll(async () => {
	// Clear test data
	await prisma.change.deleteMany()
	await prisma.release.deleteMany()
	await prisma.tool.deleteMany()
})

afterAll(async () => {
	await prisma.$disconnect()
})

export { prisma }
```

#### Example: Testing Tool Queries

**File**: `tests/server/tools.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { getToolWithReleases } from '@/server/tools'
import { prisma } from '../setup'

describe('getToolWithReleases', () => {
	beforeEach(async () => {
		// Seed test data
		await prisma.tool.create({
			data: {
				slug: 'test-tool',
				name: 'Test Tool',
				vendor: 'Test Inc',
				homepage: 'https://test.com',
				repositoryUrl: 'https://github.com/test/tool',
				sourceType: 'CHANGELOG_MD',
				sourceUrl: 'https://example.com/changelog.md',
				releases: {
					create: [
						{
							version: '1.0.0',
							versionSort: '0001.0000.0000.0000',
							headline: 'Initial release',
							rawContent: '# 1.0.0\n- Initial release',
							contentHash: 'abc123',
						},
					],
				},
			},
		})
	})

	it('should fetch tool with releases', async () => {
		const result = await getToolWithReleases({ data: { slug: 'test-tool' } })

		expect(result).toBeDefined()
		expect(result.tool.slug).toBe('test-tool')
		expect(result.releases).toHaveLength(1)
		expect(result.releases[0].version).toBe('1.0.0')
	})
})
```

---

## Integration Testing

### Testing Ingestion Pipeline

Test the full ingestion flow from fetch → parse → upsert.

#### Local Ingestion Test

**File**: `tests/trigger/ingest/claude-code.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { fetchStep } from '@/trigger/ingest/claude-code/steps/fetch'
import { parseStep } from '@/trigger/ingest/claude-code/steps/parse'
import { prisma } from '../../setup'

describe('Claude Code Ingestion', () => {
	it('should fetch and parse real changelog', async () => {
		// Setup
		const tool = await prisma.tool.findUnique({
			where: { slug: 'claude-code' },
		})

		if (!tool) {
			throw new Error('Claude Code tool not seeded')
		}

		const ctx = {
			prisma,
			tool,
			fetchLog: null as any, // Mock for test
			startTime: Date.now(),
		}

		// Fetch
		const fetchResult = await fetchStep(ctx)
		expect(fetchResult.markdown).toBeDefined()
		expect(fetchResult.markdown.length).toBeGreaterThan(0)

		// Parse
		const parseResult = parseStep(fetchResult, { releaseDates: new Map() })
		expect(parseResult.releases.length).toBeGreaterThan(0)
		expect(parseResult.releases[0].version).toMatch(/^\d+\.\d+\.\d+/)
	}, 30000) // 30 second timeout for network request
})
```

---

### Trigger.dev Local Testing

Test ingestion tasks locally before deploying.

#### Start Dev Server

```bash
pnpm exec trigger.dev@latest dev
```

**Expected Output**:
```
✔ Trigger.dev dev server ready at http://localhost:3030
  Tasks:
  - ingest-claude-code
  - ingest-codex
  - ingest-cursor
```

#### Manually Trigger Task

**Option A**: Via Dashboard UI
1. Open http://localhost:3030
2. Click on task (e.g., `ingest-claude-code`)
3. Click "Test" → "Run Test"
4. Monitor logs in real-time

**Option B**: Via API

**File**: `scripts/test-ingestion.ts`

```typescript
import { tasks } from '@trigger.dev/sdk'

await tasks.trigger('ingest-claude-code', {
	toolSlug: 'claude-code',
})

console.log('Task triggered successfully')
```

Run: `pnpm tsx scripts/test-ingestion.ts`

---

## Database Testing

### Prisma Studio

Visual database explorer for manual verification.

```bash
pnpm prisma studio
```

**Use Cases**:
- Verify seed data loaded correctly
- Inspect releases after ingestion
- Debug missing or incorrect data
- Check FetchLog table for ingestion history

---

### SQL Queries

Direct SQL queries for verification.

#### Verify Tool Exists

```sql
SELECT slug, name, "sourceType", "isActive"
FROM tool
WHERE slug = 'google-antigravity';
```

#### Check Latest Releases

```sql
SELECT t.slug, r.version, r."releaseDate", r.headline
FROM release r
JOIN tool t ON r."toolId" = t.id
WHERE t.slug = 'google-antigravity'
ORDER BY r."versionSort" DESC
LIMIT 10;
```

#### Check Ingestion Logs

```sql
SELECT
	t.slug,
	fl.status,
	fl.started_at,
	fl.duration,
	fl.releases_found,
	fl.releases_new,
	fl.error
FROM fetch_log fl
JOIN tool t ON fl.tool_id = t.id
WHERE t.slug = 'google-antigravity'
ORDER BY fl.started_at DESC
LIMIT 5;
```

---

## End-to-End Testing

Full workflow testing from ingestion to display.

### Manual E2E Test

1. **Seed Database**
   ```bash
   pnpm prisma db seed
   ```

2. **Run Ingestion** (local Trigger.dev)
   ```bash
   pnpm exec trigger.dev@latest dev
   # Trigger via dashboard
   ```

3. **Verify Database**
   ```bash
   pnpm prisma studio
   # Check Release table has entries
   ```

4. **Start Web App**
   ```bash
   pnpm dev
   ```

5. **Manual UI Verification**
   - Visit http://localhost:5173
   - Navigate to `/tools/claude-code`
   - Verify releases appear
   - Click on a release
   - Verify changes are displayed correctly

---

## Troubleshooting Failed Tests

### Issue: Test database connection error

**Error**: `Can't reach database server at localhost:5432`

**Fix**:
1. Start PostgreSQL locally:
   ```bash
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres
   ```
2. Or set `TEST_DATABASE_URL` in `.env.test`

---

### Issue: Parser test fails with unexpected format

**Error**: `Expected 5 releases, got 0`

**Fix**:
1. Print raw input:
   ```typescript
   console.log('Raw markdown:', markdown.substring(0, 500))
   ```
2. Check changelog format matches parser expectations
3. Update parser or test fixture

---

### Issue: Trigger.dev task fails locally

**Error**: `Task not found: ingest-google-antigravity`

**Fix**:
1. Ensure task is exported from `index.ts`
2. Restart Trigger.dev dev server:
   ```bash
   # Kill existing: Ctrl+C
   pnpm exec trigger.dev@latest dev
   ```
3. Check task appears in list

---

### Issue: LLM enrichment test fails

**Error**: `GOOGLE_VERTEX_CREDENTIALS not set`

**Fix**:
Either:
1. Set credentials in `.env`:
   ```bash
   GOOGLE_VERTEX_CREDENTIALS='{"type":"service_account",...}'
   ```
2. Or skip LLM tests:
   ```typescript
   it.skipIf(!process.env.GOOGLE_VERTEX_CREDENTIALS)('should enrich with LLM', ...)
   ```

---

## Testing Checklist

Before deploying new tools or features:

- [ ] Unit tests pass (`pnpm test`)
- [ ] Parser correctly extracts versions
- [ ] Parser handles edge cases (missing dates, malformed markdown)
- [ ] Ingestion task runs successfully locally
- [ ] Releases appear in database after ingestion
- [ ] Changes are classified correctly (not all "OTHER")
- [ ] LLM summaries are generated (or fallback works)
- [ ] Web UI displays releases correctly
- [ ] Version sorting is correct (semantic, not lexicographic)
- [ ] Logo appears on tool page
- [ ] No errors in browser console

---

## CI/CD Integration

### GitHub Actions Example

**File**: `.github/workflows/test.yml`

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 9.11.0

      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install

      - run: pnpm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
```

---

## Further Reading

- [guides/adding-a-tool.md](adding-a-tool.md) - Testing new tools during development
- [reference/parsers.md](../reference/parsers.md) - Parser development and testing patterns
- [guides/deployment.md](deployment.md) - Post-deployment testing
- [Vitest Documentation](https://vitest.dev)
- [Trigger.dev Testing Guide](https://trigger.dev/docs/testing)

---

**Questions?** Open an issue on GitHub or consult the [documentation index](../README.md).
