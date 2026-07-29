-- Backfill any remaining nulls, then require price.
UPDATE "products" SET "price" = 2500 WHERE "price" IS NULL;
ALTER TABLE "products" ALTER COLUMN "price" SET NOT NULL;
