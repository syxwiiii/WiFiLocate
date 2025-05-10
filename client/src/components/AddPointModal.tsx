import React, { useState, useEffect } from 'react';
import { X, CloudOff, Wifi, Plug, DoorClosed } from 'lucide-react';
import { PointType, WifiSpeed, insertPointSchema } from '@shared/schema';
import { useGeolocation } from '@/lib/useGeolocation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { savePointLocally, isOnline } from '@/lib/localStorageUtils';

interface AddPointModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export function AddPointModal({ isVisible, onClose }: AddPointModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { latitude, longitude } = useGeolocation();
  const [online, setOnline] = useState(isOnline());

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const form = useForm({
    resolver: zodResolver(insertPointSchema),
    defaultValues: {
      type: PointType.WIFI,
      name: '',
      password: '',
      speed: WifiSpeed.MEDIUM,
      latitude: latitude || 0,
      longitude: longitude || 0,
    }
  });

  const pointTypeMutation = useMutation({
    mutationFn: async (data: any) => {
      // Update coordinates with latest values
      data.latitude = latitude || data.latitude;
      data.longitude = longitude || data.longitude;
      
      const response = await apiRequest('POST', '/api/points', data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/points/nearest'] });
      
      // Show success toast
      toast({
        title: "Успех",
        description: "Новая точка добавлена",
      });
      
      // Close modal and reset form
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: any) => {
    // Remove empty fields
    if (data.type !== PointType.WIFI) {
      delete data.password;
      delete data.speed;
    }
    
    // Update coordinates with latest values
    data.latitude = latitude || data.latitude;
    data.longitude = longitude || data.longitude;
    
    if (online) {
      // Online mode - submit directly to server
      pointTypeMutation.mutate(data);
    } else {
      // Offline mode - save to local storage
      savePointLocally(data);
      
      // Show success toast
      toast({
        title: "Сохранено локально",
        description: "Точка будет отправлена на сервер, когда появится подключение к интернету",
      });
      
      // Close modal and reset form
      onClose();
      form.reset();
    }
  };

  const watchType = form.watch('type');

  // Get icon based on type
  const getPointIcon = () => {
    switch (watchType) {
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

  // Get color based on type
  const getPointColor = () => {
    switch (watchType) {
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

  // Don't render anything if not visible
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-11/12 max-w-md mx-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="font-heading font-semibold text-lg">Добавить новую точку</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {!online && (
          <div className="mx-5 mt-4 py-2 px-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center text-sm text-yellow-700">
            <CloudOff className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>Вы в офлайн режиме. Точка будет сохранена локально.</span>
          </div>
        )}
        
        <div className="p-5">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Тип точки</label>
              <div className="flex space-x-2">
                <label className={`flex-1 flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${watchType === PointType.WIFI ? 'bg-primary bg-opacity-10 border-primary' : 'hover:bg-gray-50'}`}>
                  <input 
                    type="radio" 
                    {...form.register('type')}
                    value={PointType.WIFI}
                    className="sr-only" 
                  />
                  <div className={`${watchType === PointType.WIFI ? 'bg-primary' : 'bg-gray-200'} text-white rounded-full p-2 mb-1`}>
                    <Wifi className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">WiFi</span>
                </label>
                <label className={`flex-1 flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${watchType === PointType.OUTLET ? 'bg-secondary bg-opacity-10 border-secondary' : 'hover:bg-gray-50'}`}>
                  <input 
                    type="radio" 
                    {...form.register('type')}
                    value={PointType.OUTLET}
                    className="sr-only"
                  />
                  <div className={`${watchType === PointType.OUTLET ? 'bg-secondary' : 'bg-gray-200'} text-white rounded-full p-2 mb-1`}>
                    <Plug className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">Розетка</span>
                </label>
                <label className={`flex-1 flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${watchType === PointType.RESTROOM ? 'bg-accent bg-opacity-10 border-accent' : 'hover:bg-gray-50'}`}>
                  <input 
                    type="radio" 
                    {...form.register('type')}
                    value={PointType.RESTROOM}
                    className="sr-only"
                  />
                  <div className={`${watchType === PointType.RESTROOM ? 'bg-accent' : 'bg-gray-200'} text-white rounded-full p-2 mb-1`}>
                    <DoorClosed className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">Туалет</span>
                </label>
              </div>
              {form.formState.errors.type && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.type.message}</p>
              )}
            </div>
            
            <div className="mb-5">
              <label htmlFor="pointName" className="block text-sm font-medium text-gray-700 mb-1">Название</label>
              <input 
                type="text" 
                id="pointName"
                {...form.register('name')}
                placeholder="Например: Кафе Старбакс WiFi" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            {watchType === PointType.WIFI && (
              <div id="wifi-fields" className="space-y-4">
                <div>
                  <label htmlFor="wifiPassword" className="block text-sm font-medium text-gray-700 mb-1">Пароль (если есть)</label>
                  <input 
                    type="text" 
                    id="wifiPassword"
                    {...form.register('password')}
                    placeholder="Оставьте пустым, если нет пароля" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Скорость</label>
                  <div className="flex space-x-2">
                    <label className={`flex-1 flex items-center p-2 border rounded-lg cursor-pointer transition-colors ${form.watch('speed') === WifiSpeed.SLOW ? 'bg-red-50 border-red-200' : 'hover:bg-gray-50'}`}>
                      <input 
                        type="radio" 
                        {...form.register('speed')}
                        value={WifiSpeed.SLOW}
                        className="mr-2"
                      />
                      <span className="text-sm">Медленный</span>
                    </label>
                    <label className={`flex-1 flex items-center p-2 border rounded-lg cursor-pointer transition-colors ${form.watch('speed') === WifiSpeed.MEDIUM ? 'bg-yellow-50 border-yellow-200' : 'hover:bg-gray-50'}`}>
                      <input 
                        type="radio" 
                        {...form.register('speed')}
                        value={WifiSpeed.MEDIUM}
                        className="mr-2"
                      />
                      <span className="text-sm">Средний</span>
                    </label>
                    <label className={`flex-1 flex items-center p-2 border rounded-lg cursor-pointer transition-colors ${form.watch('speed') === WifiSpeed.FAST ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'}`}>
                      <input 
                        type="radio" 
                        {...form.register('speed')}
                        value={WifiSpeed.FAST}
                        className="mr-2"
                      />
                      <span className="text-sm">Быстрый</span>
                    </label>
                  </div>
                  {form.formState.errors.speed && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.speed.message}</p>
                  )}
                </div>
              </div>
            )}
            
            <div className="mt-5">
              <button 
                type="submit" 
                className="w-full bg-primary text-white py-3 rounded-lg font-medium transition-colors hover:bg-primary/90"
                disabled={pointTypeMutation.isPending}
              >
                {pointTypeMutation.isPending ? 'Добавляем...' : 'Добавить точку'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
