CREATE TYPE "MuseumLocationKind" AS ENUM ('room','vitrine','shelf','storage','other');
CREATE TYPE "CollectionReviewStatus" AS ENUM ('needs_review','verified','archived');
CREATE TABLE "Museum" (
 "id" TEXT PRIMARY KEY, "slug" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL,
 "archivedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "MuseumLocation" (
 "id" TEXT PRIMARY KEY, "museumId" TEXT NOT NULL REFERENCES "Museum"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "code" TEXT NOT NULL, "label" TEXT NOT NULL, "kind" "MuseumLocationKind" NOT NULL, "room" TEXT,
 "archivedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "MuseumLocation_museumId_code_key" ON "MuseumLocation"("museumId","code");
CREATE TABLE "MuseumCollectionItem" (
 "id" TEXT PRIMARY KEY, "catalogMuseumId" TEXT NOT NULL REFERENCES "Museum"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "inventoryCode" TEXT, "label" TEXT NOT NULL, "description" TEXT,
 "status" "CollectionReviewStatus" NOT NULL DEFAULT 'needs_review', "version" INTEGER NOT NULL DEFAULT 0,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "MuseumCollectionItem_catalogMuseumId_inventoryCode_key" ON "MuseumCollectionItem"("catalogMuseumId","inventoryCode");
CREATE TABLE "MuseumItemSaint" (
 "itemId" TEXT NOT NULL REFERENCES "MuseumCollectionItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "saintId" TEXT NOT NULL REFERENCES "Saint"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 PRIMARY KEY ("itemId","saintId")
);
CREATE INDEX "MuseumItemSaint_saintId_idx" ON "MuseumItemSaint"("saintId");
CREATE TABLE "MuseumItemPlacement" (
 "id" TEXT PRIMARY KEY, "itemId" TEXT NOT NULL REFERENCES "MuseumCollectionItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "locationId" TEXT NOT NULL REFERENCES "MuseumLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "endedAt" TIMESTAMP(3), "note" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "MuseumItemPlacement_valid_period" CHECK ("endedAt" IS NULL OR "endedAt" >= "startedAt")
);
CREATE INDEX "MuseumItemPlacement_itemId_endedAt_idx" ON "MuseumItemPlacement"("itemId","endedAt");
CREATE INDEX "MuseumItemPlacement_locationId_endedAt_idx" ON "MuseumItemPlacement"("locationId","endedAt");
CREATE UNIQUE INDEX "MuseumItemPlacement_one_current" ON "MuseumItemPlacement"("itemId") WHERE "endedAt" IS NULL;
CREATE TABLE "MuseumCollectionImport" (
 "id" TEXT PRIMARY KEY, "museumId" TEXT NOT NULL REFERENCES "Museum"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "sourceKey" TEXT NOT NULL, "fingerprint" TEXT NOT NULL, "rawJson" JSONB NOT NULL, "normalizedJson" JSONB NOT NULL,
 "itemId" TEXT REFERENCES "MuseumCollectionItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "status" TEXT NOT NULL DEFAULT 'pending', "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "reviewedAt" TIMESTAMP(3), "reviewedById" TEXT
);
CREATE UNIQUE INDEX "MuseumCollectionImport_museumId_sourceKey_fingerprint_key" ON "MuseumCollectionImport"("museumId","sourceKey","fingerprint");
CREATE INDEX "MuseumCollectionImport_museumId_status_idx" ON "MuseumCollectionImport"("museumId","status");
-- Register known museums only; never infer objects or vitrine assignments from proposals.
INSERT INTO "Museum" ("id","slug","name","updatedAt") VALUES
 ('museum-spn','spn','Shree Peetha Nilaya',CURRENT_TIMESTAMP),
 ('museum-vrindavan','vrindavan','Vrindavan',CURRENT_TIMESTAMP);
