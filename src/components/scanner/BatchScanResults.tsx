// components/scanner/BatchScanResults.tsx
'use client';

import React from 'react';
import { BookOpen, Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import PriceRankBadge from '@/components/ui/PriceRankBadge';

interface BookData {
  isbn: string;
  isbn13?: string;
  title?: string;
  authors?: string[];
  currentPrice: number;
  amazonPrice?: number;
  historicalHigh: number;
  percentOfHigh: number;
  priceRank: 'GREEN' | 'YELLOW' | 'RED';
  bestVendorName?: string;
  publisher?: string;
  publishedDate?: string;
  imageUrl?: string;
  existingBook?: boolean;
}

interface ScanResult {
  isbn: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  message?: string;
  data?: BookData;
}

interface BatchScanResultsProps {
  results: ScanResult[];
  selectedBooks: Set<string>;
  onSelectBook: (isbn: string, selected: boolean) => void;
}

const BatchScanResults: React.FC<BatchScanResultsProps> = ({ 
  results, 
  selectedBooks,
  onSelectBook 
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <span className="sr-only">Selection</span>
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Book
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Price
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Historical High
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              % of High
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Rank
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {results.map((result) => (
            <tr key={result.isbn} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-3 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                  checked={selectedBooks.has(result.isbn)}
                  onChange={(e) => onSelectBook(result.isbn, e.target.checked)}
                  disabled={result.status !== 'success'}
                />
              </td>
              <td className="px-3 py-4 whitespace-nowrap">
                {result.status === 'pending' && (
                  <Clock className="h-5 w-5 text-gray-400" />
                )}
                {result.status === 'loading' && (
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                )}
                {result.status === 'success' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {result.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </td>
              <td className="px-3 py-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                    {result.data?.imageUrl ? (
                      <img
                        src={result.data.imageUrl}
                        alt={result.data.title}
                        className="h-10 w-10 object-cover rounded-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>`;
                        }}
                      />
                    ) : (
                      <BookOpen className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {result.status === 'success' ? result.data?.title || 'Unknown Title' : result.isbn}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {result.status === 'success' ? (
                        <>
                          {result.data?.authors?.join(', ') || 'Unknown Author'} • ISBN: {result.data?.isbn13 || result.isbn}
                          {result.data?.existingBook && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              In Inventory
                            </span>
                          )}
                        </>
                      ) : result.status === 'error' ? (
                        <span className="text-red-500">{result.message || 'Error'}</span>
                      ) : (
                        <span>ISBN: {result.isbn}</span>
                      )}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-4 whitespace-nowrap">
                {result.status === 'success' && (
                  <div className="text-sm text-gray-900 dark:text-white">
                    {formatCurrency(result.data!.currentPrice)}
                    {result.data?.bestVendorName && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {result.data.bestVendorName}
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="px-3 py-4 whitespace-nowrap">
                {result.status === 'success' && (
                  <div className="text-sm text-gray-900 dark:text-white">
                    {formatCurrency(result.data!.historicalHigh)}
                  </div>
                )}
              </td>
              <td className="px-3 py-4 whitespace-nowrap">
                {result.status === 'success' && (
                  <div className="text-sm font-medium">
                    <span className={
                      result.data!.priceRank === 'GREEN' ? 'text-green-600 dark:text-green-400' :
                      result.data!.priceRank === 'YELLOW' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }>
                      {result.data!.percentOfHigh.toFixed(1)}%
                    </span>
                  </div>
                )}
              </td>
              <td className="px-3 py-4 whitespace-nowrap">
                {result.status === 'success' && (
                  <PriceRankBadge rank={result.data!.priceRank} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BatchScanResults;
