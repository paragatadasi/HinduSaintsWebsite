CREATE TYPE "InstagramContentType" AS ENUM ('biography', 'theme', 'quote');

ALTER TABLE "InstagramItem"
ADD COLUMN "contentType" "InstagramContentType";

UPDATE "InstagramItem"
SET "contentType" = 'biography'
WHERE "type" = 'carousel'
  AND "postedAt" < TIMESTAMP WITH TIME ZONE '2026-07-29 00:00:00+00';

CREATE INDEX "InstagramItem_contentType_postedAt_createdAt_idx"
ON "InstagramItem"("contentType", "postedAt", "createdAt");
