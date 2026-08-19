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
    dusun: 'Krajan',
    latitude: -7.8185,
    longitude: 112.5290,
    deskripsi: 'Jalan aspal poros utama Dusun Krajan ambles sedalam 20cm di dekat jembatan penghubung RT 03. Sangat membahayakan pengendara motor saat malam hari.',
    foto_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
    foto_selesai_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&auto=format&fit=crop&q=80',
    catatan_admin: 'Pengerjaan pengaspalan hotmix ulang tuntas oleh tim teknis desa bersama warga RT 03 pada 14 Agustus 2026.',
  },
  {
    ticket_code: 'SIGAP-2041',
    nama_pelapor: 'Siti Aminah',
    kontak_pelapor: '081298765432',
    kategori: 'Penerangan Jalan',
    prioritas: 'Tinggi',
    status: 'Sedang Ditindak',
    dusun: 'Sukomulyo',
    latitude: -7.8220,
    longitude: 112.5350,
    deskripsi: 'Tiga titik lampu PJU penerangan jalan umum di jalan makam Sukomulyo padam total sejak 4 hari lalu. Kondisi jalan sangat gelap dan rawan.',
    foto_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    foto_selesai_url: null,
    catatan_admin: 'Komponen trafo dan bohlam LED pengganti sedang dalam pengiriman dari dinas terkait, dijadwalkan pasang besok.',
  },
  {
    ticket_code: 'SIGAP-3119',
    nama_pelapor: 'Joko Prasetyo',
    kontak_pelapor: '085712349988',
    kategori: 'Drainase & Irigasi',
    prioritas: 'Sedang',
    status: 'Menunggu Verifikasi',
    dusun: 'Sidodadi',
    latitude: -7.8150,
    longitude: 112.5220,
    deskripsi: 'Gorong-gorong drainase tersumbat endapan lumpur dan sampah ranting bambu. Air meluap ke badan jalan tiap hujan lebat.',
    foto_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80',
    foto_selesai_url: null,
    catatan_admin: null,
  },
  {
    ticket_code: 'SIGAP-4055',
    nama_pelapor: 'Warga Dusun Sumberingin',
    kontak_pelapor: '081344556677',
    kategori: 'Gedung & Sarana Publik',
    prioritas: 'Sedang',
    status: 'Selesai',
    dusun: 'Sumberingin',
    latitude: -7.8280,
    longitude: 112.5410,
    deskripsi: 'Pavingisasi halaman Posyandu Melati Dusun Sumberingin amblas tergerus air hujan sehingga becek saat kegiatan penimbangan balita.',
    foto_url: 'https://images.unsplash.com/photo-1584467741870-07a829f7cf73?w=800&auto=format&fit=crop&q=80',
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
    dusun: 'Krajan',
    latitude: -7.8170,
    longitude: 112.5260,
    deskripsi: 'Pipa distribusi air bersih PAMSIMAS bocor deras di jalur RT 02. Debit air ke rumah-rumah warga mengecil drastis.',
    foto_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
    foto_selesai_url: null,
    catatan_admin: 'Klem penyambung pipa HDPE sedang dipasang oleh petugas teknis air desa.',
  },
  {
    ticket_code: 'SIGAP-6032',
    nama_pelapor: 'Rahmat Hidayat',
    kontak_pelapor: '082199887766',
    kategori: 'Persampahan & Lingkungan',
    prioritas: 'Sedang',
    status: 'Menunggu Verifikasi',
    dusun: 'Sukomulyo',
    latitude: -7.8240,
    longitude: 112.5380,
    deskripsi: 'Tempat pembuangan sampah sementara (TPS) di batas dusun sudah meluber ke pinggir jalan dan menimbulkan bau tidak sedap.',
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
    dusun: 'Sidodadi',
    latitude: -7.8160,
    longitude: 112.5240,
    deskripsi: 'Pohon randu besar tumbang melintang di jalan desa akibat angin kencang tadi sore, kabel tiang ikut tertarik.',
    foto_url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop&q=80',
    foto_selesai_url: null,
    catatan_admin: 'Tim Linmas desa bersama warga sedang melakukan pemotongan ranting dan batang pohon dengan gergaji mesin.',
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
