---
name: planning
description: Plans features and solutions with deep analysis. Use when asked to plan, design, architect, or think through a problem before implementing.
---

# Planning Skill

Provides thorough, well-researched plans before implementation, following TanStack Start patterns and project conventions.

## Constraints

**DO NOT:**

- Create, edit, or delete any files
- Run commands that modify state (only read-only commands like `git status`, `ls`, etc.)
- Implement the solution—only plan it
- Skip reading relevant documentation

**DO:**

- Read files and documentation
- Search the codebase for patterns
- Browse the web for research (TanStack, Trigger.dev, Prisma docs)
- Ask clarifying questions
- Reference existing implementations
- **Consult the oracle** for complex architectural decisions

## Workflow

### Phase 1: Documentation Review (Always First)

1. **Read core documentation** in `docs/`:

   - `docs/README.md` - Documentation navigation
   - `docs/project/architecture.md` - System architecture
   - `docs/project/prd.md` - Product requirements

2. **Read task-specific docs** based on what you're planning:

   | Task Type            | Required Reading                       |
   | -------------------- | -------------------------------------- |
   | Adding a tool        | `docs/guides/adding-a-tool.md`         |
   | Database/schema      | `docs/reference/database-schema.md`    |
   | Ingestion pipeline   | `docs/reference/ingestion-pipeline.md` |
   | Parser development   | `docs/reference/parsers.md`            |
   | API/server functions | `docs/reference/api-patterns.md`       |
   | UI/components        | `docs/design/design-rules.md`          |
   | Deployment           | `docs/guides/deployment.md`            |
   | Environment setup    | `docs/guides/environment-variables.md` |
   | Testing              | `docs/guides/testing.md`               |

3. **Review AGENTS.md** for project-specific constraints, conventions, and commands

### Phase 2: Consult the Oracle (For Complex Plans)

For complex or multi-file changes, **use the oracle tool** to:

- Get architectural guidance and validate your approach
- Review potential risks and edge cases
- Analyze existing code patterns across multiple files
- Get expert advice on implementation strategy

### Phase 3: Codebase Analysis

Use Glob, Grep, and Read to:

- Find similar features already implemented
- Identify coding conventions and patterns
- Review existing routes in `src/routes/`
- Check server functions in `src/server/`
- Review existing parsers in `src/trigger/ingest/`
- Examine components in `src/components/`

### Phase 4: External Research (If Needed)

Use web search to:

- Look up TanStack Start/Router documentation: https://tanstack.com/start/latest
- Research Trigger.dev patterns: https://trigger.dev/docs
- Check Prisma documentation: https://www.prisma.io/docs
- Find best practices for the approach

### Phase 5: Deliver the Plan

Provide a plan that is:

1. **Concise** - No fluff, only actionable steps
2. **Reliable** - Based on actual codebase patterns
3. **Maintainable** - Follows existing conventions
4. **Solid** - Considers edge cases and error handling

**Before planning, ask clarifying questions if:**

- Requirements are ambiguous or incomplete
- Multiple valid interpretations exist
- Critical constraints are unclear
- The scope is too broad to plan effectively

## Plan Format

```markdown
## Summary

One sentence describing the solution.

## Approach

- Step-by-step implementation plan
- Reference specific files to modify
- Include code patterns from existing codebase

## Implementation Timeline

### Phase 1: Sequential (Dependencies)

Tasks that must complete first because others depend on them.

| Order | Task                   | Files          | Reason             |
| ----- | ---------------------- | -------------- | ------------------ |
| 1     | Create server function | src/server/... | Routes need this   |
| 2     | Add database query     | src/server/... | Other code imports |

### Phase 2: Parallel (Independent)

Tasks that can run concurrently after Phase 1.

| Subagent | Task                 | Files              | Dependencies     |
| -------- | -------------------- | ------------------ | ---------------- |
| A        | Build route page     | src/routes/...     | Phase 1 complete |
| B        | Create UI components | src/components/... | Phase 1 complete |

### Phase 3: Sequential (Integration)

Final tasks requiring all parallel work to complete.

| Order | Task               | Files             |
| ----- | ------------------ | ----------------- |
| 1     | Wire up components | src/routes/...    |
| 2     | Add tests          | src/**tests**/... |

## Files to Change

| File            | Change                |
| --------------- | --------------------- |
| path/to/file.ts | Description of change |

## Documentation Updates

| Code Location          | Update Doc                             |
| ---------------------- | -------------------------------------- |
| `src/routes/*`         | `docs/reference/api-patterns.md`       |
| `src/trigger/ingest/*` | `docs/reference/ingestion-pipeline.md` |

## Risks & Mitigations

- Risk: [description]
  Mitigation: [how to handle]

## Verification Strategy

How to verify the implementation works:

- [ ] Run `pnpm biome check <files>`
- [ ] Run `pnpm test`
- [ ] Test SSR: F5 refresh works
- [ ] Test client navigation: no errors
- [ ] **Load `verifying-changes` skill** for browser verification

## Open Questions (if any)

- Questions needing user input
```

## TanStack Start Critical Patterns

### SSR Data Fetching (CRITICAL)

```tsx
// ✅ CORRECT: Use loader + useLoaderData
export const Route = createFileRoute('/tools/')({
  loader: async () => await getTools(), // Server function
  component: ToolsPage,
})

function ToolsPage() {
  const tools = Route.useLoaderData() // Type-safe, SSR
}

// ❌ WRONG: Client-side fetching
const { data, isPending } = useQuery({ queryKey: ['tools'], queryFn: getTools })
```

### Database Access (CRITICAL)

```tsx
// ✅ CORRECT: Server function in src/server/
export const getTools = createServerFn({ method: 'GET' }).handler(async () => {
  const prisma = getPrisma() // Safe - always server-side
  return prisma.tool.findMany()
})

// ❌ WRONG: Direct import in route
import { getPrisma } from '@/server/db' // Causes "DATABASE_URL not set" on client
```

### File-Based Routing

```
src/routes/
├── __root.tsx           # Root layout
├── index.tsx            # / (home)
├── tools/
│   ├── index.tsx        # /tools
│   └── $slug/
│       ├── index.tsx    # /tools/:slug
│       └── releases/
│           └── $version.tsx  # /tools/:slug/releases/:version
```

### Ingestion Pipeline (7 Phases)

```
src/trigger/ingest/<tool>/
├── setup.ts    → Initialize context
├── fetch.ts    → Get raw changelog
├── parser.ts   → Extract releases/changes
├── filter.ts   → Content hash deduplication
├── enrich.ts   → LLM classification
├── upsert.ts   → Database write
└── finalize.ts → Logging
```

## Subagent Strategy

When planning complex features, structure work for parallel execution:

### What Must Be Sequential

- **Shared types first**: Types used by multiple files
- **Server functions**: Before routes that call them
- **Database changes**: Before code that queries them
- **Integration last**: Wiring components together after all parts exist

### What Can Be Parallel (Subagents)

- **Independent layers**: UI components, separate routes
- **Different parsers**: Each tool's parser is independent
- **Tests**: Writing tests for completed components

### Subagent Best Practices

- Each subagent task should be **self-contained** with clear inputs/outputs
- Include **all context** needed—subagents don't see conversation history
- Specify **verification steps** (e.g., "run `pnpm biome check`")
- Keep tasks **focused**—one logical unit per subagent
- **Never** have subagents edit the same file simultaneously

## Codebase Quick Reference

```
src/
├── routes/          # TanStack Router (file-based)
├── server/          # Server functions (createServerFn)
├── trigger/         # Trigger.dev background jobs
│   └── ingest/      # 7-phase ingestion pipeline
├── components/      # React components
└── lib/             # Utilities

docs/
├── guides/          # Task-oriented (adding tools, deployment)
├── reference/       # Technical deep-dives (schema, pipeline, parsers)
├── design/          # UI/UX rules (design-rules.md, animations/)
└── project/         # PRD, architecture, TASKS.md
```

**Data flow**: User request → Route loader → Server function → Prisma → Database → SSR HTML

## Verification & Testing

After implementation, always verify:

### Code Quality

```bash
pnpm biome check src/path/to/modified-file.tsx  # Lint specific files
pnpm exec tsc --noEmit                          # Type check
pnpm build                                       # Production build
```

### SSR Verification

| Test              | Expected                               |
| ----------------- | -------------------------------------- |
| F5 refresh        | Page loads with data (server-rendered) |
| Client navigation | No "DATABASE_URL not set" error        |
| View source       | Data visible in initial HTML           |

### Integration Testing

| Change Type     | Verification                         |
| --------------- | ------------------------------------ |
| New route       | Navigate via Link, verify data loads |
| Server function | Check return type, test in loader    |
| Parser          | Run ingestion, check database        |

## When to Use This Skill

- "Plan how to implement X"
- "Design the architecture for Y"
- "Think through how we should approach Z"
- "Analyze the best way to add this feature"
- "What's the right approach for..."
- "Help me plan adding a new tool"
- "How should I structure this feature?"
