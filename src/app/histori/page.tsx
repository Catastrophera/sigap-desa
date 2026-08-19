'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, CheckCircle2, Clock, ChevronRight, Share2, Filter, Sliders, MapPin } from 'lucide-react';
import { supabase, Aduan } from '@/lib/supabase';
import { LIST_DUSUN } from '@/lib/geo-config';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import { useToast } from '@/components/Toast';

export default function HistoriPage() {
  const { showToast } = useToast();
  const [reports, setReports]         = useState<Aduan[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filterDusun, setFilterDusun] = useState('Semua');
  const [filterKat, setFilterKat]     = useState('Semua');

  useEffect(() => {
    supabase.from('aduan').select('*').eq('status', 'Selesai')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setReports(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => reports.filter(r =>
    (filterDusun === 'Semua' || r.dusun === filterDusun) &&
    (filterKat   === 'Semua' || r.kategori === filterKat)
  ), [reports, filterDusun, filterKat]);

  const handleShare = (item: Aduan) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const text = encodeURIComponent(
      `*[SIGAP Desa] Fasilitas Tuntas Diperbaiki*\n\n` +
      `✅ ${item.kategori} – ${item.dusun}\n` +
      `📝 ${item.catatan_admin || 'Perbaikan telah selesai terverifikasi'}\n` +
      `🔗 ${origin}/lacak/${item.ticket_code}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div id="main-content" className="w-full bg-[#F8FAFC] min-h-screen pb-24">

      {/* ── Page Header ───────────────────────────── */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-[11px] font-bold text-green-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Dokumentasi Terbuka
              </div>
              <h1 className="text-[26px] sm:text-[32px] font-bold text-[#0F172A] leading-tight">
                Histori Penyelesaian & Bukti Fisik Perbaikan
              </h1>
              <p className="text-[13px] sm:text-[15px] text-slate-500 leading-relaxed">
                Rekam jejak transparan seluruh fasilitas publik desa yang telah tuntas diperbaiki beserta dokumentasi foto sebelum dan sesudah pengerjaan.
              </p>
            </div>
            {/* Metric pills */}
            <div className="flex items-center gap-3">
              <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 text-center min-w-[110px]">
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wide">Total Tuntas</p>
                <p className="text-[28px] font-bold text-green-700">{reports.length}</p>
                <p className="text-[11px] text-slate-400">Fasilitas</p>
              </div>
              <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 text-center min-w-[110px]">
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wide">Terverifikasi</p>
                <p className="text-[28px] font-bold text-[#0369A1]">100%</p>
                <p className="text-[11px] text-slate-400">Foto Bukti</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-6">

        {/* ── Filters ──────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select value={filterDusun} onChange={e => setFilterDusun(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-[13px] font-bold text-slate-700 bg-white focus:outline-none focus:border-[#0369A1] min-h-[38px] cursor-pointer"
          >
            <option value="Semua">Semua Dusun</option>
            {LIST_DUSUN.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filterKat} onChange={e => setFilterKat(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-[13px] font-bold text-slate-700 bg-white focus:outline-none focus:border-[#0369A1] min-h-[38px] cursor-pointer"
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
          <span className="ml-auto text-[12px] font-bold text-slate-500">
            Menampilkan {filtered.length} dari {reports.length} penyelesaian
          </span>
        </div>

        {/* ── Cards ────────────────────────────────── */}
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-[3px] border-[#0369A1] border-t-transparent animate-spin" />
            <p className="text-[13px] font-bold text-slate-500">Memuat histori…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 bg-white rounded-xl border border-slate-200 shadow-sm text-center p-8">
            <p className="text-[15px] font-bold text-slate-700">Belum ada data penyelesaian pada pilihan ini.</p>
            <Link href="/" className="mt-3 inline-block text-[13px] font-bold text-[#0369A1] hover:underline cursor-pointer">
              Lihat Laporan Aktif
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map(item => (
              <article key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">

                {/* Card Header */}
                <div className="px-5 py-4 flex items-start justify-between gap-3 border-b border-slate-100">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">#{item.ticket_code}</span>
                    <h3 className="text-[15px] font-bold text-[#0F172A] mt-1">{item.kategori}</h3>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Selesai
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">{new Date(item.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</p>
                  </div>
                </div>

                {/* Before-After or Photo */}
                <div className="p-5 bg-slate-50/50 space-y-3 flex-1">
                  {item.foto_url && item.foto_selesai_url ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                        <span>Geser untuk perbandingan sebelum & sesudah:</span>
                        <span className="text-[#0369A1] flex items-center gap-1"><Sliders className="w-3 h-3" /> Interaktif</span>
                      </div>
                      <BeforeAfterSlider beforeImage={item.foto_url} afterImage={item.foto_selesai_url}
                        beforeLabel="Kondisi Rusak" afterLabel="Hasil Perbaikan" />
                    </div>
                  ) : item.foto_url ? (
                    <div className="h-52 rounded-xl overflow-hidden border border-slate-200 relative">
                      <img src={item.foto_url} alt="Dokumentasi" className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded">Dokumentasi Lapangan</span>
                    </div>
                  ) : null}

                  <div className="space-y-2.5 text-[13px]">
                    <p className="text-slate-600 leading-relaxed">{item.deskripsi}</p>
                    {item.catatan_admin && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                        <p className="text-[11px] font-bold text-green-700 mb-0.5">Catatan Tindakan Petugas:</p>
                        <p className="text-green-900 leading-relaxed text-[13px]">{item.catatan_admin}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[12px] font-bold text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-[#0369A1]" /> {item.dusun}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleShare(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-600 hover:text-[#0369A1] hover:border-slate-300 transition-all cursor-pointer min-h-[34px]"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Bagikan
                    </button>
                    <Link href={`/lacak/${item.ticket_code}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-[12px] font-bold transition-colors cursor-pointer min-h-[34px]"
                    >
                      Linimasa <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
