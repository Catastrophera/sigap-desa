'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Map as MapIcon,
  Filter,
  Layers,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Search,
  MapPin,
  Flame,
  Sparkles,
} from 'lucide-react';
import { supabase, Aduan } from '@/lib/supabase';
import { LIST_DUSUN } from '@/lib/geo-config';
import MapViewer from '@/components/MapViewer';

export default function PetaPage() {
  const [reports, setReports] = useState<Aduan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDusun, setFilterDusun] = useState('Semua');
  const [filterKategori, setFilterKategori] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMapReports() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('aduan')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching map points:', error);
        } else {
          setReports(data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchMapReports();
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchDusun = filterDusun === 'Semua' || r.dusun === filterDusun;
      const matchKat = filterKategori === 'Semua' || r.kategori === filterKategori;
      const matchStatus = filterStatus === 'Semua' || r.status === filterStatus;
      return matchDusun && matchKat && matchStatus;
    });
  }, [reports, filterDusun, filterKategori, filterStatus]);

  const total = reports.length;
  const selesai = reports.filter((r) => r.status === 'Selesai').length;
  const proses = reports.filter((r) => r.status === 'Sedang Ditindak').length;
  const urgent = reports.filter((r) => r.prioritas === 'Tinggi' && r.status !== 'Selesai').length;

  return (
    <div className="w-full bg-[#F8FAFC] min-h-screen pb-24 selection:bg-sky-100 selection:text-sky-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* HEADER & METRIC COUNTERS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <MapIcon className="w-7 h-7 text-sky-600" />
              Peta Sebaran WebGIS Fasilitas Desa
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Pemetaan spasial persebaran titik kerusakan infrastruktur di seluruh wilayah dusun.
            </p>
          </div>

          {/* Metric Badges */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <div className="bg-white border border-slate-200 px-3.5 py-2 rounded-2xl text-slate-800 shadow-xs">
              <span className="text-slate-400 text-[10px] block">Total Titik</span>
              <span className="text-base font-black text-slate-900">{total}</span>
            </div>
            <div className="bg-red-50 border border-red-200 px-3.5 py-2 rounded-2xl text-red-800 shadow-xs">
              <span className="text-red-600 text-[10px] block">Urgent (ML)</span>
              <span className="text-base font-black text-red-700">{urgent}</span>
            </div>
            <div className="bg-sky-50 border border-sky-200 px-3.5 py-2 rounded-2xl text-sky-800 shadow-xs">
              <span className="text-sky-600 text-[10px] block">Sedang Ditindak</span>
              <span className="text-base font-black text-sky-700">{proses}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-2xl text-emerald-800 shadow-xs">
              <span className="text-emerald-600 text-[10px] block">Selesai</span>
              <span className="text-base font-black text-emerald-700">{selesai}</span>
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterDusun}
              onChange={(e) => setFilterDusun(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none min-h-[42px] cursor-pointer"
            >
              <option value="Semua">Semua Dusun</option>
              {LIST_DUSUN.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none min-h-[42px] cursor-pointer"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="Jalan & Jembatan">Jalan & Jembatan</option>
              <option value="Penerangan Jalan">Penerangan Jalan</option>
              <option value="Drainase & Irigasi">Drainase & Irigasi</option>
              <option value="Air Bersih & Sanitasi">Air Bersih & Sanitasi</option>
              <option value="Persampahan & Lingkungan">Persampahan & Lingkungan</option>
              <option value="Gedung & Sarana Publik">Gedung & Sarana Publik</option>
              <option value="Bencana & Darurat">Bencana & Darurat</option>
              <option value="Masalah Lainnya">Masalah Lainnya</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none min-h-[42px] cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
              <option value="Sedang Ditindak">Sedang Ditindak</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-600"></span>
              <span>Prioritas Tinggi</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span>Sedang</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
              <span>Selesai</span>
            </span>
          </div>
        </div>

        {/* MAP & LIST SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* MAP CONTAINER (8 Cols) */}
          <div className="lg:col-span-8 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <MapViewer
              reports={filteredReports}
              selectedReportId={selectedReportId}
              heightClass="h-[580px]"
              onMarkerClick={(rep) => setSelectedReportId(rep.id)}
            />
          </div>

          {/* LIST CONTAINER (4 Cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 flex flex-col h-[580px] shadow-sm">
            <div className="border-b border-slate-100 pb-3 mb-2 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">
                Daftar Titik ({filteredReports.length})
              </h3>
              <span className="text-xs text-slate-400 font-medium">Klik untuk zoom lokasi</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredReports.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-xs font-bold">
                  Tidak ada titik yang memenuhi filter.
                </div>
              ) : (
                filteredReports.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedReportId(item.id)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedReportId === item.id
                        ? 'border-sky-500 bg-sky-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-mono font-extrabold text-sky-700 text-xs">
                        #{item.ticket_code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          item.status === 'Selesai'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : item.status === 'Sedang Ditindak'
                            ? 'bg-sky-50 text-sky-800 border border-sky-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{item.kategori}</h4>
                    <p className="text-slate-600 text-xs mt-1 line-clamp-2 leading-relaxed font-normal">
                      {item.deskripsi}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-bold text-slate-800">{item.dusun}</span>
                      <Link
                        href={`/lacak/${item.ticket_code}`}
                        className="text-sky-600 font-bold hover:underline inline-flex items-center gap-0.5"
                      >
                        Detail <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
