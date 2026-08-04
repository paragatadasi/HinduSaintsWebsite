CREATE TYPE "UserRole_new" AS ENUM ('site_admin', 'data_admin', 'editor', 'contributor', 'curator', 'translator');

ALTER TABLE "User" ADD COLUMN "roles" "UserRole_new"[] NOT NULL DEFAULT ARRAY['contributor']::"UserRole_new"[];
ALTER TABLE "User" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

UPDATE "User"
SET "roles" = CASE "role"::text
  WHEN 'admin' THEN ARRAY['site_admin']::"UserRole_new"[]
  WHEN 'editor' THEN ARRAY['editor']::"UserRole_new"[]
  ELSE ARRAY['contributor']::"UserRole_new"[]
END;

ALTER TABLE "User" DROP COLUMN "role";
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
