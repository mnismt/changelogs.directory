# Database Schema Design

## Overview

This document describes the complete database schema for Changelogs.directory, a platform that tracks, aggregates, and presents changelog information for CLI developer tools.

### Design Goals

- **Flexible source ingestion**: Support multiple changelog formats (CHANGELOG.md, GitHub Releases, RSS feeds, custom APIs)
- **Efficient querying**: Optimized for common queries (latest releases, filters by type/platform, search)
- **Change detection**: Track what's new without re-fetching unchanged data
- **Observability**: Log all ingestion jobs for debugging and monitoring
- **Future-proof**: Easy to add new tools and source types without schema changes
- **Feed generation**: Support RSS/Atom feeds per tool and globally

---

## Core Models

### 1. Tool (CLI Developer Tools)

Represents a CLI developer tool being tracked (e.g., Claude Code, OpenAI Codex, AMP Code).

```prisma
model Tool {
  id              String      @id @default(cuid())
  slug            String      @unique  // URL-friendly: "claude-code", "openai-codex"
  name            String                // Display name: "Claude Code"
  vendor          String                // Company: "Anthropic", "OpenAI"
  description     String?               // Short description for directory listing
  homepage        String                // Official website: https://claude.ai/code
  repositoryUrl   String                // GitHub repo: https://github.com/anthropics/claude-code

  // Source configuration (flexible connector system)
  sourceType      SourceType            // CHANGELOG_MD, GITHUB_RELEASES, etc.
  sourceUrl       String                // Direct URL to changelog source
  sourceConfig    Json?                 // Additional connector-specific config

  // Metadata
  logoUrl         String?               // Logo for directory display
  tags            String[]              // ["ai", "cli", "code-editor", "agent"]
  isActive        Boolean     @default(true)  // For pausing ingestion

  // Timestamps
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  lastFetchedAt   DateTime?             // Last successful ingestion run

  // Relations
  releases        Release[]
  fetchLogs       FetchLog[]

  @@index([slug])
  @@index([isActive])
  @@index([lastFetchedAt])
  @@map("tool")
}

enum SourceType {
  CHANGELOG_MD      // CHANGELOG.md file (like Claude Code)
  GITHUB_RELEASES   // GitHub Releases API
  RSS_FEED          // RSS/Atom feed
  CUSTOM_API        // Custom endpoint
}
```

#### Key Design Decisions

- **`slug`**: Unique, URL-friendly identifier for routing (`/tools/claude-code`)
- **`sourceType` + `sourceUrl` + `sourceConfig`**: Flexible connector system
  - `sourceConfig` (JSON) allows connector-specific settings without schema changes
  - Example: `{ "branch": "main", "path": "CHANGELOG.md" }`
- **`tags[]`**: PostgreSQL native array for multi-tag filtering
- **`isActive`**: Pause ingestion without deleting data
- **`lastFetchedAt`**: Quick status check for admin dashboard

---

### 2. Release (Versions)

Represents a single version/release of a tool.

```prisma
model Release {
  id              String      @id @default(cuid())
  toolId          String
  tool            Tool        @relation(fields: [toolId], references: [id], onDelete: Cascade)

  // Version info
  version         String                // "2.0.31", "1.5.0-beta.1"
  versionSort     String                // For semantic version sorting

  // Dates
  releaseDate     DateTime?             // Actual release date (if available in source)
  publishedAt     DateTime    @default(now())  // When WE ingested it

  // Source tracking
  sourceUrl       String                // Direct link to release (GitHub tag, etc.)
  rawContent      String      @db.Text  // Original markdown/JSON for re-parsing
  contentHash     String                // SHA256 hash for change detection

  // Parsed metadata
  title           String?               // Optional release title
  summary         String?     @db.Text  // Auto-generated summary (first N chars)

  // Classification tags
  tags            String[]              // ["breaking", "security", "deprecation"]

  // Relations
  changes         Change[]

  // Timestamps
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@unique([toolId, version])  // Prevent duplicate versions per tool
  @@index([toolId, releaseDate(sort: Desc)])
  @@index([publishedAt(sort: Desc)])
  @@index([tags])
  @@map("release")
}
```

#### Key Design Decisions

- **`version` + `versionSort`**:
  - `version` stores the original string ("2.0.31")
  - `versionSort` enables proper semantic version ordering in SQL queries

- **`releaseDate` vs `publishedAt`**:
  - `releaseDate`: When the tool vendor released it (from changelog)
  - `publishedAt`: When we discovered/ingested it (for "What's new" feed)

- **`rawContent` + `contentHash`**:
  - Store original source for re-parsing without re-fetching
  - Hash detects if upstream changelog was edited (enables update detection)

- **`tags[]`**: Release-level flags (breaking, security, deprecation)
  - Different from `Change.type` (which is per-entry)
  - Enables "Show only breaking releases" filter

#### Version Sorting Strategy

**Problem**: Pre-release versions need special handling. Simple string comparison makes `"1.5.0-beta.1"` sort AFTER `"1.5.0"` (incorrect!).

**Solution**: Use prefix-based sorting:

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

**Examples**:

- `"2.0.31"` → `"002000031-z"` (stable)
- `"1.5.0-beta.1"` → `"001005000-a-beta.1"` (pre-release)
- `"1.5.0"` → `"001005000-z"` (stable)

Now `"001005000-a-beta.1"` correctly sorts before `"001005000-z"` ✅

---

### 3. Change (Individual Changelog Entries)

Represents a single bullet point/change within a release.

```prisma
model Change {
  id              String      @id @default(cuid())
  releaseId       String
  release         Release     @relation(fields: [releaseId], references: [id], onDelete: Cascade)

  // Change classification (inferred from text)
  type            ChangeType            // FEATURE, BUGFIX, IMPROVEMENT, etc.

  // Content
  title           String                // The bullet point text (cleaned)
  description     String?     @db.Text  // Extended description (if multi-line)

  // Context
  platform        String?               // "windows", "macos", "linux", "vscode", "ide"
  component       String?               // Affected component/module (if known)

  // Flags (inferred from text)
  isBreaking      Boolean     @default(false)
  isSecurity      Boolean     @default(false)
  isDeprecation   Boolean     @default(false)

  // Impact assessment
  impact          ImpactLevel?          // MAJOR, MINOR, PATCH

  // Links (extracted from markdown)
  links           Json?                 // [{ url: "...", text: "...", type: "docs|issue|pr" }]

  // Order within release
  order           Int         @default(0)  // Preserve original order from changelog

  // Timestamps
  createdAt       DateTime    @default(now())

  @@index([releaseId, order])
  @@index([type])
  @@index([isBreaking])
  @@index([isSecurity])
  @@index([platform])
  @@map("change")
}

enum ChangeType {
  FEATURE           // New functionality ("Added", "Implemented")
  BUGFIX            // Bug fixes ("Fixed", "Resolved")
  IMPROVEMENT       // Enhancements ("Improved", "Enhanced", "Updated")
  BREAKING          // Breaking changes
  SECURITY          // Security patches
  DEPRECATION       // Deprecated features
  PERFORMANCE       // Performance improvements
  DOCUMENTATION     // Docs updates
  OTHER             // Misc changes
}

enum ImpactLevel {
  MAJOR             // Breaking changes, major features
  MINOR             // New features, non-breaking
  PATCH             // Bug fixes, small improvements
}
```

#### Key Design Decisions

- **`type` inference**: Since changelogs rarely categorize changes, infer from text patterns:
  - Check for keywords: "breaking change", "security", "deprecated", "fixed", "added", etc.
  - Order matters - check breaking/security first before generic patterns

- **`platform` extraction**: Parse platform prefixes like `"Windows:"`, `"macOS:"`, `"VSCode:"` from text

- **Boolean flags**: Enable fast filtering without parsing text
  - Indexed for performance
  - Set during ingestion based on text patterns

- **`links` (JSON field)**: Stores extracted URLs with metadata
  - Example: `[{ url: "https://...", text: "Read more", type: "docs" }]`

- **`order` field**: Preserves original changelog order for display

---

### 4. FetchLog (Ingestion Tracking)

Tracks every ingestion job for observability and debugging.

```prisma
model FetchLog {
  id              String      @id @default(cuid())
  toolId          String
  tool            Tool        @relation(fields: [toolId], references: [id], onDelete: Cascade)

  // Job metadata
  status          FetchStatus
  startedAt       DateTime    @default(now())
  completedAt     DateTime?
  duration        Int?                  // milliseconds

  // Results
  releasesFound   Int         @default(0)  // Total releases in source
  releasesNew     Int         @default(0)  // New releases created
  releasesUpdated Int         @default(0)  // Existing releases updated
  changesCreated  Int         @default(0)  // Total changes inserted

  // Error tracking
  error           String?     @db.Text
  errorStack      String?     @db.Text

  // Source info
  sourceUrl       String                   // URL fetched
  sourceEtag      String?                  // For HTTP caching (if supported)

  @@index([toolId, startedAt(sort: Desc)])
  @@index([status])
  @@map("fetch_log")
}

enum FetchStatus {
  PENDING           // Job queued but not started
  IN_PROGRESS       // Currently running
  SUCCESS           // Completed successfully
  FAILED            // Failed (all releases)
  PARTIAL           // Some releases succeeded, some failed
}
```

#### Key Design Decisions

- **Observability**: Every ingestion run is logged
- **Metrics**: Track new vs updated releases, total changes
- **Debugging**: Store error messages and stack traces
- **HTTP caching**: `sourceEtag` for conditional requests (GitHub supports ETags)
- **Admin dashboard**: Query latest logs per tool to show status

---

## Indexes & Performance

### Primary Indexes

```prisma
// Tool
@@index([slug])               // Lookups by URL slug
@@index([isActive])           // Filter active tools
@@index([lastFetchedAt])      // Sort by last ingestion

// Release
@@unique([toolId, version])   // Prevent duplicates
@@index([toolId, releaseDate(sort: Desc)])  // Latest releases per tool
@@index([publishedAt(sort: Desc)])          // Global "What's new" feed
@@index([tags])               // Filter by breaking/security/etc.

// Change
@@index([releaseId, order])   // Ordered changes within a release
@@index([type])               // Filter by feature/bugfix/etc.
@@index([isBreaking])         // Show only breaking changes
@@index([isSecurity])         // Security updates feed
@@index([platform])           // Platform-specific filtering

// FetchLog
@@index([toolId, startedAt(sort: Desc)])  // Latest logs per tool
@@index([status])             // Filter by success/failure
```

### Scalability Considerations

**When you reach 1000+ releases**, consider these optimizations:

1. **GIN indexes for array fields** (better performance for tag filtering):

   ```prisma
   model Release {
     tags String[]
     @@index([tags], type: Gin)  // Add when scaling
   }
   ```

2. **Full-text search** (when you have 10,000+ changes):

   ```prisma
   model Change {
     titleTsVector Unsupported("tsvector")?
       @default(dbgenerated("to_tsvector('english', title)"))
     @@index([titleTsVector], type: Gin)
   }
   ```

3. **Conditional HTTP fetches** to avoid GitHub rate limits:
   - Use `FetchLog.sourceEtag` to send `If-None-Match` headers
   - GitHub returns 304 Not Modified when unchanged
   - Saves bandwidth and rate limit quota

---

## Implementation Guide

### Migration Steps

1. **Add schema to Prisma**:
   - Copy models to `prisma/schema.prisma`
   - Place after existing models (Waitlist, User, Session, etc.)

2. **Run migration**:

   ```bash
   pnpm prisma migrate dev --name add_tool_release_change_models
   ```

3. **Generate Prisma Client**:

   ```bash
   pnpm prisma generate
   ```

4. **Seed Claude Code tool** in `prisma/seed.ts`:

   ```typescript
   await prisma.tool.upsert({
     where: { slug: 'claude-code' },
     create: {
       slug: 'claude-code',
       name: 'Claude Code',
       vendor: 'Anthropic',
       homepage: 'https://claude.ai/code',
       repositoryUrl: 'https://github.com/anthropics/claude-code',
       sourceType: 'CHANGELOG_MD',
       sourceUrl: 'https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md',
       tags: ['ai', 'cli', 'code-editor', 'agent'],
       isActive: true,
     },
   });
   ```

### Parser Structure

**File**: `src/lib/parsers/changelog-md.ts`

**High-level workflow**:

1. **Split by version headers**: Use regex to find `## 2.0.31` patterns
2. **Extract changes**: Parse bullet points between version headers
3. **Classify each change**:
   - Infer `type` from keywords (fixed → BUGFIX, added → FEATURE, etc.)
   - Extract `platform` from prefixes (Windows:, macOS:, etc.)
   - Detect flags: breaking, security, deprecation
   - Extract markdown links
4. **Generate version sort**: Use the algorithm above (with prefix handling)
5. **Compute content hash**: SHA256 of raw markdown for change detection

**Key patterns to detect**:

- Breaking: `"breaking change"` keyword
- Security: `"security"`, `"vulnerability"` keywords
- Platform: `"Windows:"`, `"macOS:"`, `"VSCode:"` prefixes
- Type: First word patterns (`"Fixed"` → BUGFIX, `"Added"` → FEATURE)

### Trigger.dev Task Workflow

**File**: `src/trigger/ingest-claude-code.ts`

**High-level phases**:

1. **Setup**:
   - Load Tool record from database
   - Create FetchLog with `IN_PROGRESS` status

2. **Fetch**:
   - GET changelog from `tool.sourceUrl`
   - Check ETag from previous run (optional optimization)
   - If 304 Not Modified, skip processing

3. **Parse**:
   - Run parser on markdown content
   - Get array of `{ version, versionSort, changes[], rawContent, tags[] }`

4. **Upsert releases** (idempotent):
   - For each parsed release:
     - Check if exists via `toolId + version` unique constraint
     - If exists + contentHash unchanged → skip
     - If exists + contentHash changed → update Release, delete old Changes, insert new Changes
     - If new → create Release, insert Changes

5. **Update metadata**:
   - Set `tool.lastFetchedAt`
   - Complete FetchLog with metrics (new/updated counts)

6. **Error handling**:
   - Catch errors
   - Update FetchLog with `FAILED` status + error message
   - Re-throw for Trigger.dev retry logic

**Concurrency control**:

Configure in Trigger.dev:

```typescript
export const ingestClaudeCode = task({
  id: 'ingest-claude-code',
  queue: { concurrencyLimit: 1 },  // Prevent duplicate jobs
  maxDuration: 300,
  run: async () => { /* ... */ }
});
```

**Scheduling**:

- Set up in Trigger.dev dashboard: `0 */6 * * *` (every 6 hours)
- Or use Trigger.dev's scheduled tasks feature

### Key Query Patterns

**1. Homepage feed (latest releases)**:

```typescript
await prisma.release.findMany({
  where: { tool: { isActive: true } },
  include: { tool: true, _count: { select: { changes: true } } },
  orderBy: { publishedAt: 'desc' },
  take: 20
});
```

**2. Tool page (all releases, properly sorted)**:

```typescript
await prisma.release.findMany({
  where: { tool: { slug: 'claude-code' } },
  orderBy: { versionSort: 'desc' },  // Uses our fixed algorithm!
  take: 50
});
```

**3. Filter by change type**:

```typescript
await prisma.change.findMany({
  where: { releaseId, type: 'FEATURE' },
  orderBy: { order: 'asc' }
});
```

---

## Future Extensibility

### Adding New Tools

1. Insert Tool record with appropriate `sourceType`
2. Create parser if format differs (e.g., GitHub Releases API)
3. Create new Trigger.dev task (or generalize existing one)
4. Schedule task

### Multiple Source Types

The schema already supports:

- `CHANGELOG_MD` (implemented first)
- `GITHUB_RELEASES` (fetch from GitHub API)
- `RSS_FEED` (parse Atom/RSS)
- `CUSTOM_API` (tool-specific endpoints)

Each requires a corresponding parser in `src/lib/parsers/`.

### Admin Dashboard Queries

**Latest ingestion status per tool**:

```typescript
await prisma.fetchLog.findMany({
  distinct: ['toolId'],
  orderBy: { startedAt: 'desc' },
  include: { tool: true }
});
```

**Failed jobs in last 24 hours**:

```typescript
await prisma.fetchLog.findMany({
  where: {
    status: 'FAILED',
    startedAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  },
  include: { tool: true }
});
```

---

## Next Steps

1. ✅ Schema designed
2. Copy models to `prisma/schema.prisma`
3. Run migration
4. Implement parser (`src/lib/parsers/changelog-md.ts`)
5. Implement Trigger.dev task (`src/trigger/ingest-claude-code.ts`)
6. Test ingestion manually
7. Schedule task in Trigger.dev
8. Build UI pages (`/tools/claude-code`)

---

## Questions?

This schema provides flexibility through JSON fields (`sourceConfig`, `links`) for edge cases without requiring migrations. For structural changes, create new migrations:

```bash
pnpm prisma migrate dev --name descriptive_name
```
