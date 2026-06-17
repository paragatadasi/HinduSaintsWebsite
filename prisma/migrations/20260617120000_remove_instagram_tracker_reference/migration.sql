-- Drop manual Google Sheets Instagram tracker reference data.
DROP TABLE IF EXISTS "InstagramTrackerRow";

-- Drop tracker-derived Airtable mirror flags.
DROP INDEX IF EXISTS "AirtableMirrorRecord_hasInstagramContent_idx";
ALTER TABLE "AirtableMirrorRecord"
DROP COLUMN IF EXISTS "hasInstagramContent",
DROP COLUMN IF EXISTS "instagramTrackerMatchCount",
DROP COLUMN IF EXISTS "instagramTrackerLastMatchedAt";
