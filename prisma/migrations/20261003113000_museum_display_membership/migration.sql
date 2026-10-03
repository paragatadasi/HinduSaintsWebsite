CREATE TABLE "MuseumDisplayMembership" (
  "museumId" TEXT NOT NULL,
  "placementId" TEXT NOT NULL,
  "familyKey" TEXT NOT NULL,
  "familyLabel" TEXT NOT NULL,
  "section" TEXT NOT NULL,
  "detached" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 1,
  "updatedById" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MuseumDisplayMembership_pkey" PRIMARY KEY ("museumId", "placementId")
);
CREATE INDEX "MuseumDisplayMembership_museumId_familyKey_detached_idx" ON "MuseumDisplayMembership"("museumId", "familyKey", "detached");
