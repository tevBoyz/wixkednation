-- CreateTable
CREATE TABLE "promo_banners" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "productId" UUID NOT NULL,
    "skuId" UUID NOT NULL,
    "salePrice" DECIMAL(10,2) NOT NULL,
    "compareAtPrice" DECIMAL(10,2) NOT NULL,
    "imageMode" TEXT NOT NULL DEFAULT 'composed',
    "imagePath" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "promo_banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "promo_banners_isActive_idx" ON "promo_banners"("isActive");

-- CreateIndex
CREATE INDEX "promo_banners_deletedAt_idx" ON "promo_banners"("deletedAt");

-- CreateIndex
CREATE INDEX "promo_banners_skuId_idx" ON "promo_banners"("skuId");

-- CreateIndex
CREATE INDEX "promo_banners_sortOrder_idx" ON "promo_banners"("sortOrder");

-- CreateIndex
CREATE INDEX "promo_banners_startsAt_endsAt_idx" ON "promo_banners"("startsAt", "endsAt");

-- AddForeignKey
ALTER TABLE "promo_banners" ADD CONSTRAINT "promo_banners_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_banners" ADD CONSTRAINT "promo_banners_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "product_skus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
