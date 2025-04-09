-- CreateEnum
CREATE TYPE "TimeFrame" AS ENUM ('DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR');

-- DropIndex
DROP INDEX "Book_isbn_idx";

-- CreateTable
CREATE TABLE "Analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeFrame" "TimeFrame" NOT NULL,
    "periodKey" TEXT NOT NULL,
    "totalBooks" INTEGER NOT NULL,
    "totalBatches" INTEGER NOT NULL,
    "totalGreenBooks" INTEGER NOT NULL,
    "totalYellowBooks" INTEGER NOT NULL,
    "totalRedBooks" INTEGER NOT NULL,
    "totalInventoryValue" DECIMAL(12,2) NOT NULL,
    "avgBookValue" DECIMAL(10,2) NOT NULL,
    "highestValueBook" DECIMAL(10,2) NOT NULL,
    "totalPurchaseValue" DECIMAL(12,2),
    "potentialProfit" DECIMAL(12,2),
    "avgPercentOfHigh" DECIMAL(6,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchSnapshot" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeFrame" "TimeFrame" NOT NULL,
    "periodKey" TEXT NOT NULL,
    "totalBooks" INTEGER NOT NULL,
    "greenCount" INTEGER NOT NULL,
    "yellowCount" INTEGER NOT NULL,
    "redCount" INTEGER NOT NULL,
    "totalValue" DECIMAL(10,2) NOT NULL,
    "averagePercent" DECIMAL(6,2) NOT NULL,
    "highestPrice" DECIMAL(10,2),
    "highestPriceISBN" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Analytics_userId_timeFrame_periodKey_idx" ON "Analytics"("userId", "timeFrame", "periodKey");

-- CreateIndex
CREATE INDEX "Analytics_date_idx" ON "Analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Analytics_userId_timeFrame_periodKey_key" ON "Analytics"("userId", "timeFrame", "periodKey");

-- CreateIndex
CREATE INDEX "BatchSnapshot_batchId_timeFrame_periodKey_idx" ON "BatchSnapshot"("batchId", "timeFrame", "periodKey");

-- CreateIndex
CREATE INDEX "BatchSnapshot_date_idx" ON "BatchSnapshot"("date");

-- CreateIndex
CREATE UNIQUE INDEX "BatchSnapshot_batchId_timeFrame_periodKey_key" ON "BatchSnapshot"("batchId", "timeFrame", "periodKey");

-- AddForeignKey
ALTER TABLE "Analytics" ADD CONSTRAINT "Analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchSnapshot" ADD CONSTRAINT "BatchSnapshot_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
