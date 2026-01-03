-- AlterTable
ALTER TABLE "waitlist" ADD COLUMN "is_test" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "waitlist_is_test_idx" ON "waitlist"("is_test");
