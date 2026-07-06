-- CreateTable
CREATE TABLE "AdminSecret" (
    "key" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "updatedByEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSecret_pkey" PRIMARY KEY ("key")
);
