import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  BookOpen,
  FlaskConical,
  Scroll,
  Shield,
  Flame,
  Compass,
  Search,
  Star,
  Award,
  Clock,
  CheckCircle,
  Plus,
  X,
  Eye,
  Database,
  RefreshCw,
  Layers,
  MapPin,
  FileText,
  Hash,
  MessageSquareQuote,
  Check,
  UserCheck,
  Crown,
  GraduationCap,
  KeyRound,
  Send,
  XCircle,
  AlertCircle,
  CheckSquare,
  BookMarked
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import RoleSwitcherBar, { PRESET_USERS } from './components/RoleSwitcherBar';
import GatekeeperAuthModal from './components/GatekeeperAuthModal';
import EGrimoireReaderModal from './components/EGrimoireReaderModal';
import RejectionReasonModal from './components/RejectionReasonModal';
import MentorsSanctumView from './components/MentorsSanctumView';
import ArchivistsChamberView from './components/ArchivistsChamberView';
import ScholarsSanctumView from './components/ScholarsSanctumView';
import FullScreenPdfViewerModal from './components/FullScreenPdfViewerModal';
import ReadingLogModal from './components/ReadingLogModal';
import ClassLeaderboard from './components/ClassLeaderboard';
import { DIGITAL_TOMES_CATALOG, getDigitalTomeContent } from './data/digitalTomesContent';
import { SAMPLE_MEMBERS } from './data/sampleMembers';
import { buildInitialLoans } from './data/sampleLoans';
import { buildInitialReadingLogs } from './data/sampleReadingLogs';
import { enrichBook } from './utils/libraryUtils';
import {
  addDays,
  formatDateID,
  formatMonthID,
  getLoanDurationDays,
  getMonthKey,
  toISODate
} from './utils/loanUtils';
import {
  buildClassLeaderboard,
  getReadingLogWordCount,
  normalizeClassName
} from './utils/readingUtils';

const LOCAL_STORAGE_PREFIX = 'alchemist-archive:v2';

function readStoredState(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(`${LOCAL_STORAGE_PREFIX}:${key}`);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // Data lokal rusak atau diblokir; gunakan data contoh.
  }
  return fallback;
}

function writeStoredState(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${LOCAL_STORAGE_PREFIX}:${key}`, JSON.stringify(value));
  } catch {
    // Kuota penuh / mode privat: abaikan, aplikasi tetap berjalan.
  }
}

function getIdentityKeys(user) {
  if (!user) return [];
  return [user.id, user.profileId, user.studentId, user.guildId, user.cardCode, user.name, user.email]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
}

function isLoanOwnedByUser(loan, user) {
  const keys = getIdentityKeys(user);
  if (keys.length === 0 || !loan) return false;
  return [loan.profileId, loan.borrowerCard, loan.borrowerName, loan.requesterName, loan.requesterEmail]
    .filter(Boolean)
    .some((value) => keys.includes(String(value).toLowerCase()));
}

function isReadingLogOwnedByUser(log, user) {
  const keys = getIdentityKeys(user);
  if (keys.length === 0 || !log) return false;
  return [log.profileId, log.studentCard, log.studentId, log.studentName]
    .filter(Boolean)
    .some((value) => keys.includes(String(value).toLowerCase()));
}

// ==========================================
// 6 ALCHEMICAL INGREDIENTS (STEP 4)
// ==========================================
const INGREDIENTS = [
  {
    id: 'shadow',
    name: 'Shadow Mist',
    indoName: 'Kabut Misteri',
    categoryTag: 'Misteri & Teka-teki',
    desc: 'Ekstrak bayangan malam untuk kisah penuh konspirasi rahasia, detektif, dan ketegangan mistis.',
    color: '#8B5CF6',
    bgGlow: 'rgba(139, 92, 246, 0.25)',
    borderClass: 'border-purple-500/60',
    symbol: '☽',
    iconType: 'sparkles'
  },
  {
    id: 'spark',
    name: 'Solar Spark',
    indoName: 'Percikan Sains',
    categoryTag: 'Sains & Eksperimen',
    desc: 'Percikan energi kosmos bagi pencari hukum fisika alam, biologi seluler, dan kimia molekuler.',
    color: '#10B981',
    bgGlow: 'rgba(16, 185, 129, 0.25)',
    borderClass: 'border-emerald-500/60',
    symbol: '☉',
    iconType: 'flask'
  },
  {
    id: 'wind',
    name: 'Zephyr Wind',
    indoName: 'Alur Kilat',
    categoryTag: 'Petualangan Cepat & Laga',
    desc: 'Hembusan angin dunia paralel yang membawa alur cerita cepat, laga sihir, dan aksi memikat.',
    color: '#38BDF8',
    bgGlow: 'rgba(56, 189, 248, 0.25)',
    borderClass: 'border-sky-400/60',
    symbol: '🜁',
    iconType: 'compass'
  },
  {
    id: 'wisdom',
    name: 'Ancient Wisdom',
    indoName: 'Kebijaksanaan Kuno',
    categoryTag: 'Sejarah & Peradaban',
    desc: 'Gulungan purba yang menyimpan memori peradaban manusia, epik Nusantara, dan hikmah masa silam.',
    color: '#D4AF37',
    bgGlow: 'rgba(212, 175, 55, 0.25)',
    borderClass: 'border-amber-500/60',
    symbol: '🜃',
    iconType: 'scroll'
  },
  {
    id: 'ember',
    name: 'Phoenix Ember',
    indoName: 'Api Perjuangan',
    categoryTag: 'Persahabatan & Inspirasi',
    desc: 'Bara api abadi yang menyulut tekad belajar, persahabatan sejati, dan ketangguhan mental anak bangsa.',
    color: '#F59E0B',
    bgGlow: 'rgba(245, 158, 11, 0.25)',
    borderClass: 'border-amber-500/60',
    symbol: '🜂',
    iconType: 'flame'
  },
  {
    id: 'craft',
    name: 'Artificer Rune',
    indoName: 'Rune Logika & Tekno',
    categoryTag: 'Koding & Algoritma',
    desc: 'Ukiran rune presisi para Artificer untuk menempa algoritma komputer, struktur data, dan kode bersih.',
    color: '#06B6D4',
    bgGlow: 'rgba(6, 182, 212, 0.25)',
    borderClass: 'border-cyan-400/60',
    symbol: '✧',
    iconType: 'shield'
  }
];

// Presets for quick Cauldron experimentation
const PRESET_RECIPES = [
  {
    name: 'Elixir of Astral Mind',
    label: 'Ramuan Penjelajah Semesta',
    ingredients: ['spark', 'wisdom'],
    desc: 'Perpaduan Sains Kosmik & Sejarah Peradaban'
  },
  {
    name: 'Draught of Brave Hearts',
    label: 'Ramuan Ksatria Persahabatan',
    ingredients: ['wind', 'ember', 'shadow'],
    desc: 'Petualangan Seru, Misteri & Persahabatan'
  },
  {
    name: 'Tincture of the Master Artificer',
    label: 'Ramuan Arsitek Pikiran',
    ingredients: ['craft', 'ember'],
    desc: 'Logika, Kebiasaan Baru & Mental Baja'
  },
  {
    name: 'Nocturnal Sleuth Draught',
    label: 'Ramuan Detektif Malam',
    ingredients: ['shadow', 'craft', 'wind'],
    desc: 'Deduksi Tajam, Misteri & Investigasi'
  },
  {
    name: 'Elixir of the Young Scientist',
    label: 'Eliksir Ilmuwan Muda',
    ingredients: ['spark', 'craft'],
    desc: 'Sains Eksperimental & Logika Algoritma'
  }
];

// ==========================================
// KATEGORI BUKU (SCHOOLS OF LORE)
// ==========================================
const SCHOOLS_OF_LORE = [
  { id: 'All', name: 'All Lore', indo: 'Semua Pustaka' },
  { id: 'Alchemy', name: 'Alchemy', indo: 'Sains & Alam' },
  { id: 'Ancient Lore', name: 'Ancient Lore', indo: 'Sejarah & Peradaban' },
  { id: 'Bards Tales', name: "Bard's Tales", indo: 'Fiksi & Sastra' },
  { id: 'Artificers Craft', name: "Artificer's Craft", indo: 'Teknologi & Koding' },
  { id: 'Philosophy', name: 'Philosophy', indo: 'Filsafat & Budi Pekerti' }
];

// ==========================================
// 12 INDONESIAN SCHOOL LIBRARY BOOKS (STEP 4)
// ==========================================
const INITIAL_BOOKS = [
  {
    id: 'book-1',
    title: 'Bumi',
    subtitle: 'Chronicles of the Parallel Clan',
    author: 'Tere Liye',
    category: 'Bards Tales',
    categoryLabel: "Bard's Tales (Fiksi & Sastra)",
    rating: 4.9,
    xpReward: 120,
    pages: 440,
    isbn: '978-602-03-0112-9',
    shelf: 'Menara Barat • Rak Sastra Nusantara A1',
    status: 'available',
    available: true,
    totalStock: 5,
    availableStock: 3,
    hasDigital: true,
    digitalContent: DIGITAL_TOMES_CATALOG['book-1'],
    popular: true,
    coverRune: '☽',
    coverGradient: 'from-indigo-950 via-purple-900 to-slate-900',
    accentColor: '#8B5CF6',
    ingredients: ['wind', 'shadow', 'ember'],
    synopsis:
      'Kisah Raib, murid SMA yang mampu menghilang dengan menutup wajahnya dengan kedua telapak tangan. Bersama Seli yang mengendalikan petir dan Ali sang jenius yang menyembunyikan intelek luar biasa, mereka terlempar melintasi portal menuju Klan Bulan, mengungkap konspirasi purba Tamus.',
    reviews: [
      {
        id: 'r1',
        user: 'Nadia • Apprentice Kelas X',
        rating: 5,
        date: '3 hari lalu',
        comment: 'Dunia paralelnya terasa hidup sekali! Cocok buat yang suka petualangan sihir modern.'
      },
      {
        id: 'r2',
        user: 'Dimas • Adept Scholar XI',
        rating: 5,
        date: '1 minggu lalu',
        comment: 'Karakter Ali benar-benar definisi Artificer sejati. Wajib baca!'
      }
    ]
  },
  {
    id: 'book-2',
    title: 'Laskar Pelangi',
    subtitle: 'Scroll of the Ten Belitung Scholars',
    author: 'Andrea Hirata',
    category: 'Bards Tales',
    categoryLabel: "Bard's Tales (Fiksi & Sastra)",
    rating: 5.0,
    xpReward: 130,
    pages: 529,
    isbn: '978-979-3062-79-2',
    shelf: 'Menara Barat • Rak Sastra Nusantara A2',
    status: 'available',
    available: true,
    totalStock: 6,
    availableStock: 4,
    hasDigital: true,
    digitalContent: DIGITAL_TOMES_CATALOG['book-2'],
    popular: true,
    coverRune: '🜂',
    coverGradient: 'from-amber-950 via-orange-900 to-stone-900',
    accentColor: '#F59E0B',
    ingredients: ['ember', 'wisdom'],
    synopsis:
      'Perjuangan sepuluh anak di Pulau Belitung yang menimba ilmu di sekolah Muhammadiyah yang nyaris roboh bersama guru inspiratif Ibu Muslimah. Sebuah grimoire tentang mimpi, persahabatan, dan ketekunan tanpa batas.',
    reviews: [
      {
        id: 'r3',
        user: 'Raka • Scholar Kelas XII',
        rating: 5,
        date: '5 hari lalu',
        comment: 'Membaca kisah Lintang membuat semangat belajarku langsung naik 200%!'
      }
    ]
  },
  {
    id: 'book-3',
    title: "Harry Potter & the Philosopher's Stone",
    subtitle: 'The Alchemist Prophecy of Hogwarts',
    author: 'J.K. Rowling',
    category: 'Bards Tales',
    categoryLabel: "Bard's Tales (Fiksi & Sastra)",
    rating: 4.9,
    xpReward: 140,
    pages: 384,
    isbn: '978-602-03-0305-5',
    shelf: 'Menara Barat • Rak Fantasi Klasik B1',
    status: 'borrowed',
    available: true,
    totalStock: 4,
    availableStock: 2,
    hasDigital: true,
    digitalContent: DIGITAL_TOMES_CATALOG['book-3'],
    popular: true,
    coverRune: '✦',
    coverGradient: 'from-rose-950 via-red-950 to-neutral-950',
    accentColor: '#EF4444',
    ingredients: ['shadow', 'wind', 'wisdom'],
    synopsis:
      'Harry Potter mengetahui bahwa ia adalah penyihir dan diundang ke Sekolah Sihir Hogwarts. Di sana ia mempelajari rahasia Batu Bertuah—artefak alkimia purba karya Nicolas Flamel yang mampu mengubah logam menjadi emas murni serta memberikan keabadian.',
    reviews: [
      {
        id: 'r4',
        user: 'Arya Pendragon • Scholar',
        rating: 5,
        date: 'Sedang dipinjam',
        comment: 'Konsep ramuan alkimia Snape dan Batu Bertuah Flamel luar biasa menarik!'
      }
    ]
  },
  {
    id: 'book-4',
    title: 'Fisika Dasar: Mekanika & Termodinamika',
    subtitle: 'Laws of Celestial & Kinetic Forces',
    author: 'Halliday, Resnick & Walker',
    category: 'Alchemy',
    categoryLabel: 'Alchemy (Sains & Misteri)',
    rating: 4.7,
    xpReward: 160,
    pages: 680,
    isbn: '978-979-075-812-4',
    shelf: 'Menara Timur • Meja Eksperimen Fisika A1',
    status: 'borrowed',
    available: false,
    totalStock: 4,
    availableStock: 0,
    hasDigital: true,
    digitalContent: DIGITAL_TOMES_CATALOG['book-4'],
    popular: true,
    coverRune: '☉',
    coverGradient: 'from-emerald-950 via-teal-950 to-zinc-950',
    accentColor: '#10B981',
    ingredients: ['spark', 'craft'],
    synopsis:
      'Prinsip fundamental gerak partikel, hukum kekekalan energi mekanik, dinamika fluida, hingga hukum termodinamika semesta. Intisari ilmu bagi alkemis yang ingin menguasai gaya-gaya alam.',
    reviews: [
      {
        id: 'r5',
        user: 'Gilang • Peneliti Muda XII',
        rating: 5,
        date: '2 minggu lalu',
        comment: 'Soal-soalnya menantang logika, penjelasannya sangat mendalam.'
      }
    ]
  },
  {
    id: 'book-5',
    title: 'Biologi Seluler & Genetika Molekuler',
    subtitle: 'Codex of Living Transmutations',
    author: 'Neil A. Campbell & Jane Reece',
    category: 'Alchemy',
    categoryLabel: 'Alchemy (Sains & Misteri)',
    rating: 4.8,
    xpReward: 155,
    pages: 620,
    isbn: '978-979-075-430-0',
    shelf: 'Menara Timur • Rak Herbarium Bio B2',
    status: 'available',
    available: true,
    totalStock: 5,
    availableStock: 3,
    hasDigital: true,
    digitalContent: getDigitalTomeContent({ title: 'Biologi Seluler & Genetika Molekuler', author: 'Neil A. Campbell', category: 'Alchemy' }),
    popular: false,
    coverRune: '🜁',
    coverGradient: 'from-green-950 via-emerald-950 to-neutral-950',
    accentColor: '#10B981',
    ingredients: ['spark', 'wisdom'],
    synopsis:
      'Eksplorasi kode kehidupan di dalam heliks ganda DNA, sintesis protein seluler, pembelahan mitosis-meiosis, serta rekayasa genetika modern yang menjembatani sains dengan transmutasi biologis.',
    reviews: [
      {
        id: 'r6',
        user: 'Citra • Tim Olimpiade Bio',
        rating: 5,
        date: '4 hari lalu',
        comment: 'Ilustrasi membran sel dan replikasi DNA sangat jernih.'
      }
    ]
  },
  {
    id: 'book-6',
    title: 'Struktur Data & Algoritma Dasar',
    subtitle: 'Scroll of Computational Sigils',
    author: 'Rinaldi Munir',
    category: 'Artificers Craft',
    categoryLabel: "Artificer's Craft (Teknologi & Koding)",
    rating: 4.8,
    xpReward: 145,
    pages: 410,
    isbn: '978-602-8758-87-1',
    shelf: 'Ruang Artificer • Meja Kode Kriptik D1',
    status: 'available',
    available: true,
    totalStock: 4,
    availableStock: 2,
    hasDigital: true,
    digitalContent: DIGITAL_TOMES_CATALOG['book-6'],
    popular: true,
    coverRune: '✧',
    coverGradient: 'from-cyan-950 via-blue-950 to-neutral-950',
    accentColor: '#06B6D4',
    ingredients: ['craft', 'spark'],
    synopsis:
      'Fondasi logika komputasi: algoritma rekursif, pengurutan quicksort, pohon biner (Binary Trees), dan graf. Ditulis dengan pendekatan bertahap yang menempa ketajaman logika para calon arsitek perangkat lunak.',
    reviews: [
      {
        id: 'r7',
        user: 'Farhan • Klub Robotik X',
        rating: 5,
        date: '6 hari lalu',
        comment: 'Wajib dipelajari kalau mau paham dasar logika pemrograman terstruktur.'
      }
    ]
  },
  {
    id: 'book-7',
    title: 'Atomic Habits',
    subtitle: 'Transmutation of Small Deeds',
    author: 'James Clear',
    category: 'Philosophy',
    categoryLabel: 'Philosophy (Filsafat & Budi Pekerti)',
    rating: 4.9,
    xpReward: 125,
    pages: 352,
    isbn: '978-602-06-3317-6',
    shelf: 'Aula Utama • Rak Pengembangan Diri C4',
    status: 'available',
    available: true,
    totalStock: 6,
    availableStock: 5,
    hasDigital: true,
    digitalContent: DIGITAL_TOMES_CATALOG['book-7'],
    popular: true,
    coverRune: '🜂',
    coverGradient: 'from-amber-950 via-yellow-950 to-stone-950',
    accentColor: '#D4AF37',
    ingredients: ['craft', 'ember'],
    synopsis:
      'Perubahan kecil 1% setiap hari yang berlipat ganda menjadi hasil luar biasa. Sistem praktis membangun kebiasaan baik, memutus rantai kebiasaan buruk, dan menguasai disiplin diri dalam menuntut ilmu.',
    reviews: [
      {
        id: 'r8',
        user: 'Anisa • Dewan Ambalan XI',
        rating: 5,
        date: '1 hari lalu',
        comment: 'Konsep 1% better every day sangat mengubah cara saya membagi waktu belajar.'
      }
    ]
  },
  {
    id: 'book-8',
    title: 'Laut Bercerita',
    subtitle: 'Voices from the Depths of Truth',
    author: 'Leila S. Chudori',
    category: 'Ancient Lore',
    categoryLabel: 'Ancient Lore (Sejarah & Peradaban)',
    rating: 4.9,
    xpReward: 135,
    pages: 394,
    isbn: '978-602-424-694-5',
    shelf: 'Menara Barat • Rak Sejarah & Sastra B3',
    status: 'available',
    available: true,
    totalStock: 4,
    availableStock: 3,
    hasDigital: true,
    digitalContent: getDigitalTomeContent({ title: 'Laut Bercerita', author: 'Leila S. Chudori', category: 'Ancient Lore' }),
    popular: true,
    coverRune: '🜃',
    coverGradient: 'from-blue-950 via-slate-900 to-indigo-950',
    accentColor: '#38BDF8',
    ingredients: ['wisdom', 'shadow', 'ember'],
    synopsis:
      'Kronik emosional aktivis mahasiswa era 1998 yang diculik dan dihilangkan. Bagian pertama disuarakan oleh Biru Laut dari dasar samudera, bagian kedua diisi oleh Asmara Jati yang mencari kepastian keluarganya.',
    reviews: [
      {
        id: 'r9',
        user: 'Bagas • Ekskul Jurnalistik XII',
        rating: 5,
        date: '3 hari lalu',
        comment: 'Sangat menyentuh hati. Mengajarkan arti keberanian memperjuangkan keadilan.'
      }
    ]
  },
  {
    id: 'book-9',
    title: 'Filosofi Teras',
    subtitle: 'Stoic Armor of the Young Mind',
    author: 'Henry Manampiring',
    category: 'Philosophy',
    categoryLabel: 'Philosophy (Filsafat & Budi Pekerti)',
    rating: 4.8,
    xpReward: 120,
    pages: 346,
    isbn: '978-602-412-518-9',
    shelf: 'Aula Utama • Rak Filsafat Populer C2',
    status: 'available',
    available: true,
    totalStock: 5,
    availableStock: 4,
    hasDigital: true,
    digitalContent: getDigitalTomeContent({ title: 'Filosofi Teras', author: 'Henry Manampiring', category: 'Philosophy' }),
    popular: false,
    coverRune: '🜃',
    coverGradient: 'from-stone-900 via-neutral-900 to-amber-950',
    accentColor: '#D4AF37',
    ingredients: ['wisdom', 'spark'],
    synopsis:
      'Penerapan filsafat Stoa kuno Yunani-Romawi yang disesuaikan untuk generasi muda Indonesia menghadapi kekhawatiran, overthinking, dan emosi negatif melalui dikotomi kendali mental.',
    reviews: [
      {
        id: 'r10',
        user: 'Maya • Konselor Sebaya XI',
        rating: 5,
        date: '1 minggu lalu',
        comment: 'Membantu sekali meredakan cemas saat musim ujian sekolah!'
      }
    ]
  },
  {
    id: 'book-10',
    title: 'Kimia Organik & Reaksi Transmutasi Zat',
    subtitle: 'Handbook of Carbon Alchemy',
    author: 'Fessenden & Fessenden',
    category: 'Alchemy',
    categoryLabel: 'Alchemy (Sains & Misteri)',
    rating: 4.7,
    xpReward: 165,
    pages: 580,
    isbn: '978-979-075-920-6',
    shelf: 'Menara Timur • Meja Tabung Reaksi B3',
    status: 'borrowed',
    available: false,
    totalStock: 3,
    availableStock: 0,
    hasDigital: true,
    digitalContent: getDigitalTomeContent({ title: 'Kimia Organik & Reaksi Transmutasi Zat', author: 'Fessenden & Fessenden', category: 'Alchemy' }),
    popular: false,
    coverRune: '☉',
    coverGradient: 'from-amber-950 via-yellow-950 to-neutral-950',
    accentColor: '#D4AF37',
    ingredients: ['spark', 'craft'],
    synopsis:
      'Membongkar struktur rantai hidrokarbon, ikatan kovalen molekul, dan reaksi esterifikasi layaknya alkemis yang mengubah intisari zat menjadi senyawa baru penuh khasiat.',
    reviews: [
      {
        id: 'r11',
        user: 'Tito • Scholar XI',
        rating: 5,
        date: '5 hari lalu',
        comment: 'Diagram mekanismenya bikin rumus kimia organik jadi gampang diingat.'
      }
    ]
  },
  {
    id: 'book-11',
    title: 'The Adventures of Sherlock Holmes',
    subtitle: 'The Art of Deductive Scrying',
    author: 'Arthur Conan Doyle',
    category: 'Bards Tales',
    categoryLabel: "Bard's Tales (Fiksi & Sastra)",
    rating: 4.9,
    xpReward: 125,
    pages: 350,
    isbn: '978-602-03-2415-9',
    shelf: 'Menara Barat • Rak Detektif & Misteri A7',
    status: 'available',
    available: true,
    totalStock: 5,
    availableStock: 3,
    hasDigital: true,
    digitalContent: getDigitalTomeContent({ title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle', category: 'Bards Tales' }),
    popular: true,
    coverRune: '☽',
    coverGradient: 'from-slate-950 via-zinc-900 to-indigo-950',
    accentColor: '#8B5CF6',
    ingredients: ['shadow', 'craft', 'wind'],
    synopsis:
      'Kumpulan kasus legendaris Sherlock Holmes bersama Dr. Watson di London era Victoria. Pelajaran ketajaman observasi, logika deduktif murni, dan penguraian teka-teki kriminal terumit.',
    reviews: [
      {
        id: 'r12',
        user: 'Tania • Klub Sastra XII',
        rating: 5,
        date: '1 minggu lalu',
        comment: 'Melihat cara Holmes mengamati detail kecil adalah sihir logika murni!'
      }
    ]
  },
  {
    id: 'book-12',
    title: 'Sapiens: Riwayat Singkat Umat Manusia',
    subtitle: 'Genesis of Mortal Civilizations',
    author: 'Yuval Noah Harari',
    category: 'Ancient Lore',
    categoryLabel: 'Ancient Lore (Sejarah & Peradaban)',
    rating: 4.8,
    xpReward: 150,
    pages: 525,
    isbn: '978-602-424-416-3',
    shelf: 'Aula Kuno • Rak Sejarah Dunia C3',
    status: 'borrowed',
    available: true,
    totalStock: 6,
    availableStock: 4,
    hasDigital: true,
    digitalContent: getDigitalTomeContent({ title: 'Sapiens: Riwayat Singkat Umat Manusia', author: 'Yuval Noah Harari', category: 'Ancient Lore' }),
    popular: true,
    coverRune: '🜃',
    coverGradient: 'from-yellow-950 via-amber-900 to-neutral-950',
    accentColor: '#D4AF37',
    ingredients: ['wisdom', 'spark', 'craft'],
    synopsis:
      'Bagaimana Homo sapiens berhasil mendominasi planet Bumi, membangun kerajaan raksasa, menciptakan tatanan mitos uang dan hukum, serta membentuk sejarah manusia dari zaman berburu hingga era kecerdasan buatan.',
    reviews: [
      {
        id: 'r13',
        user: 'Arya Pendragon • Scholar',
        rating: 5,
        date: 'Sedang dipinjam',
        comment: 'Membuka wawasan baru tentang bagaimana mitos dan kerja sama membentuk peradaban.'
      }
    ]
  }
];

// ==========================================
// GUILD QUESTS & UNLOCKABLE BADGES
// ==========================================
const INITIAL_QUESTS = [
  {
    id: 'quest-1',
    title: 'Transmutasi Sains',
    subtitle: 'Order of Natural Alchemists',
    desc: 'Pinjam (Summon) minimal 1 buku dari cabang Alchemy / Sains.',
    xpReward: 150,
    progress: 1,
    target: 1,
    claimed: false,
    badgeName: 'Astral Voyager',
    categoryTrigger: 'Alchemy'
  },
  {
    id: 'quest-2',
    title: 'Catatan Sang Penyair',
    subtitle: 'Scribes of the Golden Quill',
    desc: "Kembalikan buku & tulis ulasan (Scholar's Note) di Scholar's Sanctum.",
    xpReward: 200,
    progress: 0,
    target: 1,
    claimed: false,
    badgeName: 'Scribe of Lore',
    categoryTrigger: 'Review'
  },
  {
    id: 'quest-3',
    title: 'Peracik Ramuan Pustaka',
    subtitle: 'Cauldron Apprentice Trial',
    desc: 'Gunakan Alchemical Mixer untuk meracik rekomendasi grimoire.',
    xpReward: 100,
    progress: 0,
    target: 1,
    claimed: false,
    badgeName: 'Potion Brewer',
    categoryTrigger: 'Mixer'
  }
];

const INITIAL_BADGES = [
  {
    id: 'badge-1',
    name: 'First Grimoire',
    indo: 'Peminjam Pertama',
    desc: 'Meminjam buku perdana di Pustaka Agung.',
    color: '#D4AF37',
    unlocked: true
  },
  {
    id: 'badge-2',
    name: 'Potion Brewer',
    indo: 'Peracik Alkimia',
    desc: 'Meracik kombinasi rekomendasi di Alchemical Mixer.',
    color: '#10B981',
    unlocked: true
  },
  {
    id: 'badge-3',
    name: 'Scribe of Lore',
    indo: 'Penulis Catatan Pustaka',
    desc: "Menulis Scholar's Note saat mengembalikan buku.",
    color: '#8B5CF6',
    unlocked: false
  },
  {
    id: 'badge-4',
    name: 'Grand Alchemist',
    indo: 'Master Literasi (600+ XP)',
    desc: 'Mencapai minimal 600 XP melalui membaca & misi.',
    color: '#EF4444',
    unlocked: false
  },
  {
    id: 'badge-5',
    name: 'Astral Voyager',
    indo: 'Penjelajah Sains',
    desc: 'Menuntaskan peminjaman buku kategori Alchemy / Sains.',
    color: '#38BDF8',
    unlocked: false
  },
  {
    id: 'badge-6',
    name: 'Timekeeper of Lore',
    indo: 'Penjaga Sejarah Kuno',
    desc: 'Menyelesaikan tantangan pembacaan kronik sejarah masa lampau.',
    color: '#D4AF37',
    unlocked: false
  }
];

// Koleksi awal diperkaya dengan kode buku, nomor panggil (DDC), dan barcode
// agar label rak serta pemindaian langsung berfungsi pada data contoh.
const ENRICHED_INITIAL_BOOKS = INITIAL_BOOKS.map((book, index) => enrichBook(book, index));

// Sirkulasi contoh: tanggal dihitung relatif terhadap hari ini sehingga
// status aktif, H-1, dan terlambat langsung terlihat saat aplikasi dibuka.
const INITIAL_LOANS = buildInitialLoans(ENRICHED_INITIAL_BOOKS);

// Jurnal refleksi literasi contoh untuk dashboard siswa & guru.
const INITIAL_READING_LOGS = buildInitialReadingLogs(ENRICHED_INITIAL_BOOKS);

// Helper: Rank progression based on XP
function getScholarRank(xp) {
  if (xp >= 800) {
    return {
      title: 'Grand Alchemist',
      level: 4,
      minXp: 800,
      nextXp: 1200,
      color: '#D4AF37'
    };
  }
  if (xp >= 600) {
    return {
      title: 'Arcane Loremaster',
      level: 3,
      minXp: 600,
      nextXp: 800,
      color: '#8B5CF6'
    };
  }
  if (xp >= 400) {
    return {
      title: 'Adept Scholar',
      level: 2,
      minXp: 400,
      nextXp: 600,
      color: '#10B981'
    };
  }
  return {
    title: 'Novice Apprentice',
    level: 1,
    minXp: 0,
    nextXp: 400,
    color: '#38BDF8'
  };
}

// Helper: Calculate remaining loan days for Mana Decay Timer
function computeDaysLeft(dueDateStr) {
  if (!dueDateStr) return 7;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    const diffMs = due.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  } catch {
    return 7;
  }
}

export default function App() {
  // Navigation: 'hall' | 'mixer' | 'vault' | 'sanctum' | 'mentor' | 'archivist'
  const [activeTab, setActiveTab] = useState('hall');

  // 3-Role Authentication State (Admin, Guru, Siswa)
  const [currentUser, setCurrentUser] = useState(PRESET_USERS.siswa);
  const [isGatekeeperOpen, setIsGatekeeperOpen] = useState(false);
  const [readingBook, setReadingBook] = useState(null);

  // Application & Student Gamification State
  const [books, setBooks] = useState(() =>
    readStoredState('books', ENRICHED_INITIAL_BOOKS).map((book, index) =>
      enrichBook(book, index)
    )
  );
  const [studentXp, setStudentXp] = useState(450);
  const [potionsBrewedCount, setPotionsBrewedCount] = useState(128);
  const [booksReadCount, setBooksReadCount] = useState(2);
  const [quests, setQuests] = useState(INITIAL_QUESTS);
  const [badges, setBadges] = useState(INITIAL_BADGES);

  // Sample member roster (students & teachers) for barcode quick loans.
  const [members] = useState(SAMPLE_MEMBERS);

  // Unified Loans Circulation State (Pending, Approved, Rejected, Returned)
  const [loans, setLoans] = useState(() => readStoredState('loans', INITIAL_LOANS));

  // GLS Reading Logs (jurnal refleksi literasi siswa)
  const [readingLogs, setReadingLogs] = useState(() =>
    readStoredState('reading_logs', INITIAL_READING_LOGS)
  );
  const [journalBook, setJournalBook] = useState(null);

  // Quick loan & bulk import process flags
  const [isSubmittingQuickLoan, setIsSubmittingQuickLoan] = useState(false);
  const [isImportingBooks, setIsImportingBooks] = useState(false);

  // Fullscreen PDF viewer state
  const [pdfViewerBook, setPdfViewerBook] = useState(null);

  // Admin Loan Rejection Modal State
  const [rejectingLoan, setRejectingLoan] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Guru Class Loan Request Form State
  const [teacherLoanForm, setTeacherLoanForm] = useState({
    bookId: '',
    quantity: 1,
    durationDays: 14,
    className: 'Kelas XI MIPA 1',
    notes: ''
  });

  // Guru One-Day Class Package Form State (Paket Keranjang Kelas)
  const [packageLoanForm, setPackageLoanForm] = useState({
    bookId: '',
    quantity: 30,
    className: 'Kelas XI MIPA 2',
    lessonHours: 'Jam ke 3-4',
    notes: ''
  });

  // Catalog search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState('all'); // 'all' | 'available' | 'out_of_stock'

  // Alchemical Mixer state
  const [selectedIngredients, setSelectedIngredients] = useState(['wind', 'shadow']);
  const [isBrewing, setIsBrewing] = useState(false);
  const [brewedResult, setBrewedResult] = useState(null);

  // Modals state
  const [inspectedBookId, setInspectedBookId] = useState(null);
  const [returningLoan, setReturningLoan] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Archivist Admin: Inscribe New Book Form State
  const [newBookForm, setNewBookForm] = useState({
    title: '',
    subtitle: '',
    author: '',
    category: 'Alchemy',
    shelf: 'Menara Timur • Rak Alkimia C1',
    kodeBuku: '',
    publisher: '',
    publicationYear: 2024,
    coverUrl: '',
    pdfUrl: '',
    ddc: '',
    callNumber: '',
    pages: 350,
    xpReward: 120,
    isbn: '978-602-000-000-0',
    totalStock: 5,
    availableStock: 5,
    digitalContentText: '',
    synopsis: '',
    ingredients: ['spark', 'craft']
  });

  const [isSeedingSupabase, setIsSeedingSupabase] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (title, message, type = 'gold') => {
    setToast({ title, message, type, id: Date.now() });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Local Grimoire Mode persistence: books & loans survive page reloads.
  useEffect(() => {
    writeStoredState('books', books);
  }, [books]);

  useEffect(() => {
    writeStoredState('loans', loans);
  }, [loans]);

  useEffect(() => {
    writeStoredState('reading_logs', readingLogs);
  }, [readingLogs]);

  // Unlock Grand Alchemist badge when student reaches 600+ XP
  useEffect(() => {
    if (studentXp >= 600) {
      setBadges((prev) =>
        prev.map((b) => (b.id === 'badge-4' ? { ...b, unlocked: true } : b))
      );
    }
  }, [studentXp]);

  const currentRank = useMemo(() => getScholarRank(studentXp), [studentXp]);

  const inspectedBook = useMemo(
    () => books.find((b) => b.id === inspectedBookId) || null,
    [books, inspectedBookId]
  );

  // Filtered loans for each role/view (strictly scoped to the active user)
  const allPendingLoans = useMemo(() => loans.filter((l) => l.status === 'pending'), [loans]);
  const allApprovedLoans = useMemo(() => loans.filter((l) => l.status === 'approved'), [loans]);
  const studentActiveLoans = useMemo(
    () =>
      loans.filter(
        (l) =>
          l.requesterRole === 'siswa' &&
          l.status === 'approved' &&
          isLoanOwnedByUser(l, currentUser)
      ),
    [loans, currentUser]
  );
  const studentPendingLoans = useMemo(
    () =>
      loans.filter(
        (l) =>
          l.requesterRole === 'siswa' &&
          l.status === 'pending' &&
          isLoanOwnedByUser(l, currentUser)
      ),
    [loans, currentUser]
  );
  const teacherLoans = useMemo(
    () =>
      loans.filter(
        (l) => l.requesterRole === 'guru' && isLoanOwnedByUser(l, currentUser)
      ),
    [loans, currentUser]
  );

  const currentMonthKey = useMemo(() => getMonthKey(new Date()), []);
  const currentUserClassName = normalizeClassName(currentUser.class || '');

  const studentReadingLogs = useMemo(
    () => readingLogs.filter((log) => isReadingLogOwnedByUser(log, currentUser)),
    [readingLogs, currentUser]
  );

  const classLeaderboard = useMemo(
    () =>
      buildClassLeaderboard({
        loans,
        readingLogs,
        monthKey: currentMonthKey
      }),
    [loans, readingLogs, currentMonthKey]
  );

  // Dynamic Navigation Tabs according to Role
  const navTabs = useMemo(() => {
    const tabs = [
      { id: 'hall', label: 'The Great Hall', sub: 'Beranda', icon: Sparkles },
      { id: 'mixer', label: 'Alchemical Mixer', sub: 'Racik Buku', icon: FlaskConical, highlight: true },
      { id: 'vault', label: 'Vault of Tomes', sub: 'Katalog', icon: BookOpen }
    ];

    if (currentUser.role === 'siswa') {
      tabs.push({
        id: 'sanctum',
        label: "Scholar's Sanctum",
        sub: 'Profil & Mana',
        icon: Shield,
        badgeCount: studentActiveLoans.length
      });
    } else if (currentUser.role === 'guru') {
      tabs.push({
        id: 'mentor',
        label: "Mentor's Sanctum",
        sub: 'Pinjaman Kelas',
        icon: GraduationCap,
        badgeCount: teacherLoans.filter((l) => l.status === 'pending' || l.status === 'approved').length,
        isGuru: true
      });
    } else if (currentUser.role === 'admin') {
      tabs.push({
        id: 'archivist',
        label: "Archivist's Chamber",
        sub: 'Admin Kurator',
        icon: Database,
        badgeCount: allPendingLoans.length,
        isAdmin: true
      });
    }

    return tabs;
  }, [currentUser, studentActiveLoans.length, teacherLoans, allPendingLoans.length]);

  // Role Switcher Handler
  const handleSwitchRole = (newUser) => {
    setCurrentUser(newUser);

    // Auto navigate if current tab is not accessible by the new role
    if (newUser.role === 'admin') {
      if (activeTab === 'sanctum' || activeTab === 'mentor') {
        setActiveTab('archivist');
      }
    } else if (newUser.role === 'guru') {
      if (activeTab === 'sanctum' || activeTab === 'archivist') {
        setActiveTab('mentor');
      }
    } else if (newUser.role === 'siswa') {
      if (activeTab === 'archivist' || activeTab === 'mentor') {
        setActiveTab('sanctum');
      }
    }

    showToast(
      `Role Aktif: ${newUser.name}`,
      `Kamu kini bertindak sebagai ${newUser.title}. Tampilan dan wewenang telah disesuaikan.`,
      newUser.role === 'admin' ? 'gold' : newUser.role === 'guru' ? 'purple' : 'emerald'
    );
  };

  // ==========================================
  // SUPABASE DATA SYNC & AUTO-SEEDING
  // ==========================================
  const executeSeedSupabase = async (isManual = false) => {
    if (!isSupabaseConfigured || !supabase) {
      if (isManual) {
        showToast(
          'Supabase Belum Dikonfigurasi',
          'Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env terlebih dahulu untuk mengaktifkan sinkronisasi cloud.',
          'purple'
        );
      }
      return;
    }

    setIsSeedingSupabase(true);
    try {
      // 1. Seed Profile ('ARC-2026-089')
      await supabase.from('profiles').upsert({
        id: 'ARC-2026-089',
        student_id: 'ARC-2026-089',
        guild_id: 'ARC-2026-089',
        name: 'Arya Pendragon',
        academy_class: 'Kelas XI MIPA 2 • Akademi Sains & Arkanum',
        guild_role: currentRank.title || 'Adept Scholar',
        xp: studentXp,
        max_xp: 600,
        level: currentRank.level || 2,
        potions_brewed_count: potionsBrewedCount,
        books_read: booksReadCount,
        tomes_read_count: booksReadCount,
        badges: badges
      });

      // 2. Seed 12 Initial Books with stocks, barcodes, and digital contents
      for (const b of ENRICHED_INITIAL_BOOKS) {
        await supabase.from('books').upsert({
          id: b.id,
          title: b.title,
          fantasy_subtitle: b.subtitle,
          author: b.author,
          isbn: b.isbn,
          xp_reward: b.xpReward,
          school: b.category,
          school_name: b.categoryLabel,
          rating: b.rating,
          pages: b.pages,
          shelf: b.shelf,
          status: b.status,
          available: b.availableStock > 0,
          total_stock: b.totalStock || 5,
          available_stock: b.availableStock ?? 3,
          has_digital: true,
          digital_content: b.digitalContent || null,
          ingredients: b.ingredients,
          synopsis: b.synopsis,
          featured: b.popular,
          kode_buku: b.kodeBuku,
          book_code: b.kodeBuku,
          ddc: b.ddc,
          call_number: b.callNumber,
          barcode: b.barcode,
          publisher: b.publisher || null,
          publication_year: b.publicationYear || null,
          cover_url: b.coverUrl || null,
          pdf_url: b.pdfUrl || null
        });
      }

      // 3. Seed Reviews
      const allSeedReviews = [];
      INITIAL_BOOKS.forEach((b) => {
        (b.reviews || []).forEach((r, idx) => {
          allSeedReviews.push({
            id: r.id || `rev-${b.id}-${idx + 1}`,
            book_id: b.id,
            profile_id: 'ARC-2026-089',
            scholar_name: r.user ? r.user.split('•')[0].trim() : 'Scholar',
            scholar_rank: r.user && r.user.includes('•') ? r.user.split('•')[1].trim() : 'Scholar',
            book_title: b.title,
            rating: r.rating || 5,
            note: r.comment || '',
            xp_awarded: 75,
            review_date: new Date().toISOString().split('T')[0]
          });
        });
      });

      for (const rev of allSeedReviews) {
        await supabase.from('reviews').upsert(rev);
      }

      // 4. Seed Quests
      for (const q of INITIAL_QUESTS) {
        await supabase.from('quests').upsert({
          id: q.id,
          title: q.title,
          subtitle: q.subtitle,
          category: q.categoryTrigger,
          xp_reward: q.xpReward,
          badge_reward: q.badgeName,
          progress: q.progress,
          target: q.target,
          completed: q.progress >= q.target,
          claimed: q.claimed,
          description: q.desc
        });
      }

      // 5. Seed Loans
      const { data: existingLoans } = await supabase.from('loans').select('id');
      if (!existingLoans || existingLoans.length === 0) {
        for (const l of INITIAL_LOANS) {
          // loans.id is UUID in Supabase; let the database generate it.
          await supabase.from('loans').insert({
            book_id: l.bookId,
            profile_id: l.borrowerCard === 'ARC-2026-089' ? 'ARC-2026-089' : null,
            borrower_name: l.borrowerName,
            requester_name: l.requesterName,
            requester_role: l.requesterRole,
            class_name: l.className,
            quantity: l.quantity,
            borrowed_date: l.borrowedDateISO || l.borrowedDate,
            due_date: l.dueDate,
            status: l.status === 'approved' ? 'approved' : l.status,
            notes: l.notes,
            rejection_reason: l.rejectionReason || null,
            borrower_card: l.borrowerCard || null,
            borrower_phone: l.borrowerPhone || null,
            guardian_name: l.guardianName || null,
            guardian_phone: l.guardianPhone || null,
            homeroom_name: l.homeroomName || null,
            homeroom_phone: l.homeroomPhone || null,
            max_days: l.maxDays || (l.requesterRole === 'guru' ? 14 : 7),
            is_package: Boolean(l.isPackage),
            lesson_hours: l.lessonHours || null
          });
        }
      }

      // 6. Seed GLS Reading Logs (jurnal refleksi literasi)
      for (const log of INITIAL_READING_LOGS) {
        await supabase.from('reading_logs').upsert(
          {
            id: log.id,
            profile_id: log.profileId || null,
            student_card: log.studentCard || null,
            student_name: log.studentName,
            class_name: log.className,
            book_id: log.bookId,
            book_title: log.bookTitle,
            last_page_read: log.lastPageRead,
            favorite_quote: log.favoriteQuote,
            summary: log.summary,
            word_count: log.wordCount,
            status: log.status,
            score: log.score,
            feedback: log.feedback || null,
            graded_at: log.gradedAt || null,
            graded_by: log.gradedBy || null,
            created_at: log.createdAt,
            updated_at: log.updatedAt
          },
          { onConflict: 'id' }
        );
      }

      if (isManual) {
        showToast(
          'Inisialisasi Cloud Selesai!',
          '12 Grimoire, stok eksemplar, sirkulasi pinjaman, dan profil serikat berhasil disinkronkan ke Supabase.',
          'emerald'
        );
      }
    } catch (err) {
      console.error('Seed Supabase error:', err);
      if (isManual) {
        showToast('Gagal Melakukan Seed', 'Periksa koneksi Supabase atau jalankan skema SQL di Dashboard.', 'purple');
      }
    } finally {
      setIsSeedingSupabase(false);
    }
  };

  const fetchFromSupabase = async () => {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      // 1. Fetch Books
      const { data: dbBooks, error: booksErr } = await supabase
        .from('books')
        .select('*')
        .order('id', { ascending: true });

      if (booksErr) throw booksErr;

      if (!dbBooks || dbBooks.length === 0) {
        console.info('Supabase books table is empty. Triggering auto-seed...');
        await executeSeedSupabase(false);
        const { data: reloadedBooks } = await supabase.from('books').select('*').order('id', { ascending: true });
        if (reloadedBooks && reloadedBooks.length > 0) {
          fetchFromSupabase();
        }
        return;
      }

      // 2. Fetch Reviews
      const { data: dbReviews } = await supabase
        .from('reviews')
        .select('*')
        .order('review_date', { ascending: false });

      const reviewsByBook = {};
      (dbReviews || []).forEach((rev) => {
        if (!reviewsByBook[rev.book_id]) {
          reviewsByBook[rev.book_id] = [];
        }
        reviewsByBook[rev.book_id].push({
          id: rev.id,
          user: rev.scholar_name
            ? `${rev.scholar_name} • ${rev.scholar_rank || 'Scholar'}`
            : (rev.user || 'Scholar'),
          rating: rev.rating || 5,
          date: rev.review_date || 'Baru saja',
          comment: rev.note || rev.comment || ''
        });
      });

      // 3. Fetch Loans
      const { data: dbLoans } = await supabase
        .from('loans')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbLoans && dbLoans.length > 0) {
        const mappedLoans = dbLoans.map((l) => ({
          id: l.id,
          bookId: l.book_id,
          bookTitle:
            l.book_title ||
            dbBooks.find((b) => b.id === l.book_id)?.title ||
            books.find((b) => b.id === l.book_id)?.title ||
            'Grimoire',
          borrowerName: l.borrower_name || l.requester_name || 'Scholar',
          requesterName: l.requester_name || l.borrower_name || 'Scholar',
          requesterRole: l.requester_role || 'siswa',
          profileId: l.profile_id || l.borrower_card || null,
          borrowerCard: l.borrower_card || null,
          borrowerLevel: l.borrower_level || null,
          borrowerPhone: l.borrower_phone || '',
          guardianName: l.guardian_name || '',
          guardianPhone: l.guardian_phone || '',
          homeroomName: l.homeroom_name || '',
          homeroomPhone: l.homeroom_phone || '',
          className: l.class_name || 'Kelas XI MIPA 2',
          quantity: Number(l.quantity) || 1,
          isPackage: Boolean(l.is_package),
          lessonHours: l.lesson_hours || '',
          borrowedDate: l.borrowed_date ? formatDateID(l.borrowed_date) : 'Hari ini',
          borrowedDateISO: l.borrowed_date || '',
          dueDate: l.due_date,
          daysLeft: computeDaysLeft(l.due_date),
          maxDays: l.max_days || (l.requester_role === 'guru' ? 14 : 7),
          status: l.status || 'pending',
          notes: l.notes || '',
          rejectionReason: l.rejection_reason || '',
          returnedAt: l.returned_at ? toISODate(l.returned_at) : null
        }));
        setLoans(mappedLoans);
      }

      // 3b. Fetch GLS Reading Logs
      const { data: dbReadingLogs, error: readingLogsErr } = await supabase
        .from('reading_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (readingLogsErr) {
        console.warn('Supabase reading_logs fetch skipped:', readingLogsErr.message);
      } else if (dbReadingLogs && dbReadingLogs.length > 0) {
        setReadingLogs(
          dbReadingLogs.map((log) => ({
            id: log.id,
            studentId: log.student_card || log.profile_id || '',
            studentCard: log.student_card || '',
            profileId: log.profile_id || null,
            studentName: log.student_name || 'Scholar',
            className: normalizeClassName(log.class_name || ''),
            bookId: log.book_id,
            bookTitle:
              log.book_title ||
              dbBooks.find((book) => book.id === log.book_id)?.title ||
              'Grimoire',
            lastPageRead: Number(log.last_page_read) || 0,
            favoriteQuote: log.favorite_quote || '',
            summary: log.summary || '',
            wordCount: getReadingLogWordCount(log),
            status: log.status || (log.score !== null ? 'graded' : 'submitted'),
            score: log.score ?? null,
            feedback: log.feedback || '',
            gradedAt: log.graded_at || null,
            gradedBy: log.graded_by || '',
            createdAt: log.created_at || new Date().toISOString(),
            updatedAt: log.updated_at || log.created_at || new Date().toISOString()
          }))
        );
      }

      // Map Books
      const mappedBooks = dbBooks.map((row) => {
        const availStock = row.available_stock ?? row.availableStock ?? (row.available ? 3 : 0);
        const totStock = row.total_stock ?? row.totalStock ?? 5;
        const isAvail = availStock > 0;

        return {
          id: row.id,
          title: row.title,
          subtitle: row.subtitle || row.fantasy_subtitle || '',
          author: row.author,
          category: row.category || row.school || 'Alchemy',
          categoryLabel:
            row.category_label ||
            row.school_name ||
            (row.category === 'Bards Tales'
              ? "Bard's Tales (Fiksi & Sastra)"
              : 'Alchemy (Sains & Misteri)'),
          rating: Number(row.rating) || 5.0,
          xpReward: row.xp_reward || 100,
          pages: row.pages || 350,
          isbn: row.isbn || '978-602-000-000-0',
          shelf: row.shelf || 'Menara Arsip',
          status: isAvail ? 'available' : 'borrowed',
          available: isAvail,
          totalStock: totStock,
          availableStock: availStock,
          hasDigital: Boolean(row.has_digital ?? true),
          digitalContent: row.digital_content || DIGITAL_TOMES_CATALOG[row.id] || null,
          popular: Boolean(row.popular ?? row.featured),
          coverRune: row.cover_rune || '☉',
          coverGradient:
            row.cover_gradient || 'from-emerald-950 via-teal-900 to-slate-950',
          accentColor: row.accent_color || '#10B981',
          ingredients: Array.isArray(row.ingredients) ? row.ingredients : ['spark'],
          synopsis: row.synopsis || '',
          kodeBuku: row.kode_buku || row.book_code || undefined,
          ddc: row.ddc || undefined,
          callNumber: row.call_number || undefined,
          barcode: row.barcode || row.kode_buku || row.book_code || undefined,
          publisher: row.publisher || '',
          publicationYear: row.publication_year || null,
          coverUrl: row.cover_url || '',
          pdfUrl: row.pdf_url || '',
          reviews: reviewsByBook[row.id] || (Array.isArray(row.reviews) ? row.reviews : [])
        };
      });
      setBooks(mappedBooks.map((row, index) => enrichBook(row, index)));

      // 4. Fetch Quests
      const { data: dbQuests } = await supabase
        .from('quests')
        .select('*')
        .order('id', { ascending: true });

      if (dbQuests && dbQuests.length > 0) {
        setQuests(
          dbQuests.map((q) => ({
            id: q.id,
            title: q.title,
            subtitle: q.subtitle,
            desc: q.description || q.desc,
            xpReward: q.xp_reward || 150,
            progress: q.progress || 0,
            target: q.target || 1,
            claimed: Boolean(q.claimed),
            badgeName: q.badge_reward || q.badgeName,
            categoryTrigger: q.category || q.categoryTrigger
          }))
        );
      }

      // 5. Fetch Scholar Profile ('ARC-2026-089')
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('*')
        .or('guild_id.eq.ARC-2026-089,student_id.eq.ARC-2026-089,id.eq.ARC-2026-089')
        .maybeSingle();

      if (dbProfile) {
        if (dbProfile.xp !== undefined) setStudentXp(dbProfile.xp);
        if (dbProfile.potions_brewed_count !== undefined) {
          setPotionsBrewedCount(dbProfile.potions_brewed_count);
        }
        if (dbProfile.books_read !== undefined) {
          setBooksReadCount(dbProfile.books_read);
        } else if (dbProfile.tomes_read_count !== undefined) {
          setBooksReadCount(dbProfile.tomes_read_count);
        }
        if (Array.isArray(dbProfile.badges) && dbProfile.badges.length > 0) {
          setBadges(dbProfile.badges);
        }
      }
    } catch (err) {
      console.warn('Supabase fetch failed or tables unseeded; running smoothly in Local Grimoire Mode:', err);
    }
  };

  useEffect(() => {
    fetchFromSupabase();

    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('grand-archive-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, () => {
        fetchFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loans' }, () => {
        fetchFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reading_logs' }, () => {
        fetchFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
        fetchFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quests' }, () => {
        fetchFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchFromSupabase();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ==========================================
  // HANDLER: APPROVE LOAN (ADMIN ACTION)
  // ==========================================
  const handleApproveLoan = async (loan) => {
    const book = books.find((b) => b.id === loan.bookId);
    if (!book) return;

    const neededQty = loan.quantity || 1;
    if (book.availableStock < neededQty) {
      showToast(
        'Stok Fisik Tidak Cukup',
        `Buku "${book.title}" hanya tersisa ${book.availableStock} eksemplar di rak, tidak mencukupi permintaan ${neededQty} eksemplar.`,
        'purple'
      );
      return;
    }

    const newAvailableStock = Math.max(0, book.availableStock - neededQty);
    const newStatus = newAvailableStock === 0 ? 'borrowed' : 'available';

    // Update book stock & status
    setBooks((prev) =>
      prev.map((b) =>
        b.id === book.id
          ? {
              ...b,
              availableStock: newAvailableStock,
              status: newStatus,
              available: newAvailableStock > 0
            }
          : b
      )
    );

    // Update loan status
    setLoans((prev) =>
      prev.map((l) =>
        l.id === loan.id
          ? { ...l, status: 'approved', daysLeft: computeDaysLeft(l.dueDate) }
          : l
      )
    );

    try {
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#D4AF37', '#8B5CF6']
      });
    } catch {}

    showToast(
      'Peminjaman Disetujui!',
      `Permintaan ${loan.requesterName} untuk "${book.title}" (${neededQty} eksemplar) telah disetujui. Sisa di rak: ${newAvailableStock}.`,
      'emerald'
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('loans')
          .update({ status: 'approved' })
          .eq('id', loan.id);

        await supabase
          .from('books')
          .update({
            available_stock: newAvailableStock,
            status: newStatus,
            available: newAvailableStock > 0
          })
          .eq('id', book.id);
      } catch (err) {
        console.warn('Supabase approve loan error:', err);
      }
    }
  };

  // ==========================================
  // HANDLER: REJECT LOAN (ADMIN ACTION)
  // ==========================================
  const handleRejectLoan = (loan) => {
    setRejectingLoan(loan);
    setRejectionReason('');
  };

  const handleConfirmRejectLoan = async () => {
    if (!rejectingLoan) return;
    const reason =
      rejectionReason.trim() ||
      'Stok buku sedang dalam pemeliharaan berkala atau dialokasikan untuk kegiatan kurikulum.';

    setLoans((prev) =>
      prev.map((l) =>
        l.id === rejectingLoan.id
          ? { ...l, status: 'rejected', rejectionReason: reason }
          : l
      )
    );

    showToast(
      'Permintaan Peminjaman Ditolak',
      `Permintaan peminjaman oleh ${rejectingLoan.requesterName} telah ditolak dengan catatan alasan.`,
      'purple'
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('loans')
          .update({
            status: 'rejected',
            rejection_reason: reason
          })
          .eq('id', rejectingLoan.id);
      } catch (err) {
        console.warn('Supabase reject loan error:', err);
      }
    }

    setRejectingLoan(null);
    setRejectionReason('');
  };

  // ==========================================
  // HANDLER: VERIFY RETURN (ADMIN ACTION)
  // ==========================================
  const handleVerifyReturnLoan = async (loan) => {
    const book = books.find((b) => b.id === loan.bookId);
    const returnQty = loan.quantity || 1;

    setLoans((prev) =>
      prev.map((l) =>
        l.id === loan.id
          ? {
              ...l,
              status: 'returned',
              returnedAt: toISODate(new Date())
            }
          : l
      )
    );

    if (book) {
      const newAvailable = Math.min(book.totalStock, book.availableStock + returnQty);
      setBooks((prev) =>
        prev.map((b) =>
          b.id === book.id
            ? {
                ...b,
                availableStock: newAvailable,
                status: 'available',
                available: true
              }
            : b
        )
      );

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase
            .from('books')
            .update({
              available_stock: newAvailable,
              status: 'available',
              available: true
            })
            .eq('id', book.id);
        } catch (err) {
          console.warn('Supabase return stock sync error:', err);
        }
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('loans')
          .update({
            status: 'returned',
            returned_at: new Date().toISOString()
          })
          .eq('id', loan.id);
      } catch (err) {
        console.warn('Supabase loan return sync error:', err);
      }
    }

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#D4AF37', '#10B981']
      });
    } catch {}

    showToast(
      'Pengembalian Telah Diverifikasi!',
      `Grimoire "${book?.title || loan.bookTitle}" (${returnQty} eksemplar) telah dikembalikan ke rak oleh Archivist.`,
      'emerald'
    );
  };

  // ==========================================
  // HANDLER: INVENTORY STOCK MANAGER (+ / -)
  // ==========================================
  const handleAdjustStock = async (bookId, stockType, delta) => {
    const book = books.find((b) => b.id === bookId);
    if (!book) return;

    let newTotal = book.totalStock;
    let newAvailable = book.availableStock;

    if (stockType === 'total') {
      newTotal = Math.max(1, book.totalStock + delta);
      if (newAvailable > newTotal) newAvailable = newTotal;
    } else if (stockType === 'available') {
      newAvailable = Math.max(0, Math.min(newTotal, book.availableStock + delta));
    }

    const newStatus = newAvailable > 0 ? 'available' : 'borrowed';

    setBooks((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? {
              ...b,
              totalStock: newTotal,
              availableStock: newAvailable,
              status: newStatus,
              available: newAvailable > 0
            }
          : b
      )
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('books')
          .update({
            total_stock: newTotal,
            available_stock: newAvailable,
            status: newStatus,
            available: newAvailable > 0
          })
          .eq('id', bookId);
      } catch (err) {
        console.warn('Supabase stock adjust error:', err);
      }
    }
  };

  // ==========================================
  // HANDLER: QUICK LOAN VIA BARCODE SCANNER (ADMIN ACTION)
  // ==========================================
  const handleSubmitQuickLoan = async ({
    member,
    book,
    quantity,
    durationDays,
    dueDate,
    notes
  }) => {
    if (!member || !book) {
      return { ok: false, message: 'Kartu anggota dan buku harus dipilih terlebih dahulu.' };
    }

    const freshBook = books.find((b) => b.id === book.id) || book;
    const qty = Math.max(1, Number(quantity) || 1);

    if (freshBook.availableStock < qty) {
      return {
        ok: false,
        message: `Stok fisik "${freshBook.title}" hanya ${freshBook.availableStock} eksemplar. Kurangi jumlah atau tambah stok terlebih dahulu.`
      };
    }

    setIsSubmittingQuickLoan(true);

    try {
      const today = new Date();
      const maxDays = getLoanDurationDays(member.role, durationDays);
      const finalDueDate = dueDate || toISODate(addDays(today, maxDays));
      const loanId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `loan-${Date.now()}`;

      const newLoan = {
        id: loanId,
        bookId: freshBook.id,
        bookTitle: freshBook.title,
        bookCode: freshBook.kodeBuku,
        borrowerName: member.name,
        requesterName: member.name,
        requesterEmail: member.email || '',
        requesterRole: member.role === 'guru' ? 'guru' : 'siswa',
        profileId: member.cardCode || member.id,
        borrowerCard: member.cardCode || member.id,
        borrowerLevel: member.level || '',
        borrowerPhone: member.phone || '',
        guardianName: member.guardianName || '',
        guardianPhone: member.guardianPhone || '',
        homeroomName: member.homeroomName || '',
        homeroomPhone: member.homeroomPhone || '',
        className: member.className || '',
        classLabel: member.classLabel || '',
        quantity: qty,
        borrowedDate: formatDateID(today),
        borrowedDateISO: toISODate(today),
        dueDate: finalDueDate,
        daysLeft: maxDays,
        maxDays,
        status: 'approved',
        notes:
          notes ||
          `Peminjaman kilat via pemindaian barcode oleh pustakawan untuk ${member.name}.`
      };

      const newAvailable = Math.max(0, freshBook.availableStock - qty);
      const newStatus = newAvailable === 0 ? 'borrowed' : 'available';

      setBooks((prev) =>
        prev.map((b) =>
          b.id === freshBook.id
            ? {
                ...b,
                availableStock: newAvailable,
                status: newStatus,
                available: newAvailable > 0
              }
            : b
        )
      );
      setLoans((prev) => [newLoan, ...prev]);

      try {
        confetti({
          particleCount: 55,
          spread: 65,
          origin: { y: 0.65 },
          colors: ['#10B981', '#D4AF37']
        });
      } catch {}

      showToast(
        'Transaksi Kilat Berhasil!',
        `"${freshBook.title}" (${qty} eks.) dipinjamkan kepada ${member.name}. Jatuh tempo ${formatDateID(finalDueDate)}. Sisa rak: ${newAvailable}.`,
        'emerald'
      );

      if (isSupabaseConfigured && supabase) {
        try {
          const { data: insertedLoan } = await supabase
            .from('loans')
            .insert({
              book_id: freshBook.id,
              profile_id: member.cardCode === 'ARC-2026-089' ? 'ARC-2026-089' : null,
              borrower_name: member.name,
              requester_name: member.name,
              requester_role: newLoan.requesterRole,
              class_name: member.className || null,
              quantity: qty,
              notes: newLoan.notes,
              status: 'approved',
              borrowed_date: newLoan.borrowedDateISO,
              due_date: newLoan.dueDate,
              borrower_card: newLoan.borrowerCard,
              borrower_phone: newLoan.borrowerPhone || null,
              guardian_name: newLoan.guardianName || null,
              guardian_phone: newLoan.guardianPhone || null,
              homeroom_name: newLoan.homeroomName || null,
              homeroom_phone: newLoan.homeroomPhone || null,
              max_days: maxDays
            })
            .select()
            .maybeSingle();

          await supabase
            .from('books')
            .update({
              available_stock: newAvailable,
              status: newStatus,
              available: newAvailable > 0
            })
            .eq('id', freshBook.id);

          if (insertedLoan?.id) {
            setLoans((prev) =>
              prev.map((l) => (l.id === loanId ? { ...l, id: insertedLoan.id } : l))
            );
          }
        } catch (err) {
          console.warn('Supabase quick loan sync error:', err);
        }
      }

      return { ok: true, loan: newLoan };
    } finally {
      setIsSubmittingQuickLoan(false);
    }
  };

  // ==========================================
  // HANDLER: BULK IMPORT FROM EXCEL
  // ==========================================
  const handleImportBulkBooks = async (importedRows = []) => {
    if (!Array.isArray(importedRows) || importedRows.length === 0) return;

    setIsImportingBooks(true);

    try {
      let addedCount = 0;
      let updatedCount = 0;

      const normalizedRows = importedRows.map((row, index) => {
        const enriched = enrichBook(
          {
            ...row,
            id: row.id || row.kodeBuku || `book-import-${Date.now()}-${index}`
          },
          books.length + index
        );
        return enriched;
      });

      normalizedRows.forEach((row) => {
        const exists = books.some(
          (item) =>
            (row.kodeBuku && item.kodeBuku === row.kodeBuku) ||
            (row.id && item.id === row.id)
        );
        if (exists) {
          updatedCount += 1;
        } else {
          addedCount += 1;
        }
      });

      setBooks((prev) => {
        const next = [...prev];
        normalizedRows.forEach((row) => {
          const existingIndex = next.findIndex(
            (item) =>
              (row.kodeBuku && item.kodeBuku === row.kodeBuku) ||
              (row.id && item.id === row.id)
          );
          if (existingIndex >= 0) {
            next[existingIndex] = {
              ...next[existingIndex],
              ...row,
              id: next[existingIndex].id,
              reviews: next[existingIndex].reviews || []
            };
          } else {
            next.unshift(row);
          }
        });
        return next;
      });

      showToast(
        'Import Excel Berhasil!',
        `${addedCount} judul baru ditambahkan dan ${updatedCount} judul diperbarui. Stok, barcode, dan label rak siap digunakan.`,
        'emerald'
      );

      if (isSupabaseConfigured && supabase) {
        try {
          for (const row of normalizedRows) {
            await supabase.from('books').upsert({
              id: row.id,
              title: row.title,
              fantasy_subtitle: row.subtitle,
              author: row.author,
              isbn: row.isbn,
              xp_reward: row.xpReward || 100,
              school: row.category,
              school_name: row.categoryLabel,
              rating: row.rating || 5,
              pages: row.pages || 250,
              shelf: row.shelf,
              status: row.status,
              available: row.available,
              total_stock: row.totalStock,
              available_stock: row.availableStock,
              has_digital: Boolean(row.hasDigital || row.pdfUrl),
              digital_content: row.digitalContent || [],
              ingredients: row.ingredients || ['spark'],
              synopsis: row.synopsis || '',
              featured: false,
              kode_buku: row.kodeBuku,
              book_code: row.kodeBuku,
              ddc: row.ddc,
              call_number: row.callNumber,
              barcode: row.barcode,
              publisher: row.publisher || null,
              publication_year: row.publicationYear || null,
              cover_url: row.coverUrl || null,
              pdf_url: row.pdfUrl || null
            });
          }
        } catch (err) {
          console.warn('Supabase bulk import sync error:', err);
        }
      }
    } finally {
      setIsImportingBooks(false);
    }
  };

  // ==========================================
  // HANDLER: REQUEST PHYSICAL LOAN (SISWA ACTION)
  // ==========================================
  const handleRequestStudentLoan = async (book) => {
    if (book.availableStock <= 0) {
      showToast(
        'Stok Fisik Habis!',
        `Eksemplar fisik "${book.title}" sedang habis di rak. Buka tombol "Baca Digital" untuk langsung membaca teks lengkapnya secara online!`,
        'purple'
      );
      return;
    }

    const activeOrPending = loans.filter(
      (l) =>
        l.requesterRole === 'siswa' &&
        isLoanOwnedByUser(l, currentUser) &&
        (l.status === 'active' || l.status === 'approved' || l.status === 'pending')
    );

    if (activeOrPending.length >= 4) {
      showToast(
        'Batas Pinjam Tercapai (Maks. 4 Buku)',
        'Kamu sudah memiliki 4 peminjaman aktif atau antrean permintaan. Kembalikan buku terlebih dahulu untuk meminjam lagi.',
        'purple'
      );
      return;
    }

    const alreadyRequested = loans.some(
      (l) =>
        l.bookId === book.id &&
        l.requesterRole === 'siswa' &&
        isLoanOwnedByUser(l, currentUser) &&
        (l.status === 'pending' || l.status === 'approved')
    );

    if (alreadyRequested) {
      showToast(
        'Permintaan Sudah Ada',
        `Kamu sudah memiliki pengajuan atau sedang meminjam buku "${book.title}".`,
        'purple'
      );
      return;
    }

    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const studentMember =
      members.find(
        (m) =>
          m.cardCode === currentUser.guildId ||
          m.name === currentUser.name ||
          m.id === currentUser.id
      ) || null;
    const newLoan = {
      id: `loan-${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      bookCode: book.kodeBuku,
      borrowerName: currentUser.name,
      requesterName: currentUser.name,
      requesterRole: 'siswa',
      profileId: currentUser.guildId || 'ARC-2026-089',
      borrowerCard: studentMember?.cardCode || currentUser.guildId || '',
      borrowerPhone: studentMember?.phone || '',
      guardianName: studentMember?.guardianName || '',
      guardianPhone: studentMember?.guardianPhone || '',
      homeroomName: studentMember?.homeroomName || '',
      homeroomPhone: studentMember?.homeroomPhone || '',
      className: currentUser.class || 'Kelas XI MIPA 2 • Akademi Sains & Arkanum',
      quantity: 1,
      borrowedDate: todayStr,
      borrowedDateISO: toISODate(new Date()),
      dueDate: toISODate(addDays(new Date(), 7)),
      daysLeft: 7,
      maxDays: 7,
      status: 'pending',
      notes: 'Pengajuan peminjaman 1 eksemplar fisik buku oleh siswa.'
    };

    setLoans((prev) => [newLoan, ...prev]);

    const newXp = studentXp + 15;
    setStudentXp(newXp);

    showToast(
      'Permintaan Pinjam Terkirim! (+15 XP)',
      `Pengajuan "${book.title}" telah masuk ke Antrean Persetujuan Archivist. Sementara menunggu, kamu bisa langsung membaca versi digitalnya!`,
      'emerald'
    );

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#D4AF37', '#10B981']
      });
    } catch {}

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('loans').insert({
          book_id: book.id,
          profile_id: 'ARC-2026-089',
          borrower_name: currentUser.name,
          requester_name: currentUser.name,
          requester_role: 'siswa',
          class_name: currentUser.class,
          quantity: 1,
          notes: newLoan.notes,
          status: 'pending',
          borrowed_date: newLoan.borrowedDateISO,
          due_date: newLoan.dueDate,
          borrower_card: newLoan.borrowerCard || null,
          borrower_phone: newLoan.borrowerPhone || null,
          guardian_name: newLoan.guardianName || null,
          guardian_phone: newLoan.guardianPhone || null,
          homeroom_name: newLoan.homeroomName || null,
          homeroom_phone: newLoan.homeroomPhone || null,
          max_days: 7
        });

        await supabase
          .from('profiles')
          .update({ xp: newXp })
          .eq('student_id', 'ARC-2026-089');
      } catch (err) {
        console.warn('Supabase student loan request sync error:', err);
      }
    }
  };

  // ==========================================
  // HANDLER: TEACHER CLASS LOAN REQUEST
  // ==========================================
  const handleSubmitTeacherLoan = async (e) => {
    e.preventDefault();
    if (!teacherLoanForm.bookId) {
      showToast('Pilih Grimoire', 'Silakan pilih judul buku yang ingin diajukan untuk kelas.', 'purple');
      return;
    }

    const targetBook = books.find((b) => b.id === teacherLoanForm.bookId);
    if (!targetBook) return;

    const qty = Number(teacherLoanForm.quantity) || 1;
    if (qty > targetBook.availableStock) {
      showToast(
        'Jumlah Melebihi Stok Rak',
        `Grimoire "${targetBook.title}" hanya tersedia ${targetBook.availableStock} eksemplar di rak saat ini. Silakan sesuaikan jumlah permintaan.`,
        'purple'
      );
      return;
    }

    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const teacherMember =
      members.find(
        (m) =>
          m.id === currentUser.id ||
          m.name === currentUser.name ||
          m.role === 'guru'
      ) || null;
    const maxDays = getLoanDurationDays('guru', teacherLoanForm.durationDays);
    const newLoan = {
      id: `loan-${Date.now()}`,
      bookId: targetBook.id,
      bookTitle: targetBook.title,
      bookCode: targetBook.kodeBuku,
      borrowerName: currentUser.name,
      requesterName: currentUser.name,
      requesterRole: 'guru',
      profileId: currentUser.id || 'user-guru',
      borrowerCard: teacherMember?.cardCode || '',
      borrowerPhone: teacherMember?.phone || '',
      homeroomName: teacherMember?.homeroomName || '',
      homeroomPhone: teacherMember?.homeroomPhone || '',
      className: teacherLoanForm.className || 'Kelas XI MIPA 1',
      quantity: qty,
      borrowedDate: todayStr,
      borrowedDateISO: toISODate(new Date()),
      dueDate: toISODate(addDays(new Date(), maxDays)),
      daysLeft: maxDays,
      maxDays,
      status: 'pending',
      notes:
        teacherLoanForm.notes.trim() ||
        `Peminjaman ${qty} eksemplar untuk pembelajaran di ${teacherLoanForm.className}.`
    };

    setLoans((prev) => [newLoan, ...prev]);

    setTeacherLoanForm({
      bookId: '',
      quantity: 1,
      durationDays: 14,
      className: 'Kelas XI MIPA 1',
      notes: ''
    });

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#38BDF8', '#D4AF37']
      });
    } catch {}

    showToast(
      'Permintaan Pinjam Kelas Terkirim!',
      `Pengajuan ${qty} eksemplar "${targetBook.title}" untuk ${newLoan.className} telah diajukan ke Grand Archivist.`,
      'emerald'
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('loans').insert({
          book_id: targetBook.id,
          profile_id: null,
          borrower_name: currentUser.name,
          requester_name: currentUser.name,
          requester_role: 'guru',
          class_name: newLoan.className,
          quantity: qty,
          notes: newLoan.notes,
          status: 'pending',
          borrowed_date: newLoan.borrowedDateISO,
          due_date: newLoan.dueDate,
          borrower_card: newLoan.borrowerCard || null,
          borrower_phone: newLoan.borrowerPhone || null,
          homeroom_name: newLoan.homeroomName || null,
          homeroom_phone: newLoan.homeroomPhone || null,
          max_days: maxDays
        });
      } catch (err) {
        console.warn('Supabase teacher loan sync error:', err);
      }
    }
  };

  // ==========================================
  // HANDLER: OPEN & SUBMIT GLS READING LOG
  // ==========================================
  const handleOpenReadingLog = (book) => {
    if (!book || currentUser.role !== 'siswa') return;
    setJournalBook(book);
    setInspectedBookId(null);
  };

  const handleSubmitReadingLog = async (payload) => {
    if (!journalBook || currentUser.role !== 'siswa') return;

    const studentMember =
      members.find(
        (member) =>
          member.cardCode === currentUser.guildId ||
          member.id === currentUser.id ||
          member.name === currentUser.name
      ) || null;
    const studentCard =
      currentUser.guildId || studentMember?.cardCode || currentUser.cardCode || currentUser.id;
    const className =
      normalizeClassName(currentUser.class || studentMember?.className || '') ||
      'Kelas XI MIPA 2';
    const existingLog = readingLogs.find(
      (log) =>
        log.bookId === journalBook.id && isReadingLogOwnedByUser(log, currentUser)
    );
    const now = new Date().toISOString();
    const log = {
      id: existingLog?.id || `reading-log-${Date.now()}`,
      studentId: studentCard,
      studentCard,
      profileId:
        currentUser.guildId === 'ARC-2026-089'
          ? currentUser.guildId
          : existingLog?.profileId || null,
      studentName: currentUser.name,
      className,
      bookId: journalBook.id,
      bookTitle: journalBook.title,
      lastPageRead: payload.lastPageRead,
      favoriteQuote: payload.favoriteQuote,
      summary: payload.summary,
      wordCount: payload.wordCount,
      status: 'submitted',
      score: null,
      feedback: '',
      gradedAt: null,
      gradedBy: '',
      createdAt: existingLog?.createdAt || now,
      updatedAt: now
    };

    setReadingLogs((prev) =>
      existingLog
        ? prev.map((item) => (item.id === existingLog.id ? log : item))
        : [log, ...prev]
    );
    setJournalBook(null);

    showToast(
      existingLog ? 'Jurnal Literasi Diperbarui!' : 'Jurnal Literasi Terkirim!',
      `Jurnal "${journalBook.title}" (${payload.wordCount} kata) sekarang berstatus Belum Dinilai dan masuk ke Dashboard Guru.`,
      'emerald'
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('reading_logs').upsert(
          {
            id: log.id,
            profile_id: log.profileId,
            student_card: log.studentCard,
            student_name: log.studentName,
            class_name: log.className,
            book_id: log.bookId,
            book_title: log.bookTitle,
            last_page_read: log.lastPageRead,
            favorite_quote: log.favoriteQuote,
            summary: log.summary,
            word_count: log.wordCount,
            status: log.status,
            score: null,
            feedback: null,
            graded_at: null,
            graded_by: null,
            created_at: log.createdAt,
            updated_at: log.updatedAt
          },
          { onConflict: 'id' }
        );
      } catch (err) {
        console.warn('Supabase reading log sync error:', err);
      }
    }
  };

  // ==========================================
  // HANDLER: GRADE GLS READING LOG (TEACHER)
  // ==========================================
  const handleGradeReadingLog = async (log, { score, feedback }) => {
    if (!log) return;
    if (currentUser.role !== 'guru' && currentUser.role !== 'admin') return;

    const now = new Date().toISOString();
    setReadingLogs((prev) =>
      prev.map((item) =>
        item.id === log.id
          ? {
              ...item,
              status: 'graded',
              score,
              feedback: feedback || '',
              gradedAt: now,
              gradedBy: currentUser.name,
              updatedAt: now
            }
          : item
      )
    );

    showToast(
      'Jurnal Sudah Dinilai',
      `Skor ${score}/100 untuk ${log.studentName} telah disimpan beserta umpan balik.`,
      'gold'
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('reading_logs')
          .update({
            status: 'graded',
            score,
            feedback: feedback || null,
            graded_at: now,
            graded_by: currentUser.name,
            updated_at: now
          })
          .eq('id', log.id);
      } catch (err) {
        console.warn('Supabase reading log grading sync error:', err);
      }
    }
  };

  // ==========================================
  // HANDLER: TEACHER ONE-DAY CLASS PACKAGE LOAN
  // ==========================================
  const handleSubmitPackageLoan = async (event) => {
    event.preventDefault();
    if (currentUser.role !== 'guru') return;

    const targetBook = books.find((book) => book.id === packageLoanForm.bookId);
    if (!targetBook) {
      showToast(
        'Pilih Grimoire',
        'Silakan pilih satu judul buku untuk paket kelas.',
        'purple'
      );
      return;
    }

    const qty = Math.max(1, Math.floor(Number(packageLoanForm.quantity) || 0));
    if (qty > targetBook.availableStock) {
      showToast(
        'Stok Fisik Tidak Cukup',
        `"${targetBook.title}" hanya tersedia ${targetBook.availableStock} eksemplar. Kurangi jumlah paket atau pilih judul lain.`,
        'purple'
      );
      return;
    }

    if (!packageLoanForm.className.trim() || !packageLoanForm.lessonHours.trim()) {
      showToast(
        'Lengkapi Data Paket',
        'Kelas tujuan dan jam pelajaran wajib diisi.',
        'purple'
      );
      return;
    }

    const teacherMember =
      members.find(
        (member) =>
          member.id === currentUser.id ||
          member.cardCode === currentUser.cardCode ||
          member.name === currentUser.name
      ) || members.find((member) => member.role === 'guru');

    const today = new Date();
    const dueDate = addDays(today, 1);
    const newAvailableStock = Math.max(0, targetBook.availableStock - qty);
    const newStatus = newAvailableStock === 0 ? 'borrowed' : 'available';
    const className = normalizeClassName(packageLoanForm.className);
    const lessonHours = packageLoanForm.lessonHours.trim();

    const newLoan = {
      id: `package-${Date.now()}`,
      bookId: targetBook.id,
      bookTitle: targetBook.title,
      bookCode: targetBook.kodeBuku,
      borrowerName: currentUser.name,
      requesterName: currentUser.name,
      requesterRole: 'guru',
      profileId: currentUser.id || 'user-guru',
      borrowerCard: teacherMember?.cardCode || '',
      borrowerPhone: teacherMember?.phone || '',
      homeroomName: teacherMember?.homeroomName || '',
      homeroomPhone: teacherMember?.homeroomPhone || '',
      className: className || packageLoanForm.className.trim(),
      classLabel: packageLoanForm.className.trim(),
      quantity: qty,
      isPackage: true,
      lessonHours,
      borrowedDate: formatDateID(today),
      borrowedDateISO: toISODate(today),
      dueDate: toISODate(dueDate),
      daysLeft: 1,
      maxDays: 1,
      status: 'approved',
      notes:
        packageLoanForm.notes.trim() ||
        `Paket kelas ${qty} eksemplar untuk ${className || packageLoanForm.className.trim()} • ${lessonHours}.`,
      rejectionReason: ''
    };

    setBooks((prev) =>
      prev.map((book) =>
        book.id === targetBook.id
          ? {
              ...book,
              availableStock: newAvailableStock,
              status: newStatus,
              available: newAvailableStock > 0
            }
          : book
      )
    );
    setLoans((prev) => [newLoan, ...prev]);
    setPackageLoanForm((prev) => ({
      bookId: '',
      quantity: 30,
      className: prev.className || 'Kelas XI MIPA 2',
      lessonHours: 'Jam ke 3-4',
      notes: ''
    }));

    try {
      confetti({
        particleCount: 60,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#38BDF8', '#10B981']
      });
    } catch {}

    showToast(
      'Paket Kelas Aktif!',
      `${qty} eksemplar "${targetBook.title}" untuk ${className || packageLoanForm.className.trim()} • ${lessonHours}. Sisa stok: ${newAvailableStock}. Tenggat besok (${formatDateID(dueDate)}).`,
      'emerald'
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('loans').insert({
          book_id: targetBook.id,
          profile_id: null,
          borrower_name: currentUser.name,
          requester_name: currentUser.name,
          requester_role: 'guru',
          class_name: newLoan.className,
          quantity: qty,
          notes: newLoan.notes,
          status: 'approved',
          borrowed_date: newLoan.borrowedDateISO,
          due_date: newLoan.dueDate,
          borrower_card: newLoan.borrowerCard || null,
          borrower_phone: newLoan.borrowerPhone || null,
          homeroom_name: newLoan.homeroomName || null,
          homeroom_phone: newLoan.homeroomPhone || null,
          max_days: 1,
          is_package: true,
          lesson_hours: lessonHours
        });

        await supabase
          .from('books')
          .update({
            available_stock: newAvailableStock,
            status: newStatus,
            available: newAvailableStock > 0
          })
          .eq('id', targetBook.id);
      } catch (err) {
        console.warn('Supabase class package sync error:', err);
      }
    }
  };

  const handleCompletePackageLoan = async (loan) => {
    if (!loan || !loan.isPackage) return;
    if (currentUser.role !== 'guru' && currentUser.role !== 'admin') return;

    const book = books.find((item) => item.id === loan.bookId);
    const returnQty = Math.max(1, Number(loan.quantity) || 1);
    const restoredStock = book
      ? Math.min(book.totalStock, book.availableStock + returnQty)
      : null;
    const now = new Date().toISOString();

    if (book) {
      setBooks((prev) =>
        prev.map((item) =>
          item.id === book.id
            ? {
                ...item,
                availableStock: restoredStock,
                status: restoredStock > 0 ? 'available' : 'borrowed',
                available: restoredStock > 0
              }
            : item
        )
      );
    }

    setLoans((prev) =>
      prev.map((item) =>
        item.id === loan.id
          ? { ...item, status: 'returned', returnedAt: now, daysLeft: 0 }
          : item
      )
    );

    showToast(
      'Paket Kelas Selesai',
      `${returnQty} eksemplar "${loan.bookTitle || book?.title || 'Grimoire'}" untuk ${loan.className} telah dikembalikan. Stok fisik dipulihkan${restoredStock !== null ? ` menjadi ${restoredStock}` : ''}.`,
      'emerald'
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('loans')
          .update({ status: 'returned', returned_at: now })
          .eq('id', loan.id);

        if (book && restoredStock !== null) {
          await supabase
            .from('books')
            .update({
              available_stock: restoredStock,
              status: restoredStock > 0 ? 'available' : 'borrowed',
              available: restoredStock > 0
            })
            .eq('id', book.id);
        }
      } catch (err) {
        console.warn('Supabase class package return sync error:', err);
      }
    }
  };

  // ==========================================
  // HANDLER: COMPLETE DIGITAL READING REWARD (+75 XP)
  // ==========================================
  const handleFinishDigitalReading = async (book) => {
    const xpReward = 75;
    const updatedXp = studentXp + xpReward;
    const nextBooksRead = booksReadCount + 1;

    setStudentXp(updatedXp);
    setBooksReadCount(nextBooksRead);

    showToast(
      `Astral Grimoire Selesai! (+${xpReward} XP)`,
      `Kamu telah menuntaskan pembacaan digital "${book.title}". Pemahaman arkanummu bertambah pesat!`,
      'gold'
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('profiles')
          .update({
            xp: updatedXp,
            books_read: nextBooksRead,
            tomes_read_count: nextBooksRead
          })
          .or('guild_id.eq.ARC-2026-089,student_id.eq.ARC-2026-089,id.eq.ARC-2026-089');
      } catch (err) {
        console.warn('Supabase digital reading reward sync error:', err);
      }
    }
  };

  // ==========================================
  // HANDLER: RETURN BOOK & SUBMIT REVIEW
  // ==========================================
  const handleOpenReturnModal = (loan) => {
    const book = books.find((b) => b.id === loan.bookId);
    if (!book) return;
    setReturningLoan({ ...loan, book });
    setReviewRating(5);
    setReviewComment('');
  };

  const handleSubmitReturnAndReview = async (e) => {
    e.preventDefault();
    if (!returningLoan) return;

    const { book } = returningLoan;
    const returnQty = returningLoan.quantity || 1;
    const noteText =
      reviewComment.trim() ||
      'Grimoire yang sangat mencerahkan! Memberikan banyak wawasan baru bagi para pembaca.';

    const newReview = {
      id: `rev-${Date.now()}`,
      user: `${currentUser.name} • ${currentRank.title}`,
      rating: reviewRating,
      date: 'Baru saja',
      comment: noteText
    };

    // Update book status and increment available stock
    setBooks((prev) =>
      prev.map((b) =>
        b.id === book.id
          ? {
              ...b,
              status: 'available',
              available: true,
              availableStock: Math.min(b.totalStock, b.availableStock + returnQty),
              reviews: [newReview, ...(b.reviews || [])]
            }
          : b
      )
    );

    // Update loan status to 'returned'
    setLoans((prev) =>
      prev.map((l) =>
        l.id === returningLoan.id
          ? { ...l, status: 'returned', returnedAt: new Date().toISOString() }
          : l
      )
    );

    const earnedXp = 100;
    const updatedXp = studentXp + earnedXp;
    setStudentXp(updatedXp);

    const nextBooksRead = booksReadCount + 1;
    setBooksReadCount(nextBooksRead);

    // Update Quest 2 & Unlock Scribe of Lore badge
    setQuests((prev) =>
      prev.map((q) =>
        q.id === 'quest-2'
          ? { ...q, progress: Math.min(q.target, q.progress + 1) }
          : q
      )
    );
    setBadges((prev) =>
      prev.map((b) => (b.id === 'badge-3' ? { ...b, unlocked: true } : b))
    );

    setReturningLoan(null);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#10B981', '#8B5CF6']
      });
    } catch {}

    showToast(
      `Scholar's Note Tersimpan! (+${earnedXp} XP)`,
      `Terima kasih telah mengembalikan "${book.title}" dan mewariskan catatan ilmu bagi pembaca berikutnya.`,
      'gold'
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('loans')
          .update({ status: 'returned', returned_at: new Date().toISOString() })
          .eq('id', returningLoan.id);

        await supabase
          .from('books')
          .update({
            status: 'available',
            available: true,
            available_stock: Math.min(book.totalStock, book.availableStock + returnQty)
          })
          .eq('id', book.id);

        await supabase.from('reviews').insert({
          id: newReview.id,
          book_id: book.id,
          profile_id: 'ARC-2026-089',
          scholar_name: currentUser.name,
          scholar_rank: currentRank.title,
          book_title: book.title,
          rating: reviewRating,
          note: noteText,
          xp_awarded: earnedXp,
          review_date: new Date().toISOString().split('T')[0]
        });

        await supabase
          .from('profiles')
          .update({
            xp: updatedXp,
            books_read: nextBooksRead,
            tomes_read_count: nextBooksRead
          })
          .or('guild_id.eq.ARC-2026-089,student_id.eq.ARC-2026-089,id.eq.ARC-2026-089');
      } catch (err) {
        console.warn('Supabase sync return error:', err);
      }
    }
  };

  // ==========================================
  // HANDLER: CLAIM QUEST REWARD
  // ==========================================
  const handleClaimQuest = async (quest) => {
    if (quest.progress < quest.target || quest.claimed) return;

    setQuests((prev) =>
      prev.map((q) => (q.id === quest.id ? { ...q, claimed: true } : q))
    );

    const updatedXp = studentXp + quest.xpReward;
    setStudentXp(updatedXp);

    showToast(
      `Misi Selesai: ${quest.title}!`,
      `Kamu memperoleh +${quest.xpReward} XP dan segel kehormatan "${quest.badgeName}".`,
      'gold'
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('quests').update({ claimed: true }).eq('id', quest.id);
        await supabase.from('profiles').update({ xp: updatedXp }).eq('student_id', 'ARC-2026-089');
      } catch (err) {
        console.warn('Supabase quest claim sync error:', err);
      }
    }
  };

  // ==========================================
  // HANDLER: ALCHEMICAL MIXER (BREW RECOMMENDATION)
  // ==========================================
  const toggleIngredient = (id) => {
    setBrewedResult(null);
    setSelectedIngredients((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        showToast(
          'Kuali Penuh (Maksimal 3 Bahan)',
          'Kuali Alkimia hanya dapat menampung hingga 3 bahan esensi agar transmutasi tetap seimbang.',
          'purple'
        );
        return prev;
      }
      return [...prev, id];
    });
  };

  const applyPresetRecipe = (ingredientIds) => {
    setSelectedIngredients(ingredientIds);
    setBrewedResult(null);
  };

  const handleTransmute = () => {
    if (selectedIngredients.length === 0) {
      showToast(
        'Pilih Bahan Alkimia',
        'Masukkan minimal 1 hingga 3 bahan esensi ke dalam kuali sebelum memulai peracikan.',
        'purple'
      );
      return;
    }

    setIsBrewing(true);
    setBrewedResult(null);

    setTimeout(() => {
      const scoredBooks = books
        .map((book) => {
          const matchedIds = (book.ingredients || []).filter((ing) =>
            selectedIngredients.includes(ing)
          );
          const matchRatio = matchedIds.length / selectedIngredients.length;
          const affinityBonus =
            matchedIds.length / Math.max((book.ingredients || []).length, 1);
          const totalScore =
            matchedIds.length * 40 + matchRatio * 35 + affinityBonus * 25;

          return {
            ...book,
            matchedIds,
            matchPercent: Math.min(99, Math.round(totalScore))
          };
        })
        .filter((b) => b.matchedIds.length > 0)
        .sort((a, b) => b.matchPercent - a.matchPercent)
        .slice(0, 4);

      const chosenIngObjects = selectedIngredients
        .map((id) => INGREDIENTS.find((i) => i.id === id))
        .filter(Boolean);

      const potionPrefixes = {
        shadow: 'Nocturnal',
        spark: 'Luminous',
        wind: 'Tempest',
        wisdom: 'Chronos',
        ember: 'Immortal',
        craft: 'Crystalline'
      };
      const potionNouns = {
        shadow: 'Secrets',
        spark: 'Cosmos',
        wind: 'Horizons',
        wisdom: 'Ancients',
        ember: 'Courage',
        craft: 'Logic'
      };

      const firstId = selectedIngredients[0];
      const lastId = selectedIngredients[selectedIngredients.length - 1];
      const potionName = `Elixir of ${potionPrefixes[firstId] || 'Arcane'} ${
        potionNouns[lastId] || 'Wisdom'
      }`;

      setIsBrewing(false);
      const nextBrewCount = potionsBrewedCount + 1;
      setPotionsBrewedCount(nextBrewCount);
      setBrewedResult({
        potionName,
        chosenIngObjects,
        recommendations: scoredBooks
      });

      // Update Quest 3
      setQuests((prev) =>
        prev.map((q) =>
          q.id === 'quest-3'
            ? { ...q, progress: Math.min(q.target, q.progress + 1) }
            : q
        )
      );

      // Confetti
      try {
        confetti({
          particleCount: 65,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#10B981', '#8B5CF6', '#D4AF37']
        });
      } catch {}

      showToast(
        `${potionName} Selesai Diracik!`,
        `Kuali menyingkap ${scoredBooks.length} grimoire terbaik yang selaras dengan esensi ramuanmu.`,
        'emerald'
      );
    }, 1200);
  };

  // ==========================================
  // HANDLER: ARCHIVIST ADMIN (ADD NEW BOOK)
  // ==========================================
  const handleAddNewBook = async (e) => {
    e.preventDefault();
    if (!newBookForm.title.trim() || !newBookForm.author.trim()) return;

    const schoolObj = SCHOOLS_OF_LORE.find((s) => s.id === newBookForm.category);
    const newId = `book-${Date.now()}`;
    const totalQty = Number(newBookForm.totalStock) || 5;
    const availQty = Number(newBookForm.availableStock) ?? totalQty;

    const customDigitalContent = newBookForm.digitalContentText.trim()
      ? [
          {
            chapterNum: 'BAB I',
            chapterTitle: 'Inisiasi Manuskrip',
            content: newBookForm.digitalContentText.trim()
          }
        ]
      : getDigitalTomeContent({ title: newBookForm.title, author: newBookForm.author, category: newBookForm.category });

    const newBook = enrichBook(
      {
        id: newId,
        title: newBookForm.title.trim(),
        subtitle: newBookForm.subtitle.trim() || 'Manuskrip Rahasia Pengetahuan',
        author: newBookForm.author.trim(),
        category: newBookForm.category,
        categoryLabel: `${schoolObj?.name || 'Alchemy'} (${schoolObj?.indo || 'Sains & Alam'})`,
        rating: 5.0,
        xpReward: Number(newBookForm.xpReward) || 120,
        pages: Number(newBookForm.pages) || 350,
        isbn:
          newBookForm.isbn.trim() ||
          `978-602-${Math.floor(100 + Math.random() * 899)}-0`,
        shelf: newBookForm.shelf.trim() || 'Menara Arsip Sentral',
        kodeBuku: newBookForm.kodeBuku.trim(),
        publisher: newBookForm.publisher.trim(),
        publicationYear: Number(newBookForm.publicationYear) || 2024,
        coverUrl: newBookForm.coverUrl.trim(),
        pdfUrl: newBookForm.pdfUrl.trim(),
        ddc: newBookForm.ddc.trim(),
        callNumber: newBookForm.callNumber.trim(),
        status: availQty > 0 ? 'available' : 'borrowed',
        available: availQty > 0,
        totalStock: totalQty,
        availableStock: availQty,
        hasDigital: true,
        digitalContent: customDigitalContent,
        popular: true,
        coverRune: '✦',
        coverGradient: 'from-amber-950 via-stone-900 to-black',
        accentColor: '#D4AF37',
        ingredients:
          newBookForm.ingredients.length > 0
            ? newBookForm.ingredients
            : ['spark', 'wisdom'],
        synopsis:
          newBookForm.synopsis.trim() ||
          'Naskah grimoire baru yang baru saja diinskripsikan ke dalam lemari arsip agung.',
        reviews: []
      },
      books.length
    );

    setBooks((prev) => [newBook, ...prev]);

    // Reset Form
    setNewBookForm({
      title: '',
      subtitle: '',
      author: '',
      category: 'Alchemy',
      shelf: 'Menara Timur • Rak Alkimia C1',
      kodeBuku: '',
      publisher: '',
      publicationYear: 2024,
      coverUrl: '',
      pdfUrl: '',
      ddc: '',
      callNumber: '',
      pages: 350,
      xpReward: 120,
      isbn: '978-602-000-000-0',
      totalStock: 5,
      availableStock: 5,
      digitalContentText: '',
      synopsis: '',
      ingredients: ['spark', 'craft']
    });

    showToast(
      'Grimoire Baru Berhasil Diinskripsikan!',
      `"${newBook.title}" kini telah resmi terdaftar di katalog (${availQty}/${totalQty} eksemplar tersedia).`,
      'emerald'
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('books').insert({
          id: newBook.id,
          title: newBook.title,
          fantasy_subtitle: newBook.subtitle,
          author: newBook.author,
          isbn: newBook.isbn,
          xp_reward: newBook.xpReward,
          school: newBook.category,
          school_name: newBook.categoryLabel,
          rating: newBook.rating,
          pages: newBook.pages,
          shelf: newBook.shelf,
          status: newBook.status,
          available: newBook.available,
          total_stock: newBook.totalStock,
          available_stock: newBook.availableStock,
          has_digital: true,
          digital_content: newBook.digitalContent,
          ingredients: newBook.ingredients,
          synopsis: newBook.synopsis,
          featured: true,
          kode_buku: newBook.kodeBuku,
          book_code: newBook.kodeBuku,
          ddc: newBook.ddc,
          call_number: newBook.callNumber,
          barcode: newBook.barcode,
          publisher: newBook.publisher || null,
          publication_year: newBook.publicationYear || null,
          cover_url: newBook.coverUrl || null,
          pdf_url: newBook.pdfUrl || null
        });
      } catch (err) {
        console.warn('Supabase insert book error:', err);
      }
    }
  };

  // Filter books for Vault of Tomes
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        book.title.toLowerCase().includes(q) ||
        (book.subtitle && book.subtitle.toLowerCase().includes(q)) ||
        book.author.toLowerCase().includes(q) ||
        book.categoryLabel.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === 'All' || book.category === selectedCategory;

      let matchesAvailability = true;
      if (availabilityFilter === 'available') {
        matchesAvailability = book.availableStock > 0;
      } else if (availabilityFilter === 'out_of_stock') {
        matchesAvailability = book.availableStock === 0;
      }

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [books, searchQuery, selectedCategory, availabilityFilter]);

  // Dynamic Cauldron Colors
  const cauldronColor = useMemo(() => {
    if (selectedIngredients.length === 0) return '#10B981';
    const first = INGREDIENTS.find((i) => i.id === selectedIngredients[0]);
    return first ? first.color : '#10B981';
  }, [selectedIngredients]);

  const cauldronSecondaryColor = useMemo(() => {
    if (selectedIngredients.length < 2) return '#D4AF37';
    const second = INGREDIENTS.find((i) => i.id === selectedIngredients[1]);
    return second ? second.color : '#8B5CF6';
  }, [selectedIngredients]);

  const renderIngredientIcon = (type, className = 'w-5 h-5') => {
    switch (type) {
      case 'sparkles':
        return <Sparkles className={className} />;
      case 'flask':
        return <FlaskConical className={className} />;
      case 'compass':
        return <Compass className={className} />;
      case 'scroll':
        return <Scroll className={className} />;
      case 'flame':
        return <Flame className={className} />;
      case 'shield':
        return <Shield className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col selection:bg-amber-500/30 selection:text-amber-200"
      style={{
        backgroundColor: '#12100E',
        color: '#F4E8C1',
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}
    >
      {/* Styles & Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .font-cinzel {
          font-family: 'Cinzel', serif;
        }

        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(1.5deg); }
        }

        @keyframes bubbleRise {
          0% { transform: translateY(20px) scale(0.6); opacity: 0; }
          50% { opacity: 0.9; }
          100% { transform: translateY(-55px) scale(1.25); opacity: 0; }
        }

        @keyframes runeSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulseGlow {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.05); }
        }

        .animate-float {
          animation: floatSlow 4.5s ease-in-out infinite;
        }

        .animate-rune-spin {
          animation: runeSpin 18s linear infinite;
        }

        .animate-rune-spin-fast {
          animation: runeSpin 1.4s linear infinite;
        }

        .animate-pulse-glow {
          animation: pulseGlow 3s ease-in-out infinite;
        }

        .bubble-1 { animation: bubbleRise 2.4s infinite ease-in 0.1s; }
        .bubble-2 { animation: bubbleRise 2.9s infinite ease-in 0.7s; }
        .bubble-3 { animation: bubbleRise 2.1s infinite ease-in 1.2s; }
        .bubble-4 { animation: bubbleRise 2.6s infinite ease-in 0.4s; }

        .parchment-card {
          background: linear-gradient(145deg, #1E1916 0%, #171311 100%);
          border: 1px solid rgba(212, 175, 55, 0.22);
        }

        .parchment-card:hover {
          border-color: rgba(212, 175, 55, 0.55);
        }

        .gold-gradient-text {
          background: linear-gradient(90deg, #F4E8C1 0%, #D4AF37 50%, #F4E8C1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #12100E;
        }
        ::-webkit-scrollbar-thumb {
          background: #2D251F;
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #D4AF37;
        }
      `}</style>

      {/* ==========================================
          TOP ROLE SWITCHER BAR (STEP 1)
      ========================================== */}
      <RoleSwitcherBar
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        onOpenGatekeeperModal={() => setIsGatekeeperOpen(true)}
      />

      {/* ==========================================
          STICKY TOP NAVIGATION BAR
      ========================================== */}
      <header
        className="sticky top-0 z-40 backdrop-blur-md border-b"
        style={{
          backgroundColor: 'rgba(18, 16, 14, 0.94)',
          borderColor: 'rgba(212, 175, 55, 0.25)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between py-3 gap-3">
            {/* Brand Logo & Subtitle */}
            <button
              onClick={() => setActiveTab('hall')}
              className="flex items-center gap-3 text-left group focus:outline-none"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-105 shadow-md"
                style={{
                  background:
                    'radial-gradient(circle at 30% 30%, rgba(212, 175, 55, 0.3), rgba(16, 185, 129, 0.15))',
                  borderColor: '#D4AF37'
                }}
              >
                <FlaskConical className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <span className="font-cinzel font-bold text-base sm:text-lg tracking-wider text-[#F4E8C1] group-hover:text-[#D4AF37] transition-colors block">
                  THE GRAND ALCHEMIST&apos;S ARCHIVE
                </span>
                <p className="text-xs text-[#A89F91]">
                  Pustaka Agung Alkemis • Perpustakaan SMA Nusantara
                </p>
              </div>
            </button>

            {/* Smart Supabase Status Badge */}
            <div className="order-2 lg:order-2 flex items-center">
              {isSupabaseConfigured ? (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.35)]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Connected to Grand Archive DB</span>
                </span>
              ) : (
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-500/40 flex items-center gap-1.5"
                  title="Aplikasi berjalan lancar tanpa database cloud (Local Fallback)"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Local Grimoire Mode</span>
                </span>
              )}
            </div>

            {/* Role-Aware Navigation Tabs */}
            <nav className="flex items-center gap-1 sm:gap-2 order-4 lg:order-3 w-full lg:w-auto justify-center border-t lg:border-t-0 pt-2 lg:pt-0 border-[#D4AF37]/15 overflow-x-auto">
              {navTabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                      isActive
                        ? 'bg-[#D4AF37]/20 text-[#F4E8C1] border border-[#D4AF37]'
                        : 'text-[#A89F91] hover:text-[#F4E8C1] hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <IconComponent
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-[#D4AF37]'
                          : tab.highlight
                          ? 'text-emerald-400'
                          : tab.isGuru
                          ? 'text-sky-400'
                          : tab.isAdmin
                          ? 'text-amber-400'
                          : 'text-[#A89F91]'
                      }`}
                    />
                    <div className="text-left">
                      <span className="font-cinzel font-semibold block leading-tight">
                        {tab.label}
                      </span>
                      <span className="text-[10px] text-[#A89F91] hidden sm:block">
                        {tab.sub}
                      </span>
                    </div>

                    {tab.highlight && !isActive && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    )}

                    {tab.badgeCount > 0 && (
                      <span
                        className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full text-[#12100E] ${
                          tab.isAdmin
                            ? 'bg-amber-400'
                            : tab.isGuru
                            ? 'bg-sky-400'
                            : 'bg-emerald-400'
                        }`}
                      >
                        {tab.badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Current Active User Profile Pill */}
            <div className="order-3 lg:order-4 flex items-center gap-2">
              <button
                onClick={() => {
                  if (currentUser.role === 'admin') setActiveTab('archivist');
                  else if (currentUser.role === 'guru') setActiveTab('mentor');
                  else setActiveTab('sanctum');
                }}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all hover:border-[#D4AF37]"
                style={{
                  backgroundColor: '#1E1916',
                  borderColor: 'rgba(212, 175, 55, 0.35)'
                }}
                title="Buka Ruang Profil Role Ini"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm border"
                  style={{
                    backgroundColor: `${currentUser.color}20`,
                    borderColor: `${currentUser.color}60`
                  }}
                >
                  <span>{currentUser.avatar}</span>
                </div>
                <div className="text-left hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-cinzel font-bold text-[#F4E8C1] truncate max-w-[120px]">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase"
                      style={{
                        backgroundColor: `${currentUser.color}25`,
                        color: currentUser.color
                      }}
                    >
                      {currentUser.role}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#A89F91] truncate max-w-[140px]">
                    {currentUser.title}
                  </p>
                </div>
              </button>

              <button
                onClick={() => setIsGatekeeperOpen(true)}
                className="p-2 rounded-xl bg-[#1E1916] border border-white/10 hover:border-[#D4AF37] text-[#A89F91] hover:text-[#D4AF37] transition-all"
                title="Buka Modal Login Guild Gatekeeper"
              >
                <KeyRound className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ==========================================
          MAGICAL SCROLL TOAST NOTIFICATION
      ========================================== */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md animate-bounce">
          <div
            className="p-4 rounded-xl shadow-2xl border flex items-start gap-3"
            style={{
              backgroundColor: '#1E1916',
              borderColor:
                toast.type === 'emerald'
                  ? '#10B981'
                  : toast.type === 'purple'
                  ? '#8B5CF6'
                  : '#D4AF37',
              boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.8)'
            }}
          >
            <div
              className="p-2 rounded-lg shrink-0 mt-0.5"
              style={{
                backgroundColor:
                  toast.type === 'emerald'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : toast.type === 'purple'
                    ? 'rgba(139, 92, 246, 0.15)'
                    : 'rgba(212, 175, 55, 0.15)'
              }}
            >
              <Sparkles
                className="w-5 h-5"
                style={{
                  color:
                    toast.type === 'emerald'
                      ? '#10B981'
                      : toast.type === 'purple'
                      ? '#8B5CF6'
                      : '#D4AF37'
                }}
              />
            </div>
            <div className="flex-1">
              <h4 className="font-cinzel font-bold text-sm text-[#F4E8C1]">
                {toast.title}
              </h4>
              <p className="text-xs text-[#A89F91] mt-0.5 leading-relaxed">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-[#A89F91] hover:text-[#F4E8C1]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          MAIN VIEWS ROUTING CONTAINER
      ========================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ==========================================
            VIEW 1: THE GREAT HALL (BERANDA)
        ========================================== */}
        {activeTab === 'hall' && (
          <div className="space-y-12">
            {/* HERO SECTION */}
            <section
              className="relative rounded-2xl overflow-hidden border p-6 sm:p-10 lg:p-12"
              style={{
                background:
                  'radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.18), rgba(16, 185, 129, 0.10) 40%, #1E1916 85%)',
                borderColor: 'rgba(212, 175, 55, 0.35)'
              }}
            >
              <div className="pointer-events-none absolute -right-20 -top-20 w-80 h-80 rounded-full border border-[#D4AF37]/15 flex items-center justify-center animate-rune-spin">
                <div className="w-60 h-60 rounded-full border border-dashed border-emerald-500/20" />
              </div>

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>GRAND ARCHIVE OF SCHOLARS • SISTEM 3 ROLE</span>
                  </div>

                  <h1 className="font-cinzel text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight gold-gradient-text">
                    Temukan Grimoire Pengetahuan &amp; Baca Digital Secara Instan
                  </h1>

                  <p className="text-sm sm:text-base text-[#A89F91] max-w-2xl leading-relaxed">
                    Selamat datang di{' '}
                    <span className="text-[#F4E8C1] font-medium">
                      The Grand Alchemist&apos;s Archive
                    </span>
                    . Telusuri ribuan pustaka sekolah melalui{' '}
                    <em>Scrying Mirror</em>, racik esensi minatmu di kuali alkimia, pinjam eksemplar fisik di rak, atau nikmati pembacaan langsung di dalam E-Grimoire Reader!
                  </p>

                  {/* SCRYING MIRROR SEARCH */}
                  <div className="pt-2 max-w-xl">
                    <label className="block text-xs font-cinzel tracking-wider text-[#D4AF37] mb-2">
                      SCRYING MIRROR (CARI JUDUL BUKU, PENULIS, ATAU KATA KUNCI):
                    </label>
                    <div className="relative flex items-center">
                      <Search className="w-5 h-5 text-[#D4AF37] absolute left-4 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Ketik 'Bumi', 'Fisika', 'Laskar Pelangi', atau 'Sherlock'..."
                        className="w-full pl-12 pr-32 py-3.5 rounded-xl text-sm bg-[#12100E]/90 border border-[#D4AF37]/40 text-[#F4E8C1] placeholder-[#A89F91]/60 focus:outline-none focus:border-[#D4AF37]"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-28 text-[#A89F91] hover:text-[#F4E8C1] p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setActiveTab('vault')}
                        className="absolute right-2 px-4 py-2 rounded-lg text-xs font-cinzel font-bold bg-[#D4AF37] text-[#12100E] hover:bg-amber-400 transition-colors"
                      >
                        Buka Vault
                      </button>
                    </div>
                  </div>

                  {/* Hero Actions */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => setActiveTab('mixer')}
                      className="px-5 py-3 rounded-xl font-cinzel font-bold text-sm flex items-center gap-2.5 text-[#12100E] shadow-lg transition-transform hover:scale-[1.02]"
                      style={{
                        background: 'linear-gradient(135deg, #10B981 0%, #D4AF37 100%)'
                      }}
                    >
                      <FlaskConical className="w-5 h-5" />
                      <span>Racik Buku di Alchemical Mixer</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('vault')}
                      className="px-5 py-3 rounded-xl font-cinzel font-semibold text-sm flex items-center gap-2 border border-[#D4AF37]/50 text-[#F4E8C1] hover:bg-[#D4AF37]/10 transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-[#D4AF37]" />
                      <span>Jelajahi Vault of Tomes</span>
                    </button>
                  </div>
                </div>

                {/* Right Side Stats & Recommender Teaser */}
                <div className="lg:col-span-5">
                  <div className="parchment-card rounded-2xl p-6 space-y-5 relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-4">
                      <div>
                        <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">
                          ALCHEMICAL RECOMMENDER
                        </span>
                        <h3 className="font-cinzel text-lg font-bold text-[#F4E8C1]">
                          The Transmutation Table
                        </h3>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-float">
                        <FlaskConical className="w-5 h-5" />
                      </div>
                    </div>

                    <p className="text-xs text-[#A89F91] leading-relaxed">
                      Pilih esensi minat di bawah untuk langsung mencoba kuali alkimia:
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      {INGREDIENTS.slice(0, 4).map((ing) => (
                        <button
                          key={ing.id}
                          onClick={() => {
                            setSelectedIngredients([ing.id]);
                            setActiveTab('mixer');
                          }}
                          className="p-2.5 rounded-xl border border-white/10 bg-black/30 hover:border-[#D4AF37]/40 text-left transition-all flex items-center gap-2"
                        >
                          <span
                            className="text-base w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: ing.bgGlow, color: ing.color }}
                          >
                            {ing.symbol}
                          </span>
                          <div className="overflow-hidden">
                            <p className="text-xs font-semibold text-[#F4E8C1] truncate">
                              {ing.name}
                            </p>
                            <p className="text-[10px] text-[#A89F91] truncate">
                              {ing.indoName}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Telemetry Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#D4AF37]/20 text-center">
                      <div className="p-2 rounded-lg bg-black/30">
                        <p className="font-cinzel font-bold text-lg text-[#D4AF37]">
                          {books.length}
                        </p>
                        <p className="text-[10px] text-[#A89F91]">Total Tomes</p>
                      </div>
                      <div className="p-2 rounded-lg bg-black/30">
                        <p className="font-cinzel font-bold text-lg text-emerald-400">
                          {books.filter((b) => b.availableStock > 0).length}
                        </p>
                        <p className="text-[10px] text-[#A89F91]">Ada di Rak</p>
                      </div>
                      <div className="p-2 rounded-lg bg-black/30">
                        <p className="font-cinzel font-bold text-lg text-purple-400">
                          {potionsBrewedCount}
                        </p>
                        <p className="text-[10px] text-[#A89F91]">Potions Brewed</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* LEADERBOARD KELAS TER-LITERAT */}
            <ClassLeaderboard
              leaderboard={classLeaderboard}
              monthLabel={formatMonthID(currentMonthKey)}
              highlightClass={currentUserClassName}
            />

            {/* LEGENDARY GRIMOIRES SHOWCASE */}
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#D4AF37] font-cinzel tracking-widest uppercase">
                    <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
                    <span>CURATED BY GRAND ARCHIVISTS</span>
                  </div>
                  <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#F4E8C1] mt-1">
                    Legendary Grimoires (Koleksi Unggulan)
                  </h2>
                </div>
                <button
                  onClick={() => setActiveTab('vault')}
                  className="text-sm font-cinzel text-[#D4AF37] hover:underline flex items-center gap-1"
                >
                  <span>Lihat Seluruh 12 Grimoire di Vault</span>
                  <span>→</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {books
                  .filter((b) => b.popular)
                  .slice(0, 6)
                  .map((book) => {
                    const isAvailable = book.availableStock > 0;
                    return (
                      <div
                        key={book.id}
                        className="parchment-card rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-lg"
                      >
                        <div>
                          <div className="flex gap-4">
                            <div
                              onClick={() => setInspectedBookId(book.id)}
                              className={`w-24 h-36 rounded-xl bg-gradient-to-br ${book.coverGradient} border border-[#D4AF37]/50 p-2.5 flex flex-col justify-between cursor-pointer shrink-0 relative overflow-hidden group shadow-md`}
                            >
                              <div className="flex justify-between items-center text-[10px] text-[#D4AF37]/80 font-cinzel">
                                <span>✦</span>
                                <span>{book.rating}★</span>
                              </div>
                              <div className="text-center my-auto">
                                <span className="text-2xl text-[#D4AF37] block group-hover:scale-125 transition-transform">
                                  {book.coverRune}
                                </span>
                              </div>
                              <div className="text-[9px] font-cinzel text-center text-[#F4E8C1]/90 line-clamp-2 border-t border-[#D4AF37]/30 pt-1">
                                {book.title}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 truncate">
                                  {book.category}
                                </span>
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    isAvailable
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  }`}
                                >
                                  {isAvailable
                                    ? `Sisa: ${book.availableStock}/${book.totalStock}`
                                    : 'Stok Fisik Habis'}
                                </span>
                              </div>

                              <h3
                                onClick={() => setInspectedBookId(book.id)}
                                className="font-cinzel font-bold text-base text-[#F4E8C1] mt-2 hover:text-[#D4AF37] cursor-pointer line-clamp-1"
                              >
                                {book.title}
                              </h3>
                              <p className="text-xs italic text-[#D4AF37]/90 line-clamp-1">
                                &ldquo;{book.subtitle}&rdquo;
                              </p>
                              <p className="text-xs text-[#A89F91] mt-1 truncate">
                                Karya: {book.author}
                              </p>

                              <div className="flex flex-wrap gap-1 mt-2.5">
                                {(book.ingredients || []).map((ingId) => {
                                  const ing = INGREDIENTS.find((i) => i.id === ingId);
                                  if (!ing) return null;
                                  return (
                                    <span
                                      key={ingId}
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 border border-white/10"
                                      style={{ color: ing.color }}
                                    >
                                      {ing.symbol} {ing.indoName.split(' ')[0]}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-[#A89F91] mt-4 line-clamp-2 leading-relaxed">
                            {book.synopsis}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-5 pt-3 border-t border-[#D4AF37]/15 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setReadingBook(book)}
                            className="px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all flex items-center gap-1 shadow-sm"
                            title="Baca langsung versi digital tanpa antre"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Baca Digital</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            {currentUser.role === 'admin' ? (
                              <button
                                onClick={() => setActiveTab('archivist')}
                                className="px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                              >
                                Kelola Stok
                              </button>
                            ) : currentUser.role === 'guru' ? (
                              <button
                                onClick={() => {
                                  setTeacherLoanForm((prev) => ({ ...prev, bookId: book.id }));
                                  setActiveTab('mentor');
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30"
                              >
                                Pinjam Kelas
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRequestStudentLoan(book)}
                                disabled={!isAvailable}
                                className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold transition-all ${
                                  isAvailable
                                    ? 'bg-[#D4AF37] text-[#12100E] hover:bg-amber-400'
                                    : 'bg-white/5 text-[#A89F91] cursor-not-allowed'
                                }`}
                              >
                                {isAvailable ? 'Ajukan Pinjam' : 'Stok Habis'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          </div>
        )}

        {/* ==========================================
            VIEW 2: ALCHEMICAL MIXER (RACIK BUKU)
        ========================================== */}
        {activeTab === 'mixer' && (
          <div className="space-y-10">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-cinzel bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <FlaskConical className="w-3.5 h-3.5" />
                <span>THE TRANSMUTATION TABLE • PERACIK REKOMENDASI BUKU</span>
              </div>
              <h1 className="font-cinzel text-3xl sm:text-4xl font-bold gold-gradient-text">
                Alchemical Book Recommendation Mixer
              </h1>
              <p className="text-sm text-[#A89F91] leading-relaxed">
                Pilih <strong>1 hingga 3 Esensi Alkimia</strong>. Kuali Pustaka akan melakukan transmutasi dan menyingkap grimoire terbaik yang memiliki resonansi tertinggi dengan minat belajarmu hari ini!
              </p>

              {/* Preset Recipes */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-[#A89F91] mr-1">Resep Cepat:</span>
                {PRESET_RECIPES.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPresetRecipe(preset.ingredients)}
                    className="text-xs px-3 py-1.5 rounded-full bg-[#1E1916] border border-[#D4AF37]/30 hover:border-[#D4AF37] text-[#F4E8C1] transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mixer Arena */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: 6 Alchemical Ingredients */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-cinzel text-lg font-bold text-[#F4E8C1] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <span>Pilih Esensi Alkimia ({selectedIngredients.length}/3)</span>
                  </h2>
                  {selectedIngredients.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedIngredients([]);
                        setBrewedResult(null);
                      }}
                      className="text-xs text-[#A89F91] hover:text-rose-400 transition-colors"
                    >
                      Kosongkan Kuali
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {INGREDIENTS.map((ing) => {
                    const isSelected = selectedIngredients.includes(ing.id);
                    return (
                      <div
                        key={ing.id}
                        onClick={() => toggleIngredient(ing.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 relative overflow-hidden ${
                          isSelected
                            ? 'bg-[#1E1916] scale-[1.01] shadow-lg'
                            : 'bg-[#1E1916]/60 hover:bg-[#1E1916] opacity-85 hover:opacity-100'
                        }`}
                        style={{
                          borderColor: isSelected ? ing.color : 'rgba(212, 175, 55, 0.2)',
                          boxShadow: isSelected ? `0 0 25px -5px ${ing.bgGlow}` : 'none'
                        }}
                      >
                        <div className="flex items-start gap-3.5">
                          <div
                            className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border"
                            style={{
                              backgroundColor: ing.bgGlow,
                              borderColor: ing.color,
                              color: ing.color
                            }}
                          >
                            {renderIngredientIcon(ing.iconType, 'w-5 h-5')}
                            <span className="text-[10px] font-bold leading-none mt-0.5">
                              {ing.symbol}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h3 className="font-cinzel font-bold text-sm text-[#F4E8C1]">
                                {ing.name}
                              </h3>
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center border text-xs ${
                                  isSelected
                                    ? 'bg-[#D4AF37] border-[#D4AF37] text-[#12100E]'
                                    : 'border-white/20 text-[#A89F91]'
                                }`}
                              >
                                {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                              </div>
                            </div>
                            <p className="text-xs font-semibold mt-0.5" style={{ color: ing.color }}>
                              {ing.indoName}
                            </p>
                            <p className="text-[11px] text-[#A89F91] mt-1 line-clamp-2 leading-relaxed">
                              {ing.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Animated SVG Cauldron */}
              <div className="lg:col-span-5">
                <div className="parchment-card rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden">
                  <div
                    className="pointer-events-none absolute inset-x-10 top-12 h-48 rounded-full blur-3xl transition-colors duration-700 animate-pulse-glow"
                    style={{
                      background: `radial-gradient(circle, ${cauldronColor}55 0%, ${cauldronSecondaryColor}33 60%, transparent 100%)`
                    }}
                  />

                  <span className="relative z-10 text-xs font-cinzel tracking-widest uppercase text-[#D4AF37]">
                    CRUCIBLE OF WISDOM
                  </span>
                  <h3 className="relative z-10 font-cinzel text-xl font-bold text-[#F4E8C1] mt-1">
                    {isBrewing
                      ? 'Sedang Mentransmutasi...'
                      : selectedIngredients.length === 0
                      ? 'Kuali Menanti Bahan'
                      : `${selectedIngredients.length} Esensi Siap Diracik`}
                  </h3>

                  {/* SVG Cauldron Graphic */}
                  <div className="relative z-10 my-6 flex items-center justify-center">
                    <div className="relative w-64 h-60 flex items-center justify-center">
                      <div
                        className={`absolute inset-0 rounded-full border border-dashed flex items-center justify-center ${
                          isBrewing ? 'animate-rune-spin-fast' : 'animate-rune-spin'
                        }`}
                        style={{ borderColor: `${cauldronColor}66` }}
                      >
                        <span className="absolute -top-3 text-sm font-bold" style={{ color: cauldronColor }}>
                          ☉
                        </span>
                        <span className="absolute -bottom-3 text-sm font-bold" style={{ color: cauldronSecondaryColor }}>
                          ☽
                        </span>
                        <span className="absolute -left-3 text-sm font-bold text-[#D4AF37]">
                          🜂
                        </span>
                        <span className="absolute -right-3 text-sm font-bold text-[#D4AF37]">
                          🜁
                        </span>
                      </div>

                      <svg
                        viewBox="0 0 220 200"
                        className={`w-52 h-48 transition-transform duration-500 ${
                          isBrewing ? 'scale-110' : 'scale-100'
                        }`}
                      >
                        {selectedIngredients.length > 0 && (
                          <g>
                            <circle cx="85" cy="70" r="6" fill={cauldronColor} className="bubble-1" />
                            <circle cx="115" cy="65" r="8" fill={cauldronSecondaryColor} className="bubble-2" />
                            <circle cx="135" cy="72" r="5" fill="#D4AF37" className="bubble-3" />
                            <circle cx="98" cy="68" r="4" fill={cauldronColor} className="bubble-4" />
                          </g>
                        )}

                        <ellipse cx="110" cy="75" rx="62" ry="14" fill="#2A2421" stroke="#D4AF37" strokeWidth="2.5" />
                        <ellipse cx="110" cy="76" rx="54" ry="10" fill={cauldronColor} opacity="0.85" />
                        <path d="M48 76 C35 130, 58 172, 110 172 C162 172, 185 130, 172 76 Z" fill="#171311" stroke="#D4AF37" strokeWidth="3" />
                        <circle cx="42" cy="102" r="10" fill="none" stroke="#D4AF37" strokeWidth="3" />
                        <circle cx="178" cy="102" r="10" fill="none" stroke="#D4AF37" strokeWidth="3" />
                        <circle cx="110" cy="125" r="22" fill="none" stroke={cauldronColor} strokeWidth="1.8" strokeDasharray="4 2" />
                        <text x="110" y="132" textAnchor="middle" fill="#D4AF37" fontSize="20" fontFamily="serif">
                          {selectedIngredients.length > 0 ? INGREDIENTS.find((i) => i.id === selectedIngredients[0])?.symbol : '✦'}
                        </text>
                        <path d="M72 166 L62 188 M148 166 L158 188" stroke="#D4AF37" strokeWidth="4" strokeLinecap="round" />
                        <path d="M90 190 Q110 165 130 190 Q110 180 90 190 Z" fill={isBrewing ? '#10B981' : '#D4AF37'} opacity="0.8" />
                      </svg>
                    </div>
                  </div>

                  {/* Brew Button */}
                  <button
                    onClick={handleTransmute}
                    disabled={isBrewing || selectedIngredients.length === 0}
                    className={`w-full py-3.5 rounded-xl font-cinzel font-bold text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-xl ${
                      selectedIngredients.length === 0 || isBrewing
                        ? 'bg-white/10 text-[#A89F91] cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 via-amber-500 to-purple-600 text-[#12100E] hover:brightness-110'
                    }`}
                  >
                    <FlaskConical className={`w-5 h-5 ${isBrewing ? 'animate-spin' : ''}`} />
                    <span>{isBrewing ? 'Mentransmutasi Ramuan...' : 'Racik Buku di Kuali Alkimia'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Brewed Results Showcase */}
            {brewedResult && (
              <section className="space-y-6 pt-6 animate-fadeIn">
                <div className="border-t border-[#D4AF37]/30 pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-cinzel">
                      TRANSMUTATION COMPLETE
                    </span>
                    <h2 className="font-cinzel text-2xl font-bold text-[#F4E8C1] mt-0.5">
                      {brewedResult.potionName}
                    </h2>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {brewedResult.recommendations.length} Grimoire Paling Selaras
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {brewedResult.recommendations.map((book) => {
                    const isAvailable = book.availableStock > 0;
                    return (
                      <div
                        key={book.id}
                        className="parchment-card rounded-2xl p-4 flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              Resonansi {book.matchPercent}%
                            </span>
                            <span
                              className={`text-[10px] font-semibold ${
                                isAvailable ? 'text-emerald-400' : 'text-amber-400'
                              }`}
                            >
                              {isAvailable ? `${book.availableStock} Tersedia` : 'Stok Habis'}
                            </span>
                          </div>

                          <h3 className="font-cinzel font-bold text-sm text-[#F4E8C1] line-clamp-1">
                            {book.title}
                          </h3>
                          <p className="text-[11px] text-[#A89F91] line-clamp-1">
                            {book.author}
                          </p>
                          <p className="text-xs text-[#A89F91] mt-2 line-clamp-2">
                            {book.synopsis}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-[#D4AF37]/15 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setReadingBook(book)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-cinzel font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all flex items-center gap-1"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>Baca Digital</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (currentUser.role === 'admin') setActiveTab('archivist');
                              else if (currentUser.role === 'guru') {
                                setTeacherLoanForm((prev) => ({ ...prev, bookId: book.id }));
                                setActiveTab('mentor');
                              } else {
                                handleRequestStudentLoan(book);
                              }
                            }}
                            disabled={currentUser.role === 'siswa' && !isAvailable}
                            className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold transition-all ${
                              currentUser.role === 'siswa' && !isAvailable
                                ? 'bg-white/5 text-[#A89F91] cursor-not-allowed'
                                : 'bg-[#D4AF37] text-[#12100E] hover:bg-amber-400'
                            }`}
                          >
                            {currentUser.role === 'admin'
                              ? 'Kelola'
                              : currentUser.role === 'guru'
                              ? 'Pinjam Kelas'
                              : isAvailable
                              ? 'Pinjam Fisik'
                              : 'Habis'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ==========================================
            VIEW 3: VAULT OF TOMES (KATALOG BUKU LENGKAP)
        ========================================== */}
        {activeTab === 'vault' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-cinzel tracking-widest text-[#D4AF37] uppercase">
                  THE SACRED ARCHIVES OF KNOWLEDGE
                </span>
                <h1 className="font-cinzel text-3xl font-bold text-[#F4E8C1] mt-0.5">
                  Vault of Tomes ({filteredBooks.length} Koleksi)
                </h1>
                <p className="text-xs text-[#A89F91] mt-1">
                  Koleksi buku perpustakaan SMA Nusantara lengkap dengan status ketersediaan fisik dan versi digital.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl text-xs bg-[#1E1916] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="all">Semua Koleksi ({books.length})</option>
                  <option value="available">
                    Stok Fisik Tersedia ({books.filter((b) => b.availableStock > 0).length})
                  </option>
                  <option value="out_of_stock">
                    Stok Fisik Habis / Khusus Digital ({books.filter((b) => b.availableStock === 0).length})
                  </option>
                </select>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {SCHOOLS_OF_LORE.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs transition-all whitespace-nowrap border text-left ${
                      active
                        ? 'bg-[#D4AF37] text-[#12100E] border-[#D4AF37] font-bold'
                        : 'bg-[#1E1916] text-[#F4E8C1] border-[#D4AF37]/25 hover:border-[#D4AF37]/60'
                    }`}
                  >
                    <span className="font-cinzel block">{cat.name}</span>
                    <span className={`text-[10px] ${active ? 'text-[#12100E]/80' : 'text-[#A89F91]'}`}>
                      {cat.indo}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Grid Books */}
            {filteredBooks.length === 0 ? (
              <div className="parchment-card rounded-2xl p-12 text-center space-y-3">
                <Compass className="w-10 h-10 text-[#D4AF37] mx-auto" />
                <h3 className="font-cinzel text-lg font-bold text-[#F4E8C1]">
                  Tidak Ada Grimoire Ditemukan
                </h3>
                <p className="text-xs text-[#A89F91]">
                  Coba ubah filter kategori atau bersihkan kata kunci pencarian.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setAvailabilityFilter('all');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-cinzel bg-[#D4AF37] text-[#12100E] font-bold"
                >
                  Reset Filter Vault
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBooks.map((book) => {
                  const isAvailable = book.availableStock > 0;
                  return (
                    <div
                      key={book.id}
                      className="parchment-card rounded-2xl p-5 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-md"
                    >
                      <div>
                        <div className="flex gap-4">
                          <div
                            onClick={() => setInspectedBookId(book.id)}
                            className={`w-24 h-36 rounded-xl bg-gradient-to-br ${book.coverGradient} border border-[#D4AF37]/50 p-2.5 flex flex-col justify-between cursor-pointer shrink-0 group`}
                          >
                            <div className="flex justify-between items-center text-[10px] text-[#D4AF37]">
                              <span>✦</span>
                              <span>{book.rating}★</span>
                            </div>
                            <div className="text-center my-auto">
                              <span className="text-2xl text-[#D4AF37] block group-hover:scale-125 transition-transform">
                                {book.coverRune}
                              </span>
                            </div>
                            <div className="text-[9px] font-cinzel text-center text-[#F4E8C1] line-clamp-2 border-t border-[#D4AF37]/30 pt-1">
                              {book.title}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 truncate">
                                {book.category}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                  isAvailable
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                                }`}
                              >
                                {isAvailable
                                  ? `Sisa: ${book.availableStock}/${book.totalStock}`
                                  : 'Stok Habis • Digital Ready'}
                              </span>
                            </div>

                            <h3
                              onClick={() => setInspectedBookId(book.id)}
                              className="font-cinzel font-bold text-base text-[#F4E8C1] mt-2 hover:text-[#D4AF37] cursor-pointer line-clamp-1"
                            >
                              {book.title}
                            </h3>
                            <p className="text-xs italic text-[#D4AF37]/90 line-clamp-1">
                              &ldquo;{book.subtitle}&rdquo;
                            </p>
                            <p className="text-xs text-[#A89F91] mt-0.5">
                              {book.author}
                            </p>

                            <div className="flex flex-wrap gap-1 mt-2">
                              {(book.ingredients || []).map((ingId) => {
                                const ing = INGREDIENTS.find((i) => i.id === ingId);
                                if (!ing) return null;
                                return (
                                  <span
                                    key={ingId}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 border border-white/10"
                                    style={{ color: ing.color }}
                                  >
                                    {ing.symbol} {ing.indoName.split(' ')[0]}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Out of Stock Notice */}
                        {!isAvailable && (
                          <div className="mt-3 p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-300 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Stok fisik habis di rak. Silakan baca versi <strong>Astral Grimoire</strong> secara online!
                            </span>
                          </div>
                        )}

                        <p className="text-xs text-[#A89F91] mt-3 line-clamp-2 leading-relaxed">
                          {book.synopsis}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 pt-3 border-t border-[#D4AF37]/15 flex items-center justify-between gap-2">
                        {/* Always available digital reader button */}
                        <button
                          type="button"
                          onClick={() => setReadingBook(book)}
                          className="px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all flex items-center gap-1"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Baca Digital</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setInspectedBookId(book.id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs border border-[#D4AF37]/40 text-[#F4E8C1] hover:bg-[#D4AF37]/15"
                          >
                            Detail
                          </button>

                          {currentUser.role === 'admin' ? (
                            <button
                              onClick={() => setActiveTab('archivist')}
                              className="px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                            >
                              Kelola
                            </button>
                          ) : currentUser.role === 'guru' ? (
                            <button
                              onClick={() => {
                                setTeacherLoanForm((prev) => ({ ...prev, bookId: book.id }));
                                setActiveTab('mentor');
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30"
                            >
                              Pinjam Kelas
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRequestStudentLoan(book)}
                              disabled={!isAvailable}
                              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold transition-all ${
                                isAvailable
                                  ? 'bg-[#D4AF37] text-[#12100E] hover:bg-amber-400'
                                  : 'bg-white/5 text-[#A89F91] cursor-not-allowed'
                              }`}
                            >
                              {isAvailable ? 'Ajukan Pinjam' : 'Stok Habis'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            VIEW 4: SCHOLAR'S SANCTUM (ROLE SISWA)
        ========================================== */}
        {activeTab === 'sanctum' && (
          <ScholarsSanctumView
            currentUser={currentUser}
            currentRank={currentRank}
            studentXp={studentXp}
            potionsBrewedCount={potionsBrewedCount}
            booksReadCount={booksReadCount}
            books={books}
            studentActiveLoans={studentActiveLoans}
            studentPendingLoans={studentPendingLoans}
            quests={quests}
            badges={badges}
            readingLogs={studentReadingLogs}
            onClaimQuest={handleClaimQuest}
            onOpenReturnModal={handleOpenReturnModal}
            onOpenReader={(b) => setReadingBook(b)}
            onInspectBook={(id) => setInspectedBookId(id)}
            onOpenReadingLog={handleOpenReadingLog}
            onBrowseBooks={() => setActiveTab('vault')}
          />
        )}

        {/* ==========================================
            VIEW 5: MENTOR'S SANCTUM (ROLE GURU)
        ========================================== */}
        {activeTab === 'mentor' && (
          <MentorsSanctumView
            currentUser={currentUser}
            books={books}
            teacherLoans={teacherLoans}
            teacherLoanForm={teacherLoanForm}
            setTeacherLoanForm={setTeacherLoanForm}
            onSubmitTeacherLoan={handleSubmitTeacherLoan}
            readingLogs={readingLogs}
            onGradeReadingLog={handleGradeReadingLog}
            packageLoanForm={packageLoanForm}
            setPackageLoanForm={setPackageLoanForm}
            onSubmitPackageLoan={handleSubmitPackageLoan}
            onCompletePackageLoan={handleCompletePackageLoan}
            onOpenReader={(b) => setReadingBook(b)}
            onInspectBook={(id) => setInspectedBookId(id)}
          />
        )}

        {/* ==========================================
            VIEW 6: ARCHIVIST'S CHAMBER (ROLE ADMIN)
        ========================================== */}
        {activeTab === 'archivist' && (
          <ArchivistsChamberView
            currentUser={currentUser}
            books={books}
            loans={loans}
            members={members}
            allPendingLoans={allPendingLoans}
            allApprovedLoans={allApprovedLoans}
            onApproveLoan={handleApproveLoan}
            onRejectLoan={handleRejectLoan}
            onVerifyReturnLoan={handleVerifyReturnLoan}
            onAdjustStock={handleAdjustStock}
            onSubmitQuickLoan={handleSubmitQuickLoan}
            isSubmittingQuickLoan={isSubmittingQuickLoan}
            newBookForm={newBookForm}
            setNewBookForm={setNewBookForm}
            onAddNewBook={handleAddNewBook}
            onImportBulkBooks={handleImportBulkBooks}
            isImporting={isImportingBooks}
            isSupabaseConfigured={isSupabaseConfigured}
            isSeedingSupabase={isSeedingSupabase}
            onSeedSupabase={() => executeSeedSupabase(true)}
            onOpenReader={(b) => setReadingBook(b)}
            onOpenPdfViewer={(book) => setPdfViewerBook(book)}
            onInspectBook={(id) => setInspectedBookId(id)}
            ingredientsList={INGREDIENTS}
            schoolsList={SCHOOLS_OF_LORE}
          />
        )}
      </main>

      {/* ==========================================
          MODAL 0: GLS READING LOG JOURNAL FORM
      ========================================== */}
      {journalBook && (
        <ReadingLogModal
          book={journalBook}
          existingLog={
            studentReadingLogs.find((log) => log.bookId === journalBook.id) || null
          }
          currentUser={currentUser}
          onClose={() => setJournalBook(null)}
          onSubmit={handleSubmitReadingLog}
        />
      )}

      {/* ==========================================
          MODAL 1: TOME INSPECTION MODAL (ANCIENT SCROLL)
      ========================================== */}
      {inspectedBook && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="max-w-2xl w-full rounded-2xl border p-6 sm:p-8 relative my-8 max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: '#1E1916',
              borderColor: '#D4AF37',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.95)'
            }}
          >
            <button
              onClick={() => setInspectedBookId(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-black/40 border border-[#D4AF37]/40 flex items-center justify-center text-[#F4E8C1] hover:bg-[#D4AF37] hover:text-[#12100E] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row gap-6">
              {/* Large Cover Preview */}
              <div
                className={`w-36 h-52 mx-auto sm:mx-0 rounded-2xl bg-gradient-to-br ${inspectedBook.coverGradient} border-2 border-[#D4AF37] p-4 flex flex-col justify-between shrink-0 shadow-2xl`}
              >
                <div className="flex justify-between text-xs text-[#D4AF37] font-cinzel">
                  <span>✦</span>
                  <span>{inspectedBook.rating} ★</span>
                </div>
                <div className="text-center my-auto">
                  <span className="text-5xl text-[#D4AF37]">
                    {inspectedBook.coverRune}
                  </span>
                </div>
                <div className="text-[11px] font-cinzel text-center text-[#F4E8C1] border-t border-[#D4AF37]/40 pt-1.5">
                  {inspectedBook.title}
                </div>
              </div>

              {/* Book Metadata */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                    {inspectedBook.categoryLabel}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      inspectedBook.availableStock > 0
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {inspectedBook.availableStock > 0
                      ? `Tersedia di Rak (${inspectedBook.availableStock}/${inspectedBook.totalStock})`
                      : 'Stok Fisik Habis • Versi Digital Siap'}
                  </span>
                </div>

                <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#F4E8C1]">
                  {inspectedBook.title}
                </h2>
                <p className="text-sm italic text-[#D4AF37]">
                  &ldquo;{inspectedBook.subtitle}&rdquo; — Karya {inspectedBook.author}
                </p>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/10">
                    <span className="text-[#A89F91] block">Lokasi Rak:</span>
                    <span className="font-semibold text-[#F4E8C1] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>{inspectedBook.shelf}</span>
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/10">
                    <span className="text-[#A89F91] block">Ketebalan &amp; XP:</span>
                    <span className="font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                      <Award className="w-3.5 h-3.5" />
                      <span>{inspectedBook.pages} Halaman • +{inspectedBook.xpReward} XP</span>
                    </span>
                  </div>
                </div>

                {/* Ingredient Affinity */}
                <div className="pt-1">
                  <span className="text-[11px] uppercase tracking-wider text-[#A89F91] block mb-1.5">
                    Unsur Esensi Alkimia:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(inspectedBook.ingredients || []).map((ingId) => {
                      const ing = INGREDIENTS.find((i) => i.id === ingId);
                      if (!ing) return null;
                      return (
                        <span
                          key={ingId}
                          className="text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1"
                          style={{
                            backgroundColor: ing.bgGlow,
                            borderColor: ing.color,
                            color: '#F4E8C1'
                          }}
                        >
                          <span>{ing.symbol}</span>
                          <span>{ing.name} ({ing.indoName})</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Synopsis */}
            <div className="mt-6 p-4 rounded-xl bg-[#12100E] border border-[#D4AF37]/30 space-y-1.5">
              <h4 className="font-cinzel text-xs uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Isi Perkamen (Sinopsis Grimoire)</span>
              </h4>
              <p className="text-xs sm:text-sm text-[#F4E8C1]/90 leading-relaxed">
                {inspectedBook.synopsis}
              </p>
            </div>

            {/* Scholar's Notes */}
            <div className="mt-6 space-y-3">
              <h4 className="font-cinzel text-sm font-bold text-[#F4E8C1] flex items-center gap-2">
                <MessageSquareQuote className="w-4 h-4 text-[#D4AF37]" />
                <span>
                  Scholar&apos;s Notes (Catatan Pembaca • {(inspectedBook.reviews || []).length})
                </span>
              </h4>

              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {(inspectedBook.reviews || []).map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 rounded-xl bg-black/30 border border-white/10 space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#D4AF37]">{rev.user}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400">{'★'.repeat(rev.rating)}</span>
                        <span className="text-[10px] text-[#A89F91]">{rev.date}</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#F4E8C1]/90">{rev.comment}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-[#D4AF37]/25 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-[#A89F91] flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>ISBN: {inspectedBook.isbn}</span>
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {/* E-Grimoire Reader Button inside modal */}
                <button
                  type="button"
                  onClick={() => {
                    setReadingBook(inspectedBook);
                    setInspectedBookId(null);
                  }}
                  className="px-4 py-2.5 rounded-xl font-cinzel font-semibold text-xs bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all flex items-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Buka E-Grimoire Reader</span>
                </button>

                {currentUser.role === 'admin' ? (
                  <button
                    onClick={() => {
                      setActiveTab('archivist');
                      setInspectedBookId(null);
                    }}
                    className="px-4 py-2.5 rounded-xl font-cinzel font-bold text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                  >
                    Kelola di Archivist
                  </button>
                ) : currentUser.role === 'guru' ? (
                  <>
                    <button
                      onClick={() => {
                        setPackageLoanForm((prev) => ({
                          ...prev,
                          bookId: inspectedBook.id
                        }));
                        setActiveTab('mentor');
                        setInspectedBookId(null);
                      }}
                      className="px-4 py-2.5 rounded-xl font-cinzel font-bold text-xs bg-[#D4AF37] text-[#12100E] hover:bg-amber-400 shadow-lg"
                    >
                      Pinjam Paket Kelas (1 Hari)
                    </button>
                    <button
                      onClick={() => {
                        setTeacherLoanForm((prev) => ({ ...prev, bookId: inspectedBook.id }));
                        setActiveTab('mentor');
                        setInspectedBookId(null);
                      }}
                      className="px-4 py-2.5 rounded-xl font-cinzel font-bold text-xs bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30"
                    >
                      Pinjam Reguler Kelas
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenReadingLog(inspectedBook)}
                      className="px-4 py-2.5 rounded-xl font-cinzel font-bold text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all"
                    >
                      {studentReadingLogs.some((log) => log.bookId === inspectedBook.id)
                        ? 'Edit Jurnal Literasi'
                        : 'Tulis Jurnal Literasi'}
                    </button>
                    <button
                      onClick={() => {
                        handleRequestStudentLoan(inspectedBook);
                        setInspectedBookId(null);
                      }}
                      disabled={inspectedBook.availableStock <= 0}
                      className={`px-5 py-2.5 rounded-xl font-cinzel font-bold text-xs transition-all ${
                        inspectedBook.availableStock > 0
                          ? 'bg-[#D4AF37] text-[#12100E] hover:bg-amber-400 shadow-lg'
                          : 'bg-white/10 text-[#A89F91] cursor-not-allowed'
                      }`}
                    >
                      {inspectedBook.availableStock > 0
                        ? 'Ajukan Pinjam Fisik'
                        : 'Stok Fisik Habis'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: RETURN BOOK & WRITE SCHOLAR'S NOTE
      ========================================== */}
      {returningLoan && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitReturnAndReview}
            className="max-w-lg w-full rounded-2xl border p-6 sm:p-8 space-y-5 relative"
            style={{
              backgroundColor: '#1E1916',
              borderColor: '#10B981'
            }}
          >
            <button
              type="button"
              onClick={() => setReturningLoan(null)}
              className="absolute top-5 right-5 text-[#A89F91] hover:text-[#F4E8C1]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Scroll className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-cinzel uppercase tracking-wider text-emerald-400">
                  RETURN RITUAL • +100 SCHOLAR XP
                </span>
                <h3 className="font-cinzel text-xl font-bold text-[#F4E8C1]">
                  Tulis Scholar&apos;s Note
                </h3>
              </div>
            </div>

            <p className="text-xs text-[#A89F91] leading-relaxed">
              Kamu akan mengembalikan grimoire{' '}
              <strong className="text-[#F4E8C1]">
                &ldquo;{returningLoan.book.title}&rdquo;
              </strong>
              . Bagikan intisari ilmu yang kamu peroleh untuk membimbing pembaca berikutnya!
            </p>

            {/* Star Rating */}
            <div>
              <label className="block text-xs font-cinzel text-[#D4AF37] mb-2">
                RATING GRIMOIRE:
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    type="button"
                    key={num}
                    onClick={() => setReviewRating(num)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all ${
                      reviewRating >= num
                        ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                        : 'bg-black/30 border-white/10 text-[#A89F91]'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${reviewRating >= num ? 'fill-[#D4AF37]' : ''}`} />
                    <span>{num}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Review Note */}
            <div>
              <label className="block text-xs font-cinzel text-[#D4AF37] mb-2">
                CATATAN PUSTAKA (ULASAN SINGKAT):
              </label>
              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Contoh: Sangat mencerahkan! Penjelasan konsepnya mendalam dan analoginya sangat memikat..."
                className="w-full p-3 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/40 text-[#F4E8C1] placeholder-[#A89F91]/60 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReturningLoan(null)}
                className="px-4 py-2 rounded-xl text-xs text-[#A89F91] hover:text-[#F4E8C1]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl font-cinzel font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-[#12100E] transition-colors flex items-center gap-1.5 shadow-lg"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Kembalikan Buku &amp; Klaim +100 XP</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================
          MODAL 3: REJECTION REASON MODAL (ADMIN)
      ========================================== */}
      <RejectionReasonModal
        loan={rejectingLoan}
        isOpen={Boolean(rejectingLoan)}
        onClose={() => setRejectingLoan(null)}
        reason={rejectionReason}
        onReasonChange={setRejectionReason}
        onConfirm={handleConfirmRejectLoan}
      />

      {/* ==========================================
          MODAL 4: GUILD GATEKEEPER AUTH MODAL
      ========================================== */}
      <GatekeeperAuthModal
        isOpen={isGatekeeperOpen}
        onClose={() => setIsGatekeeperOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleSwitchRole}
        showToast={showToast}
      />

      {/* ==========================================
          MODAL 5: E-GRIMOIRE READER MODAL (DIGITAL READING)
      ========================================== */}
      <EGrimoireReaderModal
        book={readingBook}
        isOpen={Boolean(readingBook)}
        onClose={() => setReadingBook(null)}
        onFinishReading={handleFinishDigitalReading}
        currentUser={currentUser}
      />

      {/* ==========================================
          MODAL 6: FULLSCREEN PDF E-BOOK VIEWER
      ========================================== */}
      <FullScreenPdfViewerModal
        book={pdfViewerBook}
        isOpen={Boolean(pdfViewerBook)}
        onClose={() => setPdfViewerBook(null)}
      />

      {/* ==========================================
          FOOTER
      ========================================== */}
      <footer
        className="mt-16 border-t py-6 text-center text-xs text-[#A89F91]"
        style={{
          backgroundColor: '#0E0C0A',
          borderColor: 'rgba(212, 175, 55, 0.2)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-cinzel text-[#D4AF37]">
            ✦ The Grand Alchemist&apos;s Archive • Pustaka Agung Alkemis ✦
          </p>
          <p>
            Platform Perpustakaan Sekolah Tema Alkimia &amp; Fantasi Abad Pertengahan • Sistem 3 Role
          </p>
        </div>
      </footer>
    </div>
  );
}
