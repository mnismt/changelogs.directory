# Fix E2E CI Failures: OG Images & Tool Detail Pagination

> **Status**: Planning  
> **Created**: 2026-01-11  
> **Priority**: High (CI blocking)

## Problem Statement

E2E tests fail in CI with two distinct root causes:

### Failure 1: OG Image Endpoints Return 500

**Error**:
```
Error generating tool detail OG image: TypeError: Cannot read properties of null (reading 'latestReleaseDate')
    at GET (/src/routes/og/tools.$slug.tsx:22:27)
```

**Affected tests** (5 failures):
- `GET /og/tools/claude-code returns PNG`
- `GET /og/tools/windsurf returns PNG`
- `GET /og/tools/opencode returns PNG`
- `GET /og/tools/antigravity returns PNG`
- `GET /og/tools/gemini-cli returns PNG`

**Root cause**: The OG test iterates over all `TOOL_SLUGS` from the registry (7 tools), but the E2E database snapshot only contains 2 tools (`codex`, `cursor`). When `getToolMetadata()` returns `null` for missing tools, the route crashes accessing `tool.latestReleaseDate`.

**Code path**:
1. `tests/e2e/pages/og-images.spec.ts:21` - iterates `TOOL_SLUGS` (7 items)
2. `src/routes/og/tools.$slug.tsx:18` - calls `getToolMetadata({ data: { slug } })`
3. `src/server/tools.ts:129` - returns `null` when tool not found
4. `src/routes/og/tools.$slug.tsx:22` - accesses `tool.latestReleaseDate` without null check → crash

### Failure 2: Tool Detail Pagination Gets 0 Cards

**Error**:
```
Expected 20 release cards, got 0
Locator: locator('[data-testid="release-card"]')
```

**Affected test** (1 failure):
- `pagination and infinite scroll works for codex`

**Root cause**: The tool detail page defaults to **timeline view** (`search.view || 'timeline'`), but `TimelineItem` components do not include `data-testid="release-card"`. The test selector finds 0 elements even though releases are correctly loaded and rendered.

**Code path**:
1. `tests/e2e/pages/tool-detail.spec.ts:34` - locates `[data-testid="release-card"]`
2. `src/routes/tools/$slug/index.tsx:252` - renders `TimelineView` when `search.view !== 'grid'`
3. `src/components/changelog/timeline/timeline-view.tsx` - renders `TimelineItem` components
4. `src/components/changelog/timeline/timeline-item.tsx:96` - `<Link>` element lacks `data-testid`

---

## Solution Overview

### Strategy 1: Expand E2E Snapshot (Primary Fix)

Expand the E2E database snapshot to include **all 7 tools** from the registry, each with at least 1-3 releases. This ensures:
- OG image tests find valid tool data for every slug
- Homepage/tools directory show all tools
- Tests remain deterministic

### Strategy 2: Add Missing Test IDs

Add `data-testid="release-card"` to timeline items so the pagination test works in the default view.

### Strategy 3: Harden OG Routes

Return 404 instead of 500 when a tool slug doesn't exist. This is correct production behavior and prevents noisy errors.

### Strategy 4: Update Tests & Docs

Align test expectations and documentation with the new 7-tool snapshot.

---

## Detailed Implementation Plan

### Phase 1: Expand E2E Snapshot Export Script

**File**: `scripts/export-e2e-snapshot.ts`

#### Current State
```typescript
const TARGET_TOOLS = ["codex", "cursor"];
const RELEASES_PER_TOOL = 60;
```

#### Target State
```typescript
import { TOOL_SLUGS } from '@/lib/tool-registry';

// All tools from registry
const TARGET_TOOLS = TOOL_SLUGS;

// Per-tool release counts: deep data for pagination tests, minimal for others
const RELEASES_CONFIG: Record<string, number> = {
  codex: 60,    // Needed for pagination test (expects 20+)
  cursor: 60,   // Keep for consistency
  // All others: 3 releases minimum for OG/detail page tests
};
const DEFAULT_RELEASES = 3;
```

#### Changes Required

1. **Update target tools list** (line 19):
   ```typescript
   // Before
   const TARGET_TOOLS = ["codex", "cursor"];
   
   // After
   const TARGET_TOOLS = [
     "claude-code",
     "codex", 
     "cursor",
     "windsurf",
     "opencode",
     "antigravity",
     "gemini-cli",
   ];
   ```

2. **Add per-tool release count logic** (before line 40):
   ```typescript
   const DEEP_DATA_TOOLS = ["codex", "cursor"];
   const DEEP_RELEASES_COUNT = 60;
   const MINIMAL_RELEASES_COUNT = 3;
   
   function getReleasesPerTool(slug: string): number {
     return DEEP_DATA_TOOLS.includes(slug) 
       ? DEEP_RELEASES_COUNT 
       : MINIMAL_RELEASES_COUNT;
   }
   ```

3. **Use per-tool count in export loop** (line 75):
   ```typescript
   // Before
   take: RELEASES_PER_TOOL,
   
   // After
   take: getReleasesPerTool(slug),
   ```

4. **Handle tools with 0 production releases** (new, after line 81):
   - If a tool exists but has 0 releases, the export should still include the tool.
   - Consider logging a warning but not failing.
   - The OG route must handle `latestReleaseDate: null` gracefully.

5. **Update snapshot metadata** (line 32):
   ```typescript
   meta: {
     createdAt: new Date().toISOString(),
     source: "production",
     tools: TARGET_TOOLS,
     releaseCounts: {} as Record<string, number>,
     schemaVersion: 2,  // Bump version
   },
   ```

#### Verification
After modifying the script:
```bash
# Connect to production (read-only)
DATABASE_URL="postgresql://..." pnpm tsx scripts/export-e2e-snapshot.ts
# Check output
ls -la tests/fixtures/e2e-db.snapshot.json.gz
```

---

### Phase 2: Regenerate E2E Snapshot

**File**: `tests/fixtures/e2e-db.snapshot.json.gz`

This file is binary (gzipped JSON) and must be regenerated from production data.

#### Steps
1. Set `DATABASE_URL` to production (read-only credentials)
2. Run export script: `pnpm tsx scripts/export-e2e-snapshot.ts`
3. Verify output shows all 7 tools with expected release counts
4. Commit the updated snapshot file

#### Expected Console Output
```
Starting E2E snapshot export...
Target tools: claude-code, codex, cursor, windsurf, opencode, antigravity, gemini-cli
Exporting tool: claude-code
Found 3 releases for claude-code
Exporting tool: codex
Found 60 releases for codex
...
Snapshot saved to tests/fixtures/e2e-db.snapshot.json.gz (XXX KB)
```

---

### Phase 3: Add `data-testid` to Timeline Items

**File**: `src/components/changelog/timeline/timeline-item.tsx`

#### Current State (lines 96-105)
```tsx
<Link
  to="/tools/$slug/releases/$version"
  params={{ slug: toolSlug, version }}
  className="block focus-visible:outline-none ..."
  aria-label={ariaLabel}
  onMouseEnter={() => onHover?.(id)}
  onMouseLeave={() => onHover?.(null)}
>
  {renderCard()}
</Link>
```

#### Target State
```tsx
<Link
  to="/tools/$slug/releases/$version"
  params={{ slug: toolSlug, version }}
  className="block focus-visible:outline-none ..."
  aria-label={ariaLabel}
  data-testid="release-card"
  onMouseEnter={() => onHover?.(id)}
  onMouseLeave={() => onHover?.(null)}
>
  {renderCard()}
</Link>
```

#### Changes Required

1. **Left-side link** (line 96): Add `data-testid="release-card"`
2. **Right-side link** (line 135): Add `data-testid="release-card"`

Both render paths must include the attribute so the test works regardless of zigzag positioning.

#### Verification
```bash
# Check grid view already has testid
grep -n 'data-testid="release-card"' src/components/changelog/release/release-card.tsx
# Should find it in ReleaseCard component

# After change, verify timeline has it too
grep -n 'data-testid="release-card"' src/components/changelog/timeline/timeline-item.tsx
```

---

### Phase 4: Harden OG Tool Route with 404

**File**: `src/routes/og/tools.$slug.tsx`

#### Current State (lines 16-22)
```typescript
GET: async ({ params }) => {
  try {
    const tool = await getToolMetadata({ data: { slug: params.slug } })
    const fonts = await loadOGFonts()
    const logoSVG = getToolLogoSVG(params.slug)

    const timeAgo = tool.latestReleaseDate  // <-- crash if tool is null
```

#### Target State
```typescript
GET: async ({ params }) => {
  try {
    const tool = await getToolMetadata({ data: { slug: params.slug } })
    
    // Return 404 for unknown/missing tools
    if (!tool) {
      return new Response('Tool not found', { status: 404 })
    }
    
    const fonts = await loadOGFonts()
    const logoSVG = getToolLogoSVG(params.slug)

    const timeAgo = tool.latestReleaseDate
```

#### Changes Required

1. **Add null guard after getToolMetadata** (after line 18):
   ```typescript
   if (!tool) {
     return new Response('Tool not found', { status: 404 })
   }
   ```

2. **Consider also guarding in the release OG route** (`src/routes/og/tools.$slug.releases.$version.tsx`):
   - Currently line 19: `const release = await getReleaseWithChanges(...)`
   - Add similar null check for missing release data

#### Verification
```bash
# Local test (with seeded DB missing some tools)
curl -I http://localhost:5173/og/tools/nonexistent-tool
# Should return: HTTP/1.1 404 Not Found
```

---

### Phase 5: Update E2E Tests

#### File: `tests/e2e/pages/tools-directory.spec.ts`

**Current** (line 18):
```typescript
await expect(toolCards).toHaveCount(2);
```

**Target** (use registry length):
```typescript
import { TOOL_SLUGS } from "@/lib/tool-registry";
// ...
await expect(toolCards).toHaveCount(TOOL_SLUGS.length);
```

**Also update** (line 22-30):
```typescript
// Before: hardcoded slugs
const seededSlugs = ["codex", "cursor"];

// After: use all slugs or representative sample
// Option A: Test all (comprehensive but slower)
const seededSlugs = TOOL_SLUGS;

// Option B: Test subset (faster, still validates rendering)
const seededSlugs = TOOL_SLUGS.slice(0, 3);
```

#### File: `tests/e2e/pages/tool-detail.spec.ts`

**Current** (line 5):
```typescript
const TOOLS_TO_TEST = ["codex", "cursor"];
```

**Target** (optionally expand):
```typescript
// Keep minimal for speed, or expand for coverage
const TOOLS_TO_TEST = ["codex", "cursor"];
// Both have deep release data (60 each) for pagination tests
```

No change strictly required here since codex/cursor remain in snapshot with 60 releases.

#### File: `tests/e2e/pages/og-images.spec.ts`

**Current** (line 21):
```typescript
for (const slug of TOOL_SLUGS) {
```

**No change needed** if snapshot includes all tools. The test will pass once all 7 tools have DB records with releases.

---

### Phase 6: Update Documentation

#### File: `docs/testing/browser-tests.md`

**Update line 59**:
```markdown
<!-- Before -->
**Note**: The test expects 2 tool cards because the E2E snapshot only includes `codex` and `cursor`.

<!-- After -->
**Note**: The test expects tool cards matching `TOOL_SLUGS.length` because the E2E snapshot includes all registered tools.
```

**Update line 82**:
```markdown
<!-- Before -->
- Uses `codex` which has 60 releases in snapshot

<!-- After -->
- Uses `codex` or `cursor` which have 60 releases each in the snapshot (other tools have minimal releases for faster CI)
```

#### File: `docs/testing/e2e-architecture.md`

**Update table at line 236**:
```markdown
| Data | Count | Purpose |
|------|-------|---------|
| Tools | 7 (all registry tools) | Test tool pages, OG images |
| Releases | 60 for codex/cursor, 3 for others | Test pagination + basic rendering |
| Changes | All for releases | Test release detail pages |
```

#### File: `docs/testing/snapshots.md`

**Update line 344 section**:
```markdown
### Adding More Tools to Snapshot

When adding a new tool to the registry:

1. The export script automatically includes all `TOOL_SLUGS`
2. New tools get 3 releases by default (or fewer if production has less)
3. To add a tool to "deep data" set (60 releases for pagination tests):
   - Edit `scripts/export-e2e-snapshot.ts`
   - Add slug to `DEEP_DATA_TOOLS` array
4. Regenerate snapshot: `pnpm tsx scripts/export-e2e-snapshot.ts`
5. Commit updated `tests/fixtures/e2e-db.snapshot.json.gz`
```

---

## File Change Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `scripts/export-e2e-snapshot.ts` | Modify | Export all 7 tools, per-tool release counts |
| `tests/fixtures/e2e-db.snapshot.json.gz` | Regenerate | New snapshot with all tools |
| `src/components/changelog/timeline/timeline-item.tsx` | Modify | Add `data-testid="release-card"` to links |
| `src/routes/og/tools.$slug.tsx` | Modify | Add null guard → 404 |
| `tests/e2e/pages/tools-directory.spec.ts` | Modify | Use `TOOL_SLUGS.length` for count |
| `docs/testing/browser-tests.md` | Modify | Update snapshot assumptions |
| `docs/testing/e2e-architecture.md` | Modify | Update snapshot contents table |
| `docs/testing/snapshots.md` | Modify | Update "adding tools" guidance |

---

## Risk Assessment

### Risk 1: Production Has Fewer Releases Than Expected
**Likelihood**: Medium  
**Impact**: Low  
**Mitigation**: Export script already handles tools with 0 releases gracefully. OG route 404 guard prevents crashes. Tests will pass as long as tool records exist.

### Risk 2: Snapshot Size Grows Too Large
**Likelihood**: Low  
**Impact**: Medium (slower CI)  
**Mitigation**: Only codex/cursor get 60 releases; others get 3. Estimated increase: ~20% larger than current 2-tool snapshot.

### Risk 3: New Tools Added Without Regenerating Snapshot
**Likelihood**: Medium  
**Impact**: High (CI fails for new tool)  
**Mitigation**: 
- Add to `docs/guides/adding-a-tool.md`: "Regenerate E2E snapshot after adding tool"
- Consider adding a config validation test that warns if registry has more tools than snapshot

---

## Verification Strategy

### Local Testing
```bash
# 1. Apply code changes (timeline testid, OG guard)
# 2. Regenerate snapshot (requires prod DB access)
DATABASE_URL="prod-read-only-url" pnpm tsx scripts/export-e2e-snapshot.ts

# 3. Seed local DB with new snapshot
pnpm seed:e2e

# 4. Run affected tests
pnpm exec playwright test og-images.spec.ts tool-detail.spec.ts tools-directory.spec.ts

# 5. Verify OG 404 behavior
curl -I http://localhost:5173/og/tools/nonexistent
# Expected: 404
```

### CI Verification
After merging, monitor the next CI run:
- All 28 E2E tests should pass
- OG image tests for all 7 tools should return 200
- Pagination test should find 20 release cards

---

## Implementation Order

1. **Phase 1**: Modify export script (low risk, no runtime impact)
2. **Phase 3**: Add timeline testids (low risk, additive change)
3. **Phase 4**: Add OG route guard (low risk, improves error handling)
4. **Phase 2**: Regenerate snapshot (requires prod access)
5. **Phase 5**: Update test expectations (must match new snapshot)
6. **Phase 6**: Update documentation (can be done in parallel)

---

## Open Questions

1. **Prod DB access**: Who has read-only access to regenerate the snapshot? Is there a CI job for this?
2. **New tool workflow**: Should snapshot regeneration be automated when tools are added?
3. **Release OG route**: Apply same 404 guard to `/og/tools/$slug/releases/$version`?

---

## Related Files

- `prisma/seed-e2e-snapshot.ts` - Imports snapshot into DB
- `src/lib/tool-registry.tsx` - Source of truth for tool slugs
- `tests/e2e/config/database-sync.test.ts` - Validates registry/seed alignment
