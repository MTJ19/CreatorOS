-- CreateEnum
CREATE TYPE "BrandTier" AS ENUM ('NANO', 'MICRO', 'MID', 'MACRO', 'MEGA', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "DealType" AS ENUM ('SPONSORED_POST', 'UGC', 'AMBASSADOR', 'AFFILIATE', 'PRODUCT_GIFTING', 'EVENT');

-- CreateEnum
CREATE TYPE "ContentFormatPerf" AS ENUM ('SHORT_FORM_VIDEO', 'LONG_FORM_VIDEO', 'STATIC_IMAGE', 'CAROUSEL', 'STORIES', 'LIVE_STREAM', 'PODCAST', 'BLOG_ARTICLE', 'NEWSLETTER', 'UGC_RAW_FOOTAGE');

-- CreateTable
CREATE TABLE "comparable_deals" (
    "id" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "contentFormat" "ContentFormat" NOT NULL,
    "followerRange" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "dealType" "DealType" NOT NULL,
    "brandTier" "BrandTier" NOT NULL,
    "usageRights" TEXT[],
    "exclusivityDays" INTEGER NOT NULL DEFAULT 0,
    "baseRate" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "engagementRate" DOUBLE PRECISION,
    "country" TEXT NOT NULL DEFAULT 'US',
    "year" INTEGER NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comparable_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_intelligence_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_intelligence_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comparable_deals_platform_niche_idx" ON "comparable_deals"("platform", "niche");

-- CreateIndex
CREATE INDEX "comparable_deals_followerRange_brandTier_idx" ON "comparable_deals"("followerRange", "brandTier");

-- CreateIndex
CREATE INDEX "rate_intelligence_requests_userId_idx" ON "rate_intelligence_requests"("userId");

-- CreateIndex
CREATE INDEX "rate_intelligence_requests_createdAt_idx" ON "rate_intelligence_requests"("createdAt");

-- AddForeignKey
ALTER TABLE "rate_intelligence_requests" ADD CONSTRAINT "rate_intelligence_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
