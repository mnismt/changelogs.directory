# Changelogs.directory Documentation

Welcome to the documentation for Changelogs.directory - a curated aggregator of developer tool changelogs.

## Quick Navigation

### I want to...

- 🚀 **Add a new tool** → [guides/adding-a-tool.md](guides/adding-a-tool.md)
- 🔧 **Set up my environment** → [guides/environment-variables.md](guides/environment-variables.md)
- 🧪 **Run unit tests** → [guides/testing.md](guides/testing.md)
- 🎭 **Run E2E tests** → [testing/e2e-architecture.md](testing/e2e-architecture.md)
- 🚢 **Deploy to production** → [guides/deployment.md](guides/deployment.md)
- 🎨 **Understand the design system** → [design/design-rules.md](design/design-rules.md)
- 🗄️ **Query the database** → [reference/database-schema.md](reference/database-schema.md)
- 🔍 **Understand ingestion architecture** → [reference/ingestion-pipeline.md](reference/ingestion-pipeline.md)
- 📦 **Develop custom parsers** → [reference/parsers.md](reference/parsers.md)
- 🏗️ **Learn system architecture** → [project/architecture.md](project/architecture.md)
- ⚖️ **Work on the compare page** → [compare/README.md](compare/README.md)
- 📧 **Understand the email system** → [email/README.md](email/README.md)

## Documentation Structure

### 📘 guides/
**Task-oriented how-to guides** for accomplishing specific tasks quickly.

- [adding-a-tool.md](guides/adding-a-tool.md) - Complete guide for adding new tools (e.g., Google Antigravity)
- [environment-variables.md](guides/environment-variables.md) - Central registry of all environment variables
- [testing.md](guides/testing.md) - Testing strategies and commands
- [deployment.md](guides/deployment.md) - Production deployment procedures

### 📕 reference/
**Technical specifications** and API documentation for in-depth understanding.

- [database-schema.md](reference/database-schema.md) - Complete database schema, query patterns, and indexing
- [ingestion-pipeline.md](reference/ingestion-pipeline.md) - 7-phase ingestion pipeline architecture
- [parsers.md](reference/parsers.md) - Parser development patterns and examples
- [api-patterns.md](reference/api-patterns.md) - Server functions and SSR best practices
- [hooks.md](reference/hooks.md) - Custom React hooks (useSectionObserver, useScrollReveal)
- [utilities.md](reference/utilities.md) - General lib utilities (parseMarkdownLinks)

### 🎨 design/
**Visual design and UX guidelines** for maintaining aesthetic consistency.

- [design-rules.md](design/design-rules.md) - Core "Directory" concept and visual principles
- [og-images.md](design/og-images.md) - Open Graph image generation system
- [animations/](design/animations/) - Page-by-page animation choreography
  - [README.md](design/animations/README.md) - Animation docs index
  - [homepage.md](design/animations/homepage.md) - Landing page transitions
  - [tools-index.md](design/animations/tools-index.md) - Directory listing animations
  - [tools-detail.md](design/animations/tools-detail.md) - Tool page animations
  - [release-detail.md](design/animations/release-detail.md) - Release page transitions
  - [analytics.md](design/animations/analytics.md) - Analytics page animations
  - [system-errors.md](design/animations/system-errors.md) - Error page choreography (404/500)

### ⚖️ compare/
**Tool comparison feature documentation** - pricing, models, and editorial research.

- [README.md](compare/README.md) - Overview and implementation status
- [data-model.md](compare/data-model.md) - TypeScript types and data structure spec
- [ui-design.md](compare/ui-design.md) - UI components and layout design
- [cursor.md](compare/cursor.md) - Cursor pricing, models, and editorial
- [windsurf.md](compare/windsurf.md) - Windsurf pricing, models, and editorial
- [claude-code.md](compare/claude-code.md) - Claude Code pricing, models, and editorial
- [gemini-cli.md](compare/gemini-cli.md) - Gemini CLI pricing, models, and editorial

### 📧 email/
**Email system documentation** - weekly digest, templates, and webhook handling.

- [README.md](email/README.md) - Overview and architecture
- [architecture.md](email/architecture.md) - Provider abstraction, directory structure
- [weekly-digest.md](email/weekly-digest.md) - Scheduled digest pipeline
- [templates.md](email/templates.md) - React Email templates
- [webhooks.md](email/webhooks.md) - Bounce/complaint handling, CAN-SPAM

### 🧪 testing/
**End-to-end testing documentation** for comprehensive test coverage.

- [README.md](testing/README.md) - Testing docs index
- [e2e-architecture.md](testing/e2e-architecture.md) - E2E test architecture and CI integration
- [config-validation.md](testing/config-validation.md) - Static configuration validation tests
- [browser-tests.md](testing/browser-tests.md) - Playwright browser tests
- [snapshots.md](testing/snapshots.md) - Production-derived snapshot system
- [troubleshooting.md](testing/troubleshooting.md) - Debug failing tests

### 📋 project/
**Project planning, vision, and strategic decisions.**

- [prd.md](project/prd.md) - Product Requirements Document and roadmap
- [architecture.md](project/architecture.md) - High-level system architecture and design decisions
- [TASKS.md](project/TASKS.md) - MVP task tracking (current progress)
- [performance-notes.md](project/performance-notes.md) - Performance optimization notes

## For Different Personas

### 👨‍💻 New Contributor
**Goal**: Add a new tool (like "Google Antigravity") quickly

**Reading Order**:
1. This file (you're here!) - 2 minutes
2. [guides/adding-a-tool.md](guides/adding-a-tool.md) - 10 minutes, follow the checklist
3. [guides/testing.md](guides/testing.md) - 5 minutes, verify it works
4. Browse other docs as needed

**Total Time**: ~17 minutes to productivity

### 🎨 Designer/UX Engineer
**Goal**: Understand design system and aesthetic guidelines

**Reading Order**:
1. This file - 2 minutes
2. [design/design-rules.md](design/design-rules.md) - 5 minutes, core principles
3. [design/animations/homepage.md](design/animations/homepage.md) - 5 minutes, concrete example
4. Browse other animation docs as needed for specific pages

**Total Time**: ~12 minutes to understand system

### 🚀 DevOps/Operator
**Goal**: Deploy and monitor the application

**Reading Order**:
1. [guides/environment-variables.md](guides/environment-variables.md) - 8 minutes
2. [guides/deployment.md](guides/deployment.md) - 10 minutes
3. [project/architecture.md](project/architecture.md) - 7 minutes, system overview
4. [reference/ingestion-pipeline.md](reference/ingestion-pipeline.md) - Optional, for troubleshooting

**Total Time**: ~25 minutes to deploy

### 🤖 LLM Context Loading
**Priority Order** (load top 3 for most tasks):

1. [guides/adding-a-tool.md](guides/adding-a-tool.md) - Most common task (300 lines)
2. [reference/database-schema.md](reference/database-schema.md) - Data model (550 lines)
3. [reference/api-patterns.md](reference/api-patterns.md) - Code patterns (150 lines)

**Optional Context** (load if specific task mentioned):
- Design task → [design/design-rules.md](design/design-rules.md)
- Parser development → [reference/parsers.md](reference/parsers.md)
- Deployment → [guides/deployment.md](guides/deployment.md)
- Testing → [guides/testing.md](guides/testing.md)

**Token Budget**: ~1,000 lines covers 80% of use cases

## Quick Reference

### Key Technologies
- **Frontend**: TanStack Start (React 19), TanStack Router, TailwindCSS v4
- **Backend**: TanStack Start SSR, Prisma ORM, PostgreSQL
- **Ingestion**: Trigger.dev, Google Vertex AI (Gemini 2.5 Flash)
- **Email**: Resend (primary), React Email templates
- **Caching**: Upstash Redis
- **Auth**: Better Auth
- **Deployment**: Vercel

### Current Tools
- **Claude Code** (Anthropic) - CHANGELOG_MD source type
- **Codex** (OpenAI) - GITHUB_RELEASES source type
- **Cursor** (Anysphere) - CUSTOM_API source type (HTML scraper)
- **Windsurf** (Cognition) - CUSTOM_API source type
- **OpenCode** (Anomaly) - GITHUB_RELEASES source type
- **Antigravity** (Google) - CUSTOM_API source type
- **Gemini CLI** (Google) - GITHUB_RELEASES source type

### Repository Structure
```
src/
├── components/       # React components
├── routes/          # TanStack Router file-based routes
├── server/          # Server functions (Prisma queries)
├── trigger/ingest/  # Trigger.dev ingestion pipelines
├── lib/             # Utilities (parsers, formatters)
└── data/            # Static data

docs/               # This documentation
prisma/             # Database schema and migrations
```

## Getting Help

- **Issues**: Report bugs or request features at [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: Ask questions in [GitHub Discussions](https://github.com/your-repo/discussions)
- **Contributing**: See [guides/adding-a-tool.md](guides/adding-a-tool.md) to get started

## Maintenance

This documentation is updated as the codebase evolves. If you notice outdated content:

1. Check the "Last verified" date at the top of each critical document
2. Open an issue or PR to update the docs
3. Quarterly maintenance reviews ensure accuracy

---

**Last Updated**: 2026-01-17
**Documentation Version**: 2.4 (Email system documentation added)
