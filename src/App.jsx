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
import { api } from './lib/apiClient';
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
import { getDigitalTomeContent } from './data/digitalTomesContent';
import {
  enrichBook,
  JENJANG_OPTIONS,
  KELAS_BY_JENJANG,
  SMK_JURUSAN_OPTIONS,
  JENIS_BUKU_OPTIONS,
  matchesCurriculumFilter
} from './utils/libraryUtils';
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

function getIdentityKeys(user) {
  if (!user) return [];
  return [
    user.id,
    user.profileId,
    user.studentId,
    user.guildId,
    user.cardCode,
    user.nisn,
    user.username,
    user.name
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
}

function isLoanOwnedByUser(loan, user) {
  const keys = getIdentityKeys(user);
  if (keys.length === 0 || !loan) return false;
  return [
    loan.profileId,
    loan.borrowerCard,
    loan.borrowerNisn,
    loan.borrowerName,
    loan.requesterName,
    loan.requesterUsername
  ]
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

  // 3-Role Authentication State (Admin, Guru, Siswa) via PostgreSQL HTTP-Only Cookie
  const [currentUser, setCurrentUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isGatekeeperOpen, setIsGatekeeperOpen] = useState(false);
  const [readingBook, setReadingBook] = useState(null);

  // PostgreSQL + Prisma Live State
  const [books, setBooks] = useState([]);
  const [catalogBooks, setCatalogBooks] = useState([]);
  const [studentXp, setStudentXp] = useState(0);
  const [potionsBrewedCount, setPotionsBrewedCount] = useState(128);
  const [booksReadCount, setBooksReadCount] = useState(0);
  const [quests, setQuests] = useState(INITIAL_QUESTS);
  const [badges, setBadges] = useState(INITIAL_BADGES);
  const [members, setMembers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [readingLogs, setReadingLogs] = useState([]);
  const [serverLeaderboard, setServerLeaderboard] = useState([]);
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
    className: 'SMK Kelas 10 TKJ 1',
    notes: ''
  });

  // Guru One-Day Class Package Form State (Paket Keranjang Kelas)
  const [packageLoanForm, setPackageLoanForm] = useState({
    bookId: '',
    quantity: 30,
    className: 'SMK Kelas 10 TKJ 1',
    lessonHours: 'Jam ke 3-4',
    notes: ''
  });

  // Catalog search & Multi-level Curriculum Filters (SMP, SMA, SMK 3 Jurusan, Umum)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedJenjang, setSelectedJenjang] = useState('All'); // 'All' | 'SMP' | 'SMA' | 'SMK' | 'Umum'
  const [selectedKelas, setSelectedKelas] = useState('All'); // 'All' | '7' | '8' | '9' | '10' | '11' | '12' | 'Semua'
  const [selectedJurusan, setSelectedJurusan] = useState('All'); // 'All' | 'TKJ' | 'BM' | 'TKR/TR' | 'Semua Jurusan'
  const [selectedJenisBuku, setSelectedJenisBuku] = useState('All'); // 'All' | 'Buku Paket Wajib' | 'Modul Praktik' | 'Fiksi / Novel' | 'Referensi'
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
    jenjang: 'SMK',
    kelas: '10',
    jurusan: 'TKJ',
    jenisBuku: 'Buku Paket Wajib',
    category: 'Artificers Craft',
    shelf: 'Rak SMK Kelas 10 • TKJ',
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
    totalStock: 10,
    availableStock: 10,
    digitalContentText: '',
    synopsis: '',
    ingredients: ['spark', 'craft']
  });

  const [isDatabaseConnected, setIsDatabaseConnected] = useState(false);
  const [isSyncingDatabase, setIsSyncingDatabase] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (title, message, type = 'gold') => {
    setToast({ title, message, type, id: Date.now() });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

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
  const currentUserClassName = normalizeClassName(currentUser?.class || '');

  const studentReadingLogs = useMemo(
    () => readingLogs.filter((log) => isReadingLogOwnedByUser(log, currentUser)),
    [readingLogs, currentUser]
  );

  const classLeaderboard = useMemo(() => {
    if (Array.isArray(serverLeaderboard) && serverLeaderboard.length > 0) {
      return serverLeaderboard;
    }
    return buildClassLeaderboard({
      loans,
      readingLogs,
      monthKey: currentMonthKey
    });
  }, [serverLeaderboard, loans, readingLogs, currentMonthKey]);

  // Dynamic Navigation Tabs according to Role
  const navTabs = useMemo(() => {
    const tabs = [
      { id: 'hall', label: 'The Great Hall', sub: 'Beranda', icon: Sparkles },
      { id: 'mixer', label: 'Alchemical Mixer', sub: 'Racik Buku', icon: FlaskConical, highlight: true },
      { id: 'vault', label: 'Vault of Tomes', sub: 'Katalog', icon: BookOpen }
    ];

    if (currentUser?.role === 'siswa') {
      tabs.push({
        id: 'sanctum',
        label: "Scholar's Sanctum",
        sub: 'Profil & Mana',
        icon: Shield,
        badgeCount: studentActiveLoans.length
      });
    } else if (currentUser?.role === 'guru') {
      tabs.push({
        id: 'mentor',
        label: "Mentor's Sanctum",
        sub: 'Pinjaman Kelas',
        icon: GraduationCap,
        badgeCount: teacherLoans.filter((l) => l.status === 'pending' || l.status === 'approved').length,
        isGuru: true
      });
    } else if (currentUser?.role === 'admin') {
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

  // Load PostgreSQL data via Prisma REST API
  const syncDatabaseData = async (activeUser = currentUser, showSuccessToast = false) => {
    setIsSyncingDatabase(true);
    try {
      const [booksRes, leaderboardRes] = await Promise.all([
        api.getBooks(),
        api.getLeaderboard()
      ]);
      const loadedBooks = booksRes?.books || [];
      setBooks(loadedBooks);
      setCatalogBooks(loadedBooks);
      setServerLeaderboard(leaderboardRes?.leaderboard || []);
      setIsDatabaseConnected(true);

      if (activeUser) {
        const requests = [api.getLoans(), api.getReadingLogs()];
        const canFetchUsers = activeUser.role === 'admin' || activeUser.role === 'guru';
        if (canFetchUsers) {
          requests.push(api.getUsers());
        }
        const [loansRes, logsRes, usersRes] = await Promise.all(requests);
        setLoans(loansRes?.loans || []);
        setReadingLogs(logsRes?.readingLogs || []);
        if (canFetchUsers && usersRes?.users) {
          setMembers(usersRes.users);
        }
        setStudentXp(Number(activeUser.xp || 0));
      } else {
        setLoans([]);
        setReadingLogs([]);
        setMembers([]);
      }

      if (showSuccessToast) {
        showToast(
          'Database PostgreSQL Tersinkron',
          `${loadedBooks.length} buku & data sirkulasi terbaru telah dimuat dari Neon PostgreSQL.`,
          'emerald'
        );
      }
    } catch (err) {
      console.error('Sync database error:', err);
      setIsDatabaseConnected(false);
      if (showSuccessToast) {
        showToast(
          'Gagal Terhubung ke Server Database',
          err?.message || 'Periksa server backend & koneksi DATABASE_URL PostgreSQL.',
          'purple'
        );
      }
    } finally {
      setIsSyncingDatabase(false);
    }
  };

  // Check HTTP-only cookie session on initial load
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const meRes = await api.getMe();
        const loggedUser = meRes?.user || null;
        if (!active) return;
        setCurrentUser(loggedUser);
        if (loggedUser) {
          setStudentXp(Number(loggedUser.xp || 0));
        }
        await syncDatabaseData(loggedUser, false);
      } catch (err) {
        console.error('Auth init error:', err);
        if (active) {
          await syncDatabaseData(null, false);
        }
      } finally {
        if (active) setIsCheckingAuth(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Re-query /api/books when catalog curriculum/search filters change (Prisma query)
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await api.getBooks({
          jenjang: selectedJenjang,
          kelas: selectedKelas,
          jurusan: selectedJurusan,
          jenis_buku: selectedJenisBuku,
          category: selectedCategory,
          search: searchQuery
        });
        if (!cancelled && Array.isArray(res?.books)) {
          setCatalogBooks(res.books);
        }
      } catch {
        if (!cancelled) {
          setCatalogBooks(books);
        }
      }
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    selectedJenjang,
    selectedKelas,
    selectedJurusan,
    selectedJenisBuku,
    selectedCategory,
    searchQuery,
    books
  ]);

  // Role Switcher & Login Handler
  const handleSwitchRole = async (targetUser) => {
    if (!targetUser) return;
    let authenticatedUser = targetUser;

    // Jika berasal dari tombol Quick Login (memiliki password preset), autentikasi resmi ke POST /api/auth/login
    if (targetUser.password && !targetUser.dbRole) {
      try {
        const res = await api.login({
          username: targetUser.username,
          password: targetUser.password
        });
        authenticatedUser = res.user;
      } catch (err) {
        showToast(
          'Gagal Berpindah Akun',
          err?.message || 'Silakan masuk secara manual melalui Gerbang Autentikasi.',
          'purple'
        );
        setIsGatekeeperOpen(true);
        return;
      }
    }

    setCurrentUser(authenticatedUser);
    setStudentXp(Number(authenticatedUser.xp || 0));

    if (authenticatedUser.role === 'admin') {
      if (activeTab === 'sanctum' || activeTab === 'mentor') {
        setActiveTab('archivist');
      }
    } else if (authenticatedUser.role === 'guru') {
      if (activeTab === 'sanctum' || activeTab === 'archivist') {
        setActiveTab('mentor');
      }
    } else if (authenticatedUser.role === 'siswa') {
      if (activeTab === 'archivist' || activeTab === 'mentor') {
        setActiveTab('sanctum');
      }
    }

    await syncDatabaseData(authenticatedUser, false);

    showToast(
      `Sesi Aktif: ${authenticatedUser.name}`,
      `Masuk ke PostgreSQL sebagai ${authenticatedUser.title} (@${authenticatedUser.username}).`,
      authenticatedUser.role === 'admin'
        ? 'gold'
        : authenticatedUser.role === 'guru'
          ? 'purple'
          : 'emerald'
    );
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Abaikan error network logout
    }
    setCurrentUser(null);
    setStudentXp(0);
    setLoans([]);
    setReadingLogs([]);
    setMembers([]);
    if (activeTab === 'sanctum' || activeTab === 'mentor' || activeTab === 'archivist') {
      setActiveTab('hall');
    }
    await syncDatabaseData(null, false);
    showToast('Sesi Berakhir', 'Anda telah keluar. Cookie sesi telah dihapus.', 'gold');
  };

  // ==========================================
  // HANDLER: APPROVE LOAN (ADMIN ACTION -> POSTGRESQL)
  // ==========================================
  const handleApproveLoan = async (loan) => {
    try {
      const res = await api.approveLoan(loan.id);
      if (res.book) {
        setBooks((prev) => prev.map((b) => (b.id === res.book.id ? res.book : b)));
      }
      if (res.loan) {
        setLoans((prev) => prev.map((l) => (l.id === res.loan.id ? res.loan : l)));
      }
      try {
        const lbRes = await api.getLeaderboard();
        setServerLeaderboard(lbRes?.leaderboard || []);
      } catch {}

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
        `Permintaan ${loan.requesterName} untuk "${res.book?.title || loan.bookTitle}" (${loan.quantity || 1} eks.) disetujui. Sisa rak: ${res.book?.availableStock ?? '-'}.`,
        'emerald'
      );
    } catch (err) {
      showToast('Gagal Menyetujui Pinjaman', err?.message || 'Stok atau data tidak valid.', 'purple');
    }
  };

  // ==========================================
  // HANDLER: REJECT LOAN (ADMIN ACTION -> POSTGRESQL)
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

    try {
      const res = await api.rejectLoan(rejectingLoan.id, reason);
      if (res.loan) {
        setLoans((prev) => prev.map((l) => (l.id === res.loan.id ? res.loan : l)));
      }
      showToast(
        'Permintaan Peminjaman Ditolak',
        `Permintaan peminjaman oleh ${rejectingLoan.requesterName} telah ditolak dan tercatat di PostgreSQL.`,
        'purple'
      );
      setRejectingLoan(null);
      setRejectionReason('');
    } catch (err) {
      showToast('Gagal Menolak Pinjaman', err?.message || 'Coba lagi beberapa saat.', 'purple');
    }
  };

  // ==========================================
  // HANDLER: VERIFY RETURN (ADMIN ACTION -> POSTGRESQL)
  // ==========================================
  const handleVerifyReturnLoan = async (loan) => {
    try {
      const res = await api.returnLoan(loan.id);
      if (res.loan) {
        setLoans((prev) => prev.map((l) => (l.id === res.loan.id ? res.loan : l)));
      }
      if (res.book) {
        setBooks((prev) => prev.map((b) => (b.id === res.book.id ? res.book : b)));
      }
      try {
        const lbRes = await api.getLeaderboard();
        setServerLeaderboard(lbRes?.leaderboard || []);
      } catch {}

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
        `Grimoire "${res.book?.title || loan.bookTitle}" (${loan.quantity || 1} eks.) telah dikembalikan ke rak & stok dipulihkan.`,
        'emerald'
      );
    } catch (err) {
      showToast('Gagal Verifikasi Pengembalian', err?.message || 'Coba ulangi.', 'purple');
    }
  };

  // ==========================================
  // HANDLER: INVENTORY STOCK MANAGER (+ / - -> POSTGRESQL)
  // ==========================================
  const handleAdjustStock = async (bookId, stockType, delta) => {
    try {
      const res = await api.adjustBookStock(bookId, delta, stockType);
      if (res.book) {
        setBooks((prev) => prev.map((b) => (b.id === res.book.id ? res.book : b)));
      }
    } catch (err) {
      showToast('Gagal Memperbarui Stok', err?.message || 'Pastikan Anda masuk sebagai Admin.', 'purple');
    }
  };

  // ==========================================
  // HANDLER: QUICK LOAN VIA BARCODE SCANNER (POSTGRESQL)
  // ==========================================
  const handleSubmitQuickLoan = async ({
    member,
    book,
    quantity,
    durationDays,
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
      const maxDays = getLoanDurationDays(member.role, durationDays);
      const res = await api.quickScanLoan({
        memberId: member.id,
        memberCode: member.nisn || member.cardCode || member.username,
        bookId: freshBook.id,
        bookCode: freshBook.kodeBuku,
        quantity: qty,
        durasi_hari: maxDays,
        notes:
          notes ||
          `Peminjaman kilat berbasis NISN (${member.nisn || member.cardCode}) oleh pustakawan untuk ${member.name}.`
      });

      if (res.book) {
        setBooks((prev) => prev.map((b) => (b.id === res.book.id ? res.book : b)));
      }
      if (res.loan) {
        setLoans((prev) => [res.loan, ...prev]);
      }
      try {
        const lbRes = await api.getLeaderboard();
        setServerLeaderboard(lbRes?.leaderboard || []);
      } catch {}

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
        `"${res.book?.title || freshBook.title}" (${qty} eks.) dipinjamkan kepada ${member.name}. Sisa rak: ${res.book?.availableStock ?? '-'}.`,
        'emerald'
      );

      return { ok: true, loan: res.loan };
    } catch (err) {
      return {
        ok: false,
        message: err?.message || 'Gagal mencatat peminjaman kilat ke PostgreSQL.'
      };
    } finally {
      setIsSubmittingQuickLoan(false);
    }
  };

  // ==========================================
  // HANDLER: BULK IMPORT FROM EXCEL (POSTGRESQL APPEND)
  // ==========================================
  const handleImportBulkBooks = async (importedRows = []) => {
    if (!Array.isArray(importedRows) || importedRows.length === 0) return;

    setIsImportingBooks(true);

    try {
      const normalizedRows = importedRows.map((row, index) =>
        enrichBook(
          {
            ...row,
            id: row.id || row.kodeBuku || `book-import-${Date.now()}-${index}`
          },
          books.length + index
        )
      );

      const res = await api.bulkImportBooks(normalizedRows);
      if (Array.isArray(res?.books)) {
        setBooks(res.books);
        setCatalogBooks(res.books);
      }

      showToast(
        'Import Excel Berhasil Disimpan ke PostgreSQL!',
        `${res?.insertedCount || 0} judul baru ditambahkan dan ${res?.updatedCount || 0} judul diperbarui (stok di-append).`,
        'emerald'
      );
    } catch (err) {
      showToast(
        'Import Excel Gagal',
        err?.message || 'Pastikan format Excel sesuai & Anda login sebagai Admin.',
        'purple'
      );
    } finally {
      setIsImportingBooks(false);
    }
  };

  // ==========================================
  // HANDLER: REGISTER & BULK IMPORT MEMBERS (NISN & USERNAME)
  // ==========================================
  const handleRegisterMember = async (newMember) => {
    if (!newMember) return;
    try {
      let savedUser = newMember;
      // Jika dipanggil oleh Admin dari form Anggota (belum ber-dbRole), simpan via POST /api/users
      if (!newMember.dbRole) {
        const res = await api.createUser({
          username: newMember.username,
          password: newMember.password || 'password123',
          nama: newMember.name,
          nisn: newMember.nisn,
          role: (newMember.role || 'siswa').toUpperCase(),
          jenjang: newMember.jenjang || 'SMK',
          kelas: newMember.kelas || '10',
          jurusan: newMember.jurusan || 'Semua Jurusan',
          className: newMember.className,
          cardCode: newMember.cardCode,
          phone: newMember.phone
        });
        savedUser = res.user;
      }

      setMembers((prev) => {
        const existingIdx = prev.findIndex(
          (m) =>
            m.id === savedUser.id ||
            (savedUser.nisn && m.nisn === savedUser.nisn) ||
            (savedUser.username &&
              m.username &&
              m.username.toLowerCase() === savedUser.username.toLowerCase())
        );
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = { ...next[existingIdx], ...savedUser };
          return next;
        }
        return [savedUser, ...prev];
      });

      if (!newMember.dbRole) {
        showToast(
          'Anggota Disimpan ke PostgreSQL',
          `${savedUser.name} (@${savedUser.username}) siap masuk dan meminjam buku.`,
          'emerald'
        );
      }
    } catch (err) {
      showToast(
        'Gagal Menyimpan Anggota',
        err?.message || 'Periksa keunikan NISN dan username.',
        'purple'
      );
    }
  };

  const handleImportBulkMembers = async (importedStudents = []) => {
    if (!Array.isArray(importedStudents) || importedStudents.length === 0) return;

    try {
      const res = await api.bulkImportUsers(
        importedStudents.map((s) => ({
          username: s.username,
          password: s.password || 'password123',
          nama: s.name,
          nisn: s.nisn,
          jenjang: s.jenjang || 'SMK',
          kelas: s.kelas || '10',
          jurusan: s.jurusan || 'Semua Jurusan',
          className: s.className,
          cardCode: s.cardCode,
          phone: s.phone
        }))
      );
      if (Array.isArray(res?.users)) {
        setMembers(res.users);
      }

      showToast(
        'Import Data Siswa (NISN) Berhasil!',
        `${res?.insertedCount || 0} siswa baru & ${res?.updatedCount || 0} diperbarui ke PostgreSQL (NISN nol depan terjaga).`,
        'emerald'
      );
    } catch (err) {
      showToast(
        'Gagal Import Data Siswa',
        err?.message || 'Pastikan kolom Excel NISN & Nama terisi benar.',
        'purple'
      );
    }
  };

  // ==========================================
  // HANDLER: REQUEST PHYSICAL LOAN (SISWA ACTION -> POSTGRESQL)
  // ==========================================
  const handleRequestStudentLoan = async (book) => {
    if (!currentUser) {
      showToast(
        'Masuk Terlebih Dahulu',
        'Silakan masuk dengan Username & Password Anda untuk mengajukan peminjaman.',
        'purple'
      );
      setIsGatekeeperOpen(true);
      return;
    }

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

    try {
      const res = await api.createLoan({
        bookId: book.id,
        quantity: 1,
        durasi_hari: 7,
        loan_type: 'STUDENT_PHYSICAL',
        autoApprove: false,
        notes: 'Pengajuan peminjaman 1 eksemplar fisik buku oleh siswa.'
      });

      if (res.loan) {
        setLoans((prev) => [res.loan, ...prev]);
      }

      try {
        const xpRes = await api.addXp(15);
        if (xpRes?.user) {
          setStudentXp(xpRes.user.xp);
          setCurrentUser(xpRes.user);
        }
      } catch {}

      try {
        const lbRes = await api.getLeaderboard();
        setServerLeaderboard(lbRes?.leaderboard || []);
      } catch {}

      showToast(
        'Permintaan Pinjam Terkirim! (+15 XP)',
        `Pengajuan "${book.title}" telah tersimpan di PostgreSQL dan masuk Antrean Persetujuan Archivist.`,
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
    } catch (err) {
      showToast(
        'Pengajuan Pinjam Gagal',
        err?.message || 'Tidak dapat memproses peminjaman.',
        'purple'
      );
    }
  };

  // ==========================================
  // HANDLER: TEACHER CLASS LOAN REQUEST (POSTGRESQL)
  // ==========================================
  const handleSubmitTeacherLoan = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setIsGatekeeperOpen(true);
      return;
    }
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

    const maxDays = getLoanDurationDays('guru', teacherLoanForm.durationDays);

    try {
      const res = await api.createLoan({
        bookId: targetBook.id,
        quantity: qty,
        durasi_hari: maxDays,
        kelas_sasaran: teacherLoanForm.className || 'SMK Kelas 10 TKJ 1',
        loan_type: 'TEACHER_SELF',
        autoApprove: false,
        notes:
          teacherLoanForm.notes.trim() ||
          `Peminjaman ${qty} eksemplar untuk pembelajaran di ${teacherLoanForm.className}.`
      });

      if (res.loan) {
        setLoans((prev) => [res.loan, ...prev]);
      }

      setTeacherLoanForm({
        bookId: '',
        quantity: 1,
        durationDays: 14,
        className: 'SMK Kelas 10 TKJ 1',
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
        `Pengajuan ${qty} eksemplar "${targetBook.title}" untuk ${res.loan?.className || teacherLoanForm.className} tersimpan ke PostgreSQL.`,
        'emerald'
      );
    } catch (err) {
      showToast('Gagal Mengajukan Pinjaman Kelas', err?.message || 'Coba lagi.', 'purple');
    }
  };

  // ==========================================
  // HANDLER: OPEN & SUBMIT GLS READING LOG (POSTGRESQL)
  // ==========================================
  const handleOpenReadingLog = (book) => {
    if (!currentUser) {
      showToast('Masuk Terlebih Dahulu', 'Login untuk menulis Jurnal Literasi GLS.', 'purple');
      setIsGatekeeperOpen(true);
      return;
    }
    if (!book || currentUser.role !== 'siswa') return;
    setJournalBook(book);
    setInspectedBookId(null);
  };

  const handleSubmitReadingLog = async (payload) => {
    if (!journalBook || currentUser?.role !== 'siswa') return;

    const existingLog = readingLogs.find(
      (log) =>
        log.bookId === journalBook.id && isReadingLogOwnedByUser(log, currentUser)
    );

    try {
      const res = await api.createReadingLog({
        logId: existingLog?.id || null,
        bookId: journalBook.id,
        halaman_terakhir: payload.lastPageRead,
        kutipan_favorit: payload.favoriteQuote,
        ringkasan_hikmah: payload.summary
      });

      if (res.readingLog) {
        setReadingLogs((prev) =>
          existingLog
            ? prev.map((item) => (item.id === existingLog.id ? res.readingLog : item))
            : [res.readingLog, ...prev]
        );
      }
      setJournalBook(null);

      try {
        const lbRes = await api.getLeaderboard();
        setServerLeaderboard(lbRes?.leaderboard || []);
      } catch {}

      showToast(
        existingLog ? 'Jurnal Literasi Diperbarui!' : 'Jurnal Literasi Tersimpan!',
        `Jurnal "${journalBook.title}" (${payload.wordCount} kata) disimpan ke PostgreSQL dan masuk ke Dashboard Guru.`,
        'emerald'
      );
    } catch (err) {
      showToast('Gagal Menyimpan Jurnal', err?.message || 'Periksa kembali isi jurnal Anda.', 'purple');
    }
  };

  // ==========================================
  // HANDLER: GRADE GLS READING LOG (TEACHER -> POSTGRESQL)
  // ==========================================
  const handleGradeReadingLog = async (log, { score, feedback }) => {
    if (!log) return;
    if (currentUser?.role !== 'guru' && currentUser?.role !== 'admin') return;

    try {
      const res = await api.gradeReadingLog(log.id, {
        score,
        feedback: feedback || '',
        status: 'graded'
      });

      if (res.readingLog) {
        setReadingLogs((prev) =>
          prev.map((item) => (item.id === log.id ? res.readingLog : item))
        );
      }

      showToast(
        'Jurnal Sudah Dinilai',
        `Skor ${score}/100 untuk ${log.studentName} telah disimpan ke PostgreSQL beserta umpan balik.`,
        'gold'
      );
    } catch (err) {
      showToast('Gagal Menyimpan Nilai', err?.message || 'Pastikan login sebagai Guru/Admin.', 'purple');
    }
  };

  // ==========================================
  // HANDLER: TEACHER ONE-DAY CLASS PACKAGE LOAN (POSTGRESQL)
  // ==========================================
  const handleSubmitPackageLoan = async (event) => {
    event.preventDefault();
    if (!currentUser) {
      setIsGatekeeperOpen(true);
      return;
    }
    if (currentUser.role !== 'guru' && currentUser.role !== 'admin') return;

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

    const className = normalizeClassName(packageLoanForm.className) || packageLoanForm.className.trim();
    const lessonHours = packageLoanForm.lessonHours.trim();

    try {
      const res = await api.createLoan({
        bookId: targetBook.id,
        quantity: qty,
        durasi_hari: 1,
        kelas_sasaran: className,
        jam_pelajaran: lessonHours,
        loan_type: 'CLASS_PACKAGE',
        autoApprove: true,
        notes:
          packageLoanForm.notes.trim() ||
          `Paket kelas ${qty} eksemplar untuk ${className} • ${lessonHours}.`
      });

      if (res.book) {
        setBooks((prev) => prev.map((b) => (b.id === res.book.id ? res.book : b)));
      }
      if (res.loan) {
        setLoans((prev) => [res.loan, ...prev]);
      }

      setPackageLoanForm((prev) => ({
        bookId: '',
        quantity: 30,
        className: prev.className || 'SMK Kelas 10 TKJ 1',
        lessonHours: 'Jam ke 3-4',
        notes: ''
      }));

      try {
        const lbRes = await api.getLeaderboard();
        setServerLeaderboard(lbRes?.leaderboard || []);
      } catch {}

      try {
        confetti({
          particleCount: 60,
          spread: 65,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#38BDF8', '#10B981']
        });
      } catch {}

      showToast(
        'Paket Kelas Aktif di PostgreSQL!',
        `${qty} eksemplar "${targetBook.title}" untuk ${className} • ${lessonHours}. Sisa stok: ${res.book?.availableStock ?? '-'}.`,
        'emerald'
      );
    } catch (err) {
      showToast('Gagal Mengaktifkan Paket Kelas', err?.message || 'Coba ulangi.', 'purple');
    }
  };

  const handleCompletePackageLoan = async (loan) => {
    if (!loan || !loan.isPackage) return;
    if (currentUser?.role !== 'guru' && currentUser?.role !== 'admin') return;

    try {
      const res = await api.returnLoan(loan.id);
      if (res.book) {
        setBooks((prev) => prev.map((b) => (b.id === res.book.id ? res.book : b)));
      }
      if (res.loan) {
        setLoans((prev) => prev.map((l) => (l.id === res.loan.id ? res.loan : l)));
      }
      try {
        const lbRes = await api.getLeaderboard();
        setServerLeaderboard(lbRes?.leaderboard || []);
      } catch {}

      showToast(
        'Paket Kelas Selesai',
        `${loan.quantity || 1} eksemplar "${loan.bookTitle}" untuk ${loan.className} telah dikembalikan & stok dipulihkan (${res.book?.availableStock ?? '-'}).`,
        'emerald'
      );
    } catch (err) {
      showToast('Gagal Menyelesaikan Paket Kelas', err?.message || 'Coba lagi.', 'purple');
    }
  };

  // ==========================================
  // HANDLER: COMPLETE DIGITAL READING REWARD (+75 XP)
  // ==========================================
  const handleFinishDigitalReading = async (book) => {
    const xpReward = 75;
    let updatedXp = studentXp + xpReward;
    const nextBooksRead = booksReadCount + 1;

    if (currentUser) {
      try {
        const res = await api.addXp(xpReward);
        if (res?.user) {
          updatedXp = res.user.xp;
          setCurrentUser(res.user);
        }
      } catch {}
    }

    setStudentXp(updatedXp);
    setBooksReadCount(nextBooksRead);

    showToast(
      `Astral Grimoire Selesai! (+${xpReward} XP)`,
      `Kamu telah menuntaskan pembacaan digital "${book.title}". Pemahaman arkanummu bertambah pesat!`,
      'gold'
    );
  };

  // ==========================================
  // HANDLER: RETURN BOOK & SUBMIT REVIEW (POSTGRESQL)
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
    const noteText =
      reviewComment.trim() ||
      'Grimoire yang sangat mencerahkan! Memberikan banyak wawasan baru bagi para pembaca.';

    try {
      const loanRes = await api.returnLoan(returningLoan.id);
      const revRes = await api.addReview({
        bookId: book.id,
        rating: reviewRating,
        comment: noteText
      });

      const finalBook = revRes?.book || loanRes?.book;
      if (finalBook) {
        setBooks((prev) => prev.map((b) => (b.id === finalBook.id ? finalBook : b)));
      }
      if (loanRes?.loan) {
        setLoans((prev) => prev.map((l) => (l.id === loanRes.loan.id ? loanRes.loan : l)));
      }

      const earnedXp = book.xpReward || 100;
      const updatedXp = studentXp + earnedXp;
      setStudentXp(updatedXp);
      setBooksReadCount((prev) => prev + 1);

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
        const lbRes = await api.getLeaderboard();
        setServerLeaderboard(lbRes?.leaderboard || []);
      } catch {}

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
        `Terima kasih telah mengembalikan "${book.title}" dan menyimpan ulasan di PostgreSQL.`,
        'gold'
      );
    } catch (err) {
      showToast('Gagal Memproses Pengembalian', err?.message || 'Coba lagi.', 'purple');
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

    let updatedXp = studentXp + quest.xpReward;
    if (currentUser) {
      try {
        const res = await api.addXp(quest.xpReward);
        if (res?.user) {
          updatedXp = res.user.xp;
          setCurrentUser(res.user);
        }
      } catch {}
    }
    setStudentXp(updatedXp);

    showToast(
      `Misi Selesai: ${quest.title}!`,
      `Kamu memperoleh +${quest.xpReward} XP dan segel kehormatan "${quest.badgeName}".`,
      'gold'
    );
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

    const customDigitalContent = newBookForm.digitalContentText.trim()
      ? [
          {
            chapterNumber: 1,
            title: 'Bab I: Inisiasi Manuskrip',
            content: newBookForm.digitalContentText.trim()
          }
        ]
      : getDigitalTomeContent({
          title: newBookForm.title,
          author: newBookForm.author,
          category: newBookForm.category
        });

    const totalQty = Number(newBookForm.totalStock) || 5;
    const availQty =
      newBookForm.availableStock !== '' && newBookForm.availableStock != null
        ? Number(newBookForm.availableStock)
        : totalQty;
    const jenjang = newBookForm.jenjang || 'SMK';
    const jurusan = jenjang === 'SMK' ? newBookForm.jurusan || 'TKJ' : 'Semua Jurusan';
    const kodeBuku =
      newBookForm.kodeBuku.trim().toUpperCase() ||
      `BK-${jenjang}-${Date.now().toString().slice(-5)}`;

    try {
      const res = await api.createBook({
        kode_buku: kodeBuku,
        judul: newBookForm.title.trim(),
        subtitle:
          newBookForm.subtitle.trim() ||
          `${newBookForm.jenisBuku || 'Buku Paket Wajib'} • ${jenjang} Kelas ${newBookForm.kelas || '10'} (${jurusan})`,
        penulis: newBookForm.author.trim(),
        penerbit: newBookForm.publisher.trim() || '-',
        tahun_terbit: Number(newBookForm.publicationYear) || 2024,
        jenjang,
        kelas: newBookForm.kelas || '10',
        jurusan,
        jenis_buku: newBookForm.jenisBuku || 'Buku Paket Wajib',
        category: newBookForm.category,
        stok_fisik: availQty,
        total_stok: totalQty,
        link_cover: newBookForm.coverUrl.trim() || null,
        link_pdf: newBookForm.pdfUrl.trim() || null,
        ddc: newBookForm.ddc.trim() || '000',
        callNumber: newBookForm.callNumber.trim() || null,
        shelf: newBookForm.shelf.trim() || 'Menara Arsip Sentral',
        isbn:
          newBookForm.isbn.trim() ||
          `978-602-${Math.floor(100 + Math.random() * 899)}-0`,
        pages: Number(newBookForm.pages) || 350,
        xpReward: Number(newBookForm.xpReward) || 120,
        synopsis:
          newBookForm.synopsis.trim() ||
          'Naskah grimoire baru yang baru saja diinskripsikan ke dalam lemari arsip agung.',
        digitalContent: customDigitalContent
      });

      if (res.book) {
        setBooks((prev) => [res.book, ...prev]);
        setCatalogBooks((prev) => [res.book, ...prev]);
      }

      setNewBookForm({
        title: '',
        subtitle: '',
        author: '',
        jenjang: 'SMK',
        kelas: '10',
        jurusan: 'TKJ',
        jenisBuku: 'Buku Paket Wajib',
        category: 'Artificers Craft',
        shelf: 'Rak SMK Kelas 10 • TKJ',
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
        totalStock: 10,
        availableStock: 10,
        digitalContentText: '',
        synopsis: '',
        ingredients: ['spark', 'craft']
      });

      showToast(
        'Buku Kurikulum Disimpan ke PostgreSQL!',
        `"${res.book?.title || newBookForm.title}" (${jenjang} Kelas ${newBookForm.kelas} • ${jurusan}) resmi terdaftar di database.`,
        'emerald'
      );
    } catch (err) {
      showToast(
        'Gagal Menambahkan Buku',
        err?.message || 'Periksa keunikan Kode Buku & hak akses Admin.',
        'purple'
      );
    }
  };

  // Filter books for Vault of Tomes (berbasis query Prisma + availability filter)
  const filteredBooks = useMemo(() => {
    const sourceList = catalogBooks.length > 0 ? catalogBooks : books;
    return sourceList.filter((book) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        book.title.toLowerCase().includes(q) ||
        (book.subtitle && book.subtitle.toLowerCase().includes(q)) ||
        book.author.toLowerCase().includes(q) ||
        (book.kodeBuku && book.kodeBuku.toLowerCase().includes(q)) ||
        (book.jenjang && book.jenjang.toLowerCase().includes(q)) ||
        (book.jurusan && book.jurusan.toLowerCase().includes(q)) ||
        (book.jenisBuku && book.jenisBuku.toLowerCase().includes(q)) ||
        (book.categoryLabel && book.categoryLabel.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === 'All' || book.category === selectedCategory;

      const matchesCurriculum = matchesCurriculumFilter(book, {
        jenjang: selectedJenjang,
        kelas: selectedKelas,
        jurusan: selectedJurusan,
        jenisBuku: selectedJenisBuku
      });

      let matchesAvailability = true;
      if (availabilityFilter === 'available') {
        matchesAvailability = book.availableStock > 0;
      } else if (availabilityFilter === 'out_of_stock') {
        matchesAvailability = book.availableStock === 0;
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesCurriculum &&
        matchesAvailability
      );
    });
  }, [
    catalogBooks,
    books,
    searchQuery,
    selectedCategory,
    selectedJenjang,
    selectedKelas,
    selectedJurusan,
    selectedJenisBuku,
    availabilityFilter
  ]);

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
        onLogout={handleLogout}
        isSwitching={isSyncingDatabase}
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

            {/* PostgreSQL + Prisma Status Badge */}
            <div className="order-2 lg:order-2 flex items-center">
              {isDatabaseConnected ? (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.35)]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>PostgreSQL + Prisma Connected</span>
                </span>
              ) : (
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-500/40 flex items-center gap-1.5"
                  title="Menghubungkan ke server PostgreSQL + Prisma"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>{isCheckingAuth ? 'Memuat Database...' : 'Koneksi DB Terputus'}</span>
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
              {currentUser ? (
                <button
                  onClick={() => {
                    if (currentUser?.role === 'admin') setActiveTab('archivist');
                    else if (currentUser?.role === 'guru') setActiveTab('mentor');
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
                      backgroundColor: `${currentUser.color || '#D4AF37'}20`,
                      borderColor: `${currentUser.color || '#D4AF37'}60`
                    }}
                  >
                    <span>{currentUser.avatar || '📚'}</span>
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-cinzel font-bold text-[#F4E8C1] truncate max-w-[120px]">
                        {(currentUser?.name || currentUser.username || 'Pengguna').split(' ')[0]}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase"
                        style={{
                          backgroundColor: `${currentUser.color || '#D4AF37'}25`,
                          color: currentUser.color || '#D4AF37'
                        }}
                      >
                        {currentUser.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#A89F91] truncate max-w-[140px]">
                      {currentUser.title || currentUser.classLabel}
                    </p>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => setIsGatekeeperOpen(true)}
                  className="px-3.5 py-2 rounded-xl border border-[#D4AF37]/60 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-xs font-cinzel font-bold text-[#F4E8C1] transition-all flex items-center gap-2"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Masuk Akun</span>
                </button>
              )}

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
        <div className="fixed bottom-5 right-5 z-[60] max-w-md animate-bounce">
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
                            {currentUser?.role === 'admin' ? (
                              <button
                                onClick={() => setActiveTab('archivist')}
                                className="px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                              >
                                Kelola Stok
                              </button>
                            ) : currentUser?.role === 'guru' ? (
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
                              if (currentUser?.role === 'admin') setActiveTab('archivist');
                              else if (currentUser?.role === 'guru') {
                                setTeacherLoanForm((prev) => ({ ...prev, bookId: book.id }));
                                setActiveTab('mentor');
                              } else {
                                handleRequestStudentLoan(book);
                              }
                            }}
                            disabled={currentUser?.role === 'siswa' && !isAvailable}
                            className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold transition-all ${
                              currentUser?.role === 'siswa' && !isAvailable
                                ? 'bg-white/5 text-[#A89F91] cursor-not-allowed'
                                : 'bg-[#D4AF37] text-[#12100E] hover:bg-amber-400'
                            }`}
                          >
                            {currentUser?.role === 'admin'
                              ? 'Kelola'
                              : currentUser?.role === 'guru'
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
            VIEW 3: VAULT OF TOMES (KATALOG BUKU KURIKULUM BERTINGKAT)
        ========================================== */}
        {activeTab === 'vault' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-cinzel tracking-widest text-[#D4AF37] uppercase">
                  THE SACRED ARCHIVES • KURIKULUM SMP, SMA &amp; SMK (TKJ, BM, TKR/TR)
                </span>
                <h1 className="font-cinzel text-3xl font-bold text-[#F4E8C1] mt-0.5">
                  Vault of Tomes ({filteredBooks.length} Koleksi)
                </h1>
                <p className="text-xs text-[#A89F91] mt-1">
                  Navigasi kurikulum bertingkat: pilih Jenjang, Kelas, Jurusan SMK, dan Jenis Buku.
                </p>
              </div>

              {/* Search & Availability Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#D4AF37] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari judul, kode, jurusan..."
                    className="pl-8 pr-3 py-2 rounded-xl text-xs bg-[#1E1916] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37] w-52 sm:w-64"
                  />
                </div>
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl text-xs bg-[#1E1916] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="all">Semua Ketersediaan ({books.length})</option>
                  <option value="available">
                    Stok Fisik Tersedia ({books.filter((b) => b.availableStock > 0).length})
                  </option>
                  <option value="out_of_stock">
                    Stok Fisik Habis ({books.filter((b) => b.availableStock === 0).length})
                  </option>
                </select>
              </div>
            </div>

            {/* =========================================================
                NAVIGASI FILTER KURIKULUM BERTINGKAT (SMP, SMA, SMK 3 JURUSAN)
            ========================================================= */}
            <div className="parchment-card rounded-2xl p-5 sm:p-6 space-y-4 border border-[#D4AF37]/35">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D4AF37]/20 pb-3">
                <div>
                  <span className="text-[11px] font-cinzel font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Navigasi Filter Kurikulum Bertingkat</span>
                  </span>
                  <p className="text-xs text-[#A89F91] mt-0.5">
                    Memilih jurusan SMK (TKJ, BM, atau TKR/TR) otomatis menyertakan buku muatan nasional berlabel <strong className="text-[#F4E8C1]">Semua Jurusan</strong>.
                  </p>
                </div>

                {/* Pintasan Cepat Uji Kurikulum */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-[#A89F91] mr-1">Pintasan Cepat:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJenjang('SMK');
                      setSelectedKelas('10');
                      setSelectedJurusan('TKJ');
                      setSelectedJenisBuku('All');
                    }}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-cinzel font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all"
                  >
                    SMK → Kelas 10 → TKJ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJenjang('SMK');
                      setSelectedKelas('10');
                      setSelectedJurusan('BM');
                      setSelectedJenisBuku('All');
                    }}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-cinzel font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all"
                  >
                    SMK → Kelas 10 → BM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJenjang('SMK');
                      setSelectedKelas('10');
                      setSelectedJurusan('TKR/TR');
                      setSelectedJenisBuku('All');
                    }}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-cinzel font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 transition-all"
                  >
                    SMK → Kelas 10 → TKR/TR
                  </button>
                  {(selectedJenjang !== 'All' ||
                    selectedKelas !== 'All' ||
                    selectedJurusan !== 'All' ||
                    selectedJenisBuku !== 'All') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedJenjang('All');
                        setSelectedKelas('All');
                        setSelectedJurusan('All');
                        setSelectedJenisBuku('All');
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                    >
                      Reset Kurikulum
                    </button>
                  )}
                </div>
              </div>

              {/* TINGKAT 1: PILIH JENJANG (SMP, SMA, SMK, UMUM) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-cinzel text-[#D4AF37]">
                  1. PILIH JENJANG PENDIDIKAN:
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'All', label: 'Semua Jenjang' },
                    { id: 'SMP', label: 'SMP (Kelas 7-9)' },
                    { id: 'SMA', label: 'SMA (Kelas 10-12)' },
                    { id: 'SMK', label: 'SMK (3 Jurusan)' },
                    { id: 'Umum', label: 'Umum / Literasi' }
                  ].map((item) => {
                    const active = selectedJenjang === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedJenjang(item.id);
                          setSelectedKelas('All');
                          setSelectedJurusan('All');
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-cinzel font-bold transition-all border ${
                          active
                            ? 'bg-[#D4AF37] text-[#12100E] border-[#D4AF37] shadow-md'
                            : 'bg-[#12100E] text-[#F4E8C1] border-white/10 hover:border-[#D4AF37]/50'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TINGKAT 2: PILIH KELAS BERDASARKAN JENJANG */}
              {selectedJenjang !== 'All' && selectedJenjang !== 'Umum' && (
                <div className="space-y-1.5 pt-1 animate-fadeIn">
                  <label className="block text-[11px] font-cinzel text-emerald-400">
                    2. PILIH TINGKAT KELAS ({selectedJenjang}):
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedKelas('All')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-cinzel font-bold transition-all border ${
                        selectedKelas === 'All'
                          ? 'bg-emerald-500 text-[#12100E] border-emerald-400 shadow'
                          : 'bg-[#12100E] text-[#F4E8C1] border-white/10 hover:border-emerald-400/50'
                      }`}
                    >
                      Semua Kelas {selectedJenjang}
                    </button>
                    {(KELAS_BY_JENJANG[selectedJenjang] || []).map((kls) => {
                      const active = selectedKelas === kls;
                      return (
                        <button
                          key={kls}
                          type="button"
                          onClick={() => setSelectedKelas(kls)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-cinzel font-bold transition-all border ${
                            active
                              ? 'bg-emerald-500 text-[#12100E] border-emerald-400 shadow'
                              : 'bg-[#12100E] text-[#F4E8C1] border-white/10 hover:border-emerald-400/50'
                          }`}
                        >
                          Kelas {kls}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TINGKAT 3: PILIH JURUSAN (KHUSUS SMK: TKJ, BM, TKR/TR, SEMUA JURUSAN) */}
              {selectedJenjang === 'SMK' && (
                <div className="space-y-1.5 pt-1 animate-fadeIn">
                  <label className="block text-[11px] font-cinzel text-sky-400">
                    3. PILIH JURUSAN SMK (OTOMATIS MENYERTAKAN BUKU &apos;SEMUA JURUSAN&apos;):
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedJurusan('All')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-cinzel font-bold transition-all border ${
                        selectedJurusan === 'All'
                          ? 'bg-sky-400 text-[#12100E] border-sky-300 shadow'
                          : 'bg-[#12100E] text-[#F4E8C1] border-white/10 hover:border-sky-400/50'
                      }`}
                    >
                      Semua Jurusan SMK
                    </button>
                    {SMK_JURUSAN_OPTIONS.map((jur) => {
                      const active = selectedJurusan === jur;
                      return (
                        <button
                          key={jur}
                          type="button"
                          onClick={() => setSelectedJurusan(jur)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-cinzel font-bold transition-all border ${
                            active
                              ? 'bg-sky-400 text-[#12100E] border-sky-300 shadow'
                              : 'bg-[#12100E] text-[#F4E8C1] border-white/10 hover:border-sky-400/50'
                          }`}
                        >
                          {jur === 'TKJ'
                            ? 'TKJ (Teknik Komputer & Jaringan)'
                            : jur === 'BM'
                            ? 'BM (Bisnis & Manajemen)'
                            : jur === 'TKR/TR'
                            ? 'TKR/TR (Teknik Kendaraan Ringan)'
                            : 'Hanya Muatan Nasional (Semua Jurusan)'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TINGKAT 4: PILIH JENIS BUKU */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-cinzel text-purple-300">
                  {selectedJenjang === 'SMK'
                    ? '4.'
                    : selectedJenjang === 'SMP' || selectedJenjang === 'SMA'
                    ? '3.'
                    : '2.'}{' '}
                  FILTER JENIS BUKU:
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedJenisBuku('All')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-cinzel font-semibold transition-all border ${
                      selectedJenisBuku === 'All'
                        ? 'bg-purple-500 text-white border-purple-400 shadow'
                        : 'bg-[#12100E] text-[#A89F91] border-white/10 hover:text-[#F4E8C1]'
                    }`}
                  >
                    Semua Jenis Buku
                  </button>
                  {JENIS_BUKU_OPTIONS.map((jb) => {
                    const active = selectedJenisBuku === jb;
                    return (
                      <button
                        key={jb}
                        type="button"
                        onClick={() => setSelectedJenisBuku(jb)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-cinzel font-semibold transition-all border ${
                          active
                            ? 'bg-purple-500 text-white border-purple-400 shadow'
                            : 'bg-[#12100E] text-[#A89F91] border-white/10 hover:text-[#F4E8C1]'
                        }`}
                      >
                        {jb}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Breadcrumb Banner */}
              {selectedJenjang !== 'All' && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    Filter Kurikulum Aktif:{' '}
                    <strong className="text-white">
                      {selectedJenjang}
                      {selectedKelas !== 'All' ? ` → Kelas ${selectedKelas}` : ' → Semua Kelas'}
                      {selectedJenjang === 'SMK' && selectedJurusan !== 'All'
                        ? ` → Jurusan ${selectedJurusan} (+ Semua Jurusan)`
                        : ''}
                      {selectedJenisBuku !== 'All' ? ` → ${selectedJenisBuku}` : ''}
                    </strong>
                  </span>
                  <span className="font-cinzel font-bold text-emerald-300">
                    {filteredBooks.length} Buku Ditemukan
                  </span>
                </div>
              )}
            </div>

            {/* Category Lore Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {SCHOOLS_OF_LORE.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs transition-all whitespace-nowrap border text-left ${
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
                  Tidak Ada Buku pada Kombinasi Filter Ini
                </h3>
                <p className="text-xs text-[#A89F91]">
                  Coba ubah filter jenjang/kelas/jurusan atau bersihkan kata kunci pencarian.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSelectedJenjang('All');
                    setSelectedKelas('All');
                    setSelectedJurusan('All');
                    setSelectedJenisBuku('All');
                    setAvailabilityFilter('all');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-cinzel bg-[#D4AF37] text-[#12100E] font-bold"
                >
                  Reset Seluruh Filter
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
                              <span>{book.jenjang || 'Umum'}</span>
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
                            <div className="flex flex-wrap items-center justify-between gap-1">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 font-bold">
                                {book.jenjang || 'Umum'} •{' '}
                                {book.kelas === 'Semua' ? 'Semua Kelas' : `Kelas ${book.kelas}`}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                  isAvailable
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                                }`}
                              >
                                {isAvailable
                                  ? `Stok: ${book.availableStock}/${book.totalStock}`
                                  : 'Stok Habis'}
                              </span>
                            </div>

                            {/* Badges Jurusan & Jenis Buku */}
                            <div className="flex flex-wrap items-center gap-1 mt-1.5">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold">
                                {book.jurusan || 'Semua Jurusan'}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                {book.jenisBuku || 'Referensi'}
                              </span>
                            </div>

                            <h3
                              onClick={() => setInspectedBookId(book.id)}
                              className="font-cinzel font-bold text-base text-[#F4E8C1] mt-2 hover:text-[#D4AF37] cursor-pointer line-clamp-2"
                            >
                              {book.title}
                            </h3>
                            <p className="text-xs text-[#A89F91] mt-0.5 truncate">
                              {book.author} • <span className="font-mono text-[#D4AF37]">{book.kodeBuku}</span>
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-[#A89F91] mt-3 line-clamp-2 leading-relaxed">
                          {book.synopsis}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 pt-3 border-t border-[#D4AF37]/15 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setReadingBook(book)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-cinzel font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all flex items-center gap-1"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Baca Digital</span>
                          </button>

                          {book.pdfUrl && (
                            <button
                              type="button"
                              onClick={() => setPdfViewerBook(book)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-cinzel font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all"
                              title="Buka PDF Layar Penuh"
                            >
                              PDF
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setInspectedBookId(book.id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs border border-[#D4AF37]/40 text-[#F4E8C1] hover:bg-[#D4AF37]/15"
                          >
                            Detail
                          </button>

                          {currentUser?.role === 'admin' ? (
                            <button
                              onClick={() => setActiveTab('archivist')}
                              className="px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                            >
                              Kelola
                            </button>
                          ) : currentUser?.role === 'guru' ? (
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
                              {isAvailable ? 'Pinjam' : 'Habis'}
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
            onRegisterMember={handleRegisterMember}
            onImportBulkMembers={handleImportBulkMembers}
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
            isDatabaseConnected={isDatabaseConnected}
            isSyncingDatabase={isSyncingDatabase}
            onRefreshDatabase={() => syncDatabaseData(currentUser, true)}
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
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 font-bold">
                    {inspectedBook.jenjang || 'Umum'} •{' '}
                    {inspectedBook.kelas === 'Semua'
                      ? 'Semua Kelas'
                      : `Kelas ${inspectedBook.kelas}`}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold">
                    {inspectedBook.jurusan || 'Semua Jurusan'}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    {inspectedBook.jenisBuku || 'Referensi'}
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
                {inspectedBook.pdfUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setPdfViewerBook(inspectedBook);
                      setInspectedBookId(null);
                    }}
                    className="px-4 py-2.5 rounded-xl font-cinzel font-bold text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all flex items-center gap-1.5"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Baca Buku (PDF)</span>
                  </button>
                )}

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

                {currentUser?.role === 'admin' ? (
                  <button
                    onClick={() => {
                      setActiveTab('archivist');
                      setInspectedBookId(null);
                    }}
                    className="px-4 py-2.5 rounded-xl font-cinzel font-bold text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                  >
                    Kelola di Archivist
                  </button>
                ) : currentUser?.role === 'guru' ? (
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
        members={members}
        onRegisterMember={handleRegisterMember}
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
        showToast={showToast}
      />

      {/* ==========================================
          MODAL 6: FULLSCREEN PDF E-BOOK VIEWER
      ========================================== */}
      <FullScreenPdfViewerModal
        book={pdfViewerBook}
        isOpen={Boolean(pdfViewerBook)}
        onClose={() => setPdfViewerBook(null)}
        currentUser={currentUser}
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
