-- Add headline column with temporary default for existing rows
ALTER TABLE "release"
ADD COLUMN "headline" TEXT NOT NULL DEFAULT '';

-- Backfill existing data using summary (trimmed) or fallback to version label
UPDATE "release"
SET "headline" = CASE
	WHEN summary IS NULL OR summary = '' THEN 'Updates for ' || version
	ELSE LEFT(summary, 120)
END;

-- Drop default so future writes must provide a headline explicitly
ALTER TABLE "release"
ALTER COLUMN "headline" DROP DEFAULT;

