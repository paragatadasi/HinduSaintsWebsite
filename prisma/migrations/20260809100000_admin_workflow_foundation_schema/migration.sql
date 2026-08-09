ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'fact_checker';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'writer';

CREATE TYPE "TeamVisibility" AS ENUM ('private', 'public');
CREATE TYPE "PublicationStatus" AS ENUM ('unpublished', 'published', 'archived');
CREATE TYPE "WorkflowStatus" AS ENUM ('needs_review', 'fact_checked', 'populated', 'polished');

ALTER TABLE "Saint"
ADD COLUMN "teamVisibility" "TeamVisibility" NOT NULL DEFAULT 'private',
ADD COLUMN "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'unpublished',
ADD COLUMN "workflowStatus" "WorkflowStatus" NOT NULL DEFAULT 'needs_review';

ALTER TABLE "Tradition"
ADD COLUMN "teamVisibility" "TeamVisibility" NOT NULL DEFAULT 'private',
ADD COLUMN "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'unpublished',
ADD COLUMN "workflowStatus" "WorkflowStatus" NOT NULL DEFAULT 'needs_review';

ALTER TABLE "Place"
ADD COLUMN "teamVisibility" "TeamVisibility" NOT NULL DEFAULT 'private',
ADD COLUMN "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'unpublished',
ADD COLUMN "workflowStatus" "WorkflowStatus" NOT NULL DEFAULT 'needs_review';

ALTER TABLE "Saint"
ADD CONSTRAINT "Saint_published_requires_public_visibility"
CHECK ("publicationStatus" <> 'published' OR "teamVisibility" = 'public');
ALTER TABLE "Tradition"
ADD CONSTRAINT "Tradition_published_requires_public_visibility"
CHECK ("publicationStatus" <> 'published' OR "teamVisibility" = 'public');
ALTER TABLE "Place"
ADD CONSTRAINT "Place_published_requires_public_visibility"
CHECK ("publicationStatus" <> 'published' OR "teamVisibility" = 'public');

CREATE INDEX "Saint_teamVisibility_publicationStatus_workflowStatus_displayName_idx"
ON "Saint"("teamVisibility", "publicationStatus", "workflowStatus", "displayName");
CREATE INDEX "Tradition_teamVisibility_publicationStatus_workflowStatus_name_idx"
ON "Tradition"("teamVisibility", "publicationStatus", "workflowStatus", "name");
CREATE INDEX "Place_teamVisibility_publicationStatus_workflowStatus_name_idx"
ON "Place"("teamVisibility", "publicationStatus", "workflowStatus", "name");
