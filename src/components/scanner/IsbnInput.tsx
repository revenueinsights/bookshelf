// components/scanner/IsbnInput.tsx
import React, { useState } from 'react';
import { Search, Camera, Loader2 } from 'lucide-react';

interface IsbnInputProps {
  onSearch: (isbn: string) => void;
  onScanClick: () => void;
  isLoading: boolean;
}

const IsbnInput: React.FC<IsbnInputProps> = ({ onSearch, onScanClick, isLoading }) => {
  const [isbn, setIsbn] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validateIsbn = (isbn: string): boolean => {
    // Basic validation: must be 10 or 13 digits
    const isbnRegex = /^(\d{10}|\d{13})$/;
    return isbnRegex.test(isbn);
  };

  const handleSearch = () => {
    const trimmedIsbn = isbn.trim().replace(/-/g, '');
    
    if (!validateIsbn(trimmedIsbn)) {
      setError('Please enter a valid 10 or 13 digit ISBN');
      return;
    }
    
    setError(null);
    onSearch(trimmedIsbn);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex">
        <div className="relative flex-grow">
          <input
            type="text"
            value={isbn}
            onChange={(e) => {
              setIsbn(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter ISBN (10 or 13 digits)"
            className="block w-full rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 pl-4 pr-10 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 placeholder-gray-400 dark:placeholder-gray-500"
            disabled={isLoading}
          />
          {isLoading && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={isLoading || !isbn.trim()}
          className="flex items-center px-4 py-2 border border-l-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search className="h-4 w-4 mr-1" />
          Search
        </button>
      </div>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onScanClick}
          disabled={isLoading}
          className="flex items-center px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/40 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera className="h-4 w-4 mr-2" />
          Scan Barcode
        </button>
      </div>
    </div>
  );
};

export default IsbnInput;