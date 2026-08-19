export const VILLAGE_CENTER_COORDINATES = {
  latitude: -7.3115,
  longitude: 112.7275,
  name: 'Kantor Balai Desa'
};

export const LIST_DUSUN = [
  'Dusun Krajan',
  'Dusun Sukomulyo',
  'Dusun Sidodadi',
  'Dusun Sumberingin'
];

export function getInitialCoordinates(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve({ latitude: VILLAGE_CENTER_COORDINATES.latitude, longitude: VILLAGE_CENTER_COORDINATES.longitude });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
      },
      () => {
        resolve({
          latitude: VILLAGE_CENTER_COORDINATES.latitude,
          longitude: VILLAGE_CENTER_COORDINATES.longitude
        });
      },
      { timeout: 5000 }
    );
  });
}