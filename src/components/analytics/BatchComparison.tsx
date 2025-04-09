'use client';

import React from 'react';
import { TimeFrame } from '@prisma/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BatchComparisonProps {
  data: any[];
  timeFrame: TimeFrame;
}

export default function BatchComparison({ data, timeFrame }: BatchComparisonProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Prepare data for the chart
  const chartData = data.map(batch => ({
    name: batch.batchName,
    totalValue: Number(batch.totalValue || 0),
    books: batch.totalBooks || 0,
    greenPercentage: batch.greenCount ? Math.round((batch.greenCount / batch.totalBooks) * 100) : 0,
    avgPrice: batch.totalBooks ? Math.round(Number(batch.totalValue) / batch.totalBooks) : 0
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" tickFormatter={formatCurrency} />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip 
            formatter={(value: any, name: string) => {
              if (name === 'totalValue') return [formatCurrency(value), 'Total Value'];
              if (name === 'avgPrice') return [formatCurrency(value), 'Avg Book Value'];
              if (name === 'books') return [value, 'Number of Books'];
              if (name === 'greenPercentage') return [`${value}%`, 'Green Books %'];
              return [value, name];
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="totalValue" name="Total Value" fill="#3b82f6" />
          <Bar yAxisId="right" dataKey="books" name="Book Count" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
