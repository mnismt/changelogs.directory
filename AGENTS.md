# AGENTS.md

This file contains important information for AI coding assistants working in this codebase.

## Framework

This project uses **TanStack Start** - a full-stack React framework built on TanStack Router.

- Documentation: https://tanstack.com/start/latest
- TanStack Router Docs: https://tanstack.com/router/latest

## Commands

### Development

```bash
pnpm dev              # Start development server on port 5173
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
pnpm format           # Format code with Biome (auto-fixes formatting issues)
pnpm check            # Run both lint and format checks with Biome
pnpm biome check --write  # Auto-fix linting issues that Biome can fix
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
  },
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
  },
})
```

**In `src/server/admin.ts`:**

```tsx
import { createServerFn } from '@tanstack/react-start'
import { getPrisma } from './db'

export const getAdminDashboardStats = createServerFn({ method: 'GET' }).handler(async () => {
  const prisma = getPrisma() // Safe - server functions never bundle to client
  const [userCount, toolCount, releaseCount] = await Promise.all([
    prisma.user.count(),
    prisma.tool.count(),
    prisma.release.count(),
  ])
  return { userCount, toolCount, releaseCount }
})
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
  component: ComponentName,
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

## Documentation Structure

**Complete documentation** is in the `docs/` directory organized into 4 categories:

### 📘 For Task-Oriented Work (Start Here)

- **[docs/guides/adding-a-tool.md](docs/guides/adding-a-tool.md)** ⭐ - Step-by-step guide for adding new tools (most common task)
- **[docs/guides/environment-variables.md](docs/guides/environment-variables.md)** - All environment variables reference
- **[docs/guides/testing.md](docs/guides/testing.md)** - Testing strategies and commands
- **[docs/guides/deployment.md](docs/guides/deployment.md)** - Production deployment procedures

### 📕 For Technical Deep Dives

- **[docs/reference/database-schema.md](docs/reference/database-schema.md)** - Complete database schema and query patterns
- **[docs/reference/ingestion-pipeline.md](docs/reference/ingestion-pipeline.md)** - 7-phase ingestion architecture
- **[docs/reference/parsers.md](docs/reference/parsers.md)** - Parser development patterns
- **[docs/reference/api-patterns.md](docs/reference/api-patterns.md)** - SSR loaders and server functions

### 🎨 For Design & UX

- **[docs/design/design-rules.md](docs/design/design-rules.md)** - Core aesthetic principles (**READ BEFORE ANY UI WORK**)
- **[docs/design/og-images.md](docs/design/og-images.md)** - Open Graph image generation
- **[docs/design/animations/](docs/design/animations/)** - Page-by-page animation choreography

### 📋 For Project Context

- **[docs/project/architecture.md](docs/project/architecture.md)** - System architecture and design decisions
- **[docs/project/prd.md](docs/project/prd.md)** - Product vision and roadmap
- **[docs/project/TASKS.md](docs/project/TASKS.md)** - MVP task tracking

### Quick Reference by Task

- **Adding a new tool** → `docs/guides/adding-a-tool.md` (start here, it cross-references everything else)
- **Understanding data model** → `docs/reference/database-schema.md`
- **Setting up environment** → `docs/guides/environment-variables.md`
- **Implementing UI/UX** → `docs/design/design-rules.md` (MUST READ FIRST)
- **Deploying to production** → `docs/guides/deployment.md`
- **Understanding system** → `docs/project/architecture.md`

**Navigation**: All docs cross-reference each other. Start with `docs/README.md` for full navigation map.

## Design System & UI Guidelines

**CRITICAL**: Before implementing any UI/UX, you **MUST** read [docs/design/design-rules.md](docs/design/design-rules.md).

This project follows a strict **"The Directory"** concept with a monochrome dev-vibe aesthetic:

- **Concept**: Terminal Directory Listing (`~/tools`)
- **Aesthetic**: Monochrome, Dark Mode, Glassmorphism
- **Typography**: Inter (UI) + Fira Code (Technical Data)
- **UX**: Cinematic animations, Global Background Effects

## Cursor Rules

From `.cursorrules`:

- Use `pnpx shadcn@latest add <component>` to install new shadcn/ui components
- Always use the latest version of shadcn

## Error Handling

- TypeScript strict mode catches most errors at compile time
- Use Biome for catching linting issues before runtime

## Notes for AI Assistants

### Code Quality

- **Type Checking**: Always use the `get_diagnostics` (ide diagnostics native tool) to troubleshoot type errors. **NEVER** run `tsc` directly - it's too slow. The IDE diagnostics provide instant feedback on type issues.
- After making code changes, run Biome **only on the files you modified** (not the entire codebase):
  ```bash
  pnpm biome check src/path/to/modified-file.tsx
  ```
- For multiple files changed in a session:
  ```bash
  pnpm biome check src/file1.tsx src/file2.tsx src/components/file3.tsx
  ```
- **CRITICAL**: When Biome finds issues, use auto-fix instead of manual edits:
  - `pnpm biome check --write src/path/to/file.tsx` - auto-fix both formatting and linting
  - This reduces token usage and ensures consistency with Biome's formatting rules
  - Only manually fix issues that Biome cannot auto-fix (e.g., unused parameters requiring code changes)
- **AVOID** running `pnpm check` (checks all 170+ files) - only use it for final verification if requested
- Never edit `src/routeTree.gen.ts` - it's auto-generated by TanStack Router
- Never edit `src/styles.css` manually (excluded from Biome)
- When adding routes, create files in `src/routes/` and let TanStack Router generate the route tree
- Use the existing demo routes as examples for implementing new features
- TypeScript is configured with strict mode - avoid `any` types and ensure type safety

### Task Management Workflow

- After completing any work, refer to `docs/project/TASKS.md` to identify which task was addressed
- **DO NOT automatically mark tasks as complete** - wait for user confirmation
- When the user confirms work is complete, update the checkbox in `docs/project/TASKS.md` by changing `- [ ]` to `- [x]`
- If work spans multiple tasks, note which tasks are affected and wait for user to decide which to mark complete
- The TASKS.md file is the source of truth for MVP progress - keep it updated as you go

## OpenCode Planning Agent

**Location**: `.opencode/agent/plan.md`

A specialized read-only planning agent designed for thorough feature design, architectural analysis, and implementation planning before code changes.

### When to Use

Use the planning agent when you need to:
- Plan complex features or architectural changes
- Design solutions before implementation
- Think through cross-module dependencies
- Analyze trade-offs between different approaches
- Map out implementation timelines with parallel/sequential phases

### Key Capabilities

**Documentation-First Approach:**
- Always reads relevant documentation before planning
- Routes to task-specific docs automatically (e.g., `docs/guides/adding-a-tool.md` for tool additions)
- Scales research depth based on request complexity (simple → direct reads, complex → parallel explore agents)

**Parallel Research:**
- Spawns explore/general subagents for complex multi-area research
- Each subagent reads documentation first, then indexes code
- Explores patterns across existing implementations
- Gathers context from disparate parts of the codebase

**Structured Implementation Plans:**
- Provides sequential phases for dependent tasks
- Identifies parallel tasks for simultaneous implementation via subagents
- Includes specific files to change with rationale
- Documents verification strategy (code quality, SSR, design system compliance)
- Delegates documentation updates with full context

**Enforces Critical Patterns:**
- ✅ SSR loaders (`loader` + `Route.useLoaderData()`) for initial page data
- ✅ Server functions (`createServerFn()`) for database access
- ✅ Design system compliance (`docs/design/design-rules.md` mandatory before UI work)
- ✅ 7-phase ingestion pipeline for tool parsers
- ❌ Never `useQuery` for initial page data
- ❌ Never import `getPrisma()` in routes/components

### Read-Only Constraints

The planning agent **cannot**:
- Create, edit, or delete files
- Run commands that modify state
- Implement solutions directly

The planning agent **can**:
- Read all files and documentation
- Search codebase with glob/grep
- Run read-only bash commands (`git status`, `git log`, `git diff`, `ls`)
- Browse the web for research (TanStack, Trigger.dev, Prisma docs)
- Spawn explore/general subagents for parallel research
- Ask clarifying questions before planning

### Integration with Documentation

The planning agent is deeply integrated with the existing documentation structure:

| Task Type | Required Reading |
|-----------|------------------|
| Adding a tool | `docs/guides/adding-a-tool.md` ⭐ |
| Database/schema changes | `docs/reference/database-schema.md` |
| Ingestion pipeline | `docs/reference/ingestion-pipeline.md` |
| Parser development | `docs/reference/parsers.md` |
| API/server functions | `docs/reference/api-patterns.md` |
| **UI/components** | `docs/design/design-rules.md` (**MANDATORY FIRST**) |
| Animations | `docs/design/animations/<page>.md` |
| Deployment | `docs/guides/deployment.md` |
| Environment setup | `docs/guides/environment-variables.md` |
| Testing | `docs/guides/testing.md` |

### Example Usage

```bash
# Simple planning request
"Plan how to add a new field to the Tool model"

# Complex feature planning
"Plan adding Windsurf tool with ingestion pipeline and UI"

# Architectural analysis
"Design the approach for adding real-time changelog notifications"

# UI/UX planning
"Plan the redesign of the analytics page following design system rules"
```

### Plan Output Format

Plans include:
- **Summary**: One-sentence solution description
- **Approach**: Step-by-step implementation with file references and code patterns
- **Implementation Timeline**: 
  - Phase 1 (Sequential): Dependencies that must complete first
  - Phase 2 (Parallel): Independent tasks for simultaneous implementation
  - Phase 3 (Integration): Final tasks requiring all parallel work complete
- **Files to Change**: Complete list with change descriptions
- **Documentation Updates**: Delegation strategy for updating relevant docs
- **Risks & Mitigations**: Potential issues and solutions
- **Verification Strategy**: Code quality, SSR, design system, integration testing checklists
- **Open Questions**: User input needed with recommended options

### Best Practices

- ✅ Use for any non-trivial feature before implementing
- ✅ Let the agent spawn parallel explore agents for complex tasks
- ✅ Review the plan before implementation to catch issues early
- ✅ Use the verification checklist after implementation
- ❌ Don't skip planning for "quick fixes" that touch multiple files
- ❌ Don't implement before understanding the full scope
