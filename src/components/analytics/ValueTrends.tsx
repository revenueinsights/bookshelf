'use client';

import React from 'react';
import { Analytics, TimeFrame } from '@prisma/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ValueTrendsProps {
  data: Analytics[];
  timeFrame: TimeFrame;
}

export default function ValueTrends({ data, timeFrame }: ValueTrendsProps) {
  const formatDate = (date: string | Date) => {
    const dateObj = new Date(date);
    
    switch (timeFrame) {
      case 'DAY':
        return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'WEEK':
        return `Week ${dateObj.toLocaleDateString('en-US', { day: '2-digit' })}`;
      case 'MONTH':
        return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      case 'QUARTER':
        const quarter = Math.ceil((dateObj.getMonth() + 1) / 3);
        return `Q${quarter} ${dateObj.getFullYear()}`;
      case 'YEAR':
        return dateObj.getFullYear().toString();
      default:
        return dateObj.toLocaleDateString();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const chartData = data.map(item => ({
    date: formatDate(item.date),
    totalValue: Number(item.totalInventoryValue),
    avgValue: Number(item.avgBookValue),
    ...(item.potentialProfit !== null && { profit: Number(item.potentialProfit) })
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" tickFormatter={formatCurrency} />
          <YAxis yAxisId="right" orientation="right" tickFormatter={formatCurrency} />
          <Tooltip 
            formatter={(value: number) => [formatCurrency(value), '']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="totalValue" 
            name="Total Value" 
            stroke="#3b82f6" 
            activeDot={{ r: 8 }} 
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="avgValue" 
            name="Avg Book Value" 
            stroke="#10b981" 
          />
          {data[0]?.potentialProfit !== null && (
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="profit" 
              name="Potential Profit" 
              stroke="#f59e0b" 
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
