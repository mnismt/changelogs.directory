# System Architecture

> **Last verified**: 2025-12-05

This document provides a high-level overview of the Changelogs.directory system architecture, design decisions, and technology choices.

## System Overview

Changelogs.directory is a full-stack web application that aggregates changelog data from multiple developer tools and presents it in a unified, searchable interface.

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   Browser   │────▶│  Vercel Edge │────▶│ Neon Postgres│◀────│ Trigger.dev  │
│  (React 19) │◀────│ (TanStack    │◀────│  (Database)  │     │ (Background  │
│             │     │   Start)     │     │              │     │    Jobs)     │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
                            │                                        │
                            ▼                                        ▼
                    ┌──────────────┐                         ┌─────────────┐
                    │ Upstash Redis│                         │  Vertex AI  │
                    │   (Cache)    │                         │  (Gemini)   │
                    └──────────────┘                         └─────────────┘
```

## Components

### 1. Web Application

**Framework**: TanStack Start (React 19)

**Deployment**: Vercel (Edge Runtime)

**Key Features**:
- **Server-Side Rendering (SSR)**: All pages rendered on server for fast initial load and SEO
- **File-based routing**: TanStack Router with automatic route generation
- **Server functions**: Type-safe data fetching with `createServerFn()`
- **Streaming**: Progressive HTML rendering for large pages

**Technologies**:
- **React 19**: Latest React with Server Components support
- **TanStack Router**: Type-safe file-based routing
- **Tailwind CSS v4**: Utility-first CSS framework
- **shadcn/ui**: Pre-built accessible UI components
- **Framer Motion**: Cinematic page transitions and animations

---

### 2. Database

**Provider**: Neon PostgreSQL (Serverless)

**ORM**: Prisma 5.x with Neon serverless driver adapter

**Schema**:
- **Tool**: Developer tools metadata (Claude Code, Codex, Cursor, etc.)
- **Release**: Versioned releases for each tool
- **Change**: Individual changes within releases
- **FetchLog**: Audit trail for ingestion runs
- **User**: Authentication and admin users

**Features**:
- **Edge-compatible**: Neon driver adapter works in Vercel Edge Runtime
- **Connection pooling**: Prisma handles connections automatically
- **Serverless-friendly**: Auto-pause/resume on free tier

**Cross-reference**: See [reference/database-schema.md](../reference/database-schema.md) for complete schema.

---

### 3. Background Jobs (Ingestion Pipeline)

**Platform**: Trigger.dev Cloud

**Purpose**: Automated changelog fetching, parsing, and enrichment

**Schedule**: Every 6 hours (0:00, 6:00, 12:00, 18:00 UTC)

**Tasks**:
- `ingest-claude-code` - Fetch/parse CHANGELOG.md from GitHub
- `ingest-codex` - Fetch/parse GitHub Releases API
- `ingest-cursor` - Scrape HTML changelog pages

**Architecture**: 7-phase pipeline (Setup → Fetch → Parse → Filter → Enrich → Upsert → Finalize)

**Cross-reference**: See [reference/ingestion-pipeline.md](../reference/ingestion-pipeline.md) for detailed pipeline architecture.

---

### 4. Caching Layer

**Provider**: Upstash Redis (Serverless)

**Purpose**: Reduce database queries and speed up SSR

**Cached Data**:
- Tool metadata (1 hour TTL)
- Release feeds (10 minute TTL)
- Incremental crawl state (Cursor ingestion)

**Strategy**: Cache-aside pattern with automatic invalidation

---

### 5. LLM Integration

**Provider**: Google Vertex AI (Gemini 2.5 Flash)

**Purpose**: Intelligent change classification and summarization

**Use Cases**:
- Classify changes (FEATURE, BUGFIX, IMPROVEMENT, SECURITY, BREAKING)
- Generate concise headlines (≤140 chars)
- Generate summaries (≤400 chars)
- Extract key highlights (up to 3 per release)

**Fallback**: Keyword-based classification if LLM fails

**Cost**: ~$0.05-0.10 per full ingestion run

---

### 6. Authentication

**Provider**: Better Auth

**Strategy**: Session-based authentication with secure cookies

**Features**:
- Email/password authentication
- Admin role-based access control
- CSRF protection
- Secure session storage

---

## Data Flow

### User Request Flow

```
1. User navigates to /tools/claude-code
2. Vercel Edge Runtime executes route loader
3. Loader calls server function (e.g., getToolMetadata)
4. Server function queries Prisma → Neon PostgreSQL
5. Data returned to loader, SSR renders HTML
6. HTML streamed to browser
7. React hydrates client-side interactivity
```

**Key Benefit**: Data fetched on server → fast initial load, no loading spinners

---

### Ingestion Flow

```
1. Trigger.dev schedule triggers task (every 6 hours)
2. Phase 1: Setup - Load tool metadata, create FetchLog
3. Phase 2: Fetch - Get raw changelog from GitHub/HTML
4. Phase 3: Parse - Extract structured data (ParsedRelease[])
5. Phase 4: Filter - Skip unchanged releases (via contentHash)
6. Phase 5: Enrich - LLM classification and summarization
7. Phase 6: Upsert - Save/update releases in database
8. Phase 7: Finalize - Update FetchLog with metrics
```

**Key Benefit**: Idempotent, resumable, cost-optimized (filter phase saves LLM calls)

---

## Design Decisions

### Why TanStack Start?

**Alternatives Considered**: Next.js, Remix, Astro

**Reasons**:
- ✅ Full-document SSR with streaming
- ✅ Type-safe server functions (no separate API layer)
- ✅ File-based routing with type inference
- ✅ Built-in data loading patterns (loaders)
- ✅ Edge-compatible (works with Neon serverless driver)
- ✅ Modern React 19 support

**Trade-offs**:
- ❌ Smaller ecosystem than Next.js
- ❌ Less mature (v1.0 released recently)

---

### Why Trigger.dev?

**Alternatives Considered**: Vercel Cron, GitHub Actions, BullMQ

**Reasons**:
- ✅ Built-in retries and error handling
- ✅ Real-time observability dashboard
- ✅ Scheduled tasks with cron syntax
- ✅ Free tier (100,000 task runs/month)
- ✅ No infrastructure to manage

**Trade-offs**:
- ❌ Vendor lock-in
- ❌ Cold starts (1-2s on free tier)

---

### Why Prisma?

**Alternatives Considered**: Drizzle ORM, Kysely, raw SQL

**Reasons**:
- ✅ Type-safe queries with excellent TypeScript support
- ✅ Automatic migrations
- ✅ Neon serverless driver adapter (edge-compatible)
- ✅ Introspection and schema visualization

**Trade-offs**:
- ❌ Slightly larger bundle size
- ❌ Generated client can be slow to regenerate

---

### Why Gemini 2.5 Flash?

**Alternatives Considered**: Claude Haiku, GPT-4o-mini, Llama 3

**Reasons**:
- ✅ Extremely fast (200-500ms per call)
- ✅ Very low cost ($0.075 per 1M input tokens)
- ✅ Good classification accuracy (>85%)
- ✅ Vertex AI integration (Google Cloud)

**Trade-offs**:
- ❌ Requires Google Cloud service account
- ❌ Less accurate than GPT-4 for complex summaries

---

### Why PostgreSQL (Neon)?

**Alternatives Considered**: MySQL, MongoDB, Supabase

**Reasons**:
- ✅ Relational data model fits well (Tool → Release → Change hierarchy)
- ✅ Neon's serverless model (auto-pause on free tier)
- ✅ Edge-compatible driver adapter
- ✅ Generous free tier (0.5 GB storage, 100 hours compute)

**Trade-offs**:
- ❌ Cold starts when auto-paused (~1-2s)

---

## Scalability Considerations

### Current Scale (MVP)

- **Tools**: 7 (Claude Code, Codex, Cursor, Windsurf, OpenCode, Antigravity, Gemini CLI)
- **Releases**: ~300+ total across all tools
- **Changes**: ~1,500+ total
- **Users**: <100 (mostly admin)
- **Traffic**: <1,000 page views/month

### Scaling Strategy (Future)

#### Database
- **Horizontal**: Read replicas for read-heavy queries
- **Vertical**: Upgrade Neon compute tier (0.25 → 1 → 4 CU)
- **Optimization**: Add indexes on frequently queried columns

#### Ingestion
- **Parallel tasks**: Process multiple tools concurrently
- **Incremental updates**: Only fetch new releases (ETag, Redis cache)
- **Manual full refresh**: Use `forceFullRescan` payloads (for supported tasks) to bypass cache/filter when a full reprocess is needed
- **Rate limiting**: Respect GitHub API limits (5000 req/hr)

#### Caching
- **Edge caching**: Add Vercel Edge Cache for static pages
- **Stale-while-revalidate**: Serve cached data while refreshing in background
- **CDN**: Use Cloudflare for static assets

#### Cost Projections (100 tools, 10,000 releases)

| Component | Current | 100 Tools |
|-----------|---------|-----------|
| Database | Free (Neon) | ~$19/month (Pro tier) |
| Trigger.dev | Free | ~$20/month (Starter tier) |
| Vercel | Free | ~$20/month (Pro tier) |
| LLM (Gemini) | ~$12/month | ~$50/month |
| Redis | Free (Upstash) | Free |
| **Total** | ~$12/month | ~$109/month |

---

## Security Considerations

### Authentication
- Session cookies are httpOnly and secure (HTTPS only)
- CSRF protection via Better Auth
- Admin routes protected by middleware

### Database
- Connection strings stored in environment variables (never in code)
- SSL connections required (`?sslmode=require`)
- Least-privilege access (app uses dedicated database user, not admin)

### API Keys
- Stored in environment variables
- Rotated quarterly
- Different keys for dev/staging/prod

### Rate Limiting
- GitHub API: Use authenticated requests (5000 req/hr vs 60 req/hr)
- LLM: Filter phase prevents unnecessary calls (80%+ savings)

---

## Monitoring & Observability

### Application Monitoring
- **Vercel**: Function logs, error rates, performance metrics
- **Sentry** (optional): Client and server-side error tracking
- **PostHog** (optional): Web analytics and user behavior

### Ingestion Monitoring
- **Trigger.dev Dashboard**: Real-time task logs, run history, duration
- **FetchLog Table**: Audit trail of all ingestion runs (status, metrics, errors)
- **Braintrust** (optional): LLM observability (costs, latency, accuracy)

### Database Monitoring
- **Neon Dashboard**: Connection count, query performance, storage usage
- **Prisma Studio**: Visual data browser and query tool

---

## Deployment

### Web App (Vercel)
1. Push to GitHub main branch
2. Vercel auto-builds and deploys
3. Environment variables set in Vercel dashboard
4. Custom domain configured (changelogs.directory)

### Background Jobs (Trigger.dev)
1. Run `pnpm exec trigger.dev@latest deploy`
2. Tasks deployed to Trigger.dev Cloud
3. Schedules activate automatically
4. Environment variables set in Trigger.dev dashboard

**Cross-reference**: See [guides/deployment.md](../guides/deployment.md) for detailed deployment procedures.

---

## Future Enhancements

### Short-term (Next 3 months)
- Add 10+ more tools (Amp, Windsurf, Gemini CLI, etc.)
- Email notifications for new releases
- RSS feeds per tool
- API for programmatic access

### Medium-term (6-12 months)
- User accounts and personalized feeds
- Tool comparison view
- Release diffs (show what changed between versions)
- Webhook notifications

### Long-term (12+ months)
- AI-powered release summaries (beyond classification)
- Changelog search across all tools
- Historical trend analysis
- Community contributions (submit new tools)

---

## See Also

- [project/prd.md](prd.md) - Product requirements and feature roadmap
- [reference/database-schema.md](../reference/database-schema.md) - Database schema details
- [reference/ingestion-pipeline.md](../reference/ingestion-pipeline.md) - Ingestion architecture
- [guides/deployment.md](../guides/deployment.md) - Deployment procedures

---

**Questions?** Open an issue on GitHub or consult the [documentation index](../README.md).
