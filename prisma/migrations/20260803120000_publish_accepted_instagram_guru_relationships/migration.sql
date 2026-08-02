UPDATE "SaintRelationship"
SET "publicVisible" = true,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "relationshipType" = 'guru'
  AND "status" = 'published'
  AND "publicVisible" = false
  AND "notes" LIKE 'Accepted from Instagram first-page biodata:%';
