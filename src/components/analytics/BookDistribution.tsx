'use client';

import React from 'react';
import { Analytics, TimeFrame } from '@prisma/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface BookDistributionProps {
  data: Analytics[];
  timeFrame: TimeFrame;
}

export default function BookDistribution({ data, timeFrame }: BookDistributionProps) {
  // Use the most recent data point
  const latestData = data[data.length - 1];
  
  const chartData = [
    { name: 'Green', value: latestData.totalGreenBooks, color: '#10b981' },
    { name: 'Yellow', value: latestData.totalYellowBooks, color: '#f59e0b' },
    { name: 'Red', value: latestData.totalRedBooks, color: '#ef4444' },
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  // Create trend data showing distribution changes over time
  const trendData = data.map(item => {
    const total = item.totalBooks;
    return {
      date: new Date(item.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: timeFrame === 'DAY' ? 'numeric' : undefined
      }),
      green: Math.round((item.totalGreenBooks / total) * 100),
      yellow: Math.round((item.totalYellowBooks / total) * 100),
      red: Math.round((item.totalRedBooks / total) * 100),
    };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value} books`, '']}
              labelFormatter={(name) => `${name} rank`}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-medium mb-2">Distribution Summary</h3>
          <p className="mb-1 text-sm">Total Books: <span className="font-medium">{latestData.totalBooks}</span></p>
          <div className="grid grid-cols-3 gap-4 mt-3">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-green-700 dark:text-green-300">
                {latestData.totalGreenBooks}
              </div>
              <div className="text-xs text-green-600 dark:text-green-200">
                Green (
                {latestData.totalBooks > 0
                  ? Math.round((latestData.totalGreenBooks / latestData.totalBooks) * 100)
                  : 0}%)
              </div>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-yellow-700 dark:text-yellow-300">
                {latestData.totalYellowBooks}
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-200">
                Yellow (
                {latestData.totalBooks > 0
                  ? Math.round((latestData.totalYellowBooks / latestData.totalBooks) * 100)
                  : 0}%)
              </div>
            </div>
            <div className="bg-red-100 dark:bg-red-900 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-red-700 dark:text-red-300">
                {latestData.totalRedBooks}
              </div>
              <div className="text-xs text-red-600 dark:text-red-200">
                Red (
                {latestData.totalBooks > 0
                  ? Math.round((latestData.totalRedBooks / latestData.totalBooks) * 100)
                  : 0}%)
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-sm font-medium mb-2">Book Value Insight</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {latestData.totalGreenBooks > latestData.totalRedBooks
              ? "Your inventory is in great shape! Most books are close to their historical high prices."
              : latestData.totalYellowBooks > latestData.totalGreenBooks
              ? "Your inventory has moderate potential. Consider reviewing yellow ranked books for selling opportunities."
              : "Many of your books are below optimal selling prices. This could be a good time to build your inventory."}
          </p>
        </div>
      </div>
    </div>
  );
}

// components/analyti