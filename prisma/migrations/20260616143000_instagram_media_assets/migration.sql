CREATE TABLE "InstagramMediaAsset" (
    "id" TEXT NOT NULL,
    "instagramItemId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "cachedUrl" TEXT NOT NULL,
    "storageKey" TEXT,
    "mediaType" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramMediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InstagramMediaAsset_instagramItemId_sortOrder_key" ON "InstagramMediaAsset"("instagramItemId", "sortOrder");
CREATE INDEX "InstagramMediaAsset_instagramItemId_isCover_idx" ON "InstagramMediaAsset"("instagramItemId", "isCover");

ALTER TABLE "InstagramMediaAsset" ADD CONSTRAINT "InstagramMediaAsset_instagramItemId_fkey" FOREIGN KEY ("instagramItemId") REFERENCES "InstagramItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
