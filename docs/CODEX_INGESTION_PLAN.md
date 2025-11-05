# Implementation Plan: OpenAI Codex Ingestion Pipeline

## Problem Statement

Implement an ingestion pipeline for OpenAI Codex that:
1. Fetches releases from GitHub Releases API (not CHANGELOG.md)
2. Handles both stable releases AND pre-releases (alpha versions)
3. Parses structured release notes with "Highlights" and "Merged PRs" sections
4. Properly sorts pre-release versions alongside stable versions
5. Provides accurate release dates from GitHub API (not Git history)

## Key Differences from Claude Code

| Aspect | Claude Code | Codex |
|--------|-------------|-------|
| **Source** | CHANGELOG.md file | GitHub Releases API |
| **Format** | Markdown sections by version | JSON API with body field |
| **Pre-releases** | Not applicable | Has alpha versions (e.g., `0.54.0-alpha.3`) |
| **Release dates** | Parsed from CHANGELOG or Git commits | Provided by GitHub API (`published_at`) |
| **Version scheme** | Simple semver (2.0.31) | Rust-style tags (`rust-v0.55.0`) |
| **Body structure** | Bullet points | Highlights + Merged PRs sections |

## Current State Analysis

### Existing Architecture

**Tool model** (`prisma/schema.prisma`):
- Already supports `GITHUB_RELEASES` source type ✅
- Has `sourceUrl`, `sourceConfig` JSON field for flexibility ✅

**Claude Code ingestion** (`src/trigger/ingest/claude-code/`):
- 7-phase pipeline: Setup → Fetch → Fetch Dates → Parse → Filter → Enrich → Upsert
- Fetches CHANGELOG.md as raw text
- Uses Git commit history to derive release dates
- Parser: `src/lib/parsers/changelog-md.ts`

**GitHub API utilities** (`src/lib/github/api.ts`):
- `fetchCommitHistory()` - paginated commit fetching
- `buildVersionDateMapping()` - maps versions to dates from Git
- Token support via `GITHUB_TOKEN` environment variable

**Version sorting** (`src/lib/parsers/changelog-md.ts` line 151-170):
```typescript
function generateVersionSort(version: string): string {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(.*)$/);
  if (!match) return version; // Fallback for non-semver

  const [_, major, minor, patch, suffix] = match;
  const base = `${major.padStart(3, '0')}${minor.padStart(3, '0')}${patch.padStart(3, '0')}`;

  // Stable (no suffix) gets 'z' prefix to sort AFTER pre-releases
  if (!suffix) return `${base}-z`;

  // Pre-release gets 'a' prefix to sort BEFORE stable
  return `${base}-a${suffix}`;
}
```
**Problem**: This works, but we can leverage GitHub's built-in pre-release flag for better accuracy.

## Research Findings

### GitHub Releases API Structure

**Endpoint**: `https://api.github.com/repos/openai/codex/releases?per_page=100`

**Key fields**:
```json
{
  "tag_name": "rust-v0.55.0",
  "name": "0.55.0",
  "body": "## Highlights\n\n#6222 reverted #6189...\n\n## Merged PRs\n \n- #6222 Revert...\n- #6208 ignore deltas...",
  "prerelease": false,
  "draft": false,
  "published_at": "2025-11-04T20:26:09Z",
  "created_at": "2025-11-04T20:00:54Z",
  "html_url": "https://github.com/openai/codex/releases/tag/rust-v0.55.0",
  "assets": [...]
}
```

**Observations**:
1. **Tag format**: `rust-v0.55.0` (contains "rust-v" prefix)
2. **Name field**: Clean version `0.55.0` (no prefix)
3. **Pre-release flag**: Boolean `prerelease` field indicates alpha/beta versions
4. **Body format**: Markdown with optional "Highlights" and "Merged PRs" sections
5. **Some alpha versions have empty body**: e.g., `rust-v0.54.0-alpha.3` has `body: ""`
6. **Dates are accurate**: `published_at` is the official release timestamp

### Pre-release Handling

**Example from API**:
```
rust-v0.55.0          | prerelease: false  | published: 2025-11-04
rust-v0.54.0          | prerelease: false  | published: 2025-11-04  
rust-v0.54.0-alpha.3  | prerelease: true   | published: 2025-11-04
rust-v0.54.0-alpha.2  | prerelease: true   | published: 2025-11-03
rust-v0.53.0          | prerelease: false  | published: 2025-10-31
```

**Decision**: Include pre-releases by default (set `isActive: true`) because:
- Developers using Codex care about alpha/beta versions
- GitHub's `prerelease` flag is accurate
- We can filter them in the UI using Release tags

## Proposed Implementation

### 1. Create GitHub Releases Parser

**File**: `src/lib/parsers/github-releases.ts`

**Interface**:
```typescript
export interface GitHubRelease {
  tag_name: string
  name: string
  body: string
  prerelease: boolean
  draft: boolean
  published_at: string
  html_url: string
}

export function parseGitHubReleases(
  releases: GitHubRelease[],
  config?: {
    versionPrefix?: string // e.g., "rust-v"
    includeDrafts?: boolean
    includePreReleases?: boolean
  }
): ParsedRelease[]
```

**Logic**:
1. Filter out drafts (unless `includeDrafts: true`)
2. Optionally filter pre-releases (controlled by config)
3. Strip version prefix from `tag_name` (e.g., `rust-v0.55.0` → `0.55.0`)
4. Use `name` field if version extraction fails
5. Parse `body` markdown:
   - Extract "Highlights" section (if present)
   - Extract "Merged PRs" section (if present)
   - Parse bullet points as changes
6. Set `releaseDate` from `published_at` (no Git history needed)
7. Generate `versionSort` with pre-release handling:
   ```typescript
   function generateVersionSort(version: string, isPreRelease: boolean): string {
     const base = generateSemverBase(version) // e.g., "000055000"
     return isPreRelease ? `${base}-a${version}` : `${base}-z`
   }
   ```
8. Add `tags: ["prerelease"]` if `prerelease: true`
9. Hash `body` for `contentHash`

**Body parsing strategy**:
```typescript
function parseReleaseBody(body: string): ParsedChange[] {
  const changes: ParsedChange[] = []
  let currentSection: 'highlights' | 'merged_prs' | 'other' = 'other'
  
  // Detect sections
  if (body.includes('## Highlights')) {
    // Extract highlights as high-impact changes
    // Type: FEATURE or IMPROVEMENT
  }
  
  if (body.includes('## Merged PRs')) {
    // Extract PR references as granular changes
    // Type: inferred from PR title
  }
  
  // If no sections, parse as flat bullet list (fallback)
  
  return changes
}
```

**PR reference extraction**:
- Pattern: `- #6222 Revert "fix: pin musl 1.2.5 for DNS fixes"`
- Extract PR number, title
- Create link: `{ url: "https://github.com/openai/codex/pull/6222", type: "pr" }`

### 2. Create Fetch Step for GitHub API

**File**: `src/lib/github/releases.ts`

**Function**:
```typescript
export async function fetchGitHubReleases(
  repoUrl: string,
  token?: string,
  options?: {
    includeDrafts?: boolean
    includePreReleases?: boolean
    perPage?: number
  }
): Promise<GitHubRelease[]> {
  const repo = parseGitHubRepoUrl(repoUrl)
  if (!repo) throw new Error(`Invalid GitHub URL: ${repoUrl}`)
  
  const headers = {
    'User-Agent': 'Changelogs.directory Bot',
    'Accept': 'application/vnd.github.v3+json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
  
  let allReleases: GitHubRelease[] = []
  let page = 1
  const perPage = options?.perPage || 100
  
  // Paginate through all releases
  while (true) {
    const url = `https://api.github.com/repos/${repo.owner}/${repo.name}/releases?per_page=${perPage}&page=${page}`
    const response = await fetch(url, { headers })
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }
    
    const releases = await response.json() as GitHubRelease[]
    
    if (releases.length === 0) break
    
    // Filter drafts and pre-releases based on options
    const filtered = releases.filter(r => {
      if (r.draft && !options?.includeDrafts) return false
      if (r.prerelease && !options?.includePreReleases) return false
      return true
    })
    
    allReleases = [...allReleases, ...filtered]
    
    if (releases.length < perPage) break
    page++
  }
  
  return allReleases
}
```

**Note**: GitHub API rate limits:
- Unauthenticated: 60 requests/hour
- Authenticated: 5,000 requests/hour
- **Solution**: Always use `GITHUB_TOKEN` (already supported in codebase)

### 3. Create Codex Ingestion Task

**File**: `src/trigger/ingest/codex/index.ts`

**Structure**: Mirror Claude Code's 7-phase pipeline:

```typescript
export const ingestCodex = task({
  id: 'ingest-codex',
  queue: { concurrencyLimit: 1 },
  maxDuration: 300,
  run: async (payload: { toolSlug?: string } = {}) => {
    const toolSlug = payload.toolSlug || 'codex'
    
    try {
      // Phase 1: Setup (load tool, create FetchLog)
      const ctx = await setupStep(prisma, toolSlug, Date.now())
      
      // Phase 2: Fetch releases from GitHub API
      const fetchResult = await fetchStep(ctx)
      
      // Phase 3: Parse releases (no fetch-dates step needed)
      const parseResult = parseStep(fetchResult)
      
      // Phase 4: Filter unchanged releases (by contentHash)
      const filterResult = await filterStep(ctx, parseResult)
      
      // Phase 5: Enrich with LLM (optional, reuse Claude Code's logic)
      const enrichResult = await enrichStep(filterResult)
      
      // Phase 6: Upsert to database
      const upsertResult = await upsertStep(ctx, enrichResult)
      
      // Phase 7: Finalize (update FetchLog, tool.lastFetchedAt)
      await finalizeStep(ctx, fetchResult, parseResult, filterResult, upsertResult)
      
      return { success: true, ...upsertResult }
    } catch (error) {
      await handleFailure(ctx, error)
      throw error
    }
  }
})
```

**Differences from Claude Code**:
- **Skip fetch-dates step**: Dates come from GitHub API, not Git history
- **Fetch step**: Calls `fetchGitHubReleases()` instead of raw file fetch
- **Parse step**: Uses `parseGitHubReleases()` instead of `parseChangelogMd()`

### 4. Steps Implementation

**File**: `src/trigger/ingest/codex/steps/fetch.ts`
```typescript
import { fetchGitHubReleases } from '@/lib/github/releases'

export async function fetchStep(ctx: IngestionContext) {
  logger.info('Phase 2: Fetch releases from GitHub API', {
    url: ctx.tool.sourceUrl
  })
  
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    logger.warn('GITHUB_TOKEN not set - rate limits will be lower')
  }
  
  const config = ctx.tool.sourceConfig as { 
    versionPrefix?: string
    includePreReleases?: boolean 
  }
  
  const releases = await fetchGitHubReleases(
    ctx.tool.repositoryUrl, // Use repo URL, not sourceUrl
    token,
    {
      includeDrafts: false, // Never include drafts
      includePreReleases: config?.includePreReleases ?? true // Default: include
    }
  )
  
  logger.info('Fetched releases', {
    totalReleases: releases.length,
    preReleases: releases.filter(r => r.prerelease).length
  })
  
  return { releases }
}
```

**File**: `src/trigger/ingest/codex/steps/parse.ts`
```typescript
import { parseGitHubReleases } from '@/lib/parsers/github-releases'

export function parseStep(fetchResult: FetchResult) {
  logger.info('Phase 3: Parse releases')
  
  const releases = parseGitHubReleases(
    fetchResult.releases,
    {
      versionPrefix: 'rust-v', // Strip "rust-v" prefix
      includePreReleases: true
    }
  )
  
  return { releases }
}
```

**File**: `src/trigger/ingest/codex/steps/filter.ts`
- Reuse Claude Code's filter step (unchanged)
- Compares `contentHash` to detect changed releases

**File**: `src/trigger/ingest/codex/steps/enrich.ts`
- Reuse Claude Code's enrich step (unchanged)
- Uses LLM to classify changes and generate summaries

**File**: `src/trigger/ingest/codex/steps/upsert.ts`
- Reuse Claude Code's upsert step (unchanged)
- Idempotent upsert based on `toolId + version`

**File**: `src/trigger/ingest/codex/steps/finalize.ts`
- Reuse Claude Code's finalize step (unchanged)
- Updates FetchLog and tool.lastFetchedAt

### 5. Seed Codex Tool

**File**: `prisma/seed.ts` (add to existing file)

```typescript
// Seed OpenAI Codex tool
const codex = await prisma.tool.upsert({
  where: { slug: 'codex' },
  update: {
    name: 'Codex',
    vendor: 'OpenAI',
    description: 'OpenAI Codex CLI - AI-powered code generation and understanding tool.',
    homepage: 'https://github.com/openai/codex',
    repositoryUrl: 'https://github.com/openai/codex',
    sourceType: 'GITHUB_RELEASES',
    sourceUrl: 'https://api.github.com/repos/openai/codex/releases', // Not used directly
    sourceConfig: {
      versionPrefix: 'rust-v',
      includePreReleases: true
    },
    tags: ['ai', 'cli', 'code-generation', 'openai', 'rust'],
    isActive: true
  },
  create: {
    slug: 'codex',
    name: 'Codex',
    vendor: 'OpenAI',
    description: 'OpenAI Codex CLI - AI-powered code generation and understanding tool.',
    homepage: 'https://github.com/openai/codex',
    repositoryUrl: 'https://github.com/openai/codex',
    sourceType: 'GITHUB_RELEASES',
    sourceUrl: 'https://api.github.com/repos/openai/codex/releases',
    sourceConfig: {
      versionPrefix: 'rust-v',
      includePreReleases: true
    },
    tags: ['ai', 'cli', 'code-generation', 'openai', 'rust'],
    isActive: true
  }
})

console.log(`✅ Seeded tool: ${codex.name} (${codex.slug})`)
```

### 6. Schedule Task

**File**: `src/trigger/ingest/codex/index.ts` (add to end)

```typescript
export const ingestCodexSchedule = schedules.task({
  id: 'ingest-codex-schedule',
  cron: '0 */6 * * *', // Every 6 hours (same as Claude Code)
  run: async () => {
    await ingestCodex.trigger({})
  }
})
```

## Pre-release Filtering Strategy

### Database Tags

Use `Release.tags[]` to mark pre-releases:
```typescript
// In parseGitHubReleases()
if (release.prerelease) {
  parsedRelease.tags = ['prerelease']
}
```

### UI Filtering

Users can filter out pre-releases on:
- Tool page: "Show stable only" toggle
- Homepage feed: "Exclude pre-releases" filter
- Query example:
  ```typescript
  await prisma.release.findMany({
    where: {
      toolId,
      tags: { isEmpty: true } // Exclude releases with tags (pre-releases)
    }
  })
  ```

### Default Behavior

**Include pre-releases by default** because:
1. Developers using Codex CLI actively track alpha versions
2. Codex releases alpha versions frequently (multiple per day sometimes)
3. We can easily filter them in the UI
4. GitHub's `prerelease` flag is authoritative

## Version Sorting with Pre-releases

### Enhanced Algorithm

**Current issue**: Pre-release alpha numbers need proper sorting:
- `0.54.0-alpha.1` < `0.54.0-alpha.2` < `0.54.0-alpha.3` < `0.54.0`

**Solution**: Extend `generateVersionSort()`:

```typescript
function generateVersionSort(version: string, isPreRelease: boolean): string {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(\w+)\.(\d+))?$/)
  if (!match) return version
  
  const [_, major, minor, patch, preType, preNum] = match
  const base = `${major.padStart(3, '0')}${minor.padStart(3, '0')}${patch.padStart(3, '0')}`
  
  // Stable releases (no suffix)
  if (!isPreRelease) {
    return `${base}-z` // Sort AFTER all pre-releases
  }
  
  // Pre-releases (alpha, beta, rc)
  const preTypeOrder = {
    'alpha': 'a',
    'beta': 'b',
    'rc': 'c'
  }[preType || 'alpha'] || 'a'
  
  const preNumber = (preNum || '0').padStart(3, '0')
  
  return `${base}-${preTypeOrder}${preNumber}`
}
```

**Examples**:
- `0.54.0-alpha.1` → `000054000-a001`
- `0.54.0-alpha.2` → `000054000-a002`
- `0.54.0-alpha.11` → `000054000-a011`
- `0.54.0` → `000054000-z`

**Result**: Correct chronological order ✅

## Testing Strategy

### 1. Unit Tests

**File**: `src/lib/parsers/github-releases.test.ts`
- Test version prefix stripping
- Test pre-release detection
- Test body parsing (highlights + merged PRs)
- Test empty body handling
- Test version sort generation

### 2. Integration Test

**Manual test**:
```bash
# Run seed to create Codex tool
pnpm prisma db seed

# Trigger ingestion manually (via Trigger.dev dashboard)
# Or via code:
pnpm trigger:dev
# Then call ingestCodex.trigger({})

# Verify database
pnpm prisma studio
# Check:
# - Tool "codex" exists
# - Releases created (should be 20-50 recent releases)
# - Pre-releases have tags: ["prerelease"]
# - Changes created with proper types
# - FetchLog shows success
```

### 3. Edge Cases to Test

- Empty release body (some alpha versions)
- Releases without "Highlights" or "Merged PRs" sections
- PR references with special characters
- Very long release bodies (>10KB)
- Duplicate version detection (idempotent upsert)

## File Structure

```
src/
├── lib/
│   ├── github/
│   │   ├── api.ts (existing)
│   │   └── releases.ts (NEW - fetch GitHub releases)
│   └── parsers/
│       ├── changelog-md.ts (existing)
│       └── github-releases.ts (NEW - parse releases)
├── trigger/
│   └── ingest/
│       ├── claude-code/ (existing)
│       └── codex/ (NEW)
│           ├── index.ts
│           ├── types.ts
│           ├── steps/
│           │   ├── setup.ts (reuse Claude Code's)
│           │   ├── fetch.ts (NEW - GitHub API)
│           │   ├── parse.ts (NEW - parseGitHubReleases)
│           │   ├── filter.ts (reuse)
│           │   ├── enrich.ts (reuse)
│           │   ├── upsert.ts (reuse)
│           │   └── finalize.ts (reuse)
│           └── README.md (NEW - docs)
└── ...

prisma/
└── seed.ts (UPDATE - add Codex tool)

docs/
└── CODEX_INGESTION_PLAN.md (this file)
```

## Implementation Checklist

### Phase 1: Parser & Utilities
- [ ] Create `src/lib/github/releases.ts` with `fetchGitHubReleases()`
- [ ] Create `src/lib/parsers/github-releases.ts` with `parseGitHubReleases()`
- [ ] Add pre-release handling to version sort logic
- [ ] Write unit tests for parser

### Phase 2: Trigger Task
- [ ] Create `src/trigger/ingest/codex/` directory structure
- [ ] Implement fetch step (GitHub API)
- [ ] Implement parse step (using new parser)
- [ ] Copy/adapt setup, filter, enrich, upsert, finalize steps
- [ ] Create main task in `index.ts`
- [ ] Add schedule (every 6 hours)

### Phase 3: Database & Testing
- [ ] Update `prisma/seed.ts` to include Codex tool
- [ ] Run seed: `pnpm prisma db seed`
- [ ] Test ingestion manually via Trigger.dev dashboard
- [ ] Verify data in Prisma Studio

### Phase 4: Documentation
- [ ] Create `src/trigger/ingest/codex/README.md`
- [ ] Update `docs/TASKS.md` (mark Phase 1 tasks complete)

## Risks & Mitigations

### Risk 1: GitHub API Rate Limits
**Impact**: Medium
**Mitigation**: 
- Always use `GITHUB_TOKEN` (5,000 requests/hour)
- Cache fetched releases (implement ETag support)
- Fetch only changed releases after first run

### Risk 2: Pre-release Version Noise
**Impact**: Low
**Mitigation**:
- Tag pre-releases in database
- Add UI filters to hide them
- Consider separate "Stable" and "All" views

### Risk 3: Empty Release Bodies
**Impact**: Low
**Mitigation**:
- Parser handles empty bodies gracefully
- Create Release with zero Changes (valid state)
- Mark in summary as "No details available"

### Risk 4: Breaking Changes in GitHub API
**Impact**: Medium
**Mitigation**:
- Use versioned API endpoint (`application/vnd.github.v3+json`)
- Monitor FetchLog for errors
- Add integration tests

## Success Criteria

- [ ] Codex tool record exists in database
- [ ] Ingestion runs successfully every 6 hours
- [ ] At least 50 recent releases ingested (stable + pre-releases)
- [ ] Pre-releases properly tagged and sortable
- [ ] Changes extracted from "Highlights" and "Merged PRs" sections
- [ ] FetchLog shows successful runs with metrics
- [ ] No GitHub API rate limit errors (with token)
- [ ] UI pages can display Codex releases (Phase 2 of TASKS.md)

## Timeline

- **Parser & utilities**: 2-3 hours
- **Trigger task**: 3-4 hours
- **Testing & debugging**: 2-3 hours
- **Total**: ~8-10 hours (1-2 days)

## Next Steps After Implementation

1. Build UI pages (`/tools/codex`)
2. Add pre-release filtering to UI
3. Implement version comparison/diff view
4. Consider adding AMP Code (third tool)
5. Add RSS feeds for Codex releases

---

**Status**: Plan ready for review
**Created**: 2025-11-05
**Last Updated**: 2025-11-05
