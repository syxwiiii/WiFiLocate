import { Point } from '@shared/schema';

// Prefix for local storage keys to avoid conflicts
const LS_PREFIX = 'wifilocat_';
const PENDING_POINTS_KEY = `${LS_PREFIX}pending_points`;

/**
 * Save a new point to localStorage for offline mode
 * When user is offline, points will be stored locally and synced later
 */
export function savePointLocally(point: Omit<Point, 'id' | 'createdAt' | 'updatedAt'>): void {
  try {
    // Get existing pending points or initialize new array
    const pendingPoints = getPendingPoints();
    
    // Add timestamp for local tracking
    const pointWithTimestamp = {
      ...point,
      _localTimestamp: Date.now()
    };
    
    // Save to pending points
    pendingPoints.push(pointWithTimestamp);
    localStorage.setItem(PENDING_POINTS_KEY, JSON.stringify(pendingPoints));
  } catch (error) {
    console.error('Error saving point to local storage:', error);
  }
}

/**
 * Get all pending points that need to be synced with server
 */
export function getPendingPoints(): any[] {
  try {
    const pendingPointsJson = localStorage.getItem(PENDING_POINTS_KEY);
    return pendingPointsJson ? JSON.parse(pendingPointsJson) : [];
  } catch (error) {
    console.error('Error getting pending points from local storage:', error);
    return [];
  }
}

/**
 * Remove a point from pending points after successful sync
 */
export function removePendingPoint(localTimestamp: number): void {
  try {
    const pendingPoints = getPendingPoints();
    const filteredPoints = pendingPoints.filter((point) => point._localTimestamp !== localTimestamp);
    localStorage.setItem(PENDING_POINTS_KEY, JSON.stringify(filteredPoints));
  } catch (error) {
    console.error('Error removing pending point from local storage:', error);
  }
}

/**
 * Check if there are any pending points that need syncing
 */
export function hasPendingPoints(): boolean {
  return getPendingPoints().length > 0;
}

/**
 * Clear all pending points from local storage
 */
export function clearPendingPoints(): void {
  localStorage.removeItem(PENDING_POINTS_KEY);
}

/**
 * Get the number of pending points
 */
export function getPendingPointsCount(): number {
  return getPendingPoints().length;
}

/**
 * Check if device is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

// Add event listeners for online/offline status
export function setupConnectivityListeners(onOnline: () => void, onOffline: () => void): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}