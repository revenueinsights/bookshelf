'use client';

import React, { useState } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RefreshAnalyticsButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const refreshAnalytics = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to refresh analytics');
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Error refreshing analytics:', error);
      alert('Failed to refresh analytics. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      onClick={refreshAnalytics}
      disabled={isRefreshing}
      className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      {isRefreshing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Refreshing...
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Analytics
        </>
      )}
    </button>
  );
}