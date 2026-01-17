# MVP Launch Tasks

High-level roadmap to launch Changelogs.directory as a functional MVP.

---

## Phase 1: Database & Ingestion Pipeline

**Goal**: Get Claude Code, OpenAI Codex, and Cursor changelog data flowing into the database.

- [x] Implement Prisma schema (Tool, Release, Change, FetchLog models)
- [x] Run migrations and seed Claude Code tool record
- [x] Build changelog parser (`src/lib/parsers/changelog-md.ts`)
- [x] Create Trigger.dev ingestion task (`src/trigger/ingest-claude-code.ts`)
- [x] Test ingestion manually - verify data in database
- [x] Schedule Trigger.dev task (every 6 hours)
- [x] Seed OpenAI Codex tool record
- [x] Create Trigger.dev ingestion task (`src/trigger/ingest-codex.ts`)
- [x] Test ingestion manually - verify Codex data in database
- [x] Schedule Trigger.dev task (every 6 hours) for Codex
- [x] Seed Cursor tool record and HTML changelog connector
- [x] Create Trigger.dev ingestion task (`src/trigger/ingest/cursor`)
- [x] Test HTML crawler manually - verify Cursor articles in database
- [x] Schedule Trigger.dev task (every 6 hours) for Cursor

**Success metric**: Claude Code and OpenAI Codex releases appear in database after ingestion runs; Cursor changelog is ingested via HTML crawler.

---

## Phase 2: Core UI Pages

**Goal**: Users can browse Claude Code and OpenAI Codex releases and changes within the shared `tools` route.

- [x] Build `/tools` hub (list Claude Code & Codex entries)
- [x] Build `/tools/$slug` overview page (tool details + releases list)
- [x] Build `/tools/$slug/releases/$version` page (release details with changes)
- [x] Implement basic filtering (by change type: feature/bugfix/breaking)
- [x] Implement stable version filter (hide pre-releases)
- [x] Add platform badges (Windows, macOS, VSCode, etc.) – filters deferred post-MVP
- [x] Style with monochrome dark theme (matching design system)

**Success metric**: Users can view Claude Code and OpenAI Codex latest releases and filter changes.

---

## Phase 3: Homepage & Feed

**Goal**: Discoverable landing page showing latest updates across tools.

- [x] Build `/` homepage with "What's new" feed (latest releases)
- [x] Add "Subscribe to updates" CTA (link to existing waitlist)

**Success metric**: Homepage shows recent Claude Code and OpenAI Codex releases in a feed format.

---

## Phase 4: Polish & Launch Prep

**Goal**: Production-ready deployment with monitoring.

- [x] Add loading states and error boundaries
- [x] Add a footer
- [x] Set up error monitoring (Sentry or similar)
- [x] Design email subscription flow for product updates (UI + backend using existing waitlist data)
- [x] Refine Subscribe page layout: Full-width master-detail preview pattern
- [x] Implement generic email provider factory (`lib/email`) with Resend provider for MVP and ZeptoMail as drop-in replacement
- [x] Configure environment toggles (`EMAIL_PROVIDER`, provider API keys) and document provider switching process
- [x] Deploy to production (Vercel or Cloudflare)
- [x] Test ingestion in production environment
- [x] Write basic docs (README, how to add a tool)
- [x] Document design rules and transition flows (`docs/transition-flow`)

**Success metric**: Site is live, ingestion runs reliably, monitoring shows healthy status.

---

## Post-MVP (Future Iterations)

**Expansion**: Add more tools and features.

- [ ] Add AMP Code connector
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
- Phase 1: Database & Ingestion Pipeline (Claude Code, Codex, Cursor)
- Phase 2: Core UI Pages (tools hub, tool pages, release pages, filtering)
- Phase 3: Homepage & Feed (latest releases, subscribe CTA)
- Phase 4: Polish & Launch Prep (error boundaries, footer, Sentry, email provider, deployment)

**MVP Complete** 🎉:

All Phase 1-4 tasks are complete. The MVP is live and operational.

**Next Up** ⏭️:

- Post-MVP features (see below)

---

## Priority Order

**Week 1-2**: Phase 1 (Backend foundation)
**Week 2-3**: Phase 2 (Core UI)
**Week 3**: Phase 3 (Homepage & discovery)
**Week 4**: Phase 4 (Polish & launch)

**Target MVP launch**: End of Week 4
