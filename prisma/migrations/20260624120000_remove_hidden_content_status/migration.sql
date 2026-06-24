UPDATE "Saint" SET "status" = 'archived' WHERE "status"::text = 'hidden';
UPDATE "Tradition" SET "status" = 'archived' WHERE "status"::text = 'hidden';
UPDATE "Biography" SET "status" = 'archived' WHERE "status"::text = 'hidden';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContentStatus')
    AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContentStatus_old')
    AND EXISTS (
      SELECT 1
      FROM pg_enum
      WHERE enumtypid = '"ContentStatus"'::regtype
        AND enumlabel = 'hidden'
    ) THEN
    ALTER TYPE "ContentStatus" RENAME TO "ContentStatus_old";
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContentStatus') THEN
    CREATE TYPE "ContentStatus" AS ENUM ('draft', 'needs_review', 'published', 'archived');
  END IF;
END $$;

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

DO $$
BEGIN
  IF to_regclass('"Sampradaya"') IS NOT NULL AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'Sampradaya'
      AND column_name = 'status'
  ) THEN
    UPDATE "Sampradaya" SET "status" = 'archived' WHERE "status"::text = 'hidden';
    ALTER TABLE "Sampradaya"
      ALTER COLUMN "status" DROP DEFAULT,
      ALTER COLUMN "status" TYPE "ContentStatus" USING "status"::text::"ContentStatus",
      ALTER COLUMN "status" SET DEFAULT 'draft';
  END IF;
END $$;

DROP TYPE IF EXISTS "ContentStatus_old";
