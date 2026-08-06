-- CreateTable
CREATE TABLE "TelemetryDaily" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "event" VARCHAR(64) NOT NULL,
    "dimension" VARCHAR(255) NOT NULL DEFAULT '',
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelemetryDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelemetryDaily_path_date_event_dimension_key" ON "TelemetryDaily"("path", "date", "event", "dimension");

-- CreateIndex
CREATE INDEX "TelemetryDaily_date_event_idx" ON "TelemetryDaily"("date", "event");
