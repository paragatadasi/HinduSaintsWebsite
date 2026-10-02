CREATE TABLE "SaintVisitPlace" (
 "id" TEXT NOT NULL, "saintId" TEXT NOT NULL, "proposalId" TEXT NOT NULL,
 "sourceKey" TEXT NOT NULL, "destinationName" TEXT NOT NULL, "kind" TEXT NOT NULL,
 "locality" TEXT NOT NULL, "region" TEXT, "country" TEXT NOT NULL,
 "localityPlaceId" TEXT, "acceptedById" TEXT NOT NULL, "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "SaintVisitPlace_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "SaintVisitPlace_kind_check" CHECK ("kind" IN ('ashram','temple','samadhi','locality','house','other'))
);
CREATE UNIQUE INDEX "SaintVisitPlace_proposalId_key" ON "SaintVisitPlace"("proposalId");
CREATE UNIQUE INDEX "SaintVisitPlace_sourceKey_key" ON "SaintVisitPlace"("sourceKey");
CREATE INDEX "SaintVisitPlace_saintId_acceptedAt_idx" ON "SaintVisitPlace"("saintId", "acceptedAt");
ALTER TABLE "SaintVisitPlace" ADD CONSTRAINT "SaintVisitPlace_saintId_fkey" FOREIGN KEY ("saintId") REFERENCES "Saint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SaintVisitPlace" ADD CONSTRAINT "SaintVisitPlace_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "VisitPlaceProposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaintVisitPlace" ADD CONSTRAINT "SaintVisitPlace_localityPlaceId_fkey" FOREIGN KEY ("localityPlaceId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;
