// components/books/PriceHistoryModal.tsx (updated error handling)
'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog/dialog';
import { X } from 'lucide-react';

interface PriceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  isbn: string;
}

interface PriceDataPoint {
  week: string;
  maxPrice: number;
  avgPrice: number;
  bestVendor: string;
}

export default function PriceHistoryModal({ isOpen, onClose, isbn }: PriceHistoryModalProps) {
  const [priceData, setPriceData] = useState<PriceDataPoint[]>([]);
  const [highestPrice, setHighestPrice] = useState<{ maxPrice: number; week: string; bestVendor: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && isbn) {
      fetchPriceHistory();
      fetchHighestPrice();
    }
  }, [isOpen, isbn]);

  const fetchPriceHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/books/price-history?isbn=${isbn}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch price history');
      }
      
      const data = await response.json();

      // Check if we have valid data
      if (!data || !Array.isArray(data)) {
        setPriceData([]);
        return;
      }
      
      // Reverse the array so most recent data is on the right
      setPriceData(data.reverse());
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching price history');
      console.error('Error fetching price history:', err);
      setPriceData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHighestPrice = async () => {
    try {
      const response = await fetch(`/api/books/highest-price?isbn=${isbn}`);
      
      if (!response.ok) {
        console.error('Failed to fetch highest price');
        return;
      }
      
      const data = await response.json();
      
      // Only set highest price if we have valid data
      if (data && data.maxPrice) {
        setHighestPrice(data);
      } else {
        setHighestPrice(null);
      }
    } catch (err: any) {
      console.error('Error fetching highest price:', err);
      setHighestPrice(null);
    }
  };

  const formatWeek = (week: string) => {
    // Convert weeks like "2025-W09" to a more readable format
    const matches = week.match(/(\d{4})-W(\d{2})/);
    if (matches) {
      const [_, year, weekNum] = matches;
      return `W${weekNum} ${year}`;
    }
    return week;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="font-bold">{formatWeek(label)}</p>
          <p className="text-green-600 dark:text-green-400">
            Max Price: ${payload[0].value.toFixed(2)}
          </p>
          <p className="text-blue-600 dark:text-blue-400">
            Avg Price: ${payload[1].value.toFixed(2)}
          </p>
          {payload[0].payload.bestVendor && (
            <p className="text-gray-600 dark:text-gray-400">
              Best Vendor: {payload[0].payload.bestVendor}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} className="sm:max-w-4xl">
      <DialogContent>
        <div className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100">
          <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        
        <DialogHeader>
          <DialogTitle>Price History for ISBN: {isbn}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center p-4">
            {error}
          </div>
        ) : priceData.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <p>No price history data is available for this ISBN.</p>
            <p className="mt-2 text-sm">This book may not have any recorded sales in the BookScouter database.</p>
          </div>
        ) : (
          <>
            {highestPrice && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 mb-4 rounded-lg">
                <h3 className="font-bold text-green-600 dark:text-green-400 text-lg mb-2">All-Time High Price</h3>
                <p className='text-green-500 dark:text-green-400 '>
                  <span className="font-medium ">Price:</span> ${highestPrice.maxPrice.toFixed(2)}
                </p>
                <p className='text-green-500 dark:text-green-400'>
                  <span className="font-medium ">Date:</span> {formatWeek(highestPrice.week)}
                </p>
                <p className='text-green-500 dark:text-green-400'>
                  <span className="font-medium ">Vendor:</span> {highestPrice.bestVendor}
                </p>
              </div>
            )}
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={priceData.map(item => ({
                    ...item,
                    maxPrice: Number(item.maxPrice),
                    avgPrice: Number(item.avgPrice)
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="week" 
                    tickFormatter={formatWeek}
                    interval={Math.floor(priceData.length / 10)}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="maxPrice" 
                    name="Max Price" 
                    stroke="#10b981" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgPrice" 
                    name="Avg Price" 
                    stroke="#3b82f6" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              {priceData.length > 0 ? (
                <p>
                  Showing price history for {priceData.length} weeks, 
                  most recent price: ${priceData[priceData.length - 1]?.maxPrice.toFixed(2)} 
                  (Best vendor: {priceData[priceData.length - 1]?.bestVendor})
                </p>
              ) : (
                <p>No price history data available for this ISBN.</p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}