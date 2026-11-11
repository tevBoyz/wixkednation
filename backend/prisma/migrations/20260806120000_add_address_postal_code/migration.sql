-- AlterTable
ALTER TABLE "addresses" ADD COLUMN "postalCode" TEXT;
ALTER TABLE "addresses" ALTER COLUMN "country" SET DEFAULT 'United States';
