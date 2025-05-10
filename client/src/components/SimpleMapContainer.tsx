import React, { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGeolocation } from '@/lib/useGeolocation';
import { PointType, Point } from '@shared/schema';

interface SimpleMapContainerProps {
  onSelectPoint: (point: Point) => void;
  activeFilters: PointType[];
  selectedPointId: number | null;
}

export function SimpleMapContainer({ 
  onSelectPoint, 
  activeFilters, 
  selectedPointId 
}: SimpleMapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const { latitude, longitude, loading: geoLoading } = useGeolocation();
  
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

  useEffect(() => {
    // Load Leaflet dynamically on client-side only
    let map: any = null;
    let markers: any[] = [];
    let userMarker: any = null;
    
    async function initMap() {
      try {
        // Dynamically import Leaflet
        const L = await import('leaflet');
        
        // Make sure we have a map element
        if (!mapRef.current) return;
        
        // Initialize the map
        map = L.map(mapRef.current).setView([55.751244, 37.618423], 13);
        
        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Update map when geolocation is available
        if (latitude !== null && longitude !== null) {
          map.setView([latitude, longitude], 15);
          
          // Add user marker
          userMarker = L.circleMarker([latitude, longitude], {
            radius: 8,
            fillColor: '#4285F4',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 1
          })
            .addTo(map)
            .bindPopup('Your location');
        }
        
        // Add markers for all points
        if (filteredPoints.length > 0) {
          filteredPoints.forEach(point => {
            if (!point.latitude || !point.longitude) return;
            
            const latlng = [
              Number(point.latitude), 
              Number(point.longitude)
            ] as [number, number];
            
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
            
            // Create custom icon HTML
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
            
            // Create marker
            const marker = L.marker(latlng, {
              icon: L.divIcon({
                html: iconHtml,
                className: '',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })
            }).addTo(map);
            
            // Add popup
            marker.bindPopup(`
              <div style="font-weight: 500;">${point.name || 'Unnamed Point'}</div>
              <div style="font-size: 0.875rem;">${getPointTypeName(point.type as PointType)}</div>
              ${point.type === PointType.WIFI && point.password ? 
                `<div style="font-size: 0.75rem; margin-top: 0.25rem;">Password: ${point.password}</div>` : 
                ''}
            `);
            
            // Add click handler
            marker.on('click', () => {
              onSelectPoint(point);
            });
            
            markers.push(marker);
          });
        }
        
        // Force resize to make sure map renders correctly
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
        
      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    }
    
    // Initialize map
    initMap();
    
    // Cleanup function
    return () => {
      if (map) {
        try {
          map.remove();
        } catch (error) {
          console.error('Error cleaning up map:', error);
        }
      }
    };
  }, [latitude, longitude, filteredPoints, selectedPointId, onSelectPoint]);

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden bg-gray-100">
      {/* Loading indicator */}
      {(isLoading || geoLoading) && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
          <div className="text-primary font-medium">Loading data...</div>
        </div>
      )}
      
      {/* Map container */}
      <div
        ref={mapRef}
        className="w-full h-full z-0"
        style={{ height: '100%' }}
      ></div>
      
      {/* Fallback message if points are empty */}
      {!isLoading && filteredPoints.length === 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-lg z-10">
          No points match your filter criteria
        </div>
      )}
    </div>
  );
}