import React from 'react';
import {
  Shield,
  Award,
  Scroll,
  Clock,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Star,
  Check,
  Flame,
  AlertCircle
} from 'lucide-react';

export default function ScholarsSanctumView({
  currentUser,
  currentRank,
  studentXp,
  potionsBrewedCount,
  booksReadCount,
  books,
  studentActiveLoans,
  studentPendingLoans,
  quests,
  badges,
  onClaimQuest,
  onOpenReturnModal,
  onOpenReader,
  onInspectBook
}) {
  return (
    <div className="space-y-10">
      {/* GUILD MEMBER CARD */}
      <section
        className="rounded-2xl p-6 sm:p-8 border relative overflow-hidden"
        style={{
          background:
            'radial-gradient(circle at 90% 10%, rgba(212, 175, 55, 0.22), rgba(16, 185, 129, 0.10) 45%, #1E1916 90%)',
          borderColor: '#D4AF37'
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-[#12100E] border-2 border-[#D4AF37] flex flex-col items-center justify-center shrink-0 shadow-xl">
              <Shield className="w-9 h-9 text-[#D4AF37]" />
              <span className="text-[10px] font-cinzel font-bold text-emerald-400 mt-0.5">
                LVL {currentRank.level}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-cinzel bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                <span>OFFICIAL GUILD MEMBER CARD • ID #{currentUser.guildId || 'ARC-2026-089'}</span>
              </div>
              <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#F4E8C1]">
                {currentUser.name}
              </h1>
              <p className="text-xs sm:text-sm text-[#A89F91]">
                {currentUser.class || 'Kelas XI MIPA 2 • Akademi Sains & Arkanum'}
              </p>

              {/* XP Progress Bar */}
              <div className="pt-2 max-w-md">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-cinzel text-[#D4AF37] font-semibold">
                    Rank: {currentRank.title}
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {studentXp} / {currentRank.nextXp} XP
                  </span>
                </div>
                <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(
                        100,
                        ((studentXp - currentRank.minXp) /
                          (currentRank.nextXp - currentRank.minXp)) *
                          100
                      )}%`,
                      background: 'linear-gradient(90deg, #10B981 0%, #D4AF37 100%)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-3 gap-3 text-center">
            <div className="p-4 rounded-xl bg-black/40 border border-white/10">
              <span className="text-xs text-[#A89F91] block">Buku Dibaca</span>
              <span className="font-cinzel text-2xl font-bold text-[#D4AF37] mt-1 block">
                {booksReadCount}
              </span>
              <span className="text-[10px] text-emerald-400">Tomes Mastered</span>
            </div>
            <div className="p-4 rounded-xl bg-black/40 border border-white/10">
              <span className="text-xs text-[#A89F91] block">Sedang Dipinjam</span>
              <span className="font-cinzel text-2xl font-bold text-emerald-400 mt-1 block">
                {studentActiveLoans.length}
              </span>
              <span className="text-[10px] text-[#A89F91]">Maks. 4 Buku</span>
            </div>
            <div className="p-4 rounded-xl bg-black/40 border border-white/10">
              <span className="text-xs text-[#A89F91] block">Ramuan Diracik</span>
              <span className="font-cinzel text-2xl font-bold text-purple-400 mt-1 block">
                {potionsBrewedCount}
              </span>
              <span className="text-[10px] text-purple-400/80">Transmutations</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: PERMINTAAN PINJAM MENUNGGU PERSETUJUAN (PENDING REQUESTS) */}
      {studentPendingLoans.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-amber-400 font-cinzel tracking-widest uppercase">
                <Clock className="w-3.5 h-3.5" />
                <span>ANTREAN PERMINTAAN SISWA</span>
              </div>
              <h2 className="font-cinzel text-xl font-bold text-[#F4E8C1] mt-0.5">
                Menunggu Persetujuan Grand Archivist ({studentPendingLoans.length})
              </h2>
            </div>
            <span className="text-xs text-[#A89F91]">
              Sambil menunggu fisik diverifikasi, kamu bisa membaca versi digitalnya langsung!
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentPendingLoans.map((loan) => {
              const book = books.find((b) => b.id === loan.bookId);
              return (
                <div
                  key={loan.id}
                  className="parchment-card rounded-2xl p-5 border border-amber-500/40 space-y-3 bg-amber-950/15"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl text-[#D4AF37]">
                        {book?.coverRune || '✦'}
                      </span>
                      <div>
                        <h3 className="font-cinzel font-bold text-base text-[#F4E8C1]">
                          {loan.bookTitle || book?.title}
                        </h3>
                        <p className="text-xs text-[#A89F91]">
                          Diajukan: {loan.borrowedDate} • 1 Eksemplar Fisik
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shrink-0 animate-pulse">
                      <Clock className="w-3 h-3" />
                      <span>Menunggu Archivist</span>
                    </span>
                  </div>

                  <p className="text-xs text-[#A89F91]">
                    Permintaanmu telah masuk ke antrean kurator. Kamu akan menerima notifikasi segera setelah buku disetujui untuk diambil di rak {book?.shelf}.
                  </p>

                  <div className="pt-2 border-t border-[#D4AF37]/15 flex items-center justify-between">
                    <span className="text-xs text-emerald-400 font-medium">
                      Tersedia Astral Grimoire
                    </span>
                    {book && (
                      <button
                        type="button"
                        onClick={() => onOpenReader(book)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-cinzel font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all flex items-center gap-1.5 shadow"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Baca Versi Digital Sekarang</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 2: CURRENTLY SUMMONED TOMES (APPROVED ACTIVE LOANS) */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-cinzel tracking-widest uppercase">
              <Scroll className="w-3.5 h-3.5" />
              <span>ACTIVE CIRCULATION • SANCTUM</span>
            </div>
            <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-[#F4E8C1] mt-0.5">
              Currently Summoned Tomes ({studentActiveLoans.length}/4)
            </h2>
          </div>
          <p className="text-xs text-[#A89F91]">
            Kembalikan buku sebelum Mana Decay habis untuk mempertahankan reputasi Scholar.
          </p>
        </div>

        {studentActiveLoans.length === 0 ? (
          <div className="parchment-card rounded-2xl p-10 text-center space-y-2">
            <BookOpen className="w-8 h-8 text-[#A89F91] mx-auto" />
            <p className="text-sm font-cinzel text-[#F4E8C1]">
              Tidak Ada Grimoire Fisik yang Sedang Dipinjam
            </p>
            <p className="text-xs text-[#A89F91]">
              Kunjungi Vault of Tomes untuk meminjam buku pelajaran atau baca versi digital secara online!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {studentActiveLoans.map((loan) => {
              const book = books.find((b) => b.id === loan.bookId);
              const daysLeft = loan.daysLeft ?? 5;
              const maxDays = loan.maxDays || 7;
              const decayPercent = Math.max(0, Math.min(100, (daysLeft / maxDays) * 100));

              return (
                <div
                  key={loan.id}
                  className="parchment-card rounded-2xl p-6 flex flex-col justify-between space-y-5 transition-all hover:border-[#D4AF37]/60 shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-14 h-20 rounded-xl bg-gradient-to-br ${
                            book?.coverGradient || 'from-amber-950 to-black'
                          } border border-[#D4AF37]/50 p-1.5 flex flex-col justify-between shrink-0 shadow-md`}
                        >
                          <span className="text-[9px] text-[#D4AF37]">✦</span>
                          <span className="text-xl text-center text-[#D4AF37]">
                            {book?.coverRune || '☉'}
                          </span>
                          <span className="text-[8px] text-center text-[#F4E8C1] truncate">
                            {book?.title}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                            {book?.category || 'Alchemy'}
                          </span>
                          <h3 className="font-cinzel font-bold text-base text-[#F4E8C1] mt-1 line-clamp-1">
                            {loan.bookTitle || book?.title}
                          </h3>
                          <p className="text-xs italic text-[#D4AF37]/80 line-clamp-1">
                            {book?.subtitle}
                          </p>
                          <p className="text-xs text-[#A89F91] mt-0.5">
                            Dipinjam sejak: {loan.borrowedDate}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-emerald-400 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 shrink-0">
                        Dipinjam
                      </span>
                    </div>

                    {/* Mana Decay Timer */}
                    <div className="mt-4 p-3.5 rounded-xl bg-[#12100E] border border-white/5 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-cinzel text-amber-400 flex items-center gap-1.5 font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Mana Decay Timer</span>
                        </span>
                        <span className="font-bold text-[#F4E8C1]">
                          {daysLeft} Hari Tersisa (Batas {loan.dueDate || '7 Hari'})
                        </span>
                      </div>
                      <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${decayPercent}%`,
                            background:
                              daysLeft <= 2
                                ? 'linear-gradient(90deg, #EF4444 0%, #F59E0B 100%)'
                                : 'linear-gradient(90deg, #10B981 0%, #D4AF37 100%)'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#D4AF37]/15 flex items-center justify-between gap-3">
                    {book && (
                      <button
                        type="button"
                        onClick={() => onOpenReader(book)}
                        className="px-3.5 py-2 rounded-xl text-xs font-cinzel font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all flex items-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Buka Astral Grimoire</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onOpenReturnModal(loan)}
                      className="px-4 py-2 rounded-xl text-xs font-cinzel font-bold bg-[#D4AF37] text-[#12100E] hover:bg-amber-400 transition-all flex items-center gap-1.5 shadow"
                    >
                      <Scroll className="w-3.5 h-3.5" />
                      <span>Kembalikan &amp; Tulis Ulasan (+100 XP)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 3: GUILD QUESTS & UNLOCKABLE BADGES */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs text-purple-400 font-cinzel tracking-widest uppercase">
              <Award className="w-3.5 h-3.5" />
              <span>ACADEMY REPUTATION &amp; TRIALS</span>
            </div>
            <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-[#F4E8C1] mt-0.5">
              Guild Quests &amp; Badges (Misi &amp; Lencana Prestasi)
            </h2>
          </div>
          <p className="text-xs text-[#A89F91]">
            Capai target literasi untuk membuka segel alkimia eksklusif di profilmu.
          </p>
        </div>

        {/* 3 Quests */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quests.map((quest) => {
            const isCompleted = quest.progress >= quest.target;
            return (
              <div
                key={quest.id}
                className="parchment-card rounded-2xl p-6 flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-cinzel uppercase tracking-wider px-2.5 py-1 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      {quest.subtitle}
                    </span>
                    <span className="text-xs font-bold text-[#D4AF37]">
                      +{quest.xpReward} XP
                    </span>
                  </div>

                  <h3 className="font-cinzel text-lg font-bold text-[#F4E8C1]">
                    {quest.title}
                  </h3>
                  <p className="text-xs text-[#A89F91] mt-1.5 leading-relaxed">
                    {quest.desc}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs text-[#A89F91] mb-1">
                    <span>Kemajuan Ritual:</span>
                    <span className="font-semibold text-[#F4E8C1]">
                      {quest.progress} / {quest.target}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/10 mb-4">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (quest.progress / quest.target) * 100)}%`,
                        background: 'linear-gradient(90deg, #8B5CF6 0%, #D4AF37 100%)'
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => onClaimQuest(quest)}
                    disabled={!isCompleted || quest.claimed}
                    className={`w-full py-2.5 rounded-xl text-xs font-cinzel font-bold transition-all flex items-center justify-center gap-2 ${
                      quest.claimed
                        ? 'bg-white/5 text-[#A89F91] border border-white/10 cursor-default'
                        : isCompleted
                        ? 'bg-[#D4AF37] text-[#12100E] hover:bg-amber-400 shadow-lg'
                        : 'bg-white/5 text-[#A89F91] cursor-not-allowed border border-white/5'
                    }`}
                  >
                    {quest.claimed ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Hadiah Telah Diklaim</span>
                      </>
                    ) : isCompleted ? (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Klaim Segel Hadiah (+{quest.xpReward} XP)</span>
                      </>
                    ) : (
                      <span>Belum Terpenuhi</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 6 Badges Showcase */}
        <div className="parchment-card rounded-2xl p-6 sm:p-8 space-y-4">
          <h3 className="font-cinzel text-lg font-bold text-[#F4E8C1] flex items-center gap-2">
            <Award className="w-5 h-5 text-[#D4AF37]" />
            <span>Segel Kehormatan Alkimia (Unlockable Guild Badges)</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-3.5 rounded-xl border text-center transition-all ${
                  badge.unlocked
                    ? 'bg-black/40 border-[#D4AF37]/50 shadow-md'
                    : 'bg-black/20 border-white/5 opacity-50'
                }`}
              >
                <div
                  className="w-10 h-10 mx-auto rounded-full flex items-center justify-center text-lg mb-2"
                  style={{
                    backgroundColor: badge.unlocked ? `${badge.color}25` : '#222',
                    border: `1px solid ${badge.unlocked ? badge.color : '#444'}`,
                    color: badge.unlocked ? badge.color : '#888'
                  }}
                >
                  {badge.unlocked ? '✦' : '🔒'}
                </div>
                <h4 className="font-cinzel font-bold text-xs text-[#F4E8C1] truncate">
                  {badge.name}
                </h4>
                <p className="text-[10px] text-[#A89F91] mt-0.5 line-clamp-2">
                  {badge.indo}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
