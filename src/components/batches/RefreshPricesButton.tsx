// components/batches/RefreshPricesButton.tsx
'use client';

import React, { useState } from 'react';
import { RefreshCw, Loader2, Clock } from 'lucide-react';

interface RefreshPricesButtonProps {
  batchId: string;
  lastUpdate: string | null;
}

const RefreshPricesButton: React.FC<RefreshPricesButtonProps> = ({ 
  batchId, 
  lastUpdate 
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const formatLastUpdate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setProgress(0);
    setError(null);

    try {
      // Start the refresh job
      const response = await fetch(`/api/batches/${batchId}/refresh-prices`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refresh prices');
      }

      const data = await response.json();
      const jobId = data.jobId;

      // Poll for job status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/batches/${batchId}/refresh-prices?jobId=${jobId}`);
          const statusData = await statusResponse.json();

          if (statusData.status === 'COMPLETED') {
            clearInterval(pollInterval);
            setIsRefreshing(false);
            // Reload the page to show updated data
            window.location.reload();
          } else if (statusData.status === 'FAILED') {
            clearInterval(pollInterval);
            setIsRefreshing(false);
            setError(statusData.errorMessage || 'Failed to refresh prices');
          } else if (statusData.status === 'RUNNING') {
            // Update progress
            const totalBooks = statusData.booksTotal || 1;
            const processedBooks = statusData.booksProcessed || 0;
            const progressPercentage = Math.floor((processedBooks / totalBooks) * 100);
            setProgress(progressPercentage);
          }
        } catch (pollError) {
          console.error('Error polling refresh status:', pollError);
        }
      }, 2000); // Poll every 2 seconds

      // For demonstration, simulate the refresh process
      // In a real app, this would be handled by the polling above
      if (process.env.NODE_ENV === 'development') {
        let simulatedProgress = 0;
        const simulateInterval = setInterval(() => {
          simulatedProgress += 10;
          setProgress(Math.min(simulatedProgress, 100));
          
          if (simulatedProgress >= 100) {
            clearInterval(simulateInterval);
            setIsRefreshing(false);
            window.location.reload();
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Error refreshing prices:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsRefreshing(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRefreshing ? (
          <>
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            Updating... {progress}%
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh Prices
          </>
        )}
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {lastUpdate && !isRefreshing && !error && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          Last updated: {formatLastUpdate(lastUpdate)}
        </div>
      )}
    </div>
  );
};

export default RefreshPricesButton;