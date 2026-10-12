import { supabase, Aduan } from './supabase';
import { LIST_DUSUN } from './geo-config';

export const REALISTIC_DEMO_REPORTS: Omit<Aduan, 'id' | 'created_at'>[] = [
  {
    ticket_code: 'SIGAP-1082',
    nama_pelapor: 'Budi Santoso',
    kontak_pelapor: '081234567801',
    kategori: 'Jalan & Jembatan',
    prioritas: 'Tinggi',
    status: 'Selesai',
    dusun: 'RW 01 - Ketintang Baru',
    latitude: -7.3115,
    longitude: 112.7275,
    deskripsi: 'Jalan aspal poros utama Jl. Ketintang Baru ambles sedalam 18cm di dekat perlintasan rel RT 02. Berbahaya bagi pemotor malam hari.',
    foto_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
    foto_selesai_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&auto=format&fit=crop&q=80',
    catatan_admin: 'Pengerjaan pengaspalan hotmix tuntas bersama tim Dinas Bina Marga dan satgas Ketintang pada 14 Agustus 2026.',
  },
  {
    ticket_code: 'SIGAP-2041',
    nama_pelapor: 'Siti Aminah',
    kontak_pelapor: '081298765432',
    kategori: 'Penerangan Jalan',
    prioritas: 'Tinggi',
    status: 'Sedang Ditindak',
    dusun: 'RW 02 - Ketintang Madya',
    latitude: -7.3142,
    longitude: 112.7290,
    deskripsi: 'Tiga titik lampu PJU penerangan jalan di Jl. Ketintang Madya arah Jl. Ahmad Yani padam total. Kondisi jalan sangat gelap dan rawan.',
    foto_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    foto_selesai_url: null,
    catatan_admin: 'Komponen trafo dan bohlam LED pengganti sedang dalam pengiriman dari dinas DKRTH, dijadwalkan pasang besok.',
  },
  {
    ticket_code: 'SIGAP-3119',
    nama_pelapor: 'Joko Prasetyo',
    kontak_pelapor: '085712349988',
    kategori: 'Drainase & Irigasi',
    prioritas: 'Sedang',
    status: 'Menunggu Verifikasi',
    dusun: 'RW 05 - Ketintang Wiyata (UNESA)',
    latitude: -7.3090,
    longitude: 112.7240,
    deskripsi: 'Saluran drainase depan gerbang Kampus UNESA Ketintang tersumbat endapan lumpur dan sampah dedaunan, memicu genangan air saat hujan.',
    foto_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80',
    foto_selesai_url: null,
    catatan_admin: null,
  },
  {
    ticket_code: 'SIGAP-4055',
    nama_pelapor: 'Warga RW 03 Ketintang',
    kontak_pelapor: '081344556677',
    kategori: 'Gedung & Sarana Publik',
    prioritas: 'Sedang',
    status: 'Selesai',
    dusun: 'RW 03 - Ketintang Barat',
    latitude: -7.3160,
    longitude: 112.7230,
    deskripsi: 'Penataan plang jalan dan pedestrian di simpang Jl. Ketintang Barat V dekat Krezz Wafa amblas dan butuh perbaikan perkerasan.',
    foto_url: '/ketintang-hero.jpg',
    foto_selesai_url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800&auto=format&fit=crop&q=80',
    catatan_admin: 'Pemasangan kembali paving block baru dengan perkuatan semen tuntas dikerjakan secara gotong royong.',
  },
  {
    ticket_code: 'SIGAP-5120',
    nama_pelapor: 'Ahmad Dahlan',
    kontak_pelapor: '087811223344',
    kategori: 'Air Bersih & Sanitasi',
    prioritas: 'Tinggi',
    status: 'Sedang Ditindak',
    dusun: 'RW 06 - Ketintang Permai',
    latitude: -7.3130,
    longitude: 112.7210,
    deskripsi: 'Pipa distribusi PDAM bocor di sudut Jl. Ketintang Permai Blok B, air bersih merembes deras membasahi badan jalan dan debit rumah melemah.',
    foto_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
    foto_selesai_url: null,
    catatan_admin: 'Klem penyambung pipa HDPE sedang dipasang oleh petugas teknis PDAM Surya Sembada.',
  },
  {
    ticket_code: 'SIGAP-6032',
    nama_pelapor: 'Rahmat Hidayat',
    kontak_pelapor: '082199887766',
    kategori: 'Persampahan & Lingkungan',
    prioritas: 'Sedang',
    status: 'Menunggu Verifikasi',
    dusun: 'RW 04 - Ketintang Timur',
    latitude: -7.3080,
    longitude: 112.7310,
    deskripsi: 'Tempat pembuangan sampah sementara (TPS) di batas RW 04 Ketintang Timur meluber ke bibir jalan dan menimbulkan aroma tidak sedap.',
    foto_url: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=800&auto=format&fit=crop&q=80',
    foto_selesai_url: null,
    catatan_admin: null,
  },
  {
    ticket_code: 'SIGAP-7104',
    nama_pelapor: 'Slamet Riyadi',
    kontak_pelapor: '085233445566',
    kategori: 'Bencana & Darurat',
    prioritas: 'Tinggi',
    status: 'Sedang Ditindak',
    dusun: 'RW 07 - Ketintang Selatan / Gayungan',
    latitude: -7.3180,
    longitude: 112.7265,
    deskripsi: 'Dahan pohon trembesi tua patah dan menjuntai melintang ke kabel tiang listrik di Jl. Ketintang Selatan akibat angin kencang.',
    foto_url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop&q=80',
    foto_selesai_url: null,
    catatan_admin: 'Tim Linmas dan satgas BPBD Surabaya sedang melakukan pemangkasan darurat menggunakan chainsaw.',
  },
];

export async function seedDemoData(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const { error: deleteError } = await supabase
      .from('aduan')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.warn('Could not clear old data:', deleteError);
    }

    const { data, error } = await supabase
      .from('aduan')
      .insert(REALISTIC_DEMO_REPORTS)
      .select();

    if (error) throw error;

    return {
      success: true,
      count: data?.length || REALISTIC_DEMO_REPORTS.length,
    };
  } catch (err: any) {
    console.error('Seed error:', err);
    return {
      success: false,
      count: 0,
      error: err.message || 'Gagal memasukkan data demo',
    };
  }
}
