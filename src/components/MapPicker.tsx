'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Locate, RotateCcw, Navigation } from 'lucide-react';
import { KETINTANG_CENTER_COORDINATES, KETINTANG_LANDMARKS, reverseGeocodeKetintang } from '@/lib/geo-config';
import 'leaflet/dist/leaflet.css';

interface MapPickerProps {
  coords: { latitude: number; longitude: number };
  setCoords: React.Dispatch<React.SetStateAction<{ latitude: number; longitude: number }>>;
  geotagSource?: 'gps' | 'exif' | 'manual' | 'default';
  setGeotagSource?: (source: 'gps' | 'exif' | 'manual' | 'default') => void;
  address?: string;
  setAddress?: (addr: string) => void;
  onWilayahSuggest?: (wilayah: string) => void;
}

// Inner Leaflet component dynamically loaded to prevent SSR errors
const LeafletMap = dynamic(
  async () => {
    const L = (await import('leaflet')).default;
    const { MapContainer, TileLayer, Marker, Circle, useMapEvents } = await import('react-leaflet');

    const pinIcon = L.divIcon({
      className: 'custom-pin',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
          <div style="position: absolute; width: 34px; height: 34px; background-color: rgba(234, 88, 12, 0.4); border-radius: 50%; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 18px; height: 18px; background-color: #EA580C; border: 3px solid white; border-radius: 50%; box-shadow: 0 3px 10px rgba(0,0,0,0.35); position: relative; z-index: 10;"></div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    function LocationMarker({
      coords,
      setCoords,
      onUserClick,
    }: {
      coords: { latitude: number; longitude: number };
      setCoords: (c: { latitude: number; longitude: number }) => void;
      onUserClick: (lat: number, lng: number) => void;
    }) {
      const map = useMapEvents({
        click(e) {
          setCoords({
            latitude: e.latlng.lat,
            longitude: e.latlng.lng,
          });
          onUserClick(e.latlng.lat, e.latlng.lng);
        },
      });

      useEffect(() => {
        if (coords.latitude && coords.longitude) {
          map.flyTo([coords.latitude, coords.longitude], map.getZoom() < 15 ? 16 : map.getZoom(), {
            duration: 0.6,
          });
        }
      }, [coords.latitude, coords.longitude, map]);

      return <Marker position={[coords.latitude, coords.longitude]} icon={pinIcon} />;
    }

    return function InnerMap({
      coords,
      setCoords,
      onUserClick,
    }: {
      coords: { latitude: number; longitude: number };
      setCoords: (c: { latitude: number; longitude: number }) => void;
      onUserClick: (lat: number, lng: number) => void;
    }) {
      return (
        <MapContainer
          center={[coords.latitude || KETINTANG_CENTER_COORDINATES.latitude, coords.longitude || KETINTANG_CENTER_COORDINATES.longitude]}
          zoom={16}
          minZoom={13}
          maxZoom={19}
          scrollWheelZoom={false}
          className="h-full w-full bg-[#FAF8F3]"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Ketintang Focus Perimeter */}
          <Circle
            center={[KETINTANG_CENTER_COORDINATES.latitude, KETINTANG_CENTER_COORDINATES.longitude]}
            radius={950}
            pathOptions={{
              color: '#EA580C',
              fillColor: '#F97316',
              fillOpacity: 0.04,
              weight: 1.5,
              dashArray: '3, 6',
            }}
          />

          <LocationMarker coords={coords} setCoords={setCoords} onUserClick={onUserClick} />
        </MapContainer>
      );
    };
  },
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-[#FAF8F3] text-slate-400 text-xs">
        Memuat peta interaktif Ketintang Surabaya...
      </div>
    ),
  }
);

export default function MapPicker({
  coords,
  setCoords,
  geotagSource = 'default',
  setGeotagSource,
  address,
  setAddress,
  onWilayahSuggest,
}: MapPickerProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(address || 'Kelurahan Ketintang, Surabaya');

  // Reverse geocode whenever coords change
  const updateAddress = useCallback(async (lat: number, lng: number) => {
    try {
      const addr = await reverseGeocodeKetintang(lat, lng);
      setCurrentAddress(addr);
      if (setAddress) setAddress(addr);
    } catch {
      // ignore
    }
  }, [setAddress]);

  useEffect(() => {
    if (coords.latitude && coords.longitude) {
      updateAddress(coords.latitude, coords.longitude);
    }
  }, [coords.latitude, coords.longitude, updateAddress]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung geolokasi');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setCoords(newCoords);
        if (setGeotagSource) setGeotagSource('gps');
        setIsGettingLocation(false);
        updateAddress(newCoords.latitude, newCoords.longitude);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        alert('Gagal mengambil GPS otomatis. Memusatkan kembali ke kawasan Ketintang Surabaya.');
        setCoords({
          latitude: KETINTANG_CENTER_COORDINATES.latitude,
          longitude: KETINTANG_CENTER_COORDINATES.longitude,
        });
        if (setGeotagSource) setGeotagSource('default');
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleResetKetintang = () => {
    const ketintangCenter = {
      latitude: KETINTANG_CENTER_COORDINATES.latitude,
      longitude: KETINTANG_CENTER_COORDINATES.longitude,
    };
    setCoords(ketintangCenter);
    if (setGeotagSource) setGeotagSource('default');
    if (onWilayahSuggest) onWilayahSuggest('RW 01 - Ketintang Baru');
    updateAddress(ketintangCenter.latitude, ketintangCenter.longitude);
  };

  const handleSelectLandmark = (landmark: typeof KETINTANG_LANDMARKS[0]) => {
    setCoords({ latitude: landmark.lat, longitude: landmark.lng });
    if (setGeotagSource) setGeotagSource('manual');
    if (onWilayahSuggest && landmark.wilayah) onWilayahSuggest(landmark.wilayah);
    updateAddress(landmark.lat, landmark.lng);
  };

  const handleUserClickMap = (lat: number, lng: number) => {
    if (setGeotagSource) setGeotagSource('manual');
    updateAddress(lat, lng);
  };

  return (
    <div className="space-y-3">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#191A1E]">
          <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
          <span>Fokus Wilayah Ketintang, Surabaya</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-900 hover:text-orange-950 bg-orange-100 hover:bg-orange-200 px-3 py-1.5 rounded-full transition-colors border border-orange-300 cursor-pointer shadow-xs active:scale-95"
            title="Deteksi lokasi terkini dari sensor GPS perangkat"
          >
            <Locate className={`w-3.5 h-3.5 ${isGettingLocation ? 'animate-spin' : ''}`} />
            {isGettingLocation ? 'Mencari GPS…' : 'Auto Deteksi Lokasi'}
          </button>

          <button
            type="button"
            onClick={handleResetKetintang}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#474B53] hover:text-[#191A1E] bg-[#FAF8F3] hover:bg-white px-3 py-1.5 rounded-full transition-colors border border-[#E6E2D8] cursor-pointer"
            title="Kembalikan titik tengah ke Kelurahan Ketintang"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Pusatkan Ketintang</span>
          </button>
        </div>
      </div>

      {/* Quick Landmark Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-[#474B53] scrollbar-none">
        <span className="font-bold text-[#191A1E] shrink-0 text-[10px] uppercase tracking-wider">Spot Cepat:</span>
        {KETINTANG_LANDMARKS.slice(0, 4).map((lm) => (
          <button
            key={lm.name}
            type="button"
            onClick={() => handleSelectLandmark(lm)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-orange-50 text-[#191A1E] hover:text-orange-800 border border-[#E6E2D8] hover:border-orange-300 transition-all font-medium cursor-pointer shadow-2xs"
          >
            {lm.name.replace('Kawasan ', '').replace('Kantor ', '')}
          </button>
        ))}
      </div>

      {/* Map Box */}
      <div className="h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-[#E6E2D8] shadow-inner relative z-0">
        <LeafletMap
          coords={coords}
          setCoords={setCoords}
          onUserClick={handleUserClickMap}
        />

        {/* Source Badge Overlay on top of Map */}
        <div className="absolute top-2.5 left-2.5 z-400 pointer-events-none">
          <div className="px-3 py-1 rounded-full text-[11px] font-bold shadow-md backdrop-blur-md inline-flex items-center gap-1.5 border bg-white/95">
            {geotagSource === 'exif' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                <span className="text-orange-900">📸 Geotagging Otomatis dari Foto</span>
              </>
            ) : geotagSource === 'gps' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-orange-900">🛰️ Auto Deteksi GPS Perangkat</span>
              </>
            ) : geotagSource === 'manual' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-amber-900">📍 Titik Dipilih Manual di Peta</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-orange-600" />
                <span className="text-orange-900">🏢 Terpusat: Ketintang, Surabaya</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Coordinates & Resolved Address Bar */}
      <div className="bg-[#FAF8F3] px-3.5 py-2.5 rounded-xl border border-[#E6E2D8] space-y-1">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#646973]">
          <span className="font-semibold text-orange-800">Lat: {coords.latitude.toFixed(6)}</span>
          <span className="font-semibold text-orange-800">Long: {coords.longitude.toFixed(6)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#191A1E] font-medium pt-0.5 border-t border-[#E6E2D8]/60">
          <Navigation className="w-3.5 h-3.5 text-orange-700 shrink-0" />
          <span className="truncate">{currentAddress}</span>
        </div>
      </div>
    </div>
  );
}