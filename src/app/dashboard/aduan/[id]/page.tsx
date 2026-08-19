'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  ArrowLeft,
  Calendar,
  MapPin,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Save,
  Clock,
  User,
  Phone,
  MessageSquare,
  Sparkles,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { supabase, Aduan } from '@/lib/supabase';
import { convertToWebP } from '@/lib/image-compress';
import { useToast } from '@/components/Toast';

export default function AdminAduanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const reportId = params.id as string;

  const [report, setReport] = useState<Aduan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State for update
  const [status, setStatus] = useState<'Menunggu Verifikasi' | 'Sedang Ditindak' | 'Selesai'>('Menunggu Verifikasi');
  const [prioritas, setPrioritas] = useState<'Tinggi' | 'Sedang' | 'Rendah'>('Sedang');
  const [catatanAdmin, setCatatanAdmin] = useState('');
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReportDetail() {
      if (!reportId) return;
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('aduan')
          .select('*')
          .eq('id', reportId)
          .single();

        if (error) {
          console.error('Error fetching aduan:', error);
        } else if (data) {
          setReport(data);
          setStatus(data.status);
          setPrioritas(data.prioritas);
          setCatatanAdmin(data.catatan_admin || '');
          if (data.foto_selesai_url) {
            setAfterPreview(data.foto_selesai_url);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchReportDetail();
  }, [reportId]);

  const handleAfterImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAfterFile(file);
      setAfterPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;

    setSaving(true);
    try {
      let finalFotoSelesaiUrl = report.foto_selesai_url;

      if (afterFile) {
        try {
          const webpBlob = await convertToWebP(afterFile);
          const fileName = `selesai_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webp`;
          const filePath = `selesai/${fileName}`;

          const { error: uploadErr } = await supabase.storage
            .from('aduan-images')
            .upload(filePath, webpBlob, { contentType: 'image/webp' });

          if (!uploadErr) {
            const { data: publicData } = supabase.storage
              .from('aduan-images')
              .getPublicUrl(filePath);
            finalFotoSelesaiUrl = publicData.publicUrl;
          }
        } catch (imgErr) {
          console.warn('Error compressing after-image:', imgErr);
        }
      }

      const { error: updateError } = await supabase
        .from('aduan')
        .update({
          status,
          prioritas,
          catatan_admin: catatanAdmin.trim() || null,
          foto_selesai_url: finalFotoSelesaiUrl,
        })
        .eq('id', report.id);

      if (updateError) throw updateError;

      showToast('Status dan tindakan berhasil diperbarui.', 'success');
      router.refresh();
    } catch (err: any) {
      console.error('Update error:', err);
      showToast('Gagal menyimpan: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleContactReporterWA = () => {
    if (!report || !report.kontak_pelapor) return;
    let cleanPhone = report.kontak_pelapor.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const text = encodeURIComponent(
      `Halo ${report.nama_pelapor || 'Bapak/Ibu'},\n\nKami dari Perangkat Desa menindaklanjuti laporan fasilitas Anda (#${report.ticket_code} - ${report.kategori} di ${report.dusun}).`
    );
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <h2 className="text-xs font-bold text-muted-foreground">Memuat Rincian Pengaduan...</h2>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h2 className="text-base font-bold text-foreground">Pengaduan Tidak Ditemukan</h2>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* TOP HEADER */}
      <div className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-secondary hover:text-primary transition-colors min-h-[36px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Command Center
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Kode Tiket:</span>
            <span className="font-mono font-bold text-xs text-primary bg-muted px-2.5 py-1 rounded border border-border">
              #{report.ticket_code}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* INFORMASI LAPORAN (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-xl border border-border shadow-accessible-sm p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Data Pengaduan Lapangan
                </h3>
                <span className="text-xs text-muted-foreground">
                  {new Date(report.created_at).toLocaleDateString('id-ID', {
                    dateStyle: 'medium',
                  })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block mb-0.5">Kategori:</span>
                  <span className="font-bold text-foreground text-sm">{report.kategori}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Wilayah Dusun:</span>
                  <span className="font-bold text-foreground text-sm">{report.dusun}</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block mb-1">Deskripsi Kerusakan:</span>
                <div className="p-3.5 bg-muted/40 rounded-lg border border-border text-xs text-foreground leading-relaxed">
                  {report.deskripsi}
                </div>
              </div>

              {/* FOTO AWAL */}
              <div>
                <span className="text-xs text-muted-foreground block mb-1.5">Foto Bukti Kerusakan:</span>
                <div className="h-60 bg-muted rounded-lg overflow-hidden border border-border">
                  {report.foto_url ? (
                    <img src={report.foto_url} alt="Foto Kerusakan" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-medium">
                      Pelapor tidak melampirkan foto
                    </div>
                  )}
                </div>
              </div>

              {/* PELAPOR & GPS */}
              <div className="pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground block font-medium">Informasi Pelapor:</span>
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    {report.nama_pelapor || 'Anonim'}
                  </div>
                  {report.kontak_pelapor && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-foreground font-mono">{report.kontak_pelapor}</span>
                      <button
                        onClick={handleContactReporterWA}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded border border-emerald-300 cursor-pointer"
                      >
                        <MessageCircle className="w-3 h-3" /> Hubungi WA
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground block font-medium">Koordinat GPS:</span>
                  <div className="font-mono font-bold text-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-accent" />
                    {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline min-h-[36px]"
                  >
                    Buka di Google Maps <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* FORM TINDAKAN (1 Col) */}
          <div className="space-y-6">
            <form onSubmit={handleSaveChanges} className="bg-card rounded-xl border border-border shadow-accessible-sm p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-3">
                Form Tindakan Petugas
              </h3>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Status Penanganan:</label>
                <select
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="w-full text-xs font-bold rounded-lg border border-border p-2.5 bg-white text-foreground focus:outline-none min-h-[40px]"
                >
                  <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                  <option value="Sedang Ditindak">Sedang Ditindak</option>
                  <option value="Selesai">Selesai (Fasilitas Diperbaiki)</option>
                </select>
              </div>

              {/* Prioritas */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Tingkat Prioritas:</label>
                <select
                  value={prioritas}
                  onChange={(e: any) => setPrioritas(e.target.value)}
                  className="w-full text-xs font-bold rounded-lg border border-border p-2.5 bg-white text-foreground focus:outline-none min-h-[40px]"
                >
                  <option value="Tinggi">Prioritas Tinggi (Darurat / Mendesak)</option>
                  <option value="Sedang">Prioritas Sedang (Reguler)</option>
                  <option value="Rendah">Prioritas Rendah (Ringan)</option>
                </select>
              </div>

              {/* Catatan Admin */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Catatan Penanganan Lapangan:</label>
                <textarea
                  rows={3}
                  value={catatanAdmin}
                  onChange={(e) => setCatatanAdmin(e.target.value)}
                  placeholder="Contoh: Material aspal tiba besok, dikoordinasikan dengan tim RT 02..."
                  className="w-full text-xs rounded-lg border border-border p-2.5 text-foreground bg-white focus:outline-none"
                ></textarea>
              </div>

              {/* Upload Foto Selesai */}
              <div className="pt-2 border-t border-border space-y-2">
                <label className="block text-xs font-bold text-foreground">
                  Foto Bukti Pengerjaan (After-Photo):
                </label>

                <div className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-border rounded-xl bg-muted/30">
                  {afterPreview ? (
                    <div className="w-full space-y-2 text-center">
                      <img src={afterPreview} alt="Bukti Selesai" className="h-32 w-full object-cover rounded-lg border border-border" />
                      <label htmlFor="after-file" className="text-xs font-bold text-accent hover:underline cursor-pointer block">
                        Ganti Foto Bukti Selesai
                      </label>
                    </div>
                  ) : (
                    <label htmlFor="after-file" className="cursor-pointer text-center py-2 flex flex-col items-center gap-1 text-secondary hover:text-primary">
                      <Camera className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs font-bold">Unggah Foto Selesai</span>
                      <span className="text-[10px] text-muted-foreground">Otomatis WebP Web-Ready</span>
                    </label>
                  )}
                  <input id="after-file" type="file" accept="image/*" className="sr-only" onChange={handleAfterImageChange} />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-primary hover:bg-secondary text-on-primary font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[44px] disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Menyimpan...' : 'Simpan & Perbarui'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
