'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Filter,
  LogOut,
  RefreshCw,
  Eye,
  ExternalLink,
  ChevronRight,
  MapPin,
  Search,
  Sparkles,
  FileText,
  UserCheck,
  BarChart3,
  TrendingUp,
  Activity,
  Layers,
  Map as MapIcon,
  CheckSquare,
  MessageCircle,
  Calendar,
  PieChart,
  Users,
  AlertOctagon,
  Printer,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import { supabase, Aduan } from '@/lib/supabase';
import { LIST_DUSUN } from '@/lib/geo-config';
import { useToast } from '@/components/Toast';
import nextDynamic from 'next/dynamic';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MapViewer = nextDynamic(() => import('@/components/MapViewer'), {
  ssr: false,
  loading: () => (
    <div className="h-[550px] w-full rounded-3xl bg-[#FAF8F3] border border-[#E6E2D8] flex items-center justify-center text-[#646973] text-xs font-bold">
      Memuat WebGIS Command Center…
    </div>
  ),
});

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [reports, setReports] = useState<Aduan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active Admin View Tab
  const [activeTab, setActiveTab] = useState<'antrean' | 'analitik' | 'musrenbang' | 'peta'>('antrean');

  // Filters & State
  const [filterDusun, setFilterDusun] = useState('Semua');
  const [filterKategori, setFilterKategori] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterPrioritas, setFilterPrioritas] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Quick Action Modal / Detail Drawer
  const [quickDetailReport, setQuickDetailReport] = useState<Aduan | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchReports = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('aduan')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
      } else {
        setReports(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('sigap_demo_admin');
    await supabase.auth.signOut();
    showToast('Berhasil keluar dari Command Center', 'info');
    router.push('/login');
  };

  // Quick Status Update in 1-Click
  const handleQuickStatusChange = async (reportId: string, newStatus: 'Menunggu Verifikasi' | 'Sedang Ditindak' | 'Selesai') => {
    setUpdatingId(reportId);
    try {
      const { error } = await supabase
        .from('aduan')
        .update({ status: newStatus })
        .eq('id', reportId);

      if (error) throw error;

      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
      showToast(`Status tiket berhasil diubah menjadi: ${newStatus}`, 'success');
      if (quickDetailReport && quickDetailReport.id === reportId) {
        setQuickDetailReport({ ...quickDetailReport, status: newStatus });
      }
    } catch (e: any) {
      showToast('Gagal mengubah status: ' + e.message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const sortedReports = useMemo(() => {
    const priorityWeight: { [key: string]: number } = {
      Tinggi: 3,
      Sedang: 2,
      Rendah: 1,
    };

    return [...reports].sort((a, b) => {
      const statusWeight: { [key: string]: number } = {
        'Menunggu Verifikasi': 3,
        'Sedang Ditindak': 2,
        Selesai: 1,
      };

      if (statusWeight[a.status] !== statusWeight[b.status]) {
        return statusWeight[b.status] - statusWeight[a.status];
      }

      return (priorityWeight[b.prioritas] || 0) - (priorityWeight[a.prioritas] || 0);
    });
  }, [reports]);

  const filteredReports = useMemo(() => {
    return sortedReports.filter((r) => {
      const matchDusun = filterDusun === 'Semua' || r.dusun === filterDusun;
      const matchKat = filterKategori === 'Semua' || r.kategori === filterKategori;
      const matchStatus = filterStatus === 'Semua' || r.status === filterStatus;
      const matchPrio = filterPrioritas === 'Semua' || r.prioritas === filterPrioritas;
      const matchSearch =
        searchQuery === '' ||
        r.ticket_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.nama_pelapor && r.nama_pelapor.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchDusun && matchKat && matchStatus && matchPrio && matchSearch;
    });
  }, [sortedReports, filterDusun, filterKategori, filterStatus, filterPrioritas, searchQuery]);

  // Comprehensive Metrics
  const totalAduan = reports.length;
  const prioritasTinggi = reports.filter((r) => r.prioritas === 'Tinggi' && r.status !== 'Selesai').length;
  const sedangDitindak = reports.filter((r) => r.status === 'Sedang Ditindak').length;
  const selesai = reports.filter((r) => r.status === 'Selesai').length;
  const tingkatPenyelesaian = totalAduan > 0 ? Math.round((selesai / totalAduan) * 100) : 0;

  // Breakdown per Dusun
  const dusunStats = useMemo(() => {
    return LIST_DUSUN.map((d) => {
      const list = reports.filter((r) => r.dusun === d);
      const urgentCount = list.filter((r) => r.prioritas === 'Tinggi' && r.status !== 'Selesai').length;
      const doneCount = list.filter((r) => r.status === 'Selesai').length;
      return {
        dusun: d,
        total: list.length,
        urgent: urgentCount,
        done: doneCount,
      };
    }).sort((a, b) => b.total - a.total);
  }, [reports]);

  // Breakdown per Kategori (8 AI Categories)
  const kategoriStats = useMemo(() => {
    const categories = [
      'Jalan & Jembatan',
      'Penerangan Jalan',
      'Drainase & Irigasi',
      'Air Bersih & Sanitasi',
      'Persampahan & Lingkungan',
      'Gedung & Sarana Publik',
      'Bencana & Darurat',
      'Masalah Lainnya',
    ];
    return categories.map((cat) => {
      const list = reports.filter((r) => r.kategori === cat);
      return {
        kategori: cat,
        total: list.length,
        percentage: totalAduan > 0 ? Math.round((list.length / totalAduan) * 100) : 0,
      };
    }).sort((a, b) => b.total - a.total);
  }, [reports, totalAduan]);

  // Export Musrenbangdes PDF
  const exportMusrenbangPDF = () => {
    try {
      const doc = new jsPDF();

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PEMERINTAH DESA - SISTEM SIGAP DESA', 14, 18);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(70);
      doc.text('REKAPITULASI PRIORITAS USULAN KERUSAKAN FASILITAS DESA (BAHAN MUSRENBANGDES)', 14, 24);
      doc.text(`Tanggal Rekapitulasi: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`, 14, 30);

      doc.setDrawColor(217, 119, 6);
      doc.setFillColor(254, 243, 199);
      doc.roundedRect(14, 34, 182, 15, 2, 2, 'FD');
      doc.setFontSize(8);
      doc.setTextColor(146, 64, 14);
      doc.text(`Total Laporan: ${totalAduan} | Urgent/Darurat: ${prioritasTinggi} | Sedang Dikerjakan: ${sedangDitindak} | Tuntas: ${selesai} (${tingkatPenyelesaian}%)`, 18, 43);

      const tableData = filteredReports.map((r, i) => [
        i + 1,
        r.ticket_code,
        r.dusun,
        r.kategori,
        r.prioritas,
        r.status,
        r.deskripsi.substring(0, 45) + (r.deskripsi.length > 45 ? '...' : ''),
        new Date(r.created_at).toLocaleDateString('id-ID'),
      ]);

      autoTable(doc, {
        startY: 53,
        head: [['No', 'Kode Tiket', 'Dusun', 'Kategori', 'Prioritas', 'Status', 'Deskripsi Kerusakan', 'Tanggal']],
        body: tableData,
        headStyles: {
          fillColor: [25, 26, 30],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
        },
        styles: {
          fontSize: 7,
          cellPadding: 2,
        },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 20 },
          2: { cellWidth: 22 },
          3: { cellWidth: 25 },
          4: { cellWidth: 16 },
          5: { cellWidth: 22 },
          6: { cellWidth: 50 },
          7: { cellWidth: 19 },
        },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 15;
      if (finalY < 250) {
        doc.setFontSize(8);
        doc.setTextColor(40);
        doc.text('Mengetahui / Mengesahkan,', 140, finalY);
        doc.text('Kepala Desa / Ketua BPD', 140, finalY + 5);
        doc.text('(................................................)', 140, finalY + 25);
      }

      doc.save(`SIGAP-DESA_Musrenbangdes_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast('Berkas PDF Musrenbangdes berhasil diunduh.', 'success');
    } catch (e: any) {
      showToast('Gagal mencetak PDF: ' + e.message, 'error');
    }
  };

  // Export CSV
  const exportCSV = () => {
    try {
      const headers = ['No,Kode_Tiket,Pelapor,Kontak,Dusun,Kategori,Prioritas,Status,Deskripsi,Latitude,Longitude,Tanggal'];
      const rows = filteredReports.map((r, i) => [
        i + 1,
        r.ticket_code,
        `"${r.nama_pelapor || ''}"`,
        `"${r.kontak_pelapor || ''}"`,
        `"${r.dusun}"`,
        `"${r.kategori}"`,
        r.prioritas,
        r.status,
        `"${r.deskripsi.replace(/"/g, '""')}"`,
        r.latitude,
        r.longitude,
        new Date(r.created_at).toISOString(),
      ].join(','));

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `SIGAP-DESA_Data-Aduan_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Data CSV berhasil diekspor.', 'success');
    } catch (e: any) {
      showToast('Gagal mengekspor CSV: ' + e.message, 'error');
    }
  };

  return (
    <div id="main-content" className="min-h-screen bg-[#FAF8F3] flex flex-col text-[#191A1E]">
      {/* ── TOPBAR COMMAND CENTER ──────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#191A1E] text-white border-b border-[#2D2F36] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold shadow-xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-base tracking-tight text-[#FAF8F3]">COMMAND CENTER DESA</span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Staf Teknis
                  </span>
                </div>
                <span className="text-[11px] text-[#9E998E] hidden sm:block">
                  Pengendalian Fasilitas Publik &amp; Usulan Musrenbangdes
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              <button
                onClick={fetchReports}
                disabled={refreshing}
                className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-[#FAF8F3] transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                title="Segarkan Data"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={exportCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-[#FAF8F3] rounded-full text-xs font-bold transition-all cursor-pointer min-h-[38px]"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>CSV</span>
              </button>

              <button
                onClick={exportMusrenbangPDF}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1B4332] hover:bg-[#143628] text-white rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer min-h-[38px]"
              >
                <Download className="w-4 h-4 text-emerald-300" />
                <span className="hidden sm:inline">Cetak Musrenbangdes</span>
                <span className="sm:hidden">PDF</span>
              </button>

              <button
                onClick={handleLogout}
                className="p-2 rounded-full bg-white/10 hover:bg-red-900 text-white/70 hover:text-white transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center ml-1"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── SUB-NAVBAR TABS ──────────────────────────── */}
      <div className="bg-white border-b border-[#E6E2D8] sticky top-16 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar">
            <button
              onClick={() => setActiveTab('antrean')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                activeTab === 'antrean'
                  ? 'bg-[#1B4332] text-white shadow-xs'
                  : 'text-[#646973] hover:text-[#191A1E] hover:bg-[#FAF8F3]'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Antrean Cerdas &amp; Tindakan ({reports.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('analitik')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                activeTab === 'analitik'
                  ? 'bg-[#1B4332] text-white shadow-xs'
                  : 'text-[#646973] hover:text-[#191A1E] hover:bg-[#FAF8F3]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analitik &amp; Beban Dusun</span>
            </button>

            <button
              onClick={() => setActiveTab('peta')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                activeTab === 'peta'
                  ? 'bg-[#1B4332] text-white shadow-xs'
                  : 'text-[#646973] hover:text-[#191A1E] hover:bg-[#FAF8F3]'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span>Peta Spasial WebGIS</span>
            </button>

            <button
              onClick={() => setActiveTab('musrenbang')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                activeTab === 'musrenbang'
                  ? 'bg-[#1B4332] text-white shadow-xs'
                  : 'text-[#646973] hover:text-[#191A1E] hover:bg-[#FAF8F3]'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Format Musrenbangdes</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* 4 High-Impact KPI Bento Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-[#E6E2D8] shadow-card-soft space-y-2">
            <div className="flex items-center justify-between text-[#646973]">
              <span className="text-xs font-bold uppercase tracking-wider">Total Laporan</span>
              <div className="w-8 h-8 rounded-xl bg-[#FAF8F3] border border-[#E6E2D8] flex items-center justify-center text-[#191A1E]">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="font-display text-3xl font-bold text-[#191A1E]">{totalAduan}</div>
            <div className="text-[11px] text-[#646973]">Tercatat di 15 dusun</div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-red-200 bg-red-50/30 shadow-card-soft space-y-2">
            <div className="flex items-center justify-between text-red-700">
              <span className="text-xs font-bold uppercase tracking-wider">Prioritas Tinggi (AI)</span>
              <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center text-red-700">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>
            <div className="font-display text-3xl font-bold text-red-600">{prioritasTinggi}</div>
            <div className="text-[11px] text-red-700">Perlu tindak lanjut segera</div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-emerald-300 bg-emerald-50/50 shadow-card-soft space-y-2">
            <div className="flex items-center justify-between text-emerald-900">
              <span className="text-xs font-bold uppercase tracking-wider">Sedang Ditindak</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="font-display text-3xl font-bold text-emerald-700">{sedangDitindak}</div>
            <div className="text-[11px] text-emerald-800">Pengerjaan di lapangan</div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-emerald-200 bg-emerald-50/30 shadow-card-soft space-y-2">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-xs font-bold uppercase tracking-wider">Tingkat Tuntas</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="font-display text-3xl font-bold text-emerald-700">{tingkatPenyelesaian}%</div>
            <div className="text-[11px] text-emerald-800">{selesai} fasilitas tuntas</div>
          </div>
        </div>

        {/* TAB 1: ANTREAN & TINDAKAN */}
        {activeTab === 'antrean' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E6E2D8] shadow-card-soft flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterDusun}
                  onChange={(e) => setFilterDusun(e.target.value)}
                  className="bg-[#FAF8F3] border border-[#E6E2D8] rounded-full px-4 py-2 text-[#191A1E] font-bold focus:outline-none cursor-pointer"
                >
                  <option value="Semua">Semua Dusun</option>
                  {LIST_DUSUN.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <select
                  value={filterKategori}
                  onChange={(e) => setFilterKategori(e.target.value)}
                  className="bg-[#FAF8F3] border border-[#E6E2D8] rounded-full px-4 py-2 text-[#191A1E] font-bold focus:outline-none cursor-pointer"
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

                <select
                  value={filterPrioritas}
                  onChange={(e) => setFilterPrioritas(e.target.value)}
                  className="bg-[#FAF8F3] border border-[#E6E2D8] rounded-full px-4 py-2 text-[#191A1E] font-bold focus:outline-none cursor-pointer"
                >
                  <option value="Semua">Semua Prioritas</option>
                  <option value="Tinggi">Prioritas Tinggi (Darurat)</option>
                  <option value="Sedang">Prioritas Sedang</option>
                  <option value="Rendah">Prioritas Rendah</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-[#FAF8F3] border border-[#E6E2D8] rounded-full px-4 py-2 text-[#191A1E] font-bold focus:outline-none cursor-pointer"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                  <option value="Sedang Ditindak">Sedang Ditindak</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Cari tiket, isu, nama warga..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#FAF8F3] border border-[#E6E2D8] rounded-full text-xs text-[#191A1E] focus:outline-none focus:border-[#191A1E]"
                />
                <Search className="w-4 h-4 text-[#9E998E] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Table (8 Cols) */}
              <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E6E2D8] shadow-card-soft flex flex-col h-[620px] overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-[#E6E2D8] flex items-center justify-between bg-[#FAF8F3]/60">
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-[#191A1E]">
                    Antrean Prioritas Cerdas (Hasil Prediksi AI)
                  </span>
                  <span className="text-xs font-mono font-bold text-[#646973]">
                    {filteredReports.length} Aduan
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {filteredReports.length === 0 ? (
                    <div className="text-center py-24 text-[#9E998E] text-xs font-bold">
                      Tidak ada aduan yang memenuhi filter.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 bg-[#FAF8F3] text-[#646973] font-bold border-b border-[#E6E2D8] z-10">
                        <tr>
                          <th className="py-3.5 px-4">Tiket</th>
                          <th className="py-3.5 px-4">Prioritas &amp; Sektor</th>
                          <th className="py-3.5 px-4">Dusun &amp; Pelapor</th>
                          <th className="py-3.5 px-4">Ubah Status Cepat</th>
                          <th className="py-3.5 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6E2D8]">
                        {filteredReports.map((report) => (
                          <tr
                            key={report.id}
                            onClick={() => setSelectedReportId(report.id)}
                            className={`transition-colors cursor-pointer ${
                              selectedReportId === report.id
                                ? 'bg-amber-50/60'
                                : 'hover:bg-[#FAF8F3]'
                            }`}
                          >
                            <td className="py-3.5 px-4">
                              <span className="font-mono font-bold text-[#191A1E] block">
                                #{report.ticket_code}
                              </span>
                              <span className="text-[10px] text-[#646973]">
                                {new Date(report.created_at).toLocaleDateString('id-ID')}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span
                                  className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    report.prioritas === 'Tinggi'
                                      ? 'bg-red-50 text-red-700 border border-red-200'
                                      : report.prioritas === 'Sedang'
                                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                      : 'bg-stone-100 text-stone-700'
                                  }`}
                                >
                                  {report.prioritas}
                                </span>
                              </div>
                              <div className="font-bold text-[#191A1E]">{report.kategori}</div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#191A1E]">{report.dusun}</div>
                              <div className="text-[11px] text-[#646973]">
                                {report.nama_pelapor || 'Anonim'}
                              </div>
                            </td>

                            <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={report.status}
                                disabled={updatingId === report.id}
                                onChange={(e: any) => handleQuickStatusChange(report.id, e.target.value)}
                                className={`text-[11px] font-bold rounded-full px-3 py-1.5 border focus:outline-none cursor-pointer ${
                                  report.status === 'Selesai'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : report.status === 'Sedang Ditindak'
                                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                                    : 'bg-stone-100 text-stone-700 border-stone-300'
                                }`}
                              >
                                <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                                <option value="Sedang Ditindak">Sedang Ditindak</option>
                                <option value="Selesai">Selesai</option>
                              </select>
                            </td>

                            <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setQuickDetailReport(report)}
                                  className="p-2 rounded-full border border-[#E6E2D8] hover:bg-[#FAF8F3] text-[#191A1E] cursor-pointer"
                                  title="Pratinjau Cepat"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                <Link
                                  href={`/dashboard/aduan/${report.id}`}
                                  className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-[#191A1E] hover:bg-[#2D2F36] text-white rounded-full text-xs font-bold transition-colors cursor-pointer"
                                >
                                  <span>Tindak</span>
                                  <ChevronRight className="w-3 h-3" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Map Split (4 Cols) */}
              <div className="lg:col-span-4 h-[620px]">
                <MapViewer
                  reports={filteredReports}
                  selectedReportId={selectedReportId}
                  heightClass="h-full"
                  isAdmin={true}
                  theme="light"
                  onMarkerClick={(rep) => setSelectedReportId(rep.id)}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ANALITIK */}
        {activeTab === 'analitik' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dusun distribution */}
              <div className="bg-white p-6 rounded-3xl border border-[#E6E2D8] shadow-card-soft space-y-4">
                <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-3">
                  <h3 className="font-display font-bold text-sm text-[#191A1E] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    Distribusi Beban Kerusakan per Wilayah Dusun
                  </h3>
                  <span className="text-xs text-[#646973] font-bold">{LIST_DUSUN.length} Dusun</span>
                </div>

                <div className="space-y-3.5">
                  {dusunStats.map((item) => (
                    <div key={item.dusun} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[#191A1E]">{item.dusun}</span>
                        <span className="text-[#646973]">
                          {item.total} Laporan ({item.urgent} Darurat • {item.done} Tuntas)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-[#FAF8F3] border border-[#E6E2D8] rounded-full overflow-hidden flex">
                        <div
                          className="bg-red-500 h-full"
                          style={{ width: `${totalAduan > 0 ? (item.urgent / totalAduan) * 100 : 0}%` }}
                          title={`${item.urgent} Darurat`}
                        ></div>
                        <div
                          className="bg-emerald-500 h-full"
                          style={{ width: `${totalAduan > 0 ? (item.done / totalAduan) * 100 : 0}%` }}
                          title={`${item.done} Tuntas`}
                        ></div>
                        <div
                          className="bg-amber-400 h-full"
                          style={{ width: `${totalAduan > 0 ? ((item.total - item.urgent - item.done) / totalAduan) * 100 : 0}%` }}
                          title="Sedang Berjalan"
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category distribution */}
              <div className="bg-white p-6 rounded-3xl border border-[#E6E2D8] shadow-card-soft space-y-4">
                <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-3">
                  <h3 className="font-display font-bold text-sm text-[#191A1E] flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-emerald-600" />
                    Proporsi Jenis Fasilitas Publik Rusak
                  </h3>
                  <span className="text-xs text-[#646973] font-bold">100% Total</span>
                </div>

                <div className="space-y-4">
                  {kategoriStats.map((item) => (
                    <div key={item.kategori} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[#191A1E]">{item.kategori}</span>
                        <span className="text-[#191A1E] font-bold">{item.total} Titik ({item.percentage}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-[#FAF8F3] border border-[#E6E2D8] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#191A1E]"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PETA WEBGIS */}
        {activeTab === 'peta' && (
          <div className="bg-white p-6 rounded-3xl border border-[#E6E2D8] shadow-card-soft space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-3">
              <div>
                <h3 className="font-display font-bold text-sm text-[#191A1E] flex items-center gap-2">
                  <MapIcon className="w-4 h-4 text-amber-600" />
                  Peta Spasial Command Center Desa
                </h3>
                <p className="text-xs text-[#646973]">
                  Klik titik marker untuk menginspeksi foto lapangan dan data pelapor langsung di peta.
                </p>
              </div>
            </div>

            <MapViewer
              reports={filteredReports}
              selectedReportId={selectedReportId}
              heightClass="h-[620px]"
              isAdmin={true}
              theme="light"
              onMarkerClick={(rep) => setSelectedReportId(rep.id)}
            />
          </div>
        )}

        {/* TAB 4: REKAPITULASI MUSRENBANGDES */}
        {activeTab === 'musrenbang' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E6E2D8] shadow-card-soft space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6E2D8] pb-4">
              <div>
                <h3 className="font-display font-bold text-base text-[#191A1E] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  Format Dokumen Rencana Usulan APBDes (Musrenbangdes)
                </h3>
                <p className="text-xs text-[#646973] mt-0.5">
                  Tabel prioritas resmi yang telah diurutkan berdasarkan skor Machine Learning untuk musyawarah desa.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportMusrenbangPDF}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#191A1E] hover:bg-[#2D2F36] text-white rounded-full text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>Cetak Dokumen Resmi PDF</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF8F3] text-[#646973] font-bold border-b border-[#E6E2D8]">
                  <tr>
                    <th className="py-3 px-3">No</th>
                    <th className="py-3 px-3">Kode Tiket</th>
                    <th className="py-3 px-3">Wilayah Dusun</th>
                    <th className="py-3 px-3">Kategori Fasilitas</th>
                    <th className="py-3 px-3">Skor Urgensi (AI)</th>
                    <th className="py-3 px-3">Rekomendasi Penanganan</th>
                    <th className="py-3 px-3">Status Saat Ini</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E2D8]">
                  {filteredReports.map((report, idx) => (
                    <tr key={report.id} className="hover:bg-[#FAF8F3]">
                      <td className="py-3 px-3 font-bold text-[#646973]">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#191A1E]">#{report.ticket_code}</td>
                      <td className="py-3 px-3 font-bold text-[#191A1E]">{report.dusun}</td>
                      <td className="py-3 px-3">{report.kategori}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            report.prioritas === 'Tinggi'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : report.prioritas === 'Sedang'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          Prioritas {report.prioritas}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-xs text-[#646973] line-clamp-2">
                        {report.deskripsi}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-[#191A1E]">{report.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ── QUICK DETAIL MODAL DRAWER ────────────────── */}
      {quickDetailReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl sm:rounded-4xl shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-4 border border-[#E6E2D8]">
            <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-[#191A1E] bg-[#FAF8F3] border border-[#E6E2D8] px-2.5 py-1 rounded-full">
                  #{quickDetailReport.ticket_code}
                </span>
                <h3 className="font-display font-bold text-base text-[#191A1E] mt-1.5">
                  {quickDetailReport.kategori} ({quickDetailReport.dusun})
                </h3>
              </div>
              <button
                onClick={() => setQuickDetailReport(null)}
                className="w-8 h-8 rounded-full bg-[#FAF8F3] hover:bg-[#E6E2D8] text-[#646973] flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {quickDetailReport.foto_url && (
              <div className="h-52 w-full rounded-2xl overflow-hidden bg-[#FAF8F3] border border-[#E6E2D8]">
                <img src={quickDetailReport.foto_url} alt="Foto Kerusakan" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#646973] font-bold block mb-1">Deskripsi Kerusakan:</span>
                <p className="p-3.5 bg-[#FAF8F3] rounded-2xl text-[#191A1E] leading-relaxed border border-[#E6E2D8]">
                  {quickDetailReport.deskripsi}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[#646973] font-bold block mb-0.5">Pelapor:</span>
                  <span className="font-bold text-[#191A1E]">{quickDetailReport.nama_pelapor || 'Anonim'}</span>
                </div>
                <div>
                  <span className="text-[#646973] font-bold block mb-0.5">Kontak WhatsApp:</span>
                  {quickDetailReport.kontak_pelapor ? (
                    <a
                      href={`https://wa.me/${quickDetailReport.kontak_pelapor.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> {quickDetailReport.kontak_pelapor}
                    </a>
                  ) : (
                    <span className="text-[#9E998E]">Tidak ada</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E6E2D8] flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setQuickDetailReport(null)}
                className="px-4 py-2 text-[#646973] hover:text-[#191A1E] font-bold cursor-pointer"
              >
                Tutup
              </button>
              <Link
                href={`/dashboard/aduan/${quickDetailReport.id}`}
                className="px-5 py-2.5 bg-[#191A1E] hover:bg-[#2D2F36] text-white rounded-full font-bold transition-colors cursor-pointer"
              >
                Kelola Tindakan Lengkap →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
