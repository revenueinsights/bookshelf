// app/dashboard/scanner/page.tsx (updated)
'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, BookOpen, Check, AlertCircle, Loader2, Info, ChevronDown, ChevronUp } from 'lucide-react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import IsbnInput from '@/components/scanner/IsbnInput';
import BarcodeScanner from '@/components/scanner/BarcodeScanner';
import PriceRankBadge from '@/components/ui/PriceRankBadge';
import PriceHistoryButton from '@/components/books/PriceHistoryButton';
import { useRouter } from 'next/navigation';

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
  priceHistory?: any[];
  amazonPriceHistory?: any[];
}

interface HighestPriceData {
  maxPrice: number;
  week: string;
  bestVendor: string;
}

interface Batch {
  id: string;
  name: string;
}

export default function ScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [highestPriceData, setHighestPriceData] = useState<HighestPriceData | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Additional fields for book details
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [condition, setCondition] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);

  const router = useRouter();

  // Fetch batches on component mount
  useEffect(() => {
    async function fetchBatches() {
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
    }

    fetchBatches();
  }, []);

  const fetchHighestPrice = async (isbn: string) => {
    try {
      const response = await fetch(`/api/books/highest-price?isbn=${isbn}`);
      
      if (!response.ok) {
        console.error('Failed to fetch highest price data');
        return null;
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching highest price:', err);
      return null;
    }
  };

  const handleSearch = async (isbn: string) => {
    setIsLoading(true);
    setError(null);
    setBookData(null);
    setHighestPriceData(null);
    setSuccessMessage(null);
    // Reset additional fields
    setPurchasePrice('');
    setCondition('');
    setNotes('');
    setShowAdditionalFields(false);

    try {
      // First fetch book data
      const response = await fetch('/api/books/price-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isbn }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch book data');
      }

      const data = await response.json();
      setBookData(data);
      
      // Now fetch highest price data separately
      const highestPrice = await fetchHighestPrice(isbn);
      setHighestPriceData(highestPrice);
      
      // If the book already exists in inventory, show a message
      if (data.existingBook) {
        setSuccessMessage('This book is already in your inventory. Latest price info has been loaded.');
      }
    } catch (err) {
      console.error('Error fetching book data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch book data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanDetected = (isbn: string) => {
    setIsScanning(false);
    handleSearch(isbn);
  };

  const handleAddToInventory = async () => {
    if (!bookData) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const payload: any = {
        isbn: bookData.isbn,
        batchId: selectedBatch || undefined
      };

      // Add historical high data if available
      if (highestPriceData && highestPriceData.maxPrice) {
        payload.historicalHigh = highestPriceData.maxPrice;
      }

      // Add optional fields if provided
      if (purchasePrice.trim()) {
        payload.purchasePrice = parseFloat(purchasePrice);
      }
      
      if (condition.trim()) {
        payload.condition = condition;
      }
      
      if (notes.trim()) {
        payload.notes = notes;
      }

      const response = await fetch('/api/books/price-lookup/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add book');
      }

      const data = await response.json();
      
      setSuccessMessage(data.message || `Book "${bookData.title || bookData.isbn}" added to inventory`);
      
      // Clear selected batch after successful add
      setSelectedBatch(null);
      setPurchasePrice('');
      setCondition('');
      setNotes('');
      setShowAdditionalFields(false);

      // Navigate to the inventory page after successful addition
      router.push('/dashboard/books');
    } catch (err) {
      console.error('Error adding book:', err);
      setError(err instanceof Error ? err.message : 'Failed to add book. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Function to format the week date
  const formatWeekDate = (weekString: string) => {
    if (!weekString) return '';
    
    const matches = weekString.match(/(\d{4})-W(\d{2})/);
    if (matches) {
      const [_, year, week] = matches;
      return `Week ${week}, ${year}`;
    }
    return weekString;
  };

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Book Scanner"
        description="Scan book barcodes to check current market prices"
      />

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className={`p-3 rounded-full ${isScanning ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200' : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200'} mr-4`}>
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-gray-900 dark:text-white">
                {isScanning ? 'Scanning Barcode' : 'Enter ISBN or Scan Barcode'}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {isScanning 
                  ? 'Position the barcode in the center of the camera view' 
                  : 'Enter a 10 or 13 digit ISBN to check pricing data'}
              </p>
            </div>
          </div>

          {isScanning ? (
            <div className="mb-6">
              <BarcodeScanner onDetected={handleScanDetected} onCancel={() => setIsScanning(false)} />
            </div>
          ) : (
            <div className="mb-6">
              <IsbnInput onSearch={handleSearch} onScanClick={() => setIsScanning(true)} isLoading={isLoading} />
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md flex items-start">
              <Check className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>{successMessage}</p>
            </div>
          )}

          {bookData && (
            <div className="mb-6">
              <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 flex items-center">
                  <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-md mr-4">
                    {bookData.imageUrl ? (
                      <img 
                        src={bookData.imageUrl} 
                        alt={bookData.title} 
                        className="h-12 w-12 object-cover"
                        onError={(e) => {
                          // Fallback to icon if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const icon = document.createElement('div');
                            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>';
                            parent.appendChild(icon);
                          }
                        }}
                      />
                    ) : (
                      <BookOpen className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                      {bookData.title || 'Unknown Title'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {bookData.authors?.join(', ') || 'Unknown Author'} • ISBN: {bookData.isbn13 || bookData.isbn}
                    </p>
                    {bookData.publisher && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {bookData.publisher} {bookData.publishedDate ? `• ${bookData.publishedDate}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <PriceHistoryButton isbn={bookData.isbn} />
                    <PriceRankBadge rank={bookData.priceRank} />
                  </div>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Display current price from vendor */}
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Price</p>
                    <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(bookData.currentPrice)}
                    </p>
                    {bookData.bestVendorName && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Best price from {bookData.bestVendorName}
                      </p>
                    )}
                  </div>

                  {/* Display historical high data */}
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Historical High</p>
                    <p className="mt-1 text-xl font-semibold text-green-600 dark:text-green-400">
                      {highestPriceData ? formatCurrency(highestPriceData.maxPrice) : formatCurrency(bookData.historicalHigh)}
                    </p>
                    {highestPriceData && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formatWeekDate(highestPriceData.week)} • {highestPriceData.bestVendor}
                      </p>
                    )}
                  </div>

                  {/* Display Amazon price in its own section */}
                  {bookData.amazonPrice !== undefined && bookData.amazonPrice > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Amazon Price</p>
                      <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(bookData.amazonPrice)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Percent of High</p>
                    <p className={`mt-1 text-xl font-semibold ${
                      bookData.priceRank === 'GREEN' ? 'text-green-600 dark:text-green-400' :
                      bookData.priceRank === 'YELLOW' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {highestPriceData 
                        ? ((bookData.currentPrice / highestPriceData.maxPrice) * 100).toFixed(1) 
                        : bookData.percentOfHigh.toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                {/* Additional book details toggle section */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowAdditionalFields(!showAdditionalFields)}
                    className="flex w-full items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none"
                  >
                    <span className="flex items-center">
                      <Info className="h-4 w-4 mr-2" />
                      {showAdditionalFields ? 'Hide additional details' : 'Add additional details'}
                    </span>
                    {showAdditionalFields ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {/* Additional fields when expanded */}
                {showAdditionalFields && (
                  <div className="p-4 border-t dark:border-gray-700">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Purchase Price
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            id="purchasePrice"
                            name="purchasePrice"
                            placeholder="0.00"
                            value={purchasePrice}
                            onChange={(e) => setPurchasePrice(e.target.value)}
                            className="block w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="condition" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Condition
                        </label>
                        <select
                          id="condition"
                          name="condition"
                          value={condition}
                          onChange={(e) => setCondition(e.target.value)}
                          className="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select condition</option>
                          <option value="New">New</option>
                          <option value="Like New">Like New</option>
                          <option value="Very Good">Very Good</option>
                          <option value="Good">Good</option>
                          <option value="Acceptable">Acceptable</option>
                          <option value="Poor">Poor</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Notes
                        </label>
                        <textarea
                          id="notes"
                          name="notes"
                          rows={2}
                          placeholder="Add any additional information about this book"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Batch selection and add button */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="mb-4 sm:mb-0">
                      <label htmlFor="batch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Add to Batch (Optional)
                      </label>
                      <select
                        id="batch"
                        className="max-w-xs block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm placeholder-gray-400 dark:placeholder-gray-500"
                        value={selectedBatch || ''}
                        onChange={(e) => setSelectedBatch(e.target.value || null)}
                      >
                        <option value="">None</option>
                        {batches.map((batch) => (
                          <option key={batch.id} value={batch.id}>{batch.name}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleAddToInventory}
                      disabled={isLoading}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : bookData.existingBook ? 'Update in Inventory' : 'Add to Inventory'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}