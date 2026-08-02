CREATE TABLE "HomeFeaturedTraditionPlacement" (
    "id" TEXT NOT NULL,
    "homePageConfigId" TEXT NOT NULL,
    "traditionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "bannerImageId" TEXT,
    "focalX" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "focalY" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "focalWidth" DOUBLE PRECISION NOT NULL DEFAULT 60,
    "focalHeight" DOUBLE PRECISION NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeFeaturedTraditionPlacement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HomeFeaturedTraditionPlacement_homePageConfigId_traditionId_key"
ON "HomeFeaturedTraditionPlacement"("homePageConfigId", "traditionId");

CREATE UNIQUE INDEX "HomeFeaturedTraditionPlacement_homePageConfigId_sortOrder_key"
ON "HomeFeaturedTraditionPlacement"("homePageConfigId", "sortOrder");

CREATE INDEX "HomeFeaturedTraditionPlacement_traditionId_idx"
ON "HomeFeaturedTraditionPlacement"("traditionId");

CREATE INDEX "HomeFeaturedTraditionPlacement_bannerImageId_idx"
ON "HomeFeaturedTraditionPlacement"("bannerImageId");

ALTER TABLE "HomeFeaturedTraditionPlacement"
ADD CONSTRAINT "HomeFeaturedTraditionPlacement_homePageConfigId_fkey"
FOREIGN KEY ("homePageConfigId") REFERENCES "HomePageConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HomeFeaturedTraditionPlacement"
ADD CONSTRAINT "HomeFeaturedTraditionPlacement_traditionId_fkey"
FOREIGN KEY ("traditionId") REFERENCES "Tradition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HomeFeaturedTraditionPlacement"
ADD CONSTRAINT "HomeFeaturedTraditionPlacement_bannerImageId_fkey"
FOREIGN KEY ("bannerImageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "HomeFeaturedTraditionPlacement" (
    "id",
    "homePageConfigId",
    "traditionId",
    "sortOrder",
    "bannerImageId",
    "focalX",
    "focalY",
    "focalWidth",
    "focalHeight",
    "updatedAt"
)
SELECT
    CONCAT('home-featured-tradition-', placement.ordinality),
    config."id",
    placement."traditionId",
    placement.ordinality - 1,
    CASE WHEN placement.ordinality = 1 THEN config."featuredTraditionBannerImageId" ELSE NULL END,
    CASE WHEN placement.ordinality = 1 THEN config."featuredTraditionBannerFocalX" ELSE 50 END,
    CASE WHEN placement.ordinality = 1 THEN config."featuredTraditionBannerFocalY" ELSE 50 END,
    CASE WHEN placement.ordinality = 1 THEN config."featuredTraditionBannerFocalWidth" ELSE 60 END,
    CASE WHEN placement.ordinality = 1 THEN config."featuredTraditionBannerFocalHeight" ELSE 60 END,
    CURRENT_TIMESTAMP
FROM "HomePageConfig" config
CROSS JOIN LATERAL unnest(config."featuredTraditionIds") WITH ORDINALITY AS placement("traditionId", ordinality)
WHERE placement.ordinality <= 5;
