-- CreateEnum
CREATE TYPE "PortalApprovalStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'APPROVED_WITH_CHANGES', 'REJECTED');

-- CreateEnum
CREATE TYPE "PortalCommentAuthor" AS ENUM ('BRAND', 'CREATOR');

-- AlterTable
ALTER TABLE "brand_portal_tokens" ADD COLUMN     "brandNote" TEXT;

-- CreateTable
CREATE TABLE "portal_submissions" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "approvalStatus" "PortalApprovalStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "revisionNotes" TEXT,
    "briefFileUrl" TEXT,
    "briefFileKey" TEXT,
    "briefGoogleDocUrl" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portal_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_comments" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "author" "PortalCommentAuthor" NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "portal_submissions_tokenId_idx" ON "portal_submissions"("tokenId");

-- CreateIndex
CREATE INDEX "portal_comments_tokenId_idx" ON "portal_comments"("tokenId");

-- AddForeignKey
ALTER TABLE "portal_submissions" ADD CONSTRAINT "portal_submissions_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "brand_portal_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_comments" ADD CONSTRAINT "portal_comments_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "brand_portal_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;
