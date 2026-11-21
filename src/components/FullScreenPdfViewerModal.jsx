import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
  BookOpen,
  Download,
  AlertCircle,
  Sparkles,
  Shield,
  RotateCw,
  Sun,
  Moon
} from 'lucide-react';
import { formatPdfEmbedUrl } from '../utils/urlHelpers';
import {
  createPdfProgress,
  getBookKey,
  getUserKey,
  shouldApplyRemoteProgress
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

function formatLastOpened(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Baru saja';
  return date.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

export default function FullScreenPdfViewerModal({
  book,
  isOpen,
  onClose,
  currentUser
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const { isModern } = useTheme();
  const userId = getUserKey(currentUser);
  const bookId = getBookKey(book);
  const [readerTheme, setReaderTheme] = useState(() =>
    isModern ? 'modern' : loadReaderTheme(userId)
  );
  const [lastOpened, setLastOpened] = useState(null);
  const tokens = getReaderThemeTokens(readerTheme);

  // Keep the reader theme in sync with the active identity & global theme.
  useEffect(() => {
    setReaderTheme(isModern ? 'modern' : loadReaderTheme(userId));
  }, [userId, isModern]);

  useEffect(() => {
    // Reset state whenever a new book is opened
    if (isOpen) {
      setLoadError(false);
      setIframeKey((prev) => prev + 1);
    }
  }, [isOpen, book?.id]);

  // Load the last-opened marker (local first, then a newer remote row).
  useEffect(() => {
    if (!isOpen || !book || !book.pdfUrl) {
      setLastOpened(null);
      return undefined;
    }

    const local = loadLocalReadingProgress(userId, bookId, 'pdf');
    setLastOpened(local);

    let cancelled = false;

    const loadRemote = async () => {
      const remote = await fetchRemoteReadingProgress(userId, bookId, 'pdf');
      if (cancelled || !remote) return;
      if (shouldApplyRemoteProgress(local, remote, false)) {
        saveLocalReadingProgress(userId, bookId, remote);
        setLastOpened(remote);
      }
    };

    void loadRemote();

    return () => {
      cancelled = true;
    };
  }, [isOpen, bookId, userId, book?.pdfUrl]);

  const handleClose = useCallback(() => {
    if (book) {
      const progress = createPdfProgress();
      saveLocalReadingProgress(userId, bookId, progress);
      void pushRemoteReadingProgress(userId, bookId, progress);
    }
    onClose();
  }, [book, bookId, userId, onClose]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else if (isOpen) {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, isOpen, handleClose]);

  // Persist synchronously when the page is hidden or navigated away.
  useEffect(() => {
    if (!isOpen || !book || !book.pdfUrl) return undefined;

    const saveLastOpened = () => {
      saveLocalReadingProgress(userId, bookId, createPdfProgress());
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveLastOpened();
      }
    };

    window.addEventListener('pagehide', saveLastOpened);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', saveLastOpened);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOpen, book, bookId, userId]);

  if (!isOpen || !book || !book.pdfUrl) return null;

  const rawUrl = book.pdfUrl.trim();
  const embedUrl = formatPdfEmbedUrl(rawUrl);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const reloadIframe = () => {
    setLoadError(false);
    setIframeKey((prev) => prev + 1);
  };

  const handleToggleTheme = () => {
    const nextTheme =
      readerTheme === 'obsidian' ? (isModern ? 'modern' : 'parchment') : 'obsidian';
    setReaderTheme(nextTheme);
    if (nextTheme === 'obsidian' || nextTheme === 'parchment') {
      saveReaderTheme(userId, nextTheme);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`PDF Viewer - ${book.title}`}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between overflow-hidden animate-fadeIn"
      style={{
        backgroundColor: tokens.container
      }}
    >
      {/* HEADER TOOLBAR */}
      <header
        className="w-full px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 transition-colors"
        style={{
          backgroundColor: tokens.surface,
          borderColor: tokens.border
        }}
      >
        {/* Left: Book Information */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-cinzel font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                Mode Layar Penuh (PDF)
              </span>
              {book.kodeBuku && (
                <span
                  className="text-[10px] border px-1.5 py-0.2 rounded font-mono"
                  style={{ color: tokens.accent, borderColor: tokens.border }}
                >
                  {book.kodeBuku}
                </span>
              )}
              {book.category && (
                <span className="hidden sm:inline text-[11px]" style={{ color: tokens.muted }}>
                  • {book.category}
                </span>
              )}
            </div>
            <h2 className="font-cinzel font-bold text-base sm:text-lg truncate" style={{ color: tokens.text }}>
              {book.title}
            </h2>
            <p className="text-xs truncate" style={{ color: tokens.muted }}>
              Karya: <strong style={{ color: tokens.text }}>{book.author || 'Mpu Anonim'}</strong>
              {book.publisher ? ` • Penerbit: ${book.publisher}` : ''}
              {book.publicationYear ? ` (${book.publicationYear})` : ''}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={handleToggleTheme}
            className="p-2 rounded-xl border transition-all hover:opacity-80 flex items-center gap-1.5"
            style={{
              backgroundColor: tokens.container,
              borderColor: tokens.border,
              color: tokens.text
            }}
            title={`Tema aktif: ${readerTheme === 'obsidian' ? 'Obsidian Wood' : 'Warm Parchment'}`}
            aria-label={`Ganti ke tema ${readerTheme === 'obsidian' ? 'Warm Parchment' : 'Obsidian Wood'}`}
          >
            {readerTheme === 'obsidian' ? (
              <Sun className="w-4 h-4" style={{ color: tokens.accent }} />
            ) : (
              <Moon className="w-4 h-4" style={{ color: tokens.accent }} />
            )}
            <span className="hidden sm:inline text-[10px] font-cinzel">
              {readerTheme === 'obsidian' ? 'Parchment' : 'Obsidian'}
            </span>
          </button>

          {/* Reload button */}
          <button
            type="button"
            onClick={reloadIframe}
            className="p-2 rounded-xl border transition-all hover:opacity-80"
            style={{
              backgroundColor: tokens.container,
              borderColor: tokens.border,
              color: tokens.muted
            }}
            title="Muat Ulang Tampilan PDF"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Open in external tab button */}
          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl text-xs font-cinzel font-semibold border transition-all hover:opacity-80 flex items-center gap-1.5"
            style={{
              backgroundColor: tokens.container,
              borderColor: tokens.border,
              color: tokens.text
            }}
            title="Buka File Asli di Tab Baru"
          >
            <ExternalLink className="w-3.5 h-3.5" style={{ color: tokens.accent }} />
            <span className="hidden sm:inline">Buka di Tab Baru</span>
          </a>

          {/* Download button */}
          <a
            href={rawUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-cinzel font-semibold border transition-all hover:opacity-80"
            style={{
              backgroundColor: tokens.container,
              borderColor: tokens.border,
              color: tokens.text
            }}
            title="Unduh Berkas PDF"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Unduh</span>
          </a>

          {/* Fullscreen toggle button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl border transition-all hover:opacity-80"
            style={{
              backgroundColor: tokens.container,
              borderColor: tokens.border,
              color: tokens.muted
            }}
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Perbesar Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500/40 text-rose-300 hover:text-white transition-all ml-1"
            title="Tutup Pembaca PDF (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* VIEWER BODY */}
      <div
        className="flex-1 w-full h-full relative overflow-hidden flex flex-col items-center justify-center"
        style={{ backgroundColor: tokens.iframeBackground }}
      >
        {/* Notice Bar for users */}
        <div
          className="w-full px-4 py-1.5 border-b text-[11px] flex items-center justify-between gap-3 shrink-0"
          style={{
            backgroundColor: tokens.container,
            borderColor: tokens.border,
            color: tokens.muted
          }}
        >
          <span className="flex items-center gap-1.5 min-w-0">
            <Sparkles className="w-3 h-3 shrink-0" style={{ color: tokens.accent }} />
            <span className="truncate">
              Tema berfungsi sebagai filter anti-silau. Narator dan nomor halaman PDF belum tersedia untuk tautan eksternal.
            </span>
          </span>
          <span className="flex items-center gap-3 shrink-0 text-[10px]">
            {lastOpened && (
              <span className="hidden sm:inline whitespace-nowrap">
                Terakhir dibuka: {formatLastOpened(lastOpened.updatedAt)}
              </span>
            )}
            <span className="hidden md:inline whitespace-nowrap">
              Tekan{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-black/20 border border-current/20 font-mono text-[9px]">
                Esc
              </kbd>{' '}
              untuk kembali
            </span>
          </span>
        </div>

        {/* Embedded PDF iframe */}
        <div className="flex-1 w-full h-full relative" style={{ backgroundColor: tokens.iframeBackground }}>
          <iframe
            key={iframeKey}
            src={embedUrl}
            title={`PDF Viewer - ${book.title}`}
            className="w-full h-full border-0"
            style={{
              backgroundColor: tokens.iframeBackground,
              filter: tokens.pdfFilter
            }}
            allow="autoplay; fullscreen"
            allowFullScreen
            onError={() => setLoadError(true)}
          />

          {/* Overlay fallback if iframe has issues loading */}
          {loadError && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-amber-400" />
              <h3 className="font-cinzel text-lg font-bold text-[#F4E8C1]">
                Pratinjau PDF Dibatasi oleh Penyedia Tautan
              </h3>
              <p className="text-xs text-[#A89F91] max-w-md">
                Tautan PDF eksternal tidak mengizinkan tampilan langsung dalam bingkai peramban. Anda dapat membuka atau mengunduh buku ini langsung melalui tombol di bawah:
              </p>
              <div className="flex items-center gap-3">
                <a
                  href={rawUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl font-cinzel font-bold text-xs bg-[#D4AF37] text-[#12100E] hover:bg-amber-400 transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka PDF di Tab Baru</span>
                </a>
                <button
                  type="button"
                  onClick={reloadIframe}
                  className="px-4 py-2.5 rounded-xl font-cinzel text-xs border border-white/20 text-[#F4E8C1] hover:bg-white/10"
                >
                  Coba Muat Ulang
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
