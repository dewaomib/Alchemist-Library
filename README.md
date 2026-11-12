# ⚗️ The Grand Alchemist's Archive

> *"Ignis Aurum Probat — Scientia Mentem Ditavit"*  
> Perpustakaan sekolah interaktif bertema **Medieval Fantasy & Magic Alchemy** yang memadukan estetika arsip kuno, gamifikasi literasi siswa, peramu rekomendasi buku (*Alchemical Mixer*), dan persistensi **Supabase** dengan *automatic local mock fallback*.

---

## ✨ Sorotan & Fitur Utama

### 1. 🏛️ The Great Hall (Beranda Utama)
- **Scrying Mirror Search:** Pencarian cepat langsung menuju katalog *Vault of Tomes*.
- **Archive Telemetry:** Statistik total grimoire, cendekiawan aktif, dan ramuan yang telah diracik.
- **Featured Grimoires:** Koleksi kitab unggulan pilihan kurator.
- **Guild Quest Board:** Tantangan membaca berhadiah **Scholar XP** dan lencana gelar (*Badges*).

### 2. 📚 Vault of Tomes (Katalog Pustaka)
- Pencarian berdasarkan judul, sub-judul fantasi, pengarang, atau sinopsis.
- Filter berdasarkan **Schools of Lore** (*Bard's Tales*, *Alchemy & Natural Science*, *Ancient Lore & Chronicles*, *Artificer & Digital Weave*, *High Philosophy & Mind*) dan status ketersediaan (*In the Vault* vs *Summoned*).
- **Open Ancient Scroll Inspection Modal:** Klik kartu buku mana saja untuk membuka gulungan grimoire berisi sinopsis lengkap, **ISBN**, **lokasi rak**, **jumlah halaman**, hadiah **XP membaca**, serta daftar **Scholar's Notes** (ulasan siswa).

### 3. 🧪 Alchemical Mixer (Peramu Rekomendasi Buku)
- Pilih hingga **3 Reagen Suasana Hati** (*Mysterious Shadow*, *Scientific Spark*, *Fast-Paced Wind*, *Ancient Wisdom*, *Heartwarming Ember*, *Arcane Philosophy*, *Artificer's Gear*, *Nature's Elixir*).
- Animasi kuali alkimia yang menghasilkan ramuan rekomendasi buku lengkap dengan persentase resonansi kecocokan.

### 4. 🛡️ Scholar's Sanctum (Profil Siswa & Gamifikasi)
- **Guild Member Card:** Identitas cendekiawan, level, pangkat serikat dinamis, *XP progress bar*, dan koleksi lencana (*Potion Badges*).
- **Currently Summoned Tomes:** Daftar buku yang sedang dipinjam lengkap dengan **Mana Timer** (sisa hari sebelum jatuh tempo).
- **Return & Scholar's Note:** Kembalikan buku sambil memberi **rating bintang (1–5)** dan ulasan tertulis yang otomatis menambah **Scholar XP**, memicu **Level Up** saat melampaui batas XP, dan memperbarui ulasan buku di katalog.

### 5. 📜 Archivist's Chamber (Panel Kurator / Admin)
- **Inscribe New Grimoire:** Formulir penambahan kitab baru ke katalog.
- **Active Loan Ledger:** Pantau seluruh peminjaman aktif dengan aksi **Extend (+7 Hari)** atau **Recall** (penarikan paksa ke rak vault).
- **Lore Distribution Analytics:** Ringkasan distribusi koleksi di tiap cabang keilmuan.

### 6. 🔔 Magical Scroll Pop-Up & Arcane Chimes
- Notifikasi pop-up berbentuk **gulungan sihir** disertai efek suara lembut (*Web Audio API*, dapat di-mute/unmute dari navbar) saat meminjam buku, meracik rekomendasi, mengklaim XP, atau naik level (*Level Up*).

---

## 🎨 Sistem Visual & Tema

| Elemen | Nilai | Karakter |
| :--- | :--- | :--- |
| **Background Primary** | `#12100E` | *Obsidian Wood* |
| **Surface / Cards** | `#1E1916` | *Dark Leather* + border emas (`#D4AF37` 20%) |
| **Text Primary / Muted** | `#F4E8C1` / `#A89F91` | *Aged Parchment* |
| **Accents** | `#D4AF37` / `#10B981` / `#8B5CF6` | *Alchemical Gold*, *Emerald Potion*, *Arcane Purple* |
| **Typography** | `Cinzel` & `Plus Jakarta Sans` | Judul seremonial & teks modern |

---

## 🛠️ Tech Stack

- **Frontend:** React 19 + Vite 6
- **Styling:** Tailwind CSS 3 (custom theme tokens & scroll/cauldron animations)
- **Icons & Effects:** `lucide-react`, `canvas-confetti`, Web Audio API chimes
- **Backend / Persistence (Opsional):** Supabase (`@supabase/supabase-js`) + PostgreSQL Schema (`supabase/schema.sql`) dengan fallback otomatis ke mock data lokal

---

## 📁 Struktur Proyek

```text
alchemist-archive/
├─ supabase/
│  └─ schema.sql                 # Skema PostgreSQL (profiles, books, loans, reviews, quests) + seed data
├─ src/
│  ├─ components/
│  │  ├─ Navbar.jsx              # Navigasi utama, indikator level & toggle suara
│  │  ├─ Footer.jsx              # Footer akademi
│  │  ├─ TomeCard.jsx            # Kartu buku interaktif (klik kartu untuk inspect)
│  │  ├─ TomeModal.jsx           # Modal gulungan kuno (sinopsis, ISBN, rak, XP, Scholar's Notes)
│  │  ├─ ReturnTomeModal.jsx     # Modal pengembalian buku, rating bintang & ulasan
│  │  └─ NotificationToast.jsx   # Pop-up notifikasi berbentuk gulungan sihir
│  ├─ data/
│  │  └─ mockData.js             # Data awal 14 buku, 3 quest, 8 reagen, & profil cendekiawan
│  ├─ lib/
│  │  └─ supabaseClient.js       # Inisialisasi Supabase client & deteksi env vars
│  ├─ services/
│  │  └─ archiveService.js       # Service layer Supabase + fallback otomatis ke mock data
│  ├─ utils/
│  │  └─ soundEffects.js         # Sintesis efek suara Web Audio API
│  ├─ views/
│  │  ├─ GreatHallView.jsx
│  │  ├─ VaultOfTomesView.jsx
│  │  ├─ AlchemicalMixerView.jsx
│  │  ├─ ScholarSanctumView.jsx
│  │  └─ ArchivistChamberView.jsx
│  ├─ App.jsx
│  ├─ main.jsx
│  └─ index.css
├─ .env.example
├─ package.json
├─ tailwind.config.js
└─ vite.config.js
```

---

## 🚀 Cara Menjalankan Secara Lokal

### 1. Clone & Masuk ke Direktori Proyek
```bash
git clone https://github.com/dewaomib/Alchemist-Library.git
cd Alchemist-Library
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Jalankan Aplikasi (Mode Mock Fallback Langsung Jalan)
Tanpa konfigurasi `.env`, aplikasi tetap dapat dijalankan sepenuhnya menggunakan data mock lokal:
```bash
npm run dev
```
Buka **`http://localhost:5173`** di browser Anda.

---

## 🗄️ Menghubungkan ke Supabase (Mode Live Persistence)

1. Buat project baru di [Supabase](https://supabase.com/).
2. Buka **SQL Editor** di dashboard Supabase, lalu jalankan seluruh isi file [`supabase/schema.sql`](supabase/schema.sql) untuk membuat tabel `profiles`, `books`, `loans`, `reviews`, dan `quests` beserta data awal (*seed*).
3. Salin file `.env.example` menjadi `.env` dan isi kredensial project Anda:
   ```bash
   cp .env.example .env
   ```
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
4. Restart server Vite (`npm run dev`). Indikator di pojok kanan atas aplikasi akan berubah menjadi **`Supabase Archive Live`**.

---

## 📜 Lisensi & Kredit
Dibangun sebagai aplikasi perpustakaan sekolah interaktif bertema alkimia fantasi. Selamat menjelajahi **The Grand Alchemist's Archive**! ⚗️✨
