'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, Mail, ArrowRight, ArrowLeft, Sparkles, UserCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      showToast('Berhasil masuk ke Command Center Desa.', 'success');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Email atau kata sandi tidak sesuai.');
      showToast(err.message || 'Gagal masuk', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    localStorage.setItem('sigap_demo_admin', 'true');
    showToast('Masuk sebagai Staf Desa (Mode Demo Presentasi)', 'info');
    router.push('/dashboard');
  };

  return (
    <div id="main-content" className="min-h-screen flex items-center justify-center px-4 py-24 bg-[#FAF8F3]">
      <div className="max-w-md w-full space-y-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#646973] hover:text-[#191A1E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Portal Warga</span>
        </Link>

        <div className="bg-white rounded-3xl sm:rounded-4xl shadow-card-soft border border-[#E6E2D8] p-8 sm:p-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#1B4332] text-emerald-300 flex items-center justify-center mx-auto shadow-md">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="font-display font-bold text-2xl text-[#191A1E] tracking-tight">
              Command Center Desa
            </h1>
            <p className="text-[13px] text-[#646973] leading-relaxed">
              Autentikasi staf &amp; perangkat desa untuk verifikasi pengaduan dan ekspor Musrenbangdes.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-[12px] text-red-800 font-bold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-[12px] font-bold text-[#191A1E] mb-1.5">
                Email Staf Desa
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9E998E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@desa.go.id"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E6E2D8] text-[13px] text-[#191A1E] bg-[#FAF8F3] focus:bg-white focus:outline-none focus:border-[#191A1E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#191A1E] mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#9E998E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E6E2D8] text-[13px] text-[#191A1E] bg-[#FAF8F3] focus:bg-white focus:outline-none focus:border-[#191A1E]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#1B4332] hover:bg-[#143628] text-[#FAF8F3] font-bold text-[14px] rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke Command Center'}</span>
              <ArrowRight className="w-4 h-4 text-emerald-300" />
            </button>
          </form>

          {/* Demo Login Button */}
          <div className="pt-4 border-t border-[#E6E2D8] space-y-2">
            <span className="text-[11px] text-[#646973] block text-center font-medium">Akses Evaluator / Penilai:</span>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-3 px-4 bg-[#FAF8F3] hover:bg-white border border-[#E6E2D8] hover:border-emerald-500 rounded-full text-[12px] font-bold text-[#191A1E] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>1-Klik Masuk sebagai Demo Admin Desa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
