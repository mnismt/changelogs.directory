# Product Requirements Document

## Executive Summary

Changelogs.directory is a centralized platform that tracks, aggregates, and presents changelog information for CLI developer tools. The platform addresses the growing challenge developers face in staying updated with the rapidly evolving landscape of command-line AI coding tools like Claude Code, OpenAI Codex, AMP Code, and Droid CLI.

## Problem Statement

With the explosion of CLI development tools in 2025 (Claude Code, Codex, AMP, Droid, Gemini CLI, etc.), developers struggle to:

- Track feature updates and breaking changes across multiple tools
- Understand which tool versions are compatible with their workflows
- Make informed decisions about tool adoption and migration
- Stay current with the rapidly evolving AI coding agent ecosystem

## Solution

A comprehensive directory that automatically tracks, curates, and presents changelog information for CLI developer tools, providing developers with a single source of truth for tool updates and evolution.

## Scope

- MVP tracks CLI developer tools via their respective GitHub repositories (CHANGELOG files, releases, and commit history), rendered in a public directory with search, filters, and basic version diffing.
- No auth in MVP; read-only UI with fast SSR pages and server functions using TanStack Start for data loading and cache revalidation.
- Initial focus on popular CLI AI coding tools: Claude Code, OpenAI Codex, AMP Code, and Droid CLI.

## Canonical sources

- CLI tools: GitHub repository changelog files, releases, and commits referencing updates.
- Flexible connector system supporting various source formats (CHANGELOG.md, GitHub Releases, etc.).

## Architecture

- Frontend framework: TanStack Start with full-document SSR, streaming, and server functions for typed data loaders and outputs.
- Backend services: server functions for read endpoints, cron workers for ingestion, and PostgreSQL (Neon) database with a normalized release schema.
- Caching: in-memory plus Redis layer for feeds and tool pages to minimize GitHub traffic and speed up SSR responses.
- Database: **✅ COMPLETED** - PostgreSQL with Prisma ORM using Neon serverless driver adapter for edge runtime compatibility.

## Ingestion pipeline

- Flexible connector system supporting multiple source formats (CHANGELOG.md, GitHub Releases, etc.), each with fetch, map, validate, and idempotent upsert steps keyed by tool+version.
- Schedule: periodic polling via a job runner; store raw payloads and normalized records to enable re-mapping without refetching.
- Change classification: map upstream entries to feature, improvement, bugfix, breaking, and security for consistent UI filters.

## Minimal data model

- Tool: id, slug, name, vendor, homepage, sourceAdapters[], tags[], createdAt/updatedAt.
- Release: id, toolId, version, releaseDate, sourceUrl, digest, changes[], tags[], createdAt/updatedAt.
- Change: type, title, description, impact, components[], links[].
- **✅ COMPLETED** - Waitlist: id, email (unique), createdAt - implemented with Prisma + Neon PostgreSQL for launch notifications.

## Routes (TanStack Start)

- /: recent releases feed across all tools with quick filters by tool and change type, server-rendered for speed and SEO.
- /tools: directory of CLI tools with "latest version" badges from normalized data.
- /tools/:tool: tool overview, releases list, filters, and deep links per version sourced from respective changelog data.
- /tools/:tool/releases/:version: release details grouped by change type with source link and last-checked timestamp.
- /compare/:tool/:fromVersion...: basic diff view showing added/removed/changed entries between two versions.

## Core features (MVP)

- **✅ COMPLETED** - Waitlist subscription with email validation and duplicate checking for launch notifications.
- Aggregated "What's new" feed, per-tool release lists, and release details with grouped change types and direct source attribution.
- Version diff for CLI tools by comparing normalized change arrays between two selected versions.
- Search and filters: full-text search over title/description and chips for change type and time windows, implemented via server functions.
- RSS/Atom feeds: global and per-tool feeds generated from normalized releases for subscriptions and automation.

## Admin and ops

- Internal status page: last successful fetch per connector, job queue depth, and mapper validation results for safe deploys.
- Observability: structured logs for connector runs and cache status; alerts on mapper failures or upstream structure changes.

## Milestones

- **Week 1: ✅ COMPLETED** - Scaffold TanStack Start app, base routes, layout, design tokens, and data models.
  - ✅ TanStack Start framework initialized with SSR
  - ✅ PostgreSQL (Neon) database with Prisma ORM configured
  - ✅ Waitlist feature with email subscription implemented
  - ✅ Monochrome dark design system established
  - ✅ Homepage with hero section and waitlist form
- Week 2: Implement flexible connector system and end-to-end pages for first tools (OpenAI Codex, Claude Code) with initial feed live.
- Week 3: Implement AMP Code and Droid CLI connectors, expand tool directory, plus global feed with multi-tool support.
- Week 4: Search, filters, RSS, cache strategy, internal status page, and production deployment with scheduled ingestion.

## Next tools (post-MVP)

- Add Gemini CLI and other popular CLI developer tools using the established connector pattern and normalization rules to expand coverage quickly.
