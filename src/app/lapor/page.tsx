'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Camera, Send, Sparkles, CheckCircle2, Loader2, Info, MapPin, User, Phone, ArrowRight, ShieldCheck, Copy, Check } from 'lucide-react';
import { supabase, LIST_KATEGORI, KategoriAduan } from '@/lib/supabase';
import { LIST_DUSUN, VILLAGE_CENTER_COORDINATES } from '@/lib/geo-config';
import { classifyReport } from '@/lib/classifier';
import { convertToWebP } from '@/lib/image-compress';
import { useToast } from '@/components/Toast';
import nextDynamic from 'next/dynamic';

const MapPicker = nextDynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full rounded-2xl bg-[#FAF8F3] border border-[#E6E2D8] flex items-center justify-center text-[#646973] text-xs font-bold">
      Memuat peta interaktif…
    </div>
  ),
});

export default function LaporPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [nama, setNama]             = useState('');
  const [kontak, setKontak]         = useState('');
  const [dusun, setDusun]           = useState(LIST_DUSUN[0]);
  const [deskripsi, setDeskripsi]   = useState('');
  const [kategori, setKategori]     = useState<KategoriAduan>('Jalan & Jembatan');
  const [prioritas, setPrioritas]   = useState<'Tinggi' | 'Sedang' | 'Rendah'>('Sedang');
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [aiReason, setAiReason]     = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [file, setFile]             = useState<File | null>(null);
  const [preview, setPreview]       = useState<string | null>(null);
  const [coords, setCoords]         = useState({ latitude: VILLAGE_CENTER_COORDINATES.latitude, longitude: VILLAGE_CENTER_COORDINATES.longitude });
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket]         = useState<string | null>(null);
  const [copied, setCopied]         = useState(false);

  // 1. Instant local typing feedback (Layer 1 - 0ms)
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setDeskripsi(text);

    if (text.trim().length >= 4) {
      const localPred = classifyReport(text);
      setKategori(localPred.kategori);
      setPrioritas(localPred.prioritas);
      setAiConfidence(localPred.confidenceKategori || 85);
      setAiReason('Model AI Cepat (TF-IDF)');
    } else {
      setAiConfidence(null);
      setAiReason(null);
    }
  };

  // 2. Guardrail 3: Debounced AI classification with AbortController to cancel obsolete requests
  useEffect(() => {
    if (deskripsi.trim().length < 8) return;

    const controller = new AbortController();
    setIsAnalyzing(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: deskripsi,
            fallbackKategori: kategori,
            fallbackPrioritas: prioritas,
          }),
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.kategori) setKategori(data.kategori);
          if (data.prioritas) setPrioritas(data.prioritas);
          if (data.confidence) setAiConfidence(data.confidence);
          if (data.alasan) setAiReason(data.alasan);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Request was aborted due to new user typing, ignore silently
          return;
        }
        console.warn('API Classify fallback to local:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort(); // Cancel previous in-flight request
    };
  }, [deskripsi]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deskripsi.trim()) {
      showToast('Mohon ceritakan kondisi kerusakan fasilitas.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      let fotoUrl: string | null = null;
      if (file) {
        try {
          const webp = await convertToWebP(file);
          const path = `aduan/${Date.now()}_${Math.random().toString(36).slice(2)}.webp`;
          const { error: up } = await supabase.storage.from('aduan-images').upload(path, webp, { contentType: 'image/webp' });
          if (!up) {
            const { data } = supabase.storage.from('aduan-images').getPublicUrl(path);
            fotoUrl = data.publicUrl;
          }
        } catch (err) {
          console.warn('Upload warning:', err);
        }
      }

      const code = `SIGAP-${Math.floor(1000 + Math.random() * 9000)}`;
      const { error } = await supabase.from('aduan').insert([{
        ticket_code: code,
        nama_pelapor: nama.trim() || 'Warga Desa',
        kontak_pelapor: kontak.trim() || null,
        deskripsi: deskripsi.trim(),
        foto_url: fotoUrl,
        dusun,
        latitude: coords.latitude,
        longitude: coords.longitude,
        kategori,
        prioritas,
        status: 'Menunggu Verifikasi',
      }]);

      if (error) throw error;
      setTicket(code);
      showToast('Laporan berhasil dikirim ke perangkat desa!', 'success');
    } catch (err: any) {
      showToast('Gagal mengirim: ' + (err.message || 'Terjadi kesalahan sistem'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const copyTicket = () => {
    if (ticket) {
      navigator.clipboard.writeText(ticket);
      setCopied(true);
      showToast('Nomor tiket berhasil disalin.', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /* ── Step Header Helper ── */
  const StepHeader = ({ n, title, subtitle }: { n: number; title: string; subtitle?: string }) => (
    <div className="flex items-start gap-3.5 border-b border-[#E6E2D8] pb-4 mb-5">
      <div className="w-8 h-8 rounded-full bg-[#1B4332] text-emerald-300 text-[13px] font-bold flex items-center justify-center shrink-0 shadow-xs">
        {n}
      </div>
      <div>
        <h2 className="font-display font-bold text-[16px] text-[#191A1E] leading-snug">{title}</h2>
        {subtitle && <p className="text-[12px] text-[#646973] mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div id="main-content" className="w-full bg-[#FAF8F3] min-h-screen pb-24 pt-24 sm:pt-28">

      {/* ── Top Header ──────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-8 space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#646973] hover:text-[#191A1E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E2D8] shadow-card-soft space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Formulir Pelaporan Warga Berbasis AI</span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#191A1E] tracking-tight">
            Laporkan Kerusakan Fasilitas Desa
          </h1>
          <p className="text-[14px] text-[#646973] leading-relaxed">
            Sampaikan laporan kerusakan jalan, lampu padam, air, atau drainase. Sistem Machine Learning akan secara otomatis merekomendasikan sektor penanganan dan tingkat urgensi.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {ticket ? (
          /* ── SUCCESS STATE ────────────────────────── */
          <div className="bg-white rounded-3xl sm:rounded-4xl border border-[#E6E2D8] shadow-card-soft p-8 sm:p-12 text-center space-y-6 max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display font-bold text-2xl text-[#191A1E]">Laporan Berhasil Terkirim!</h2>
              <p className="text-[13px] text-[#646973] leading-relaxed">
                Pengaduan Anda telah tercatat pada Command Center perangkat desa dan siap diverifikasi. Simpan nomor tiket berikut untuk memantau progres:
              </p>
              
              <div className="pt-3">
                <div className="inline-flex items-center justify-between gap-3 bg-[#FAF8F3] border border-[#E6E2D8] rounded-2xl px-5 py-3 shadow-inner max-w-xs mx-auto w-full">
                  <span className="font-mono font-extrabold text-xl text-[#191A1E]">#{ticket}</span>
                  <button
                    onClick={copyTicket}
                    className="p-1.5 rounded-xl hover:bg-white text-slate-600 transition-colors border border-transparent hover:border-[#E6E2D8] cursor-pointer"
                    title="Salin Nomor Tiket"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-[#E6E2D8]">
              <button
                onClick={() => router.push(`/lacak/${ticket}`)}
                className="w-full py-3.5 bg-[#1B4332] hover:bg-[#143628] text-[#FAF8F3] rounded-full font-bold text-[14px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>Pantau Progres Penanganan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                href="/"
                className="block text-[13px] font-bold text-[#646973] hover:text-[#191A1E] py-2 transition-colors cursor-pointer"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        ) : (
          /* ── FORM ─────────────────────────────────── */
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Step 1 – Foto */}
            <div className="bg-white rounded-3xl border border-[#E6E2D8] shadow-card-soft p-6 sm:p-7">
              <StepHeader n={1} title="Foto Kondisi Lapangan" subtitle="Opsional, namun sangat disarankan untuk membantu penilaian fisik oleh staf teknis desa." />
              <div className="border-2 border-dashed border-[#E6E2D8] hover:border-emerald-500 rounded-2xl p-6 text-center transition-colors bg-[#FAF8F3]">
                {preview ? (
                  <div className="space-y-3">
                    <img src={preview} alt="Pratinjau foto laporan" className="h-56 w-full object-cover rounded-2xl border border-[#E6E2D8]" />
                    <button
                      type="button"
                      onClick={() => { setFile(null); setPreview(null); }}
                      className="text-[12px] font-bold text-red-600 hover:underline cursor-pointer"
                    >
                      Hapus / Ambil Ulang Foto
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-3 py-5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-bold text-[14px] text-[#191A1E]">Pilih foto atau ambil dari kamera HP</p>
                      <p className="text-[12px] text-[#646973]">Otomatis dikompresi WebP (Max 1MB &amp; 1920px)</p>
                    </div>
                    <input type="file" accept="image/*" className="sr-only" onChange={handleFile} />
                  </label>
                )}
              </div>
            </div>

            {/* Step 2 – Deskripsi & AI Classifier */}
            <div className="bg-white rounded-3xl border border-[#E6E2D8] shadow-card-soft p-6 sm:p-7 space-y-4">
              <StepHeader n={2} title="Ceritakan Kerusakan Fasilitas *" subtitle="Tuliskan secara jelas titik lokasi, jenis masalah, dan dampak yang ditimbulkan." />

              <div className="space-y-3.5">
                <textarea
                  rows={4}
                  required
                  value={deskripsi}
                  onChange={handleDescriptionChange}
                  placeholder="Contoh: Jalan aspal di dekat jembatan Dusun Krajan ambles sedalam 20cm dan membahayakan pengendara motor di malam hari..."
                  className="w-full rounded-2xl border border-[#E6E2D8] p-4 text-[14px] text-[#191A1E] bg-[#FAF8F3] focus:bg-white focus:border-[#191A1E] focus:outline-none leading-relaxed resize-none transition-colors"
                />

                {/* AI Detection Card */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2 text-[12px]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isAnalyzing ? (
                        <Loader2 className="w-4 h-4 text-emerald-700 animate-spin shrink-0" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                      )}
                      <span className="text-[#191A1E] font-medium">
                        {isAnalyzing ? (
                          <span className="text-emerald-800 font-bold">AI sedang mengevaluasi deskripsi…</span>
                        ) : (
                          <>
                            Sektor Terdeteksi: <strong className="text-[#191A1E] font-bold">{kategori}</strong>
                          </>
                        )}
                        {aiConfidence && !isAnalyzing && (
                          <span className="ml-2 text-[11px] font-bold text-emerald-900 bg-emerald-200 px-2 py-0.5 rounded-full">
                            {aiConfidence}% Akurat
                          </span>
                        )}
                      </span>
                    </div>

                    {!isAnalyzing && (
                      <span className={`font-bold px-3 py-1 rounded-full border inline-flex items-center gap-1.5 self-start sm:self-auto text-[11px] ${
                        prioritas === 'Tinggi' ? 'bg-red-50 text-red-700 border-red-200'
                        : prioritas === 'Sedang' ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-stone-100 text-stone-700 border-stone-200'
                      }`}>
                        Urgensi: {prioritas}
                      </span>
                    )}
                  </div>

                  {aiReason && !isAnalyzing && (
                    <div className="text-[11px] text-[#646973] border-t border-emerald-200/80 pt-2 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>{aiReason}</span>
                    </div>
                  )}
                </div>

                {/* Category Manual Selector */}
                <div className="pt-1">
                  <label className="block text-[12px] font-bold text-[#646973] mb-1.5">
                    Kategori Terpilih (Hasil AI / Boleh disesuaikan manual):
                  </label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value as KategoriAduan)}
                    className="w-full px-4 py-3 rounded-xl border border-[#E6E2D8] text-[13px] font-bold text-[#191A1E] bg-[#FAF8F3] focus:bg-white focus:outline-none focus:border-[#191A1E] cursor-pointer"
                  >
                    {LIST_KATEGORI.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3 – Dusun & Map */}
            <div className="bg-white rounded-3xl border border-[#E6E2D8] shadow-card-soft p-6 sm:p-7">
              <StepHeader n={3} title="Wilayah &amp; Titik Lokasi *" subtitle="Pilih dusun dan tentukan koordinat pada peta." />
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-[#191A1E] mb-1.5">Wilayah Dusun:</label>
                  <select
                    value={dusun}
                    onChange={e => setDusun(e.target.value)}
                    className="w-full rounded-xl border border-[#E6E2D8] px-4 py-3 text-[14px] text-[#191A1E] bg-[#FAF8F3] focus:bg-white focus:outline-none focus:border-[#191A1E] cursor-pointer"
                  >
                    {LIST_DUSUN.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <MapPicker coords={coords} setCoords={setCoords} />
                </div>
              </div>
            </div>

            {/* Step 4 – Identitas Pelapor */}
            <div className="bg-white rounded-3xl border border-[#E6E2D8] shadow-card-soft p-6 sm:p-7">
              <StepHeader n={4} title="Identitas Pelapor (Opsional)" subtitle="Boleh dikosongkan jika Anda ingin melapor secara anonim." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-[#191A1E] mb-1.5">Nama Pelapor:</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#9E998E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={nama}
                      onChange={e => setNama(e.target.value)}
                      placeholder="Pak Budi / Warga Dusun"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E6E2D8] text-[13px] text-[#191A1E] bg-[#FAF8F3] focus:bg-white focus:outline-none focus:border-[#191A1E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#191A1E] mb-1.5">No. WhatsApp (Untuk info progres):</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#9E998E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={kontak}
                      onChange={e => setKontak(e.target.value)}
                      placeholder="08123456789"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E6E2D8] text-[13px] text-[#191A1E] bg-[#FAF8F3] focus:bg-white focus:outline-none focus:border-[#191A1E]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-[#1B4332] hover:bg-[#143628] disabled:opacity-50 text-[#FAF8F3] font-bold text-[15px] rounded-full transition-all shadow-xl flex items-center justify-center gap-3 cursor-pointer active:scale-98"
            >
              <Send className="w-5 h-5 text-emerald-300" />
              <span>{submitting ? 'Sedang Mengirim Laporan…' : 'Kirim Laporan ke Perangkat Desa'}</span>
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center ml-1">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
