CREATE TYPE "AssignmentContentType" AS ENUM ('saint', 'tradition', 'place', 'instagram_item');
CREATE TYPE "AssignmentState" AS ENUM ('assigned', 'in_progress', 'blocked', 'completed', 'cancelled');
CREATE TYPE "AssignmentPriority" AS ENUM ('low', 'normal', 'high', 'urgent');

CREATE TABLE "ContentAssignment" (
  "id" TEXT NOT NULL,
  "contentType" "AssignmentContentType" NOT NULL,
  "contentId" TEXT NOT NULL,
  "taskType" TEXT NOT NULL,
  "assigneeId" TEXT,
  "assignedById" TEXT NOT NULL,
  "state" "AssignmentState" NOT NULL DEFAULT 'assigned',
  "priority" "AssignmentPriority" NOT NULL DEFAULT 'normal',
  "dueDate" TIMESTAMP(3),
  "notes" TEXT,
  "completedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "ContentAssignment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContentAssignment_assigneeId_state_dueDate_idx" ON "ContentAssignment"("assigneeId", "state", "dueDate");
CREATE INDEX "ContentAssignment_contentType_contentId_state_idx" ON "ContentAssignment"("contentType", "contentId", "state");
CREATE INDEX "ContentAssignment_state_priority_createdAt_idx" ON "ContentAssignment"("state", "priority", "createdAt");
ALTER TABLE "ContentAssignment" ADD CONSTRAINT "ContentAssignment_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContentAssignment" ADD CONSTRAINT "ContentAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ContentAssignment" ADD CONSTRAINT "ContentAssignment_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
