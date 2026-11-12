import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  BookOpen, 
  Users, 
  FlaskConical, 
  ShieldAlert, 
  ArrowRight, 
  Award, 
  CheckCircle2, 
  Flame, 
  Scroll, 
  Compass, 
  Star 
} from 'lucide-react';
import TomeCard from '../components/TomeCard';

export default function GreatHallView({ 
  books, 
  quests, 
  onInspectTome, 
  onSummonTome, 
  onClaimQuest,
  setActiveTab, 
  setSearchQuery,
  mySummonedIds,
}) {
  const [scryingQuery, setScryingQuery] = useState('');

  const featuredBooks = books.filter(b => b.featured);

  const handleScryingSearch = (e) => {
    e.preventDefault();
    if (!scryingQuery.trim()) return;
    setSearchQuery(scryingQuery);
    setActiveTab('vault');
  };

  return (
    <div className="space-y-16 pb-12 animate-fadeIn">
      
      {/* 1. HERO SECTION: Magical Archive Ambiance */}
      <section className="relative rounded-3xl overflow-hidden border border-gold-alchemy/30 bg-gradient-to-b from-leather-light/90 via-obsidian/95 to-obsidian-deep p-6 sm:p-12 lg:p-16 shadow-2xl medieval-texture">
        {/* Arcane Background Orbs & Runes */}
        <div className="absolute top-0 right-10 w-96 h-96 bg-gold-alchemy/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-potion-purple/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-20 -left-20 w-64 h-64 border border-gold-alchemy/10 rounded-full animate-spin-slow pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-leather border border-gold-alchemy/40 text-gold-light text-xs font-cinzel tracking-widest uppercase shadow-alchemy">
            <Sparkles className="w-3.5 h-3.5 text-gold-alchemy animate-spin-slow" />
            <span>Gerbang Pengetahuan & Grimoire Akademi</span>
            <Sparkles className="w-3.5 h-3.5 text-gold-alchemy animate-spin-slow" />
          </div>

          {/* Hero Title */}
          <h1 className="font-cinzel text-3xl sm:text-5xl lg:text-6xl font-extrabold text-parchment gold-glow tracking-tight leading-tight">
            The Grand Alchemist's <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-alchemy via-gold-light to-potion-emerald">
              Archive & Library
            </span>
          </h1>

          {/* Subtitle in Indonesian */}
          <p className="font-sans text-sm sm:text-base text-parchment-muted max-w-2xl mx-auto leading-relaxed">
            Selamat datang, cendekiawan muda. Di balik gerbang obsidian ini tersimpan ribuan naskah ilmu fisika, petualangan fiksi legendaris Nusantara, hingga rahasia pemrograman para artificer. Temukan grimoire pilihanmu dan tingkatkan level arkanummu!
          </p>

          {/* Scrying Mirror (Quick Search Bar) */}
          <form onSubmit={handleScryingSearch} className="max-w-xl mx-auto pt-2">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-gold-alchemy via-potion-emerald to-potion-purple rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-500" />
              <div className="relative flex items-center bg-obsidian-deep rounded-2xl border border-gold-alchemy/50 p-2 shadow-2xl">
                <Search className="w-5 h-5 text-gold-alchemy ml-3 mr-2" />
                <input 
                  type="text" 
                  value={scryingQuery}
                  onChange={(e) => setScryingQuery(e.target.value)}
                  placeholder="Scrying Mirror: Cari judul, mpu pengarang, atau kata kunci..."
                  className="w-full bg-transparent text-sm text-parchment placeholder-stone-500 focus:outline-none font-sans"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-alchemy to-amber-600 hover:from-amber-500 hover:to-gold-alchemy text-obsidian font-cinzel font-bold text-xs shadow-alchemy transition-all shrink-0 flex items-center gap-1.5"
                >
                  <span>Scry (Cari)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>

          {/* Quick Category Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
            <span className="text-stone-500 font-sans">Aliran Cepat:</span>
            {['Tere Liye', 'Fisika Kuantum', 'Clean Code', 'Laskar Pelangi', 'Filosofi Teras'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSearchQuery(tag);
                  setActiveTab('vault');
                }}
                className="px-2.5 py-1 rounded-lg bg-leather-dark/80 hover:bg-leather text-stone-300 hover:text-gold-alchemy border border-gold-alchemy/20 transition-all text-[11px]"
              >
                ✦ {tag}
              </button>
            ))}
          </div>

        </div>

        {/* 2. QUICK STATS BAR */}
        <div className="mt-12 pt-8 border-t border-gold-alchemy/20 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="parchment-card p-4 rounded-2xl border border-gold-alchemy/20 text-center">
            <div className="flex justify-center mb-1 text-gold-alchemy">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="font-cinzel text-xl sm:text-2xl font-bold text-parchment gold-glow">
              {books.length + 1414}
            </div>
            <div className="text-[11px] text-parchment-muted font-sans uppercase tracking-wider">
              Total Tomes (Grimoire)
            </div>
          </div>

          <div className="parchment-card p-4 rounded-2xl border border-gold-alchemy/20 text-center">
            <div className="flex justify-center mb-1 text-potion-emerald">
              <Users className="w-5 h-5" />
            </div>
            <div className="font-cinzel text-xl sm:text-2xl font-bold text-parchment emerald-glow">
              342
            </div>
            <div className="text-[11px] text-parchment-muted font-sans uppercase tracking-wider">
              Active Scholars (Siswa)
            </div>
          </div>

          <div className="parchment-card p-4 rounded-2xl border border-gold-alchemy/20 text-center">
            <div className="flex justify-center mb-1 text-potion-purple">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div className="font-cinzel text-xl sm:text-2xl font-bold text-parchment purple-glow">
              890
            </div>
            <div className="text-[11px] text-parchment-muted font-sans uppercase tracking-wider">
              Potions Brewed (Ramuan)
            </div>
          </div>

          <div className="parchment-card p-4 rounded-2xl border border-gold-alchemy/20 text-center">
            <div className="flex justify-center mb-1 text-potion-amber">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="font-cinzel text-xl sm:text-2xl font-bold text-parchment">
              99.4%
            </div>
            <div className="text-[11px] text-parchment-muted font-sans uppercase tracking-wider">
              Vault Preservation
            </div>
          </div>
        </div>

      </section>


      {/* 3. GUILD QUEST BOARD (Papan Tugas Serikat Cendekiawan) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gold-alchemy/20 pb-4">
          <div>
            <div className="flex items-center gap-2 text-gold-alchemy">
              <Scroll className="w-5 h-5" />
              <h2 className="font-cinzel text-2xl font-bold text-parchment">
                Guild Quest Board
              </h2>
            </div>
            <p className="text-xs text-parchment-muted font-sans">
              Tantangan Literasi & Ekspedisi Membaca Berhadiah Scholar XP & Lencana Gelar
            </p>
          </div>
          <button
            onClick={() => setActiveTab('sanctum')}
            className="text-xs font-semibold text-gold-alchemy hover:text-gold-light flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            <span>Buka Lembar Cendekiawan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quests.map((quest) => (
            <div 
              key={quest.id}
              className={`parchment-card rounded-2xl p-5 border relative flex flex-col justify-between transition-all duration-300 ${
                quest.claimed 
                  ? 'border-potion-emerald/40 bg-emerald-950/20' 
                  : quest.completed 
                    ? 'border-gold-alchemy shadow-alchemy-glow' 
                    : 'border-gold-alchemy/20 hover:border-gold-alchemy/40'
              }`}
            >
              {/* Top quest ribbon */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-cinzel font-bold bg-leather-dark border border-gold-alchemy/30 text-gold-light">
                  ✦ {quest.badgeReward}
                </span>
                <span className="px-2 py-0.5 rounded-md text-xs font-bold font-cinzel bg-gold-alchemy/15 text-gold-alchemy border border-gold-alchemy/30">
                  +{quest.xpReward} XP
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <h3 className="font-cinzel text-base font-bold text-parchment">
                  {quest.title}
                </h3>
                <p className="text-xs text-stone-300 font-sans leading-relaxed">
                  {quest.subtitle}
                </p>
                <p className="text-[11px] text-stone-400 italic">
                  "{quest.description}"
                </p>
              </div>

              {/* Progress Bar & Action */}
              <div className="space-y-3 pt-3 border-t border-gold-alchemy/15">
                <div className="flex justify-between text-[11px] text-parchment-muted">
                  <span>Progres Ekspedisi:</span>
                  <span className="font-bold text-parchment">{quest.progress} / {quest.target}</span>
                </div>
                <div className="w-full h-2 bg-obsidian rounded-full overflow-hidden border border-stone-800">
                  <div 
                    className="h-full bg-gradient-to-r from-gold-alchemy to-potion-emerald transition-all duration-500"
                    style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }}
                  />
                </div>

                {quest.claimed ? (
                  <div className="w-full py-2 rounded-xl bg-emerald-950/80 text-potion-emerald text-xs font-bold text-center border border-potion-emerald/40 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Hadiah Telah Diklaim</span>
                  </div>
                ) : quest.completed ? (
                  <button
                    onClick={() => onClaimQuest(quest.id)}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-gold-alchemy to-amber-600 hover:from-amber-500 hover:to-gold-alchemy text-obsidian text-xs font-bold font-cinzel shadow-alchemy flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Award className="w-4 h-4" />
                    <span>Klaim Hadiah Quest (+{quest.xpReward} XP)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setActiveTab('vault');
                    }}
                    className="w-full py-2 rounded-xl bg-leather hover:bg-leather-light text-parchment text-xs font-medium border border-gold-alchemy/20 hover:border-gold-alchemy/40 transition-all flex items-center justify-center gap-1"
                  >
                    <span>Cari Kitab Terkait di Vault</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gold-light" />
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      </section>


      {/* 4. FEATURED GRIMOIRES (Grimoire Pilihan Kurator) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gold-alchemy/20 pb-4">
          <div>
            <div className="flex items-center gap-2 text-gold-alchemy">
              <Sparkles className="w-5 h-5 text-potion-emerald" />
              <h2 className="font-cinzel text-2xl font-bold text-parchment">
                Featured Grimoires
              </h2>
            </div>
            <p className="text-xs text-parchment-muted font-sans">
              Kitab Terpopuler & Paling Banyak Dikaji oleh Para Cendekiawan Akademi
            </p>
          </div>
          <button
            onClick={() => setActiveTab('vault')}
            className="text-xs font-semibold text-gold-alchemy hover:text-gold-light flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            <span>Jelajahi Seluruh Vault ({books.length} Tomes)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featuredBooks.slice(0, 4).map((book) => (
            <TomeCard
              key={book.id}
              tome={book}
              onInspect={onInspectTome}
              onSummon={onSummonTome}
              isSummonedByMe={mySummonedIds.includes(book.id)}
            />
          ))}
        </div>
      </section>

      {/* 5. CALL TO ACTION: ALCHEMICAL MIXER BANNER */}
      <section className="relative rounded-3xl overflow-hidden border border-potion-emerald/40 bg-gradient-to-r from-emerald-950/40 via-obsidian to-purple-950/40 p-8 sm:p-10 parchment-card">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-potion-emerald/20 border border-potion-emerald/50 flex items-center justify-center text-potion-emerald shrink-0">
              <FlaskConical className="w-8 h-8 animate-bounce" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-cinzel font-bold text-potion-emerald uppercase tracking-wider">
                ✦ Fitur Unik Recommender
              </span>
              <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-parchment">
                Bingung Ingin Membaca Apa Hari Ini?
              </h3>
              <p className="text-xs sm:text-sm text-parchment-muted font-sans max-w-xl leading-relaxed">
                Nyalakan kuali Alchemical Mixer! Campurkan bahan suasana hati seperti <i>"Misteri Bayangan"</i>, <i>"Percikan Sains"</i>, atau <i>"Api Persahabatan"</i> untuk meramu rekomendasi grimoire ajaib yang pas untuk jiwamu.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('mixer')}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-potion-emerald to-teal-500 hover:from-teal-400 hover:to-potion-emerald text-obsidian font-cinzel font-bold text-xs sm:text-sm shadow-emerald-glow transition-all shrink-0 flex items-center gap-2"
          >
            <FlaskConical className="w-4 h-4" />
            <span>Racik di Alchemical Mixer</span>
          </button>
        </div>
      </section>

    </div>
  );
}
