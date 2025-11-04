# MVP Launch Tasks

High-level roadmap to launch Changelogs.directory as a functional MVP.

---

## Phase 1: Database & Ingestion Pipeline

**Goal**: Get Claude Code changelog data flowing into the database.

- [x] Implement Prisma schema (Tool, Release, Change, FetchLog models)
- [x] Run migrations and seed Claude Code tool record
- [x] Build changelog parser (`src/lib/parsers/changelog-md.ts`)
- [x] Create Trigger.dev ingestion task (`src/trigger/ingest-claude-code.ts`)
- [x] Test ingestion manually - verify data in database
- [x] Schedule Trigger.dev task (every 6 hours)

**Success metric**: Claude Code releases appear in database after ingestion runs.

---

## Phase 2: Core UI Pages

**Goal**: Users can browse Claude Code releases and changes.

- [ ] Build `/tools/claude-code` page (tool overview + releases list)
- [ ] Build `/tools/claude-code/releases/[version]` page (release details with changes)
- [ ] Implement basic filtering (by change type: feature/bugfix/breaking)
- [ ] Add platform badges/filters (Windows, macOS, VSCode, etc.)
- [ ] Style with monochrome dark theme (matching design system)

**Success metric**: Users can view Claude Code's latest releases and filter changes.

---

## Phase 3: Homepage & Feed

**Goal**: Discoverable landing page showing latest updates across tools.

- [ ] Build `/` homepage with "What's new" feed (latest releases)
- [ ] Add `/tools` directory page (list of tracked tools - just Claude Code for now)
- [ ] Implement basic search/filter on homepage (by tool, change type, date range)
- [ ] Add "Subscribe to updates" CTA (link to existing waitlist)

**Success metric**: Homepage shows recent Claude Code releases in a feed format.

---

## Phase 4: Polish & Launch Prep

**Goal**: Production-ready deployment with monitoring.

- [ ] SEO optimization (meta tags, OpenGraph, sitemap.xml)
- [ ] Add loading states and error boundaries
- [ ] Create basic admin dashboard (`/admin` - show FetchLog status)
- [ ] Set up error monitoring (Sentry or similar)
- [ ] Deploy to production (Vercel or Cloudflare)
- [ ] Test ingestion in production environment
- [ ] Write basic docs (README, how to add a tool)

**Success metric**: Site is live, ingestion runs reliably, monitoring shows healthy status.

---

## Post-MVP (Future Iterations)

**Expansion**: Add more tools and features.

- [ ] Add 2nd tool (OpenAI Codex or AMP Code)
- [ ] Implement version comparison/diff view
- [ ] Generate RSS/Atom feeds (global + per-tool)
- [ ] Add full-text search across changes
- [ ] Email notifications for breaking changes/security updates
- [ ] Public API for programmatic access

---

## Current Status

**Completed** ✅:


- TanStack Start framework setup
- PostgreSQL + Prisma with Neon adapter
- Waitlist feature with email subscription
- Monochrome dark design system
- Trigger.dev integration configured
- Database schema designed (`docs/DATABASE_SCHEMA.md`)

**In Progress** 🚧:


- Phase 1: Database & Ingestion Pipeline

**Next Up** ⏭️:


- Implement Prisma schema migration

---

## Priority Order

**Week 1-2**: Phase 1 (Backend foundation)
**Week 2-3**: Phase 2 (Core UI)
**Week 3**: Phase 3 (Homepage & discovery)
**Week 4**: Phase 4 (Polish & launch)

**Target MVP launch**: End of Week 4
