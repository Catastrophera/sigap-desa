'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Aduan } from '@/lib/supabase';
import { KETINTANG_CENTER_COORDINATES } from '@/lib/geo-config';
import 'leaflet/dist/leaflet.css';

interface MapViewerProps {
  reports: Aduan[];
  selectedReportId?: string | null;
  heightClass?: string;
  onMarkerClick?: (report: Aduan) => void;
  isAdmin?: boolean;
  theme?: 'light' | 'dark';
}

const LeafletViewer = dynamic(
  async () => {
    const L = (await import('leaflet')).default;
    const { MapContainer, TileLayer, Marker, Popup, Circle, useMap } = await import('react-leaflet');

    // Refined High Priority pulsing dot
    const highPriorityIcon = L.divIcon({
      className: 'radar-pulse-marker',
      html: `
        <div class="radar-pulse-wave"></div>
        <div class="radar-pulse-core"></div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    // Refined Medium Priority dot (Warm Amber Orange)
    const mediumPriorityIcon = L.divIcon({
      className: 'standard-pin',
      html: `
        <div style="background-color: #EA580C; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>
      `,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

    // Refined Low Priority dot (Charcoal / Slate)
    const lowPriorityIcon = L.divIcon({
      className: 'standard-pin',
      html: `
        <div style="background-color: #64748b; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.25);"></div>
      `,
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });

    // Completed dot (Deep Terracotta Orange)
    const completedIcon = L.divIcon({
      className: 'standard-pin',
      html: `
        <div style="background-color: #C2410C; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>
      `,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

    // Ketintang Central Landmark Pin (Orange Glow)
    const landmarkIcon = L.divIcon({
      className: 'ketintang-pin',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
          <div style="position: absolute; width: 34px; height: 34px; background: rgba(234, 88, 12, 0.25); border-radius: 50%;"></div>
          <div style="width: 20px; height: 20px; background: #EA580C; border: 3px solid #FAF8F3; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">K</div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    function MapController({
      reports,
      selectedReportId,
    }: {
      reports: Aduan[];
      selectedReportId?: string | null;
    }) {
      const map = useMap();

      useEffect(() => {
        if (selectedReportId) {
          const target = reports.find((r) => r.id === selectedReportId || r.ticket_code === selectedReportId);
          if (target && target.latitude && target.longitude) {
            map.flyTo([target.latitude, target.longitude], 17, { duration: 0.8 });
          }
        }
      }, [selectedReportId, reports, map]);

      return null;
    }

    function FocusKetintangControl() {
      const map = useMap();

      return (
        <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'auto', margin: '12px' }}>
          <button
            type="button"
            onClick={() => {
              map.flyTo([KETINTANG_CENTER_COORDINATES.latitude, KETINTANG_CENTER_COORDINATES.longitude], 15, {
                duration: 0.7,
              });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-white text-[#191A1E] text-xs font-bold rounded-full shadow-md border border-[#E6E2D8] hover:border-orange-500 transition-all cursor-pointer backdrop-blur-xs"
            title="Pusatkan peta ke Ketintang Surabaya"
          >
            <span className="w-2 h-2 rounded-full bg-orange-600 animate-ping"></span>
            <span>Fokus Ketintang</span>
          </button>
        </div>
      );
    }

    return function InnerMapViewer({
      reports,
      selectedReportId,
      onMarkerClick,
      isAdmin,
      theme = 'light',
    }: MapViewerProps) {
      // Default center is strictly Ketintang Surabaya
      const centerLat = KETINTANG_CENTER_COORDINATES.latitude;
      const centerLng = KETINTANG_CENTER_COORDINATES.longitude;

      // OpenStreetMap standard tile provider (100% free, no watermark)
      const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      return (
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={15}
          minZoom={12}
          maxZoom={19}
          scrollWheelZoom={true}
          className={`h-full w-full ${theme === 'dark' ? 'bg-[#191A1E]' : 'bg-[#FAF8F3]'}`}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={tileUrl}
            className={theme === 'dark' ? 'leaflet-tile-dark' : ''}
          />

          <MapController reports={reports} selectedReportId={selectedReportId} />
          <FocusKetintangControl />

          {/* Ketintang Focus Perimeter Circle */}
          <Circle
            center={[centerLat, centerLng]}
            radius={950}
            pathOptions={{
              color: '#EA580C',
              fillColor: '#F97316',
              fillOpacity: 0.05,
              weight: 1.5,
              dashArray: '4, 6',
            }}
          />

          {/* Central Landmark Marker */}
          <Marker position={[centerLat, centerLng]} icon={landmarkIcon}>
            <Popup>
              <div className="p-2 text-slate-800 text-xs">
                <span className="font-bold block text-orange-800">Posko SIGAP - Ketintang</span>
                <span className="text-[11px] text-slate-500">Kelurahan Ketintang, Kec. Gayungan, Kota Surabaya</span>
              </div>
            </Popup>
          </Marker>

          {reports.map((report) => {
            let icon = mediumPriorityIcon;
            if (report.status === 'Selesai') {
              icon = completedIcon;
            } else if (report.prioritas === 'Tinggi') {
              icon = highPriorityIcon;
            } else if (report.prioritas === 'Rendah') {
              icon = lowPriorityIcon;
            }

            return (
              <Marker
                key={report.id}
                position={[report.latitude, report.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => onMarkerClick && onMarkerClick(report),
                }}
              >
                <Popup>
                  <div className="p-3.5 max-w-[260px] text-slate-800 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        #{report.ticket_code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          report.status === 'Selesai'
                            ? 'bg-orange-50 text-orange-900 border border-orange-200'
                            : report.status === 'Sedang Ditindak'
                            ? 'bg-amber-100 text-amber-950 border border-amber-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{report.kategori}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {report.deskripsi}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-medium text-orange-900">{report.dusun}</span>
                      <span
                        className={`font-semibold ${
                          report.prioritas === 'Tinggi'
                            ? 'text-red-600'
                            : report.prioritas === 'Sedang'
                            ? 'text-orange-700'
                            : 'text-slate-600'
                        }`}
                      >
                        Prioritas {report.prioritas}
                      </span>
                    </div>

                    <div className="pt-1">
                      <Link
                        href={isAdmin ? `/dashboard/aduan/${report.id}` : `/lacak/${report.ticket_code}`}
                        className="block text-center w-full py-1.5 text-[11px] font-bold text-white bg-[#EA580C] hover:bg-[#C2410C] rounded-lg transition-colors"
                      >
                        Lihat Progres Isu
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      );
    };
  },
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-[#FAF8F3] text-slate-400 text-xs font-medium">
        Memuat peta WebGIS Ketintang Surabaya…
      </div>
    ),
  }
);

export default function MapViewer({
  reports,
  selectedReportId,
  heightClass = 'h-[500px]',
  onMarkerClick,
  isAdmin = false,
  theme = 'light',
}: MapViewerProps) {
  return (
    <div
      className={`w-full ${heightClass} rounded-3xl overflow-hidden border ${
        theme === 'dark' ? 'border-[#2E3238] shadow-2xl' : 'border-[#E6E2D8] shadow-card-soft'
      } relative z-0`}
    >
      <LeafletViewer
        reports={reports}
        selectedReportId={selectedReportId}
        onMarkerClick={onMarkerClick}
        isAdmin={isAdmin}
        theme={theme}
      />
    </div>
  );
}
