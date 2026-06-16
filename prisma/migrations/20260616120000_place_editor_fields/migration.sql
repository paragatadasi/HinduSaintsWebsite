CREATE TYPE "PlaceScope" AS ENUM ('locality', 'state');

ALTER TABLE "Place"
ADD COLUMN "placeScope" "PlaceScope" NOT NULL DEFAULT 'locality',
ADD COLUMN "parentStateId" TEXT,
ADD COLUMN "overviewMarkdown" TEXT;

ALTER TABLE "Place"
ADD CONSTRAINT "Place_parentStateId_fkey"
FOREIGN KEY ("parentStateId") REFERENCES "Place"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Place_placeScope_idx" ON "Place"("placeScope");
CREATE INDEX "Place_parentStateId_idx" ON "Place"("parentStateId");
