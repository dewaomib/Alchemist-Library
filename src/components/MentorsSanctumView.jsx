import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  RotateCcw,
  Sparkles,
  Users,
  Package
} from 'lucide-react';
import ReadingLogReviewPanel from './ReadingLogReviewPanel';
import ClassPackageDesk from './ClassPackageDesk';

export default function MentorsSanctumView({
  currentUser,
  books,
  teacherLoans,
  teacherLoanForm,
  setTeacherLoanForm,
  onSubmitTeacherLoan,
  readingLogs = [],
  onGradeReadingLog,
  packageLoanForm,
  setPackageLoanForm,
  onSubmitPackageLoan,
  onCompletePackageLoan,
  onOpenReader,
  onInspectBook
}) {
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected' | 'returned'

  const filteredLoans = teacherLoans.filter((l) => {
    if (filterStatus === 'all') return true;
    return l.status === filterStatus;
  });

  const selectedBook = books.find((b) => b.id === teacherLoanForm.bookId);

  return (
    <div className="space-y-10">
      {/* MENTOR HERO BANNER */}
      <section
        className="rounded-2xl p-6 sm:p-8 border relative overflow-hidden"
        style={{
          background: 'var(--theme-mentor-banner-bg)',
          borderColor: 'var(--theme-mentor-banner-border)'
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-[#12100E] border-2 border-sky-400 flex flex-col items-center justify-center shrink-0 shadow-xl">
              <GraduationCap className="w-10 h-10 text-sky-400" />
              <span className="text-[10px] font-cinzel font-bold text-sky-300 mt-0.5">
                MENTOR
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-cinzel bg-sky-500/20 text-sky-300 border border-sky-500/40">
                <Users className="w-3.5 h-3.5" />
                <span>GUILD MENTOR • FAKULTAS SAINS &amp; AKADEMI NUSANTARA</span>
              </div>
              <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#F4E8C1]">
                {currentUser?.name || 'Guru Pengampu'}
              </h1>
              <p className="text-xs sm:text-sm text-[#A89F91]">
                Pengampu Kurikulum Sains Alkimia • Fasilitator Peminjaman Kolektif Kelas Siswa
              </p>
            </div>
          </div>

          <div className="lg:col-span-4 grid grid-cols-2 gap-3 text-center">
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
              <span className="text-xs text-[#A89F91] block">Total Pinjaman Kelas</span>
              <span className="font-cinzel text-xl font-bold text-sky-400 mt-1 block">
                {teacherLoans.length}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
              <span className="text-xs text-[#A89F91] block">Menunggu Persetujuan</span>
              <span className="font-cinzel text-xl font-bold text-amber-400 mt-1 block">
                {teacherLoans.filter((l) => l.status === 'pending').length}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION BARU: PAKET KELAS 1 HARI */}
      {packageLoanForm && setPackageLoanForm && onSubmitPackageLoan && (
        <ClassPackageDesk
          books={books}
          form={packageLoanForm}
          setForm={setPackageLoanForm}
          onSubmit={onSubmitPackageLoan}
          packageLoans={teacherLoans}
          onCompletePackage={onCompletePackageLoan}
          onInspectBook={onInspectBook}
        />
      )}

      {/* SECTION BARU: REVIEW JURNAL LITERASI SISWA */}
      <ReadingLogReviewPanel
        readingLogs={readingLogs}
        books={books}
        onGradeLog={onGradeReadingLog}
        currentUser={currentUser}
      />

      {/* SECTION 1: FORMULIR PENGAJUAN PINJAMAN BUKU KELAS */}
      <section className="parchment-card rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-[#D4AF37]/20 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-cinzel text-xl font-bold text-[#F4E8C1] flex items-center gap-2">
              <Send className="w-5 h-5 text-sky-400" />
              <span>Formulir Permintaan Pinjam Grimoire Kelas</span>
            </h2>
            <p className="text-xs text-[#A89F91] mt-0.5">
              Ajukan peminjaman buku dalam jumlah banyak (paket kelas) kepada Grand Archivist untuk kegiatan belajar mengajar.
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 w-fit">
            Durasi Guru: 14 Hari
          </span>
        </div>

        <form onSubmit={onSubmitTeacherLoan} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Dropdown Grimoire */}
            <div className="md:col-span-2">
              <label className="block text-xs font-cinzel text-[#D4AF37] mb-1.5">
                PILIH GRIMOIRE / BUKU PELAJARAN:
              </label>
              <select
                required
                value={teacherLoanForm.bookId}
                onChange={(e) =>
                  setTeacherLoanForm({
                    ...teacherLoanForm,
                    bookId: e.target.value,
                    quantity: 1
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-sky-400"
              >
                <option value="">-- Pilih Grimoire dari Katalog Pustaka --</option>
                {books.map((b) => (
                  <option
                    key={b.id}
                    value={b.id}
                    disabled={b.availableStock <= 0}
                  >
                    {b.title} — Tersedia: {b.availableStock}/{b.totalStock} eksemplar {b.availableStock === 0 ? '(STOK HABIS)' : ''}
                  </option>
                ))}
              </select>
              {selectedBook && (
                <div className="mt-2 text-xs text-[#A89F91] flex items-center gap-3">
                  <span>
                    Stok Fisik Tersedia:{' '}
                    <strong className="text-emerald-400 font-bold">
                      {selectedBook.availableStock}
                    </strong>{' '}
                    dari {selectedBook.totalStock} eksemplar
                  </span>
                  <span>•</span>
                  <span>
                    Lokasi Rak: <span className="text-[#F4E8C1]">{selectedBook.shelf}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Jumlah Eksemplar */}
            <div>
              <label className="block text-xs font-cinzel text-[#D4AF37] mb-1.5">
                JUMLAH EKSEMPLAR:
              </label>
              <input
                type="number"
                min="1"
                max={selectedBook ? Math.max(1, selectedBook.availableStock) : 10}
                required
                value={teacherLoanForm.quantity}
                onChange={(e) =>
                  setTeacherLoanForm({
                    ...teacherLoanForm,
                    quantity: Math.max(1, Number(e.target.value))
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-sky-400"
              />
              <span className="text-[10px] text-[#A89F91] mt-1 block">
                Maksimal: {selectedBook ? selectedBook.availableStock : '-'} eksemplar
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nama Kelas */}
            <div>
              <label className="block text-xs font-cinzel text-[#D4AF37] mb-1.5">
                KELAS TARGET / ROMBEL:
              </label>
              <input
                type="text"
                required
                value={teacherLoanForm.className}
                onChange={(e) =>
                  setTeacherLoanForm({
                    ...teacherLoanForm,
                    className: e.target.value
                  })
                }
                placeholder="Contoh: Kelas XI MIPA 1"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-sky-400"
              />
            </div>

            {/* Durasi Peminjaman Guru */}
            <div>
              <label className="block text-xs font-cinzel text-[#D4AF37] mb-1.5">
                DURASI PEMINJAMAN (GURU):
              </label>
              <select
                value={teacherLoanForm.durationDays || 14}
                onChange={(e) =>
                  setTeacherLoanForm({
                    ...teacherLoanForm,
                    durationDays: Number(e.target.value)
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-sky-400"
              >
                <option value={14}>14 hari</option>
                <option value={21}>21 hari</option>
                <option value={30}>30 hari</option>
              </select>
              <span className="text-[10px] text-[#A89F91] mt-1 block">
                Siswa dibatasi maksimal 7 hari; guru 14&ndash;30 hari.
              </span>
            </div>

            {/* Catatan Keperluan */}
            <div>
              <label className="block text-xs font-cinzel text-[#D4AF37] mb-1.5">
                CATATAN PEMBELAJARAN / KEPERLUAN PRAKTIKUM:
              </label>
              <input
                type="text"
                value={teacherLoanForm.notes}
                onChange={(e) =>
                  setTeacherLoanForm({
                    ...teacherLoanForm,
                    notes: e.target.value
                  })
                }
                placeholder="Contoh: Modul praktikum fluida dinamis"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!selectedBook || selectedBook.availableStock <= 0}
              className={`px-6 py-3 rounded-xl font-cinzel font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg ${
                selectedBook && selectedBook.availableStock > 0
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:brightness-110'
                  : 'bg-white/10 text-[#A89F91] cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Ajukan Peminjaman Paket Kelas ke Archivist</span>
            </button>
          </div>
        </form>
      </section>

      {/* SECTION 2: DASHBOARD STATUS PINJAMAN KELAS GURU */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-sky-400 font-cinzel tracking-widest uppercase">
              <Clock className="w-3.5 h-3.5" />
              <span>LOGBOOK PEMINJAMAN KELAS</span>
            </div>
            <h2 className="font-cinzel text-2xl font-bold text-[#F4E8C1] mt-0.5">
              Dashboard Status Pinjaman Guru ({teacherLoans.length})
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: `Semua (${teacherLoans.length})` },
              { id: 'pending', label: `Menunggu (${teacherLoans.filter((l) => l.status === 'pending').length})` },
              { id: 'approved', label: `Aktif (${teacherLoans.filter((l) => l.status === 'approved').length})` },
              { id: 'rejected', label: `Ditolak (${teacherLoans.filter((l) => l.status === 'rejected').length})` },
              { id: 'returned', label: `Selesai (${teacherLoans.filter((l) => l.status === 'returned').length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all border ${
                  filterStatus === tab.id
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500 font-semibold'
                    : 'bg-[#1E1916] text-[#A89F91] border-white/10 hover:text-[#F4E8C1]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredLoans.length === 0 ? (
          <div className="parchment-card rounded-2xl p-10 text-center space-y-2">
            <BookOpen className="w-8 h-8 text-[#A89F91] mx-auto" />
            <p className="text-sm font-cinzel text-[#F4E8C1]">
              Tidak Ada Pinjaman Kelas dalam Kategori Ini
            </p>
            <p className="text-xs text-[#A89F91]">
              Gunakan formulir di atas untuk mengajukan peminjaman buku untuk kelas yang diampu.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLoans.map((loan) => {
              const book = books.find((b) => b.id === loan.bookId);
              return (
                <div
                  key={loan.id}
                  className="parchment-card rounded-2xl p-5 flex flex-col justify-between space-y-4 border transition-all hover:border-sky-500/40 shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl text-[#D4AF37]">
                          {book?.coverRune || '✦'}
                        </span>
                        <div>
                          <h3 className="font-cinzel font-bold text-sm text-[#F4E8C1] line-clamp-1">
                            {loan.bookTitle || book?.title}
                          </h3>
                          <p className="text-[11px] text-[#A89F91]">
                            {loan.className} • {loan.quantity} Eksemplar
                            {loan.isPackage
                              ? ` • ${loan.lessonHours || 'Paket Kelas'}`
                              : ''}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {loan.status === 'pending' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                          <Clock className="w-3 h-3" />
                          <span>Menunggu Kurator</span>
                        </span>
                      )}
                      {loan.status === 'approved' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Disetujui (Sedang Dipinjam)</span>
                        </span>
                      )}
                      {loan.status === 'rejected' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          <span>Ditolak</span>
                        </span>
                      )}
                      {loan.status === 'returned' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/40 flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" />
                          <span>Sudah Dikembalikan</span>
                        </span>
                      )}
                    </div>

                    {/* Loan Notes */}
                    {loan.notes && (
                      <p className="text-xs text-[#A89F91] bg-black/30 p-2.5 rounded-xl border border-white/5">
                        <strong className="text-[#F4E8C1]">Catatan Guru:</strong> {loan.notes}
                      </p>
                    )}

                    {/* Rejection Reason Notice */}
                    {loan.status === 'rejected' && loan.rejectionReason && (
                      <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs space-y-1">
                        <span className="font-cinzel font-bold text-rose-300 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Catatan Penolakan oleh Grand Archivist:</span>
                        </span>
                        <p className="text-rose-200/90 leading-relaxed">
                          {loan.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions & Dates */}
                  <div className="pt-3 border-t border-[#D4AF37]/15 flex items-center justify-between text-xs">
                    <span className="text-[#A89F91]">
                      Tgl Pinjam: <span className="text-[#F4E8C1]">{loan.borrowedDate}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      {book && (
                        <button
                          type="button"
                          onClick={() => onOpenReader(book)}
                          className="px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all flex items-center gap-1"
                          title="Buka pembaca digital buku ini"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Baca Digital</span>
                        </button>
                      )}
                      {loan.isPackage &&
                        loan.status === 'approved' &&
                        onCompletePackageLoan && (
                          <button
                            type="button"
                            onClick={() => onCompletePackageLoan(loan)}
                            className="px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold bg-emerald-500 text-[#12100E] hover:bg-emerald-400 transition-all flex items-center gap-1"
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>Selesai / Kembalikan Paket</span>
                          </button>
                        )}
                      {book && onInspectBook && (
                        <button
                          type="button"
                          onClick={() => onInspectBook(book.id)}
                          className="px-3 py-1.5 rounded-lg text-xs border border-[#D4AF37]/30 text-[#F4E8C1] hover:bg-[#D4AF37]/10"
                        >
                          Detail
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
