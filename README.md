# ⚗️ The Grand Alchemist's Archive (Pustaka Agung Alkemis)

> *"Ignis Aurum Probat — Scientia Mentem Ditavit"*  
> Platform perpustakaan sekolah interaktif bertema **Medieval Fantasy & Magic Alchemy** yang memadukan estetika arsip kuno, sistem autentikasi **3 Role (Admin, Guru, Siswa)**, alur persetujuan peminjaman fisik (*Approval Workflow*), manajemen stok eksemplar buku, fitur baca online interaktif (**E-Grimoire Reader Modal**), dan integrasi cloud **Supabase** dengan *smart offline fallback* (**Local Grimoire Mode**).

---

## 🌟 Sorotan & Fitur Pembaruan (3-Role System & E-Grimoire)

### 1. 🧙‍♂️ Sistem Autentikasi 3 Role & Demo Quick-Switcher
- **Top Role Switcher Bar (Banner Uji Coba Cepat):** Tersemat di bagian paling atas layar untuk berpindah peran secara instan dengan 1 klik tanpa harus mengetik password berulang kali:
  - **👑 Admin (Grand Archivist):** Pengurus perpustakaan & kurator arsip.
  - **📜 Guru (Guild Mentor — Bpk. Hendra Wijaya, M.Pd.):** Pengampu mata pelajaran yang dapat mengajukan peminjaman buku paket untuk kelas siswa.
  - **⚔️ Siswa (Apprentice Scholar — Arya Pendragon):** Siswa anggota serikat literasi (ID: `ARC-2026-089`).
- **Modal Login Guild Gatekeeper:** Mendukung login dengan Email & Password (terkoneksi ke Supabase Auth jika aktif, atau menggunakan kredensial demo lokal).

### 2. 📖 E-Grimoire Reader Modal (Fitur Baca Buku Digital)
- **Tersedia Kapan Saja:** Tombol *"📖 Baca Digital (Astral Grimoire)"* selalu dapat diakses di katalog *Vault of Tomes*, detail buku, maupun rekomendasi *Mixer*.
- **Solusi Saat Stok Fisik Habis:** Jika buku fisik habis dipinjam (`availableStock === 0`), kartu buku menampilkan lencana bercahaya *"Stok Fisik Habis • Tersedia Versi Digital"* dan mengarahkan pengguna membaca secara daring.
- **Fitur Pembaca Interaktif:**
  - Navigasi halaman/bab (Prev / Next) dengan indikator bab.
  - Pengatur ukuran huruf font (S, M, L, XL).
  - Mode tema membaca: *Aged Parchment* (terang klasik) atau *Midnight Grimoire* (gelap mistis).
  - Indikator kemajuan membaca (*Progress Bar*).
  - Tombol **Klaim +75 XP** di halaman terakhir setelah menuntaskan pembacaan.

### 3. ⚖️ Alur Persetujuan Peminjaman (Approval Workflow)
- **Pengajuan Siswa:** Siswa meminjam buku perorangan (`quantity: 1`). Pengajuan berstatus `'pending'` masuk ke antrean Admin.
- **Pengajuan Kelas Guru:** Guru mengajukan peminjaman buku paket kelas (jumlah hingga batas stok tersedia di rak, nama kelas rombel, dan catatan keperluan praktikum/kurikulum).
- **Persetujuan & Penolakan Admin:**
  - **Tombol Approve (Setujui):** Status pinjaman berubah menjadi `'approved'`, dan otomatis memotong `availableStock` buku fisik di rak.
  - **Tombol Reject (Tolak):** Admin memasukkan alasan penolakan (misal: buku dialokasikan untuk ujian praktikum), status berubah menjadi `'rejected'`, dan catatan alasan tampil transparan di dashboard peminjam.
  - **Verifikasi Pengembalian:** Mengubah status menjadi `'returned'` dan otomatis memulihkan stok fisik buku ke rak.

### 4. 📦 Manajemen Stok Inventaris Eksemplar Buku
- Setiap buku memiliki properti `totalStock` (total kepemilikan perpustakaan) dan `availableStock` (stok fisik yang tersedia saat ini di rak).
- Di **Archivist's Chamber**, Admin dapat menyesuaikan stok secara langsung menggunakan tombol cepat `[+]` dan `[-]` dengan sinkronisasi seketika ke database.

---

## 🏛️ Ruang & Navigasi Berdasarkan Role

| Tab Ruangan | Hak Akses | Deskripsi Fitur |
| :--- | :--- | :--- |
| **The Great Hall** | *Semua Role* | Beranda utama, pencarian *Scrying Mirror*, koleksi unggulan, dan statistik pustaka |
| **Alchemical Mixer** | *Semua Role* | Peramu rekomendasi buku berdasarkan kombinasi 1–3 esensi alkimia suasana hati |
| **Vault of Tomes** | *Semua Role* | Katalog buku lengkap, filter kategori, status stok fisik, dan tombol E-Grimoire Reader |
| **Scholar's Sanctum** | *Khusus Siswa* | Profil Arya Pendragon, kartu serikat, XP progress bar, antrean permohonan pinjam, buku aktif dengan *Mana Decay Timer*, ritual pengembalian (+100 XP), misi dan lencana |
| **Mentor's Sanctum** | *Khusus Guru* | Formulir pengajuan peminjaman paket buku kelas & dashboard pemantauan status pinjaman kelas |
| **Archivist's Chamber** | *Khusus Admin* | Antrean persetujuan pinjaman (*Loan Approval Queue*), sirkulasi aktif, manajemen stok `+`/`-`, pendaftaran buku baru, dan *Supabase Cloud Seed* |

---

## 🎨 Sistem Desain & Palet Warna

| Elemen Visual | Kode Hex | Karakteristik Desain |
| :--- | :--- | :--- |
| **Background Utama** | `#12100E` | *Obsidian Wood* |
| **Permukaan Kartu** | `#1E1916` | *Dark Leather* dengan border emas halus (`#D4AF37`) |
| **Teks Utama / Muted** | `#F4E8C1` / `#A89F91` | *Aged Parchment* |
| **Aksen Alkimia** | `#D4AF37` / `#10B981` / `#8B5CF6` / `#38BDF8` | *Alchemical Gold*, *Emerald Potion*, *Arcane Purple*, *Sky Cyan* |
| **Tipografi** | `Cinzel` & `Plus Jakarta Sans` | Nuansa serif manuskrip abad pertengahan & font bacaan modern |

---

## 🛠️ Tech Stack

- **Framework:** React 19 + Vite 6
- **Styling:** Tailwind CSS 3 (kustom animasi kuali alkimia, scrollbar perkamen, dan efek rotasi rune sihir)
- **Komponen Ikon & Animasi:** `lucide-react`, `canvas-confetti`
- **Database & Persistensi Cloud:** Supabase (`@supabase/supabase-js`)
- **Smart Fallback:** *Local Grimoire Mode* (otomatis berjalan mulus tanpa error jika kredensial `.env` belum diisi)

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka tautan lokal yang ditampilkan di terminal (biasanya `http://localhost:5173/`).

### 3. Konfigurasi Supabase (Opsional)
Jika ingin menghubungkan ke database Supabase:
1. Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
2. Masukkan URL dan Kunci Anonim proyek Supabase Anda:
   ```env
   VITE_SUPABASE_URL=https://proyek-anda.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
3. Jalankan seluruh perintah SQL di file `supabase/schema.sql` pada **SQL Editor** di Dashboard Supabase.
4. Buka menu **Archivist's Chamber** di aplikasi dan klik tombol **"Seed Data ke Supabase"** untuk mengisi 12 buku awal, stok eksemplar, misi, dan data peminjaman secara otomatis.

---

## 📜 Lisensi
Dikembangkan untuk platform perpustakaan sekolah bertema fantasi alkimia. Bebas dimodifikasi dan dikembangkan lebih lanjut.
