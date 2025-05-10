import React from 'react';
import { X, Wifi, Route, AlertTriangle, Plug, DoorClosed } from 'lucide-react';
import { PointType, Point } from '@shared/schema';

interface PointInfoModalProps {
  point: Point | null;
  isVisible: boolean;
  onClose: () => void;
  onBuildRoute: (point: Point) => void;
  onReportIssue: (point: Point) => void;
}

export function PointInfoModal({ 
  point, 
  isVisible, 
  onClose, 
  onBuildRoute,
  onReportIssue
}: PointInfoModalProps) {
  if (!isVisible || !point) return null;

  // Get icon based on point type
  const getPointIcon = () => {
    switch (point.type) {
      case PointType.WIFI:
        return <Wifi className="h-5 w-5" />;
      case PointType.OUTLET:
        return <Plug className="h-5 w-5" />;
      case PointType.RESTROOM:
        return <DoorClosed className="h-5 w-5" />;
      default:
        return <Wifi className="h-5 w-5" />;
    }
  };

  // Get background color based on point type
  const getPointColor = () => {
    switch (point.type) {
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

  // Get background light color for container
  const getPointLightColor = () => {
    switch (point.type) {
      case PointType.WIFI:
        return 'bg-primary bg-opacity-10';
      case PointType.OUTLET:
        return 'bg-secondary bg-opacity-10';
      case PointType.RESTROOM:
        return 'bg-accent bg-opacity-10';
      default:
        return 'bg-primary bg-opacity-10';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-11/12 max-w-md mx-auto overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="font-heading font-semibold text-lg">Point Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-5">
          {/* Point information */}
          <div className={`mb-4 p-3 rounded-lg ${getPointLightColor()}`}>
            <div className="flex items-start">
              <div className={`${getPointColor()} text-white rounded-full p-2 mr-3`}>
                {getPointIcon()}
              </div>
              <div>
                <h4 className="font-heading font-medium text-base">{point.name}</h4>
                
                {point.type === PointType.WIFI && (
                  <>
                    {point.password && (
                      <p className="text-sm text-gray-600 mt-1">Password: {point.password}</p>
                    )}
                    {point.speed && (
                      <div className="flex items-center mt-2">
                        <div className={`flex items-center ${
                          point.speed === 'fast' ? 'text-success' :
                          point.speed === 'medium' ? 'text-secondary' :
                          'text-gray-500'
                        } mr-3`}>
                          <Wifi className="h-4 w-4 mr-1" />
                          <span className="text-xs">{
                            point.speed === 'fast' ? 'Fast' :
                            point.speed === 'medium' ? 'Medium' :
                            'Slow'
                          }</span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <span className="text-xs">
                            Updated {new Date(point.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex mt-4">
            <button 
              onClick={() => onBuildRoute(point)}
              className="flex-1 bg-primary text-white py-2 px-4 rounded-lg mr-2 flex items-center justify-center"
            >
              <Route className="h-4 w-4 mr-1" />
              <span>Построить маршрут</span>
            </button>
            <button 
              onClick={() => onReportIssue(point)}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg flex items-center justify-center"
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span>Сообщить</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
