ALTER TABLE "SiteConfig"
ADD COLUMN "aboutHeroImageId" TEXT,
ADD COLUMN "aboutVisionImageId" TEXT,
ADD COLUMN "aboutStoryImageId" TEXT,
ADD COLUMN "aboutGuruImageId" TEXT;

ALTER TABLE "SiteConfig"
ADD CONSTRAINT "SiteConfig_aboutHeroImageId_fkey" FOREIGN KEY ("aboutHeroImageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT "SiteConfig_aboutVisionImageId_fkey" FOREIGN KEY ("aboutVisionImageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT "SiteConfig_aboutStoryImageId_fkey" FOREIGN KEY ("aboutStoryImageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT "SiteConfig_aboutGuruImageId_fkey" FOREIGN KEY ("aboutGuruImageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
