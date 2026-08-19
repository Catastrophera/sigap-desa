'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Camera, Send, Sparkles, CheckCircle2, Loader2, Info } from 'lucide-react';
import { supabase, LIST_KATEGORI, KategoriAduan } from '@/lib/supabase';
import { LIST_DUSUN, VILLAGE_CENTER_COORDINATES } from '@/lib/geo-config';
import { classifyReport } from '@/lib/classifier';
import { convertToWebP } from '@/lib/image-compress';
import { useToast } from '@/components/Toast';
import MapPicker from '@/components/MapPicker';

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

  // 1. Instant local typing feedback (Layer 1 - 0ms)
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setDeskripsi(text);

    if (text.trim().length >= 4) {
      const localPred = classifyReport(text);
      setKategori(localPred.kategori);
      setPrioritas(localPred.prioritas);
      setAiConfidence(localPred.confidenceKategori || 85);
      setAiReason('Model AI Lokal (TF-IDF)');
    } else {
      setAiConfidence(null);
      setAiReason(null);
    }
  };

  // 2. Debounced deep AI evaluation via /api/classify (Layer 2 - LLM with local fallback)
  useEffect(() => {
    if (deskripsi.trim().length < 8) return;

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
        });

        if (res.ok) {
          const data = await res.json();
          if (data.kategori) setKategori(data.kategori);
          if (data.prioritas) setPrioritas(data.prioritas);
          if (data.confidence) setAiConfidence(data.confidence);
          if (data.alasan) setAiReason(data.alasan);
        }
      } catch (err) {
        console.warn('API Classify error, using local classification:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 550);

    return () => clearTimeout(timer);
  }, [deskripsi]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deskripsi.trim()) { showToast('Mohon ceritakan kondisi kerusakannya.', 'error'); return; }
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
        } catch {}
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
      showToast('Gagal mengirim: ' + (err.message || 'Terjadi kesalahan'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Step label helper ── */
  const Step = ({ n, label, sub }: { n: number; label: string; sub?: string }) => (
    <div className="flex items-start gap-3 border-b border-slate-100 pb-4 mb-5">
      <div className="w-7 h-7 rounded-full bg-[#0369A1] text-white text-[13px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</div>
      <div>
        <h2 className="text-[15px] font-bold text-[#0F172A]">{label}</h2>
        {sub && <p className="text-[12px] text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );

  return (
    <div id="main-content" className="w-full bg-[#F8FAFC] min-h-screen pb-24">

      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0369A1] flex items-center justify-center shadow-sm">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0F172A]">Formulir Pengaduan Fasilitas Desa</h1>
              <p className="text-[13px] text-slate-500">Isi form di bawah ini untuk melaporkan kerusakan fasilitas ke perangkat desa.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">

        {ticket ? (
          /* ── Success ──────────────────────────── */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 text-center space-y-6 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9 text-green-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-[22px] font-bold text-[#0F172A]">Laporan Berhasil Diterima!</h2>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Laporan Anda telah masuk ke antrean prioritas tim teknis desa. Pantau perkembangan menggunakan nomor tiket di bawah ini.
              </p>
              <div className="mt-4">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide mb-1">Nomor Tiket Laporan:</p>
                <div className="font-mono text-[24px] font-bold text-[#0369A1] bg-blue-50 py-3 rounded-xl border border-blue-200">
                  #{ticket}
                </div>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <button onClick={() => router.push(`/lacak/${ticket}`)}
                className="w-full py-3 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl font-bold text-[14px] transition-colors cursor-pointer min-h-[46px]"
              >
                Pantau Progres Penanganan →
              </button>
              <Link href="/" className="block text-[13px] font-bold text-slate-400 hover:text-slate-700 py-2 transition-colors cursor-pointer">
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        ) : (
          /* ── Form ─────────────────────────────── */
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Step 1 – Foto */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <Step n={1} label="Foto Bukti Kerusakan" sub="Opsional, namun sangat membantu petugas menilai kondisi lapangan." />
              <div className="border-2 border-dashed border-slate-300 hover:border-[#0369A1] rounded-xl p-6 text-center transition-colors bg-slate-50">
                {preview ? (
                  <div className="space-y-3">
                    <img src={preview} alt="Pratinjau foto" className="h-52 w-full object-cover rounded-xl border border-slate-200" />
                    <button type="button" onClick={() => { setFile(null); setPreview(null); }}
                      className="text-[12px] font-bold text-red-600 hover:underline cursor-pointer"
                    >Hapus / Ambil Ulang Foto</button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2.5 py-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-[#0369A1]" />
                    </div>
                    <div>
                      <p className="font-bold text-[14px] text-slate-800">Tekan di sini untuk memilih foto</p>
                      <p className="text-[12px] text-slate-500 mt-0.5">JPG, PNG, atau langsung dari kamera HP</p>
                    </div>
                    <input type="file" accept="image/*" className="sr-only" onChange={handleFile} />
                  </label>
                )}
              </div>
            </div>

            {/* Step 2 – Deskripsi + Hybrid Dual-Layer AI */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <Step n={2} label="Ceritakan Kondisi Kerusakan *" />

              <div className="space-y-3">
                <textarea
                  rows={4}
                  required
                  value={deskripsi}
                  onChange={handleDescriptionChange}
                  placeholder="Contoh: Jalan aspal di dekat jembatan Dusun Krajan ambles 20cm dan sudah mengakibatkan 2 warga jatuh saat malam hari..."
                  className="w-full rounded-xl border border-slate-300 p-3.5 text-[14px] text-slate-800 bg-white focus:border-[#0369A1] focus:outline-none leading-relaxed resize-none shadow-2xs"
                />

                {/* Hybrid Dual-Layer AI Detection Badge */}
                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 space-y-2 text-[12px]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isAnalyzing ? (
                        <Loader2 className="w-4 h-4 text-[#0369A1] animate-spin shrink-0" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-[#0369A1] shrink-0" />
                      )}
                      <span className="text-slate-700 font-medium">
                        {isAnalyzing ? (
                          <span className="text-[#0369A1] font-bold">AI sedang menganalisis narasi laporan...</span>
                        ) : (
                          <>
                            Deteksi AI: <strong className="text-[#0F172A]">{kategori}</strong>
                          </>
                        )}
                        {aiConfidence && !isAnalyzing && (
                          <span className="ml-2 text-[11px] font-bold text-[#0369A1] bg-blue-100 px-2 py-0.5 rounded-full">
                            {aiConfidence}% Akurat
                          </span>
                        )}
                      </span>
                    </div>

                    {!isAnalyzing && (
                      <span className={`font-bold px-2.5 py-1 rounded-lg border inline-flex items-center gap-1.5 self-start sm:self-auto ${
                        prioritas === 'Tinggi' ? 'bg-red-50 text-red-700 border-red-200'
                        : prioritas === 'Sedang' ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        Urgensi: Prioritas {prioritas}
                      </span>
                    )}
                  </div>

                  {aiReason && !isAnalyzing && (
                    <div className="text-[11px] text-slate-500 border-t border-blue-100 pt-1.5 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                      <span>{aiReason}</span>
                    </div>
                  )}
                </div>

                {/* Manual Override Option */}
                <div className="pt-1">
                  <label className="block text-[12px] font-bold text-slate-600 mb-1">
                    Kategori Terpilih (Otomatis AI / Boleh Diganti Manual):
                  </label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value as KategoriAduan)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-[13px] font-bold text-slate-800 bg-white focus:outline-none focus:border-[#0369A1] min-h-[42px] cursor-pointer"
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

            {/* Step 3 – Lokasi */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <Step n={3} label="Pilih Dusun & Titik Lokasi *" />
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Wilayah Dusun:</label>
                  <select value={dusun} onChange={e => setDusun(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-3 text-[14px] text-slate-800 bg-white focus:outline-none focus:border-[#0369A1] min-h-[46px] cursor-pointer"
                  >
                    {LIST_DUSUN.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Pin Titik Kerusakan di Peta:</label>
                  <div className="rounded-xl overflow-hidden border border-slate-200">
                    <MapPicker coords={coords} setCoords={setCoords} />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 – Identitas */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <Step n={4} label="Identitas Pelapor" sub="Opsional — boleh dikosongkan untuk laporan anonim." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Nama Lengkap:</label>
                  <input type="text" value={nama} onChange={e => setNama(e.target.value)}
                    placeholder="Pak Budi / Warga Dusun"
                    className="w-full px-3 py-3 rounded-xl border border-slate-300 text-[14px] text-slate-800 focus:outline-none focus:border-[#0369A1] min-h-[46px]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">No. WhatsApp (opsional):</label>
                  <input type="text" value={kontak} onChange={e => setKontak(e.target.value)}
                    placeholder="08123456789"
                    className="w-full px-3 py-3 rounded-xl border border-slate-300 text-[14px] text-slate-800 focus:outline-none focus:border-[#0369A1] min-h-[46px]"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={submitting}
              className="w-full py-4 bg-[#0369A1] hover:bg-[#0284C7] disabled:opacity-50 text-white font-bold text-[15px] rounded-xl transition-all shadow-sm shadow-sky-700/20 flex items-center justify-center gap-2.5 cursor-pointer min-h-[54px] active:scale-[0.99]"
            >
              <Send className="w-5 h-5" />
              {submitting ? 'Sedang Mengirim Laporan…' : 'Kirim Laporan Sekarang'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
