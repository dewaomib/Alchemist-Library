import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
  CheckCircle2,
  Headphones,
  Pause,
  Play,
  Square
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getDigitalTomeContent } from '../data/digitalTomesContent';
import {
  createTextProgress,
  formatResumeMessage,
  getBookKey,
  getUserKey,
  resolveRemoteRestoreAction,
  shouldApplyRemoteProgress,
  shouldMarkNavigationFromScroll,
  shouldShowResume
} from '../utils/readingProgressCore';
import {
  fetchRemoteReadingProgress,
  loadLocalReadingProgress,
  loadReaderTheme,
  pushRemoteReadingProgress,
  saveLocalReadingProgress,
  saveReaderTheme
} from '../utils/readingProgress';
import { getReaderThemeTokens } from '../utils/readerThemes';
import { useTheme } from '../context/ThemeContext';
import { useSpeechNarrator } from '../hooks/useSpeechNarrator';

export default function EGrimoireReaderModal({
  book,
  isOpen,
  onClose,
  onFinishReading,
  currentUser,
  showToast,
  onOpenPdfViewer
}) {
  const { isModern } = useTheme();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [fontSizeLevel, setFontSizeLevel] = useState(1); // 0: sm, 1: base, 2: lg, 3: xl
  const userId = getUserKey(currentUser);
  const bookId = getBookKey(book);
  const [readerTheme, setReaderTheme] = useState(() =>
    isModern ? 'modern' : loadReaderTheme(userId)
  ); // 'obsidian' | 'parchment' | 'modern'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasClaimedXp, setHasClaimedXp] = useState(false);

  const mainRef = useRef(null);
  const pendingScrollRef = useRef(null);
  const scrollRatioRef = useRef(0);
  const isRestoringScrollRef = useRef(false);
  const chapterIndexRef = useRef(currentPageIndex);
  chapterIndexRef.current = currentPageIndex;
  const userNavigatedRef = useRef(false);
  const resumeToastShownRef = useRef(false);
  const saveTimerRef = useRef(null);
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  // Load content
  const chapters = useMemo(() => {
    return getDigitalTomeContent(book);
  }, [book]);

  const totalPages = chapters.length;
  const currentChapter = chapters[currentPageIndex] || chapters[0] || null;
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = totalPages === 0 || currentPageIndex >= totalPages - 1;
  const progressPercent = totalPages > 0
    ? Math.round(((currentPageIndex + 1) / totalPages) * 100)
    : 0;
  const effectiveReaderTheme =
    isModern && readerTheme !== 'obsidian' ? 'modern' : readerTheme;
  const tokens = getReaderThemeTokens(effectiveReaderTheme);

  useEffect(() => {
    setReaderTheme(isModern ? 'modern' : loadReaderTheme(userId));
  }, [userId, isModern]);

  // Font size classes
  const fontSizes = [
    'text-sm sm:text-base leading-relaxed',
    'text-base sm:text-lg leading-relaxed sm:leading-loose',
    'text-lg sm:text-xl leading-relaxed sm:leading-loose',
    'text-xl sm:text-2xl leading-loose'
  ];

  const {
    status: speechStatus,
    isSupported: isSpeechSupported,
    voiceLabel,
    play: playNarration,
    pause: pauseNarration,
    resume: resumeNarration,
    stop: stopNarration
  } = useSpeechNarrator();

  const narrationText = useMemo(
    () => [currentChapter?.title, currentChapter?.content].filter(Boolean).join('. '),
    [currentChapter]
  );

  const persistProgress = useCallback((chapterIndex, scrollRatio, syncRemote = false) => {
    if (!book) return;
    const progress = createTextProgress({
      chapterIndex,
      chapterTitle: chapters[chapterIndex]?.title || '',
      scrollRatio,
      totalChapters: chapters.length
    });
    saveLocalReadingProgress(userId, bookId, progress);
    if (syncRemote) {
      void pushRemoteReadingProgress(userId, bookId, progress);
    }
  }, [book, bookId, chapters, userId]);

  const measureScrollRatio = useCallback(() => {
    const node = mainRef.current;
    if (!node || node.scrollHeight <= node.clientHeight) return 0;
    const ratio = node.scrollTop / (node.scrollHeight - node.clientHeight);
    return Math.min(1, Math.max(0, ratio));
  }, []);

  const applyScrollToRatio = useCallback((ratio) => {
    const node = mainRef.current;
    if (!node) return;

    const safeRatio = Math.min(1, Math.max(0, Number(ratio) || 0));
    const maxScroll = Math.max(0, node.scrollHeight - node.clientHeight);

    // Mark the next scroll event as programmatic so it does not count as user navigation.
    isRestoringScrollRef.current = true;
    node.scrollTop = safeRatio * maxScroll;

    window.requestAnimationFrame(() => {
      isRestoringScrollRef.current = false;
    });
  }, []);

  const saveSnapshot = useCallback(() => {
    persistProgress(chapterIndexRef.current, scrollRatioRef.current);
  }, [persistProgress]);

  const handleToggleTheme = () => {
    const nextTheme =
      readerTheme === 'obsidian' ? (isModern ? 'modern' : 'parchment') : 'obsidian';
    setReaderTheme(nextTheme);
    if (nextTheme === 'obsidian' || nextTheme === 'parchment') {
      saveReaderTheme(userId, nextTheme);
    }
  };

  const handleNarrate = () => {
    if (!isSpeechSupported || !narrationText) return;
    if (speechStatus === 'playing') {
      pauseNarration();
    } else if (speechStatus === 'paused') {
      resumeNarration();
    } else {
      playNarration(narrationText);
    }
  };

  const handleStopNarration = () => {
    stopNarration();
  };

  const handleClose = useCallback(() => {
    const ratio = measureScrollRatio();
    scrollRatioRef.current = ratio;
    persistProgress(currentPageIndex, ratio, true);
    stopNarration();
    onClose();
  }, [currentPageIndex, measureScrollRatio, onClose, persistProgress, stopNarration]);

  const handleNextPage = () => {
    if (isLastPage) return;
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    userNavigatedRef.current = true;
    scrollRatioRef.current = 0;
    const nextIndex = currentPageIndex + 1;
    pendingScrollRef.current = { chapterIndex: nextIndex, ratio: 0 };
    chapterIndexRef.current = nextIndex;
    setCurrentPageIndex(nextIndex);
    persistProgress(nextIndex, 0, true);
  };

  const handlePrevPage = () => {
    if (isFirstPage) return;
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    userNavigatedRef.current = true;
    scrollRatioRef.current = 0;
    const prevIndex = currentPageIndex - 1;
    pendingScrollRef.current = { chapterIndex: prevIndex, ratio: 0 };
    chapterIndexRef.current = prevIndex;
    setCurrentPageIndex(prevIndex);
    persistProgress(prevIndex, 0, true);
  };

  const handleCompleteReading = () => {
    if (hasClaimedXp) return;

    const ratio = measureScrollRatio();
    scrollRatioRef.current = ratio;
    persistProgress(currentPageIndex, ratio, true);
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

  const handleScroll = () => {
    scrollRatioRef.current = measureScrollRatio();

    if (!shouldMarkNavigationFromScroll(isRestoringScrollRef.current)) {
      isRestoringScrollRef.current = false;
      return;
    }

    userNavigatedRef.current = true;

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      saveSnapshot();
    }, 400);
  };

  // Stop narration whenever the visible chapter, book, or modal state changes.
  useEffect(() => {
    stopNarration();
  }, [currentPageIndex, book?.id, isOpen, stopNarration]);

  // Keep the theme in sync with the active demo identity.
  useEffect(() => {
    setReaderTheme(loadReaderTheme(userId));
  }, [userId]);

  // Save the previous snapshot when the book/user changes, the reader closes, or unmounts.
  useEffect(() => {
    if (!isOpen || !book) return undefined;
    return () => {
      persistProgress(chapterIndexRef.current, scrollRatioRef.current);
    };
  }, [isOpen, bookId, userId, persistProgress, book]);

  // Restore the saved position whenever the reader opens or the identity changes.
  useEffect(() => {
    if (!isOpen || !book) return;

    setHasClaimedXp(false);
    setIsFullscreen(false);
    userNavigatedRef.current = false;
    resumeToastShownRef.current = false;

    const progress = loadLocalReadingProgress(userId, bookId, 'text', chapters.length);

    if (progress) {
      setCurrentPageIndex(progress.chapterIndex);
      pendingScrollRef.current = { chapterIndex: progress.chapterIndex, ratio: progress.scrollRatio };
      scrollRatioRef.current = progress.scrollRatio;

      if (shouldShowResume(progress)) {
        showToastRef.current?.(
          'Melanjutkan Bacaan',
          formatResumeMessage(progress, chapters.length),
          'gold'
        );
        resumeToastShownRef.current = true;
      }
    } else {
      setCurrentPageIndex(0);
      pendingScrollRef.current = { chapterIndex: 0, ratio: 0 };
      scrollRatioRef.current = 0;
    }
  }, [isOpen, bookId, userId, chapters.length]);

  // Merge a newer remote bookmark without interrupting an active reader.
  useEffect(() => {
    if (!isOpen || !book) return undefined;

    let cancelled = false;
    userNavigatedRef.current = false;

    const mergeRemoteProgress = async () => {
      const remote = await fetchRemoteReadingProgress(userId, bookId, 'text', chapters.length);
      if (cancelled || !remote || userNavigatedRef.current) return;

      const local = loadLocalReadingProgress(userId, bookId, 'text', chapters.length);
      if (!shouldApplyRemoteProgress(local, remote, userNavigatedRef.current)) return;

      saveLocalReadingProgress(userId, bookId, remote);
      scrollRatioRef.current = remote.scrollRatio;

      const action = resolveRemoteRestoreAction(remote.chapterIndex, chapterIndexRef.current);
      if (action === 'scroll') {
        pendingScrollRef.current = null;
        applyScrollToRatio(remote.scrollRatio);
      } else {
        pendingScrollRef.current = {
          chapterIndex: remote.chapterIndex,
          ratio: remote.scrollRatio
        };
        setCurrentPageIndex(remote.chapterIndex);
      }

      if (shouldShowResume(remote) && !resumeToastShownRef.current) {
        showToastRef.current?.(
          'Melanjutkan Bacaan',
          formatResumeMessage(remote, chapters.length),
          'gold'
        );
        resumeToastShownRef.current = true;
      }
    };

    void mergeRemoteProgress();

    return () => {
      cancelled = true;
    };
  }, [isOpen, bookId, userId, chapters.length, applyScrollToRatio]);

  // Apply a restored scroll ratio once the target chapter is rendered.
  useEffect(() => {
    if (!isOpen || !book) return undefined;

    const pending = pendingScrollRef.current;
    if (!pending || pending.chapterIndex !== currentPageIndex) return undefined;

    const frame = window.requestAnimationFrame(() => {
      pendingScrollRef.current = null;
      applyScrollToRatio(pending.ratio);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [currentPageIndex, isOpen, bookId, applyScrollToRatio]);

  // Escape exits fullscreen first, then closes the reader.
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (isFullscreen) {
        setIsFullscreen(false);
        return;
      }
      handleClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, handleClose]);

  // Persist synchronously when the page is hidden or navigated away.
  useEffect(() => {
    if (!isOpen || !book) return undefined;

    const handlePageHide = () => {
      saveSnapshot();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveSnapshot();
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOpen, book, saveSnapshot]);

  // Clear any pending debounce timer on unmount.
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, []);

  if (!isOpen || !book) return null;

  if (!currentChapter) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
        <div
          className="w-full max-w-md rounded-2xl border p-8 text-center space-y-4"
          style={{
            backgroundColor: tokens.container,
            borderColor: tokens.accent,
            color: tokens.text,
            boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.95)'
          }}
        >
          <BookOpen className="w-10 h-10 mx-auto" style={{ color: tokens.accent }} />
          <h3 className="font-cinzel font-bold text-lg">
            Naskah digital belum tersedia untuk buku ini.
          </h3>
          <p className="text-xs opacity-70">
            Coba pilih buku lain atau hubungi pustakawan.
          </p>
          <button
            onClick={handleClose}
            className="px-5 py-2 rounded-xl font-cinzel font-bold text-xs transition-all hover:opacity-90"
            style={{
              backgroundColor: tokens.accent,
              color: readerTheme === 'obsidian' ? '#12100E' : '#FBF5E6'
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div
        className={`w-full rounded-2xl border flex flex-col transition-all duration-300 relative overflow-hidden shadow-2xl ${
          isFullscreen
            ? 'fixed inset-0 rounded-none max-w-none h-full m-0'
            : 'max-w-4xl max-h-[92vh] my-auto'
        }`}
        style={{
          backgroundColor: tokens.container,
          borderColor: tokens.accent,
          color: tokens.text,
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
            borderColor: tokens.border,
            backgroundColor: tokens.surface
          }}
        >
          {/* Book Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: tokens.accentSoft,
                border: `1px solid ${tokens.border}`,
                color: tokens.accent
              }}
            >
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

          {/* Controls: Flipbook 3D (if PDF), Theme, Font Size, Narrator, Fullscreen, Close */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {book.pdfUrl && onOpenPdfViewer && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPdfViewer(book);
                }}
                className="px-2.5 py-1.5 rounded-lg border text-[10px] sm:text-xs font-cinzel font-bold flex items-center gap-1 transition-all hover:opacity-90"
                style={{
                  borderColor: 'rgba(16, 185, 129, 0.45)',
                  backgroundColor: 'rgba(16, 185, 129, 0.16)',
                  color: isModern ? '#059669' : '#6EE7B7'
                }}
                title="Buka versi PDF dalam Interactive 3D Flipbook"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Flipbook 3D</span>
              </button>
            )}
            {/* Theme Toggle */}
            <button
              onClick={handleToggleTheme}
              className="p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all hover:opacity-80"
              style={{
                borderColor: tokens.border,
                backgroundColor: tokens.accentSoft
              }}
              title={`Tema aktif: ${readerTheme === 'obsidian' ? 'Obsidian Wood' : 'Warm Parchment'}`}
              aria-label={`Ganti ke tema ${readerTheme === 'obsidian' ? 'Warm Parchment' : 'Obsidian Wood'}`}
            >
              {readerTheme === 'obsidian' ? (
                <>
                  <Sun className="w-3.5 h-3.5" style={{ color: tokens.accent }} />
                  <span className="hidden md:inline text-[10px]">Warm Parchment</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5" style={{ color: tokens.accent }} />
                  <span className="hidden md:inline text-[10px]">Obsidian</span>
                </>
              )}
            </button>

            {/* Font Size Adjuster */}
            <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: tokens.border }}>
              <button
                onClick={() => setFontSizeLevel((prev) => Math.max(0, prev - 1))}
                disabled={fontSizeLevel === 0}
                className="px-2 py-1 text-[11px] font-bold disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10"
                title="Perkecil Huruf"
              >
                A-
              </button>
              <span
                className="px-1.5 py-1 text-[10px] opacity-60 border-x"
                style={{ borderColor: tokens.border }}
              >
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

            {/* Narrator Controls */}
            <div className="flex items-center gap-1.5">
              {isSpeechSupported ? (
                <>
                  <button
                    onClick={handleNarrate}
                    disabled={!narrationText}
                    className="p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      borderColor: tokens.border,
                      backgroundColor: speechStatus === 'idle' ? 'transparent' : tokens.accentSoft
                    }}
                    title={
                      speechStatus === 'playing'
                        ? `Jeda narasi (${voiceLabel})`
                        : speechStatus === 'paused'
                          ? `Lanjutkan narasi (${voiceLabel})`
                          : `Dengarkan bab ini (${voiceLabel})`
                    }
                    aria-label={
                      speechStatus === 'playing'
                        ? 'Jeda narasi'
                        : speechStatus === 'paused'
                          ? 'Lanjutkan narasi'
                          : 'Dengarkan bab ini'
                    }
                  >
                    {speechStatus === 'playing' ? (
                      <Pause className="w-3.5 h-3.5" style={{ color: tokens.accent }} />
                    ) : speechStatus === 'paused' ? (
                      <Play className="w-3.5 h-3.5" style={{ color: tokens.accent }} />
                    ) : (
                      <Headphones className="w-3.5 h-3.5" style={{ color: tokens.accent }} />
                    )}
                    <span className="hidden lg:inline text-[10px]">
                      {speechStatus === 'playing' ? 'Jeda' : speechStatus === 'paused' ? 'Lanjutkan' : 'Dengarkan Bab Ini'}
                    </span>
                  </button>

                  {(speechStatus === 'playing' || speechStatus === 'paused') && (
                    <button
                      onClick={handleStopNarration}
                      className="p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all hover:opacity-80"
                      style={{ borderColor: tokens.border }}
                      title="Hentikan narasi"
                      aria-label="Hentikan narasi"
                    >
                      <Square className="w-3.5 h-3.5" style={{ color: tokens.accent }} />
                      <span className="hidden lg:inline text-[10px]">Stop</span>
                    </button>
                  )}

                  <span
                    className="hidden lg:inline text-[10px] opacity-70 whitespace-nowrap"
                    aria-live="polite"
                  >
                    {speechStatus === 'playing' || speechStatus === 'paused'
                      ? `Membacakan bab ${currentChapter?.chapterNumber || currentPageIndex + 1} dari ${totalPages}`
                      : ''}
                  </span>
                </>
              ) : (
                <button
                  type="button"
                  disabled
                  className="p-1.5 rounded-lg border text-xs flex items-center gap-1 opacity-40 cursor-not-allowed"
                  style={{ borderColor: tokens.border }}
                  title="Narator tidak didukung peramban ini"
                  aria-label="Narator tidak didukung peramban ini"
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline text-[10px]">Dengarkan Bab Ini</span>
                </button>
              )}
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg border text-xs hover:opacity-80 transition-all hidden sm:flex"
              style={{ borderColor: tokens.border }}
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg border text-xs hover:bg-rose-500/20 hover:border-rose-500/50 hover:text-rose-400 transition-all ml-1"
              style={{ borderColor: tokens.border }}
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
          ref={mainRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 sm:p-10 md:p-14 select-text relative"
          style={{
            backgroundImage: `radial-gradient(${tokens.dot} 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        >
          {/* Ornamental Chapter Header */}
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center border-b pb-6" style={{ borderColor: tokens.border }}>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-cinzel font-semibold tracking-widest uppercase mb-2"
                style={{
                  backgroundColor: tokens.accentSoft,
                  color: tokens.accent
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
                  borderColor: tokens.accent
                }}
              >
                <div
                  className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
                  style={{
                    backgroundColor: tokens.accentSoft,
                    color: tokens.accent,
                    border: `1px solid ${tokens.accent}`
                  }}
                >
                  <Award className="w-6 h-6" />
                </div>
                <h4 className="font-cinzel font-bold text-base sm:text-lg" style={{ color: tokens.accent }}>
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
            borderColor: tokens.border,
            backgroundColor: tokens.surface
          }}
        >
          {/* Progress Indicator */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="font-cinzel font-semibold text-[11px] whitespace-nowrap">
              Halaman {currentPageIndex + 1} dari {totalPages}
            </span>
            <div
              className="w-28 sm:w-36 h-2 rounded-full overflow-hidden bg-black/20 border"
              style={{ borderColor: tokens.border }}
            >
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
              style={{ borderColor: tokens.border }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <button
              onClick={handleNextPage}
              disabled={isLastPage}
              className="px-4 py-1.5 rounded-lg text-xs font-cinzel font-bold flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md"
              style={{
                backgroundColor: tokens.accent,
                color: readerTheme === 'obsidian' ? '#12100E' : '#FBF5E6'
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
