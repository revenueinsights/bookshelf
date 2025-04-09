'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { 
  BookOpen, 
  Filter, 
  Search, 
  X, 
  ChevronsUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Trash2,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import PriceRankBadge from '@/components/ui/PriceRankBadge';
import ExportBooksButton from '@/components/books/ExportBooksButton';
// Types
interface Book {
  id: string;
  isbn: string;
  isbn13: string | null;
  title: string | null;
  authors: string[];
  currentPrice: number;
  historicalHigh: number;
  amazonPrice: number | null;
  percentOfHigh: number;
  priceRank: 'GREEN' | 'YELLOW' | 'RED';
  bestVendorName: string | null;
  purchasePrice: number | null;
  condition: string | null;
  lastPriceUpdate: string | null;
  batch: {
    id: string;
    name: string;
  } | null;
}

interface Batch {
  id: string;
  name: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FilterState {
  search: string;
  batchId: string;
  priceRank: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
  sortOrder: string;
}

export default function BookInventoryPage() {
  // Router and query params
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [books, setBooks] = useState<Book[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  
  // Selected books for batch operations
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('search') || '',
    batchId: searchParams.get('batchId') || '',
    priceRank: searchParams.get('priceRank') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sortBy') || 'updatedAt',
    sortOrder: searchParams.get('sortOrder') || 'desc',
  });
  
  // Show filter panel
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch books when filters or pagination changes
  useEffect(() => {
    fetchBooks();
  }, [pagination.page, pagination.limit, searchParams]);
  
  // Fetch batches on mount
  useEffect(() => {
    fetchBatches();
  }, []);
  
  // Fetch books with current filters
  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query string from filters and pagination
      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.set('search', filters.search);
      if (filters.batchId) queryParams.set('batchId', filters.batchId);
      if (filters.priceRank) queryParams.set('priceRank', filters.priceRank);
      if (filters.minPrice) queryParams.set('minPrice', filters.minPrice);
      if (filters.maxPrice) queryParams.set('maxPrice', filters.maxPrice);
      if (filters.sortBy) queryParams.set('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.set('sortOrder', filters.sortOrder);
      
      queryParams.set('page', pagination.page.toString());
      queryParams.set('limit', pagination.limit.toString());
      
      const response = await fetch(`/api/books?${queryParams.toString()}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch books');
      }
      
      const data = await response.json();
      setBooks(data.books);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching books:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch batches for filter dropdown
  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches');
      
      if (!response.ok) {
        throw new Error('Failed to fetch batches');
      }
      
      const data = await response.json();
      setBatches(data);
    } catch (err) {
      console.error('Error fetching batches:', err);
    }
  };
  
  // Apply filters
  const applyFilters = () => {
    // Update URL with filters
    const queryParams = new URLSearchParams();
    
    if (filters.search) queryParams.set('search', filters.search);
    if (filters.batchId) queryParams.set('batchId', filters.batchId);
    if (filters.priceRank) queryParams.set('priceRank', filters.priceRank);
    if (filters.minPrice) queryParams.set('minPrice', filters.minPrice);
    if (filters.maxPrice) queryParams.set('maxPrice', filters.maxPrice);
    if (filters.sortBy) queryParams.set('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.set('sortOrder', filters.sortOrder);
    
    // Reset to page 1 when applying new filters
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // Update URL
    router.push(`/dashboard/books?${queryParams.toString()}`);
    
    // Close filter panel
    setShowFilters(false);
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      batchId: '',
      priceRank: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
  };
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
  };
  
  // Toggle book selection
  const toggleBookSelection = (bookId: string) => {
    setSelectedBooks(prev => {
      if (prev.includes(bookId)) {
        return prev.filter(id => id !== bookId);
      } else {
        return [...prev, bookId];
      }
    });
  };
  
  // Select/deselect all books
  const toggleSelectAll = () => {
    if (selectedBooks.length === books.length) {
      setSelectedBooks([]);
    } else {
      setSelectedBooks(books.map(book => book.id));
    }
  };
  
  // Delete selected books
  const deleteSelectedBooks = async () => {
    if (selectedBooks.length === 0) return;
    
    setIsDeleting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await fetch('/api/books', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookIds: selectedBooks,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete books');
      }
      
      const data = await response.json();
      setSuccessMessage(data.message || `${selectedBooks.length} book(s) deleted successfully`);
      setSelectedBooks([]);
      
      // Refresh books
      fetchBooks();
    } catch (err) {
      console.error('Error deleting books:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete books');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Book Inventory"
        description="View and manage your complete book inventory"
      />
      
      {/* Action Bar */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-3 md:space-y-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-3 py-2 border ${showFilters ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'} rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {(filters.search || filters.batchId || filters.priceRank || filters.minPrice || filters.maxPrice) && (
                <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  Active
                </span>
              )}
            </button>
            
            <div className="relative max-w-xs w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                placeholder="Search books..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              {filters.search && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    onClick={() => {
                      setFilters(prev => ({ ...prev, search: '' }));
                      applyFilters();
                    }}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center mb-4">
    <div className="flex items-center space-x-2">
      {/* Existing filter controls */}
    </div>
    <div className="flex space-x-3">
      <ExportBooksButton />
      {/* Other action buttons */}
    </div>
  </div>
          
          <div className="flex items-center space-x-2">
            {selectedBooks.length > 0 && (
              <button
                onClick={deleteSelectedBooks}
                disabled={isDeleting}
                className="inline-flex items-center px-3 py-2 border border-red-500 text-sm font-medium rounded-md text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedBooks.length})
                  </>
                )}
              </button>
            )}
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {pagination.total} books
            </div>
          </div>
        </div>
        
        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md border border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="batchFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Batch
                </label>
                <select
                  id="batchFilter"
                  value={filters.batchId}
                  onChange={(e) => setFilters(prev => ({ ...prev, batchId: e.target.value }))}
                  className="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">All Batches</option>
                  <option value="none">Unbatched</option>
                  {batches.map(batch => (
                    <option key={batch.id} value={batch.id}>{batch.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="priceRankFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price Rank
                </label>
                <select
                  id="priceRankFilter"
                  value={filters.priceRank}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceRank: e.target.value }))}
                  className="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">All Ranks</option>
                  <option value="GREEN">Green Only</option>
                  <option value="YELLOW">Yellow Only</option>
                  <option value="RED">Red Only</option>
                  <option value="GREEN,YELLOW">Green & Yellow</option>
                </select>
              </div>
              
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label htmlFor="minPriceFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Min Price
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      id="minPriceFilter"
                      min="0"
                      step="0.01"
                      value={filters.minPrice}
                      onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                      placeholder="Min"
                      className="block w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label htmlFor="maxPriceFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Price
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      id="maxPriceFilter"
                      min="0"
                      step="0.01"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                      placeholder="Max"
                      className="block w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="sortByFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sort By
                </label>
                <select
                  id="sortByFilter"
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="updatedAt">Last Updated</option>
                  <option value="title">Title</option>
                  <option value="currentPrice">Current Price</option>
                  <option value="percentOfHigh">Percent of High</option>
                  <option value="lastPriceUpdate">Last Price Update</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="sortOrderFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sort Order
                </label>
                <select
                  id="sortOrderFilter"
                  value={filters.sortOrder}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                  className="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
              
              <div className="md:col-span-3 flex justify-end space-x-2">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Reset
                </button>
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Error and Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md flex items-start">
          <Check className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <p>{successMessage}</p>
        </div>
      )}
      
      {/* Books Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : books.length === 0 ? (
          <div className="p-8 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No books found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filters.search || filters.batchId || filters.priceRank || filters.minPrice || filters.maxPrice
                ? 'Try adjusting your filters'
                : 'Add books to your inventory using the scanner'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedBooks.length === books.length && books.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Book
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Current Price
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Historical High
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    % of High
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Rank
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Batch
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {books.map(book => (
                  <tr 
                    key={book.id}
                    className={`${selectedBooks.includes(book.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''} hover:bg-gray-50 dark:hover:bg-gray-700`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedBooks.includes(book.id)}
                        onChange={() => toggleBookSelection(book.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md">
                          <BookOpen className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {book.title || 'Unknown Title'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {book.authors?.join(', ') || 'Unknown Author'} • ISBN: {book.isbn13 || book.isbn}
                          </div>
                          {book.condition && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Condition: {book.condition}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{formatCurrency(book.currentPrice)}</div>
                      {book.bestVendorName && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{book.bestVendorName}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{formatCurrency(book.historicalHigh)}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                    
                    <div className={`text-sm font-medium ${
                    book.priceRank === 'GREEN' ? 'text-green-600 dark:text-green-400' :
                    book.priceRank === 'YELLOW' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                    }`}>
                    {typeof book.percentOfHigh === 'number' 
                        ? book.percentOfHigh.toFixed(1) 
                        : parseFloat(book.percentOfHigh || 0).toFixed(1)}%
                    </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <PriceRankBadge rank={book.priceRank} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {book.batch ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          {book.batch.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(book.lastPriceUpdate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
{!loading && books.length > 0 && pagination.totalPages > 1 && (
  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 flex items-center justify-between border-t border-gray-200 dark:border-gray-600">
    <div className="flex-1 flex justify-between sm:hidden">
      <button
        onClick={() => handlePageChange(pagination.page - 1)}
        disabled={pagination.page === 1}
        className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      <button
        onClick={() => handlePageChange(pagination.page + 1)}
        disabled={pagination.page === pagination.totalPages}
        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
          <span className="font-medium">
            {Math.min(pagination.page * pagination.limit, pagination.total)}
          </span>{" "}
          of <span className="font-medium">{pagination.total}</span> results
        </p>
      </div>
      <div>
        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
          <button
            onClick={() => handlePageChange(1)}
            disabled={pagination.page === 1}
            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="sr-only">First Page</span>
            <ChevronsUpDown className="h-5 w-5 rotate-90" />
          </button>
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="sr-only">Previous</span>
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          {/* Page numbers */}
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            let pageNumber;
            
            // Logic to determine which page numbers to show
            if (pagination.totalPages <= 5) {
              // If 5 or fewer total pages, show all
              pageNumber = i + 1;
            } else if (pagination.page <= 3) {
              // If current page is 1, 2, or 3, show pages 1-5
              pageNumber = i + 1;
            } else if (pagination.page >= pagination.totalPages - 2) {
              // If current page is among the last 3, show the last 5 pages
              pageNumber = pagination.totalPages - 4 + i;
            } else {
              // Otherwise show 2 pages before and 2 pages after the current page
              pageNumber = pagination.page - 2 + i;
            }
            
            return (
              <button
                key={pageNumber}
                onClick={() => handlePageChange(pageNumber)}
                className={`relative inline-flex items-center px-4 py-2 border ${
                  pagination.page === pageNumber
                    ? 'z-10 bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                } text-sm font-medium`}
              >
                {pageNumber}
              </button>
            );
          })}
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="sr-only">Next</span>
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={() => handlePageChange(pagination.totalPages)}
            disabled={pagination.page === pagination.totalPages}
            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="sr-only">Last Page</span>
            <ChevronsUpDown className="h-5 w-5 -rotate-90" />
          </button>
        </nav>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
}