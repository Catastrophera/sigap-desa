import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lvczucdohvejrqhpebax.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_SkS0ul_tDg1UndeEt1CGvA_bFvglAGP';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const LIST_KATEGORI = [
  'Jalan & Jembatan',
  'Penerangan Jalan',
  'Drainase & Irigasi',
  'Air Bersih & Sanitasi',
  'Persampahan & Lingkungan',
  'Gedung & Sarana Publik',
  'Bencana & Darurat',
  'Masalah Lainnya',
] as const;

export type KategoriAduan = (typeof LIST_KATEGORI)[number] | string;

export interface Aduan {
  id: string;
  ticket_code: string;
  nama_pelapor?: string | null;
  kontak_pelapor?: string | null;
  deskripsi: string;
  foto_url?: string | null;
  foto_selesai_url?: string | null;
  dusun: string;
  latitude: number;
  longitude: number;
  kategori: KategoriAduan;
  prioritas: 'Tinggi' | 'Sedang' | 'Rendah';
  status: 'Menunggu Verifikasi' | 'Sedang Ditindak' | 'Selesai' | 'Ditolak (Spam / Tidak Valid)' | string;
  catatan_admin?: string | null;
  created_at: string;
}