# Tool Registry Reference

> **Location**: `src/lib/tool-registry.tsx`

The tool registry is the **single source of truth** for frontend tool configuration. It eliminates scattered hardcoded tool lists and ensures all UI components stay synchronized.

## When to Update

Update the registry when:
- Adding a new tool to the platform
- Changing a tool's display name or vendor
- Toggling visibility in feed filters or showcase
- Changing a logo's monochrome status

## ToolConfig Interface

```typescript
interface ToolConfig {
  slug: string          // URL-friendly identifier (must match database)
  name: string          // Display name
  vendor: string        // Company name
  url: string           // Official website URL
  Logo: ComponentType   // React logo component
  isMonochrome: boolean // Uses currentColor? (affects hover styling)
  showInFeedFilter: boolean  // Show in homepage filter buttons
  showInShowcase: boolean    // Show in hero logo carousel
}
```

## Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | `string` | ✅ | URL-friendly ID. Must match the `slug` in `prisma/seed.ts` |
| `name` | `string` | ✅ | Display name shown in UI (e.g., "Claude Code") |
| `vendor` | `string` | ✅ | Company name, displayed as "by {vendor}" in carousel |
| `url` | `string` | ✅ | Official website URL for external links |
| `Logo` | `ComponentType` | ✅ | React component from `src/components/logo/` |
| `isMonochrome` | `boolean` | ✅ | `true` if logo uses `currentColor` (stroke-based) |
| `showInFeedFilter` | `boolean` | ✅ | `true` to show in homepage feed filter buttons |
| `showInShowcase` | `boolean` | ✅ | `true` to show in hero logo carousel |

## Exports

### Constants

| Export | Type | Description |
|--------|------|-------------|
| `TOOL_REGISTRY` | `ToolConfig[]` | Full array of all registered tools |
| `TOOL_SLUGS` | `string[]` | Array of all tool slugs |
| `FEED_FILTER_TOOLS` | `ToolConfig[]` | Tools with `showInFeedFilter: true` |
| `SHOWCASE_TOOLS` | `ToolConfig[]` | Tools with `showInShowcase: true` |
| `MONOCHROME_SLUGS` | `Set<string>` | Slugs of monochrome logos |

### Functions

| Export | Signature | Description |
|--------|-----------|-------------|
| `getToolConfig` | `(slug: string) => ToolConfig \| undefined` | Get config by slug |
| `getToolLogo` | `(slug: string) => ReactNode \| null` | Get logo as ReactNode |
| `isMonochromeLogo` | `(slug: string) => boolean` | Check if logo is monochrome |
| `getLogoHoverClasses` | `(slug: string) => string` | Get Tailwind hover classes |

## Adding a New Tool

1. Create logo component in `src/components/logo/<tool>.tsx`
2. Add entry to `TOOL_REGISTRY` array:

```typescript
import { YourToolLogo } from '@/components/logo/your-tool'

// Add to TOOL_REGISTRY array
{
  slug: 'your-tool',
  name: 'Your Tool',
  vendor: 'Company Name',
  url: 'https://your-tool.com',
  Logo: YourToolLogo,
  isMonochrome: false,
  showInFeedFilter: true,
  showInShowcase: true,
},
```

3. Add OG image SVG in `src/lib/og-utils.tsx` (for social sharing)
4. Add database seed in `prisma/seed.ts`

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/tool-logos.tsx` | Re-exports from registry (backward compatibility) |
| `src/lib/og-utils.tsx` | OG image SVGs (must be updated separately) |
| `src/lib/version-formatter.ts` | Version display formatting (if custom format needed) |
| `prisma/seed.ts` | Database seed (must be updated separately) |

## Consumer Components

These components consume from the registry:

| Component | Uses |
|-----------|------|
| `src/routes/index.tsx` | `FEED_FILTER_TOOLS` for homepage filter buttons |
| `src/components/shared/logo-showcase.tsx` | `SHOWCASE_TOOLS` for hero carousel |
| Tool pages | `getToolLogo()` for tool headers |

## Backward Compatibility

The `src/lib/tool-logos.tsx` file re-exports functions from the registry for backward compatibility:

```typescript
export { getToolLogo, isMonochromeLogo, getLogoHoverClasses } from './tool-registry'
```

Existing imports from `@/lib/tool-logos` continue to work. New code should import directly from `@/lib/tool-registry`.

---

**See also**: [guides/adding-a-tool.md](../guides/adding-a-tool.md) for step-by-step tool addition instructions.
