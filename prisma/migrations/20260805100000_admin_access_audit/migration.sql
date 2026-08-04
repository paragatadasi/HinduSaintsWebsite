ALTER TABLE "User" ADD COLUMN "lastSignedInAt" TIMESTAMP(3);

CREATE TABLE "AdminAccessAudit" (
  "id" TEXT NOT NULL,
  "targetUserId" TEXT NOT NULL,
  "actorEmail" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "beforeRoles" "UserRole"[] NOT NULL,
  "afterRoles" "UserRole"[] NOT NULL,
  "beforeActive" BOOLEAN NOT NULL,
  "afterActive" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAccessAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminAccessAudit_targetUserId_createdAt_idx" ON "AdminAccessAudit"("targetUserId", "createdAt");
CREATE INDEX "AdminAccessAudit_createdAt_idx" ON "AdminAccessAudit"("createdAt");
ALTER TABLE "AdminAccessAudit" ADD CONSTRAINT "AdminAccessAudit_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
