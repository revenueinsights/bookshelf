'use client';

import { useState, useEffect } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Target,
  AlertCircle,
  Zap,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  RefreshCw,
  Filter,
  Star
} from 'lucide-react';

interface FlipDeal {
  id: string;
  isbn: string;
  title: string;
  author: string;
  currentPrice: number;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  profitMargin: number;
  vendor: string;
  condition: string;
  lastUpdated: Date;
  popularity: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export default function HotFlipDealsPage() {
  const [deals, setDeals] = useState<FlipDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('profit');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mock data for demonstration - using fixed date to avoid hydration mismatch
  const fixedDate = new Date('2024-01-15T10:30:00Z');
  const mockDeals: FlipDeal[] = [
    {
      id: '1',
      isbn: '9780134685991',
      title: 'Effective Java',
      author: 'Joshua Bloch',
      currentPrice: 45.99,
      buyPrice: 25.00,
      sellPrice: 45.99,
      profit: 20.99,
      profitMargin: 83.96,
      vendor: 'Amazon',
      condition: 'Good',
      lastUpdated: fixedDate,
      popularity: 95,
      riskLevel: 'LOW'
    },
    {
      id: '2',
      isbn: '9781617294945',
      title: 'Spring in Action',
      author: 'Craig Walls',
      currentPrice: 52.99,
      buyPrice: 18.50,
      sellPrice: 52.99,
      profit: 34.49,
      profitMargin: 186.43,
      vendor: 'BookFinder',
      condition: 'Very Good',
      lastUpdated: fixedDate,
      popularity: 88,
      riskLevel: 'LOW'
    },
    {
      id: '3',
      isbn: '9780135957059',
      title: 'The Pragmatic Programmer',
      author: 'David Thomas',
      currentPrice: 41.99,
      buyPrice: 15.00,
      sellPrice: 41.99,
      profit: 26.99,
      profitMargin: 179.93,
      vendor: 'Chegg',
      condition: 'Good',
      lastUpdated: fixedDate,
      popularity: 92,
      riskLevel: 'MEDIUM'
    },
    {
      id: '4',
      isbn: '9781449331818',
      title: 'Learning React',
      author: 'Alex Banks',
      currentPrice: 38.99,
      buyPrice: 12.75,
      sellPrice: 38.99,
      profit: 26.24,
      profitMargin: 205.80,
      vendor: 'VitalSource',
      condition: 'Like New',
      lastUpdated: fixedDate,
      popularity: 85,
      riskLevel: 'HIGH'
    }
  ];

  useEffect(() => {
    // Simulate loading deals
    const loadDeals = () => {
      setIsLoading(true);
      setTimeout(() => {
        setDeals(mockDeals);
        setIsLoading(false);
      }, 1500);
    };

    loadDeals();

    // Auto-refresh every 30 seconds if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadDeals, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const filteredDeals = deals.filter(deal => {
    if (filter === 'all') return true;
    if (filter === 'high-profit') return deal.profit > 25;
    if (filter === 'low-risk') return deal.riskLevel === 'LOW';
    if (filter === 'popular') return deal.popularity > 90;
    return true;
  });

  const sortedDeals = [...filteredDeals].sort((a, b) => {
    switch (sortBy) {
      case 'profit':
        return b.profit - a.profit;
      case 'margin':
        return b.profitMargin - a.profitMargin;
      case 'popularity':
        return b.popularity - a.popularity;
      default:
        return 0;
    }
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'HIGH': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const refreshDeals = () => {
    setIsLoading(true);
    setTimeout(() => {
      setDeals([...mockDeals].map(deal => ({
        ...deal,
        lastUpdated: new Date(),
        profit: deal.profit + (Math.random() - 0.5) * 5,
        profitMargin: deal.profitMargin + (Math.random() - 0.5) * 20
      })));
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Hot Flip Deals"
        description="Real-time book flipping opportunities with high profit potential"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg mr-3">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Deals</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{deals.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Profit</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${deals.length > 0 ? (deals.reduce((sum, deal) => sum + deal.profit, 0) / deals.length).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg mr-3">
              <Target className="h-6 w-6 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">High Margin</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {deals.filter(deal => deal.profitMargin > 150).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg mr-3">
              <Clock className="h-6 w-6 text-orange-600 dark:text-orange-300" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Last Update</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {deals.length > 0 ? 'Just now' : 'Never'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Deals</option>
                <option value="high-profit">High Profit ($25+)</option>
                <option value="low-risk">Low Risk</option>
                <option value="popular">Popular Books</option>
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="profit">Sort by Profit</option>
              <option value="margin">Sort by Margin</option>
              <option value="popularity">Sort by Popularity</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Auto-refresh</span>
            </label>

            <button
              onClick={refreshDeals}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Deals List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Live Flip Opportunities
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Scanning for hot deals...</p>
          </div>
        ) : sortedDeals.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No deals found matching your criteria</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedDeals.map((deal) => (
              <div key={deal.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {deal.title}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(deal.riskLevel)}`}>
                        {deal.riskLevel} RISK
                      </span>
                      {deal.popularity > 90 && (
                        <Star className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      by {deal.author} • ISBN: {deal.isbn}
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Buy: <span className="font-medium">${deal.buyPrice.toFixed(2)}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Sell: <span className="font-medium">${deal.sellPrice.toFixed(2)}</span>
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        via {deal.vendor}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      <ArrowUp className="h-4 w-4 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">
                        ${deal.profit.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {deal.profitMargin.toFixed(1)}% margin
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {deal.popularity}% popular
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alert Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-center">
          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg mr-4">
            <Zap className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-1">
              Real-time Deal Alerts
            </h4>
            <p className="text-blue-700 dark:text-blue-300">
              Enable notifications to get instant alerts when new high-profit deals are discovered. 
              React fast to maximize your flipping opportunities!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 