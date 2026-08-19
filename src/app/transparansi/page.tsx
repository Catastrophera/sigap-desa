'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  MapPin,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  ArrowLeft,
  ShieldCheck,
  TrendingUp,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { supabase, Aduan } from '@/lib/supabase';
import { LIST_DUSUN } from '@/lib/geo-config';
import MapViewer from '@/components/MapViewer';

export default function TransparencyMapPage() {
  const [reports, setReports] = useState<Aduan[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterDusun, setFilterDusun] = useState<string>('Semua');
  const [filterKategori, setFilterKategori] = useState<string>('Semua');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPublicReports() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('aduan')
          .select('*')
          .in('status', ['Sedang Ditindak', 'Selesai'])
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading transparency data:', error);
        } else {
          setReports(data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPublicReports();
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchDusun = filterDusun === 'Semua' || r.dusun === filterDusun;
      const matchKat = filterKategori === 'Semua' || r.kategori === filterKategori;
      const matchStatus = filterStatus === 'Semua' || r.status === filterStatus;
      return matchDusun && matchKat && matchStatus;
    });
  }, [reports, filterDusun, filterKategori, filterStatus]);

  const totalReports = reports.length;
  const completedReports = reports.filter((r) => r.status === 'Selesai').length;
  const inProgressReports = reports.filter((r) => r.status === 'Sedang Ditindak').length;
  const completionRate = totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 100;

  return (
    <div className="w-full bg-[#F8FAFC] min-h-screen pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Beranda
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-sky-600" />
              Peta Transparansi Fasilitas Desa
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Pantau sebaran titik penanganan fasilitas desa yang sedang dikerjakan dan telah selesai secara terbuka.
            </p>
          </div>

          {/* METRICS PILLS */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Selesai Dikerjakan</span>
              <span className="text-lg font-black text-emerald-600">{completedReports} Titik</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Sedang Ditindak</span>
              <span className="text-lg font-black text-amber-600">{inProgressReports} Titik</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Tingkat Penyelesaian</span>
              <span className="text-lg font-black text-sky-600">{completionRate}%</span>
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <Filter className="w-4 h-4 text-sky-600" />
            <span>Filter Peta:</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-500 font-medium">Dusun:</label>
            <select
              value={filterDusun}
              onChange={(e) => setFilterDusun(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none font-bold min-h-[36px]"
            >
              <option value="Semua">Semua Dusun</option>
              {LIST_DUSUN.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-500 font-medium">Kategori:</label>
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none font-bold min-h-[36px]"
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
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-500 font-medium">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none font-bold min-h-[36px]"
            >
              <option value="Semua">Semua Status</option>
              <option value="Sedang Ditindak">Sedang Ditindak</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>

          <div className="ml-auto text-slate-400 font-mono text-[11px] font-bold">
            Menampilkan {filteredReports.length} dari {totalReports} fasilitas
          </div>
        </div>

        {/* WEBGIS MAP & RECENT COMPLETED SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MAP CONTAINER (2 Cols) */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
            <MapViewer
              reports={filteredReports}
              selectedReportId={selectedReportId}
              heightClass="h-[560px]"
              onMarkerClick={(rep) => setSelectedReportId(rep.id)}
            />
          </div>

          {/* LIST / CARDS CONTAINER (1 Col) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col h-[560px]">
            <div className="border-b border-slate-100 pb-3 mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Daftar Proyek Penanganan Terbuka
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Klik salah satu untuk menyorot lokasi di peta.</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredReports.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-bold">
                  Tidak ada data yang sesuai filter.
                </div>
              ) : (
                filteredReports.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedReportId(item.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedReportId === item.id
                        ? 'border-sky-600 bg-sky-50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono font-black text-sky-700">#{item.ticket_code}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          item.status === 'Selesai'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 line-clamp-1">{item.kategori}</h4>
                    <p className="text-slate-600 mt-1 line-clamp-2 leading-relaxed font-normal">{item.deskripsi}</p>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-bold text-slate-700">{item.dusun}</span>
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
