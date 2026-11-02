-- Existing moves are not final-review confirmations; new fields start NULL.
ALTER TABLE "MuseumFinalReviewState"
 ADD COLUMN "reviewedAt" TIMESTAMP(3),
 ADD COLUMN "reviewedVitrine" TEXT,
 ADD COLUMN "reviewedPlanVersion" INTEGER,
 ADD COLUMN "reviewedPhysicalVersion" INTEGER,
 ADD COLUMN "reviewedComponentRevision" TEXT;
CREATE INDEX "MuseumFinalReviewState_museumId_reviewedAt_idx" ON "MuseumFinalReviewState"("museumId","reviewedAt");
ALTER TABLE "MuseumFinalReviewReceipt" ADD COLUMN "sourceEvidenceUnchanged" BOOLEAN NOT NULL DEFAULT true;
