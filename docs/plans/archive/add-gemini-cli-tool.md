# Implementation Plan: Add Gemini CLI Tool

> **Created**: 2026-01-11
> **Status**: ✅ Completed
> **Completed**: 2026-01-11
> **Estimated Time**: 1-2 hours

## Summary

Add [Gemini CLI](https://geminicli.com) (google-gemini/gemini-cli) as a new tool to track on Changelogs.directory. Gemini CLI is Google's AI-powered CLI agent that uses GitHub Releases for changelogs with stable, preview, and nightly builds.

## Background

### About Gemini CLI

- **Repository**: [github.com/google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli)
- **Vendor**: Google
- **Description**: Google's AI-powered CLI agent for coding, debugging, and terminal workflows with rich artifacts and agent manager
- **Release Pattern**: Very active — 200+ releases with multiple types (stable, preview, nightly)
- **Version Format**: Standard semver with `v` prefix (v0.23.0, v0.24.0-preview.0, v0.24.0-nightly.20260103...)

### Release Types

Gemini CLI uses three distinct release types:

1. **Stable** (e.g., `v0.23.0`) - Production releases, marked as non-prerelease
2. **Preview** (e.g., `v0.24.0-preview.0`) - Beta features, marked as prerelease
3. **Nightly** (e.g., `v0.24.0-nightly.20260103.30f5c4af4`) - Daily builds, marked as prerelease

**Decision**: Include **all release types** (user request), leveraging GitHub API's `prerelease` field to preserve the stable vs pre-release distinction.

### Release Notes Format

Gemini CLI releases follow a detailed bullet-point format with PR references:

```markdown
## What's Changed
* chore(core): refactor model resolution by @adamfweidman in #15228
* Add Folder Trust Support To Hooks by @sehoon38 in #15325
* fix #15369, prevent crash on unhandled EIO error by @ElecTwix in #15410

## New Contributors
* @ElecTwix made their first contribution in #15410

**Full Changelog**: https://github.com/google-gemini/gemini-cli/compare/v0.23.0...v0.24.0
```

Key characteristics:
- Top-level bullet points with type prefixes (`chore`, `fix`, `feat`)
- PR and issue references with `#number` format
- Author attribution with `@username`
- "New Contributors" sections (should be filtered)
- Pre-releases clearly marked by GitHub

## Approach

Reuse the existing `GITHUB_RELEASES` pattern from OpenCode. The current implementation already supports:

| Feature | Status | Notes |
|---------|--------|-------|
| Pagination | ✅ Implemented | Fetches all pages (100 per page) |
| ETag caching | ✅ Implemented | Redis cache with conditional requests |
| Version prefix stripping | ✅ Implemented | `versionPrefix: "v"` config option |
| Pre-release filtering | ✅ Implemented | `includePreReleases: true` for all types |
| Rate limiting | ✅ Implemented | `GITHUB_TOKEN` for 5000 req/hr |

**Key insight**: Copy the OpenCode pipeline directory — all 7 phases are reusable with only task ID changes.

## Implementation Timeline

### Phase 1: Sequential (Database & Core Setup)

These must be completed in order as they have dependencies.

| Order | Task | Files | Time | Reason |
|-------|------|-------|------|--------|
| 1 | Add Gemini CLI tool record to seed | `prisma/seed.ts` | 5 min | Required before ingestion can run |
| 2 | Create ingestion pipeline | `src/trigger/ingest/gemini-cli/` | 15 min | Copy from OpenCode, update IDs |

### Phase 2: Parallel (UI Components)

These can be done concurrently after Phase 1.

| Subagent | Task | Files | Time |
|----------|------|-------|------|
| A | Register existing logo in tool registry | `src/lib/tool-registry.tsx` | 5 min |
| B | Add OG image support | `src/lib/og-utils.tsx` | 10 min |
| C | Add background image for tool card | `public/images/tools/gemini-cli.png` | 3 min |

### Phase 3: Sequential (Testing & Deployment)

| Order | Task | Command | Time |
|-------|------|---------|------|
| 1 | Run database seed | `pnpm prisma db seed` | 1 min |
| 2 | Validate configuration | `pnpm test:e2e:config` | 1 min |
| 3 | Format/lint all changes | `pnpm biome check --write` | 2 min |
| 4 | Start Trigger.dev dev server | `pnpm exec trigger.dev@latest dev` | 2 min |
| 5 | Trigger ingestion manually | Via Trigger.dev dashboard | 10 min |
| 6 | Verify results | Check database + UI | 5 min |
| 7 | Deploy to production | `pnpm exec trigger.dev@latest deploy` | 5 min |

## Files to Change

| File | Change | Complexity |
|------|--------|------------|
| `prisma/seed.ts` | Add Gemini CLI tool with `GITHUB_RELEASES`, `versionPrefix: "v"`, `includePreReleases: true` | Low |
| `src/trigger/ingest/gemini-cli/index.ts` | Copy from OpenCode, update task IDs (includes Prisma v7+ adapter pattern) | Low |
| `src/trigger/ingest/gemini-cli/types.ts` | Copy from OpenCode (no changes needed) | None |
| `src/trigger/ingest/gemini-cli/steps/*` | Copy from OpenCode (no changes needed) | None |
| `src/trigger/ingest/gemini-cli/README.md` | Document Gemini CLI ingestion specifics | Low |
| `src/lib/tool-registry.tsx` | Register existing `GeminiCli` logo component | Low |
| `src/lib/og-utils.tsx` | Add simplified SVG for OG images | Low |
| `public/images/tools/gemini-cli.png` | Add background image for tool card hover effect (800x600px) | Low |

**Note**: The logo component already exists at `src/components/logo/gemini-cli.tsx` (uses base64 image pattern) — we just need to register it.

## Detailed Implementation

### 1. Database Seed Entry (`prisma/seed.ts`)

Add after the Antigravity tool entry:

```typescript
// Seed Gemini CLI tool
const geminiCli = await prisma.tool.upsert({
  where: { slug: "gemini-cli" },
  update: {
    name: "Gemini CLI",
    vendor: "Google",
    description:
      "Google's AI-powered CLI agent for coding, debugging, and terminal workflows with rich artifacts",
    homepage: "https://geminicli.com",
    repositoryUrl: "https://github.com/google-gemini/gemini-cli",
    sourceType: "GITHUB_RELEASES",
    sourceUrl: "https://api.github.com/repos/google-gemini/gemini-cli/releases",
    sourceConfig: {
      versionPrefix: "v",              // Strip "v" from v0.23.0 → 0.23.0
      includePreReleases: true,        // Include stable, preview, and nightly
    },
    tags: ["cli", "ai", "agent", "google", "gemini", "terminal"],
    isActive: true,
  },
  create: {
    slug: "gemini-cli",
    name: "Gemini CLI",
    vendor: "Google",
    description:
      "Google's AI-powered CLI agent for coding, debugging, and terminal workflows with rich artifacts",
    homepage: "https://geminicli.com",
    repositoryUrl: "https://github.com/google-gemini/gemini-cli",
    sourceType: "GITHUB_RELEASES",
    sourceUrl: "https://api.github.com/repos/google-gemini/gemini-cli/releases",
    sourceConfig: {
      versionPrefix: "v",
      includePreReleases: true,
    },
    tags: ["cli", "ai", "agent", "google", "gemini", "terminal"],
    isActive: true,
  },
});

console.log(`✅ Seeded tool: ${geminiCli.name} (${geminiCli.slug})`);
```

### 2. Ingestion Pipeline

#### 2.1 Copy OpenCode Directory

```bash
cp -r src/trigger/ingest/opencode src/trigger/ingest/gemini-cli
```

#### 2.2 Update `src/trigger/ingest/gemini-cli/index.ts`

Changes required:

```typescript
// Line ~20: Update task ID
export const ingestGeminiCli = task({
  id: 'ingest-gemini-cli',  // Changed from 'ingest-opencode'
  queue: { concurrencyLimit: 1 },
  maxDuration: 1800,  // 30 minutes max (may have many releases)
  run: async (payload: { toolSlug?: string } = {}) => {
    const toolSlug = payload.toolSlug || 'gemini-cli'  // Changed from 'opencode'
    const startTime = Date.now()

    logger.info('Starting Gemini CLI changelog ingestion', { toolSlug })  // Updated message
    // ... rest remains the same
  },
})

// Line ~134: Update schedule ID and task reference
export const ingestGeminiCliSchedule = schedules.task({
  id: 'ingest-gemini-cli-schedule',  // Changed from 'ingest-opencode-schedule'
  cron: '0 */6 * * *',
  run: async () => {
    await ingestGeminiCli.trigger({})  // Changed from ingestOpencode
  },
})
```

#### 2.3 Steps Directory

All files in `src/trigger/ingest/gemini-cli/steps/` can remain unchanged:
- `setup.ts` — Generic, uses `toolSlug` parameter
- `fetch.ts` — Generic, reads from `ctx.tool.sourceUrl`
- `parse.ts` — Generic, uses `parseGitHubReleases()`
- `filter.ts` — Generic, compares content hashes
- `enrich.ts` — Generic, LLM classification
- `upsert.ts` — Generic, database operations
- `finalize.ts` — Generic, updates FetchLog

#### 2.4 Create `README.md`

```markdown
# Gemini CLI Ingestion Pipeline

Fetches changelog data from GitHub Releases API for Google's Gemini CLI.

## Source

- **Type**: GITHUB_RELEASES
- **URL**: https://api.github.com/repos/google-gemini/gemini-cli/releases
- **Version Prefix**: `v` (stripped from version tags)
- **Pre-releases**: Included (stable, preview, and nightly)

## Release Types

Gemini CLI has three release types, all preserved:

1. **Stable** (v0.23.0) - `prerelease: false`
2. **Preview** (v0.24.0-preview.0) - `prerelease: true`
3. **Nightly** (v0.24.0-nightly.20260103...) - `prerelease: true`

The GitHub API's `prerelease` field automatically distinguishes between stable and pre-releases.

## Schedule

Runs every 6 hours: `0 */6 * * *`

## Manual Trigger

```bash
pnpm exec trigger.dev@latest dev
# Then trigger via dashboard or API
```

## Expected Volume

- **Total releases**: ~200+
- **API calls per run**: ~3-4 (paginated at 100/page)
- **Nightly releases**: Filtered by content hash (only changed content ingested)
```

### 3. Tool Registry (`src/lib/tool-registry.tsx`)

Add import (logo component already exists):
```typescript
import { GeminiCli } from '@/components/logo/gemini-cli'
```

Add to `TOOL_REGISTRY` array (after `antigravity`):
```typescript
{
  slug: 'gemini-cli',
  name: 'Gemini CLI',
  vendor: 'Google',
  url: 'https://geminicli.com',
  Logo: GeminiCli,
  isMonochrome: false,  // Uses colorful base64 image pattern
  showInFeedFilter: true,
  showInShowcase: true,
},
```

### 4. OG Image Support (`src/lib/og-utils.tsx`)

Add case in `getToolLogoSVG()` switch before `default`:

```typescript
case 'gemini-cli':
  // Gemini sparkle star simplified for OG images
  // Base64 logo is too large for Satori - use clean SVG instead
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" style={commonStyle}>
      <path
        fill="#4285F4"
        d="M28 0C28 15.464 15.464 28 0 28C15.464 28 28 40.536 28 56C28 40.536 40.536 28 56 28C40.536 28 28 15.464 28 0Z"
      />
    </svg>
  )
```

**Note**: This is a simplified Gemini sparkle icon using Google Blue (#4285F4). The actual logo component uses a base64 image which is too large for OG images.

### 5. Background Image (`public/images/tools/gemini-cli.png`)

Add a background image for the tool card hover effect on the `/tools` directory page:

**Requirements**:
- PNG format
- Recommended size: 800x600px or similar aspect ratio
- Should represent Gemini CLI visually (e.g., screenshot of CLI in action, product marketing image, or abstract design with Gemini branding)

**Note**: This can be sourced from Gemini CLI's marketing materials, created from a screenshot, or designed as an abstract representation. Ensure licensing allows usage.

## Technical Considerations

### GitHub API Rate Limiting

- **Unauthenticated**: 60 requests/hour
- **Authenticated**: 5,000 requests/hour (with `GITHUB_TOKEN`)
- **Gemini CLI impact**: ~3-4 requests for initial 200+ releases (paginated at 100/page)
- **Ongoing**: 1-2 requests per run (ETag caching + content hash filtering)

**Recommendation**: Ensure `GITHUB_TOKEN` is set in Trigger.dev environment.

### Pre-release Handling

The GitHub API's `prerelease` field automatically marks:
- **Stable releases**: `prerelease: false`
- **Preview/nightly releases**: `prerelease: true`

This is stored in the `Release.isPrerelease` database field. No custom logic needed.

### Nightly Release Volume

Gemini CLI publishes daily nightly builds. Concerns and mitigations:

| Concern | Mitigation |
|---------|------------|
| Too many nightly releases | Content hash filtering skips unchanged releases |
| Database bloat | Expected ~200-300 releases, manageable |
| UI noise | Can add UI filter for "stable only" in future |

### Contributor Attribution Parsing

Gemini CLI releases include "New Contributors" sections:

```markdown
## New Contributors
* @ElecTwix made their first contribution in #15410
```

**Current behavior**: These are parsed as `ParsedChange` entries.

**Solution**: The OpenCode implementation already filters contributor sections via `isContributorSectionMarker()` in `src/lib/parsers/github-releases.ts`. This will automatically skip these bullets.

### Logo Considerations

**Current logo** (`src/components/logo/gemini-cli.tsx`):
- Uses `<pattern>` with base64 encoded image
- Large file size (~165KB base64 string)
- Good for web UI, not optimal for OG images

**OG image logo** (`src/lib/og-utils.tsx`):
- Uses simplified SVG (Gemini sparkle star)
- Small size, renders cleanly in Satori
- Maintains Google brand identity with #4285F4 blue

### Schedule Frequency

Gemini CLI releases frequently (daily nightlies, periodic previews, occasional stable). Current schedule is every 6 hours.

**Options**:
1. Keep 6h schedule (current) — Catches 4 updates/day, sufficient
2. Increase to 4h (`0 */4 * * *`) — Better for tracking nightlies
3. Increase to 2h (`0 */2 * * *`) — Near real-time but higher resource usage

**Recommendation**: Start with 6h schedule, adjust based on user feedback.

### Prisma v7+ Worker Pattern

The OpenCode ingestion pipeline (which we're copying) already uses the Prisma v7+ worker pattern with driver adapters:

```typescript
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
```

**No changes needed** — this pattern will be copied automatically with the OpenCode files.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| High volume of nightly releases | High | Low | Content hash filtering skips unchanged |
| Contributor bullets parsed as changes | Low | Low | Already filtered by `isContributorSectionMarker()` |
| 200+ releases on first run | High | Low | Pagination implemented (~3-4 API calls) |
| Rate limiting | Low | Medium | GITHUB_TOKEN provides 5000 req/hr |
| Base64 logo too large for OG | High | Low | Use simplified SVG in OG images |
| Version sorting with nightly timestamps | Medium | Medium | Standard semver + timestamp sorting works |

## Verification Strategy

### Pre-deployment Checks

- [ ] Run `pnpm prisma db seed` — verify Gemini CLI appears in Tool table
- [ ] Run `pnpm test:e2e:config` — validate all required assets (logo, OG SVG, background image, ingestion pipeline)
- [ ] Run `pnpm biome check --write` on all modified files
- [ ] Run `pnpm exec trigger.dev@latest dev` — verify `ingest-gemini-cli` task registered
- [ ] Trigger manually via Trigger.dev dashboard
- [ ] Monitor logs for successful 7-phase completion
- [ ] Check database for ingested releases:
  ```sql
  SELECT version, "releaseDate", headline, "isPrerelease"
  FROM release 
  WHERE "toolId" = (SELECT id FROM tool WHERE slug = 'gemini-cli')
  ORDER BY "versionSort" DESC
  LIMIT 20;
  ```

### Post-deployment Checks

- [ ] Verify `/tools/gemini-cli` page loads correctly
- [ ] Verify logo appears in tool card and header
- [ ] Verify stable vs pre-release distinction preserved
- [ ] Verify changes are classified (FEATURE, BUGFIX, etc.)
- [ ] Verify "New Contributors" sections filtered out
- [ ] Check schedule is active in Trigger.dev dashboard
- [ ] Wait for first scheduled run to complete successfully

### Code Quality

```bash
# Run Biome on all modified files
pnpm biome check --write \
  prisma/seed.ts \
  src/trigger/ingest/gemini-cli/index.ts \
  src/lib/tool-registry.tsx \
  src/lib/og-utils.tsx

# Verify production build succeeds
pnpm build
```

### Frontend Verification (SSR)

- [ ] Run `pnpm dev` and navigate to `/tools/gemini-cli`
- [ ] F5 refresh: Data loads (server-rendered)
- [ ] Client navigation: No "DATABASE_URL not set" error
- [ ] View source: Release data visible in initial HTML
- [ ] Homepage: Gemini CLI appears in filter buttons
- [ ] Homepage: Gemini CLI appears in hero carousel

## Open Questions

1. **Version formatting**: Should we add a custom formatter for nightly versions (e.g., showing date only), or display as-is?
   - **Answer**: Display as-is for now. The full version string is clear and preserves information.

2. **Schedule frequency**: Is 6h appropriate for Gemini CLI's release pattern, or should we increase to 4h?
   - **Answer**: Start with 6h, monitor user feedback.

3. **Pre-release filtering in UI**: Should we add a UI toggle to hide pre-releases (show stable only)?
   - **Answer**: Future enhancement. All releases visible by default.

## Documentation Updates

After implementation, update:

| Document | Update |
|----------|--------|
| `docs/guides/adding-a-tool.md` | Add Gemini CLI as example of GITHUB_RELEASES with multi-type releases |
| `docs/reference/ingestion-pipeline.md` | Document pre-release handling pattern |
| `docs/reference/parsers.md` | Note contributor section filtering works for Gemini CLI |

## Success Criteria

- [ ] Gemini CLI appears in database with correct metadata
- [ ] All releases ingested successfully (stable + preview + nightly)
- [ ] Pre-release distinction preserved (`isPrerelease` field)
- [ ] Logo displays correctly on tool page (base64 version)
- [ ] OG images render correctly (SVG version)
- [ ] Background image displays on tool card hover (`/tools` page)
- [ ] Configuration tests pass (`pnpm test:e2e:config`)
- [ ] Changes classified with FEATURE, BUGFIX, etc.
- [ ] "New Contributors" sections filtered out
- [ ] Schedule runs automatically every 6 hours
- [ ] No rate limiting errors in production
- [ ] Homepage filter and carousel include Gemini CLI

## Expected Results

| Metric | Expected Range |
|--------|----------------|
| Releases ingested | 200-300 |
| Changes parsed | 5,000-10,000 |
| API calls (initial) | 3-4 |
| API calls (ongoing) | 1-2 per run |
| Errors | None |

---

## Completion Notes

- Gemini CLI tool is seeded in `prisma/seed.ts` and registered in `src/lib/tool-registry.tsx`.
- Ingestion pipeline lives in `src/trigger/ingest/gemini-cli/` with schedule enabled.
- Assets are present (`src/components/logo/gemini-cli.tsx`, `public/images/tools/gemini-cli.png`).
- Operational `forceFullRescan` flag documented and tested.
