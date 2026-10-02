CREATE TABLE "VisitPlaceProposal" (
 "id" TEXT NOT NULL PRIMARY KEY, "sourceKey" TEXT NOT NULL, "fingerprint" TEXT NOT NULL,
 "sourceName" TEXT NOT NULL, "sourceSheet" TEXT NOT NULL, "sourceRow" INTEGER NOT NULL,
 "sourceFileHash" TEXT NOT NULL, "saintId" TEXT, "rawJson" JSONB NOT NULL, "normalizedJson" JSONB NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'pending', "catalogDecision" TEXT NOT NULL DEFAULT 'unreviewed',
 "catalogNote" TEXT, "evidence" TEXT, "decisionNote" TEXT, "reviewedBy" TEXT, "reviewedAt" TIMESTAMP(3),
 "version" INTEGER NOT NULL DEFAULT 1, "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "VisitPlaceProposal_saintId_fkey" FOREIGN KEY ("saintId") REFERENCES "Saint"("id") ON DELETE SET NULL ON UPDATE CASCADE,
 CONSTRAINT "VisitPlaceProposal_status_check" CHECK ("status" IN ('pending','approved','deferred','rejected','superseded')),
 CONSTRAINT "VisitPlaceProposal_catalogDecision_check" CHECK ("catalogDecision" IN ('unreviewed','keep','review_needed'))
);
CREATE UNIQUE INDEX "VisitPlaceProposal_sourceKey_fingerprint_key" ON "VisitPlaceProposal"("sourceKey", "fingerprint");
CREATE INDEX "VisitPlaceProposal_status_observedAt_idx" ON "VisitPlaceProposal"("status", "observedAt");
CREATE INDEX "VisitPlaceProposal_saintId_idx" ON "VisitPlaceProposal"("saintId");
