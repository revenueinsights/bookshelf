// app/not-found.tsx
'use client';

import Link from 'next/link';
import { Package, Home, ArrowLeft } from 'lucide-react';
import React from 'react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
            <Package className="h-10 w-10 text-blue-600 dark:text-blue-300" />
          </div>
        </div>
        
        <h1 className="mt-4 text-9xl font-extrabold text-gray-900 dark:text-white">
          404
        </h1>
        
        <h2 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
          Page Not Found
        </h2>
        
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <Home className="h-5 w-5 mr-2" />
            Back to Home
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}