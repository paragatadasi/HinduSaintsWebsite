-- CreateTable
CREATE TABLE "AirtableMirrorRecord" (
    "id" TEXT NOT NULL,
    "baseId" TEXT NOT NULL,
    "tableIdOrName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "airtableCreatedTime" TIMESTAMP(3),
    "rawFieldsJson" JSONB NOT NULL,
    "rawPayloadJson" JSONB NOT NULL,
    "sourceImportBatchId" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AirtableMirrorRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AirtableMirrorRecord_baseId_tableIdOrName_recordId_key" ON "AirtableMirrorRecord"("baseId", "tableIdOrName", "recordId");

-- CreateIndex
CREATE INDEX "AirtableMirrorRecord_tableIdOrName_idx" ON "AirtableMirrorRecord"("tableIdOrName");

-- CreateIndex
CREATE INDEX "AirtableMirrorRecord_lastSeenAt_idx" ON "AirtableMirrorRecord"("lastSeenAt");

-- AddForeignKey
ALTER TABLE "AirtableMirrorRecord" ADD CONSTRAINT "AirtableMirrorRecord_sourceImportBatchId_fkey" FOREIGN KEY ("sourceImportBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
