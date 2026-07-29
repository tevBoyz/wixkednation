-- AlterEnum
ALTER TYPE "AuthProvider" ADD VALUE 'guest';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "orderBlockedUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "placedAsGuest" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "orders" ADD COLUMN "matchedExistingAccount" BOOLEAN NOT NULL DEFAULT false;
