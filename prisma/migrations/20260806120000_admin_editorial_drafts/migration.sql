CREATE TABLE "AdminEditorialDraft" (
    "id" TEXT NOT NULL,
    "entityType" "AdminEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "baseVersion" INTEGER NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminEditorialDraft_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminEditorialDraft_entityType_entityId_section_key"
ON "AdminEditorialDraft"("entityType", "entityId", "section");

CREATE INDEX "AdminEditorialDraft_entityType_entityId_updatedAt_idx"
ON "AdminEditorialDraft"("entityType", "entityId", "updatedAt");

CREATE INDEX "AdminEditorialDraft_updatedById_updatedAt_idx"
ON "AdminEditorialDraft"("updatedById", "updatedAt");

ALTER TABLE "AdminEditorialDraft"
ADD CONSTRAINT "AdminEditorialDraft_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AdminEditorialDraft"
ADD CONSTRAINT "AdminEditorialDraft_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
