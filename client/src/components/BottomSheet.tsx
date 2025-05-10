import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, ChevronUp, Wifi, Plug, DoorClosed } from 'lucide-react';
import { useGeolocation } from '@/lib/useGeolocation';
import { formatDistance, estimateWalkTime } from '@/lib/googleMaps';
import { PointType, Point } from '@shared/schema';

interface BottomSheetProps {
  onSelectPoint: (point: Point) => void;
}

export function BottomSheet({ onSelectPoint }: BottomSheetProps) {
  const [expanded, setExpanded] = useState(false);
  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const { latitude, longitude } = useGeolocation();

  // Fetch nearest points
  const { data: nearestPoints, isLoading } = useQuery<(Point & { distance: number })[]>({
    queryKey: ['/api/points/nearest', latitude, longitude],
    enabled: !!latitude && !!longitude,
    queryFn: async () => {
      if (!latitude || !longitude) return [];
      const res = await fetch(`/api/points/nearest?latitude=${latitude}&longitude=${longitude}&limit=3`);
      const data = await res.json();
      return data;
    }
  });

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Touch event handlers for swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === null) return;
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (startY === null || currentY === null) return;
    
    const deltaY = currentY - startY;
    
    // If swiped down more than 50px, collapse the panel
    if (deltaY > 50 && expanded) {
      setExpanded(false);
    }
    
    // If swiped up more than 50px, expand the panel
    if (deltaY < -50 && !expanded) {
      setExpanded(true);
    }
    
    setStartY(null);
    setCurrentY(null);
  };

  // Function to get icon by point type
  const getPointIcon = (type: string) => {
    switch (type) {
      case PointType.WIFI:
        return <Wifi className="h-4 w-4" />;
      case PointType.OUTLET:
        return <Plug className="h-4 w-4" />;
      case PointType.RESTROOM:
        return <DoorClosed className="h-4 w-4" />;
      default:
        return <Wifi className="h-4 w-4" />;
    }
  };

  // Function to get color by point type
  const getPointColor = (type: string) => {
    switch (type) {
      case PointType.WIFI:
        return 'bg-primary';
      case PointType.OUTLET:
        return 'bg-secondary';
      case PointType.RESTROOM:
        return 'bg-accent';
      default:
        return 'bg-primary';
    }
  };

  // Calculate dynamic height for bottom sheet when expanded
  const sheetHeight = expanded ? 
    '300px' : // When expanded
    'auto';  // When collapsed

  return (
    <div 
      ref={sheetRef}
      className={`fixed left-0 right-0 bottom-0 bg-white rounded-t-2xl shadow-lg z-20 transition-all duration-300`}
      style={{ 
        height: sheetHeight,
        transform: `translateY(${currentY !== null && startY !== null ? Math.max(0, currentY - startY) : 0}px)`,
        maxHeight: expanded ? '80vh' : '160px'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="p-4 overflow-y-auto" style={{ maxHeight: '100%' }}>
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4 cursor-pointer" onClick={toggleExpanded}></div>
        
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-heading font-semibold text-lg">Ближайшие точки</h2>
          <button 
            onClick={toggleExpanded}
            className="text-primary"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <ChevronUp className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {isLoading ? (
          <div className="py-8 text-center text-gray-500">Loading nearest points...</div>
        ) : nearestPoints && nearestPoints.length > 0 ? (
          nearestPoints.map((point) => (
            <div 
              key={point.id}
              className="bg-white rounded-lg shadow-card p-3 mb-3 flex items-center"
              onClick={() => onSelectPoint(point)}
            >
              <div className="rounded-full p-2 mr-3">
                <div className={`${getPointColor(point.type)} text-white rounded-full p-2`}>
                  {getPointIcon(point.type)}
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="font-medium">{point.name}</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{formatDistance(point.distance)}</span>
                  <span className="mx-1">•</span>
                  <span>{estimateWalkTime(point.distance)}</span>
                </div>
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPoint(point);
                }}
                className="text-primary p-2"
              >
                <ChevronUp className="h-5 w-5 rotate-90" />
              </button>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">
            No points found near you
          </div>
        )}
      </div>
    </div>
  );
}
