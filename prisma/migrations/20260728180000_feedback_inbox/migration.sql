-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('new', 'in_review', 'resolved', 'spam', 'archived');

-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('correction', 'source_citation', 'name_spelling', 'missing_information', 'technical_issue', 'other');

-- CreateEnum
CREATE TYPE "FeedbackEntityType" AS ENUM ('saint', 'tradition', 'place', 'page');

-- CreateTable
CREATE TABLE "FeedbackSubmission" (
    "id" TEXT NOT NULL,
    "submissionKey" TEXT NOT NULL,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'new',
    "category" "FeedbackCategory" NOT NULL,
    "message" TEXT NOT NULL,
    "supportingSourceUrl" TEXT,
    "submitterName" TEXT,
    "submitterEmail" TEXT,
    "pagePath" TEXT,
    "pageTitle" TEXT,
    "entityType" "FeedbackEntityType",
    "entityId" TEXT,
    "entitySlug" TEXT,
    "assignedToEmail" TEXT,
    "resolutionNote" TEXT,
    "resolvedByEmail" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "abuseFingerprint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackSubmission_submissionKey_key" ON "FeedbackSubmission"("submissionKey");

-- CreateIndex
CREATE INDEX "FeedbackSubmission_status_createdAt_idx" ON "FeedbackSubmission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "FeedbackSubmission_entityType_entityId_idx" ON "FeedbackSubmission"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "FeedbackSubmission_abuseFingerprint_createdAt_idx" ON "FeedbackSubmission"("abuseFingerprint", "createdAt");
