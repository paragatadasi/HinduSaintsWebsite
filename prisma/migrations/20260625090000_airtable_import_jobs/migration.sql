CREATE TABLE "AirtableImportJob" (
    "id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sourceName" TEXT,
    "createdByEmail" TEXT,
    "mirrorRowsChecked" INTEGER NOT NULL DEFAULT 0,
    "existingCmsSaintsSkipped" INTEGER NOT NULL DEFAULT 0,
    "newDraftSaintsCreated" INTEGER NOT NULL DEFAULT 0,
    "slugNameCollisionsSkipped" INTEGER NOT NULL DEFAULT 0,
    "guruRelationshipsCreated" INTEGER NOT NULL DEFAULT 0,
    "guruRelationshipsExisting" INTEGER NOT NULL DEFAULT 0,
    "guruRelationshipsUnresolved" INTEGER NOT NULL DEFAULT 0,
    "skippedSelfRelationships" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "error" TEXT,
    "rawSummary" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AirtableImportJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AirtableImportJob_status_createdAt_idx" ON "AirtableImportJob"("status", "createdAt");
CREATE INDEX "AirtableImportJob_mode_createdAt_idx" ON "AirtableImportJob"("mode", "createdAt");
