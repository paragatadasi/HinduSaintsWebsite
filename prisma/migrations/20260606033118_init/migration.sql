-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'needs_review', 'published', 'hidden', 'archived');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'editor', 'contributor');

-- CreateEnum
CREATE TYPE "InstagramType" AS ENUM ('post', 'reel', 'carousel', 'unknown');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('imported', 'suggested', 'needs_review', 'matched', 'ignored', 'published', 'hidden');

-- CreateEnum
CREATE TYPE "Confidence" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('guru', 'disciple', 'contemporary', 'associated', 'lineage', 'related');

-- CreateEnum
CREATE TYPE "AliasType" AS ENUM ('alternate_spelling', 'title', 'regional_name', 'transliteration', 'instagram_name', 'airtable_name', 'other');

-- CreateEnum
CREATE TYPE "PlaceType" AS ENUM ('primary', 'birth', 'samadhi', 'sadhana', 'associated', 'other');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('book', 'article', 'website', 'scripture', 'oral_tradition', 'other');

-- CreateEnum
CREATE TYPE "ImportSourceType" AS ENUM ('airtable', 'instagram', 'csv', 'manual');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('open', 'resolved', 'ignored');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'contributor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Saint" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "shortDescription" TEXT,
    "biographySummary" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "launchMvp" BOOLEAN NOT NULL DEFAULT false,
    "hasInstagramContent" BOOLEAN NOT NULL DEFAULT false,
    "primaryImageId" TEXT,
    "eraLabel" TEXT,
    "birthYear" INTEGER,
    "deathYear" INTEGER,
    "datePrecision" TEXT,
    "dateNotes" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "Saint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaintAlias" (
    "id" TEXT NOT NULL,
    "saintId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "aliasType" "AliasType" NOT NULL DEFAULT 'other',
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaintAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sampradaya" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "alternateNames" TEXT[],
    "shortDescription" TEXT,
    "longIntroductionMarkdown" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "founderSaintId" TEXT,
    "parentSampradayaId" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Sampradaya_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "alternateNames" TEXT[],
    "region" TEXT,
    "country" TEXT,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "notes" TEXT,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaintPlace" (
    "id" TEXT NOT NULL,
    "saintId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "placeType" "PlaceType" NOT NULL DEFAULT 'associated',
    "notes" TEXT,

    CONSTRAINT "SaintPlace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaintSampradaya" (
    "id" TEXT NOT NULL,
    "saintId" TEXT NOT NULL,
    "sampradayaId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "SaintSampradaya_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaintRelationship" (
    "id" TEXT NOT NULL,
    "fromSaintId" TEXT NOT NULL,
    "toSaintId" TEXT NOT NULL,
    "relationshipType" "RelationshipType" NOT NULL,
    "confidence" "Confidence" NOT NULL DEFAULT 'medium',
    "notes" TEXT,
    "sourceId" TEXT,

    CONSTRAINT "SaintRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT,
    "altText" TEXT,
    "caption" TEXT,
    "credit" TEXT,
    "sourceUrl" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaintGalleryImage" (
    "id" TEXT NOT NULL,
    "saintId" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SaintGalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramItem" (
    "id" TEXT NOT NULL,
    "instagramUrl" TEXT NOT NULL,
    "instagramShortcode" TEXT,
    "type" "InstagramType" NOT NULL DEFAULT 'unknown',
    "captionText" TEXT,
    "extractedSaintName" TEXT,
    "postedAt" TIMESTAMP(3),
    "thumbnailUrl" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'imported',
    "matchConfidence" "Confidence",
    "sourceImportBatchId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramItemSaint" (
    "id" TEXT NOT NULL,
    "instagramItemId" TEXT NOT NULL,
    "saintId" TEXT NOT NULL,
    "matchStatus" "MatchStatus" NOT NULL DEFAULT 'suggested',
    "matchConfidence" "Confidence" NOT NULL DEFAULT 'low',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "InstagramItemSaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Biography" (
    "id" TEXT NOT NULL,
    "saintId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bodyMarkdown" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "authorOrEditor" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "lastReviewedAt" TIMESTAMP(3),

    CONSTRAINT "Biography_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "url" TEXT,
    "publisher" TEXT,
    "publicationYear" INTEGER,
    "sourceType" "SourceType" NOT NULL DEFAULT 'other',
    "notes" TEXT,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentSource" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ContentSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "sourceType" "ImportSourceType" NOT NULL,
    "sourceName" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "rawSummary" TEXT,
    "notes" TEXT,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalRecord" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "rawPayloadJson" JSONB NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationIssue" (
    "id" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "message" TEXT NOT NULL,
    "rawValue" TEXT,
    "suggestedValue" TEXT,
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'open',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReconciliationIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Saint_slug_key" ON "Saint"("slug");

-- CreateIndex
CREATE INDEX "SaintAlias_alias_idx" ON "SaintAlias"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "Sampradaya_slug_key" ON "Sampradaya"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Place_slug_key" ON "Place"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SaintSampradaya_saintId_sampradayaId_key" ON "SaintSampradaya"("saintId", "sampradayaId");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramItem_instagramUrl_key" ON "InstagramItem"("instagramUrl");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramItemSaint_instagramItemId_saintId_key" ON "InstagramItemSaint"("instagramItemId", "saintId");

-- CreateIndex
CREATE UNIQUE INDEX "Biography_saintId_slug_key" ON "Biography"("saintId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalRecord_sourceType_externalId_key" ON "ExternalRecord"("sourceType", "externalId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Saint" ADD CONSTRAINT "Saint_primaryImageId_fkey" FOREIGN KEY ("primaryImageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaintAlias" ADD CONSTRAINT "SaintAlias_saintId_fkey" FOREIGN KEY ("saintId") REFERENCES "Saint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sampradaya" ADD CONSTRAINT "Sampradaya_parentSampradayaId_fkey" FOREIGN KEY ("parentSampradayaId") REFERENCES "Sampradaya"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaintPlace" ADD CONSTRAINT "SaintPlace_saintId_fkey" FOREIGN KEY ("saintId") REFERENCES "Saint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaintPlace" ADD CONSTRAINT "SaintPlace_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaintSampradaya" ADD CONSTRAINT "SaintSampradaya_saintId_fkey" FOREIGN KEY ("saintId") REFERENCES "Saint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaintSampradaya" ADD CONSTRAINT "SaintSampradaya_sampradayaId_fkey" FOREIGN KEY ("sampradayaId") REFERENCES "Sampradaya"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaintRelationship" ADD CONSTRAINT "SaintRelationship_fromSaintId_fkey" FOREIGN KEY ("fromSaintId") REFERENCES "Saint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaintRelationship" ADD CONSTRAINT "SaintRelationship_toSaintId_fkey" FOREIGN KEY ("toSaintId") REFERENCES "Saint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaintRelationship" ADD CONSTRAINT "SaintRelationship_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaintGalleryImage" ADD CONSTRAINT "SaintGalleryImage_saintId_fkey" FOREIGN KEY ("saintId") REFERENCES "Saint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaintGalleryImage" ADD CONSTRAINT "SaintGalleryImage_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramItem" ADD CONSTRAINT "InstagramItem_sourceImportBatchId_fkey" FOREIGN KEY ("sourceImportBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramItemSaint" ADD CONSTRAINT "InstagramItemSaint_instagramItemId_fkey" FOREIGN KEY ("instagramItemId") REFERENCES "InstagramItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramItemSaint" ADD CONSTRAINT "InstagramItemSaint_saintId_fkey" FOREIGN KEY ("saintId") REFERENCES "Saint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Biography" ADD CONSTRAINT "Biography_saintId_fkey" FOREIGN KEY ("saintId") REFERENCES "Saint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSource" ADD CONSTRAINT "ContentSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
