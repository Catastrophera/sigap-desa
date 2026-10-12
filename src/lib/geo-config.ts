export const KETINTANG_CENTER_COORDINATES = {
  latitude: -7.3115,
  longitude: 112.7275,
  name: 'Kantor Kelurahan Ketintang, Surabaya'
};

// Backward compatibility alias
export const VILLAGE_CENTER_COORDINATES = KETINTANG_CENTER_COORDINATES;

export const LIST_DUSUN = [
  'RW 01 - Ketintang Baru',
  'RW 02 - Ketintang Madya',
  'RW 03 - Ketintang Barat',
  'RW 04 - Ketintang Timur',
  'RW 05 - Ketintang Wiyata (UNESA)',
  'RW 06 - Ketintang Permai',
  'RW 07 - Ketintang Selatan / Gayungan'
];

export const LIST_WILAYAH_KETINTANG = LIST_DUSUN;

export const KETINTANG_LANDMARKS = [
  { name: 'Kantor Kelurahan Ketintang', lat: -7.3115, lng: 112.7275, wilayah: 'RW 01 - Ketintang Baru' },
  { name: 'Kawasan Kampus UNESA Ketintang', lat: -7.3090, lng: 112.7240, wilayah: 'RW 05 - Ketintang Wiyata (UNESA)' },
  { name: 'Jl. Ketintang Madya (Arah A. Yani)', lat: -7.3142, lng: 112.7290, wilayah: 'RW 02 - Ketintang Madya' },
  { name: 'Jl. Ketintang Baru / Dekat Rel', lat: -7.3105, lng: 112.7285, wilayah: 'RW 01 - Ketintang Baru' },
  { name: 'Kompleks Ketintang Permai', lat: -7.3130, lng: 112.7210, wilayah: 'RW 06 - Ketintang Permai' },
  { name: 'Kawasan Ketintang Barat', lat: -7.3160, lng: 112.7230, wilayah: 'RW 03 - Ketintang Barat' },
  { name: 'Jl. Ketintang Selatan', lat: -7.3180, lng: 112.7265, wilayah: 'RW 07 - Ketintang Selatan / Gayungan' },
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
  // If close to a landmark, start with landmark as baseline
  const closest = findClosestKetintangLandmark(lat, lng);
  const geocodeApiKey = process.env.NEXT_PUBLIC_GEOCODE_MAPS_KEY || '6accd17a28a42786009662zgkd88b7c';

  // 1. Primary: geocode.maps.co API (reliable, fast, with user API key)
  try {
    const res = await fetch(
      `https://geocode.maps.co/reverse?lat=${lat}&lon=${lng}&api_key=${geocodeApiKey}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data && (data.address || data.display_name)) {
        const parts = [
          data.address?.amenity || data.address?.road || data.address?.suburb || data.address?.neighbourhood,
          data.address?.neighbourhood && data.address?.road ? data.address.neighbourhood : null,
          data.address?.village || data.address?.city_district || 'Ketintang',
          'Surabaya'
        ].filter(Boolean);
        if (parts.length > 0) return parts.join(', ');
        return data.display_name.split(',').slice(0, 3).join(',');
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
      if (data && data.display_name) {
        const parts = [
          data.address?.road || data.address?.suburb || data.address?.neighbourhood,
          data.address?.village || data.address?.city_district || 'Ketintang',
          'Surabaya'
        ].filter(Boolean);
        if (parts.length > 0) return parts.join(', ');
        return data.display_name.split(',').slice(0, 3).join(',');
      }
    }
  } catch {
    // Fallback to landmark
  }

  return `${closest.name}, Ketintang, Surabaya`;
}