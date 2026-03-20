# Contributing to Changelogs.directory

Thanks for your interest in contributing! This guide will get you up and running.

## Getting Started

1. Fork the repo and clone it locally
2. Install dependencies: `pnpm install`
3. Copy `.env.example` to `.env` and fill in the required values
4. Run the dev server: `pnpm dev`

## Adding a New Tool

The most common contribution is adding a new developer tool to track. Follow the step-by-step guide at [docs/guides/adding-a-tool.md](docs/guides/adding-a-tool.md).

## Development Workflow

1. Create a branch from `main`
2. Make your changes
3. Run lint: `pnpm biome check --write <changed-files>`
4. Run tests: `pnpm test`
5. Open a PR against `main`

## Code Style

- **Formatter**: Biome (runs automatically via pre-commit hook)
- **Indentation**: Tabs
- **Quotes**: Double quotes
- **Imports**: Use `@/*` path alias for `./src/*`
- **TypeScript**: Strict mode, avoid `any`

## Key Rules

- Use `loader` + `Route.useLoaderData()` for SSR data — never `useQuery`
- Database queries go in `src/server/` via `createServerFn()` — never import `getPrisma` in routes or components
- Don't edit `src/routeTree.gen.ts` or `src/styles.css` — these are auto-generated

## Documentation

Read the docs at [docs/README.md](docs/README.md) before diving into unfamiliar areas. The docs are comprehensive and will save you time.

## Reporting Issues

- Use [GitHub Issues](https://github.com/mnismt/changelogs.directory/issues) for bugs and feature requests
- Include reproduction steps for bugs
- Check existing issues before opening a new one
