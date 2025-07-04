import React, { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const FilteredInsightsPanel = ({ filters, onInsightsUpdate }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Safe fetch function with error handling
  const fetchFinancialData = async (endpoint, options = {}) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(endpoint, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      } else if (err.message.includes('Failed to fetch')) {
        throw new Error('Network error - please check your connection');
      } else {
        throw err;
      }
    }
  };

  const generateInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to fetch analytics data first
      let analyticsData = null;
      try {
        analyticsData = await fetchFinancialData('/api/analytics');
      } catch (err) {
        console.warn('Analytics API not available:', err.message);
        // Continue with mock data if API fails
      }

      // Try to fetch market data
      let marketData = null;
      try {
        marketData = await fetchFinancialData('/api/market-intelligence');
      } catch (err) {
        console.warn('Market intelligence API not available:', err.message);
        // Continue without market data
      }

      // Generate insights based on available data
      const generatedInsights = await generateInsightsFromData(analyticsData, marketData, filters);
      
      setInsights(generatedInsights);
      if (onInsightsUpdate) {
        onInsightsUpdate(generatedInsights);
      }
    } catch (err) {
      console.error('Error generating insights:', err);
      setError(err.message || 'Failed to generate insights');
      
      // Provide fallback insights
      const fallbackInsights = generateFallbackInsights(filters);
      setInsights(fallbackInsights);
    } finally {
      setLoading(false);
    }
  };

  const generateInsightsFromData = async (analyticsData, marketData, filters) => {
    const insights = [];

    // Analytics-based insights
    if (analyticsData && analyticsData.totalBooks > 0) {
      if (analyticsData.totalGreenBooks / analyticsData.totalBooks > 0.7) {
        insights.push({
          id: 'high-green-ratio',
          type: 'success',
          title: 'Strong Portfolio Performance',
          description: `${Math.round((analyticsData.totalGreenBooks / analyticsData.totalBooks) * 100)}% of your books are in the green zone`,
          icon: TrendingUp,
          priority: 'high'
        });
      }

      if (analyticsData.avgPercentOfHigh < 50) {
        insights.push({
          id: 'low-avg-percent',
          type: 'warning',
          title: 'Below Average Performance',
          description: `Average ${analyticsData.avgPercentOfHigh.toFixed(1)}% of historical high - consider price optimization`,
          icon: TrendingDown,
          priority: 'medium'
        });
      }

      if (analyticsData.totalInventoryValue > 10000) {
        insights.push({
          id: 'high-value-portfolio',
          type: 'info',
          title: 'High-Value Portfolio',
          description: `Your inventory is valued at $${analyticsData.totalInventoryValue.toLocaleString()}`,
          icon: DollarSign,
          priority: 'low'
        });
      }
    }

    // Market-based insights
    if (marketData && marketData.trends) {
      marketData.trends.forEach(trend => {
        insights.push({
          id: `market-${trend.id}`,
          type: trend.type || 'info',
          title: trend.title,
          description: trend.description,
          icon: trend.direction === 'up' ? TrendingUp : TrendingDown,
          priority: trend.priority || 'medium'
        });
      });
    }

    return insights;
  };

  const generateFallbackInsights = (filters) => {
    return [
      {
        id: 'fallback-1',
        type: 'info',
        title: 'Market Analysis Unavailable',
        description: 'Unable to fetch real-time market data. Using cached insights.',
        icon: AlertCircle,
        priority: 'low'
      },
      {
        id: 'fallback-2',
        type: 'info',
        title: 'Portfolio Review Recommended',
        description: 'Consider reviewing your book inventory for optimization opportunities.',
        icon: TrendingUp,
        priority: 'medium'
      }
    ];
  };

  // Generate insights when filters change
  useEffect(() => {
    if (filters) {
      generateInsights();
    }
  }, [filters]);

  const getTypeColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300';
    }
  };

  const sortedInsights = insights.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Market Intelligence Insights
        </h3>
        <button
          onClick={generateInsights}
          disabled={loading}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-700">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Analyzing market data...</span>
        </div>
      )}

      <div className="space-y-3">
        {sortedInsights.map((insight) => {
          const Icon = insight.icon;
          return (
            <div
              key={insight.id}
              className={`p-4 border rounded-lg ${getTypeColor(insight.type)}`}
            >
              <div className="flex items-start">
                <Icon className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium">{insight.title}</h4>
                  <p className="text-sm mt-1 opacity-90">{insight.description}</p>
                </div>
                <span className="text-xs bg-white/50 px-2 py-1 rounded-full">
                  {insight.priority}
                </span>
              </div>
            </div>
          );
        })}

        {!loading && sortedInsights.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No insights available at the moment.</p>
            <button
              onClick={generateInsights}
              className="mt-2 text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilteredInsightsPanel; 