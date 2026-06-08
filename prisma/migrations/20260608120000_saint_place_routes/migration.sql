-- AlterTable
ALTER TABLE "SaintPlace" ADD COLUMN "routeOrder" INTEGER;
ALTER TABLE "SaintPlace" ADD COLUMN "routeLabel" TEXT;
ALTER TABLE "SaintPlace" ADD COLUMN "routeConfidence" "Confidence";

-- CreateIndex
CREATE INDEX "SaintPlace_saintId_routeOrder_idx" ON "SaintPlace"("saintId", "routeOrder");
