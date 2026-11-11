-- AlterTable
ALTER TABLE "categories" ADD COLUMN "parentId" UUID;
ALTER TABLE "categories" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");

-- Data: create Flower parent and reparent Indica / Sativa / Hybrid
INSERT INTO "categories" ("id", "name", "slug", "description", "isActive", "parentId", "sortOrder", "createdAt", "updatedAt", "deletedAt")
SELECT gen_random_uuid(), 'Flower', 'flower', 'Flower products', true, NULL, 0, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM "categories" WHERE "slug" = 'flower'
);

UPDATE "categories" AS c
SET
  "parentId" = f."id",
  "sortOrder" = CASE c."slug"
    WHEN 'indica' THEN 10
    WHEN 'sativa' THEN 20
    WHEN 'hybrid' THEN 30
    ELSE c."sortOrder"
  END,
  "updatedAt" = NOW()
FROM "categories" AS f
WHERE f."slug" = 'flower'
  AND c."slug" IN ('indica', 'sativa', 'hybrid')
  AND c."parentId" IS NULL;
