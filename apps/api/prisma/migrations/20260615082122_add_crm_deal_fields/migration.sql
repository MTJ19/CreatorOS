-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('NEW_INQUIRY', 'QUALIFIED', 'PITCH_SENT', 'NEGOTIATING', 'CONTRACT_SENT', 'ACTIVE', 'COMPLETED', 'LOST');

-- AlterTable
ALTER TABLE "deals" ADD COLUMN     "brandInstagram" TEXT,
ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "dealSource" TEXT,
ADD COLUMN     "followUpReminder" TIMESTAMP(3),
ADD COLUMN     "offeredAmount" DECIMAL(12,2),
ADD COLUMN     "quotedAmount" DECIMAL(12,2),
ADD COLUMN     "stage" "DealStage" NOT NULL DEFAULT 'NEW_INQUIRY';
