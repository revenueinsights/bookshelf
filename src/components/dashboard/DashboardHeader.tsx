// components/dashboard/DashboardHeader.tsx
import React from 'react';

interface DashboardHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  description,
  actions,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="mt-4 md:mt-0">{actions}</div>}
    </div>
  );
};

export default DashboardHeader;