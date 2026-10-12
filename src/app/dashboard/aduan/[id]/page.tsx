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
  ArrowRight,
  Trash2
} from 'lucide-react';
import { supabase, Aduan } from '@/lib/supabase';
import { getAduanById, updateAduan, deleteAduan } from '@/lib/aduan-service';
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
  const [deleting, setDeleting] = useState(false);

  // Form State for update
  const [status, setStatus] = useState<'Menunggu Verifikasi' | 'Sedang Ditindak' | 'Selesai' | 'Ditolak (Spam / Tidak Valid)' | string>('Menunggu Verifikasi');
  const [prioritas, setPrioritas] = useState<'Tinggi' | 'Sedang' | 'Rendah'>('Sedang');
  const [catatanAdmin, setCatatanAdmin] = useState('');
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReportDetail() {
      if (!reportId) return;
      setLoading(true);

      try {
        const data = await getAduanById(reportId);
        if (data) {
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

    if (status === 'Ditolak (Spam / Tidak Valid)' && !catatanAdmin.trim()) {
      showToast('Alasan penolakan / status false wajib diisi (contoh: Spam, laporan palsu, dll).', 'error');
      return;
    }

    setSaving(true);
    try {
      let finalFotoSelesaiUrl = report.foto_selesai_url;

      if (status !== 'Ditolak (Spam / Tidak Valid)' && afterFile) {
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

      await updateAduan(report.id, {
        status,
        prioritas,
        catatan_admin: catatanAdmin.trim() || null,
        foto_selesai_url: status === 'Ditolak (Spam / Tidak Valid)' ? null : finalFotoSelesaiUrl,
      });

      showToast('Status dan tindakan berhasil diperbarui.', 'success');
      router.refresh();
    } catch (err: any) {
      console.error('Update error:', err);
      showToast('Gagal menyimpan: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const confirmDeleteAction = async () => {
    if (!report) return;
    setDeleting(true);
    try {
      await deleteAduan(report.id || report.ticket_code);
      showToast(`Laporan #${report.ticket_code} berhasil dihapus permanen.`, 'success');
      window.location.href = '/dashboard';
    } catch (err: any) {
      showToast('Gagal menghapus laporan: ' + err.message, 'error');
      setDeleting(false);
      setShowDeleteConfirm(false);
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
      <div className="max-w-4xl mx-auto px-4 py-32 text-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <h2 className="text-xs font-bold text-[#646973]">Memuat Rincian Pengaduan…</h2>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-xl mx-auto px-4 py-32 text-center space-y-4">
        <h2 className="font-display text-base font-bold text-[#191A1E]">Pengaduan Tidak Ditemukan</h2>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1B4332] text-white rounded-full text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div id="main-content" className="min-h-screen bg-[#FAF8F3] pb-24">
      {/* ── TOP HEADER ─────────────────────────────── */}
      <div className="bg-white border-b border-[#E6E2D8] sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-[12px] font-bold text-[#646973] hover:text-[#191A1E] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Command Center</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#646973] font-medium">Tiket:</span>
            <span className="font-mono font-bold text-xs text-[#191A1E] bg-[#FAF8F3] px-3 py-1 rounded-full border border-[#E6E2D8]">
              #{report.ticket_code}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── INFORMASI LAPORAN (2 Cols) ───────────── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-[#E6E2D8] shadow-card-soft p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-3.5">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[#191A1E]">
                  Data Fisik Pengaduan
                </h3>
                <span className="text-[11px] text-[#646973]">
                  {new Date(report.created_at).toLocaleDateString('id-ID', {
                    dateStyle: 'medium',
                  })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-[#FAF8F3] p-3.5 rounded-2xl border border-[#E6E2D8]">
                  <span className="text-[#646973] block mb-0.5 text-[11px]">Kategori:</span>
                  <span className="font-bold text-[#191A1E] text-sm">{report.kategori}</span>
                </div>
                <div className="bg-[#FAF8F3] p-3.5 rounded-2xl border border-[#E6E2D8]">
                  <span className="text-[#646973] block mb-0.5 text-[11px]">Wilayah Ketintang:</span>
                  <span className="font-bold text-[#191A1E] text-sm">{report.dusun}</span>
                </div>
              </div>

              <div>
                <span className="text-[12px] font-bold text-[#646973] block mb-1">Deskripsi Kerusakan:</span>
                <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#E6E2D8] text-[13px] text-[#191A1E] leading-relaxed">
                  {report.deskripsi}
                </div>
              </div>

              {/* FOTO AWAL */}
              <div>
                <span className="text-[12px] font-bold text-[#646973] block mb-1.5">Foto Bukti Kerusakan:</span>
                <div className="h-64 bg-[#FAF8F3] rounded-2xl overflow-hidden border border-[#E6E2D8]">
                  {report.foto_url ? (
                    <img src={report.foto_url} alt="Foto Kerusakan" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#9E998E] text-xs font-medium">
                      Pelapor tidak melampirkan foto
                    </div>
                  )}
                </div>
              </div>

              {/* PELAPOR & GPS */}
              <div className="pt-4 border-t border-[#E6E2D8] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[#646973] block font-bold text-[11px]">Informasi Pelapor:</span>
                  <div className="flex items-center gap-1.5 font-bold text-[#191A1E]">
                    <User className="w-3.5 h-3.5 text-[#646973]" />
                    {report.nama_pelapor || 'Anonim'}
                  </div>
                  {report.kontak_pelapor && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[#191A1E] font-mono">{report.kontak_pelapor}</span>
                      <button
                        onClick={handleContactReporterWA}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300 cursor-pointer"
                      >
                        <MessageCircle className="w-3 h-3" /> Hubungi WA
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[#646973] block font-bold text-[11px]">Koordinat Geospasial:</span>
                  <div className="font-mono font-bold text-[#191A1E] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                  >
                    Buka Google Maps <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ── FORM TINDAKAN (1 Col) ────────────────── */}
          <div className="space-y-6">
            <form onSubmit={handleSaveChanges} className="bg-white rounded-3xl border border-[#E6E2D8] shadow-card-soft p-6 sm:p-7 space-y-4">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[#191A1E] border-b border-[#E6E2D8] pb-3">
                Form Tindakan Perangkat Desa
              </h3>

              {/* Status */}
              <div>
                <label className="block text-[12px] font-bold text-[#191A1E] mb-1.5">Status Penanganan:</label>
                <select
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className={`w-full text-[13px] font-bold rounded-xl border p-3 focus:outline-none transition-colors cursor-pointer ${
                    status === 'Ditolak (Spam / Tidak Valid)'
                      ? 'bg-red-50 text-red-800 border-red-300'
                      : status === 'Selesai'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-[#FAF8F3] text-[#191A1E] border-[#E6E2D8] focus:bg-white'
                  }`}
                >
                  <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                  <option value="Sedang Ditindak">Sedang Ditindak</option>
                  <option value="Selesai">Selesai (Tuntas Diperbaiki)</option>
                  <option value="Ditolak (Spam / Tidak Valid)">Ditolak (False / Spam / Tidak Valid)</option>
                </select>
              </div>

              {/* Prioritas (only relevant if not rejected) */}
              {status !== 'Ditolak (Spam / Tidak Valid)' && (
                <div>
                  <label className="block text-[12px] font-bold text-[#191A1E] mb-1.5">Tingkat Prioritas:</label>
                  <select
                    value={prioritas}
                    onChange={(e: any) => setPrioritas(e.target.value)}
                    className="w-full text-[13px] font-bold rounded-xl border border-[#E6E2D8] p-3 bg-[#FAF8F3] text-[#191A1E] focus:bg-white focus:outline-none"
                  >
                    <option value="Tinggi">Prioritas Tinggi (Darurat / Mendesak)</option>
                    <option value="Sedang">Prioritas Sedang (Reguler)</option>
                    <option value="Rendah">Prioritas Rendah (Ringan)</option>
                  </select>
                </div>
              )}

              {/* Catatan Admin / Alasan Penolakan */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`block text-[12px] font-bold ${status === 'Ditolak (Spam / Tidak Valid)' ? 'text-red-700' : 'text-[#191A1E]'}`}>
                    {status === 'Ditolak (Spam / Tidak Valid)' ? 'Alasan Penolakan / Status False (Wajib Diisi):' : 'Catatan Penanganan Lapangan:'}
                  </label>
                  {status === 'Ditolak (Spam / Tidak Valid)' && (
                    <span className="text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded-full">
                      Wajib Diisi
                    </span>
                  )}
                </div>

                {/* Quick Chips for false/spam reasons */}
                {status === 'Ditolak (Spam / Tidak Valid)' && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      '🚨 Laporan Spam / Promosi',
                      '❌ Laporan Palsu / Fiktif',
                      '📋 Duplikasi Tiket Sebelumnya',
                      '📍 Titik Lokasi & Foto Tidak Sesuai'
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setCatatanAdmin(chip)}
                        className="text-[11px] px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-full font-bold transition-colors cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  rows={3}
                  required={status === 'Ditolak (Spam / Tidak Valid)'}
                  value={catatanAdmin}
                  onChange={(e) => setCatatanAdmin(e.target.value)}
                  placeholder={
                    status === 'Ditolak (Spam / Tidak Valid)'
                      ? 'Contoh: Laporan terindikasi spam promosi atau foto tidak menggambarkan kerusakan fasilitas di wilayah Ketintang...'
                      : 'Contoh: Material aspal tiba besok, dikoordinasikan dengan tim RT 02...'
                  }
                  className={`w-full text-[13px] rounded-xl border p-3 focus:outline-none transition-colors ${
                    status === 'Ditolak (Spam / Tidak Valid)'
                      ? 'border-red-300 bg-red-50/50 text-[#191A1E] focus:bg-white focus:border-red-500'
                      : 'border-[#E6E2D8] bg-[#FAF8F3] text-[#191A1E] focus:bg-white focus:border-[#191A1E]'
                  }`}
                ></textarea>
              </div>

              {/* Upload Foto Selesai (Hanya jika bukan status ditolak/false) */}
              {status === 'Ditolak (Spam / Tidak Valid)' ? (
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Foto bukti pengerjaan <strong>tidak diperlukan</strong> untuk status laporan Ditolak / False.</span>
                </div>
              ) : (
                <div className="pt-2 border-t border-[#E6E2D8] space-y-2">
                  <label className="block text-[12px] font-bold text-[#191A1E]">
                    Foto Bukti Pengerjaan (After-Photo):
                  </label>

                  <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#E6E2D8] rounded-2xl bg-[#FAF8F3]">
                    {afterPreview ? (
                      <div className="w-full space-y-2 text-center">
                        <img src={afterPreview} alt="Bukti Selesai" className="h-36 w-full object-cover rounded-xl border border-[#E6E2D8]" />
                        <label htmlFor="after-file" className="text-[12px] font-bold text-emerald-700 hover:underline cursor-pointer block">
                          Ganti Foto Bukti Selesai
                        </label>
                      </div>
                    ) : (
                      <label htmlFor="after-file" className="cursor-pointer text-center py-2 flex flex-col items-center gap-1.5 text-[#646973] hover:text-[#191A1E]">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
                          <Camera className="w-5 h-5" />
                        </div>
                        <span className="text-[12px] font-bold text-[#191A1E]">Unggah Foto Selesai</span>
                        <span className="text-[10px] text-[#9E998E]">Otomatis WebP (Max 1MB)</span>
                      </label>
                    )}
                    <input id="after-file" type="file" accept="image/*" className="sr-only" onChange={handleAfterImageChange} />
                  </div>
                </div>
              )}

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={saving || deleting}
                  className="w-full py-3.5 bg-[#1B4332] hover:bg-[#143628] text-white font-bold text-[13px] rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-emerald-300" />
                  <span>{saving ? 'Menyimpan...' : 'Simpan & Perbarui Status'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={saving || deleting}
                  className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 border border-red-200 font-bold text-xs rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Hapus permanen laporan spam atau duplikat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deleting ? 'Menghapus...' : 'Hapus Pengaduan Ini (Permanen)'}</span>
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>

      {/* ── CUSTOM DELETE CONFIRMATION MODAL ──────────── */}
      {showDeleteConfirm && report && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 space-y-4 border border-[#E6E2D8] shadow-2xl text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-bold text-base text-[#191A1E]">
                Hapus Pengaduan #{report.ticket_code}?
              </h3>
              <p className="text-xs text-[#646973] leading-relaxed">
                Apakah Anda yakin ingin menghapus permanen laporan ini? Data akan dihapus dari antrean, peta, dan database posko.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-full border border-[#E6E2D8] text-xs font-bold text-[#646973] hover:bg-[#FAF8F3] hover:text-[#191A1E] transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteAction}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
