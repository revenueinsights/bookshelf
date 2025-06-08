/*
  Warnings:

  - The `condition` column on the `Book` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `userId` to the `PriceUpdateJob` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BookCondition" AS ENUM ('NEW', 'LIKE_NEW', 'VERY_GOOD', 'GOOD', 'ACCEPTABLE', 'POOR');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('BUYBACK', 'MARKETPLACE', 'AUCTION', 'DIRECT');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'UNAVAILABLE', 'PROCESSING');

-- AlterTable
ALTER TABLE "BatchSnapshot" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "bestQuotePrice" DECIMAL(10,2),
ADD COLUMN     "bestQuoteVendor" TEXT,
ADD COLUMN     "bookMetadataId" TEXT,
ADD COLUMN     "lastQuoteUpdate" TIMESTAMP(3),
ADD COLUMN     "sellRecommendation" TEXT,
ADD COLUMN     "totalQuotes" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "condition",
ADD COLUMN     "condition" "BookCondition" NOT NULL DEFAULT 'GOOD';

-- AlterTable
ALTER TABLE "PriceUpdateJob" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "website" TEXT,
    "logoUrl" TEXT,
    "type" "VendorType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "averageRating" DECIMAL(3,2),
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "processingTime" TEXT,
    "shippingInfo" TEXT,
    "paymentMethods" TEXT[],
    "minOrderValue" DECIMAL(10,2),
    "maxOrderValue" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookMetadata" (
    "id" TEXT NOT NULL,
    "isbn" TEXT NOT NULL,
    "isbn13" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "authors" TEXT[],
    "publisher" TEXT,
    "publishedDate" TEXT,
    "pageCount" INTEGER,
    "language" TEXT DEFAULT 'en',
    "categories" TEXT[],
    "description" TEXT,
    "imageUrl" TEXT,
    "thumbnailUrl" TEXT,
    "averageRating" DECIMAL(3,2),
    "ratingsCount" INTEGER,
    "retailPrice" DECIMAL(10,2),
    "format" TEXT,
    "dimensions" TEXT,
    "weight" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceQuote" (
    "id" TEXT NOT NULL,
    "bookMetadataId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "condition" "BookCondition" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "originalPrice" DECIMAL(10,2),
    "status" "QuoteStatus" NOT NULL DEFAULT 'ACTIVE',
    "quotedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isHighestPrice" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "shippingCost" DECIMAL(10,2),
    "processingFee" DECIMAL(10,2),
    "totalPayout" DECIMAL(10,2),
    "estimatedPayout" TEXT,

    CONSTRAINT "PriceQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketData" (
    "id" TEXT NOT NULL,
    "bookMetadataId" TEXT NOT NULL,
    "condition" "BookCondition" NOT NULL,
    "averagePrice" DECIMAL(10,2) NOT NULL,
    "highestPrice" DECIMAL(10,2) NOT NULL,
    "lowestPrice" DECIMAL(10,2) NOT NULL,
    "priceRange" DECIMAL(10,2) NOT NULL,
    "vendorCount" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priceHistory" JSONB,
    "demandScore" DECIMAL(5,2),
    "popularityRank" INTEGER,

    CONSTRAINT "MarketData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_name_key" ON "Vendor"("name");

-- CreateIndex
CREATE INDEX "Vendor_type_isActive_idx" ON "Vendor"("type", "isActive");

-- CreateIndex
CREATE INDEX "Vendor_name_idx" ON "Vendor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BookMetadata_isbn_key" ON "BookMetadata"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "BookMetadata_isbn13_key" ON "BookMetadata"("isbn13");

-- CreateIndex
CREATE INDEX "BookMetadata_isbn_idx" ON "BookMetadata"("isbn");

-- CreateIndex
CREATE INDEX "BookMetadata_isbn13_idx" ON "BookMetadata"("isbn13");

-- CreateIndex
CREATE INDEX "BookMetadata_title_idx" ON "BookMetadata"("title");

-- CreateIndex
CREATE INDEX "BookMetadata_authors_idx" ON "BookMetadata"("authors");

-- CreateIndex
CREATE INDEX "PriceQuote_bookMetadataId_condition_idx" ON "PriceQuote"("bookMetadataId", "condition");

-- CreateIndex
CREATE INDEX "PriceQuote_vendorId_status_idx" ON "PriceQuote"("vendorId", "status");

-- CreateIndex
CREATE INDEX "PriceQuote_price_idx" ON "PriceQuote"("price");

-- CreateIndex
CREATE INDEX "PriceQuote_quotedAt_idx" ON "PriceQuote"("quotedAt");

-- CreateIndex
CREATE INDEX "PriceQuote_isHighestPrice_idx" ON "PriceQuote"("isHighestPrice");

-- CreateIndex
CREATE UNIQUE INDEX "PriceQuote_bookMetadataId_vendorId_condition_key" ON "PriceQuote"("bookMetadataId", "vendorId", "condition");

-- CreateIndex
CREATE INDEX "MarketData_bookMetadataId_condition_idx" ON "MarketData"("bookMetadataId", "condition");

-- CreateIndex
CREATE INDEX "MarketData_averagePrice_idx" ON "MarketData"("averagePrice");

-- CreateIndex
CREATE INDEX "MarketData_highestPrice_idx" ON "MarketData"("highestPrice");

-- CreateIndex
CREATE INDEX "MarketData_lastUpdated_idx" ON "MarketData"("lastUpdated");

-- CreateIndex
CREATE UNIQUE INDEX "MarketData_bookMetadataId_condition_key" ON "MarketData"("bookMetadataId", "condition");

-- CreateIndex
CREATE INDEX "Book_bookMetadataId_idx" ON "Book"("bookMetadataId");

-- CreateIndex
CREATE INDEX "Book_condition_idx" ON "Book"("condition");

-- CreateIndex
CREATE INDEX "Book_bestQuotePrice_idx" ON "Book"("bestQuotePrice");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_bookMetadataId_fkey" FOREIGN KEY ("bookMetadataId") REFERENCES "BookMetadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceUpdateJob" ADD CONSTRAINT "PriceUpdateJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchSnapshot" ADD CONSTRAINT "BatchSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceQuote" ADD CONSTRAINT "PriceQuote_bookMetadataId_fkey" FOREIGN KEY ("bookMetadataId") REFERENCES "BookMetadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceQuote" ADD CONSTRAINT "PriceQuote_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketData" ADD CONSTRAINT "MarketData_bookMetadataId_fkey" FOREIGN KEY ("bookMetadataId") REFERENCES "BookMetadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;
