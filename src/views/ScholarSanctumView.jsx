import React from 'react';
import { 
  User, 
  Award, 
  BookOpen, 
  Clock, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  Scroll, 
  Star, 
  CheckCircle2, 
  AlertCircle,
  FlaskConical,
  ExternalLink,
  MapPin
} from 'lucide-react';

export default function ScholarSanctumView({
  scholar,
  summonedBooks,
  onOpenReturnModal,
  onInspectTome,
  setActiveTab
}) {
  const xpPercent = Math.min(100, Math.round((scholar.xp / scholar.maxXP) * 100));

  return (
    <div className="space-y-12 pb-16 animate-fadeIn">
      
      {/* 1. GUILD MEMBER CARD (Digital Id Card) */}
      <section className="relative rounded-3xl overflow-hidden border-2 border-gold-alchemy/50 bg-gradient-to-br from-leather-light via-leather to-obsidian-deep p-6 sm:p-8 lg:p-10 shadow-2xl parchment-card">
        {/* Decorative corner runes */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-gold-alchemy/15 to-transparent rounded-bl-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-potion-emerald/15 to-transparent rounded-tr-full pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Avatar & Guild Seal */}
          <div className="md:col-span-4 flex flex-col items-center sm:items-start text-center sm:text-left space-y-3">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-gold-dark via-gold-alchemy to-parchment-light p-1 shadow-alchemy-glow">
                <div className="w-full h-full rounded-2xl bg-obsidian-deep flex items-center justify-center overflow-hidden border border-gold-alchemy/40">
                  <User className="w-12 h-12 text-gold-alchemy" />
                </div>
              </div>
              <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-potion-emerald text-obsidian text-xs font-cinzel font-black border border-obsidian shadow">
                Lv. {scholar.level}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-cinzel tracking-widest text-gold-light uppercase font-bold">
                Cendekiawan Terdaftar
              </span>
              <h2 className="font-cinzel text-xl sm:text-2xl font-extrabold text-parchment gold-glow">
                {scholar.name}
              </h2>
              <p className="text-xs text-parchment-muted font-mono mt-0.5">
                ID: {scholar.studentId} • {scholar.academyClass}
              </p>
            </div>
          </div>

          {/* Rank & XP Progression Bar */}
          <div className="md:col-span-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gold-alchemy/20 pb-3">
              <div>
                <span className="text-[11px] font-sans text-stone-400">Gelar Serikat Saat Ini:</span>
                <div className="font-cinzel text-lg sm:text-xl font-bold text-gold-alchemy flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-potion-emerald" />
                  <span>{scholar.guildRole}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-parchment">
                  {scholar.xp} / {scholar.maxXP} XP
                </span>
                <p className="text-[10px] text-stone-400 font-sans">
                  Sisa {Math.max(0, scholar.maxXP - scholar.xp)} XP menuju Level {scholar.level + 1}
                </p>
              </div>
            </div>

            {/* Mana / XP Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-cinzel text-gold-light">
                <span>Arcane Mastery Progress</span>
                <span>{xpPercent}%</span>
              </div>
              <div className="w-full h-3.5 bg-obsidian-deep rounded-full overflow-hidden p-0.5 border border-gold-alchemy/40 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-gold-alchemy via-potion-amber to-potion-emerald rounded-full transition-all duration-700 shadow-alchemy"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-2.5 rounded-xl bg-leather-dark/80 border border-gold-alchemy/20 text-center">
                <div className="font-cinzel text-lg font-bold text-parchment">
                  {scholar.tomesReadCount}
                </div>
                <div className="text-[10px] text-parchment-muted font-sans uppercase">
                  Tomes Selesai
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-leather-dark/80 border border-gold-alchemy/20 text-center">
                <div className="font-cinzel text-lg font-bold text-potion-emerald">
                  {summonedBooks.length}
                </div>
                <div className="text-[10px] text-parchment-muted font-sans uppercase">
                  Pinjaman Aktif
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-leather-dark/80 border border-gold-alchemy/20 text-center">
                <div className="font-cinzel text-lg font-bold text-potion-purple">
                  {scholar.reviewsPennedCount}
                </div>
                <div className="text-[10px] text-parchment-muted font-sans uppercase">
                  Ulasan Ditulis
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* 2. CURRENTLY SUMMONED TOMES WITH MANA TIMER */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gold-alchemy/20 pb-4">
          <div>
            <div className="flex items-center gap-2 text-gold-alchemy">
              <BookOpen className="w-5 h-5 text-potion-emerald" />
              <h2 className="font-cinzel text-2xl font-bold text-parchment">
                Currently Summoned Tomes
              </h2>
            </div>
            <p className="text-xs text-parchment-muted font-sans">
              Daftar Grimoire yang Sedang Aktif Dipinjam di Sanctum Anda dengan Indikator Mana Timer
            </p>
          </div>
          <button
            onClick={() => setActiveTab('vault')}
            className="text-xs font-semibold text-gold-alchemy hover:text-gold-light flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            <span>Pinjam Grimoire Lain di Vault</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {summonedBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {summonedBooks.map((book) => {
              const daysLeft = book.loanInfo?.daysLeft ?? 7;
              const isWarning = daysLeft <= 3;
              const manaPercent = Math.min(100, Math.round((daysLeft / 14) * 100));

              return (
                <div 
                  key={book.id}
                  className="parchment-card rounded-2xl p-5 border border-gold-alchemy/30 flex flex-col justify-between space-y-4 hover:border-gold-alchemy/60 transition-all"
                >
                  <div
                    onClick={() => onInspectTome(book)}
                    className="flex items-start gap-4 cursor-pointer group"
                  >
                    <img 
                      src={book.cover} 
                      alt={book.title} 
                      className="w-20 h-28 object-cover rounded-xl border border-gold-alchemy/30 shadow-md shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-leather-dark text-gold-light border border-gold-alchemy/20">
                        {book.schoolName}
                      </span>
                      <h3 className="font-cinzel text-base font-bold text-parchment group-hover:text-gold-alchemy transition-colors mt-1.5 truncate">
                        {book.title}
                      </h3>
                      <p className="text-xs italic text-gold-light/80 truncate">
                        "{book.fantasySubtitle}"
                      </p>
                      <p className="text-xs text-parchment-muted mt-1">
                        Mpu Penulis: <span className="text-parchment">{book.author}</span>
                      </p>
                    </div>
                  </div>

                  {/* Visual Mana Timer (Days remaining countdown bar) */}
                  <div className="p-3 rounded-xl bg-leather-dark/90 border border-gold-alchemy/20 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-cinzel font-semibold text-parchment">
                        <Clock className={`w-3.5 h-3.5 ${isWarning ? 'text-potion-amber' : 'text-potion-emerald'}`} />
                        <span>Mana Timer (Batas Waktu Pinjam):</span>
                      </div>
                      <span className={`font-mono font-bold ${isWarning ? 'text-potion-amber' : 'text-potion-emerald'}`}>
                        {daysLeft} Hari Tersisa
                      </span>
                    </div>

                    <div className="w-full h-2 bg-obsidian rounded-full overflow-hidden border border-stone-800">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          isWarning 
                            ? 'bg-gradient-to-r from-potion-amber to-red-500' 
                            : 'bg-gradient-to-r from-potion-emerald to-teal-400'
                        }`}
                        style={{ width: `${manaPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                      <span>Dipinjam: {book.loanInfo?.borrowedDate || '2026-11-06'}</span>
                      <span>Jatuh Tempo: {book.loanInfo?.dueDate || '2026-11-20'}</span>
                    </div>
                  </div>

                  {/* Actions: Return Tome & Write Review */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onInspectTome(book)}
                      className="flex-1 py-2 px-3 rounded-xl bg-leather text-parchment hover:bg-leather-light text-xs font-medium border border-gold-alchemy/20 transition-all text-center"
                    >
                      Buka Detail
                    </button>
                    <button
                      onClick={() => onOpenReturnModal(book)}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-potion-emerald to-teal-600 hover:from-teal-500 hover:to-potion-emerald text-obsidian text-xs font-bold font-cinzel shadow-emerald-glow transition-all flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Kembalikan & Klaim XP</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="parchment-card rounded-3xl border border-gold-alchemy/25 p-8 text-center max-w-md mx-auto space-y-3">
            <BookOpen className="w-10 h-10 text-gold-alchemy/40 mx-auto" />
            <h4 className="font-cinzel text-lg font-bold text-parchment">
              Tidak Ada Grimoire yang Sedang Dipinjam
            </h4>
            <p className="text-xs text-parchment-muted font-sans">
              Sanctum Anda kosong dari naskah pinjaman. Kunjungi Vault of Tomes untuk meminjam grimoire baru!
            </p>
            <button
              onClick={() => setActiveTab('vault')}
              className="px-5 py-2 rounded-xl bg-gold-alchemy text-obsidian font-cinzel font-bold text-xs shadow-alchemy transition-all"
            >
              Kunjungi Vault of Tomes
            </button>
          </div>
        )}
      </section>


      {/* 3. POTION BADGES & HONORS SHOWCASE */}
      <section className="space-y-6">
        <div className="border-b border-gold-alchemy/20 pb-4">
          <div className="flex items-center gap-2 text-gold-alchemy">
            <Award className="w-5 h-5" />
            <h2 className="font-cinzel text-2xl font-bold text-parchment">
              Collected Potion Badges & Sigils
            </h2>
          </div>
          <p className="text-xs text-parchment-muted font-sans">
            Lencana Prestasi Literasi & Penghargaan Kebijaksanaan yang Telah Anda Buka
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {scholar.badges.map((badge) => (
            <div 
              key={badge.id}
              className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-between space-y-3 transition-all ${
                badge.unlocked 
                  ? 'bg-leather-dark parchment-card border-gold-alchemy/40 shadow-alchemy' 
                  : 'bg-stone-950/60 border-stone-800 opacity-40'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                badge.unlocked 
                  ? `${badge.color} ${badge.border} bg-leather` 
                  : 'text-stone-600 border-stone-700 bg-stone-900'
              }`}>
                <FlaskConical className="w-6 h-6" />
              </div>

              <div>
                <h4 className="font-cinzel text-xs font-bold text-parchment">
                  {badge.name}
                </h4>
                <p className="text-[11px] text-stone-400 font-sans mt-1 line-clamp-2">
                  {badge.desc}
                </p>
              </div>

              <span className={`text-[10px] font-cinzel font-bold px-2 py-0.5 rounded-full ${
                badge.unlocked 
                  ? 'bg-potion-emerald/20 text-potion-emerald border border-potion-emerald/40' 
                  : 'bg-stone-900 text-stone-500'
              }`}>
                {badge.unlocked ? '✦ Unlocked' : 'Locked'}
              </span>
            </div>
          ))}
        </div>
      </section>


      {/* 4. SCHOLAR'S READING LOG & REVIEWS */}
      <section className="space-y-6">
        <div className="border-b border-gold-alchemy/20 pb-4">
          <div className="flex items-center gap-2 text-gold-alchemy">
            <Scroll className="w-5 h-5" />
            <h2 className="font-cinzel text-2xl font-bold text-parchment">
              Scholar's Notes & Reading History
            </h2>
          </div>
          <p className="text-xs text-parchment-muted font-sans">
            Catatan Refleksi & Ulasan Grimoire yang Telah Anda Kembalikan ke Arsip
          </p>
        </div>

        <div className="space-y-4">
          {scholar.reviews.map((rev) => (
            <div 
              key={rev.id}
              className="parchment-card rounded-2xl p-5 border border-gold-alchemy/20 space-y-2 hover:border-gold-alchemy/40 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-cinzel text-sm sm:text-base font-bold text-parchment">
                    {rev.bookTitle}
                  </h4>
                  <div className="flex items-center text-gold-alchemy">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-gold-alchemy" />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-400">
                  <span className="font-mono">{rev.date}</span>
                  <span className="px-2 py-0.5 rounded bg-potion-emerald/15 text-potion-emerald font-bold border border-potion-emerald/30">
                    +{rev.xpAwarded} XP
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-stone-300 font-sans leading-relaxed bg-leather-dark/60 p-3 rounded-xl border border-stone-800">
                "{rev.note}"
              </p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
