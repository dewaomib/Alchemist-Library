import React from 'react';
import {
  Package,
  Send,
  Clock,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  BookOpen,
  Layers,
  Sparkles,
  CalendarDays,
  Info
} from 'lucide-react';
import { addDays, formatDateID } from '../utils/loanUtils';

export default function ClassPackageDesk({
  books = [],
  form,
  setForm,
  onSubmit,
  packageLoans = [],
  onCompletePackage,
  onInspectBook,
  showStockInfo = false
}) {
  const selectedBook = books.find((book) => book.id === form.bookId) || null;
  const quantity = Math.max(1, Number(form.quantity) || 0);
  const availableStock = selectedBook?.availableStock ?? 0;
  const isStockEnough = Boolean(selectedBook) && quantity <= availableStock;
  const remainingStock = selectedBook
    ? Math.max(0, availableStock - quantity)
    : 0;
  const canSubmit = showStockInfo
    ? Boolean(selectedBook && isStockEnough && form.className && form.lessonHours)
    : Boolean(selectedBook && form.className && form.lessonHours);

  const activePackages = packageLoans.filter(
    (loan) => loan.isPackage && loan.status === 'approved'
  );
  const completedPackages = packageLoans
    .filter((loan) => loan.isPackage && loan.status === 'returned')
    .slice(0, 3);
  const dueTomorrow = formatDateID(addDays(new Date(), 1));

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#D4AF37] font-cinzel tracking-widest uppercase">
            <Package className="w-3.5 h-3.5" />
            <span>PAKET KERANJANG KELAS • PEMINJAMAN ROMBEL KILAT</span>
          </div>
          <h2 className="font-cinzel text-2xl font-bold text-[#F4E8C1] mt-0.5">
            Pinjam Paket Kelas (1 Hari)
          </h2>
          <p className="text-xs text-[#A89F91] mt-1 max-w-2xl">
            {showStockInfo
              ? 'Pilih satu judul buku, tentukan jumlah eksemplar dan jam pelajaran. Stok fisik berkurang otomatis, tenggat peminjaman satu hari, dan stok kembali saat paket ditandai selesai.'
              : 'Pilih satu judul buku, tentukan jumlah eksemplar dan jam pelajaran. Tenggat peminjaman satu hari dan paket ditandai selesai setelah kegiatan belajar berakhir.'}
          </p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center gap-1.5 w-fit">
          <Clock className="w-3.5 h-3.5" />
          Tenggat otomatis: {dueTomorrow}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Formulir paket */}
        <div className="xl:col-span-7 parchment-card rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#D4AF37]/20 pb-3">
            <Layers className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="font-cinzel font-bold text-base text-[#F4E8C1]">
              Formulir Paket Kelas
            </h3>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-cinzel text-[#D4AF37] mb-1.5">
                JUDUL BUKU (SATU JUDUL PER PAKET):
              </label>
              <select
                required
                value={form.bookId}
                onChange={(event) =>
                  setForm({ ...form, bookId: event.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="">-- Pilih Grimoire untuk Paket Kelas --</option>
                {books.map((book) => (
                  <option
                    key={book.id}
                    value={book.id}
                    disabled={showStockInfo && book.availableStock <= 0}
                  >
                    {showStockInfo
                      ? `${book.title} — Stok: ${book.availableStock}/${book.totalStock}${book.availableStock <= 0 ? ' (HABIS)' : ''}`
                      : `${book.title} (${book.jenjang || 'Umum'} • ${book.jurusan || 'Semua Jurusan'})`}
                  </option>
                ))}
              </select>
            </div>

            {selectedBook && (
              <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-2">
                {showStockInfo ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="text-[#A89F91]">
                        Stok fisik tersedia:{' '}
                        <strong className="text-emerald-300">{availableStock}</strong>{' '}
                        dari {selectedBook.totalStock} eksemplar
                      </span>
                      <span className="text-[#A89F91]">
                        Rak: <span className="text-[#F4E8C1]">{selectedBook.shelf}</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/60 border border-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#D4AF37]"
                        style={{
                          width: `${
                            selectedBook.totalStock
                              ? Math.min(100, (availableStock / selectedBook.totalStock) * 100)
                              : 0
                          }%`
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="text-[#A89F91]">
                      Kode Buku:{' '}
                      <span className="font-mono text-[#D4AF37]">{selectedBook.kodeBuku}</span>
                      {' • '}
                      <span className="text-[#F4E8C1]">{selectedBook.jenjang || 'Umum'}</span>
                    </span>
                    <span className="text-[#A89F91]">
                      Rak: <span className="text-[#F4E8C1]">{selectedBook.shelf}</span>
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-cinzel text-[#D4AF37] mb-1.5">
                  JUMLAH EKSEMPLAR:
                </label>
                <input
                  type="number"
                  min="1"
                  max={showStockInfo ? (selectedBook ? Math.max(1, availableStock) : 35) : 100}
                  required
                  value={form.quantity}
                  onChange={(event) =>
                    setForm({ ...form, quantity: event.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[30, 32, 35].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setForm({ ...form, quantity: preset })}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-[#D4AF37]/25 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
                    >
                      {preset} buku
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-cinzel text-[#D4AF37] mb-1.5">
                  KELAS / ROMBEL TUJUAN:
                </label>
                <input
                  type="text"
                  required
                  value={form.className}
                  onChange={(event) =>
                    setForm({ ...form, className: event.target.value })
                  }
                  placeholder="Contoh: Kelas X MIPA 2"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] placeholder-[#A89F91]/40 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-cinzel text-[#D4AF37] mb-1.5">
                  JAM PELAJARAN:
                </label>
                <input
                  type="text"
                  required
                  value={form.lessonHours}
                  onChange={(event) =>
                    setForm({ ...form, lessonHours: event.target.value })
                  }
                  placeholder="Contoh: Jam ke 3-4"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] placeholder-[#A89F91]/40 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs font-cinzel text-[#D4AF37] mb-1.5">
                  CATATAN PEMBELAJARAN (OPSIONAL):
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                  placeholder="Contoh: Diskusi bab 4"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] placeholder-[#A89F91]/40 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {selectedBook && (
              showStockInfo ? (
                <div
                  className={`p-3 rounded-xl border text-[11px] flex items-start gap-2 ${
                    isStockEnough
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                  }`}
                >
                  {isStockEnough ? (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  )}
                  <span>
                    {isStockEnough
                      ? `Stok mencukupi. Setelah paket diajukan, sisa stok fisik menjadi ${remainingStock} eksemplar dan tenggat pengembalian ${dueTomorrow}.`
                      : `Stok tidak cukup. Diminta ${quantity} eksemplar, tetapi hanya tersedia ${availableStock}. Kurangi jumlah atau pilih judul lain.`}
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl border text-[11px] flex items-start gap-2 bg-sky-500/10 border-sky-500/30 text-sky-200">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    Paket {quantity} eksemplar &ldquo;{selectedBook.title}&rdquo; siap diajukan dengan tenggat pengembalian {dueTomorrow}.
                  </span>
                </div>
              )
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <span className="text-[10px] text-[#A89F91] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#D4AF37]" />
                {showStockInfo
                  ? 'Paket langsung aktif tanpa antrean admin; stok terpotong otomatis.'
                  : 'Paket langsung aktif selama 1 hari sesuai jam pelajaran.'}
              </span>
              <button
                type="submit"
                disabled={!canSubmit}
                className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-cinzel font-bold flex items-center justify-center gap-2 transition-all ${
                  canSubmit
                    ? 'bg-gradient-to-r from-[#D4AF37] to-amber-500 text-[#12100E] hover:brightness-110 shadow-lg'
                    : 'bg-white/5 text-[#A89F91] cursor-not-allowed border border-white/10'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Pinjam Paket Kelas (1 Hari)</span>
              </button>
            </div>
          </form>
        </div>

        {/* Paket aktif */}
        <div className="xl:col-span-5 space-y-4">
          <div className="parchment-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
              <h3 className="font-cinzel font-bold text-base text-[#F4E8C1] flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Paket Aktif ({activePackages.length})
              </h3>
              <span className="text-[10px] text-[#A89F91]">Tenggat 1 hari</span>
            </div>

            {activePackages.length === 0 ? (
              <div className="p-8 text-center space-y-2 bg-black/20 rounded-xl border border-white/5">
                <Package className="w-7 h-7 text-[#A89F91] mx-auto" />
                <p className="text-xs font-cinzel text-[#F4E8C1]">
                  Tidak Ada Paket Kelas Aktif
                </p>
                <p className="text-[11px] text-[#A89F91]">
                  Paket yang diajukan akan muncul di sini beserta tombol
                  pengembalian.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                {activePackages.map((loan) => {
                  const loanBook = books.find((book) => book.id === loan.bookId);
                  return (
                    <div
                      key={loan.id}
                      className="p-3.5 rounded-xl bg-[#12100E] border border-sky-500/30 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="text-lg text-[#D4AF37] shrink-0">
                            {loanBook?.coverRune || '✦'}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-cinzel font-bold text-[#F4E8C1] truncate">
                              {loan.bookTitle || loanBook?.title}
                            </p>
                            <p className="text-[11px] text-[#A89F91]">
                              {loan.className} • {loan.quantity} eksemplar
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shrink-0">
                          Aktif
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                          <span className="text-[#A89F91] block">Jam Pelajaran</span>
                          <span className="text-[#F4E8C1] font-semibold">
                            {loan.lessonHours || 'Jam pelajaran'}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                          <span className="text-[#A89F91] block">Jatuh Tempo</span>
                          <span className="text-amber-300 font-semibold flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {formatDateID(loan.dueDate)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onCompletePackage(loan)}
                          className="flex-1 px-3 py-2 rounded-lg text-[11px] font-cinzel font-bold bg-emerald-500 text-[#12100E] hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Selesai / Kembalikan Paket
                        </button>
                        {loanBook && onInspectBook && (
                          <button
                            type="button"
                            onClick={() => onInspectBook(loanBook.id)}
                            className="px-3 py-2 rounded-lg text-[11px] border border-[#D4AF37]/30 text-[#F4E8C1] hover:bg-[#D4AF37]/10"
                          >
                            Detail
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {completedPackages.length > 0 && (
            <div className="parchment-card rounded-2xl p-4 space-y-2">
              <h4 className="text-[11px] font-cinzel uppercase tracking-wider text-[#A89F91] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Paket Selesai Terakhir
              </h4>
              {completedPackages.map((loan) => (
                <div
                  key={loan.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-black/20 border border-white/5 text-[11px]"
                >
                  <span className="text-[#F4E8C1] truncate">
                    {loan.bookTitle || loan.bookId}
                  </span>
                  <span className="text-[#A89F91] shrink-0">
                    {loan.className} • {loan.quantity} eks.
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 rounded-xl bg-sky-500/5 border border-sky-500/20 text-[11px] text-[#A89F91] flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
            <span>
              Paket kelas dihitung sebagai buku dibaca pada Leaderboard Kelas
              Ter-Literat bulan berjalan.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
