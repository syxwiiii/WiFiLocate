import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { MapWrapper } from '@/components/MapWrapper';
import { PointTypeFilters } from '@/components/PointTypeFilters';
import { ActionButtons } from '@/components/ActionButtons';
import { BottomSheet } from '@/components/BottomSheet';
import { PointInfoModal } from '@/components/PointInfoModal';
import { AddPointModal } from '@/components/AddPointModal';
import { SyncStatus } from '@/components/SyncStatus';
import { useGeolocation } from '@/lib/useGeolocation';
import { PointType, Point } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  // State management
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<PointType[]>([
    PointType.WIFI, 
    PointType.OUTLET, 
    PointType.RESTROOM
  ]);
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const [pointInfoVisible, setPointInfoVisible] = useState(false);
  const [addPointVisible, setAddPointVisible] = useState(false);
  
  const { latitude, longitude } = useGeolocation();
  const { toast } = useToast();

  // Toggle filters visibility
  const handleToggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  // Toggle filter active state
  const handleToggleFilter = (type: PointType) => {
    if (activeFilters.includes(type)) {
      // Don't allow removing the last filter
      if (activeFilters.length > 1) {
        setActiveFilters(activeFilters.filter(t => t !== type));
      }
    } else {
      setActiveFilters([...activeFilters, type]);
    }
  };

  // Handle point selection
  const handleSelectPoint = (point: Point) => {
    setSelectedPoint(point);
    setPointInfoVisible(true);
  };

  // Handle user centering on map
  const handleCenterLocation = () => {
    if (!latitude || !longitude) {
      toast({
        title: "Location Error",
        description: "Unable to get your current location. Please enable location services.",
        variant: "destructive",
      });
      return;
    }
    
    // The actual centering happens in the MapContainer component
    // But we can provide user feedback here
    toast({
      title: "Location",
      description: "Centered map on your current location",
    });
  };

  // Handle building route to point
  const handleBuildRoute = (point: Point) => {
    if (!latitude || !longitude) {
      toast({
        title: "Location Error",
        description: "Unable to get your current location. Please enable location services.",
        variant: "destructive",
      });
      return;
    }
    
    // Open Google Maps with route from current location to point
    const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${point.latitude},${point.longitude}&travelmode=walking`;
    window.open(url, '_blank');
  };

  // Handle reporting issue with point
  const handleReportIssue = (point: Point) => {
    toast({
      title: "Report Submitted",
      description: "Thank you for your feedback about this point.",
    });
    setPointInfoVisible(false);
  };

  return (
    <div className="relative h-screen flex flex-col">
      {/* Header */}
      <Header onToggleFilters={handleToggleFilters} />
      
      {/* Map */}
      <MapWrapper 
        onSelectPoint={handleSelectPoint} 
        activeFilters={activeFilters}
        selectedPointId={selectedPoint?.id ?? null}
      />
      
      {/* Filters */}
      <PointTypeFilters 
        isVisible={filtersVisible}
        activeFilters={activeFilters}
        onToggleFilter={handleToggleFilter}
      />
      
      {/* Action Buttons */}
      <ActionButtons 
        onAddNewPoint={() => setAddPointVisible(true)}
        onCenterLocation={handleCenterLocation}
      />
      
      {/* Bottom Sheet */}
      <BottomSheet onSelectPoint={handleSelectPoint} />
      
      {/* Point Info Modal */}
      <PointInfoModal 
        point={selectedPoint}
        isVisible={pointInfoVisible}
        onClose={() => setPointInfoVisible(false)}
        onBuildRoute={handleBuildRoute}
        onReportIssue={handleReportIssue}
      />
      
      {/* Add Point Modal */}
      <AddPointModal 
        isVisible={addPointVisible}
        onClose={() => setAddPointVisible(false)}
      />
      
      {/* Sync Status for offline support */}
      <SyncStatus />
    </div>
  );
}
