# Parser Development Reference

> **Last verified**: 2026-01-11

This document explains how to develop custom parsers for extracting structured changelog data from various sources.

## Parser Interface

All parsers must return `ParsedRelease[]` matching this interface:

```typescript
interface ParsedRelease {
  version: string           // "2.0.31"
  versionSort: string       // "0002.0000.0031.0000" (for sorting)
  releaseDate?: Date        // From source or Git history
  title?: string            // Optional release title
  headline: string          // One-line summary (≤140 chars)
  summary?: string          // 1-2 sentence summary (≤400 chars, LLM generates if missing)
  rawContent: string        // Original markdown/HTML/JSON
  contentHash: string       // SHA256 for change detection
  changes: ParsedChange[]   // Bullet points
  isPrerelease?: boolean    // For GitHub Releases
  sourceUrl?: string        // Direct link to this release
}

interface ParsedChange {
  title: string             // "Fix: Database connection pooling"
  description?: string      // Extended description (optional)
  type?: ChangeType         // FEATURE, BUGFIX, etc. (refined by LLM in enrich step)
}
```

---

## Existing Parsers

### 1. Markdown Parser (CHANGELOG_MD)

**File**: `src/lib/parsers/changelog-md.ts`

**Use Case**: Standard CHANGELOG.md files from GitHub repos

**Format Expected**:
```markdown
# Changelog

## 2.0.31

- Fix: Database connection pooling
- Feature: Add dark mode support
- Improvement: Faster page loads

## 2.0.30

- Fix: Memory leak in worker threads
```

**Implementation**:
```typescript
export function parseChangelogMd(markdown: string): {
  releases: ParsedRelease[]
  errors?: string[]
} {
  // 1. Split by version headers
  const versionRegex = /^##\s+(\d+\.\d+\.\d+.*?)$/gm
  const sections = markdown.split(versionRegex)

  // 2. Extract releases
  const releases: ParsedRelease[] = []

  for (let i = 1; i < sections.length; i += 2) {
    const version = sections[i].trim()
    const content = sections[i + 1].trim()

    // 3. Extract changes (bullet points)
    const changes = content
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
      .map(line => ({
        title: line.replace(/^[-*]\s+/, '').trim(),
      }))

    releases.push({
      version,
      versionSort: createVersionSort(version),
      headline: generateHeadline(changes),
      rawContent: content,
      contentHash: hashContent(content),
      changes,
    })
  }

  return { releases }
}
```

**Cross-reference**: See `src/lib/parsers/changelog-md.ts:parseChangelogMd` for full implementation.

---

### 2. GitHub Releases Parser (GITHUB_RELEASES)

**File**: `src/lib/parsers/github-releases.ts`

**Use Case**: GitHub Releases API responses

**Format Expected**: GitHub API JSON
```json
[
  {
    "tag_name": "rust-v0.0.25",
    "name": "Release 0.0.25",
    "body": "## Highlights\n- New feature\n\n## Merged PRs\n- #123",
    "published_at": "2024-11-30T10:00:00Z",
    "prerelease": false,
    "html_url": "https://github.com/..."
  }
]
```

**Implementation**:
```typescript
export function parseGitHubReleases(
  releases: GitHubRelease[],
  config: { versionPrefix?: string } = {}
): ParsedRelease[] {
  return releases.map(release => {
    // Strip version prefix (e.g., "rust-v0.0.25" → "0.0.25")
    const version = stripVersionPrefix(release.tag_name, config.versionPrefix)

    // Parse sections (## Highlights, ## Merged PRs, etc.)
    const sections = parseSections(release.body)

    // Extract changes from bullet points
    const changes = extractBulletPoints(release.body)

    return {
      version,
      versionSort: createVersionSort(version),
      releaseDate: new Date(release.published_at),
      title: release.name,
      headline: generateHeadline(changes),
      rawContent: release.body,
      contentHash: hashContent(release.body),
      changes,
      isPrerelease: release.prerelease,
      sourceUrl: release.html_url,
    }
  })
}
```

**Cross-reference**: See `src/lib/parsers/github-releases.ts` for full implementation.

---

### 3. Custom HTML Parser (CUSTOM_API)

**Example**: Cursor changelog scraper

**File**: `src/lib/parsers/cursor-changelog.ts`

**Format Expected**: HTML pages from custom changelog
```html
<article>
  <h1><a href="/changelog/2-2">Cursor 2.2</a></h1>
  <time datetime="2024-11-30">November 30, 2024</time>
  <div class="prose">
    <h3>AI Autocomplete Improvements</h3>
    <p>Better predictions and faster completions.</p>
    <h3>Syntax Highlighting</h3>
    <p>Enhanced support for more languages.</p>
  </div>
</article>
```

**Implementation**:
```typescript
import { parse } from 'node-html-parser'

export function parseCursorChangelog(html: string, options?: CursorParserOptions) {
  const root = parse(html)
  const articles = root.querySelectorAll('main#main.section.section--longform article')
  const releases: ParsedRelease[] = []

  for (const article of articles) {
    // Extract title from h1, h2, or h3 (Cursor switched from h2 to h1)
    const title = article.querySelector('h1')?.text.trim() ||
                  article.querySelector('h2')?.text.trim() ||
                  article.querySelector('h3')?.text.trim()

    // Extract slug from permalink (supports both version and named slugs)
    // e.g., "2-2", "enterprise-dec-2025", "claude-support"
    const slug = extractSlug(article.querySelector('h1 a')?.getAttribute('href'))
    const version = `cursor-${slug}`

    // Extract changes from h3/h4 sections (fallback to list items)
    const changes = extractChanges(article.querySelector('.prose'))

    releases.push({
      version,
      versionSort: releaseDate?.toISOString() || `slug-${slug}`,
      headline: generateHeadline(body),
      rawContent: article.toString(),
      contentHash: hashContent(body),
      changes,
    })
  }

  return releases
}
```

**Key behaviors**:
- Selector `main#main...` avoids duplicate articles from React hydration divs
- Slug pattern `/^[a-z0-9]+(?:-[a-z0-9]+)*$/i` accepts both version numbers (`2-2`) and named releases (`enterprise-dec-2025`)
- Title extraction checks h1 → h2 → h3 in order
- Text cleanup via `cleanText()` handles:
  - Arrow glyph removal (↓↑ from Radix UI accordions)
  - HTML entity decoding (`&#x27;` → `'`)
- Radix UI accordion containers (`data-orientation="vertical"`) are skipped during description extraction
- Media (images/videos) are extracted to `media[]` array, not included in description text

**Cross-reference**: See `src/lib/parsers/cursor-changelog.ts` for full implementation.

---

### 4. SPA HTML Parser with Playwright (CUSTOM_API + SPA)

**Example**: Antigravity changelog parser

**File**: `src/lib/parsers/antigravity-changelog.ts`

**Use Case**: Client-side rendered Angular/React/Vue apps where content requires JavaScript execution.

**Format Expected** (after Playwright renders):
```html
<div class="grid-body grid-container">
  <!-- Sibling pairs: version + description -->
  <div class="version">
    <p class="body">1.13.3<br/>Dec 19, 2025</p>
  </div>
  <div class="description main-left-container">
    <h3 class="heading-7">Google Workspace Support</h3>
    <div class="expandable-items">
      <details>
        <summary>Improvements (1)</summary>
        <ul><li class="caption">Better error handling</li></ul>
      </details>
    </div>
  </div>
</div>
```

**Key Pattern: Sibling-Pair Parsing**

Unlike Cursor (nested structure), Antigravity uses sibling pairs where each release is two adjacent divs:

```typescript
import { parse } from 'node-html-parser'

export function parseAntigravityChangelog(html: string): ParsedRelease[] {
  const root = parse(html)
  const gridBody = root.querySelector('.grid-body.grid-container')
  if (!gridBody) return []

  const releases: ParsedRelease[] = []
  const versionDivs = gridBody.querySelectorAll('div.version')

  for (const versionDiv of versionDivs) {
    // Get adjacent description div (next sibling)
    const descriptionDiv = versionDiv.nextElementSibling
    if (!descriptionDiv?.classList.contains('description')) continue

    const release = transformRelease(versionDiv, descriptionDiv)
    if (release) releases.push(release)
  }

  return releases
}
```

**Version + Date Extraction**:
```typescript
// Parse "1.13.3<br/>Dec 19, 2025" format
function parseVersionAndDate(html: string) {
  const parts = html.split(/<br\s*\/?>/i).map(p => p.trim())
  const version = parts[0]?.replace(/<[^>]*>/g, '') || null
  const dateStr = parts[1]?.replace(/<[^>]*>/g, '').trim()
  const releaseDate = dateStr ? new Date(`${dateStr} UTC`) : undefined
  return { version, releaseDate }
}
```

**Category Mapping** (avoiding schema changes):
```typescript
function mapCategoryToChangeType(category: string): ChangeType {
  switch (category.toLowerCase()) {
    case 'improvements': return 'IMPROVEMENT'
    case 'fixes': return 'BUGFIX'
    case 'patches': return 'BUGFIX'  // Map to existing type
    default: return 'OTHER'
  }
}
```

**Version Prefixing**:
```typescript
// Store as "antigravity-1.13.3" for uniqueness
version: `antigravity-${version}`

// Display as "v1.13.3" via version-formatter.ts
function formatAntigravityVersion(version: string): string {
  return `v${version.replace(/^antigravity-/, '')}`
}
```

**Cross-reference**: See `src/lib/parsers/antigravity-changelog.ts` for full implementation.

---

### 5. Platform Changelog Parser (PLATFORM_CHANGELOG)

**File**: `src/lib/parsers/platform-changelog.ts`

**Use Case**: The platform's own CHANGELOG.md with frontmatter and custom metadata format.

**Format Expected**:
```markdown
---
title: changelogs.directory Changelog
description: Track updates to the changelog aggregation platform itself
---

## 0.4.3

> **2026-01-07** — Mobile UX Improvements

<img src="/changelog-assets/v0.4.3.png" alt="Mobile UX Improvements" width="75%" />

- Fixed toast overlapping with mobile navigation dock
- Swipe-to-dismiss gesture and relative dates

## 0.4.2

> **2026-01-06** — Meta Changelog

![Meta Changelog](/changelog-assets/v0.4.2.png)

- New `/changelog` page
- "What's New" toast notification
```

**Key Features**:
- **Frontmatter**: Uses `gray-matter` to parse YAML frontmatter (title, description)
- **Metadata Line**: Extracts date and title from `> **YYYY-MM-DD** — Title` format
- **Dual Image Syntax**: Supports both Markdown and HTML images

**Interface**:
```typescript
interface PlatformRelease {
  version: string        // "0.4.3"
  date: string           // "2026-01-07"
  title: string          // "Mobile UX Improvements"
  image?: string         // "/changelog-assets/v0.4.3.png"
  imageWidth?: string    // "75%" (from HTML width attribute)
  changes: string[]      // ["Fixed toast overlapping...", ...]
}
```

**Image Extraction**:
```typescript
// Markdown image: ![alt](path)
const mdImageMatch = content.match(/!\[.*?\]\(([^)]+)\)/)

// HTML image: <img src="path" width="75%" />
const htmlImageMatch = content.match(
  /<img\s+[^>]*src=["']([^"']+)["'][^>]*\/?>/i
)

// Extract width attribute if present
const widthMatch = htmlImageMatch[0].match(/width=["']([^"']+)["']/i)
```

**Cross-reference**: See `src/lib/parsers/platform-changelog.ts` for full implementation.

---

## Creating a Custom Parser

### Step 1: Analyze Source Format

**Questions to answer**:
- How are versions identified? (headers, tags, dates)
- How are changes listed? (bullet points, paragraphs, structured data)
- Is there metadata? (release dates, titles, URLs)
- Are there multiple pages/sections?

**Example Analysis** (Hypothetical RSS feed):
```xml
<item>
  <title>Version 3.2.1 Released</title>
  <pubDate>Fri, 01 Dec 2024 10:00:00 GMT</pubDate>
  <description>
    <![CDATA[
      <ul>
        <li>Fixed authentication bug</li>
        <li>Added new export feature</li>
      </ul>
    ]]>
  </description>
  <link>https://example.com/releases/3.2.1</link>
</item>
```

### Step 2: Create Parser Function

**File**: `src/lib/parsers/your-tool-parser.ts`

```typescript
import { createHash } from 'crypto'
import { createVersionSort } from './utils'

export function parseYourToolChangelog(rssItems: any[]): ParsedRelease[] {
  return rssItems.map(item => {
    // Extract version from title
    const versionMatch = item.title.match(/Version\s+([\d.]+)/)
    const version = versionMatch ? versionMatch[1] : 'unknown'

    // Parse HTML description
    const changes = extractChangesFromHTML(item.description)

    return {
      version,
      versionSort: createVersionSort(version),
      releaseDate: new Date(item.pubDate),
      headline: item.title,
      rawContent: item.description,
      contentHash: createHash('sha256').update(item.description).digest('hex'),
      changes,
      sourceUrl: item.link,
    }
  })
}

function extractChangesFromHTML(html: string): ParsedChange[] {
  // Use cheerio or regex to extract bullet points
  const bulletRegex = /<li>(.*?)<\/li>/g
  const changes: ParsedChange[] = []
  let match

  while ((match = bulletRegex.exec(html)) !== null) {
    changes.push({ title: match[1].trim() })
  }

  return changes
}
```

### Step 3: Write Tests

**File**: `tests/lib/parsers/your-tool-parser.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { parseYourToolChangelog } from '@/lib/parsers/your-tool-parser'

describe('parseYourToolChangelog', () => {
  it('should parse RSS items correctly', () => {
    const rssItems = [
      {
        title: 'Version 3.2.1 Released',
        pubDate: 'Fri, 01 Dec 2024 10:00:00 GMT',
        description: '<ul><li>Fixed bug</li><li>Added feature</li></ul>',
        link: 'https://example.com/3.2.1',
      },
    ]

    const result = parseYourToolChangelog(rssItems)

    expect(result).toHaveLength(1)
    expect(result[0].version).toBe('3.2.1')
    expect(result[0].changes).toHaveLength(2)
    expect(result[0].changes[0].title).toBe('Fixed bug')
  })

  it('should handle missing version gracefully', () => {
    const rssItems = [
      {
        title: 'Latest Updates',
        pubDate: 'Fri, 01 Dec 2024 10:00:00 GMT',
        description: '<ul><li>Something new</li></ul>',
        link: 'https://example.com/latest',
      },
    ]

    const result = parseYourToolChangelog(rssItems)

    expect(result[0].version).toBe('unknown')
  })
})
```

### Step 4: Integrate into Ingestion Pipeline

**File**: `src/trigger/ingest/your-tool/steps/parse.ts`

```typescript
import { parseYourToolChangelog } from '@/lib/parsers/your-tool-parser'
import type { FetchResult, ParseResult } from '../types'

export function parseStep(fetchResult: FetchResult): ParseResult {
  const releases = parseYourToolChangelog(fetchResult.rssItems)

  return {
    releases,
    errors: releases.length === 0 ? ['No releases found'] : undefined,
  }
}
```

---

## Utilities

### Version Sorting

**Function**: `createVersionSort(version: string): string`

**Purpose**: Convert semantic versions to sortable strings.

**Implementation**:
```typescript
export function createVersionSort(version: string): string {
  // Remove any prefixes (v, rust-, etc.)
  const cleanVersion = version.replace(/^[a-z-]+v?/, '')

  // Split by dots or hyphens
  const parts = cleanVersion.split(/[.-]/)

  // Pad each part to 4 digits
  const padded = parts
    .map(part => {
      const num = Number.parseInt(part, 10)
      return Number.isNaN(num) ? '0000' : num.toString().padStart(4, '0')
    })
    .join('.')

  // Ensure 4 segments minimum (major.minor.patch.build)
  const segments = padded.split('.')
  while (segments.length < 4) {
    segments.push('0000')
  }

  return segments.join('.')
}
```

**Examples**:
```typescript
createVersionSort('2.0.31')          // "0002.0000.0031.0000"
createVersionSort('10.1.5')          // "0010.0001.0005.0000"
createVersionSort('1.0.0-beta.1')    // "0001.0000.0000.0000"
```

---

### Content Hashing

**Function**: `hashContent(content: string): string`

**Purpose**: Generate SHA256 hash for change detection.

**Implementation**:
```typescript
import { createHash } from 'crypto'

export function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}
```

**Usage**: Compare hashes to skip unchanged releases in filter phase. When a run enables `forceFullRescan`, ingestion bypasses that filter and reprocesses releases even if the hash is unchanged.

---

### Headline Generation

**Function**: `generateHeadline(changes: ParsedChange[]): string`

**Purpose**: Create concise one-line summary from changes.

**Implementation** (basic, LLM refines later):
```typescript
export function generateHeadline(changes: ParsedChange[]): string {
  if (changes.length === 0) return 'Minor updates and fixes'

  const types = {
    features: changes.filter(c => c.title.match(/feat|add|new/i)),
    fixes: changes.filter(c => c.title.match(/fix|bug|resolve/i)),
    improvements: changes.filter(c => c.title.match(/improve|enhance|optimize/i)),
  }

  if (types.features.length > 0) {
    return `${types.features.length} new feature${types.features.length > 1 ? 's' : ''} and improvements`
  }

  if (types.fixes.length > 0) {
    return `${types.fixes.length} bug fix${types.fixes.length > 1 ? 'es' : ''} and enhancements`
  }

  return `${changes.length} update${changes.length > 1 ? 's' : ''}`
}
```

**Note**: LLM enrichment step generates better headlines.

---

## Common Patterns

### Extracting Versions from Text

```typescript
// Pattern 1: Standard semantic version
const semverRegex = /\b(\d+\.\d+\.\d+(?:-[\w.]+)?)\b/
const version = text.match(semverRegex)?.[1]

// Pattern 2: Date-based versions
const dateRegex = /(\d{4})-(\d{2})-(\d{2})/
const match = text.match(dateRegex)
const version = match ? `${match[1]}.${match[2]}.${match[3]}` : null

// Pattern 3: Prefixed versions
const prefixedRegex = /rust-v(\d+\.\d+\.\d+)/
const version = text.match(prefixedRegex)?.[1]
```

---

### Extracting Changes from Markdown

```typescript
function extractMarkdownBullets(markdown: string): ParsedChange[] {
  return markdown
    .split('\n')
    .filter(line => line.trim().match(/^[-*]\s+/))
    .map(line => ({
      title: line.replace(/^[-*]\s+/, '').trim(),
    }))
}
```

---

### Extracting Changes from HTML

```typescript
import * as cheerio from 'cheerio'

function extractHTMLBullets(html: string): ParsedChange[] {
  const $ = cheerio.load(html)
  const changes: ParsedChange[] = []

  $('li').each((_, el) => {
    changes.push({ title: $(el).text().trim() })
  })

  return changes
}
```

---

## Troubleshooting

### Issue: Parser returns empty array

**Cause**: Regex doesn't match source format

**Fix**:
1. Print raw content to inspect format:
   ```typescript
   console.log('Raw content:', content.substring(0, 500))
   ```
2. Adjust regex or selectors to match actual format
3. Test regex at https://regex101.com

---

### Issue: Version sorting incorrect

**Symptom**: `10.0.0` appears before `2.0.0`

**Fix**: Ensure using `versionSort`, not `version` for sorting:
```sql
-- ❌ WRONG (lexicographic)
ORDER BY version DESC

-- ✅ CORRECT (semantic)
ORDER BY "versionSort" DESC
```

---

### Issue: Content hash always changes

**Symptom**: All releases marked as changed every run

**Fix**: Normalize content before hashing (remove whitespace variations):
```typescript
const normalized = content
  .trim()
  .replace(/\s+/g, ' ')  // Normalize whitespace
  .replace(/\r\n/g, '\n') // Normalize line endings

const contentHash = hashContent(normalized)
```

---

## See Also

- [guides/adding-a-tool.md](../guides/adding-a-tool.md) - Integrating parsers into ingestion pipeline
- [reference/ingestion-pipeline.md](ingestion-pipeline.md) - Phase 3: Parse step details
- [guides/testing.md](../guides/testing.md) - Testing parsers

---

**Questions?** Open an issue on GitHub or consult the [documentation index](../README.md).
