CREATE TABLE "HomePageConfig" (
    "id" TEXT NOT NULL DEFAULT 'home',
    "heroEyebrow" TEXT,
    "heroTitle" TEXT,
    "heroBody" TEXT,
    "heroPrimaryLabel" TEXT,
    "heroPrimaryHref" TEXT,
    "heroSecondaryLabel" TEXT,
    "heroSecondaryHref" TEXT,
    "bannerImageId" TEXT,
    "featuredSaintIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "featuredTraditionIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "quoteEyebrow" TEXT,
    "quoteText" TEXT,
    "quoteAttribution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomePageConfig_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "HomePageConfig" ADD CONSTRAINT "HomePageConfig_bannerImageId_fkey" FOREIGN KEY ("bannerImageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
