'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, Search, MapPin, Camera, CheckCircle2, ChevronRight,
  ThumbsUp, Share2, Database, ArrowUpDown,
  Lightbulb, Droplets, Construction, Building2,
  Trash2, AlertTriangle, HelpCircle, Waves
} from 'lucide-react';
import { supabase, Aduan } from '@/lib/supabase';
import { LIST_DUSUN } from '@/lib/geo-config';
import { seedDemoData } from '@/lib/seed-data';
import { useToast } from '@/components/Toast';

/* ── 8 Updated AI Categories Config ─────────────────────── */
const CATEGORIES = [
  { key: 'Jalan & Jembatan',            label: 'Jalan & Jembatan',      icon: Construction },
  { key: 'Penerangan Jalan',            label: 'Lampu Penerangan',       icon: Lightbulb },
  { key: 'Drainase & Irigasi',          label: 'Drainase & Irigasi',     icon: Droplets },
  { key: 'Air Bersih & Sanitasi',       label: 'Air Bersih & Sanitasi',  icon: Waves },
  { key: 'Persampahan & Lingkungan',    label: 'Persampahan',            icon: Trash2 },
  { key: 'Gedung & Sarana Publik',      label: 'Sarana Publik',          icon: Building2 },
  { key: 'Bencana & Darurat',           label: 'Bencana & Darurat',      icon: AlertTriangle },
  { key: 'Masalah Lainnya',             label: 'Lainnya',                icon: HelpCircle },
];

const STATUS_CHIP: Record<string, string> = {
  'Selesai':             'bg-green-50 text-green-800 border-green-200',
  'Sedang Ditindak':     'bg-sky-50 text-sky-800 border-sky-200',
  'Menunggu Verifikasi': 'bg-slate-100 text-slate-700 border-slate-200',
};

const PRIORITY_CHIP: Record<string, string> = {
  'Tinggi': 'bg-red-50 text-red-700 border border-red-200',
  'Sedang': 'bg-amber-50 text-amber-800 border border-amber-200',
  'Rendah': 'bg-slate-100 text-slate-600 border border-slate-200',
};

/* ── Component ────────────────────────────────────────── */
export default function FeedPage() {
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

  /* Persist upvotes */
  useEffect(() => {
    try {
      const v = localStorage.getItem('sigap_voted');
      const u = localStorage.getItem('sigap_upvotes');
      if (v) setVoted(JSON.parse(v));
      if (u) setUpvotes(JSON.parse(u));
    } catch {}
  }, []);

  /* Fetch */
  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('aduan').select('*').order('created_at', { ascending: false });
    if (!error) setReports(data || []);
    setLoading(false);
  };
  useEffect(() => { fetchReports(); }, []);

  /* Upvote */
  const handleUpvote = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setVoted(prev => {
      const now = !prev[id];
      const nv = { ...prev, [id]: now };
      const nu = { ...upvotes, [id]: (upvotes[id] || 0) + (now ? 1 : -1) };
      setUpvotes(nu);
      try {
        localStorage.setItem('sigap_voted', JSON.stringify(nv));
        localStorage.setItem('sigap_upvotes', JSON.stringify(nu));
      } catch {}
      if (now) showToast('Dukungan Anda telah tercatat.', 'success');
      return nv;
    });
  };

  /* Share */
  const handleShare = (item: Aduan, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const text = encodeURIComponent(
      `*[SIGAP Desa] Laporan Fasilitas*\n\n📌 ${item.kategori} – ${item.dusun}\n📝 ${item.deskripsi}\n🔗 ${origin}/lacak/${item.ticket_code}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  /* Seed */
  const handleSeed = async () => {
    setSeeding(true);
    const r = await seedDemoData();
    if (r.success) { showToast(`${r.count} laporan demo dimuat.`, 'success'); fetchReports(); }
    else showToast(r.error || 'Gagal memuat data.', 'error');
    setSeeding(false);
  };

  /* Track */
  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackInput.trim()) return;
    router.push(`/lacak/${trackInput.trim().replace(/^#/, '')}`);
  };

  /* Filter + sort */
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

  return (
    <div id="main-content" className="w-full bg-[#F8FAFC] min-h-screen pb-24">

      {/* ╔══════════════════════════════════════════════════════╗
          ║  HERO: Village BG + Glassmorphism Card              ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section
        className="relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/village-hero.jpg')" }}
        aria-label="Sambutan Portal SIGAP Desa"
      >
        {/* Dark overlay with slight warm tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/55 via-slate-900/40 to-slate-900/65" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-18">

          {/* Glass card */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-white/60 shadow-2xl p-6 sm:p-8 md:p-10 space-y-6">

            {/* Live indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-[12px] font-bold text-green-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-green-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
              </span>
              Layanan Pengaduan Fasilitas Warga Aktif
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-[28px] sm:text-[36px] lg:text-[42px] font-bold text-[#0F172A] leading-tight tracking-tight">
                Fasilitas Rusak di Lingkungan Anda?
                <br />
                <span className="text-[#0369A1]">Laporkan Mudah, Diprioritaskan Cepat.</span>
              </h1>
              <p className="text-[15px] text-slate-600 max-w-xl leading-relaxed">
                Foto jalan rusak, lampu padam, drainase tersumbat, atau air bersih bermasalah — sistem AI otomatis mengklasifikasikan 8 kategori penanganan untuk perangkat desa.
              </p>
            </div>

            {/* CTA Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/lapor"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0369A1] hover:bg-[#0284C7] text-white text-[14px] font-bold transition-all shadow-sm shadow-sky-700/20 cursor-pointer min-h-[48px] active:scale-[0.98]"
              >
                <Camera className="w-4.5 h-4.5" />
                + Buat Laporan Kerusakan
              </Link>

              {/* Track input */}
              <form onSubmit={handleTrack} className="flex items-center gap-2 flex-1 sm:max-w-[320px]">
                <input
                  type="text"
                  placeholder="Cek nomor tiket, cth: SIGAP-1082"
                  value={trackInput}
                  onChange={e => setTrackInput(e.target.value)}
                  aria-label="Nomor Tiket"
                  className="flex-1 px-3 py-3 rounded-xl bg-white border border-slate-300 text-[13px] text-slate-800 placeholder-slate-400 focus:border-[#0369A1] focus:outline-none min-h-[48px] shadow-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-3 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-bold min-h-[48px] cursor-pointer transition-colors"
                >
                  Cek
                </button>
              </form>
            </div>

            {/* 8 Category bento grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              {CATEGORIES.map(({ key, label, icon: Icon }) => {
                const active = activeCategory === key;
                const count  = catCounts[key] || 0;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCat(active ? 'Semua' : key)}
                    aria-pressed={active}
                    className={[
                      'text-left p-3 rounded-xl border transition-all cursor-pointer min-h-[44px]',
                      active
                        ? 'bg-[#0369A1] border-[#0369A1] text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-xs',
                    ].join(' ')}
                  >
                    <Icon className={['w-4 h-4 mb-1.5', active ? 'text-sky-200' : 'text-slate-400'].join(' ')} />
                    <div className={['text-[12px] font-bold leading-tight', active ? 'text-white' : 'text-slate-800'].join(' ')}>
                      {label}
                    </div>
                    <div className={['text-[11px] mt-0.5', active ? 'text-sky-200' : 'text-slate-400'].join(' ')}>
                      {count} laporan
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  FEED LIST                                          ║
          ╚══════════════════════════════════════════════════════╝ */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 space-y-6">

        {/* ── Toolbar ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-[20px] font-bold text-[#0F172A]">Daftar Laporan Warga</h2>
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-bold text-slate-600 transition-all cursor-pointer min-h-[36px] disabled:opacity-50"
              title="Isi data demo untuk demonstrasi"
            >
              <Database className="w-3.5 h-3.5 text-[#0369A1]" />
              {isSeeding ? 'Memuat…' : 'Demo Data'}
            </button>
          </div>

          {/* Search + Sort */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari laporan…"
                value={searchQuery}
                onChange={e => setSearch(e.target.value)}
                aria-label="Cari laporan"
                className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-[13px] text-slate-800 placeholder-slate-400 focus:border-[#0369A1] focus:outline-none min-h-[38px] w-52 shadow-sm"
              />
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              aria-label="Urutan tampilan"
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-[13px] font-bold text-slate-700 focus:outline-none min-h-[38px] cursor-pointer shadow-sm"
            >
              <option value="terbaru">Terbaru</option>
              <option value="prioritas">Prioritas</option>
              <option value="dukungan">Dukungan</option>
            </select>
          </div>
        </div>

        {/* ── Filters ──────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category pills */}
          {['Semua', ...CATEGORIES.map(c => c.key)].map(cat => {
            const label = cat === 'Semua' ? 'Semua Kategori' : CATEGORIES.find(c => c.key === cat)?.label || cat;
            const active = activeCategory === cat;
            const cnt    = cat === 'Semua' ? reports.length : catCounts[cat] || 0;
            return (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                aria-pressed={active}
                className={[
                  'px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer min-h-[36px]',
                  active
                    ? 'bg-[#0F172A] text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900',
                ].join(' ')}
              >
                {label} <span className={active ? 'text-slate-400' : 'text-slate-400'}>({cnt})</span>
              </button>
            );
          })}

          {/* Dusun + Status selectors */}
          <div className="flex items-center gap-2 ml-auto">
            <select value={selectedDusun} onChange={e => setDusun(e.target.value)} aria-label="Filter dusun"
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[12px] font-bold text-slate-700 focus:outline-none min-h-[36px] cursor-pointer"
            >
              <option value="Semua">Semua Dusun</option>
              {LIST_DUSUN.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={activeStatus} onChange={e => setActiveStatus(e.target.value)} aria-label="Filter status"
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[12px] font-bold text-slate-700 focus:outline-none min-h-[36px] cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
              <option value="Sedang Ditindak">Sedang Ditindak</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>
        </div>

        {/* ── Cards Grid ───────────────────────────── */}
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-[3px] border-[#0369A1] border-t-transparent animate-spin" />
            <p className="text-[13px] font-bold text-slate-500">Memuat laporan…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4 bg-white rounded-xl border border-slate-200 shadow-sm p-8">
            <p className="text-[15px] font-bold text-slate-700">Tidak ada laporan ditemukan.</p>
            <div className="flex gap-3">
              <Link href="/lapor" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0369A1] text-white text-[13px] font-bold cursor-pointer min-h-[42px]">
                <Plus className="w-4 h-4" /> Buat Laporan
              </Link>
              <button onClick={() => { setActiveCat('Semua'); setActiveStatus('Semua'); setDusun('Semua'); setSearch(''); }}
                className="text-[13px] font-bold text-slate-500 hover:text-slate-900 underline cursor-pointer min-h-[42px] px-3"
              >Reset Filter</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(item => (
              <article key={item.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex flex-col overflow-hidden group shadow-sm"
              >
                {/* Photo */}
                {item.foto_url ? (
                  <div className="h-48 bg-slate-100 overflow-hidden relative">
                    <img src={item.foto_url} alt={`Foto laporan ${item.kategori}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <span className="absolute top-2.5 left-2.5 font-mono text-[11px] font-bold bg-slate-900/85 text-white px-2 py-1 rounded-lg">
                      #{item.ticket_code}
                    </span>
                    {item.status === 'Selesai' && (
                      <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 bg-green-600 text-white text-[11px] font-bold px-2 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 bg-slate-50">
                    <span className="font-mono text-[12px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded-lg">#{item.ticket_code}</span>
                    <span className="text-[11px] text-slate-400">{new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}

                {/* Body */}
                <div className="p-4 flex flex-col flex-1 gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-[14px] text-[#0F172A] leading-snug">{item.kategori}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${PRIORITY_CHIP[item.prioritas] || PRIORITY_CHIP['Rendah']}`}>
                      {item.prioritas}
                    </span>
                  </div>
                  <p className="text-[13px] text-slate-600 line-clamp-3 leading-relaxed flex-1">{item.deskripsi}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="inline-flex items-center gap-1 text-[12px] font-bold text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-[#0369A1]" />
                      {item.dusun}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${STATUS_CHIP[item.status] || STATUS_CHIP['Menunggu Verifikasi']}`}>
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={e => handleUpvote(item.id, e)}
                      aria-label={`Dukung laporan, saat ini ${1 + (upvotes[item.id] || 0)} dukungan`}
                      className={[
                        'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[12px] font-bold transition-all cursor-pointer min-h-[34px]',
                        voted[item.id]
                          ? 'bg-[#0369A1] text-white border-[#0369A1]'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900',
                      ].join(' ')}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {1 + (upvotes[item.id] || 0)}
                    </button>
                    <button
                      onClick={e => handleShare(item, e)}
                      aria-label="Bagikan ke WhatsApp"
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-[#0369A1] hover:border-slate-300 transition-all cursor-pointer min-h-[34px]"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                  <Link
                    href={`/lacak/${item.ticket_code}`}
                    className="inline-flex items-center gap-1 text-[12px] font-bold text-[#0369A1] hover:text-[#0284C7] transition-colors cursor-pointer min-h-[34px]"
                  >
                    Detail Progres <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
