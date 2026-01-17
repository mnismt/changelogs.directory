# AGENTS.md

Context and instructions for AI coding assistants working in this codebase.

## Documentation First

**Before any task, read the relevant documentation in `docs/`.**

| Task | Read First |
|------|------------|
| Adding a new tool | `docs/guides/adding-a-tool.md` |
| Database/schema changes | `docs/reference/database-schema.md` |
| Ingestion pipeline | `docs/reference/ingestion-pipeline.md` |
| Parser development | `docs/reference/parsers.md` |
| API/server functions | `docs/reference/api-patterns.md` |
| UI/components | `docs/design/design-rules.md` |
| Animations | `docs/design/animations/` |
| Environment setup | `docs/guides/environment-variables.md` |
| Unit testing | `docs/guides/testing.md` |
| E2E testing | `docs/testing/e2e-architecture.md` |
| Test snapshots | `docs/testing/snapshots.md` |
| Deployment | `docs/guides/deployment.md` |
| Architecture overview | `docs/project/architecture.md` |

Start with `docs/README.md` for full navigation. For complex tasks, spawn parallel research agents to read multiple docs simultaneously.

## Stack

- **Framework**: TanStack Start (React 19) with file-based routing
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Background Jobs**: Trigger.dev
- **Linter/Formatter**: Biome
- **Testing**: Vitest + Playwright (E2E)
- **Package Manager**: pnpm

## Commands

```bash
# Development
pnpm dev                    # Start dev server (port 5173)
pnpm build                  # Production build
pnpm test                   # Run tests

# Code Quality
pnpm biome check <file>     # Check specific file
pnpm biome check --write <file>  # Auto-fix issues

# UI Components
pnpx shadcn@latest add <component>
```

## Project Structure

```
src/
├── components/       # React components
├── routes/          # File-based routing (TanStack Router)
├── server/          # Server functions (database queries)
├── trigger/         # Trigger.dev background jobs
├── lib/             # Utilities
└── data/            # Static data

docs/                # Documentation (READ FIRST)
prisma/              # Database schema
```

### Key Files

- `src/routes/__root.tsx` - Root layout, HTML structure, global styles
- `src/router.tsx` - Router configuration
- `src/routeTree.gen.ts` - **Auto-generated, never edit**
- `prisma/schema.prisma` - Database schema

## Critical Patterns

These patterns prevent real bugs. See `docs/reference/api-patterns.md` for full examples.

### SSR Data Fetching

- **ALWAYS** use `loader` + `Route.useLoaderData()` for initial page data
- **NEVER** use `useQuery` from React Query for initial page data
- **NEVER** add loading/error states for SSR-loaded data

### Database Access

- **ALWAYS** use `createServerFn()` for database queries
- **NEVER** import `getPrisma()` in route files (`src/routes/*`) or components
- **ONLY** import `getPrisma` in `src/server/*` or `src/lib/auth/*`

Violating these causes client-side bundling errors during navigation.

### Database Schema Changes (CRITICAL)

**NEVER manually write SQL to modify the production database schema.** Always use Prisma migrations.

**Required workflow for ANY schema change:**

```bash
# 1. Edit prisma/schema.prisma (add/modify fields)

# 2. Generate migration (creates SQL file + updates client)
pnpm prisma migrate dev --name descriptive_name

# 3. Review generated SQL in prisma/migrations/<timestamp>/migration.sql

# 4. Commit BOTH schema and migration files
git add prisma/

# 5. Deploy to production (after merging to main)
DATABASE_URL="..." pnpm prisma migrate deploy
```

**Forbidden actions:**
- ❌ Running `ALTER TABLE` / `CREATE TABLE` directly on production
- ❌ Editing `schema.prisma` without running `prisma migrate dev`
- ❌ Using `prisma db push` in production (only for dev prototyping)

**Why this matters:**
- Prisma client is generated from schema, not from the database
- Schema/database mismatch causes runtime errors: `"column does not exist"`
- Migrations provide version control, rollback capability, and team sync

See `docs/reference/database-schema.md` for detailed schema documentation.

## Code Conventions

### Formatting

- **Indentation**: Tabs
- **Quotes**: Double quotes
- **Imports**: Use `@/*` path alias for `./src/*`

### File Naming

- Routes: lowercase with hyphens (`index.tsx`, `server-funcs.tsx`)
- Components: kebab-case (`header.tsx`, `logo-showcase.tsx`)

### TypeScript

Strict mode enabled. Avoid `any` types.

## AI Assistant Workflow

### Code Quality

1. After changes, run Biome on modified files only:
   ```bash
   pnpm biome check --write src/path/to/file.tsx
   ```
2. Use IDE diagnostics (LSP) for type errors (avoid running `tsc` directly)
3. Never edit `src/routeTree.gen.ts` or `src/styles.css`

### Task Management

- Check `docs/project/TASKS.md` after completing work
- **Do not** mark tasks complete automatically - wait for user confirmation
- Update checkboxes only when user confirms completion

### Capabilities

For complex multi-area tasks:
- Spawn parallel subagents to read documentation and explore code
- Scale research depth based on complexity (simple = direct reads, complex = parallel exploration)
- Read docs first, then index relevant code patterns
