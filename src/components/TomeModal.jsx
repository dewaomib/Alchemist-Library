import React, { useEffect } from 'react';
import {
  X,
  Star,
  Sparkles,
  BookOpen,
  Clock,
  MapPin,
  FileText,
  FlaskConical,
  Scroll,
  Award,
  Hash,
  MessageSquareQuote,
  Feather,
} from 'lucide-react';

export default function TomeModal({ tome, isOpen, onClose, onSummon, isSummonedByMe }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !tome) return null;

  const isAvailable = tome.status === 'available';
  const xpReward = tome.xpReward || 75;
  const reviews = tome.reviews || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tome-modal-title"
    >
      {/* Open Ancient Scroll / Grimoire Container */}
      <div
        className="relative w-full max-w-4xl my-6 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Wooden & Brass Scroll Roller */}
        <div className="relative mx-1 sm:mx-3 h-5 rounded-full scroll-roller border border-gold-alchemy/40 flex items-center justify-between z-20">
          <div className="w-7 h-7 -ml-2 rounded-full scroll-cap border border-amber-950 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-amber-950/70" />
          </div>
          <div className="flex items-center gap-2 text-[10px] font-cinzel tracking-[0.25em] text-gold-light/85 uppercase">
            <span>✦</span>
            <span>Open Arcane Grimoire</span>
            <span>✦</span>
          </div>
          <div className="w-7 h-7 -mr-2 rounded-full scroll-cap border border-amber-950 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-amber-950/70" />
          </div>
        </div>

        {/* Unfurled Scroll Folio Body */}
        <div className="relative mx-2 sm:mx-5 -my-1.5 scroll-folio border-x-2 border-gold-alchemy/35 text-parchment overflow-hidden medieval-texture">
          {/* Ornate Corner Filigree Accents */}
          <div className="pointer-events-none absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-gold-alchemy/45 rounded-tl-md" />
          <div className="pointer-events-none absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-gold-alchemy/45 rounded-tr-md" />
          <div className="pointer-events-none absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-gold-alchemy/45 rounded-bl-md" />
          <div className="pointer-events-none absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-gold-alchemy/45 rounded-br-md" />

          {/* Subtle Vertical Grimoire Spine Shadow on Desktop */}
          <div className="pointer-events-none hidden md:block absolute top-0 bottom-0 left-[41.666%] w-8 -translate-x-1/2 bg-gradient-to-r from-transparent via-black/45 to-transparent border-x border-gold-alchemy/10" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup gulungan grimoire"
            className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-obsidian-deep/90 border border-gold-alchemy/40 text-parchment-muted hover:text-gold-alchemy hover:border-gold-alchemy flex items-center justify-center transition-all shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 p-6 sm:p-8 lg:p-10 relative z-10">
            {/* LEFT FOLIO PAGE: Cover, Wax Seal, Physical Folio Metadata */}
            <div className="md:col-span-5 flex flex-col items-center space-y-5">
              {/* Illuminated Grimoire Cover */}
              <div className="relative w-full max-w-[245px] aspect-[2/3] rounded-2xl overflow-hidden border-2 border-gold-alchemy/50 shadow-2xl group">
                <img
                  src={tome.cover}
                  alt={tome.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                {/* Wax Seal / XP Badge */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-950/90 border border-potion-emerald/60 text-potion-emerald text-[11px] font-cinzel font-bold shadow-emerald-glow flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>+{xpReward} XP</span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-center">
                  <span className="px-3 py-1 rounded-full text-xs font-cinzel font-bold bg-leather/95 text-gold-light border border-gold-alchemy/40 shadow">
                    {tome.arcaneLevel} Grimoire
                  </span>
                </div>
              </div>

              {/* Scroll Archival Metadata Box */}
              <div className="w-full max-w-[270px] p-4 rounded-2xl bg-obsidian-deep/75 border border-gold-alchemy/25 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-gold-alchemy/15 pb-2">
                  <span className="font-cinzel font-bold text-gold-alchemy uppercase tracking-wider text-[11px]">
                    Data Arsip Gulungan
                  </span>
                  <Scroll className="w-3.5 h-3.5 text-gold-alchemy" />
                </div>

                {/* Shelf Location */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-parchment-muted text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-gold-alchemy shrink-0" />
                    <span>Lokasi Rak (Shelf Location):</span>
                  </div>
                  <p className="text-parchment font-mono text-[11px] bg-leather-dark/90 px-2.5 py-1.5 rounded-lg border border-gold-alchemy/20">
                    {tome.shelf}
                  </p>
                </div>

                {/* ISBN */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="flex items-center gap-1.5 text-parchment-muted text-[11px]">
                    <Hash className="w-3.5 h-3.5 text-gold-alchemy" />
                    <span>ISBN:</span>
                  </span>
                  <span className="font-mono text-[11px] text-gold-light font-semibold">
                    {tome.isbn || '978-602-0000-00-0'}
                  </span>
                </div>

                {/* Page Count */}
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-parchment-muted text-[11px]">
                    <BookOpen className="w-3.5 h-3.5 text-gold-alchemy" />
                    <span>Jumlah Halaman:</span>
                  </span>
                  <span className="font-semibold text-parchment">
                    {tome.pages} Halaman
                  </span>
                </div>

                {/* XP Reward */}
                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-gold-alchemy/15">
                  <span className="flex items-center gap-1.5 text-potion-emerald text-[11px] font-semibold">
                    <Award className="w-3.5 h-3.5" />
                    <span>Hadiah Membaca:</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-potion-emerald/15 border border-potion-emerald/40 text-potion-emerald font-cinzel font-bold text-[11px]">
                    +{xpReward} Scholar XP
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT FOLIO PAGE: Title, Synopsis, Essences & Scholar's Notes */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-5 md:pl-2">
              <div className="space-y-4">
                {/* Category & Rating */}
                <div className="flex flex-wrap items-center gap-2 pr-8">
                  <span className="px-2.5 py-0.5 rounded-full text-xs bg-leather-light border border-gold-alchemy/25 text-gold-light font-medium">
                    {tome.schoolName}
                  </span>
                  <div className="flex items-center gap-1 text-gold-alchemy text-xs font-bold bg-leather-light px-2.5 py-0.5 rounded-full border border-gold-alchemy/25">
                    <Star className="w-3.5 h-3.5 fill-gold-alchemy" />
                    <span>{tome.rating} / 5.0</span>
                    <span className="text-stone-400 font-normal">({tome.reviewsCount} Ulasan)</span>
                  </div>
                </div>

                {/* Title & Fantasy Subtitle */}
                <div>
                  <h2
                    id="tome-modal-title"
                    className="font-cinzel text-2xl sm:text-3xl font-extrabold text-parchment gold-glow leading-snug"
                  >
                    {tome.title}
                  </h2>
                  <p className="font-sans italic text-sm text-gold-light/90 mt-1">
                    "{tome.fantasySubtitle}"
                  </p>
                  <p className="text-xs text-parchment-muted mt-2">
                    Penulis / Mpu: <span className="text-parchment font-semibold">{tome.author}</span>
                  </p>
                </div>

                {/* Status Indicator */}
                <div>
                  {isAvailable ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-potion-emerald/40 text-potion-emerald text-xs font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-potion-emerald animate-pulse" />
                      <span>In the Vault — Tersedia untuk dipinjam selama 14 hari</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-potion-amber/40 text-potion-amber text-xs font-semibold">
                      <Clock className="w-4 h-4" />
                      <span>
                        {isSummonedByMe
                          ? `Sedang aktif dalam Sanctum Anda (sisa ${tome.loanInfo?.daysLeft ?? 7} hari)`
                          : `Sedang dipinjam oleh ${tome.loanInfo?.borrower || 'Cendekiawan lain'}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Full Synopsis */}
                <div>
                  <h4 className="font-cinzel text-xs font-bold uppercase tracking-wider text-gold-alchemy mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Sinopsis Lengkap & Intisari Kitab
                  </h4>
                  <p className="text-sm text-stone-200 leading-relaxed font-sans bg-obsidian-deep/65 p-3.5 rounded-xl border border-gold-alchemy/20">
                    {tome.synopsis}
                  </p>
                </div>

                {/* Alchemical Essence Tags */}
                <div>
                  <h4 className="font-cinzel text-xs font-bold uppercase tracking-wider text-gold-alchemy mb-2 flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5" />
                    Esensi Alkimia yang Terkandung
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {tome.ingredients?.map((ing) => (
                      <span
                        key={ing}
                        className="px-2.5 py-1 rounded-lg text-xs bg-obsidian/85 border border-gold-alchemy/30 text-stone-300 capitalize flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-gold-alchemy" />
                        {ing.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Scholar's Notes (Student Reviews List) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-cinzel text-xs font-bold uppercase tracking-wider text-gold-alchemy flex items-center gap-1.5">
                      <MessageSquareQuote className="w-3.5 h-3.5" />
                      Scholar's Notes (Catatan Pembaca)
                    </h4>
                    <span className="text-[11px] font-mono text-parchment-muted">
                      {reviews.length} catatan terbaru
                    </span>
                  </div>

                  {reviews.length > 0 ? (
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {reviews.map((rev) => (
                        <div
                          key={rev.id}
                          className="p-3 rounded-xl bg-obsidian-deep/75 border border-gold-alchemy/20 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Feather className="w-3.5 h-3.5 text-gold-alchemy shrink-0" />
                              <span className="font-cinzel text-xs font-bold text-parchment truncate">
                                {rev.scholarName}
                              </span>
                              {rev.scholarRank && (
                                <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-leather-light text-gold-light/85 border border-gold-alchemy/20 truncate">
                                  {rev.scholarRank}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${
                                    star <= rev.rating
                                      ? 'fill-gold-alchemy text-gold-alchemy'
                                      : 'text-stone-700'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-stone-300 italic leading-relaxed">
                            "{rev.note}"
                          </p>
                          <div className="text-[10px] text-stone-500 font-mono text-right">
                            Diinskripsikan pada {rev.date}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-obsidian-deep/60 border border-dashed border-gold-alchemy/20 text-xs text-stone-400 italic text-center">
                      Belum ada Scholar's Note untuk grimoire ini. Jadilah cendekiawan pertama yang mengulas setelah mengembalikannya!
                    </div>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-4 border-t border-gold-alchemy/20 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-leather hover:bg-leather-light text-parchment text-xs font-semibold border border-gold-alchemy/25 transition-all"
                >
                  Tutup Gulungan
                </button>

                {isAvailable ? (
                  <button
                    type="button"
                    onClick={() => {
                      onSummon(tome);
                      onClose();
                    }}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-alchemy to-amber-600 hover:from-amber-500 hover:to-gold-alchemy text-obsidian text-sm font-bold font-cinzel shadow-alchemy hover:shadow-alchemy-glow transition-all flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Summon Tome (Pinjam 14 Hari)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="px-6 py-2.5 rounded-xl bg-stone-900 text-stone-500 text-sm font-medium border border-stone-800 cursor-not-allowed flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    <span>{isSummonedByMe ? 'Aktif di Sanctum Anda' : 'Grimoire Sedang Dipinjam'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Wooden & Brass Scroll Roller */}
        <div className="relative mx-1 sm:mx-3 h-5 rounded-full scroll-roller border border-gold-alchemy/40 flex items-center justify-between z-20">
          <div className="w-7 h-7 -ml-2 rounded-full scroll-cap border border-amber-950 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-amber-950/70" />
          </div>
          <div className="h-[1px] flex-1 mx-4 bg-gradient-to-r from-transparent via-gold-alchemy/40 to-transparent" />
          <div className="w-7 h-7 -mr-2 rounded-full scroll-cap border border-amber-950 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-amber-950/70" />
          </div>
        </div>
      </div>
    </div>
  );
}
