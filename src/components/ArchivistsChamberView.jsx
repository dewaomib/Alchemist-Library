import React, { useState } from 'react';
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
  Award
} from 'lucide-react';

export default function ArchivistsChamberView({
  currentUser,
  books,
  loans,
  allPendingLoans,
  allApprovedLoans,
  onApproveLoan,
  onRejectLoan,
  onVerifyReturnLoan,
  onAdjustStock,
  newBookForm,
  setNewBookForm,
  onAddNewBook,
  isSupabaseConfigured,
  isSeedingSupabase,
  onSeedSupabase,
  onOpenReader,
  onInspectBook,
  ingredientsList,
  schoolsList
}) {
  const [activeSubTab, setActiveSubTab] = useState('queue'); // 'queue' | 'circulation' | 'inventory' | 'inscribe'
  const [stockSearchQuery, setStockSearchQuery] = useState('');

  const filteredInventoryBooks = books.filter((b) => {
    const q = stockSearchQuery.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
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
                Pusat Kontrol Sirkulasi, Persetujuan Peminjaman Siswa/Guru, &amp; Inventaris Grimoire
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
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
          onClick={() => setActiveSubTab('inscribe')}
          className={`px-4 py-2.5 rounded-xl font-cinzel text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'inscribe'
              ? 'bg-[#D4AF37] text-[#12100E] shadow-lg'
              : 'bg-[#1E1916] text-[#A89F91] hover:text-[#F4E8C1] border border-white/10'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Grimoire Baru</span>
        </button>
      </div>

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
                      {book && (
                        <button
                          type="button"
                          onClick={() => onOpenReader(book)}
                          className="px-3 py-2 rounded-xl text-xs font-cinzel text-purple-300 hover:bg-purple-500/20 border border-purple-500/30 transition-all flex items-center gap-1.5"
                          title="Preview E-Grimoire Digital"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Baca Digital</span>
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
                    <th className="py-3 px-3">Jumlah</th>
                    <th className="py-3 px-3">Tgl Pinjam</th>
                    <th className="py-3 px-3">Batas Waktu</th>
                    <th className="py-3 px-3 text-right">Aksi Kurator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allApprovedLoans.map((loan) => {
                    const book = books.find((b) => b.id === loan.bookId);
                    return (
                      <tr key={loan.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-3 font-semibold text-[#F4E8C1]">
                          <div className="flex items-center gap-2">
                            <span className="text-[#D4AF37]">{book?.coverRune || '✦'}</span>
                            <span>{loan.bookTitle || book?.title}</span>
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
                          <span className="text-[#A89F91] ml-1.5">{loan.className}</span>
                        </td>
                        <td className="py-3.5 px-3 font-bold text-amber-400">
                          {loan.quantity || 1} Eksemplar
                        </td>
                        <td className="py-3.5 px-3 text-[#A89F91]">
                          {loan.borrowedDate}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-semibold text-amber-400">
                            {loan.daysLeft ?? 7} Hari Tersisa
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => onVerifyReturnLoan(loan)}
                            className="px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all"
                          >
                            Verifikasi Kembali (+Stok)
                          </button>
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

            <input
              type="text"
              value={stockSearchQuery}
              onChange={(e) => setStockSearchQuery(e.target.value)}
              placeholder="Cari buku untuk sesuaikan stok..."
              className="px-3.5 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37] sm:w-64"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D4AF37]/20 text-[#D4AF37] font-cinzel">
                  <th className="py-3 px-3">Judul Grimoire</th>
                  <th className="py-3 px-3">Kategori &amp; Rak</th>
                  <th className="py-3 px-3 text-center">Total Stok Fisik</th>
                  <th className="py-3 px-3 text-center">Stok Tersedia di Rak</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">E-Grimoire</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredInventoryBooks.map((book) => {
                  const isAvailable = book.availableStock > 0;
                  return (
                    <tr key={book.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-3 font-semibold text-[#F4E8C1]">
                        <div className="flex items-center gap-2">
                          <span className="text-lg text-[#D4AF37]">{book.coverRune}</span>
                          <div>
                            <p className="font-cinzel font-bold">{book.title}</p>
                            <p className="text-[10px] text-[#A89F91] italic">{book.subtitle}</p>
                          </div>
                        </div>
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

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isAvailable
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {isAvailable ? 'Tersedia di Rak' : 'Stok Fisik Habis (Digital Only)'}
                        </span>
                      </td>

                      {/* Digital Reader Preview */}
                      <td className="py-3.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenReader(book)}
                          className="px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all"
                        >
                          Baca Digital
                        </button>
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
          SUB-TAB 4: INSCRIBE NEW GRIMOIRE FORM & SEEDING
      ========================================================= */}
      {activeSubTab === 'inscribe' && (
        <div className="space-y-8">
          <section className="parchment-card rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-[#D4AF37]/20 pb-4 flex items-center justify-between">
              <div>
                <h2 className="font-cinzel text-xl font-bold text-[#F4E8C1]">
                  Inscribe New Grimoire (Daftarkan Buku Baru)
                </h2>
                <p className="text-xs text-[#A89F91] mt-0.5">
                  Tambahkan buku baru lengkap dengan total eksemplar, stok awal rak, dan teks bacaan digital.
                </p>
              </div>
              <Plus className="w-5 h-5 text-[#D4AF37]" />
            </div>

            <form onSubmit={onAddNewBook} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                    JUDUL GRIMOIRE:
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
                    SUB-JUDUL FANTASI:
                  </label>
                  <input
                    type="text"
                    value={newBookForm.subtitle}
                    onChange={(e) =>
                      setNewBookForm({ ...newBookForm, subtitle: e.target.value })
                    }
                    placeholder="Contoh: Transmutation of Chemical Solutions"
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
                    ISBN:
                  </label>
                  <input
                    type="text"
                    value={newBookForm.isbn}
                    onChange={(e) =>
                      setNewBookForm({ ...newBookForm, isbn: e.target.value })
                    }
                    placeholder="978-602-000-000-0"
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
                    HADIAH SCHOLAR XP:
                  </label>
                  <input
                    type="number"
                    value={newBookForm.xpReward}
                    onChange={(e) =>
                      setNewBookForm({
                        ...newBookForm,
                        xpReward: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                  TEKS BACAAN DIGITAL BAB 1 (E-GRIMOIRE):
                </label>
                <textarea
                  rows={3}
                  value={newBookForm.digitalContentText || ''}
                  onChange={(e) =>
                    setNewBookForm({
                      ...newBookForm,
                      digitalContentText: e.target.value
                    })
                  }
                  placeholder="Tuliskan isi bab bacaan digital atau biarkan kosong untuk menghasilkan bab naskah alkimia otomatis..."
                  className="w-full p-3 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                />
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
    </div>
  );
}
