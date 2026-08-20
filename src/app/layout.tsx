import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ToastProvider } from '@/components/Toast';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SIGAP Desa - Platform Layanan & Penanganan Fasilitas Desa',
  description: 'Portal pengaduan infrastruktur dan fasilitas publik desa berbasis Machine Learning & WebGIS untuk penanganan cepat, transparan, dan terukur.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`scroll-smooth ${plusJakartaSans.variable} ${outfit.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#FAF8F3] text-[#191A1E] font-sans antialiased selection:bg-emerald-100 selection:text-emerald-950">
        <ToastProvider>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
