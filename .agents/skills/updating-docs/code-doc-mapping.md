# Code ↔ Doc Mapping Reference

Quick reference for which code changes require which doc updates.

## Primary Mappings

| Code Path | Doc to Update | What to Document |
|-----------|---------------|------------------|
| `src/routes/*` | `docs/reference/api-patterns.md` | Route loaders, SSR patterns, navigation |
| `src/server/*` | `docs/reference/api-patterns.md` | Server functions, DB queries, API patterns |
| `src/trigger/ingest/*` | `docs/reference/ingestion-pipeline.md` | Pipeline phases, filters, job scheduling |
| `src/trigger/ingest/<tool>/parser.ts` | `docs/reference/parsers.md` | Parser patterns, selectors, extraction logic |
| `src/trigger/ingest/<tool>/*` | `docs/guides/adding-a-tool.md` | Tool addition workflow updates |
| `src/components/*` | `docs/design/design-rules.md` | Component patterns, styling conventions |
| `src/components/logo/*` | `docs/guides/adding-a-tool.md` | Logo component registration |
| `src/lib/*` | `docs/reference/` (relevant file) | Utility functions, shared logic |
| `src/lib/tool-logos.tsx` | `docs/guides/adding-a-tool.md` | Logo registry updates |
| `prisma/schema.prisma` | `docs/reference/database-schema.md` | Model changes, relations, fields |
| `prisma/seed.ts` | `docs/guides/adding-a-tool.md` | Seed data for new tools |
| `prisma/migrations/*` | `docs/reference/database-schema.md` | Schema evolution notes |

## Environment & Config Mappings

| Code/Config Path | Doc to Update | What to Document |
|------------------|---------------|------------------|
| `.env` / `.env.example` | `docs/guides/environment-variables.md` | New env vars, descriptions |
| `vite.config.ts` | `docs/project/architecture.md` | Build config changes |
| `biome.json` | `docs/guides/testing.md` | Lint rule changes |
| `tsconfig.json` | `docs/project/architecture.md` | TypeScript config |
| `package.json` (scripts) | `AGENTS.md` | New commands |
| `app.config.ts` | `docs/project/architecture.md` | TanStack Start config |

## Secondary Mappings

Some changes may require updates to multiple docs:

| Change Type | Primary Doc | Also Update |
|-------------|-------------|-------------|
| New tool added | `docs/guides/adding-a-tool.md` | `docs/reference/parsers.md`, `docs/reference/ingestion-pipeline.md` |
| New route | `docs/reference/api-patterns.md` | `docs/project/architecture.md` (if major) |
| New component | `docs/design/design-rules.md` | Component-specific animation docs if animated |
| Schema change | `docs/reference/database-schema.md` | `docs/reference/api-patterns.md` (if queries affected) |
| New server function | `docs/reference/api-patterns.md` | Route docs that use it |
| Pipeline phase change | `docs/reference/ingestion-pipeline.md` | `docs/reference/parsers.md` |

## When to Create New Docs

| Scenario | Create In | Suggested Filename |
|----------|-----------|-------------------|
| New major feature | `docs/reference/` | `feature-name.md` |
| New workflow/process | `docs/guides/` | `doing-something.md` |
| New UI pattern | `docs/design/` | `pattern-name.md` |
| New animation choreography | `docs/design/animations/` | `page-name.md` |

## TanStack Start Pattern Mappings

When updating docs, ensure these patterns are correctly documented:

| Pattern | Relevant Docs |
|---------|---------------|
| SSR loader + useLoaderData | `docs/reference/api-patterns.md`, `AGENTS.md` |
| Server functions (createServerFn) | `docs/reference/api-patterns.md`, `AGENTS.md` |
| File-based routing | `docs/reference/api-patterns.md`, `docs/project/architecture.md` |
| Never import getPrisma in routes | `docs/reference/api-patterns.md`, `AGENTS.md` |

## TASKS.md Mapping

When code changes indicate task completion, update `docs/project/TASKS.md`:

| Code Change Pattern | Task Category |
|--------------------|---------------|
| `src/trigger/ingest/<new-tool>/` | "Add X changelog ingestion" |
| `src/routes/tools/` | "Implement tool pages" |
| `src/components/<new-component>` | "Create X component" |
| `prisma/schema.prisma` additions | "Add X to database" |
| `src/__tests__/` | "Add tests for X" |
| `docs/guides/<new-guide>` | "Document X process" |

## Validation Checklist

When validating a doc against code:

- [ ] Function/method names match actual code
- [ ] Parameters and types are accurate
- [ ] Return types/shapes reflect actual code
- [ ] Examples are runnable and correct
- [ ] File paths exist and are correct
- [ ] No references to deleted/renamed code
- [ ] TanStack Start patterns are correct (SSR, server functions)
- [ ] Import paths use `@/` alias correctly

## Quick Commands

```bash
# See what files changed recently
git diff --name-only HEAD~5

# See files changed in specific commit range
git diff --name-only abc123..def456

# See what docs reference a specific file
grep -r "src/server/tools" docs/

# Check if a doc path exists
ls docs/reference/api-patterns.md
```
