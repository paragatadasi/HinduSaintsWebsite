-- Distinguish an explicit editorial opt-out from legacy records without a primary flag.
-- Preserve all existing SaintTradition rows and isPrimary values.
ALTER TABLE "Saint" ADD COLUMN "noPrimaryTradition" BOOLEAN NOT NULL DEFAULT false;
