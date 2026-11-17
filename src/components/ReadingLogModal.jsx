import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  BookOpen,
  Scroll,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Send,
  Quote,
  Feather,
  Clock
} from 'lucide-react';
import {
  getSummaryValidation,
  MIN_SUMMARY_WORDS,
  RECOMMENDED_SUMMARY_WORDS
} from '../utils/readingUtils';

export default function ReadingLogModal({
  book,
  existingLog,
  currentUser,
  onClose,
  onSubmit
}) {
  const [lastPageRead, setLastPageRead] = useState('');
  const [favoriteQuote, setFavoriteQuote] = useState('');
  const [summary, setSummary] = useState('');

  useEffect(() => {
    if (!book) return;
    setLastPageRead(existingLog?.lastPageRead || '');
    setFavoriteQuote(existingLog?.favoriteQuote || '');
    setSummary(existingLog?.summary || '');
  }, [book, existingLog]);

  const validation = useMemo(() => getSummaryValidation(summary), [summary]);

  if (!book) return null;

  const isResubmission = Boolean(existingLog);
  const wasGraded = existingLog?.status === 'graded';
  const pageLimit = Number(book.pages) || 9999;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validation.isValid) return;
    if (!lastPageRead || Number(lastPageRead) < 1) return;

    onSubmit({
      lastPageRead: Math.min(pageLimit, Math.max(1, Number(lastPageRead))),
      favoriteQuote: favoriteQuote.trim(),
      summary: summary.trim(),
      wordCount: validation.wordCount
    });
  };

  const meterTone =
    validation.tone === 'emerald'
      ? 'bg-emerald-400'
      : validation.tone === 'sky'
      ? 'bg-sky-400'
      : 'bg-amber-400';

  const meterText =
    validation.tone === 'emerald'
      ? 'text-emerald-300'
      : validation.tone === 'sky'
      ? 'text-sky-300'
      : 'text-amber-300';

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Formulir Jurnal Refleksi Literasi"
    >
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl w-full rounded-2xl border p-6 sm:p-8 space-y-5 relative my-8 max-h-[92vh] overflow-y-auto"
        style={{
          backgroundColor: '#1E1916',
          borderColor: '#10B981',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.95)'
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-[#A89F91] hover:text-[#F4E8C1] hover:border-[#10B981]/50 transition-colors"
          aria-label="Tutup formulir jurnal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3 pr-10">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Feather className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-cinzel uppercase tracking-widest text-emerald-400">
              GLS • JURNAL REFLEKSI LITERASI
            </span>
            <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-[#F4E8C1]">
              {isResubmission ? 'Perbarui Jurnal Literasi' : 'Tulis Jurnal Literasi'}
            </h2>
            <p className="text-xs text-[#A89F91] mt-1">
              {currentUser?.name || 'Scholar'} • {book.title}
            </p>
          </div>
        </div>

        {isResubmission && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              wasGraded
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                : 'bg-sky-500/10 border-sky-500/40 text-sky-200'
            }`}
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              {wasGraded
                ? 'Jurnal ini sudah dinilai guru. Menyimpan perubahan akan mengirim ulang jurnal dan mengubah statusnya menjadi Belum Dinilai.'
                : 'Kamu sudah memiliki jurnal untuk buku ini. Perubahan akan memperbarui jurnal yang sama, bukan membuat duplikat.'}
            </span>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-black/30 border border-white/10 flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-[#D4AF37] shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-cinzel font-bold text-[#F4E8C1] truncate">
              {book.title}
            </p>
            <p className="text-[11px] text-[#A89F91] truncate">
              {book.author} • {book.pages} halaman • {book.shelf}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-cinzel text-[#D4AF37] mb-1.5">
            HALAMAN TERAKHIR YANG DIBACA:
          </label>
          <input
            type="number"
            min="1"
            max={pageLimit}
            required
            value={lastPageRead}
            onChange={(event) => setLastPageRead(event.target.value)}
            placeholder={`Contoh: ${Math.min(pageLimit, 120)}`}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] placeholder-[#A89F91]/40 focus:outline-none focus:border-emerald-400"
          />
          <span className="text-[10px] text-[#A89F91] mt-1 block">
            Maksimal {pageLimit} halaman sesuai data buku.
          </span>
        </div>

        <div>
          <label className="block text-xs font-cinzel text-[#D4AF37] mb-1.5">
            KUTIPAN FAVORIT:
          </label>
          <div className="relative">
            <Quote className="w-4 h-4 text-[#D4AF37]/60 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              required
              value={favoriteQuote}
              onChange={(event) => setFavoriteQuote(event.target.value)}
              placeholder="Tulis kalimat dari buku yang paling berkesan..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] placeholder-[#A89F91]/40 focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <label className="text-xs font-cinzel text-[#D4AF37]">
              RINGKASAN HIKMAH &amp; REFLEKSI:
            </label>
            <span className={`text-[11px] font-semibold ${meterText}`}>
              {validation.wordCount} kata
            </span>
          </div>
          <textarea
            rows={7}
            required
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Ceritakan isi buku, pelajaran yang kamu dapat, dan bagaimana buku ini memengaruhi cara berpikirmu..."
            className="w-full px-3.5 py-3 rounded-xl text-sm leading-relaxed bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] placeholder-[#A89F91]/40 focus:outline-none focus:border-emerald-400 resize-y min-h-[150px]"
          />
          <div className="mt-2">
            <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${meterTone}`}
                style={{
                  width: `${Math.min(
                    100,
                    (validation.wordCount / MIN_SUMMARY_WORDS) * 100
                  )}%`
                }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 mt-1.5">
              <span
                className={`text-[11px] flex items-center gap-1 ${
                  validation.isValid ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                {validation.isValid ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                <span>{validation.message}</span>
              </span>
              <span className="text-[10px] text-[#A89F91]">
                Ideal {MIN_SUMMARY_WORDS}–{RECOMMENDED_SUMMARY_WORDS} kata
              </span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-[#A89F91] flex items-start gap-2">
          <Clock className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <span>
            Jurnal akan langsung masuk ke Dashboard Guru dengan status
            <strong className="text-amber-300"> Belum Dinilai</strong> sampai guru
            memberikan skor dan umpan balik.
          </span>
        </div>

        <div className="pt-2 border-t border-[#D4AF37]/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <span className="text-[11px] text-[#A89F91] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            Satu jurnal per buku • dapat diperbarui kapan saja
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-cinzel font-semibold border border-white/10 text-[#A89F91] hover:text-[#F4E8C1] hover:bg-white/5 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!validation.isValid || !lastPageRead || !favoriteQuote.trim()}
              className={`px-5 py-2.5 rounded-xl text-xs font-cinzel font-bold flex items-center gap-2 transition-all ${
                validation.isValid && lastPageRead && favoriteQuote.trim()
                  ? 'bg-gradient-to-r from-emerald-500 to-[#D4AF37] text-[#12100E] hover:brightness-110 shadow-lg'
                  : 'bg-white/5 text-[#A89F91] cursor-not-allowed border border-white/10'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{isResubmission ? 'Kirim Ulang Jurnal' : 'Kirim Jurnal Literasi'}</span>
            </button>
          </div>
        </div>

        <div className="sr-only" aria-live="polite">
          {validation.wordCount} kata. {validation.message}
        </div>
      </form>
    </div>
  );
}
