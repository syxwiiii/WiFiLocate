import React from 'react';
import { Wifi, Plug, DoorClosed } from 'lucide-react';
import { PointType } from '@shared/schema';

interface PointTypeFiltersProps {
  isVisible: boolean;
  activeFilters: PointType[];
  onToggleFilter: (type: PointType) => void;
}

export function PointTypeFilters({ 
  isVisible, 
  activeFilters, 
  onToggleFilter 
}: PointTypeFiltersProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute top-16 left-0 right-0 mx-auto w-11/12 max-w-md bg-white rounded-lg shadow-card p-2 z-20 flex justify-between">
      <button 
        className={`flex-1 flex flex-col items-center py-2 px-1 rounded-md ${
          activeFilters.includes(PointType.WIFI) ? 'bg-primary bg-opacity-10' : 'hover:bg-gray-100'
        }`}
        onClick={() => onToggleFilter(PointType.WIFI)}
      >
        <div className="bg-primary text-white rounded-full p-1 mb-1">
          <Wifi className="h-4 w-4" />
        </div>
        <span className="text-xs font-medium">WiFi</span>
      </button>
      
      <button 
        className={`flex-1 flex flex-col items-center py-2 px-1 rounded-md ${
          activeFilters.includes(PointType.OUTLET) ? 'bg-secondary bg-opacity-10' : 'hover:bg-gray-100'
        }`}
        onClick={() => onToggleFilter(PointType.OUTLET)}
      >
        <div className="bg-secondary text-white rounded-full p-1 mb-1">
          <Plug className="h-4 w-4" />
        </div>
        <span className="text-xs font-medium">Розетки</span>
      </button>
      
      <button 
        className={`flex-1 flex flex-col items-center py-2 px-1 rounded-md ${
          activeFilters.includes(PointType.RESTROOM) ? 'bg-accent bg-opacity-10' : 'hover:bg-gray-100'
        }`}
        onClick={() => onToggleFilter(PointType.RESTROOM)}
      >
        <div className="bg-accent text-white rounded-full p-1 mb-1">
          <DoorClosed className="h-4 w-4" />
        </div>
        <span className="text-xs font-medium">Туалеты</span>
      </button>
    </div>
  );
}
