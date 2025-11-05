# AGENTS.md

This file contains important information for AI coding assistants working in this codebase.

## Framework

This project uses **TanStack Start** - a full-stack React framework built on TanStack Router.
- Documentation: https://tanstack.com/start/latest
- TanStack Router Docs: https://tanstack.com/router/latest

## Commands

### Development
```bash
pnpm dev              # Start development server on port 3000
```

### Building
```bash
pnpm build            # Build for production
pnpm serve            # Preview production build
```

### Testing
```bash
pnpm test             # Run all tests with Vitest
# Note: No single test command configured - add vitest CLI flags as needed
# Example: pnpm test <file-path>
```

### Linting & Formatting
```bash
pnpm lint             # Lint code with Biome
pnpm format           # Format code with Biome
pnpm check            # Run both lint and format checks with Biome
```

### Adding UI Components
```bash
pnpx shadcn@latest add <component-name>    # Add shadcn/ui components
```

## Architecture & Structure

### Project Layout
```
src/
├── components/          # React components (e.g., Header.tsx)
├── data/               # Static/demo data files
├── integrations/       # Third-party integrations (e.g., tanstack-query/)
├── lib/                # Utility functions (e.g., utils.ts)
├── trigger/            # Trigger.dev background jobs (@trigger)
├── routes/             # File-based routing (TanStack Router)
│   ├── __root.tsx      # Root layout/shell
│   ├── index.tsx       # Home page (/)
│   └── demo/           # Demo routes (can be deleted)
├── router.tsx          # Router configuration
├── routeTree.gen.ts    # Auto-generated route tree (DO NOT EDIT)
└── styles.css          # Global styles
```

### Routing System
- **File-based routing** using TanStack Router
- Routes are defined in `src/routes/` directory
- Route structure automatically generates based on file names
- `routeTree.gen.ts` is **auto-generated** - never edit manually
- Root layout is in `src/routes/__root.tsx`

### Key Files
- `src/routes/__root.tsx` - Root route with shell component, defines HTML structure, head metadata, and global layout
- `src/router.tsx` - Router configuration
- `vite.config.ts` - Vite configuration with TanStack Start plugin
- `tsconfig.json` - TypeScript configuration with path aliases
- `biome.json` - Biome linting/formatting configuration

### Technologies
- **Framework**: TanStack Start (React 19)
- **Router**: TanStack Router (file-based)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Data Fetching**: TanStack Start SSR loaders (primary), TanStack Query (mutations only)
- **Tables**: TanStack Table
- **Build Tool**: Vite
- **Linter/Formatter**: Biome
- **Testing**: Vitest + React Testing Library
- **Package Manager**: pnpm (v9.11.0)

### Demo Files
Files prefixed with `demo` can be safely deleted - they're examples only.

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

## Design System & UI Guidelines

This project follows a **monochrome dark aesthetic** inspired by developer tools like Midday.ai, Cursor.directory, and Cursor.com.

### Design Philosophy
- **Monochrome Dark Theme**: Pure blacks, grays, and whites only - NO gradients, NO colors
- **Developer-First**: Terminal-inspired, code-like, technical feel
- **Smooth & Minimal**: Clean, generous whitespace, subtle interactions
- **High Performance**: GPU-accelerated animations, optimized for 60fps

### Color Usage
```css
/* Background Layers */
--background: oklch(0.09 0 0)    /* #0A0A0A - deepest black, page background */
--card: oklch(0.13 0 0)          /* #111111 - cards, elevated surfaces */
--secondary: oklch(0.17 0 0)     /* #1A1A1A - nested elements */
--accent: oklch(0.2 0 0)         /* #222222 - hover states */

/* Text Hierarchy */
--foreground: oklch(1 0 0)       /* #FFFFFF - headings, primary text */
--muted-foreground: oklch(0.5 0 0) /* #808080 - body text */

/* Borders - Subtle white overlays */
--border: oklch(0.25 0 0)        /* rgba(255,255,255,0.1) equivalent */
```

**Rules:**
- NEVER use colored backgrounds or gradients
- Use only grayscale values (pure black to white)
- Maintain high contrast for readability (white text on dark bg)
- Keep borders subtle and minimal

### Typography
- **Sans-serif**: Inter for body text and UI elements
- **Monospace**: Fira Code for code, technical terms, version numbers, and brand name
- Use monospace for anything technical (tool names, versions, commands, code snippets)
- Font weights: 400 (normal), 500 (medium), 600 (semibold), 700 (bold - rare)

### Spacing & Layout
- Use Tailwind's spacing scale consistently
- Generous whitespace - don't crowd elements
- Standard gaps: `gap-4` (16px), `gap-6` (24px), `gap-8` (32px)
- Padding: `px-4 py-6` for cards, `px-6 py-8` for sections
- Max widths: `max-w-7xl` for wide layouts, `max-w-2xl` for narrow content

### Component Patterns

#### Cards
```tsx
<Card className="border-border bg-card p-6 transition-all hover:border-accent">
  {/* Content */}
</Card>
```
- Always use `border-border` for borders
- `bg-card` for background
- Add `hover:border-accent` for interactive cards
- Smooth transitions: `transition-all` or `transition-colors`

#### Buttons
```tsx
<Button className="border border-border bg-primary font-mono text-sm">
  Label
</Button>
```
- Use `font-mono` for button text
- Include border for definition against dark bg
- Keep text uppercase or title case, never all lowercase for CTAs

#### Badges/Tags
```tsx
<Badge variant="outline" className="border-border bg-card font-mono text-xs uppercase">
  Coming Soon
</Badge>
```
- Always use monospace font
- Uppercase for status badges
- Subtle borders and backgrounds

#### Icons & Logos
- Use Lucide React for UI icons
- Icon size: `h-4 w-4` (small), `h-6 w-6` (medium), `h-8 w-8` (large)
- For SVG logos, force monochrome with: `[&>svg]:fill-foreground [&>svg_path]:fill-foreground`
- Never use colored logos - convert to white/monochrome

### Animation Guidelines

#### Smooth Scrolling
```css
.animate-scroll {
  animation: scroll 15s linear infinite;
  will-change: transform;
}
```
- Always use `will-change: transform` for GPU acceleration
- Linear timing for infinite scrolls
- Duration: 15-30s depending on content length
- Add pause on hover: `hover:animation-play-state-paused`

#### Hover Transitions
```tsx
className="transition-colors hover:text-foreground"
className="transition-all hover:border-accent"
```
- Duration: 150-200ms (default is fine)
- Use `transition-colors` for text/border color changes
- Use `transition-all` when multiple properties change
- Avoid transitions on `transform` unless necessary

#### Loading States
- Skeleton screens matching bg colors
- Subtle pulse animation
- No spinners - use progress indicators or skeleton UI

### Responsive Design
```tsx
className="text-sm sm:text-base md:text-lg"
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
```
- Mobile-first approach
- Breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)
- Test all components at mobile, tablet, and desktop sizes

### Accessibility
- Maintain WCAG AA contrast ratios (white on black = 21:1 ✓)
- Use semantic HTML (`<header>`, `<nav>`, `<main>`, `<footer>`)
- Add `aria-label` for icon-only buttons
- Ensure keyboard navigation works (`focus:` states)

### Performance Considerations
- Use `shrink-0` instead of `flex-shrink-0` for modern Tailwind
- Add `will-change` for animated elements
- Avoid large images - use SVGs where possible
- Lazy load below-the-fold content

### Don'ts
- ❌ NO color gradients (`bg-gradient-to-r`, etc.)
- ❌ NO colored text/backgrounds (except semantic like destructive)
- ❌ NO colored borders
- ❌ NO drop shadows (use borders instead)
- ❌ NO uppercase component filenames (use kebab-case)
- ❌ NO busy animations or effects
- ❌ NO stock photos or decorative images

### Do's
- ✅ Pure monochrome palette
- ✅ Generous whitespace
- ✅ Subtle borders and separators
- ✅ Smooth, minimal animations
- ✅ Monospace for technical content
- ✅ High contrast text
- ✅ GPU-accelerated animations
- ✅ Kebab-case filenames for components

### State Management
- React hooks (useState, useEffect, etc.)
- TanStack Start SSR loaders for initial page data (via `Route.useLoaderData()`)
- TanStack Query only for mutations, invalidations, and client-side updates
- Consider TanStack Store for complex global state (not currently installed)

## Cursor Rules

From `.cursorrules`:
- Use `pnpx shadcn@latest add <component>` to install new shadcn/ui components
- Always use the latest version of shadcn

## Error Handling
- TypeScript strict mode catches most errors at compile time
- Use Biome for catching linting issues before runtime

## Notes for AI Assistants

### Code Quality
- Always run `pnpm check` after making code changes to ensure code quality
- Never edit `src/routeTree.gen.ts` - it's auto-generated by TanStack Router
- Never edit `src/styles.css` manually (excluded from Biome)
- When adding routes, create files in `src/routes/` and let TanStack Router generate the route tree
- Use the existing demo routes as examples for implementing new features
- TypeScript is configured with strict mode - avoid `any` types and ensure type safety

### Task Management Workflow
- After completing any work, refer to `docs/TASKS.md` to identify which task was addressed
- **DO NOT automatically mark tasks as complete** - wait for user confirmation
- When the user confirms work is complete, update the checkbox in `docs/TASKS.md` by changing `- [ ]` to `- [x]`
- If work spans multiple tasks, note which tasks are affected and wait for user to decide which to mark complete
- The TASKS.md file is the source of truth for MVP progress - keep it updated as you go
