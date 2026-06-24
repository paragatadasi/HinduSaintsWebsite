UPDATE "Saint" SET "status" = 'archived' WHERE "status" = 'hidden';
UPDATE "Tradition" SET "status" = 'archived' WHERE "status" = 'hidden';
UPDATE "Biography" SET "status" = 'archived' WHERE "status" = 'hidden';

ALTER TYPE "ContentStatus" RENAME TO "ContentStatus_old";
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'needs_review', 'published', 'archived');

ALTER TABLE "Saint"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "ContentStatus" USING "status"::text::"ContentStatus",
  ALTER COLUMN "status" SET DEFAULT 'draft';

ALTER TABLE "Tradition"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "ContentStatus" USING "status"::text::"ContentStatus",
  ALTER COLUMN "status" SET DEFAULT 'draft';

ALTER TABLE "Biography"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "ContentStatus" USING "status"::text::"ContentStatus",
  ALTER COLUMN "status" SET DEFAULT 'draft';

DROP TYPE "ContentStatus_old";
