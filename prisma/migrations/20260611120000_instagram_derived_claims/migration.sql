-- CreateEnum
CREATE TYPE "InstagramDerivedClaimType" AS ENUM ('alias', 'birth_date', 'guru', 'place', 'samadhi_date', 'tradition');

-- CreateTable
CREATE TABLE "InstagramDerivedClaim" (
    "id" TEXT NOT NULL,
    "instagramItemId" TEXT NOT NULL,
    "claimType" "InstagramDerivedClaimType" NOT NULL,
    "rawValue" TEXT NOT NULL,
    "normalizedValue" TEXT,
    "targetEntityType" TEXT,
    "targetEntityId" TEXT,
    "sourceField" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'suggested',
    "confidence" "Confidence" NOT NULL DEFAULT 'medium',
    "appliedSaintId" TEXT,
    "appliedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramDerivedClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstagramDerivedClaim_instagramItemId_claimType_idx" ON "InstagramDerivedClaim"("instagramItemId", "claimType");

-- CreateIndex
CREATE INDEX "InstagramDerivedClaim_status_idx" ON "InstagramDerivedClaim"("status");

-- CreateIndex
CREATE INDEX "InstagramDerivedClaim_targetEntityType_targetEntityId_idx" ON "InstagramDerivedClaim"("targetEntityType", "targetEntityId");

-- CreateIndex
CREATE INDEX "InstagramDerivedClaim_appliedSaintId_idx" ON "InstagramDerivedClaim"("appliedSaintId");

-- AddForeignKey
ALTER TABLE "InstagramDerivedClaim" ADD CONSTRAINT "InstagramDerivedClaim_instagramItemId_fkey" FOREIGN KEY ("instagramItemId") REFERENCES "InstagramItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
