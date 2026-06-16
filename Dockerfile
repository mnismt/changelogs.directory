# syntax=docker/dockerfile:1
# Multi-stage build for the TanStack Start (Vite + Nitro v2) app.
# Replaces the single-stage railpack build (~2.7 GB) with a slim runtime image.
# Nitro emits a self-contained `.output/` bundle, so the runtime only needs Node
# + `.output` — none of the dev toolchain (Biome, Prisma CLI/Studio, TypeScript,
# Cloudflare workerd, full icon sets) that bloated the old image.
#
# NOTE: VITE_* vars are inlined into the client bundle at build time, so they are
# passed as build args (Dokploy passes service env as --build-arg). `prisma
# generate` runs via postinstall and only needs the schema, not a live database.

FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm" PATH="/pnpm:$PATH" HUSKY=0
RUN corepack enable
WORKDIR /app

# ---- build ----
FROM base AS build
ARG VITE_BASE_URL
ARG VITE_PUBLIC_POSTHOG_KEY
ARG VITE_PUBLIC_POSTHOG_HOST
ARG VITE_BETTER_AUTH_URL
ARG VITE_SENTRY_DSN
ARG VITE_SENTRY_ENVIRONMENT
ENV VITE_BASE_URL=$VITE_BASE_URL \
    VITE_PUBLIC_POSTHOG_KEY=$VITE_PUBLIC_POSTHOG_KEY \
    VITE_PUBLIC_POSTHOG_HOST=$VITE_PUBLIC_POSTHOG_HOST \
    VITE_BETTER_AUTH_URL=$VITE_BETTER_AUTH_URL \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN \
    VITE_SENTRY_ENVIRONMENT=$VITE_SENTRY_ENVIRONMENT
# Full source needed before install: postinstall `prisma generate` writes the
# client into ./src/generated/prisma.
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm build

# ---- runner: self-contained Nitro output ----
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0
RUN groupadd --gid 1001 nodejs && useradd --uid 1001 --gid nodejs --create-home appuser
COPY --from=build --chown=appuser:nodejs /app/.output ./.output
# The site renders its own CHANGELOG.md at runtime (src/server/platform.ts reads
# process.cwd()/CHANGELOG.md), so it must be present in the working directory.
COPY --from=build --chown=appuser:nodejs /app/CHANGELOG.md ./CHANGELOG.md
USER appuser
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
