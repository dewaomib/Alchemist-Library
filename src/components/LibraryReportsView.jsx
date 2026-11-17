import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  MessageCircle,
  TrendingUp,
  Users,
  AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  formatDateID,
  formatMonthID,
  getClassLevel,
  getLoanTiming,
  getMonthKey,
  getMonthOptions,
  getReturnedLateDays,
  isLoanInMonth,
  LIBRARY_NAME
} from '../utils/loanUtils';
import { getCategoryMeta } from '../utils/libraryUtils';

const BORROWED_STATUSES = ['approved', 'active', 'returned', 'recalled'];

function shortClassName(name = '') {
  const value = String(name || '').split('\u2022')[0].trim();
  return value || 'Lainnya';
}

function isDigitalBook(book) {
  return Boolean(
    book?.hasDigital ||
      book?.pdfUrl ||
      (Array.isArray(book?.digitalContent) && book.digitalContent.length > 0)
  );
}

function buildReportData({ books, loans, monthKey }) {
  const periodLoans = loans.filter(
    (loan) => BORROWED_STATUSES.includes(loan.status) && isLoanInMonth(loan, monthKey || '')
  );

  const totalBorrowedCopies = periodLoans.reduce(
    (total, loan) => total + (Number(loan.quantity) || 1),
    0
  );

  const popularityMap = new Map();
  periodLoans.forEach((loan) => {
    const book = books.find((item) => item.id === loan.bookId);
    const key = loan.bookId || loan.bookTitle || 'unknown';
    if (!popularityMap.has(key)) {
      popularityMap.set(key, {
        bookId: loan.bookId,
        title: book?.title || loan.bookTitle || 'Buku',
        author: book?.author || '-',
        kodeBuku: book?.kodeBuku || '-',
        category: book?.category || '-',
        loans: 0,
        copies: 0,
        borrowers: new Set()
      });
    }
    const entry = popularityMap.get(key);
    entry.loans += 1;
    entry.copies += Number(loan.quantity) || 1;
    entry.borrowers.add(
      loan.borrowerCard || loan.profileId || loan.borrowerName || loan.requesterName
    );
  });

  const popularBooks = [...popularityMap.values()]
    .map((entry) => ({ ...entry, borrowers: entry.borrowers.size }))
    .sort((a, b) => b.copies - a.copies || b.loans - a.loans || a.title.localeCompare(b.title));

  const totalTitles = books.length;
  const totalCopies = books.reduce(
    (total, book) => total + (Number(book.totalStock) || 0),
    0
  );
  const availableCopies = books.reduce(
    (total, book) => total + (Number(book.availableStock) || 0),
    0
  );
  const digitalTitles = books.filter(isDigitalBook).length;
  const physicalOnlyTitles = totalTitles - digitalTitles;

  const categoryMap = new Map();
  books.forEach((book) => {
    const category = getCategoryMeta(book.category);
    const key = category.label;
    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        category: key,
        indo: category.indo,
        titles: 0,
        copies: 0,
        available: 0,
        digital: 0
      });
    }
    const entry = categoryMap.get(key);
    entry.titles += 1;
    entry.copies += Number(book.totalStock) || 0;
    entry.available += Number(book.availableStock) || 0;
    if (isDigitalBook(book)) entry.digital += 1;
  });

  const categoryBreakdown = [...categoryMap.values()].sort((a, b) => b.copies - a.copies);

  const classMap = new Map();
  const levelMap = new Map();

  periodLoans.forEach((loan) => {
    const className = shortClassName(loan.className || loan.classLabel);
    const level = loan.borrowerLevel || getClassLevel(`${className} ${loan.className || ''}`);
    const quantity = Number(loan.quantity) || 1;
    const timing = getLoanTiming(loan);
    const isActive = loan.status === 'approved' || loan.status === 'active';
    const isReturned = loan.status === 'returned' || loan.status === 'recalled';

    if (!classMap.has(className)) {
      classMap.set(className, {
        className,
        level,
        loans: 0,
        copies: 0,
        active: 0,
        overdue: 0,
        returned: 0,
        borrowers: new Set()
      });
    }
    const classEntry = classMap.get(className);
    classEntry.loans += 1;
    classEntry.copies += quantity;
    if (isActive) classEntry.active += 1;
    if (isActive && timing.key === 'overdue') classEntry.overdue += 1;
    if (isReturned) classEntry.returned += 1;
    classEntry.borrowers.add(
      loan.borrowerCard || loan.profileId || loan.borrowerName || loan.requesterName
    );

    if (!levelMap.has(level)) {
      levelMap.set(level, {
        level,
        loans: 0,
        copies: 0,
        active: 0,
        overdue: 0,
        returned: 0,
        borrowers: new Set()
      });
    }
    const levelEntry = levelMap.get(level);
    levelEntry.loans += 1;
    levelEntry.copies += quantity;
    if (isActive) levelEntry.active += 1;
    if (isActive && timing.key === 'overdue') levelEntry.overdue += 1;
    if (isReturned) levelEntry.returned += 1;
    levelEntry.borrowers.add(
      loan.borrowerCard || loan.profileId || loan.borrowerName || loan.requesterName
    );
  });

  const classStats = [...classMap.values()]
    .map((entry) => ({ ...entry, borrowers: entry.borrowers.size }))
    .sort((a, b) => b.copies - a.copies || a.className.localeCompare(b.className));

  const levelStats = [...levelMap.values()]
    .map((entry) => ({ ...entry, borrowers: entry.borrowers.size }))
    .sort((a, b) => b.copies - a.copies || a.level.localeCompare(b.level));

  const allLateLoans = loans.filter((loan) => {
    const status = loan.status;
    if (status === 'approved' || status === 'active') {
      return getLoanTiming(loan).key === 'overdue';
    }
    if (status === 'returned' || status === 'recalled') {
      return getReturnedLateDays(loan) > 0;
    }
    return false;
  });

  const lateRows = allLateLoans
    .filter((loan) => {
      if (!monthKey) return true;
      const isActiveOverdue =
        (loan.status === 'approved' || loan.status === 'active') &&
        getLoanTiming(loan).key === 'overdue';
      if (isActiveOverdue) return true;
      return (
        getMonthKey(loan.dueDate) === monthKey ||
        getMonthKey(loan.returnedAt) === monthKey
      );
    })
    .map((loan) => {
      const timing = getLoanTiming(loan);
      const lateDays =
        loan.status === 'returned' || loan.status === 'recalled'
          ? getReturnedLateDays(loan)
          : timing.overdueDays;
      const book = books.find((item) => item.id === loan.bookId);
      return {
        ...loan,
        lateDays,
        timing,
        bookTitle: book?.title || loan.bookTitle,
        kodeBuku: book?.kodeBuku || '-',
        className: shortClassName(loan.className || loan.classLabel)
      };
    })
    .sort((a, b) => b.lateDays - a.lateDays);

  const activeLoans = loans.filter(
    (loan) => loan.status === 'approved' || loan.status === 'active'
  );
  const overdueActive = activeLoans.filter((loan) => getLoanTiming(loan).key === 'overdue');
  const dueSoonActive = activeLoans.filter((loan) => getLoanTiming(loan).key === 'due_soon');
  const returnedPeriod = periodLoans.filter(
    (loan) => loan.status === 'returned' || loan.status === 'recalled'
  );
  const onTimeReturns = returnedPeriod.filter((loan) => getReturnedLateDays(loan) === 0).length;
  const onTimeRate = returnedPeriod.length
    ? Math.round((onTimeReturns / returnedPeriod.length) * 100)
    : 0;

  return {
    periodLoans,
    totalBorrowedCopies,
    popularBooks,
    collection: {
      totalTitles,
      totalCopies,
      availableCopies,
      borrowedCopies: Math.max(0, totalCopies - availableCopies),
      digitalTitles,
      physicalOnlyTitles
    },
    categoryBreakdown,
    classStats,
    levelStats,
    lateRows,
    activeLoans,
    overdueActive,
    dueSoonActive,
    returnedPeriod,
    onTimeRate,
    onTimeReturns
  };
}

function addSheet(workbook, name, aoa, widths) {
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  if (widths) sheet['!cols'] = widths.map((wch) => ({ wch }));
  XLSX.utils.book_append_sheet(workbook, sheet, name);
}

export default function LibraryReportsView({ books = [], loans = [], onOpenReminder }) {
  const monthOptions = useMemo(() => getMonthOptions(18), []);
  const [monthKey, setMonthKey] = useState(monthOptions[0]?.key || '');
  const [isExporting, setIsExporting] = useState(false);

  const report = useMemo(
    () => buildReportData({ books, loans, monthKey }),
    [books, loans, monthKey]
  );

  const periodLabel = monthKey ? formatMonthID(monthKey) : 'Semua Periode';
  const generatedAt = formatDateID(new Date(), 'long');

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const workbook = XLSX.utils.book_new();

      addSheet(
        workbook,
        'Ringkasan',
        [
          ['LAPORAN BULANAN PERPUSTAKAAN', ''],
          ['Periode', periodLabel],
          ['Tanggal Unduh', generatedAt],
          ['', ''],
          ['METRIK', 'NILAI'],
          ['Total Judul Koleksi', report.collection.totalTitles],
          ['Total Eksemplar Fisik', report.collection.totalCopies],
          ['Eksemplar Tersedia di Rak', report.collection.availableCopies],
          ['Eksemplar Sedang Dipinjam', report.collection.borrowedCopies],
          ['Judul Memiliki Versi Digital', report.collection.digitalTitles],
          ['Judul Hanya Fisik', report.collection.physicalOnlyTitles],
          ['', ''],
          ['Pinjaman pada Periode Ini (transaksi)', report.periodLoans.length],
          ['Eksemplar Dipinjam pada Periode Ini', report.totalBorrowedCopies],
          ['Peminjaman Aktif Saat Ini', report.activeLoans.length],
          ['Terlambat Aktif', report.overdueActive.length],
          ['Mendekati Jatuh Tempo (H-1)', report.dueSoonActive.length],
          ['Pengembalian Tepat Waktu pada Periode', `${report.onTimeReturns} dari ${report.returnedPeriod.length}`],
          ['Persentase Ketepatan Waktu', `${report.onTimeRate}%`]
        ],
        [42, 20]
      );

      addSheet(
        workbook,
        'Buku Populer',
        [
          ['BUKU PALING BANYAK DIPINJAM', '', '', '', '', ''],
          ['Periode', periodLabel, '', '', '', ''],
          ['', '', '', '', '', ''],
          ['Peringkat', 'Kode Buku', 'Judul', 'Penulis', 'Transaksi', 'Eksemplar', 'Peminjam Unik'],
          ...report.popularBooks.map((book, index) => [
            index + 1,
            book.kodeBuku,
            book.title,
            book.author,
            book.loans,
            book.copies,
            book.borrowers
          ])
        ],
        [10, 16, 38, 24, 12, 12, 15]
      );

      addSheet(
        workbook,
        'Koleksi Fisik vs Digital',
        [
          ['KOMPOSISI KOLEKSI', '', '', '', ''],
          ['Periode', periodLabel, '', '', ''],
          ['', '', '', '', ''],
          ['Kategori', 'Judul', 'Total Eksemplar', 'Tersedia di Rak', 'Judul Digital'],
          ...report.categoryBreakdown.map((row) => [
            `${row.category} (${row.indo})`,
            row.titles,
            row.copies,
            row.available,
            row.digital
          ]),
          ['', '', '', '', ''],
          ['TOTAL', report.collection.totalTitles, report.collection.totalCopies, report.collection.availableCopies, report.collection.digitalTitles]
        ],
        [36, 12, 16, 18, 14]
      );

      addSheet(
        workbook,
        'Per Kelas',
        [
          ['STATISTIK PEMINJAMAN PER KELAS', '', '', '', '', '', ''],
          ['Periode', periodLabel, '', '', '', '', ''],
          ['', '', '', '', '', '', ''],
          ['Kelas', 'Jenjang', 'Transaksi', 'Eksemplar', 'Aktif', 'Terlambat', 'Peminjam Unik'],
          ...report.classStats.map((row) => [
            row.className,
            row.level,
            row.loans,
            row.copies,
            row.active,
            row.overdue,
            row.borrowers
          ])
        ],
        [24, 10, 12, 12, 10, 12, 15]
      );

      addSheet(
        workbook,
        'Per Jenjang',
        [
          ['STATISTIK PEMINJAMAN PER JENJANG', '', '', '', '', '', ''],
          ['Periode', periodLabel, '', '', '', '', ''],
          ['', '', '', '', '', '', ''],
          ['Jenjang', 'Transaksi', 'Eksemplar', 'Aktif', 'Terlambat', 'Selesai', 'Peminjam Unik'],
          ...report.levelStats.map((row) => [
            row.level,
            row.loans,
            row.copies,
            row.active,
            row.overdue,
            row.returned,
            row.borrowers
          ])
        ],
        [14, 12, 12, 10, 12, 12, 15]
      );

      addSheet(
        workbook,
        'Keterlambatan',
        [
          ['REKAP KETERLAMBATAN PENGEMBALIAN', '', '', '', '', '', '', ''],
          ['Periode', periodLabel, '', '', '', '', '', ''],
          ['', '', '', '', '', '', '', ''],
          ['Status', 'Peminjam', 'Kelas', 'Buku', 'Kode Buku', 'Jatuh Tempo', 'Terlambat (hari)', 'Keterangan'],
          ...report.lateRows.map((row) => [
            row.status === 'returned' || row.status === 'recalled'
              ? 'Dikembalikan terlambat'
              : 'Masih dipinjam / terlambat',
            row.borrowerName,
            row.className,
            row.bookTitle,
            row.kodeBuku,
            row.dueDate,
            row.lateDays,
            row.timing.label
          ])
        ],
        [26, 24, 20, 34, 16, 14, 14, 26]
      );

      addSheet(
        workbook,
        'Detail Pinjaman',
        [
          ['DETAIL SIRKULASI PERIODE', '', '', '', '', '', '', '', ''],
          ['Periode', periodLabel, '', '', '', '', '', '', ''],
          ['', '', '', '', '', '', '', '', ''],
          ['Tanggal Pinjam', 'Jatuh Tempo', 'Status', 'Peminjam', 'Kelas', 'Buku', 'Kode Buku', 'Eksemplar', 'Dikembalikan'],
          ...report.periodLoans.map((loan) => {
            const book = books.find((item) => item.id === loan.bookId);
            return [
              loan.borrowedDateISO || loan.borrowedDate,
              loan.dueDate,
              getLoanTiming(loan).label,
              loan.borrowerName,
              shortClassName(loan.className),
              book?.title || loan.bookTitle,
              book?.kodeBuku || '-',
              loan.quantity || 1,
              loan.returnedAt || '-'
            ];
          })
        ],
        [14, 14, 22, 24, 20, 34, 16, 10, 14]
      );

      const filename = `Laporan-Perpustakaan-${monthKey || 'Semua-Periode'}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Gagal mengekspor Excel:', error);
      alert('Gagal membuat file Excel. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageWidth = doc.internal.pageSize.getWidth();
      let cursorY = 16;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(30, 25, 22);
      doc.text('LAPORAN BULANAN PERPUSTAKAAN', pageWidth / 2, cursorY, { align: 'center' });
      cursorY += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(LIBRARY_NAME, pageWidth / 2, cursorY, { align: 'center' });
      cursorY += 5;
      doc.setFontSize(9);
      doc.setTextColor(90, 80, 70);
      doc.text(
        `Periode: ${periodLabel}  |  Dibuat: ${generatedAt}`,
        pageWidth / 2,
        cursorY,
        { align: 'center' }
      );
      cursorY += 9;

      const heading = (text) => {
        if (cursorY > 265) {
          doc.addPage();
          cursorY = 18;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(120, 95, 30);
        doc.text(text, 14, cursorY);
        cursorY += 3;
      };

      const tableOptions = {
        theme: 'grid',
        margin: { left: 14, right: 14 },
        styles: { font: 'helvetica', fontSize: 7.4, cellPadding: 1.6, textColor: [45, 40, 35] },
        headStyles: {
          fillColor: [30, 25, 22],
          textColor: [244, 232, 193],
          fontStyle: 'bold',
          fontSize: 7.4
        },
        alternateRowStyles: { fillColor: [248, 245, 238] }
      };

      heading('1. RINGKASAN EKSEKUTIF');
      autoTable(doc, {
        ...tableOptions,
        startY: cursorY,
        head: [['Metrik', 'Nilai']],
        body: [
          ['Total judul koleksi', String(report.collection.totalTitles)],
          ['Total eksemplar fisik', String(report.collection.totalCopies)],
          ['Tersedia di rak', String(report.collection.availableCopies)],
          ['Sedang dipinjam', String(report.collection.borrowedCopies)],
          ['Judul dengan versi digital', String(report.collection.digitalTitles)],
          ['Judul hanya fisik', String(report.collection.physicalOnlyTitles)],
          ['Transaksi pinjam pada periode', String(report.periodLoans.length)],
          ['Eksemplar dipinjam pada periode', String(report.totalBorrowedCopies)],
          ['Peminjaman aktif saat ini', String(report.activeLoans.length)],
          ['Terlambat aktif', String(report.overdueActive.length)],
          ['Mendekati jatuh tempo (H-1)', String(report.dueSoonActive.length)],
          [
            'Ketepatan waktu pengembalian',
            `${report.onTimeRate}% (${report.onTimeReturns}/${report.returnedPeriod.length})`
          ]
        ],
        columnStyles: { 0: { cellWidth: 85 }, 1: { cellWidth: 40 } }
      });
      cursorY = doc.lastAutoTable.finalY + 9;

      heading('2. BUKU PALING BANYAK DIPINJAM');
      autoTable(doc, {
        ...tableOptions,
        startY: cursorY,
        head: [['No', 'Kode', 'Judul', 'Penulis', 'Transaksi', 'Eksemplar']],
        body:
          report.popularBooks.length > 0
            ? report.popularBooks.slice(0, 12).map((book, index) => [
                index + 1,
                book.kodeBuku,
                book.title,
                book.author,
                book.loans,
                book.copies
              ])
            : [['-', '-', 'Belum ada peminjaman pada periode ini', '-', '-', '-']],
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 22 },
          2: { cellWidth: 62 },
          3: { cellWidth: 40 },
          4: { cellWidth: 18, halign: 'center' },
          5: { cellWidth: 18, halign: 'center' }
        }
      });
      cursorY = doc.lastAutoTable.finalY + 9;

      heading('3. KOMPOSISI KOLEKSI FISIK & DIGITAL');
      autoTable(doc, {
        ...tableOptions,
        startY: cursorY,
        head: [['Kategori', 'Judul', 'Eksemplar', 'Tersedia', 'Digital']],
        body: report.categoryBreakdown.map((row) => [
          `${row.category} (${row.indo})`,
          row.titles,
          row.copies,
          row.available,
          row.digital
        ]),
        foot: [
          [
            'TOTAL',
            report.collection.totalTitles,
            report.collection.totalCopies,
            report.collection.availableCopies,
            report.collection.digitalTitles
          ]
        ],
        footStyles: {
          fillColor: [212, 175, 55],
          textColor: [20, 18, 14],
          fontStyle: 'bold'
        }
      });
      cursorY = doc.lastAutoTable.finalY + 9;

      heading('4. STATISTIK PEMINJAMAN PER JENJANG');
      autoTable(doc, {
        ...tableOptions,
        startY: cursorY,
        head: [['Jenjang', 'Transaksi', 'Eksemplar', 'Aktif', 'Terlambat', 'Selesai']],
        body:
          report.levelStats.length > 0
            ? report.levelStats.map((row) => [
                row.level,
                row.loans,
                row.copies,
                row.active,
                row.overdue,
                row.returned
              ])
            : [['-', 0, 0, 0, 0, 0]]
      });
      cursorY = doc.lastAutoTable.finalY + 9;

      heading('5. STATISTIK PEMINJAMAN PER KELAS');
      autoTable(doc, {
        ...tableOptions,
        startY: cursorY,
        head: [['Kelas', 'Jenjang', 'Transaksi', 'Eksemplar', 'Aktif', 'Terlambat']],
        body:
          report.classStats.length > 0
            ? report.classStats.map((row) => [
                row.className,
                row.level,
                row.loans,
                row.copies,
                row.active,
                row.overdue
              ])
            : [['-', '-', 0, 0, 0, 0]]
      });
      cursorY = doc.lastAutoTable.finalY + 9;

      heading('6. REKAP KETERLAMBATAN PENGEMBALIAN');
      autoTable(doc, {
        ...tableOptions,
        startY: cursorY,
        head: [['Peminjam', 'Kelas', 'Buku', 'Jatuh Tempo', 'Terlambat']],
        body:
          report.lateRows.length > 0
            ? report.lateRows.slice(0, 25).map((row) => [
                row.borrowerName,
                row.className,
                row.bookTitle,
                formatDateID(row.dueDate),
                `${row.lateDays} hari`
              ])
            : [['-', '-', 'Tidak ada keterlambatan pada periode ini', '-', '-']],
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 30 },
          2: { cellWidth: 60 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25, halign: 'center' }
        }
      });

      const pageCount = doc.getNumberOfPages();
      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(130, 120, 110);
        doc.text(
          `${LIBRARY_NAME} - Laporan ${periodLabel}`,
          14,
          doc.internal.pageSize.getHeight() - 8
        );
        doc.text(
          `Halaman ${page} dari ${pageCount}`,
          pageWidth - 14,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'right' }
        );
      }

      doc.save(`Laporan-Perpustakaan-${monthKey || 'Semua-Periode'}.pdf`);
    } catch (error) {
      console.error('Gagal mengekspor PDF:', error);
      alert('Gagal membuat file PDF. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const maxPopularCopies = report.popularBooks[0]?.copies || 1;
  const maxLevelCopies = Math.max(...report.levelStats.map((row) => row.copies), 1);

  return (
    <section className="space-y-6">
      <div className="parchment-card rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="border-b border-[#D4AF37]/20 pb-4 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-cinzel font-bold bg-purple-500/15 text-purple-300 border border-purple-500/40">
              <BarChart3 className="w-3 h-3" />
              LAPORAN BULANAN &amp; AKREDITASI
            </div>
            <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-[#F4E8C1] mt-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#D4AF37]" />
              <span>Rekap Operasional Perpustakaan</span>
            </h2>
            <p className="text-xs text-[#A89F91] mt-1 max-w-2xl leading-relaxed">
              Statistik popularitas buku, komposisi koleksi fisik/digital, peminjaman per kelas dan
              jenjang, serta rekap keterlambatan. Unduh dalam satu klik untuk rapat atau akreditasi.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={monthKey}
              onChange={(event) => setMonthKey(event.target.value)}
              className="px-3 py-2.5 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/35 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37] min-w-[170px]"
            >
              <option value="">Semua Periode</option>
              {monthOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="px-3.5 py-2.5 rounded-xl text-xs font-cinzel font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/45 hover:bg-emerald-500/25 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Ekspor Excel
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-3.5 py-2.5 rounded-xl text-xs font-cinzel font-bold bg-purple-500/15 text-purple-300 border border-purple-500/45 hover:bg-purple-500/25 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Ekspor PDF
            </button>
          </div>
        </div>

        {/* Ringkasan */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="p-3 rounded-xl bg-black/35 border border-white/10">
            <span className="text-[10px] text-[#A89F91] block">Total Judul</span>
            <span className="font-cinzel text-xl font-bold text-[#D4AF37]">{report.collection.totalTitles}</span>
          </div>
          <div className="p-3 rounded-xl bg-black/35 border border-white/10">
            <span className="text-[10px] text-[#A89F91] block">Total Eksemplar</span>
            <span className="font-cinzel text-xl font-bold text-[#F4E8C1]">{report.collection.totalCopies}</span>
          </div>
          <div className="p-3 rounded-xl bg-black/35 border border-white/10">
            <span className="text-[10px] text-[#A89F91] block">Pinjaman Periode</span>
            <span className="font-cinzel text-xl font-bold text-sky-300">{report.periodLoans.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-black/35 border border-white/10">
            <span className="text-[10px] text-[#A89F91] block">Aktif</span>
            <span className="font-cinzel text-xl font-bold text-emerald-300">{report.activeLoans.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-black/35 border border-rose-500/25">
            <span className="text-[10px] text-[#A89F91] block">Terlambat</span>
            <span className="font-cinzel text-xl font-bold text-rose-300">{report.overdueActive.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-black/35 border border-white/10">
            <span className="text-[10px] text-[#A89F91] block">Tepat Waktu</span>
            <span className="font-cinzel text-xl font-bold text-emerald-300">{report.onTimeRate}%</span>
          </div>
        </div>

        {report.dueSoonActive.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/35 text-[11px] text-amber-300 flex items-start gap-2">
            <Clock className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>{report.dueSoonActive.length} peminjaman</strong> mendekati jatuh tempo (H-1/hari ini).
              Buka tab Sirkulasi untuk mengirim pengingat WhatsApp.
            </span>
          </div>
        )}
      </div>

      {/* Buku populer & komposisi koleksi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="parchment-card rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-[#D4AF37]/15 pb-3">
            <h3 className="font-cinzel font-bold text-sm text-[#F4E8C1] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
              Buku Paling Banyak Dipinjam
            </h3>
            <span className="text-[10px] text-[#A89F91]">{periodLabel}</span>
          </div>

          {report.popularBooks.length === 0 ? (
            <p className="text-xs text-[#A89F91] text-center py-8">
              Belum ada transaksi peminjaman pada periode ini.
            </p>
          ) : (
            <div className="space-y-2.5">
              {report.popularBooks.slice(0, 8).map((book, index) => (
                <div key={`${book.bookId}-${index}`} className="space-y-1">
                  <div className="flex items-start justify-between gap-2 text-[11px]">
                    <div className="flex items-start gap-2 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0 ${
                          index === 0
                            ? 'bg-[#D4AF37] text-[#12100E]'
                            : index === 1
                            ? 'bg-slate-400 text-[#12100E]'
                            : index === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-white/10 text-[#A89F91]'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#F4E8C1] truncate">{book.title}</p>
                        <p className="text-[9px] text-[#A89F91]">
                          {book.kodeBuku} &bull; {book.author}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#D4AF37] shrink-0">
                      {book.copies} eks.
                    </span>
                  </div>
                  <div className="ml-7 h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#D4AF37]"
                      style={{ width: `${Math.max(6, (book.copies / maxPopularCopies) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="parchment-card rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-[#D4AF37]/15 pb-3">
            <h3 className="font-cinzel font-bold text-sm text-[#F4E8C1] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Koleksi Fisik vs Digital
            </h3>
            <span className="text-[10px] text-[#A89F91]">Total saat ini</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
              <span className="text-[10px] text-emerald-300 block">Judul Fisik</span>
              <span className="font-cinzel text-xl font-bold text-emerald-300">
                {report.collection.totalTitles - report.collection.digitalTitles}
              </span>
              <span className="block text-[9px] text-[#A89F91] mt-0.5">hanya tersedia di rak</span>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25">
              <span className="text-[10px] text-purple-300 block">Judul Digital</span>
              <span className="font-cinzel text-xl font-bold text-purple-300">
                {report.collection.digitalTitles}
              </span>
              <span className="block text-[9px] text-[#A89F91] mt-0.5">punya PDF / e-book</span>
            </div>
          </div>

          <div className="space-y-1.5 text-[10px]">
            <div className="flex justify-between text-[#A89F91]">
              <span>Eksemplar tersedia di rak</span>
              <strong className="text-[#F4E8C1]">
                {report.collection.availableCopies} / {report.collection.totalCopies}
              </strong>
            </div>
            <div className="h-2 bg-black/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-400"
                style={{
                  width: `${
                    report.collection.totalCopies
                      ? Math.round(
                          (report.collection.availableCopies / report.collection.totalCopies) * 100
                        )
                      : 0
                  }%`
                }}
              />
            </div>
            <div className="flex justify-between text-[#A89F91] pt-1">
              <span>Sedang dipinjam</span>
              <strong className="text-amber-300">{report.collection.borrowedCopies} eksemplar</strong>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 space-y-1.5 max-h-40 overflow-y-auto">
            {report.categoryBreakdown.map((row) => (
              <div key={row.category} className="flex items-center justify-between gap-2 text-[10px]">
                <span className="text-[#A89F91] truncate">
                  {row.category} <span className="text-[#A89F91]/60">({row.indo})</span>
                </span>
                <span className="text-[#F4E8C1] shrink-0">
                  {row.titles} judul &bull; {row.copies} eks.
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per jenjang & per kelas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="parchment-card rounded-2xl p-5 sm:p-6 space-y-4">
          <h3 className="font-cinzel font-bold text-sm text-[#F4E8C1] flex items-center gap-2 border-b border-[#D4AF37]/15 pb-3">
            <Users className="w-4 h-4 text-sky-400" />
            Per Jenjang
          </h3>
          {report.levelStats.length === 0 ? (
            <p className="text-xs text-[#A89F91] text-center py-6">Belum ada data.</p>
          ) : (
            <div className="space-y-3">
              {report.levelStats.map((row) => (
                <div key={row.level}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-semibold text-[#F4E8C1]">Jenjang {row.level}</span>
                    <span className="text-[#A89F91]">{row.copies} eks.</span>
                  </div>
                  <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"
                      style={{ width: `${Math.max(4, (row.copies / maxLevelCopies) * 100)}%` }}
                    />
                  </div>
                  <div className="flex gap-3 text-[9px] text-[#A89F91] mt-1">
                    <span>{row.loans} transaksi</span>
                    <span className="text-emerald-300">{row.active} aktif</span>
                    <span className="text-rose-300">{row.overdue} terlambat</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 parchment-card rounded-2xl p-5 sm:p-6 space-y-3">
          <h3 className="font-cinzel font-bold text-sm text-[#F4E8C1] flex items-center gap-2 border-b border-[#D4AF37]/15 pb-3">
            <BarChart3 className="w-4 h-4 text-[#D4AF37]" />
            Statistik Peminjaman per Kelas
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] sm:text-xs">
              <thead>
                <tr className="border-b border-[#D4AF37]/20 text-[#D4AF37] font-cinzel">
                  <th className="py-2 px-2">Kelas</th>
                  <th className="py-2 px-2">Jenjang</th>
                  <th className="py-2 px-2 text-center">Transaksi</th>
                  <th className="py-2 px-2 text-center">Eksemplar</th>
                  <th className="py-2 px-2 text-center">Aktif</th>
                  <th className="py-2 px-2 text-center">Terlambat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {report.classStats.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-[#A89F91]">
                      Belum ada data peminjaman pada periode ini.
                    </td>
                  </tr>
                ) : (
                  report.classStats.map((row) => (
                    <tr key={row.className} className="hover:bg-white/5">
                      <td className="py-2 px-2 font-semibold text-[#F4E8C1]">{row.className}</td>
                      <td className="py-2 px-2 text-[#A89F91]">{row.level}</td>
                      <td className="py-2 px-2 text-center text-[#F4E8C1]">{row.loans}</td>
                      <td className="py-2 px-2 text-center font-bold text-[#D4AF37]">{row.copies}</td>
                      <td className="py-2 px-2 text-center text-emerald-300">{row.active}</td>
                      <td className="py-2 px-2 text-center text-rose-300">{row.overdue}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Keterlambatan */}
      <div className="parchment-card rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D4AF37]/15 pb-3">
          <h3 className="font-cinzel font-bold text-sm text-[#F4E8C1] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            Rekap Keterlambatan Pengembalian
          </h3>
          <span className="text-[10px] text-[#A89F91]">
            {report.lateRows.length} catatan &bull; {report.overdueActive.length} masih aktif
          </span>
        </div>

        {report.lateRows.length === 0 ? (
          <div className="p-6 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
            <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
            <p className="text-xs text-emerald-300 mt-2">
              Tidak ada keterlambatan pada periode ini. Seluruh pengembalian tepat waktu.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] sm:text-xs">
              <thead>
                <tr className="border-b border-[#D4AF37]/20 text-[#D4AF37] font-cinzel">
                  <th className="py-2 px-2">Peminjam</th>
                  <th className="py-2 px-2">Kelas</th>
                  <th className="py-2 px-2">Buku</th>
                  <th className="py-2 px-2">Jatuh Tempo</th>
                  <th className="py-2 px-2 text-center">Terlambat</th>
                  <th className="py-2 px-2 text-center">Status</th>
                  <th className="py-2 px-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {report.lateRows.map((row) => (
                  <tr key={row.id} className="hover:bg-white/5">
                    <td className="py-2 px-2 text-[#F4E8C1] font-semibold">{row.borrowerName}</td>
                    <td className="py-2 px-2 text-[#A89F91]">{row.className}</td>
                    <td className="py-2 px-2 text-[#F4E8C1] max-w-[220px] truncate">{row.bookTitle}</td>
                    <td className="py-2 px-2 text-[#A89F91] whitespace-nowrap">
                      {formatDateID(row.dueDate)}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold">
                        {row.lateDays} hari
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full border ${row.timing.badgeClass}`}>
                        {row.timing.shortLabel}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right">
                      {onOpenReminder && (row.status === 'approved' || row.status === 'active') ? (
                        <button
                          type="button"
                          onClick={() => onOpenReminder(row)}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/40 hover:bg-[#25D366]/25 transition-colors inline-flex items-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3" />
                          Ingatkan
                        </button>
                      ) : (
                        <span className="text-[9px] text-[#A89F91]">Selesai</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="p-3 rounded-xl bg-black/25 border border-white/10 text-[10px] text-[#A89F91] flex items-start gap-2">
        <CalendarDays className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
        <span>
          Laporan dihitung dari tanggal pinjam pada periode terpilih. Data popularitas mencakup
          transaksi yang disetujui, aktif, dan sudah dikembalikan; pengajuan yang ditolak tidak dihitung.
          Persentase ketepatan waktu dihitung dari pengembalian pada periode ini.
        </span>
      </div>
    </section>
  );
}
