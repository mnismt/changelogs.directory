# OG Image Generation System

This document details the automatic Open Graph (OG) image generation system for changelogs.directory.

## 🚨 Quick Reference - Critical Rules

**Before you start coding OG images, remember these NON-NEGOTIABLE rules:**

1. **✅ ALWAYS use `display: 'flex'`** on EVERY `<div>` element
2. **❌ NEVER use `display: 'block'`** - Satori doesn't support it
3. **❌ NEVER use `display: 'grid'`** - Satori doesn't support it
4. **✅ ONLY these display values work:** `flex`, `contents`, `none`
5. **✅ Test locally:** `curl -I http://localhost:5173/og/tools/claude-code` should return `image/png`

**Common error you'll see if you break these rules:**
```
Error: Expected <div> to have explicit "display: flex", "display: contents", or "display: none" if it has more than one child node.
```

**Quick fix:**
```bash
# Replace all display: block with display: flex
find src/routes/og src/components/og -name "*.tsx" -exec sed -i '' "s/display: 'block'/display: 'flex'/g" {} \;
```

## Overview

The application generates dynamic OG images at runtime for all pages (except homepage) using **@vercel/og**. Each image features a terminal-themed design that perfectly matches our monochrome dev-vibe aesthetic.

## Technology Stack

### @vercel/og (Satori-based)

**Selected because:**
- React JSX syntax matching our codebase
- Zero browser overhead (pure SVG→PNG conversion)
- Edge-compatible with TanStack Start
- Easy custom font loading (Fira Code, Inter)
- Fast generation (~100-300ms per image)
- Industry-proven (used by Vercel, Next.js ecosystem)

**Installation:**
```bash
pnpm add @vercel/og
```

### Critical Rules & Limitations

#### 1. **Display Property Requirements** ⚠️ CRITICAL

Satori **ONLY** supports these display values:
- `display: 'flex'` (default and most common)
- `display: 'contents'`
- `display: 'none'`

**DO NOT USE:**
- ❌ `display: 'block'` - Will cause: `Error: Expected <div> to have explicit "display: flex", "display: contents", or "display: none"`
- ❌ `display: 'inline'`
- ❌ `display: 'grid'`
- ❌ Any other CSS display values

**Rule:** ALL `<div>` elements MUST have an explicit display property. Even divs with single text children need `display: 'flex'`.

**Examples:**
```typescript
// ✅ CORRECT - Text-only div
<div style={{ display: 'flex', fontSize: '64px', color: '#FFF' }}>
  {tool.name}
</div>

// ✅ CORRECT - Multiple children
<div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
  <span>Item 1</span>
  <span>Item 2</span>
</div>

// ✅ CORRECT - Self-closing div
<div
  style={{
    display: 'flex',
    position: 'absolute',
    inset: 0,
  }}
/>

// ❌ WRONG - Missing display
<div style={{ fontSize: '64px' }}>
  {tool.name}
</div>

// ❌ WRONG - Using block
<div style={{ display: 'block', fontSize: '64px' }}>
  {tool.name}
</div>
```

#### 2. **Glassmorphism Limitation**

Satori doesn't support `backdrop-filter: blur()`.

**Solution:** Simulate with layered semi-transparent gradients:
```typescript
background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)'
border: '1px solid rgba(255,255,255,0.1)'
```

#### 3. **Flexbox is Default Layout**

Satori uses flexbox as the default layout engine (same as React Native). All containers default to `display: flex`, so you must:
- Use flex properties for alignment (`justifyContent`, `alignItems`, `gap`)
- Avoid trying to use block-level layout patterns
- Think in terms of flex containers and flex items

## Architecture

### Route Structure

Three dynamic OG image endpoints in `/src/routes/og/`:

```
/src/routes/og/
├── tools.tsx                          # GET /og/tools → Tools directory page
├── $slug.tsx                          # GET /og/{slug} → Tool detail page
└── $slug.releases.$version.tsx        # GET /og/{slug}/releases/{version} → Release version page
```

**Homepage exception:** The homepage (`/`) keeps its static `/og-image.png` file.

### URL Examples

After implementation, these URLs will return PNG images:

- `https://changelogs.directory/og/tools`
- `https://changelogs.directory/og/claude-code`
- `https://changelogs.directory/og/codex`
- `https://changelogs.directory/og/claude-code/releases/2.0.55`

### Caching Strategy

**Aggressive HTTP caching** to minimize runtime generation overhead:

```typescript
headers: {
  'Content-Type': 'image/png',
  'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=31536000'
}
```

**Cache durations:**
- **Browser cache:** 1 hour (3600s)
- **CDN cache:** 24 hours (86400s)
- **Stale-while-revalidate:** 1 year (31536000s) - releases are immutable

**Performance targets:**
- First generation: ~100-300ms
- Cached requests: <10ms (served from CDN)
- Image size: <200KB PNG

## Visual Design System

### Dimensions

All OG images are **1200×630 pixels** (standard OG image size).

### Design Philosophy

Based on `FeedReleaseCard` component (`src/components/home/feed-release-card.tsx:71-96`), our OG images feature:

#### Terminal Chrome
- **macOS traffic lights:** Red `#ff5f56`, Yellow `#ffbd2e`, Green `#27c93f`
- **Title bar:** Fira Code font, muted gray `#888888`
- **Path display:** Shows file-like paths (e.g., `~/tools/claude-code`)

#### Typography
- **Technical data:** Fira Code (monospace) for versions, stats, tool names
- **UI text:** Inter for descriptions and call-to-actions
- **Color hierarchy:** White `#FFFFFF` for primary, grays for secondary

#### Visual Elements
- **Background:** Deep black `#0A0A0A` with subtle texture
- **Glassmorphism:** Semi-transparent overlays with `rgba(255,255,255,0.05)` gradients
- **Borders:** Thin `rgba(255,255,255,0.1)` for structure
- **Tool logos:** Actual SVG components from `src/components/logo/`, rendered as grayscale

### Design Alignment

Follows all design rules from `docs/DESIGN_RULES.md`:

✅ **Monochrome Palette:** Deep black backgrounds, white/gray text
✅ **Typography:** Fira Code for all technical data
✅ **Terminal Metaphor:** macOS traffic lights, path-style titles
✅ **Glassmorphism:** Simulated with semi-transparent gradients
✅ **Structure over Flash:** Dense, organized layouts
✅ **System Status:** Stats displayed like terminal output

## Visual Templates

### Template A: Tools Directory (`/og/tools`)

**Purpose:** OG image for `/tools` page

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ ● ● ●  ~/tools                                          │ ← Terminal chrome
├─────────────────────────────────────────────────────────┤
│                                                          │
│         changelogs.directory                             │ ← Fira Code 64px white
│         ~/tools                                          │ ← Fira Code 32px gray-500
│                                                          │
│         TOTAL_TOOLS: 3    TOTAL_RELEASES: 571           │ ← Fira Code 18px
│                                                          │
│    ┌────────┐  ┌────────┐  ┌────────┐                  │
│    │ Claude │  │ Codex  │  │ Cursor │                  │ ← Tool logos 80px
│    │  Code  │  │        │  │        │                  │   grayscale
│    └────────┘  └────────┘  └────────┘                  │
│                                                          │
│         Tracking CLI developer tools,                    │ ← Inter 20px
│         one changelog at a time.                         │   gray-400
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Key Elements:**
- Main heading uses Fira Code (terminal feel)
- Stats use monospace numbers with uppercase labels
- Tool logos rendered from actual SVG components with grayscale filter
- Subtle grid pattern in background

**Data Source:** `getAllTools()` from `src/server/tools.ts`

### Template B: Tool Detail (`/og/{slug}`)

**Purpose:** OG image for individual tool pages (e.g., `/tools/claude-code`)

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ ● ● ●  ~/tools/claude-code                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│                                                          │
│    ┌──────────┐                                         │
│    │          │     Claude Code                          │ ← Fira Code 48px
│    │  [LOGO]  │     by Anthropic                         │ ← Inter 20px gray
│    │  120px   │                                          │
│    └──────────┘                                         │
│                                                          │
│                    v2.0.55                               │ ← Fira Code 56px
│                    2 hours ago                           │   with glow effect
│                                                          │ ← Fira Code 18px
│                    159 releases tracked                  │ ← Fira Code 20px
│                                                          │
│    ────────────────────────────────────────             │ ← Decorative line
│                                                          │
│             View complete changelog →                   │ ← Inter 18px
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Key Elements:**
- Large tool logo (120×120px) as visual anchor
- Tool name and vendor in separate hierarchy
- Version number extra large with white glow effect:
  ```typescript
  textShadow: '0 0 20px rgba(255,255,255,0.3)'
  ```
- Glassmorphism panel behind main content
- Decorative separator line
- Call-to-action footer

**Data Source:** `getToolMetadata({ data: { slug } })` from `src/server/tools.ts`

### Template C: Release Version (`/og/{slug}/releases/{version}`)

**Purpose:** OG image for individual release pages

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ ● ● ●  ~/tools/claude-code/releases/v2.0.55             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│    Claude Code v2.0.55                                   │ ← Fira Code 44px
│    Released 2 hours ago                                  │ ← Fira Code 18px gray
│                                                          │
│    "Fixes proxy DNS resolution default                   │ ← Headline
│     and keyboard navigation"                             │   Inter italic 24px
│                                                          │
│    ┌─────────────┐  ┌─────────────┐                    │
│    │ ⚠️ BREAKING │  │ 🔒 SECURITY │                    │ ← Severity badges
│    └─────────────┘  └─────────────┘                    │
│                                                          │
│    ────────────────────────────────────────             │
│                                                          │
│    4 total changes                                       │ ← Fira Code 20px
│                                                          │
│    2 Bugfix     2 Improvements                           │ ← Change type grid
│                                                          │   2-column layout
└─────────────────────────────────────────────────────────┘
```

**Key Elements:**
- Tool name + version as hero text
- Release headline in italic Inter (git commit message aesthetic)
- Severity badges for Breaking/Security/Deprecation:
  - Red background (`#DC2626`)
  - White text, uppercase
  - Emoji indicators (⚠️, 🔒, 📛)
- Change type breakdown in 2-column grid layout
- All numbers in Fira Code monospace

**Data Source:** `getReleaseWithChanges({ data: { toolSlug, version } })` from `src/server/tools.ts`

## Implementation Details

### File Structure

#### New Files to Create

**1. OG Route Handlers (3 files)**

- `/src/routes/og/tools.tsx`
  - Generates Tools directory OG image
  - Fetches all tools data
  - Displays aggregate stats

- `/src/routes/og/$slug.tsx`
  - Generates Tool detail OG image
  - Fetches tool metadata
  - Shows latest version and release count

- `/src/routes/og/$slug.releases.$version.tsx`
  - Generates Release version OG image
  - Fetches release with changes
  - Shows headline and change breakdown

**2. Shared Components (2 files)**

- `/src/components/og/terminal-chrome.tsx`
  - Reusable terminal title bar
  - macOS traffic lights
  - Path display

- `/src/components/og/og-background.tsx`
  - Background texture/grid component
  - Subtle visual depth

**3. Utilities (2 files)**

- `/src/lib/og-fonts.ts`
  - Font loading from `/public/fonts/`
  - Returns font data for Satori

- `/src/lib/og-utils.ts`
  - SVG logo to base64 conversion
  - Helper functions for OG generation

**4. Font Files (download to `/public/fonts/`)**

Download from [Google Fonts](https://fonts.google.com):

- `FiraCode-Regular.ttf` - For all technical/monospace text
- `Inter-SemiBold.ttf` - For bold UI text
- `Inter-Regular.ttf` - For regular UI text

#### Files to Modify

**5. Route Metadata Updates (3 files)**

- `/src/routes/tools/index.tsx`
  - Update `head()` function
  - Add `og:image` and `twitter:image` meta tags

- `/src/routes/tools/$slug/index.tsx`
  - Update `head()` function
  - Add dynamic OG image URL

- `/src/routes/tools/$slug/releases/$version.tsx`
  - Update `head()` function
  - Add dynamic OG image URL with version

### Code Patterns

#### Font Loading Pattern

```typescript
// /src/lib/og-fonts.ts
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function loadOGFonts() {
  const [firaCode, interBold, inter] = await Promise.all([
    readFile(join(process.cwd(), 'public/fonts/FiraCode-Regular.ttf')),
    readFile(join(process.cwd(), 'public/fonts/Inter-SemiBold.ttf')),
    readFile(join(process.cwd(), 'public/fonts/Inter-Regular.ttf')),
  ])

  return [
    {
      name: 'Fira Code',
      data: firaCode,
      weight: 400 as const,
      style: 'normal' as const
    },
    {
      name: 'Inter',
      data: interBold,
      weight: 600 as const,
      style: 'normal' as const
    },
    {
      name: 'Inter',
      data: inter,
      weight: 400 as const,
      style: 'normal' as const
    },
  ]
}
```

#### SVG Logo Handling

**Challenge:** `@vercel/og` uses Satori which only supports `<img>` with base64 data URIs, not React components.

**Solution:** Convert SVG React components to base64 data URIs:

```typescript
// /src/lib/og-utils.ts
import { renderToStaticMarkup } from 'react-dom/server'

export function svgToBase64DataUri(svgComponent: React.ReactElement): string {
  const svgString = renderToStaticMarkup(svgComponent)
  const base64 = Buffer.from(svgString).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}
```

**Usage in OG route:**
```typescript
import { ClaudeAI } from '@/components/logo/claude'
import { svgToBase64DataUri } from '@/lib/og-utils'

// Convert logo to base64
const logoDataUri = svgToBase64DataUri(<ClaudeAI />)

// Use in ImageResponse JSX
<img
  src={logoDataUri}
  width="120"
  height="120"
  style={{ filter: 'grayscale(100%)' }}
/>
```

#### Route Handler Pattern

**Example:** Tool Detail OG (`/src/routes/og/$slug.tsx`)

```typescript
import { ImageResponse } from '@vercel/og'
import { createAPIFileRoute } from '@tanstack/react-start/api'
import { getToolMetadata } from '@/server/tools'
import { loadOGFonts } from '@/lib/og-fonts'
import { TerminalChrome } from '@/components/og/terminal-chrome'
import { OGBackground } from '@/components/og/og-background'

export const Route = createAPIFileRoute('/og/$slug')({
  GET: async ({ request, params }) => {
    // 1. Fetch tool data
    const tool = await getToolMetadata({ data: { slug: params.slug } })

    // 2. Load fonts
    const fonts = await loadOGFonts()

    // 3. Get logo as base64
    const logoDataUri = getToolLogoDataUri(params.slug)

    // 4. Generate image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0A0A0A',
            position: 'relative',
          }}
        >
          {/* Background texture */}
          <OGBackground />

          {/* Terminal chrome */}
          <TerminalChrome title={`~/tools/${params.slug}`} />

          {/* Main content */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px',
            }}
          >
            {/* Tool logo */}
            <img
              src={logoDataUri}
              width="120"
              height="120"
              style={{ filter: 'grayscale(100%)', marginBottom: '32px' }}
            />

            {/* Tool name */}
            <div
              style={{
                fontFamily: 'Fira Code',
                fontSize: '48px',
                color: '#FFFFFF',
                marginBottom: '12px',
              }}
            >
              {tool.name}
            </div>

            {/* Vendor */}
            {tool.vendor && (
              <div
                style={{
                  fontFamily: 'Inter',
                  fontSize: '20px',
                  color: '#888888',
                  marginBottom: '40px',
                }}
              >
                by {tool.vendor}
              </div>
            )}

            {/* Version with glow */}
            <div
              style={{
                fontFamily: 'Fira Code',
                fontSize: '56px',
                color: '#FFFFFF',
                textShadow: '0 0 20px rgba(255,255,255,0.3)',
                marginBottom: '16px',
              }}
            >
              v{tool.latestVersion}
            </div>

            {/* Release count */}
            <div
              style={{
                fontFamily: 'Fira Code',
                fontSize: '20px',
                color: '#AAAAAA',
              }}
            >
              {tool.releaseCount} releases tracked
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts,
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=31536000',
        },
      }
    )
  },
})
```

#### Terminal Chrome Component

```typescript
// /src/components/og/terminal-chrome.tsx

export function TerminalChrome({ title }: { title: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '44px',
        backgroundColor: '#1A1A1A',
        borderBottom: '1px solid #2A2A2A',
        paddingLeft: '16px',
        paddingRight: '16px',
      }}
    >
      {/* Traffic lights */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#ff5f56',
          }}
        />
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#ffbd2e',
          }}
        />
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#27c93f',
          }}
        />
      </div>

      {/* Title - centered */}
      <div
        style={{
          flex: 1,
          textAlign: 'center',
          fontFamily: 'Fira Code',
          fontSize: '14px',
          color: '#888888',
        }}
      >
        {title}
      </div>
    </div>
  )
}
```

#### Glassmorphism Simulation

Since `backdrop-filter` isn't supported, simulate with gradients and borders:

```typescript
// Glassmorphism panel
<div
  style={{
    background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '40px',
  }}
>
  {/* Content */}
</div>
```

#### Integrating with Route Metadata

Update route `head()` functions to reference OG image endpoints:

```typescript
// /src/routes/tools/$slug/index.tsx

export const Route = createFileRoute('/tools/$slug/')({
  // ... existing loader, component, etc.

  head: ({ params, loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.tool?.name ?? 'Tool'} Changelog - changelogs.directory`
      },
      {
        name: 'description',
        content: `Track all releases and changes for ${loaderData?.tool?.name ?? 'this tool'}.`
      },
      // OG tags
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: `${loaderData?.tool?.name ?? 'Tool'} Changelog` },
      { property: 'og:image', content: `https://changelogs.directory/og/${params.slug}` },
      { property: 'og:url', content: `https://changelogs.directory/tools/${params.slug}` },
      // Twitter tags
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:image', content: `https://changelogs.directory/og/${params.slug}` },
    ],
  }),
})
```

**For release pages:**
```typescript
{ property: 'og:image', content: `https://changelogs.directory/og/${params.slug}/releases/${params.version}` }
```

## Implementation Checklist

### Phase 1: Infrastructure Setup

- [ ] Install `@vercel/og`: `pnpm add @vercel/og`
- [ ] Download fonts to `/public/fonts/`:
  - [ ] `FiraCode-Regular.ttf` from [Google Fonts](https://fonts.google.com/specimen/Fira+Code)
  - [ ] `Inter-SemiBold.ttf` from [Google Fonts](https://fonts.google.com/specimen/Inter)
  - [ ] `Inter-Regular.ttf` from [Google Fonts](https://fonts.google.com/specimen/Inter)
- [ ] Create `/src/lib/og-fonts.ts` (font loader utility)
- [ ] Create `/src/lib/og-utils.ts` (SVG to base64 converter)

### Phase 2: Shared Components

- [ ] Create `/src/components/og/terminal-chrome.tsx` (title bar with traffic lights)
- [ ] Create `/src/components/og/og-background.tsx` (background texture/grid)

### Phase 3: OG Route Handlers

- [ ] Create `/src/routes/og/tools.tsx` (tools directory OG endpoint)
- [ ] Create `/src/routes/og/$slug.tsx` (tool detail OG endpoint)
- [ ] Create `/src/routes/og/$slug.releases.$version.tsx` (release version OG endpoint)

### Phase 4: Route Integration

- [ ] Update `/src/routes/tools/index.tsx` - Add `og:image` meta tag to `head()`
- [ ] Update `/src/routes/tools/$slug/index.tsx` - Add `og:image` meta tag to `head()`
- [ ] Update `/src/routes/tools/$slug/releases/$version.tsx` - Add `og:image` meta tag to `head()`

### Phase 5: Testing & Validation

- [ ] Test OG endpoints locally (visit `/og/tools`, `/og/claude-code`, etc.)
- [ ] Verify images are 1200×630px
- [ ] Check file sizes (<300KB for fast loading)
- [ ] Validate with [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [ ] Validate with [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [ ] Test different tools (claude-code, codex, cursor)
- [ ] Test different versions
- [ ] Verify caching headers in Network tab
- [ ] Check that fonts render correctly
- [ ] Verify tool logos appear as grayscale

## Testing

### Local Testing

Visit OG endpoints directly in browser:
```
http://localhost:3000/og/tools
http://localhost:3000/og/claude-code
http://localhost:3000/og/codex
http://localhost:3000/og/claude-code/releases/2.0.55
```

These should return PNG images, not HTML.

### Validation Tools

**Twitter Card Validator:**
- URL: https://cards-dev.twitter.com/validator
- Enter your page URL (not the OG image URL)
- Check that card renders correctly

**Facebook Sharing Debugger:**
- URL: https://developers.facebook.com/tools/debug/
- Enter your page URL
- Click "Scrape Again" to refresh cache
- Verify image appears in preview

### Debugging Checklist

If OG images don't appear:

1. **Check route handler:** Visit `/og/{slug}` directly - should return PNG
2. **Check meta tags:** View page source - `og:image` should point to `/og/{slug}`
3. **Check fonts:** Ensure TTF files exist in `/public/fonts/`
4. **Check logo conversion:** Verify `svgToBase64DataUri()` returns valid data URI
5. **Check caching:** Clear browser cache and social platform cache
6. **Check dimensions:** Image should be exactly 1200×630px

### Common Errors & Solutions

#### Error: "Expected <div> to have explicit display: flex, display: contents, or display: none"

**Cause:** A `<div>` element is missing the `display` property or using an unsupported value like `display: 'block'`.

**Solution:**
1. **Find the problematic div:** The error doesn't tell you which div is the issue. Check all divs systematically.
2. **Add explicit display:** Ensure EVERY `<div>` has `display: 'flex'` (or `contents`/`none`)
3. **Replace `display: 'block'`:** If you used `display: 'block'`, change to `display: 'flex'`

**Quick fix command:**
```bash
# Find all divs without display property in OG files
grep -n "style={{" src/routes/og/*.tsx src/components/og/*.tsx

# Replace all display: block with display: flex
find src/routes/og src/components/og -name "*.tsx" -exec sed -i '' "s/display: 'block'/display: 'flex'/g" {} \;
```

**Checklist of divs to verify:**
- [ ] All container divs with multiple children
- [ ] Text-only divs (even single text nodes need `display: 'flex'`)
- [ ] Self-closing divs (decorative elements, separators)
- [ ] Absolutely positioned divs (backgrounds, overlays)

#### Error: Server crashes with no specific message

**Cause:** Usually a missing display property that Satori can't handle.

**Solution:**
1. Check server logs for stack trace pointing to specific file/line
2. Verify all `<div>` elements have `display: 'flex'`
3. Test the route directly: `curl http://localhost:5173/og/tools/claude-code`

#### Error: Image returns HTML instead of PNG

**Cause:** Route handler isn't being invoked (TanStack Router issue) or component is defined instead of server handler.

**Solution:**
1. Verify route uses `server.handlers.GET` structure
2. Ensure no `component` function is exported
3. Check route path matches file structure
4. Restart dev server

## Error Handling

### Fallback Strategy

If tool/release not found or data fetch fails:

```typescript
// In route handler
try {
  const tool = await getToolMetadata({ data: { slug: params.slug } })
  // ... generate image
} catch (error) {
  // Return default/error OG image
  return new Response(
    await readFile(join(process.cwd(), 'public/og-image.png')),
    {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=60', // Short cache for errors
      },
    }
  )
}
```

### Font Loading Failures

If fonts fail to load, Satori will gracefully fall back to system fonts. Images will still generate but may not match design exactly.

## Performance Considerations

### Generation Time
- **First request:** ~100-300ms (acceptable for runtime)
- **Cached requests:** <10ms (served from CDN)
- **Image size target:** <200KB PNG

### Optimization Tips
- Use aggressive caching headers (already configured)
- Consider pre-generating images for top tools at build time
- Monitor image file sizes - compress if >300KB

## Deployment

### Compatibility
- **Cloudflare Workers:** ✅ Satori is edge-compatible
- **Vercel Edge:** ✅ Works out of the box
- **Node.js serverless:** ✅ Compatible

### No Timeout Concerns
Image generation is fast (~100-300ms), well within serverless function timeout limits.

## SEO & Accessibility

### OG Images Purpose
OG images are for **social sharing only**:
- Not exposed to screen readers
- Not part of page content
- Used by social platforms (Twitter, Facebook, LinkedIn, Discord, Slack)

### Meta Descriptions
Ensure pages still have descriptive `description` meta tags for SEO:

```typescript
{ name: 'description', content: 'Detailed description for SEO...' }
```

OG images enhance social sharing but don't replace good SEO practices.

## Best Practices

### 1. Always Use Explicit Display Properties

Every `<div>` must have `display: 'flex'` (or `contents`/`none`):

```typescript
// ✅ DO THIS
<div style={{ display: 'flex', fontSize: '24px' }}>
  Hello World
</div>

// ❌ DON'T DO THIS
<div style={{ fontSize: '24px' }}>
  Hello World
</div>
```

### 2. Use Flexbox Layout Patterns

Since Satori only supports flexbox, embrace flex properties:

```typescript
// ✅ Center content
<div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
}}>
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// ✅ Horizontal layout with spacing
<div style={{
  display: 'flex',
  gap: '16px',
  alignItems: 'center',
}}>
  <span>Left</span>
  <span>Right</span>
</div>
```

### 3. Test Locally Before Deploying

Always test OG endpoints directly:

```bash
# Should return PNG image data
curl -I http://localhost:5173/og/tools/claude-code

# Should show: content-type: image/png
# Should NOT show: content-type: text/html
```

### 4. Monochrome Color Palette

Keep the dev-vibe aesthetic with subtle grays:

```typescript
// Use subtle gray tones instead of bright colors
color: '#888888'  // Mid gray for secondary text
color: '#CCCCCC'  // Light gray for primary text
color: '#444444'  // Dark gray for labels
color: '#FFFFFF'  // White for headings

// Avoid bright accent colors in favor of white/gray
background: 'rgba(255, 255, 255, 0.08)'  // Subtle white overlay
border: '1px solid rgba(255, 255, 255, 0.15)'  // Subtle border
```

### 5. Add Subtle Branding

Include changelogs.directory branding without being intrusive:

```typescript
// Bottom status bar example
<div style={{
  display: 'flex',
  justifyContent: 'space-between',
  padding: '0 16px',
  fontSize: '13px',
  color: '#666666',
}}>
  <span>changelogs.directory / v{version}</span>
  <span>● Live Release Feed</span>
</div>
```

## Critical Files Reference

**Files to read before implementation:**
- `src/components/home/feed-release-card.tsx` - Terminal chrome design pattern (lines 71-96)
- `src/lib/tool-logos.tsx` - Logo component access
- `src/components/logo/claude.tsx`, `cursor.tsx`, `openai.tsx` - SVG logo sources
- `docs/DESIGN_RULES.md` - Design system constraints

**Server functions to leverage:**
- `getToolMetadata()` from `src/server/tools.ts`
- `getReleaseWithChanges()` from `src/server/tools.ts`
- `getAllTools()` from `src/server/tools.ts`

## Maintenance

### Adding New Tools

When adding new tools:

1. Add logo component to `/src/components/logo/{tool}.tsx`
2. Register in `/src/lib/tool-logos.tsx`
3. OG images will automatically work for new tools

### Updating Design

To update OG image designs:

1. Modify templates in `/src/routes/og/*.tsx`
2. Test locally by visiting `/og/{slug}`
3. Clear CDN cache after deployment (if needed)

### Font Updates

To update fonts:

1. Replace TTF files in `/public/fonts/`
2. Update `/src/lib/og-fonts.ts` if font names change
3. Redeploy

## Future Enhancements

Potential improvements for v2:

- [ ] Add subtle animated gradients (if Satori adds animation support)
- [ ] Pre-generate images at build time for popular tools
- [ ] A/B test different layouts for engagement
- [ ] Add custom OG images for special events/announcements
- [ ] Support dark/light mode variants (if needed)

---

**Last Updated:** 2025-01-29
**Status:** Implementation pending
**Owner:** Development team
