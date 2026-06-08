CREATE TABLE IF NOT EXISTS "Tradition" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "alternateNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "shortDescription" TEXT,
  "longIntroductionMarkdown" TEXT,
  "status" "ContentStatus" NOT NULL DEFAULT 'draft',
  "founderSaintId" TEXT,
  "parentTraditionId" TEXT,
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" TIMESTAMP(3),
  CONSTRAINT "Tradition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SaintTradition" (
  "id" TEXT NOT NULL,
  "saintId" TEXT NOT NULL,
  "traditionId" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  CONSTRAINT "SaintTradition_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Tradition_slug_key" ON "Tradition"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "SaintTradition_saintId_traditionId_key" ON "SaintTradition"("saintId", "traditionId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Tradition_parentTraditionId_fkey'
  ) THEN
    ALTER TABLE "Tradition"
      ADD CONSTRAINT "Tradition_parentTraditionId_fkey"
      FOREIGN KEY ("parentTraditionId") REFERENCES "Tradition"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SaintTradition_saintId_fkey'
  ) THEN
    ALTER TABLE "SaintTradition"
      ADD CONSTRAINT "SaintTradition_saintId_fkey"
      FOREIGN KEY ("saintId") REFERENCES "Saint"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SaintTradition_traditionId_fkey'
  ) THEN
    ALTER TABLE "SaintTradition"
      ADD CONSTRAINT "SaintTradition_traditionId_fkey"
      FOREIGN KEY ("traditionId") REFERENCES "Tradition"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
