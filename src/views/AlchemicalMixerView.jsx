import React, { useState } from 'react';
import { 
  FlaskConical, 
  Sparkles, 
  Flame, 
  RotateCcw, 
  ArrowRight, 
  Star, 
  Check, 
  AlertCircle,
  Eye
} from 'lucide-react';
import { ALCHEMICAL_INGREDIENTS } from '../data/mockData';
import TomeCard from '../components/TomeCard';
import confetti from 'canvas-confetti';

export default function AlchemicalMixerView({ 
  books, 
  onInspectTome, 
  onSummonTome, 
  mySummonedIds, 
  onIncrementBrewCount 
}) {
  const [selectedIngredients, setSelectedIngredients] = useState([
    'mysterious_shadow',
    'scientific_spark'
  ]);
  const [isBrewing, setIsBrewing] = useState(false);
  const [brewResults, setBrewResults] = useState(null);
  const [potionName, setPotionName] = useState('');

  const toggleIngredient = (id) => {
    if (selectedIngredients.includes(id)) {
      setSelectedIngredients(selectedIngredients.filter((item) => item !== id));
      setBrewResults(null);
    } else {
      if (selectedIngredients.length >= 3) {
        return; // Max 3 ingredients
      }
      setSelectedIngredients([...selectedIngredients, id]);
      setBrewResults(null);
    }
  };

  const handleBrew = () => {
    if (selectedIngredients.length === 0) return;

    setIsBrewing(true);

    // Dynamic magical potion naming based on selected ingredients
    const selectedObj = ALCHEMICAL_INGREDIENTS.filter(i => selectedIngredients.includes(i.id));
    const firstWord = selectedObj[0]?.name.split(' ')[0] || 'Arcane';
    const secondWord = selectedObj[1]?.name.split(' ')[1] || selectedObj[1]?.name.split(' ')[0] || 'Elixir';
    const generatedPotion = `Elixir of ${firstWord} & ${secondWord}`;
    setPotionName(generatedPotion);

    setTimeout(() => {
      // Find matching books scored by ingredient overlap
      const scored = books.map((book) => {
        const bookIngs = book.ingredients || [];
        const matches = selectedIngredients.filter(ing => bookIngs.includes(ing));
        const matchScore = Math.round((matches.length / Math.max(selectedIngredients.length, 1)) * 100);
        return {
          ...book,
          matchScore,
          matchedIngredients: matches,
        };
      })
      .filter(b => b.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore || b.rating - a.rating);

      setBrewResults(scored);
      setIsBrewing(false);
      onIncrementBrewCount(generatedPotion, scored.length);

      // Fire celebratory sparkles
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#10B981', '#8B5CF6', '#D4AF37']
        });
      } catch (err) {}
    }, 1800);
  };

  const clearSelection = () => {
    setSelectedIngredients([]);
    setBrewResults(null);
  };

  return (
    <div className="space-y-12 pb-16 animate-fadeIn">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-potion-emerald/15 border border-potion-emerald/40 text-potion-emerald text-xs font-cinzel font-bold tracking-widest uppercase">
          <FlaskConical className="w-3.5 h-3.5 animate-spin-slow" />
          <span>Interactive Alchemical Book Recommender</span>
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <h1 className="font-cinzel text-3xl sm:text-4xl font-extrabold text-parchment gold-glow">
          The Alchemical Mixer
        </h1>
        <p className="text-sm text-parchment-muted font-sans leading-relaxed">
          Pilih hingga <span className="font-bold text-gold-alchemy">3 Reagen Suasana Hati</span> di bawah. Masukkan ke dalam kuali arkanum dan biarkan hukum alkimia menyingkap grimoire yang paling selaras dengan jiwa belajarmu hari ini!
        </p>
      </div>

      {/* Main Mixer Cauldron Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Reagent Shelf (Select up to 3) */}
        <div className="lg:col-span-7 parchment-card p-6 sm:p-8 rounded-3xl border border-gold-alchemy/30 space-y-5">
          <div className="flex items-center justify-between border-b border-gold-alchemy/15 pb-3">
            <div>
              <h3 className="font-cinzel text-lg font-bold text-parchment">
                Rak Reagen Alkimia
              </h3>
              <p className="text-xs text-parchment-muted font-sans">
                Terpilih: <span className="text-gold-alchemy font-bold">{selectedIngredients.length} / 3 Bahan</span>
              </p>
            </div>
            {selectedIngredients.length > 0 && (
              <button
                onClick={clearSelection}
                className="text-xs text-stone-400 hover:text-potion-amber flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Kosongkan Kuali</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {ALCHEMICAL_INGREDIENTS.map((ing) => {
              const isSelected = selectedIngredients.includes(ing.id);
              const isDisabled = !isSelected && selectedIngredients.length >= 3;

              return (
                <button
                  key={ing.id}
                  type="button"
                  onClick={() => toggleIngredient(ing.id)}
                  disabled={isDisabled}
                  className={`p-3.5 rounded-2xl text-left border transition-all duration-300 relative group flex flex-col justify-between ${
                    isSelected
                      ? `bg-gradient-to-br ${ing.elementColor} ${ing.borderColor} border-2 shadow-alchemy-glow text-parchment`
                      : isDisabled
                        ? 'bg-leather-dark/40 border-stone-800 text-stone-600 opacity-50 cursor-not-allowed'
                        : 'bg-leather-dark/90 hover:bg-leather border-gold-alchemy/20 hover:border-gold-alchemy/50 text-stone-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-cinzel font-bold text-sm text-parchment flex items-center gap-1.5">
                        <span>{ing.name}</span>
                      </div>
                      <div className="text-[11px] text-gold-light/90 font-sans mt-0.5">
                        {ing.labelId}
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                      isSelected 
                        ? 'bg-gold-alchemy text-obsidian border-gold-alchemy' 
                        : 'border-stone-700 text-transparent'
                    }`}>
                      <Check className="w-3.5 h-3.5 font-bold" />
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-400 font-sans mt-2 line-clamp-2 leading-relaxed">
                    {ing.description}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedIngredients.length === 3 && (
            <p className="text-[11px] text-potion-amber flex items-center gap-1.5 italic">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Kuali penuh! Maksimal 3 reagen untuk menjaga kestabilan transmutasi ramuan.</span>
            </p>
          )}
        </div>


        {/* Right Column: Visual Cauldron & Transmute Button */}
        <div className="lg:col-span-5 parchment-card p-6 sm:p-8 rounded-3xl border border-gold-alchemy/30 flex flex-col items-center justify-between text-center space-y-6 relative overflow-hidden">
          
          {/* Arcane background glow inside cauldron chamber */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-potion-emerald/20 to-potion-purple/20 rounded-full blur-3xl pointer-events-none" />

          <div className="w-full">
            <h3 className="font-cinzel text-lg font-bold text-parchment">
              Kuali Transmutasi Pustaka
            </h3>
            <p className="text-xs text-parchment-muted font-sans mt-0.5">
              Alchemical Crucible & Potion Brewing
            </p>
          </div>

          {/* Animated Cauldron Graphic */}
          <div className="relative my-4 flex items-center justify-center">
            
            {/* Outer Runic Magic Circle */}
            <div className={`w-56 h-56 rounded-full border-2 border-dashed border-gold-alchemy/30 flex items-center justify-center ${isBrewing ? 'animate-spin-slow border-gold-alchemy' : ''}`}>
              
              {/* Inner Cauldron Pot */}
              <div className={`relative w-40 h-40 rounded-full bg-gradient-to-b from-stone-900 to-obsidian border-4 border-stone-700 shadow-2xl flex items-center justify-center overflow-hidden ${isBrewing ? 'animate-cauldron-boil' : ''}`}>
                
                {/* Boiling potion liquid */}
                <div className={`absolute inset-3 rounded-full transition-colors duration-1000 shadow-potion-bubble flex items-center justify-center ${
                  isBrewing 
                    ? 'bg-gradient-to-tr from-potion-purple via-potion-emerald to-gold-alchemy animate-pulse'
                    : selectedIngredients.length > 0
                      ? 'bg-gradient-to-tr from-emerald-950 via-teal-900 to-purple-900'
                      : 'bg-stone-950'
                }`}>
                  {/* Bubbles */}
                  {isBrewing && (
                    <>
                      <div className="absolute w-4 h-4 rounded-full bg-white/40 animate-bubble left-6 bottom-4" />
                      <div className="absolute w-3 h-3 rounded-full bg-potion-emerald/60 animate-bubble right-8 bottom-6 delay-150" />
                      <div className="absolute w-5 h-5 rounded-full bg-gold-alchemy/50 animate-bubble left-12 bottom-2 delay-300" />
                    </>
                  )}
                  
                  <FlaskConical className={`w-14 h-14 transition-all duration-300 ${
                    isBrewing 
                      ? 'text-white scale-110 rotate-12' 
                      : selectedIngredients.length > 0 
                        ? 'text-potion-emerald' 
                        : 'text-stone-700'
                  }`} />
                </div>

              </div>
            </div>

            {/* Glowing Runes at compass points */}
            <div className="absolute top-0 text-[10px] text-gold-alchemy font-cinzel">✦ N</div>
            <div className="absolute bottom-0 text-[10px] text-gold-alchemy font-cinzel">✦ S</div>
            <div className="absolute left-0 text-[10px] text-gold-alchemy font-cinzel">✦ W</div>
            <div className="absolute right-0 text-[10px] text-gold-alchemy font-cinzel">✦ E</div>
          </div>

          {/* Selected Ingredients Pills inside cauldron preview */}
          <div className="w-full space-y-2">
            <span className="text-[11px] font-cinzel uppercase tracking-wider text-stone-400">
              Komposisi Ramuan:
            </span>
            <div className="flex flex-wrap justify-center gap-1.5 min-h-[32px]">
              {selectedIngredients.length > 0 ? (
                selectedIngredients.map((id) => {
                  const ing = ALCHEMICAL_INGREDIENTS.find(i => i.id === id);
                  return (
                    <span 
                      key={id}
                      className="px-2.5 py-0.5 rounded-full text-xs bg-leather border border-gold-alchemy/40 text-gold-light flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-gold-alchemy" />
                      {ing?.name}
                    </span>
                  );
                })
              ) : (
                <span className="text-xs text-stone-500 italic font-sans">
                  Belum ada reagen yang dimasukkan ke kuali...
                </span>
              )}
            </div>
          </div>

          {/* Transmute Button */}
          <button
            onClick={handleBrew}
            disabled={isBrewing || selectedIngredients.length === 0}
            className={`w-full py-3.5 rounded-2xl font-cinzel font-bold text-sm tracking-wide transition-all shadow-xl flex items-center justify-center gap-2 ${
              isBrewing
                ? 'bg-purple-900 text-purple-200 cursor-wait animate-pulse'
                : selectedIngredients.length > 0
                  ? 'bg-gradient-to-r from-gold-alchemy via-amber-500 to-potion-emerald text-obsidian hover:shadow-alchemy-glow hover:scale-[1.02]'
                  : 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed'
            }`}
          >
            {isBrewing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Mentransmutasi Esensi Ramuan...</span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4" />
                <span>Transmute / Brew Recommendation</span>
              </>
            )}
          </button>

        </div>

      </div>


      {/* Recommendation Results Showcase */}
      {brewResults && (
        <section className="space-y-6 pt-6 border-t border-gold-alchemy/20 animate-slideUp">
          <div className="parchment-card p-6 sm:p-8 rounded-3xl border-2 border-gold-alchemy/50 shadow-alchemy-glow text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-cinzel font-bold text-potion-emerald tracking-widest uppercase">
              ✦ Hasil Transmutasi Alkimia Berhasil ✦
            </span>
            <h2 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-parchment gold-glow">
              {potionName}
            </h2>
            <p className="text-xs sm:text-sm text-parchment-muted font-sans max-w-xl mx-auto">
              Berdasarkan resonansi bahan yang Anda campurkan, arsip kuno merekomendasikan {brewResults.length} grimoire terbaik berikut:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {brewResults.map((book) => (
              <div key={book.id} className="relative flex flex-col">
                {/* Match score banner on top */}
                <div className="absolute -top-3 left-4 z-20 px-3 py-0.5 rounded-full bg-gradient-to-r from-gold-alchemy to-potion-emerald text-obsidian text-[11px] font-cinzel font-extrabold shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Resonansi {book.matchScore}%</span>
                </div>
                <TomeCard
                  tome={book}
                  onInspect={onInspectTome}
                  onSummon={onSummonTome}
                  isSummonedByMe={mySummonedIds.includes(book.id)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
