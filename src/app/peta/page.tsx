'use client';

export const dynamic = 'force-dynamic';

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
  Sparkles,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { supabase, Aduan } from '@/lib/supabase';
import { LIST_DUSUN } from '@/lib/geo-config';
import nextDynamic from 'next/dynamic';

const MapViewer = nextDynamic(() => import('@/components/MapViewer'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full rounded-3xl bg-[#FAF8F3] border border-[#E6E2D8] flex items-center justify-center text-[#646973] text-xs font-bold">
      Memuat WebGIS Ketintang Surabaya…
    </div>
  ),
});

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
    <div id="main-content" className="w-full bg-transparent min-h-screen pb-24 pt-24 sm:pt-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">

        {/* ── Header & Metric Counters ─────────────────── */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#646973] hover:text-[#191A1E] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E2D8] shadow-card-soft flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[11px] font-bold text-orange-800">
                <MapPin className="w-3.5 h-3.5" />
                <span>Geospasial WebGIS Ketintang Surabaya</span>
              </div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#191A1E] tracking-tight">
                Peta Sebaran Fasilitas Ketintang Surabaya
              </h1>
              <p className="text-[13px] text-[#646973] leading-relaxed">
                Visualisasi spasial seluruh aduan kerusakan infrastruktur di kawasan Ketintang, Gayungan, Surabaya untuk efisiensi survei dan penanganan.
              </p>
            </div>

            {/* Metric Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-[#FAF8F3] border border-[#E6E2D8] p-3 rounded-2xl text-center">
                <span className="text-[#646973] text-[10px] uppercase font-bold block">Total Titik</span>
                <span className="font-display text-xl font-bold text-[#191A1E]">{total}</span>
              </div>
              <div className="bg-red-50 border border-red-200 p-3 rounded-2xl text-center">
                <span className="text-red-700 text-[10px] uppercase font-bold block">Prioritas Tinggi</span>
                <span className="font-display text-xl font-bold text-red-700">{urgent}</span>
              </div>
              <div className="bg-amber-100 border border-amber-300 p-3 rounded-2xl text-center">
                <span className="text-amber-950 text-[10px] uppercase font-bold block">Ditindak</span>
                <span className="font-display text-xl font-bold text-amber-950">{proses}</span>
              </div>
              <div className="bg-orange-50 border border-orange-200 p-3 rounded-2xl text-center">
                <span className="text-orange-800 text-[10px] uppercase font-bold block">Selesai</span>
                <span className="font-display text-xl font-bold text-orange-800">{selesai}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Filter Bar & Legend ──────────────────────── */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E6E2D8] flex flex-wrap items-center justify-between gap-3 shadow-card-soft">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterDusun}
              onChange={(e) => setFilterDusun(e.target.value)}
              className="bg-[#FAF8F3] border border-[#E6E2D8] rounded-full px-4 py-2 text-[#191A1E] text-[12px] font-bold focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Wilayah Ketintang</option>
              {LIST_DUSUN.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="bg-[#FAF8F3] border border-[#E6E2D8] rounded-full px-4 py-2 text-[#191A1E] text-[12px] font-bold focus:outline-none cursor-pointer"
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
              className="bg-[#FAF8F3] border border-[#E6E2D8] rounded-full px-4 py-2 text-[#191A1E] text-[12px] font-bold focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
              <option value="Sedang Ditindak">Sedang Ditindak</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[12px] font-semibold text-[#646973]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
              <span>Prioritas Tinggi</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Sedang Ditindak</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]"></span>
              <span>Selesai</span>
            </span>
          </div>
        </div>

        {/* ── Map & Side Drawer Split ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Map */}
          <div className="lg:col-span-8">
            <MapViewer
              reports={filteredReports}
              selectedReportId={selectedReportId}
              heightClass="h-[600px]"
              theme="light"
              onMarkerClick={(rep) => setSelectedReportId(rep.id)}
            />
          </div>

          {/* Side Drawer List */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E6E2D8] p-5 flex flex-col h-[600px] shadow-card-soft">
            <div className="border-b border-[#E6E2D8] pb-3 mb-3 flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-[#191A1E]">
                Daftar Titik ({filteredReports.length})
              </h3>
              <span className="text-[11px] text-[#646973] font-medium">Klik untuk zoom</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {filteredReports.length === 0 ? (
                <div className="text-center py-20 text-[#9E998E] text-xs font-bold">
                  Tidak ada titik yang memenuhi kriteria filter.
                </div>
              ) : (
                filteredReports.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedReportId(item.id)}
                    className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all ${
                      selectedReportId === item.id
                        ? 'border-[#EA580C] bg-[#FAF8F3] shadow-sm'
                        : 'border-[#E6E2D8] hover:border-orange-500 hover:bg-[#FAF8F3]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-mono font-bold text-[#191A1E] bg-white border border-[#E6E2D8] px-2 py-0.5 rounded-full text-[11px]">
                        #{item.ticket_code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'Selesai'
                            ? 'bg-orange-50 text-orange-900 border border-orange-200'
                            : item.status === 'Sedang Ditindak'
                            ? 'bg-amber-100 text-amber-950 border border-amber-300'
                            : 'bg-stone-100 text-stone-700 border border-stone-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-[#191A1E] text-[13px] line-clamp-1">{item.kategori}</h4>
                    <p className="text-[#646973] text-[12px] mt-1 line-clamp-2 leading-relaxed">
                      {item.deskripsi}
                    </p>

                    <div className="mt-3 pt-2 border-t border-[#E6E2D8] flex items-center justify-between text-[11px] text-[#646973]">
                      <span className="font-bold text-[#191A1E]">{item.dusun}</span>
                      <Link
                        href={`/lacak/${item.ticket_code}`}
                        className="text-orange-700 font-bold hover:underline inline-flex items-center gap-0.5"
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
