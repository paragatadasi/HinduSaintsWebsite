UPDATE "ContentAssignment" AS assignment
SET "taskType" = CASE
  WHEN assignment."state" = 'completed' THEN CASE content."workflowStatus"::text
    WHEN 'needs_review' THEN 'fact_check'
    WHEN 'fact_checked' THEN 'fact_check'
    WHEN 'populated' THEN 'populate'
    WHEN 'polished' THEN 'polish'
  END
  ELSE CASE content."workflowStatus"::text
    WHEN 'needs_review' THEN 'fact_check'
    WHEN 'fact_checked' THEN 'populate'
    WHEN 'populated' THEN 'polish'
    WHEN 'polished' THEN 'polish'
  END
END
FROM "Saint" AS content
WHERE assignment."contentType" = 'saint'
  AND assignment."contentId" = content."id";

UPDATE "ContentAssignment" AS assignment
SET "taskType" = CASE
  WHEN assignment."state" = 'completed' THEN CASE content."workflowStatus"::text
    WHEN 'needs_review' THEN 'fact_check'
    WHEN 'fact_checked' THEN 'fact_check'
    WHEN 'populated' THEN 'populate'
    WHEN 'polished' THEN 'polish'
  END
  ELSE CASE content."workflowStatus"::text
    WHEN 'needs_review' THEN 'fact_check'
    WHEN 'fact_checked' THEN 'populate'
    WHEN 'populated' THEN 'polish'
    WHEN 'polished' THEN 'polish'
  END
END
FROM "Tradition" AS content
WHERE assignment."contentType" = 'tradition'
  AND assignment."contentId" = content."id";

UPDATE "ContentAssignment" AS assignment
SET "taskType" = CASE
  WHEN assignment."state" = 'completed' THEN CASE content."workflowStatus"::text
    WHEN 'needs_review' THEN 'fact_check'
    WHEN 'fact_checked' THEN 'fact_check'
    WHEN 'populated' THEN 'populate'
    WHEN 'polished' THEN 'polish'
  END
  ELSE CASE content."workflowStatus"::text
    WHEN 'needs_review' THEN 'fact_check'
    WHEN 'fact_checked' THEN 'populate'
    WHEN 'populated' THEN 'polish'
    WHEN 'polished' THEN 'polish'
  END
END
FROM "Place" AS content
WHERE assignment."contentType" = 'place'
  AND assignment."contentId" = content."id";

UPDATE "ContentAssignment"
SET "taskType" = 'review'
WHERE "contentType" = 'instagram_item'
  OR "taskType" NOT IN ('fact_check', 'populate', 'polish', 'review');

CREATE TYPE "AssignmentTaskType" AS ENUM ('fact_check', 'populate', 'polish', 'review');

ALTER TABLE "ContentAssignment"
  ALTER COLUMN "taskType" TYPE "AssignmentTaskType"
    USING "taskType"::"AssignmentTaskType";

DROP INDEX "ContentAssignment_state_priority_createdAt_idx";

ALTER TABLE "ContentAssignment"
  DROP COLUMN "priority";

DROP TYPE "AssignmentPriority";

CREATE INDEX "ContentAssignment_state_createdAt_idx"
  ON "ContentAssignment"("state", "createdAt");
