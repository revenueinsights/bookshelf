'use client';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { BarChart3, TrendingUp, Calendar, Clock } from 'lucide-react';

export default function PriceHistoryPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Buyback Price History"
        description="Analyze price volatility and seasonality to optimize your selling strategy"
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
        <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded-full w-16 h-16 mx-auto mb-4">
          <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-300" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Coming Soon
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Deep dive into historical pricing data to understand market patterns and optimize your selling timing.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Volatility Analysis</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Calendar className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Seasonal Patterns</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Clock className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Optimal Timing</p>
          </div>
        </div>
      </div>
    </div>
  );
} 