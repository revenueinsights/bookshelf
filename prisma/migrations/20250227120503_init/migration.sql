/*
  Warnings:

  - You are about to drop the column `status` on the `Batch` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Batch` table. All the data in the column will be lost.
  - You are about to drop the column `askingPrice` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `categories` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `edition` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `minimumPrice` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `pageCount` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `publishedDate` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `publisher` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `purchaseDate` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `purchaseLocation` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `subtitle` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnailUrl` on the `Book` table. All the data in the column will be lost.
  - The `condition` column on the `Book` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `stripeCustomerId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `subscription` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionEnd` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `autoUpdatePrices` on the `UserSettings` table. All the data in the column will be lost.
  - You are about to drop the column `customTheme` on the `UserSettings` table. All the data in the column will be lost.
  - You are about to drop the column `defaultPricingSource` on the `UserSettings` table. All the data in the column will be lost.
  - You are about to drop the column `thresholdSettings` on the `UserSettings` table. All the data in the column will be lost.
  - You are about to drop the `ActivityLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ApiKey` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BookTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Listing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MarketplaceAccount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PriceAlert` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PriceHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Report` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Sale` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PriceRank" AS ENUM ('GREEN', 'YELLOW', 'RED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "ApiKey" DROP CONSTRAINT "ApiKey_userId_fkey";

-- DropForeignKey
ALTER TABLE "BookTag" DROP CONSTRAINT "BookTag_bookId_fkey";

-- DropForeignKey
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_bookId_fkey";

-- DropForeignKey
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_marketplaceAccountId_fkey";

-- DropForeignKey
ALTER TABLE "MarketplaceAccount" DROP CONSTRAINT "MarketplaceAccount_userId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "PriceAlert" DROP CONSTRAINT "PriceAlert_bookId_fkey";

-- DropForeignKey
ALTER TABLE "PriceAlert" DROP CONSTRAINT "PriceAlert_userId_fkey";

-- DropForeignKey
ALTER TABLE "PriceHistory" DROP CONSTRAINT "PriceHistory_bookId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_userId_fkey";

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_bookId_fkey";

-- DropIndex
DROP INDEX "Batch_userId_status_idx";

-- DropIndex
DROP INDEX "Book_isbn13_idx";

-- DropIndex
DROP INDEX "Book_userId_isbn_idx";

-- DropIndex
DROP INDEX "Book_userId_status_idx";

-- DropIndex
DROP INDEX "User_stripeCustomerId_key";

-- AlterTable
ALTER TABLE "Batch" DROP COLUMN "status",
DROP COLUMN "tags",
ADD COLUMN     "averagePercent" DECIMAL(6,2) NOT NULL DEFAULT 0,
ADD COLUMN     "greenCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "highestPrice" DECIMAL(10,2),
ADD COLUMN     "highestPriceISBN" TEXT,
ADD COLUMN     "lastPriceUpdate" TIMESTAMP(3),
ADD COLUMN     "nextScheduledUpdate" TIMESTAMP(3),
ADD COLUMN     "redCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalBooks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "yellowCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Book" DROP COLUMN "askingPrice",
DROP COLUMN "categories",
DROP COLUMN "description",
DROP COLUMN "edition",
DROP COLUMN "language",
DROP COLUMN "minimumPrice",
DROP COLUMN "pageCount",
DROP COLUMN "publishedDate",
DROP COLUMN "publisher",
DROP COLUMN "purchaseDate",
DROP COLUMN "purchaseLocation",
DROP COLUMN "quantity",
DROP COLUMN "status",
DROP COLUMN "subtitle",
DROP COLUMN "thumbnailUrl",
ADD COLUMN     "amazonPrice" DECIMAL(10,2),
ADD COLUMN     "amazonPriceHistory" JSONB,
ADD COLUMN     "bestVendorName" TEXT,
ADD COLUMN     "firstTracked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "historicalHigh" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "percentOfHigh" DECIMAL(6,2) NOT NULL DEFAULT 0,
ADD COLUMN     "priceHistory" JSONB,
ADD COLUMN     "priceRank" "PriceRank" NOT NULL DEFAULT 'RED',
ALTER COLUMN "title" DROP NOT NULL,
DROP COLUMN "condition",
ADD COLUMN     "condition" TEXT,
ALTER COLUMN "purchasePrice" DROP NOT NULL,
ALTER COLUMN "purchasePrice" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
DROP COLUMN "stripeCustomerId",
DROP COLUMN "subscription",
DROP COLUMN "subscriptionEnd";

-- AlterTable
ALTER TABLE "UserSettings" DROP COLUMN "autoUpdatePrices",
DROP COLUMN "customTheme",
DROP COLUMN "defaultPricingSource",
DROP COLUMN "thresholdSettings",
ADD COLUMN     "greenThreshold" DECIMAL(5,2) NOT NULL DEFAULT 50,
ADD COLUMN     "yellowThreshold" DECIMAL(5,2) NOT NULL DEFAULT 1,
ALTER COLUMN "emailNotifications" SET DEFAULT false,
ALTER COLUMN "updateFrequency" SET DEFAULT 6;

-- DropTable
DROP TABLE "ActivityLog";

-- DropTable
DROP TABLE "ApiKey";

-- DropTable
DROP TABLE "BookTag";

-- DropTable
DROP TABLE "Listing";

-- DropTable
DROP TABLE "MarketplaceAccount";

-- DropTable
DROP TABLE "Notification";

-- DropTable
DROP TABLE "PriceAlert";

-- DropTable
DROP TABLE "PriceHistory";

-- DropTable
DROP TABLE "Report";

-- DropTable
DROP TABLE "Sale";

-- DropEnum
DROP TYPE "AlertDirection";

-- DropEnum
DROP TYPE "BatchStatus";

-- DropEnum
DROP TYPE "BookCondition";

-- DropEnum
DROP TYPE "BookStatus";

-- DropEnum
DROP TYPE "ListingStatus";

-- DropEnum
DROP TYPE "MarketplacePlatform";

-- DropEnum
DROP TYPE "ReportStatus";

-- DropEnum
DROP TYPE "ReportType";

-- DropEnum
DROP TYPE "SubscriptionTier";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "PriceUpdateJob" (
    "id" TEXT NOT NULL,
    "batchId" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "booksTotal" INTEGER NOT NULL DEFAULT 0,
    "booksProcessed" INTEGER NOT NULL DEFAULT 0,
    "nextRun" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceUpdateJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceUpdateJob_nextRun_status_idx" ON "PriceUpdateJob"("nextRun", "status");

-- CreateIndex
CREATE INDEX "Batch_userId_idx" ON "Batch"("userId");

-- CreateIndex
CREATE INDEX "Book_userId_idx" ON "Book"("userId");

-- CreateIndex
CREATE INDEX "Book_batchId_idx" ON "Book"("batchId");

-- CreateIndex
CREATE INDEX "Book_priceRank_idx" ON "Book"("priceRank");
