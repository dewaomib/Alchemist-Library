import React, { useMemo, useState } from 'react';
import {
  Database,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Clock,
  BookOpen,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Layers,
  FileSpreadsheet,
  ScanLine,
  Printer,
  BarChart3,
  MessageCircle,
  Users,
  UserPlus,
  Hash,
  User,
  Lock
} from 'lucide-react';
import ExcelImportSection from './ExcelImportSection';
import QuickLoanDesk from './QuickLoanDesk';
import BarcodeLabelModal from './BarcodeLabelModal';
import LibraryReportsView from './LibraryReportsView';
import WhatsAppReminderModal from './WhatsAppReminderModal';
import { formatDateID, getLoanTiming, sortLoansByUrgency } from '../utils/loanUtils';
import {
  JENJANG_OPTIONS,
  KELAS_BY_JENJANG,
  SMK_JURUSAN_OPTIONS,
  JENIS_BUKU_OPTIONS,
  normalizeNisn
} from '../utils/libraryUtils';

export default function ArchivistsChamberView({
  currentUser,
  books,
  loans,
  members = [],
  onRegisterMember,
  onImportBulkMembers,
  allPendingLoans,
  allApprovedLoans,
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
  onOpenPdfViewer
}) {
  const [activeSubTab, setActiveSubTab] = useState('quick'); // 'quick' | 'queue' | 'circulation' | 'inventory' | 'members' | 'import_excel' | 'reports' | 'inscribe'
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [labelInitialBookId, setLabelInitialBookId] = useState(null);
  const [reminderLoan, setReminderLoan] = useState(null);

  // Form Manajemen Akun Siswa/Guru di Dashboard Admin (Hanya Username & Password + NISN, TANPA EMAIL)
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

  const filteredInventoryBooks = books.filter((b) => {
    const q = stockSearchQuery.toLowerCase();
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

  const filteredMembers = members.filter((m) => {
    const q = memberSearchQuery.toLowerCase();
    if (!q) return true;
    return (
      (m.nisn || '').toLowerCase().includes(q) ||
      (m.name || '').toLowerCase().includes(q) ||
      (m.username || '').toLowerCase().includes(q) ||
      (m.jenjang || '').toLowerCase().includes(q) ||
      (m.kelas || '').toLowerCase().includes(q) ||
      (m.jurusan || '').toLowerCase().includes(q)
    );
  });

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

    if (!cleanNisn || !cleanUser || !cleanPass || !cleanName) {
      setMemberFormFeedback('NISN, Nama Lengkap, Username, dan Password wajib diisi.');
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
      color: newMemberForm.role === 'guru' ? '#38BDF8' : '#10B981'
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
    setMemberFormFeedback(`Akun @${cleanUser} (NISN: ${cleanNisn}) berhasil ditambahkan!`);
  };

  const bookFormKelasOptions = KELAS_BY_JENJANG[newBookForm.jenjang || 'SMK'] || ['10', '11', '12'];
  const memberFormKelasOptions = KELAS_BY_JENJANG[newMemberForm.jenjang || 'SMK'] || ['10', '11', '12'];

  return (
    <div className="space-y-8">
      {/* ADMIN HEADER & TELEMETRY */}
      <section
        className="rounded-2xl p-6 sm:p-8 border relative overflow-hidden"
        style={{
          background:
            'radial-gradient(circle at 90% 10%, rgba(212, 175, 55, 0.22), rgba(139, 92, 246, 0.12) 45%, #1E1916 90%)',
          borderColor: '#D4AF37'
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-[#12100E] border-2 border-[#D4AF37] flex flex-col items-center justify-center shrink-0 shadow-xl">
              <ShieldCheck className="w-10 h-10 text-[#D4AF37]" />
              <span className="text-[10px] font-cinzel font-bold text-amber-300 mt-0.5">
                CURATOR
              </span>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-cinzel bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ARCHIVIST&apos;S CHAMBER • PANEL PENGURUS PUSTAKA</span>
              </div>
              <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#F4E8C1]">
                {currentUser?.name || 'Administrator Perpustakaan'}
              </h1>
              <p className="text-xs text-[#A89F91]">
                Pusat Kontrol Sirkulasi Scan NISN, Kurikulum SMP/SMA/SMK, Import Excel Massal, &amp; Manajemen Akun
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('quick')}
                  className="px-3 py-2 rounded-xl text-[11px] font-cinzel font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/45 hover:bg-emerald-500/30 transition-colors flex items-center gap-1.5"
                >
                  <ScanLine className="w-3.5 h-3.5" />
                  Scan NISN &amp; Buku
                </button>
                <button
                  type="button"
                  onClick={() => openLabelModal(null)}
                  className="px-3 py-2 rounded-xl text-[11px] font-cinzel font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/45 hover:bg-[#D4AF37]/25 transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Label Rak
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('reports')}
                  className="px-3 py-2 rounded-xl text-[11px] font-cinzel font-bold bg-purple-500/15 text-purple-300 border border-purple-500/45 hover:bg-purple-500/25 transition-colors flex items-center gap-1.5"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Laporan Bulanan
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[11px] text-[#A89F91] block">Total Koleksi</span>
              <span className="font-cinzel text-xl font-bold text-[#D4AF37] block mt-0.5">
                {books.length}
              </span>
              <span className="text-[9px] text-[#A89F91]">Judul Buku</span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[11px] text-[#A89F91] block">Antrean Pinjam</span>
              <span className="font-cinzel text-xl font-bold text-amber-400 block mt-0.5">
                {allPendingLoans.length}
              </span>
              <span className="text-[9px] text-amber-400/80">Perlu Verifikasi</span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[11px] text-[#A89F91] block">Dipinjam Aktif</span>
              <span className="font-cinzel text-xl font-bold text-emerald-400 block mt-0.5">
                {allApprovedLoans.length}
              </span>
              <span className="text-[9px] text-emerald-400/80">Sirkulasi</span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-rose-500/25">
              <span className="text-[11px] text-[#A89F91] block">Terlambat</span>
              <span className="font-cinzel text-xl font-bold text-rose-400 block mt-0.5">
                {overdueLoans.length}
              </span>
              <span className="text-[9px] text-rose-400/80">Perlu Pengingat</span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[11px] text-[#A89F91] block">Data Siswa</span>
              <span className="font-cinzel text-xl font-bold text-sky-400 block mt-0.5">
                {members.length}
              </span>
              <span className="text-[9px] text-[#A89F91]">NISN Terdaftar</span>
            </div>
          </div>
        </div>
      </section>

      {/* ADMIN SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-[#D4AF37]/20 pb-2">
        <button
          onClick={() => setActiveSubTab('quick')}
          className={`px-4 py-2.5 rounded-xl font-cinzel text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'quick'
              ? 'bg-gradient-to-r from-emerald-500 to-[#D4AF37] text-[#12100E] shadow-lg'
              : 'bg-[#1E1916] text-emerald-300 hover:text-emerald-200 border border-emerald-500/30'
          }`}
        >
          <ScanLine className="w-4 h-4" />
          <span>Transaksi Kilat (Scan NISN)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('queue')}
          className={`px-4 py-2.5 rounded-xl font-cinzel text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'queue'
              ? 'bg-[#D4AF37] text-[#12100E] shadow-lg'
              : 'bg-[#1E1916] text-[#A89F91] hover:text-[#F4E8C1] border border-white/10'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Antrean Persetujuan ({allPendingLoans.length})</span>
          {allPendingLoans.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('circulation')}
          className={`px-4 py-2.5 rounded-xl font-cinzel text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'circulation'
              ? 'bg-[#D4AF37] text-[#12100E] shadow-lg'
              : 'bg-[#1E1916] text-[#A89F91] hover:text-[#F4E8C1] border border-white/10'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Sirkulasi Pinjaman ({allApprovedLoans.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`px-4 py-2.5 rounded-xl font-cinzel text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'inventory'
              ? 'bg-[#D4AF37] text-[#12100E] shadow-lg'
              : 'bg-[#1E1916] text-[#A89F91] hover:text-[#F4E8C1] border border-white/10'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Stok &amp; Kurikulum ({books.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('members')}
          className={`px-4 py-2.5 rounded-xl font-cinzel text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'members'
              ? 'bg-sky-500 text-[#12100E] shadow-lg'
              : 'bg-[#1E1916] text-sky-300 hover:text-sky-200 border border-sky-500/30'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Akun Siswa &amp; NISN ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('import_excel')}
          className={`px-4 py-2.5 rounded-xl font-cinzel text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'import_excel'
              ? 'bg-gradient-to-r from-emerald-500 to-amber-500 text-[#12100E] shadow-lg'
              : 'bg-[#1E1916] text-emerald-400 hover:text-emerald-300 border border-emerald-500/30'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Import Excel (Buku &amp; Siswa)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reports')}
          className={`px-4 py-2.5 rounded-xl font-cinzel text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'reports'
              ? 'bg-gradient-to-r from-purple-500 to-[#D4AF37] text-[#12100E] shadow-lg'
              : 'bg-[#1E1916] text-purple-300 hover:text-purple-200 border border-purple-500/30'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Laporan &amp; Ekspor</span>
        </button>

        <button
          onClick={() => setActiveSubTab('inscribe')}
          className={`px-4 py-2.5 rounded-xl font-cinzel text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'inscribe'
              ? 'bg-[#D4AF37] text-[#12100E] shadow-lg'
              : 'bg-[#1E1916] text-[#A89F91] hover:text-[#F4E8C1] border border-white/10'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Buku Manual</span>
        </button>
      </div>

      {/* =========================================================
          SUB-TAB 0: QUICK LOAN DESK (NISN & BARCODE SCANNING)
      ========================================================= */}
      {activeSubTab === 'quick' && (
        <QuickLoanDesk
          books={books}
          members={members}
          loans={loans}
          onSubmitQuickLoan={onSubmitQuickLoan}
          isSubmitting={isSubmittingQuickLoan}
        />
      )}

      {/* =========================================================
          SUB-TAB 1: ANTREAN PERSETUJUAN PEMINJAMAN (APPROVAL QUEUE)
      ========================================================= */}
      {activeSubTab === 'queue' && (
        <section className="parchment-card rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#D4AF37]/20 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-cinzel text-xl font-bold text-[#F4E8C1] flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Antrean Persetujuan Peminjaman Grimoire</span>
              </h2>
              <p className="text-xs text-[#A89F91] mt-0.5">
                Tinjau permintaan peminjaman buku dari Siswa dan Guru. Menyetujui pinjaman otomatis mengurangi stok buku di rak.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 w-fit">
              {allPendingLoans.length} Permintaan Menunggu
            </span>
          </div>

          {allPendingLoans.length === 0 ? (
            <div className="p-12 rounded-xl text-center space-y-3 bg-black/20 border border-white/5">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="font-cinzel text-lg font-bold text-[#F4E8C1]">
                Seluruh Pengajuan Telah Ditinjau!
              </h3>
              <p className="text-xs text-[#A89F91] max-w-md mx-auto">
                Tidak ada permintaan peminjaman baru yang menunggu persetujuan.
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
                    className="p-5 rounded-2xl bg-black/40 border border-[#D4AF37]/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-all hover:border-[#D4AF37]/60"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {loan.requesterRole === 'guru' ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
                            👨‍🏫 GURU / MENTOR
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            ⚔️ SISWA / SCHOLAR
                          </span>
                        )}

                        <span className="text-xs font-semibold text-[#F4E8C1]">
                          {loan.requesterName}
                        </span>

                        {loan.className && (
                          <span className="text-[11px] text-[#A89F91]">
                            • {loan.className}
                          </span>
                        )}

                        <span className="text-[11px] text-[#A89F91]">
                          • Diajukan: {loan.borrowedDate}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-2xl text-[#D4AF37]">
                          {book?.coverRune || '✦'}
                        </span>
                        <div>
                          <h3 className="font-cinzel font-bold text-base text-[#F4E8C1]">
                            {loan.bookTitle || book?.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-[#A89F91] mt-0.5">
                            <span>
                              Jumlah Permintaan:{' '}
                              <strong className="text-amber-400 font-bold">
                                {loan.quantity || 1} Eksemplar
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Stok di Rak:{' '}
                              <strong
                                className={
                                  isOutOfStock ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'
                                }
                              >
                                {book?.availableStock ?? 0} Tersedia
                              </strong>
                            </span>
                            <span>•</span>
                            <span>Lokasi: {book?.shelf || 'Menara Rak Sentral'}</span>
                          </div>
                        </div>
                      </div>

                      {loan.notes && (
                        <p className="text-xs text-[#A89F91] bg-[#12100E] p-2.5 rounded-xl border border-white/5">
                          <strong className="text-[#F4E8C1]">Keperluan / Catatan:</strong> {loan.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-white/10">
                      <button
                        type="button"
                        onClick={() => onRejectLoan(loan)}
                        className="px-4 py-2.5 rounded-xl text-xs font-cinzel font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Tolak (Reject)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onApproveLoan(loan)}
                        disabled={isOutOfStock}
                        className={`px-5 py-2.5 rounded-xl font-cinzel font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all ${
                          !isOutOfStock
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-[#12100E]'
                            : 'bg-white/10 text-[#A89F91] cursor-not-allowed'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve (Setujui)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* =========================================================
          SUB-TAB 2: SIRKULASI PINJAMAN AKTIF
      ========================================================= */}
      {activeSubTab === 'circulation' && (
        <section className="parchment-card rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="border-b border-[#D4AF37]/20 pb-4 flex items-center justify-between">
            <div>
              <h2 className="font-cinzel text-xl font-bold text-[#F4E8C1] flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <span>Sirkulasi Pinjaman Aktif (Approved Circulation)</span>
              </h2>
              <p className="text-xs text-[#A89F91] mt-0.5">
                Daftar seluruh buku yang sedang berada di tangan Siswa maupun Guru.
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {allApprovedLoans.length} Sedang Berjalan
            </span>
          </div>

          {overdueLoans.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/35 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>{overdueLoans.length} peminjaman melewati jatuh tempo</strong>
                {dueSoonLoans.length > 0
                  ? ` dan ${dueSoonLoans.length} mendekati jatuh tempo (H-1).`
                  : '.'}{' '}
                Gunakan tombol <strong>Ingatkan</strong> untuk mengirim pesan WhatsApp.
              </span>
            </div>
          )}

          {allApprovedLoans.length === 0 ? (
            <p className="text-xs text-[#A89F91] py-8 text-center">
              Tidak ada buku yang sedang berstatus dipinjam saat ini.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#D4AF37]/20 text-[#D4AF37] font-cinzel">
                    <th className="py-3 px-3">Judul Grimoire</th>
                    <th className="py-3 px-3">Peminjam &amp; NISN</th>
                    <th className="py-3 px-3">Role &amp; Kelas</th>
                    <th className="py-3 px-3 text-center">Jumlah</th>
                    <th className="py-3 px-3">Tgl Pinjam</th>
                    <th className="py-3 px-3">Status Jatuh Tempo</th>
                    <th className="py-3 px-3 text-right">Aksi Kurator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortedApprovedLoans.map((loan) => {
                    const book = books.find((b) => b.id === loan.bookId);
                    const timing = getLoanTiming(loan);
                    return (
                      <tr key={loan.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-3 font-semibold text-[#F4E8C1]">
                          <div className="flex items-center gap-2">
                            <span className="text-[#D4AF37]">{book?.coverRune || '✦'}</span>
                            <div>
                              <span>{loan.bookTitle || book?.title}</span>
                              <span className="block text-[10px] font-mono text-[#D4AF37]/80">
                                {book?.kodeBuku || loan.bookCode || '-'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-[#F4E8C1]">
                          <span className="font-semibold block">{loan.requesterName}</span>
                          {(loan.borrowerNisn || loan.borrowerCard) && (
                            <span className="text-[10px] font-mono text-emerald-300">
                              NISN: {loan.borrowerNisn || loan.borrowerCard}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              loan.requesterRole === 'guru'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {loan.requesterRole === 'guru' ? 'Guru' : 'Siswa'}
                          </span>
                          <span className="block text-[#A89F91] text-[10px] mt-1">{loan.className}</span>
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-amber-400">
                          {loan.quantity || 1}
                        </td>
                        <td className="py-3.5 px-3 text-[#A89F91]">
                          {loan.borrowedDate}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${timing.badgeClass}`}>
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
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-cinzel font-bold bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/40 hover:bg-[#25D366]/25 transition-all flex items-center gap-1"
                            >
                              <MessageCircle className="w-3 h-3" />
                              Ingatkan
                            </button>
                            <button
                              type="button"
                              onClick={() => onVerifyReturnLoan(loan)}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-cinzel font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all"
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

      {/* =========================================================
          SUB-TAB 3: MANAJEMEN STOK & KURIKULUM BUKU
      ========================================================= */}
      {activeSubTab === 'inventory' && (
        <section className="parchment-card rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#D4AF37]/20 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-cinzel text-xl font-bold text-[#F4E8C1] flex items-center gap-2">
                <Database className="w-5 h-5 text-[#D4AF37]" />
                <span>Manajemen Inventaris Stok &amp; Kurikulum Buku</span>
              </h2>
              <p className="text-xs text-[#A89F91] mt-0.5">
                Kelola jumlah total eksemplar, stok rak, dan label kurikulum (SMP, SMA, SMK 3 Jurusan).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveSubTab('import_excel')}
                className="px-3.5 py-2 rounded-xl text-xs font-cinzel font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Import Excel Massal</span>
              </button>

              <input
                type="text"
                value={stockSearchQuery}
                onChange={(e) => setStockSearchQuery(e.target.value)}
                placeholder="Cari judul, jurusan, jenjang, kode..."
                className="px-3.5 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37] sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D4AF37]/20 text-[#D4AF37] font-cinzel">
                  <th className="py-3 px-3">Kode</th>
                  <th className="py-3 px-3">Judul Buku</th>
                  <th className="py-3 px-3">Kurikulum (Jenjang / Kelas / Jurusan)</th>
                  <th className="py-3 px-3">Jenis Buku</th>
                  <th className="py-3 px-3 text-center">Total Stok</th>
                  <th className="py-3 px-3 text-center">Stok di Rak</th>
                  <th className="py-3 px-3 text-center">Format</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredInventoryBooks.map((book) => {
                  const isAvailable = book.availableStock > 0;
                  return (
                    <tr key={book.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-semibold text-[#D4AF37]">
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
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                            {book.jurusan || 'Semua Jurusan'}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#A89F91] block mt-0.5">{book.shelf}</span>
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
                            className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-[#A89F91] hover:text-[#F4E8C1]"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-cinzel font-bold text-sm text-[#F4E8C1] w-7 text-center">
                            {book.totalStock}
                          </span>
                          <button
                            type="button"
                            onClick={() => onAdjustStock(book.id, 'total', 1)}
                            className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-[#A89F91] hover:text-[#F4E8C1]"
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
                            className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-[#A89F91] hover:text-[#F4E8C1]"
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
                            className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-[#A89F91] hover:text-[#F4E8C1]"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {book.pdfUrl ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            Ada PDF
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/40">
                            Fisik / Teks
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {book.pdfUrl && onOpenPdfViewer && (
                            <button
                              type="button"
                              onClick={() => onOpenPdfViewer(book)}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-cinzel font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all flex items-center gap-1"
                            >
                              <BookOpen className="w-3 h-3" />
                              PDF
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openLabelModal(book.id)}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-cinzel font-semibold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40 hover:bg-[#D4AF37]/25 transition-all flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3" />
                            Label
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* =========================================================
          SUB-TAB 3B: MANAJEMEN AKUN SISWA & NISN (USERNAME & PASSWORD)
      ========================================================= */}
      {activeSubTab === 'members' && (
        <div className="space-y-6">
          <section className="parchment-card rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="border-b border-[#D4AF37]/20 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-cinzel text-xl font-bold text-[#F4E8C1] flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-sky-400" />
                  <span>Daftarkan Akun Siswa / Guru Baru (Username &amp; NISN)</span>
                </h2>
                <p className="text-xs text-[#A89F91] mt-0.5">
                  Tanpa input email. Siswa masuk menggunakan Username &amp; Password, serta kartu pelajarnya dipindai memakai NISN.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubTab('import_excel')}
                className="px-3.5 py-2 rounded-xl text-xs font-cinzel font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Import Massal Siswa dari Excel</span>
              </button>
            </div>

            {memberFormFeedback && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-300">
                {memberFormFeedback}
              </div>
            )}

            <form onSubmit={handleCreateMemberSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                    NISN (TEKS 10 DIGIT):
                  </label>
                  <div className="relative">
                    <Hash className="w-3.5 h-3.5 text-[#A89F91] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={newMemberForm.nisn}
                      onChange={(e) =>
                        setNewMemberForm({ ...newMemberForm, nisn: e.target.value })
                      }
                      placeholder="Contoh: 0081234567"
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
                    placeholder="Nama Lengkap Siswa"
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

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl font-cinzel font-bold text-xs bg-sky-500 text-[#12100E] hover:bg-sky-400 transition-all flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Simpan Akun Siswa</span>
                  </button>
                </div>
              </div>
            </form>
          </section>

          <section className="parchment-card rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D4AF37]/20 pb-4">
              <div>
                <h3 className="font-cinzel text-lg font-bold text-[#F4E8C1]">
                  Daftar Siswa &amp; Guru Terdaftar ({filteredMembers.length})
                </h3>
                <p className="text-xs text-[#A89F91]">
                  Seluruh NISN bertipe teks (`TEXT`) untuk menjaga angka nol di awal dan siap dipindai di Meja Transaksi Kilat.
                </p>
              </div>
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder="Cari NISN, username, nama, jurusan..."
                className="px-3.5 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37] sm:w-64"
              />
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#1E1916] border-b border-[#D4AF37]/20 text-[#D4AF37] font-cinzel">
                  <tr>
                    <th className="py-2.5 px-3">NISN (Teks)</th>
                    <th className="py-2.5 px-3">Nama Lengkap</th>
                    <th className="py-2.5 px-3">Username</th>
                    <th className="py-2.5 px-3">Peran</th>
                    <th className="py-2.5 px-3">Jenjang</th>
                    <th className="py-2.5 px-3">Kelas</th>
                    <th className="py-2.5 px-3">Jurusan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-white/5">
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-300">
                        {m.nisn || m.cardCode}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#F4E8C1]">
                        {m.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#D4AF37]">
                        @{m.username || m.id}
                      </td>
                      <td className="py-2.5 px-3 uppercase text-[10px]">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            m.role === 'guru'
                              ? 'bg-sky-500/20 text-sky-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {m.role || 'siswa'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#F4E8C1]">
                        {m.jenjang || 'SMK'}
                      </td>
                      <td className="py-2.5 px-3 text-[#A89F91]">
                        Kelas {m.kelas || m.level}
                      </td>
                      <td className="py-2.5 px-3 text-sky-300">
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

      {/* =========================================================
          SUB-TAB 4: FITUR IMPORT EXCEL (BUKU & SISWA)
      ========================================================= */}
      {activeSubTab === 'import_excel' && (
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

      {/* =========================================================
          SUB-TAB 4B: MONTHLY & ACCREDITATION REPORTS
      ========================================================= */}
      {activeSubTab === 'reports' && (
        <LibraryReportsView
          books={books}
          loans={loans}
          onOpenReminder={(loan) => setReminderLoan(loan)}
        />
      )}

      {/* =========================================================
          SUB-TAB 5: INSCRIBE NEW GRIMOIRE FORM & SEEDING
      ========================================================= */}
      {activeSubTab === 'inscribe' && (
        <div className="space-y-8">
          <section className="parchment-card rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-[#D4AF37]/20 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-cinzel text-xl font-bold text-[#F4E8C1]">
                  Daftarkan Buku Kurikulum Baru Manual
                </h2>
                <p className="text-xs text-[#A89F91] mt-0.5">
                  Dilengkapi pemetaan Jenjang (SMP/SMA/SMK/Umum), Kelas, Jurusan (BM, TKR/TR, TKJ, Semua Jurusan), dan Jenis Buku.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveSubTab('import_excel')}
                className="px-4 py-2 rounded-xl text-xs font-cinzel font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Import dari Excel (.xlsx)</span>
              </button>
            </div>

            <form onSubmit={onAddNewBook} className="space-y-4">
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

                {/* ATRIBUT KURIKULUM BERTINGKAT */}
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
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-emerald-500/40 text-[#F4E8C1] focus:outline-none focus:border-emerald-400"
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
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-emerald-500/40 text-[#F4E8C1] focus:outline-none focus:border-emerald-400"
                  >
                    {bookFormKelasOptions.map((k) => (
                      <option key={k} value={k}>
                        {k === 'Semua' ? 'Semua Kelas' : `Kelas ${k}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-cinzel text-sky-400 mb-1">
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
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-sky-500/40 text-[#F4E8C1] focus:outline-none focus:border-sky-400 disabled:opacity-50"
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
                  <label className="block text-xs font-cinzel text-purple-400 mb-1">
                    JENIS BUKU:
                  </label>
                  <select
                    value={newBookForm.jenisBuku || 'Buku Paket Wajib'}
                    onChange={(e) =>
                      setNewBookForm({ ...newBookForm, jenisBuku: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-purple-500/40 text-[#F4E8C1] focus:outline-none focus:border-purple-400"
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
                    PENERBIT BUKU:
                  </label>
                  <input
                    type="text"
                    value={newBookForm.publisher || ''}
                    onChange={(e) =>
                      setNewBookForm({ ...newBookForm, publisher: e.target.value })
                    }
                    placeholder="Contoh: Erlangga, Andi Offset"
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
                      setNewBookForm({ ...newBookForm, publicationYear: Number(e.target.value) })
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
                    placeholder="Contoh: Rak SMK Kelas 10 • TKJ"
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
                  SINOPSIS BUKU:
                </label>
                <textarea
                  rows={2}
                  value={newBookForm.synopsis}
                  onChange={(e) =>
                    setNewBookForm({ ...newBookForm, synopsis: e.target.value })
                  }
                  placeholder="Tuliskan deskripsi singkat kompetensi atau isi buku..."
                  className="w-full p-3 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-cinzel font-bold text-xs bg-[#D4AF37] text-[#12100E] hover:bg-amber-400 transition-all flex items-center gap-2 shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simpan Buku Kurikulum Baru</span>
                </button>
              </div>
            </form>
          </section>

          {/* POSTGRESQL + PRISMA DATABASE STATUS & SYNC */}
          <section className="parchment-card rounded-2xl p-6 border border-[#D4AF37]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-cinzel text-base font-bold text-[#F4E8C1] flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>PostgreSQL &amp; Prisma Database Sync</span>
              </h3>
              <p className="text-xs text-[#A89F91] mt-0.5">
                {isDatabaseConnected
                  ? 'Seluruh transaksi buku, NISN siswa, sirkulasi, jurnal GLS, & bookmark tersinkron langsung ke PostgreSQL (Neon) via Prisma ORM.'
                  : 'Menghubungkan ke server PostgreSQL + Prisma...'}
              </p>
            </div>

            <button
              type="button"
              onClick={onRefreshDatabase}
              disabled={isSyncingDatabase}
              className={`px-5 py-2.5 rounded-xl font-cinzel font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
                isSyncingDatabase
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 cursor-wait'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-[#12100E]'
              }`}
            >
              <RefreshCw
                className={`w-4 h-4 ${isSyncingDatabase ? 'animate-spin' : ''}`}
              />
              <span>
                {isSyncingDatabase ? 'Menyegarkan...' : 'Refresh Data PostgreSQL'}
              </span>
            </button>
          </section>
        </div>
      )}

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
