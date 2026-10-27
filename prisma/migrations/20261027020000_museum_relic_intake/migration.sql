-- CreateTable
CREATE TABLE "MuseumRelicIntake" (
    "id" TEXT NOT NULL,
    "museumId" TEXT NOT NULL,
    "clientRequestId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "rawFields" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedVersion" INTEGER,
    "reviewFingerprint" TEXT,
    "approvedSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MuseumRelicIntake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MuseumIntakeMedia" (
    "id" TEXT NOT NULL,
    "intakeId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sourceSha256" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MuseumIntakeMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MuseumIntakeDelivery" (
    "id" TEXT NOT NULL,
    "intakeId" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'blocked_configuration',
    "idempotencyKey" TEXT NOT NULL,
    "reviewedVersion" INTEGER NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "externalRecordId" TEXT,
    "errorCode" TEXT,
    "leaseToken" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MuseumIntakeDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MuseumRelicIntake_museumId_status_createdAt_idx" ON "MuseumRelicIntake"("museumId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MuseumRelicIntake_createdById_clientRequestId_key" ON "MuseumRelicIntake"("createdById", "clientRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "MuseumIntakeMedia_storageKey_key" ON "MuseumIntakeMedia"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "MuseumIntakeMedia_intakeId_kind_sourceSha256_key" ON "MuseumIntakeMedia"("intakeId", "kind", "sourceSha256");

-- CreateIndex
CREATE UNIQUE INDEX "MuseumIntakeDelivery_idempotencyKey_key" ON "MuseumIntakeDelivery"("idempotencyKey");

-- CreateIndex
CREATE INDEX "MuseumIntakeDelivery_target_status_createdAt_idx" ON "MuseumIntakeDelivery"("target", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MuseumIntakeDelivery_intakeId_target_key" ON "MuseumIntakeDelivery"("intakeId", "target");

-- AddForeignKey
ALTER TABLE "MuseumRelicIntake" ADD CONSTRAINT "MuseumRelicIntake_museumId_fkey" FOREIGN KEY ("museumId") REFERENCES "Museum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuseumIntakeMedia" ADD CONSTRAINT "MuseumIntakeMedia_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "MuseumRelicIntake"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuseumIntakeDelivery" ADD CONSTRAINT "MuseumIntakeDelivery_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "MuseumRelicIntake"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "MuseumRelicIntake" ADD CONSTRAINT "MuseumRelicIntake_status_check" CHECK ("status" IN ('draft','submitted','needs_changes','approved'));
ALTER TABLE "MuseumRelicIntake" ADD CONSTRAINT "MuseumRelicIntake_version_check" CHECK ("version" > 0);
ALTER TABLE "MuseumIntakeMedia" ADD CONSTRAINT "MuseumIntakeMedia_kind_check" CHECK ("kind" IN ('relic','saint_portrait'));
ALTER TABLE "MuseumIntakeMedia" ADD CONSTRAINT "MuseumIntakeMedia_image_check" CHECK ("mimeType" = 'image/jpeg' AND "byteSize" > 0 AND "width" > 0 AND "height" > 0);
ALTER TABLE "MuseumIntakeDelivery" ADD CONSTRAINT "MuseumIntakeDelivery_target_check" CHECK ("target" IN ('website','official_airtable'));
ALTER TABLE "MuseumIntakeDelivery" ADD CONSTRAINT "MuseumIntakeDelivery_status_check" CHECK ("status" IN ('blocked_configuration','queued','sending','succeeded','failed','unknown'));
