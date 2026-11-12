import React from 'react';
import {
  Sparkles,
  AlertCircle,
  X,
  Award,
  FlaskConical,
  Scroll,
  Crown,
} from 'lucide-react';

export default function NotificationToast({ toast, onDismiss }) {
  if (!toast) return null;

  const variantConfig = {
    levelup: {
      border: 'border-gold-alchemy',
      aura: 'from-gold-alchemy/25 via-potion-emerald/15 to-potion-purple/20',
      badgeBg: 'bg-gold-alchemy/25 border-gold-alchemy/60 text-gold-light',
      label: 'Ascension Scroll',
      icon: <Crown className="w-5 h-5 text-gold-light animate-bounce" />,
    },
    brew: {
      border: 'border-potion-purple/70',
      aura: 'from-potion-purple/25 via-potion-emerald/15 to-transparent',
      badgeBg: 'bg-purple-950/80 border-potion-purple/50 text-purple-200',
      label: 'Alchemical Brew',
      icon: <FlaskConical className="w-5 h-5 text-potion-emerald animate-pulse" />,
    },
    borrow: {
      border: 'border-gold-alchemy/70',
      aura: 'from-gold-alchemy/20 via-amber-500/10 to-transparent',
      badgeBg: 'bg-gold-alchemy/20 border-gold-alchemy/50 text-gold-alchemy',
      label: 'Archive Summons',
      icon: <Scroll className="w-5 h-5 text-gold-alchemy" />,
    },
    xp: {
      border: 'border-potion-emerald/70',
      aura: 'from-potion-emerald/20 via-gold-alchemy/15 to-transparent',
      badgeBg: 'bg-emerald-950/80 border-potion-emerald/50 text-potion-emerald',
      label: 'Scholar Reward',
      icon: <Award className="w-5 h-5 text-gold-light animate-bounce" />,
    },
    error: {
      border: 'border-potion-crimson/70',
      aura: 'from-red-950/40 via-transparent to-transparent',
      badgeBg: 'bg-red-950/80 border-potion-crimson/50 text-potion-crimson',
      label: 'Arcane Warning',
      icon: <AlertCircle className="w-5 h-5 text-potion-crimson" />,
    },
    success: {
      border: 'border-gold-alchemy/60',
      aura: 'from-gold-alchemy/15 via-potion-emerald/10 to-transparent',
      badgeBg: 'bg-gold-alchemy/20 border-gold-alchemy/40 text-gold-alchemy',
      label: 'Guild Dispatch',
      icon: <Sparkles className="w-5 h-5 text-potion-emerald" />,
    },
  };

  const cfg = variantConfig[toast.type] || variantConfig.success;

  return (
    <div
      className="fixed bottom-6 right-4 sm:right-6 z-50 w-[calc(100%-2rem)] max-w-md animate-scrollUnfurl origin-bottom"
      role="status"
      aria-live="polite"
    >
      {/* Top Scroll Roller */}
      <div className="relative mx-2 h-3 rounded-full scroll-roller border border-gold-alchemy/45 flex items-center justify-between z-10">
        <div className="w-4 h-4 -ml-1 rounded-full scroll-cap border border-amber-950" />
        <div className="w-4 h-4 -mr-1 rounded-full scroll-cap border border-amber-950" />
      </div>

      {/* Magical Scroll Parchment Body */}
      <div
        className={`relative mx-3.5 -my-1 scroll-folio border-x-2 ${cfg.border} px-4 py-3.5 shadow-alchemy-glow flex items-start gap-3 text-parchment overflow-hidden`}
      >
        {/* Ambient Magical Glow */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${cfg.aura} pointer-events-none`}
        />

        {/* Wax Seal / Crest Icon */}
        <div
          className={`relative z-10 p-2.5 rounded-full border ${cfg.badgeBg} shrink-0 shadow-md`}
        >
          {cfg.icon}
        </div>

        {/* Scroll Message */}
        <div className="relative z-10 flex-1 min-w-0 pr-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-cinzel uppercase tracking-widest text-gold-light/80 font-bold">
              ✦ {cfg.label}
            </span>
            {toast.xp && (
              <span className="px-1.5 py-0.5 rounded bg-potion-emerald/20 text-potion-emerald text-[10px] font-bold border border-potion-emerald/40 font-mono">
                +{toast.xp} XP
              </span>
            )}
          </div>

          <h4 className="font-cinzel text-sm font-bold text-gold-alchemy leading-snug">
            {toast.title}
          </h4>

          <p className="text-xs text-parchment/95 font-sans mt-1 leading-relaxed">
            {toast.message}
          </p>
        </div>

        {/* Close Scroll Button */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup notifikasi"
          className="relative z-10 text-parchment-muted hover:text-gold-alchemy transition-colors p-1 rounded-lg hover:bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Scroll Roller */}
      <div className="relative mx-2 h-3 rounded-full scroll-roller border border-gold-alchemy/45 flex items-center justify-between z-10">
        <div className="w-4 h-4 -ml-1 rounded-full scroll-cap border border-amber-950" />
        <div className="w-4 h-4 -mr-1 rounded-full scroll-cap border border-amber-950" />
      </div>
    </div>
  );
}
