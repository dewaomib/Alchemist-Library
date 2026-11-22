import React, { useMemo, useState } from 'react';
import {
  Database,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Clock,
  BookOpen,
  BookMarked,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Layers,
  FileSpreadsheet,
  ScanLine,
  Printer,
  BarChart3,
  MessageCircle,
  MessageSquareQuote,
  Users,
  UserPlus,
  Hash,
  User,
  Lock,
  Package,
  ArrowUpRight,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  FlaskConical,
  LogOut,
  LogIn,
  Crown,
  GraduationCap,
  Shield,
  CalendarDays,
  Star,
  Trash2,
  RotateCcw,
  Search,
  ChevronRight,
  Eye
} from 'lucide-react';
import { PRESET_USERS } from './RoleSwitcherBar';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import ExcelImportSection from './ExcelImportSection';
import QuickLoanDesk from './QuickLoanDesk';
import BarcodeLabelModal from './BarcodeLabelModal';
import LibraryReportsView from './LibraryReportsView';
import WhatsAppReminderModal from './WhatsAppReminderModal';
import ClassPackageDesk from './ClassPackageDesk';
import { formatDateID, getLoanTiming, sortLoansByUrgency } from '../utils/loanUtils';
import {
  JENJANG_OPTIONS,
  KELAS_BY_JENJANG,
  SMK_JURUSAN_OPTIONS,
  JENIS_BUKU_OPTIONS,
  normalizeNisn
} from '../utils/libraryUtils';

const MENU_GROUPS = [
  {
    title: 'Menu Utama',
    items: [
      {
        id: 'overview',
        label: 'Dashboard Ringkasan',
        shortLabel: 'Ringkasan',
        icon: LayoutDashboard,
        description: 'Ringkasan KPI, sirkulasi terbaru, dan statistik koleksi perpustakaan'
      }
    ]
  },
  {
    title: 'Layanan Sirkulasi',
    items: [
      {
        id: 'quick',
        label: 'Transaksi Kilat (Scan NISN)',
        shortLabel: 'Scan NISN',
        icon: ScanLine,
        description: 'Pemindaian kamera barcode NISN siswa & ISBN/Kode Buku secara kilat'
      },
      {
        id: 'queue',
        label: 'Antrean Persetujuan',
        shortLabel: 'Antrean',
        icon: Clock,
        badgeKey: 'pending',
        description: 'Verifikasi permintaan peminjaman fisik dari siswa dan guru'
      },
      {
        id: 'circulation',
        label: 'Sirkulasi Pinjaman Aktif',
        shortLabel: 'Sirkulasi',
        icon: Layers,
        badgeKey: 'active',
        description: 'Pantau tenggat waktu, pengingat WhatsApp, dan verifikasi pengembalian'
      },
      {
        id: 'packages',
        label: 'Paket Keranjang Kelas',
        shortLabel: 'Paket Kelas',
        icon: Package,
        badgeKey: 'packages',
        description: 'Peminjaman rombel kilat 1 hari per kelas & jam pelajaran'
      }
    ]
  },
  {
    title: 'Katalog & Koleksi Buku',
    items: [
      {
        id: 'inventory',
        label: 'Data Buku & Kurikulum',
        shortLabel: 'Data Buku',
        icon: BookMarked,
        description: 'Manajemen stok fisik, pendaftaran buku baru, dan pemetaan SMP, SMA, SMK (TKJ, BM, TKR/TR)'
      },
      {
        id: 'import_excel',
        label: 'Import Excel Massal',
        shortLabel: 'Import Excel',
        icon: FileSpreadsheet,
        description: 'Unggah data buku dan akun siswa/NISN secara massal tanpa menimpa data lama'
      },
      {
        id: 'labels',
        label: 'Cetak Label Barcode',
        shortLabel: 'Label Rak',
        icon: Printer,
        description: 'Generate PDF stiker barcode, nomor panggil DDC, dan lokasi rak siap cetak'
      }
    ]
  },
  {
    title: 'Anggota & Layanan',
    items: [
      {
        id: 'members',
        label: 'Data Siswa & Guru (NISN)',
        shortLabel: 'Anggota',
        icon: Users,
        description: 'Kelola akun login username/password serta NISN bertipe teks'
      },
      {
        id: 'reports',
        label: 'Laporan & Statistik',
        shortLabel: 'Laporan',
        icon: BarChart3,
        description: 'Rekap bulanan, statistik popularitas, dan ekspor 1-klik Excel/PDF akreditasi'
      },
      {
        id: 'moderation',
        label: 'Moderasi Ulasan & Rating',
        shortLabel: 'Moderasi',
        icon: ShieldAlert,
        badgeKey: 'lowReviews',
        description: 'Hapus komentar spam/kasar secara permanen dan reset rating tidak wajar'
      }
    ]
  }
];

const ALL_MENU_ITEMS = MENU_GROUPS.flatMap((group) => group.items);

export default function ArchivistsChamberView({
  currentUser,
  books = [],
  loans = [],
  members = [],
  onRegisterMember,
  onImportBulkMembers,
  allPendingLoans = [],
  allApprovedLoans = [],
  onApproveLoan,
  onRejectLoan,
  onVerifyReturnLoan,
  onAdjustStock,
  onSubmitQuickLoan,
  isSubmittingQuickLoan = false,
  newBookForm,
  setNewBookForm,
  onAddNewBook,
  onImportBulkBooks,
  isImporting = false,
  isDatabaseConnected = true,
  isSyncingDatabase = false,
  onRefreshDatabase,
  onOpenPdfViewer,
  onOpenCatalog,
  onInspectBook,
  packageLoanForm,
  setPackageLoanForm,
  onSubmitPackageLoan,
  onCompletePackageLoan,
  onSwitchRole,
  onOpenGatekeeperModal,
  onLogout,
  onDeleteReview,
  onClearReviewRating,
  onResetBookReviews,
  isModeratingReview = false
}) {
  const { isModern } = useTheme();
  const [activeMenu, setActiveMenu] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Inventory & manual book form state
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [inventoryJenjangFilter, setInventoryJenjangFilter] = useState('All');
  const [inventoryJurusanFilter, setInventoryJurusanFilter] = useState('All');
  const [showAddBookForm, setShowAddBookForm] = useState(false);

  // Circulation filter
  const [circulationFilter, setCirculationFilter] = useState('all'); // 'all' | 'overdue' | 'due_soon' | 'active'

  // Members search & creation form
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [newMemberForm, setNewMemberForm] = useState({
    nisn: '',
    name: '',
    username: '',
    password: '',
    role: 'siswa',
    jenjang: 'SMK',
    kelas: '10',
    jurusan: 'TKJ',
    phone: ''
  });
  const [memberFormFeedback, setMemberFormFeedback] = useState('');

  // Label studio search
  const [labelSearchQuery, setLabelSearchQuery] = useState('');
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [labelInitialBookId, setLabelInitialBookId] = useState(null);

  // WhatsApp reminder modal
  const [reminderLoan, setReminderLoan] = useState(null);

  // Moderation center filters & inline confirmation
  const [moderationSearch, setModerationSearch] = useState('');
  const [moderationFilter, setModerationFilter] = useState('all'); // 'all' | 'low' | 'cleared'
  const [moderationBookFilter, setModerationBookFilter] = useState('all');
  const [moderationConfirm, setModerationConfirm] = useState(null);

  const todayFormatted = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(new Date());
    } catch {
      return formatDateID(new Date());
    }
  }, []);

  const overdueLoans = useMemo(
    () => allApprovedLoans.filter((loan) => getLoanTiming(loan).key === 'overdue'),
    [allApprovedLoans]
  );
  const dueSoonLoans = useMemo(
    () => allApprovedLoans.filter((loan) => getLoanTiming(loan).key === 'due_soon'),
    [allApprovedLoans]
  );
  const sortedApprovedLoans = useMemo(
    () => sortLoansByUrgency(allApprovedLoans),
    [allApprovedLoans]
  );
  const activeClassPackages = useMemo(
    () => loans.filter((loan) => loan.isPackage && loan.status === 'approved'),
    [loans]
  );

  const filteredCirculationLoans = useMemo(() => {
    if (circulationFilter === 'all') return sortedApprovedLoans;
    return sortedApprovedLoans.filter((loan) => getLoanTiming(loan).key === circulationFilter);
  }, [sortedApprovedLoans, circulationFilter]);

  const totalPhysicalCopies = useMemo(
    () => books.reduce((sum, b) => sum + (Number(b.totalStock) || 0), 0),
    [books]
  );
  const totalAvailableCopies = useMemo(
    () => books.reduce((sum, b) => sum + (Number(b.availableStock) || 0), 0),
    [books]
  );
  const totalDigitalPdfBooks = useMemo(
    () => books.filter((b) => Boolean(b.pdfUrl)).length,
    [books]
  );

  // Theme-aware Curriculum Distribution Palette (Warm Obsidian Wood vs Clean Contemporary)
  const curriculumStats = useMemo(() => {
    const groups = isModern
      ? [
          { key: 'SMK', label: 'SMK (TKJ • BM • TKR/TR)', color: '#2563EB' },
          { key: 'SMA', label: 'SMA (Kelas 10–12)', color: '#059669' },
          { key: 'SMP', label: 'SMP (Kelas 7–9)', color: '#0284C7' },
          { key: 'Umum', label: 'Umum / Literasi & Fiksi', color: '#7C3AED' }
        ]
      : [
          { key: 'SMK', label: 'SMK (TKJ • BM • TKR/TR)', color: '#D4AF37' },
          { key: 'SMA', label: 'SMA (Kelas 10–12)', color: '#10B981' },
          { key: 'SMP', label: 'SMP (Kelas 7–9)', color: '#C88A3B' },
          { key: 'Umum', label: 'Umum / Literasi & Fiksi', color: '#8B5CF6' }
        ];
    const total = Math.max(1, books.length);
    return groups.map((g) => {
      const count = books.filter((b) => (b.jenjang || 'Umum') === g.key).length;
      return {
        ...g,
        count,
        percent: Math.round((count / total) * 100)
      };
    });
  }, [books, isModern]);

  // Flatten all reviews across books for Moderation Center & Overview
  const allReviewsFlat = useMemo(() => {
    const rows = [];
    for (const book of books) {
      for (const rev of book.reviews || []) {
        rows.push({
          ...rev,
          bookId: book.id,
          bookTitle: book.title,
          bookKode: book.kodeBuku,
          bookRating: Number(book.rating) || 0,
          bookObj: book
        });
      }
    }
    return rows.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
  }, [books]);

  const lowRatingReviewsCount = useMemo(
    () => allReviewsFlat.filter((r) => r.rating !== null && Number(r.rating) <= 2).length,
    [allReviewsFlat]
  );

  const clearedRatingReviewsCount = useMemo(
    () => allReviewsFlat.filter((r) => r.rating === null || r.rating === undefined).length,
    [allReviewsFlat]
  );

  const averageCollectionRating = useMemo(() => {
    const ratedBooks = books.filter((b) => Number(b.rating) > 0);
    if (ratedBooks.length === 0) return 0;
    const sum = ratedBooks.reduce((acc, b) => acc + Number(b.rating), 0);
    return Number((sum / ratedBooks.length).toFixed(1));
  }, [books]);

  const filteredModerationReviews = useMemo(() => {
    const q = moderationSearch.trim().toLowerCase();
    return allReviewsFlat.filter((rev) => {
      if (moderationBookFilter !== 'all' && rev.bookId !== moderationBookFilter) return false;
      if (moderationFilter === 'low') {
        if (rev.rating === null || Number(rev.rating) > 2) return false;
      } else if (moderationFilter === 'cleared') {
        if (rev.rating !== null && rev.rating !== undefined) return false;
      }
      if (!q) return true;
      return (
        (rev.comment || '').toLowerCase().includes(q) ||
        (rev.user || '').toLowerCase().includes(q) ||
        (rev.username || '').toLowerCase().includes(q) ||
        (rev.bookTitle || '').toLowerCase().includes(q) ||
        (rev.bookKode || '').toLowerCase().includes(q)
      );
    });
  }, [allReviewsFlat, moderationSearch, moderationFilter, moderationBookFilter]);

  const selectedModerationBook = useMemo(
    () => books.find((b) => b.id === moderationBookFilter) || null,
    [books, moderationBookFilter]
  );

  const reminderBook = reminderLoan
    ? books.find((book) => book.id === reminderLoan.bookId) || null
    : null;
  const reminderMember = reminderLoan
    ? members.find(
        (member) =>
          (reminderLoan.borrowerCard &&
            (member.cardCode === reminderLoan.borrowerCard ||
              member.nisn === reminderLoan.borrowerCard)) ||
          member.name === reminderLoan.borrowerName ||
          member.name === reminderLoan.requesterName
      ) || null
    : null;

  const openLabelModal = (bookId = null) => {
    setLabelInitialBookId(bookId);
    setIsLabelModalOpen(true);
  };

  const filteredInventoryBooks = useMemo(() => {
    const q = stockSearchQuery.trim().toLowerCase();
    return books.filter((b) => {
      if (inventoryJenjangFilter !== 'All' && (b.jenjang || 'Umum') !== inventoryJenjangFilter) {
        return false;
      }
      if (
        inventoryJenjangFilter === 'SMK' &&
        inventoryJurusanFilter !== 'All' &&
        (b.jurusan || 'Semua Jurusan') !== inventoryJurusanFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        (b.title || '').toLowerCase().includes(q) ||
        (b.author || '').toLowerCase().includes(q) ||
        (b.category || '').toLowerCase().includes(q) ||
        (b.jenjang || '').toLowerCase().includes(q) ||
        (b.kelas || '').toLowerCase().includes(q) ||
        (b.jurusan || '').toLowerCase().includes(q) ||
        (b.jenisBuku || '').toLowerCase().includes(q) ||
        (b.kodeBuku || b.id || '').toLowerCase().includes(q) ||
        (b.publisher || '').toLowerCase().includes(q)
      );
    });
  }, [books, stockSearchQuery, inventoryJenjangFilter, inventoryJurusanFilter]);

  const filteredLabelBooks = useMemo(() => {
    const q = labelSearchQuery.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) =>
        (b.title || '').toLowerCase().includes(q) ||
        (b.kodeBuku || '').toLowerCase().includes(q) ||
        (b.ddc || '').toLowerCase().includes(q) ||
        (b.shelf || '').toLowerCase().includes(q) ||
        (b.author || '').toLowerCase().includes(q)
    );
  }, [books, labelSearchQuery]);

  const filteredMembers = useMemo(() => {
    const q = memberSearchQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        (m.nisn || '').toLowerCase().includes(q) ||
        (m.name || '').toLowerCase().includes(q) ||
        (m.username || '').toLowerCase().includes(q) ||
        (m.jenjang || '').toLowerCase().includes(q) ||
        (m.kelas || '').toLowerCase().includes(q) ||
        (m.jurusan || '').toLowerCase().includes(q) ||
        (m.role || '').toLowerCase().includes(q)
    );
  }, [members, memberSearchQuery]);

  const handleCreateMemberSubmit = (e) => {
    e.preventDefault();
    setMemberFormFeedback('');

    const cleanNisn = normalizeNisn(newMemberForm.nisn);
    const cleanUser = newMemberForm.username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '');
    const cleanPass = newMemberForm.password.trim();
    const cleanName = newMemberForm.name.trim();

    if ((newMemberForm.role === 'siswa' && !cleanNisn) || !cleanUser || !cleanPass || !cleanName) {
      setMemberFormFeedback(
        newMemberForm.role === 'guru'
          ? 'Nama Lengkap, Username, dan Password wajib diisi untuk akun Guru.'
          : 'NISN, Nama Lengkap, Username, dan Password wajib diisi untuk akun Siswa.'
      );
      return;
    }

    const jurusanFinal =
      newMemberForm.jenjang === 'SMK' ? newMemberForm.jurusan : 'Semua Jurusan';
    const className =
      newMemberForm.role === 'guru'
        ? `Dewan Guru ${newMemberForm.jenjang}`
        : `${newMemberForm.jenjang} Kelas ${newMemberForm.kelas}${
            newMemberForm.jenjang === 'SMK' ? ` ${jurusanFinal}` : ''
          }`;
    const classLabel =
      newMemberForm.role === 'guru'
        ? `Guru Pengampu • ${newMemberForm.jenjang}`
        : `${newMemberForm.jenjang} • Kelas ${newMemberForm.kelas} • Jurusan ${jurusanFinal}`;

    onRegisterMember?.({
      id: `member-${Date.now()}`,
      cardCode: cleanNisn,
      nisn: cleanNisn,
      username: cleanUser,
      password: cleanPass,
      name: cleanName,
      role: newMemberForm.role,
      jenjang: newMemberForm.jenjang,
      kelas: newMemberForm.kelas,
      jurusan: jurusanFinal,
      level: newMemberForm.kelas,
      className,
      classLabel,
      phone: newMemberForm.phone.trim(),
      avatar: newMemberForm.role === 'guru' ? '📜' : '⚔️',
      color: newMemberForm.role === 'guru' ? '#8B5CF6' : '#10B981'
    });

    setNewMemberForm({
      nisn: '',
      name: '',
      username: '',
      password: '',
      role: 'siswa',
      jenjang: 'SMK',
      kelas: '10',
      jurusan: 'TKJ',
      phone: ''
    });
    setMemberFormFeedback(
      `Akun @${cleanUser}${cleanNisn ? ` (NISN: ${cleanNisn})` : ''} berhasil ditambahkan ke PostgreSQL!`
    );
  };

  const handleSelectMenu = (menuId) => {
    setActiveMenu(menuId);
    setMobileDrawerOpen(false);
    setModerationConfirm(null);
  };

  const getBadgeCount = (badgeKey) => {
    if (badgeKey === 'pending') return allPendingLoans.length;
    if (badgeKey === 'active') return allApprovedLoans.length;
    if (badgeKey === 'packages') return activeClassPackages.length;
    if (badgeKey === 'lowReviews') return lowRatingReviewsCount;
    return 0;
  };

  const activeMenuMeta =
    ALL_MENU_ITEMS.find((item) => item.id === activeMenu) || ALL_MENU_ITEMS[0];

  const bookFormKelasOptions = KELAS_BY_JENJANG[newBookForm?.jenjang || 'SMK'] || ['10', '11', '12'];
  const memberFormKelasOptions = KELAS_BY_JENJANG[newMemberForm.jenjang || 'SMK'] || ['10', '11', '12'];

  const roleQuickButtons = [
    {
      key: 'admin',
      label: 'Admin',
      icon: Crown,
      active: 'bg-[#D4AF37]/20 text-[#F4E8C1] border-[#D4AF37]/60'
    },
    {
      key: 'guru',
      label: 'Guru',
      icon: GraduationCap,
      active: 'bg-purple-500/20 text-purple-200 border-purple-400/60'
    },
    {
      key: 'siswa',
      label: 'Siswa',
      icon: Shield,
      active: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/60'
    }
  ];

  // Shared Sidebar Content Renderer (Warm Obsidian Wood)
  const renderSidebarBody = (isMobile = false) => {
    const collapsed = !isMobile && sidebarCollapsed;

    return (
      <div className="flex flex-col h-full bg-[#161210] text-[#F4E8C1]">
        {/* SIDEBAR BRAND HEADER */}
        <div
          className={`flex items-center border-b border-[#D4AF37]/20 px-4 py-4 shrink-0 ${
            collapsed ? 'justify-center' : 'justify-between gap-2.5'
          }`}
        >
          <button
            type="button"
            onClick={() => handleSelectMenu('overview')}
            className="flex items-center gap-3 min-w-0 text-left group"
            title="The Grand Alchemist's Archive — Dashboard Admin"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-[#D4AF37]/65 shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-[0_0_16px_rgba(212,175,55,0.18)]"
              style={{
                background: 'var(--theme-brand-icon-bg)'
              }}
            >
              <FlaskConical className="w-5 h-5 text-[#D4AF37]" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="font-cinzel font-bold text-xs tracking-wider text-[#F4E8C1] block truncate">
                  ALCHEMIST&apos;S ARCHIVE
                </span>
                <span className="text-[10px] tracking-widest uppercase text-[#D4AF37]/80 block truncate">
                  Archivist&apos;s Chamber
                </span>
              </div>
            )}
          </button>

          {isMobile ? (
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              className="p-2 rounded-lg text-[#A89F91] hover:text-[#F4E8C1] hover:bg-[#D4AF37]/10 border border-transparent hover:border-[#D4AF37]/30 transition-all"
              aria-label="Tutup navigasi sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            !collapsed && (
              <button
                type="button"
                onClick={() => setSidebarCollapsed(true)}
                className="p-1.5 rounded-lg text-[#A89F91] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 border border-transparent hover:border-[#D4AF37]/30 transition-all shrink-0"
                title="Perkecil Sidebar menjadi Ikon"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )
          )}
        </div>

        {/* EXPAND BUTTON WHEN COLLAPSED ON DESKTOP */}
        {collapsed && (
          <div className="flex justify-center py-2.5 border-b border-[#D4AF37]/15">
            <button
              type="button"
              onClick={() => setSidebarCollapsed(false)}
              className="p-2 rounded-lg text-[#D4AF37] hover:bg-[#D4AF37]/15 border border-[#D4AF37]/30 transition-all"
              title="Perluas Sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* NAVIGATION GROUPS */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {MENU_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              {!collapsed ? (
                <div className="px-3 pb-1 flex items-center gap-2">
                  <span className="text-[10px] font-cinzel font-bold uppercase tracking-[0.18em] text-[#D4AF37]/75">
                    {group.title}
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-r from-[#D4AF37]/25 to-transparent" />
                </div>
              ) : (
                <div className="mx-3 my-1.5 h-px bg-[#D4AF37]/20" />
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.id;
                const badgeCount = item.badgeKey ? getBadgeCount(item.badgeKey) : 0;
                const isUrgentBadge =
                  item.badgeKey === 'pending' || item.badgeKey === 'lowReviews';

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectMenu(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full relative flex items-center rounded-xl transition-all duration-200 group cursor-pointer ${
                      collapsed ? 'justify-center px-2 py-3' : 'justify-between px-3 py-2.5 gap-2.5'
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-[#D4AF37]/18 via-[#28221D]/80 to-transparent text-[#F4E8C1] border border-[#D4AF37]/45 shadow-[0_0_16px_rgba(212,175,55,0.12)]'
                        : 'text-[#C8BFA9] hover:text-[#F4E8C1] hover:bg-[#1E1916] border border-transparent hover:border-[#D4AF37]/25'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#D4AF37]" />
                    )}

                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                          isActive
                            ? 'text-[#D4AF37]'
                            : item.id === 'quick'
                            ? 'text-emerald-400/90 group-hover:text-[#D4AF37]'
                            : item.id === 'moderation' && lowRatingReviewsCount > 0
                            ? 'text-rose-400 group-hover:text-[#F4E8C1]'
                            : 'text-[#A89F91] group-hover:text-[#D4AF37]'
                        }`}
                      />
                      {!collapsed && (
                        <span className="text-[13px] font-medium truncate">
                          {item.label}
                        </span>
                      )}
                    </div>

                    {!collapsed && badgeCount > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          isUrgentBadge
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/35'
                            : item.badgeKey === 'active'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35'
                            : 'bg-[#D4AF37]/15 text-[#F4E8C1] border border-[#D4AF37]/35'
                        }`}
                      >
                        {badgeCount}
                      </span>
                    )}

                    {collapsed && badgeCount > 0 && (
                      <span
                        className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#161210] ${
                          isUrgentBadge ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* SIDEBAR FOOTER: ELEGAN DARK-GOLD BUTTON + PROFIL ADMINISTRATOR + KELUAR */}
        <div className="p-3 border-t border-[#D4AF37]/20 space-y-2.5 bg-[#0E0C0A] shrink-0">
          {onOpenCatalog && (
            <button
              type="button"
              onClick={() => {
                setMobileDrawerOpen(false);
                onOpenCatalog();
              }}
              title={collapsed ? 'Buka Katalog Perpustakaan' : undefined}
              className={`w-full rounded-xl font-cinzel font-bold text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer bg-[#1E1916] text-[#F4E8C1] border border-[#D4AF37]/50 hover:bg-[#D4AF37]/15 hover:border-[#D4AF37] hover:shadow-[0_0_18px_rgba(212,175,55,0.16)] ${
                collapsed ? 'p-3' : 'px-3.5 py-2.5'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#D4AF37] shrink-0" />
              {!collapsed && (
                <>
                  <span className="truncate">Buka Katalog Perpustakaan</span>
                  <ArrowUpRight className="w-4 h-4 text-[#D4AF37] shrink-0" />
                </>
              )}
            </button>
          )}

          {/* Profile Card */}
          <div
            className={`rounded-xl bg-[#1E1916] border border-[#D4AF37]/25 transition-all ${
              collapsed
                ? 'p-2 flex flex-col items-center gap-2'
                : 'p-2.5 flex items-center justify-between gap-2'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#12100E] border border-[#D4AF37]/45 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="font-cinzel font-bold text-xs text-[#F4E8C1] truncate">
                    {currentUser?.name || 'Administrator'}
                  </p>
                  <p className="text-[10px] text-[#A89F91] truncate">
                    Grand Archivist • @{currentUser?.username || 'admin'}
                  </p>
                </div>
              )}
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Keluar dari Sesi Admin"
                className={`rounded-lg border border-rose-500/35 bg-rose-950/30 text-rose-200 hover:bg-rose-900/40 hover:border-rose-400/60 transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 ${
                  collapsed ? 'w-9 h-8' : 'px-2.5 py-1.5 text-[11px] font-semibold'
                }`}
              >
                <LogOut className="w-3.5 h-3.5 text-rose-300" />
                {!collapsed && <span>Keluar</span>}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#12100E] text-[#F4E8C1] flex relative">
      {/* =================================================================
          DESKTOP FIXED LEFT SIDEBAR (COLLAPSIBLE TO ICON-ONLY)
      ================================================================= */}
      <aside
        className={`hidden lg:block sticky top-0 h-screen shrink-0 border-r border-[#D4AF37]/20 transition-all duration-300 z-30 ${
          sidebarCollapsed ? 'w-[82px]' : 'w-72'
        }`}
      >
        {renderSidebarBody(false)}
      </aside>

      {/* =================================================================
          MOBILE / TABLET SLIDE-OUT SIDEBAR DRAWER
      ================================================================= */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full border-r border-[#D4AF37]/30 shadow-2xl">
            {renderSidebarBody(true)}
          </aside>
        </div>
      )}

      {/* =================================================================
          RIGHT MAIN CONTENT WORKSPACE (100% FULL WIDTH EDGE-TO-EDGE)
      ================================================================= */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#12100E]">
        {/* COMPACT STICKY TOP HEADER BAR */}
        <header
          className="sticky top-0 z-30 backdrop-blur-md border-b px-4 sm:px-6 lg:px-8 py-2.5"
          style={{
            backgroundColor: 'var(--theme-bg-header)',
            borderColor: 'var(--theme-border)'
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Mobile Drawer Toggle + Active Page Title + School & DB Status */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-[#1E1916] border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/15 transition-all"
                aria-label="Buka menu navigasi admin"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-cinzel font-bold text-base sm:text-lg text-[#F4E8C1] tracking-wide truncate">
                    {activeMenuMeta.label}
                  </h1>
                  <span
                    className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      isDatabaseConnected
                        ? 'bg-emerald-950/70 text-emerald-400 border-emerald-500/40'
                        : 'bg-amber-950/70 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isDatabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                    {isDatabaseConnected ? 'PostgreSQL + Prisma' : 'Menghubungkan DB...'}
                  </span>
                </div>
                <p className="text-[11px] text-[#A89F91] truncate">
                  Perpustakaan SMA/SMK Nusantara • {activeMenuMeta.description}
                </p>
              </div>
            </div>

            {/* Right: Theme Switcher + Compact Quick Login Role Switcher + Quick Catalog Link */}
            <div className="flex flex-wrap items-center gap-2">
              <ThemeToggle compact />

              {onSwitchRole && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-[#0D0B09] border border-[#D4AF37]/20">
                  <span className="hidden xl:inline text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37]/80 px-1.5">
                    Uji Role:
                  </span>
                  {roleQuickButtons.map((btn) => {
                    const preset = PRESET_USERS[btn.key];
                    const BtnIcon = btn.icon;
                    const isCurrent = currentUser?.role === preset.role;
                    return (
                      <button
                        key={btn.key}
                        type="button"
                        disabled={isSyncingDatabase}
                        onClick={() => onSwitchRole(preset)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 ${
                          isCurrent
                            ? btn.active
                            : 'border-transparent text-[#A89F91] hover:text-[#F4E8C1] hover:bg-[#1E1916]'
                        }`}
                        title={`Masuk sebagai ${preset.name} (@${preset.username})`}
                      >
                        <BtnIcon className="w-3 h-3" />
                        <span>{btn.label}</span>
                      </button>
                    );
                  })}
                  {onOpenGatekeeperModal && (
                    <button
                      type="button"
                      onClick={onOpenGatekeeperModal}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold border border-purple-500/35 bg-purple-950/30 text-purple-200 hover:bg-purple-900/40 flex items-center gap-1 transition-all cursor-pointer"
                      title="Masuk / Ganti Akun Manual"
                    >
                      <LogIn className="w-3 h-3 text-purple-300" />
                      <span className="hidden md:inline">Ganti Akun</span>
                    </button>
                  )}
                </div>
              )}

              {onOpenCatalog && (
                <button
                  type="button"
                  onClick={onOpenCatalog}
                  className="px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold bg-[#1E1916] text-[#F4E8C1] border border-[#D4AF37]/45 hover:bg-[#D4AF37]/15 hover:border-[#D4AF37] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="hidden sm:inline">Katalog Publik</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* FULL-WIDTH WORKSPACE BODY */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* ===============================================================
              MENU 1 (DEFAULT): DASHBOARD RINGKASAN
          =============================================================== */}
          {activeMenu === 'overview' && (
            <div className="space-y-6">
              {/* ARCHIVIST'S CHAMBER GREETING BANNER */}
              <section
                className="rounded-2xl p-6 sm:p-7 border relative overflow-hidden"
                style={{
                  background: 'var(--theme-banner-bg)',
                  borderColor: 'var(--theme-banner-border)',
                  boxShadow: 'var(--theme-shadow-card)'
                }}
              >
                <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#12100E] border border-[#D4AF37]/70 flex flex-col items-center justify-center shrink-0 shadow-xl">
                      <ShieldCheck className="w-9 h-9 text-[#D4AF37]" />
                      <span className="text-[9px] font-cinzel font-bold tracking-widest text-emerald-400 mt-0.5">
                        ARCHIVIST
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-cinzel font-bold tracking-wider uppercase bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/35">
                          <Sparkles className="w-3 h-3" />
                          Archivist&apos;s Chamber • Pusat Kendali Perpustakaan
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] bg-black/35 text-[#F4E8C1] border border-[#D4AF37]/25">
                          <CalendarDays className="w-3.5 h-3.5 text-[#D4AF37]" />
                          {todayFormatted}
                        </span>
                      </div>

                      <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#F4E8C1] tracking-wide">
                        Selamat Datang, {currentUser?.name || 'Administrator Perpustakaan'}
                      </h2>
                      <p className="text-xs sm:text-sm text-[#A89F91] max-w-3xl">
                        Pantau sirkulasi buku secara real-time, pindai kartu NISN siswa, kelola koleksi kurikulum SMP/SMA/SMK, paket keranjang kelas, hingga moderasi ulasan pembaca dalam satu layar luas.
                      </p>
                    </div>
                  </div>

                  {/* Quick Operational Actions (Refined Dark-Gold / Emerald Obsidian Buttons) */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSelectMenu('quick')}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-cinzel font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <ScanLine className="w-4 h-4" />
                      <span>Transaksi Kilat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openLabelModal(null)}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-cinzel font-bold bg-[#12100E]/75 text-[#F4E8C1] border border-[#D4AF37]/40 hover:bg-[#D4AF37]/15 hover:border-[#D4AF37] transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-[#D4AF37]" />
                      <span>Cetak Label</span>
                    </button>
                    <button
                      type="button"
                      onClick={onRefreshDatabase}
                      disabled={isSyncingDatabase}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-black/40 text-[#F4E8C1] border border-white/10 hover:border-[#D4AF37]/40 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 text-[#D4AF37] ${
                          isSyncingDatabase ? 'animate-spin' : ''
                        }`}
                      />
                      <span>{isSyncingDatabase ? 'Sinkronisasi...' : 'Segarkan DB'}</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* 5 FULL-WIDTH ALIGNED KPI CARDS (WARM OBSIDIAN WOOD) */}
              <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                <button
                  type="button"
                  onClick={() => handleSelectMenu('inventory')}
                  className="parchment-card rounded-2xl p-5 text-left transition-all hover:-translate-y-0.5 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#A89F91]">Total Koleksi</span>
                    <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] group-hover:scale-105 transition-transform">
                      <BookMarked className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="font-cinzel text-3xl font-bold text-[#D4AF37] mt-3">
                    {books.length}
                  </p>
                  <p className="text-[11px] text-[#A89F91] mt-1">
                    Judul • <strong className="text-[#F4E8C1]">{totalPhysicalCopies}</strong> Eksemplar
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectMenu('queue')}
                  className="parchment-card rounded-2xl p-5 text-left transition-all hover:-translate-y-0.5 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#A89F91]">Antrean Pinjam</span>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="font-cinzel text-3xl font-bold text-amber-400 mt-3">
                    {allPendingLoans.length}
                  </p>
                  <p className="text-[11px] text-amber-300/80 mt-1">
                    {allPendingLoans.length > 0 ? 'Menunggu persetujuan' : 'Semua sudah ditinjau'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectMenu('circulation')}
                  className="parchment-card rounded-2xl p-5 text-left transition-all hover:-translate-y-0.5 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#A89F91]">Dipinjam Aktif</span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="font-cinzel text-3xl font-bold text-emerald-400 mt-3">
                    {allApprovedLoans.length}
                  </p>
                  <p className="text-[11px] text-emerald-400/80 mt-1">
                    Sirkulasi berjalan ({activeClassPackages.length} paket kelas)
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCirculationFilter('overdue');
                    handleSelectMenu('circulation');
                  }}
                  className="parchment-card rounded-2xl p-5 text-left transition-all hover:-translate-y-0.5 border-rose-500/30 hover:border-rose-400/60 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#A89F91]">Terlambat</span>
                    <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="font-cinzel text-3xl font-bold text-rose-400 mt-3">
                    {overdueLoans.length}
                  </p>
                  <p className="text-[11px] text-rose-300/80 mt-1">
                    {overdueLoans.length > 0
                      ? `Perlu pengingat WA (${dueSoonLoans.length} H-1)`
                      : 'Nihil keterlambatan'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectMenu('members')}
                  className="parchment-card rounded-2xl p-5 text-left transition-all hover:-translate-y-0.5 cursor-pointer group col-span-2 md:col-span-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#A89F91]">Data Siswa (NISN)</span>
                    <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="font-cinzel text-3xl font-bold text-purple-400 mt-3">
                    {members.length}
                  </p>
                  <p className="text-[11px] text-[#A89F91] mt-1">
                    Anggota siswa &amp; guru aktif
                  </p>
                </button>
              </section>

              {/* LOWER 2-COLUMN LIVE SUMMARY: RECENT ACTIVE CIRCULATION + LIBRARY STATS */}
              <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* LEFT 8 COLS: RINGKASAN SIRKULASI AKTIF TERBARU */}
                <div className="xl:col-span-8 parchment-card rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D4AF37]/20 pb-4">
                    <div>
                      <h3 className="font-cinzel text-lg font-bold text-[#F4E8C1] flex items-center gap-2">
                        <Layers className="w-5 h-5 text-emerald-400" />
                        <span>Ringkasan Sirkulasi Aktif Terbaru</span>
                      </h3>
                      <p className="text-xs text-[#A89F91] mt-0.5">
                        Diurutkan berdasarkan urgensi jatuh tempo agar buku terlambat segera tertangani.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCirculationFilter('all');
                        handleSelectMenu('circulation');
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold bg-[#12100E]/70 text-[#F4E8C1] border border-[#D4AF37]/35 hover:bg-[#D4AF37]/15 hover:border-[#D4AF37] transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>Lihat Semua ({allApprovedLoans.length})</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                    </button>
                  </div>

                  {allPendingLoans.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-950/25 border border-amber-500/35 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-[#F4E8C1] flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          Ada <strong className="text-amber-300">{allPendingLoans.length} permintaan peminjaman baru</strong> menunggu persetujuan pustakawan.
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectMenu('queue')}
                        className="px-3.5 py-1.5 rounded-lg font-cinzel font-bold text-[11px] bg-[#1E1916] text-[#F4E8C1] border border-[#D4AF37]/50 hover:bg-[#D4AF37]/20 hover:border-[#D4AF37] transition-all cursor-pointer"
                      >
                        Tinjau Antrean
                      </button>
                    </div>
                  )}

                  {sortedApprovedLoans.length === 0 ? (
                    <div className="p-10 rounded-xl bg-black/30 border border-[#D4AF37]/15 text-center space-y-2">
                      <CheckCircle className="w-9 h-9 text-emerald-400 mx-auto" />
                      <p className="font-cinzel font-bold text-sm text-[#F4E8C1]">
                        Tidak Ada Pinjaman Aktif Saat Ini
                      </p>
                      <p className="text-xs text-[#A89F91]">
                        Gunakan menu Transaksi Kilat (Scan NISN) untuk memproses peminjaman baru.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#D4AF37]/20 text-[#D4AF37] font-cinzel text-[11px] uppercase">
                            <th className="py-3 px-2.5">Buku</th>
                            <th className="py-3 px-2.5">Peminjam &amp; NISN</th>
                            <th className="py-3 px-2.5 text-center">Eks</th>
                            <th className="py-3 px-2.5">Status Tenggat</th>
                            <th className="py-3 px-2.5 text-right">Aksi Cepat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D4AF37]/10">
                          {sortedApprovedLoans.slice(0, 7).map((loan) => {
                            const book = books.find((b) => b.id === loan.bookId);
                            const timing = getLoanTiming(loan);
                            return (
                              <tr
                                key={loan.id}
                                className="hover:bg-[#D4AF37]/[0.05] transition-colors"
                              >
                                <td className="py-3 px-2.5">
                                  <p className="font-semibold text-[#F4E8C1] line-clamp-1">
                                    {loan.bookTitle || book?.title}
                                  </p>
                                  <span className="text-[10px] font-mono text-[#D4AF37]/80">
                                    {book?.kodeBuku || loan.kodeBuku || '-'}
                                  </span>
                                </td>
                                <td className="py-3 px-2.5">
                                  <p className="font-medium text-[#F4E8C1]">{loan.requesterName}</p>
                                  <span className="text-[10px] font-mono text-emerald-400/90">
                                    {loan.borrowerNisn || loan.borrowerCard || loan.className}
                                  </span>
                                </td>
                                <td className="py-3 px-2.5 text-center font-bold text-[#F4E8C1]">
                                  {loan.quantity || 1}
                                </td>
                                <td className="py-3 px-2.5">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${timing.badgeClass}`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${timing.dotClass}`} />
                                    {timing.shortLabel}
                                  </span>
                                  <span className="block text-[10px] text-[#A89F91] mt-0.5">
                                    {formatDateID(loan.dueDate)}
                                  </span>
                                </td>
                                <td className="py-3 px-2.5 text-right">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setReminderLoan(loan)}
                                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/35 hover:bg-[#25D366]/25 transition-all cursor-pointer"
                                      title="Kirim Pengingat WhatsApp"
                                    >
                                      WA
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onVerifyReturnLoan(loan)}
                                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 hover:bg-emerald-500/25 transition-all cursor-pointer"
                                    >
                                      Kembali
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* RIGHT 4 COLS: STATISTIK SINGKAT PERPUSTAKAAN & MODERASI */}
                <div className="xl:col-span-4 space-y-5">
                  {/* Distribusi Kurikulum (Palet Hangat & Harmonis) */}
                  <div className="parchment-card rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
                      <h3 className="font-cinzel text-sm font-bold text-[#F4E8C1] flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[#D4AF37]" />
                        <span>Statistik Koleksi &amp; Kurikulum</span>
                      </h3>
                      <span className="text-[10px] font-mono text-[#D4AF37]">
                        {totalAvailableCopies}/{totalPhysicalCopies} Rak
                      </span>
                    </div>

                    <div className="space-y-3">
                      {curriculumStats.map((stat) => (
                        <div key={stat.key} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#C8BFA9] font-medium">{stat.label}</span>
                            <span className="font-semibold text-[#F4E8C1]">
                              {stat.count} judul ({stat.percent}%)
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-black/50 border border-[#D4AF37]/15 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.max(4, stat.percent)}%`,
                                backgroundColor: stat.color
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#D4AF37]/15 text-center">
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                        <span className="text-[10px] text-[#A89F91] block">E-Book PDF</span>
                        <span className="font-cinzel text-lg font-bold text-purple-400">
                          {totalDigitalPdfBooks}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                        <span className="text-[10px] text-[#A89F91] block">Stok Siap Pinjam</span>
                        <span className="font-cinzel text-lg font-bold text-emerald-400">
                          {totalAvailableCopies}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ringkasan Moderasi Ulasan & Rating */}
                  <div className="parchment-card rounded-2xl p-5 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
                      <h3 className="font-cinzel text-sm font-bold text-[#F4E8C1] flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-[#D4AF37]" />
                        <span>Moderasi Ulasan &amp; Rating</span>
                      </h3>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#D4AF37]">
                        <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
                        {averageCollectionRating > 0 ? averageCollectionRating.toFixed(1) : '0.0'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                        <span className="text-[10px] text-[#A89F91] block">Total Komentar</span>
                        <span className="font-cinzel text-xl font-bold text-[#F4E8C1]">
                          {allReviewsFlat.length}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-black/40 border border-rose-500/25">
                        <span className="text-[10px] text-[#A89F91] block">Rating Rendah (1–2★)</span>
                        <span className="font-cinzel text-xl font-bold text-rose-400">
                          {lowRatingReviewsCount}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectMenu('moderation')}
                      className="w-full py-2.5 rounded-xl text-xs font-cinzel font-bold bg-[#12100E]/80 text-[#F4E8C1] border border-[#D4AF37]/40 hover:bg-[#D4AF37]/15 hover:border-[#D4AF37] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquareQuote className="w-4 h-4 text-[#D4AF37]" />
                      <span>Buka Pusat Moderasi Ulasan</span>
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ===============================================================
              MENU 2: TRANSAKSI KILAT (SCAN NISN & BARCODE)
          =============================================================== */}
          {activeMenu === 'quick' && (
            <QuickLoanDesk
              books={books}
              members={members}
              loans={loans}
              onSubmitQuickLoan={onSubmitQuickLoan}
              isSubmitting={isSubmittingQuickLoan}
            />
          )}

          {/* ===============================================================
              MENU 3: ANTREAN PERSETUJUAN PEMINJAMAN
          =============================================================== */}
          {activeMenu === 'queue' && (
            <section className="parchment-card rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="border-b border-[#D4AF37]/20 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="font-cinzel text-xl font-bold text-[#F4E8C1] flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <span>Antrean Persetujuan Peminjaman</span>
                  </h2>
                  <p className="text-xs text-[#A89F91] mt-0.5">
                    Tinjau permintaan peminjaman fisik dari Siswa dan Guru. Menyetujui pinjaman otomatis mengurangi stok fisik di PostgreSQL.
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/35 w-fit">
                  {allPendingLoans.length} Permintaan Menunggu
                </span>
              </div>

              {allPendingLoans.length === 0 ? (
                <div className="p-12 rounded-xl text-center space-y-3 bg-black/30 border border-[#D4AF37]/15">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h3 className="font-cinzel text-lg font-bold text-[#F4E8C1]">
                    Seluruh Pengajuan Telah Ditinjau!
                  </h3>
                  <p className="text-xs text-[#A89F91] max-w-md mx-auto">
                    Tidak ada permintaan peminjaman baru yang menunggu persetujuan saat ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allPendingLoans.map((loan) => {
                    const book = books.find((b) => b.id === loan.bookId);
                    const isOutOfStock = book && book.availableStock < (loan.quantity || 1);

                    return (
                      <div
                        key={loan.id}
                        className="p-5 rounded-2xl bg-black/35 border border-[#D4AF37]/25 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-all hover:border-[#D4AF37]/50"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {loan.requesterRole === 'guru' ? (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/35">
                                GURU / MENTOR
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/35">
                                SISWA / SCHOLAR
                              </span>
                            )}
                            <span className="text-xs font-semibold text-[#F4E8C1]">
                              {loan.requesterName}
                            </span>
                            {loan.className && (
                              <span className="text-[11px] text-[#A89F91]">• {loan.className}</span>
                            )}
                            <span className="text-[11px] text-[#A89F91]">
                              • Diajukan: {loan.borrowedDate}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-2xl text-[#D4AF37]">{book?.coverRune || '✦'}</span>
                            <div>
                              <h3 className="font-cinzel font-bold text-base text-[#F4E8C1]">
                                {loan.bookTitle || book?.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-[#A89F91] mt-0.5">
                                <span>
                                  Jumlah:{' '}
                                  <strong className="text-amber-300 font-bold">
                                    {loan.quantity || 1} Eksemplar
                                  </strong>
                                </span>
                                <span>•</span>
                                <span>
                                  Stok Rak:{' '}
                                  <strong
                                    className={
                                      isOutOfStock
                                        ? 'text-rose-400 font-bold'
                                        : 'text-emerald-400 font-bold'
                                    }
                                  >
                                    {book?.availableStock ?? 0} Tersedia
                                  </strong>
                                </span>
                                <span>•</span>
                                <span>Lokasi: {book?.shelf || 'Rak Utama'}</span>
                              </div>
                            </div>
                          </div>

                          {loan.notes && (
                            <p className="text-xs text-[#C8BFA9] bg-[#12100E] p-2.5 rounded-xl border border-[#D4AF37]/15">
                              <strong className="text-[#F4E8C1]">Catatan:</strong> {loan.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-[#D4AF37]/15">
                          <button
                            type="button"
                            onClick={() => onRejectLoan(loan)}
                            className="px-4 py-2.5 rounded-xl text-xs font-cinzel font-bold bg-rose-500/15 text-rose-300 border border-rose-500/35 hover:bg-rose-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Tolak</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onApproveLoan(loan)}
                            disabled={isOutOfStock}
                            className={`px-5 py-2.5 rounded-xl font-cinzel font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer ${
                              !isOutOfStock
                                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 hover:bg-emerald-500/30'
                                : 'bg-white/5 text-[#A89F91] border border-white/10 cursor-not-allowed'
                            }`}
                          >
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <span>Setujui</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ===============================================================
              MENU 4: SIRKULASI PINJAMAN AKTIF
          =============================================================== */}
          {activeMenu === 'circulation' && (
            <section className="parchment-card rounded-2xl p-6 sm:p-8 space-y-5">
              <div className="border-b border-[#D4AF37]/20 pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="font-cinzel text-xl font-bold text-[#F4E8C1] flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-400" />
                    <span>Sirkulasi Pinjaman Aktif</span>
                  </h2>
                  <p className="text-xs text-[#A89F91] mt-0.5">
                    Daftar seluruh buku fisik yang sedang dipinjam Siswa maupun Guru lengkap dengan tenggat dan pengingat WhatsApp.
                  </p>
                </div>

                {/* Status Filter Pills (Warm Obsidian Wood) */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: `Semua (${allApprovedLoans.length})` },
                    { id: 'overdue', label: `Terlambat (${overdueLoans.length})` },
                    { id: 'due_soon', label: `Jatuh Tempo H-1 (${dueSoonLoans.length})` },
                    {
                      id: 'active',
                      label: `Aman (${
                        allApprovedLoans.length - overdueLoans.length - dueSoonLoans.length
                      })`
                    }
                  ].map((pill) => (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => setCirculationFilter(pill.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        circulationFilter === pill.id
                          ? 'bg-[#D4AF37]/20 text-[#F4E8C1] border-[#D4AF37]/60 font-bold'
                          : 'bg-[#12100E] text-[#A89F91] border-[#D4AF37]/20 hover:text-[#F4E8C1] hover:border-[#D4AF37]/40'
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>

              {overdueLoans.length > 0 && (
                <div className="p-3.5 rounded-xl bg-rose-950/25 border border-rose-500/35 text-xs text-rose-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>{overdueLoans.length} peminjaman melewati jatuh tempo</strong>
                    {dueSoonLoans.length > 0
                      ? ` dan ${dueSoonLoans.length} mendekati jatuh tempo (H-1).`
                      : '.'}{' '}
                    Klik tombol <strong>Ingatkan</strong> untuk mengirim notifikasi WhatsApp otomatis.
                  </span>
                </div>
              )}

              {filteredCirculationLoans.length === 0 ? (
                <p className="text-xs text-[#A89F91] py-10 text-center">
                  Tidak ada pinjaman aktif pada filter status ini.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#D4AF37]/20 text-[#D4AF37] font-cinzel text-[11px] uppercase">
                        <th className="py-3 px-3">Judul Buku</th>
                        <th className="py-3 px-3">Peminjam &amp; NISN</th>
                        <th className="py-3 px-3">Role &amp; Kelas</th>
                        <th className="py-3 px-3 text-center">Jumlah</th>
                        <th className="py-3 px-3">Tgl Pinjam</th>
                        <th className="py-3 px-3">Status Jatuh Tempo</th>
                        <th className="py-3 px-3 text-right">Aksi Pustakawan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D4AF37]/10">
                      {filteredCirculationLoans.map((loan) => {
                        const book = books.find((b) => b.id === loan.bookId);
                        const timing = getLoanTiming(loan);
                        return (
                          <tr
                            key={loan.id}
                            className="hover:bg-[#D4AF37]/[0.05] transition-colors"
                          >
                            <td className="py-3.5 px-3 font-semibold text-[#F4E8C1]">
                              <div className="flex items-center gap-2">
                                <span className="text-[#D4AF37]">{book?.coverRune || '✦'}</span>
                                <div>
                                  <span>{loan.bookTitle || book?.title}</span>
                                  <span className="block text-[10px] font-mono text-[#D4AF37]/80">
                                    {book?.kodeBuku || loan.kodeBuku || '-'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-[#F4E8C1]">
                              <span className="font-semibold block">{loan.requesterName}</span>
                              {(loan.borrowerNisn || loan.borrowerCard) && (
                                <span className="text-[10px] font-mono text-emerald-400">
                                  NISN: {loan.borrowerNisn || loan.borrowerCard}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  loan.requesterRole === 'guru'
                                    ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                {loan.requesterRole === 'guru' ? 'Guru' : 'Siswa'}
                              </span>
                              <span className="block text-[#A89F91] text-[10px] mt-1">
                                {loan.className}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-center font-bold text-[#F4E8C1]">
                              {loan.quantity || 1}
                            </td>
                            <td className="py-3.5 px-3 text-[#A89F91]">{loan.borrowedDate}</td>
                            <td className="py-3.5 px-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${timing.badgeClass}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${timing.dotClass}`} />
                                {timing.shortLabel}
                              </span>
                              <span className="block text-[10px] text-[#A89F91] mt-1">
                                Jatuh tempo {formatDateID(loan.dueDate)}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setReminderLoan(loan)}
                                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-cinzel font-bold bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/35 hover:bg-[#25D366]/25 transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  Ingatkan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onVerifyReturnLoan(loan)}
                                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-cinzel font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 hover:bg-emerald-500/25 transition-all cursor-pointer"
                                >
                                  Verifikasi Kembali
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ===============================================================
              MENU 5: PAKET KERANJANG KELAS
          =============================================================== */}
          {activeMenu === 'packages' &&
            packageLoanForm &&
            setPackageLoanForm &&
            onSubmitPackageLoan && (
              <section className="parchment-card rounded-2xl p-6 sm:p-8">
                <ClassPackageDesk
                  books={books}
                  form={packageLoanForm}
                  setForm={setPackageLoanForm}
                  onSubmit={onSubmitPackageLoan}
                  packageLoans={loans}
                  onCompletePackage={onCompletePackageLoan}
                  onInspectBook={onInspectBook}
                  showStockInfo={true}
                />
              </section>
            )}

          {/* ===============================================================
              MENU 6: DATA BUKU & KURIKULUM (SMP, SMA, SMK TKJ/BM/TKR) + TAMBAH MANUAL
          =============================================================== */}
          {activeMenu === 'inventory' && (
            <div className="space-y-6">
              {/* Collapsible Manual Book Registration Form */}
              {showAddBookForm && newBookForm && setNewBookForm && (
                <section className="parchment-card rounded-2xl p-6 sm:p-8 space-y-5 border-[#D4AF37]/40">
                  <div className="border-b border-[#D4AF37]/20 pb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-cinzel text-lg font-bold text-[#F4E8C1]">
                        Tambah Buku Kurikulum Baru (Manual)
                      </h2>
                      <p className="text-xs text-[#A89F91] mt-0.5">
                        Lengkapi atribut Jenjang (SMP/SMA/SMK/Umum), Kelas, Jurusan (TKJ, BM, TKR/TR, Semua Jurusan), stok fisik, serta tautan PDF opsional.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddBookForm(false)}
                      className="px-3 py-1.5 rounded-xl text-xs bg-black/40 text-[#A89F91] border border-[#D4AF37]/20 hover:text-[#F4E8C1] flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Tutup Form
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      onAddNewBook(e);
                      setShowAddBookForm(false);
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                          KODE BUKU (UNIK):
                        </label>
                        <input
                          type="text"
                          value={newBookForm.kodeBuku || ''}
                          onChange={(e) =>
                            setNewBookForm({ ...newBookForm, kodeBuku: e.target.value })
                          }
                          placeholder="Contoh: BK-TKJ-101"
                          className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                          JUDUL BUKU:
                        </label>
                        <input
                          type="text"
                          required
                          value={newBookForm.title}
                          onChange={(e) =>
                            setNewBookForm({ ...newBookForm, title: e.target.value })
                          }
                          placeholder="Contoh: Administrasi Infrastruktur Jaringan Kelas 11 TKJ"
                          className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                          PENULIS / PENGARANG:
                        </label>
                        <input
                          type="text"
                          required
                          value={newBookForm.author}
                          onChange={(e) =>
                            setNewBookForm({ ...newBookForm, author: e.target.value })
                          }
                          placeholder="Contoh: Ir. Faisal Akbar"
                          className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-cinzel text-emerald-400 mb-1">
                          JENJANG SEKOLAH:
                        </label>
                        <select
                          value={newBookForm.jenjang || 'SMK'}
                          onChange={(e) => {
                            const nextJenjang = e.target.value;
                            const nextKelas = (KELAS_BY_JENJANG[nextJenjang] || ['Semua'])[0];
                            setNewBookForm({
                              ...newBookForm,
                              jenjang: nextJenjang,
                              kelas: nextKelas,
                              jurusan: nextJenjang === 'SMK' ? 'TKJ' : 'Semua Jurusan'
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-emerald-500/35 text-[#F4E8C1] focus:outline-none focus:border-emerald-400"
                        >
                          {JENJANG_OPTIONS.map((j) => (
                            <option key={j} value={j}>
                              {j}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-cinzel text-emerald-400 mb-1">
                          TINGKAT KELAS:
                        </label>
                        <select
                          value={newBookForm.kelas || bookFormKelasOptions[0]}
                          onChange={(e) =>
                            setNewBookForm({ ...newBookForm, kelas: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-emerald-500/35 text-[#F4E8C1] focus:outline-none focus:border-emerald-400"
                        >
                          {bookFormKelasOptions.map((k) => (
                            <option key={k} value={k}>
                              {k === 'Semua' ? 'Semua Kelas' : `Kelas ${k}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-cinzel text-amber-300 mb-1">
                          JURUSAN (SMK):
                        </label>
                        <select
                          value={
                            (newBookForm.jenjang || 'SMK') === 'SMK'
                              ? newBookForm.jurusan || 'TKJ'
                              : 'Semua Jurusan'
                          }
                          disabled={(newBookForm.jenjang || 'SMK') !== 'SMK'}
                          onChange={(e) =>
                            setNewBookForm({ ...newBookForm, jurusan: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-amber-500/35 text-[#F4E8C1] focus:outline-none focus:border-amber-400 disabled:opacity-50"
                        >
                          {(newBookForm.jenjang || 'SMK') === 'SMK' ? (
                            SMK_JURUSAN_OPTIONS.map((jur) => (
                              <option key={jur} value={jur}>
                                {jur}
                              </option>
                            ))
                          ) : (
                            <option value="Semua Jurusan">Semua Jurusan</option>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-cinzel text-purple-300 mb-1">
                          JENIS BUKU:
                        </label>
                        <select
                          value={newBookForm.jenisBuku || 'Buku Paket Wajib'}
                          onChange={(e) =>
                            setNewBookForm({ ...newBookForm, jenisBuku: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-purple-500/35 text-[#F4E8C1] focus:outline-none focus:border-purple-400"
                        >
                          {JENIS_BUKU_OPTIONS.map((jb) => (
                            <option key={jb} value={jb}>
                              {jb}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                          PENERBIT:
                        </label>
                        <input
                          type="text"
                          value={newBookForm.publisher || ''}
                          onChange={(e) =>
                            setNewBookForm({ ...newBookForm, publisher: e.target.value })
                          }
                          placeholder="Erlangga, Andi Offset"
                          className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                          TAHUN TERBIT:
                        </label>
                        <input
                          type="number"
                          value={newBookForm.publicationYear || 2024}
                          onChange={(e) =>
                            setNewBookForm({
                              ...newBookForm,
                              publicationYear: Number(e.target.value)
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                          TOTAL STOK FISIK:
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={newBookForm.totalStock || 5}
                          onChange={(e) =>
                            setNewBookForm({
                              ...newBookForm,
                              totalStock: Number(e.target.value),
                              availableStock: Number(e.target.value)
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                          LOKASI RAK:
                        </label>
                        <input
                          type="text"
                          value={newBookForm.shelf}
                          onChange={(e) =>
                            setNewBookForm({ ...newBookForm, shelf: e.target.value })
                          }
                          placeholder="Rak SMK Kelas 10 • TKJ"
                          className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                          LINK COVER BUKU (OPSIONAL):
                        </label>
                        <input
                          type="url"
                          value={newBookForm.coverUrl || ''}
                          onChange={(e) =>
                            setNewBookForm({ ...newBookForm, coverUrl: e.target.value })
                          }
                          placeholder="URL gambar cover"
                          className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                          LINK PDF E-BOOK (OPSIONAL):
                        </label>
                        <input
                          type="url"
                          value={newBookForm.pdfUrl || ''}
                          onChange={(e) =>
                            setNewBookForm({ ...newBookForm, pdfUrl: e.target.value })
                          }
                          placeholder="URL file PDF Google Drive atau web langsung"
                          className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                        SINOPSIS SINGKAT:
                      </label>
                      <textarea
                        rows={2}
                        value={newBookForm.synopsis}
                        onChange={(e) =>
                          setNewBookForm({ ...newBookForm, synopsis: e.target.value })
                        }
                        placeholder="Deskripsi singkat kompetensi atau isi buku..."
                        className="w-full p-3 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddBookForm(false)}
                        className="px-4 py-2 rounded-xl text-xs text-[#A89F91] bg-black/40 border border-white/10 hover:text-[#F4E8C1]"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl font-cinzel font-bold text-xs bg-[#D4AF37]/20 text-[#F4E8C1] border border-[#D4AF37]/60 hover:bg-[#D4AF37]/30 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-[#D4AF37]" />
                        <span>Simpan ke PostgreSQL</span>
                      </button>
                    </div>
                  </form>
                </section>
              )}

              {/* Inventory Table Card */}
              <section className="parchment-card rounded-2xl p-6 sm:p-8 space-y-5">
                <div className="border-b border-[#D4AF37]/20 pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-cinzel text-xl font-bold text-[#F4E8C1] flex items-center gap-2">
                      <Database className="w-5 h-5 text-[#D4AF37]" />
                      <span>Data Buku, Stok Fisik &amp; Kurikulum ({filteredInventoryBooks.length})</span>
                    </h2>
                    <p className="text-xs text-[#A89F91] mt-0.5">
                      Kelola stok fisik rak, cetak label, serta klasifikasi SMP, SMA, dan SMK (TKJ, BM, TKR/TR).
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowAddBookForm((prev) => !prev)}
                      className="px-3.5 py-2 rounded-xl text-xs font-cinzel font-bold bg-[#12100E] text-[#F4E8C1] border border-[#D4AF37]/50 hover:bg-[#D4AF37]/15 hover:border-[#D4AF37] transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-[#D4AF37]" />
                      <span>Tambah Buku Manual</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectMenu('import_excel')}
                      className="px-3.5 py-2 rounded-xl text-xs font-cinzel font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 hover:bg-emerald-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Import Excel</span>
                    </button>
                  </div>
                </div>

                {/* Curriculum Quick Filter Bar + Search */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['All', 'SMP', 'SMA', 'SMK', 'Umum'].map((j) => (
                      <button
                        key={j}
                        type="button"
                        onClick={() => {
                          setInventoryJenjangFilter(j);
                          setInventoryJurusanFilter('All');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          inventoryJenjangFilter === j
                            ? 'bg-[#D4AF37]/20 text-[#F4E8C1] border-[#D4AF37]/60 font-bold'
                            : 'bg-[#12100E] text-[#A89F91] border-[#D4AF37]/20 hover:text-[#F4E8C1] hover:border-[#D4AF37]/40'
                        }`}
                      >
                        {j === 'All' ? 'Semua Jenjang' : j}
                      </button>
                    ))}

                    {inventoryJenjangFilter === 'SMK' && (
                      <div className="flex flex-wrap items-center gap-1.5 pl-2 ml-1 border-l border-[#D4AF37]/25">
                        {['All', ...SMK_JURUSAN_OPTIONS].map((jur) => (
                          <button
                            key={jur}
                            type="button"
                            onClick={() => setInventoryJurusanFilter(jur)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                              inventoryJurusanFilter === jur
                                ? 'bg-amber-500/20 text-[#F4E8C1] border-amber-400/60 font-bold'
                                : 'bg-[#12100E] text-[#C8BFA9] border-[#D4AF37]/20 hover:border-amber-400/45'
                            }`}
                          >
                            {jur === 'All' ? 'Semua Jurusan SMK' : jur}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative w-full lg:w-72">
                    <Search className="w-3.5 h-3.5 text-[#D4AF37] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={stockSearchQuery}
                      onChange={(e) => setStockSearchQuery(e.target.value)}
                      placeholder="Cari judul, kode, penulis, jurusan..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] placeholder-[#A89F91]/60 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#D4AF37]/20 text-[#D4AF37] font-cinzel text-[11px] uppercase">
                        <th className="py-3 px-3">Kode</th>
                        <th className="py-3 px-3">Judul Buku</th>
                        <th className="py-3 px-3">Kurikulum (Jenjang / Kelas / Jurusan)</th>
                        <th className="py-3 px-3">Jenis</th>
                        <th className="py-3 px-3 text-center">Total Stok</th>
                        <th className="py-3 px-3 text-center">Stok Rak</th>
                        <th className="py-3 px-3 text-center">Format</th>
                        <th className="py-3 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D4AF37]/10">
                      {filteredInventoryBooks.map((book) => {
                        const isAvailable = book.availableStock > 0;
                        return (
                          <tr
                            key={book.id}
                            className="hover:bg-[#D4AF37]/[0.05] transition-colors"
                          >
                            <td className="py-3.5 px-3 font-mono font-semibold text-[#D4AF37] whitespace-nowrap">
                              {book.kodeBuku || book.id}
                            </td>
                            <td className="py-3.5 px-3 font-semibold text-[#F4E8C1]">
                              <div className="flex items-center gap-2">
                                <span className="text-lg text-[#D4AF37]">{book.coverRune || '✦'}</span>
                                <div>
                                  <p className="font-cinzel font-bold">{book.title}</p>
                                  <p className="text-[10px] text-[#A89F91]">
                                    {book.author} • {book.publisher || 'Pustaka Sekolah'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                                  {book.jenjang || 'Umum'} • Kls {book.kelas || 'Semua'}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-900/35 text-amber-200 border border-amber-500/30">
                                  {book.jurusan || 'Semua Jurusan'}
                                </span>
                              </div>
                              <span className="text-[10px] text-[#A89F91] block mt-0.5">
                                {book.shelf}
                              </span>
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                {book.jenisBuku || 'Referensi'}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <div className="inline-flex items-center gap-2 bg-black/40 px-2 py-1 rounded-xl border border-white/10">
                                <button
                                  type="button"
                                  onClick={() => onAdjustStock(book.id, 'total', -1)}
                                  className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-[#A89F91] hover:text-[#F4E8C1] cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="font-cinzel font-bold text-sm text-[#F4E8C1] w-7 text-center">
                                  {book.totalStock}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onAdjustStock(book.id, 'total', 1)}
                                  className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-[#A89F91] hover:text-[#F4E8C1] cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <div className="inline-flex items-center gap-2 bg-black/40 px-2 py-1 rounded-xl border border-white/10">
                                <button
                                  type="button"
                                  onClick={() => onAdjustStock(book.id, 'available', -1)}
                                  className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-[#A89F91] hover:text-[#F4E8C1] cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span
                                  className={`font-cinzel font-bold text-sm w-7 text-center ${
                                    isAvailable ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  {book.availableStock}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onAdjustStock(book.id, 'available', 1)}
                                  className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-[#A89F91] hover:text-[#F4E8C1] cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              {book.pdfUrl ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/35">
                                  Ada PDF
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-800/70 text-[#A89F91] border border-[#D4AF37]/20">
                                  Fisik
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                {book.pdfUrl && onOpenPdfViewer && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenPdfViewer(book)}
                                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-cinzel font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/35 hover:bg-purple-500/25 transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <BookOpen className="w-3 h-3" />
                                    PDF
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => openLabelModal(book.id)}
                                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-cinzel font-semibold bg-[#D4AF37]/15 text-[#F4E8C1] border border-[#D4AF37]/35 hover:bg-[#D4AF37]/25 transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Printer className="w-3 h-3 text-[#D4AF37]" />
                                  Label
                                </button>
                                {onInspectBook && (
                                  <button
                                    type="button"
                                    onClick={() => onInspectBook(book.id)}
                                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-black/40 text-[#F4E8C1] border border-white/10 hover:border-[#D4AF37]/40 transition-all flex items-center gap-1 cursor-pointer"
                                    title="Buka Detail & Moderasi Buku"
                                  >
                                    <Eye className="w-3 h-3 text-[#D4AF37]" />
                                    Detail
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ===============================================================
              MENU 7: IMPORT EXCEL MASSAL
          =============================================================== */}
          {activeMenu === 'import_excel' && (
            <section className="parchment-card rounded-2xl p-6 sm:p-8 space-y-6">
              <ExcelImportSection
                existingBooks={books}
                existingMembers={members}
                onImportBooks={onImportBulkBooks}
                onImportMembers={onImportBulkMembers}
                isProcessing={isImporting}
              />
            </section>
          )}

          {/* ===============================================================
              MENU 8: CETAK LABEL BARCODE & NOMOR PUNGGUNG (DDC)
          =============================================================== */}
          {activeMenu === 'labels' && (
            <div className="space-y-6">
              <section className="parchment-card rounded-2xl p-6 sm:p-8 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#D4AF37]/20 pb-4">
                  <div>
                    <h2 className="font-cinzel text-xl font-bold text-[#F4E8C1] flex items-center gap-2">
                      <Printer className="w-5 h-5 text-[#D4AF37]" />
                      <span>Studio Cetak Label Barcode &amp; Nomor Punggung (DDC)</span>
                    </h2>
                    <p className="text-xs text-[#A89F91] mt-1">
                      Generate dokumen PDF siap cetak untuk stiker Tom &amp; Jerry 103 maupun kertas label A4 berisi Barcode CODE128, Kode Buku, Nomor Panggil DDC, Judul Singkat, dan Lokasi Rak.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openLabelModal(null)}
                    className="px-5 py-2.5 rounded-xl font-cinzel font-bold text-xs bg-[#12100E] text-[#F4E8C1] border border-[#D4AF37]/55 hover:bg-[#D4AF37]/15 hover:border-[#D4AF37] hover:shadow-[0_0_16px_rgba(212,175,55,0.18)] flex items-center gap-2 transition-all cursor-pointer shrink-0"
                  >
                    <Printer className="w-4 h-4 text-[#D4AF37]" />
                    <span>Buka Generator PDF Label Massal</span>
                  </button>
                </div>

                {/* Supported Paper Formats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      name: 'Tom & Jerry No. 103',
                      spec: '38 × 21 mm • 65 label / lembar A4',
                      note: 'Ideal untuk punggung buku & stiker barcode tipis'
                    },
                    {
                      name: 'Label Stiker A4 (3 × 8)',
                      spec: '63.5 × 33.9 mm • 24 label / lembar A4',
                      note: 'Seimbang untuk kode barcode, DDC, judul & rak'
                    },
                    {
                      name: 'Label Stiker A4 (2 × 6)',
                      spec: '90 × 42 mm • 12 label / lembar A4',
                      note: 'Ukuran besar mudah dipindai kamera HP / scanner'
                    }
                  ].map((fmt) => (
                    <div
                      key={fmt.name}
                      className="p-4 rounded-xl bg-black/35 border border-[#D4AF37]/20 space-y-1"
                    >
                      <p className="font-cinzel font-bold text-sm text-[#F4E8C1]">{fmt.name}</p>
                      <p className="text-xs font-mono text-[#D4AF37]">{fmt.spec}</p>
                      <p className="text-[11px] text-[#A89F91]">{fmt.note}</p>
                    </div>
                  ))}
                </div>

                {/* Quick Per-Book Label Table */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <span className="text-xs font-cinzel font-bold text-[#F4E8C1]">
                    Pilih Cepat Buku untuk Cetak Label ({filteredLabelBooks.length} Koleksi)
                  </span>
                  <div className="relative sm:w-72">
                    <Search className="w-3.5 h-3.5 text-[#D4AF37] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={labelSearchQuery}
                      onChange={(e) => setLabelSearchQuery(e.target.value)}
                      placeholder="Cari kode buku, DDC, judul, rak..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] placeholder-[#A89F91]/60 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#D4AF37]/20 text-[#D4AF37] font-cinzel text-[11px] uppercase">
                        <th className="py-3 px-3">Kode Barcode</th>
                        <th className="py-3 px-3">Call Number (DDC)</th>
                        <th className="py-3 px-3">Judul &amp; Penulis</th>
                        <th className="py-3 px-3">Lokasi Rak</th>
                        <th className="py-3 px-3 text-center">Stok Fisik</th>
                        <th className="py-3 px-3 text-right">Cetak</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D4AF37]/10">
                      {filteredLabelBooks.map((book) => (
                        <tr
                          key={book.id}
                          className="hover:bg-[#D4AF37]/[0.05] transition-colors"
                        >
                          <td className="py-3 px-3 font-mono font-bold text-[#D4AF37]">
                            {book.kodeBuku}
                          </td>
                          <td className="py-3 px-3 font-mono text-emerald-400">
                            {book.ddc || '000'} / {book.cutter || '---'}
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-semibold text-[#F4E8C1]">{book.title}</p>
                            <p className="text-[10px] text-[#A89F91]">{book.author}</p>
                          </td>
                          <td className="py-3 px-3 text-[#C8BFA9]">{book.shelf}</td>
                          <td className="py-3 px-3 text-center font-bold text-[#F4E8C1]">
                            {book.totalStock} eks
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => openLabelModal(book.id)}
                              className="px-3 py-1.5 rounded-lg text-[11px] font-cinzel font-bold bg-[#12100E] text-[#F4E8C1] border border-[#D4AF37]/40 hover:bg-[#D4AF37]/20 hover:border-[#D4AF37] transition-all inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5 text-[#D4AF37]" />
                              <span>Cetak Label</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ===============================================================
              MENU 9: DATA SISWA & GURU (NISN)
          =============================================================== */}
          {activeMenu === 'members' && (
            <div className="space-y-6">
              <section className="parchment-card rounded-2xl p-6 sm:p-8 space-y-5">
                <div className="border-b border-[#D4AF37]/20 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-cinzel text-xl font-bold text-[#F4E8C1] flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-[#D4AF37]" />
                      <span>Daftarkan Akun Siswa / Guru Baru (Username &amp; NISN)</span>
                    </h2>
                    <p className="text-xs text-[#A89F91] mt-0.5">
                      Login murni menggunakan Username &amp; Password tanpa email. NISN disimpan sebagai teks agar angka nol di depan tidak hilang.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectMenu('import_excel')}
                    className="px-3.5 py-2 rounded-xl text-xs font-cinzel font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 hover:bg-emerald-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Import Massal dari Excel</span>
                  </button>
                </div>

                {memberFormFeedback && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-xs text-emerald-300">
                    {memberFormFeedback}
                  </div>
                )}

                <form onSubmit={handleCreateMemberSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div>
                      <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                        PERAN AKUN:
                      </label>
                      <select
                        value={newMemberForm.role}
                        onChange={(e) =>
                          setNewMemberForm({ ...newMemberForm, role: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                      >
                        <option value="siswa">Siswa (Pelajar)</option>
                        <option value="guru">Guru (Pengampu)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                        {newMemberForm.role === 'guru'
                          ? 'NIP / KODE GURU (OPSIONAL):'
                          : 'NISN (TEKS 10 DIGIT):'}
                      </label>
                      <div className="relative">
                        <Hash className="w-3.5 h-3.5 text-[#A89F91] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required={newMemberForm.role === 'siswa'}
                          value={newMemberForm.nisn}
                          onChange={(e) =>
                            setNewMemberForm({ ...newMemberForm, nisn: e.target.value })
                          }
                          placeholder={
                            newMemberForm.role === 'guru'
                              ? 'Contoh: GURU-2026-03'
                              : 'Contoh: 0081234567'
                          }
                          className="w-full pl-8 pr-3 py-2 rounded-xl text-xs font-mono bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                        NAMA LENGKAP:
                      </label>
                      <input
                        type="text"
                        required
                        value={newMemberForm.name}
                        onChange={(e) =>
                          setNewMemberForm({ ...newMemberForm, name: e.target.value })
                        }
                        placeholder="Nama Lengkap"
                        className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                        USERNAME LOGIN:
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-[#A89F91] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={newMemberForm.username}
                          onChange={(e) =>
                            setNewMemberForm({ ...newMemberForm, username: e.target.value })
                          }
                          placeholder="contoh: reza.tkj10"
                          className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                        PASSWORD LOGIN:
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-[#A89F91] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          required
                          value={newMemberForm.password}
                          onChange={(e) =>
                            setNewMemberForm({ ...newMemberForm, password: e.target.value })
                          }
                          placeholder="Minimal 4 karakter"
                          className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                        JENJANG SEKOLAH:
                      </label>
                      <select
                        value={newMemberForm.jenjang}
                        onChange={(e) => {
                          const nextJenjang = e.target.value;
                          const nextKelas = (KELAS_BY_JENJANG[nextJenjang] || ['10'])[0];
                          setNewMemberForm({
                            ...newMemberForm,
                            jenjang: nextJenjang,
                            kelas: nextKelas,
                            jurusan: nextJenjang === 'SMK' ? 'TKJ' : 'Semua Jurusan'
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                      >
                        <option value="SMP">SMP</option>
                        <option value="SMA">SMA</option>
                        <option value="SMK">SMK</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                        TINGKAT KELAS:
                      </label>
                      <select
                        value={newMemberForm.kelas}
                        onChange={(e) =>
                          setNewMemberForm({ ...newMemberForm, kelas: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                      >
                        {memberFormKelasOptions.map((kls) => (
                          <option key={kls} value={kls}>
                            Kelas {kls}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                        JURUSAN (KHUSUS SMK):
                      </label>
                      <select
                        value={
                          newMemberForm.jenjang === 'SMK'
                            ? newMemberForm.jurusan
                            : 'Semua Jurusan'
                        }
                        disabled={newMemberForm.jenjang !== 'SMK'}
                        onChange={(e) =>
                          setNewMemberForm({ ...newMemberForm, jurusan: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37] disabled:opacity-50"
                      >
                        {newMemberForm.jenjang === 'SMK' ? (
                          SMK_JURUSAN_OPTIONS.map((jur) => (
                            <option key={jur} value={jur}>
                              {jur}
                            </option>
                          ))
                        ) : (
                          <option value="Semua Jurusan">Semua Jurusan</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl font-cinzel font-bold text-xs bg-[#D4AF37]/20 text-[#F4E8C1] border border-[#D4AF37]/55 hover:bg-[#D4AF37]/30 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4 text-[#D4AF37]" />
                      <span>
                        {newMemberForm.role === 'guru' ? 'Simpan Akun Guru' : 'Simpan Akun Siswa'}
                      </span>
                    </button>
                  </div>
                </form>
              </section>

              <section className="parchment-card rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D4AF37]/20 pb-4">
                  <div>
                    <h3 className="font-cinzel text-lg font-bold text-[#F4E8C1]">
                      Direktori Siswa &amp; Guru Terdaftar ({filteredMembers.length})
                    </h3>
                    <p className="text-xs text-[#A89F91]">
                      Seluruh NISN bertipe teks (`TEXT`) menjaga angka nol di awal dan siap dipindai di Transaksi Kilat.
                    </p>
                  </div>
                  <div className="relative sm:w-72">
                    <Search className="w-3.5 h-3.5 text-[#D4AF37] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      placeholder="Cari NISN, username, nama, jurusan..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] placeholder-[#A89F91]/60 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#D4AF37]/20 text-[#D4AF37] font-cinzel text-[11px] uppercase">
                        <th className="py-3 px-3">NISN / Kode</th>
                        <th className="py-3 px-3">Nama Lengkap</th>
                        <th className="py-3 px-3">Username</th>
                        <th className="py-3 px-3">Peran</th>
                        <th className="py-3 px-3">Jenjang</th>
                        <th className="py-3 px-3">Kelas</th>
                        <th className="py-3 px-3">Jurusan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D4AF37]/10">
                      {filteredMembers.map((m) => (
                        <tr key={m.id} className="hover:bg-[#D4AF37]/[0.05] transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                            {m.nisn || m.cardCode || '-'}
                          </td>
                          <td className="py-3 px-3 font-semibold text-[#F4E8C1]">{m.name}</td>
                          <td className="py-3 px-3 font-mono text-[#D4AF37]">
                            @{m.username || m.id}
                          </td>
                          <td className="py-3 px-3 uppercase text-[10px]">
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                m.role === 'guru'
                                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                  : m.role === 'admin'
                                  ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/35'
                                  : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {m.role || 'siswa'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-[#F4E8C1]">
                            {m.jenjang || 'SMK'}
                          </td>
                          <td className="py-3 px-3 text-[#A89F91]">
                            {m.kelas ? `Kelas ${m.kelas}` : m.level || '-'}
                          </td>
                          <td className="py-3 px-3 text-amber-300">
                            {m.jurusan || 'Semua Jurusan'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ===============================================================
              MENU 10: LAPORAN & STATISTIK BULANAN
          =============================================================== */}
          {activeMenu === 'reports' && (
            <LibraryReportsView
              books={books}
              loans={loans}
              onOpenReminder={(loan) => setReminderLoan(loan)}
            />
          )}

          {/* ===============================================================
              MENU 11: MODERASI ULASAN & RATING (PUSAT MODERASI ADMIN)
          =============================================================== */}
          {activeMenu === 'moderation' && (
            <div className="space-y-6">
              {/* Moderation KPI Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="parchment-card rounded-2xl p-4">
                  <span className="text-xs text-[#A89F91]">Total Ulasan Pembaca</span>
                  <p className="font-cinzel text-2xl font-bold text-[#F4E8C1] mt-1">
                    {allReviewsFlat.length}
                  </p>
                </div>
                <div className="parchment-card rounded-2xl p-4">
                  <span className="text-xs text-[#A89F91]">Rata-Rata Rating Koleksi</span>
                  <p className="font-cinzel text-2xl font-bold text-[#D4AF37] mt-1 flex items-center gap-1.5">
                    <span>
                      {averageCollectionRating > 0 ? averageCollectionRating.toFixed(1) : '0.0'}
                    </span>
                    <Star className="w-5 h-5 fill-[#D4AF37] text-[#D4AF37]" />
                  </p>
                </div>
                <div className="parchment-card rounded-2xl p-4 border-rose-500/30">
                  <span className="text-xs text-[#A89F91]">Rating Rendah (1–2★)</span>
                  <p className="font-cinzel text-2xl font-bold text-rose-400 mt-1">
                    {lowRatingReviewsCount}
                  </p>
                </div>
                <div className="parchment-card rounded-2xl p-4">
                  <span className="text-xs text-[#A89F91]">Rating Dimoderasi/Dihapus</span>
                  <p className="font-cinzel text-2xl font-bold text-amber-400 mt-1">
                    {clearedRatingReviewsCount}
                  </p>
                </div>
              </div>

              <section className="parchment-card rounded-2xl p-6 sm:p-8 space-y-5">
                <div className="border-b border-[#D4AF37]/20 pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-cinzel text-xl font-bold text-[#F4E8C1] flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-rose-400" />
                      <span>Pusat Moderasi Komentar &amp; Rating Buku</span>
                    </h2>
                    <p className="text-xs text-[#A89F91] mt-0.5">
                      Hapus komentar hate speech/spam secara permanen dari database PostgreSQL atau reset rating tidak wajar agar rata-rata rating buku selalu akurat.
                    </p>
                  </div>

                  {onOpenCatalog && (
                    <button
                      type="button"
                      onClick={onOpenCatalog}
                      className="px-3.5 py-2 rounded-xl text-xs font-cinzel font-bold bg-[#12100E] text-[#F4E8C1] border border-[#D4AF37]/40 hover:bg-[#D4AF37]/15 hover:border-[#D4AF37] transition-all flex items-center gap-1.5 w-fit cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Moderasi di Katalog</span>
                    </button>
                  )}
                </div>

                {/* Filters & Per-Book Reset Bar */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                  <div className="lg:col-span-4 relative">
                    <Search className="w-3.5 h-3.5 text-[#D4AF37] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={moderationSearch}
                      onChange={(e) => setModerationSearch(e.target.value)}
                      placeholder="Cari isi komentar, nama pengguna, judul buku..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] placeholder-[#A89F91]/60 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="lg:col-span-4">
                    <select
                      value={moderationBookFilter}
                      onChange={(e) => {
                        setModerationBookFilter(e.target.value);
                        setModerationConfirm(null);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="all">Semua Buku ({books.length} Judul)</option>
                      {books.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title} ({(b.reviews || []).length} ulasan •{' '}
                          {Number(b.rating) > 0 ? `${Number(b.rating).toFixed(1)}★` : '0.0★'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="lg:col-span-4 flex flex-wrap items-center justify-end gap-1.5">
                    {[
                      { id: 'all', label: 'Semua' },
                      { id: 'low', label: `Rating 1–2★ (${lowRatingReviewsCount})` },
                      { id: 'cleared', label: `Rating Dihapus (${clearedRatingReviewsCount})` }
                    ].map((pill) => (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => setModerationFilter(pill.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          moderationFilter === pill.id
                            ? 'bg-[#D4AF37]/20 text-[#F4E8C1] border-[#D4AF37]/60 font-bold'
                            : 'bg-[#12100E] text-[#A89F91] border-[#D4AF37]/20 hover:text-[#F4E8C1] hover:border-[#D4AF37]/40'
                        }`}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Book Bulk Reset Controls */}
                {selectedModerationBook && onResetBookReviews && (
                  <div className="p-4 rounded-xl bg-rose-950/25 border border-rose-500/35 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs">
                      <span className="font-cinzel font-bold text-[#F4E8C1] block">
                        Kontrol Reset Rating Buku: &ldquo;{selectedModerationBook.title}&rdquo;
                      </span>
                      <span className="text-[#A89F91]">
                        Rating saat ini:{' '}
                        <strong className="text-[#D4AF37]">
                          {Number(selectedModerationBook.rating) > 0
                            ? `${Number(selectedModerationBook.rating).toFixed(1)} / 5.0`
                            : 'Belum ada rating (0.0)'}
                        </strong>{' '}
                        • {(selectedModerationBook.reviews || []).length} komentar tercatat
                      </span>
                    </div>

                    {moderationConfirm?.type === 'book_reset_ratings' ||
                    moderationConfirm?.type === 'book_reset_all' ? (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-rose-200 font-medium">
                          {moderationConfirm.type === 'book_reset_ratings'
                            ? 'Reset semua angka rating buku ini ke 0.0?'
                            : 'Hapus permanen SEMUA ulasan & reset rating ke 0.0?'}
                        </span>
                        <button
                          type="button"
                          disabled={isModeratingReview}
                          onClick={() => setModerationConfirm(null)}
                          className="px-2.5 py-1 rounded-lg bg-black/40 text-[#F4E8C1] border border-white/10"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          disabled={isModeratingReview}
                          onClick={async () => {
                            await onResetBookReviews(
                              selectedModerationBook,
                              moderationConfirm.type === 'book_reset_ratings'
                                ? 'ratings_only'
                                : 'all'
                            );
                            setModerationConfirm(null);
                          }}
                          className="px-3 py-1 rounded-lg bg-rose-600/80 text-white font-bold hover:bg-rose-500 disabled:opacity-50"
                        >
                          {isModeratingReview ? 'Memproses...' : 'Ya, Jalankan'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setModerationConfirm({ type: 'book_reset_ratings' })}
                          className="px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold bg-amber-500/15 text-amber-300 border border-amber-500/35 hover:bg-amber-500/25 flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset Rating Buku</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setModerationConfirm({ type: 'book_reset_all' })}
                          className="px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold bg-rose-500/15 text-rose-300 border border-rose-500/35 hover:bg-rose-500/25 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Semua Ulasan</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Moderation Feed */}
                {filteredModerationReviews.length === 0 ? (
                  <div className="p-10 rounded-xl bg-black/30 border border-[#D4AF37]/15 text-center space-y-2">
                    <CheckCircle className="w-9 h-9 text-emerald-400 mx-auto" />
                    <p className="font-cinzel font-bold text-sm text-[#F4E8C1]">
                      Tidak Ada Ulasan yang Cocok dengan Filter
                    </p>
                    <p className="text-xs text-[#A89F91]">
                      Ubah kata kunci pencarian atau pilih filter &ldquo;Semua&rdquo;.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredModerationReviews.map((rev) => {
                      const isLow = rev.rating !== null && Number(rev.rating) <= 2;
                      const confirmingDelete =
                        moderationConfirm?.type === 'delete_rev' &&
                        moderationConfirm?.id === rev.id;
                      const confirmingClear =
                        moderationConfirm?.type === 'clear_rev' &&
                        moderationConfirm?.id === rev.id;

                      return (
                        <div
                          key={rev.id}
                          className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
                            isLow
                              ? 'bg-rose-950/20 border-rose-500/35'
                              : 'bg-black/35 border-[#D4AF37]/15 hover:border-[#D4AF37]/35'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="px-2 py-0.5 rounded-lg bg-[#D4AF37]/15 text-[#F4E8C1] border border-[#D4AF37]/30 font-cinzel font-bold">
                                {rev.bookTitle}
                              </span>
                              <span className="text-[11px] font-mono text-[#D4AF37]">
                                {rev.bookRating > 0
                                  ? `Avg ${rev.bookRating.toFixed(1)}★`
                                  : 'Avg 0.0★'}
                              </span>
                              <span className="text-[#A89F91]">•</span>
                              <span className="font-semibold text-[#F4E8C1]">{rev.user}</span>
                              {rev.username && (
                                <span className="text-[10px] font-mono text-[#A89F91]">
                                  @{rev.username}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                              {rev.rating !== null && rev.rating !== undefined ? (
                                <span
                                  className={`font-bold ${
                                    isLow ? 'text-rose-400' : 'text-[#D4AF37]'
                                  }`}
                                >
                                  {'★'.repeat(Math.max(1, Math.min(5, Number(rev.rating))))}
                                  <span className="text-white/15">
                                    {'★'.repeat(Math.max(0, 5 - Number(rev.rating)))}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-[10px] italic px-2 py-0.5 rounded bg-black/40 text-[#A89F91] border border-white/10">
                                  Rating dihapus Admin
                                </span>
                              )}
                              <span className="text-[11px] text-[#A89F91]">{rev.date}</span>
                            </div>
                          </div>

                          <p className="text-xs sm:text-sm text-[#F4E8C1]/90 leading-relaxed">
                            {rev.comment}
                          </p>

                          <div className="pt-2 border-t border-[#D4AF37]/15 flex flex-wrap items-center justify-between gap-2">
                            {confirmingDelete || confirmingClear ? (
                              <div className="w-full flex flex-wrap items-center justify-between gap-2 bg-rose-950/40 border border-rose-500/40 rounded-xl px-3 py-2 text-xs">
                                <span className="text-rose-200">
                                  {confirmingDelete
                                    ? 'Hapus permanen komentar ini dari PostgreSQL & hitung ulang rating buku?'
                                    : 'Hapus angka rating tidak wajar pada ulasan ini & hitung ulang rata-rata?'}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={isModeratingReview}
                                    onClick={() => setModerationConfirm(null)}
                                    className="px-2.5 py-1 rounded-lg bg-black/40 text-[#F4E8C1] border border-white/10"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isModeratingReview}
                                    onClick={async () => {
                                      if (confirmingDelete) {
                                        await onDeleteReview?.(rev);
                                      } else {
                                        await onClearReviewRating?.(rev);
                                      }
                                      setModerationConfirm(null);
                                    }}
                                    className="px-3 py-1 rounded-lg bg-rose-600/80 text-white font-bold hover:bg-rose-500 disabled:opacity-50"
                                  >
                                    {isModeratingReview ? 'Memproses...' : 'Ya, Konfirmasi'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onInspectBook?.(rev.bookId)}
                                  className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Buka Detail Buku &amp; PDF</span>
                                </button>

                                <div className="flex flex-wrap items-center gap-2">
                                  {rev.rating !== null && rev.rating !== undefined && (
                                    <button
                                      type="button"
                                      disabled={isModeratingReview}
                                      onClick={() =>
                                        setModerationConfirm({ type: 'clear_rev', id: rev.id })
                                      }
                                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/35 hover:bg-amber-500/25 transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      <span>Hapus Rating</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    disabled={isModeratingReview}
                                    onClick={() =>
                                      setModerationConfirm({ type: 'delete_rev', id: rev.id })
                                    }
                                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/35 hover:bg-rose-500/25 transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Hapus Komentar</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: PRINTABLE BARCODE & SHELF LABELS */}
      <BarcodeLabelModal
        isOpen={isLabelModalOpen}
        onClose={() => {
          setIsLabelModalOpen(false);
          setLabelInitialBookId(null);
        }}
        books={books}
        initialBookId={labelInitialBookId}
      />

      {/* MODAL: WHATSAPP DUE-DATE REMINDER */}
      <WhatsAppReminderModal
        isOpen={Boolean(reminderLoan)}
        onClose={() => setReminderLoan(null)}
        loan={reminderLoan}
        book={reminderBook}
        member={reminderMember}
      />
    </div>
  );
}
