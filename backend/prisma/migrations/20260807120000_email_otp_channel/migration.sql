-- AlterEnum AuthProvider
DO $$ BEGIN
  ALTER TYPE "AuthProvider" ADD VALUE 'email';
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN unique_violation THEN null;
END $$;

-- CreateEnum OtpChannel
DO $$ BEGIN
  CREATE TYPE "OtpChannel" AS ENUM ('sms', 'email');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable otp_challenges
ALTER TABLE "otp_challenges" ALTER COLUMN "phone" DROP NOT NULL;

ALTER TABLE "otp_challenges" ADD COLUMN IF NOT EXISTS "email" TEXT;

DO $$ BEGIN
  ALTER TABLE "otp_challenges" ADD COLUMN "channel" "OtpChannel" NOT NULL DEFAULT 'sms';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "otp_challenges_email_idx" ON "otp_challenges"("email");

-- CreateTable email_logs
CREATE TABLE IF NOT EXISTS "email_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerRef" TEXT,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "email_logs_to_idx" ON "email_logs"("to");
CREATE INDEX IF NOT EXISTS "email_logs_provider_idx" ON "email_logs"("provider");
CREATE INDEX IF NOT EXISTS "email_logs_status_idx" ON "email_logs"("status");
