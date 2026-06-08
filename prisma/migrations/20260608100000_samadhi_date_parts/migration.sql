-- AlterTable
ALTER TABLE "Saint"
ADD COLUMN "birthDateRaw" TEXT,
ADD COLUMN "birthMonth" INTEGER,
ADD COLUMN "birthDay" INTEGER,
ADD COLUMN "birthDatePrecision" TEXT,
ADD COLUMN "samadhiDateRaw" TEXT,
ADD COLUMN "samadhiYear" INTEGER,
ADD COLUMN "samadhiMonth" INTEGER,
ADD COLUMN "samadhiDay" INTEGER,
ADD COLUMN "samadhiDatePrecision" TEXT;

-- Preserve existing death-year data under the domain-specific samadhi field.
UPDATE "Saint"
SET "samadhiYear" = "deathYear"
WHERE "deathYear" IS NOT NULL;

-- AlterTable
ALTER TABLE "Saint"
DROP COLUMN "deathYear",
DROP COLUMN "datePrecision";
