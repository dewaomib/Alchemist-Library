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
  MapPin,
  CheckSquare,
  Award,
  FileSpreadsheet,
  Upload,
  ExternalLink,
  ScanLine,
  Printer,
  BarChart3,
  MessageCircle
} from 'lucide-react';
import ExcelImportSection from './ExcelImportSection';
import QuickLoanDesk from './QuickLoanDesk';
import BarcodeLabelModal from './BarcodeLabelModal';
import LibraryReportsView from './LibraryReportsView';
import WhatsAppReminderModal from './WhatsAppReminderModal';
import { formatDateID, getLoanTiming, sortLoansByUrgency } from '../utils/loanUtils';

export default function ArchivistsChamberView({
  currentUser,
  books,
  loans,
  members = [],
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
  isSupabaseConfigured,
  isSeedingSupabase,
  onSeedSupabase,
  onOpenReader,
  onOpenPdfViewer,
  onInspectBook,
  ingredientsList,
  schoolsList
}) {
  const [activeSubTab, setActiveSubTab] = useState('queue'); // 'quick' | 'queue' | 'circulation' | 'inventory' | 'import_excel' | 'reports' | 'inscribe'
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [labelInitialBookId, setLabelInitialBookId] = useState(null);
  const [reminderLoan, setReminderLoan] = useState(null);

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
          (reminderLoan.borrowerCard && member.cardCode === reminderLoan.borrowerCard) ||
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
      (b.kodeBuku || b.id || '').toLowerCase().includes(q) ||
      (b.publisher || '').toLowerCase().includes(q)
    );
  });

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
                {currentUser.name}
              </h1>
              <p className="text-xs text-[#A89F91]">
                Pusat Kontrol Sirkulasi, Persetujuan Peminjaman, Import Excel Massal, &amp; Inventaris Grimoire
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('quick')}
                  className="px-3 py-2 rounded-xl text-[11px] font-cinzel font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/45 hover:bg-emerald-500/30 transition-colors flex items-center gap-1.5"
                >
                  <ScanLine className="w-3.5 h-3.5" />
                  Transaksi Kilat
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
              <span className="text-[11px] text-[#A89F91] block">Database</span>
              <span
                className="font-cinzel text-sm font-bold block mt-1"
                style={{ color: isSupabaseConfigured ? '#10B981' : '#F59E0B' }}
              >
                {isSupabaseConfigured ? 'Supabase' : 'Offline'}
              </span>
              <span className="text-[9px] text-[#A89F91]">
                {isSupabaseConfigured ? 'Sync Live' : 'Local Fallback'}
              </span>
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
          <span>Transaksi Kilat (Scan)</span>
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
          <span>Sirkulasi Pinjaman Aktif ({allApprovedLoans.length})</span>
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
          <span>Manajemen Stok Rak ({books.length})</span>
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
          <span>Import Excel (Bulk)</span>
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
          <span>Tambah Manual</span>
        </button>
      </div>

      {/* =========================================================
          SUB-TAB 0: QUICK LOAN DESK (BARCODE / QR SCANNING)
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
                Tidak ada permintaan peminjaman baru yang menunggu persetujuan. Semua permohonan dari siswa maupun guru sudah selesai diproses.
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

                      {isOutOfStock && (
                        <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                          <AlertCircle className="w-4 h-4" />
                          <span>
                            Peringatan: Stok fisik di rak ({book?.availableStock}) lebih sedikit dari jumlah permintaan ({loan.quantity}). Tambah stok terlebih dahulu atau tolak pengajuan ini.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-white/10">
                      {book && book.pdfUrl && onOpenPdfViewer && (
                        <button
                          type="button"
                          onClick={() => onOpenPdfViewer(book)}
                          className="px-3 py-2 rounded-xl text-xs font-cinzel text-purple-300 hover:bg-purple-500/20 border border-purple-500/30 transition-all flex items-center gap-1.5"
                          title="Lihat Berkas PDF"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Lihat PDF</span>
                        </button>
                      )}

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
          SUB-TAB 2: SIRKULASI PINJAMAN AKTIF (ACTIVE CIRCULATION)
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
                Daftar seluruh buku yang sedang berada di tangan Siswa maupun Guru. Verifikasi pengembalian untuk mengembalikan stok fisik buku ke rak.
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
                Gunakan tombol <strong>Ingatkan</strong> untuk mengirim pesan WhatsApp ke siswa,
                orang tua, atau wali kelas.
              </span>
            </div>
          )}

          {allApprovedLoans.length === 0 ? (
            <p className="text-xs text-[#A89F91] py-8 text-center">
              Tidak ada buku yang sedang berstatus dipinjam saat ini. Seluruh koleksi berada di dalam rak.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#D4AF37]/20 text-[#D4AF37] font-cinzel">
                    <th className="py-3 px-3">Judul Grimoire</th>
                    <th className="py-3 px-3">Peminjam</th>
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
                          {loan.requesterName}
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
                              title="Kirim pengingat WhatsApp"
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
          SUB-TAB 3: MANAJEMEN STOK INVENTARIS BUKU (STOCK MANAGER)
      ========================================================= */}
      {activeSubTab === 'inventory' && (
        <section className="parchment-card rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#D4AF37]/20 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-cinzel text-xl font-bold text-[#F4E8C1] flex items-center gap-2">
                <Database className="w-5 h-5 text-[#D4AF37]" />
                <span>Manajemen Inventaris Stok Rak Perpustakaan</span>
              </h2>
              <p className="text-xs text-[#A89F91] mt-0.5">
                Kelola jumlah total eksemplar dan stok tersedia di rak secara langsung dengan tombol [+] dan [-].
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
                placeholder="Cari judul, penulis, kode..."
                className="px-3.5 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37] sm:w-60"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D4AF37]/20 text-[#D4AF37] font-cinzel">
                  <th className="py-3 px-3">Kode</th>
                  <th className="py-3 px-3">Judul Grimoire</th>
                  <th className="py-3 px-3">Penulis &amp; Penerbit</th>
                  <th className="py-3 px-3">Kategori</th>
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
                            <p className="text-[10px] text-[#A89F91] italic">{book.subtitle}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-[#A89F91]">
                        <span className="text-[#F4E8C1] block font-medium">{book.author}</span>
                        <span className="text-[10px]">{book.publisher || 'Pustaka Sekolah'} {book.publicationYear ? `(${book.publicationYear})` : ''}</span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="text-[#D4AF37] block font-medium">{book.category}</span>
                        <span className="text-[10px] text-[#A89F91]">{book.shelf}</span>
                      </td>

                      {/* Total Stock Controls */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex items-center gap-2 bg-black/40 px-2 py-1 rounded-xl border border-white/10">
                          <button
                            type="button"
                            onClick={() => onAdjustStock(book.id, 'total', -1)}
                            className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-[#A89F91] hover:text-[#F4E8C1]"
                            title="Kurangi Total Stok"
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
                            title="Tambah Total Stok"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Available Stock Controls */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex items-center gap-2 bg-black/40 px-2 py-1 rounded-xl border border-white/10">
                          <button
                            type="button"
                            onClick={() => onAdjustStock(book.id, 'available', -1)}
                            className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-[#A89F91] hover:text-[#F4E8C1]"
                            title="Kurangi Stok Tersedia"
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
                            title="Tambah Stok Tersedia"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Format Badge */}
                      <td className="py-3.5 px-3 text-center">
                        {book.pdfUrl ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            Ada PDF
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/40">
                            Hanya Fisik
                          </span>
                        )}
                      </td>

                      {/* Action */}
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
                            title="Cetak label rak & barcode buku ini"
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
          SUB-TAB 4: FITUR IMPORT EXCEL (BULK IMPORT)
      ========================================================= */}
      {activeSubTab === 'import_excel' && (
        <section className="parchment-card rounded-2xl p-6 sm:p-8 space-y-6">
          <ExcelImportSection
            existingBooks={books}
            onImportBooks={onImportBulkBooks}
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
                  Inscribe New Grimoire (Daftarkan Buku Baru Manual)
                </h2>
                <p className="text-xs text-[#A89F91] mt-0.5">
                  Tambahkan buku satu per satu secara lengkap, atau gunakan fitur import Excel jika memiliki banyak data.
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    placeholder="Contoh: BK-LIT-001"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                    JUDUL GRIMOIRE / BUKU:
                  </label>
                  <input
                    type="text"
                    required
                    value={newBookForm.title}
                    onChange={(e) =>
                      setNewBookForm({ ...newBookForm, title: e.target.value })
                    }
                    placeholder="Contoh: Kimia Larutan &amp; Stoikiometri"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                    MPU PENULIS / PENGARANG:
                  </label>
                  <input
                    type="text"
                    required
                    value={newBookForm.author}
                    onChange={(e) =>
                      setNewBookForm({ ...newBookForm, author: e.target.value })
                    }
                    placeholder="Contoh: Dr. Budi Santoso"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                  />
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
                    placeholder="Contoh: Erlangga, Bentang Pustaka"
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
                    placeholder="2024"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                    CABANG KEILMUAN:
                  </label>
                  <select
                    value={newBookForm.category}
                    onChange={(e) =>
                      setNewBookForm({ ...newBookForm, category: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Alchemy">Alchemy (Sains &amp; Alam)</option>
                    <option value="Ancient Lore">Ancient Lore (Sejarah &amp; Peradaban)</option>
                    <option value="Bards Tales">Bard&apos;s Tales (Fiksi &amp; Sastra)</option>
                    <option value="Artificers Craft">Artificer&apos;s Craft (Teknologi &amp; Koding)</option>
                    <option value="Philosophy">Philosophy (Filsafat &amp; Budi Pekerti)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                    LOKASI RAK PERPUSTAKAAN:
                  </label>
                  <input
                    type="text"
                    value={newBookForm.shelf}
                    onChange={(e) =>
                      setNewBookForm({ ...newBookForm, shelf: e.target.value })
                    }
                    placeholder="Contoh: Menara Timur • Rak Alkimia C2"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                    TOTAL STOK EKSEMPLAR:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newBookForm.totalStock || 5}
                    onChange={(e) =>
                      setNewBookForm({
                        ...newBookForm,
                        totalStock: Number(e.target.value),
                        availableStock: Math.min(
                          Number(e.target.value),
                          newBookForm.availableStock || Number(e.target.value)
                        )
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                    STOK AWAL TERSEDIA DI RAK:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={newBookForm.totalStock || 5}
                    value={newBookForm.availableStock ?? 5}
                    onChange={(e) =>
                      setNewBookForm({
                        ...newBookForm,
                        availableStock: Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                    LINK COVER BUKU (OPSIONAL):
                  </label>
                  <input
                    type="url"
                    value={newBookForm.coverUrl || ''}
                    onChange={(e) =>
                      setNewBookForm({ ...newBookForm, coverUrl: e.target.value })
                    }
                    placeholder="URL gambar (Google Drive / Web)"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                    LINK PDF E-BOOK (OPSIONAL — KOSONGKAN JIKA HANYA ADA BUKU FISIK):
                  </label>
                  <input
                    type="url"
                    value={newBookForm.pdfUrl || ''}
                    onChange={(e) =>
                      setNewBookForm({ ...newBookForm, pdfUrl: e.target.value })
                    }
                    placeholder="URL file PDF Google Drive atau web langsung (misal: https://drive.google.com/file/d/...)"
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
                  placeholder="Tuliskan intisari buku dan manfaatnya bagi para cendekiawan..."
                  className="w-full p-3 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-cinzel font-bold text-xs bg-[#D4AF37] text-[#12100E] hover:bg-amber-400 transition-all flex items-center gap-2 shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>Inscribe Grimoire (Daftarkan Buku Baru)</span>
                </button>
              </div>
            </form>
          </section>

          {/* ONE-CLICK SUPABASE SEEDING */}
          <section className="parchment-card rounded-2xl p-6 border border-[#D4AF37]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-cinzel text-base font-bold text-[#F4E8C1] flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Supabase Cloud Auto-Seed &amp; Sync</span>
              </h3>
              <p className="text-xs text-[#A89F91] mt-0.5">
                Sinkronkan 12 koleksi awal, stok fisik buku, misi membaca, dan profil serikat ke tabel database cloud Supabase.
              </p>
            </div>

            <button
              type="button"
              onClick={onSeedSupabase}
              disabled={isSeedingSupabase}
              className={`px-5 py-2.5 rounded-xl font-cinzel font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
                isSeedingSupabase
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 cursor-wait'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-[#12100E]'
              }`}
            >
              <RefreshCw
                className={`w-4 h-4 ${isSeedingSupabase ? 'animate-spin' : ''}`}
              />
              <span>
                {isSeedingSupabase ? 'Menyinkronkan...' : 'Seed Data ke Supabase'}
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
