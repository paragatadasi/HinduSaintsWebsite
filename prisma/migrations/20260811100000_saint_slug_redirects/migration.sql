CREATE TABLE "SaintSlugRedirect" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "saintId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaintSlugRedirect_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SaintSlugRedirect_slug_key" ON "SaintSlugRedirect"("slug");
CREATE INDEX "SaintSlugRedirect_saintId_idx" ON "SaintSlugRedirect"("saintId");

ALTER TABLE "SaintSlugRedirect"
ADD CONSTRAINT "SaintSlugRedirect_saintId_fkey"
FOREIGN KEY ("saintId") REFERENCES "Saint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
