DROP INDEX IF EXISTS "FeedbackSubmission_abuseFingerprint_createdAt_idx";

UPDATE "FeedbackSubmission"
SET "abuseFingerprint" = NULL
WHERE "abuseFingerprint" IS NOT NULL;

CREATE OR REPLACE FUNCTION "clear_feedback_abuse_fingerprint"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."abuseFingerprint" := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "FeedbackSubmission_clear_abuse_fingerprint"
ON "FeedbackSubmission";

CREATE TRIGGER "FeedbackSubmission_clear_abuse_fingerprint"
BEFORE INSERT OR UPDATE OF "abuseFingerprint" ON "FeedbackSubmission"
FOR EACH ROW
EXECUTE FUNCTION "clear_feedback_abuse_fingerprint"();
