CREATE TABLE "MuseumFamilyProposalMove" (
    "familyKey" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedById" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MuseumFamilyProposalMove_pkey" PRIMARY KEY ("familyKey")
);
