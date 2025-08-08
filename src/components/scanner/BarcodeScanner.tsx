// components/scanner/BarcodeScanner.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, AlertCircle, Camera, CameraOff, RotateCcw, Flashlight, FlashlightOff, Settings, CheckCircle, XCircle, Smartphone, Monitor } from 'lucide-react';

interface BarcodeScannerProps {
  onDetected: (isbn: string) => void;
  onCancel: () => void;
}

interface CameraDevice {
  deviceId: string;
  label: string;
  kind: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetected, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [cameraDevices, setCameraDevices] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    initializeCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const initializeCamera = async () => {
    setLoading(true);
    setError(null);
    setCameraError(null);

    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser');
      }

      // Get available camera devices
      await getCameraDevices();

      // Try to start camera with default settings
      await startCamera();

    } catch (err) {
      console.error('Camera initialization error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize camera';
      setError(errorMessage);
      setCameraError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getCameraDevices = async () => {
    try {
      // First, request permission to enumerate devices
      const initialStream = await navigator.mediaDevices.getUserMedia({ video: true });
      initialStream.getTracks().forEach(track => track.stop());

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
      // Don't throw here, just log the error
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'environment', // Prefer rear camera
        },
        audio: false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
        setStream(newStream);
        setScanning(true);
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      
      // Try fallback constraints
      try {
        const fallbackConstraints: MediaStreamConstraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        };

        const fallbackStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play();
          setStream(fallbackStream);
          setScanning(true);
        }
      } catch (fallbackError) {
        console.error('Fallback camera error:', fallbackError);
        setCameraError('Unable to access camera. Please check permissions or use manual entry.');
        setShowManualInput(true);
      }
    }
  };

  const stopCamera = () => {
    setScanning(false);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const switchCamera = async (deviceId: string) => {
    setSelectedCamera(deviceId);
    stopCamera();
    setTimeout(() => startCamera(), 500);
  };

  const toggleFlash = async () => {
    try {
      if (stream) {
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

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      // Basic ISBN validation
      const isbn = manualInput.trim().replace(/[^0-9X]/gi, '');
      if (isbn.length === 10 || isbn.length === 13) {
        onDetected(isbn);
      } else {
        setError('Please enter a valid 10 or 13 digit ISBN');
      }
    }
  };

  const handleManualInput = () => {
    setShowManualInput(true);
    stopCamera();
  };

  const handleBackToCamera = () => {
    setShowManualInput(false);
    setManualInput('');
    setError(null);
    initializeCamera();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Initializing camera...</p>
          </div>
        </div>
      </div>
    );
  }

  if (showManualInput) {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Manual ISBN Entry</h3>
            <button
              onClick={handleBackToCamera}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Camera className="h-4 w-4" />
              <span>Back to Camera</span>
            </button>
          </div>
          
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label htmlFor="manualIsbn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter ISBN
              </label>
              <input
                type="text"
                id="manualIsbn"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter 10 or 13 digit ISBN"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={13}
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              >
                Look Up ISBN
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Scanner Controls */}
      <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center space-x-4">
          <button
            onClick={scanning ? stopCamera : startCamera}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${
              scanning
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {scanning ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            <span>{scanning ? 'Stop Camera' : 'Start Camera'}</span>
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

              {cameraDevices.length > 1 && (
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
              )}
            </>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleManualInput}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <Monitor className="h-4 w-4" />
            <span>Manual Entry</span>
          </button>
          
          <button
            onClick={onCancel}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Camera Error */}
      {cameraError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700 dark:text-red-300 font-medium">Camera Error</span>
          </div>
          <p className="text-red-700 dark:text-red-300 text-sm mb-4">{cameraError}</p>
          <div className="flex space-x-3">
            <button
              onClick={handleManualInput}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Use Manual Entry
            </button>
            <button
              onClick={initializeCamera}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
            >
              Try Again
            </button>
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
          autoPlay
        />
        
        {/* Scanning overlay */}
        {scanning && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="border-2 border-green-500 bg-green-500/20 rounded-lg p-4">
              <div className="w-48 h-32 border-2 border-dashed border-green-400 rounded-lg flex items-center justify-center">
                <span className="text-green-400 text-sm font-medium">Position camera over barcode</span>
              </div>
            </div>
          </div>
        )}

        {/* Camera not available overlay */}
        {!scanning && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">Camera Ready</p>
              <p className="text-sm text-gray-400">Click "Start Camera" to begin scanning</p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              How to scan barcodes:
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Position the barcode in the center of the camera view</li>
              <li>• Ensure good lighting for better detection</li>
              <li>• Hold the device steady while scanning</li>
              <li>• Use manual entry if camera doesn't work</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;