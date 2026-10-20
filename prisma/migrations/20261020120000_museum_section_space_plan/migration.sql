CREATE TABLE "MuseumSectionSpacePlan" (
 "museumId" TEXT NOT NULL,
 "section" TEXT NOT NULL,
 "vitrines" TEXT[] NOT NULL,
 "flexiblePlacements" JSONB NOT NULL DEFAULT '[]',
 "version" INTEGER NOT NULL DEFAULT 1,
 "updatedById" TEXT NOT NULL,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "MuseumSectionSpacePlan_pkey" PRIMARY KEY ("museumId", "section")
);
