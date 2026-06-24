ALTER TABLE "Tradition"
  ADD COLUMN "historyMarkdown" TEXT,
  ADD COLUMN "foundingAcharyaMarkdown" TEXT,
  ADD COLUMN "keyTeachingsMarkdown" TEXT,
  ADD COLUMN "heroImageId" TEXT,
  ADD COLUMN "founderDisplayName" TEXT,
  ADD COLUMN "origin" TEXT,
  ADD COLUMN "eraLabel" TEXT,
  ADD COLUMN "focus" TEXT,
  ADD COLUMN "originPlaceId" TEXT,
  ADD COLUMN "originPlaceLabel" TEXT;

UPDATE "Tradition"
SET "historyMarkdown" = "longIntroductionMarkdown"
WHERE "historyMarkdown" IS NULL
  AND "longIntroductionMarkdown" IS NOT NULL;

CREATE TABLE "TraditionGalleryImage" (
  "id" TEXT NOT NULL,
  "traditionId" TEXT NOT NULL,
  "mediaAssetId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "publicVisible" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "TraditionGalleryImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TraditionLineageSaint" (
  "id" TEXT NOT NULL,
  "traditionId" TEXT NOT NULL,
  "saintId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "roleLabel" TEXT,
  "parentSaintId" TEXT,
  CONSTRAINT "TraditionLineageSaint_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TraditionRelatedTradition" (
  "id" TEXT NOT NULL,
  "traditionId" TEXT NOT NULL,
  "relatedTraditionId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "label" TEXT,
  CONSTRAINT "TraditionRelatedTradition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TraditionRelatedPlace" (
  "id" TEXT NOT NULL,
  "traditionId" TEXT NOT NULL,
  "placeId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "label" TEXT,
  CONSTRAINT "TraditionRelatedPlace_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TraditionGalleryImage_traditionId_mediaAssetId_key" ON "TraditionGalleryImage"("traditionId", "mediaAssetId");
CREATE INDEX "TraditionGalleryImage_traditionId_sortOrder_idx" ON "TraditionGalleryImage"("traditionId", "sortOrder");
CREATE UNIQUE INDEX "TraditionLineageSaint_traditionId_saintId_key" ON "TraditionLineageSaint"("traditionId", "saintId");
CREATE INDEX "TraditionLineageSaint_traditionId_sortOrder_idx" ON "TraditionLineageSaint"("traditionId", "sortOrder");
CREATE INDEX "TraditionLineageSaint_parentSaintId_idx" ON "TraditionLineageSaint"("parentSaintId");
CREATE UNIQUE INDEX "TraditionRelatedTradition_traditionId_relatedTraditionId_key" ON "TraditionRelatedTradition"("traditionId", "relatedTraditionId");
CREATE INDEX "TraditionRelatedTradition_traditionId_sortOrder_idx" ON "TraditionRelatedTradition"("traditionId", "sortOrder");
CREATE UNIQUE INDEX "TraditionRelatedPlace_traditionId_placeId_key" ON "TraditionRelatedPlace"("traditionId", "placeId");
CREATE INDEX "TraditionRelatedPlace_traditionId_sortOrder_idx" ON "TraditionRelatedPlace"("traditionId", "sortOrder");

ALTER TABLE "Tradition"
  ADD CONSTRAINT "Tradition_heroImageId_fkey" FOREIGN KEY ("heroImageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Tradition_founderSaintId_fkey" FOREIGN KEY ("founderSaintId") REFERENCES "Saint"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Tradition_originPlaceId_fkey" FOREIGN KEY ("originPlaceId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TraditionGalleryImage"
  ADD CONSTRAINT "TraditionGalleryImage_traditionId_fkey" FOREIGN KEY ("traditionId") REFERENCES "Tradition"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "TraditionGalleryImage_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TraditionLineageSaint"
  ADD CONSTRAINT "TraditionLineageSaint_traditionId_fkey" FOREIGN KEY ("traditionId") REFERENCES "Tradition"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "TraditionLineageSaint_saintId_fkey" FOREIGN KEY ("saintId") REFERENCES "Saint"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "TraditionLineageSaint_parentSaintId_fkey" FOREIGN KEY ("parentSaintId") REFERENCES "Saint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TraditionRelatedTradition"
  ADD CONSTRAINT "TraditionRelatedTradition_traditionId_fkey" FOREIGN KEY ("traditionId") REFERENCES "Tradition"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "TraditionRelatedTradition_relatedTraditionId_fkey" FOREIGN KEY ("relatedTraditionId") REFERENCES "Tradition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TraditionRelatedPlace"
  ADD CONSTRAINT "TraditionRelatedPlace_traditionId_fkey" FOREIGN KEY ("traditionId") REFERENCES "Tradition"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "TraditionRelatedPlace_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
