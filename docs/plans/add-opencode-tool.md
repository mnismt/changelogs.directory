# Implementation Plan: Add OpenCode Tool

> **Created**: 2025-12-29
> **Status**: ✅ Completed
> **Completed**: 2025-12-29
> **Estimated Time**: 1-2 hours

## Summary

Add [OpenCode](https://opencode.ai) (sst/opencode) as a new tool to track on Changelogs.directory. OpenCode is an open-source AI coding agent that uses GitHub Releases for changelogs.

## Background

### About OpenCode

- **Repository**: [github.com/sst/opencode](https://github.com/sst/opencode)
- **Vendor**: SST
- **Description**: The open source AI coding agent with free models included and multi-provider support (Claude, GPT, Gemini, etc.)
- **Release Pattern**: Very active — 200+ releases, multiple updates per day
- **Version Format**: Standard semver with `v` prefix (v1.0.204, v1.0.203, etc.)

### Release Notes Format

OpenCode releases follow a consistent bullet-point format:

```markdown
Added path traversal protection to File.read and File.list (#5985)
Added ability to disable spinner animation (#6084)
Fixed compact command after revert now properly cleans up revert state (#6235)
**Thank you to 9 community contributors:**
@JackNorris: fix: only show diagnostics block when errors exist (#6175)
```

Key characteristics:
- Top-level bullet points for changes
- PR references with `#number` format
- "Thank you to N contributors" sections with attribution
- No pre-releases marked on GitHub

## Approach

Reuse the existing `GITHUB_RELEASES` pattern from Codex. The current implementation already supports:

| Feature | Status | Notes |
|---------|--------|-------|
| Pagination | ✅ Implemented | Fetches all pages (100 per page) |
| ETag caching | ✅ Implemented | Redis cache with conditional requests |
| Version prefix stripping | ✅ Implemented | `versionPrefix: "v"` config option |
| Pre-release filtering | ✅ Implemented | Defaults work (OpenCode has none) |
| Rate limiting | ✅ Implemented | `GITHUB_TOKEN` for 5000 req/hr |

**Key insight**: Copy the Codex pipeline directory — all 7 phases are reusable with only task ID changes.

## Implementation Timeline

### Phase 1: Sequential (Database & Core Setup)

These must be completed in order as they have dependencies.

| Order | Task | Files | Time | Reason |
|-------|------|-------|------|--------|
| 1 | Add OpenCode tool record to seed | `prisma/seed.ts` | 5 min | Required before ingestion can run |
| 2 | Create ingestion pipeline | `src/trigger/ingest/opencode/` | 15 min | Copy from Codex, update IDs |

### Phase 2: Parallel (UI Components)

These can be done concurrently after Phase 1.

| Subagent | Task | Files | Time |
|----------|------|-------|------|
| A | Create OpenCode logo SVG | `src/components/logo/opencode.tsx` | 10 min |
| B | Register logo in logoMap | `src/lib/tool-logos.tsx` | 5 min |
| C | Add version formatter | `src/lib/version-formatter.ts` | 5 min |

### Phase 3: Sequential (Testing & Deployment)

| Order | Task | Command | Time |
|-------|------|---------|------|
| 1 | Run database seed | `pnpm prisma db seed` | 1 min |
| 2 | Start Trigger.dev dev server | `pnpm exec trigger.dev@latest dev` | 2 min |
| 3 | Trigger ingestion manually | Via Trigger.dev dashboard | 5 min |
| 4 | Verify results | Check database + UI | 5 min |
| 5 | Deploy to production | `pnpm exec trigger.dev@latest deploy` | 5 min |

## Files to Change

| File | Change | Complexity |
|------|--------|------------|
| `prisma/seed.ts` | Add OpenCode tool with `GITHUB_RELEASES`, `versionPrefix: "v"` | Low |
| `src/trigger/ingest/opencode/index.ts` | Copy from Codex, update task IDs | Low |
| `src/trigger/ingest/opencode/types.ts` | Copy from Codex (no changes needed) | None |
| `src/trigger/ingest/opencode/steps/*` | Copy from Codex (no changes needed) | None |
| `src/components/logo/opencode.tsx` | Create SST/OpenCode logo component | Medium |
| `src/lib/tool-logos.tsx` | Register opencode logo, add to monochromeLogos | Low |
| `src/lib/version-formatter.ts` | Add `formatOpenCodeVersion()` function | Low |

## Detailed Implementation

### 1. Database Seed Entry (`prisma/seed.ts`)

Add after the Windsurf tool entry:

```typescript
// Seed OpenCode tool
const opencode = await prisma.tool.upsert({
  where: { slug: "opencode" },
  update: {
    name: "OpenCode",
    vendor: "SST",
    description: "The open source AI coding agent with free models and multi-provider support",
    homepage: "https://opencode.ai",
    repositoryUrl: "https://github.com/sst/opencode",
    sourceType: "GITHUB_RELEASES",
    sourceUrl: "https://api.github.com/repos/sst/opencode/releases",
    sourceConfig: {
      versionPrefix: "v",           // Strip "v" from v1.0.204 → 1.0.204
      includePreReleases: false,    // OpenCode doesn't use pre-releases
    },
    tags: ["cli", "ai", "agent", "sst", "opencode", "terminal", "open-source"],
    isActive: true,
  },
  create: {
    slug: "opencode",
    name: "OpenCode",
    vendor: "SST",
    description: "The open source AI coding agent with free models and multi-provider support",
    homepage: "https://opencode.ai",
    repositoryUrl: "https://github.com/sst/opencode",
    sourceType: "GITHUB_RELEASES",
    sourceUrl: "https://api.github.com/repos/sst/opencode/releases",
    sourceConfig: {
      versionPrefix: "v",
      includePreReleases: false,
    },
    tags: ["cli", "ai", "agent", "sst", "opencode", "terminal", "open-source"],
    isActive: true,
  },
})

console.log(`✅ Seeded tool: ${opencode.name} (${opencode.slug})`)
```

### 2. Ingestion Pipeline

#### 2.1 Copy Codex Directory

```bash
cp -r src/trigger/ingest/codex src/trigger/ingest/opencode
```

#### 2.2 Update `src/trigger/ingest/opencode/index.ts`

Changes required:

```typescript
// Line ~20: Update task ID
export const ingestOpencode = task({
  id: 'ingest-opencode',  // Changed from 'ingest-codex'
  // ...
  run: async (payload: { toolSlug?: string } = {}) => {
    const toolSlug = payload.toolSlug || 'opencode'  // Changed from 'codex'
    // ... rest remains the same
  },
})

// Line ~134: Update schedule ID and task reference
export const ingestOpencodeSchedule = schedules.task({
  id: 'ingest-opencode-schedule',  // Changed from 'ingest-codex-schedule'
  cron: '0 */6 * * *',
  run: async () => {
    await ingestOpencode.trigger({})  // Changed from ingestCodex
  },
})
```

#### 2.3 Steps Directory

All files in `src/trigger/ingest/opencode/steps/` can remain unchanged:
- `setup.ts` — Generic, uses `toolSlug` parameter
- `fetch.ts` — Generic, reads from `ctx.tool.repositoryUrl`
- `parse.ts` — Generic, uses `parseGitHubReleases()`
- `filter.ts` — Generic, compares content hashes
- `enrich.ts` — Generic, LLM classification
- `upsert.ts` — Generic, database operations
- `finalize.ts` — Generic, updates FetchLog

### 3. Logo Component (`src/components/logo/opencode.tsx`)

OpenCode uses a stylized text logo. Create a simplified monochrome version:

```tsx
import type { SVGProps } from 'react'

export const OpenCode = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Terminal-style icon representing OpenCode's CLI nature */}
    <rect
      x="2"
      y="3"
      width="20"
      height="18"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M6 9l3 3-3 3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 15h6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)
```

**Note**: This is a placeholder terminal icon. For the actual OpenCode logo, we may need to:
1. Extract the SVG from their website/brand assets
2. Simplify to monochrome for our design system
3. Ensure it works at small sizes (24x24)

### 4. Logo Registration (`src/lib/tool-logos.tsx`)

```typescript
// Add import
import { OpenCode } from '@/components/logo/opencode'

// Add factory function
function createOpenCodeLogo(): ReactNode {
  return <OpenCode />
}

// Add to logoMap
const logoMap: Record<string, () => ReactNode> = {
  'claude-code': createClaudeLogo,
  codex: createOpenAILogo,
  cursor: createCursorLogo,
  windsurf: createWindsurfLogo,
  opencode: createOpenCodeLogo,  // Add this
}

// Add to monochromeLogos set (since our icon uses stroke, not fill)
const monochromeLogos = new Set(['cursor', 'opencode'])
```

### 5. Version Formatter (`src/lib/version-formatter.ts`)

```typescript
// Add formatter function
function formatOpenCodeVersion(version: string): string {
  // OpenCode versions are already clean after stripping "v" prefix in parser
  // Ensure consistent "v" prefix for display
  return version.startsWith('v') ? version : `v${version}`
}

// Add to formatters object
const formatters: Record<string, (v: string) => string> = {
  codex: formatCodexVersion,
  cursor: formatCursorVersion,
  'claude-code': formatClaudeCodeVersion,
  windsurf: formatWindsurfVersion,
  opencode: formatOpenCodeVersion,  // Add this
}
```

## Technical Considerations

### GitHub API Rate Limiting

- **Unauthenticated**: 60 requests/hour
- **Authenticated**: 5,000 requests/hour (with `GITHUB_TOKEN`)
- **OpenCode impact**: ~3 requests for initial 200+ releases (paginated at 100/page)
- **Ongoing**: 1-2 requests per run (ETag caching reduces this further)

**Recommendation**: Ensure `GITHUB_TOKEN` is set in Trigger.dev environment.

### Contributor Attribution Parsing

OpenCode releases include "Thank you" sections that will be parsed as changes:

```markdown
**Thank you to 9 community contributors:**
@JackNorris: fix: only show diagnostics block when errors exist (#6175)
```

**Current behavior**: These bullets become `ParsedChange` entries with type `OTHER` (or inferred from keywords like "fix").

**Impact**: Acceptable noise. The LLM enrichment step will classify these appropriately, and they represent meaningful contribution information.

**Future enhancement** (optional): Add heuristic to `parseReleaseBody()` to skip bullets under "Thank you" / "Contributors" headings.

### Schedule Frequency

OpenCode releases very frequently (multiple times daily). Current schedule is every 6 hours.

**Options**:
1. Keep 6h schedule (current) — Catches 4 updates/day, sufficient for most use cases
2. Increase to 4h (`0 */4 * * *`) — Better for power users
3. Increase to 2h (`0 */2 * * *`) — Near real-time but higher resource usage

**Recommendation**: Start with 6h schedule, adjust based on user feedback.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Contributor bullets parsed as changes | High | Low | LLM classifies as OTHER; acceptable noise |
| 200+ releases on first run | High | Low | Pagination already implemented (~3 API calls) |
| Rate limiting | Low | Medium | GITHUB_TOKEN provides 5000 req/hr |
| Logo not matching brand | Medium | Low | Use placeholder terminal icon; iterate later |
| Version sorting issues | Low | Medium | Standard semver; prefix stripping tested |

## Verification Strategy

### Pre-deployment Checks

- [x] Run `pnpm prisma db seed` — verify OpenCode appears in Tool table
- [x] Run `pnpm exec trigger.dev@latest dev` — verify `ingest-opencode` task registered
- [x] Trigger manually via Trigger.dev dashboard
- [x] Monitor logs for any errors during ingestion
- [x] Check database for ingested releases:
  ```sql
  SELECT version, "releaseDate", headline 
  FROM release 
  WHERE "toolId" = (SELECT id FROM tool WHERE slug = 'opencode')
  ORDER BY "versionSort" DESC
  LIMIT 10;
  ```

### Post-deployment Checks

- [x] Verify `/tools/opencode` page loads correctly
- [x] Verify logo appears in tool card and header
- [x] Verify version formatting displays correctly (v1.0.204)
- [x] Verify changes are classified (FEATURE, BUGFIX, etc.)
- [ ] Check schedule is active in Trigger.dev dashboard
- [ ] Wait for first scheduled run to complete successfully

### Code Quality

- [x] Run `pnpm biome check --write` on modified files:
  ```bash
  pnpm biome check --write \
    prisma/seed.ts \
    src/trigger/ingest/opencode/index.ts \
    src/components/logo/opencode.tsx \
    src/lib/tool-logos.tsx \
    src/lib/version-formatter.ts
  ```

## Open Questions

1. **Logo source**: Should we use the placeholder terminal icon, or try to extract the actual OpenCode logo from their brand assets?

2. **Schedule frequency**: Is 6h appropriate for OpenCode's high release frequency, or should we increase to 4h?

3. **Contributor attribution**: Should we filter out "Thank you" bullets from changes, or keep them as valuable contribution information?

## Documentation Updates

After implementation, update:

| Code Location | Update Doc |
|---------------|------------|
| `prisma/seed.ts` | `docs/reference/database-schema.md` (if adding new patterns) |
| `src/trigger/ingest/opencode/` | `docs/reference/ingestion-pipeline.md` (add OpenCode example) |
| Tool addition | `docs/guides/adding-a-tool.md` (if new patterns discovered) |

## Success Criteria

- [x] OpenCode appears in database with correct metadata
- [x] 200+ releases ingested successfully on first run (628 releases!)
- [x] Logo displays correctly on tool page
- [x] Version formatting shows `v1.0.204` style
- [x] Changes classified with FEATURE, BUGFIX, etc. (2,838 changes)
- [ ] Schedule runs automatically every 6 hours
- [ ] No rate limiting errors in production

## Implementation Results

| Metric | Result |
|--------|--------|
| Releases ingested | **628** |
| Changes parsed | **2,838** |
| API calls | ~7 (paginated) |
| Errors | None |

---

**Completed**: 2025-12-29 — All core implementation verified and working.
