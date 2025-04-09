// components/analytics/InventoryOverview.tsx
'use client';

import React from 'react';
import { ChevronUp, ChevronDown, DollarSign, BookOpen, Archive } from 'lucide-react';

// Modify the Analytics type to avoid Prisma Decimal issues
interface AnalyticsData {
  totalBooks: number;
  totalBatches: number;
  totalGreenBooks: number;
  totalYellowBooks: number;
  totalRedBooks: number;
  totalInventoryValue: number | string;
  avgBookValue: number | string;
  potentialProfit: number | string | null;
  totalPurchaseValue: number | string | null;
  avgPercentOfHigh: number | string;
  highestValueBook: number | string;
  date: Date | string;
}

interface InventoryOverviewProps {
  data: AnalyticsData;
}

export default function InventoryOverview({ data }: InventoryOverviewProps) {
  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(numValue);
  };

  // Convert potential profit to number for comparison
  const profitValue = data.potentialProfit ? 
    (typeof data.potentialProfit === 'string' ? 
      parseFloat(data.potentialProfit) : data.potentialProfit) 
    : 0;
  
  const isProfitable = profitValue > 0;

  // Convert avgPercentOfHigh to a number for display
  const avgPercentValue = typeof data.avgPercentOfHigh === 'string' 
    ? parseFloat(data.avgPercentOfHigh) 
    : data.avgPercentOfHigh;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Books</p>
            <h3 className="text-2xl font-bold">{data.totalBooks}</h3>
          </div>
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          </div>
        </div>
        <div className="mt-2 flex items-center text-sm">
          <div className="flex items-center text-green-500">
            <span>{data.totalBatches} Batches</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Value</p>
            <h3 className="text-2xl font-bold">{formatCurrency(data.totalInventoryValue)}</h3>
          </div>
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-300" />
          </div>
        </div>
        <div className="mt-2 flex items-center text-sm">
          <div className="flex items-center">
            <span>Avg: {formatCurrency(data.avgBookValue)} per book</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Price Rank</p>
            <h3 className="text-2xl font-bold">{avgPercentValue.toFixed(1)}%</h3>
          </div>
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
            <Archive className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1 text-sm">
          <div className="text-center">
            <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100">
              G: {data.totalGreenBooks}
            </span>
          </div>
          <div className="text-center">
            <span className="px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100">
              Y: {data.totalYellowBooks}
            </span>
          </div>
          <div className="text-center">
            <span className="px-2 py-1 rounded bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100">
              R: {data.totalRedBooks}
            </span>
          </div>
        </div>
      </div>

      {data.potentialProfit !== null && (
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Potential Profit</p>
              <h3 className="text-2xl font-bold">{formatCurrency(data.potentialProfit)}</h3>
            </div>
            <div className={`p-2 ${isProfitable ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'} rounded-full`}>
              {isProfitable ? (
                <ChevronUp className="h-5 w-5 text-green-600 dark:text-green-300" />
              ) : (
                <ChevronDown className="h-5 w-5 text-red-600 dark:text-red-300" />
              )}
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <div className="flex items-center">
              <span>Investment: {formatCurrency(data.totalPurchaseValue || 0)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}