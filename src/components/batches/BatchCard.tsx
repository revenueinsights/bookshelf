// components/batches/BatchCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Package, Clock } from 'lucide-react';

interface BatchCardProps {
  id: string;
  name: string;
  description: string;
  booksCount: number;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  updatedAt: Date;
}

const BatchCard: React.FC<BatchCardProps> = ({
  id,
  name,
  description,
  booksCount,
  greenCount,
  yellowCount,
  redCount,
  updatedAt,
}) => {
  // Format the date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  // Calculate the distribution percentages
  const total = greenCount + yellowCount + redCount;
  const greenPercentage = total > 0 ? (greenCount / total) * 100 : 0;
  const yellowPercentage = total > 0 ? (yellowCount / total) * 100 : 0;
  const redPercentage = total > 0 ? (redCount / total) * 100 : 0;

  return (
    <Link 
      href={`/dashboard/batches/${id}`}
      className="block bg-white dark:bg-gray-800 shadow rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start">
        <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 mr-3">
          <Package className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">{name}</h3>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{booksCount}</span>
          <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">books</span>
        </div>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <Clock className="h-4 w-4 mr-1" />
          <span>{formatDate(updatedAt)}</span>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center text-xs">
          <span className="font-medium mr-1">{greenCount}</span>
          <span className="text-green-500 mr-2">Green</span>
          <span className="font-medium mr-1">{yellowCount}</span>
          <span className="text-yellow-500 mr-2">Yellow</span>
          <span className="font-medium mr-1">{redCount}</span>
          <span className="text-red-500">Red</span>
        </div>
        <div className="mt-2 w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
      </div>
    </Link>
  );
};

export default BatchCard;