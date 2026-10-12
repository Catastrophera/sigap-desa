'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, ArrowUpRight, MapPin } from 'lucide-react';

const FOOTER_LINKS = [
  { href: '/',             label: 'Feed Laporan Publik'   },
  { href: '/peta',         label: 'Peta Sebaran WebGIS'   },
  { href: '/histori',      label: 'Histori Penyelesaian'  },
  { href: '/transparansi', label: 'Transparansi Kinerja'  },
  { href: '/lapor',        label: 'Buat Laporan Baru', accent: true },
  { href: '/login',        label: 'Portal Staf Ketintang' },
];

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith('/dashboard')) return null;

  return (
    <footer className="bg-[#191A1E] text-[#FAF8F3] border-t border-[#2D2F36] mt-auto relative overflow-hidden" role="contentinfo">
      {/* Subtle background ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 relative z-10 space-y-12">

        {/* ── Top Grid ───────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#EA580C] border border-orange-500/40 flex items-center justify-center">
                <ShieldCheck className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-display font-bold text-lg text-white">SIGAP</span>
                <span className="text-slate-400 font-medium text-lg">-</span>
                <span className="font-display font-semibold text-lg text-orange-400">Ketintang</span>
              </div>
            </div>
            <p className="text-[13px] text-slate-400 max-w-sm leading-relaxed">
              Platform layanan pengaduan dan pemantauan fasilitas publik Kelurahan Ketintang, Gayungan, Surabaya berbasis klasifikasi Machine Learning dan Geospasial terpadu.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#24262B] border border-[#343840] text-[11px] text-orange-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              Fokus Wilayah Ketintang, Kota Surabaya
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-4 space-y-3">
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-slate-400">
              Navigasi Halaman
            </h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.map(({ href, label, accent }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`text-[13px] font-medium transition-colors inline-flex items-center gap-1 group ${
                      accent ? 'text-orange-400 hover:text-orange-300' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>{label}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Civic Info Card */}
          <div className="md:col-span-3 bg-[#24262B] border border-[#343840] rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[12px] font-bold text-orange-400">
              <MapPin className="w-4 h-4" />
              <span>Kelurahan Ketintang</span>
            </div>
            <p className="text-[12px] text-slate-300 leading-relaxed">
              Kecamatan Gayungan, Kota Surabaya, Jawa Timur. Mendukung pelayanan tanggap cepat dan partisipasi warga.
            </p>
          </div>

        </div>

        {/* ── Bottom Copyright ───────────────────────── */}
        <div className="pt-8 border-t border-[#2D2F36] flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-slate-400">
          <p>© {new Date().getFullYear()} SIGAP - Ketintang · Layanan &amp; Penanganan Fasilitas Terbuka Surabaya.</p>
          <p className="flex items-center gap-1.5">
            Dibuat untuk kenyamanan &amp; kemajuan warga Ketintang.
          </p>
        </div>

      </div>
    </footer>
  );
}
