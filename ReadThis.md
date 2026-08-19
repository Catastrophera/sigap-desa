# DOKUMEN SPESIFIKASI LENGKAP SISTEM: SIGAP DESA
**Sistem Pengaduan dan Prioritas Penanganan Fasilitas Desa Berbasis Machine Learning**

---

## 1. Ringkasan Eksekutif & Konsep Produk

* **Nama Proyek**: SIGAP Desa
* **Bentuk Program**: Studi / Proyek Independen (Stupen)
* **Fokus Masalah**: Pengaduan kerusakan infrastruktur desa yang tidak terdokumentasi, penanganan lambat, dan subjektivitas dalam penentuan prioritas perbaikan.
* **Solusi**: Platform web responsif dengan portal pelaporan interaktif untuk warga dan dashboard *Command Center* untuk perangkat desa, dilengkapi klasifikasi otomatis dan pembobotan tingkat urgensi berbasis pemrosesan teks (NLP).
* **Pengguna Sasaran**:
  * **Warga Desa**: Pelapor kerusakan fasilitas umum dan pemantau progres tiket secara transparan.
  * **Perangkat Desa (Admin/Kepala Dusun/Kades)**: Pengelola antrean perbaikan, pemantau peta WebGIS, verifikator lapangan (*before-after*), dan penyusun bahan Musrenbangdes.

---

## 2. Tech Stack & Zero-Cost Infrastructure

* **Framework Web**: Next.js 14+ (App Router, TypeScript)
* **Desain & UI**: Tailwind CSS + shadcn/ui + Lucide React (Tema: Modern Crimson on Pure Slate)
* **Database & Auth**: Supabase PostgreSQL + Supabase Auth
* **Media Storage**: Supabase Storage (`aduan-images` bucket, 1 GB Free Tier)
* **Peta WebGIS**: Leaflet.js + React-Leaflet (Tile layer: CartoDB Positron monokrom)
* **Mesin Machine Learning**: Pipeline Kaggle (TF-IDF + Logistic Regression) diekspor ke bobot matriks `model.json` untuk inferensi instan di Next.js tanpa runtime Python eksternal
* **Infrastruktur Hosting**: Vercel (Hobby Tier gratis)

---

## 3. Arsitektur & Peta Rute Halaman Web (Full Page Directory)

### A. Rute Portal Publik

| Rute URL | Nama Halaman | Akses | Komponen & Fitur Utama |
| :--- | :--- | :--- | :--- |
| `/` | **Portal Pengaduan Warga** | Publik (Tanpa Login) | • Hero section ringkas beraksen merah-putih.<br>• Form lapor 3-langkah (Upload foto + Kompresi WebP, Deskripsi kerusakan, Pin lokasi peta Leaflet).<br>• Tab/Card pencarian cepat nomor tiket aduan.<br>• Modal pop-up konfirmasi bukti registrasi tiket aduan (`#SIGAP-XXX`). |
| `/lacak/[ticket]` | **Detail Pelacakan Tiket** | Publik (Tanpa Login) | • Kartu ringkasan detail aduan (foto, tanggal lapor, kategori, dusun).<br>• Indikator progres visual bertingkat (*Menunggu Verifikasi* $\rightarrow$ *Sedang Ditindak* $\rightarrow$ *Selesai*).<br>• Menampilkan foto bukti perbaikan lapangan jika status sudah *Selesai*. |
| `/transparansi` | **Peta Sebaran Publik** | Publik (Tanpa Login) | • Peta WebGIS interaktif menampilkan sebaran titik aduan yang sudah berstatus *Sedang Ditindak* dan *Selesai* sebagai bentuk transparansi anggaran/kinerja desa. |

### B. Rute Administrasi & Operasional

| Rute URL | Nama Halaman | Akses | Komponen & Fitur Utama |
| :--- | :--- | :--- | :--- |
| `/login` | **Portal Masuk Staf Desa** | Publik / Staf | • Form autentikasi email & password terhubung ke Supabase Auth.<br>• Redirect terproteksi ke dashboard setelah autentikasi valid. |
| `/dashboard` | **Command Center Desa** | Terproteksi (Khusus Admin) | • 4 Kartu Metrik Statistik (Total Aduan, Prioritas Tinggi, Sedang Ditindak, Selesai).<br>• *Split View*: Sisi kiri Tabel Antrean Cerdas terurut prioritas ML, sisi kanan Peta WebGIS interaktif seluruh titik aduan.<br>• Filter instan per kategori dan per dusun.<br>• Tombol aksi ekspor berkas Musrenbangdes (PDF). |
| `/dashboard/aduan/[id]` | **Detail & Verifikasi Tindakan** | Terproteksi (Khusus Admin) | • Detail lengkap aduan pelapor beserta koordinat GPS presisi.<br>• Form perubahan status aduan dan catatan internal perangkat desa.<br>• Modul unggah foto bukti pengerjaan lapangan (*After-photo*) untuk menutup tiket. |

---

## 4. Desain Sistem, Referensi Sumber, & Arsitektur Visual

### A. Asal-Usul & Referensi Desain (Where It Comes From)
Sistem visual SIGAP Desa mengombinasikan 3 sumber fondasi desain industri:
1. **Base Framework Admin (`satnaing/shadcn-admin`)**:
   * Digunakan sebagai pondasi layout dashboard admin desa (sidebar otomatis *collapsible*, drawer navigasi mobile, dan struktur folder komponen berbasis Radix UI).
   * **Instalasi via Git / Command Line**:
     ```bash
     git clone [https://github.com/satnaing/shadcn-admin.git](https://github.com/satnaing/shadcn-admin.git) sigap-desa
     cd sigap-desa
     npm install
     ```
   * **Instalasi Bersih (Tanpa Git History Asli)**:
     ```bash
     npx degit satnaing/shadcn-admin sigap-desa
     cd sigap-desa
     git init
     npm install
     ```
2. **Estetika Tactical SaaS (Linear.app & Vercel Dashboard)**:
   * Mengadopsi prinsip *high data density* (kepadatan informasi tinggi tanpa terasa sesak), *micro-borders* 1px tipis, serta tipografi monospace untuk data teknis (koordinat dan ID tiket).
3. **CartoDB Positron Map Styling**:
   * Mengganti tile OpenStreetMap standar yang ramai warna dengan tile monokrom abu-abu terang (*CartoDB Positron*) agar titik koordinat merah (*pulsing crimson dot*) menjadi titik kontras visual utama di layar.

---

### B. Tujuan & Rasionalisasi Desain (What It Is For)

| Target Pengguna | Kebutuhan Utama | Solusi Desain yang Diterapkan |
| :--- | :--- | :--- |
| **Warga Desa (Pelapor)** | Kemudahan input cepat via HP di lokasi kejadian, tidak boleh rumit atau lambat. | • Layout kartu terpusat (*single-column container*).<br>• Tombol besar ramah sentuhan jari (*thumb-friendly*).<br>• Kompresi otomatis WebP di background agar proses submit instan di jaringan 3G/4G desa. |
| **Perangkat Desa (Admin)** | Pengambilan keputusan cepat saat rapat dusun atau penanganan darurat lapangan. | • Layout *Split-Screen Command Center* (tabel antrean berdampingan langsung dengan peta WebGIS).<br>• *Flyout Drawer*: Klik tiket langsung membuka riwayat tanpa memuat ulang halaman.<br>• Kontras tinggi untuk kebutuhan proyeksi layar proyektor ruang rapat desa. |

---

### C. Implementasi Token Warna & Hierarki Visual (How It Works)

**1. Skema Warna Sistem (Modern Crimson & Slate)**
* **Primary / Accent (`#DC2626` / Tailwind `red-600`)**: Tombol aksi utama, border interaktif, indikator live monitoring, dan badge "Prioritas Tinggi".
* **Soft Alert Surface (`rgba(220, 38, 38, 0.08)` / `red-500/10`)**: Latar belakang badge tiket darurat agar teks tetap kontras dan nyaman dibaca.
* **Canvas Background (`#F8FAFC` / `slate-50`)**: Latar belakang ruang kerja dashboard untuk mengurangi kelelahan mata.
* **Surface Container (`#FFFFFF`)**: Latar kartu dan panel data agar elemen tampak terangkat bersih.
* **Structural Border (`#E2E8F0` / `border-slate-200`)**: Garis batas presisi 1px antar kontainer.
* **Typography (`#0F172A` / `slate-900` & `#64748B` / `slate-500`)**: Tingkat keterbacaan teks maksimal pada format cetak maupun digital.

**2. State Interaksi & Animasi**
* **Pulsing Marker (Peta WebGIS)**: Titik berstatus "Prioritas Tinggi" memancarkan animasi lingkaran radar berkedip merah untuk menarik fokus perangkat desa ke lokasi bencana/kerusakan parah.
* **Synchronized Hover**: Mengarahkan kursor ke salah satu baris tabel aduan otomatis memicu fungsi `map.flyTo()` pada peta Leaflet untuk menyorot pin koordinat yang bersangkutan.
* **Status Stepper (Halaman Lacak)**: Komponen garis lini masa bertingkat dengan indikator warna:
  * *Menunggu Verifikasi*: Abu-abu netral.
  * *Sedang Ditindak*: Biru/Kuning operasional.
  * *Selesai*: Hijau zamrud + komparator foto *Before-After*.

---

## 5. Skema Database & Storage Supabase (PostgreSQL DDL)

```sql
create table aduan (
  id uuid default gen_random_uuid() primary key,
  ticket_code text unique not null,
  nama_pelapor text,
  kontak_pelapor text,
  deskripsi text not null,
  foto_url text,
  foto_selesai_url text,
  dusun text not null,
  latitude double precision not null,
  longitude double precision not null,
  kategori text not null check (kategori in ('Jalan Rusak', 'Penerangan Jalan', 'Saluran Air', 'Fasilitas Umum Lainnya')),
  prioritas text not null check (prioritas in ('Tinggi', 'Sedang', 'Rendah')),
  status text not null default 'Menunggu Verifikasi' check (status in ('Menunggu Verifikasi', 'Sedang Ditindak', 'Selesai')),
  catatan_admin text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into storage.buckets (id, name, public) 
values ('aduan-images', 'aduan-images', true);

create policy "Public Access" 
on storage.objects for select 
using (bucket_id = 'aduan-images');

create policy "Public Upload" 
on storage.objects for insert 
with check (bucket_id = 'aduan-images');