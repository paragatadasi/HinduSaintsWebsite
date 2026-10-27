CREATE TABLE "MuseumMoveSession" (
 "id" TEXT NOT NULL PRIMARY KEY, "museumId" TEXT NOT NULL, "proposalVersion" TEXT NOT NULL,
 "snapshot" JSONB NOT NULL, "startingSnapshot" JSONB NOT NULL, "tables" JSONB NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'active', "version" INTEGER NOT NULL DEFAULT 1,
 "clientRequestId" TEXT NOT NULL, "createdById" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "MuseumMoveSession_museumId_clientRequestId_key" ON "MuseumMoveSession"("museumId","clientRequestId");
CREATE UNIQUE INDEX "MuseumMoveSession_one_active_per_museum" ON "MuseumMoveSession"("museumId") WHERE "status"='active';
CREATE INDEX "MuseumMoveSession_museumId_status_createdAt_idx" ON "MuseumMoveSession"("museumId","status","createdAt");
CREATE TABLE "MuseumMoveCurrentLocation" (
 "museumId" TEXT NOT NULL, "sourceId" TEXT NOT NULL, "location" JSONB NOT NULL,
 "version" INTEGER NOT NULL DEFAULT 1, "confirmedAt" TIMESTAMP(3) NOT NULL, "confirmedById" TEXT NOT NULL,
 CONSTRAINT "MuseumMoveCurrentLocation_pkey" PRIMARY KEY ("museumId","sourceId")
);
CREATE TABLE "MuseumMoveSessionEvent" (
 "id" TEXT NOT NULL PRIMARY KEY, "sessionId" TEXT NOT NULL, "clientRequestId" TEXT NOT NULL,
 "fingerprint" TEXT NOT NULL, "action" TEXT NOT NULL, "beforeJson" JSONB NOT NULL, "afterJson" JSONB NOT NULL,
 "actorId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "MuseumMoveSessionEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MuseumMoveSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MuseumMoveSessionEvent_sessionId_clientRequestId_key" ON "MuseumMoveSessionEvent"("sessionId","clientRequestId");
CREATE INDEX "MuseumMoveSessionEvent_sessionId_createdAt_idx" ON "MuseumMoveSessionEvent"("sessionId","createdAt");
