ALTER TABLE "SiteConfig"
  ADD COLUMN "saintsHeroImageId" TEXT,
  ADD COLUMN "traditionsHeroImageId" TEXT,
  ADD COLUMN "mapHeroImageId" TEXT;

ALTER TABLE "SiteConfig" ADD CONSTRAINT "SiteConfig_saintsHeroImageId_fkey" FOREIGN KEY ("saintsHeroImageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SiteConfig" ADD CONSTRAINT "SiteConfig_traditionsHeroImageId_fkey" FOREIGN KEY ("traditionsHeroImageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SiteConfig" ADD CONSTRAINT "SiteConfig_mapHeroImageId_fkey" FOREIGN KEY ("mapHeroImageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
