ALTER TABLE "HomePageConfig"
ADD COLUMN "quoteSaintId" TEXT;

UPDATE "HomePageConfig" AS config
SET "quoteSaintId" = (
  SELECT saint."id"
  FROM "Saint" AS saint
  WHERE saint."status" = 'published'
    AND (
      LOWER(saint."displayName") = LOWER(config."quoteAttribution")
      OR LOWER(saint."canonicalName") = LOWER(config."quoteAttribution")
    )
  ORDER BY
    CASE
      WHEN LOWER(saint."displayName") = LOWER(config."quoteAttribution") THEN 0
      ELSE 1
    END,
    saint."id"
  LIMIT 1
)
WHERE config."quoteAttribution" IS NOT NULL;

ALTER TABLE "HomePageConfig"
ADD CONSTRAINT "HomePageConfig_quoteSaintId_fkey"
FOREIGN KEY ("quoteSaintId") REFERENCES "Saint"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
