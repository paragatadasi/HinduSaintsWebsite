-- CreateTable
CREATE TABLE "SiteConfig" (
    "id" TEXT NOT NULL DEFAULT 'site',
    "imprintUrl" TEXT NOT NULL,
    "privacyPolicyUrl" TEXT NOT NULL,
    "updatedByEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteConfig_pkey" PRIMARY KEY ("id")
);

-- Seed the singleton with the legal destinations supplied for launch.
INSERT INTO "SiteConfig" (
    "id",
    "imprintUrl",
    "privacyPolicyUrl",
    "createdAt",
    "updatedAt"
) VALUES (
    'site',
    'https://back.bhaktimarga.org/wp-content/uploads/2024/07/Bhakti-Marga-Yoga-gGmbH-impressum.pdf',
    'https://bhaktimarga.org/privacy-policy',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
