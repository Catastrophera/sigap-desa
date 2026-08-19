import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'SIGAP Desa - Sistem Pengaduan & Prioritas Penanganan Fasilitas Desa',
  description: 'Platform terpadu pengaduan infrastruktur desa berbasis machine learning dan WebGIS untuk penanganan fasilitas yang cepat, transparan, dan terukur.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-white text-slate-900 antialiased selection:bg-rose-100 selection:text-rose-900">
        <ToastProvider>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
