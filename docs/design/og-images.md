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

The system has been refactored to use a **component-based architecture**, maximizing code reuse and consistency across all image types.

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
├── index.tsx                          # GET /og → Homepage
├── tools.tsx                          # GET /og/tools → Tools directory page
├── tools.$slug.tsx                    # GET /og/tools/{slug} → Tool detail page
└── tools.$slug.releases.$version.tsx  # GET /og/tools/{slug}/releases/{version} → Release version page
```

**Homepage:** The homepage (`/`) uses the dynamic `/og` endpoint.

**Default Fallback:** The `/og` endpoint is also used as the default fallback for any page that doesn't define a specific OG image (configured in `src/routes/__root.tsx`).

### Component Structure

We use a set of shared components to ensure consistency and DRY code:

```
src/components/og/
├── og-layout.tsx       # Main wrapper component (Background + Chrome + Status Bar)
├── og-background.tsx   # Background texture/grid
├── radial-glow.tsx     # Radial gradient glow effect
├── terminal-chrome.tsx # Top bar with traffic lights and title
├── status-bar.tsx      # Bottom bar with breadcrumbs
├── command-prompt.tsx  # Terminal command input simulation
├── cta-button.tsx      # Standard Call-to-Action button
└── logo-box.tsx        # Glassmorphism container for logos
```

### URL Examples

- `https://changelogs.directory/og/tools`
- `https://changelogs.directory/og/tools/claude-code`
- `https://changelogs.directory/og/tools/claude-code/releases/2.0.55`

### Caching Strategy

**Aggressive HTTP caching** to minimize runtime generation overhead. This is handled centrally by `createOGImageResponse`.

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

## Implementation Details

### 1. The `OGLayout` Component

This is the core component that wraps all OG images. It handles the common structure:

```typescript
<OGLayout
  title="~/path/to/resource"
  breadcrumbs={['changelogs.directory', 'section']}
  indicator="Status Text"
>
  {/* Unique content goes here */}
</OGLayout>
```

It automatically includes:
- `OGBackground`
- `RadialGlow`
- `TerminalChrome`
- `StatusBar`
- Flexbox layout structure

### 2. Response Handling

We use utility functions in `src/lib/og-response.ts` to standardize responses:

```typescript
import { createOGImageResponse, createOGErrorResponse } from '@/lib/og-response'

// Success
return createOGImageResponse(image.body)

// Error
return createOGErrorResponse(error, 'context-name')
```

### 3. Font Loading

Fonts are loaded via `src/lib/og-fonts.ts`. We use:
- **Fira Code**: For all technical/monospace text (versions, stats, paths)
- **Inter**: For UI text (descriptions, headlines)

### 4. SVG Logo Handling

**Challenge:** `@vercel/og` uses Satori which only supports `<img>` with base64 data URIs, not React components.

**Solution:** Convert SVG React components to base64 data URIs using `src/lib/og-utils.ts`:

```typescript
import { getToolLogoSVG } from '@/lib/og-utils'

// Get logo as base64 string
const logoSVG = getToolLogoSVG('claude-code')
```

## Visual Templates

### Template A: Tools Directory (`/og/tools`)

**Purpose:** OG image for `/tools` page

**Layout:**
- **Chrome:** `~/tools`
- **Command:** `ls tools/`
- **Content:**
  - Large "changelogs.directory" title
  - Aggregate stats (Total Tools, Total Releases)
  - Grid of top 3 tool logos in glassmorphism boxes
- **Status Bar:** `changelogs.directory / tools` | `Live Release Feed`

### Template B: Tool Detail (`/og/tools/{slug}`)

**Purpose:** OG image for individual tool pages

**Layout:**
- **Chrome:** `~/tools/{slug}`
- **Command:** `info {tool-name}`
- **Content:**
  - Left: Large tool logo in `LogoBox`
  - Right: Tool Name, Version (with glow), Vendor, Release Count
  - `CTAButton`: `$ click --to-read changelog →`
- **Status Bar:** `changelogs.directory / v{version}` | `Live Release Feed`

### Template C: Release Version (`/og/tools/{slug}/releases/{version}`)

**Purpose:** OG image for individual release pages

**Layout:**
- **Chrome:** `~/tools/{slug}/releases/{version}`
- **Command:** `view release --tool {slug} --version {version}`
- **Content:**
  - Left: Tool logo in `LogoBox`
  - Right: Tool Name, Large Version Number, Release Headline (italic)
  - Badges: `⚠️ BREAKING`, `🔒 SECURITY`, `📛 DEPRECATION`
  - Stats: Total changes, breakdown by type (e.g., "2 Bugfixes")
  - CTA: `$ click --to-read changelog →`
- **Status Bar:** `changelogs.directory / {slug} / {version}` | `Release Details`

### Template D: Homepage (`/og`)

**Purpose:** OG image for the homepage

**Layout:**
- **Chrome:** `~`
- **Command:** `changelogs.directory`
- **Content:**
  - Large "changelogs.directory_" title
  - Tagline: "The developer's hub for tracking CLI and editor releases."
  - Stats: Total Tools, Total Releases
  - Grid of top 4 tool logos
- **Status Bar:** `changelogs.directory / home` | `Live Release Feed`

## Development Workflow

### Adding a New OG Image

1.  **Create Route:** Add a new file in `src/routes/og/`.
2.  **Fetch Data:** Use server functions to get necessary data.
3.  **Load Fonts:** `const fonts = await loadOGFonts()`
4.  **Construct Image:**
    ```typescript
    const image = new ImageResponse(
      <OGLayout ...>
        <CommandPrompt ... />
        {/* Your Content */}
      </OGLayout>,
      { width: 1200, height: 630, fonts }
    )
    ```
5.  **Return Response:** `return createOGImageResponse(image.body)`

### Debugging Checklist

If OG images don't appear or look wrong:

1.  **Check route handler:** Visit `/og/tools/claude-code` directly - should return PNG.
2.  **Check meta tags:** View page source - `og:image` should point to the correct URL.
3.  **Check `display: flex`:** Ensure ALL divs have explicit display properties.
4.  **Check fonts:** Ensure TTF files exist in `/public/fonts/`.
5.  **Check caching:** Clear browser cache if seeing old versions.
6.  **Check dimensions:** Image should be exactly 1200×630px.

## Common Errors & Solutions

#### Error: "Expected <div> to have explicit display: flex..."

**Cause:** A `<div>` is missing `display: 'flex'` or using `display: 'block'`.

**Solution:** Find the div and add `style={{ display: 'flex' }}`.

#### Error: Images not loading

**Cause:** Satori only supports `<img>` with base64 data URIs or absolute URLs. Relative paths won't work.

**Solution:** Use `getToolLogoSVG` helper or convert images to base64.

#### Error: Text not appearing

**Cause:** Missing font or color matching background.

**Solution:** Ensure fonts are loaded and passed to `ImageResponse`. Check text color contrast.
