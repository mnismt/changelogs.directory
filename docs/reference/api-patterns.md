# API Patterns Reference

> **Last verified**: 2025-12-05

This document explains server-side data fetching patterns used in Changelogs.directory, specifically TanStack Start SSR loaders and server functions.

## Core Principle

**CRITICAL**: Always use SSR loaders for initial page data. Never use client-side `useQuery` for initial data fetching.

**Why**:
- Data loads on server → Better initial page load
- Content in initial HTML → Better SEO
- No loading spinners → Better UX
- Type-safe data access → Better DX

---

## Pattern 1: SSR Loaders

### Basic Loader

**Use Case**: Single data source for a page

**File**: `src/routes/tools/$slug/index.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { getToolReleasesPaginated } from '@/server/tools'

export const Route = createFileRoute('/tools/$slug/')({
  loader: async ({ params }) => {
    // Fetch data on server
    const result = await getToolReleasesPaginated({
      data: {
        slug: params.slug,
        limit: 20,
        offset: 0,
      },
    })

    return result
  },
  component: ToolReleasesPage,
})

function ToolReleasesPage() {
  // Access data with Route.useLoaderData() - NO loading states needed!
  const { releases, pagination } = Route.useLoaderData()

  return (
    <div>
      {releases.map(release => (
        <ReleaseCard key={release.id} release={release} />
      ))}
    </div>
  )
}
```

**Key Points**:
- ✅ Loader runs on **every** navigation (server-side)
- ✅ Data available immediately in component
- ✅ No `isPending`, `isLoading`, or `error` states needed
- ❌ Don't use `useQuery` in component for initial data

---

### Multi-Source Loader

**Use Case**: Page needs data from multiple sources

**File**: `src/routes/tools/$slug/releases/$version.tsx`

```typescript
export const Route = createFileRoute('/tools/$slug/releases/$version')({
  loader: async ({ params }) => {
    // Parallel data fetching with Promise.all
    const [release, adjacentVersions, allVersions] = await Promise.all([
      getReleaseWithChanges({
        data: { toolSlug: params.slug, version: params.version },
      }),
      getAdjacentVersions({
        data: { toolSlug: params.slug, version: params.version },
      }),
      getAllVersions({
        data: { slug: params.slug },
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

  return (
    <div>
      <ReleaseHeader release={release} />
      <VersionNavigation prev={adjacentVersions.prev} next={adjacentVersions.next} />
      <ChangeList changes={release.changes} />
      <VersionDropdown versions={allVersions} />
    </div>
  )
}
```

**Key Points**:
- ✅ Use `Promise.all()` for parallel fetching
- ✅ Return object with named properties
- ✅ Destructure in component for clean code

---

### Loader with Dependencies

**Use Case**: Subsequent data depends on earlier fetch

**File**: `src/routes/admin/tools_.$slug.tsx`

```typescript
export const Route = createFileRoute('/admin/tools_/$slug')({
  loader: async ({ params }) => {
    // Step 1: Fetch tool
    const tool = await getToolMetadata({ data: { slug: params.slug } })

    // Step 2: Fetch logs (depends on tool.id)
    const logs = await getFetchLogs({ data: { toolId: tool.id, limit: 10 } })

    // Step 3: Get stats (depends on tool.id)
    const stats = await getToolStats({ data: { toolId: tool.id } })

    return { tool, logs, stats }
  },
  component: AdminToolPage,
})
```

**Key Points**:
- ✅ Sequential fetching when data depends on previous results
- ❌ Don't use `Promise.all()` for dependent data

---

## Pattern 2: Server Functions

### Why Server Functions?

**CRITICAL**: Never import `getPrisma()` or database code directly in route files.

**❌ WRONG**:
```typescript
// BAD - Causes "DATABASE_URL environment variable is not set" on client navigation
import { getPrisma } from '@/server/db'

export const Route = createFileRoute('/admin/')({
  loader: async () => {
    const prisma = getPrisma() // ⚠️ Gets bundled into client code
    return await prisma.user.count()
  }
})
```

**Problem**: On client-side navigation, the loader code is bundled into client JavaScript. `getPrisma()` tries to access `process.env.DATABASE_URL` which doesn't exist in the browser.

**✅ CORRECT**:
```typescript
// GOOD - Database code stays on server
import { getAdminDashboardStats } from '@/server/admin'

export const Route = createFileRoute('/admin/')({
  loader: async () => {
    return await getAdminDashboardStats() // Server function always runs server-side
  }
})
```

---

### Creating Server Functions

**File**: `src/server/tools.ts`

```typescript
import { createServerFn } from '@tanstack/react-start'
import { getPrisma } from './db'
import { z } from 'zod'

// Define input schema
const getToolMetadataSchema = z.object({
  slug: z.string(),
})

// Create server function
export const getToolMetadata = createServerFn({ method: 'GET' })
  .inputValidator(getToolMetadataSchema)
  .handler(async ({ data }) => {
    const prisma = getPrisma() // Safe - server functions never bundle to client

    const tool = await prisma.tool.findUnique({
      where: { slug: data.slug },
      select: {
        id: true,
        slug: true,
        name: true,
        vendor: true,
        description: true,
        homepage: true,
        repositoryUrl: true,
        tags: true,
      },
    })

    if (!tool) {
      throw new Error(`Tool not found: ${data.slug}`)
    }

    return tool
  })
```

**Key Points**:
- ✅ Use `createServerFn()` for all database queries
- ✅ Add input validation with Zod
- ✅ Import `getPrisma` only in `src/server/*` files
- ✅ Throw errors for not-found cases (caught by error boundary)

---

### Server Function Patterns

#### Pattern A: Simple Query

```typescript
export const getLatestReleases = createServerFn({ method: 'GET' }).handler(
  async () => {
    const prisma = getPrisma()

    return await prisma.release.findMany({
      take: 10,
      orderBy: { publishedAt: 'desc' },
      include: { tool: true },
    })
  }
)
```

---

#### Pattern B: With Input Validation

```typescript
const getToolReleasesSchema = z.object({
  slug: z.string(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
})

export const getToolReleases = createServerFn({ method: 'GET' })
  .inputValidator(getToolReleasesSchema)
  .handler(async ({ data }) => {
    const prisma = getPrisma()

    const [releases, total] = await Promise.all([
      prisma.release.findMany({
        where: { tool: { slug: data.slug } },
        take: data.limit,
        skip: data.offset,
        orderBy: { versionSort: 'desc' },
      }),
      prisma.release.count({
        where: { tool: { slug: data.slug } },
      }),
    ])

    return {
      releases,
      pagination: {
        total,
        limit: data.limit,
        offset: data.offset,
        hasMore: data.offset + data.limit < total,
      },
    }
  })
```

---

#### Pattern C: With Middleware (Auth)

```typescript
import { adminMiddleware } from '@/lib/auth/middleware'

export const deleteRelease = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware]) // Require admin authentication
  .inputValidator(z.object({ releaseId: z.string() }))
  .handler(async ({ data }) => {
    const prisma = getPrisma()

    await prisma.release.delete({
      where: { id: data.releaseId },
    })

    return { success: true }
  })
```

---

## Pattern 3: Route Patterns

### Layout Routes

**Use Case**: Share data across child routes

**File**: `src/routes/tools/$slug.tsx` (layout route)

```typescript
export const Route = createFileRoute('/tools/$slug')({
  loader: async ({ params }) => {
    // Load tool metadata once for all child routes
    const tool = await getToolMetadata({ data: { slug: params.slug } })
    return { tool }
  },
  component: ToolLayout,
})

function ToolLayout() {
  const { tool } = Route.useLoaderData()

  return (
    <div>
      <ToolHero tool={tool} /> {/* Shared header */}
      <Outlet /> {/* Child routes render here */}
    </div>
  )
}
```

**Child Route**: `src/routes/tools/$slug/index.tsx`

```typescript
export const Route = createFileRoute('/tools/$slug/')({
  loader: async ({ params }) => {
    // Only load releases (tool already loaded by parent)
    const releases = await getToolReleases({ data: { slug: params.slug } })
    return { releases }
  },
  component: ToolReleasesPage,
})

function ToolReleasesPage() {
  const { releases } = Route.useLoaderData()
  const { tool } = Route.useRouteContext() // Access parent data

  return (
    <div>
      <h2>Releases for {tool.name}</h2>
      {/* ... */}
    </div>
  )
}
```

---

### Error Boundaries

**File**: `src/routes/tools/$slug/index.tsx`

```typescript
export const Route = createFileRoute('/tools/$slug/')({
  loader: async ({ params }) => {
    const tool = await getToolMetadata({ data: { slug: params.slug } })
    return { tool }
  },
  errorComponent: ({ error }) => {
    if (error.message.includes('not found')) {
      return (
        <div>
          <h1>404 - Tool Not Found</h1>
          <p>The tool "{params.slug}" does not exist.</p>
        </div>
      )
    }

    return <div>Error: {error.message}</div>
  },
  component: ToolPage,
})
```

---

## Pattern 4: Mutations

### Using Server Functions for Mutations

**IMPORTANT**: Use server functions (not React Query mutations) for consistency.

**File**: `src/routes/admin/tools_.$slug.tsx`

```typescript
import { triggerIngestion } from '@/server/admin'

function AdminToolPage() {
  const { tool } = Route.useLoaderData()

  async function handleTriggerIngestion() {
    try {
      await triggerIngestion({ data: { toolSlug: tool.slug } })
      alert('Ingestion triggered successfully')
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }

  return (
    <button onClick={handleTriggerIngestion}>
      Trigger Ingestion
    </button>
  )
}
```

**Server Function**: `src/server/admin.ts`

```typescript
export const triggerIngestion = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ toolSlug: z.string() }))
  .handler(async ({ data }) => {
    // Dynamic import to avoid bundling Trigger.dev client code
    const { tasks } = await import('@trigger.dev/sdk/v3')

    await tasks.trigger(`ingest-${data.toolSlug}`, {
      toolSlug: data.toolSlug,
    })

    return { success: true }
  })
```

---

## Common Mistakes

### ❌ Mistake 1: Using useQuery for Initial Data

```typescript
// ❌ WRONG
function ToolPage() {
  const { slug } = Route.useParams()
  const { data, isPending } = useQuery({
    queryKey: ['tool', slug],
    queryFn: () => getTool(slug),
  })

  if (isPending) return <Loading />
  return <div>{data.name}</div>
}
```

**Fix**: Use loader instead
```typescript
// ✅ CORRECT
export const Route = createFileRoute('/tools/$slug/')({
  loader: async ({ params }) => await getTool(params.slug),
  component: ToolPage,
})

function ToolPage() {
  const tool = Route.useLoaderData()
  return <div>{tool.name}</div> // No loading state needed
}
```

---

### ❌ Mistake 2: Direct Database Import in Routes

```typescript
// ❌ WRONG
import { getPrisma } from '@/server/db'

export const Route = createFileRoute('/tools/')({
  loader: async () => {
    const prisma = getPrisma() // Bundles to client!
    return await prisma.tool.findMany()
  }
})
```

**Fix**: Use server function
```typescript
// ✅ CORRECT
import { getAllTools } from '@/server/tools'

export const Route = createFileRoute('/tools/')({
  loader: async () => await getAllTools(),
})
```

---

### ❌ Mistake 3: Sequential Fetching Instead of Parallel

```typescript
// ❌ WRONG (slow)
loader: async ({ params }) => {
  const tool = await getTool(params.slug)
  const releases = await getReleases(params.slug)
  const stats = await getStats(params.slug)
  return { tool, releases, stats }
}
```

**Fix**: Use Promise.all
```typescript
// ✅ CORRECT (fast)
loader: async ({ params }) => {
  const [tool, releases, stats] = await Promise.all([
    getTool(params.slug),
    getReleases(params.slug),
    getStats(params.slug),
  ])
  return { tool, releases, stats }
}
```

---

## Performance Optimization

### Prisma Select

Only fetch fields you need:

```typescript
// ❌ Fetches all fields (slow, large payload)
const tools = await prisma.tool.findMany()

// ✅ Only fetch required fields
const tools = await prisma.tool.findMany({
  select: {
    id: true,
    slug: true,
    name: true,
    vendor: true,
  },
})
```

---

### Caching with Upstash Redis

**File**: `src/lib/redis.ts`

```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600 // 1 hour
): Promise<T> {
  // Try cache first
  const cached = await redis.get<T>(key)
  if (cached) return cached

  // Cache miss - fetch and store
  const data = await fetcher()
  await redis.setex(key, ttl, data)

  return data
}
```

**Usage**:
```typescript
export const getToolReleases = createServerFn({ method: 'GET' })
  .inputValidator(getToolReleasesSchema)
  .handler(async ({ data }) => {
    return await getCached(
      `tool:${data.slug}:releases`,
      async () => {
        const prisma = getPrisma()
        return await prisma.release.findMany({
          where: { tool: { slug: data.slug } },
          take: 20,
        })
      },
      600 // Cache for 10 minutes
    )
  })
```

---

## See Also

- [TanStack Start Documentation](https://tanstack.com/start/latest/docs/framework/react/guide/data-loading)
- [guides/adding-a-tool.md](../guides/adding-a-tool.md) - Server function examples
- [reference/database-schema.md](database-schema.md) - Prisma query patterns

---

**Questions?** Open an issue on GitHub or consult the [documentation index](../README.md).
