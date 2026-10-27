-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'museum_assistant';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "UserPasswordCredential" (
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPasswordCredential_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "PasswordLoginThrottle" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL,

    CONSTRAINT "PasswordLoginThrottle_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPasswordCredential_username_key" ON "UserPasswordCredential"("username");

-- CreateIndex
CREATE INDEX "PasswordLoginThrottle_windowStart_idx" ON "PasswordLoginThrottle"("windowStart");

-- AddForeignKey
ALTER TABLE "UserPasswordCredential" ADD CONSTRAINT "UserPasswordCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE "UserPasswordCredential" ADD CONSTRAINT "UserPasswordCredential_username_check" CHECK ("username" ~ '^[a-z][a-z0-9._-]{2,47}$');
ALTER TABLE "PasswordLoginThrottle" ADD CONSTRAINT "PasswordLoginThrottle_attempts_check" CHECK ("attempts" >= 0);
