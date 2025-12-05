# Product Requirements Document

> **Last updated**: 2025-12-05

## Executive Summary

Changelogs.directory is a centralized platform that tracks, aggregates, and presents changelog information for CLI developer tools. The platform addresses the growing challenge developers face in staying updated with the rapidly evolving landscape of command-line AI coding tools like Claude Code, OpenAI Codex, and Cursor.

## Problem Statement

With the explosion of CLI development tools in 2025 (Claude Code, Codex, AMP, Gemini CLI, etc.), developers struggle to:

- Track feature updates and breaking changes across multiple tools
- Understand which tool versions are compatible with their workflows
- Make informed decisions about tool adoption and migration
- Stay current with the rapidly evolving AI coding agent ecosystem

## Solution

A comprehensive directory that automatically tracks, curates, and presents changelog information for CLI developer tools, providing developers with a single source of truth for tool updates and evolution.

## Scope

### MVP Scope
- Track 3+ CLI developer tools via their respective sources (GitHub CHANGELOG files, releases, HTML changelog pages)
- Public directory with search, filters, and version browsing
- Server-side rendered pages for fast load times and SEO
- Automated ingestion every 6 hours
- Initial focus: Claude Code, OpenAI Codex, Cursor

### Out of Scope (MVP)
- User authentication (admin only)
- Email notifications (waitlist only)
- Mobile apps
- Tool submission by community
- Historical trend analysis

## Technical Architecture

**High-level stack** (see [architecture.md](architecture.md) for details):
- Frontend: TanStack Start (React 19) + Tailwind CSS
- Database: PostgreSQL (Neon) with Prisma ORM
- Background Jobs: Trigger.dev for scheduled ingestion
- Caching: Upstash Redis
- Deployment: Vercel (web app) + Trigger.dev Cloud (workers)

**Data Model** (see [../reference/database-schema.md](../reference/database-schema.md) for complete schema):
- Tool → Release → Change hierarchy
- Flexible connector system via `sourceType` + `sourceConfig`
- Content hashing for change detection
- FetchLog for ingestion observability

## Routes & Pages

### Public Routes
- **`/`** - Homepage with recent releases feed across all tools
  - Quick filters: by tool, change type, stable versions only
  - Server-rendered for speed and SEO

- **`/tools`** - Directory of all tracked CLI tools
  - Latest version badges
  - Tool metadata (vendor, homepage, description)
  - Tags for filtering

- **`/tools/:slug`** - Individual tool page
  - Tool overview and metadata
  - Releases list with filters
  - Deep links per version

- **`/tools/:slug/releases/:version`** - Release details
  - Changes grouped by type (Features, Bugfixes, etc.)
  - Source link and last-checked timestamp
  - Previous/next version navigation

- **`/compare/:slug/:from...:to`** - Version comparison (future)
  - Side-by-side diff view
  - Added/removed/changed entries

- **`/analytics`** - Analytics and trends (implemented)
  - Release frequency charts
  - Change type distribution
  - Tool activity timeline

### Admin Routes (Protected)
- **`/admin`** - Dashboard
  - Ingestion status
  - FetchLog history
  - Quick actions (trigger ingestion, etc.)

- **`/admin/tools/:slug`** - Tool management
  - Manual ingestion trigger
  - View logs
  - Edit tool metadata

## Core Features (MVP)

### ✅ Completed
- [x] Waitlist subscription with email validation
- [x] Claude Code connector (CHANGELOG_MD source type)
- [x] Codex connector (GITHUB_RELEASES source type)
- [x] Cursor connector (CUSTOM_API/HTML source type)
- [x] Homepage feed with recent releases
- [x] Tool directory page
- [x] Individual tool pages with release listings
- [x] Release detail pages with grouped changes
- [x] Analytics page with charts and stats
- [x] Monochrome dark design system
- [x] Glassmorphism UI effects
- [x] Cinematic page transitions
- [x] Trigger.dev scheduled ingestion (every 6 hours)
- [x] LLM-powered change classification (Gemini 2.5 Flash)
- [x] Admin dashboard
- [x] Redis caching for performance

### 🚧 In Progress
- [ ] RSS/Atom feeds (global and per-tool)
- [ ] Full-text search across all changelogs
- [ ] Advanced filters (date ranges, platforms, impact levels)

### 📋 Planned (Post-MVP)
- [ ] Email notifications for new releases
- [ ] User accounts and preferences
- [ ] Custom feed subscriptions
- [ ] Webhook notifications
- [ ] Tool comparison view
- [ ] Release diffs (show what changed)
- [ ] Community tool submissions

## Email Subscription & Notifications

### Current Implementation
- **Waitlist Model**: Single canonical subscriber list stored in database
- **Email Provider**: Generic `EmailProvider` abstraction (`src/lib/email`)
  - Supports Resend (default) and ZeptoMail
  - Factory pattern via `EMAIL_PROVIDER` environment variable
- **Current Flow**: Subscription → Email validation → Store in database → Optional welcome email

### Future Notifications (Post-MVP)
- Release digests (daily/weekly)
- Breaking change alerts
- Security update notifications
- Tool-specific subscriptions
- Custom notification preferences

**Cross-reference**: See [../guides/environment-variables.md](../guides/environment-variables.md) for email provider configuration.

## Admin & Operations

### Observability
- **Trigger.dev Dashboard**: Job monitoring, execution history, error tracking
- **FetchLog Table**: Historical analysis of all ingestion runs
- **Structured Logs**: Connector runs and cache status
- **Alerts**: Mapper failures or upstream structure changes

### Admin Tools
- Internal status page showing last successful fetch per connector
- Manual ingestion triggers
- Tool activation/deactivation
- Metadata editing

**Cross-reference**: See [../guides/deployment.md](../guides/deployment.md) for deployment and monitoring procedures.

## Milestones

### ✅ Week 1: Foundation (Completed)
- [x] TanStack Start framework initialized with SSR
- [x] PostgreSQL (Neon) database with Prisma ORM configured
- [x] Waitlist feature with email subscription implemented
- [x] Monochrome dark design system established
- [x] Homepage with hero section and waitlist form
- [x] Trigger.dev integration set up for background jobs
- [x] Database schema designed

### ✅ Week 2-3: Core Ingestion (Completed)
- [x] Claude Code connector (CHANGELOG_MD)
- [x] Codex connector (GITHUB_RELEASES)
- [x] Cursor connector (CUSTOM_API/HTML)
- [x] Tool pages with releases lists
- [x] Global feed with multi-tool support

### ✅ Week 4: Polish & Launch (Completed)
- [x] Analytics page
- [x] Cache strategy (Redis)
- [x] Internal status page
- [x] Production deployment
- [x] Scheduled ingestion (every 6 hours)
- [x] LLM enrichment integration

### 🎯 Post-MVP: Expansion
- [ ] Add 10+ more tools (Amp, Windsurf, Gemini CLI, etc.)
- [ ] RSS/Atom feeds
- [ ] Full-text search
- [ ] Email notifications
- [ ] User accounts
- [ ] API for programmatic access

## Success Metrics

### MVP Success Criteria
- [x] 3+ tools tracked (Claude Code, Codex, Cursor)
- [x] Automated ingestion running reliably (every 6 hours)
- [x] <2 second page load times (SSR)
- [x] Zero critical bugs in production
- [ ] 100+ waitlist signups (in progress)

### Post-Launch Metrics (6 months)
- 10+ tools tracked
- 1,000+ monthly active users
- 500+ waitlist subscribers converted to email notifications
- <1% ingestion failure rate
- 95%+ uptime

## Next Tools (Priority Order)

1. **Windsurf** - AI code editor (similar to Cursor)
2. **Amp** - Claude-powered CLI tool
3. **Gemini CLI** - Google's CLI coding assistant
4. **GitHub Copilot CLI** - GitHub's command-line assistant
5. **Aider** - AI pair programming in terminal
6. **Continue** - VS Code extension with CLI mode

**Selection Criteria**:
- Has public changelog (CHANGELOG.md, releases, or HTML page)
- Active development (released in last 6 months)
- Developer tools focus (CLI, editors, agents)
- Significant user base (>1,000 GitHub stars or equivalent)

## Future Enhancements

### Short-term (Next 3 months)
- RSS/Atom feeds per tool
- Email notifications for breaking changes
- API for programmatic access
- Mobile-responsive design improvements

### Medium-term (6-12 months)
- User accounts and personalized feeds
- Tool comparison view
- Release diffs (show what changed between versions)
- Webhook notifications for CI/CD integration
- Community tool submissions (with review)

### Long-term (12+ months)
- AI-powered release summaries (beyond classification)
- Changelog search across all tools
- Historical trend analysis (e.g., "Which tool releases most frequently?")
- Integration with package managers (npm, pip, cargo)
- Browser extension for in-context changelogs

## Related Documentation

- [architecture.md](architecture.md) - Technical architecture and design decisions
- [TASKS.md](TASKS.md) - Current task tracking and progress
- [../reference/database-schema.md](../reference/database-schema.md) - Complete database schema
- [../guides/adding-a-tool.md](../guides/adding-a-tool.md) - How to add new tools

---

**Questions?** Open an issue on GitHub or consult the [documentation index](../README.md).
