// components/batches/BatchBookList.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUpDown, Search, Eye, RefreshCw } from 'lucide-react';
import PriceRankBadge from '@/components/ui/PriceRankBadge';
import PriceHistoryButton from '@/components/books/PriceHistoryButton';

interface Book {
  id: string;
  isbn: string;
  isbn13?: string | null;
  title?: string | null;
  authors?: string[];
  currentPrice: number;
  historicalHigh: number;
  percentOfHigh: number;
  priceRank: 'GREEN' | 'YELLOW' | 'RED';
  bestVendorName?: string | null;
  condition?: string | null;
}

interface BatchBookListProps {
  books: Book[];
  batchId: string;
}

const BatchBookList: React.FC<BatchBookListProps> = ({ books, batchId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Book>('currentPrice');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [refreshingBookId, setRefreshingBookId] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleSort = (field: keyof Book) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleRefreshPrice = async (bookId: string) => {
    setRefreshingBookId(bookId);
    
    try {
      // Call the API to refresh the price
      const response = await fetch(`/api/books/${bookId}/refresh-price`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh price');
      }
      
      // In a real app, you would update the book data here
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reload the page to show updated data
      window.location.reload();
    } catch (err) {
      console.error('Error refreshing price:', err);
      alert('Failed to refresh price. Please try again.');
    } finally {
      setRefreshingBookId(null);
    }
  };

  // Filter books by search query
  const filteredBooks = books.filter(book => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (book.title?.toLowerCase().includes(searchLower) || false) ||
      (book.isbn.toLowerCase().includes(searchLower)) ||
      (book.isbn13?.toLowerCase().includes(searchLower) || false) ||
      (book.authors?.some(author => author.toLowerCase().includes(searchLower)) || false)
    );
  });

  // Sort books
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    // Handle special cases for sorting
    if (sortField === 'title' || sortField === 'condition' || sortField === 'bestVendorName') {
      aValue = aValue || '';
      bValue = bValue || '';
    }
    
    if (aValue === bValue) return 0;
    
    // Handle string comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    // Handle numeric comparison
    return sortDirection === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  return (
    <div>
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search books by title, ISBN, or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <button
                  className="flex items-center focus:outline-none"
                  onClick={() => handleSort('title')}
                >
                  Book
                  {sortField === 'title' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                  )}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <button
                  className="flex items-center focus:outline-none"
                  onClick={() => handleSort('currentPrice')}
                >
                  Current Price
                  {sortField === 'currentPrice' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                  )}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <button
                  className="flex items-center focus:outline-none"
                  onClick={() => handleSort('historicalHigh')}
                >
                  Historical High
                  {sortField === 'historicalHigh' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                  )}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <button
                  className="flex items-center focus:outline-none"
                  onClick={() => handleSort('percentOfHigh')}
                >
                  % of High
                  {sortField === 'percentOfHigh' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                  )}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <button
                  className="flex items-center focus:outline-none"
                  onClick={() => handleSort('priceRank')}
                >
                  Rank
                  {sortField === 'priceRank' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                  )}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <button
                  className="flex items-center focus:outline-none"
                  onClick={() => handleSort('bestVendorName')}
                >
                  Best Vendor
                  {sortField === 'bestVendorName' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                  )}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedBooks.length > 0 ? (
              sortedBooks.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {book.title || 'Unknown Title'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                          {book.isbn13 || book.isbn}
                        </div>
                        {book.authors && book.authors.length > 0 && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {book.authors.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(book.currentPrice)}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatCurrency(book.historicalHigh)}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      book.percentOfHigh >= 50 ? 'text-green-600 dark:text-green-400' :
                      book.percentOfHigh >= 1 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {book.percentOfHigh.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <PriceRankBadge rank={book.priceRank} />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {book.bestVendorName || 'Unknown'}
                    </div>
                  </td>
                  <td className="actions">
                    <PriceHistoryButton isbn={book.isbn} />
                    {/* Other action buttons */}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleRefreshPrice(book.id)}
                        disabled={refreshingBookId === book.id}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                      >
                        {refreshingBookId === book.id ? (
                          <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-5 w-5" />
                        )}
                      </button>
                      <Link
                        href={`/dashboard/books/${book.id}`}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery 
                    ? `No books matching "${searchQuery}"` 
                    : 'No books in this batch yet'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BatchBookList;