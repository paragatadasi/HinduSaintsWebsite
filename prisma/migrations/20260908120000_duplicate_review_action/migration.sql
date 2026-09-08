ALTER TABLE "DuplicateCandidate" ADD COLUMN "resolutionAction" TEXT;

-- Recover completed merges only from durable merge evidence, never from names
-- or missing records alone. Other legacy decisions retain their current status.
UPDATE "DuplicateCandidate" AS candidate
SET "resolutionAction" = CASE
  WHEN EXISTS (
    SELECT 1 FROM "AuditEvent" AS audit
    WHERE audit."action" = 'merge_saints'
      AND audit."beforeJson"->>'candidateId' = candidate."id"
  ) THEN 'merged'
  ELSE 'closed_by_merge'
END
WHERE candidate."entityType" = 'Saint'
  AND candidate."status" = 'resolved'
  AND EXISTS (
    SELECT 1 FROM "AuditEvent" AS audit
    WHERE audit."action" = 'merge_saints'
      AND audit."beforeJson"->'source'->>'id'
        IN (candidate."entityId", candidate."candidateEntityId")
  );
