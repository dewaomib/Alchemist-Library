import React, { useEffect, useMemo, useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Clock,
  CheckCircle2,
  FileText,
  MessageSquareQuote,
  Send,
  Users,
  Award,
  Quote,
  Sparkles,
  Save
} from 'lucide-react';
import { formatDateID } from '../utils/loanUtils';
import {
  getReadingLogStatusMeta,
  getReadingLogWordCount
} from '../utils/readingUtils';

const STATUS_FILTERS = [
  { id: 'all', label: 'Semua Jurnal' },
  { id: 'submitted', label: 'Belum Dinilai' },
  { id: 'graded', label: 'Sudah Dinilai' }
];

export default function ReadingLogReviewPanel({
  readingLogs = [],
  books = [],
  onGradeLog,
  currentUser
}) {
  const [filterClass, setFilterClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');

  const classOptions = useMemo(() => {
    return [...new Set(readingLogs.map((log) => log.className).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b)
    );
  }, [readingLogs]);

  const filteredLogs = useMemo(() => {
    return readingLogs
      .filter((log) => {
        if (filterClass !== 'all' && log.className !== filterClass) return false;
        if (filterStatus !== 'all' && log.status !== filterStatus) return false;
        return true;
      })
      .sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      });
  }, [readingLogs, filterClass, filterStatus]);

  const selectedLog =
    filteredLogs.find((log) => log.id === selectedId) || filteredLogs[0] || null;

  useEffect(() => {
    if (filteredLogs.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!filteredLogs.some((log) => log.id === selectedId)) {
      setSelectedId(filteredLogs[0].id);
    }
  }, [filteredLogs, selectedId]);

  useEffect(() => {
    setScore(selectedLog?.score ?? '');
    setFeedback(selectedLog?.feedback || '');
  }, [selectedLog?.id, selectedLog?.score, selectedLog?.feedback]);

  const selectedBook = selectedLog
    ? books.find((book) => book.id === selectedLog.bookId)
    : null;

  const submittedCount = readingLogs.filter((log) => log.status !== 'graded').length;
  const gradedCount = readingLogs.filter((log) => log.status === 'graded').length;
  const classCount = new Set(readingLogs.map((log) => log.className).filter(Boolean)).size;

  const handleSubmitGrade = (event) => {
    event.preventDefault();
    if (!selectedLog) return;
    const numericScore = Number(score);
    if (score === '' || Number.isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      return;
    }
    onGradeLog(selectedLog, {
      score: Math.round(numericScore),
      feedback: feedback.trim()
    });
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-cinzel tracking-widest uppercase">
            <FileText className="w-3.5 h-3.5" />
            <span>GLS • JURNAL REFLEKSI LITERASI</span>
          </div>
          <h2 className="font-cinzel text-2xl font-bold text-[#F4E8C1] mt-0.5">
            Review Jurnal Siswa ({readingLogs.length})
          </h2>
          <p className="text-xs text-[#A89F91] mt-1 max-w-2xl">
            Baca refleksi siswa, filter berdasarkan kelas, lalu berikan skor 0–100
            dan catatan umpan balik. Status berubah otomatis dari
            <span className="text-amber-300"> Belum Dinilai</span> menjadi
            <span className="text-emerald-300"> Sudah Dinilai</span>.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center shrink-0">
          <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <span className="text-[10px] text-[#A89F91] block">Belum Dinilai</span>
            <span className="font-cinzel text-lg font-bold text-amber-300">{submittedCount}</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-[10px] text-[#A89F91] block">Sudah Dinilai</span>
            <span className="font-cinzel text-lg font-bold text-emerald-300">{gradedCount}</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-black/30 border border-white/10">
            <span className="text-[10px] text-[#A89F91] block">Kelas</span>
            <span className="font-cinzel text-lg font-bold text-[#D4AF37]">{classCount}</span>
          </div>
        </div>
      </div>

      <div className="parchment-card rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {STATUS_FILTERS.map((item) => {
              const count =
                item.id === 'all'
                  ? readingLogs.length
                  : readingLogs.filter((log) => log.status === item.id).length;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilterStatus(item.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap border transition-all ${
                    filterStatus === item.id
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-semibold'
                      : 'bg-[#12100E] text-[#A89F91] border-white/10 hover:text-[#F4E8C1]'
                  }`}
                >
                  {item.label} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <select
              value={filterClass}
              onChange={(event) => setFilterClass(event.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-emerald-400 min-w-[180px]"
              aria-label="Filter jurnal berdasarkan kelas"
            >
              <option value="all">Semua Kelas ({readingLogs.length})</option>
              {classOptions.map((className) => (
                <option key={className} value={className}>
                  {className} (
                  {readingLogs.filter((log) => log.className === className).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center space-y-2 bg-black/20 rounded-xl border border-white/5">
            <BookOpen className="w-8 h-8 text-[#A89F91] mx-auto" />
            <p className="text-sm font-cinzel text-[#F4E8C1]">
              Tidak Ada Jurnal pada Filter Ini
            </p>
            <p className="text-xs text-[#A89F91]">
              Coba ganti kelas atau status untuk melihat jurnal lain.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Daftar jurnal */}
            <div className="lg:col-span-5 space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {filteredLogs.map((log) => {
                const meta = getReadingLogStatusMeta(log.status);
                const isActive = selectedLog?.id === log.id;
                const logBook = books.find((book) => book.id === log.bookId);
                return (
                  <button
                    key={log.id}
                    type="button"
                    onClick={() => setSelectedId(log.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-emerald-500/10 border-emerald-500/60 shadow-[0_0_18px_rgba(16,185,129,0.12)]'
                        : 'bg-black/25 border-white/10 hover:border-[#D4AF37]/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="text-xl text-[#D4AF37] shrink-0">
                          {logBook?.coverRune || '✦'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#F4E8C1] truncate">
                            {log.studentName}
                          </p>
                          <p className="text-[11px] text-[#A89F91] truncate">
                            {log.className} • {log.bookTitle}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#A89F91]/90 mt-2 line-clamp-2 leading-relaxed">
                      {log.summary}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-2 text-[10px] text-[#A89F91]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateID(log.createdAt)}
                      </span>
                      <span className="text-[#D4AF37]">
                        {getReadingLogWordCount(log)} kata
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detail & penilaian */}
            <div className="lg:col-span-7 rounded-xl border border-[#D4AF37]/25 bg-[#12100E]/80 p-4 sm:p-5 space-y-4 max-h-[560px] overflow-y-auto">
              {selectedLog && (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-cinzel font-bold text-[#F4E8C1]">
                          {selectedLog.studentName}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A89F91] mt-0.5">
                        {selectedLog.className} • {selectedLog.studentCard || selectedLog.studentId}
                      </p>
                    </div>
                    {(() => {
                      const meta = getReadingLogStatusMeta(selectedLog.status);
                      return (
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full border ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="p-3 rounded-xl bg-black/30 border border-white/10 flex items-start gap-2.5">
                    <BookOpen className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#F4E8C1]">
                        {selectedLog.bookTitle}
                      </p>
                      <p className="text-[11px] text-[#A89F91]">
                        Halaman terakhir dibaca:{' '}
                        <span className="text-emerald-300 font-semibold">
                          {selectedLog.lastPageRead}
                        </span>
                        {selectedBook ? ` / ${selectedBook.pages}` : ''} •{' '}
                        {getReadingLogWordCount(selectedLog)} kata
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#1E1916] border border-[#D4AF37]/20">
                    <span className="text-[10px] font-cinzel uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                      <Quote className="w-3.5 h-3.5" />
                      Kutipan Favorit
                    </span>
                    <p className="text-xs italic text-[#F4E8C1]/90 mt-1.5 leading-relaxed">
                      &ldquo;{selectedLog.favoriteQuote}&rdquo;
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-cinzel uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5 mb-1.5">
                      <MessageSquareQuote className="w-3.5 h-3.5" />
                      Ringkasan Hikmah &amp; Refleksi
                    </span>
                    <p className="text-xs sm:text-sm text-[#F4E8C1]/90 leading-relaxed whitespace-pre-line bg-black/20 p-3 rounded-xl border border-white/5">
                      {selectedLog.summary}
                    </p>
                  </div>

                  {selectedLog.status === 'graded' && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-emerald-300 font-cinzel font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Penilaian Sebelumnya
                        </span>
                        <span className="text-lg font-cinzel font-bold text-emerald-300">
                          {selectedLog.score}/100
                        </span>
                      </div>
                      {selectedLog.feedback && (
                        <p className="text-[11px] text-emerald-100/80 leading-relaxed">
                          {selectedLog.feedback}
                        </p>
                      )}
                      <p className="text-[10px] text-[#A89F91]">
                        Dinilai oleh {selectedLog.gradedBy || 'Guru'} •{' '}
                        {formatDateID(selectedLog.gradedAt || selectedLog.updatedAt)}
                      </p>
                    </div>
                  )}

                  <form
                    onSubmit={handleSubmitGrade}
                    className="pt-3 border-t border-[#D4AF37]/20 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-cinzel font-bold text-[#F4E8C1] flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-[#D4AF37]" />
                        Beri Nilai &amp; Umpan Balik
                      </h4>
                      <span className="text-[10px] text-[#A89F91]">
                        Dinilai oleh: {currentUser?.name || 'Guru'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-cinzel text-[#D4AF37] mb-1">
                          SKOR (0–100)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          value={score}
                          onChange={(event) => setScore(event.target.value)}
                          placeholder="85"
                          className="w-full px-3 py-2 rounded-xl text-sm bg-[#1E1916] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-cinzel text-[#D4AF37] mb-1">
                          CATATAN UMPAN BALIK
                        </label>
                        <textarea
                          rows={3}
                          value={feedback}
                          onChange={(event) => setFeedback(event.target.value)}
                          placeholder="Apresiasi kekuatan refleksi dan sarankan perbaikan konkret..."
                          className="w-full px-3 py-2 rounded-xl text-xs bg-[#1E1916] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-emerald-400 resize-y min-h-[74px]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] text-[#A89F91] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                        Nilai dapat diperbarui kapan saja.
                      </span>
                      <button
                        type="submit"
                        disabled={score === ''}
                        className={`px-4 py-2.5 rounded-xl text-xs font-cinzel font-bold flex items-center gap-2 transition-all ${
                          score === ''
                            ? 'bg-white/5 text-[#A89F91] cursor-not-allowed border border-white/10'
                            : 'bg-gradient-to-r from-emerald-500 to-[#D4AF37] text-[#12100E] hover:brightness-110 shadow-lg'
                        }`}
                      >
                        <Save className="w-4 h-4" />
                        <span>
                          {selectedLog.status === 'graded'
                            ? 'Perbarui Penilaian'
                            : 'Simpan Nilai & Umpan Balik'}
                        </span>
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
