// components/scanner/BarcodeScanner.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, AlertCircle, Camera, CameraOff, RotateCcw, Flashlight, FlashlightOff, Settings, CheckCircle, XCircle } from 'lucide-react';

interface BarcodeScannerProps {
  onDetected: (isbn: string) => void;
  onCancel: () => void;
}

interface CameraDevice {
  deviceId: string;
  label: string;
  kind: string;
}

interface ScannerSettings {
  enableSound: boolean;
  enableVibration: boolean;
  autoFocus: boolean;
  torchMode: boolean;
  scanDelay: number;
  formats: string[];
  autoStop: boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetected, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const barcodeDetectorRef = useRef<any>(null);
  const [cameraDevices, setCameraDevices] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [scannerSettings, setScannerSettings] = useState<ScannerSettings>({
    enableSound: true,
    enableVibration: true,
    autoFocus: true,
    torchMode: false,
    scanDelay: 500,
    formats: ['EAN_13', 'EAN_8', 'UPC_A', 'UPC_E', 'ISBN_10', 'ISBN_13'],
    autoStop: false,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [scanCount, setScanCount] = useState(0);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

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

  const getCameraDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 5)}`,
          kind: device.kind,
        }));
      
      setCameraDevices(videoDevices);
      
      // Select rear camera by default if available
      const rearCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      if (rearCamera) {
        setSelectedCamera(rearCamera.deviceId);
      } else if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Error getting camera devices:', error);
      setCameraError('Failed to access camera devices');
    }
  };

  const toggleFlash = async () => {
    try {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        
        if (track && 'applyConstraints' in track) {
          await track.applyConstraints({
            advanced: [{ torch: !isFlashOn }] as any
          });
          setIsFlashOn(!isFlashOn);
        }
      }
    } catch (error) {
      console.error('Flash not supported:', error);
    }
  };

  const switchCamera = async (deviceId: string) => {
    setSelectedCamera(deviceId);
    if (scanning) {
      await stopScanning();
      setTimeout(() => startScanning(), 500);
    }
  };

  const playSuccessSound = () => {
    if (scannerSettings.enableSound) {
      const audio = new Audio('/sounds/beep-success.mp3');
      audio.play().catch(() => {
        // Fallback to system beep
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        oscillator.stop(context.currentTime + 0.1);
      });
    }
  };

  const vibrateDevice = () => {
    if (scannerSettings.enableVibration && 'vibrate' in navigator) {
      navigator.vibrate(100);
    }
  };

  const addToScanHistory = (isbn: string) => {
    setScanHistory(prev => {
      const newHistory = [isbn, ...prev.filter(item => item !== isbn)];
      return newHistory.slice(0, 10); // Keep last 10 scans
    });
  };

  const validateBarcode = (code: string): boolean => {
    // Enhanced validation for different barcode formats
    const patterns = {
      EAN_13: /^\d{13}$/,
      EAN_8: /^\d{8}$/,
      UPC_A: /^\d{12}$/,
      UPC_E: /^\d{8}$/,
      ISBN_10: /^(?:\d{9}[\dX]|\d{10})$/,
      ISBN_13: /^(?:978|979)\d{10}$/,
    };

    return Object.values(patterns).some(pattern => pattern.test(code));
  };

  const startScanning = async () => {
    try {
      setCameraError(null);
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 16/9 },
          focusMode: scannerSettings.autoFocus ? 'continuous' : 'manual',
        } as any,
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScanning(true);
        
        // Start scanning after video is ready
        videoRef.current.addEventListener('loadedmetadata', () => {
          scanBarcode();
        });
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      setCameraError('Failed to start camera. Please check permissions.');
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    setScanning(false);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const scanBarcode = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    try {
      // Use a more robust barcode detection library
      const code = detectBarcode(imageData);
      
      if (code && validateBarcode(code)) {
        const now = Date.now();
        
        // Prevent duplicate scans within delay period
        if (now - lastScanTime > scannerSettings.scanDelay) {
          setLastScanTime(now);
          setScanCount(prev => prev + 1);
          
          // Success feedback
          playSuccessSound();
          vibrateDevice();
          
          // Add to history
          addToScanHistory(code);
          
          // Handle the scanned code
          onDetected(code);
          
          // Auto-stop after successful scan (optional)
          if (scannerSettings.autoStop) {
            setTimeout(() => stopScanning(), 1000);
          }
        }
      }
    } catch (error) {
      console.error('Barcode detection error:', error);
    }

    // Continue scanning
    if (scanning) {
      requestAnimationFrame(scanBarcode);
    }
  };

  const detectBarcode = (imageData: ImageData): string | null => {
    // This is a placeholder. In a real implementation, you'd use a library like:
    // - ZXing-js
    // - QuaggaJS
    // - @zxing/library
    
    // For now, return null to simulate no barcode found
    return null;
  };

  useEffect(() => {
    getCameraDevices();
  }, []);

  return (
    <div className="space-y-4">
      {/* Scanner Controls */}
      <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center space-x-4">
          <button
            onClick={scanning ? stopScanning : startScanning}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${
              scanning
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {scanning ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            <span>{scanning ? 'Stop Scanner' : 'Start Scanner'}</span>
          </button>

          {scanning && (
            <>
              <button
                onClick={toggleFlash}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                title="Toggle Flash"
              >
                {isFlashOn ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
              </button>

              <select
                value={selectedCamera}
                onChange={(e) => switchCamera(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              >
                {cameraDevices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Scans: {scanCount}
          </div>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            title="Scanner Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scanner Settings Panel */}
      {showSettings && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Scanner Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={scannerSettings.enableSound}
                  onChange={(e) => setScannerSettings(prev => ({ ...prev, enableSound: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Enable scan sound</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={scannerSettings.enableVibration}
                  onChange={(e) => setScannerSettings(prev => ({ ...prev, enableVibration: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Enable vibration</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={scannerSettings.autoFocus}
                  onChange={(e) => setScannerSettings(prev => ({ ...prev, autoFocus: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Auto focus</span>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Scan delay (ms)</label>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={scannerSettings.scanDelay}
                  onChange={(e) => setScannerSettings(prev => ({ ...prev, scanDelay: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 mt-1">{scannerSettings.scanDelay}ms</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Supported formats</label>
                <div className="space-y-1">
                  {['EAN_13', 'EAN_8', 'UPC_A', 'UPC_E', 'ISBN_10', 'ISBN_13'].map(format => (
                    <label key={format} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={scannerSettings.formats.includes(format)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setScannerSettings(prev => ({ ...prev, formats: [...prev.formats, format] }));
                          } else {
                            setScannerSettings(prev => ({ ...prev, formats: prev.formats.filter(f => f !== format) }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs">{format}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Error */}
      {cameraError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700 dark:text-red-300">{cameraError}</span>
          </div>
        </div>
      )}

      {/* Scanner View */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-64 md:h-96 object-cover"
          playsInline
          muted
        />
        
        {/* Scanning overlay */}
        {scanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="border-2 border-green-500 bg-green-500/20 rounded-lg p-4">
              <div className="w-48 h-32 border-2 border-dashed border-green-400 rounded-lg flex items-center justify-center">
                <span className="text-green-400 text-sm font-medium">Align barcode here</span>
              </div>
            </div>
          </div>
        )}
        
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Recent Scans</h3>
          <div className="space-y-2">
            {scanHistory.map((isbn, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="font-mono text-sm">{isbn}</span>
                <button
                  onClick={() => onDetected(isbn)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;