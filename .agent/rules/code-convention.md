---
trigger: always_on
---

## Code Style & Conventions

### Formatting
- **Indentation**: Tabs (configured in Biome)
- **Quotes**: Double quotes for JavaScript/TypeScript
- **Import Organization**: Auto-organized imports enabled (Biome)

### TypeScript
- **Strict mode enabled**
- `noUnusedLocals`: true
- `noUnusedParameters`: true
- `noFallthroughCasesInSwitch`: true
- `noUncheckedSideEffectImports`: true
- Module resolution: "bundler"
- Target: ES2022

### Path Aliases
- Use `@/*` to reference `./src/*`
- Example: `import { cn } from '@/lib/utils'`
- Configured via `tsconfig.json` and `vite-tsconfig-paths` plugin

### Imports
- Import from `@tanstack/react-router` for routing components (Link, Outlet, etc.)
- Import from `@tanstack/react-query` only for mutations/subscriptions (not initial page data)
- Use path aliases (`@/`) for local imports

### React Components
- Use functional components with TypeScript
- Export component as default when it's the primary export
- Use named exports for utilities/helpers
- Prefer `interface` for type definitions (see `MyRouterContext` in `__root.tsx`)

### File Naming
- Routes: lowercase with hyphens or dots (e.g., `index.tsx`, `server-funcs.tsx`)
- Components: kebab-case (e.g., `header.tsx`, `logo-showcase.tsx`)
- Utilities: kebab-case (e.g., `utils.ts`)

### TanStack Router Patterns
- Create routes with `createFileRoute()` for file-based routes
- Create root route with `createRootRouteWithContext<YourContext>()`
- Use `Route` as the export name for file-based routes
- Use `shellComponent` in root route to define HTML document structure
- Use `head` property for meta tags and links

### Data Fetching with SSR
**CRITICAL**: Always use SSR loaders for initial page data. Never use client-side `useQuery` for initial data fetching.

#### Pattern: Use `loader` + `Route.useLoaderData()`
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { getToolWithReleases } from '@/server/tools'

export const Route = createFileRoute('/tools/claude-code/')({
	loader: async () => {
		return await getToolWithReleases({ data: { slug: 'claude-code' } })
	},
	component: ClaudeCodePage,
})

function ClaudeCodePage() {
	const tool = Route.useLoaderData()
	// Use tool data directly - no loading states needed for SSR
}
```

#### For Multiple Data Sources
```tsx
export const Route = createFileRoute('/tools/claude-code/releases/$version')({
	loader: async ({ params }) => {
		const [release, adjacentVersions, allVersions] = await Promise.all([
			getReleaseWithChanges({
				data: { toolSlug: 'claude-code', version: params.version },
			}),
			getAdjacentVersions({
				data: { toolSlug: 'claude-code', version: params.version },
			}),
			getAllVersions({
				data: { slug: 'claude-code' },
			}),
		])

		return {
			release,
			adjacentVersions,
			allVersions,
		}
	},
	component: ReleaseDetailPage,
})

function ReleaseDetailPage() {
	const { release, adjacentVersions, allVersions } = Route.useLoaderData()
	// All data is available immediately via SSR
}
```

#### Rules
- ✅ **ALWAYS** use `loader` function in route definition for page data
- ✅ **ALWAYS** use `Route.useLoaderData()` to access data in components
- ✅ **ALWAYS** use `Promise.all()` for parallel data fetching in loaders
- ❌ **NEVER** use `useQuery` from `@tanstack/react-query` for initial page data
- ❌ **NEVER** add loading states (`isPending`) for SSR-loaded data
- ❌ **NEVER** add error states (`error`) from React Query for SSR data

#### Benefits
- Data loads on the server, improving initial page load
- Better SEO - content is available in initial HTML
- No loading spinners on first render
- Type-safe data access via `Route.useLoaderData()`

### Database Access Patterns
**CRITICAL**: Never import `getPrisma()` or any database code directly in route files. This causes client-side bundling issues.

#### ❌ WRONG: Direct Database Import in Routes
```tsx
// BAD - Causes "DATABASE_URL environment variable is not set" on client navigation
import { getPrisma } from '@/server/db'

export const Route = createFileRoute('/admin/')({
  loader: async () => {
    const prisma = getPrisma() // ⚠️ Gets bundled into client code
    return await prisma.user.count()
  }
})
```

**Problem**: On client-side navigation, the loader code is bundled into the client JavaScript. When it tries to execute `getPrisma()`, `process.env.DATABASE_URL` doesn't exist in the browser.

#### ✅ CORRECT: Server Functions for Database Access
```tsx
// GOOD - Database code stays on server
import { getAdminDashboardStats } from '@/server/admin'

export const Route = createFileRoute('/admin/')({
  loader: async () => {
    return await getAdminDashboardStats() // Server function always runs server-side
  }
})
```

**In `src/server/admin.ts`:**
```tsx
import { createServerFn } from '@tanstack/react-start'
import { getPrisma } from './db'

export const getAdminDashboardStats = createServerFn({ method: 'GET' }).handler(
  async () => {
    const prisma = getPrisma() // Safe - server functions never bundle to client
    const [userCount, toolCount, releaseCount] = await Promise.all([
      prisma.user.count(),
      prisma.tool.count(),
      prisma.release.count(),
    ])
    return { userCount, toolCount, releaseCount }
  }
)
```

#### Rules
- ✅ **ALWAYS** use `createServerFn()` for database queries
- ✅ **ALWAYS** import server functions (not `getPrisma`) in route loaders
- ✅ **ONLY** import `getPrisma` in `src/server/*` or `src/lib/auth/*` files
- ❌ **NEVER** import `getPrisma` directly in route files (`src/routes/*`)
- ❌ **NEVER** import `getPrisma` in component files (`src/components/*`)

#### Why This Matters
- **F5 (full reload)**: Loader runs on server → works ✅
- **Client navigation**: Loader code bundled to client → `process.env` undefined → error ❌
- **Server functions**: TanStack Start ensures they always execute server-side, even during client navigation ✅

### Component Structure Example
```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/path')({ 
  component: ComponentName 
})

function ComponentName() {
  // Component logic
}
```

### Styling
- Tailwind CSS utility classes
- Use `className` with template strings for conditional classes
- shadcn/ui components for UI primitives
- Lucide React for icons
