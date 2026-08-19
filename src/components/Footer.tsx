'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

const FOOTER_LINKS = [
  { href: '/',            label: 'Feed Laporan'         },
  { href: '/peta',        label: 'Peta Sebaran'          },
  { href: '/histori',     label: 'Histori Penyelesaian'  },
  { href: '/lapor',       label: 'Buat Laporan', accent: true },
  { href: '/transparansi',label: 'Transparansi Desa'     },
  { href: '/login',       label: 'Portal Staf Desa'      },
];

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith('/dashboard')) return null;

  return (
    <footer className="bg-[#0F172A] text-white border-t border-slate-800 mt-auto" role="contentinfo">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-8">

        {/* ── Top: Brand + Links ───────────────────── */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          {/* Brand */}
          <div className="max-w-xs space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0369A1] flex items-center justify-center">
                <ShieldCheck className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-base text-white">SIGAP</span>
                <span className="font-bold text-base text-sky-400">Desa</span>
              </div>
            </div>
            <p className="text-[13px] text-slate-400 leading-relaxed">
              Sistem Pengaduan &amp; Penanganan Fasilitas Publik Desa secara digital, transparan, dan akuntabel.
            </p>
          </div>

          {/* Nav Grid */}
          <nav aria-label="Navigasi Footer" className="flex flex-wrap items-center gap-x-8 gap-y-2">
            {FOOTER_LINKS.map(({ href, label, accent }) => (
              <Link
                key={href}
                href={href}
                className={[
                  'text-[13px] font-bold transition-colors min-h-[36px] flex items-center',
                  accent ? 'text-sky-400 hover:text-sky-300' : 'text-slate-400 hover:text-white',
                ].join(' ')}
              >
                {accent && '+ '}{label}
              </Link>
            ))}
          </nav>
        </div>

        {/* ── Bottom: Copyright ─────────────────────── */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-[12px] text-slate-500">
          <p>© {new Date().getFullYear()} SIGAP Desa. Portal Layanan Publik Desa Terbuka.</p>
          <p>Mendukung transparansi APBDes &amp; efisiensi Musrenbangdes.</p>
        </div>

      </div>
    </footer>
  );
}
