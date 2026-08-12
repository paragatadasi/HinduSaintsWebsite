DROP INDEX IF EXISTS "FeedbackSubmission_abuseFingerprint_createdAt_idx";

ALTER TABLE "FeedbackSubmission" DROP COLUMN IF EXISTS "abuseFingerprint";
