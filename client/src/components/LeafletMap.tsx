import React, { useEffect, useRef } from 'react';
import { PointType, Point } from '@shared/schema';
import 'leaflet/dist/leaflet.css';

interface LeafletMapProps {
  points: Point[];
  activeFilters: PointType[];
  selectedPointId: number | null;
  onSelectPoint: (point: Point) => void;
  userLocation: {
    latitude: number | null;
    longitude: number | null;
  };
}

export function LeafletMap({ 
  points, 
  activeFilters, 
  selectedPointId, 
  onSelectPoint,
  userLocation 
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  
  // Filter points
  const filteredPoints = points?.filter(point => 
    activeFilters.includes(point.type as PointType)
  ) || [];
  
  // Initialize map
  useEffect(() => {
    // Skip if container isn't ready
    if (!mapContainerRef.current) {
      console.error('Map container ref is not available');
      return;
    }
    
    console.log('Starting map initialization');
    
    // Set debug outline for map container
    mapContainerRef.current.style.border = '2px solid red';
    
    // Import Leaflet
    const initMap = async () => {
      try {
        // Dynamically import Leaflet
        const L = await import('leaflet');
        console.log('Leaflet imported successfully');
        
        // Clean up previous map instance if it exists
        if (mapRef.current) {
          console.log('Removing previous map instance');
          mapRef.current.remove();
        }
        
        // Create new map
        const mapElement = mapContainerRef.current;
        if (!mapElement) {
          console.error('Map element not found');
          return;
        }
        
        console.log('Creating new map instance');
        const map = L.map(mapElement, {
          center: [55.751244, 37.618423], // Default center (Moscow)
          zoom: 13
        });
        
        // Add tile layer
        console.log('Adding tile layer');
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Store map reference
        mapRef.current = map;
        
        // Use user location if available
        if (userLocation.latitude !== null && userLocation.longitude !== null) {
          console.log('Setting view to user location:', userLocation);
          map.setView([userLocation.latitude, userLocation.longitude], 15);
          
          // Add user marker
          if (userMarkerRef.current) {
            userMarkerRef.current.remove();
          }
          
          console.log('Adding user location marker');
          const userMarker = L.circleMarker(
            [userLocation.latitude, userLocation.longitude] as [number, number], 
            {
              radius: 8,
              fillColor: '#4285F4',
              color: '#ffffff',
              weight: 2,
              opacity: 1,
              fillOpacity: 1
            }
          )
            .addTo(map)
            .bindPopup('Your location');
          
          userMarkerRef.current = userMarker;
        } else {
          console.log('User location not available, using default coordinates');
        }
        
        // Add markers for points
        console.log('Adding point markers to map, points count:', filteredPoints.length);
        addPointMarkers(L, map, filteredPoints, selectedPointId);
        
        // Force a resize to ensure map renders properly
        setTimeout(() => {
          console.log('Forcing map resize');
          map.invalidateSize();
        }, 100);
        
        // Remove debug outline after successful initialization
        if (mapContainerRef.current) {
          mapContainerRef.current.style.border = 'none';
        }
        
        console.log('Map initialized successfully');
      } catch (error) {
        console.error('Error initializing map:', error);
        
        // Add visual feedback for error
        if (mapContainerRef.current) {
          mapContainerRef.current.innerHTML = `
            <div style="
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: #f8d7da;
              color: #721c24;
              padding: 20px;
              text-align: center;
            ">
              <div>
                <h3>Error Loading Map</h3>
                <p>There was a problem loading the map. Please try refreshing the page.</p>
              </div>
            </div>
          `;
        }
      }
    };
    
    initMap();
    
    // Cleanup function
    return () => {
      if (mapRef.current) {
        try {
          console.log('Cleaning up map');
          mapRef.current.remove();
          mapRef.current = null;
        } catch (error) {
          console.error('Error removing map:', error);
        }
      }
    };
  }, []);
  
  // Update markers when filtered points or selected point changes
  useEffect(() => {
    if (!mapRef.current) return;
    
    const updateMarkers = async () => {
      try {
        const L = await import('leaflet');
        addPointMarkers(L, mapRef.current, filteredPoints, selectedPointId);
      } catch (error) {
        console.error('Error updating markers:', error);
      }
    };
    
    updateMarkers();
  }, [filteredPoints, selectedPointId]);
  
  // Update map center when user location changes
  useEffect(() => {
    if (!mapRef.current) return;
    if (userLocation.latitude === null || userLocation.longitude === null) return;
    
    const updateUserLocation = async () => {
      try {
        const L = await import('leaflet');
        
        mapRef.current.setView([userLocation.latitude, userLocation.longitude], 15);
        
        if (userMarkerRef.current) {
          userMarkerRef.current.remove();
        }
        
        const userMarker = L.circleMarker(
          [userLocation.latitude, userLocation.longitude] as [number, number], 
          {
            radius: 8,
            fillColor: '#4285F4',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 1
          }
        )
          .addTo(mapRef.current)
          .bindPopup('Your location');
        
        userMarkerRef.current = userMarker;
        console.log('User location updated');
      } catch (error) {
        console.error('Error updating user location:', error);
      }
    };
    
    updateUserLocation();
  }, [userLocation.latitude, userLocation.longitude]);
  
  // Helper function to add point markers
  const addPointMarkers = async (L: any, map: any, points: Point[], selectedId: number | null) => {
    // Remove existing markers
    markersRef.current.forEach(marker => {
      try {
        marker.remove();
      } catch (e) {
        // Ignore marker removal errors
      }
    });
    markersRef.current = [];
    
    // Skip if no points
    if (!points || points.length === 0) {
      console.log('No points to add to map');
      return;
    }
    
    console.log('Adding points to map:', points);
    
    // Add markers for points
    const newMarkers = points.map(point => {
      // Skip invalid points (zero lat/long or missing values)
      if (!point.latitude || !point.longitude) {
        console.log('Skipping invalid point:', point);
        return null;
      }
      
      // Convert coordinates to numbers
      const lat = Number(point.latitude);
      const lng = Number(point.longitude);
      
      // Skip points with invalid coordinates
      if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
        console.log('Skipping point with invalid coordinates:', point);
        return null;
      }
      
      // Point coordinates
      const coords = [lat, lng];
      console.log('Adding point marker at coordinates:', coords);
      
      // Determine marker color based on point type and selection
      let color = '#4285F4'; // Default blue for WiFi
      
      if (point.id === selectedId) {
        color = '#DB4437'; // Red for selected
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
      
      // Get point label
      const label = point.type === PointType.WIFI ? 'W' : 
                   point.type === PointType.OUTLET ? 'Р' : 'Т';
      
      try {
        // Create custom HTML icon
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
            ${label}
          </div>
        `;
        
        // Create marker
        const icon = L.divIcon({
          html: iconHtml,
          className: '',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        
        // Create and add marker to map
        const marker = L.marker(coords as [number, number], { icon }).addTo(map);
        
        // Add popup
        marker.bindPopup(`
          <div style="font-weight: 500;">${point.name || 'Unnamed Point'}</div>
          <div style="font-size: 0.875rem;">${
            point.type === PointType.WIFI ? 'WiFi' : 
            point.type === PointType.OUTLET ? 'Розетка' : 'Туалет'
          }</div>
          ${point.type === PointType.WIFI && point.password ? 
            `<div style="font-size: 0.75rem; margin-top: 0.25rem;">Password: ${point.password}</div>` : 
            ''}
        `);
        
        // Add click handler
        marker.on('click', () => {
          onSelectPoint(point);
        });
        
        return marker;
      } catch (error) {
        console.error('Error creating marker:', error);
        return null;
      }
    }).filter(Boolean) as any[];
    
    // Store markers
    markersRef.current = newMarkers;
    console.log(`Added ${newMarkers.length} markers to map`);
  };
  
  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height: '100%' }}
      className="leaflet-container"
    />
  );
}