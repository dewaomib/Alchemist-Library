import React, { useState, useEffect } from 'react';
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
  RotateCw
} from 'lucide-react';
import { formatPdfEmbedUrl } from '../utils/urlHelpers';

export default function FullScreenPdfViewerModal({
  book,
  isOpen,
  onClose
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    // Reset state whenever a new book is opened
    if (isOpen) {
      setLoadError(false);
      setIframeKey((prev) => prev + 1);
    }
  }, [isOpen, book?.id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, isOpen, onClose]);

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`PDF Viewer - ${book.title}`}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between overflow-hidden animate-fadeIn"
      style={{
        backgroundColor: 'rgba(10, 8, 7, 0.96)'
      }}
    >
      {/* HEADER TOOLBAR */}
      <header
        className="w-full px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 transition-colors"
        style={{
          backgroundColor: '#171311',
          borderColor: 'rgba(212, 175, 55, 0.35)'
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
                <span className="text-[10px] text-[#D4AF37] border border-[#D4AF37]/30 px-1.5 py-0.2 rounded font-mono">
                  {book.kodeBuku}
                </span>
              )}
              {book.category && (
                <span className="hidden sm:inline text-[11px] text-[#A89F91]">
                  • {book.category}
                </span>
              )}
            </div>
            <h2 className="font-cinzel font-bold text-base sm:text-lg text-[#F4E8C1] truncate">
              {book.title}
            </h2>
            <p className="text-xs text-[#A89F91] truncate">
              Karya: <strong className="text-[#F4E8C1]">{book.author || 'Mpu Anonim'}</strong>
              {book.publisher ? ` • Penerbit: ${book.publisher}` : ''}
              {book.publicationYear ? ` (${book.publicationYear})` : ''}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Reload button */}
          <button
            type="button"
            onClick={reloadIframe}
            className="p-2 rounded-xl bg-[#1E1916] border border-white/10 hover:border-[#D4AF37] text-[#A89F91] hover:text-[#F4E8C1] transition-all"
            title="Muat Ulang Tampilan PDF"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Open in external tab button */}
          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl text-xs font-cinzel font-semibold bg-[#1E1916] border border-[#D4AF37]/40 hover:bg-[#D4AF37]/15 text-[#F4E8C1] transition-all flex items-center gap-1.5"
            title="Buka File Asli di Tab Baru"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="hidden sm:inline">Buka di Tab Baru</span>
          </a>

          {/* Download button */}
          <a
            href={rawUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-cinzel font-semibold bg-[#1E1916] border border-white/10 hover:border-emerald-500/50 text-[#F4E8C1] transition-all"
            title="Unduh Berkas PDF"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Unduh</span>
          </a>

          {/* Fullscreen toggle button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-[#1E1916] border border-white/10 hover:border-[#D4AF37] text-[#A89F91] hover:text-[#F4E8C1] transition-all"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Perbesar Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500/40 text-rose-300 hover:text-white transition-all ml-1"
            title="Tutup Pembaca PDF (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* VIEWER BODY */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-neutral-950 flex flex-col items-center justify-center">
        {/* Notice Bar for users */}
        <div className="w-full bg-[#12100E] px-4 py-1.5 border-b border-white/5 text-[11px] text-[#A89F91] flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1.5 truncate">
            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
            <span>
              Menampilkan berkas PDF e-book secara langsung. Gunakan kontrol zoom dan halaman bawaan peramban di bawah.
            </span>
          </span>
          <span className="hidden md:inline text-[10px] text-[#A89F91]">
            Tekan <kbd className="px-1.5 py-0.5 rounded bg-black/60 border border-white/10 font-mono text-[9px]">Esc</kbd> untuk kembali
          </span>
        </div>

        {/* Embedded PDF iframe */}
        <div className="flex-1 w-full h-full relative">
          <iframe
            key={iframeKey}
            src={embedUrl}
            title={`PDF Viewer - ${book.title}`}
            className="w-full h-full border-0 bg-neutral-900"
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
