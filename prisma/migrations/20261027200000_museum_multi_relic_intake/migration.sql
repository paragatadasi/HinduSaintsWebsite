CREATE TABLE "MuseumIntakeRelic" (
 "id" TEXT NOT NULL PRIMARY KEY, "intakeId" TEXT NOT NULL,
 "rawFields" JSONB NOT NULL, "position" INTEGER NOT NULL, "archivedAt" TIMESTAMP(3),
 CONSTRAINT "MuseumIntakeRelic_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "MuseumRelicIntake"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MuseumIntakeRelic_intakeId_id_key" ON "MuseumIntakeRelic"("intakeId", "id");
CREATE INDEX "MuseumIntakeRelic_intakeId_archivedAt_position_idx" ON "MuseumIntakeRelic"("intakeId", "archivedAt", "position");
INSERT INTO "MuseumIntakeRelic" ("id", "intakeId", "rawFields", "position")
 SELECT 'legacy_' || "id", "id", jsonb_strip_nulls(jsonb_build_object('relicDescription', COALESCE("rawFields"->>'relicDescription',''))), 0 FROM "MuseumRelicIntake";
ALTER TABLE "MuseumIntakeMedia" ADD COLUMN "relicId" TEXT, ADD COLUMN "archivedAt" TIMESTAMP(3);
UPDATE "MuseumIntakeMedia" SET "relicId" = 'legacy_' || "intakeId" WHERE "kind" = 'relic';
ALTER TABLE "MuseumIntakeMedia" ADD CONSTRAINT "MuseumIntakeMedia_intakeId_relicId_fkey" FOREIGN KEY ("intakeId", "relicId") REFERENCES "MuseumIntakeRelic"("intakeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
DROP INDEX "MuseumIntakeMedia_intakeId_kind_sourceSha256_key";
CREATE UNIQUE INDEX "MuseumIntakeMedia_intakeId_relicId_kind_sourceSha256_key" ON "MuseumIntakeMedia"("intakeId", "relicId", "kind", "sourceSha256");
CREATE TABLE "MuseumIntakeApproval" (
 "id" TEXT NOT NULL PRIMARY KEY, "intakeId" TEXT NOT NULL, "reviewedVersion" INTEGER NOT NULL,
 "snapshot" JSONB NOT NULL, "reviewedById" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "MuseumIntakeApproval_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "MuseumRelicIntake"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MuseumIntakeApproval_intakeId_reviewedVersion_key" ON "MuseumIntakeApproval"("intakeId", "reviewedVersion");
INSERT INTO "MuseumIntakeApproval" ("id", "intakeId", "reviewedVersion", "snapshot", "reviewedById", "createdAt")
 SELECT 'legacy_' || "id", "id", "reviewedVersion", "approvedSnapshot", "reviewedById", COALESCE("reviewedAt", CURRENT_TIMESTAMP)
 FROM "MuseumRelicIntake" WHERE "approvedSnapshot" IS NOT NULL AND "reviewedVersion" IS NOT NULL;
DROP INDEX "MuseumIntakeDelivery_intakeId_target_key";
CREATE UNIQUE INDEX "MuseumIntakeDelivery_intakeId_target_reviewedVersion_key" ON "MuseumIntakeDelivery"("intakeId", "target", "reviewedVersion");
