---
name: verifying-changes
description: Verifies frontend and backend changes. Use when testing UI with Playwright MCP, debugging issues, running lints/tests, or verifying SSR behavior after implementation.
---

# Verifying Changes

Verify implementations work correctly using browser automation (Playwright MCP), code quality tools (Biome), tests (Vitest), and SSR validation.

## Quick Decision

| Verifying... | Method | Reference |
|--------------|--------|-----------|
| UI renders correctly | Playwright MCP | `frontend-playwright.md` |
| Code quality/types | `pnpm biome check <file>` | - |
| Logic/unit tests | `pnpm test <file>` | - |
| Full build | `pnpm build` | - |
| SSR data loading | Browser + network | `frontend-playwright.md` |
| Ingestion pipeline | Trigger.dev dashboard | - |

## Frontend Verification (Playwright MCP)

Use Playwright MCP tools to verify UI changes via browser automation.

### Core Workflow

```
1. Navigate → 2. Snapshot → 3. Interact → 4. Verify
```

### Key Tools

| Tool | Purpose |
|------|---------|
| `mcp__playwright__browser_navigate` | Open page at `http://localhost:5173` |
| `mcp__playwright__browser_snapshot` | Get accessibility tree (preferred for actions) |
| `mcp__playwright__browser_take_screenshot` | Visual verification |
| `mcp__playwright__browser_console_messages` | Check for JS errors |
| `mcp__playwright__browser_network_requests` | Verify API calls |
| `mcp__playwright__browser_click` | Click elements |
| `mcp__playwright__browser_type` | Type into inputs |
| `mcp__playwright__browser_wait_for` | Wait for content |

**Snapshot vs Screenshot**: Use snapshot for interactions (gives element refs). Use screenshot for visual verification only.

For detailed patterns, see `frontend-playwright.md`.

### Quick Verification Pattern

```
1. browser_navigate → http://localhost:5173/tools
2. browser_snapshot → verify page elements loaded
3. browser_console_messages → check for JS errors
4. browser_network_requests → verify SSR worked (no client API calls on initial load)
```

## Code Quality Verification

### Biome (Lint + Format)

```bash
# Lint specific files (preferred - reduces noise)
pnpm biome check src/path/to/modified-file.tsx

# Auto-fix issues
pnpm biome check --write src/path/to/file.tsx

# Multiple files
pnpm biome check src/file1.tsx src/file2.tsx
```

**CRITICAL**: Run Biome only on files you modified, not the entire codebase.

### TypeScript

```bash
# Type check entire project
pnpm exec tsc --noEmit

# Check specific issues in output
```

### Build Verification

```bash
# Production build (catches bundling issues)
pnpm build
```

## Test Verification

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test src/path/to/file.test.ts

# Run tests matching pattern
pnpm test --grep "pattern"
```

## TanStack Start SSR Verification

### SSR Verification Checklist

Before marking SSR-related changes as complete:

- [ ] **Loader uses server function** (not direct `getPrisma()`)
- [ ] **`Route.useLoaderData()`** used in component
- [ ] **No `useQuery`** for initial page data
- [ ] **No loading/error states** for SSR data (it's already loaded)
- [ ] **F5 refresh works** (server-side rendering)
- [ ] **Client navigation works** (no "DATABASE_URL not set" error)
- [ ] **View source shows data** (SEO-friendly)

### SSR Testing Pattern

```
1. browser_navigate → target page
2. browser_snapshot → verify data rendered (not loading spinner)
3. browser_console_messages → no errors
4. browser_network_requests → no client-side data fetch on initial load
```

### Common SSR Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "DATABASE_URL not set" on navigation | Direct Prisma import in route | Use server function in `src/server/` |
| Loading spinner on initial render | Using `useQuery` instead of loader | Switch to `loader` + `Route.useLoaderData()` |
| Data undefined in component | Forgot `await` in loader | Ensure `loader: async () => await serverFn()` |
| SEO not working | Client-side rendering | Use SSR loader pattern |
| Hydration mismatch | Server/client data differs | Ensure consistent data source |

### Correct SSR Pattern

```tsx
// ✅ CORRECT
export const Route = createFileRoute('/tools/')({
  loader: async () => await getTools(),  // Server function
  component: ToolsPage,
})

function ToolsPage() {
  const tools = Route.useLoaderData()  // Always has data on first render
  return <div>{tools.map(t => <Tool key={t.id} {...t} />)}</div>
}
```

```tsx
// ❌ WRONG - causes loading states and SEO issues
function ToolsPage() {
  const { data, isPending } = useQuery({ queryKey: ['tools'], queryFn: getTools })
  if (isPending) return <Loading />  // This shows on first render!
  return <div>{data?.map(t => <Tool key={t.id} {...t} />)}</div>
}
```

## Ingestion Pipeline Verification

### Trigger.dev Dashboard

1. Go to Trigger.dev dashboard
2. Check task runs for the tool
3. Verify success status and output

### Database Verification

```sql
-- Check FetchLog for latest run
SELECT * FROM "FetchLog"
WHERE "toolId" = '<tool-id>'
ORDER BY "fetchedAt" DESC
LIMIT 1;

-- Check releases were created
SELECT * FROM "Release"
WHERE "toolId" = '<tool-id>'
ORDER BY "publishedAt" DESC
LIMIT 5;
```

### Parser Verification

1. Check parser output structure matches schema
2. Verify content hash is generated correctly
3. Confirm LLM classification ran (check Change records)

## Troubleshooting

### Frontend Issues

1. **Check console**: `mcp__playwright__browser_console_messages`
2. **Check network**: `mcp__playwright__browser_network_requests`
3. **Take screenshot**: `mcp__playwright__browser_take_screenshot`
4. **Get DOM snapshot**: `mcp__playwright__browser_snapshot`

### Build Issues

```bash
# Clear cache and rebuild
rm -rf node_modules/.vite
pnpm build
```

### Database Issues

```bash
# Regenerate Prisma client
pnpm prisma generate

# Check database connection
pnpm prisma db pull
```

## Prerequisites

- Dev server running at `http://localhost:5173` (`pnpm dev`)
- Playwright MCP configured
- Database accessible

## When to Use This Skill

- "Verify the changes work"
- "Test the UI implementation"
- "Check if SSR is working correctly"
- "Debug why this page isn't loading"
- "Run the linter on my changes"
- "Make sure the build passes"
- "Test the ingestion pipeline"
- "Check for any console errors"
