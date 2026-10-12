'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, Search, MapPin, Camera, CheckCircle2, ChevronRight,
  ThumbsUp, Share2, Database, ArrowUpRight,
  Lightbulb, Droplets, Construction, Building2,
  Trash2, AlertTriangle, HelpCircle, Waves, Sparkles,
  ShieldCheck, ArrowRight, BarChart3, Users, Clock, Check
} from 'lucide-react';
import { supabase, Aduan } from '@/lib/supabase';
import { getAllAduan, subscribeToAduanUpdates } from '@/lib/aduan-service';
import { LIST_DUSUN, VILLAGE_CENTER_COORDINATES } from '@/lib/geo-config';
import { seedDemoData } from '@/lib/seed-data';
import { useToast } from '@/components/Toast';
import nextDynamic from 'next/dynamic';

const MapViewer = nextDynamic(() => import('@/components/MapViewer'), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full rounded-3xl bg-[#191A1E] border border-[#2E3238] flex items-center justify-center text-slate-400 text-xs font-bold">
      Memuat radar spasial…
    </div>
  ),
});

/* ── 8 AI Categories Config ────────────────────────────── */
const CATEGORIES = [
  { key: 'Jalan & Jembatan',            label: 'Jalan & Jembatan',      icon: Construction, color: 'bg-orange-50 text-orange-800' },
  { key: 'Penerangan Jalan',            label: 'Lampu Penerangan',       icon: Lightbulb,    color: 'bg-orange-50 text-orange-800' },
  { key: 'Drainase & Irigasi',          label: 'Drainase & Irigasi',     icon: Droplets,     color: 'bg-orange-50 text-orange-800' },
  { key: 'Air Bersih & Sanitasi',       label: 'Air Bersih & Sanitasi',  icon: Waves,        color: 'bg-orange-50 text-orange-800' },
  { key: 'Persampahan & Lingkungan',    label: 'Persampahan',            icon: Trash2,       color: 'bg-orange-50 text-orange-800' },
  { key: 'Gedung & Sarana Publik',      label: 'Sarana Publik',          icon: Building2,    color: 'bg-orange-50 text-orange-800' },
  { key: 'Bencana & Darurat',           label: 'Bencana & Darurat',      icon: AlertTriangle,color: 'bg-orange-50 text-orange-800' },
  { key: 'Masalah Lainnya',             label: 'Lainnya',                icon: HelpCircle,   color: 'bg-orange-50 text-orange-800' },
];

const STATUS_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  'Selesai':             { bg: 'bg-orange-50 text-orange-900', text: 'Selesai', border: 'border-orange-200' },
  'Sedang Ditindak':     { bg: 'bg-amber-100 text-amber-950', text: 'Sedang Ditindak', border: 'border-amber-300' },
  'Menunggu Verifikasi': { bg: 'bg-stone-100 text-stone-700', text: 'Menunggu Verifikasi', border: 'border-stone-200' },
  'Ditolak (Spam / Tidak Valid)': { bg: 'bg-red-50 text-red-700', text: 'Ditolak / False', border: 'border-red-200' },
};

const PRIORITY_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  'Tinggi': { bg: 'bg-red-50 text-red-700', text: 'Prioritas Tinggi', border: 'border-red-200' },
  'Sedang': { bg: 'bg-orange-50 text-orange-800', text: 'Prioritas Sedang', border: 'border-orange-200' },
  'Rendah': { bg: 'bg-stone-100 text-stone-600', text: 'Prioritas Rendah', border: 'border-stone-200' },
};

export default function HomePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [reports, setReports]           = useState<Aduan[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeCategory, setActiveCat]  = useState('Semua');
  const [activeStatus, setActiveStatus] = useState('Semua');
  const [selectedDusun, setDusun]       = useState('Semua');
  const [searchQuery, setSearch]        = useState('');
  const [sortBy, setSortBy]             = useState<'terbaru' | 'prioritas' | 'dukungan'>('terbaru');
  const [upvotes, setUpvotes]           = useState<Record<string, number>>({});
  const [voted, setVoted]               = useState<Record<string, boolean>>({});
  const [isSeeding, setSeeding]         = useState(false);
  const [trackInput, setTrackInput]     = useState('');

  /* Persist upvotes locally */
  useEffect(() => {
    try {
      const v = localStorage.getItem('sigap_voted');
      const u = localStorage.getItem('sigap_upvotes');
      if (v) setVoted(JSON.parse(v));
      if (u) setUpvotes(JSON.parse(u));
    } catch {}
  }, []);

  /* Fetch reports */
  const fetchReports = async () => {
    setLoading(true);
    const data = await getAllAduan();
    setReports(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
    const unsubscribe = subscribeToAduanUpdates(() => {
      getAllAduan().then((data) => setReports(data || []));
    });
    return () => unsubscribe();
  }, []);

  /* Guardrail 4: Optimistic UI Upvote (0ms instant response) */
  const handleUpvote = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Compute new state optimistically
    const currentlyVoted = !voted[id];
    const newVotedState = currentlyVoted;
    const currentCount = upvotes[id] || 0;
    const newCount = currentCount + (newVotedState ? 1 : -1);

    // 2. Instant memory update
    const updatedVoted = { ...voted, [id]: newVotedState };
    const updatedUpvotes = { ...upvotes, [id]: newCount };

    setVoted(updatedVoted);
    setUpvotes(updatedUpvotes);

    // 3. Save to localStorage
    try {
      localStorage.setItem('sigap_voted', JSON.stringify(updatedVoted));
      localStorage.setItem('sigap_upvotes', JSON.stringify(updatedUpvotes));
    } catch {}

    if (newVotedState) {
      showToast('Dukungan Anda telah tercatat.', 'success');
    }
  };

  /* WhatsApp Share */
  const handleShare = (item: Aduan, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const text = encodeURIComponent(
      `*[SIGAP - Ketintang] Laporan Fasilitas Publik*\n\n📌 *Kategori:* ${item.kategori}\n🏡 *Wilayah:* ${item.dusun}\n📝 *Keterangan:* ${item.deskripsi}\n🔍 *Pantau Progres:* ${origin}/lacak/${item.ticket_code}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  /* Demo Seed */
  const handleSeed = async () => {
    setSeeding(true);
    const r = await seedDemoData();
    if (r.success) { showToast(`${r.count} laporan demo berhasil dimuat.`, 'success'); fetchReports(); }
    else showToast(r.error || 'Gagal memuat data.', 'error');
    setSeeding(false);
  };

  /* Track Ticket */
  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackInput.trim()) return;
    router.push(`/lacak/${trackInput.trim().replace(/^#/, '')}`);
  };

  /* Filter & Sort */
  const filtered = useMemo(() => {
    const W: Record<string, number> = { Tinggi: 3, Sedang: 2, Rendah: 1 };
    return reports
      .filter(r =>
        (activeCategory === 'Semua' || r.kategori === activeCategory) &&
        (activeStatus   === 'Semua' || r.status   === activeStatus)   &&
        (selectedDusun  === 'Semua' || r.dusun    === selectedDusun)  &&
        (searchQuery === '' || [r.deskripsi, r.ticket_code, r.dusun, r.kategori]
          .join(' ').toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) =>
        sortBy === 'prioritas' ? (W[b.prioritas] || 0) - (W[a.prioritas] || 0)
          : sortBy === 'dukungan'  ? (upvotes[b.id] || 0) - (upvotes[a.id] || 0)
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [reports, activeCategory, activeStatus, selectedDusun, searchQuery, sortBy, upvotes]);

  const catCounts = useMemo(() => {
    const res: Record<string, number> = {};
    CATEGORIES.forEach(c => {
      res[c.key] = reports.filter(r => r.kategori === c.key).length;
    });
    return res;
  }, [reports]);

  const streetList = useMemo(() => {
    return Array.from(new Set(reports.map(r => r.dusun).filter(Boolean)));
  }, [reports]);

  // Overall Stats
  const totalReports = reports.length;
  const selesaiCount = reports.filter(r => r.status === 'Selesai').length;
  const prosesCount  = reports.filter(r => r.status === 'Sedang Ditindak').length;
  const completionRate = totalReports > 0 ? Math.round((selesaiCount / totalReports) * 100) : 100;

  return (
    <div id="main-content" className="w-full bg-transparent min-h-screen pb-24 pt-24 sm:pt-28">

      {/* ╔══════════════════════════════════════════════════════╗
          ║  HERO SECTION: Editorial Warm Aesthetic              ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-12 space-y-10" aria-label="Beranda SIGAP - Ketintang">

        {/* Top Tag & Big Editorial Headline */}
        <div className="space-y-5 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E6E2D8] shadow-xs text-[12px] font-semibold text-[#191A1E]">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span>Platform Layanan Publik &amp; Geotagging Fasilitas Ketintang Surabaya Berbasis AI</span>
          </div>

          <h1 className="font-display font-extrabold text-[34px] sm:text-[52px] lg:text-[60px] text-[#191A1E] leading-[1.08] tracking-tight">
            Penanganan Fasilitas Ketintang
            <br />
            <span className="text-[#EA580C]">Cepat, Tepat, &amp; Tuntas.</span>
          </h1>

          <p className="text-[15px] sm:text-[17px] text-[#646973] max-w-2xl mx-auto leading-relaxed">
            Laporkan jalan berlubang, lampu penerangan padam, saluran drainase, hingga masalah air bersih di kawasan Ketintang Surabaya. Sistem AI dan WebGIS memetakan penanganan secara presisi.
          </p>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/lapor"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white text-[14px] font-bold transition-all shadow-lg active:scale-98 group cursor-pointer"
            >
              <Camera className="w-4.5 h-4.5 text-orange-200" />
              <span>+ Buat Laporan Kerusakan</span>
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </Link>

            {/* Ticket Search Capsule */}
            <form onSubmit={handleTrack} className="w-full sm:w-auto flex items-center gap-1.5 p-1.5 rounded-full bg-white border border-[#E6E2D8] shadow-xs">
              <input
                type="text"
                placeholder="Cek nomor tiket, cth: SIGAP-1082"
                value={trackInput}
                onChange={e => setTrackInput(e.target.value)}
                aria-label="Nomor Tiket"
                className="px-4 py-2 text-[13px] text-[#191A1E] placeholder-[#9E998E] bg-transparent focus:outline-none w-full sm:w-60"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white text-[12px] font-bold transition-colors cursor-pointer"
              >
                Lacak
              </button>
            </form>
          </div>
        </div>

        {/* Hero Visual Banner (Forest & Ricefield Style) */}
        <div className="relative rounded-3xl sm:rounded-4xl overflow-hidden border border-[#E6E2D8] shadow-2xl bg-[#191A1E] min-h-[360px] sm:min-h-[460px] flex flex-col justify-between p-6 sm:p-10 group">
          {/* Background image with warm ambient gradient */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: "url('/village-hero.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/50" />

          {/* Top solid pill badges */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div className="bg-white px-4 py-2 rounded-full text-[12px] font-bold text-[#191A1E] shadow-md flex items-center gap-2 animate-soft-float border border-[#E6E2D8]">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span>Sistem AI Klasifikasi Instan Aktif</span>
            </div>

            <div className="bg-[#191A1E] border border-[#2E3238] px-4 py-2 rounded-full text-[12px] font-semibold text-white shadow-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
              <span>Wilayah Ketintang Surabaya Terpantau Real-time</span>
            </div>
          </div>

          {/* Bottom Solid Stats Bar inside hero */}
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-8">
            <div className="bg-white rounded-2xl p-4 text-center border border-[#E6E2D8] shadow-md">
              <div className="font-display font-extrabold text-2xl sm:text-3xl text-[#191A1E]">100%</div>
              <div className="text-[11px] font-semibold text-[#646973] uppercase tracking-wider mt-0.5">Transparansi Publik</div>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center border border-[#E6E2D8] shadow-md">
              <div className="font-display font-extrabold text-2xl sm:text-3xl text-[#EA580C]">8 Sektor</div>
              <div className="text-[11px] font-semibold text-[#646973] uppercase tracking-wider mt-0.5">Klasifikasi AI</div>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center border border-[#E6E2D8] shadow-md">
              <div className="font-display font-extrabold text-2xl sm:text-3xl text-[#191A1E]">{reports.length}+</div>
              <div className="text-[11px] font-semibold text-[#646973] uppercase tracking-wider mt-0.5">Total Laporan Warga</div>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center border border-[#E6E2D8] shadow-md">
              <div className="font-display font-extrabold text-2xl sm:text-3xl text-[#EA580C]">{completionRate}%</div>
              <div className="text-[11px] font-semibold text-[#646973] uppercase tracking-wider mt-0.5">Tingkat Penanganan</div>
            </div>
          </div>
        </div>

      </section>


      {/* ╔══════════════════════════════════════════════════════╗
          ║  DARK BENTO SECTION (Agroton Reference Layout)       ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10" aria-label="Analitik & Jalur Penanganan">
        <div className="dark-bento-glow rounded-3xl sm:rounded-4xl p-6 sm:p-10 text-white space-y-8">

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#2E3238] pb-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-950 border border-orange-800 text-[11px] font-bold text-orange-300">
                <BarChart3 className="w-3.5 h-3.5" />
                Alur Kerja &amp; Integritas Data
              </div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
                Dari Laporan Warga Menuju Realisasi Lapangan
              </h2>
              <p className="text-[13px] text-slate-300 leading-relaxed">
                Setiap aduan diverifikasi dan dipetakan secara spasial menggunakan WebGIS Leaflet dengan tile layer OpenStreetMap, memastikan penanganan objektif dan bebas subjektivitas.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/peta"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#24262B] hover:bg-[#343840] text-white text-[12px] font-bold transition-colors border border-[#343840]"
              >
                <span>Buka WebGIS Lengkap</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-orange-400" />
              </Link>
            </div>
          </div>

          {/* 2-Column Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left Col: Mini Spatial WebGIS Map */}
            <div className="lg:col-span-7 bg-[#222429] rounded-3xl p-5 border border-[#2E3238] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] font-bold text-slate-200">
                  <MapPin className="w-4 h-4 text-orange-400" />
                  <span>Sebaran Titik Kerusakan Aktif</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">WebGIS Ketintang</span>
              </div>

              {/* Mini Map */}
              <div className="h-64 sm:h-72 w-full rounded-2xl overflow-hidden">
                <MapViewer reports={reports} heightClass="h-full" theme="dark" />
              </div>

              {/* Lokasi / Jalan Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {streetList.slice(0, 6).map((d) => {
                  const cnt = reports.filter(r => r.dusun === d).length;
                  return (
                    <span key={d} className="px-2.5 py-1 rounded-full bg-[#191A1E] border border-[#2E3238] text-[11px] text-slate-300">
                      {d}: <strong className="text-white">{cnt}</strong>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Right Col: AI Pipeline & Rapid Action Team Card */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-6 bg-[#222429] rounded-3xl p-6 border border-[#2E3238]">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg text-white">Status Penanganan</h3>
                  <span className="text-[11px] text-orange-300 bg-orange-950 px-2.5 py-0.5 rounded-full border border-orange-800 font-mono">
                    Live APBDes
                  </span>
                </div>

                {/* Progress breakdown */}
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-slate-300">Selesai Dikerjakan</span>
                      <span className="font-bold text-orange-400">{selesaiCount} Tiket ({completionRate}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#191A1E] overflow-hidden">
                      <div className="h-full bg-[#EA580C] rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-slate-300">Sedang Ditindak Tim Lapangan</span>
                      <span className="font-bold text-orange-400">{prosesCount} Tiket</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#191A1E] overflow-hidden">
                      <div className="h-full bg-orange-600 rounded-full transition-all duration-500" style={{ width: `${(prosesCount / (totalReports || 1)) * 100}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-slate-300">Menunggu Verifikasi Musrenbang</span>
                      <span className="font-bold text-slate-300">{reports.filter(r => r.status === 'Menunggu Verifikasi').length} Tiket</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#191A1E] overflow-hidden">
                      <div className="h-full bg-slate-500 rounded-full transition-all duration-500" style={{ width: `${((totalReports - selesaiCount - prosesCount) / (totalReports || 1)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Staff Action Team Banner */}
              <div className="bg-[#FAF8F3] text-[#191A1E] rounded-2xl p-4.5 flex items-center justify-between gap-3 shadow-md">
                <div className="space-y-0.5">
                  <div className="text-[13px] font-bold">Posko Reaksi Cepat Ketintang</div>
                  <div className="text-[11px] text-slate-600">Verifikasi fisik lapangan &amp; penanganan aduan warga Ketintang</div>
                </div>
                <Link
                  href="/login"
                  className="px-3.5 py-2 rounded-full bg-[#EA580C] text-white text-[11px] font-bold hover:bg-[#C2410C] transition-colors shrink-0 flex items-center gap-1"
                >
                  <span>Portal Staf</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

            </div>

          </div>

        </div>
      </section>


      {/* ╔══════════════════════════════════════════════════════╗
          ║  8-CATEGORY BENTO CARDS GRID                        ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4" aria-label="Kategori Fasilitas">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-xl text-[#191A1E]">Kategori Fasilitas &amp; Infrastruktur</h2>
            <p className="text-[13px] text-[#646973]">Pilih sektor untuk menyaring laporan penanganan warga secara instan</p>
          </div>
          {activeCategory !== 'Semua' && (
            <button
              onClick={() => setActiveCat('Semua')}
              className="text-[12px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
            >
              Lihat Semua
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES.map(({ key, label, icon: Icon }) => {
            const active = activeCategory === key;
            const count  = catCounts[key] || 0;
            return (
              <button
                key={key}
                onClick={() => setActiveCat(active ? 'Semua' : key)}
                aria-pressed={active}
                className={`tilt-card text-left p-4 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer ${
                  active
                    ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-card-hover'
                    : 'bg-white border-[#E6E2D8] text-[#191A1E] hover:border-orange-500 hover:shadow-card-soft'
                }`}
              >
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center mb-3 ${
                  active ? 'bg-white/20 text-orange-200' : 'bg-orange-50 text-orange-800 border border-orange-200'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-display font-bold text-[13px] sm:text-[14px] leading-snug">{label}</div>
                <div className={`text-[11px] mt-1 font-medium ${active ? 'text-emerald-200' : 'text-[#646973]'}`}>
                  {count} laporan
                </div>
              </button>
            );
          })}
        </div>
      </section>


      {/* ╔══════════════════════════════════════════════════════╗
          ║  FEED LIST & CARDS                                  ║
          ╚══════════════════════════════════════════════════════╝ */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 space-y-6" aria-label="Daftar Pengaduan">

        {/* ── Toolbar: Title, Search, Seed, Sort ─────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-4 sm:p-5 border border-[#E6E2D8] shadow-card-soft">
          <div className="flex items-center gap-3">
            <h2 className="font-display font-bold text-xl text-[#191A1E]">Daftar Aduan Warga</h2>
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E6E2D8] bg-[#FAF8F3] hover:bg-[#EDEAE1] text-[12px] font-bold text-[#191A1E] transition-all cursor-pointer disabled:opacity-50"
              title="Isi data demo presentasi"
            >
              <Database className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isSeeding ? 'Memuat…' : 'Muat Demo Data'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-[#9E998E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari deskripsi, tiket, dusun…"
                value={searchQuery}
                onChange={e => setSearch(e.target.value)}
                aria-label="Cari laporan"
                className="pl-10 pr-4 py-2 rounded-full border border-[#E6E2D8] bg-[#FAF8F3] text-[13px] text-[#191A1E] placeholder-[#9E998E] focus:border-[#191A1E] focus:outline-none w-full sm:w-60"
              />
            </div>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              aria-label="Urutkan tampilan"
              className="px-3.5 py-2 rounded-full border border-[#E6E2D8] bg-[#FAF8F3] text-[12px] font-bold text-[#191A1E] focus:outline-none cursor-pointer"
            >
              <option value="terbaru">Terbaru</option>
              <option value="prioritas">Prioritas Tertinggi</option>
              <option value="dukungan">Dukungan Warga</option>
            </select>
          </div>
        </div>

        {/* ── Filter Pills Bar ────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {['Semua', ...CATEGORIES.map(c => c.key)].map(cat => {
              const active = activeCategory === cat;
              const label = cat === 'Semua' ? 'Semua Kategori' : CATEGORIES.find(c => c.key === cat)?.label || cat;
              const cnt   = cat === 'Semua' ? reports.length : catCounts[cat] || 0;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  aria-pressed={active}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#EA580C] text-white shadow-xs'
                      : 'bg-white border border-[#E6E2D8] text-[#474B53] hover:border-slate-400'
                  }`}
                >
                  {label} <span className={active ? 'text-orange-200' : 'text-[#9E998E]'}>({cnt})</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedDusun}
              onChange={e => setDusun(e.target.value)}
              aria-label="Filter Lokasi Jalan"
              className="px-3.5 py-1.5 rounded-full border border-[#E6E2D8] bg-white text-[12px] font-semibold text-[#191A1E] focus:outline-none cursor-pointer max-w-[200px] truncate"
            >
              <option value="Semua">Semua Lokasi / Jalan</option>
              {streetList.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <select
              value={activeStatus}
              onChange={e => setActiveStatus(e.target.value)}
              aria-label="Filter Status"
              className="px-3.5 py-1.5 rounded-full border border-[#E6E2D8] bg-white text-[12px] font-semibold text-[#191A1E] focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
              <option value="Sedang Ditindak">Sedang Ditindak</option>
              <option value="Selesai">Selesai</option>
              <option value="Ditolak (Spam / Tidak Valid)">Ditolak (Spam / False)</option>
            </select>
          </div>
        </div>

        {/* ── Cards Feed ─────────────────────────────────── */}
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-[3px] border-[#16A34A] border-t-transparent animate-spin" />
            <p className="text-[13px] font-bold text-[#646973]">Memuat laporan fasilitas Ketintang…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4 bg-white rounded-3xl border border-[#E6E2D8] shadow-card-soft p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FAF8F3] border border-[#E6E2D8] flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-[#191A1E]">Tidak Ada Laporan yang Cocok</h3>
              <p className="text-[13px] text-[#646973] max-w-sm">
                Cobalah mengubah kata kunci pencarian atau mengatur ulang filter kategori dan dusun.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setActiveCat('Semua'); setActiveStatus('Semua'); setDusun('Semua'); setSearch(''); }}
                className="px-4 py-2 rounded-full bg-[#FAF8F3] hover:bg-[#EDEAE1] text-[#191A1E] text-[12px] font-bold transition-colors cursor-pointer border border-[#E6E2D8]"
              >
                Reset Semua Filter
              </button>
              <Link
                href="/lapor"
                className="px-4 py-2 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white text-[12px] font-bold transition-colors cursor-pointer"
              >
                + Buat Laporan Baru
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(item => {
              const statusCfg = STATUS_BADGE[item.status] || STATUS_BADGE['Menunggu Verifikasi'];
              const priorityCfg = PRIORITY_BADGE[item.prioritas] || PRIORITY_BADGE['Rendah'];
              const currentVoted = !voted[item.id];
              const totalVotes = 1 + (upvotes[item.id] || 0);

              return (
                <article
                  key={item.id}
                  className="tilt-card bg-white rounded-3xl border border-[#E6E2D8] shadow-card-soft hover:shadow-card-hover transition-all flex flex-col overflow-hidden group"
                >
                  {/* Image banner */}
                  {item.foto_url ? (
                    <div className="h-52 bg-[#FAF8F3] overflow-hidden relative">
                      <img
                        src={item.foto_url}
                        alt={`Foto isu ${item.kategori}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 font-mono text-[11px] font-bold bg-[#191A1E] text-white px-2.5 py-1 rounded-full shadow-md border border-[#2E3238]">
                        #{item.ticket_code}
                      </span>
                      {item.status === 'Selesai' && (
                        <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-[#EA580C] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md border border-orange-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-orange-200" /> Selesai
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="px-5 py-3.5 flex items-center justify-between border-b border-[#E6E2D8] bg-[#FAF8F3]">
                      <span className="font-mono text-[12px] font-bold text-[#191A1E] bg-white border border-[#E6E2D8] px-2.5 py-0.5 rounded-full">
                        #{item.ticket_code}
                      </span>
                      <span className="text-[11px] text-[#646973] font-medium">
                        {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="p-5 flex flex-col flex-1 gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-bold text-[16px] text-[#191A1E] leading-snug">
                        {item.kategori}
                      </h3>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${priorityCfg.bg} ${priorityCfg.border}`}>
                        {item.prioritas}
                      </span>
                    </div>

                    <p className="text-[13px] text-[#646973] line-clamp-3 leading-relaxed flex-1">
                      {item.deskripsi}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-[#E6E2D8] text-[12px]">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-[#191A1E]">
                        <MapPin className="w-3.5 h-3.5 text-[#EA580C]" />
                        {item.dusun}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.border}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Footer Card Actions */}
                  <div className="px-5 py-3 bg-[#FAF8F3] border-t border-[#E6E2D8] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Guardrail 4: Optimistic Upvote Button */}
                      <button
                        onClick={e => handleUpvote(item.id, e)}
                        aria-label={`Dukung laporan ini (${totalVotes} dukungan)`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-bold transition-all cursor-pointer ${
                          currentVoted
                            ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-xs'
                            : 'bg-white text-[#191A1E] border-[#E6E2D8] hover:border-orange-500'
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${currentVoted ? 'text-orange-200' : 'text-slate-500'}`} />
                        <span>{totalVotes}</span>
                      </button>

                      {/* WhatsApp Share */}
                      <button
                        onClick={e => handleShare(item, e)}
                        aria-label="Bagikan via WhatsApp"
                        className="p-2 rounded-full border border-[#E6E2D8] bg-white text-[#646973] hover:text-[#EA580C] hover:border-orange-400 transition-colors cursor-pointer"
                        title="Bagikan ke WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <Link
                      href={`/lacak/${item.ticket_code}`}
                      className="inline-flex items-center gap-1 text-[12px] font-bold text-[#191A1E] hover:text-[#EA580C] transition-colors group cursor-pointer"
                    >
                      <span>Progres</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

    </div>
  );
}
