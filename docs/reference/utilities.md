# Utilities Reference

General-purpose utility functions in `src/lib/`.

## parseMarkdownLinks

Parse markdown link syntax `[text](url)` and return React elements. Useful for rendering text that may contain inline links without using a full markdown parser.

**File**: `src/lib/markdown-utils.tsx`

### Signature

```tsx
function parseMarkdownLinks(text: string): ReactNode[]
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `text` | `string` | Input text that may contain markdown links |

### Returns

An array of `ReactNode` elements:
- Plain text segments as strings
- Internal links as TanStack Router `<Link>` components
- External links as `<a>` elements with `target="_blank"`

### Link Handling

| URL Pattern | Result | Example |
|-------------|--------|---------|
| `/path` | `<Link>` (TanStack Router) | `/tools/cursor` |
| `https://...` | `<a target="_blank">` | `https://github.com` |
| `http://...` | `<a target="_blank">` | `http://example.com` |
| `./path` | `<Link>` (normalized) | `./tools/cursor` → `/tools/cursor` |
| `path` | `<Link>` (prefixed) | `tools/cursor` → `/tools/cursor` |

### Usage

```tsx
import { parseMarkdownLinks } from "@/lib/markdown-utils"

function ChangelogEntry({ text }: { text: string }) {
  return <p>{parseMarkdownLinks(text)}</p>
}
```

### Real-World Examples

**Changelog timeline** - Renders tool links in version entries:

```tsx
// src/components/changelog/meta-timeline.tsx
<li key={i} className="text-muted-foreground">
  {parseMarkdownLinks(change)}
</li>
```

**What's New toast** - Renders preview text with clickable links:

```tsx
// src/components/shared/whats-new-toast.tsx
<p className="text-sm text-muted-foreground">
  {parseMarkdownLinks(latestRelease.changes[0])}
</p>
```

### Styling

All generated links include `className="text-primary hover:underline"` for consistent styling with the design system.

### When to Use

- Rendering changelog entries with tool links
- Notification toasts with embedded links
- Any text that may contain markdown-style links
- Dynamic content where links need client-side navigation

### When NOT to Use

- **Full markdown documents** - Use a proper markdown parser (e.g., `remark`)
- **User-generated content** - Security risk; sanitize first or use a safe parser
- **Static content** - Just use `<Link>` directly for better type safety
- **Complex markdown** - Only supports `[text](url)` syntax, not images/headings/etc.

### Security Considerations

This utility does not sanitize URLs. If processing user-generated content:

1. Validate URLs against an allowlist of domains
2. Ensure URLs don't use `javascript:` protocol
3. Consider using a dedicated markdown sanitizer

For internal changelog content (admin-controlled), this is safe to use directly.

---

## Share Utilities

Functions for generating share content and handling clipboard/social sharing.

**File**: `src/lib/share.ts`

### generateShareUrl

Generate the canonical URL for a release.

```tsx
function generateShareUrl(slug: string, version: string): string
```

**Example**: `generateShareUrl('cursor', 'v0.50')` → `https://changelogs.directory/tools/cursor/releases/v0.50`

### generateTerminalTweet

Terminal-style tweet with change type counts (max 4 types shown). Used for X and Bluesky shares.

```tsx
function generateTerminalTweet(
  toolName: string,
  formattedVersion: string,
  changes: Change[],
  url: string
): string
```

**Output**:
```
$ changelog cursor v0.50
> ✨ 3 features
> 🐛 5 bugfixes

full changelogs 👇
https://changelogs.directory/tools/cursor/releases/v0.50
```

### generateRedditTitle / generateHNTitle

Generate titles for Reddit and Hacker News submissions.

```tsx
function generateRedditTitle(toolName: string, formattedVersion: string): string
function generateHNTitle(toolName: string, formattedVersion: string): string
```

**Output**: `Cursor v0.50 Changelog`

### generateMarkdown

Full markdown changelog grouped by change type.

```tsx
function generateMarkdown(
  toolName: string,
  formattedVersion: string,
  changes: Change[],
  url: string
): string
```

### copyToClipboard

Copy text to clipboard with fallback for older browsers.

```tsx
async function copyToClipboard(text: string): Promise<boolean>
```

Uses `navigator.clipboard` when available, falls back to `execCommand('copy')`.

### Social Share Functions

| Function | Platform | Parameters |
|----------|----------|------------|
| `openTwitterShare(text)` | X/Twitter | Full tweet text |
| `openBlueskyShare(text)` | Bluesky | Full post text |
| `openRedditShare(url, title)` | Reddit | URL + title |
| `openHackerNewsShare(url, title)` | Hacker News | URL + title |

**Removed in v0.8.1**: `openFacebookShare`, `openLinkedInShare` (unreliable share dialogs).

---

**Last Updated**: 2026-01-20
