CREATE TABLE "TraditionScripturalBasis" (
  "id" TEXT NOT NULL,
  "traditionId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sourceId" TEXT,
  "url" TEXT,
  "note" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "TraditionScripturalBasis_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TraditionScripturalBasis_traditionId_sortOrder_idx" ON "TraditionScripturalBasis"("traditionId", "sortOrder");
CREATE INDEX "TraditionScripturalBasis_sourceId_idx" ON "TraditionScripturalBasis"("sourceId");

ALTER TABLE "TraditionScripturalBasis"
  ADD CONSTRAINT "TraditionScripturalBasis_traditionId_fkey" FOREIGN KEY ("traditionId") REFERENCES "Tradition"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "TraditionScripturalBasis_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;
