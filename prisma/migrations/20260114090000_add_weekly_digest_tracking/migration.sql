-- CreateEnum
CREATE TYPE "DigestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'PARTIAL', 'FAILED', 'SKIPPED');

-- AlterTable: Add digest tracking fields to waitlist
ALTER TABLE "waitlist" ADD COLUMN "unsubscribe_token" TEXT;
ALTER TABLE "waitlist" ADD COLUMN "is_unsubscribed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "waitlist" ADD COLUMN "last_digest_sent_at" TIMESTAMP(3);

-- Generate unique tokens for existing rows
UPDATE "waitlist" SET "unsubscribe_token" = gen_random_uuid()::text WHERE "unsubscribe_token" IS NULL;

-- Make unsubscribe_token required and unique
ALTER TABLE "waitlist" ALTER COLUMN "unsubscribe_token" SET NOT NULL;
CREATE UNIQUE INDEX "waitlist_unsubscribe_token_key" ON "waitlist"("unsubscribe_token");

-- CreateIndex
CREATE INDEX "waitlist_is_unsubscribed_idx" ON "waitlist"("is_unsubscribed");

-- CreateTable
CREATE TABLE "digest_log" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "status" "DigestStatus" NOT NULL DEFAULT 'PENDING',
    "subscribers_total" INTEGER NOT NULL DEFAULT 0,
    "emails_sent" INTEGER NOT NULL DEFAULT 0,
    "emails_failed" INTEGER NOT NULL DEFAULT 0,
    "emails_bounced" INTEGER NOT NULL DEFAULT 0,
    "releases_included" INTEGER NOT NULL DEFAULT 0,
    "tools_included" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "digest_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "digest_log_period_key" ON "digest_log"("period");

-- CreateIndex
CREATE INDEX "digest_log_started_at_idx" ON "digest_log"("started_at" DESC);

-- CreateIndex
CREATE INDEX "digest_log_status_idx" ON "digest_log"("status");
