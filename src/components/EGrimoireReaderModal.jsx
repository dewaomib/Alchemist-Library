import React, { useState, useMemo } from 'react';
import {
  X,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Sparkles,
  Award,
  Bookmark,
  Sun,
  Moon,
  Type,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getDigitalTomeContent } from '../data/digitalTomesContent';

export default function EGrimoireReaderModal({
  book,
  isOpen,
  onClose,
  onFinishReading,
  currentUser
}) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [fontSizeLevel, setFontSizeLevel] = useState(1); // 0: sm, 1: base, 2: lg, 3: xl
  const [readerTheme, setReaderTheme] = useState('parchment'); // 'parchment' | 'midnight'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasClaimedXp, setHasClaimedXp] = useState(false);

  // Load content
  const chapters = useMemo(() => {
    return getDigitalTomeContent(book);
  }, [book]);

  if (!isOpen || !book) return null;

  const totalPages = chapters.length;
  const currentChapter = chapters[currentPageIndex] || chapters[0];
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === totalPages - 1;
  const progressPercent = Math.round(((currentPageIndex + 1) / totalPages) * 100);

  // Font size classes
  const fontSizes = [
    'text-sm sm:text-base leading-relaxed',
    'text-base sm:text-lg leading-relaxed sm:leading-loose',
    'text-lg sm:text-xl leading-relaxed sm:leading-loose',
    'text-xl sm:text-2xl leading-loose'
  ];

  const handleNextPage = () => {
    if (!isLastPage) {
      setCurrentPageIndex((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (!isFirstPage) {
      setCurrentPageIndex((prev) => prev - 1);
    }
  };

  const handleCompleteReading = () => {
    if (hasClaimedXp) return;
    setHasClaimedXp(true);

    // Confetti effect
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#10B981', '#8B5CF6']
      });
    } catch {}

    if (onFinishReading) {
      onFinishReading(book);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div
        className={`w-full rounded-2xl border flex flex-col transition-all duration-300 relative overflow-hidden shadow-2xl ${
          isFullscreen
            ? 'fixed inset-0 rounded-none max-w-none h-full m-0'
            : 'max-w-4xl max-h-[92vh] my-auto'
        }`}
        style={{
          backgroundColor: readerTheme === 'parchment' ? '#FAF4E6' : '#14110F',
          borderColor: '#D4AF37',
          color: readerTheme === 'parchment' ? '#2A2218' : '#F4E8C1',
          boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.95)'
        }}
      >
        {/* Top Gold Rune Header Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-potion-emerald via-gold-alchemy to-potion-purple shrink-0" />

        {/* ==========================================
            READER HEADER BAR
        ========================================== */}
        <header
          className="px-4 sm:px-6 py-3 border-b flex items-center justify-between gap-3 shrink-0 select-none"
          style={{
            borderColor: readerTheme === 'parchment' ? 'rgba(180, 140, 60, 0.25)' : 'rgba(212, 175, 55, 0.25)',
            backgroundColor: readerTheme === 'parchment' ? '#F2E8D2' : '#1A1613'
          }}
        >
          {/* Book Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-[#D4AF37]/50 flex items-center justify-center shrink-0 text-amber-500">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-cinzel font-bold text-xs sm:text-sm truncate">
                {book.title}
              </h3>
              <p className="text-[10px] opacity-75 truncate">
                {book.author} • E-Grimoire Digital Reader
              </p>
            </div>
          </div>

          {/* Controls: Theme, Font Size, Fullscreen, Close */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={() => setReaderTheme((prev) => (prev === 'parchment' ? 'midnight' : 'parchment'))}
              className="p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all"
              style={{
                borderColor: 'rgba(212, 175, 55, 0.3)',
                backgroundColor: readerTheme === 'parchment' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
              }}
              title="Ganti Tema Baca (Perkamen Kuno / Midnight Vault)"
            >
              {readerTheme === 'parchment' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-purple-700" />
                  <span className="hidden md:inline text-[10px]">Midnight</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline text-[10px]">Parchment</span>
                </>
              )}
            </button>

            {/* Font Size Adjuster */}
            <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}>
              <button
                onClick={() => setFontSizeLevel((prev) => Math.max(0, prev - 1))}
                disabled={fontSizeLevel === 0}
                className="px-2 py-1 text-[11px] font-bold disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10"
                title="Perkecil Huruf"
              >
                A-
              </button>
              <span className="px-1.5 py-1 text-[10px] opacity-60 border-x border-[#D4AF37]/20">
                {fontSizeLevel === 0 ? 'S' : fontSizeLevel === 1 ? 'M' : fontSizeLevel === 2 ? 'L' : 'XL'}
              </span>
              <button
                onClick={() => setFontSizeLevel((prev) => Math.min(fontSizes.length - 1, prev + 1))}
                disabled={fontSizeLevel === fontSizes.length - 1}
                className="px-2 py-1 text-[11px] font-bold disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10"
                title="Perbesar Huruf"
              >
                A+
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg border text-xs hover:opacity-80 transition-all hidden sm:flex"
              style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border text-xs hover:bg-rose-500/20 hover:border-rose-500/50 hover:text-rose-400 transition-all ml-1"
              style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}
              title="Tutup E-Grimoire Reader"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ==========================================
            READING PARCHMENT BODY
        ========================================== */}
        <main
          className="flex-1 overflow-y-auto p-6 sm:p-10 md:p-14 select-text relative"
          style={{
            backgroundImage: readerTheme === 'parchment'
              ? 'radial-gradient(rgba(180, 140, 60, 0.08) 1px, transparent 0)'
              : 'radial-gradient(rgba(212, 175, 55, 0.04) 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}
        >
          {/* Ornamental Chapter Header */}
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center border-b pb-6" style={{ borderColor: readerTheme === 'parchment' ? 'rgba(180, 140, 60, 0.25)' : 'rgba(212, 175, 55, 0.25)' }}>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-cinzel font-semibold tracking-widest uppercase mb-2"
                style={{
                  backgroundColor: readerTheme === 'parchment' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(212, 175, 55, 0.1)',
                  color: readerTheme === 'parchment' ? '#8C6700' : '#D4AF37'
                }}
              >
                <Sparkles className="w-3 h-3" />
                <span>BAB {currentChapter.chapterNumber || currentPageIndex + 1} DARI {totalPages}</span>
              </div>
              <h2 className="font-cinzel text-xl sm:text-2xl font-bold tracking-wide">
                {currentChapter.title}
              </h2>
            </div>

            {/* Story / Reading Content Text */}
            <div className={`space-y-4 font-sans ${fontSizes[fontSizeLevel]}`}>
              {currentChapter.content.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="first-letter:font-cinzel first-letter:text-3xl sm:first-letter:text-4xl first-letter:font-bold first-letter:float-left first-letter:mr-2.5 first-letter:leading-none">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Special Completion Banner on Last Page */}
            {isLastPage && (
              <div
                className="mt-10 p-6 rounded-2xl border text-center space-y-3 relative overflow-hidden"
                style={{
                  backgroundColor: readerTheme === 'parchment' ? '#EFE2C6' : 'rgba(18, 16, 14, 0.85)',
                  borderColor: '#D4AF37'
                }}
              >
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-amber-500/20 text-[#D4AF37] border border-[#D4AF37]">
                  <Award className="w-6 h-6" />
                </div>
                <h4 className="font-cinzel font-bold text-base sm:text-lg text-[#D4AF37]">
                  ✦ Akhir Naskah Grimoire ✦
                </h4>
                <p className="text-xs max-w-md mx-auto opacity-80 leading-relaxed">
                  Selamat! Anda telah menuntaskan pembacaan seluruh bab digital dari <strong>&ldquo;{book.title}&rdquo;</strong>.
                </p>

                {hasClaimedXp ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-cinzel font-bold text-xs border border-emerald-500/40">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>+75 Scholar XP Berhasil Diklaim!</span>
                  </div>
                ) : (
                  <button
                    onClick={handleCompleteReading}
                    className="px-6 py-2.5 rounded-xl font-cinzel font-bold text-xs bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-[#D4AF37] text-[#12100E] shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2 mx-auto"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Selesaikan Membaca &amp; Klaim +75 XP</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </main>

        {/* ==========================================
            READER FOOTER NAVIGATION & PROGRESS BAR
        ========================================== */}
        <footer
          className="px-4 sm:px-6 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 select-none text-xs"
          style={{
            borderColor: readerTheme === 'parchment' ? 'rgba(180, 140, 60, 0.25)' : 'rgba(212, 175, 55, 0.25)',
            backgroundColor: readerTheme === 'parchment' ? '#F2E8D2' : '#1A1613'
          }}
        >
          {/* Progress Indicator */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="font-cinzel font-semibold text-[11px] whitespace-nowrap">
              Halaman {currentPageIndex + 1} dari {totalPages}
            </span>
            <div className="w-28 sm:w-36 h-2 rounded-full overflow-hidden bg-black/20 border border-[#D4AF37]/30">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-[#D4AF37] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] opacity-70">
              {progressPercent}%
            </span>
          </div>

          {/* Next & Prev Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrevPage}
              disabled={isFirstPage}
              className="px-3.5 py-1.5 rounded-lg border text-xs font-cinzel font-semibold flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              style={{ borderColor: 'rgba(212, 175, 55, 0.4)' }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <button
              onClick={handleNextPage}
              disabled={isLastPage}
              className="px-4 py-1.5 rounded-lg text-xs font-cinzel font-bold flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md"
              style={{
                backgroundColor: '#D4AF37',
                color: '#12100E'
              }}
            >
              <span>Berikutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
