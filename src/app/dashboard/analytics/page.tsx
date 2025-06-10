// app/dashboard/analytics/page.tsx

import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import InventoryOverview from '@/components/analytics/InventoryOverview';
import ValueTrends from '@/components/analytics/ValueTrends';
import BookDistribution from '@/components/analytics/BookDistribution';
import BatchComparison from '@/components/analytics/BatchComparison';
import TimeFrameSelector from '@/components/analytics/TimeFrameSelector';
import RefreshAnalyticsButton from '@/components/analytics/RefreshAnalyticsButton';
import { AnalyticsService } from '@/lib/services/analytics.services'; // Make sure this path is correct
import { TimeFrame } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Define raw data types (with Decimal)
type Decimal = any; // Placeholder for Prisma's Decimal type

interface RawAnalyticsData {
  id: string;
  userId: string;
  date: Date;
  timeFrame: TimeFrame;
  periodKey: string;
  totalBooks: number;
  totalBatches: number;
  totalGreenBooks: number;
  totalYellowBooks: number;
  totalRedBooks: number;
  totalInventoryValue: Decimal;
  avgBookValue: Decimal;
  highestValueBook: Decimal;
  totalPurchaseValue: Decimal | null;
  potentialProfit: Decimal | null;
  avgPercentOfHigh: Decimal;
  createdAt: Date;
}

interface RawBatchData {
  id: string;
  name: string;
  totalBooks: number;
  totalValue: Decimal;
}

interface RawBatchComparisonData {
  batchId: string;
  batchName: string;
  totalBooks: number;
  totalValue: Decimal;
  greenCount?: number;
  yellowCount?: number;
  redCount?: number;
  averagePercent?: Decimal;
  date?: Date;
  id?: string;
  createdAt?: Date;
}

// Define serialized data types (with numbers/strings)
interface SerializedAnalyticsData {
  id: string;
  userId: string;
  date: string;
  timeFrame: string;
  periodKey: string;
  totalBooks: number;
  totalBatches: number;
  totalGreenBooks: number;
  totalYellowBooks: number;
  totalRedBooks: number;
  totalInventoryValue: number;
  avgBookValue: number;
  highestValueBook: number;
  totalPurchaseValue: number | null;
  potentialProfit: number | null;
  avgPercentOfHigh: number;
  createdAt: string;
}

interface SerializedBatchData {
  id: string;
  name: string;
  totalBooks: number;
  totalValue: number;
}

interface SerializedBatchComparisonData {
  batchId: string;
  batchName: string;
  totalBooks: number;
  totalValue: number;
  greenCount?: number;
  yellowCount?: number;
  redCount?: number;
  averagePercent?: number;
  date?: string;
  id?: string;
  createdAt?: string;
}

// Function to safely serialize data for client components
function serializeForClient<T>(data: any): T {
  return JSON.parse(JSON.stringify(data));
}

async function getAnalyticsData(userId: string, timeFrame: TimeFrame = 'MONTH') {
  try {
    // Ensure we have at least one analytics snapshot
    const existingAnalytics = await prisma.analytics.findFirst({
      where: { userId }
    });

    if (!existingAnalytics) {
      // Create initial snapshots if none exist
      await AnalyticsService.createUserAnalyticsSnapshot(userId);
      await AnalyticsService.createBatchSnapshots(userId);
    }

    // Get analytics data for the selected time frame
    const analyticsRaw = await AnalyticsService.getUserAnalyticsByTimeFrame(
      userId,
      timeFrame,
      12
    ) as unknown as RawAnalyticsData[];
    
    // Get batch data for comparison
    const batches = await prisma.batch.findMany({
      where: { 
        userId,
        totalBooks: { gt: 0 } // Only include batches with books
      },
      select: {
        id: true,
        name: true,
        totalBooks: true,
        totalValue: true
      },
      orderBy: {
        totalValue: 'desc'
      },
      take: 5 // Top 5 batches by value
    }) as unknown as RawBatchData[];

    const batchIds = batches.map(batch => batch.id);
    
    let batchComparison: RawBatchComparisonData[] = [];
    if (batchIds.length > 0) {
      const batchComparisonRaw = await AnalyticsService.getComparisonDataForBatches(
        batchIds,
        timeFrame
      );
      batchComparison = batchComparisonRaw as unknown as RawBatchComparisonData[];
    }

    return {
      analytics: analyticsRaw,
      batches,
      batchComparison
    };
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return {
      analytics: [] as RawAnalyticsData[],
      batches: [] as RawBatchData[],
      batchComparison: [] as RawBatchComparisonData[]
    };
  }
}

export default async function AnalyticsPage({
  searchParams
}: {
  searchParams: Promise<{
    timeFrame?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return <div>Unauthorized</div>;
  }

  // Await searchParams in Next.js 15
  const params = await searchParams;
  const timeFrame = (params.timeFrame || 'MONTH') as TimeFrame;
  
  const { analytics, batches, batchComparison } = await getAnalyticsData(userId, timeFrame);
  
  // Serialize all data to ensure it can be passed to client components
  const serializedAnalytics = serializeForClient<SerializedAnalyticsData[]>(analytics);
  const serializedBatches = serializeForClient<SerializedBatchData[]>(batches);
  const serializedBatchComparison = serializeForClient<SerializedBatchComparisonData[]>(batchComparison);

  // Check if we have data
  if (!serializedAnalytics || serializedAnalytics.length === 0) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Analytics Dashboard" />
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">No Analytics Data Available</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            We need to generate analytics data for your inventory. Please click the button below to create your first analytics snapshot.
          </p>
          <RefreshAnalyticsButton />
        </div>
      </div>
    );
  }

  // Get the latest analytics snapshot
  const latestSnapshot = serializedAnalytics[serializedAnalytics.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DashboardHeader title="Analytics Dashboard" />
        <div className="flex space-x-2">
          <TimeFrameSelector currentTimeFrame={timeFrame} />
          <RefreshAnalyticsButton />
        </div>
      </div>

      {/* Inventory Overview */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Inventory Overview</h2>
        <InventoryOverview data={latestSnapshot} />
      </div>

      {/* Value Trends */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Inventory Value Trends</h2>
      {/*@ts-ignore*/}
        <ValueTrends data={serializedAnalytics} timeFrame={timeFrame} />
      </div>

      {/* Book Distribution */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Book Price Rank Distribution</h2>
      {/*@ts-ignore*/}
        <BookDistribution data={serializedAnalytics} timeFrame={timeFrame} />
      </div>

      {/* Batch Comparison */}
      {serializedBatches.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Top Batches Comparison</h2>
          <BatchComparison data={serializedBatchComparison} timeFrame={timeFrame} />
        </div>
      )}
    </div>
  );
}