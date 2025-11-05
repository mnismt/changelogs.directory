-- AlterTable
ALTER TABLE "release" ADD COLUMN     "isPrerelease" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "release_toolId_isPrerelease_idx" ON "release"("toolId", "isPrerelease");
