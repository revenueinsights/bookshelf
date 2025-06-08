'use client';

import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target } from 'lucide-react';

interface PricePoint {
  date: string;
  price: number;
  timestamp: number;
}

interface PricingHistoryChartProps {
  isbn: string;
  bookTitle: string;
  currentPrice: number;
  priceHistory: PricePoint[];
  onSetAlert?: (price: number) => void;
}

export default function PricingHistoryChart({ 
  isbn, 
  bookTitle, 
  currentPrice, 
  priceHistory,
  onSetAlert 
}: PricingHistoryChartProps) {
  const [alertPrice, setAlertPrice] = useState<string>('');
  const [showAlertForm, setShowAlertForm] = useState(false);

  // Generate sample data if no history provided (for demo purposes)
  const sampleData = priceHistory.length > 0 ? priceHistory : generateSampleData();

  function generateSampleData(): PricePoint[] {
    const data: PricePoint[] = [];
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 4); // 4 years ago
    
    let basePrice = currentPrice || 38.77;
    
    // Generate realistic price fluctuations
    for (let i = 0; i < 48; i++) { // 48 months of data
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      
      // Add some realistic price variation
      const variation = (Math.random() - 0.5) * 0.3; // ±15% variation
      const seasonalEffect = Math.sin((i / 12) * 2 * Math.PI) * 0.1; // Seasonal variation
      const trendEffect = i * 0.002; // Slight upward trend
      
      basePrice = Math.max(5, basePrice * (1 + variation + seasonalEffect + trendEffect));
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        price: Math.round(basePrice * 100) / 100,
        timestamp: date.getTime()
      });
    }
    
    return data;
  }

  const formatPrice = (value: number) => `$${value.toFixed(2)}`;
  
  const formatDate = (value: string) => value;

  const minPrice = Math.min(...sampleData.map(d => d.price));
  const maxPrice = Math.max(...sampleData.map(d => d.price));
  const priceRange = maxPrice - minPrice;

  const handleSetAlert = () => {
    const price = parseFloat(alertPrice);
    if (price > 0 && onSetAlert) {
      onSetAlert(price);
      setAlertPrice('');
      setShowAlertForm(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Pricing History for ISBN {isbn}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{bookTitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPrice(currentPrice)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Current Price</div>
          </div>
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
            <img 
              src="/api/placeholder/48/48" 
              alt="Textbook Maniac"
              className="w-8 h-8 rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <DollarSign className="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sampleData}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              stroke="#6B7280"
            />
            <YAxis 
              tickFormatter={formatPrice}
              tick={{ fontSize: 12 }}
              stroke="#6B7280"
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip 
              formatter={(value: number) => [formatPrice(value), 'Price']}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '8px'
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Price Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Lowest MAX Price</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatPrice(minPrice)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                ({sampleData.find(d => d.price === minPrice)?.date})
              </p>
            </div>
            <TrendingDown className="h-6 w-6 text-red-500" />
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Highest MAX Price</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatPrice(maxPrice)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                ({sampleData.find(d => d.price === maxPrice)?.date})
              </p>
            </div>
            <TrendingUp className="h-6 w-6 text-green-500" />
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Price Alert</p>
              {showAlertForm ? (
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="number"
                    step="0.01"
                    value={alertPrice}
                    onChange={(e) => setAlertPrice(e.target.value)}
                    placeholder="46.63"
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                  <button
                    onClick={handleSetAlert}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    SAVE
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAlertForm(true)}
                  className="text-lg font-bold text-blue-600 hover:text-blue-700"
                >
                  Set Alert
                </button>
              )}
            </div>
            <Target className="h-6 w-6 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Full Pricing History Button */}
      <div className="text-center">
        <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
          FULL PRICING HISTORY
        </button>
      </div>
    </div>
  );
} 