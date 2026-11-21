# ⚗️ The Grand Alchemist's Archive (Pustaka Agung Alkemis)

> *"Ignis Aurum Probat — Scientia Mentem Ditavit"*  
> Platform perpustakaan sekolah interaktif bertema **Medieval Fantasy & Magic Alchemy** yang memadukan estetika arsip kuno, sistem autentikasi **3 Role (Admin, Guru, Siswa)**, alur persetujuan peminjaman fisik (*Approval Workflow*), manajemen stok eksemplar buku, fitur baca online interaktif (**E-Grimoire Reader Modal**), **Jurnal Refleksi Literasi GLS**, **Paket Keranjang Kelas 1 Hari**, **Leaderboard Kelas Ter-Literat**, dan integrasi cloud **Supabase** dengan *smart offline fallback* (**Local Grimoire Mode**).

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
  - Toggle tema baca **Obsidian Wood** (gelap, default) ⇄ **Warm Parchment** (terang `#F4ECD8` / `#2C241B`), tersimpan per pengguna.
  - **Narator Bahasa Indonesia** (*Dengarkan Bab Ini*) dengan kontrol Play, Pause, Lanjutkan, dan Stop. Suara `id-ID` diprioritaskan; narasi berhenti otomatis saat pindah bab atau menutup reader.
  - **Bookmark otomatis**: bab dan posisi scroll tersimpan saat berpindah bab, menutup reader, atau meninggalkan halaman. Saat dibuka kembali muncul toast *"Melanjutkan dari halaman X"*.
  - Indikator kemajuan membaca (*Progress Bar*).
  - Tombol **Klaim +75 XP** di halaman terakhir setelah menuntaskan pembacaan.
- **Penyimpanan progres:** LocalStorage menjadi sumber utama, dengan sinkronisasi Supabase *best-effort* (tabel `reading_progress`, unik per `user_id + book_id + source`) yang aktif otomatis setelah `.env` Supabase diisi.
- **Batasan PDF:** viewer PDF tetap memakai iframe tautan eksternal, sehingga hanya mendukung tema/filter anti-silau dan penanda *"Terakhir dibuka"*. Nomor halaman dan narasi PDF belum tersedia.

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

### 5. 📷 Transaksi Kilat dengan Kamera (Barcode / QR)
- Sub-tab **Transaksi Kilat (Scan)** di *Archivist's Chamber* memakai pustaka `html5-qrcode` untuk memindai kamera secara langsung (QR, Code 128/39/93, EAN, UPC).
- Alur pustakawan: **pindai kartu pelajar → pindai barcode buku → pilih durasi → Pinjam Sekarang**.
- Setiap buku kini memiliki `kodeBuku` (mis. `BK-FIK-001`), `barcode`, `ddc`, dan `callNumber`. Pemindaian tetap cocok meski label eksemplar memakai sufiks (mis. `BK-FIK-001-03`) atau URL kartu.
- Stok fisik otomatis berkurang, pinjaman langsung berstatus `approved`, dan tersimpan ke Supabase (bila aktif) atau *Local Grimoire Mode*.
- Tersedia input manual kode kartu/buku sebagai fallback bila kamera tidak tersedia atau izin kamera ditolak.

### 6. 🏷️ Cetak Label Rak & Barcode (PDF Siap Tempel)
- Tombol **Cetak Label Rak** di header *Archivist's Chamber* menghasilkan PDF label siap cetak memakai `jsPDF` + `JsBarcode`.
- Format label bawaan: **Tom & Jerry 103** (38 × 21 mm, 65 label/A4) dan **Label A4 3 × 8** (63 × 33,9 mm, 24 label/A4), plus opsi satu label per buku atau seluruh eksemplar.
- Setiap label memuat **barcode Code128, kode buku, judul singkat, nomor panggil DDC, dan lokasi rak**.
- Pratinjau label tampil langsung di modal; tombol per buku juga tersedia di tab *Manajemen Stok Rak*.

### 7. 📊 Laporan Bulanan & Akreditasi (Excel / PDF 1-Klik)
- Sub-tab **Laporan & Ekspor** menyajikan rekap operasional perpustakaan untuk bulan yang dipilih:
  - Buku paling banyak dipinjam (jumlah transaksi & eksemplar).
  - Total judul dan total eksemplar, termasuk perbandingan **koleksi fisik vs digital**.
  - Peminjaman per kelas dan per jenjang (X, XI, XII, Guru).
  - Rekap keterlambatan pengembalian beserta jumlah hari terlambat.
  - Ringkasan status sirkulasi (antrean, aktif, H-1, terlambat, selesai).
- **Ekspor Excel** (`.xlsx` via `xlsx`) memuat beberapa sheet terpisah; **Ekspor PDF** memakai `jsPDF` + `jspdf-autotable` dengan kop laporan, periode, dan tabel rapi.
- Nama berkas otomatis menyertakan periode, mis. `Laporan-Perpustakaan-2026-11.xlsx`.

### 8. ⏳ Aturan Jatuh Tempo & Pengingat WhatsApp
- **Durasi pinjam:** siswa maksimal **7 hari**; guru dapat memilih **14, 21, atau 30 hari** saat mengajukan pinjaman.
- Status warna otomatis di tabel sirkulasi:
  - 🟢 **Aktif** — masih lebih dari 1 hari sebelum jatuh tempo.
  - 🟡 **H-1 / Hari ini** — jatuh tempo besok atau hari ini.
  - 🔴 **Terlambat** — melewati tanggal jatuh tempo, dengan jumlah hari keterlambatan.
- Tombol **Ingatkan** membuka modal pengingat WhatsApp dengan template rapi yang dapat diedit. Penerima dapat dipilih: **siswa/peminjam, orang tua/wali, atau wali kelas**.
- Tautan `wa.me` dinormalisasi otomatis (`08…` → `628…`), lengkap dengan judul buku, tanggal jatuh tempo, status keterlambatan, dan ajakan mengembalikan buku.

### 9. 📝 Jurnal Refleksi Literasi (GLS / Reading Logbook)
- Tabel **`reading_logs`** terhubung ke profil siswa dan judul buku. Satu siswa menyimpan **satu jurnal per buku**; pengiriman ulang memperbarui jurnal yang sama (tidak membuat duplikat).
- Formulir jurnal pada **detail buku** dan **Scholar's Sanctum** memuat:
  - **Halaman terakhir dibaca** (divalidasi terhadap jumlah halaman buku).
  - **Kutipan favorit** dari buku.
  - **Ringkasan hikmah/refleksi** dengan penghitung kata *real-time*.
- Validasi minimal **100 kata**; rentang ideal **100–200 kata**. Di atas 200 kata tetap diterima dengan penanda agar siswa menulis lebih ringkas.
- Status jurnal: **Belum Dinilai** (`submitted`) dan **Sudah Dinilai** (`graded`). Jurnal yang diedit setelah dinilai akan dikirim ulang dengan status Belum Dinilai.
- **Dashboard Guru** menyediakan panel *Review Jurnal Siswa*: filter kelas dan status, baca kutipan serta refleksi penuh, lalu beri **skor 0–100** dan **umpan balik**. Skor dan catatan guru tampil kembali di dashboard siswa.

### 10. 📦 Paket Keranjang Kelas (Peminjaman Rombel Kilat 1 Hari)
- Khusus **Guru**, tersedia tombol **“Pinjam Paket Kelas (1 Hari)”** pada detail buku dan menu **Mentor's Sanctum**.
- Guru memilih **satu judul**, jumlah eksemplar (tombol cepat 30/32/35), kelas/rombel, dan jam pelajaran, mis. *“Kelas X MIPA 2, Jam ke 3-4”*.
- **Validasi stok fisik:** paket ditolak jika jumlah melebihi `availableStock`. Jika cukup, stok langsung berkurang otomatis dan pinjaman berstatus `approved` dengan tenggat **1 hari** serta kolom `is_package` dan `lesson_hours`.
- Tombol **“Selesai / Kembalikan Paket”** tersedia di meja paket maupun logbook pinjaman guru. Setelah diklik, status menjadi `returned` dan stok fisik dipulihkan otomatis (maksimal `totalStock`).

### 11. 🏆 Leaderboard Kelas Ter-Literat (Gamifikasi Antar-Kelas)
- Agregasi bulan berjalan dihitung dari **jumlah eksemplar buku yang dipinjam/dibaca** ditambah **jumlah jurnal literasi yang diselesaikan**, dikelompokkan berdasarkan kelas siswa.
- Nama kelas dinormalisasi menjadi format **`Kelas X ...`**; kelas fakultas/dewan/guru tidak diikutkan.
- Komponen **Leaderboard Kelas Ter-Literat** tampil di **The Great Hall** dengan banner dinamis:
  > **“Kelas [Nama_Kelas] memimpin dengan [Jumlah] buku dibaca bulan ini!”**
- Di bawah banner tampil peringkat kelas (hingga 6 besar) lengkap dengan jumlah buku, jurnal, pembaca unik, dan bar proporsi. Kelas pengguna saat ini ditandai **“Kelasmu”**.

---

## 🏛️ Ruang & Navigasi Berdasarkan Role

| Tab Ruangan | Hak Akses | Deskripsi Fitur |
| :--- | :--- | :--- |
| **The Great Hall** | *Semua Role* | Beranda utama, pencarian *Scrying Mirror*, **Leaderboard Kelas Ter-Literat**, koleksi unggulan, dan statistik pustaka |
| **Alchemical Mixer** | *Semua Role* | Peramu rekomendasi buku berdasarkan kombinasi 1–3 esensi alkimia suasana hati |
| **Vault of Tomes** | *Semua Role* | Katalog buku lengkap, filter kategori, status stok fisik, dan tombol E-Grimoire Reader |
| **Scholar's Sanctum** | *Khusus Siswa* | Profil Arya Pendragon, kartu serikat, XP progress bar, antrean permohonan pinjam, buku aktif dengan *Mana Decay Timer*, ritual pengembalian (+100 XP), **jurnal refleksi literasi GLS**, misi dan lencana |
| **Mentor's Sanctum** | *Khusus Guru* | **Paket Keranjang Kelas (1 hari)**, **review & penilaian jurnal literasi**, formulir peminjaman paket buku kelas, dan dashboard pemantauan status pinjaman |
| **Archivist's Chamber** | *Khusus Admin* | Transaksi kilat (scan barcode/QR), antrean persetujuan, sirkulasi + status jatuh tempo, pengingat WhatsApp, cetak label rak, laporan Excel/PDF, manajemen stok `+`/`-`, pendaftaran buku baru, import Excel massal, dan *Supabase Cloud Seed* |

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
- **Pemindai Kamera:** `html5-qrcode` (QR & barcode 1D)
- **Dokumen & Ekspor:** `jspdf`, `jspdf-autotable`, `jsbarcode`, `xlsx`
- **Database & Persistensi Cloud:** Supabase (`@supabase/supabase-js`)
- **Smart Fallback:** *Local Grimoire Mode* (otomatis berjalan mulus tanpa error jika kredensial `.env` belum diisi; data buku, pinjaman, dan jurnal literasi disimpan di `localStorage` dengan prefiks `alchemist-archive:v2`)

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
Buka tautan lokal yang ditampilkan di terminal (biasanya `http://localhost:5173/Alchemist-Library/`).

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
4. Buka menu **Archivist's Chamber** di aplikasi dan klik tombol **"Seed Data ke Supabase"** untuk mengisi 12 buku awal, stok eksemplar, misi, data peminjaman, dan jurnal literasi contoh secara otomatis.

### 4. Migrasi Supabase untuk Fitur Baru (Barcode, Label, Laporan, WhatsApp, GLS)
Jika database Supabase sudah pernah dibuat sebelumnya, cukup jalankan blok migrasi berikut di **SQL Editor** (idempoten, aman diulang, tidak menghapus buku/akun):

```sql
-- Kolom buku untuk barcode, nomor panggil DDC, dan label rak
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS kode_buku TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS ddc TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS call_number TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS barcode TEXT;
CREATE INDEX IF NOT EXISTS idx_books_kode_buku ON public.books(kode_buku);
CREATE INDEX IF NOT EXISTS idx_books_barcode ON public.books(barcode);

-- Kontak pengingat WhatsApp + aturan durasi pinjam
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS borrower_card TEXT;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS borrower_phone TEXT;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS guardian_name TEXT;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS guardian_phone TEXT;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS homeroom_name TEXT;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS homeroom_phone TEXT;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS max_days INTEGER NOT NULL DEFAULT 7;

-- Paket Keranjang Kelas (peminjaman rombel kilat 1 hari)
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS is_package BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS lesson_hours TEXT;
CREATE INDEX IF NOT EXISTS idx_loans_is_package ON public.loans(is_package);
CREATE INDEX IF NOT EXISTS idx_loans_class_name ON public.loans(class_name);

-- Jurnal Refleksi Literasi (GLS)
CREATE TABLE IF NOT EXISTS public.reading_logs (
  id TEXT PRIMARY KEY DEFAULT ('log-' || gen_random_uuid()::TEXT),
  profile_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_card TEXT,
  student_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  book_id TEXT NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  book_title TEXT,
  last_page_read INTEGER NOT NULL DEFAULT 0 CHECK (last_page_read >= 0),
  favorite_quote TEXT,
  summary TEXT NOT NULL,
  word_count INTEGER NOT NULL DEFAULT 0 CHECK (word_count >= 0),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded')),
  score INTEGER CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reading_logs_class ON public.reading_logs(class_name);
CREATE INDEX IF NOT EXISTS idx_reading_logs_status ON public.reading_logs(status);
CREATE INDEX IF NOT EXISTS idx_reading_logs_book ON public.reading_logs(book_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_logs_student_book
  ON public.reading_logs(student_card, book_id)
  WHERE student_card IS NOT NULL;

ALTER TABLE public.reading_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public demo read/write reading_logs" ON public.reading_logs;
CREATE POLICY "Public demo read/write reading_logs" ON public.reading_logs
  FOR ALL USING (true) WITH CHECK (true);
```

> Semua kolom/tabel baru bersifat aditif. Aplikasi tetap berjalan penuh dalam *Local Grimoire Mode* tanpa Supabase, termasuk jurnal literasi, paket kelas, dan leaderboard.
>
> **Bookmark bacaan:** jalankan juga `supabase/reading_progress.sql` (idempoten) bila database sudah dibuat sebelum fitur ini ada. Tabel ini menyimpan progres teks/PDF per pengguna dan buku, dan dipakai otomatis oleh reader ketika Supabase aktif.

### 5. Data Demo & Kode Uji Coba
- **Anggota contoh:** 25 siswa + 3 guru di `src/data/sampleMembers.js` (kartu siswa mis. `ARC-2026-089`, `ARC-2026-001`; kartu guru mis. `GT-2026-001`).
- **Buku contoh:** 12 judul dengan kode otomatis seperti `BK-FIK-001` (Bumi), `BK-SAI-004` (Fisika Dasar), dan seterusnya.
- **Skenario jatuh tempo demo:** satu pinjaman aktif, satu **H-1**, satu **terlambat**, plus antrean *pending* dan riwayat selesai untuk menguji laporan.
- **Jurnal literasi demo:** 7 jurnal bulan berjalan di beberapa kelas (`src/data/sampleReadingLogs.js`), termasuk jurnal Arya berstatus *Belum Dinilai* dan beberapa jurnal yang sudah diberi skor/umpan balik.
- Data lokal hanya disimpan di peramban; gunakan tombol **Seed Data ke Supabase** bila ingin menyinkronkan ke cloud.

---

## 📜 Lisensi
Dikembangkan untuk platform perpustakaan sekolah bertema fantasi alkimia. Bebas dimodifikasi dan dikembangkan lebih lanjut.
