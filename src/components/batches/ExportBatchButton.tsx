// components/batches/ExportBatchButton.tsx
'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';

interface ExportBatchButtonProps {
  batchId: string;
  className?: string;
}

export default function ExportBatchButton({ batchId, className = '' }: ExportBatchButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Create a hidden anchor element to trigger download
      const link = document.createElement('a');
      link.href = `/api/batches/${batchId}/export`;
      link.setAttribute('download', ''); // Browser will use filename from Content-Disposition
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting batch:', error);
      alert('Failed to export batch data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ${className}`}
    >
      <Download className="h-4 w-4 mr-2" />
      {isExporting ? 'Exporting...' : 'Export CSV'}
    </button>
  );
}