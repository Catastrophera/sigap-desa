'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Locate } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface MapPickerProps {
  coords: { latitude: number; longitude: number };
  setCoords: React.Dispatch<React.SetStateAction<{ latitude: number; longitude: number }>>;
}

// Inner Leaflet component dynamically loaded to prevent SSR errors
const LeafletMap = dynamic(
  async () => {
    const L = (await import('leaflet')).default;
    const { MapContainer, TileLayer, Marker, useMapEvents } = await import('react-leaflet');

    const pinIcon = L.divIcon({
      className: 'custom-pin',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;">
          <div style="position: absolute; width: 28px; height: 28px; background-color: rgba(220, 38, 38, 0.3); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 16px; height: 16px; background-color: #dc2626; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.4); position: relative; z-index: 10;"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    function LocationMarker({ coords, setCoords }: MapPickerProps) {
      const map = useMapEvents({
        click(e) {
          setCoords({
            latitude: e.latlng.lat,
            longitude: e.latlng.lng,
          });
        },
      });

      useEffect(() => {
        if (coords.latitude && coords.longitude) {
          map.flyTo([coords.latitude, coords.longitude], map.getZoom(), {
            duration: 0.5,
          });
        }
      }, [coords.latitude, coords.longitude, map]);

      return <Marker position={[coords.latitude, coords.longitude]} icon={pinIcon} />;
    }

    return function InnerMap({ coords, setCoords }: MapPickerProps) {
      return (
        <MapContainer
          center={[coords.latitude, coords.longitude]}
          zoom={15}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          {/* CartoDB Positron Monochrome Tile Layer as requested in Section 4A */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <LocationMarker coords={coords} setCoords={setCoords} />
        </MapContainer>
      );
    };
  },
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
        Memuat peta Leaflet...
      </div>
    ),
  }
);

export default function MapPicker({ coords, setCoords }: MapPickerProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung geolokasi');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setIsGettingLocation(false);
      },
      (err) => {
        console.warn('Geolocation failed:', err.message);
        alert('Gagal mengambil lokasi saat ini. Pastikan izin GPS aktif.');
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <MapPin className="w-4 h-4 text-crimson-600" />
          <span>Klik titik kerusakan pada peta atau gunakan GPS</span>
        </div>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isGettingLocation}
          className="inline-flex items-center gap-1 text-xs font-semibold text-crimson-600 hover:text-crimson-700 bg-crimson-50 hover:bg-crimson-100 px-2.5 py-1 rounded-md transition-colors border border-crimson-200"
        >
          <Locate className="w-3.5 h-3.5" />
          {isGettingLocation ? 'Mencari GPS...' : 'Lokasi Saya'}
        </button>
      </div>

      <div className="h-64 w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
        <LeafletMap coords={coords} setCoords={setCoords} />
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
        <span>Lat: {coords.latitude.toFixed(6)}</span>
        <span>Long: {coords.longitude.toFixed(6)}</span>
      </div>
    </div>
  );
}