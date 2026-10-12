export const KETINTANG_CENTER_COORDINATES = {
  latitude: -7.3115,
  longitude: 112.7275,
  name: 'Jl. Ketintang Baru'
};

// Backward compatibility alias
export const VILLAGE_CENTER_COORDINATES = KETINTANG_CENTER_COORDINATES;

export const LIST_DUSUN = [
  'Jl. Ketintang Baru',
  'Jl. Ketintang Madya',
  'Jl. Ketintang Barat',
  'Jl. Ketintang Timur',
  'Jl. Ketintang Wiyata (UNESA)',
  'Jl. Ketintang Permai',
  'Jl. Ketintang Selatan'
];

export const LIST_WILAYAH_KETINTANG = LIST_DUSUN;

export const KETINTANG_LANDMARKS = [
  { name: 'Jl. Ketintang Baru', lat: -7.3115, lng: 112.7275, wilayah: 'Jl. Ketintang Baru' },
  { name: 'Jl. Ketintang Wiyata (UNESA)', lat: -7.3090, lng: 112.7240, wilayah: 'Jl. Ketintang Wiyata' },
  { name: 'Jl. Ketintang Madya', lat: -7.3142, lng: 112.7290, wilayah: 'Jl. Ketintang Madya' },
  { name: 'Jl. Ketintang Baru (Perlintasan Rel)', lat: -7.3105, lng: 112.7285, wilayah: 'Jl. Ketintang Baru' },
  { name: 'Jl. Ketintang Permai', lat: -7.3130, lng: 112.7210, wilayah: 'Jl. Ketintang Permai' },
  { name: 'Jl. Ketintang Barat', lat: -7.3160, lng: 112.7230, wilayah: 'Jl. Ketintang Barat' },
  { name: 'Jl. Ketintang Selatan', lat: -7.3180, lng: 112.7265, wilayah: 'Jl. Ketintang Selatan' },
];

/**
 * Check if coordinates are reasonably within Ketintang & vicinity
 */
export function isInKetintangVicinity(lat: number, lng: number): boolean {
  return lat >= -7.3350 && lat <= -7.2950 && lng >= 112.7050 && lng <= 112.7450;
}

/**
 * Find closest landmark in Ketintang
 */
export function findClosestKetintangLandmark(lat: number, lng: number) {
  let closest = KETINTANG_LANDMARKS[0];
  let minDistance = Infinity;

  for (const landmark of KETINTANG_LANDMARKS) {
    const d = Math.hypot(landmark.lat - lat, landmark.lng - lng);
    if (d < minDistance) {
      minDistance = d;
      closest = landmark;
    }
  }

  return closest;
}

/**
 * Auto-detect user geolocation with fallback to Ketintang Center
 */
export function getInitialCoordinates(): Promise<{
  latitude: number;
  longitude: number;
  isAccurateDeviceGps: boolean;
  accuracyMeters?: number;
}> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve({
        latitude: KETINTANG_CENTER_COORDINATES.latitude,
        longitude: KETINTANG_CENTER_COORDINATES.longitude,
        isAccurateDeviceGps: false,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          isAccurateDeviceGps: true,
          accuracyMeters: pos.coords.accuracy,
        });
      },
      () => {
        resolve({
          latitude: KETINTANG_CENTER_COORDINATES.latitude,
          longitude: KETINTANG_CENTER_COORDINATES.longitude,
          isAccurateDeviceGps: false,
        });
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 10000 }
    );
  });
}

/**
 * Extract GPS EXIF Geotagging metadata from uploaded photo using exifr
 */
export async function extractGeotagFromPhoto(file: File): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  try {
    const exifr = (await import('exifr')).default;
    const gps = await exifr.gps(file);
    if (gps && typeof gps.latitude === 'number' && typeof gps.longitude === 'number') {
      return {
        latitude: gps.latitude,
        longitude: gps.longitude,
      };
    }
  } catch (err) {
    console.warn('Geotag extraction skipped or unsupported:', err);
  }
  return null;
}

/**
 * Reverse geocode coordinates to human-readable address in Ketintang Surabaya
 */
export async function reverseGeocodeKetintang(lat: number, lng: number): Promise<string> {
  const closest = findClosestKetintangLandmark(lat, lng);
  const geocodeApiKey = process.env.NEXT_PUBLIC_GEOCODE_MAPS_KEY || '6accd17a28a42786009662zgkd88b7c';

  // 1. Primary: geocode.maps.co API (reliable, fast, with user API key)
  try {
    const res = await fetch(
      `https://geocode.maps.co/reverse?lat=${lat}&lon=${lng}&api_key=${geocodeApiKey}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const road = data.address.road || data.address.pedestrian || data.address.residential;
        if (road) {
          const houseNo = data.address.house_number ? ` No. ${data.address.house_number}` : '';
          return `${road}${houseNo}`;
        }
        if (data.address.amenity) {
          return `${data.address.amenity}`;
        }
        if (data.address.neighbourhood || data.address.suburb) {
          return `Jl. ${data.address.neighbourhood || data.address.suburb}`;
        }
      }
    }
  } catch {
    // Continue to fallback
  }

  // 2. Fallback: OpenStreetMap Nominatim
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'id',
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const road = data.address.road || data.address.pedestrian || data.address.residential;
        if (road) {
          const houseNo = data.address.house_number ? ` No. ${data.address.house_number}` : '';
          return `${road}${houseNo}`;
        }
        if (data.address.amenity) {
          return `${data.address.amenity}`;
        }
        if (data.address.neighbourhood || data.address.suburb) {
          return `Jl. ${data.address.neighbourhood || data.address.suburb}`;
        }
      }
    }
  } catch {
    // Fallback to landmark
  }

  return closest.name;
}