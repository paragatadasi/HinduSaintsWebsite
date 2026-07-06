CREATE TYPE "PlaceKind" AS ENUM (
  'country',
  'region',
  'state',
  'district',
  'city',
  'town',
  'village',
  'sacred_site',
  'ashram',
  'temple',
  'monastery',
  'neighborhood',
  'route_area',
  'spiritual_region',
  'locality',
  'unknown'
);

CREATE TYPE "PlaceRelationshipType" AS ENUM (
  'contained_in',
  'part_of',
  'near',
  'associated_region',
  'historical_alias_of',
  'successor_name_of'
);

ALTER TABLE "Place"
ADD COLUMN "placeKind" "PlaceKind" NOT NULL DEFAULT 'locality';

UPDATE "Place"
SET "placeKind" = CASE
  WHEN "placeScope" = 'state' THEN 'state'::"PlaceKind"
  ELSE 'locality'::"PlaceKind"
END;

CREATE TABLE "PlaceRelationship" (
  "id" TEXT NOT NULL,
  "fromPlaceId" TEXT NOT NULL,
  "toPlaceId" TEXT NOT NULL,
  "relationshipType" "PlaceRelationshipType" NOT NULL,
  "confidence" "Confidence" NOT NULL DEFAULT 'high',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PlaceRelationship_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PlaceRelationship" (
  "id",
  "fromPlaceId",
  "toPlaceId",
  "relationshipType",
  "confidence",
  "notes",
  "updatedAt"
)
SELECT
  'place_rel_' || substr(md5("id" || ':' || "parentStateId" || ':contained_in'), 1, 20),
  "id",
  "parentStateId",
  'contained_in'::"PlaceRelationshipType",
  'high'::"Confidence",
  'Backfilled from legacy parentStateId.',
  CURRENT_TIMESTAMP
FROM "Place"
WHERE "parentStateId" IS NOT NULL;

CREATE UNIQUE INDEX "PlaceRelationship_fromPlaceId_toPlaceId_relationshipType_key"
ON "PlaceRelationship"("fromPlaceId", "toPlaceId", "relationshipType");

CREATE INDEX "Place_placeKind_idx" ON "Place"("placeKind");
CREATE INDEX "PlaceRelationship_fromPlaceId_relationshipType_idx"
ON "PlaceRelationship"("fromPlaceId", "relationshipType");
CREATE INDEX "PlaceRelationship_toPlaceId_relationshipType_idx"
ON "PlaceRelationship"("toPlaceId", "relationshipType");

ALTER TABLE "PlaceRelationship"
ADD CONSTRAINT "PlaceRelationship_fromPlaceId_fkey"
FOREIGN KEY ("fromPlaceId") REFERENCES "Place"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlaceRelationship"
ADD CONSTRAINT "PlaceRelationship_toPlaceId_fkey"
FOREIGN KEY ("toPlaceId") REFERENCES "Place"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
