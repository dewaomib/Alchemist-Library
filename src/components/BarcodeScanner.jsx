import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Flashlight,
  FlashlightOff,
  Keyboard,
  QrCode,
  RefreshCw,
  ScanLine,
  X
} from 'lucide-react';
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats
} from 'html5-qrcode';

const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF
];

function playScanBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 1180;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.16);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.18);
    setTimeout(() => context.close().catch(() => {}), 400);
  } catch {
    // Suara opsional; abaikan jika browser memblokir AudioContext.
  }
}

export default function BarcodeScanner({
  isOpen,
  onClose,
  onDetected,
  title = 'Pindai Barcode / QR Code',
  subtitle = 'Arahkan kamera ke barcode kartu atau buku.',
  accent = 'gold'
}) {
  const elementId = `barcode-reader-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const scannerRef = useRef(null);
  const handledRef = useRef(false);
  const onDetectedRef = useRef(onDetected);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [cameras, setCameras] = useState([]);
  const [cameraId, setCameraId] = useState('');
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualValue, setManualValue] = useState('');
  const [lastValue, setLastValue] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const accentColor =
    accent === 'emerald' ? '#10B981' : accent === 'sky' ? '#38BDF8' : '#D4AF37';

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch {
      // Kamera mungkin sudah berhenti karena tab berpindah.
    }
    try {
      scanner.clear();
    } catch {
      // Element sudah dilepas dari DOM.
    }
  }, []);

  const handleDetected = useCallback((value) => {
    const clean = String(value || '').trim();
    if (!clean || handledRef.current) return;
    handledRef.current = true;
    setLastValue(clean);
    playScanBeep();
    onDetectedRef.current?.(clean);
  }, []);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    if (!isOpen) {
      setStatus('idle');
      setErrorMessage('');
      setManualMode(false);
      setManualValue('');
      setLastValue('');
      setTorchOn(false);
      setTorchAvailable(false);
      handledRef.current = false;
      stopScanner();
      return undefined;
    }

    let cancelled = false;
    handledRef.current = false;
    setStatus('starting');
    setErrorMessage('');

    const startScanner = async () => {
      try {
        const availableCameras = await Html5Qrcode.getCameras().catch(() => []);
        if (cancelled) return;
        setCameras(availableCameras || []);

        const preferredCamera =
          cameraId ||
          availableCameras?.find((camera) => /back|rear|environment/i.test(camera.label))?.id ||
          availableCameras?.[0]?.id ||
          '';

        const scanner = new Html5Qrcode(elementId, {
          formatsToSupport: SUPPORTED_FORMATS,
          verbose: false
        });
        scannerRef.current = scanner;

        const cameraConfig = preferredCamera
          ? preferredCamera
          : { facingMode: 'environment' };

        await scanner.start(
          cameraConfig,
          {
            fps: 12,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const width = Math.floor(Math.min(viewfinderWidth * 0.86, 420));
              const height = Math.floor(
                Math.min(viewfinderHeight * 0.62, Math.max(140, width * 0.62))
              );
              return { width: Math.max(160, width), height };
            },
            aspectRatio: 1.5,
            disableFlip: false
          },
          (decodedText) => handleDetected(decodedText),
          () => {}
        );

        if (cancelled) {
          await stopScanner();
          return;
        }

        setStatus('scanning');
        try {
          const capabilities = scanner.getRunningTrackCapabilities();
          setTorchAvailable(Boolean(capabilities?.torch));
        } catch {
          setTorchAvailable(false);
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Barcode scanner error:', error);
        setStatus('error');
        const message = String(error?.message || error || '').toLowerCase();
        if (message.includes('permission') || message.includes('notallowed')) {
          setErrorMessage(
            'Izin kamera ditolak. Berikan izin kamera pada browser, lalu tekan "Coba Lagi".'
          );
        } else if (message.includes('secure') || message.includes('https')) {
          setErrorMessage(
            'Kamera hanya dapat dibuka melalui HTTPS atau localhost. Gunakan input manual di bawah.'
          );
        } else if (message.includes('notfound') || message.includes('device')) {
          setErrorMessage(
            'Kamera tidak ditemukan. Gunakan input manual atau hubungkan kamera terlebih dahulu.'
          );
        } else {
          setErrorMessage(
            'Kamera tidak dapat dibuka. Pastikan browser memiliki izin kamera, atau gunakan input manual di bawah.'
          );
        }
      }
    };

    const timer = setTimeout(startScanner, 120);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, cameraId, elementId, handleDetected, stopScanner, retryKey]);

  const handleTorch = async () => {
    const scanner = scannerRef.current;
    if (!scanner || !torchAvailable) return;
    try {
      await scanner.applyVideoConstraints({
        advanced: [{ torch: !torchOn }]
      });
      setTorchOn((previous) => !previous);
    } catch (error) {
      console.warn('Torch tidak tersedia:', error);
    }
  };

  const handleManualSubmit = (event) => {
    event.preventDefault();
    const value = manualValue.trim();
    if (!value) return;
    handleDetected(value);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <style>{`
        #${elementId} video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 1rem;
        }
        #${elementId} {
          width: 100% !important;
          border: 0 !important;
        }
        #${elementId} img[alt="Info icon"] {
          display: none !important;
        }
      `}</style>

      <div
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden my-4"
        style={{
          backgroundColor: 'var(--theme-surface)',
          borderColor: `${accentColor}99`,
          boxShadow: 'var(--theme-shadow-modal)'
        }}
      >
        <header
          className="px-4 sm:px-6 py-4 border-b flex items-start justify-between gap-3"
          style={{
            borderColor: 'var(--theme-border)',
            backgroundColor: 'var(--theme-surface-alt)'
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${accentColor}18`,
                borderColor: `${accentColor}55`,
                color: accentColor
              }}
            >
              <ScanLine className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-cinzel font-bold text-base sm:text-lg text-[#F4E8C1]">
                {title}
              </h3>
              <p className="text-[11px] sm:text-xs text-[#A89F91] mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-black/30 border border-white/10 text-[#A89F91] hover:text-[#F4E8C1] hover:border-[#D4AF37]/50"
            aria-label="Tutup pemindai"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="p-4 sm:p-6 space-y-4">
          {!manualMode && (
            <div
              className="relative rounded-2xl overflow-hidden border bg-black min-h-[240px] sm:min-h-[300px] flex items-center justify-center"
              style={{ borderColor: `${accentColor}55` }}
            >
              <div id={elementId} className="w-full" />

              {status !== 'scanning' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-[#12100E]">
                  {status === 'error' ? (
                    <CameraOff className="w-10 h-10 text-rose-400" />
                  ) : (
                    <RefreshCw
                      className={`w-9 h-9 animate-spin ${status === 'starting' ? '' : 'hidden'}`}
                      style={{ color: accentColor }}
                    />
                  )}
                  <p className="text-xs text-[#A89F91] max-w-sm leading-relaxed">
                    {status === 'error'
                      ? errorMessage
                      : 'Menyiapkan kamera... Izinkan akses kamera jika browser meminta.'}
                  </p>
                  {status === 'error' && (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRetryKey((previous) => previous + 1)}
                        className="px-3 py-2 rounded-lg text-xs font-semibold border transition-colors"
                        style={{
                          borderColor: `${accentColor}55`,
                          color: accentColor,
                          backgroundColor: `${accentColor}12`
                        }}
                      >
                        Coba Lagi
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualMode(true)}
                        className="px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 text-[#F4E8C1] border border-white/10"
                      >
                        Input Manual
                      </button>
                    </div>
                  )}
                </div>
              )}

              {status === 'scanning' && (
                <>
                  <div className="pointer-events-none absolute inset-0 z-10">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[78%] max-w-[360px] h-[46%] rounded-xl border-2 border-dashed"
                      style={{ borderColor: `${accentColor}cc`, boxShadow: `0 0 0 9999px rgba(0,0,0,0.25)` }}
                    />
                    <div
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 w-[74%] max-w-[340px] h-0.5 animate-pulse"
                      style={{ backgroundColor: accentColor, boxShadow: `0 0 14px ${accentColor}` }}
                    />
                  </div>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-black/70 border border-white/15 text-[11px] text-[#F4E8C1] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Kamera aktif &mdash; arahkan barcode ke dalam kotak
                  </div>
                </>
              )}
            </div>
          )}

          {manualMode && (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <label className="block text-xs font-cinzel text-[#D4AF37]">
                INPUT MANUAL KODE / NOMOR KARTU / ISBN
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  autoFocus
                  type="text"
                  value={manualValue}
                  onChange={(event) => setManualValue(event.target.value)}
                  placeholder="Contoh: ARC-2026-089 atau BK-FIK-001"
                  className="flex-1 px-3.5 py-2.5 rounded-xl text-sm bg-[#12100E] border border-[#D4AF37]/35 text-[#F4E8C1] placeholder-[#A89F91]/60 focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl text-xs font-cinzel font-bold text-[#12100E]"
                  style={{ backgroundColor: accentColor }}
                >
                  Gunakan Kode
                </button>
              </div>
              <button
                type="button"
                onClick={() => setManualMode(false)}
                className="text-[11px] text-[#A89F91] hover:text-[#F4E8C1] flex items-center gap-1"
              >
                <Camera className="w-3.5 h-3.5" />
                Kembali ke kamera
              </button>
            </form>
          )}

          {lastValue && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="truncate">Terkunci: <strong>{lastValue}</strong></span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {!manualMode && (
                <button
                  type="button"
                  onClick={() => setManualMode(true)}
                  className="px-3 py-2 rounded-lg text-[11px] font-semibold bg-white/5 text-[#F4E8C1] border border-white/10 hover:border-[#D4AF37]/40 flex items-center gap-1.5"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  Input Manual
                </button>
              )}

              {torchAvailable && !manualMode && (
                <button
                  type="button"
                  onClick={handleTorch}
                  className="px-3 py-2 rounded-lg text-[11px] font-semibold bg-white/5 text-[#F4E8C1] border border-white/10 hover:border-[#D4AF37]/40 flex items-center gap-1.5"
                >
                  {torchOn ? (
                    <FlashlightOff className="w-3.5 h-3.5" />
                  ) : (
                    <Flashlight className="w-3.5 h-3.5" />
                  )}
                  {torchOn ? 'Matikan Lampu' : 'Lampu Kamera'}
                </button>
              )}

              {cameras.length > 1 && !manualMode && (
                <select
                  value={cameraId}
                  onChange={(event) => setCameraId(event.target.value)}
                  className="px-2.5 py-2 rounded-lg text-[11px] bg-[#12100E] text-[#F4E8C1] border border-white/10 focus:outline-none focus:border-[#D4AF37] max-w-[210px]"
                  title="Pilih kamera"
                >
                  <option value="">Kamera otomatis</option>
                  {cameras.map((camera) => (
                    <option key={camera.id} value={camera.id}>
                      {camera.label || 'Kamera'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-[#A89F91]">
              <QrCode className="w-3.5 h-3.5" />
              QR • CODE128 • EAN • UPC
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
