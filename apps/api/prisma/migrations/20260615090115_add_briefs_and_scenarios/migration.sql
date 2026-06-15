-- AlterTable
ALTER TABLE "contract_risk_flags" ADD COLUMN     "scenario" TEXT,
ADD COLUMN     "suggestedClause" TEXT;

-- CreateTable
CREATE TABLE "briefs" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileKey" TEXT,
    "parsedData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "briefs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "briefs_dealId_key" ON "briefs"("dealId");

-- AddForeignKey
ALTER TABLE "briefs" ADD CONSTRAINT "briefs_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
