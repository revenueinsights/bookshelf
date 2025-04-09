// components/dashboard/DashboardStats.tsx
import React from 'react';
import { Book, Package, DollarSign, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface DashboardStatsProps {
  booksCount: number;
  batchesCount: number;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  totalValue: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  booksCount,
  batchesCount,
  greenCount,
  yellowCount,
  redCount,
  totalValue,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate percentages for the ranking distribution
  const total = greenCount + yellowCount + redCount;
  const greenPercentage = total > 0 ? (greenCount / total) * 100 : 0;
  const yellowPercentage = total > 0 ? (yellowCount / total) * 100 : 0;
  const redPercentage = total > 0 ? (redCount / total) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Books */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 mr-4">
            <Book className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Books</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{booksCount}</p>
          </div>
        </div>
        <div className="mt-4">
          <Link href="/dashboard/books" className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center">
            View all books <ArrowUpRight className="h-3 w-3 ml-1" />
          </Link>
        </div>
      </div>

      {/* Batches */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-200 mr-4">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Batches</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{batchesCount}</p>
          </div>
        </div>
        <div className="mt-4">
          <Link href="/dashboard/batches" className="text-sm text-green-600 dark:text-green-400 hover:underline flex items-center">
            Manage batches <ArrowUpRight className="h-3 w-3 ml-1" />
          </Link>
        </div>
      </div>

      {/* Total Value */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-200 mr-4">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Value</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{formatCurrency(totalValue)}</p>
          </div>
        </div>
        <div className="mt-4">
          <Link href="/dashboard/analytics" className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center">
            View analytics <ArrowUpRight className="h-3 w-3 ml-1" />
          </Link>
        </div>
      </div>

      {/* Price Rankings */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Price Rankings</p>
          <div className="flex items-center mt-1 space-x-2">
            <span className="font-semibold text-gray-900 dark:text-white">{greenCount}</span>
            <span className="text-green-500">Green</span>
            <span className="mx-1 text-gray-400">•</span>
            <span className="font-semibold text-gray-900 dark:text-white">{yellowCount}</span>
            <span className="text-yellow-500">Yellow</span>
            <span className="mx-1 text-gray-400">•</span>
            <span className="font-semibold text-gray-900 dark:text-white">{redCount}</span>
            <span className="text-red-500">Red</span>
          </div>
        </div>
        <div className="mt-3 w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          {total > 0 ? (
            <>
              <div
                className="h-full bg-green-500"
                style={{
                  width: `${greenPercentage}%`,
                  float: 'left',
                }}
              ></div>
              <div
                className="h-full bg-yellow-500"
                style={{
                  width: `${yellowPercentage}%`,
                  float: 'left',
                }}
              ></div>
              <div
                className="h-full bg-red-500"
                style={{
                  width: `${redPercentage}%`,
                  float: 'left',
                }}
              ></div>
            </>
          ) : (
            <div className="h-full bg-gray-300 dark:bg-gray-600" style={{ width: '100%' }}></div>
          )}
        </div>
        <div className="mt-4">
          <Link href="/dashboard/books" className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center">
            View by ranking <ArrowUpRight className="h-3 w-3 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;