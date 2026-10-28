CREATE TABLE "MuseumCompanionShelf" (
  "museumId" TEXT NOT NULL, "sourceId" TEXT NOT NULL, "saintId" TEXT,
  "vitrine" TEXT NOT NULL, "shelf" TEXT NOT NULL, "physicalVersion" INTEGER NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1, "updatedAt" TIMESTAMP(3) NOT NULL, "updatedById" TEXT NOT NULL,
  CONSTRAINT "MuseumCompanionShelf_pkey" PRIMARY KEY ("museumId", "sourceId"),
  CONSTRAINT "MuseumCompanionShelf_versions_check" CHECK ("physicalVersion" >= 0 AND "version" >= 1)
);
CREATE TABLE "MuseumCompanionTask" (
  "id" TEXT NOT NULL, "museumId" TEXT NOT NULL, "sourceId" TEXT NOT NULL, "saintId" TEXT,
  "title" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'open', "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "createdById" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL, "completedAt" TIMESTAMP(3), "updatedById" TEXT NOT NULL,
  CONSTRAINT "MuseumCompanionTask_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MuseumCompanionTask_status_check" CHECK ("status" IN ('open','completed')),
  CONSTRAINT "MuseumCompanionTask_version_check" CHECK ("version" >= 1)
);
CREATE INDEX "MuseumCompanionTask_museumId_sourceId_status_idx" ON "MuseumCompanionTask"("museumId", "sourceId", "status");
