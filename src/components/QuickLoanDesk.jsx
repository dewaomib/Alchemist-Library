import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  Hash,
  MapPin,
  Phone,
  RotateCcw,
  ScanLine,
  Search,
  Sparkles,
  UserCheck,
  UserRound,
  X
} from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import {
  addDays,
  formatDateID,
  getLoanTiming,
  STUDENT_LOAN_DAYS,
  TEACHER_LOAN_DAYS_OPTIONS,
  toISODate
} from '../utils/loanUtils';
import {
  buildBookSearchText,
  buildMemberSearchText,
  getInitials,
  matchBookByCode,
  matchMemberByCode
} from '../utils/libraryUtils';

function todayStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export default function QuickLoanDesk({
  books = [],
  members = [],
  loans = [],
  onSubmitQuickLoan,
  isSubmitting = false
}) {
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [studentQuery, setStudentQuery] = useState('');
  const [bookQuery, setBookQuery] = useState('');
  const [studentScanOpen, setStudentScanOpen] = useState(false);
  const [bookScanOpen, setBookScanOpen] = useState(false);
  const [autoChainBookCamera, setAutoChainBookCamera] = useState(true);
  const [activeFocusStep, setActiveFocusStep] = useState(1); // 1 = NISN Siswa, 2 = Barcode Buku
  const [quantity, setQuantity] = useState(1);
  const [durationDays, setDurationDays] = useState(14);
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const studentSearchRef = useRef(null);
  const bookSearchRef = useRef(null);
  const submitButtonRef = useRef(null);

  const today = todayStart();
  const activeDuration =
    selectedMember?.role === 'guru' ? Number(durationDays) || 14 : STUDENT_LOAN_DAYS;
  const dueDate = addDays(today, activeDuration);

  const memberResults = useMemo(() => {
    const query = studentQuery.trim().toLowerCase();
    const list = members.filter((member) => member.role === 'siswa' || member.role === 'guru');
    if (!query) return list.slice(0, 6);
    return list.filter((member) => buildMemberSearchText(member).includes(query)).slice(0, 8);
  }, [members, studentQuery]);

  const bookResults = useMemo(() => {
    const query = bookQuery.trim().toLowerCase();
    if (!query) return books.slice(0, 6);
    return books.filter((book) => buildBookSearchText(book).includes(query)).slice(0, 8);
  }, [books, bookQuery]);

  const memberActiveLoans = useMemo(() => {
    if (!selectedMember) return [];
    return loans.filter(
      (loan) =>
        (loan.status === 'approved' || loan.status === 'active' || loan.status === 'pending') &&
        (loan.profileId === selectedMember.cardCode ||
          loan.borrowerCard === selectedMember.cardCode ||
          loan.borrowerCard === selectedMember.nisn ||
          loan.borrowerName === selectedMember.name ||
          loan.requesterName === selectedMember.name)
    );
  }, [loans, selectedMember]);

  // Saat siswa terpilih, otomatis pindahkan fokus ke pemindaian barcode buku (Langkah 2)
  useEffect(() => {
    if (selectedMember && !selectedBook) {
      setActiveFocusStep(2);
      const timer = setTimeout(() => {
        bookSearchRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
    if (!selectedMember) {
      setActiveFocusStep(1);
    }
    return undefined;
  }, [selectedMember, selectedBook]);

  const handlePickMember = (member, fromCamera = false) => {
    setSelectedMember(member);
    setStudentQuery('');
    setFeedback(null);
    setReceipt(null);
    setDurationDays(14);
    if (member.role !== 'guru') setDurationDays(STUDENT_LOAN_DAYS);
    setActiveFocusStep(2);

    if (fromCamera && autoChainBookCamera && !selectedBook) {
      setTimeout(() => {
        setBookScanOpen(true);
      }, 300);
    } else {
      setTimeout(() => {
        bookSearchRef.current?.focus();
      }, 120);
    }
  };

  const handlePickBook = (book) => {
    setSelectedBook(book);
    setBookQuery('');
    setQuantity(1);
    setFeedback(null);
    setTimeout(() => {
      submitButtonRef.current?.focus();
    }, 120);
  };

  const handleStudentScan = (rawValue) => {
    const member = matchMemberByCode(members, rawValue);
    setStudentScanOpen(false);
    if (!member) {
      setFeedback({
        type: 'error',
        message: `Barcode/QR NISN "${rawValue}" tidak ditemukan di database siswa. Gunakan kolom pencarian cepat NISN/Nama di samping tombol kamera.`
      });
      return;
    }
    handlePickMember(member, true);
    setFeedback({
      type: 'success',
      message: `NISN ${member.nisn || member.cardCode} terverifikasi: ${member.name} (${member.jenjang || 'SMK'} Kelas ${member.kelas || '-'} • ${member.jurusan || 'Semua Jurusan'}). Fokus dialihkan ke pemindaian Barcode Buku.`
    });
  };

  const handleBookScan = (rawValue) => {
    const book = matchBookByCode(books, rawValue);
    setBookScanOpen(false);
    if (!book) {
      setFeedback({
        type: 'error',
        message: `Barcode buku "${rawValue}" tidak ditemukan di katalog. Periksa label atau cari manual.`
      });
      return;
    }
    handlePickBook(book);
    setFeedback({
      type: 'success',
      message: `Buku terverifikasi: ${book.title} (${book.kodeBuku}). Siap klik Pinjam Sekarang!`
    });
  };

  const handleStudentSearchKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const raw = studentQuery.trim();
      if (!raw) return;
      const exactMember = matchMemberByCode(members, raw) || memberResults[0];
      if (exactMember) {
        handlePickMember(exactMember, false);
        setFeedback({
          type: 'success',
          message: `Siswa dipilih: ${exactMember.name} (NISN: ${exactMember.nisn}). Silakan pindai barcode buku.`
        });
      }
    }
  };

  const handleBookSearchKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const raw = bookQuery.trim();
      if (!raw) return;
      const exactBook = matchBookByCode(books, raw) || bookResults[0];
      if (exactBook) {
        handlePickBook(exactBook);
        setFeedback({
          type: 'success',
          message: `Buku dipilih: ${exactBook.title} (${exactBook.kodeBuku}).`
        });
      }
    }
  };

  const resetTransaction = (clearMember = false) => {
    setSelectedBook(null);
    setBookQuery('');
    setQuantity(1);
    setNotes('');
    setReceipt(null);
    setFeedback(null);
    if (clearMember) {
      setSelectedMember(null);
      setStudentQuery('');
      setActiveFocusStep(1);
    } else {
      setActiveFocusStep(2);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedMember || !selectedBook || !onSubmitQuickLoan) return;

    const result = await onSubmitQuickLoan({
      member: selectedMember,
      book: selectedBook,
      quantity: Number(quantity) || 1,
      durationDays: activeDuration,
      dueDate: toISODate(dueDate),
      notes:
        notes.trim() ||
        `Peminjaman kilat berbasis NISN (${selectedMember.nisn || selectedMember.cardCode}) untuk ${selectedMember.name}.`
    });

    if (result?.ok) {
      setReceipt(result.loan || null);
      setSelectedBook(null);
      setBookQuery('');
      setQuantity(1);
      setNotes('');
      setFeedback({
        type: 'success',
        message: `Transaksi selesai. Stok "${selectedBook.title}" otomatis diperbarui.`
      });
    } else {
      setFeedback({
        type: 'error',
        message: result?.message || 'Transaksi gagal diproses.'
      });
    }
  };

  const activeLoanCount = memberActiveLoans.filter(
    (loan) => loan.status === 'approved' || loan.status === 'active'
  ).length;

  return (
    <section className="space-y-6">
      <div className="parchment-card rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-[#D4AF37]/20 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-cinzel font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
              <Sparkles className="w-3 h-3" />
              TRANSAKSI KILAT • PEMINDAIAN KARTU PELAJAR BERBASIS NISN
            </div>
            <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-[#F4E8C1] mt-2 flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-[#D4AF37]" />
              <span>Meja Sirkulasi Pindai NISN &amp; Barcode Buku</span>
            </h2>
            <p className="text-xs text-[#A89F91] mt-1 max-w-2xl leading-relaxed">
              Langkah 1: Pindai barcode/QR <strong className="text-[#F4E8C1]">NISN</strong> pada kartu pelajar siswa (mendukung NISN dengan angka nol di awal seperti <code className="text-emerald-300">0081234567</code>). Begitu terverifikasi, fokus otomatis berpindah ke Langkah 2 (<strong className="text-[#F4E8C1]">Barcode Buku</strong>).
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-2 text-[10px] text-[#A89F91] bg-black/30 border border-white/10 rounded-xl px-3 py-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Fokus Aktif: Langkah {activeFocusStep === 1 ? '1 (Scan NISN)' : '2 (Scan Buku)'}</span>
            </div>
            <label className="flex items-center gap-1.5 text-[10px] text-[#A89F91] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoChainBookCamera}
                onChange={(e) => setAutoChainBookCamera(e.target.checked)}
                className="rounded border-[#D4AF37]/40 bg-[#12100E] text-emerald-500 focus:ring-0"
              />
              <span>Otomatis buka kamera buku setelah scan NISN</span>
            </label>
          </div>
        </div>

        {/* Langkah 1 & 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LANGKAH 1: KARTU PELAJAR BERBASIS NISN */}
          <div
            className={`rounded-2xl border p-4 sm:p-5 transition-all ${
              selectedMember
                ? 'bg-emerald-500/5 border-emerald-500/40'
                : activeFocusStep === 1
                ? 'bg-black/30 border-emerald-400/70 ring-1 ring-emerald-400/30'
                : 'bg-black/30 border-[#D4AF37]/25'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-400 text-[#12100E] flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <div>
                  <h3 className="font-cinzel font-bold text-sm text-[#F4E8C1]">
                    Pindai Kartu Pelajar (NISN)
                  </h3>
                  <p className="text-[10px] text-[#A89F91]">
                    Scan QR/Barcode NISN atau ketik di kolom pencarian samping
                  </p>
                </div>
              </div>
              {selectedMember && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMember(null);
                    setFeedback(null);
                    setActiveFocusStep(1);
                  }}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[#A89F91] hover:text-[#F4E8C1] flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Ganti Siswa
                </button>
              )}
            </div>

            {selectedMember ? (
              <div className="space-y-3 animate-fadeIn">
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0"
                    style={{
                      backgroundColor: `${selectedMember.color || '#10B981'}18`,
                      borderColor: `${selectedMember.color || '#10B981'}55`
                    }}
                  >
                    {selectedMember.avatar || getInitials(selectedMember.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="font-cinzel font-bold text-sm text-[#F4E8C1] truncate">
                        {selectedMember.name}
                      </h4>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                          selectedMember.role === 'guru'
                            ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {selectedMember.role === 'guru' ? 'GURU' : 'SISWA TERVERIFIKASI'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#A89F91] mt-0.5">
                      {selectedMember.username ? `Username: @${selectedMember.username} • ` : ''}
                      ID Kartu: {selectedMember.cardCode}
                    </p>
                  </div>
                </div>

                {/* PROFIL LENGKAP SISWA: NAMA, NISN, JENJANG, KELAS, JURUSAN */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/30">
                    <span className="text-[#A89F91] block">NISN (Teks)</span>
                    <strong className="font-mono text-emerald-300 text-xs block mt-0.5">
                      {selectedMember.nisn || selectedMember.cardCode}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[#A89F91] block">Jenjang</span>
                    <strong className="text-[#D4AF37] text-xs block mt-0.5">
                      {selectedMember.jenjang || 'SMK'}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[#A89F91] block">Kelas</span>
                    <strong className="text-[#F4E8C1] text-xs block mt-0.5">
                      Kelas {selectedMember.kelas || selectedMember.level || '10'}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[#A89F91] block">Jurusan</span>
                    <strong className="text-sky-300 text-xs block mt-0.5 truncate">
                      {selectedMember.jurusan || 'Semua Jurusan'}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-[#A89F91] block">Pinjaman Aktif</span>
                    <strong className="text-emerald-300 text-xs">{activeLoanCount} buku</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-[#A89F91] block">Hak Durasi Pinjam</span>
                    <strong className="text-[#F4E8C1] text-xs">
                      {selectedMember.role === 'guru'
                        ? `${TEACHER_LOAN_DAYS_OPTIONS.join('/')} hari`
                        : '7 hari'}
                    </strong>
                  </div>
                </div>

                {memberActiveLoans.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-cinzel text-[#D4AF37]">PINJAMAN BERJALAN:</p>
                    {memberActiveLoans.slice(0, 3).map((loan) => {
                      const timing = getLoanTiming(loan);
                      const book = books.find((item) => item.id === loan.bookId);
                      return (
                        <div
                          key={loan.id}
                          className="flex items-center justify-between gap-2 text-[10px] p-1.5 rounded-lg bg-black/25 border border-white/5"
                        >
                          <span className="truncate text-[#F4E8C1]">
                            {book?.title || loan.bookTitle}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded border shrink-0 ${timing.badgeClass}`}>
                            {timing.shortLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Tombol Kamera & Kolom Pencarian Cepat NISN/Nama Bersebelahan */}
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <button
                    type="button"
                    onClick={() => setStudentScanOpen(true)}
                    className="sm:w-auto px-4 py-2.5 rounded-xl font-cinzel font-bold text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-2 shrink-0 shadow-md"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Scan Kamera NISN</span>
                  </button>

                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-[#D4AF37] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      ref={studentSearchRef}
                      type="text"
                      value={studentQuery}
                      onChange={(event) => setStudentQuery(event.target.value)}
                      onKeyDown={handleStudentSearchKeyDown}
                      placeholder="Ketik NISN (misal 0081234567) atau Nama Siswa..."
                      className="w-full h-full pl-8 pr-3 py-2.5 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/35 text-[#F4E8C1] placeholder-[#A89F91]/60 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-0.5">
                  {memberResults.length === 0 ? (
                    <p className="text-[11px] text-[#A89F91] text-center py-3">
                      Siswa dengan NISN atau nama tersebut tidak ditemukan.
                    </p>
                  ) : (
                    memberResults.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => handlePickMember(member, false)}
                        className="w-full text-left p-2.5 rounded-xl bg-black/25 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/40 transition-colors flex items-center gap-2.5"
                      >
                        <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm shrink-0">
                          {member.avatar || getInitials(member.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#F4E8C1] truncate">
                              {member.name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              NISN: {member.nisn || member.cardCode}
                            </span>
                          </span>
                          <span className="block text-[10px] text-[#A89F91] truncate mt-0.5">
                            {member.jenjang || 'SMK'} • Kelas {member.kelas || member.level} • Jurusan {member.jurusan || 'Semua Jurusan'}
                          </span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* LANGKAH 2: BARCODE BUKU */}
          <div
            className={`rounded-2xl border p-4 sm:p-5 transition-all ${
              selectedBook
                ? 'bg-amber-500/5 border-amber-500/40'
                : activeFocusStep === 2
                ? 'bg-amber-500/5 border-[#D4AF37] ring-2 ring-[#D4AF37]/35 shadow-[0_0_25px_rgba(212,175,55,0.15)]'
                : 'bg-black/30 border-[#D4AF37]/25'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#D4AF37] text-[#12100E] flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <div>
                  <h3 className="font-cinzel font-bold text-sm text-[#F4E8C1] flex items-center gap-1.5">
                    <span>Pindai Barcode Buku</span>
                    {activeFocusStep === 2 && !selectedBook && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 animate-pulse">
                        FOKUS AKTIF
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] text-[#A89F91]">
                    Scan barcode punggung buku / ISBN atau cari kode buku
                  </p>
                </div>
              </div>
              {selectedBook && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBook(null);
                    setFeedback(null);
                    setActiveFocusStep(2);
                  }}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[#A89F91] hover:text-[#F4E8C1] flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Ganti Buku
                </button>
              )}
            </div>

            {selectedBook ? (
              <div className="space-y-3 animate-fadeIn">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-16 rounded-lg bg-gradient-to-br ${
                      selectedBook.coverGradient || 'from-amber-950 to-black'
                    } border border-[#D4AF37]/40 flex items-center justify-center text-xl text-[#D4AF37] shrink-0`}
                  >
                    {selectedBook.coverRune || '✦'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1 mb-0.5">
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 font-semibold">
                        {selectedBook.jenjang || 'Umum'} • Kls {selectedBook.kelas || 'Semua'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold">
                        {selectedBook.jurusan || 'Semua Jurusan'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                        {selectedBook.jenisBuku || 'Referensi'}
                      </span>
                    </div>
                    <h4 className="font-cinzel font-bold text-sm text-[#F4E8C1] line-clamp-2">
                      {selectedBook.title}
                    </h4>
                    <p className="text-[10px] italic text-[#D4AF37]/80 truncate">
                      {selectedBook.author}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#A89F91] mt-1">
                      <span className="flex items-center gap-1 font-mono text-[#D4AF37]">
                        <Hash className="w-3 h-3" />
                        {selectedBook.kodeBuku}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {selectedBook.shelf}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-[#A89F91] block">Stok rak</span>
                    <strong
                      className={`text-sm ${
                        selectedBook.availableStock > 0 ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {selectedBook.availableStock}/{selectedBook.totalStock}
                    </strong>
                  </div>
                  <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-[#A89F91] block">DDC</span>
                    <strong className="text-[#F4E8C1] text-sm">{selectedBook.ddc}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-[#A89F91] block">No. panggil</span>
                    <strong className="text-[#F4E8C1] text-xs whitespace-pre-line">
                      {selectedBook.callNumber}
                    </strong>
                  </div>
                </div>

                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-cinzel text-[#D4AF37] mb-1">
                      JUMLAH EKSEMPLAR
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={Math.max(1, selectedBook.availableStock)}
                      value={quantity}
                      onChange={(event) =>
                        setQuantity(
                          Math.max(
                            1,
                            Math.min(selectedBook.availableStock, Number(event.target.value) || 1)
                          )
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  {selectedBook.availableStock <= 0 && (
                    <div className="flex-1 text-[10px] text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2 flex items-start gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      Stok fisik habis. Gunakan versi digital atau tambah stok.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <button
                    type="button"
                    onClick={() => setBookScanOpen(true)}
                    className="sm:w-auto px-4 py-2.5 rounded-xl font-cinzel font-bold text-xs bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/50 hover:bg-[#D4AF37]/30 transition-all flex items-center justify-center gap-2 shrink-0 shadow-md"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Scan Kamera Buku</span>
                  </button>

                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-[#D4AF37] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      ref={bookSearchRef}
                      type="text"
                      value={bookQuery}
                      onChange={(event) => setBookQuery(event.target.value)}
                      onKeyDown={handleBookSearchKeyDown}
                      placeholder="Scan/ketik Kode Buku, ISBN, atau Judul..."
                      className="w-full h-full pl-8 pr-3 py-2.5 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/35 text-[#F4E8C1] placeholder-[#A89F91]/60 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-0.5">
                  {bookResults.length === 0 ? (
                    <p className="text-[11px] text-[#A89F91] text-center py-3">
                      Buku tidak ditemukan.
                    </p>
                  ) : (
                    bookResults.map((book) => (
                      <button
                        key={book.id}
                        type="button"
                        onClick={() => handlePickBook(book)}
                        className="w-full text-left p-2.5 rounded-xl bg-black/25 hover:bg-[#D4AF37]/10 border border-white/5 hover:border-[#D4AF37]/35 transition-colors flex items-center gap-2"
                      >
                        <span className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/25 flex items-center justify-center text-sm shrink-0 text-[#D4AF37]">
                          {book.coverRune || '✦'}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-semibold text-[#F4E8C1] truncate">
                            {book.title}
                          </span>
                          <span className="block text-[10px] text-[#A89F91] truncate">
                            <span className="font-mono text-[#D4AF37]">{book.kodeBuku}</span> • {book.jenjang || 'Umum'} Kls {book.kelas || 'Semua'} ({book.jurusan || 'Semua Jurusan'}) • Stok {book.availableStock}/{book.totalStock}
                          </span>
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full border shrink-0 ${
                            book.availableStock > 0
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                          }`}
                        >
                          {book.availableStock > 0 ? 'Siap' : 'Habis'}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs border flex items-start gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/35 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Langkah 3: Konfirmasi */}
        <form onSubmit={handleSubmit} className="pt-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-black/30 border border-white/10">
              <span className="text-[10px] text-[#A89F91] block">Tanggal pinjam</span>
              <span className="text-xs font-semibold text-[#F4E8C1] flex items-center gap-1.5 mt-0.5">
                <CalendarDays className="w-3.5 h-3.5 text-[#D4AF37]" />
                {formatDateID(today)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/30 border border-white/10">
              <span className="text-[10px] text-[#A89F91] block">Durasi pinjam</span>
              {selectedMember?.role === 'guru' ? (
                <select
                  value={durationDays}
                  onChange={(event) => setDurationDays(Number(event.target.value))}
                  className="mt-1 w-full px-2 py-1 rounded-lg text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                >
                  {TEACHER_LOAN_DAYS_OPTIONS.map((days) => (
                    <option key={days} value={days}>
                      {days} hari (Guru)
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-semibold text-[#F4E8C1] flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  {STUDENT_LOAN_DAYS} hari (Siswa)
                </span>
              )}
            </div>

            <div className="p-3 rounded-xl bg-black/30 border border-white/10">
              <span className="text-[10px] text-[#A89F91] block">Jatuh tempo</span>
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mt-0.5">
                <CalendarDays className="w-3.5 h-3.5" />
                {formatDateID(dueDate)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-cinzel text-[#D4AF37] mb-1">
              CATATAN PETUGAS (OPSIONAL)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Contoh: Dipinjam untuk kegiatan belajar kurikulum sekolah."
              className="w-full px-3 py-2.5 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/25 text-[#F4E8C1] placeholder-[#A89F91]/60 focus:outline-none focus:border-[#D4AF37]/60"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <p className="text-[10px] text-[#A89F91] flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              NISN siswa, stok buku, dan tanggal jatuh tempo tercatat otomatis.
            </p>

            <button
              ref={submitButtonRef}
              type="submit"
              disabled={
                !selectedMember ||
                !selectedBook ||
                selectedBook.availableStock < (Number(quantity) || 1) ||
                isSubmitting
              }
              className={`px-6 py-3 rounded-xl font-cinzel font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                selectedMember &&
                selectedBook &&
                selectedBook.availableStock >= (Number(quantity) || 1) &&
                !isSubmitting
                  ? 'bg-gradient-to-r from-emerald-500 to-amber-500 text-[#12100E] hover:brightness-110'
                  : 'bg-white/10 text-[#A89F91] cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Pinjam Sekarang
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Bukti transaksi terakhir */}
      {receipt && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-cinzel font-bold text-sm text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Transaksi Terakhir Berhasil
            </h3>
            <button
              type="button"
              onClick={() => resetTransaction(false)}
              className="text-[10px] text-[#A89F91] hover:text-[#F4E8C1] flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Tutup
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-lg bg-black/25 border border-white/5">
              <span className="text-[#A89F91] block text-[10px]">Peminjam (NISN)</span>
              <strong className="text-[#F4E8C1]">{receipt.borrowerName}</strong>
              <span className="block text-[9px] text-emerald-300 font-mono">
                NISN: {receipt.borrowerNisn || receipt.borrowerCard} • {receipt.className}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-black/25 border border-white/5">
              <span className="text-[#A89F91] block text-[10px]">Buku</span>
              <strong className="text-[#F4E8C1]">{receipt.bookTitle}</strong>
              <span className="block text-[9px] font-mono text-[#D4AF37]">{receipt.bookCode}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-black/25 border border-white/5">
              <span className="text-[#A89F91] block text-[10px]">Jatuh tempo</span>
              <strong className="text-amber-300">{formatDateID(receipt.dueDate)}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-black/25 border border-white/5">
              <span className="text-[#A89F91] block text-[10px]">Jumlah</span>
              <strong className="text-[#F4E8C1]">{receipt.quantity} eksemplar</strong>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => resetTransaction(false)}
              className="px-3.5 py-2 rounded-lg text-[11px] font-cinzel font-bold bg-[#D4AF37] text-[#12100E] hover:bg-amber-400 transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Pinjam Buku Lain untuk Siswa Ini
            </button>
            <button
              type="button"
              onClick={() => resetTransaction(true)}
              className="px-3.5 py-2 rounded-lg text-[11px] font-cinzel font-semibold bg-white/5 text-[#F4E8C1] border border-white/10 hover:border-[#D4AF37]/40 transition-colors flex items-center gap-1.5"
            >
              <UserRound className="w-3.5 h-3.5" />
              Pindai NISN Siswa Berikutnya
            </button>
          </div>
        </div>
      )}

      <BarcodeScanner
        isOpen={studentScanOpen}
        onClose={() => setStudentScanOpen(false)}
        onDetected={handleStudentScan}
        title="Langkah 1: Pindai NISN Kartu Pelajar"
        subtitle="Arahkan kamera ke barcode atau QR Code NISN pada kartu pelajar siswa (mendukung angka 0 di awal seperti 0081234567)."
        accent="emerald"
      />

      <BarcodeScanner
        isOpen={bookScanOpen}
        onClose={() => setBookScanOpen(false)}
        onDetected={handleBookScan}
        title="Langkah 2: Pindai Barcode Buku"
        subtitle={`Siswa: ${selectedMember?.name || '-'} (NISN: ${selectedMember?.nisn || '-'}) • Arahkan kamera ke barcode buku.`}
        accent="gold"
      />
    </section>
  );
}
