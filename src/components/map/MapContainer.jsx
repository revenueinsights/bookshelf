import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';

// Import Mapbox CSS
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const MapContainer = ({ 
  mapData, 
  onMapLoad, 
  center = [-74.5, 40], 
  zoom = 9,
  style = 'mapbox://styles/mapbox/light-v11',
  className = 'w-full h-full'
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: style,
        center: center,
        zoom: zoom
      });

      map.current.on('load', () => {
        setMapLoaded(true);
        if (onMapLoad) {
          onMapLoad(map.current);
        }
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError('Map failed to load');
      });

    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map');
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [center, zoom, style, onMapLoad]);

  // Safe image loading function with proper error handling
  const loadImageSafely = useCallback((imageUrl, imageName, callback) => {
    if (!map.current || !mapLoaded) {
      console.warn('Map not ready for image loading');
      return;
    }

    // Remove existing image if it exists
    try {
      if (map.current.hasImage(imageName)) {
        map.current.removeImage(imageName);
      }
    } catch (err) {
      console.warn('Error removing existing image:', err);
    }

    // Load image with proper error handling
    map.current.loadImage(imageUrl, (error, image) => {
      if (error) {
        console.error('Error loading image:', imageUrl, error);
        if (callback) callback(error, null);
        return;
      }

      if (!image) {
        console.error('Image failed to load (null):', imageUrl);
        if (callback) callback(new Error('Image is null'), null);
        return;
      }

      // Validate image dimensions
      if (!image.width || !image.height || image.width <= 0 || image.height <= 0) {
        console.error('Invalid image dimensions:', { width: image.width, height: image.height });
        if (callback) callback(new Error('Invalid image dimensions'), null);
        return;
      }

      try {
        // Double-check map still exists and image isn't already added
        if (map.current && !map.current.hasImage(imageName)) {
          map.current.addImage(imageName, image, { 
            pixelRatio: 2,
            sdf: false // Explicitly set SDF to false for regular images
          });
          console.log('Successfully added image:', imageName);
          if (callback) callback(null, image);
        } else {
          console.warn('Map no longer exists or image already added:', imageName);
          if (callback) callback(new Error('Map unavailable or image exists'), null);
        }
      } catch (err) {
        console.error('Error adding image to map:', imageName, err);
        if (callback) callback(err, null);
      }
    });
  }, [mapLoaded]);

  // Safe layer addition function
  const addMapLayersWithSource = useCallback((layersData) => {
    if (!map.current || !mapLoaded) {
      console.warn('Map not ready for layer addition');
      return;
    }

    if (!Array.isArray(layersData)) {
      console.error('layersData must be an array');
      return;
    }

    layersData.forEach((layerData, index) => {
      try {
        const { id, source, layer, images } = layerData;

        if (!id || !source || !layer) {
          console.error('Missing required layer data:', { id, source: !!source, layer: !!layer });
          return;
        }

        // Add source if it doesn't exist
        if (!map.current.getSource(id)) {
          map.current.addSource(id, source);
        }

        // Handle images if they exist
        if (images && Array.isArray(images) && images.length > 0) {
          let imagesLoaded = 0;
          const totalImages = images.length;

          const checkAllImagesLoaded = () => {
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
              // All images loaded, now add the layer
              try {
                if (!map.current.getLayer(layer.id)) {
                  map.current.addLayer(layer);
                  console.log('Layer added after images loaded:', layer.id);
                }
              } catch (err) {
                console.error('Error adding layer after images loaded:', err);
              }
            }
          };

          images.forEach(({ name, url }) => {
            if (!name || !url) {
              console.error('Invalid image data:', { name, url });
              checkAllImagesLoaded(); // Still count as processed
              return;
            }

            loadImageSafely(url, name, (error) => {
              if (error) {
                console.error('Failed to load image for layer:', name, error);
              }
              checkAllImagesLoaded();
            });
          });
        } else {
          // No images, add layer directly
          try {
            if (!map.current.getLayer(layer.id)) {
              map.current.addLayer(layer);
              console.log('Layer added without images:', layer.id);
            }
          } catch (err) {
            console.error('Error adding layer without images:', err);
          }
        }
      } catch (error) {
        console.error('Error processing layer data:', error, layerData);
      }
    });
  }, [mapLoaded, loadImageSafely]);

  // Safe marker addition function
  const addMarkersToMap = useCallback((markers) => {
    if (!map.current || !mapLoaded) {
      console.warn('Map not ready for marker addition');
      return;
    }

    if (!Array.isArray(markers)) {
      console.error('markers must be an array');
      return;
    }

    markers.forEach((markerData, index) => {
      try {
        const { coordinates, properties } = markerData;
        
        if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
          console.error('Invalid marker coordinates:', coordinates);
          return;
        }

        // Create marker element
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.borderRadius = '50%';
        el.style.cursor = 'pointer';
        
        // Set background image or color
        if (properties?.iconUrl) {
          el.style.backgroundImage = `url(${properties.iconUrl})`;
          el.style.backgroundSize = 'contain';
          el.style.backgroundRepeat = 'no-repeat';
          el.style.backgroundPosition = 'center';
        } else {
          el.style.backgroundColor = properties?.color || '#3b82f6';
          el.style.border = '2px solid white';
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        }

        // Create popup if properties exist
        let popup = null;
        if (properties?.title || properties?.description) {
          popup = new mapboxgl.Popup({ 
            offset: 25,
            closeButton: false,
            closeOnClick: false
          }).setHTML(`
            <div style="font-family: sans-serif;">
              ${properties.title ? `<h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${properties.title}</h3>` : ''}
              ${properties.description ? `<p style="margin: 0; font-size: 12px; color: #666;">${properties.description}</p>` : ''}
            </div>
          `);
        }

        // Add marker to map
        const marker = new mapboxgl.Marker(el)
          .setLngLat(coordinates);
        
        if (popup) {
          marker.setPopup(popup);
        }
        
        marker.addTo(map.current);

        console.log('Marker added successfully:', index);
      } catch (error) {
        console.error('Error adding marker:', error, markerData);
      }
    });
  }, [mapLoaded]);

  // Expose functions to parent components
  useEffect(() => {
    if (mapLoaded && map.current) {
      // Attach functions to map instance for external access
      map.current.addMapLayersWithSource = addMapLayersWithSource;
      map.current.addMarkersToMap = addMarkersToMap;
      map.current.loadImageSafely = loadImageSafely;
    }
  }, [mapLoaded, addMapLayersWithSource, addMarkersToMap, loadImageSafely]);

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 dark:bg-gray-800`}>
        <div className="text-center p-6">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">{error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Check your Mapbox token configuration
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapContainer; 