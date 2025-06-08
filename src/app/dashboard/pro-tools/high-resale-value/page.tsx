'use client';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Gem, TrendingUp, Star, Target } from 'lucide-react';

export default function HighResaleValuePage() {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="High Resale Value Books"
        description="Track popular ISBNs and identify the best categories for maximum profit"
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
        <div className="bg-orange-100 dark:bg-orange-900 p-4 rounded-full w-16 h-16 mx-auto mb-4">
          <Gem className="h-8 w-8 text-orange-600 dark:text-orange-300" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Coming Soon
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          This tool will help you identify high-value books based on real market data and user search patterns.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Popular ISBN Tracking</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Star className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Category Analysis</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Target className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Strategy Recommendations</p>
          </div>
        </div>
      </div>
    </div>
  );
} 