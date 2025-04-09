// components/batches/BatchAnalytics.tsx
import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

interface HighestValuedBook {
    id: string;
    title?: string; // This expects string | undefined, not string | null
    isbn: string;
    currentPrice: number;
    historicalHigh: number;
    percentOfHigh: number;
  }

interface BatchAnalyticsProps {
  totalBooks: number;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  totalValue: number;
  averagePrice: number;
  averagePercent: number;
  highestValuedBook: HighestValuedBook | null;
}

const BatchAnalytics: React.FC<BatchAnalyticsProps> = ({
  totalBooks,
  greenCount,
  yellowCount,
  redCount,
  totalValue,
  averagePrice,
  averagePercent,
  highestValuedBook,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getPriceRankColor = (percent: number) => {
    if (percent >= 50) return 'text-green-600 dark:text-green-400';
    if (percent >= 1) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Calculate percentages for the ranking distribution
  const greenPercentage = totalBooks > 0 ? (greenCount / totalBooks) * 100 : 0;
  const yellowPercentage = totalBooks > 0 ? (yellowCount / totalBooks) * 100 : 0;
  const redPercentage = totalBooks > 0 ? (redCount / totalBooks) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Value */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Value</p>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
            {formatCurrency(totalValue)}
          </p>
        </div>

        {/* Average Book Value */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Book Value</p>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
            {formatCurrency(averagePrice)}
          </p>
        </div>

        {/* Average % of High */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average % of High</p>
          <p className={`mt-1 text-xl font-semibold ${getPriceRankColor(averagePercent)}`}>
            {averagePercent.toFixed(1)}%
          </p>
        </div>

        {/* Book Count */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Books</p>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
            {totalBooks}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Ranking Distribution */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Price Ranking Distribution</p>
          
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-3 w-3 bg-green-500 rounded-full mr-1"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Green</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{greenCount} books ({greenPercentage.toFixed(1)}%)</span>
          </div>
          
          <div className="mt-1 flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-3 w-3 bg-yellow-500 rounded-full mr-1"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Yellow</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{yellowCount} books ({yellowPercentage.toFixed(1)}%)</span>
          </div>
          
          <div className="mt-1 flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-3 w-3 bg-red-500 rounded-full mr-1"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Red</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{redCount} books ({redPercentage.toFixed(1)}%)</span>
          </div>

          <div className="mt-3 w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            {totalBooks > 0 ? (
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
              <div className="h-full bg-gray-300 dark:bg-gray-500" style={{ width: '100%' }}></div>
            )}
          </div>
        </div>

        {/* Highest Value Book */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Highest Value Book</p>
          
          {highestValuedBook ? (
            <div className="mt-2">
              <p className="text-base font-medium text-gray-900 dark:text-white truncate">
                {highestValuedBook.title || `ISBN: ${highestValuedBook.isbn}`}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">Current Price</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(highestValuedBook.currentPrice)}
                </p>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">Historical High</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(highestValuedBook.historicalHigh)}
                </p>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">Percent of High</p>
                <p className={`text-sm font-medium ${getPriceRankColor(highestValuedBook.percentOfHigh)}`}>
                  {highestValuedBook.percentOfHigh.toFixed(1)}%
                </p>
              </div>
              
              <div className="mt-3">
                <Link 
                  href={`/dashboard/books/${highestValuedBook.id}`}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                >
                  View book details <ArrowUpRight className="h-3 w-3 ml-1" />
                </Link>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              No books in this batch yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchAnalytics;