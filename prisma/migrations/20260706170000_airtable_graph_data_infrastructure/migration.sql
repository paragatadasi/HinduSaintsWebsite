ALTER TYPE "RelationshipType" ADD VALUE IF NOT EXISTS 'partner';
ALTER TYPE "RelationshipType" ADD VALUE IF NOT EXISTS 'incarnation';
ALTER TYPE "RelationshipType" ADD VALUE IF NOT EXISTS 'family';
ALTER TYPE "RelationshipType" ADD VALUE IF NOT EXISTS 'influence';
ALTER TYPE "RelationshipType" ADD VALUE IF NOT EXISTS 'initiator';
ALTER TYPE "RelationshipType" ADD VALUE IF NOT EXISTS 'patron';
ALTER TYPE "RelationshipType" ADD VALUE IF NOT EXISTS 'successor';
ALTER TYPE "RelationshipType" ADD VALUE IF NOT EXISTS 'debate_opponent';
ALTER TYPE "RelationshipType" ADD VALUE IF NOT EXISTS 'untyped';

CREATE TYPE "RelationshipEvidenceStatus" AS ENUM (
  'certain',
  'probable',
  'traditional',
  'disputed',
  'imported',
  'uncategorized'
);

CREATE TYPE "FamilyMemberRole" AS ENUM (
  'head',
  'subgroup_head',
  'member',
  'partner',
  'incarnation',
  'successor',
  'associated'
);

CREATE TYPE "MuseumSectionAssignmentType" AS ENUM (
  'primary',
  'alternative'
);

CREATE TYPE "MuseumSectionTier" AS ENUM (
  'featured',
  'secondary',
  'tertiary'
);

ALTER TABLE "SaintRelationship"
ADD COLUMN "status" "ContentStatus" NOT NULL DEFAULT 'needs_review',
ADD COLUMN "evidenceStatus" "RelationshipEvidenceStatus" NOT NULL DEFAULT 'imported',
ADD COLUMN "publicVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "publicNote" TEXT,
ADD COLUMN "internalNotes" TEXT,
ADD COLUMN "externalRecordId" TEXT,
ADD COLUMN "importJobId" TEXT,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "AirtableImportJob"
ADD COLUMN "relationshipCandidatesCreated" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "relationshipCandidatesExisting" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "relationshipCandidatesUnresolved" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "placeRelationshipsCreated" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "placeRelationshipsExisting" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "familyGroupsCreated" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "familyMembershipsCreated" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "duplicateCandidatesCreated" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "museumSectionAssignmentsCreated" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "SaintRelationshipSource" (
  "id" TEXT NOT NULL,
  "relationshipId" TEXT NOT NULL,
  "sourceId" TEXT,
  "externalRecordId" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SaintRelationshipSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SaintFamily" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "descriptionMarkdown" TEXT,
  "status" "ContentStatus" NOT NULL DEFAULT 'needs_review',
  "publicVisible" BOOLEAN NOT NULL DEFAULT false,
  "graphVersion" TEXT,
  "computedFrom" TEXT,
  "sourceExternalId" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SaintFamily_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SaintFamilyMember" (
  "id" TEXT NOT NULL,
  "familyId" TEXT NOT NULL,
  "saintId" TEXT NOT NULL,
  "role" "FamilyMemberRole" NOT NULL DEFAULT 'member',
  "tier" "MuseumSectionTier",
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "externalRecordId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SaintFamilyMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DuplicateCandidate" (
  "id" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "candidateEntityId" TEXT,
  "sourceType" TEXT,
  "sourceExternalId" TEXT,
  "confidence" "Confidence" NOT NULL DEFAULT 'medium',
  "evidenceJson" JSONB,
  "message" TEXT,
  "status" "ReconciliationStatus" NOT NULL DEFAULT 'open',
  "reconciliationIssueId" TEXT,
  "reviewedById" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "resolutionNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DuplicateCandidate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MuseumSection" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "descriptionMarkdown" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "status" "ContentStatus" NOT NULL DEFAULT 'needs_review',
  "publicVisible" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MuseumSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SaintMuseumSection" (
  "id" TEXT NOT NULL,
  "saintId" TEXT NOT NULL,
  "museumSectionId" TEXT NOT NULL,
  "assignmentType" "MuseumSectionAssignmentType" NOT NULL DEFAULT 'primary',
  "tier" "MuseumSectionTier" NOT NULL DEFAULT 'secondary',
  "confidence" "Confidence" NOT NULL DEFAULT 'medium',
  "rationale" TEXT,
  "internalPlacementNote" TEXT,
  "status" "ContentStatus" NOT NULL DEFAULT 'needs_review',
  "externalRecordId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SaintMuseumSection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SaintRelationship_fromSaintId_relationshipType_status_idx"
ON "SaintRelationship"("fromSaintId", "relationshipType", "status");

CREATE INDEX "SaintRelationship_toSaintId_relationshipType_status_idx"
ON "SaintRelationship"("toSaintId", "relationshipType", "status");

CREATE INDEX "SaintRelationship_status_publicVisible_idx"
ON "SaintRelationship"("status", "publicVisible");

CREATE INDEX "SaintRelationship_externalRecordId_idx"
ON "SaintRelationship"("externalRecordId");

CREATE INDEX "SaintRelationship_importJobId_idx"
ON "SaintRelationship"("importJobId");

CREATE UNIQUE INDEX "SaintRelationshipSource_relationshipId_sourceId_key"
ON "SaintRelationshipSource"("relationshipId", "sourceId");

CREATE UNIQUE INDEX "SaintRelationshipSource_relationshipId_externalRecordId_key"
ON "SaintRelationshipSource"("relationshipId", "externalRecordId");

CREATE INDEX "SaintRelationshipSource_sourceId_idx"
ON "SaintRelationshipSource"("sourceId");

CREATE INDEX "SaintRelationshipSource_externalRecordId_idx"
ON "SaintRelationshipSource"("externalRecordId");

CREATE UNIQUE INDEX "SaintFamily_slug_key" ON "SaintFamily"("slug");

CREATE INDEX "SaintFamily_status_publicVisible_idx"
ON "SaintFamily"("status", "publicVisible");

CREATE UNIQUE INDEX "SaintFamilyMember_familyId_saintId_key"
ON "SaintFamilyMember"("familyId", "saintId");

CREATE INDEX "SaintFamilyMember_saintId_idx"
ON "SaintFamilyMember"("saintId");

CREATE INDEX "SaintFamilyMember_familyId_sortOrder_idx"
ON "SaintFamilyMember"("familyId", "sortOrder");

CREATE INDEX "SaintFamilyMember_externalRecordId_idx"
ON "SaintFamilyMember"("externalRecordId");

CREATE UNIQUE INDEX "DuplicateCandidate_entityType_entityId_candidateEntityId_sourceType_sourceExternalId_key"
ON "DuplicateCandidate"("entityType", "entityId", "candidateEntityId", "sourceType", "sourceExternalId");

CREATE INDEX "DuplicateCandidate_entityType_entityId_status_idx"
ON "DuplicateCandidate"("entityType", "entityId", "status");

CREATE INDEX "DuplicateCandidate_candidateEntityId_idx"
ON "DuplicateCandidate"("candidateEntityId");

CREATE INDEX "DuplicateCandidate_reconciliationIssueId_idx"
ON "DuplicateCandidate"("reconciliationIssueId");

CREATE UNIQUE INDEX "MuseumSection_slug_key" ON "MuseumSection"("slug");

CREATE INDEX "MuseumSection_status_publicVisible_sortOrder_idx"
ON "MuseumSection"("status", "publicVisible", "sortOrder");

CREATE UNIQUE INDEX "SaintMuseumSection_saintId_museumSectionId_assignmentType_key"
ON "SaintMuseumSection"("saintId", "museumSectionId", "assignmentType");

CREATE INDEX "SaintMuseumSection_saintId_assignmentType_idx"
ON "SaintMuseumSection"("saintId", "assignmentType");

CREATE INDEX "SaintMuseumSection_museumSectionId_assignmentType_tier_idx"
ON "SaintMuseumSection"("museumSectionId", "assignmentType", "tier");

CREATE INDEX "SaintMuseumSection_status_idx"
ON "SaintMuseumSection"("status");

CREATE INDEX "SaintMuseumSection_externalRecordId_idx"
ON "SaintMuseumSection"("externalRecordId");

ALTER TABLE "SaintRelationship"
ADD CONSTRAINT "SaintRelationship_externalRecordId_fkey"
FOREIGN KEY ("externalRecordId") REFERENCES "ExternalRecord"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SaintRelationship"
ADD CONSTRAINT "SaintRelationship_importJobId_fkey"
FOREIGN KEY ("importJobId") REFERENCES "AirtableImportJob"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SaintRelationshipSource"
ADD CONSTRAINT "SaintRelationshipSource_relationshipId_fkey"
FOREIGN KEY ("relationshipId") REFERENCES "SaintRelationship"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SaintRelationshipSource"
ADD CONSTRAINT "SaintRelationshipSource_sourceId_fkey"
FOREIGN KEY ("sourceId") REFERENCES "Source"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SaintRelationshipSource"
ADD CONSTRAINT "SaintRelationshipSource_externalRecordId_fkey"
FOREIGN KEY ("externalRecordId") REFERENCES "ExternalRecord"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SaintFamilyMember"
ADD CONSTRAINT "SaintFamilyMember_familyId_fkey"
FOREIGN KEY ("familyId") REFERENCES "SaintFamily"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SaintFamilyMember"
ADD CONSTRAINT "SaintFamilyMember_saintId_fkey"
FOREIGN KEY ("saintId") REFERENCES "Saint"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SaintFamilyMember"
ADD CONSTRAINT "SaintFamilyMember_externalRecordId_fkey"
FOREIGN KEY ("externalRecordId") REFERENCES "ExternalRecord"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DuplicateCandidate"
ADD CONSTRAINT "DuplicateCandidate_reconciliationIssueId_fkey"
FOREIGN KEY ("reconciliationIssueId") REFERENCES "ReconciliationIssue"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SaintMuseumSection"
ADD CONSTRAINT "SaintMuseumSection_saintId_fkey"
FOREIGN KEY ("saintId") REFERENCES "Saint"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SaintMuseumSection"
ADD CONSTRAINT "SaintMuseumSection_museumSectionId_fkey"
FOREIGN KEY ("museumSectionId") REFERENCES "MuseumSection"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SaintMuseumSection"
ADD CONSTRAINT "SaintMuseumSection_externalRecordId_fkey"
FOREIGN KEY ("externalRecordId") REFERENCES "ExternalRecord"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
