CREATE TABLE "MuseumUpdateJob" (
 "id" TEXT NOT NULL PRIMARY KEY, "status" TEXT NOT NULL DEFAULT 'queued',
 "actorId" TEXT NOT NULL, "baseId" TEXT NOT NULL, "leaseUntil" TIMESTAMP(3) NOT NULL,
 "progress" TEXT NOT NULL, "sourceSnapshot" JSONB, "summary" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "completedAt" TIMESTAMP(3)
);
CREATE INDEX "MuseumUpdateJob_status_leaseUntil_idx" ON "MuseumUpdateJob"("status", "leaseUntil");
CREATE TABLE "MuseumSourceReview" (
 "id" TEXT NOT NULL PRIMARY KEY, "sourceKey" TEXT NOT NULL, "recordId" TEXT NOT NULL,
 "name" TEXT NOT NULL, "reason" TEXT NOT NULL, "sourceHash" TEXT NOT NULL, "snapshot" JSONB NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'pending', "note" TEXT, "reviewedById" TEXT,
 "updatedAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "MuseumSourceReview_sourceKey_key" ON "MuseumSourceReview"("sourceKey");
CREATE INDEX "MuseumSourceReview_status_updatedAt_idx" ON "MuseumSourceReview"("status", "updatedAt");
