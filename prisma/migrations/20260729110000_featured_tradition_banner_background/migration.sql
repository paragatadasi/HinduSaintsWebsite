ALTER TABLE "HomePageConfig"
ADD COLUMN "featuredTraditionBannerImageId" TEXT,
ADD COLUMN "featuredTraditionBannerFocalX" DOUBLE PRECISION NOT NULL DEFAULT 50,
ADD COLUMN "featuredTraditionBannerFocalY" DOUBLE PRECISION NOT NULL DEFAULT 50,
ADD COLUMN "featuredTraditionBannerFocalWidth" DOUBLE PRECISION NOT NULL DEFAULT 60,
ADD COLUMN "featuredTraditionBannerFocalHeight" DOUBLE PRECISION NOT NULL DEFAULT 60;

ALTER TABLE "HomePageConfig"
ADD CONSTRAINT "HomePageConfig_featuredTraditionBannerImageId_fkey"
FOREIGN KEY ("featuredTraditionBannerImageId") REFERENCES "MediaAsset"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
