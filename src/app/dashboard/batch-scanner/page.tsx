// app/dashboard/batch-scanner/page.tsx
'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, Check, AlertCircle, Loader2, Plus } from 'lucide-react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import BatchScanResults from '@/components/scanner/BatchScanResults';
import BatchCreationModal from '@/components/scanner/BatchCreationModal';
// Add module declaration for papaparse if you haven't installed @types/papaparse
// Add this to a file in your project, like src/types/globals.d.ts
// declare module 'papaparse';
import * as Papa from 'papaparse';

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

interface ScanResult {
  isbn: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  message?: string;
  data?: BookData;
}

interface Batch {
  id: string;
  name: string;
}

// Define Papa.parse result types
interface PapaParseResult {
  data: Record<string, string>[];
  errors: Papa.ParseError[];
  meta: Papa.ParseMeta;
}

export default function BatchScannerPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [isAddingBooks, setIsAddingBooks] = useState(false);
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [csvHeader, setCsvHeader] = useState<string[]>([]);
  const [selectedIsbnColumn, setSelectedIsbnColumn] = useState<string>('');

  // Maximum number of concurrent requests
  const MAX_CONCURRENT_REQUESTS = 5;

  // Fetch batches on component mount
  React.useEffect(() => {
    fetchBatches();
  }, []);

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
      setUploadMessage({
        type: 'error',
        text: 'Failed to fetch batches. Please refresh the page.'
      });
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage({ type: 'info', text: 'Parsing CSV file...' });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: PapaParseResult) => {
        setIsUploading(false);
        
        // Handle empty file
        if (results.data.length === 0) {
          setUploadMessage({ type: 'error', text: 'The CSV file is empty.' });
          return;
        }

        // Get headers from the first row
        const headers = Object.keys(results.data[0]);
        setCsvHeader(headers);
        
        // Try to find an ISBN column automatically
        const isbnColumnGuess = headers.find(header => 
          header.toLowerCase().includes('isbn')
        );

        if (isbnColumnGuess) {
          setSelectedIsbnColumn(isbnColumnGuess);
          processCSVData(results.data, isbnColumnGuess);
        } else if (headers.length === 1) {
          // If there's only one column, assume it's ISBN
          setSelectedIsbnColumn(headers[0]);
          processCSVData(results.data, headers[0]);
        } else {
          // Otherwise prompt user to select column
          setUploadMessage({ type: 'info', text: 'Please select the column containing ISBN numbers.' });
        }
      },
      error: (error: Papa.ParseError) => {
        setIsUploading(false);
        setUploadMessage({ type: 'error', text: `Error parsing CSV: ${error.message}` });
      }
    });
    
    // Reset file input
    event.target.value = '';
  };

  const processCSVData = (data: Record<string, string>[], isbnColumn: string) => {
    // Filter out rows with empty ISBNs
    const isbns = data
      .map(row => {
        const isbn = String(row[isbnColumn] || '').trim().replace(/-/g, '');
        return isbn ? isbn : null;
      })
      .filter(isbn => isbn !== null) as string[];

    if (isbns.length === 0) {
      setUploadMessage({ type: 'error', text: 'No valid ISBNs found in the selected column.' });
      return;
    }

    // Initialize scan results
    const initialScanResults: ScanResult[] = isbns.map(isbn => ({
      isbn,
      status: 'pending',
    }));

    setScanResults(initialScanResults);
    setUploadMessage({ type: 'success', text: `Found ${isbns.length} ISBNs to process.` });

    // Start scanning in batches
    processBooksInBatches(initialScanResults);
  };

  const processBooksInBatches = async (initialResults: ScanResult[]) => {
    const results = [...initialResults];
    const pendingIndices = results.map((_, index) => index);
    
    // Process in batches of MAX_CONCURRENT_REQUESTS
    while (pendingIndices.length > 0) {
      const batch = pendingIndices.splice(0, MAX_CONCURRENT_REQUESTS);
      
      // Start concurrent requests
      await Promise.all(
        batch.map(async (index) => {
          const result = results[index];
          
          // Update status to loading
          setScanResults(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], status: 'loading' };
            return updated;
          });
          
          try {
            // Fetch book data
            const response = await fetch('/api/books/price-lookup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isbn: result.isbn }),
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to fetch book data');
            }
            
            const bookData = await response.json();
            
            // Update with success
            setScanResults(prev => {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                status: 'success',
                data: bookData,
              };
              return updated;
            });
          } catch (error: any) {
            // Update with error
            setScanResults(prev => {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                status: 'error',
                message: error.message || 'Failed to fetch book data',
              };
              return updated;
            });
          }
        })
      );
    }
    
    setUploadMessage({ type: 'success', text: 'All ISBNs processed.' });
  };

  const handleColumnSelect = (column: string) => {
    setSelectedIsbnColumn(column);
    
    if (fileInputRef.current?.files?.[0]) {
      // Re-process with new column selection
      Papa.parse(fileInputRef.current.files[0], {
        header: true,
        skipEmptyLines: true,
        complete: (results: PapaParseResult) => {
          processCSVData(results.data, column);
        }
      });
    }
  };

  const handleSelectAll = () => {
    const allIsbns = scanResults
      .filter(result => result.status === 'success')
      .map(result => result.isbn);
    
    if (selectedBooks.size === allIsbns.length) {
      // If all are already selected, deselect all
      setSelectedBooks(new Set());
    } else {
      // Otherwise select all successful results
      setSelectedBooks(new Set(allIsbns));
    }
  };

  const handleSelectBook = (isbn: string, selected: boolean) => {
    const newSelected = new Set(selectedBooks);
    
    if (selected) {
      newSelected.add(isbn);
    } else {
      newSelected.delete(isbn);
    }
    
    setSelectedBooks(newSelected);
  };

  const handleAddToInventory = async () => {
    if (selectedBooks.size === 0) {
      setUploadMessage({ type: 'error', text: 'Please select at least one book to add to inventory.' });
      return;
    }
    
    setIsAddingBooks(true);
    setUploadMessage({ type: 'info', text: 'Adding books to inventory...' });
    
    const booksToAdd = scanResults
      .filter(result => result.status === 'success' && selectedBooks.has(result.isbn));
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process adding books in batches
    for (let i = 0; i < booksToAdd.length; i++) {
      const book = booksToAdd[i];
      try {
        // Update status to show progress
        setUploadMessage({ 
          type: 'info', 
          text: `Adding books to inventory... (${i + 1}/${booksToAdd.length})` 
        });
        
        const payload = {
          isbn: book.isbn,
          batchId: selectedBatch || undefined
        };
        
        const response = await fetch('/api/books/price-lookup/', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add book');
        }
        
        successCount++;
        
        // Update the book's status in the results
        setScanResults(prev => {
          const updated = [...prev];
          const index = updated.findIndex(r => r.isbn === book.isbn);
          if (index !== -1 && updated[index].data) {
            updated[index] = {
              ...updated[index],
              data: {
                ...updated[index].data!,
                existingBook: true
              }
            };
          }
          return updated;
        });
      } catch (error) {
        console.error(`Error adding book ${book.isbn}:`, error);
        errorCount++;
      }
    }
    
    setIsAddingBooks(false);
    setSelectedBooks(new Set());
    
    // Show summary
    setUploadMessage({ 
      type: errorCount === 0 ? 'success' : 'info', 
      text: `Added ${successCount} books to inventory. ${errorCount > 0 ? `Failed to add ${errorCount} books.` : ''}` 
    });
  };

  const handleCreateBatch = (batchName: string) => {
    setIsCreatingBatch(true);
    
    fetch('/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: batchName }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to create batch');
        }
        return response.json();
      })
      .then(data => {
        // Add the new batch to the list and select it
        setBatches(prev => [...prev, data]);
        setSelectedBatch(data.id);
        setIsCreatingBatch(false);
        setUploadMessage({ type: 'success', text: `Batch "${batchName}" created and selected.` });
      })
      .catch(error => {
        console.error('Error creating batch:', error);
        setIsCreatingBatch(false);
        setUploadMessage({ type: 'error', text: 'Failed to create batch. Please try again.' });
      });
  };

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Batch Scanner"
        description="Scan multiple books at once by uploading a CSV file with ISBN numbers"
      />

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200 mr-4">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-gray-900 dark:text-white">
                  Upload CSV File
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Upload a CSV file containing ISBN numbers to scan multiple books at once
                </p>
              </div>
            </div>

            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/20"
              onClick={handleUploadClick}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                CSV file with ISBN numbers (.csv)
              </p>
            </div>

            {uploadMessage && (
              <div className={`mt-4 p-4 rounded-md ${
                uploadMessage.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                uploadMessage.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              } flex items-start`}>
                {uploadMessage.type === 'success' ? (
                  <Check className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                ) : uploadMessage.type === 'error' ? (
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                ) : (
                  <Loader2 className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 animate-spin" />
                )}
                <p>{uploadMessage.text}</p>
              </div>
            )}
            
            {csvHeader.length > 0 && !selectedIsbnColumn && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                  Select the column containing ISBN numbers:
                </p>
                <div className="flex flex-wrap gap-2">
                  {csvHeader.map(header => (
                    <button
                      key={header}
                      className="px-3 py-1 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-md text-sm hover:bg-blue-100 dark:hover:bg-blue-800"
                      onClick={() => handleColumnSelect(header)}
                    >
                      {header}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results section */}
          {scanResults.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Scan Results ({scanResults.length} books)
                </h3>
                
                <div className="flex items-center space-x-3">
                  <button
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={handleSelectAll}
                  >
                    {selectedBooks.size === scanResults.filter(r => r.status === 'success').length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                  
                  <div className="relative inline-block">
                    <select
                      className="block w-full pl-3 pr-10 py-1.5 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                      value={selectedBatch}
                      onChange={(e) => setSelectedBatch(e.target.value)}
                    >
                      <option value="">No Batch</option>
                      {batches.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    className="inline-flex items-center px-2 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setIsCreatingBatch(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New Batch
                  </button>
                  
                  <button
                    className="inline-flex items-center px-4 py-1.5 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleAddToInventory}
                    disabled={selectedBooks.size === 0 || isAddingBooks}
                  >
                    {isAddingBooks ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Selected to Inventory'
                    )}
                  </button>
                </div>
              </div>
              
              {/* Render scan results */}
              <BatchScanResults 
                results={scanResults} 
                selectedBooks={selectedBooks}
                onSelectBook={handleSelectBook}
              />
            </div>
          )}
        </div>
      </div>

      {/* Batch creation modal */}
      <BatchCreationModal
        isOpen={isCreatingBatch}
        onClose={() => setIsCreatingBatch(false)}
        onCreateBatch={handleCreateBatch}
      />
    </div>
  );
}