-- CreateEnum
CREATE TYPE "DealConfidence" AS ENUM ('CONFIRMED', 'LIKELY', 'SPECULATIVE');

-- CreateEnum
CREATE TYPE "PaymentTerms" AS ENUM ('NET_15', 'NET_30', 'NET_45', 'NET_60', 'NET_90', 'FIFTY_FIFTY');

-- AlterTable
ALTER TABLE "deals" ADD COLUMN     "confidence" "DealConfidence" NOT NULL DEFAULT 'LIKELY';

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "paymentTerms" "PaymentTerms" NOT NULL DEFAULT 'NET_30';

-- CreateTable
CREATE TABLE "financial_settings" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "monthlyFixedCosts" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "financial_settings_creatorId_key" ON "financial_settings"("creatorId");

-- AddForeignKey
ALTER TABLE "financial_settings" ADD CONSTRAINT "financial_settings_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
