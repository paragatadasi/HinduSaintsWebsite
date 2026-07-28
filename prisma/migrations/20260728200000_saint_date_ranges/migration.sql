ALTER TABLE "Saint"
ADD COLUMN "birthYearEnd" INTEGER,
ADD COLUMN "samadhiYearEnd" INTEGER;

WITH parsed_birth_ranges AS (
  SELECT
    "id",
    regexp_match(
      trim("birthDateRaw"),
      '^(?:(?:c(?:irca)?|ca)\.?[[:space:]]+)?(1[0-9]{3}|20[0-9]{2})[[:space:]]*[-–—][[:space:]]*(1[0-9]{3}|20[0-9]{2})$',
      'i'
    ) AS years
  FROM "Saint"
  WHERE "birthDateRaw" IS NOT NULL
)
UPDATE "Saint"
SET
  "birthYear" = (parsed_birth_ranges.years[1])::INTEGER,
  "birthYearEnd" = (parsed_birth_ranges.years[2])::INTEGER,
  "birthMonth" = NULL,
  "birthDay" = NULL,
  "birthDatePrecision" = 'range'
FROM parsed_birth_ranges
WHERE
  "Saint"."id" = parsed_birth_ranges."id"
  AND parsed_birth_ranges.years IS NOT NULL
  AND (parsed_birth_ranges.years[1])::INTEGER <= (parsed_birth_ranges.years[2])::INTEGER;

WITH parsed_samadhi_ranges AS (
  SELECT
    "id",
    regexp_match(
      trim("samadhiDateRaw"),
      '^(?:(?:c(?:irca)?|ca)\.?[[:space:]]+)?(1[0-9]{3}|20[0-9]{2})[[:space:]]*[-–—][[:space:]]*(1[0-9]{3}|20[0-9]{2})$',
      'i'
    ) AS years
  FROM "Saint"
  WHERE "samadhiDateRaw" IS NOT NULL
)
UPDATE "Saint"
SET
  "samadhiYear" = (parsed_samadhi_ranges.years[1])::INTEGER,
  "samadhiYearEnd" = (parsed_samadhi_ranges.years[2])::INTEGER,
  "samadhiMonth" = NULL,
  "samadhiDay" = NULL,
  "samadhiDatePrecision" = 'range'
FROM parsed_samadhi_ranges
WHERE
  "Saint"."id" = parsed_samadhi_ranges."id"
  AND parsed_samadhi_ranges.years IS NOT NULL
  AND (parsed_samadhi_ranges.years[1])::INTEGER <= (parsed_samadhi_ranges.years[2])::INTEGER;

UPDATE "Saint"
SET
  "birthDateRaw" = 'Unknown',
  "birthYear" = NULL,
  "birthYearEnd" = NULL,
  "birthMonth" = NULL,
  "birthDay" = NULL,
  "birthDatePrecision" = 'unknown'
WHERE lower(trim("birthDateRaw")) = 'unknown';

UPDATE "Saint"
SET
  "samadhiDateRaw" = 'Unknown',
  "samadhiYear" = NULL,
  "samadhiYearEnd" = NULL,
  "samadhiMonth" = NULL,
  "samadhiDay" = NULL,
  "samadhiDatePrecision" = 'unknown'
WHERE lower(trim("samadhiDateRaw")) = 'unknown';
