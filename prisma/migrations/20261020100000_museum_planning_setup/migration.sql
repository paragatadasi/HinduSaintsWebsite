CREATE TABLE "MuseumPlanningSetup" (
    "museumId" TEXT NOT NULL,
    "photoVitrines" TEXT[] NOT NULL,
    "photoSaintIds" TEXT[] NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedById" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MuseumPlanningSetup_pkey" PRIMARY KEY ("museumId")
);
