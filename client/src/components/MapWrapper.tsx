import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGeolocation } from '@/lib/useGeolocation';
import { PointType, Point } from '@shared/schema';
import { LeafletMap } from './LeafletMap';

interface MapWrapperProps {
  onSelectPoint: (point: Point) => void;
  activeFilters: PointType[];
  selectedPointId: number | null;
}

export function MapWrapper({ 
  onSelectPoint, 
  activeFilters, 
  selectedPointId 
}: MapWrapperProps) {
  const { latitude, longitude, loading: geoLoading } = useGeolocation();
  
  // Fetch all points
  const { data: points = [], isLoading } = useQuery<Point[]>({
    queryKey: ['/api/points'],
  });

  // Render loading state
  if (isLoading || geoLoading) {
    return (
      <div className="relative flex-1 w-full h-full overflow-hidden bg-gray-100 flex items-center justify-center">
        <div className="text-primary font-medium">Loading map data...</div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden bg-gray-100">
      <LeafletMap
        points={points}
        activeFilters={activeFilters}
        selectedPointId={selectedPointId}
        onSelectPoint={onSelectPoint}
        userLocation={{ latitude, longitude }}
      />
      
      {/* Fallback message if points are empty */}
      {!isLoading && points.filter(point => 
        activeFilters.includes(point.type as PointType)
      ).length === 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-lg z-10">
          No points match your filter criteria
        </div>
      )}
    </div>
  );
}