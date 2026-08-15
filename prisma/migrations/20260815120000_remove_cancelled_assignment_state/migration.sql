UPDATE "ContentAssignment"
SET
  "state" = 'completed',
  "completedAt" = COALESCE("completedAt", "updatedAt")
WHERE "state" = 'cancelled';

ALTER TYPE "AssignmentState" RENAME TO "AssignmentState_old";
CREATE TYPE "AssignmentState" AS ENUM ('assigned', 'in_progress', 'blocked', 'completed');

ALTER TABLE "ContentAssignment"
  ALTER COLUMN "state" DROP DEFAULT,
  ALTER COLUMN "state" TYPE "AssignmentState" USING "state"::text::"AssignmentState",
  ALTER COLUMN "state" SET DEFAULT 'assigned';

DROP TYPE "AssignmentState_old";
