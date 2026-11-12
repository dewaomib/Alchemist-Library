import React, { useState, useEffect } from 'react';
import { X, Star, Sparkles, Scroll, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ReturnTomeModal({ tome, isOpen, onClose, onConfirmReturn }) {
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setNote('');
      setHoverRating(0);
    }
  }, [isOpen, tome?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !tome) return null;

  const xpReward = tome.xpReward || 75;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!note.trim()) return;

    // Trigger celebratory alchemical confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#10B981', '#8B5CF6', '#F59E0B']
      });
    } catch (err) {
      // ignore
    }

    onConfirmReturn({
      tomeId: tome.id,
      bookTitle: tome.title,
      rating,
      note: note.trim(),
      xpAwarded: xpReward,
    });

    setNote('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative w-full max-w-lg parchment-card rounded-3xl border border-gold-alchemy/40 p-6 sm:p-8 shadow-2xl text-parchment animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gold Rune Border */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-gold-alchemy via-potion-emerald to-gold-alchemy rounded-t-3xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-leather border border-gold-alchemy/25 text-parchment-muted hover:text-gold-alchemy flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-gold-alchemy/15 border border-gold-alchemy/40 text-gold-alchemy">
            <Scroll className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-cinzel text-xl font-bold text-parchment">
              Scholar's Note & Return
            </h3>
            <p className="text-xs text-parchment-muted font-sans">
              Kembalikan Grimoire & Tulis Catatan Kebijaksanaan untuk Klaim XP
            </p>
          </div>
        </div>

        {/* Tome Info */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-leather-dark border border-gold-alchemy/20 mb-5">
          <img 
            src={tome.cover} 
            alt={tome.title} 
            className="w-12 h-16 object-cover rounded-lg border border-gold-alchemy/30"
          />
          <div>
            <h4 className="font-cinzel text-sm font-bold text-parchment line-clamp-1">
              {tome.title}
            </h4>
            <p className="text-xs text-gold-light/80 italic line-clamp-1">
              "{tome.fantasySubtitle}"
            </p>
            <span className="text-[10px] text-potion-emerald font-semibold">
              ✦ +{xpReward} XP Scholar Rewards
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating Selection */}
          <div>
            <label className="block font-cinzel text-xs font-semibold text-parchment mb-1.5">
              Rating Penilaian Anda:
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-gold-alchemy focus:outline-none transition-transform hover:scale-110"
                >
                  <Star 
                    className={`w-6 h-6 ${
                      (hoverRating || rating) >= star 
                        ? 'fill-gold-alchemy text-gold-alchemy' 
                        : 'text-stone-600'
                    }`} 
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-gold-light ml-2 font-cinzel">
                {rating} / 5 Bintang
              </span>
            </div>
          </div>

          {/* Review / Note Textarea */}
          <div>
            <label className="block font-cinzel text-xs font-semibold text-parchment mb-1.5">
              Scholar's Note (Catatan & Refleksi Pembaca):
            </label>
            <textarea
              required
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tuliskan gagasan paling berkesan, kutipan mutiara, atau pemahaman baru yang Anda petik dari grimoire ini..."
              className="w-full rounded-xl bg-leather-dark border border-gold-alchemy/30 p-3 text-sm text-parchment placeholder-stone-500 focus:outline-none focus:border-gold-alchemy focus:ring-1 focus:ring-gold-alchemy font-sans resize-none"
            />
          </div>

          {/* Reward preview info */}
          <div className="p-3 rounded-xl bg-potion-emerald/10 border border-potion-emerald/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-potion-emerald font-semibold">
              <Award className="w-4 h-4" />
              <span>Hadiah Transmutasi:</span>
            </div>
            <span className="font-cinzel font-bold text-gold-alchemy">
              +{xpReward} Scholar XP
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-leather hover:bg-leather-light text-parchment text-xs font-semibold border border-gold-alchemy/20 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-potion-emerald to-teal-600 hover:from-teal-500 hover:to-potion-emerald text-obsidian text-xs font-bold font-cinzel shadow-emerald-glow transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Kembalikan & Klaim XP</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
