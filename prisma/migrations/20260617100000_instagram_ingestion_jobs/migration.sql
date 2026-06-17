CREATE TABLE "InstagramIngestionJob" (
    "id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sourceName" TEXT,
    "createdByEmail" TEXT,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "skippedRows" INTEGER NOT NULL DEFAULT 0,
    "updatedRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "mediaCachedRows" INTEGER NOT NULL DEFAULT 0,
    "incompleteRefetchedRows" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "error" TEXT,
    "rawSummary" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramIngestionJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InstagramIngestionJob_status_createdAt_idx" ON "InstagramIngestionJob"("status", "createdAt");
CREATE INDEX "InstagramIngestionJob_mode_createdAt_idx" ON "InstagramIngestionJob"("mode", "createdAt");
