// components/scanner/BarcodeScanner.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface BarcodeScannerProps {
  onDetected: (isbn: string) => void;
  onCancel: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetected, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const barcodeDetectorRef = useRef<any>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if BarcodeDetector is available
        if (!('BarcodeDetector' in window)) {
          setError('Barcode detection is not supported in your browser. Please use the manual entry instead.');
          setLoading(false);
          return;
        }

        // Create a barcode detector
        barcodeDetectorRef.current = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_39', 'code_128', 'itf', 'codabar'],
        });

        // Request camera access
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setScanning(true);
        }
      } catch (err) {
        console.error('Error starting camera:', err);
        setError(
          'Unable to access the camera. Please ensure you have granted camera permissions or use the manual entry instead.'
        );
      } finally {
        setLoading(false);
      }
    };

    const scanBarcodes = async () => {
      if (!videoRef.current || !barcodeDetectorRef.current || !scanning) return;

      try {
        const barcodes = await barcodeDetectorRef.current.detect(videoRef.current);
        
        if (barcodes.length > 0) {
          // ISBN is typically 10 or 13 digits
          const possibleIsbn = barcodes[0].rawValue.replace(/[^0-9]/g, '');
          
          // Basic validation for ISBN format
          if (possibleIsbn.length === 10 || possibleIsbn.length === 13) {
            setScanning(false);
            onDetected(possibleIsbn);
          }
        }
      } catch (err) {
        console.error('Barcode detection error:', err);
      }

      if (scanning) {
        // Continue scanning if we haven't found a valid barcode yet
        requestAnimationFrame(scanBarcodes);
      }
    };

    startCamera();

    // Start scanning once the camera is initialized
    const scanInterval = setInterval(() => {
      if (!loading && scanning) {
        scanBarcodes();
      }
    }, 100);

    // Cleanup function
    return () => {
      clearInterval(scanInterval);
      setScanning(false);
      
      // Stop all tracks on the stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [loading, scanning, onDetected]);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="animate-pulse text-gray-500 dark:text-gray-400">Accessing camera...</div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className={`relative ${error ? 'hidden' : ''}`}>
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-2 right-2 z-10 p-1 bg-white dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 shadow-md"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-2">
          <video
            ref={videoRef}
            className="w-full max-h-80 rounded-lg bg-black object-cover"
            playsInline
            muted
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-2 border-blue-500 rounded-lg opacity-70"></div>
          </div>
        </div>

        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          Position the barcode within the box for scanning
        </p>
      </div>
    </div>
  );
};

export default BarcodeScanner;