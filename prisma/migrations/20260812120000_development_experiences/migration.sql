ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'tester';

CREATE TYPE "DevelopmentExperienceStatus" AS ENUM ('off', 'admin_preview', 'public');

CREATE TABLE "DevelopmentExperience" (
  "key" TEXT NOT NULL,
  "status" "DevelopmentExperienceStatus" NOT NULL DEFAULT 'off',
  "updatedByEmail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DevelopmentExperience_pkey" PRIMARY KEY ("key")
);
