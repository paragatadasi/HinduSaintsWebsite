-- AlterTable
ALTER TABLE "AirtableMirrorRecord"
ADD COLUMN "hasInstagramContent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "instagramTrackerMatchCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "instagramTrackerLastMatchedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "InstagramTrackerRow" (
    "id" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL DEFAULT 'google_sheets',
    "sourceRowKey" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "saintName" TEXT,
    "postUrl" TEXT,
    "postedAt" TIMESTAMP(3),
    "rawPayloadJson" JSONB NOT NULL,
    "matchStatus" "MatchStatus" NOT NULL DEFAULT 'imported',
    "matchConfidence" "Confidence",
    "matchedAirtableRecordId" TEXT,
    "sourceImportBatchId" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "matchedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "InstagramTrackerRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstagramTrackerRow_sourceName_sourceRowKey_key" ON "InstagramTrackerRow"("sourceName", "sourceRowKey");

-- CreateIndex
CREATE INDEX "InstagramTrackerRow_matchStatus_idx" ON "InstagramTrackerRow"("matchStatus");

-- CreateIndex
CREATE INDEX "InstagramTrackerRow_matchedAirtableRecordId_idx" ON "InstagramTrackerRow"("matchedAirtableRecordId");

-- CreateIndex
CREATE INDEX "AirtableMirrorRecord_hasInstagramContent_idx" ON "AirtableMirrorRecord"("hasInstagramContent");

-- AddForeignKey
ALTER TABLE "InstagramTrackerRow" ADD CONSTRAINT "InstagramTrackerRow_matchedAirtableRecordId_fkey" FOREIGN KEY ("matchedAirtableRecordId") REFERENCES "AirtableMirrorRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramTrackerRow" ADD CONSTRAINT "InstagramTrackerRow_sourceImportBatchId_fkey" FOREIGN KEY ("sourceImportBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
