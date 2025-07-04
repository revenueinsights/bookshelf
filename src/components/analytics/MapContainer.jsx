import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';

// Set your Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const MapContainer = ({ mapData, onMapLoad }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-74.5, 40],
      zoom: 9
    });

    map.current.on('load', () => {
      setMapLoaded(true);
      if (onMapLoad) {
        onMapLoad(map.current);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [onMapLoad]);

  // Safe image loading function
  const addImageSafely = (imageUrl, imageName, callback) => {
    if (!map.current || !mapLoaded) return;

    // Remove existing image if it exists
    if (map.current.hasImage(imageName)) {
      map.current.removeImage(imageName);
    }

    map.current.loadImage(imageUrl, (error, image) => {
      if (error) {
        console.error('Error loading image:', error);
        return;
      }

      if (!image) {
        console.error('Image failed to load:', imageUrl);
        return;
      }

      try {
        // Check if map still exists and image isn't already added
        if (map.current && !map.current.hasImage(imageName)) {
          map.current.addImage(imageName, image, { pixelRatio: 2 });
          if (callback) callback();
        }
      } catch (err) {
        console.error('Error adding image to map:', err);
      }
    });
  };

  // Safe layer addition function
  const addMapLayersWithSource = useCallback((layersData) => {
    if (!map.current || !mapLoaded) return;

    layersData.forEach((layerData) => {
      try {
        const { id, source, layer, images } = layerData;

        // Add source if it doesn't exist
        if (!map.current.getSource(id)) {
          map.current.addSource(id, source);
        }

        // Add images safely
        if (images && images.length > 0) {
          images.forEach(({ name, url }) => {
            addImageSafely(url, name, () => {
              // Add layer after image is loaded
              if (!map.current.getLayer(layer.id)) {
                map.current.addLayer(layer);
              }
            });
          });
        } else {
          // Add layer without images
          if (!map.current.getLayer(layer.id)) {
            map.current.addLayer(layer);
          }
        }
      } catch (error) {
        console.error('Error adding layer:', error);
      }
    });
  }, [mapLoaded]);

  // Safe marker addition function
  const addMarkersToMap = useCallback((markers) => {
    if (!map.current || !mapLoaded) return;

    markers.forEach((markerData) => {
      try {
        const { coordinates, properties } = markerData;
        
        // Create marker element
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundImage = `url(${properties.iconUrl || '/default-marker.png'})`;
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.backgroundSize = 'contain';
        el.style.backgroundRepeat = 'no-repeat';

        // Add marker to map
        new mapboxgl.Marker(el)
          .setLngLat(coordinates)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`<h3>${properties.title}</h3><p>${properties.description}</p>`)
          )
          .addTo(map.current);
      } catch (error) {
        console.error('Error adding marker:', error);
      }
    });
  }, [mapLoaded]);

  // Expose functions to parent components
  useEffect(() => {
    if (mapLoaded && map.current) {
      // Attach functions to map instance for external access
      map.current.addMapLayersWithSource = addMapLayersWithSource;
      map.current.addMarkersToMap = addMarkersToMap;
    }
  }, [mapLoaded, addMapLayersWithSource, addMarkersToMap]);

  return (
    <div className="relative w-full h-full">
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