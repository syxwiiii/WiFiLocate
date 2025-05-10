import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  getPendingPoints, 
  removePendingPoint, 
  getPendingPointsCount,
  isOnline,
  setupConnectivityListeners
} from '@/lib/localStorageUtils';

export function SyncStatus() {
  const [online, setOnline] = useState(isOnline());
  const [pendingCount, setPendingCount] = useState(getPendingPointsCount());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Setup listeners for online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      toast({
        title: "Подключение восстановлено",
        description: pendingCount > 0 ? "Нажмите для синхронизации точек" : undefined,
      });
    };
    
    const handleOffline = () => {
      setOnline(false);
      toast({
        title: "Отсутствует подключение",
        description: "Точки будут сохранены локально",
        variant: "destructive",
      });
    };
    
    const cleanup = setupConnectivityListeners(handleOnline, handleOffline);
    
    // Check pending points count initially and when component mounts
    setPendingCount(getPendingPointsCount());
    
    return cleanup;
  }, [toast, pendingCount]);

  // Update pending count when points are added/removed
  useEffect(() => {
    const checkPendingPoints = () => {
      setPendingCount(getPendingPointsCount());
    };
    
    // Set up an interval to check for pending points
    const interval = setInterval(checkPendingPoints, 5000);
    
    // Clear interval on unmount
    return () => clearInterval(interval);
  }, []);
  
  const syncMutation = useMutation({
    mutationFn: async (point: any) => {
      const response = await apiRequest('POST', '/api/points', point);
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Remove point from pending points
      removePendingPoint(variables._localTimestamp);
      
      // Update pending count
      setPendingCount(getPendingPointsCount());
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/points/nearest'] });
    },
    onError: (error) => {
      toast({
        title: "Ошибка синхронизации",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleSyncClick = async () => {
    if (!online) {
      toast({
        title: "Нет подключения",
        description: "Дождитесь подключения к интернету",
        variant: "destructive",
      });
      return;
    }
    
    if (pendingCount === 0) {
      toast({
        title: "Нет точек для синхронизации",
        description: "Все точки уже синхронизированы",
      });
      return;
    }
    
    // Get pending points
    const pendingPoints = getPendingPoints();
    
    // Show toast
    toast({
      title: "Синхронизация",
      description: `Отправка ${pendingPoints.length} точек на сервер...`,
    });
    
    // Sync each point
    for (const point of pendingPoints) {
      await syncMutation.mutateAsync(point);
    }
    
    // Show success toast
    toast({
      title: "Синхронизация завершена",
      description: `Отправлено ${pendingPoints.length} точек`,
    });
  };
  
  // Don't render anything if no pending points and online
  if (pendingCount === 0 && online) return null;
  
  return (
    <div 
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 py-2 px-4 rounded-full shadow-lg flex items-center space-x-2 z-40 ${
        online ? 'bg-white' : 'bg-yellow-100'
      }`}
      onClick={handleSyncClick}
    >
      {online ? (
        <>
          <Cloud className="h-4 w-4 text-primary" />
          {pendingCount > 0 && (
            <>
              <span className="text-sm font-medium">Синхронизировать {pendingCount} точек</span>
              <RefreshCw className="h-4 w-4 text-primary animate-spin" />
            </>
          )}
        </>
      ) : (
        <>
          <CloudOff className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-700">Офлайн режим</span>
          {pendingCount > 0 && (
            <span className="bg-yellow-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </>
      )}
    </div>
  );
}