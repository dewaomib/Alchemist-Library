import React from 'react';
import { Star, BookOpen, Sparkles, CheckCircle2, Clock, Eye } from 'lucide-react';

export default function TomeCard({ tome, onInspect, onSummon, isSummonedByMe }) {
  const isAvailable = tome.status === 'available';

  const handleCardKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onInspect(tome);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onInspect(tome)}
      onKeyDown={handleCardKeyDown}
      className="parchment-card rounded-2xl overflow-hidden flex flex-col group hover:-translate-y-1.5 transition-all duration-300 relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-alchemy/60 text-left"
    >
      
      {/* Decorative top gold accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-gold-alchemy/40 to-transparent group-hover:via-gold-alchemy transition-all" />

      {/* Book Cover Area */}
      <div className="relative h-60 w-full overflow-hidden bg-stone-950">
        <img 
          src={tome.cover} 
          alt={tome.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-100"
          loading="lazy"
        />
        
        {/* Dark gradient shadow over image */}
        <div className="absolute inset-0 bg-gradient-to-t from-leather-dark via-transparent to-black/40" />

        {/* Availability Badge */}
        <div className="absolute top-3 right-3">
          {isAvailable ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/90 text-potion-emerald border border-potion-emerald/50 shadow-emerald-glow backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-potion-emerald animate-pulse" />
              In the Vault (Tersedia)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/90 text-potion-amber border border-potion-amber/50 backdrop-blur-md">
              <Clock className="w-3 h-3 text-potion-amber" />
              {isSummonedByMe ? 'Sedang Anda Pinjam' : 'Summoned (Dipinjam)'}
            </span>
          )}
        </div>

        {/* Arcane Level & XP Reward Badges */}
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-cinzel font-semibold bg-obsidian-deep/85 text-gold-light border border-gold-alchemy/30 backdrop-blur-sm">
            {tome.arcaneLevel}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-950/85 text-potion-emerald border border-potion-emerald/30 backdrop-blur-sm">
            +{tome.xpReward || 75} XP
          </span>
        </div>

        {/* School of Lore Badge on bottom of image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <span className="text-[11px] font-sans px-2.5 py-0.5 rounded-full bg-leather-dark/90 text-parchment border border-gold-alchemy/20 backdrop-blur-md">
            {tome.schoolName}
          </span>
          <div className="flex items-center gap-1 text-gold-alchemy bg-leather-dark/90 px-2 py-0.5 rounded-full border border-gold-alchemy/20 text-xs font-bold">
            <Star className="w-3 h-3 fill-gold-alchemy text-gold-alchemy" />
            <span>{tome.rating}</span>
          </div>
        </div>
      </div>

      {/* Book Metadata Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="font-cinzel text-lg font-bold text-parchment group-hover:text-gold-alchemy transition-colors line-clamp-1">
            {tome.title}
          </h3>
          <p className="text-xs font-sans italic text-gold-light/80 line-clamp-1 mt-0.5">
            "{tome.fantasySubtitle}"
          </p>
          <p className="text-xs text-parchment-muted mt-1.5 font-sans">
            Karya: <span className="text-parchment font-medium">{tome.author}</span>
          </p>
          
          <p className="text-xs text-stone-400 line-clamp-2 mt-2 leading-relaxed">
            {tome.synopsis}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-gold-alchemy/15 flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInspect(tome);
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-leather-light hover:bg-leather text-parchment text-xs font-semibold border border-gold-alchemy/20 hover:border-gold-alchemy/50 transition-all flex items-center justify-center gap-1.5"
            title="Lihat Detail Grimoire"
          >
            <Eye className="w-3.5 h-3.5 text-gold-light" />
            <span>Inspect (Teliti)</span>
          </button>

          {isAvailable ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSummon(tome);
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-gold-alchemy to-amber-600 hover:from-amber-500 hover:to-gold-alchemy text-obsidian text-xs font-bold font-cinzel shadow-alchemy hover:shadow-alchemy-glow transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Summon (Pinjam)</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              onClick={(e) => e.stopPropagation()}
              className="flex-1 py-2 px-3 rounded-xl bg-stone-900/60 text-stone-500 text-xs font-medium border border-stone-800 cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Summoned</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
