'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Clock, Calendar, CalendarDays } from 'lucide-react';

interface TimeFrameSelectorProps {
  currentTimeFrame: string;
}

export default function TimeFrameSelector({ currentTimeFrame }: TimeFrameSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleTimeFrameChange = (timeFrame: string) => {
    router.push(`${pathname}?timeFrame=${timeFrame}`);
  };

  const timeFrames = [
    { value: 'DAY', label: 'Daily', icon: Clock },
    { value: 'WEEK', label: 'Weekly', icon: Calendar },
    { value: 'MONTH', label: 'Monthly', icon: CalendarDays }
  ];

  return (
    <div className="flex rounded-md shadow-sm">
      {timeFrames.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          className={`
            px-4 py-2 text-sm flex items-center
            ${
              currentTimeFrame === value
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
            }
            ${value === 'DAY' ? 'rounded-l-md' : ''}
            ${value === 'MONTH' ? 'rounded-r-md' : ''}
            border border-gray-300 dark:border-gray-600
          `}
          onClick={() => handleTimeFrameChange(value)}
        >
          <Icon className="h-4 w-4 mr-1" />
          {label}
        </button>
      ))}
    </div>
  );
}
