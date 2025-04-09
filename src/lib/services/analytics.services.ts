// lib/services/analytics.service.ts

import { prisma } from '@/lib/db';
import { TimeFrame } from '@prisma/client';

// Helper function to generate period key based on timeframe
function generatePeriodKey(date: Date, timeFrame: TimeFrame): string {
  switch (timeFrame) {
    case 'DAY':
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    case 'WEEK':
      // Get the ISO week number (1-53)
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
    case 'MONTH':
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    case 'QUARTER':
      const quarter = Math.ceil((date.getMonth() + 1) / 3);
      return `${date.getFullYear()}-Q${quarter}`;
    case 'YEAR':
      return date.getFullYear().toString();
    default:
      return date.toISOString().split('T')[0];
  }
}

// Helper function to get start date for a timeframe
function getStartDateForTimeFrame(date: Date, timeFrame: TimeFrame): Date {
  const result = new Date(date);
  
  switch (timeFrame) {
    case 'DAY':
      // Already a specific day
      return result;
    case 'WEEK':
      // Set to first day of the week (assuming Sunday is the first day)
      result.setDate(result.getDate() - result.getDay());
      return result;
    case 'MONTH':
      // Set to first day of the month
      result.setDate(1);
      return result;
    case 'QUARTER':
      // Set to first day of the quarter
      const quarter = Math.floor(result.getMonth() / 3);
      result.setMonth(quarter * 3);
      result.setDate(1);
      return result;
    case 'YEAR':
      // Set to first day of the year
      result.setMonth(0);
      result.setDate(1);
      return result;
    default:
      return result;
  }
}

export class AnalyticsService {
  /**
   * Create a snapshot of the user's overall inventory status
   */
  static async createUserAnalyticsSnapshot(userId: string, timeFrames: TimeFrame[] = ['DAY', 'WEEK', 'MONTH', 'YEAR']) {
    try {
      // Get user's books with their current status
      const books = await prisma.book.findMany({
        where: { userId },
        select: {
          currentPrice: true,
          purchasePrice: true,
          priceRank: true,
          percentOfHigh: true
        }
      });

      // Get count of batches
      const batchCount = await prisma.batch.count({
        where: { userId }
      });

      if (books.length === 0) {
        console.log(`No books found for user ${userId}`);
        return;
      }

      // Calculate aggregated metrics
      const totalBooks = books.length;
      const totalGreenBooks = books.filter(book => book.priceRank === 'GREEN').length;
      const totalYellowBooks = books.filter(book => book.priceRank === 'YELLOW').length;
      const totalRedBooks = books.filter(book => book.priceRank === 'RED').length;
      
      const totalInventoryValue = books.reduce((sum, book) => 
        sum + Number(book.currentPrice), 0);
      
      const avgBookValue = totalBooks > 0 ? totalInventoryValue / totalBooks : 0;
      
      const highestValueBook = books.length > 0 ? 
        Math.max(...books.map(book => Number(book.currentPrice))) : 0;
      
      // Calculate purchase value and potential profit if purchase price is available
      const booksWithPurchasePrice = books.filter(book => book.purchasePrice !== null);
      let totalPurchaseValue = null;
      let potentialProfit = null;
      
      if (booksWithPurchasePrice.length > 0) {
        totalPurchaseValue = booksWithPurchasePrice.reduce((sum, book) => 
          sum + Number(book.purchasePrice), 0);
        
        const currentValueOfBooksWithPurchase = booksWithPurchasePrice.reduce((sum, book) => 
          sum + Number(book.currentPrice), 0);
        
        potentialProfit = currentValueOfBooksWithPurchase - totalPurchaseValue;
      }
      
      // Average percentage of high
      const avgPercentOfHigh = books.reduce((sum, book) => 
        sum + Number(book.percentOfHigh), 0) / totalBooks;

      // Create analytics snapshots for each timeframe
      const now = new Date();
      const snapshots = [];

      for (const timeFrame of timeFrames) {
        const periodKey = generatePeriodKey(now, timeFrame);
        
        // Create or update the analytics record
        const snapshot = await prisma.analytics.upsert({
          where: {
            userId_timeFrame_periodKey: {
              userId,
              timeFrame,
              periodKey
            }
          },
          update: {
            date: now,
            totalBooks,
            totalBatches: batchCount,
            totalGreenBooks,
            totalYellowBooks,
            totalRedBooks,
            totalInventoryValue,
            avgBookValue,
            highestValueBook,
            totalPurchaseValue,
            potentialProfit,
            avgPercentOfHigh,
          },
          create: {
            userId,
            date: now,
            timeFrame,
            periodKey,
            totalBooks,
            totalBatches: batchCount,
            totalGreenBooks,
            totalYellowBooks,
            totalRedBooks,
            totalInventoryValue,
            avgBookValue,
            highestValueBook,
            totalPurchaseValue,
            potentialProfit,
            avgPercentOfHigh,
          }
        });
        
        snapshots.push(snapshot);
      }

      return snapshots;
    } catch (error) {
      console.error('Error creating analytics snapshot:', error);
      throw error;
    }
  }

  /**
   * Create snapshots for each of the user's batches
   */
  static async createBatchSnapshots(userId: string, timeFrames: TimeFrame[] = ['DAY', 'WEEK', 'MONTH', 'YEAR']) {
    try {
      // Get all active batches for the user
      const batches = await prisma.batch.findMany({
        where: { userId },
        include: {
          books: {
            select: {
              id: true
            }
          }
        }
      });

      if (batches.length === 0) {
        console.log(`No batches found for user ${userId}`);
        return [];
      }

      const now = new Date();
      const allSnapshots = [];

      // Create snapshots for each batch
      for (const batch of batches) {
        for (const timeFrame of timeFrames) {
          const periodKey = generatePeriodKey(now, timeFrame);
          
          const snapshot = await prisma.batchSnapshot.upsert({
            where: {
              batchId_timeFrame_periodKey: {
                batchId: batch.id,
                timeFrame,
                periodKey
              }
            },
            update: {
              date: now,
              totalBooks: batch.totalBooks,
              greenCount: batch.greenCount,
              yellowCount: batch.yellowCount,
              redCount: batch.redCount,
              totalValue: batch.totalValue,
              averagePercent: batch.averagePercent,
              highestPrice: batch.highestPrice,
              highestPriceISBN: batch.highestPriceISBN
            },
            create: {
              batchId: batch.id,
              date: now,
              timeFrame,
              periodKey,
              totalBooks: batch.totalBooks,
              greenCount: batch.greenCount,
              yellowCount: batch.yellowCount,
              redCount: batch.redCount,
              totalValue: batch.totalValue,
              averagePercent: batch.averagePercent,
              highestPrice: batch.highestPrice,
              highestPriceISBN: batch.highestPriceISBN
            }
          });
          
          allSnapshots.push(snapshot);
        }
      }

      return allSnapshots;
    } catch (error) {
      console.error('Error creating batch snapshots:', error);
      throw error;
    }
  }

  /**
   * Get analytics data for charting
   */
  static async getUserAnalyticsByTimeFrame(userId: string, timeFrame: TimeFrame, limit: number = 12) {
    try {
      const analytics = await prisma.analytics.findMany({
        where: {
          userId,
          timeFrame
        },
        orderBy: {
          date: 'asc'
        },
        take: limit
      });

      return analytics;
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      throw error;
    }
  }

  /**
   * Get batch analytics data for charting
   */
  static async getBatchAnalyticsByTimeFrame(batchId: string, timeFrame: TimeFrame, limit: number = 12) {
    try {
      const snapshots = await prisma.batchSnapshot.findMany({
        where: {
          batchId,
          timeFrame
        },
        orderBy: {
          date: 'asc'
        },
        take: limit
      });

      return snapshots;
    } catch (error) {
      console.error('Error fetching batch analytics:', error);
      throw error;
    }
  }

  /**
   * Generate combined analytics for multiple batches
   */
  static async getComparisonDataForBatches(batchIds: string[], timeFrame: TimeFrame) {
    try {
      // Get the latest snapshot for each batch
      const batchData = await Promise.all(
        batchIds.map(async (batchId) => {
          const batch = await prisma.batch.findUnique({
            where: { id: batchId },
            select: { name: true }
          });
          
          const latestSnapshot = await prisma.batchSnapshot.findFirst({
            where: {
              batchId,
              timeFrame
            },
            orderBy: {
              date: 'desc'
            }
          });
          
          return {
            batchId,
            batchName: batch?.name || 'Unknown Batch',
            ...latestSnapshot
          };
        })
      );
      
      return batchData;
    } catch (error) {
      console.error('Error comparing batch analytics:', error);
      throw error;
    }
  }

  /**
   * Schedule daily analytics snapshots for all users
   */
  static async scheduleAnalyticsSnapshots() {
    try {
      // Get all users
      const users = await prisma.user.findMany({
        select: { id: true }
      });

      for (const user of users) {
        // Create analytics for this user
        await this.createUserAnalyticsSnapshot(user.id);
        
        // Create batch snapshots for this user
        await this.createBatchSnapshots(user.id);
      }

      return { success: true, usersProcessed: users.length };
    } catch (error) {
      console.error('Error scheduling analytics snapshots:', error);
      throw error;
    }
  }
}