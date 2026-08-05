ALTER TABLE "ReconciliationIssue"
ADD COLUMN "resolvedByEmail" TEXT,
ADD COLUMN "resolutionAction" TEXT,
ADD COLUMN "resolutionNote" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "ReconciliationIssue_status_createdAt_idx" ON "ReconciliationIssue"("status", "createdAt");
CREATE INDEX "ReconciliationIssue_entityType_entityId_idx" ON "ReconciliationIssue"("entityType", "entityId");
