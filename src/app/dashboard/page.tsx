'use client';

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
  Flame,
  Search,
  Sparkles,
  FileText,
  UserCheck,
  BarChart3,
  TrendingUp,
  Activity,
  DollarSign,
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
} from 'lucide-react';
import { supabase, Aduan } from '@/lib/supabase';
import { LIST_DUSUN } from '@/lib/geo-config';
import { useToast } from '@/components/Toast';
import MapViewer from '@/components/MapViewer';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

      doc.setDrawColor(2, 132, 199);
      doc.setFillColor(240, 249, 255);
      doc.roundedRect(14, 34, 182, 15, 2, 2, 'FD');
      doc.setFontSize(8);
      doc.setTextColor(3, 105, 161);
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
          fillColor: [15, 23, 42],
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-900 selection:bg-sky-100 selection:text-sky-900">
      {/* TOPBAR COMMAND CENTER */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-black shadow-sm">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-base tracking-tight">COMMAND CENTER DESA</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800">
                    Staf Administrator
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  Pusat Pengendalian Penanganan Fasilitas & Musrenbangdes
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={fetchReports}
                disabled={refreshing}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                title="Segarkan Data"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={exportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer min-h-[38px]"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>CSV</span>
              </button>

              <button
                onClick={exportMusrenbangPDF}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer min-h-[38px]"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Cetak Musrenbangdes</span>
                <span className="sm:hidden">PDF</span>
              </button>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors border border-slate-700 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* DASHBOARD SUB-NAVBAR TABS */}
      <div className="bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar">
            <button
              onClick={() => setActiveTab('antrean')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                activeTab === 'antrean'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Antrean Cerdas & Tindakan ({reports.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('analitik')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                activeTab === 'analitik'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analitik & Distribusi Dusun</span>
            </button>

            <button
              onClick={() => setActiveTab('peta')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                activeTab === 'peta'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span>Peta Sebaran WebGIS</span>
            </button>

            <button
              onClick={() => setActiveTab('musrenbang')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                activeTab === 'musrenbang'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Bahan Rapat Musrenbangdes</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 4 HIGH-IMPACT METRIC KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Laporan</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900">{totalAduan}</div>
            <div className="text-[11px] text-slate-500 font-medium">Tercatat di seluruh dusun</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-red-700">
              <span className="text-xs font-bold uppercase tracking-wider">Mendesak / Darurat (ML)</span>
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-700">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-red-600">{prioritasTinggi}</div>
            <div className="text-[11px] text-red-700 font-medium">Butuh tindak lanjut segera</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-amber-50/30 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-xs font-bold uppercase tracking-wider">Sedang Dikerjakan</span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-amber-600">{sedangDitindak}</div>
            <div className="text-[11px] text-amber-700 font-medium">Petugas aktif di lapangan</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-xs font-bold uppercase tracking-wider">Tingkat Penyelesaian</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-600">{tingkatPenyelesaian}%</div>
            <div className="text-[11px] text-emerald-700 font-medium">{selesai} fasilitas tuntas diperbaiki</div>
          </div>
        </div>

        {/* TAB 1: ANTREAN & TINDAKAN INTERAKTIF */}
        {activeTab === 'antrean' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterDusun}
                  onChange={(e) => setFilterDusun(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none min-h-[38px] cursor-pointer"
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
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none min-h-[38px] cursor-pointer"
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
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none min-h-[38px] cursor-pointer"
                >
                  <option value="Semua">Semua Prioritas</option>
                  <option value="Tinggi">Prioritas Tinggi (Darurat)</option>
                  <option value="Sedang">Prioritas Sedang</option>
                  <option value="Rendah">Prioritas Rendah</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none min-h-[38px] cursor-pointer"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                  <option value="Sedang Ditindak">Sedang Ditindak</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>

              <div className="relative w-full sm:w-60">
                <input
                  type="text"
                  placeholder="Cari tiket, deskripsi, pelapor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-slate-800 min-h-[38px] focus:outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Split View: Tabel Antrean & Peta Spasial Cepat */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Table (8 Cols) */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[620px] overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Antrean Prioritas Berdasarkan Skor ML
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {filteredReports.length} Aduan Aktif
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {filteredReports.length === 0 ? (
                    <div className="text-center py-24 text-slate-400 text-xs font-bold">
                      Tidak ada aduan yang memenuhi filter.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 bg-slate-50 text-slate-600 font-black border-b border-slate-200 z-10">
                        <tr>
                          <th className="py-3 px-3.5">Tiket</th>
                          <th className="py-3 px-3.5">Prioritas & Kategori</th>
                          <th className="py-3 px-3.5">Dusun & Pelapor</th>
                          <th className="py-3 px-3.5">Ubah Status</th>
                          <th className="py-3 px-3.5 text-right">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredReports.map((report) => (
                          <tr
                            key={report.id}
                            onClick={() => setSelectedReportId(report.id)}
                            className={`transition-colors cursor-pointer ${
                              selectedReportId === report.id
                                ? 'bg-sky-50/70'
                                : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="py-3.5 px-3.5">
                              <span className="font-mono font-black text-slate-900 block">
                                #{report.ticket_code}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {new Date(report.created_at).toLocaleDateString('id-ID')}
                              </span>
                            </td>

                            <td className="py-3.5 px-3.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span
                                  className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-md ${
                                    report.prioritas === 'Tinggi'
                                      ? 'bg-red-50 text-red-700 border border-red-200'
                                      : report.prioritas === 'Sedang'
                                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {report.prioritas}
                                </span>
                              </div>
                              <div className="font-bold text-slate-900">{report.kategori}</div>
                            </td>

                            <td className="py-3.5 px-3.5">
                              <div className="font-bold text-slate-800">{report.dusun}</div>
                              <div className="text-[11px] text-slate-500 font-medium">
                                {report.nama_pelapor || 'Anonim'}
                              </div>
                            </td>

                            <td className="py-3.5 px-3.5" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={report.status}
                                disabled={updatingId === report.id}
                                onChange={(e: any) => handleQuickStatusChange(report.id, e.target.value)}
                                className={`text-[11px] font-bold rounded-lg px-2 py-1.5 border focus:outline-none cursor-pointer ${
                                  report.status === 'Selesai'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : report.status === 'Sedang Ditindak'
                                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                                    : 'bg-slate-50 text-slate-700 border-slate-300'
                                }`}
                              >
                                <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                                <option value="Sedang Ditindak">Sedang Ditindak</option>
                                <option value="Selesai">Selesai</option>
                              </select>
                            </td>

                            <td className="py-3.5 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setQuickDetailReport(report)}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                                  title="Pratinjau Cepat"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                <Link
                                  href={`/dashboard/aduan/${report.id}`}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer min-h-[32px]"
                                >
                                  <span>Kelola</span>
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
                  onMarkerClick={(rep) => setSelectedReportId(rep.id)}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ANALITIK & DISTRIBUSI DUSUN */}
        {activeTab === 'analitik' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Distribusi per Dusun */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-sky-600" />
                    Distribusi Beban Kerusakan per Wilayah Dusun
                  </h3>
                  <span className="text-xs text-slate-500 font-bold">{LIST_DUSUN.length} Dusun</span>
                </div>

                <div className="space-y-3.5">
                  {dusunStats.map((item) => {
                    const percent = totalAduan > 0 ? Math.round((item.total / totalAduan) * 100) : 0;
                    return (
                      <div key={item.dusun} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-800">{item.dusun}</span>
                          <span className="text-slate-500">
                            {item.total} Laporan ({item.urgent} Darurat • {item.done} Tuntas)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
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
                            title={`Sedang Berjalan`}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Distribusi per Kategori Fasilitas */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-emerald-600" />
                    Proporsi Jenis Fasilitas Publik Rusak
                  </h3>
                  <span className="text-xs text-slate-500 font-bold">100% Total</span>
                </div>

                <div className="space-y-4">
                  {kategoriStats.map((item) => (
                    <div key={item.kategori} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800">{item.kategori}</span>
                        <span className="text-slate-900 font-black">{item.total} Titik ({item.percentage}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.kategori === 'Jalan & Jembatan'
                              ? 'bg-amber-500'
                              : item.kategori === 'Penerangan Jalan'
                              ? 'bg-yellow-500'
                              : item.kategori === 'Drainase & Irigasi'
                              ? 'bg-sky-500'
                              : item.kategori === 'Air Bersih & Sanitasi'
                              ? 'bg-cyan-500'
                              : item.kategori === 'Persampahan & Lingkungan'
                              ? 'bg-emerald-500'
                              : item.kategori === 'Gedung & Sarana Publik'
                              ? 'bg-indigo-500'
                              : item.kategori === 'Bencana & Darurat'
                              ? 'bg-red-500'
                              : 'bg-slate-500'
                          }`}
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

        {/* TAB 3: PETA WEBGIS LENGKAP */}
        {activeTab === 'peta' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <MapIcon className="w-4 h-4 text-sky-600" />
                  Peta Spasial Command Center Desa
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Klik titik marker untuk menginspeksi foto lapangan dan data pelapor langsung di peta.
                </p>
              </div>
            </div>

            <MapViewer
              reports={filteredReports}
              selectedReportId={selectedReportId}
              heightClass="h-[620px]"
              isAdmin={true}
              onMarkerClick={(rep) => setSelectedReportId(rep.id)}
            />
          </div>
        )}

        {/* TAB 4: REKAPITULASI MUSRENBANGDES */}
        {activeTab === 'musrenbang' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-600" />
                  Format Dokumen Rencana Usulan APBDes (Musrenbangdes)
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Tabel prioritas resmi yang telah diurutkan berdasarkan tingkat urgensi untuk rapat musyawarah desa.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportMusrenbangPDF}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Dokumen Resmi PDF</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-black border-b border-slate-200">
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
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.map((report, idx) => (
                    <tr key={report.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-black text-slate-900">#{report.ticket_code}</td>
                      <td className="py-3 px-3 font-bold text-slate-800">{report.dusun}</td>
                      <td className="py-3 px-3">{report.kategori}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-md ${
                            report.prioritas === 'Tinggi'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : report.prioritas === 'Sedang'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          Prioritas {report.prioritas}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-xs text-slate-700 line-clamp-2">
                        {report.deskripsi}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-700">{report.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* QUICK DETAIL MODAL DRAWER */}
      {quickDetailReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-black text-sky-600 bg-sky-50 px-2 py-1 rounded-md">
                  #{quickDetailReport.ticket_code}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {quickDetailReport.kategori} ({quickDetailReport.dusun})
                </h3>
              </div>
              <button
                onClick={() => setQuickDetailReport(null)}
                className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {quickDetailReport.foto_url && (
              <div className="h-48 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <img src={quickDetailReport.foto_url} alt="Foto Kerusakan" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 font-bold block mb-0.5">Deskripsi Kerusakan:</span>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-800 leading-relaxed">
                  {quickDetailReport.deskripsi}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Pelapor:</span>
                  <span className="font-bold text-slate-900">{quickDetailReport.nama_pelapor || 'Anonim'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Kontak WhatsApp:</span>
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
                    <span className="text-slate-400">Tidak ada</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setQuickDetailReport(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
              >
                Tutup
              </button>
              <Link
                href={`/dashboard/aduan/${quickDetailReport.id}`}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black transition-colors cursor-pointer"
              >
                Buka Halaman Tindakan Penuh →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
