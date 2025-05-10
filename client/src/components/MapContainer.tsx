import React, { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGeolocation } from '@/lib/useGeolocation';
import { PointType, Point } from '@shared/schema';
import 'leaflet/dist/leaflet.css';

interface MapContainerProps {
  onSelectPoint: (point: Point) => void;
  activeFilters: PointType[];
  selectedPointId: number | null;
}

export function MapContainer({ onSelectPoint, activeFilters, selectedPointId }: MapContainerProps) {
  const { latitude, longitude, loading: geoLoading } = useGeolocation();
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [userMarker, setUserMarker] = useState<any>(null);
  
  // Fetch all points
  const { data: points, isLoading } = useQuery<Point[]>({
    queryKey: ['/api/points'],
  });

  // Get filtered points
  const filteredPoints = points?.filter(point => 
    activeFilters.includes(point.type as PointType)
  ) || [];
  
  // Get point type display name
  const getPointTypeName = (type: PointType) => {
    switch(type) {
      case PointType.WIFI:
        return 'WiFi';
      case PointType.OUTLET:
        return 'Розетка';
      case PointType.RESTROOM:
        return 'Туалет';
      default:
        return type;
    }
  };
  
  // Get point background color class for list view
  const getPointBgClass = (type: PointType) => {
    switch(type) {
      case PointType.WIFI:
        return 'bg-blue-500';
      case PointType.OUTLET:
        return 'bg-yellow-500';
      case PointType.RESTROOM:
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Initialize map
  useEffect(() => {
    async function initMap() {
      try {
        // Import leaflet dynamically
        const L = await import('leaflet');
        
        // Check if map already initialized or container not found
        if (mapInitialized || !document.getElementById('map-container')) return;
        
        // Create map instance
        const map = L.map('map-container', {
          center: [55.751244, 37.618423], // Default center (Moscow)
          zoom: 15,
          zoomControl: true,
        });
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Set state after map is initialized
        setMapInstance(map);
        setMapInitialized(true);
        
        // Log success
        console.log('OpenStreetMap initialized successfully');
      } catch (error) {
        console.error('Failed to initialize map:', error);
        setMapInitialized(false);
      }
    }
    
    // Initialize map
    initMap();
    
    // Cleanup
    return () => {
      if (mapInstance) {
        try {
          mapInstance.remove();
        } catch (error) {
          console.error('Error removing map:', error);
        }
        setMapInitialized(false);
      }
    };
  }, [mapInitialized, mapInstance]);
  
  // Update map with user's location
  useEffect(() => {
    if (!mapInitialized || !mapInstance) return;
    if (latitude === null || longitude === null) return;
    
    async function updateUserLocation() {
      try {
        // Import leaflet dynamically
        const L = await import('leaflet');
        
        // Center map on user location
        mapInstance.setView([latitude, longitude], 15);
        
        // Remove previous user marker if exists
        if (userMarker) {
          try {
            userMarker.remove();
          } catch (e) {
            console.log('Could not remove previous user marker');
          }
        }
        
        // Create user location marker
        const marker = L.circleMarker([latitude, longitude], {
          radius: 8,
          fillColor: '#4285F4',
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 1
        })
          .addTo(mapInstance)
          .bindPopup('Your location');
        
        setUserMarker(marker);
        console.log('User location updated on map');
      } catch (error) {
        console.error('Error updating user location:', error);
      }
    }
    
    updateUserLocation();
  }, [mapInitialized, mapInstance, latitude, longitude, userMarker]);
  
  // Add point markers to map
  useEffect(() => {
    if (!mapInitialized || !mapInstance) return;
    
    async function updatePointMarkers() {
      try {
        // Import leaflet dynamically
        const L = await import('leaflet');
        
        // Remove previous markers
        if (markers && markers.length) {
          markers.forEach(marker => {
            if (marker && marker.remove) {
              marker.remove();
            }
          });
        }
        
        // Skip if no points to show
        if (!filteredPoints || !filteredPoints.length) {
          setMarkers([]);
          return;
        }
        
        // Create markers for filtered points
        const newMarkers = filteredPoints.map(point => {
          // Skip invalid points
          if (!point.latitude || !point.longitude) return null;
          
          // Point coordinates
          const latlng = [Number(point.latitude), Number(point.longitude)];
          
          // Determine color based on point type and selection state
          let color = '#4285F4'; // Default blue for WiFi
          
          if (point.id === selectedPointId) {
            color = '#DB4437'; // Red for selected point
          } else {
            switch(point.type) {
              case PointType.WIFI:
                color = '#4285F4'; // Blue for WiFi
                break;
              case PointType.OUTLET:
                color = '#F4B400'; // Yellow for outlets
                break;
              case PointType.RESTROOM:
                color = '#0F9D58'; // Green for restrooms
                break;
            }
          }
          
          // Create custom icon
          const iconHtml = `
            <div style="
              background-color: ${color};
              color: white;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              display: flex;
              justify-content: center;
              align-items: center;
              font-weight: bold;
              border: 2px solid white;
              font-size: 10px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            ">
              ${point.type === PointType.WIFI ? 'W' : point.type === PointType.OUTLET ? 'Р' : 'Т'}
            </div>
          `;
          
          const icon = L.divIcon({
            html: iconHtml,
            className: '',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          
          // Create marker
          const marker = L.marker(latlng as [number, number], { icon })
            .addTo(mapInstance)
            .bindPopup(`
              <div style="font-weight: 500;">${point.name || 'Unnamed Point'}</div>
              <div style="font-size: 0.875rem;">${getPointTypeName(point.type as PointType)}</div>
              ${point.type === PointType.WIFI && point.password ? 
                `<div style="font-size: 0.75rem; margin-top: 0.25rem;">Password: ${point.password}</div>` : 
                ''}
            `);
          
          // Add click event
          marker.on('click', () => {
            onSelectPoint(point);
          });
          
          return marker;
        }).filter(Boolean); // Remove null markers
        
        setMarkers(newMarkers);
        console.log(`Added ${newMarkers.length} markers to map`);
      } catch (error) {
        console.error('Error updating point markers:', error);
      }
    }
    
    updatePointMarkers();
  }, [mapInitialized, mapInstance, filteredPoints, selectedPointId, onSelectPoint, markers]);

  // Render fallback view when map is not available
  const renderListView = () => (
    <div className="p-4 flex flex-col space-y-2 h-full overflow-y-auto">
      {!mapInitialized && (
        <div className="p-3 bg-yellow-100 text-yellow-800 rounded-lg mb-4">
          Map view is currently unavailable. Showing points in list view.
        </div>
      )}
      
      <div className="text-lg font-semibold mb-2">Points near you:</div>
      
      {filteredPoints.length > 0 ? (
        filteredPoints.map(point => (
          <div 
            key={point.id}
            className={`p-4 bg-white rounded-lg shadow ${point.id === selectedPointId ? 'ring-2 ring-primary' : ''}`}
            onClick={() => onSelectPoint(point)}
          >
            <div className="flex items-center">
              <div className={`${getPointBgClass(point.type as PointType)} w-10 h-10 rounded-full flex items-center justify-center text-white mr-3`}>
                {getPointTypeName(point.type as PointType).charAt(0)}
              </div>
              <div>
                <div className="font-medium">{point.name || 'Unnamed Point'}</div>
                <div className="text-sm text-gray-500">{getPointTypeName(point.type as PointType)}</div>
                {point.type === PointType.WIFI && point.password && (
                  <div className="text-xs mt-1">Password: {point.password}</div>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          No points with selected filters
        </div>
      )}
    </div>
  );

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden bg-gray-100">
      {/* Loading state */}
      {(isLoading || geoLoading) && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
          <div className="text-primary font-medium">Loading data...</div>
        </div>
      )}
      
      {/* Map Container */}
      <div 
        id="map-container" 
        className="w-full h-full"
        style={{ display: mapInitialized ? 'block' : 'none' }}
      ></div>
      
      {/* Fallback List View */}
      {(!mapInitialized || !mapInstance) && renderListView()}
    </div>
  );
}
