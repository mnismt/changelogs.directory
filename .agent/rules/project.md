---
trigger: always_on
---

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
-   **Concept**: Terminal Directory Listing (`~/tools`)
-   **Aesthetic**: Monochrome, Dark Mode, Glassmorphism
-   **Typography**: Inter (UI) + Fira Code (Technical Data)
-   **UX**: Cinematic animations, Global Background Effects

## Cursor Rules

From `.cursorrules`:
- Use `pnpx shadcn@latest add <component>` to install new shadcn/ui components
- Always use the latest version of shadcn

## Error Handling
- TypeScript strict mode catches most errors at compile time
- Use Biome for catching linting issues before runtime

## Notes for AI Assistants

### Code Quality
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