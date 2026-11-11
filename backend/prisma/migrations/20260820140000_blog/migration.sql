-- Additive blog tables only. Does not alter existing tables.

CREATE TYPE "BlogPostStatus" AS ENUM ('draft', 'published');

CREATE TABLE "blog_posts" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "bodyJson" JSONB NOT NULL DEFAULT '{}',
    "bodyHtml" TEXT NOT NULL DEFAULT '',
    "coverImagePath" TEXT,
    "status" "BlogPostStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "authorName" TEXT,
    "showOnHomepage" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "blog_media" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "path" TEXT NOT NULL,
    "alt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_media_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

CREATE INDEX "blog_posts_status_publishedAt_idx" ON "blog_posts"("status", "publishedAt");

CREATE INDEX "blog_posts_status_showOnHomepage_idx" ON "blog_posts"("status", "showOnHomepage");

CREATE INDEX "blog_posts_deletedAt_idx" ON "blog_posts"("deletedAt");

CREATE INDEX "blog_media_postId_idx" ON "blog_media"("postId");

ALTER TABLE "blog_media" ADD CONSTRAINT "blog_media_postId_fkey" FOREIGN KEY ("postId") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
