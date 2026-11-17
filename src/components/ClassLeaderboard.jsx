import React from 'react';
import {
  Trophy,
  Crown,
  Award,
  BookOpen,
  Scroll,
  Users,
  Sparkles,
  TrendingUp,
  Medal
} from 'lucide-react';
import { getClassDisplayName } from '../utils/readingUtils';

const RANK_STYLES = [
  {
    row: 'border-[#D4AF37]/60 bg-gradient-to-r from-[#D4AF37]/15 via-amber-500/5 to-transparent',
    badge: 'bg-[#D4AF37] text-[#12100E]',
    bar: 'from-[#D4AF37] to-amber-300'
  },
  {
    row: 'border-slate-300/30 bg-gradient-to-r from-slate-300/10 to-transparent',
    badge: 'bg-slate-300 text-[#12100E]',
    bar: 'from-slate-300 to-slate-500'
  },
  {
    row: 'border-amber-700/40 bg-gradient-to-r from-amber-700/10 to-transparent',
    badge: 'bg-amber-700 text-[#F4E8C1]',
    bar: 'from-amber-700 to-amber-500'
  }
];

export default function ClassLeaderboard({
  leaderboard = [],
  monthLabel = '',
  highlightClass = ''
}) {
  const leader = leaderboard[0] || null;
  const maxTotal = Math.max(1, leader?.totalBooks || 1);
  const normalizedHighlight = String(highlightClass || '').trim().toLowerCase();

  return (
    <section className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#D4AF37] font-cinzel tracking-widest uppercase">
            <Trophy className="w-3.5 h-3.5" />
            <span>GAMIFIKASI LITERASI ANTAR-KELAS</span>
          </div>
          <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#F4E8C1] mt-1">
            Leaderboard Kelas Ter-Literat
          </h2>
          <p className="text-xs text-[#A89F91] mt-1 max-w-2xl">
            Total buku dipinjam/dibaca ditambah jurnal literasi yang diselesaikan
            pada bulan berjalan. Ayo bawa kelasmu ke puncak!
          </p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 w-fit">
          <Sparkles className="w-3.5 h-3.5" />
          {monthLabel || 'Bulan Berjalan'}
        </span>
      </div>

      {!leader ? (
        <div className="parchment-card rounded-2xl p-10 text-center space-y-2">
          <Trophy className="w-9 h-9 text-[#A89F91] mx-auto" />
          <p className="text-sm font-cinzel text-[#F4E8C1]">
            Leaderboard Belum Memiliki Data
          </p>
          <p className="text-xs text-[#A89F91]">
            Pinjam buku atau selesaikan jurnal literasi untuk mengumpulkan poin
            bagi kelasmu bulan ini.
          </p>
        </div>
      ) : (
        <>
          {/* Banner Peringkat 1 */}
          <div
            className="relative rounded-2xl border overflow-hidden p-5 sm:p-7"
            style={{
              borderColor: '#D4AF37',
              background:
                'radial-gradient(circle at 88% 12%, rgba(212, 175, 55, 0.35), rgba(16, 185, 129, 0.12) 42%, #1E1916 88%)',
              boxShadow: '0 18px 45px -22px rgba(212, 175, 55, 0.55)'
            }}
          >
            <div className="pointer-events-none absolute -right-12 -top-12 w-48 h-48 rounded-full border border-[#D4AF37]/20 animate-rune-spin" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#D4AF37] text-[#12100E] flex items-center justify-center shrink-0 shadow-lg">
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-cinzel font-bold uppercase tracking-widest text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    <Crown className="w-3 h-3" />
                    Peringkat 1 Bulan Ini
                  </div>
                  <p className="font-cinzel text-xl sm:text-2xl font-bold text-[#F4E8C1] mt-2 leading-snug">
                    Kelas {leader.shortName} memimpin dengan{' '}
                    <span className="gold-gradient-text">{leader.totalBooks} buku</span>{' '}
                    dibaca bulan ini!
                  </p>
                  <p className="text-xs text-[#A89F91] mt-1.5">
                    {leader.borrowedBooks} eksemplar dipinjam • {leader.journals}{' '}
                    jurnal literasi selesai • {leader.readers} pembaca aktif
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center shrink-0">
                <div className="px-3 py-2.5 rounded-xl bg-black/35 border border-white/10">
                  <span className="text-[10px] text-[#A89F91] block">Buku</span>
                  <span className="font-cinzel text-lg font-bold text-[#D4AF37]">
                    {leader.borrowedBooks}
                  </span>
                </div>
                <div className="px-3 py-2.5 rounded-xl bg-black/35 border border-white/10">
                  <span className="text-[10px] text-[#A89F91] block">Jurnal</span>
                  <span className="font-cinzel text-lg font-bold text-emerald-300">
                    {leader.journals}
                  </span>
                </div>
                <div className="px-3 py-2.5 rounded-xl bg-black/35 border border-white/10">
                  <span className="text-[10px] text-[#A89F91] block">Total</span>
                  <span className="font-cinzel text-lg font-bold text-purple-300">
                    {leader.totalBooks}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Daftar peringkat */}
          <div className="grid grid-cols-1 gap-2.5">
            {leaderboard.slice(0, 6).map((entry, index) => {
              const style = RANK_STYLES[index] || {
                row: 'border-white/10 bg-black/25',
                badge: 'bg-white/10 text-[#F4E8C1]',
                bar: 'from-purple-500 to-sky-400'
              };
              const isHighlighted =
                normalizedHighlight &&
                (entry.className.toLowerCase() === normalizedHighlight ||
                  getClassDisplayName(entry.className).toLowerCase() ===
                    getClassDisplayName(normalizedHighlight).toLowerCase());

              return (
                <div
                  key={entry.className}
                  className={`rounded-xl border p-3.5 sm:p-4 transition-all ${style.row} ${
                    isHighlighted ? 'ring-1 ring-emerald-400/50' : ''
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-cinzel font-bold text-sm shrink-0 ${style.badge}`}
                      >
                        {index < 3 ? (
                          index === 0 ? (
                            <Trophy className="w-4 h-4" />
                          ) : index === 1 ? (
                            <Medal className="w-4 h-4" />
                          ) : (
                            <Award className="w-4 h-4" />
                          )
                        ) : (
                          `#${index + 1}`
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="font-cinzel font-bold text-sm text-[#F4E8C1] truncate">
                          {entry.className}
                          {isHighlighted && (
                            <span className="ml-2 text-[9px] font-sans font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                              Kelasmu
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-[#A89F91]">
                          {entry.borrowedBooks} buku • {entry.journals} jurnal •{' '}
                          {entry.readers} pembaca
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-auto">
                      <div className="hidden sm:block w-36 lg:w-56">
                        <div className="w-full h-2 rounded-full bg-black/50 border border-white/5 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${style.bar}`}
                            style={{
                              width: `${Math.min(
                                100,
                                (entry.totalBooks / maxTotal) * 100
                              )}%`
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-cinzel text-lg font-bold text-[#F4E8C1]">
                          {entry.totalBooks}
                        </span>
                        <span className="block text-[9px] text-[#A89F91] uppercase tracking-wider">
                          total buku
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[10px] text-[#A89F91] px-1">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
              Buku dipinjam/dibaca
            </span>
            <span className="flex items-center gap-1.5">
              <Scroll className="w-3.5 h-3.5 text-emerald-400" />
              Jurnal literasi selesai
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              Pembaca unik
            </span>
            <span className="flex items-center gap-1.5 ml-auto">
              <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
              Diperbarui otomatis dari sirkulasi &amp; jurnal
            </span>
          </div>
        </>
      )}
    </section>
  );
}
