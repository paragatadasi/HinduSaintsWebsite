ALTER TABLE "User"
ALTER COLUMN "roles" SET DEFAULT ARRAY['fact_checker']::"UserRole"[];

UPDATE "User"
SET "roles" = (
  SELECT array_agg(deduplicated."role" ORDER BY deduplicated."firstPosition")
  FROM (
    SELECT item."role", min(item."position") AS "firstPosition"
    FROM unnest(array_replace("roles", 'contributor'::"UserRole", 'fact_checker'::"UserRole"))
      WITH ORDINALITY AS item("role", "position")
    GROUP BY item."role"
  ) AS deduplicated
)
WHERE "roles" @> ARRAY['contributor']::"UserRole"[];
