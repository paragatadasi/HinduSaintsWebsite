CREATE TABLE "MuseumShuffleGuideActionRevision" (
    "guideId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL,
    "clientRequestId" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MuseumShuffleGuideActionRevision_pkey" PRIMARY KEY ("guideId", "actionId", "version")
);

CREATE UNIQUE INDEX "MuseumShuffleGuideActionRevision_clientRequestId_key"
    ON "MuseumShuffleGuideActionRevision"("clientRequestId");
