import React, {
  createContext,
  forwardRef,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import HTMLFlipBook from 'react-pageflip';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  AlertCircle,
  Bookmark,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FastForward,
  Layers,
  Loader2,
  Maximize2,
  Minimize2,
  Moon,
  RotateCcw,
  RotateCw,
  Sparkles,
  Sun,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { buildPdfProxyUrl, formatPdfEmbedUrl } from '../utils/urlHelpers';
import {
  buildJumpRiffleSequence,
  clampPageNumber,
  computeFlipbookPageDimensions,
  FLIPBOOK_LAZY_RADIUS,
  FLIPBOOK_RIFFLE_STEP_MS,
  isPageInLazyWindow
} from '../utils/flipbookUtils';
import {
  createPdfProgress,
  getBookKey,
  getUserKey,
  shouldApplyRemoteProgress
} from '../utils/readingProgressCore';
import {
  fetchRemoteReadingProgress,
  loadLocalReadingProgress,
  pushRemoteReadingProgress,
  saveLocalReadingProgress
} from '../utils/readingProgress';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const FlipbookLazyContext = createContext({
  pdfDoc: null,
  currentPage: 1,
  numPages: 1,
  zoom: 1,
  pageWidth: 420,
  pageHeight: 594,
  isMobile: false,
  jumpTargetPage: null,
  paperMode: 'natural',
  isModern: false
});

function getPaperFilter(paperMode) {
  if (paperMode === 'warm') {
    return 'sepia(0.18) brightness(0.98) contrast(0.98)';
  }
  if (paperMode === 'night') {
    return 'invert(0.91) hue-rotate(180deg) brightness(0.88) contrast(0.95)';
  }
  return 'none';
}

function getPaperBg(paperMode, isModern) {
  if (paperMode === 'night') return '#151311';
  if (paperMode === 'warm') return '#F6EFE0';
  return isModern ? '#FFFFFF' : '#FAF6EE';
}

/**
 * Individual PDF page sheet rendered lazily onto <canvas> only when inside
 * [currentPage - 3 .. currentPage + 3] (plus jump destination pre-render).
 * Must use forwardRef so react-pageflip can bind DOM nodes cleanly.
 */
const FlipbookPage = memo(
  forwardRef(function FlipbookPage({ pageNumber }, ref) {
    const {
      pdfDoc,
      currentPage,
      numPages,
      zoom,
      pageWidth,
      pageHeight,
      isMobile,
      jumpTargetPage,
      paperMode,
      isModern
    } = useContext(FlipbookLazyContext);

    const canvasRef = useRef(null);
    const renderTaskRef = useRef(null);
    const [status, setStatus] = useState('idle'); // 'idle' | 'rendering' | 'ready' | 'error'

    const isSpread = !isMobile;
    const isLeftPage = isSpread && pageNumber % 2 === 1;
    const isRightPage = isSpread && pageNumber % 2 === 0;
    const inWindow = isPageInLazyWindow(
      pageNumber,
      currentPage,
      FLIPBOOK_LAZY_RADIUS,
      isSpread,
      jumpTargetPage
    );

    useEffect(() => {
      let cancelled = false;
      const canvas = canvasRef.current;

      if (!pdfDoc || !inWindow) {
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // ignore cancellation race
          }
          renderTaskRef.current = null;
        }
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
        }
        setStatus('idle');
        return undefined;
      }

      const renderPdfPage = async () => {
        setStatus('rendering');
        try {
          const page = await pdfDoc.getPage(pageNumber);
          if (cancelled || !canvasRef.current) return;

          const baseViewport = page.getViewport({ scale: 1 });
          const fitScale = Math.min(
            pageWidth / baseViewport.width,
            pageHeight / baseViewport.height
          );
          const dpr = Math.min(
            2.5,
            (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1) *
              Math.max(1, zoom)
          );
          const viewport = page.getViewport({ scale: fitScale * dpr });

          const targetCanvas = canvasRef.current;
          const ctx = targetCanvas.getContext('2d', { alpha: false });
          if (!ctx) return;

          targetCanvas.width = Math.max(1, Math.floor(viewport.width));
          targetCanvas.height = Math.max(1, Math.floor(viewport.height));

          // Clean white sheet background before drawing vector PDF content
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);

          if (renderTaskRef.current) {
            try {
              renderTaskRef.current.cancel();
            } catch {
              // ignore
            }
          }

          const task = page.render({
            canvasContext: ctx,
            viewport
          });
          renderTaskRef.current = task;

          await task.promise;
          if (!cancelled) {
            renderTaskRef.current = null;
            setStatus('ready');
          }
        } catch (err) {
          if (err?.name === 'RenderingCancelledException' || cancelled) {
            return;
          }
          setStatus('error');
        }
      };

      void renderPdfPage();

      return () => {
        cancelled = true;
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // ignore
          }
          renderTaskRef.current = null;
        }
      };
    }, [pdfDoc, pageNumber, inWindow, pageWidth, pageHeight, zoom]);

    const paperBg = getPaperBg(paperMode, isModern);
    const paperFilter = getPaperFilter(paperMode);

    return (
      <div
        ref={ref}
        className={`flipbook-page-sheet relative select-none overflow-hidden ${
          isLeftPage ? 'flipbook-page-left' : isRightPage ? 'flipbook-page-right' : 'flipbook-page-single'
        }`}
        style={{
          width: `${pageWidth}px`,
          height: `${pageHeight}px`,
          backgroundColor: paperBg
        }}
      >
        {/* Canvas PDF Layer */}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain block transition-opacity duration-200"
          style={{
            filter: paperFilter,
            opacity: status === 'ready' ? 1 : 0
          }}
        />

        {/* Lazy Placeholder / Spinner */}
        {status !== 'ready' && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none"
            style={{
              backgroundColor: paperBg,
              color: paperMode === 'night' ? '#A89F91' : '#64748B'
            }}
          >
            {inWindow && status === 'rendering' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin opacity-70" />
                <span className="text-[11px] font-medium opacity-75">
                  Memuat halaman {pageNumber}...
                </span>
              </>
            ) : status === 'error' ? (
              <span className="text-[11px] opacity-75">Halaman {pageNumber}</span>
            ) : (
              <span className="text-xs font-mono opacity-40">
                {pageNumber} / {numPages}
              </span>
            )}
          </div>
        )}

        {/* Realistic center spine fold shadow (desktop 2-page spread) */}
        {isLeftPage && <div className="flipbook-gutter-left pointer-events-none" />}
        {isRightPage && <div className="flipbook-gutter-right pointer-events-none" />}

        {/* Subtle outer page edge highlight */}
        <div className="flipbook-page-edge pointer-events-none" />

        {/* Corner page folio badge */}
        <div
          className={`pointer-events-none absolute bottom-2 ${
            isLeftPage ? 'left-3' : 'right-3'
          } px-1.5 py-0.5 rounded text-[9px] font-mono opacity-55`}
          style={{
            backgroundColor: paperMode === 'night' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.75)',
            color: paperMode === 'night' ? '#E5E7EB' : '#334155'
          }}
        >
          {pageNumber}
        </div>
      </div>
    );
  })
);

export default function FlipbookReader({ book, isOpen, onClose, currentUser }) {
  const { isModern } = useTheme();
  const userId = getUserKey(currentUser);
  const bookId = getBookKey(book);
  const isLoggedIn = Boolean(userId && userId !== 'guest');

  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const flipBookRef = useRef(null);
  const riffleTimersRef = useRef([]);
  const saveDebounceRef = useRef(null);
  const isRifflingRef = useRef(false);
  const hasUserNavigatedRef = useRef(false);
  const currentPageRef = useRef(1);
  const numPagesRef = useRef(1);

  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [initialStartPage, setInitialStartPage] = useState(1);
  const [pageAspectRatio, setPageAspectRatio] = useState(0.707);

  const [loadingState, setLoadingState] = useState('idle'); // 'idle' | 'loading' | 'ready' | 'error'
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadNonce, setReloadNonce] = useState(0);
  const [useEmbedFallback, setUseEmbedFallback] = useState(false);

  const [stageSize, setStageSize] = useState({ width: 1080, height: 680 });
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [paperMode, setPaperMode] = useState(() => (isModern ? 'natural' : 'warm'));

  const [jumpInput, setJumpInput] = useState('');
  const [isRiffling, setIsRiffling] = useState(false);
  const [jumpTargetPage, setJumpTargetPage] = useState(null);
  const [jumpNotice, setJumpNotice] = useState('');

  const [resumeBanner, setResumeBanner] = useState('');
  const [bookmarkSyncState, setBookmarkSyncState] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'local'

  const isMobile = stageSize.width < 768;
  const isSpread = !isMobile && numPages > 1;

  // Keep refs synchronized for cleanup & async handlers
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    numPagesRef.current = numPages;
  }, [numPages]);

  // Sync default paper tone softly when global Classic/Modern theme toggles
  useEffect(() => {
    setPaperMode((prev) => {
      if (prev === 'night') return 'night';
      return isModern ? 'natural' : 'warm';
    });
  }, [isModern]);

  const clearRiffleTimers = useCallback(() => {
    riffleTimersRef.current.forEach((id) => clearTimeout(id));
    riffleTimersRef.current = [];
    isRifflingRef.current = false;
    setIsRiffling(false);
    setJumpTargetPage(null);
  }, []);

  // Persist bookmark to localStorage + PostgreSQL Prisma (`PUT /api/bookmarks`)
  const persistBookmark = useCallback(
    (pageNum, totalPagesCount, { immediate = false } = {}) => {
      if (!book || !totalPagesCount || totalPagesCount < 1) return;
      const safePage = clampPageNumber(pageNum, totalPagesCount);
      const progress = createPdfProgress({
        pageNumber: safePage,
        totalPages: totalPagesCount
      });

      saveLocalReadingProgress(userId, bookId, progress);

      if (!isLoggedIn) {
        setBookmarkSyncState('local');
        return;
      }

      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
        saveDebounceRef.current = null;
      }

      const pushNow = async () => {
        setBookmarkSyncState('saving');
        const ok = await pushRemoteReadingProgress(userId, bookId, progress);
        setBookmarkSyncState(ok ? 'saved' : 'local');
      };

      if (immediate) {
        void pushNow();
      } else {
        setBookmarkSyncState('saving');
        saveDebounceRef.current = setTimeout(() => {
          saveDebounceRef.current = null;
          void pushNow();
        }, 350);
      }
    },
    [book, bookId, userId, isLoggedIn]
  );

  // Track stage size responsively via ResizeObserver
  useEffect(() => {
    if (!isOpen) return undefined;
    const node = stageRef.current;

    const updateSize = () => {
      if (stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setStageSize({ width: rect.width, height: rect.height });
          return;
        }
      }
      if (typeof window !== 'undefined') {
        setStageSize({
          width: window.innerWidth,
          height: Math.max(400, window.innerHeight - 160)
        });
      }
    };

    updateSize();

    let observer = null;
    if (node && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateSize);
      observer.observe(node);
    }
    window.addEventListener('resize', updateSize);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [isOpen, isFullscreen, useEmbedFallback]);

  // Listen to native fullscreen changes
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Load PDF through /api/pdf-proxy + restore saved bookmark (local + Prisma)
  useEffect(() => {
    if (!isOpen || !book || !book.pdfUrl) {
      return undefined;
    }

    let cancelled = false;
    let activeDoc = null;
    let loadingTask = null;

    clearRiffleTimers();
    hasUserNavigatedRef.current = false;
    setUseEmbedFallback(false);
    setErrorMessage('');
    setLoadingProgress(0);
    setLoadingState('loading');
    setZoom(1);
    setJumpInput('');
    setJumpNotice('');
    setResumeBanner('');
    setPdfDoc(null);
    setNumPages(0);

    const rawUrl = book.pdfUrl.trim();
    const proxyUrl = buildPdfProxyUrl(rawUrl, book.id);

    const localBookmark = loadLocalReadingProgress(userId, bookId, 'pdf');

    const loadAll = async () => {
      const remotePromise = fetchRemoteReadingProgress(userId, bookId, 'pdf').catch(() => null);

      try {
        loadingTask = pdfjsLib.getDocument({
          url: proxyUrl,
          withCredentials: true,
          disableAutoFetch: false,
          rangeChunkSize: 65536
        });

        loadingTask.onProgress = ({ loaded, total }) => {
          if (cancelled) return;
          if (total && total > 0) {
            setLoadingProgress(Math.min(99, Math.round((loaded / total) * 100)));
          }
        };

        const doc = await loadingTask.promise;
        if (cancelled) {
          void doc.destroy();
          return;
        }
        activeDoc = doc;

        const total = Math.max(1, doc.numPages || 1);
        let ratio = 0.707;
        try {
          const firstPage = await doc.getPage(1);
          const vp = firstPage.getViewport({ scale: 1 });
          if (vp.width > 0 && vp.height > 0) {
            ratio = vp.width / vp.height;
          }
        } catch {
          // keep default A4 aspect ratio
        }

        if (cancelled) return;

        // Wait briefly for remote bookmark (with 600ms cap so UI feels instant)
        const remoteBookmark = await Promise.race([
          remotePromise,
          new Promise((resolve) => setTimeout(() => resolve(null), 600))
        ]);

        if (cancelled) return;

        let chosenBookmark = localBookmark;
        if (remoteBookmark && shouldApplyRemoteProgress(localBookmark, remoteBookmark, false)) {
          chosenBookmark = remoteBookmark;
          saveLocalReadingProgress(userId, bookId, remoteBookmark);
        }

        const savedPage = clampPageNumber(chosenBookmark?.pageNumber || 1, total);

        setPageAspectRatio(ratio);
        setNumPages(total);
        setInitialStartPage(savedPage);
        setCurrentPage(savedPage);
        currentPageRef.current = savedPage;
        numPagesRef.current = total;
        setPdfDoc(doc);
        setLoadingProgress(100);
        setLoadingState('ready');
        setBookmarkSyncState(isLoggedIn ? 'saved' : 'local');

        if (savedPage > 1) {
          setResumeBanner(`Melanjutkan dari Halaman ${savedPage} / ${total}`);
        }

        // If remote bookmark arrives after the 600ms race and user hasn't navigated yet, sync silently
        void remotePromise.then((lateRemote) => {
          if (cancelled || !lateRemote || hasUserNavigatedRef.current) return;
          if (shouldApplyRemoteProgress(chosenBookmark, lateRemote, hasUserNavigatedRef.current)) {
            const latePage = clampPageNumber(lateRemote.pageNumber || 1, total);
            saveLocalReadingProgress(userId, bookId, lateRemote);
            if (latePage !== currentPageRef.current) {
              setCurrentPage(latePage);
              currentPageRef.current = latePage;
              flipBookRef.current?.pageFlip()?.turnToPage(latePage - 1);
              if (latePage > 1) {
                setResumeBanner(`Melanjutkan dari Halaman ${latePage} / ${total}`);
              }
            }
          }
        });
      } catch (err) {
        if (cancelled) return;
        let msg = err?.message || 'Gagal memuat file PDF melalui jalur streaming.';
        if (msg.includes('422') || msg.includes('403')) {
          msg =
            'File Google Drive bersifat privat atau membutuhkan izin akses. Pastikan pengaturan berbagi Google Drive diubah ke "Siapa saja yang memiliki link", atau gunakan Mode Pratinjau Standar.';
        } else if (msg.includes('Invalid PDF')) {
          msg =
            'Tautan tidak mengembalikan dokumen PDF langsung. Anda dapat membuka Mode Pratinjau Standar atau membuka tautan di tab baru.';
        }
        setErrorMessage(msg);
        setLoadingState('error');
      }
    };

    void loadAll();

    return () => {
      cancelled = true;
      clearRiffleTimers();
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
        saveDebounceRef.current = null;
      }
      if (loadingTask) {
        try {
          void loadingTask.destroy();
        } catch {
          // ignore
        }
      }
      if (activeDoc) {
        try {
          void activeDoc.destroy();
        } catch {
          // ignore
        }
      }
    };
  }, [isOpen, book?.id, book?.pdfUrl, userId, bookId, isLoggedIn, reloadNonce, clearRiffleTimers]);

  // Auto-hide resume banner after 4.5s
  useEffect(() => {
    if (!resumeBanner) return undefined;
    const id = setTimeout(() => setResumeBanner(''), 4500);
    return () => clearTimeout(id);
  }, [resumeBanner]);

  // Save on pagehide / tab switch
  useEffect(() => {
    if (!isOpen || !book || !book.pdfUrl) return undefined;

    const persistSync = () => {
      if (numPagesRef.current > 0) {
        const progress = createPdfProgress({
          pageNumber: currentPageRef.current,
          totalPages: numPagesRef.current
        });
        saveLocalReadingProgress(userId, bookId, progress);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        persistSync();
        if (numPagesRef.current > 0 && isLoggedIn) {
          void pushRemoteReadingProgress(
            userId,
            bookId,
            createPdfProgress({
              pageNumber: currentPageRef.current,
              totalPages: numPagesRef.current
            })
          );
        }
      }
    };

    window.addEventListener('pagehide', persistSync);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', persistSync);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isOpen, book, bookId, userId, isLoggedIn]);

  const handleClose = useCallback(() => {
    clearRiffleTimers();
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    if (book && numPagesRef.current > 0) {
      persistBookmark(currentPageRef.current, numPagesRef.current, { immediate: true });
    }
    onClose();
  }, [book, clearRiffleTimers, onClose, persistBookmark]);

  const handleFlipEvent = useCallback(
    (e) => {
      const flippedIndex = Number(e?.data);
      if (!Number.isFinite(flippedIndex) || numPagesRef.current <= 0) return;
      const nextPage = clampPageNumber(flippedIndex + 1, numPagesRef.current);
      setCurrentPage(nextPage);
      currentPageRef.current = nextPage;

      if (!isRifflingRef.current) {
        hasUserNavigatedRef.current = true;
        persistBookmark(nextPage, numPagesRef.current);
      }
    },
    [persistBookmark]
  );

  const handlePrevPage = useCallback(() => {
    if (isRifflingRef.current || numPages <= 1) return;
    hasUserNavigatedRef.current = true;
    const pf = flipBookRef.current?.pageFlip?.();
    if (pf) {
      pf.flipPrev('top');
    }
  }, [numPages]);

  const handleNextPage = useCallback(() => {
    if (isRifflingRef.current || numPages <= 1) return;
    hasUserNavigatedRef.current = true;
    const pf = flipBookRef.current?.pageFlip?.();
    if (pf) {
      pf.flipNext('top');
    }
  }, [numPages]);

  // Rapid Page-Flip Jump Animation ("Kibasan Halaman Cepat" ~80ms per sheet across 4-5 intermediate pages)
  const handleJumpToPage = useCallback(
    (rawTarget) => {
      if (numPages <= 0) return;
      const parsed = parseInt(String(rawTarget || '').trim(), 10);
      if (!Number.isFinite(parsed)) return;

      const target = clampPageNumber(parsed, numPages);
      setJumpInput('');
      hasUserNavigatedRef.current = true;

      if (numPages === 1) {
        setCurrentPage(1);
        persistBookmark(1, 1, { immediate: true });
        return;
      }

      const sequence = buildJumpRiffleSequence(currentPageRef.current, target, numPages, isSpread);
      if (sequence.length === 0) {
        setJumpNotice(`Sudah berada di halaman ${target}`);
        setTimeout(() => setJumpNotice(''), 2000);
        return;
      }

      clearRiffleTimers();
      isRifflingRef.current = true;
      setIsRiffling(true);
      setJumpTargetPage(target);
      setJumpNotice(
        sequence.length > 1
          ? `Membalik cepat menuju Halaman ${target}...`
          : `Menuju Halaman ${target}...`
      );

      sequence.forEach((stepPage, idx) => {
        const isFinal = idx === sequence.length - 1;
        const delayMs = idx * FLIPBOOK_RIFFLE_STEP_MS;
        const corner = idx % 2 === 0 ? 'bottom' : 'top';

        const timerId = setTimeout(() => {
          const pf = flipBookRef.current?.pageFlip?.();
          setCurrentPage(stepPage);
          currentPageRef.current = stepPage;

          if (pf) {
            try {
              pf.flip(stepPage - 1, corner);
            } catch {
              try {
                pf.turnToPage(stepPage - 1);
              } catch {
                // ignore
              }
            }
          }

          if (isFinal) {
            const settleId = setTimeout(() => {
              isRifflingRef.current = false;
              setIsRiffling(false);
              setJumpTargetPage(null);
              setCurrentPage(target);
              currentPageRef.current = target;
              setJumpNotice('');
              persistBookmark(target, numPages, { immediate: true });
            }, 340);
            riffleTimersRef.current.push(settleId);
          }
        }, delayMs);

        riffleTimersRef.current.push(timerId);
      });
    },
    [numPages, isSpread, clearRiffleTimers, persistBookmark]
  );

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    handleJumpToPage(jumpInput);
  };

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(2, Number((prev + 0.15).toFixed(2))));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(0.7, Number((prev - 0.15).toFixed(2))));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) {
      setIsFullscreen((prev) => !prev);
      return;
    }
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen?.().catch(() => setIsFullscreen(false));
    }
  }, []);

  const cyclePaperMode = () => {
    setPaperMode((prev) => {
      if (prev === 'natural') return 'warm';
      if (prev === 'warm') return 'night';
      return 'natural';
    });
  };

  // Keyboard navigation (ArrowLeft, ArrowRight, Escape, +/-)
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select';

      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        } else {
          handleClose();
        }
        return;
      }

      if (isTyping || useEmbedFallback) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        handleNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrevPage();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleZoomReset();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, useEmbedFallback, handleClose, handleNextPage, handlePrevPage, handleZoomIn, handleZoomOut, handleZoomReset]);

  const { pageWidth, pageHeight } = useMemo(
    () =>
      computeFlipbookPageDimensions(
        stageSize.width,
        stageSize.height,
        pageAspectRatio,
        isMobile
      ),
    [stageSize.width, stageSize.height, pageAspectRatio, isMobile]
  );

  // Structurally stable page list so react-pageflip NEVER resets during state changes
  const pageElements = useMemo(() => {
    if (numPages <= 0) return [];
    return Array.from({ length: numPages }, (_, idx) => (
      <FlipbookPage key={idx + 1} pageNumber={idx + 1} />
    ));
  }, [numPages]);

  const lazyContextValue = useMemo(
    () => ({
      pdfDoc,
      currentPage,
      numPages,
      zoom,
      pageWidth,
      pageHeight,
      isMobile,
      jumpTargetPage,
      paperMode,
      isModern
    }),
    [
      pdfDoc,
      currentPage,
      numPages,
      zoom,
      pageWidth,
      pageHeight,
      isMobile,
      jumpTargetPage,
      paperMode,
      isModern
    ]
  );

  if (!isOpen || !book || !book.pdfUrl) return null;

  const rawUrl = book.pdfUrl.trim();
  const embedUrl = formatPdfEmbedUrl(rawUrl);

  // Theme palette synchronized with Global Tema Klasik vs Tema Modern
  const ui = isModern
    ? {
        backdrop: 'rgba(15, 23, 42, 0.72)',
        barBg: '#FFFFFF',
        barBorder: '#E2E8F0',
        deskClass: 'flipbook-desk-modern',
        text: '#0F172A',
        muted: '#475569',
        accent: '#2563EB',
        accentBg: '#EFF6FF',
        accentBorder: '#BFDBFE',
        controlBg: '#F8FAFC',
        controlBorder: '#CBD5E1',
        primaryBtnBg: '#2563EB',
        primaryBtnText: '#FFFFFF',
        progressTrack: '#E2E8F0',
        progressFill: '#2563EB',
        headingFont: "'Plus Jakarta Sans', system-ui, sans-serif"
      }
    : {
        backdrop: 'rgba(8, 6, 4, 0.92)',
        barBg: '#18130F',
        barBorder: 'rgba(212, 175, 55, 0.28)',
        deskClass: 'flipbook-desk-classic',
        text: '#F4E8C1',
        muted: '#B6A896',
        accent: '#D4AF37',
        accentBg: 'rgba(212, 175, 55, 0.14)',
        accentBorder: 'rgba(212, 175, 55, 0.35)',
        controlBg: '#120E0B',
        controlBorder: 'rgba(212, 175, 55, 0.3)',
        primaryBtnBg: '#D4AF37',
        primaryBtnText: '#12100E',
        progressTrack: 'rgba(255, 255, 255, 0.1)',
        progressFill: '#D4AF37',
        headingFont: "'Cinzel', serif"
      };

  const progressPct = numPages > 0 ? Math.min(100, Math.round((currentPage / numPages) * 100)) : 0;
  const spreadLeft = isSpread ? (currentPage % 2 === 0 ? Math.max(1, currentPage - 1) : currentPage) : currentPage;
  const spreadRight = isSpread ? Math.min(numPages, spreadLeft + 1) : currentPage;
  const bookDisplayWidth = isSpread ? pageWidth * 2 : pageWidth;
  const scaledWidth = Math.round(bookDisplayWidth * zoom);
  const scaledHeight = Math.round(pageHeight * zoom);

  const paperModeLabel =
    paperMode === 'natural' ? 'Kertas Asli' : paperMode === 'warm' ? 'Kertas Hangat' : 'Mode Malam';

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Interactive 3D Flipbook Reader - ${book.title}`}
      className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden animate-fadeIn"
      style={{ backgroundColor: ui.backdrop }}
    >
      {/* ============================================================
          TOP HEADER BAR
      ============================================================ */}
      <header
        className="w-full px-3 sm:px-5 py-2.5 border-b flex flex-wrap items-center justify-between gap-2.5 shrink-0 z-20 transition-colors"
        style={{
          backgroundColor: ui.barBg,
          borderColor: ui.barBorder,
          color: ui.text
        }}
      >
        {/* Left: Book identity */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0"
            style={{
              backgroundColor: ui.accentBg,
              borderColor: ui.accentBorder,
              color: ui.accent
            }}
          >
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider"
                style={{
                  backgroundColor: ui.accentBg,
                  borderColor: ui.accentBorder,
                  color: ui.accent,
                  fontFamily: ui.headingFont
                }}
              >
                3D Flipbook PDF
              </span>
              {book.kodeBuku && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-mono border hidden sm:inline"
                  style={{
                    borderColor: ui.barBorder,
                    color: ui.muted
                  }}
                >
                  {book.kodeBuku}
                </span>
              )}
              {numPages > 0 && (
                <span
                  className="hidden md:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border"
                  style={{
                    borderColor: ui.barBorder,
                    color: bookmarkSyncState === 'saved' ? '#10B981' : ui.muted
                  }}
                  title="Auto-bookmark halaman terakhir tersinkronisasi ke database Prisma"
                >
                  {bookmarkSyncState === 'saving' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : bookmarkSyncState === 'saved' ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Bookmark className="w-3 h-3" />
                  )}
                  <span>
                    {bookmarkSyncState === 'saving'
                      ? 'Menyimpan...'
                      : bookmarkSyncState === 'saved'
                        ? `Bookmark Hal. ${currentPage}`
                        : `Lokal Hal. ${currentPage}`}
                  </span>
                </span>
              )}
            </div>
            <h2
              className="font-bold text-sm sm:text-base truncate mt-0.5"
              style={{ color: ui.text, fontFamily: ui.headingFont }}
            >
              {book.title}
            </h2>
          </div>
        </div>

        {/* Right: Reader Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Zoom Controls */}
          {!useEmbedFallback && loadingState === 'ready' && (
            <div
              className="flex items-center rounded-xl border overflow-hidden"
              style={{
                backgroundColor: ui.controlBg,
                borderColor: ui.controlBorder
              }}
            >
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.7}
                className="p-1.5 sm:p-2 disabled:opacity-35 transition-opacity hover:opacity-80"
                style={{ color: ui.text }}
                title="Perkecil (-)"
                aria-label="Perkecil bacaan"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleZoomReset}
                className="px-2 py-1 text-[11px] font-mono font-semibold border-x transition-opacity hover:opacity-80"
                style={{
                  borderColor: ui.controlBorder,
                  color: ui.accent
                }}
                title="Reset Zoom ke 100% (0)"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 2}
                className="p-1.5 sm:p-2 disabled:opacity-35 transition-opacity hover:opacity-80"
                style={{ color: ui.text }}
                title="Perbesar (+)"
                aria-label="Perbesar bacaan"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Paper Lighting Mode */}
          {!useEmbedFallback && (
            <button
              type="button"
              onClick={cyclePaperMode}
              className="px-2.5 py-1.5 sm:py-2 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 transition-opacity hover:opacity-85"
              style={{
                backgroundColor: ui.controlBg,
                borderColor: ui.controlBorder,
                color: ui.text
              }}
              title="Ubah pencahayaan kertas (Asli / Hangat / Malam)"
            >
              {paperMode === 'night' ? (
                <Moon className="w-3.5 h-3.5" style={{ color: ui.accent }} />
              ) : (
                <Sun className="w-3.5 h-3.5" style={{ color: ui.accent }} />
              )}
              <span className="hidden lg:inline">{paperModeLabel}</span>
            </button>
          )}

          {/* Switch between 3D Flipbook & Standard Embed Fallback */}
          <button
            type="button"
            onClick={() => setUseEmbedFallback((prev) => !prev)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-[11px] font-semibold transition-opacity hover:opacity-85"
            style={{
              backgroundColor: useEmbedFallback ? ui.accentBg : ui.controlBg,
              borderColor: useEmbedFallback ? ui.accentBorder : ui.controlBorder,
              color: useEmbedFallback ? ui.accent : ui.muted
            }}
            title={useEmbedFallback ? 'Kembali ke Mode 3D Flipbook' : 'Gunakan Mode Pratinjau Standar (Embed)'}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{useEmbedFallback ? 'Mode 3D Flipbook' : 'Mode Embed'}</span>
          </button>

          {/* External Link */}
          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl border transition-opacity hover:opacity-85"
            style={{
              backgroundColor: ui.controlBg,
              borderColor: ui.controlBorder,
              color: ui.text
            }}
            title="Buka PDF di Tab Baru"
          >
            <ExternalLink className="w-4 h-4" style={{ color: ui.accent }} />
          </a>

          {/* Download */}
          <a
            href={buildPdfProxyUrl(rawUrl, book.id)}
            download={`${book.kodeBuku || 'ebook'}.pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center justify-center p-2 rounded-xl border transition-opacity hover:opacity-85"
            style={{
              backgroundColor: ui.controlBg,
              borderColor: ui.controlBorder,
              color: '#10B981'
            }}
            title="Unduh File PDF"
          >
            <Download className="w-4 h-4" />
          </a>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl border transition-opacity hover:opacity-85"
            style={{
              backgroundColor: ui.controlBg,
              borderColor: ui.controlBorder,
              color: ui.text
            }}
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}
            aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl border transition-all"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.14)',
              borderColor: 'rgba(239, 68, 68, 0.4)',
              color: '#EF4444'
            }}
            title="Tutup Pembaca Flipbook (Esc)"
            aria-label="Tutup Pembaca Flipbook"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      {/* ============================================================
          READING DESK / 3D FLIPBOOK STAGE
      ============================================================ */}
      <div
        ref={stageRef}
        className={`flex-1 w-full relative overflow-auto flex items-center justify-center ${ui.deskClass}`}
      >
        {/* Auto-Resume Toast Pill */}
        {resumeBanner && (
          <div
            className="fixed top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full border shadow-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn pointer-events-none"
            style={{
              backgroundColor: ui.barBg,
              borderColor: ui.accentBorder,
              color: ui.text
            }}
          >
            <Bookmark className="w-3.5 h-3.5" style={{ color: ui.accent }} />
            <span>{resumeBanner}</span>
          </div>
        )}

        {/* Rapid Jump Riffling Indicator Pill */}
        {jumpNotice && (
          <div
            className="fixed top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full border shadow-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn pointer-events-none"
            style={{
              backgroundColor: ui.barBg,
              borderColor: ui.accentBorder,
              color: ui.accent
            }}
          >
            <FastForward className="w-3.5 h-3.5 animate-pulse" />
            <span>{jumpNotice}</span>
          </div>
        )}

        {/* MODE A: Standard Embed Fallback */}
        {useEmbedFallback ? (
          <div className="w-full h-full relative">
            <iframe
              src={embedUrl}
              title={`PDF Embed - ${book.title}`}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </div>
        ) : loadingState === 'loading' || loadingState === 'idle' ? (
          /* LOADING STATE */
          <div className="flex flex-col items-center justify-center gap-4 p-8 text-center max-w-md">
            <div
              className="w-16 h-16 rounded-2xl border flex items-center justify-center shadow-lg"
              style={{
                backgroundColor: ui.barBg,
                borderColor: ui.accentBorder,
                color: ui.accent
              }}
            >
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-1.5">
              <h3
                className="text-base sm:text-lg font-bold"
                style={{ color: ui.text, fontFamily: ui.headingFont }}
              >
                Menyiapkan Buku 3D Interaktif...
              </h3>
              <p className="text-xs" style={{ color: ui.muted }}>
                Mengalirkan halaman PDF melalui jalur bebas CORS ({loadingProgress > 0 ? `${loadingProgress}%` : 'Menghubungkan...'})
              </p>
            </div>
            <div
              className="w-60 h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: ui.progressTrack }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(12, loadingProgress)}%`,
                  backgroundColor: ui.progressFill
                }}
              />
            </div>
          </div>
        ) : loadingState === 'error' ? (
          /* ERROR STATE WITH 1-CLICK FALLBACK */
          <div
            className="max-w-lg mx-4 rounded-2xl border p-6 sm:p-8 text-center space-y-4 shadow-2xl"
            style={{
              backgroundColor: ui.barBg,
              borderColor: ui.barBorder,
              color: ui.text
            }}
          >
            <AlertCircle className="w-12 h-12 mx-auto text-amber-500" />
            <h3
              className="text-lg font-bold"
              style={{ color: ui.text, fontFamily: ui.headingFont }}
            >
              Mode 3D Flipbook Tidak Dapat Memuat Stream PDF
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: ui.muted }}>
              {errorMessage}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setUseEmbedFallback(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: ui.primaryBtnBg,
                  color: ui.primaryBtnText
                }}
              >
                <Layers className="w-4 h-4" />
                <span>Buka Mode Pratinjau Standar</span>
              </button>
              <button
                type="button"
                onClick={() => setReloadNonce((n) => n + 1)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-opacity hover:opacity-85"
                style={{
                  backgroundColor: ui.controlBg,
                  borderColor: ui.controlBorder,
                  color: ui.text
                }}
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Coba Lagi</span>
              </button>
              <a
                href={rawUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-opacity hover:opacity-85"
                style={{
                  backgroundColor: ui.controlBg,
                  borderColor: ui.controlBorder,
                  color: ui.text
                }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Tab Baru</span>
              </a>
            </div>
          </div>
        ) : (
          /* READY STATE: INTERACTIVE 3D FLIPBOOK */
          <FlipbookLazyContext.Provider value={lazyContextValue}>
            <div
              className="flex items-center justify-center p-4 sm:p-6"
              style={{
                minWidth: `${scaledWidth + 48}px`,
                minHeight: `${scaledHeight + 36}px`
              }}
            >
              {/* Scaled Layout Wrapper so Zoom works smoothly with scrollbars */}
              <div
                className="relative flex items-center justify-center transition-all duration-200"
                style={{
                  width: `${scaledWidth}px`,
                  height: `${scaledHeight}px`
                }}
              >
                <div
                  className={`flipbook-book-cradle relative transition-transform duration-200 origin-center ${
                    isModern ? 'flipbook-cradle-modern' : 'flipbook-cradle-classic'
                  } ${isSpread ? 'flipbook-cradle-spread' : 'flipbook-cradle-single'} ${
                    isRiffling ? 'flipbook-riffling' : ''
                  }`}
                  style={{
                    width: `${bookDisplayWidth}px`,
                    height: `${pageHeight}px`,
                    transform: `scale(${zoom})`
                  }}
                >
                  {/* Floating Side Arrows on Desktop */}
                  {!isMobile && numPages > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevPage}
                        disabled={isRiffling || currentPage <= 1}
                        className="flipbook-side-nav -left-14 disabled:opacity-20"
                        style={{
                          backgroundColor: ui.barBg,
                          borderColor: ui.accentBorder,
                          color: ui.accent
                        }}
                        title="Halaman Sebelumnya (←)"
                        aria-label="Halaman Sebelumnya"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextPage}
                        disabled={isRiffling || currentPage >= numPages}
                        className="flipbook-side-nav -right-14 disabled:opacity-20"
                        style={{
                          backgroundColor: ui.barBg,
                          borderColor: ui.accentBorder,
                          color: ui.accent
                        }}
                        title="Halaman Selanjutnya (→)"
                        aria-label="Halaman Selanjutnya"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Center Spine Crease Shadow Overlay for Desktop 2-Page Spread */}
                  {isSpread && (
                    <div className="flipbook-center-spine-shadow pointer-events-none" />
                  )}

                  {/* Single-page PDF vs Multi-page 3D Flipbook */}
                  {numPages === 1 ? (
                    <div
                      className="rounded-lg overflow-hidden shadow-2xl"
                      style={{ width: `${pageWidth}px`, height: `${pageHeight}px` }}
                    >
                      <FlipbookPage pageNumber={1} />
                    </div>
                  ) : (
                    <HTMLFlipBook
                      key={`${bookId}-${numPages}-${isMobile ? 'mobile' : 'desktop'}-${pageWidth}x${pageHeight}`}
                      ref={flipBookRef}
                      width={pageWidth}
                      height={pageHeight}
                      size="fixed"
                      minWidth={200}
                      maxWidth={600}
                      minHeight={280}
                      maxHeight={820}
                      startPage={Math.max(0, Math.min(numPages - 1, (currentPageRef.current || initialStartPage) - 1))}
                      drawShadow={true}
                      flippingTime={620}
                      usePortrait={isMobile}
                      startZIndex={10}
                      autoSize={true}
                      maxShadowOpacity={0.55}
                      showCover={false}
                      mobileScrollSupport={true}
                      clickEventForward={false}
                      useMouseEvents={true}
                      swipeDistance={25}
                      showPageCorners={true}
                      disableFlipByClick={false}
                      renderOnlyPageLengthChange={true}
                      onFlip={handleFlipEvent}
                      className="flipbook-canvas-book"
                    >
                      {pageElements}
                    </HTMLFlipBook>
                  )}
                </div>
              </div>
            </div>
          </FlipbookLazyContext.Provider>
        )}
      </div>

      {/* ============================================================
          BOTTOM CONTROL BAR: NAVIGASI, INDIKATOR & LOMPAT HALAMAN CEPAT
      ============================================================ */}
      {!useEmbedFallback && (
        <footer
          className="w-full px-3 sm:px-6 py-2.5 border-t shrink-0 z-20 transition-colors"
          style={{
            backgroundColor: ui.barBg,
            borderColor: ui.barBorder,
            color: ui.text
          }}
        >
          {/* Thin Reading Progress Strip */}
          <div
            className="w-full h-1 rounded-full overflow-hidden mb-2.5"
            style={{ backgroundColor: ui.progressTrack }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progressPct}%`,
                backgroundColor: ui.progressFill
              }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Prev / Next Navigation Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={loadingState !== 'ready' || isRiffling || currentPage <= 1}
                className="px-2.5 sm:px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 disabled:opacity-35 transition-opacity hover:opacity-85"
                style={{
                  backgroundColor: ui.controlBg,
                  borderColor: ui.controlBorder,
                  color: ui.text
                }}
                title="Halaman Sebelumnya (←)"
              >
                <ChevronLeft className="w-4 h-4" style={{ color: ui.accent }} />
                <span className="hidden sm:inline">Halaman Sebelumnya</span>
                <span className="sm:hidden">Sebelumnya</span>
              </button>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={loadingState !== 'ready' || isRiffling || currentPage >= numPages}
                className="px-2.5 sm:px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 disabled:opacity-35 transition-opacity hover:opacity-85"
                style={{
                  backgroundColor: ui.controlBg,
                  borderColor: ui.controlBorder,
                  color: ui.text
                }}
                title="Halaman Selanjutnya (→)"
              >
                <span className="hidden sm:inline">Halaman Selanjutnya</span>
                <span className="sm:hidden">Selanjutnya</span>
                <ChevronRight className="w-4 h-4" style={{ color: ui.accent }} />
              </button>
            </div>

            {/* Center: Current Page & Total Pages Indicator */}
            <div className="flex items-center gap-2 text-xs">
              <span
                className="px-3 py-1.5 rounded-xl border font-semibold whitespace-nowrap"
                style={{
                  backgroundColor: ui.accentBg,
                  borderColor: ui.accentBorder,
                  color: ui.text
                }}
              >
                {numPages > 0 ? (
                  <>
                    Halaman{' '}
                    <strong style={{ color: ui.accent }}>{currentPage}</strong> / {numPages}
                  </>
                ) : (
                  'Memuat halaman...'
                )}
              </span>

              {isSpread && numPages > 1 && spreadLeft !== spreadRight && (
                <span
                  className="hidden lg:inline text-[11px] whitespace-nowrap"
                  style={{ color: ui.muted }}
                >
                  (Bentangan {spreadLeft}–{spreadRight} • {progressPct}%)
                </span>
              )}
            </div>

            {/* Right: Quick Jump Input ("Ke halaman...") + "Lompat" Button */}
            <form
              onSubmit={handleJumpSubmit}
              className="flex items-center gap-1.5"
            >
              <input
                type="number"
                min={1}
                max={Math.max(1, numPages)}
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                disabled={loadingState !== 'ready' || numPages <= 1}
                placeholder="Ke halaman..."
                aria-label="Ke halaman"
                className="w-28 sm:w-32 px-3 py-2 rounded-xl border text-xs focus:outline-none disabled:opacity-40"
                style={{
                  backgroundColor: ui.controlBg,
                  borderColor: ui.controlBorder,
                  color: ui.text
                }}
              />
              <button
                type="submit"
                disabled={loadingState !== 'ready' || numPages <= 1 || !jumpInput.trim()}
                className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 transition-all hover:brightness-110 shadow-sm"
                style={{
                  backgroundColor: ui.primaryBtnBg,
                  color: ui.primaryBtnText,
                  fontFamily: ui.headingFont
                }}
                title="Lompat cepat ke halaman tujuan dengan animasi kibasan"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Lompat</span>
              </button>
              {zoom !== 1 && (
                <button
                  type="button"
                  onClick={handleZoomReset}
                  className="hidden md:flex p-2 rounded-xl border transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: ui.controlBg,
                    borderColor: ui.controlBorder,
                    color: ui.muted
                  }}
                  title="Reset Zoom ke 100%"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>
        </footer>
      )}
    </div>
  );
}
