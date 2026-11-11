-- Additive: order fee breakdown + coupons (no drops/renames)

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "subtotalAmount" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "deliveryFee" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "discountAmount" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "couponCode" TEXT,
ADD COLUMN IF NOT EXISTS "couponId" UUID;

UPDATE "orders"
SET
  "subtotalAmount" = "totalAmount",
  "deliveryFee" = 0,
  "discountAmount" = 0
WHERE "subtotalAmount" IS NULL;

DO $$ BEGIN
  CREATE TYPE "CouponType" AS ENUM ('free_delivery', 'fixed_amount', 'percent_off');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CouponStatus" AS ENUM ('active', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "coupons" (
  "id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "CouponType" NOT NULL,
  "amount" DECIMAL(10,2),
  "status" "CouponStatus" NOT NULL DEFAULT 'active',
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "maxRedemptions" INTEGER,
  "redemptionCount" INTEGER NOT NULL DEFAULT 0,
  "maxPerCustomer" INTEGER NOT NULL DEFAULT 1,
  "minSubtotal" DECIMAL(10,2),
  "newCustomersOnly" BOOLEAN NOT NULL DEFAULT false,
  "isUniqueIssue" BOOLEAN NOT NULL DEFAULT false,
  "claimSlug" TEXT,
  "parentCouponId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "coupons_code_key" ON "coupons"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "coupons_claimSlug_key" ON "coupons"("claimSlug");
CREATE INDEX IF NOT EXISTS "coupons_status_idx" ON "coupons"("status");
CREATE INDEX IF NOT EXISTS "coupons_claimSlug_idx" ON "coupons"("claimSlug");
CREATE INDEX IF NOT EXISTS "coupons_parentCouponId_idx" ON "coupons"("parentCouponId");
CREATE INDEX IF NOT EXISTS "coupons_deletedAt_idx" ON "coupons"("deletedAt");

ALTER TABLE "coupons"
ADD CONSTRAINT "coupons_parentCouponId_fkey"
FOREIGN KEY ("parentCouponId") REFERENCES "coupons"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "coupon_redemptions" (
  "id" UUID NOT NULL,
  "couponId" UUID NOT NULL,
  "orderId" UUID NOT NULL,
  "userId" UUID,
  "email" TEXT,
  "phone" TEXT,
  "discountAmount" DECIMAL(10,2) NOT NULL,
  "deliveryFeeBefore" DECIMAL(10,2) NOT NULL,
  "deliveryFeeAfter" DECIMAL(10,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "coupon_redemptions_orderId_key" ON "coupon_redemptions"("orderId");
CREATE INDEX IF NOT EXISTS "coupon_redemptions_couponId_idx" ON "coupon_redemptions"("couponId");
CREATE INDEX IF NOT EXISTS "coupon_redemptions_userId_idx" ON "coupon_redemptions"("userId");
CREATE INDEX IF NOT EXISTS "coupon_redemptions_email_idx" ON "coupon_redemptions"("email");
CREATE INDEX IF NOT EXISTS "coupon_redemptions_phone_idx" ON "coupon_redemptions"("phone");

ALTER TABLE "coupon_redemptions"
ADD CONSTRAINT "coupon_redemptions_couponId_fkey"
FOREIGN KEY ("couponId") REFERENCES "coupons"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "coupon_redemptions"
ADD CONSTRAINT "coupon_redemptions_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "orders"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "lead_signups" (
  "id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "couponId" UUID NOT NULL,
  "campaignKey" TEXT NOT NULL,
  "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_signups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lead_signups_email_campaignKey_key" ON "lead_signups"("email", "campaignKey");
CREATE INDEX IF NOT EXISTS "lead_signups_couponId_idx" ON "lead_signups"("couponId");
CREATE INDEX IF NOT EXISTS "lead_signups_campaignKey_idx" ON "lead_signups"("campaignKey");

ALTER TABLE "lead_signups"
ADD CONSTRAINT "lead_signups_couponId_fkey"
FOREIGN KEY ("couponId") REFERENCES "coupons"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "orders_couponId_idx" ON "orders"("couponId");

ALTER TABLE "orders"
ADD CONSTRAINT "orders_couponId_fkey"
FOREIGN KEY ("couponId") REFERENCES "coupons"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
