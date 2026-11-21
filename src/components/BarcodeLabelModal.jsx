import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Barcode,
  Check,
  CheckSquare,
  Download,
  Hash,
  Info,
  MapPin,
  Printer,
  Search,
  Square,
  X
} from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import { buildBookSearchText, shortenTitle } from '../utils/libraryUtils';
import { formatDateID } from '../utils/loanUtils';

const LABEL_FORMATS = {
  tom_jerry_103: {
    id: 'tom_jerry_103',
    name: 'Tom & Jerry 103',
    description: '38 x 21 mm • 5 kolom x 13 baris (65 label / A4)',
    paper: 'A4',
    width: 38,
    height: 21,
    columns: 5,
    rows: 13,
    marginX: 10,
    marginY: 12,
    gapX: 0,
    gapY: 0,
    padding: 1.1,
    barcodeHeight: 6.4,
    fonts: { code: 5.6, title: 5.0, meta: 4.2 },
    lineGap: 0.5
  },
  a4_3x8: {
    id: 'a4_3x8',
    name: 'Label A4 3 x 8',
    description: '63.5 x 33.9 mm • 24 label / A4',
    paper: 'A4',
    width: 63.5,
    height: 33.9,
    columns: 3,
    rows: 8,
    marginX: 9.75,
    marginY: 12.9,
    gapX: 0,
    gapY: 0,
    padding: 2.2,
    barcodeHeight: 10.5,
    fonts: { code: 8.2, title: 7.4, meta: 6.2 },
    lineGap: 0.9
  },
  a4_2x6: {
    id: 'a4_2x6',
    name: 'Label A4 2 x 6',
    description: '90 x 42 mm • 12 label / A4',
    paper: 'A4',
    width: 90,
    height: 42,
    columns: 2,
    rows: 6,
    marginX: 15,
    marginY: 22.5,
    gapX: 0,
    gapY: 0,
    padding: 3,
    barcodeHeight: 13,
    fonts: { code: 10, title: 9.5, meta: 7.8 },
    lineGap: 1.2
  }
};

function BarcodePreview({ value, height = 34 }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    try {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        width: 1.4,
        height,
        displayValue: false,
        margin: 0,
        background: '#ffffff',
        lineColor: '#111111'
      });
    } catch {
      // Abaikan nilai yang tidak valid pada pratinjau.
    }
  }, [value, height]);

  return <svg ref={svgRef} className="w-full h-auto max-h-[46px]" />;
}

function buildBarcodeDataUrl(value, height = 60) {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, value, {
    format: 'CODE128',
    width: 2,
    height,
    displayValue: false,
    margin: 0,
    background: '#ffffff',
    lineColor: '#000000'
  });
  return canvas.toDataURL('image/png');
}

function fitSingleLine(doc, text, maxWidth, fontSize) {
  let value = String(text || '');
  doc.setFontSize(fontSize);
  while (value.length > 3 && doc.getTextWidth(value) > maxWidth) {
    value = value.slice(0, -2);
  }
  return value.length < String(text || '').length ? `${value.trimEnd()}\u2026` : value;
}

export default function BarcodeLabelModal({
  isOpen,
  onClose,
  books = [],
  initialBookId = null
}) {
  const [formatId, setFormatId] = useState('a4_3x8');
  const [selectedBooks, setSelectedBooks] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const format = LABEL_FORMATS[formatId] || LABEL_FORMATS.a4_3x8;

  useEffect(() => {
    if (!isOpen) return;
    if (initialBookId) {
      setSelectedBooks({ [initialBookId]: 1 });
    } else {
      setSelectedBooks({});
    }
    setSearchQuery('');
    setError('');
  }, [isOpen, initialBookId]);

  const filteredBooks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return books;
    return books.filter((book) => buildBookSearchText(book).includes(query));
  }, [books, searchQuery]);

  const selectedIds = Object.keys(selectedBooks);
  const totalLabels = selectedIds.reduce(
    (total, id) => total + (Number(selectedBooks[id]) || 1),
    0
  );
  const labelsPerPage = format.columns * format.rows;

  const toggleBook = (bookId) => {
    setSelectedBooks((previous) => {
      const next = { ...previous };
      if (next[bookId]) {
        delete next[bookId];
      } else {
        next[bookId] = 1;
      }
      return next;
    });
  };

  const setCopies = (bookId, copies) => {
    const value = Math.max(1, Math.min(20, Number(copies) || 1));
    setSelectedBooks((previous) => ({ ...previous, [bookId]: value }));
  };

  const selectAll = () => {
    const next = {};
    filteredBooks.forEach((book) => {
      next[book.id] = selectedBooks[book.id] || 1;
    });
    setSelectedBooks(next);
  };

  const clearAll = () => setSelectedBooks({});

  const handleGeneratePdf = () => {
    if (selectedIds.length === 0) {
      setError('Pilih minimal satu buku untuk dicetak labelnya.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      let labelIndex = 0;
      const barcodeCache = new Map();

      const selectedList = books.filter((book) => selectedBooks[book.id]);

      for (const book of selectedList) {
        const copies = Number(selectedBooks[book.id]) || 1;
        for (let copy = 1; copy <= copies; copy += 1) {
          const copyCode =
            copies > 1 ? `${book.kodeBuku}-${String(copy).padStart(2, '0')}` : book.kodeBuku;

          if (labelIndex > 0 && labelIndex % labelsPerPage === 0) {
            doc.addPage();
          }

          const position = labelIndex % labelsPerPage;
          const column = position % format.columns;
          const row = Math.floor(position / format.columns);
          const x = format.marginX + column * (format.width + format.gapX);
          const y = format.marginY + row * (format.height + format.gapY);
          const innerWidth = format.width - format.padding * 2;

          // Garis potong tipis
          doc.setDrawColor(225, 220, 205);
          doc.setLineWidth(0.08);
          doc.rect(x, y, format.width, format.height);

          // Barcode
          if (!barcodeCache.has(copyCode)) {
            barcodeCache.set(copyCode, buildBarcodeDataUrl(copyCode, 90));
          }
          doc.addImage(
            barcodeCache.get(copyCode),
            'PNG',
            x + format.padding,
            y + format.padding,
            innerWidth,
            format.barcodeHeight
          );

          let cursorY = y + format.padding + format.barcodeHeight + format.lineGap;

          // Kode buku
          doc.setTextColor(15, 15, 15);
          doc.setFont('helvetica', 'bold');
          const codeText = fitSingleLine(
            doc,
            book.kodeBuku,
            innerWidth,
            format.fonts.code
          );
          doc.setFontSize(format.fonts.code);
          doc.text(codeText, x + format.padding, cursorY + format.fonts.code * 0.35);
          cursorY += format.fonts.code * 0.42 + format.lineGap;

          // Judul singkat
          doc.setFont('helvetica', 'normal');
          const titleText = fitSingleLine(
            doc,
            shortenTitle(book.title, 58),
            innerWidth,
            format.fonts.title
          );
          doc.setFontSize(format.fonts.title);
          doc.text(titleText, x + format.padding, cursorY + format.fonts.title * 0.35);
          cursorY += format.fonts.title * 0.42 + format.lineGap * 0.8;

          // Lokasi rak + DDC
          doc.setTextColor(70, 70, 70);
          doc.setFontSize(format.fonts.meta);
          const shelfText = fitSingleLine(
            doc,
            `DDC ${book.ddc} \u2022 ${book.shelf}`,
            innerWidth,
            format.fonts.meta
          );
          doc.text(shelfText, x + format.padding, cursorY + format.fonts.meta * 0.35);

          labelIndex += 1;
        }
      }

      const stamp = formatDateID(new Date(), 'short').replace(/\s/g, '-');
      doc.save(`Label-Rak-Perpustakaan-${stamp}.pdf`);
    } catch (errorObject) {
      console.error('Gagal membuat label PDF:', errorObject);
      setError(
        'Gagal membuat PDF label. Pastikan browser mengizinkan unduhan dan coba lagi.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  const previewBooks = books.filter((book) => selectedBooks[book.id]).slice(0, 4);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cetak Label Rak"
      className="fixed inset-0 z-[65] bg-black/85 backdrop-blur-md flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div
        className="w-full max-w-5xl rounded-2xl border shadow-2xl my-4 overflow-hidden"
        style={{
          backgroundColor: 'var(--theme-surface)',
          borderColor: 'var(--theme-border-strong)',
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
            <div className="w-11 h-11 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/45 text-[#D4AF37] flex items-center justify-center shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel font-bold text-lg text-[#F4E8C1]">
                Cetak Label Rak &amp; Barcode
              </h2>
              <p className="text-[11px] sm:text-xs text-[#A89F91] mt-0.5">
                Stiker siap tempel: barcode, kode buku, judul singkat, nomor panggil, dan lokasi rak.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-black/30 border border-white/10 text-[#A89F91] hover:text-[#F4E8C1] hover:border-[#D4AF37]/50"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Kolom kiri: pilihan format & buku */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h3 className="font-cinzel text-xs font-bold text-[#D4AF37] mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                1. PILIH UKURAN KERTAS STIKER
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {Object.values(LABEL_FORMATS).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormatId(item.id)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      formatId === item.id
                        ? 'bg-[#D4AF37]/15 border-[#D4AF37] shadow-md'
                        : 'bg-black/30 border-white/10 hover:border-[#D4AF37]/40'
                    }`}
                  >
                    <span className="block font-cinzel font-bold text-xs text-[#F4E8C1]">
                      {item.name}
                    </span>
                    <span className="block text-[10px] text-[#A89F91] mt-1 leading-relaxed">
                      {item.description}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] text-emerald-300 mt-1.5">
                      <Check className="w-3 h-3" />
                      {item.columns * item.rows} label / halaman
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-cinzel text-xs font-bold text-[#D4AF37] flex items-center gap-1.5">
                <Barcode className="w-3.5 h-3.5" />
                2. PILIH BUKU ({selectedIds.length} dipilih)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-[10px] px-2.5 py-1.5 rounded-lg bg-white/5 text-[#F4E8C1] border border-white/10 hover:border-[#D4AF37]/40 flex items-center gap-1"
                >
                  <CheckSquare className="w-3 h-3" />
                  Pilih semua
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[10px] px-2.5 py-1.5 rounded-lg bg-white/5 text-[#A89F91] border border-white/10 hover:text-[#F4E8C1] flex items-center gap-1"
                >
                  <Square className="w-3 h-3" />
                  Kosongkan
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#A89F91] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari judul, penulis, kode buku..."
                className="w-full pl-8 pr-3 py-2.5 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/25 text-[#F4E8C1] placeholder-[#A89F91]/60 focus:outline-none focus:border-[#D4AF37]/60"
              />
            </div>

            <div className="max-h-[340px] overflow-y-auto rounded-xl border border-white/10 bg-black/25 divide-y divide-white/5">
              {filteredBooks.length === 0 ? (
                <p className="text-xs text-[#A89F91] text-center py-6">Buku tidak ditemukan.</p>
              ) : (
                filteredBooks.map((book) => {
                  const isSelected = Boolean(selectedBooks[book.id]);
                  return (
                    <div
                      key={book.id}
                      className={`p-2.5 flex items-center gap-2.5 transition-colors ${
                        isSelected ? 'bg-[#D4AF37]/8' : 'hover:bg-white/5'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleBook(book.id)}
                        className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[#D4AF37] border-[#D4AF37] text-[#12100E]'
                            : 'border-white/20 text-transparent'
                        }`}
                        aria-label={`Pilih ${book.title}`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>

                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-[#F4E8C1] truncate">
                          {book.title}
                        </p>
                        <p className="text-[9px] text-[#A89F91] truncate">
                          <span className="font-mono text-[#D4AF37]">{book.kodeBuku}</span>
                          {' \u2022 '}
                          {book.author}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <label className="text-[9px] text-[#A89F91]" htmlFor={`copies-${book.id}`}>
                          Eks.
                        </label>
                        <input
                          id={`copies-${book.id}`}
                          type="number"
                          min="1"
                          max="20"
                          value={selectedBooks[book.id] || 1}
                          onChange={(event) => setCopies(book.id, event.target.value)}
                          disabled={!isSelected}
                          className="w-12 px-1.5 py-1 rounded-lg text-[10px] text-center bg-[#12100E] border border-[#D4AF37]/25 text-[#F4E8C1] disabled:opacity-40"
                          title="Jumlah label untuk buku ini (1 label per eksemplar)"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-300">
                {error}
              </div>
            )}
          </div>

          {/* Kolom kanan: pratinjau & generate */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#12100E] border border-[#D4AF37]/25 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-cinzel text-xs font-bold text-[#D4AF37]">PRATINJAU LABEL</h3>
                <span className="text-[9px] text-[#A89F91]">
                  {format.width} x {format.height} mm
                </span>
              </div>

              {previewBooks.length === 0 ? (
                <div className="h-32 rounded-xl border border-dashed border-white/15 flex flex-col items-center justify-center gap-1.5 text-[#A89F91]">
                  <Barcode className="w-7 h-7 opacity-50" />
                  <p className="text-[10px]">Pilih buku untuk melihat pratinjau.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {previewBooks.map((book) => {
                    const copies = Number(selectedBooks[book.id]) || 1;
                    const barcodeCode =
                      copies > 1 ? `${book.kodeBuku}-01` : book.kodeBuku;
                    return (
                      <div
                        key={book.id}
                        className="bg-white text-black rounded-md p-2 shadow-sm"
                        style={{ aspectRatio: `${format.width} / ${format.height}` }}
                      >
                        <BarcodePreview value={barcodeCode} height={26} />
                        <div className="border-t border-dashed border-gray-300 mt-0.5 pt-0.5 leading-tight">
                          <p className="font-bold text-[8px] font-mono">{book.kodeBuku}</p>
                          <p className="text-[7px] truncate">{shortenTitle(book.title, 42)}</p>
                          <p className="text-[6px] text-gray-600 truncate">
                            DDC {book.ddc} &bull; {book.shelf}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {selectedIds.length > previewBooks.length && (
                    <p className="text-[9px] text-[#A89F91] text-center">
                      +{selectedIds.length - previewBooks.length} buku lain akan dicetak.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2 text-[10px] text-[#A89F91]">
              <p className="flex items-start gap-1.5">
                <Hash className="w-3 h-3 text-[#D4AF37] shrink-0 mt-0.5" />
                Barcode Code128 dapat dipindai oleh scanner kamera maupun barcode reader USB.
              </p>
              <p className="flex items-start gap-1.5">
                <MapPin className="w-3 h-3 text-[#D4AF37] shrink-0 mt-0.5" />
                Nomor panggil mengikuti DDC dan kode penulis. Sesuaikan DDC di data buku bila perlu.
              </p>
              <p className="flex items-start gap-1.5">
                <Printer className="w-3 h-3 text-[#D4AF37] shrink-0 mt-0.5" />
                Saat mencetak PDF, pilih <strong className="text-[#F4E8C1]">Actual Size / 100%</strong> dan matikan
                &quot;Fit to Page&quot; agar ukuran stiker presisi.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGeneratePdf}
              disabled={selectedIds.length === 0 || isGenerating}
              className={`w-full py-3 rounded-xl font-cinzel font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                selectedIds.length > 0 && !isGenerating
                  ? 'bg-[#D4AF37] hover:bg-amber-400 text-[#12100E]'
                  : 'bg-white/10 text-[#A89F91] cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <>
                  <Printer className="w-4 h-4 animate-pulse" />
                  Membuat PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Unduh PDF Label ({totalLabels})
                </>
              )}
            </button>

            <p className="text-center text-[9px] text-[#A89F91]">
              Total {totalLabels} label &bull; {Math.max(1, Math.ceil(totalLabels / labelsPerPage))} halaman A4
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
