-- Durable review revisions sit between transient autosave drafts and live public content.
CREATE TABLE "EditorialRevision" (
    "id" TEXT NOT NULL,
    "entityType" "AdminEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "activeKey" TEXT,
    "payload" JSONB NOT NULL,
    "basePayload" JSONB NOT NULL,
    "baseVersion" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "publishedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditorialRevision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EditorialRevision_activeKey_key" ON "EditorialRevision"("activeKey");
CREATE INDEX "EditorialRevision_entityType_entityId_section_updatedAt_idx" ON "EditorialRevision"("entityType", "entityId", "section", "updatedAt");
CREATE INDEX "EditorialRevision_status_submittedAt_idx" ON "EditorialRevision"("status", "submittedAt");

ALTER TABLE "EditorialRevision" ADD CONSTRAINT "EditorialRevision_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EditorialRevision" ADD CONSTRAINT "EditorialRevision_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EditorialRevision" ADD CONSTRAINT "EditorialRevision_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EditorialRevision" ADD CONSTRAINT "EditorialRevision_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
