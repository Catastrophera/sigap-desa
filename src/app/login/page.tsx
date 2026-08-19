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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-background">
      <div className="max-w-md w-full space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary hover:text-primary transition-colors min-h-[36px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Portal Warga
        </Link>

        <div className="bg-card rounded-xl shadow-accessible-md border border-border p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-on-primary mx-auto">
              <UserCheck className="w-7 h-7 text-accent" />
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Portal Staf & Perangkat Desa
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Akses verifikasi antrean dan penanganan fasilitas desa SIGAP.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-destructive rounded-lg text-xs text-red-900 font-bold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Email Staf Desa
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@desa.go.id"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-border bg-white text-foreground focus:border-primary focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-border bg-white text-foreground focus:border-primary focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-secondary text-on-primary font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[48px] disabled:opacity-50"
            >
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke Command Center'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo Login Button */}
          <div className="pt-4 border-t border-border space-y-2">
            <span className="text-xs text-muted-foreground block text-center font-medium">Akses Evaluator / Penilai:</span>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2.5 px-3 bg-muted hover:bg-slate-200 border border-border rounded-lg text-xs font-bold text-foreground transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
            >
              <Sparkles className="w-4 h-4 text-accent" />
              <span>Masuk Cepat sebagai Demo Admin Desa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
