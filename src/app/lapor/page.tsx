'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Camera, Send, Sparkles, CheckCircle2, Loader2,
  Info, MapPin, User, Phone, ArrowRight, ShieldCheck, Copy,
  Check, Navigation, Crosshair
} from 'lucide-react';
import { supabase, LIST_KATEGORI, KategoriAduan } from '@/lib/supabase';
import { submitNewAduan } from '@/lib/aduan-service';
import {
  KETINTANG_CENTER_COORDINATES,
  extractGeotagFromPhoto,
  findClosestKetintangLandmark,
  getInitialCoordinates,
  reverseGeocodeKetintang
} from '@/lib/geo-config';
import { classifyReport } from '@/lib/classifier';
import { convertToWebP } from '@/lib/image-compress';
import { useToast } from '@/components/Toast';
import nextDynamic from 'next/dynamic';

const MapPicker = nextDynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full rounded-2xl bg-[#FAF8F3] border border-[#E6E2D8] flex items-center justify-center text-[#646973] text-xs font-bold">
      Memuat peta interaktif Ketintang Surabaya…
    </div>
  ),
});

export default function LaporPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [nama, setNama]                 = useState('');
  const [kontak, setKontak]             = useState('');
  const [deskripsi, setDeskripsi]       = useState('');
  const [kategori, setKategori]         = useState<KategoriAduan>('Jalan & Jembatan');
  const [prioritas, setPrioritas]       = useState<'Tinggi' | 'Sedang' | 'Rendah'>('Sedang');
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [aiReason, setAiReason]         = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing]   = useState(false);
  const [file, setFile]                 = useState<File | null>(null);
  const [preview, setPreview]           = useState<string | null>(null);
  const [isExtractingGeotag, setIsExtractingGeotag] = useState(false);
  const [geotagStatus, setGeotagStatus] = useState<string | null>(null);
  const [geotagSource, setGeotagSource] = useState<'gps' | 'exif' | 'manual' | 'default'>('default');
  const [resolvedAddress, setResolvedAddress] = useState('Jl. Ketintang Baru');
  const [coords, setCoords]             = useState({
    latitude: KETINTANG_CENTER_COORDINATES.latitude,
    longitude: KETINTANG_CENTER_COORDINATES.longitude,
  });
  const [submitting, setSubmitting]     = useState(false);
  const [ticket, setTicket]             = useState<string | null>(null);
  const [copied, setCopied]             = useState(false);

  // 1. Auto Deteksi Lokasi saat halaman pertama kali dibuka
  useEffect(() => {
    let isMounted = true;
    getInitialCoordinates().then(async (res) => {
      if (!isMounted) return;
      if (res.isAccurateDeviceGps) {
        setCoords({ latitude: res.latitude, longitude: res.longitude });
        setGeotagSource('gps');
        const addr = await reverseGeocodeKetintang(res.latitude, res.longitude);
        if (isMounted) {
          setResolvedAddress(addr);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Instant local typing feedback (Layer 1 - 0ms)
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

  // 3. Debounced AI classification
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
        if (err.name === 'AbortError') return;
        console.warn('API Classify fallback to local:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [deskripsi]);

  // 4. Handle File + Geotagging EXIF Extraction
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setIsExtractingGeotag(true);
    setGeotagStatus('Membaca metadata EXIF foto untuk geotagging…');

    try {
      const gps = await extractGeotagFromPhoto(selectedFile);
      if (gps && gps.latitude && gps.longitude) {
        setCoords({ latitude: gps.latitude, longitude: gps.longitude });
        setGeotagSource('exif');
        setGeotagStatus('Geotagging Berhasil: Koordinat GPS otomatis terdeteksi dari foto!');
        showToast('📍 Geotagging Berhasil: Titik lokasi otomatis diekstrak dari foto!', 'success');

        const addr = await reverseGeocodeKetintang(gps.latitude, gps.longitude);
        setResolvedAddress(addr);
      } else {
        setGeotagStatus('Foto tidak menyertakan koordinat GPS (umum bila dikirim via WhatsApp). Lokasi peta tetap aktif.');
      }
    } catch (err) {
      console.warn('Geotag scan error:', err);
      setGeotagStatus('Tidak dapat membaca metadata geotag dari foto.');
    } finally {
      setIsExtractingGeotag(false);
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
      await submitNewAduan({
        ticket_code: code,
        nama_pelapor: nama.trim() || 'Warga Ketintang',
        kontak_pelapor: kontak.trim() || null,
        deskripsi: deskripsi.trim(),
        foto_url: fotoUrl || preview,
        dusun: resolvedAddress.trim() || 'Jl. Ketintang',
        latitude: coords.latitude,
        longitude: coords.longitude,
        kategori,
        prioritas,
        status: 'Menunggu Verifikasi',
      });

      setTicket(code);
      showToast('Laporan berhasil dikirim ke posko penanganan Ketintang!', 'success');
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

  const StepHeader = ({ n, title, subtitle }: { n: number; title: string; subtitle?: string }) => (
    <div className="flex items-start gap-3.5 border-b border-[#E6E2D8] pb-4 mb-5">
      <div className="w-8 h-8 rounded-full bg-[#EA580C] text-orange-100 text-[13px] font-bold flex items-center justify-center shrink-0 shadow-xs">
        {n}
      </div>
      <div>
        <h2 className="font-display font-bold text-[16px] text-[#191A1E] leading-snug">{title}</h2>
        {subtitle && <p className="text-[12px] text-[#646973] mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div id="main-content" className="w-full bg-transparent min-h-screen pb-24 pt-24 sm:pt-28">

      {/* ── Top Header ──────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-8 space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#646973] hover:text-[#191A1E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E2D8] shadow-card-soft space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[11px] font-bold text-orange-800">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SIGAP - Ketintang · Geotagging &amp; AI Klasifikasi (Tanpa API Key)</span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#191A1E] tracking-tight">
            Laporkan Kerusakan Fasilitas Ketintang
          </h1>
          <p className="text-[14px] text-[#646973] leading-relaxed">
            Laporkan jalan berlubang, lampu padam, drainase tersumbat, atau pohon rawan di wilayah Ketintang, Gayungan, Surabaya. Lokasi dapat terdeteksi otomatis melalui Geotagging foto dan GPS perangkat.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {ticket ? (
          /* ── SUCCESS STATE ────────────────────────── */
          <div className="bg-white rounded-3xl sm:rounded-4xl border border-[#E6E2D8] shadow-card-soft p-8 sm:p-12 text-center space-y-6 max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto text-orange-600 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display font-bold text-2xl text-[#191A1E]">Laporan Berhasil Terkirim!</h2>
              <p className="text-[13px] text-[#646973] leading-relaxed">
                Pengaduan fasilitas di lokasi {resolvedAddress} telah tercatat pada Command Center SIGAP - Ketintang dan siap diverifikasi.
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
                className="w-full py-3.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-full font-bold text-[14px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
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

            {/* Step 1 – Foto & Geotagging EXIF */}
            <div className="bg-white rounded-3xl border border-[#E6E2D8] shadow-card-soft p-6 sm:p-7">
              <StepHeader
                n={1}
                title="Foto Kondisi Lapangan & Geotagging"
                subtitle="Foto kamera HP akan diekstrak koordinat GPS-nya (Geotagging) untuk memposisikan peta secara otomatis."
              />
              <div className="border-2 border-dashed border-[#E6E2D8] hover:border-orange-500 rounded-2xl p-6 text-center transition-colors bg-[#FAF8F3]">
                {preview ? (
                  <div className="space-y-3">
                    <img src={preview} alt="Pratinjau foto laporan" className="h-56 w-full object-cover rounded-2xl border border-[#E6E2D8]" />

                    {/* Geotag Status Bar */}
                    <div className="flex items-center justify-between text-xs px-3.5 py-2.5 rounded-xl bg-white border border-[#E6E2D8]">
                      <div className="flex items-center gap-2 text-left">
                        {isExtractingGeotag ? (
                          <Loader2 className="w-4 h-4 text-orange-600 animate-spin shrink-0" />
                        ) : geotagSource === 'exif' ? (
                          <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
                        ) : (
                          <Info className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="text-[12px] text-[#191A1E] font-medium leading-tight">
                          {geotagStatus || 'Foto siap diproses'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => { setFile(null); setPreview(null); setGeotagStatus(null); }}
                        className="text-[12px] font-bold text-red-600 hover:underline cursor-pointer shrink-0 ml-2"
                      >
                        Ganti Foto
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-3 py-5">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-bold text-[14px] text-[#191A1E]">Ambil foto dari kamera HP atau pilih file</p>
                      <p className="text-[12px] text-[#646973]">Fitur Geotagging mengekstrak koordinat GPS asli foto</p>
                    </div>
                    <input type="file" accept="image/*" className="sr-only" onChange={handleFile} />
                  </label>
                )}
              </div>
            </div>

            {/* Step 2 – Deskripsi & AI Classifier */}
            <div className="bg-white rounded-3xl border border-[#E6E2D8] shadow-card-soft p-6 sm:p-7 space-y-4">
              <StepHeader n={2} title="Ceritakan Kerusakan Fasilitas *" subtitle="Tuliskan secara jelas titik jalan di Ketintang, jenis masalah, dan dampaknya." />

              <div className="space-y-3.5">
                <textarea
                  rows={4}
                  required
                  value={deskripsi}
                  onChange={handleDescriptionChange}
                  placeholder="Contoh: Jalan aspal di Jl. Ketintang Baru dekat perlintasan rel ambles sedalam 15cm dan membahayakan pengendara motor di malam hari..."
                  className="w-full rounded-2xl border border-[#E6E2D8] p-4 text-[14px] text-[#191A1E] bg-[#FAF8F3] focus:bg-white focus:border-[#191A1E] focus:outline-none leading-relaxed resize-none transition-colors"
                />

                {/* AI Detection Card */}
                <div className="bg-orange-50/80 border border-orange-200 rounded-2xl p-4 space-y-2 text-[12px]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isAnalyzing ? (
                        <Loader2 className="w-4 h-4 text-orange-700 animate-spin shrink-0" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-orange-700 shrink-0" />
                      )}
                      <span className="text-[#191A1E] font-medium">
                        {isAnalyzing ? (
                          <span className="text-orange-800 font-bold">AI sedang mengevaluasi deskripsi…</span>
                        ) : (
                          <>
                            Sektor Terdeteksi: <strong className="text-[#191A1E] font-bold">{kategori}</strong>
                          </>
                        )}
                        {aiConfidence && !isAnalyzing && (
                          <span className="ml-2 text-[11px] font-bold text-orange-950 bg-orange-200 px-2 py-0.5 rounded-full">
                            {aiConfidence}% Akurat
                          </span>
                        )}
                      </span>
                    </div>

                    {!isAnalyzing && (
                      <span className={`font-bold px-3 py-1 rounded-full border inline-flex items-center gap-1.5 self-start sm:self-auto text-[11px] ${
                        prioritas === 'Tinggi' ? 'bg-red-50 text-red-700 border-red-200'
                        : prioritas === 'Sedang' ? 'bg-orange-100 text-orange-900 border-orange-300'
                        : 'bg-stone-100 text-stone-700 border-stone-200'
                      }`}>
                        Urgensi: {prioritas}
                      </span>
                    )}
                  </div>

                  {aiReason && !isAnalyzing && (
                    <div className="text-[11px] text-[#646973] border-t border-orange-200/80 pt-2 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-orange-700 shrink-0" />
                      <span>{aiReason}</span>
                    </div>
                  )}
                </div>

                {/* Category Selector */}
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

            {/* Step 3 – Titik Lokasi & Nama Jalan */}
            <div className="bg-white rounded-3xl border border-[#E6E2D8] shadow-card-soft p-6 sm:p-7 space-y-4">
              <StepHeader
                n={3}
                title="Titik Lokasi &amp; Nama Jalan *"
                subtitle="Geser titik di peta atau gunakan GPS. Nama jalan akan terdeteksi otomatis dari titik lokasi."
              />
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-[#191A1E] mb-1.5">
                    Nama Jalan / Patokan Lokasi:
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-orange-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={resolvedAddress}
                      onChange={e => setResolvedAddress(e.target.value)}
                      placeholder="Contoh: Jl. Ketintang Baru VII, depan toko kelontong..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E6E2D8] text-[13px] text-[#191A1E] bg-[#FAF8F3] focus:bg-white focus:outline-none focus:border-[#191A1E] font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-[#646973] mt-1.5">
                    *Terdeteksi otomatis saat Anda klik peta atau deteksi GPS di bawah. Anda juga dapat melengkapi nomor rumah atau patokan.
                  </p>
                </div>

                <div>
                  <MapPicker
                    coords={coords}
                    setCoords={setCoords}
                    geotagSource={geotagSource}
                    setGeotagSource={setGeotagSource}
                    address={resolvedAddress}
                    setAddress={setResolvedAddress}
                  />
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
                      placeholder="Pak Budi / Warga Ketintang"
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
              className="w-full py-4 bg-[#EA580C] hover:bg-[#C2410C] disabled:opacity-50 text-white font-bold text-[15px] rounded-full transition-all shadow-xl flex items-center justify-center gap-3 cursor-pointer active:scale-98"
            >
              <Send className="w-5 h-5 text-orange-200" />
              <span>{submitting ? 'Sedang Mengirim Laporan…' : 'Kirim Laporan ke Posko Ketintang'}</span>
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
