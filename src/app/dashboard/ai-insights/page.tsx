'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Lightbulb,
  RefreshCw,
  Settings,
  DollarSign,
  BarChart3,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

interface PriceAlert {
  id: string;
  type: 'PRICE_DROP' | 'PRICE_SPIKE' | 'TREND_CHANGE' | 'OPPORTUNITY' | 'WARNING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  bookId: string;
  bookTitle: string;
  isbn: string;
  currentPrice: number;
  previousPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  aiInsight: string;
  actionRecommendation: string;
  confidence: number;
  createdAt: string;
  expiresAt?: string;
}

interface MarketSummary {
  totalBooks: number;
  totalValue: number;
  totalProfit: number;
  profitMargin: number;
  topPerformers: any[];
  underPerformers: any[];
  marketTrend: string;
  aiSummary: string;
}

export default function AIInsightsPage() {
  const { data: session } = useSession();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [summary, setSummary] = useState<MarketSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'alerts' | 'summary'>('alerts');
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-insights?type=alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      } else {
        toast.error('Failed to load AI insights');
      }
    } catch (error) {
      toast.error('Error loading AI insights');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSummary = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-insights?type=summary');
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
      } else {
        toast.error('Failed to load market summary');
      }
    } catch (error) {
      toast.error('Error loading market summary');
    } finally {
      setIsLoading(false);
    }
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    toast.success('Alert dismissed');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 border-red-500 text-red-800 dark:bg-red-900/20 dark:border-red-400 dark:text-red-300';
      case 'HIGH': return 'bg-orange-100 border-orange-500 text-orange-800 dark:bg-orange-900/20 dark:border-orange-400 dark:text-orange-300';
      case 'MEDIUM': return 'bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-400 dark:text-yellow-300';
      case 'LOW': return 'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300';
      default: return 'bg-gray-100 border-gray-500 text-gray-800 dark:bg-gray-900/20 dark:border-gray-400 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'OPPORTUNITY': return <Target className="h-5 w-5 text-green-600" />;
      case 'WARNING': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'PRICE_SPIKE': return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'PRICE_DROP': return <TrendingDown className="h-5 w-5 text-red-600" />;
      case 'TREND_CHANGE': return <BarChart3 className="h-5 w-5 text-blue-600" />;
      default: return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getMarketTrendIcon = (trend: string) => {
    switch (trend) {
      case 'BULLISH': return <TrendingUp className="h-6 w-6 text-green-600" />;
      case 'BEARISH': return <TrendingDown className="h-6 w-6 text-red-600" />;
      default: return <BarChart3 className="h-6 w-6 text-blue-600" />;
    }
  };

  useEffect(() => {
    if (session) {
      if (activeTab === 'alerts') {
        loadAlerts();
      } else {
        loadSummary();
      }
    }
  }, [session, activeTab]);

  if (!session) {
    return <div>Please sign in to view AI insights.</div>;
  }

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              AI Insights
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Intelligent analysis and alerts for your book collection
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => activeTab === 'alerts' ? loadAlerts() : loadSummary()}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'alerts'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Alerts ({visibleAlerts.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'summary'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Market Summary
            </div>
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'alerts' ? (
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-purple-600" />
              <p className="mt-2 text-gray-600 dark:text-gray-400">Analyzing your collection...</p>
            </div>
          ) : visibleAlerts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">All Clear!</h3>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                No urgent alerts for your collection right now.
              </p>
            </div>
          ) : (
            visibleAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`border-l-4 rounded-lg p-6 ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getTypeIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">{alert.title}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs px-2 py-1 bg-white/50 rounded-full">
                            {alert.confidence}% confidence
                          </span>
                          <button
                            onClick={() => dismissAlert(alert.id)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm mb-3">{alert.message}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium mb-1 flex items-center">
                            <Lightbulb className="h-4 w-4 mr-1" />
                            AI Insight
                          </h4>
                          <p className="text-sm opacity-90">{alert.aiInsight}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1 flex items-center">
                            <Target className="h-4 w-4 mr-1" />
                            Recommendation
                          </h4>
                          <p className="text-sm opacity-90">{alert.actionRecommendation}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs opacity-75">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <BookOpen className="h-3 w-3 mr-1" />
                            {alert.bookTitle}
                          </span>
                          {alert.currentPrice && (
                            <span className="flex items-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              ${alert.currentPrice.toFixed(2)}
                            </span>
                          )}
                          {alert.priceChangePercent && (
                            <span className={`flex items-center ${
                              alert.priceChangePercent > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {alert.priceChangePercent > 0 ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              )}
                              {Math.abs(alert.priceChangePercent).toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-purple-600" />
              <p className="mt-2 text-gray-600 dark:text-gray-400">Generating market analysis...</p>
            </div>
          ) : summary ? (
            <>
              {/* Market Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <BookOpen className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Books</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalBooks}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${summary.totalValue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Profit</p>
                      <p className={`text-2xl font-bold ${
                        summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${summary.totalProfit.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center">
                    {getMarketTrendIcon(summary.marketTrend)}
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Market Trend</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {summary.marketTrend}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <Brain className="h-6 w-6 text-purple-600 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      AI Market Analysis
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {summary.aiSummary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Top and Under Performers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {summary.topPerformers.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                      Top Performers
                    </h3>
                    <div className="space-y-3">
                      {summary.topPerformers.slice(0, 5).map((book, index) => (
                        <div key={book.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{book.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ${book.currentPrice.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-green-600 font-semibold">
                              +{(((book.currentPrice - book.purchasePrice) / book.purchasePrice) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {summary.underPerformers.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
                      Under Performers
                    </h3>
                    <div className="space-y-3">
                      {summary.underPerformers.slice(0, 5).map((book, index) => (
                        <div key={book.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{book.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ${book.currentPrice.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-red-600 font-semibold">
                              {(((book.currentPrice - book.purchasePrice) / book.purchasePrice) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No Data Available</h3>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Add some books to your collection to see market analysis.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 