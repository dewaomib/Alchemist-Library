# Peningkatan Pengalaman Baca Siswa — Design Doc

- **Tanggal:** 17 November 2026
- **Status:** Menunggu persetujuan
- **Pendekatan:** A — Reader-first + PDF anti-silau
- **Penyimpanan:** LocalStorage-first, Supabase disiapkan dan aktif otomatis saat `.env` diisi

---

## 1. Ringkasan

Menambahkan tiga peningkatan pada pengalaman membaca siswa:

1. **Toggle tema baca** Obsidian Wood (gelap, default) ⇄ Warm Parchment (terang, `#F4ECD8` / `#2C241B`), dengan preferensi tersimpan.
2. **Narator suara** berbasis `window.speechSynthesis`, membaca bab aktif secara berurutan dengan kontrol Play, Pause, dan Stop.
3. **Bookmark otomatis** yang menyimpan bab + posisi scroll saat siswa berpindah bab atau menutup reader, lalu memulihkannya dengan notifikasi "Melanjutkan dari halaman X".

Cakupan PDF mengikuti pendekatan A: viewer PDF mendapat toggle tema/anti-silau dan catatan "terakhir dibuka", tetapi **belum** mendapat TTS atau nomor halaman karena masih berupa iframe lintas-origin.

---

## 2. Temuan inspeksi

| Area | Kondisi sekarang |
|---|---|
| Reader teks | `EGrimoireReaderModal.jsx`; berbasis bab. `currentPageIndex` = indeks bab, footer menampilkan "Halaman X dari Y". Umumnya 3 bab per buku. |
| Toolbar | Tema, ukuran huruf, fullscreen, tutup. Belum ada TTS atau indikator bookmark. |
| Tema | Dua tema sudah ada, tetapi default `parchment` (terang `#FAF4E6`). Belum dipersistensikan. |
| TTS | Belum ada. |
| Progress | Belum ada. `reading_logs` adalah jurnal refleksi GLS, bukan posisi baca. |
| PDF | `FullScreenPdfViewerModal.jsx` memakai `<iframe>` + `formatPdfEmbedUrl()`. Google Drive diubah ke `/preview`. Halaman dan text-layer tidak dapat diakses. |
| LocalStorage | Helper `readStoredState` / `writeStoredState` ada di `App.jsx`, baru dipakai untuk state aplikasi. |
| Supabase | Nonaktif karena `.env` masih placeholder. `isSupabaseConfigured` bernilai `false`. |
| Identitas | Login demo. `currentUser.id` (`user-siswa`) dan `guildId` (`ARC-2026-089`) tersedia. |
| Bug terkait | `hasClaimedXp` dan `currentPageIndex` tidak di-reset saat berganti buku. |

---

## 3. Keputusan yang sudah disetujui

- Pendekatan **A**: fitur penuh di reader teks; PDF hanya tema/anti-silau + "terakhir dibuka".
- Supabase **disiapkan sekarang**: tabel, policy, dan kode sync. Selama `.env` placeholder, aplikasi tetap berjalan dengan LocalStorage.
- Tema gelap **Obsidian Wood menjadi default**.
- Tidak menambah dependensi baru.

### Di luar cakupan

- Mengganti iframe PDF dengan PDF.js.
- Ekstraksi teks PDF, nomor halaman PDF, dan TTS PDF.
- Autentikasi Supabase sungguhan / migrasi `user_id` ke `auth.uid()`.
- Realtime sync antar-perangkat.
- Fitur "lanjutkan membaca" di halaman beranda.

---

## 4. Desain: Toggle Tema

### 4.1 Palet

| Token | Obsidian Wood (default) | Warm Parchment |
|---|---|---|
| Latar kontainer | `#14110F` | `#F4ECD8` |
| Header/footer | `#1A1613` | `#EDE2C8` |
| Teks utama | `#F4E8C1` | `#2C241B` |
| Teks sekunder | `#A89F91` | `#6B5B45` |
| Border | `rgba(212, 175, 55, 0.25)` | `rgba(122, 92, 47, 0.28)` |
| Aksen | `#D4AF37` | `#8C6700` |
| Titik dekoratif | `rgba(212, 175, 55, 0.04)` | `rgba(122, 92, 47, 0.12)` |

Nilai gelap mengikuti tampilan Obsidian yang sudah ada; nilai terang diselaraskan dengan permintaan `#F4ECD8` dan `#2C241B`.

### 4.2 Perilaku

- State kode: `'obsidian' | 'parchment'`.
- Default: `'obsidian'`.
- Nilai lama `'midnight'` dipetakan ke `'obsidian'` untuk kompatibilitas.
- Tombol toggle di toolbar reader: ikon `Moon` saat di Parchment, `Sun` saat di Obsidian. Label hanya tampil di `md` ke atas.
- Preferensi disimpan per pengguna: `alchemist-archive:v2:reader-theme:<userId>`.
- PDF viewer membaca preferensi yang sama dan menyimpan perubahan ke key yang sama, sehingga tema konsisten antar-reader.

### 4.3 Filter PDF

Filter diterapkan pada elemen `<iframe>` (bukan konten internal):

- **Obsidian:** `invert(0.92) hue-rotate(180deg) brightness(0.86) contrast(0.94)` — mengurangi silau halaman putih; gambar berwarna mendekati aslinya.
- **Parchment:** `sepia(0.22) brightness(0.98) contrast(0.97)` — memberi nuansa kertas hangat.

Header, footer, dan latar viewer PDF ikut mengikuti palet tema. Nilai filter akan disetel visual saat implementasi.

---

## 5. Desain: Text-to-Speech

### 5.1 Hook `useSpeechNarrator`

File baru: `src/hooks/useSpeechNarrator.js`.

API:

```js
const {
  status,       // 'idle' | 'playing' | 'paused' | 'unsupported'
  isSupported,
  voiceLabel,   // label suara yang dipakai, untuk tooltip/status
  play,         // play(teks)
  pause,
  resume,
  stop
} = useSpeechNarrator();
```

Perilaku:

- Memilih suara `id-ID` bila tersedia; fallback ke voice ber-`lang` `id`, lalu voice default dengan `utterance.lang = 'id-ID'`.
- Mendengarkan event `voiceschanged` agar daftar suara yang terlambat dimuat tetap terdeteksi.
- Teks dipecah menjadi potongan kalimat (± maksimal 200 karakter) untuk menghindari bug Chrome yang memotong ucapan panjang.
- Potongan dibacakan berurutan lewat event `onend`.
- `pause()` memakai `speechSynthesis.pause()`; `resume()` memakai `resume()`; `stop()` memanggil `cancel()` dan mereset antrean.
- `cancel()` dipanggil saat unmount, saat buku berganti, saat bab berganti, dan saat modal ditutup.
- Bila `speechSynthesis` tidak tersedia, kontrol narator ditampilkan nonaktif dengan tooltip "Narator tidak didukung peramban ini".

### 5.2 Perilaku di reader

- Tombol utama: **"Dengarkan Bab Ini"** (ikon speaker; label disembunyikan di layar kecil).
- Saat playing: tombol berubah menjadi **Pause** dan muncul tombol **Stop**.
- Saat paused: tombol berubah menjadi **Play/Lanjutkan** dan tombol **Stop**.
- Teks yang dibacakan: judul bab + isi bab aktif.
- Narator berhenti otomatis saat siswa pindah bab atau menutup reader, agar tidak terjadi ketidaksesuaian antara suara dan halaman.
- Setelah kalimat terakhir bab selesai, narator berhenti (tidak otomatis lanjut ke bab berikutnya). Ini sesuai label "Dengarkan Bab Ini" dan mencegah progress berpindah tanpa siswa membacanya.
- Status kecil `aria-live="polite"` menampilkan "Membacakan bab X dari Y" saat aktif.
- Bila tidak ada suara Indonesia, tampilkan catatan halus: "Suara Indonesia tidak tersedia; memakai suara bawaan."

---

## 6. Desain: Bookmark Otomatis

### 6.1 Bentuk data

```js
{
  version: 1,
  source: 'text',              // 'text' | 'pdf'
  chapterIndex: 2,             // 0-based
  chapterTitle: 'Bab III: ...',
  pageNumber: 3,               // chapterIndex + 1 untuk reader teks; null untuk PDF
  scrollRatio: 0.34,           // 0..1 di dalam kontainer baca
  progressPercent: 67,
  updatedAt: '2026-11-17T08:30:00.000Z'
}
```

- `userId` diambil dari `currentUser.id`; fallback `guildId`, lalu `'guest'`.
- `bookId` diambil dari `book.id`; fallback `kodeBuku`, lalu slug judul.
- Data divalidasi dan di-clamp saat dibaca (indeks bab tidak boleh melebihi jumlah bab, rasio 0..1).

### 6.2 LocalStorage

Key:

- Tema: `alchemist-archive:v2:reader-theme:<userId>`
- Progress: `alchemist-archive:v2:reading-progress:<userId>:<bookId>:<source>`

`<source>` adalah `text` atau `pdf`. Pemisahan ini mencegah progress teks menimpa "terakhir dibuka" PDF (dan sebaliknya) ketika satu buku punya kedua mode baca.

Semua operasi dibungkus `try/catch`; bila storage diblokir atau penuh, aplikasi tetap berjalan tanpa persistensi.

### 6.3 Kapan disimpan

Reader teks:

- Setiap kali `currentPageIndex` berubah (Next/Prev).
- Saat siswa menutup reader (tombol X atau Escape).
- Saat komponen unmount / buku berganti.
- Saat scroll berhenti (debounce ± 400 ms), untuk menyimpan `scrollRatio`.
- Saat `pagehide` / `visibilitychange` menjadi hidden (khusus LocalStorage, sinkron).

PDF viewer:

- Saat dibuka dan ditutup, simpan `{ source: 'pdf', updatedAt }` sebagai "terakhir dibuka" pada key dengan `<source> = pdf`, sehingga tidak menimpa progress teks. Tidak ada nomor halaman palsu.

### 6.4 Saat membuka buku

Reader teks:

1. Baca progress lokal.
2. Pulihkan `currentPageIndex` dan `scrollRatio`.
3. Tampilkan toast singkat: **"Melanjutkan dari halaman X dari Y"** bila posisi bukan awal.
4. Bila Supabase aktif, ambil progress remote secara asynchronous.
5. Jika `remote.updatedAt` lebih baru daripada lokal **dan** siswa belum berpindah halaman, terapkan posisi remote. Bila siswa sudah berpindah, jangan timpa posisinya.
6. Toast hanya ditampilkan sekali per pembukaan.

PDF viewer:

- Tampilkan badge halus "Terakhir dibuka: [tanggal/jam]" di notice bar bila ada data. Tidak ada auto-jump dan tidak ada klaim nomor halaman.

### 6.5 Sinkronisasi Supabase

File baru: `src/utils/readingProgress.js`.

- `fetchRemoteReadingProgress(userId, bookId, source)` → `maybeSingle()` dengan filter `source`, periksa `{ error }`, kembalikan `null` bila gagal.
- `pushRemoteReadingProgress(progress)` → `upsert` dengan `onConflict: 'user_id,book_id,source'`, periksa `{ error }`.
- Sync hanya berjalan bila `isSupabaseConfigured && supabase`.
- LocalStorage tetap ditulis lebih dulu; kegagalan Supabase tidak memblokir UI dan tidak menampilkan toast error (cukup `console.warn`).
- Remote sync dipicu saat pindah bab dan saat menutup reader, bukan setiap event scroll.

### 6.6 Skema SQL

Tambahan di `supabase/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS public.reading_progress (
  user_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'text' CHECK (source IN ('text', 'pdf')),
  chapter_index INTEGER NOT NULL DEFAULT 0 CHECK (chapter_index >= 0),
  chapter_title TEXT,
  page_number INTEGER CHECK (page_number IS NULL OR page_number >= 0),
  scroll_ratio NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (scroll_ratio >= 0 AND scroll_ratio <= 1),
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, book_id, source)
);

ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public demo read/write reading_progress" ON public.reading_progress;
CREATE POLICY "Public demo read/write reading_progress"
  ON public.reading_progress FOR ALL
  USING (true) WITH CHECK (true);
```

Catatan keamanan:

- Policy `USING (true)` mengikuti pola tabel demo yang sudah ada. Ini **hanya aman untuk demo sekolah**, bukan data publik sungguhan.
- Tidak ada foreign key ke `profiles` atau `books`, karena ID demo dan ID buku hasil impor belum tentu ada di database. Ini mencegah kegagalan insert.
- Saat autentikasi sungguhan diterapkan, `user_id` harus dimigrasikan ke `auth.uid()` dan policy diganti menjadi berbasis user.

File migrasi terpisah `supabase/reading_progress.sql` disediakan agar database yang sudah pernah dibuat bisa menjalankan bagian ini saja. Isinya identik dan idempoten.

---

## 7. Perubahan UI & Responsivitas

### Reader teks

- Header dipecah menjadi dua area yang membungkus di layar kecil:
  - identitas buku + tombol tutup,
  - grup kontrol: tema, ukuran huruf, narator, fullscreen.
- Di bawah `sm`, label teks disembunyikan; tombol menjadi ikon dengan `aria-label` dan target sentuh minimal 32–36 px.
- Grup narator memakai `flex` dan tidak memaksa header melebar.
- Footer tetap seperti sekarang (progress + navigasi), dengan teks progress yang juga dipakai untuk toast bookmark.
- Toast global dinaikkan ke `z-[60]` agar terlihat di atas modal `z-50`.

### PDF viewer

- Toggle tema ditambahkan di header, di samping tombol reload/fullscreen.
- Notice bar menampilkan "Terakhir dibuka" dan catatan bahwa narator/halaman PDF belum tersedia untuk tautan eksternal.
- Header tetap `flex-wrap` agar tombol tidak terpotong di HP.

---

## 8. File yang Akan Berubah

| File | Perubahan |
|---|---|
| `src/components/EGrimoireReaderModal.jsx` | Tema baru + default, persistensi, TTS, progress, restore, reset state antar-buku, Escape, ref scroll. |
| `src/components/FullScreenPdfViewerModal.jsx` | Toggle tema, filter anti-silau, "terakhir dibuka", terima `currentUser`. |
| `src/App.jsx` | Kirim `showToast` + `currentUser` ke reader dan PDF viewer; naikkan z-index toast. |
| `src/hooks/useSpeechNarrator.js` | Baru — logika Web Speech API. |
| `src/utils/readingProgress.js` | Baru — helper LocalStorage + Supabase. |
| `supabase/schema.sql` | Tabel `reading_progress`, RLS, policy. |
| `supabase/reading_progress.sql` | Baru — migrasi idempoten untuk database yang sudah ada. |
| `README.md` | Dokumentasi singkat fitur + batasan PDF (opsional, disarankan). |

Tidak ada dependensi npm baru.

---

## 9. Edge Case & Penanganan

| Kasus | Penanganan |
|---|---|
| LocalStorage diblokir/penuh | `try/catch`; aplikasi tetap berjalan tanpa persistensi. |
| JSON rusak | Diabaikan, kembali ke default. |
| Buku tanpa bab / konten kosong | Guard `chapters.length`; tampilkan state kosong, jangan crash. |
| Ganti buku saat modal tetap terbuka | Reset `currentPageIndex`, `hasClaimedXp`, fullscreen, dan hentikan narator sebelum restore buku baru. |
| Ganti role saat reader terbuka | Key progress/tema mengikuti `currentUser.id` baru; muat ulang preferensi. |
| Supabase error | `{ error }` diperiksa, `console.warn`, UI tetap lokal. |
| Remote lebih baru | Diterapkan hanya bila siswa belum berpindah halaman. |
| Browser tanpa TTS | Kontrol nonaktif + tooltip; fitur lain tetap jalan. |
| Chrome memotong ucapan panjang | Teks dipecah per kalimat. |
| PDF Google Drive | Tetap iframe; filter tema jalan, TTS/halaman tidak tersedia. |
| PDF langsung | Tetap iframe pada iterasi ini; belum ada page tracking. |

---

## 10. Verifikasi

- `npm run build` harus lulus tanpa error.
- Tidak ada script `lint` di proyek; build produksi menjadi gerbang verifikasi utama.
- Uji manual:
  - Tema default gelap, toggle ke Parchment, refresh → preferensi tetap.
  - TTS Play → Pause → Resume → Stop; pindah bab → narator berhenti.
  - Pindah ke bab 2, tutup, buka lagi → toast "Melanjutkan dari halaman 2" dan posisi pulih.
  - Scroll di bab, tutup, buka → rasio scroll mendekati posisi sebelumnya.
  - Supabase nonaktif → tidak ada error di console; LocalStorage tetap bekerja.
  - PDF viewer → toggle tema mengubah filter; badge "terakhir dibuka" muncul.
  - Lebar 360 px dan desktop → toolbar tidak terpotong.

---

## 11. Risiko

| Risiko | Tingkat | Mitigasi |
|---|---|---|
| Suara `id-ID` tidak terpasang di perangkat siswa | Sedang | Fallback voice default + catatan halus; tidak memblokir fitur. |
| Kebiasaan `speechSynthesis` Chrome (pause/panjang teks) | Sedang | Chunking + cancel sebelum mulai + cleanup. |
| Policy Supabase demo terbuka | Tinggi untuk produksi | Ditandai jelas; hanya untuk demo; migrasi auth di masa depan. |
| Perbedaan persepsi "halaman" (bab vs halaman PDF) | Rendah | Toast memakai istilah halaman yang sama dengan footer reader; PDF tidak diklaim memiliki nomor halaman. |
| Progress remote menimpa posisi lokal yang lebih baru | Rendah | Bandingkan `updatedAt`; hanya terapkan bila siswa belum navigasi. |
| Filter PDF membuat gambar aneh | Rendah | Nilai filter konservatif; bisa disetel setelah uji visual. |

---

## 12. Persetujuan

Design ini siap dieksekusi setelah disetujui. Setelah persetujuan, langkah berikutnya adalah menyusun implementation plan terperinci sebelum menyentuh kode.
