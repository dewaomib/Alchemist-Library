import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  BookOpen, 
  Sparkles, 
  X, 
  RotateCcw,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { SCHOOLS_OF_LORE } from '../data/mockData';
import TomeCard from '../components/TomeCard';

export default function VaultOfTomesView({
  books,
  searchQuery,
  setSearchQuery,
  onInspectTome,
  onSummonTome,
  mySummonedIds,
}) {
  const [selectedSchool, setSelectedSchool] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all'); // 'all', 'available', 'borrowed'
  const [sortBy, setSortBy] = useState('featured'); // 'featured', 'rating', 'title', 'pages'

  // Filter & Sort Logic
  const filteredBooks = useMemo(() => {
    return books
      .filter((book) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = book.title.toLowerCase().includes(q);
          const matchAuthor = book.author.toLowerCase().includes(q);
          const matchSubtitle = book.fantasySubtitle.toLowerCase().includes(q);
          const matchSynopsis = book.synopsis.toLowerCase().includes(q);
          if (!matchTitle && !matchAuthor && !matchSubtitle && !matchSynopsis) {
            return false;
          }
        }

        // School of Lore filter
        if (selectedSchool !== 'all' && book.school !== selectedSchool) {
          return false;
        }

        // Availability filter
        if (availabilityFilter === 'available' && book.status !== 'available') {
          return false;
        }
        if (availabilityFilter === 'borrowed' && book.status !== 'borrowed') {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'pages') return b.pages - a.pages;
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        // default: featured first, then rating
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.rating - a.rating;
      });
  }, [books, searchQuery, selectedSchool, availabilityFilter, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSchool('all');
    setAvailabilityFilter('all');
    setSortBy('featured');
  };

  const hasActiveFilters = searchQuery || selectedSchool !== 'all' || availabilityFilter !== 'all' || sortBy !== 'featured';

  return (
    <div className="space-y-8 pb-12 animate-fadeIn">
      
      {/* Header & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gold-alchemy/20 pb-6">
        <div>
          <div className="flex items-center gap-2 text-gold-alchemy">
            <BookOpen className="w-6 h-6 text-gold-alchemy" />
            <h1 className="font-cinzel text-3xl font-extrabold text-parchment gold-glow">
              Vault of Tomes
            </h1>
          </div>
          <p className="text-sm text-parchment-muted font-sans mt-1">
            Katalog Pustaka & Grimoire Akademi. Cari, teliti naskah, dan summon buku ke Scholar's Sanctum.
          </p>
        </div>

        <div className="text-xs text-stone-400 font-sans">
          Menampilkan <span className="font-bold text-gold-alchemy">{filteredBooks.length}</span> dari <span className="font-bold text-parchment">{books.length}</span> Grimoire Terdaftar
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="parchment-card p-4 sm:p-6 rounded-3xl border border-gold-alchemy/25 space-y-4">
        
        {/* Search input & Sort selector row */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gold-alchemy absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan judul, penulis (Tere Liye, Andrea Hirata), atau kata kunci..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-obsidian-deep border border-gold-alchemy/30 text-sm text-parchment placeholder-stone-500 focus:outline-none focus:border-gold-alchemy"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-parchment"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <span className="text-xs text-stone-400 hidden sm:inline font-sans">Urutan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-obsidian-deep border border-gold-alchemy/30 text-xs text-parchment focus:outline-none focus:border-gold-alchemy font-sans"
            >
              <option value="featured">Pilihan Kurator (Featured)</option>
              <option value="rating">Rating Tertinggi (Highest Rated)</option>
              <option value="title">Judul Alfabetis (A - Z)</option>
              <option value="pages">Halaman Terbanyak (Thickest Lore)</option>
            </select>
          </div>
        </div>

        {/* Schools of Lore Filter Tabs */}
        <div className="pt-2 border-t border-gold-alchemy/15">
          <div className="text-xs font-cinzel font-semibold text-gold-light mb-2 flex items-center justify-between">
            <span>Aliran Keilmuan (Schools of Lore):</span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-[11px] text-potion-amber hover:text-gold-light flex items-center gap-1 font-sans transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {SCHOOLS_OF_LORE.map((school) => {
              const isSelected = selectedSchool === school.id;
              return (
                <button
                  key={school.id}
                  onClick={() => setSelectedSchool(school.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-gold-alchemy to-amber-600 text-obsidian font-bold shadow-alchemy'
                      : 'bg-leather-dark hover:bg-leather text-stone-300 hover:text-parchment border border-gold-alchemy/20'
                  }`}
                >
                  {school.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Availability Filter Pills */}
        <div className="flex items-center gap-2 pt-2 text-xs">
          <span className="text-stone-400 font-sans">Status Vault:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAvailabilityFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                availabilityFilter === 'all'
                  ? 'bg-leather text-parchment border border-gold-alchemy/50 font-bold'
                  : 'text-stone-400 hover:text-parchment'
              }`}
            >
              Semua ({books.length})
            </button>
            <button
              onClick={() => setAvailabilityFilter('available')}
              className={`px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-all ${
                availabilityFilter === 'available'
                  ? 'bg-emerald-950 text-potion-emerald border border-potion-emerald font-bold'
                  : 'text-stone-400 hover:text-potion-emerald'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>In the Vault ({books.filter(b => b.status === 'available').length})</span>
            </button>
            <button
              onClick={() => setAvailabilityFilter('borrowed')}
              className={`px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-all ${
                availabilityFilter === 'borrowed'
                  ? 'bg-amber-950 text-potion-amber border border-potion-amber font-bold'
                  : 'text-stone-400 hover:text-potion-amber'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Summoned ({books.filter(b => b.status === 'borrowed').length})</span>
            </button>
          </div>
        </div>

      </div>

      {/* Book Grid */}
      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <TomeCard
              key={book.id}
              tome={book}
              onInspect={onInspectTome}
              onSummon={onSummonTome}
              isSummonedByMe={mySummonedIds.includes(book.id)}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="parchment-card rounded-3xl border border-gold-alchemy/30 p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-leather-dark border border-gold-alchemy/30 mx-auto flex items-center justify-center text-gold-alchemy">
            <Search className="w-8 h-8 opacity-60" />
          </div>
          <h3 className="font-cinzel text-xl font-bold text-parchment">
            Grimoire Tidak Ditemukan di Vault
          </h3>
          <p className="text-xs text-parchment-muted font-sans leading-relaxed">
            Tidak ada grimoire yang cocok dengan kata kunci atau filter yang Anda pilih. Coba gunakan istilah lain atau reset filter pencarian.
          </p>
          <button
            onClick={resetFilters}
            className="px-5 py-2 rounded-xl bg-gold-alchemy text-obsidian font-cinzel font-bold text-xs shadow-alchemy hover:bg-amber-400 transition-all"
          >
            Bersihkan Seluruh Filter
          </button>
        </div>
      )}

    </div>
  );
}
