# Implementation Plan: Custom Version Formatting for Codex Tool

## Problem Statement

The Codex tool (OpenAI's Rust CLI) has very long version strings that include Git commit hashes, making them difficult to read in the UI:
- Example: `codex-rs-94c47d69a3f92257e7f9717a2044bd55786eb999-1-rust-v0.0.2505121726`
- These appear in cards, timeline views, headers, and other UI components
- The actual semantic version is buried at the end: `v0.0.2505121726`

## Current State

### Version Storage (Database)
**File**: `prisma/schema.prisma` (lines 127-128)
```prisma
version       String // "2.0.31", "1.5.0-beta.1"
versionSort   String // For semantic version sorting
```
- The full tag name is stored as-is in the `version` field
- No custom display logic exists

### Version Parsing
**File**: `src/lib/parsers/github-releases.ts` (lines 63-75)
```typescript
// Extract version (strip prefix if configured)
let version = release.name || release.tag_name
if (config?.versionPrefix && version.startsWith(config.versionPrefix)) {
    version = version.substring(config.versionPrefix.length)
}
```
- Currently only strips the `versionPrefix` (`rust-v`)
- But the actual tag format is: `codex-rs-<hash>-1-rust-v<version>`
- So stripping `rust-v` leaves: `codex-rs-<hash>-1-rust-v0.0.2505121726` → still broken

### Tool Configuration
**File**: `prisma/seed.ts` (lines 54-56)
```typescript
sourceConfig: {
    versionPrefix: "rust-v",
    includePreReleases: true,
}
```

### Display Components
Versions are displayed directly without formatting in:

1. **ReleaseCard** (`src/components/changelog/release-card.tsx`, line 103):
   ```tsx
   <span className="ml-2">{version}</span>
   ```

2. **TimelineItem** (`src/components/changelog/timeline-item.tsx`, lines 70, 148):
   ```tsx
   <span className="ml-2">{version}</span>
   ```

3. **ToolHeader** (`src/components/changelog/tool-header.tsx`, lines 94, 111):
   ```tsx
   <div className="font-mono text-sm font-semibold">{latestVersion}</div>
   <div className="font-mono text-sm font-semibold">{firstVersion}</div>
   ```

4. **ReleaseStickyHeader** (`src/components/changelog/release-sticky-header.tsx`, lines 46, 74):
   ```tsx
   <span className="font-mono text-sm font-semibold">{version}</span>
   <div className="font-mono">{v.version}</div>
   ```

5. **VersionList** (`src/components/changelog/version-list.tsx`, line 105):
   ```tsx
   <div className="font-mono text-sm font-semibold group-hover:text-foreground">
     {version.version}
   </div>
   ```

## Proposed Solution

### Approach: Display-Time Formatting
Format versions at display time rather than modifying stored data. This keeps the database clean and allows flexibility per tool.

### Implementation Steps

#### 1. Create Version Formatting Utility
**New file**: `src/lib/version-formatter.ts`

```typescript
/**
 * Formats version strings for display based on tool-specific rules
 * 
 * Examples:
 * - Codex: "codex-rs-abc123...999-1-rust-v0.0.25" → "v0.0.25"
 * - Claude: "2.0.31" → "2.0.31" (no change)
 */
export function formatVersionForDisplay(version: string, toolSlug: string): string {
  // Tool-specific formatting rules
  const formatters: Record<string, (v: string) => string> = {
    'codex': formatCodexVersion,
    // Add more tools as needed
  }
  
  const formatter = formatters[toolSlug]
  return formatter ? formatter(version) : version
}

/**
 * Codex versions: "codex-rs-<hash>-1-rust-v0.0.2505121726"
 * Extract just the semantic version: "v0.0.2505121726"
 */
function formatCodexVersion(version: string): string {
  // Match pattern: anything ending with "rust-v" followed by version number
  const match = version.match(/rust-v([\d.]+)$/)
  if (match) {
    return `v${match[1]}`
  }
  
  // Fallback: try to find last v-prefixed version
  const vMatch = version.match(/v([\d.]+)$/)
  if (vMatch) {
    return `v${vMatch[1]}`
  }
  
  // Last resort: return as-is
  return version
}

/**
 * Optional: Get a short version (for tight spaces)
 * Example: "v0.0.2505121726" → "v0.0.250…"
 */
export function formatVersionShort(version: string, toolSlug: string, maxLength = 12): string {
  const formatted = formatVersionForDisplay(version, toolSlug)
  if (formatted.length <= maxLength) return formatted
  return `${formatted.substring(0, maxLength - 1)}…`
}
```

#### 2. Update Display Components

Update all 5 components to use the formatter:

**a) ReleaseCard** (`src/components/changelog/release-card.tsx`):
```typescript
import { formatVersionForDisplay } from '@/lib/version-formatter'

// In component:
<span className="ml-2">{formatVersionForDisplay(version, toolSlug)}</span>
```

**b) TimelineItem** (`src/components/changelog/timeline-item.tsx`):
```typescript
import { formatVersionForDisplay } from '@/lib/version-formatter'

// In component (both occurrences):
<span className="ml-2">{formatVersionForDisplay(version, toolSlug)}</span>
```

**c) ToolHeader** (`src/components/changelog/tool-header.tsx`):
```typescript
import { formatVersionForDisplay } from '@/lib/version-formatter'

// Add slug prop to component signature:
interface ToolHeaderProps {
  // ... existing props
  slug: string // NEW
}

// Update both version displays:
<div className="font-mono text-sm font-semibold">
  {formatVersionForDisplay(latestVersion, slug)}
</div>
<div className="font-mono text-sm font-semibold">
  {formatVersionForDisplay(firstVersion, slug)}
</div>
```

**d) ReleaseStickyHeader** and **e) VersionList**:
Apply same pattern - import formatter, pass toolSlug, wrap version displays.

#### 3. Update Parent Components

Update any components passing versions to add `toolSlug` prop where needed:

**File**: `src/routes/tools/$slug/index.tsx` (line 80+)
```typescript
<ToolHeader
  // ... existing props
  slug={slug} // ADD THIS
  // ...
/>
```

### Why This Approach?

**Pros:**
- ✅ Non-invasive: doesn't change database or parsing logic
- ✅ Flexible: easy to add formatting rules for other tools
- ✅ Maintainable: all formatting logic in one place
- ✅ Testable: pure functions easy to unit test
- ✅ Preserves source of truth: original version stays in DB for links/routing

**Cons:**
- ❌ Requires passing `toolSlug` through component tree
- ❌ Formatting happens on every render (but negligible perf impact)

**Alternatives considered:**
1. **Fix at parse time**: Would require re-ingesting all releases and breaks URL routing
2. **Add displayVersion field to DB**: Adds complexity and duplicate data
3. **Fix version prefix in seed.ts**: Won't work - the prefix is more complex than simple string match

## Files to Create
- `src/lib/version-formatter.ts` (new utility)

## Files to Modify
1. `src/components/changelog/release-card.tsx` (import + format)
2. `src/components/changelog/timeline-item.tsx` (import + format, 2 places)
3. `src/components/changelog/tool-header.tsx` (add slug prop + format, 2 places)
4. `src/components/changelog/release-sticky-header.tsx` (import + format)
5. `src/components/changelog/version-list.tsx` (import + format)
6. `src/routes/tools/$slug/index.tsx` (pass slug to ToolHeader)

## Testing Plan
1. Visit `/tools/codex` page
2. Verify versions show as `v0.0.XXX` instead of full hash strings
3. Verify timeline view also shows formatted versions
4. Verify clicking on releases still works (URLs use original version)
5. Visit `/tools/claude-code` page
6. Verify Claude versions display unchanged (no formatting applied)

## Edge Cases
- What if version doesn't match expected pattern? → Return as-is (safe fallback)
- What if toolSlug is missing? → Return version as-is (safe fallback)
- What about URLs/routing? → Keep using original version field (no changes needed)
