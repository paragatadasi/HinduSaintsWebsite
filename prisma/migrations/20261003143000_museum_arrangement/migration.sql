CREATE TABLE "MuseumArrangement" (
 "museumId" TEXT NOT NULL, "placementId" TEXT NOT NULL, "proposalRevision" TEXT NOT NULL,
 "status" TEXT NOT NULL CHECK ("status" IN ('Proposed','Planned','Implemented')),
 "vitrine" TEXT, "shelf" TEXT, "confirmedAt" TIMESTAMP(3), "confirmedById" TEXT,
 "inventoryAcknowledged" BOOLEAN NOT NULL DEFAULT false, "version" INTEGER NOT NULL DEFAULT 1,
 "updatedById" TEXT NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "MuseumArrangement_pkey" PRIMARY KEY ("museumId","placementId"),
 CONSTRAINT "MuseumArrangement_destination" CHECK ("status" <> 'Planned' OR length(trim("vitrine")) > 0 AND "vitrine" IS NOT NULL),
 CONSTRAINT "MuseumArrangement_attestation" CHECK ("status" <> 'Implemented' OR ("confirmedAt" IS NOT NULL AND "confirmedById" IS NOT NULL AND "inventoryAcknowledged"))
);
