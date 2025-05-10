// This script will load the Google Maps API
let googleMapsPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise<void>((resolve, reject) => {
    // Check if the API is already loaded
    if (window.google && window.google.maps) {
      resolve();
      return;
    }
    
    // Use directly provided API key
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || '';

    // Create a callback function for Google Maps
    window.initGoogleMaps = () => {
      resolve();
    };

    // Create a script tag
    const script = document.createElement('script');
    // Use a direct API key
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
      reject(new Error('Failed to load Google Maps API'));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

// Calculate distance between two points in meters
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in meters
}

// Convert degrees to radians
function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

// Format distance for display
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} м`;
  } else {
    return `${(meters / 1000).toFixed(1)} км`;
  }
}

// Estimate walking time (average walking speed: 5 km/h = 83.33 m/min)
export function estimateWalkTime(meters: number): string {
  const minutes = Math.round(meters / 83.33);
  return `${minutes} мин`;
}

// Build a route URL for Google Maps
export function buildGoogleMapsRouteUrl(startLat: number, startLng: number, endLat: number, endLng: number): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${endLat},${endLng}&travelmode=walking`;
}

// Define the Window interface to include Google Maps
declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}