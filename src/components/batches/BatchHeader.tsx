// components/batches/BatchHeader.tsx
import React from 'react';
import { Package, Calendar, Clock, Book } from 'lucide-react';

interface BatchHeaderProps {
  name: string;
  description: string;
  booksCount: number;
  lastUpdated: string | null;
  createdAt: string;
}

const BatchHeader: React.FC<BatchHeaderProps> = ({
  name,
  description,
  booksCount,
  lastUpdated,
  createdAt,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="flex items-start">
        <div className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200 mr-4">
          <Package className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
            {name}
          </h1>
          {description && (
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center">
          <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 mr-3">
            <Book className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Books</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {booksCount}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 mr-3">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {formatDate(createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 mr-3">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {lastUpdated ? formatDateTime(lastUpdated) : 'Never'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchHeader;