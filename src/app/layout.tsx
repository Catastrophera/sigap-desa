import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CivicBackground from '@/components/CivicBackground';
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
  title: 'SIGAP - Ketintang | Layanan & Penanganan Fasilitas Publik Ketintang Surabaya',
  description: 'Portal pengaduan infrastruktur dan fasilitas publik wilayah Ketintang Surabaya berbasis Machine Learning, Geotagging & WebGIS terpadu.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`scroll-smooth ${plusJakartaSans.variable} ${outfit.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#FAF8F3] text-[#191A1E] font-sans antialiased selection:bg-orange-100 selection:text-orange-950 relative">
        <CivicBackground />
        <ToastProvider>
          <Navbar />
          <main className="flex-grow relative z-10">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
