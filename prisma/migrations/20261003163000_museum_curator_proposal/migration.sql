CREATE TABLE "MuseumCuratorProposal" (
 "museumId" TEXT NOT NULL, "saintId" TEXT NOT NULL, "section" TEXT NOT NULL,
 "tier" TEXT NOT NULL CHECK ("tier" IN ('Featured','Secondary','Tertiary')),
 "groupKey" TEXT NOT NULL DEFAULT '', "groupLabel" TEXT NOT NULL DEFAULT '',
 "version" INTEGER NOT NULL DEFAULT 1, "updatedById" TEXT NOT NULL,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "MuseumCuratorProposal_pkey" PRIMARY KEY ("museumId","saintId")
);
CREATE INDEX "MuseumCuratorProposal_museumId_groupKey_idx" ON "MuseumCuratorProposal"("museumId","groupKey");
