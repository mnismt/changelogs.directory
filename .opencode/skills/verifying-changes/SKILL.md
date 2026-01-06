---
name: verifying-changes
description: Verifies frontend and backend changes. Use when testing UI with Playwright MCP, debugging issues, running lints/tests, or verifying SSR behavior after implementation.
---

# Verifying Changes

Verify implementations work correctly using browser automation (Playwright MCP), code quality tools (Biome), tests (Vitest), and SSR validation.

## Parallel Verification Strategy

**CRITICAL**: Always use subagents for verification to reduce token usage in main thread.

For full-stack changes, run frontend and backend verification in parallel via subagents:

```
┌─────────────────────────────────────────────────────────────┐
│                    Verification                             │
├─────────────────────────┬───────────────────────────────────┤
│  Browser Subagent       │  General Subagent                 │
│  - Playwright MCP       │  - SQL queries                    │
│  - Console errors       │  - Server function tests          │
│  - SSR validation       │  - Data integrity checks          │
│  - Network requests     │  - Ingestion verification         │
└─────────────────────────┴───────────────────────────────────┘
```

### When to Use Subagents

| Scenario | Strategy |
|----------|----------|
| Full-stack feature | 2 subagents: `browser` + `general` |
| Frontend-only | Single `browser` subagent |
| Backend-only | Single `general` subagent |
| Quick check | Direct commands (no subagent) |

### Subagent Prompts

**Browser Subagent (Frontend):**
```
Verify frontend changes using Playwright MCP:
1. Navigate to http://localhost:5173/<route>
2. Take snapshot, verify elements rendered
3. Check console for JS errors
4. Verify SSR (no client data fetch on load)
5. Test client navigation works

See frontend-playwright.md for detailed patterns.
```

**General Subagent (Backend):**
```
Verify backend/database state:
1. Run SQL queries to verify data exists
2. Test server functions return expected data
3. Check data integrity (no orphans, correct relationships)
4. Verify ingestion results if applicable

See backend-verification.md for detailed patterns.
```

## Quick Decision

| Verifying... | Method | Subagent | Reference |
|--------------|--------|----------|-----------|
| UI renders correctly | Playwright MCP | `browser` | `frontend-playwright.md` |
| Code quality/types | `pnpm biome check <file>` | Direct | - |
| Logic/unit tests | `pnpm test <file>` | Direct | - |
| Full build | `pnpm build` | Direct | - |
| SSR data loading | Browser + network | `browser` | `frontend-playwright.md` |
| Database state | SQL queries | `general` | `backend-verification.md` |
| Server functions | tsx scripts / curl | `general` | `backend-verification.md` |
| Ingestion results | SQL queries | `general` | `backend-verification.md` |
| Data integrity | SQL queries | `general` | `backend-verification.md` |

## Frontend Verification (Playwright MCP)

**CRITICAL**: Always delegate to a `browser` subagent to reduce token usage.

Use browser subagent with Playwright MCP tools to verify UI changes via browser automation.

### Delegation Pattern

Instead of using Playwright MCP directly in the main thread:

```typescript
// DO NOT: Use Playwright in main thread (consumes many tokens)
mcp__playwright__browser_navigate(...)
mcp__playwright__browser_snapshot(...)

// DO: Delegate to browser subagent
task({
  subagent_type: "browser",
  description: "Verify frontend changes",
  prompt: `Verify the UI implementation at http://localhost:5173/tools:
1. Navigate to the page
2. Take snapshot and verify tool cards are displayed
3. Check console for errors
4. Verify SSR (no client-side data fetch on initial load)
5. Test clicking a tool card navigates correctly`
})
```

### Core Workflow (Subagent Executes)

```
1. Navigate → 2. Snapshot → 3. Interact → 4. Verify
```

### Key Tools (Used by Subagent)

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

For detailed patterns the subagent should follow, see `frontend-playwright.md`.

### Quick Verification Pattern (Subagent Executes)

The browser subagent should follow this pattern:

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

### SSR Testing Pattern (Browser Subagent Executes)

The browser subagent should follow this pattern:

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
// CORRECT
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
// WRONG - causes loading states and SEO issues
function ToolsPage() {
  const { data, isPending } = useQuery({ queryKey: ['tools'], queryFn: getTools })
  if (isPending) return <Loading />  // This shows on first render!
  return <div>{data?.map(t => <Tool key={t.id} {...t} />)}</div>
}
```

## Backend Verification

**CRITICAL**: Always delegate to a `general` subagent to reduce token usage.

Use general subagent with SQL queries and tsx scripts to verify database state and server functions.

### Delegation Pattern

Instead of running backend checks in the main thread:

```typescript
// DO NOT: Run SQL/scripts in main thread
bash("pnpm prisma db execute ...")
bash("pnpm tsx scripts/verify-tool.ts ...")

// DO: Delegate to general subagent
task({
  subagent_type: "general",
  description: "Verify backend changes",
  prompt: `Verify the database state and server functions for the claude-code tool:
1. Run SQL query to verify tool exists with releases
2. Check latest release has changes parsed
3. Test getToolWithReleases server function
4. Verify FetchLog shows successful ingestion

See backend-verification.md for detailed patterns and queries.`
})
```

### Quick SQL Query (Subagent Executes)

```bash
pnpm prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Tool\";"
```

### Verification Script (Subagent Executes)

```bash
pnpm tsx scripts/verify-tool.ts claude-code
```

### Key Checks (Subagent Performs)

| Check | Query/Command |
|-------|---------------|
| Tool exists | `SELECT * FROM "Tool" WHERE slug = '<slug>'` |
| Has releases | `SELECT COUNT(*) FROM "Release" WHERE "toolId" = '<id>'` |
| Changes parsed | `SELECT COUNT(*) FROM "Change" WHERE "releaseId" = '<id>'` |
| Fetch status | `SELECT status FROM "FetchLog" ORDER BY "startedAt" DESC LIMIT 1` |
| Server function | `pnpm tsx scripts/test-server-fn.ts` |

For detailed patterns and reusable scripts the subagent should use, see `backend-verification.md`.

## Troubleshooting

### Frontend Issues (Delegate to Browser Subagent)

Delegate debugging to browser subagent:

```typescript
task({
  subagent_type: "browser",
  description: "Debug frontend issue",
  prompt: `Debug the issue on http://localhost:5173/tools/claude-code:
1. Check console messages for errors
2. Check network requests for failed API calls
3. Take screenshot to capture visual state
4. Get DOM snapshot to inspect elements`
})
```

### Backend Issues (Delegate to General Subagent)

Delegate backend debugging to general subagent:

```typescript
task({
  subagent_type: "general",
  description: "Debug backend issue",
  prompt: `Debug the backend issue:
1. Run SQL queries to check database state
2. Test server functions directly
3. Check FetchLog for error messages
4. Verify data integrity`
})
```

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
