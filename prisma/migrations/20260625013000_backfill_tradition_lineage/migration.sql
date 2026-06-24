INSERT INTO "TraditionLineageSaint" (
  "id",
  "traditionId",
  "saintId",
  "sortOrder",
  "roleLabel",
  "parentSaintId"
)
SELECT
  'lineage_' || substr(md5(st."traditionId" || ':' || st."saintId"), 1, 24),
  st."traditionId",
  st."saintId",
  row_number() OVER (
    PARTITION BY st."traditionId"
    ORDER BY
      CASE WHEN t."founderSaintId" = st."saintId" THEN 0 ELSE 1 END,
      s."displayName" ASC
  ) - 1,
  NULL,
  guru."toSaintId"
FROM "SaintTradition" st
JOIN "Tradition" t ON t."id" = st."traditionId"
JOIN "Saint" s ON s."id" = st."saintId"
LEFT JOIN LATERAL (
  SELECT sr."toSaintId"
  FROM "SaintRelationship" sr
  JOIN "SaintTradition" guru_st
    ON guru_st."traditionId" = st."traditionId"
   AND guru_st."saintId" = sr."toSaintId"
  WHERE sr."fromSaintId" = st."saintId"
    AND sr."relationshipType" = 'guru'
  ORDER BY sr."confidence" DESC, sr."id" ASC
  LIMIT 1
) guru ON true
ON CONFLICT ("traditionId", "saintId") DO NOTHING;
