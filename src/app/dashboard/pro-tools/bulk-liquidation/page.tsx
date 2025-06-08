'use client';

import { useState } from 'react';
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
  Filter
} from 'lucide-react';

export default function BulkLiquidationPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const processInventory = () => {
    setIsProcessing(true);
    // Simulate processing
    setTimeout(() => {
      setResults([
        {
          isbn: '9780134685991',
          title: 'Effective Java',
          currentPrice: 45.99,
          bestOffer: 28.50,
          vendor: 'Amazon',
          condition: 'Good',
          status: 'MATCH_FOUND'
        },
        {
          isbn: '9781617294945',
          title: 'Spring in Action',
          currentPrice: 52.99,
          bestOffer: 22.75,
          vendor: 'BookFinder',
          condition: 'Very Good',
          status: 'MATCH_FOUND'
        },
        {
          isbn: '9780135957059',
          title: 'The Pragmatic Programmer',
          currentPrice: 41.99,
          bestOffer: 0,
          vendor: null,
          condition: 'Good',
          status: 'NO_OFFERS'
        }
      ]);
      setIsProcessing(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Bulk Liquidation Tool"
        description="Process up to 10,000 ISBNs and find matching buyback offers"
      />

      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Upload Your Inventory
        </h3>
        
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              Upload CSV file with ISBNs
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Support for up to 10,000 ISBNs per file. CSV format: ISBN, Condition, Min Price
            </p>
          </div>
          
          <div className="mt-6">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </label>
          </div>
          
          {uploadedFile && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
              <p className="text-sm text-green-700 dark:text-green-300">
                ✓ {uploadedFile.name} uploaded successfully
              </p>
            </div>
          )}
        </div>

        {uploadedFile && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={processInventory}
              disabled={isProcessing}
              className="flex items-center px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
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
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Liquidation Results
              </h3>
              <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {results.map((item, index) => (
              <div key={index} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ISBN: {item.isbn} • Condition: {item.condition}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    {item.status === 'MATCH_FOUND' ? (
                      <div className="space-y-1">
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span className="font-medium">${item.bestOffer}</span>
                        </div>
                        <p className="text-xs text-gray-500">via {item.vendor}</p>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        <span className="text-sm">No offers</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Section */}
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
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 