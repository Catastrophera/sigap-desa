'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, CheckCircle2, Clock, ChevronRight, Share2, Filter, Sliders, MapPin, Sparkles } from 'lucide-react';
import { supabase, Aduan } from '@/lib/supabase';
import { getAllAduan } from '@/lib/aduan-service';
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
    getAllAduan().then((all) => {
      setReports((all || []).filter((r) => r.status === 'Selesai'));
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
      `*[SIGAP - Ketintang] Fasilitas Tuntas Diperbaiki*\n\n` +
      `✅ ${item.kategori} – ${item.dusun}\n` +
      `📝 ${item.catatan_admin || 'Perbaikan telah selesai terverifikasi'}\n` +
      `🔗 ${origin}/lacak/${item.ticket_code}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div id="main-content" className="w-full bg-transparent min-h-screen pb-24 pt-24 sm:pt-28">

      {/* ── Page Header ───────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#646973] hover:text-[#191A1E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E2D8] shadow-card-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[11px] font-bold text-orange-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Dokumentasi Fisik Terbuka</span>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#191A1E] tracking-tight">
              Histori Penyelesaian &amp; Bukti Fisik
            </h1>
            <p className="text-[13px] text-[#646973] leading-relaxed">
              Rekam jejak transparan seluruh fasilitas publik kawasan Ketintang Surabaya yang telah tuntas diperbaiki beserta komparator foto sebelum dan sesudah pengerjaan.
            </p>
          </div>

          {/* Metric pills */}
          <div className="flex items-center gap-3">
            <div className="bg-[#FAF8F3] border border-[#E6E2D8] rounded-2xl p-4 text-center min-w-[120px]">
              <p className="text-[10px] font-bold uppercase text-[#646973] tracking-wide">Total Tuntas</p>
              <p className="font-display text-2xl font-bold text-orange-800">{reports.length}</p>
              <p className="text-[11px] text-[#646973]">Fasilitas</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center min-w-[120px]">
              <p className="text-[10px] font-bold uppercase text-orange-800 tracking-wide">Terverifikasi</p>
              <p className="font-display text-2xl font-bold text-orange-800">100%</p>
              <p className="text-[11px] text-orange-700">Foto Fisik</p>
            </div>
          </div>
        </div>

        {/* ── Filters ──────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-[#E6E2D8] shadow-card-soft px-5 py-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterDusun}
              onChange={e => setFilterDusun(e.target.value)}
              className="px-4 py-2 rounded-full border border-[#E6E2D8] text-[12px] font-bold text-[#191A1E] bg-[#FAF8F3] focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Wilayah Ketintang</option>
              {LIST_DUSUN.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <select
              value={filterKat}
              onChange={e => setFilterKat(e.target.value)}
              className="px-4 py-2 rounded-full border border-[#E6E2D8] text-[12px] font-bold text-[#191A1E] bg-[#FAF8F3] focus:outline-none cursor-pointer"
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

          <span className="text-[12px] font-medium text-[#646973]">
            Menampilkan {filtered.length} dari {reports.length} penyelesaian
          </span>
        </div>

        {/* ── Cards Grid ───────────────────────────── */}
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-[3px] border-orange-600 border-t-transparent animate-spin" />
            <p className="text-[13px] font-bold text-[#646973]">Memuat histori penyelesaian…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 bg-white rounded-3xl border border-[#E6E2D8] shadow-card-soft text-center p-8 space-y-2">
            <p className="font-display font-bold text-base text-[#191A1E]">Belum ada data penyelesaian pada pilihan filter ini.</p>
            <Link href="/" className="inline-block text-[13px] font-bold text-orange-700 hover:underline cursor-pointer">
              Lihat Laporan Aktif Lainnya
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map(item => (
              <article key={item.id} className="tilt-card bg-white rounded-3xl border border-[#E6E2D8] shadow-card-soft overflow-hidden flex flex-col group">

                {/* Card Header */}
                <div className="px-6 py-4 flex items-start justify-between gap-3 border-b border-[#E6E2D8]">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-[#191A1E] bg-[#FAF8F3] border border-[#E6E2D8] px-2.5 py-0.5 rounded-full">
                      #{item.ticket_code}
                    </span>
                    <h3 className="font-display font-bold text-[16px] text-[#191A1E] mt-1.5">{item.kategori}</h3>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 bg-orange-50 border border-orange-200 text-orange-800 text-[11px] font-bold px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" /> Selesai
                    </span>
                    <p className="text-[11px] text-[#646973] mt-1">{new Date(item.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</p>
                  </div>
                </div>

                {/* Before-After or Photo */}
                <div className="p-6 bg-[#FAF8F3] space-y-4 flex-1">
                  {item.foto_url && item.foto_selesai_url ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#646973]">
                        <span>Geser untuk perbandingan sebelum &amp; sesudah:</span>
                        <span className="text-orange-800 flex items-center gap-1"><Sliders className="w-3 h-3" /> Interaktif</span>
                      </div>
                      <BeforeAfterSlider
                        beforeImage={item.foto_url}
                        afterImage={item.foto_selesai_url}
                        beforeLabel="Kondisi Rusak"
                        afterLabel="Hasil Perbaikan"
                      />
                    </div>
                  ) : item.foto_url ? (
                    <div className="h-56 rounded-2xl overflow-hidden border border-[#E6E2D8] relative">
                      <img src={item.foto_url} alt="Dokumentasi Lapangan" className="w-full h-full object-cover" />
                      <span className="absolute bottom-3 left-3 bg-[#191A1E] text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#2E3238] shadow-xs">
                        Dokumentasi Fisik
                      </span>
                    </div>
                  ) : null}

                  <div className="space-y-3 text-[13px]">
                    <p className="text-[#646973] leading-relaxed">{item.deskripsi}</p>
                    {item.catatan_admin && (
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl">
                        <p className="text-[11px] font-bold text-orange-900 mb-0.5">Catatan Tindakan Staf Desa:</p>
                        <p className="text-orange-950 leading-relaxed text-[13px]">{item.catatan_admin}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-3.5 border-t border-[#E6E2D8] bg-[#FAF8F3] flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#191A1E]">
                    <MapPin className="w-3.5 h-3.5 text-orange-700" /> {item.dusun}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleShare(item)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E6E2D8] bg-white text-[12px] font-bold text-[#191A1E] hover:border-orange-500 transition-all cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-orange-600" /> Bagikan
                    </button>
                    <Link
                      href={`/lacak/${item.ticket_code}`}
                      className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white text-[12px] font-bold transition-colors cursor-pointer"
                    >
                      <span>Linimasa</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
