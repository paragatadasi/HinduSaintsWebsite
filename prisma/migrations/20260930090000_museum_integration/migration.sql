CREATE TABLE "MuseumSaintState" ("saintId" TEXT PRIMARY KEY REFERENCES "Saint"("id") ON DELETE CASCADE, "version" INTEGER NOT NULL DEFAULT 0);
CREATE TABLE "MuseumExhibitGroup" ("id" TEXT PRIMARY KEY, "museumSectionId" TEXT NOT NULL REFERENCES "MuseumSection"("id") ON DELETE CASCADE, "key" TEXT NOT NULL, "label" TEXT NOT NULL, "anchorSaintId" TEXT REFERENCES "Saint"("id") ON DELETE SET NULL);
CREATE UNIQUE INDEX "MuseumExhibitGroup_museumSectionId_key_key" ON "MuseumExhibitGroup"("museumSectionId", "key");
ALTER TABLE "SaintMuseumSection" ADD COLUMN "exhibitGroupId" TEXT REFERENCES "MuseumExhibitGroup"("id") ON DELETE SET NULL;
CREATE TABLE "MuseumImportProposal" ("id" TEXT PRIMARY KEY, "externalRecordId" TEXT NOT NULL REFERENCES "ExternalRecord"("id") ON DELETE CASCADE, "sourceKind" TEXT NOT NULL, "fingerprint" TEXT NOT NULL, "payload" JSONB NOT NULL, "status" TEXT NOT NULL DEFAULT 'pending', "reviewedById" TEXT, "reviewedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE UNIQUE INDEX "MuseumImportProposal_externalRecordId_sourceKind_fingerprint_key" ON "MuseumImportProposal"("externalRecordId", "sourceKind", "fingerprint");
CREATE INDEX "MuseumImportProposal_status_createdAt_idx" ON "MuseumImportProposal"("status", "createdAt");
-- Existing placements are preserved. All museum writes serialize on the Saint row,
-- check MuseumSaintState.version, and reconcile the complete primary/alternative set.

-- Preserve legacy accepted conflicts for review before enforcing the accepted-placement invariant.
INSERT INTO "AuditEvent" ("id", "action", "entityType", "entityId", "beforeJson", "createdAt")
SELECT 'museum-conflict-' || "saintId", 'museum.legacy.conflict', 'Saint', "saintId", jsonb_agg(to_jsonb(a)), CURRENT_TIMESTAMP
FROM "SaintMuseumSection" a WHERE "assignmentType" = 'primary' AND "status" = 'published'
GROUP BY "saintId" HAVING count(*) > 1;
UPDATE "SaintMuseumSection" SET "status" = 'needs_review'
WHERE "assignmentType" = 'primary' AND "status" = 'published' AND "saintId" IN (
 SELECT "saintId" FROM "SaintMuseumSection" WHERE "assignmentType" = 'primary' AND "status" = 'published' GROUP BY "saintId" HAVING count(*) > 1
);
CREATE UNIQUE INDEX "SaintMuseumSection_one_accepted_primary" ON "SaintMuseumSection"("saintId") WHERE "assignmentType" = 'primary' AND "status" = 'published';
