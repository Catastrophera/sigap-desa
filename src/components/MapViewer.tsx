'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Aduan } from '@/lib/supabase';
import { VILLAGE_CENTER_COORDINATES } from '@/lib/geo-config';
import 'leaflet/dist/leaflet.css';

interface MapViewerProps {
  reports: Aduan[];
  selectedReportId?: string | null;
  heightClass?: string;
  onMarkerClick?: (report: Aduan) => void;
  isAdmin?: boolean;
}

const LeafletViewer = dynamic(
  async () => {
    const L = (await import('leaflet')).default;
    const { MapContainer, TileLayer, Marker, Popup, useMap } = await import('react-leaflet');

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

    // Refined Medium Priority dot
    const mediumPriorityIcon = L.divIcon({
      className: 'standard-pin',
      html: `
        <div style="background-color: #d97706; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.25);"></div>
      `,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

    // Refined Low Priority dot
    const lowPriorityIcon = L.divIcon({
      className: 'standard-pin',
      html: `
        <div style="background-color: #64748b; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
      `,
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });

    // Completed dot (Sage Emerald)
    const completedIcon = L.divIcon({
      className: 'standard-pin',
      html: `
        <div style="background-color: #059669; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.25);"></div>
      `,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
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

    return function InnerMapViewer({
      reports,
      selectedReportId,
      onMarkerClick,
      isAdmin,
    }: MapViewerProps) {
      const centerLat = reports.length > 0 ? reports[0].latitude : VILLAGE_CENTER_COORDINATES.latitude;
      const centerLng = reports.length > 0 ? reports[0].longitude : VILLAGE_CENTER_COORDINATES.longitude;

      return (
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={14}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          {/* CartoDB Positron Monochrome Tile Layer */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          <MapController reports={reports} selectedReportId={selectedReportId} />

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
                      <span className="font-mono font-bold text-[11px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        #{report.ticket_code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          report.status === 'Selesai'
                            ? 'bg-emerald-50 text-emerald-700'
                            : report.status === 'Sedang Ditindak'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
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

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{report.dusun}</span>
                      <span
                        className={`font-semibold ${
                          report.prioritas === 'Tinggi'
                            ? 'text-brand-700'
                            : report.prioritas === 'Sedang'
                            ? 'text-amber-700'
                            : 'text-slate-600'
                        }`}
                      >
                        Prioritas {report.prioritas}
                      </span>
                    </div>

                    <div className="pt-1">
                      <Link
                        href={isAdmin ? `/dashboard/aduan/${report.id}` : `/lacak/${report.ticket_code}`}
                        className="block text-center w-full py-1.5 text-[11px] font-bold text-white bg-slate-900 hover:bg-brand-700 rounded-lg transition-colors"
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
      <div className="h-full w-full flex items-center justify-center bg-slate-50 text-slate-400 text-xs font-medium">
        Memuat peta WebGIS CartoDB Positron...
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
}: MapViewerProps) {
  return (
    <div className={`w-full ${heightClass} rounded-2xl overflow-hidden border border-slate-200/80 shadow-soft-sm relative z-0`}>
      <LeafletViewer
        reports={reports}
        selectedReportId={selectedReportId}
        onMarkerClick={onMarkerClick}
        isAdmin={isAdmin}
      />
    </div>
  );
}
