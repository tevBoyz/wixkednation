-- Multi-SKU product packs: product_skus + cart_items.skuId

CREATE TABLE "product_skus" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "label" TEXT,
    "volume" DECIMAL(10,2) NOT NULL,
    "measurementUnit" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_skus_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_skus_productId_volume_measurementUnit_key"
  ON "product_skus"("productId", "volume", "measurementUnit");

CREATE INDEX "product_skus_productId_sortOrder_idx"
  ON "product_skus"("productId", "sortOrder");

ALTER TABLE "product_skus"
  ADD CONSTRAINT "product_skus_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill one primary SKU per product that has a sellable pack
INSERT INTO "product_skus" (
  "id", "productId", "label", "volume", "measurementUnit", "price",
  "sortOrder", "isVisible", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  p."id",
  NULL,
  p."volume",
  p."measurementUnit",
  p."price",
  0,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "products" p
WHERE p."price" IS NOT NULL
  AND p."volume" IS NOT NULL
  AND p."volume" > 0;

-- Cart: add nullable skuId, backfill, drop old unique, enforce new unique
ALTER TABLE "cart_items" ADD COLUMN "skuId" UUID;

UPDATE "cart_items" ci
SET "skuId" = s."id"
FROM "product_skus" s
WHERE s."productId" = ci."productId"
  AND s."measurementUnit" = COALESCE(ci."measurementUnit", (
    SELECT p."measurementUnit" FROM "products" p WHERE p."id" = ci."productId"
  ))
  AND (
    (ci."volume" IS NULL AND s."sortOrder" = 0)
    OR (
      ci."volume" IS NOT NULL
      AND s."volume" = ci."volume"
    )
  );

-- Prefer exact volume match; if still null, attach primary SKU
UPDATE "cart_items" ci
SET "skuId" = s."id"
FROM "product_skus" s
WHERE ci."skuId" IS NULL
  AND s."productId" = ci."productId"
  AND s."sortOrder" = 0;

DELETE FROM "cart_items" WHERE "skuId" IS NULL;

ALTER TABLE "cart_items" DROP CONSTRAINT IF EXISTS "cart_items_cartId_productId_volume_measurementUnit_key";

DROP INDEX IF EXISTS "cart_items_cartId_productId_volume_measurementUnit_key";

ALTER TABLE "cart_items" ALTER COLUMN "skuId" SET NOT NULL;

CREATE UNIQUE INDEX "cart_items_cartId_productId_skuId_key"
  ON "cart_items"("cartId", "productId", "skuId");

CREATE INDEX "cart_items_skuId_idx" ON "cart_items"("skuId");

ALTER TABLE "cart_items"
  ADD CONSTRAINT "cart_items_skuId_fkey"
  FOREIGN KEY ("skuId") REFERENCES "product_skus"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
