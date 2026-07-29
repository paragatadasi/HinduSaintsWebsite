ALTER TABLE "SiteConfig"
ADD COLUMN "aboutEyebrow" TEXT,
ADD COLUMN "aboutTitle" TEXT,
ADD COLUMN "aboutIntroduction" TEXT,
ADD COLUMN "aboutSectionTitles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "aboutSectionBodies" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
