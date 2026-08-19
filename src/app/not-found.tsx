'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-background">
      <div className="max-w-md w-full text-center space-y-5 bg-card p-8 rounded-2xl border border-border shadow-accessible-sm">
        <div className="w-14 h-14 bg-muted text-secondary rounded-full flex items-center justify-center mx-auto">
          <HelpCircle className="w-8 h-8 text-accent" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Halaman Tidak Ditemukan (404)</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Halaman yang Anda tuju tidak tersedia atau telah dipindahkan.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-secondary text-on-primary font-bold text-xs rounded-xl transition-colors min-h-[44px] cursor-pointer w-full"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
