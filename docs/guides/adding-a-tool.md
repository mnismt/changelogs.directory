# Adding a New Tool to Changelogs.directory

> **Last verified**: 2025-12-05 with claude-code, codex, and cursor examples

This guide walks you through adding a new tool (like "Google Antigravity") to the changelog aggregation platform.

## TL;DR Checklist

- [ ] **Step 1: Database Setup** (5 min) - Add tool record to `prisma/seed.ts`
- [ ] **Step 2: Logo Component** (10 min) - Create SVG component and register in logoMap
- [ ] **Step 3: Version Formatter** (Optional, 5 min) - Add custom version display logic if needed
- [ ] **Step 4: Ingestion Pipeline** (60-180 min) - Copy and customize trigger task
- [ ] **Step 5: Testing** (15 min) - Test locally and verify results
- [ ] **Step 6: Deployment** (10 min) - Deploy to Trigger.dev and activate schedule

**Estimated Total Time**: 1-3 hours (depending on source complexity)

---

## Step 1: Database Setup (5 minutes)

### 1.1 Choose Your Source Type

First, determine how the tool publishes changelogs:

| Source Type | Use When | Example Tool | Complexity |
|-------------|----------|--------------|------------|
| `CHANGELOG_MD` | Tool has a CHANGELOG.md file in their GitHub repo | Claude Code | Simple ⭐ |
| `GITHUB_RELEASES` | Tool publishes via GitHub Releases API | Codex | Medium ⭐⭐ |
| `CUSTOM_API` | Tool has a custom changelog webpage (HTML scraping) | Cursor | Complex ⭐⭐⭐ |
| `RSS_FEED` | Tool publishes via RSS/Atom feed | (Not yet implemented) | Simple ⭐ |

**Decision Tree**:
```
Does the tool have a GitHub repository?
├─ Yes: Does it have a CHANGELOG.md file?
│   ├─ Yes → Use CHANGELOG_MD
│   └─ No: Does it use GitHub Releases?
│       ├─ Yes → Use GITHUB_RELEASES
│       └─ No → Use CUSTOM_API (HTML scraping)
└─ No: Does it have a custom changelog page?
    ├─ Yes → Use CUSTOM_API
    └─ No → Not suitable for aggregation
```

### 1.2 Add Tool to `prisma/seed.ts`

Open `prisma/seed.ts` and add a new tool record. Choose the example that matches your source type:

#### Example A: CHANGELOG_MD (like Claude Code)

```typescript
// Add this before the final console.log in main()
const googleAntigravity = await prisma.tool.upsert({
	where: { slug: "google-antigravity" },
	update: {
		name: "Google Antigravity",
		vendor: "Google",
		description: "Google's experimental gravity manipulation CLI",
		homepage: "https://antigravity.google.dev",
		repositoryUrl: "https://github.com/google/antigravity",
		sourceType: "CHANGELOG_MD",
		sourceUrl: "https://raw.githubusercontent.com/google/antigravity/main/CHANGELOG.md",
		tags: ["cli", "physics", "google", "experimental"],
		isActive: true,
	},
	create: {
		slug: "google-antigravity",
		name: "Google Antigravity",
		vendor: "Google",
		description: "Google's experimental gravity manipulation CLI",
		homepage: "https://antigravity.google.dev",
		repositoryUrl: "https://github.com/google/antigravity",
		sourceType: "CHANGELOG_MD",
		sourceUrl: "https://raw.githubusercontent.com/google/antigravity/main/CHANGELOG.md",
		tags: ["cli", "physics", "google", "experimental"],
		isActive: true,
	},
})

console.log(`✅ Seeded tool: ${googleAntigravity.name} (${googleAntigravity.slug})`)
```

#### Example B: GITHUB_RELEASES (like Codex)

```typescript
const googleAntigravity = await prisma.tool.upsert({
	where: { slug: "google-antigravity" },
	update: {
		name: "Google Antigravity",
		vendor: "Google",
		description: "Google's experimental gravity manipulation CLI",
		homepage: "https://github.com/google/antigravity",
		repositoryUrl: "https://github.com/google/antigravity",
		sourceType: "GITHUB_RELEASES",
		sourceUrl: "https://api.github.com/repos/google/antigravity/releases",
		sourceConfig: {
			versionPrefix: "v",              // Strip "v" from version tags
			includePreReleases: true,        // Include beta/alpha releases
		},
		tags: ["cli", "physics", "google"],
		isActive: true,
	},
	create: {
		slug: "google-antigravity",
		name: "Google Antigravity",
		vendor: "Google",
		description: "Google's experimental gravity manipulation CLI",
		homepage: "https://github.com/google/antigravity",
		repositoryUrl: "https://github.com/google/antigravity",
		sourceType: "GITHUB_RELEASES",
		sourceUrl: "https://api.github.com/repos/google/antigravity/releases",
		sourceConfig: {
			versionPrefix: "v",
			includePreReleases: true,
		},
		tags: ["cli", "physics", "google"],
		isActive: true,
	},
})

console.log(`✅ Seeded tool: ${googleAntigravity.name} (${googleAntigravity.slug})`)
```

#### Example C: CUSTOM_API (like Cursor)

```typescript
const googleAntigravity = await prisma.tool.upsert({
	where: { slug: "google-antigravity" },
	update: {
		name: "Google Antigravity",
		vendor: "Google",
		description: "Google's experimental gravity manipulation CLI",
		homepage: "https://antigravity.google.dev",
		repositoryUrl: "https://antigravity.google.dev",
		sourceType: "CUSTOM_API",
		sourceUrl: "https://antigravity.google.dev/changelog",
		sourceConfig: {
			baseUrl: "https://antigravity.google.dev",
			startPath: "/changelog",
			articleSelector: "article.changelog-entry",   // CSS selector for each release
			bodySelector: ".content",                      // CSS selector for release content
			nextLinkSelector: "a.pagination-next",         // CSS selector for "next page" link
			maxPagesPerRun: 6,                             // Limit pages per ingestion run
			initialPageCount: 40,                          // Pages to crawl on first run
		},
		tags: ["cli", "physics", "google"],
		isActive: true,
	},
	create: {
		slug: "google-antigravity",
		name: "Google Antigravity",
		vendor: "Google",
		description: "Google's experimental gravity manipulation CLI",
		homepage: "https://antigravity.google.dev",
		repositoryUrl: "https://antigravity.google.dev",
		sourceType: "CUSTOM_API",
		sourceUrl: "https://antigravity.google.dev/changelog",
		sourceConfig: {
			baseUrl: "https://antigravity.google.dev",
			startPath: "/changelog",
			articleSelector: "article.changelog-entry",
			bodySelector: ".content",
			nextLinkSelector: "a.pagination-next",
			maxPagesPerRun: 6,
			initialPageCount: 40,
		},
		tags: ["cli", "physics", "google"],
		isActive: true,
	},
})

console.log(`✅ Seeded tool: ${googleAntigravity.name} (${googleAntigravity.slug})`)
```

**Field Explanations**:
- `slug`: URL-friendly identifier (lowercase, hyphens) - used in routes like `/tools/google-antigravity`
- `name`: Display name shown in UI
- `vendor`: Company name
- `description`: Short 1-line description for directory listing
- `homepage`: Official website URL
- `repositoryUrl`: GitHub repo or official site
- `sourceType`: How to fetch changelogs (see table above)
- `sourceUrl`: Direct URL to changelog source
- `sourceConfig`: Optional JSON with source-specific configuration
- `tags`: Array of tags for filtering/search
- `isActive`: Set to `true` to enable ingestion

### 1.3 Run Seed

```bash
pnpm prisma db seed
```

**Expected Output**:
```
✅ Seeded tool: Claude Code (claude-code)
✅ Seeded tool: Codex (codex)
✅ Seeded tool: Cursor (cursor)
✅ Seeded tool: Google Antigravity (google-antigravity)
Database seed completed!
```

**Verify** in database:
```bash
pnpm prisma studio
# Navigate to Tool model and verify your new tool exists
```

**Cross-reference**: See [reference/database-schema.md](../reference/database-schema.md) for full schema details.

---

## Step 2: Logo Component (10 minutes)

### 2.1 Create SVG Component

Create a new React component for your tool's logo:

**File**: `src/components/logo/google-antigravity.tsx`

```tsx
export function GoogleAntigravity() {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className="w-6 h-6"
		>
			{/* Replace with your actual SVG paths */}
			<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
			<path
				d="M8 12 L12 8 L16 12"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}
```

**Tips**:
- Use `currentColor` for `stroke` and `fill` to support monochrome theming
- Set `viewBox` to match your SVG's original dimensions
- Keep the component simple - just the SVG, no props
- Follow the [design rules](../design/design-rules.md) for monochrome aesthetic

### 2.2 Register Logo in logoMap

**File**: `src/lib/tool-logos.tsx`

```tsx
import { GoogleAntigravity } from '@/components/logo/google-antigravity'

function createGoogleAntigravityLogo(): ReactNode {
	return <GoogleAntigravity />
}

const logoMap: Record<string, () => ReactNode> = {
	'claude-code': createClaudeLogo,
	codex: createOpenAILogo,
	cursor: createCursorLogo,
	'google-antigravity': createGoogleAntigravityLogo, // Add this line
}
```

**Optional**: If your logo is already monochrome (single color), add it to the monochrome set:

```tsx
const monochromeLogos = new Set(['cursor', 'google-antigravity'])
```

**Verify**: The logo should now appear on `/tools/google-antigravity` page automatically.

---

## Step 3: Version Formatter (Optional, 5 minutes)

**Only needed if your tool has non-standard version formats.**

**Examples of when you need this**:
- Codex: `"codex-rs-abc123-1-rust-v0.0.25"` → display as `"v0.0.25"`
- Cursor: `"cursor-2-1"` → display as `"v2.1"`
- Standard: `"1.2.3"` → display as `"v1.2.3"` (no formatter needed)

**File**: `src/lib/version-formatter.ts`

```tsx
function formatGoogleAntigravityVersion(version: string): string {
	// Example: "gag-2024.11.30-beta" → "v2024.11.30-beta"
	if (version.startsWith('gag-')) {
		return `v${version.replace(/^gag-/, '')}`
	}
	return `v${version}`
}

const formatters: Record<string, (v: string) => string> = {
	codex: formatCodexVersion,
	cursor: formatCursorVersion,
	'claude-code': formatClaudeCodeVersion,
	'google-antigravity': formatGoogleAntigravityVersion, // Add this line
}
```

**Skip this step** if your versions are already in standard format (e.g., `"1.2.3"`, `"v1.2.3"`).

---

## Step 4: Ingestion Pipeline (60-180 minutes)

This is the most substantial step. You'll create a Trigger.dev task that fetches, parses, and stores changelog data.

### 4.1 Copy Template

Choose a template based on your `sourceType`:

```bash
# For CHANGELOG_MD (simple markdown file)
cp -r src/trigger/ingest/claude-code src/trigger/ingest/google-antigravity

# For GITHUB_RELEASES (GitHub API)
cp -r src/trigger/ingest/codex src/trigger/ingest/google-antigravity

# For CUSTOM_API (HTML scraping)
cp -r src/trigger/ingest/cursor src/trigger/ingest/google-antigravity
```

This creates a new directory:
```
src/trigger/ingest/google-antigravity/
├── index.ts          # Task definition + 7-phase orchestration
├── types.ts          # TypeScript interfaces
├── steps/
│   ├── setup.ts      # ✅ Reusable (no changes needed)
│   ├── fetch.ts      # ⚠️ Customize for your source
│   ├── parse.ts      # ⚠️ Customize for your data format
│   ├── filter.ts     # ✅ Reusable (no changes needed)
│   ├── enrich.ts     # ✅ Reusable (no changes needed)
│   ├── upsert.ts     # ✅ Reusable (no changes needed)
│   └── finalize.ts   # ✅ Reusable (no changes needed)
└── README.md         # Optional: document tool-specific details
```

### 4.2 Customize `index.ts`

**File**: `src/trigger/ingest/google-antigravity/index.ts`

> **Prisma v7+**: Workers must use a driver adapter. See the existing worker files for the pattern:
> ```typescript
> import { PrismaPg } from '@prisma/adapter-pg'
> import { PrismaClient } from '@/generated/prisma/client'
>
> const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
> const prisma = new PrismaClient({ adapter })
> ```

**Changes to make**:

```typescript
// 1. Update task ID (must be unique)
export const ingestGoogleAntigravity = task({
	id: 'ingest-google-antigravity', // CHANGE THIS
	queue: { concurrencyLimit: 1 },
	maxDuration: 300,
	run: async (payload = {}) => {
		const toolSlug = payload.toolSlug || 'google-antigravity' // CHANGE THIS
		// ... rest remains the same
	}
})

// 2. Update schedule ID and task name
export const ingestGoogleAntigravitySchedule = schedules.task({
	id: 'ingest-google-antigravity-schedule', // CHANGE THIS
	cron: '0 */6 * * *', // Every 6 hours (customize if needed)
	run: async () => {
		await ingestGoogleAntigravity.trigger({}) // CHANGE THIS
	}
})
```

**Everything else** (the 7-phase pipeline structure) stays the same.

### 4.3 Customize Source-Specific Steps

**For CHANGELOG_MD** (copied from `claude-code`):
- `steps/fetch.ts`: No changes needed (fetches raw markdown from GitHub)
- `steps/parse.ts`: No changes needed (uses generic markdown parser)
- `steps/fetch-dates.ts`: Optional, fetches release dates from Git history

**For GITHUB_RELEASES** (copied from `codex`):
- `steps/fetch.ts`: Update GitHub API URL if different from `sourceUrl`
- `steps/parse.ts`: Customize if release notes format is unusual

**For CUSTOM_API** (copied from `cursor`):
- `steps/fetch-pages.ts`: Verify CSS selectors work for your site
- `steps/parse.ts`: Customize extraction logic for your HTML structure
- Test with actual HTML from your changelog page

**Pro Tip**: Most customization happens in `parse.ts`. The parser must return this structure:

```typescript
interface ParsedRelease {
	version: string           // "1.2.3"
	versionSort: string       // "0001.0002.0003.0000" (for sorting)
	releaseDate?: Date        // From source or Git history
	title?: string            // Optional title
	headline: string          // One-line summary
	summary?: string          // 1-2 sentence summary (LLM generates if missing)
	rawContent: string        // Original markdown/HTML
	contentHash: string       // SHA256 for change detection
	changes: ParsedChange[]   // Array of bullet points
	sourceUrl?: string        // Direct link to this release
}
```

**Cross-reference**: See [reference/parsers.md](../reference/parsers.md) for detailed parser development guide.

### 4.4 Generic Steps (No Changes Needed)

These steps work for all tools and don't need modification:

- **setup.ts**: Loads tool from database, creates FetchLog
- **filter.ts**: Skips unchanged releases (via `contentHash` comparison)
- **enrich.ts**: LLM classification of changes (Google Gemini)
- **upsert.ts**: Saves releases and changes to database
- **finalize.ts**: Updates FetchLog with success/failure metrics

**Cross-reference**: See [reference/ingestion-pipeline.md](../reference/ingestion-pipeline.md) for 7-phase architecture deep dive.

---

## Step 5: Testing (15 minutes)

### 5.1 Local Testing

Start the Trigger.dev dev server:

```bash
pnpm exec trigger.dev@latest dev
```

**Expected Output**:
```
✔ Trigger.dev dev server ready
  - ingest-claude-code
  - ingest-codex
  - ingest-cursor
  - ingest-google-antigravity  ← Your new task
```

### 5.2 Trigger Manually

**Option A**: Via Trigger.dev Dashboard
1. Open http://localhost:3030
2. Find `ingest-google-antigravity` task
3. Click "Test" → "Run Test"
4. Monitor logs in real-time

**Option B**: Via Code (create a test file)

**File**: `test-google-antigravity.ts` (temporary, don't commit)

```typescript
import { ingestGoogleAntigravity } from './src/trigger/ingest/google-antigravity'

await ingestGoogleAntigravity.trigger({ toolSlug: 'google-antigravity' })
```

Run: `pnpm tsx test-google-antigravity.ts`

### 5.3 Verify Results

**Check Prisma Studio**:
```bash
pnpm prisma studio
```
Navigate to `Release` model and filter by your tool.

**Check via SQL**:
```bash
# If using PostgreSQL locally
psql $DATABASE_URL -c "
SELECT version, \"releaseDate\", headline
FROM release
WHERE \"toolId\" = (SELECT id FROM tool WHERE slug = 'google-antigravity')
ORDER BY \"versionSort\" DESC
LIMIT 10
"
```

**Expected**: You should see releases with:
- Versions extracted correctly
- Release dates (if available)
- Headlines and summaries
- Changes classified by type (FEATURE, BUGFIX, etc.)

**Cross-reference**: See [guides/testing.md](testing.md) for comprehensive testing strategies.

---

## Step 6: Deployment (10 minutes)

### 6.1 Deploy to Trigger.dev

```bash
pnpm exec trigger.dev@latest deploy
```

**Expected Output**:
```
✔ Deploying tasks...
  - ingest-claude-code
  - ingest-codex
  - ingest-cursor
  - ingest-google-antigravity
✔ Deployment successful
```

### 6.2 Verify Schedule

1. Open [Trigger.dev Dashboard](https://cloud.trigger.dev)
2. Navigate to **Schedules**
3. Verify `ingest-google-antigravity-schedule` is listed
4. Check "Next Run" time (should be within 6 hours)

### 6.3 Set Environment Variables (if not already set)

In Trigger.dev project settings, ensure these are set:

- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_VERTEX_CREDENTIALS` - JSON service account credentials (for LLM enrichment)
- `GITHUB_TOKEN` - (Optional) GitHub PAT for higher rate limits
- `UPSTASH_REDIS_REST_URL` - (Optional) For caching (Cursor only)
- `UPSTASH_REDIS_REST_TOKEN` - (Optional) For caching (Cursor only)

**Cross-reference**: See [guides/environment-variables.md](environment-variables.md) for complete list.

### 6.4 Monitor First Run

Wait for the schedule to trigger (or manually trigger via dashboard):

1. Go to **Runs** tab in Trigger.dev
2. Find `ingest-google-antigravity` run
3. Monitor for errors
4. Verify `SUCCESS` status
5. Check database for new releases

**Cross-reference**: See [guides/deployment.md](deployment.md) for production deployment best practices.

---

## Common Patterns

### Pattern 1: CHANGELOG_MD (Simple) ⭐

**Example**: Claude Code
**Source**: Raw markdown file from GitHub
**Parser**: `src/lib/parsers/changelog-md.ts` (generic)
**Complexity**: Low - works with most standard markdown changelogs
**Time**: 1-2 hours

**When to use**:
- Tool has `CHANGELOG.md` or `HISTORY.md` in GitHub repo
- Changelog follows standard markdown format with `## Version` headers
- No custom HTML, just plain markdown

### Pattern 2: GITHUB_RELEASES (Medium) ⭐⭐

**Example**: Codex
**Source**: GitHub Releases API
**Parser**: `src/lib/parsers/github-releases.ts`
**Complexity**: Medium - requires API pagination, version prefix handling
**Time**: 2-3 hours

**When to use**:
- Tool publishes releases via GitHub
- Each release has notes in GitHub's release description
- May need to handle pre-releases, version prefixes

**Special Config**:
```json
{
  "versionPrefix": "rust-v",  // Strip prefix from version tags
  "includePreReleases": true  // Include beta/alpha releases
}
```

### Pattern 3: CUSTOM_API (Complex) ⭐⭐⭐

**Example**: Cursor
**Source**: Custom HTML changelog page
**Parser**: Custom HTML extraction
**Complexity**: High - requires CSS selector configuration, pagination logic
**Time**: 3-4 hours

**When to use**:
- Tool has a custom changelog webpage (not GitHub)
- Need to scrape HTML with specific selectors
- Pagination required for multiple pages
- May include rich media (videos, images)

**Special Config**:
```json
{
  "baseUrl": "https://example.com",
  "articleSelector": "article.release",   // CSS for each release
  "bodySelector": ".content",              // CSS for release body
  "nextLinkSelector": "a.next",            // CSS for pagination
  "maxPagesPerRun": 6,                     // Limit per run
  "initialPageCount": 40                   // First run limit
}
```

**Additional Files**:
- `steps/fetch-pages.ts` - Multi-page crawler
- `cache.ts` - Redis caching for incremental crawls (optional)
- `config.ts` - Selector configuration

---

## Troubleshooting

### Issue: "Tool not found in database"

**Symptom**: Error during `setupStep`: `Tool with slug 'google-antigravity' not found`

**Fix**: Run `pnpm prisma db seed` to populate the database with your tool.

---

### Issue: "Parser failed to extract version"

**Symptom**: No releases ingested, or parser returns empty array

**Fix**:
1. Check `sourceUrl` is accessible:
   ```bash
   curl https://raw.githubusercontent.com/google/antigravity/main/CHANGELOG.md
   ```
2. Verify changelog format matches parser expectations
3. Add debug logging in `parse.ts`:
   ```typescript
   console.log('Raw content:', fetchResult.markdown.substring(0, 500))
   ```
4. Test parser in isolation:
   ```typescript
   import { parseChangelogMd } from '@/lib/parsers/changelog-md'
   const result = parseChangelogMd(rawMarkdown)
   console.log(result)
   ```

**Cross-reference**: See [reference/parsers.md](../reference/parsers.md) for parser debugging.

---

### Issue: LLM enrichment failing

**Symptom**: `enrichStep` throws errors about missing credentials

**Fix**:
1. Verify `GOOGLE_VERTEX_CREDENTIALS` is set in Trigger.dev environment
2. Check credentials JSON is valid:
   ```bash
   echo $GOOGLE_VERTEX_CREDENTIALS | jq .
   ```
3. Ensure service account has "Vertex AI User" role in Google Cloud
4. Fallback to keyword classification will activate automatically if LLM fails

**Cross-reference**: See [guides/environment-variables.md](environment-variables.md).

---

### Issue: GitHub rate limiting

**Symptom**: Fetch fails with `403 rate limit exceeded`

**Fix**:
1. Add `GITHUB_TOKEN` to Trigger.dev environment variables
2. Create token at https://github.com/settings/tokens (public_repo scope)
3. Authenticated requests get 5000 req/hr vs 60 req/hr unauthenticated

---

### Issue: Schedule not running

**Symptom**: Manual trigger works, but schedule doesn't run automatically

**Fix**:
1. Verify schedule is enabled in Trigger.dev dashboard
2. Check cron syntax is valid: https://crontab.guru/
3. Ensure `ingestGoogleAntigravitySchedule` is exported from `index.ts`
4. Redeploy: `pnpm exec trigger.dev@latest deploy`

---

## Further Reading

- [reference/ingestion-pipeline.md](../reference/ingestion-pipeline.md) - Deep dive into 7-phase pipeline architecture
- [reference/parsers.md](../reference/parsers.md) - Parser development patterns and examples
- [reference/database-schema.md](../reference/database-schema.md) - Database schema and query patterns
- [guides/testing.md](testing.md) - Comprehensive testing strategies
- [guides/deployment.md](deployment.md) - Production deployment procedures
- [guides/environment-variables.md](environment-variables.md) - Environment variable reference

---

## Success Checklist

After completing all steps, verify:

- ✅ Tool appears in database (`pnpm prisma studio`)
- ✅ Tool logo shows on `/tools/google-antigravity` page
- ✅ Releases are ingested successfully (check database)
- ✅ Changes are classified correctly (not all "OTHER")
- ✅ LLM summaries are generated (or fallback to keywords)
- ✅ Schedule is active in Trigger.dev dashboard
- ✅ First scheduled run completes successfully
- ✅ Tool appears in homepage feed (if added to tracked tools)

**Next**: Consider adding your tool to the homepage filter by editing `src/routes/index.tsx` line 57.

---

**Questions?** Open an issue on GitHub or consult the [documentation index](../README.md).
