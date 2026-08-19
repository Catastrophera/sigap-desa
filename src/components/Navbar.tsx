'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Plus, FileText, Map, CheckCircle2, UserCheck } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/',         label: 'Feed Laporan',        icon: FileText      },
  { href: '/peta',     label: 'Peta Sebaran',         icon: Map           },
  { href: '/histori',  label: 'Histori Penyelesaian', icon: CheckCircle2  },
];

export default function Navbar() {
  const pathname = usePathname();
  if (pathname.startsWith('/dashboard')) return null;

  return (
    <>
      {/* Skip to content – keyboard accessibility */}
      <a href="#main-content" className="skip-link">Langsung ke konten utama</a>

      <header
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm"
        role="banner"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ─────────────────────────────── */}
            <Link
              href="/"
              className="flex items-center gap-3 group focus:outline-none"
              aria-label="SIGAP Desa – Kembali ke Beranda"
            >
              <div className="w-9 h-9 rounded-xl bg-[#0F172A] flex items-center justify-center shadow-sm group-hover:bg-[#1E293B] transition-colors">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-bold text-[17px] tracking-tight text-[#0F172A]">SIGAP</span>
                  <span className="font-bold text-[17px] tracking-tight text-[#0369A1]">Desa</span>
                  <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 ml-0.5">
                    Publik
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal hidden sm:block leading-none mt-0.5">
                  Portal Pengaduan Fasilitas Desa
                </p>
              </div>
            </Link>

            {/* ── Primary Navigation ───────────────── */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Navigasi Utama">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={[
                      'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-bold transition-all min-h-[40px] cursor-pointer',
                      active
                        ? 'bg-[#0F172A] text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
                    ].join(' ')}
                  >
                    <Icon className={['w-4 h-4', active ? 'text-sky-400' : 'text-slate-400'].join(' ')} />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* ── CTA Cluster ──────────────────────── */}
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all min-h-[40px] cursor-pointer border border-slate-200"
              >
                <UserCheck className="w-4 h-4 text-slate-400" />
                Petugas Desa
              </Link>

              <Link
                href="/lapor"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0369A1] hover:bg-[#0284C7] text-white text-[13px] font-bold transition-all min-h-[40px] cursor-pointer shadow-sm shadow-sky-700/20 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Buat Laporan</span>
                <span className="sm:hidden">Lapor</span>
              </Link>
            </div>

          </div>
        </div>
      </header>
    </>
  );
}
