'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Clock,
  User,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { supabase, Aduan } from '@/lib/supabase';
import { getAduanByTicket } from '@/lib/aduan-service';
import { useToast } from '@/components/Toast';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';

export default function TicketTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const ticketCode = (params.ticket as string)?.toUpperCase();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<Aduan | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchTicket() {
      if (!ticketCode) return;
      setLoading(true);
      setNotFound(false);

      try {
        const data = await getAduanByTicket(ticketCode);
        if (!data) {
          setNotFound(true);
        } else {
          setReport(data);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchTicket();
  }, [ticketCode]);

  const handleCopy = () => {
    if (ticketCode) {
      navigator.clipboard.writeText(ticketCode);
      setCopied(true);
      showToast('Nomor tiket berhasil disalin.', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWA = () => {
    if (!report) return;
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const trackingUrl = `${siteUrl}/lacak/${report.ticket_code}`;
    const text = encodeURIComponent(
      `*SIGAP - KETINTANG - Laporan Fasilitas #${report.ticket_code}*\n\n` +
      `📌 *Isu:* ${report.kategori} (${report.dusun})\n` +
      `📊 *Status:* ${report.status}\n` +
      `🚨 *Prioritas:* ${report.prioritas}\n` +
      `🔍 *Pantau:* ${trackingUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-32 text-center space-y-3">
        <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="text-sm font-bold text-[#191A1E]">Memuat data pengaduan #{ticketCode}…</h2>
      </div>
    );
  }

  if (notFound || !report) {
    return (
      <div className="max-w-md mx-auto px-4 py-32 text-center space-y-5">
        <div className="w-16 h-16 bg-white text-emerald-700 rounded-full flex items-center justify-center mx-auto border border-[#E6E2D8] shadow-card-soft">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display font-bold text-xl text-[#191A1E]">Nomor Tiket Tidak Ditemukan</h2>
          <p className="text-[13px] text-[#646973] leading-relaxed">
            Nomor tiket <span className="font-mono font-bold text-[#191A1E]">#{ticketCode}</span> tidak terdaftar dalam basis data desa.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#1B4332] text-white rounded-full text-xs font-bold hover:bg-[#143628] transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(report.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div id="main-content" className="w-full bg-transparent min-h-screen pb-24 pt-24 sm:pt-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* ── Top Navigation & Status Bar ──────────────── */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#646973] hover:text-[#191A1E] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Pengaduan</span>
          </Link>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E2D8] shadow-card-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#191A1E] font-mono tracking-tight">
                  #{report.ticket_code}
                </h1>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-xl text-slate-600 hover:text-black hover:bg-[#FAF8F3] cursor-pointer border border-[#E6E2D8] transition-colors"
                  title="Salin Nomor Tiket"
                  aria-label="Salin nomor tiket"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[12px] text-[#646973] font-medium">Terdaftar pada: {formattedDate}</p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleShareWA}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#E6E2D8] bg-[#FAF8F3] text-[#191A1E] hover:border-emerald-500 text-[12px] font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bagikan WhatsApp</span>
              </button>

              <span
                className={`text-[12px] font-bold px-4 py-2.5 rounded-full flex items-center shadow-xs ${
                  report.status === 'Selesai'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : report.status === 'Sedang Ditindak'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-stone-100 text-stone-700 border border-stone-300'
                }`}
              >
                {report.status}
              </span>
            </div>
          </div>
        </div>

        {/* ── Before-After Slider if finished ──────────── */}
        {report.status === 'Selesai' && report.foto_url && report.foto_selesai_url && (
          <div className="bg-white rounded-3xl border border-[#E6E2D8] p-6 sm:p-7 space-y-4 shadow-card-soft">
            <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-3.5">
              <div className="flex items-center gap-2 text-[#191A1E] font-bold text-[14px]">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-display">Komparasi Hasil Fisik Perbaikan Lapangan</span>
              </div>
              <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Terverifikasi Selesai
              </span>
            </div>

            <BeforeAfterSlider
              beforeImage={report.foto_url}
              afterImage={report.foto_selesai_url}
              beforeLabel="Kondisi Awal (Pelaporan)"
              afterLabel="Hasil Perbaikan (Selesai)"
            />
          </div>
        )}

        {/* ── Status Stepper / Activity Timeline ──────── */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E2D8] shadow-card-soft space-y-6">
          <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-4">
            <h2 className="font-display font-bold text-[15px] text-[#191A1E]">
              Tahapan &amp; Linimasa Penanganan
            </h2>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              SLA Tanggap Cepat
            </span>
          </div>

          <div className="relative pl-7 space-y-7 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E6E2D8]">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -left-7 top-0.5 w-5 h-5 rounded-full bg-[#1B4332] border-2 border-white text-emerald-300 flex items-center justify-center shadow-xs">
                <Check className="w-3 h-3 text-white" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[13px] font-bold text-[#191A1E]">
                  <span>1. Laporan Didaftarkan oleh Warga</span>
                  <span className="text-[#646973] font-normal text-[11px]">({formattedDate})</span>
                </div>
                <p className="text-[12px] text-[#646973] leading-relaxed">
                  Laporan masuk ke antrean digital dan otomatis terklasifikasi sebagai <strong>{report.kategori}</strong> dengan urgensi <strong className="text-emerald-800">Prioritas {report.prioritas}</strong>.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div
                className={`absolute -left-7 top-0.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                  report.status === 'Sedang Ditindak' || report.status === 'Selesai'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#E6E2D8] text-slate-400'
                }`}
              >
                <Clock className="w-3 h-3" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[13px] font-bold text-[#191A1E]">
                  <span>2. Verifikasi Lapangan &amp; Alokasi Tindakan</span>
                  {report.status !== 'Menunggu Verifikasi' && (
                    <span className="text-[10px] text-emerald-900 font-bold bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                      Sedang Diproses
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-[#646973] leading-relaxed">
                  {report.status === 'Menunggu Verifikasi'
                    ? 'Menunggu verifikasi fisik oleh kepala dusun atau perangkat teknis desa.'
                    : report.catatan_admin || 'Petugas dan peralatan perbaikan telah ditugaskan ke titik lokasi.'}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div
                className={`absolute -left-7 top-0.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                  report.status === 'Selesai' ? 'bg-[#1B4332] text-white' : 'bg-[#E6E2D8] text-slate-400'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[13px] font-bold text-[#191A1E]">
                  <span>3. Perbaikan Selesai &amp; Arsip Musrenbangdes</span>
                  {report.status === 'Selesai' && (
                    <span className="text-[10px] text-emerald-900 font-bold bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                      Tuntas
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-[#646973] leading-relaxed">
                  {report.status === 'Selesai'
                    ? 'Fasilitas umum telah tuntas diperbaiki dan bukti pengerjaan lapangan telah disetujui perangkat desa.'
                    : 'Tiket akan ditutup setelah perbaikan lapangan selesai dan foto bukti diunggah oleh staf.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Detail Isu Card ─────────────────────────── */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E2D8] shadow-card-soft space-y-5">
          <h2 className="font-display font-bold text-[15px] text-[#191A1E] border-b border-[#E6E2D8] pb-3.5">
            Rincian Informasi Pengaduan
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-[#FAF8F3] p-3.5 rounded-2xl border border-[#E6E2D8]">
              <span className="text-[#646973] block mb-1 font-medium text-[11px]">Kategori Fasilitas:</span>
              <span className="font-bold text-[#191A1E] text-sm">{report.kategori}</span>
            </div>

            <div className="bg-[#FAF8F3] p-3.5 rounded-2xl border border-[#E6E2D8]">
              <span className="text-[#646973] block mb-1 font-medium text-[11px]">Wilayah Dusun:</span>
              <span className="font-bold text-[#191A1E] text-sm">{report.dusun}</span>
            </div>

            <div className="bg-[#FAF8F3] p-3.5 rounded-2xl border border-[#E6E2D8]">
              <span className="text-[#646973] block mb-1 font-medium text-[11px]">Tingkat Urgensi AI:</span>
              <span
                className={`font-bold px-2.5 py-0.5 rounded-full inline-block text-[11px] ${
                  report.prioritas === 'Tinggi'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : report.prioritas === 'Sedang'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                Prioritas {report.prioritas}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[12px] text-[#646973] block mb-1.5 font-bold">Deskripsi Pelapor:</span>
            <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#E6E2D8] text-[13px] text-[#191A1E] leading-relaxed">
              {report.deskripsi}
            </div>
          </div>

          {/* Photo if single photo */}
          {(!report.foto_selesai_url || report.status !== 'Selesai') && report.foto_url && (
            <div>
              <span className="text-[12px] text-[#646973] block mb-1.5 font-bold">Foto Bukti Terlampir:</span>
              <div className="max-w-md h-64 rounded-2xl overflow-hidden border border-[#E6E2D8]">
                <img src={report.foto_url} alt="Foto Kerusakan" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <div className="pt-3 flex items-center justify-between text-[12px] text-[#646973] border-t border-[#E6E2D8]">
            <span className="flex items-center gap-1.5 font-mono font-bold text-[#191A1E]">
              <MapPin className="w-4 h-4 text-emerald-700" />
              {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
            </span>
            <a
              href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1 min-h-[36px]"
            >
              Buka Google Maps <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
