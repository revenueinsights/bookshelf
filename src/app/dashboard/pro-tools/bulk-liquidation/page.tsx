'use client';

import { useState, useRef } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { 
  Package, 
  Upload, 
  Download, 
  DollarSign, 
  Clock, 
  CheckCircle,
  AlertCircle,
  FileText,
  Search,
  Filter,
  Trash2,
  Eye,
  BarChart3,
  TrendingUp,
  X
} from 'lucide-react';

interface LiquidationResult {
  isbn: string;
  title: string;
  author: string;
  currentPrice: number;
  bestOffer: number;
  vendor: string;
  condition: string;
  status: 'MATCH_FOUND' | 'NO_OFFERS' | 'LOW_OFFER';
  profitMargin?: number;
  processingTime?: number;
}

export default function BulkLiquidationPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<LiquidationResult[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showDetails, setShowDetails] = useState<LiquidationResult | null>(null);
  const [filter, setFilter] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setUploadedFile(file);
      setResults([]); // Clear previous results
    } else {
      alert('Please upload a valid CSV file.');
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processInventory = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Simulate processing with progress updates
      const totalSteps = 100;
      for (let i = 0; i <= totalSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setProcessingProgress(i);
      }

      // Enhanced mock results with more realistic data
      const mockResults: LiquidationResult[] = [
        {
          isbn: '9780134685991',
          title: 'Effective Java',
          author: 'Joshua Bloch',
          currentPrice: 45.99,
          bestOffer: 28.50,
          vendor: 'Amazon',
          condition: 'Good',
          status: 'MATCH_FOUND',
          profitMargin: 62.0,
          processingTime: 1.2
        },
        {
          isbn: '9781617294945',
          title: 'Spring in Action',
          author: 'Craig Walls',
          currentPrice: 52.99,
          bestOffer: 22.75,
          vendor: 'BookFinder',
          condition: 'Very Good',
          status: 'MATCH_FOUND',
          profitMargin: 42.9,
          processingTime: 0.8
        },
        {
          isbn: '9780135957059',
          title: 'The Pragmatic Programmer',
          author: 'David Thomas',
          currentPrice: 41.99,
          bestOffer: 0,
          vendor: '',
          condition: 'Good',
          status: 'NO_OFFERS',
          processingTime: 1.5
        },
        {
          isbn: '9781449331818',
          title: 'Learning React',
          author: 'Alex Banks',
          currentPrice: 38.99,
          bestOffer: 15.25,
          vendor: 'Chegg',
          condition: 'Like New',
          status: 'LOW_OFFER',
          profitMargin: 39.1,
          processingTime: 1.1
        },
        {
          isbn: '9781491950357',
          title: 'Programming TypeScript',
          author: 'Boris Cherny',
          currentPrice: 49.99,
          bestOffer: 31.00,
          vendor: 'Barnes & Noble',
          condition: 'Good',
          status: 'MATCH_FOUND',
          profitMargin: 62.0,
          processingTime: 0.9
        },
        {
          isbn: '9780262033848',
          title: 'Introduction to Algorithms',
          author: 'Thomas H. Cormen',
          currentPrice: 89.99,
          bestOffer: 45.50,
          vendor: 'Amazon',
          condition: 'Very Good',
          status: 'MATCH_FOUND',
          profitMargin: 50.6,
          processingTime: 1.3
        }
      ];

      setResults(mockResults);
    } catch (error) {
      console.error('Error processing inventory:', error);
      alert('Failed to process inventory. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const exportResults = () => {
    if (results.length === 0) return;

    const csvContent = [
      'ISBN,Title,Author,Current Price,Best Offer,Vendor,Condition,Status,Profit Margin',
      ...results.map(result => 
        `${result.isbn},"${result.title}","${result.author}",${result.currentPrice},${result.bestOffer},"${result.vendor}","${result.condition}",${result.status},${result.profitMargin || 0}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liquidation-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredResults = results.filter(result => {
    if (filter === 'all') return true;
    if (filter === 'matches') return result.status === 'MATCH_FOUND';
    if (filter === 'no-offers') return result.status === 'NO_OFFERS';
    if (filter === 'low-offers') return result.status === 'LOW_OFFER';
    return true;
  });

  const totalValue = results.reduce((sum, result) => sum + result.currentPrice, 0);
  const totalOffers = results.reduce((sum, result) => sum + result.bestOffer, 0);
  const matchCount = results.filter(result => result.status === 'MATCH_FOUND').length;
  const avgProcessingTime = results.length > 0 
    ? results.reduce((sum, result) => sum + (result.processingTime || 0), 0) / results.length 
    : 0;

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Bulk Liquidation Tool"
        description="Process up to 10,000 ISBNs and find matching buyback offers"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
              <Package className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Books</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{results.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg mr-3">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Matches Found</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{matchCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg mr-3">
              <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalValue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg mr-3">
              <Clock className="h-6 w-6 text-orange-600 dark:text-orange-300" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgProcessingTime.toFixed(1)}s</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Upload Your Inventory
        </h3>
        
        {!uploadedFile ? (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Upload CSV file with ISBNs
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Support for up to 10,000 ISBNs per file. CSV format: ISBN, Condition, Min Price
              </p>
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                <strong>CSV Format Example:</strong><br/>
                ISBN,Condition,MinPrice<br/>
                9780134685991,Good,25.00<br/>
                9781617294945,Very Good,18.50
              </div>
            </div>
            
            <div className="mt-6">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </label>
            </div>
          </div>
        ) : (
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{uploadedFile.name}</p>
                  <p className="text-sm text-gray-500">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {uploadedFile && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={processInventory}
              disabled={isProcessing}
              className="flex items-center px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing... {processingProgress}%
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Find Buyback Offers
                </>
              )}
            </button>
          </div>
        )}

        {/* Progress Bar */}
        {isProcessing && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Results Section */}
      {results.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Liquidation Results
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {filteredResults.length} of {results.length} results
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                >
                  <option value="all">All Results</option>
                  <option value="matches">Matches Found</option>
                  <option value="no-offers">No Offers</option>
                  <option value="low-offers">Low Offers</option>
                </select>
                <button 
                  onClick={exportResults}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Results
                </button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredResults.map((item, index) => (
              <div key={index} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {item.title}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'MATCH_FOUND' 
                          ? 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300'
                          : item.status === 'NO_OFFERS'
                          ? 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300'
                          : 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {item.status === 'MATCH_FOUND' ? 'Match Found' : 
                         item.status === 'NO_OFFERS' ? 'No Offers' : 'Low Offer'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      by {item.author} • ISBN: {item.isbn} • Condition: {item.condition}
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Current: <span className="font-medium">${item.currentPrice.toFixed(2)}</span>
                      </span>
                      {item.bestOffer > 0 && (
                        <>
                          <span className="text-gray-400">→</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            Offer: <span className="font-medium">${item.bestOffer.toFixed(2)}</span>
                          </span>
                          {item.vendor && (
                            <span className="text-gray-600 dark:text-gray-400">
                              via {item.vendor}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {item.status === 'MATCH_FOUND' ? (
                      <div className="space-y-1">
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span className="font-medium">${item.bestOffer.toFixed(2)}</span>
                        </div>
                        {item.profitMargin && (
                          <p className="text-xs text-gray-500">
                            {item.profitMargin.toFixed(1)}% margin
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {item.processingTime?.toFixed(1)}s
                        </p>
                      </div>
                    ) : item.status === 'NO_OFFERS' ? (
                      <div className="flex items-center text-red-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        <span className="text-sm">No offers</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-yellow-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        <span className="text-sm">Low offer</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Info Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-center">
          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg mr-4">
            <Package className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-1">
              Bulk Processing Features
            </h4>
            <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
              <li>• Process up to 10,000 ISBNs per batch</li>
              <li>• Real-time vendor price matching</li>
              <li>• Condition-based pricing</li>
              <li>• Export results to CSV</li>
              <li>• Processing time optimization</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 