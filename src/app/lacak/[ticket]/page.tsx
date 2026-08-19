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
  MessageSquare,
  Flame,
  Copy,
  Check,
  Share2,
  Phone,
  ShieldCheck,
  Clock,
  User,
} from 'lucide-react';
import { supabase, Aduan } from '@/lib/supabase';
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
        const { data, error } = await supabase
          .from('aduan')
          .select('*')
          .eq('ticket_code', ticketCode)
          .single();

        if (error || !data) {
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
      `*SIGAP DESA - Laporan Fasilitas #${report.ticket_code}*\n\n` +
      `📌 *Isu:* ${report.kategori} (${report.dusun})\n` +
      `📊 *Status:* ${report.status}\n` +
      `🚨 *Prioritas:* ${report.prioritas}\n` +
      `🔍 *Pantau:* ${trackingUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="text-sm font-bold text-foreground">Memuat data pengaduan #{ticketCode}...</h2>
      </div>
    );
  }

  if (notFound || !report) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-14 h-14 bg-muted text-secondary rounded-full flex items-center justify-center mx-auto border border-border">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Nomor Tiket Tidak Ditemukan</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Nomor tiket <span className="font-mono font-bold text-primary">#{ticketCode}</span> tidak terdaftar dalam basis data desa.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-secondary transition-colors cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
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
    <div className="w-full bg-background min-h-screen pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* TOP BREADCRUMB & HEADER */}
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary hover:text-primary transition-colors min-h-[36px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Daftar Pengaduan
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-mono tracking-tight">
                  #{report.ticket_code}
                </h1>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-md text-secondary hover:text-primary hover:bg-muted cursor-pointer border border-border"
                  title="Salin Nomor Tiket"
                  aria-label="Salin nomor tiket"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Terdaftar pada: {formattedDate}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShareWA}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-border bg-white text-secondary hover:text-emerald-700 hover:bg-muted text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
              >
                <Share2 className="w-4 h-4 text-emerald-600" />
                <span>Bagikan WhatsApp</span>
              </button>

              <span
                className={`text-xs font-bold px-3.5 py-2.5 rounded-lg min-h-[44px] flex items-center ${
                  report.status === 'Selesai'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : report.status === 'Sedang Ditindak'
                    ? 'bg-sky-100 text-sky-900 border border-sky-300'
                    : 'bg-muted text-foreground border border-border'
                }`}
              >
                {report.status}
              </span>
            </div>
          </div>
        </div>

        {/* INTERACTIVE BEFORE-AFTER SLIDER (IF COMPLETED WITH BOTH PHOTOS) */}
        {report.status === 'Selesai' && report.foto_url && report.foto_selesai_url && (
          <div className="bg-card rounded-xl border border-border p-6 space-y-4 shadow-accessible-sm">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Komparasi Hasil Perbaikan Lapangan</span>
              </div>
              <span className="text-xs text-emerald-800 font-bold bg-emerald-100 px-2.5 py-1 rounded">
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

        {/* AUDIT TRAIL / ACTIVITY TIMELINE */}
        <div className="bg-card rounded-xl p-6 sm:p-7 border border-border shadow-accessible-sm space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3">
            Tahapan & Linimasa Penanganan
          </h2>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {/* Step 1: Terdaftar */}
            <div className="relative">
              <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-primary border-2 border-white"></div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <span>1. Laporan Didaftarkan oleh Warga</span>
                  <span className="text-muted-foreground font-normal">({formattedDate})</span>
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  Laporan masuk ke antrean dan otomatis terklasifikasi sebagai <strong>{report.kategori}</strong> dengan tingkat urgensi <strong className="text-primary">Prioritas {report.prioritas}</strong>.
                </p>
              </div>
            </div>

            {/* Step 2: Sedang Ditindak */}
            <div className="relative">
              <div
                className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 border-white ${
                  report.status === 'Sedang Ditindak' || report.status === 'Selesai'
                    ? 'bg-accent'
                    : 'bg-border'
                }`}
              ></div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <span>2. Verifikasi Lapangan & Alokasi Penanganan</span>
                  {report.status !== 'Menunggu Verifikasi' && (
                    <span className="text-[10px] text-sky-900 font-bold bg-sky-100 px-2 py-0.5 rounded">
                      Sedang Diproses
                    </span>
                  )}
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  {report.status === 'Menunggu Verifikasi'
                    ? 'Menunggu verifikasi lapangan oleh perangkat desa atau kepala dusun terkait.'
                    : report.catatan_admin || 'Petugas dan peralatan perbaikan telah ditugaskan ke lokasi.'}
                </p>
              </div>
            </div>

            {/* Step 3: Selesai */}
            <div className="relative">
              <div
                className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 border-white ${
                  report.status === 'Selesai' ? 'bg-emerald-600' : 'bg-border'
                }`}
              ></div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <span>3. Perbaikan Selesai & Terverifikasi</span>
                  {report.status === 'Selesai' && (
                    <span className="text-[10px] text-emerald-900 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                      Tuntas
                    </span>
                  )}
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  {report.status === 'Selesai'
                    ? 'Fasilitas umum telah selesai diperbaiki dan bukti pengerjaan lapangan telah disetujui perangkat desa.'
                    : 'Tiket akan ditutup setelah perbaikan lapangan selesai dan foto bukti diunggah.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* DETAIL ISU CARD */}
        <div className="bg-card rounded-xl p-6 sm:p-7 border border-border shadow-accessible-sm space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3">
            Rincian Informasi Pengaduan
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block mb-0.5 font-medium">Kategori Fasilitas:</span>
              <span className="font-bold text-foreground text-sm">{report.kategori}</span>
            </div>

            <div>
              <span className="text-muted-foreground block mb-0.5 font-medium">Wilayah Dusun:</span>
              <span className="font-bold text-foreground text-sm">{report.dusun}</span>
            </div>

            <div>
              <span className="text-muted-foreground block mb-0.5 font-medium">Tingkat Urgensi (AI):</span>
              <span
                className={`font-bold px-2 py-1 rounded inline-block text-xs ${
                  report.prioritas === 'Tinggi'
                    ? 'bg-destructive text-on-destructive'
                    : report.prioritas === 'Sedang'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-muted text-secondary'
                }`}
              >
                Prioritas {report.prioritas}
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs text-muted-foreground block mb-1 font-medium">Deskripsi Pelapor:</span>
            <div className="p-4 bg-muted/40 rounded-lg border border-border text-xs sm:text-sm text-foreground leading-relaxed">
              {report.deskripsi}
            </div>
          </div>

          {/* Foto Kerusakan jika tidak ada slider */}
          {(!report.foto_selesai_url || report.status !== 'Selesai') && report.foto_url && (
            <div>
              <span className="text-xs text-muted-foreground block mb-1.5 font-medium">Foto Bukti Terlampir:</span>
              <div className="max-w-md h-60 rounded-lg overflow-hidden border border-border">
                <img src={report.foto_url} alt="Foto Kerusakan" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <div className="pt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border">
            <span className="flex items-center gap-1 font-mono font-bold text-foreground">
              <MapPin className="w-4 h-4 text-accent" />
              {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
            </span>
            <a
              href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:text-accent-hover font-bold inline-flex items-center gap-1 min-h-[36px]"
            >
              Buka di Google Maps <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
