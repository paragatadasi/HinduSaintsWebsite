UPDATE "InstagramItem" SET "status" = 'ignored' WHERE "status" = 'hidden';
UPDATE "InstagramDerivedClaim" SET "status" = 'ignored' WHERE "status" = 'hidden';
UPDATE "InstagramItemSaint" SET "matchStatus" = 'ignored' WHERE "matchStatus" = 'hidden';

ALTER TYPE "MatchStatus" RENAME TO "MatchStatus_old";
CREATE TYPE "MatchStatus" AS ENUM ('imported', 'suggested', 'needs_review', 'matched', 'ignored', 'published');

ALTER TABLE "InstagramItem"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "MatchStatus" USING "status"::text::"MatchStatus",
  ALTER COLUMN "status" SET DEFAULT 'imported';

ALTER TABLE "InstagramDerivedClaim"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "MatchStatus" USING "status"::text::"MatchStatus",
  ALTER COLUMN "status" SET DEFAULT 'suggested';

ALTER TABLE "InstagramItemSaint"
  ALTER COLUMN "matchStatus" DROP DEFAULT,
  ALTER COLUMN "matchStatus" TYPE "MatchStatus" USING "matchStatus"::text::"MatchStatus",
  ALTER COLUMN "matchStatus" SET DEFAULT 'suggested';

DROP TYPE "MatchStatus_old";
