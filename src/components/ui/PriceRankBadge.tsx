// components/ui/PriceRankBadge.tsx
import React from 'react';

interface PriceRankBadgeProps {
  rank: 'GREEN' | 'YELLOW' | 'RED';
  size?: 'sm' | 'md' | 'lg';
}

const PriceRankBadge: React.FC<PriceRankBadgeProps> = ({ rank, size = 'md' }) => {
  const getColorClasses = () => {
    switch (rank) {
      case 'GREEN':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'YELLOW':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'RED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-3 py-1 text-sm';
      case 'md':
      default:
        return 'px-2.5 py-0.5 text-xs';
    }
  };

  const getLabelText = () => {
    switch (rank) {
      case 'GREEN':
        return 'Good Price';
      case 'YELLOW':
        return 'Fair Price';
      case 'RED':
        return 'Low Price';
      default:
        return rank;
    }
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${getColorClasses()} ${getSizeClasses()}`}
    >
      {getLabelText()}
    </span>
  );
};

export default PriceRankBadge;