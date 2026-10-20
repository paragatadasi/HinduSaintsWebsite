ALTER TABLE "SaintPlace" ADD COLUMN "keyLocalityOrder" INTEGER;
ALTER TABLE "SaintPlace" ADD CONSTRAINT "SaintPlace_keyLocalityOrder_check" CHECK ("keyLocalityOrder" BETWEEN 1 AND 3);
CREATE INDEX "SaintPlace_saint_key_locality_order" ON "SaintPlace" ("saintId", "keyLocalityOrder");
