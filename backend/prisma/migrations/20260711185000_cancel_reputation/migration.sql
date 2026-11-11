-- AlterTable
ALTER TABLE "users" ADD COLUMN "reputationScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "deliveredOrderCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "cancelledOrderCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "admin_settings" DROP COLUMN "allowCustomerCancellation";
