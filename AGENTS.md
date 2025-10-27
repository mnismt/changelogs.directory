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
- **Data Fetching**: TanStack Query
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
- Import from `@tanstack/react-query` for data fetching
- Use path aliases (`@/`) for local imports

### React Components
- Use functional components with TypeScript
- Export component as default when it's the primary export
- Use named exports for utilities/helpers
- Prefer `interface` for type definitions (see `MyRouterContext` in `__root.tsx`)

### File Naming
- Routes: lowercase with hyphens or dots (e.g., `index.tsx`, `server-funcs.tsx`)
- Components: PascalCase (e.g., `Header.tsx`)
- Utilities: kebab-case (e.g., `utils.ts`)

### TanStack Router Patterns
- Create routes with `createFileRoute()` for file-based routes
- Create root route with `createRootRouteWithContext<YourContext>()`
- Use `Route` as the export name for file-based routes
- Use `shellComponent` in root route to define HTML document structure
- Use `head` property for meta tags and links

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

### State Management
- React hooks (useState, useEffect, etc.)
- TanStack Query for server state
- Consider TanStack Store for complex global state (not currently installed)

## Cursor Rules

From `.cursorrules`:
- Use `pnpx shadcn@latest add <component>` to install new shadcn/ui components
- Always use the latest version of shadcn

## Error Handling
- TypeScript strict mode catches most errors at compile time
- Use Biome for catching linting issues before runtime

## Notes for AI Assistants
- Always run `pnpm check` after making code changes to ensure code quality
- Never edit `src/routeTree.gen.ts` - it's auto-generated by TanStack Router
- Never edit `src/styles.css` manually (excluded from Biome)
- When adding routes, create files in `src/routes/` and let TanStack Router generate the route tree
- Use the existing demo routes as examples for implementing new features
- TypeScript is configured with strict mode - avoid `any` types and ensure type safety
