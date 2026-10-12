'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Plus, FileText, Map, CheckCircle2, UserCheck, Menu, X, ArrowUpRight } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/',            label: 'Beranda & Feed',      icon: FileText      },
  { href: '/peta',        label: 'Peta Sebaran',         icon: Map           },
  { href: '/histori',     label: 'Histori Penanganan',   icon: CheckCircle2  },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (pathname.startsWith('/dashboard')) return null;

  return (
    <>
      <a href="#main-content" className="skip-link">Langsung ke konten utama</a>

      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 sm:px-6 ${
          isScrolled ? 'py-3' : 'py-5'
        }`}
        role="banner"
      >
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-full px-3.5 sm:px-5 py-2.5 sm:py-3 shadow-md flex items-center justify-between border border-[#E6E2D8]">

            {/* ── Brand Logo ─────────────────────────────── */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus:outline-none"
              aria-label="SIGAP - Ketintang – Kembali ke Beranda"
            >
              <div className="w-8 h-8 rounded-full bg-[#EA580C] flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-xs">
                <ShieldCheck className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-display font-extrabold text-[17px] tracking-tight text-[#191A1E]">SIGAP</span>
                <span className="text-[#9E998E] font-medium text-[16px]">-</span>
                <span className="font-display font-semibold text-[17px] tracking-tight text-[#EA580C]">Ketintang</span>
                <span className="hidden md:inline-block text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200 ml-1">
                  Surabaya
                </span>
              </div>
            </Link>

            {/* ── Desktop Pill Navigation ─────────────────── */}
            <nav className="hidden lg:flex items-center gap-1 bg-[#F4F1EA] p-1 rounded-full border border-[#E6E2D8]" aria-label="Navigasi Utama">
              {NAV_ITEMS.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
                      active
                        ? 'bg-[#EA580C] text-white shadow-xs'
                        : 'text-[#474B53] hover:text-[#191A1E] hover:bg-white'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* ── Actions Cluster ─────────────────────────── */}
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold text-[#474B53] hover:text-[#191A1E] hover:bg-[#F4F1EA] transition-all cursor-pointer border border-[#E6E2D8]"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#EA580C]" />
                <span>Staf Ketintang</span>
              </Link>

              <Link
                href="/lapor"
                className="inline-flex items-center gap-2 px-4 py-1.5 sm:py-2 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white text-[13px] font-bold transition-all shadow-md active:scale-95 group cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-orange-200 group-hover:rotate-90 transition-transform duration-200" />
                <span className="hidden xs:inline">Buat Laporan</span>
                <span className="xs:hidden">Lapor</span>
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center ml-0.5 group-hover:translate-x-0.5 transition-transform">
                  <ArrowUpRight className="w-3 h-3 text-white" />
                </div>
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Buka Menu"
                className="lg:hidden p-2 rounded-full hover:bg-slate-100 text-[#191A1E] transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>

          {/* ── Mobile Menu Dropdown (Solid Opaque) ────────── */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-2 p-3 bg-white rounded-3xl border border-[#E6E2D8] shadow-2xl space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-[14px] font-semibold transition-colors ${
                      active
                        ? 'bg-[#EA580C] text-white'
                        : 'text-[#474B53] hover:bg-[#FAF8F3] hover:text-[#191A1E]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-orange-200' : 'text-slate-400'}`} />
                    {label}
                  </Link>
                );
              })}
              <Link
                href="/login"
                className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-[14px] font-semibold text-[#474B53] hover:bg-[#FAF8F3] border-t border-[#E6E2D8] mt-2 pt-3"
              >
                <UserCheck className="w-4 h-4 text-[#EA580C]" />
                <span>Portal Staf Ketintang</span>
              </Link>
            </div>
          )}

        </div>
      </header>
    </>
  );
}
