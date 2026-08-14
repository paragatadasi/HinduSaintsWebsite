ALTER TABLE "ContentSource"
ADD COLUMN "description" TEXT;

-- Preserve the descriptions that were previously stored on the shared source.
UPDATE "ContentSource" AS content_source
SET "description" = source."notes"
FROM "Source" AS source
WHERE content_source."sourceId" = source."id"
  AND source."notes" IS NOT NULL;
