-- CreateTable
CREATE TABLE "analytics_sessions" (
    "id" UUID NOT NULL,
    "visitorId" TEXT NOT NULL,
    "landingPath" TEXT NOT NULL,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "source" TEXT NOT NULL,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pageViewCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "analytics_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_page_views" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_page_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_sessions_visitorId_idx" ON "analytics_sessions"("visitorId");

-- CreateIndex
CREATE INDEX "analytics_sessions_startedAt_idx" ON "analytics_sessions"("startedAt");

-- CreateIndex
CREATE INDEX "analytics_sessions_source_idx" ON "analytics_sessions"("source");

-- CreateIndex
CREATE INDEX "analytics_sessions_country_idx" ON "analytics_sessions"("country");

-- CreateIndex
CREATE INDEX "analytics_page_views_sessionId_idx" ON "analytics_page_views"("sessionId");

-- CreateIndex
CREATE INDEX "analytics_page_views_path_idx" ON "analytics_page_views"("path");

-- CreateIndex
CREATE INDEX "analytics_page_views_createdAt_idx" ON "analytics_page_views"("createdAt");

-- AddForeignKey
ALTER TABLE "analytics_page_views" ADD CONSTRAINT "analytics_page_views_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "analytics_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
