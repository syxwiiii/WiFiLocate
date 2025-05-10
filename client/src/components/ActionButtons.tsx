import React from 'react';
import { Plus, Focus } from 'lucide-react';

interface ActionButtonsProps {
  onAddNewPoint: () => void;
  onCenterLocation: () => void;
}

export function ActionButtons({ onAddNewPoint, onCenterLocation }: ActionButtonsProps) {
  return (
    <div className="fixed bottom-40 right-4 flex flex-col space-y-3 z-30">
      {/* Add point button */}
      <button 
        onClick={onAddNewPoint}
        className="bg-primary text-white rounded-full p-3 shadow-button hover:bg-primary/90 transition-colors"
        aria-label="Add new point"
      >
        <Plus className="h-5 w-5" />
      </button>
      
      {/* Current location button */}
      <button 
        onClick={onCenterLocation}
        className="bg-white text-primary rounded-full p-3 shadow-card hover:bg-gray-50 transition-colors"
        aria-label="Center on current location"
      >
        <Focus className="h-5 w-5" />
      </button>
    </div>
  );
}
