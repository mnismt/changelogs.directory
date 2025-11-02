-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('CHANGELOG_MD', 'GITHUB_RELEASES', 'RSS_FEED', 'CUSTOM_API');

-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('FEATURE', 'BUGFIX', 'IMPROVEMENT', 'BREAKING', 'SECURITY', 'DEPRECATION', 'PERFORMANCE', 'DOCUMENTATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ImpactLevel" AS ENUM ('MAJOR', 'MINOR', 'PATCH');

-- CreateEnum
CREATE TYPE "FetchStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'PARTIAL');

-- CreateTable
CREATE TABLE "tool" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "description" TEXT,
    "homepage" TEXT NOT NULL,
    "repositoryUrl" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceConfig" JSONB,
    "logoUrl" TEXT,
    "tags" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastFetchedAt" TIMESTAMP(3),

    CONSTRAINT "tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "release" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "versionSort" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceUrl" TEXT NOT NULL,
    "rawContent" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "title" TEXT,
    "summary" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "type" "ChangeType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "platform" TEXT,
    "component" TEXT,
    "isBreaking" BOOLEAN NOT NULL DEFAULT false,
    "isSecurity" BOOLEAN NOT NULL DEFAULT false,
    "isDeprecation" BOOLEAN NOT NULL DEFAULT false,
    "impact" "ImpactLevel",
    "links" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "change_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fetch_log" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "status" "FetchStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "releasesFound" INTEGER NOT NULL DEFAULT 0,
    "releasesNew" INTEGER NOT NULL DEFAULT 0,
    "releasesUpdated" INTEGER NOT NULL DEFAULT 0,
    "changesCreated" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "errorStack" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "sourceEtag" TEXT,

    CONSTRAINT "fetch_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tool_slug_key" ON "tool"("slug");

-- CreateIndex
CREATE INDEX "tool_slug_idx" ON "tool"("slug");

-- CreateIndex
CREATE INDEX "tool_isActive_idx" ON "tool"("isActive");

-- CreateIndex
CREATE INDEX "tool_lastFetchedAt_idx" ON "tool"("lastFetchedAt");

-- CreateIndex
CREATE INDEX "release_toolId_releaseDate_idx" ON "release"("toolId", "releaseDate" DESC);

-- CreateIndex
CREATE INDEX "release_publishedAt_idx" ON "release"("publishedAt" DESC);

-- CreateIndex
CREATE INDEX "release_tags_idx" ON "release"("tags");

-- CreateIndex
CREATE UNIQUE INDEX "release_toolId_version_key" ON "release"("toolId", "version");

-- CreateIndex
CREATE INDEX "change_releaseId_order_idx" ON "change"("releaseId", "order");

-- CreateIndex
CREATE INDEX "change_type_idx" ON "change"("type");

-- CreateIndex
CREATE INDEX "change_isBreaking_idx" ON "change"("isBreaking");

-- CreateIndex
CREATE INDEX "change_isSecurity_idx" ON "change"("isSecurity");

-- CreateIndex
CREATE INDEX "change_platform_idx" ON "change"("platform");

-- CreateIndex
CREATE INDEX "fetch_log_toolId_startedAt_idx" ON "fetch_log"("toolId", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "fetch_log_status_idx" ON "fetch_log"("status");

-- AddForeignKey
ALTER TABLE "release" ADD CONSTRAINT "release_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change" ADD CONSTRAINT "change_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "release"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fetch_log" ADD CONSTRAINT "fetch_log_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
