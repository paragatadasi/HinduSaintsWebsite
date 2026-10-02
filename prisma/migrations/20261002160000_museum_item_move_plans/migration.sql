CREATE TABLE "MuseumItemMovePlan" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "fromLocationId" TEXT,
  "targetLocationId" TEXT NOT NULL,
  "expectedItemVersion" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'planned',
  "reason" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "resolvedById" TEXT,
  "resolutionNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "MuseumItemMovePlan_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MuseumItemMovePlan_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MuseumCollectionItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MuseumItemMovePlan_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "MuseumLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MuseumItemMovePlan_targetLocationId_fkey" FOREIGN KEY ("targetLocationId") REFERENCES "MuseumLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MuseumItemMovePlan_status_check" CHECK ("status" IN ('planned','completed','cancelled'))
);
CREATE INDEX "MuseumItemMovePlan_itemId_createdAt_idx" ON "MuseumItemMovePlan"("itemId", "createdAt");
CREATE UNIQUE INDEX "MuseumItemMovePlan_one_planned_per_item" ON "MuseumItemMovePlan"("itemId") WHERE "status" = 'planned';
