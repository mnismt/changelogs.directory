/*
  Warnings:

  - You are about to drop the column `tags` on the `release` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."release_tags_idx";

-- AlterTable
ALTER TABLE "release" DROP COLUMN "tags";
