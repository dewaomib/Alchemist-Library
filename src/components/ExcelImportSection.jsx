import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Sparkles,
  Layers,
  ArrowRight,
  Database,
  RefreshCw,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';

// Exact template column definitions required
const TEMPLATE_COLUMNS = [
  'Kode_Buku',
  'Judul_Buku',
  'Penulis',
  'Penerbit',
  'Tahun_Terbit',
  'Kategori',
  'Stok_Fisik',
  'Link_Cover',
  'Link_PDF'
];

// Sample template rows demonstrating both physical-only and digital PDF books
const SAMPLE_TEMPLATE_ROWS = [
  {
    Kode_Buku: 'BK-LIT-001',
    Judul_Buku: 'Laskar Pelangi: Edisi Khusus Cendekiawan',
    Penulis: 'Andrea Hirata',
    Penerbit: 'Bentang Pustaka',
    Tahun_Terbit: 2005,
    Kategori: "Bard's Tales",
    Stok_Fisik: 5,
    Link_Cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
    Link_PDF: 'https://drive.google.com/file/d/1SampleDriveIdLaskarPelangi/view'
  },
  {
    Kode_Buku: 'BK-SCI-002',
    Judul_Buku: 'Fisika Eksperimental & Mekanika Fluida',
    Penulis: 'Dr. Bambang Subagyo',
    Penerbit: 'Erlangga Mandiri',
    Tahun_Terbit: 2022,
    Kategori: 'Alchemy',
    Stok_Fisik: 8,
    Link_Cover: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400',
    Link_PDF: '' // Contoh buku fisik saja (tanpa PDF)
  },
  {
    Kode_Buku: 'BK-KOM-003',
    Judul_Buku: 'Logika Algoritma & Pemrograman Berorientasi Objek',
    Penulis: 'Rinaldi Munir',
    Penerbit: 'Informatika Bandung',
    Tahun_Terbit: 2021,
    Kategori: "Artificer's Craft",
    Stok_Fisik: 4,
    Link_Cover: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400',
    Link_PDF: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  {
    Kode_Buku: 'BK-HIS-004',
    Judul_Buku: 'Sejarah Peradaban Maritim Nusantara',
    Penulis: 'Prof. A. B. Lapian',
    Penerbit: 'Komunitas Bambu',
    Tahun_Terbit: 2019,
    Kategori: 'Ancient Lore',
    Stok_Fisik: 6,
    Link_Cover: '',
    Link_PDF: '' // Hanya fisik
  }
];

export default function ExcelImportSection({
  existingBooks = [],
  onImportBooks,
  isProcessing = false
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [parseError, setParseError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // 1. Download Template as .xlsx
  const handleDownloadXlsxTemplate = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(SAMPLE_TEMPLATE_ROWS, {
        header: TEMPLATE_COLUMNS
      });

      // Set column widths for readability
      worksheet['!cols'] = [
        { wch: 15 }, // Kode_Buku
        { wch: 35 }, // Judul_Buku
        { wch: 22 }, // Penulis
        { wch: 20 }, // Penerbit
        { wch: 14 }, // Tahun_Terbit
        { wch: 18 }, // Kategori
        { wch: 12 }, // Stok_Fisik
        { wch: 35 }, // Link_Cover
        { wch: 45 }  // Link_PDF
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Buku_Perpustakaan');

      XLSX.writeFile(workbook, 'Template_Import_Buku_Perpustakaan.xlsx');
    } catch (err) {
      console.error('Error downloading xlsx template:', err);
    }
  };

  // 2. Download Template as .csv (with UTF-8 BOM)
  const handleDownloadCsvTemplate = () => {
    try {
      const headerRow = TEMPLATE_COLUMNS.join(',');
      const rows = SAMPLE_TEMPLATE_ROWS.map((r) =>
        [
          `"${r.Kode_Buku}"`,
          `"${r.Judul_Buku.replace(/"/g, '""')}"`,
          `"${r.Penulis.replace(/"/g, '""')}"`,
          `"${r.Penerbit.replace(/"/g, '""')}"`,
          r.Tahun_Terbit,
          `"${r.Kategori}"`,
          r.Stok_Fisik,
          `"${r.Link_Cover}"`,
          `"${r.Link_PDF}"`
        ].join(',')
      );

      const csvContent = '\uFEFF' + [headerRow, ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Template_Import_Buku_Perpustakaan.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading csv template:', err);
    }
  };

  // Helper to extract value from row irrespective of column casing/spaces
  const getFieldValue = (row, fieldName) => {
    // 1. Direct match
    if (row[fieldName] !== undefined && row[fieldName] !== '') return row[fieldName];

    // 2. Case-insensitive & normalized search
    const cleanTarget = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const key of Object.keys(row)) {
      const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanKey === cleanTarget) {
        return row[key];
      }
    }

    return '';
  };

  // 3. Process Uploaded File
  const processFile = (file) => {
    setParseError('');
    setSelectedFile(file);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target.result;
        const workbook = XLSX.read(buffer, { type: 'array' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('Berkas Excel kosong atau tidak memiliki lembar kerja (worksheet).');
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawJson = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('Tidak ada data baris yang ditemukan di dalam lembar kerja.');
        }

        // Map existing book codes for fast lookup to detect APPEND vs UPDATE
        const existingCodesSet = new Set(
          existingBooks.map((b) => (b.kodeBuku || b.id || '').toLowerCase().trim())
        );

        const parsedList = [];

        rawJson.forEach((row, idx) => {
          const judul = String(getFieldValue(row, 'Judul_Buku') || getFieldValue(row, 'Judul') || '').trim();
          if (!judul) return; // Skip completely empty rows

          const rawKode = String(getFieldValue(row, 'Kode_Buku') || getFieldValue(row, 'Kode') || '').trim();
          const kodeBuku = rawKode || `BK-IMP-${Date.now()}-${idx + 1}`;
          const penulis = String(getFieldValue(row, 'Penulis') || getFieldValue(row, 'Author') || 'Mpu Anonim').trim();
          const penerbit = String(getFieldValue(row, 'Penerbit') || getFieldValue(row, 'Publisher') || 'Pustaka Nusantara').trim();
          const tahunRaw = parseInt(getFieldValue(row, 'Tahun_Terbit') || getFieldValue(row, 'Tahun') || '2024', 10);
          const tahunTerbit = isNaN(tahunRaw) ? 2024 : tahunRaw;
          const kategori = String(getFieldValue(row, 'Kategori') || getFieldValue(row, 'Category') || 'Alchemy').trim();
          const stokRaw = parseInt(getFieldValue(row, 'Stok_Fisik') || getFieldValue(row, 'Stok') || '5', 10);
          const stokFisik = isNaN(stokRaw) || stokRaw < 0 ? 0 : stokRaw;
          const linkCover = String(getFieldValue(row, 'Link_Cover') || getFieldValue(row, 'Cover') || '').trim();
          const linkPdf = String(getFieldValue(row, 'Link_PDF') || getFieldValue(row, 'PDF') || '').trim();

          const isExisting = existingCodesSet.has(kodeBuku.toLowerCase());

          parsedList.push({
            id: kodeBuku,
            kodeBuku,
            title: judul,
            subtitle: `Manuskrip ${kategori} • Terbitan ${penerbit}`,
            author: penulis,
            publisher: penerbit,
            publicationYear: tahunTerbit,
            category: kategori,
            categoryLabel: `${kategori} (Pustaka Sekolah)`,
            totalStock: stokFisik,
            availableStock: stokFisik,
            status: stokFisik > 0 ? 'available' : 'borrowed',
            available: stokFisik > 0,
            coverUrl: linkCover || null,
            pdfUrl: linkPdf || null,
            hasDigital: Boolean(linkPdf),
            shelf: `Rak ${kategori.slice(0, 15)} • Lemari Sentral`,
            isbn: `978-602-${Math.floor(100 + Math.random() * 899)}-${Math.floor(100 + Math.random() * 899)}`,
            pages: 250 + Math.floor(Math.random() * 200),
            xpReward: 100,
            rating: 5.0,
            synopsis: `Buku pustaka sekolah "${judul}" karya ${penulis}, diterbitkan oleh ${penerbit} pada tahun ${tahunTerbit}. Tersedia di rak perpustakaan sekolah.${linkPdf ? ' E-book versi digital dapat dibaca langsung melalui aplikasi.' : ''}`,
            reviews: [],
            isUpdate: isExisting
          });
        });

        if (parsedList.length === 0) {
          throw new Error('Tidak ditemukan baris buku yang valid. Pastikan kolom "Judul_Buku" terisi.');
        }

        setParsedRows(parsedList);
      } catch (err) {
        console.error('Error parsing file:', err);
        setParseError(err.message || 'Gagal membaca berkas Excel. Pastikan format sesuai template.');
        setParsedRows([]);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setParseError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;
    onImportBooks(parsedRows);
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#10B981', '#8B5CF6']
      });
    } catch {}
    handleClear();
  };

  const newCount = parsedRows.filter((r) => !r.isUpdate).length;
  const updateCount = parsedRows.filter((r) => r.isUpdate).length;

  return (
    <div className="space-y-6">
      {/* SECTION HEADER */}
      <div className="border-b border-[#D4AF37]/20 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#D4AF37] font-cinzel tracking-widest uppercase">
            <FileSpreadsheet className="w-4 h-4" />
            <span>BULK DATA INGESTION • EXCEL &amp; CSV</span>
          </div>
          <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-[#F4E8C1] mt-0.5">
            Import Buku Excel Massal (Bulk Import)
          </h2>
          <p className="text-xs text-[#A89F91] mt-1 max-w-2xl leading-relaxed">
            Unduh format template, isi daftar buku perpustakaan sekolah, lalu unggah berkas untuk memasukkan puluhan hingga ratusan buku secara otomatis ke database tanpa merusak data lama.
          </p>
        </div>

        {/* Template Download Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadXlsxTemplate}
            className="px-4 py-2 rounded-xl font-cinzel font-semibold text-xs bg-[#1E1916] border border-[#D4AF37]/40 hover:bg-[#D4AF37]/15 text-[#F4E8C1] transition-all flex items-center gap-2 shadow-sm"
            title="Download Template Format .xlsx untuk Microsoft Excel"
          >
            <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Download Template (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCsvTemplate}
            className="px-3.5 py-2 rounded-xl font-cinzel font-semibold text-xs bg-[#1E1916] border border-white/10 hover:border-[#D4AF37]/40 text-[#A89F91] hover:text-[#F4E8C1] transition-all flex items-center gap-1.5"
            title="Download Template Format .csv untuk Google Sheets / Text Editor"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* TEMPLATE FORMAT GUIDE */}
      <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-[#D4AF37] font-cinzel font-bold">
          <Info className="w-4 h-4" />
          <span>Panduan Format Kolom Template Excel:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px] text-[#A89F91] pt-1">
          <div className="p-2 rounded-lg bg-[#12100E] border border-white/5">
            <strong className="text-[#F4E8C1]">1. Kode_Buku:</strong> ID/Kode unik buku (misal: <code>BK-001</code>).
          </div>
          <div className="p-2 rounded-lg bg-[#12100E] border border-white/5">
            <strong className="text-[#F4E8C1]">2. Judul_Buku:</strong> Judul lengkap buku (Wajib diisi).
          </div>
          <div className="p-2 rounded-lg bg-[#12100E] border border-white/5">
            <strong className="text-[#F4E8C1]">3. Penulis:</strong> Nama pengarang/penulis buku.
          </div>
          <div className="p-2 rounded-lg bg-[#12100E] border border-white/5">
            <strong className="text-[#F4E8C1]">4. Penerbit:</strong> Nama penerbit (misal: Erlangga, Balai Pustaka).
          </div>
          <div className="p-2 rounded-lg bg-[#12100E] border border-white/5">
            <strong className="text-[#F4E8C1]">5. Tahun_Terbit:</strong> Tahun rilis buku (angka misal: <code>2023</code>).
          </div>
          <div className="p-2 rounded-lg bg-[#12100E] border border-white/5">
            <strong className="text-[#F4E8C1]">6. Kategori:</strong> Cabang keilmuan / genre buku.
          </div>
          <div className="p-2 rounded-lg bg-[#12100E] border border-white/5">
            <strong className="text-[#F4E8C1]">7. Stok_Fisik:</strong> Jumlah eksemplar fisik di rak sekolah.
          </div>
          <div className="p-2 rounded-lg bg-[#12100E] border border-white/5">
            <strong className="text-[#F4E8C1]">8. Link_Cover:</strong> Link URL gambar cover (Google Drive / Web).
          </div>
          <div className="p-2 rounded-lg bg-[#12100E] border border-white/5">
            <strong className="text-[#F4E8C1]">9. Link_PDF:</strong> Link URL PDF e-book (kosongkan jika hanya ada fisik).
          </div>
        </div>
      </div>

      {/* DROPZONE / FILE UPLOAD */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
          isDragging
            ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
            : 'border-[#D4AF37]/35 bg-[#171311] hover:border-[#D4AF37] hover:bg-[#1E1916]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
          <Upload className="w-7 h-7" />
        </div>

        <div>
          <h3 className="font-cinzel font-bold text-base text-[#F4E8C1]">
            {selectedFile ? selectedFile.name : 'Pilih Berkas Excel atau Seret ke Sini'}
          </h3>
          <p className="text-xs text-[#A89F91] mt-0.5">
            Mendukung format berkas <strong>.xlsx</strong>, <strong>.xls</strong>, dan <strong>.csv</strong>
          </p>
        </div>

        {selectedFile && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Berkas siap diproses • {(selectedFile.size / 1024).toFixed(1)} KB</span>
          </div>
        )}
      </div>

      {/* ERROR NOTICE */}
      {parseError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{parseError}</span>
        </div>
      )}

      {/* PREVIEW TABLE OF PARSED ROWS */}
      {parsedRows.length > 0 && (
        <section className="space-y-4 pt-2 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#171311] p-4 rounded-xl border border-[#D4AF37]/25">
            <div>
              <h3 className="font-cinzel font-bold text-base text-[#F4E8C1] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#D4AF37]" />
                <span>Pratinjau Data Import ({parsedRows.length} Buku Terbaca)</span>
              </h3>
              <p className="text-xs text-[#A89F91] mt-0.5">
                Periksa data di bawah sebelum menyimpan ke database perpustakaan.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                +{newCount} Baru (Append)
              </span>
              {updateCount > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {updateCount} Update Stok
                </span>
              )}
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-lg text-[#A89F91] hover:text-[#F4E8C1] hover:bg-white/5"
                title="Batalkan Pilihan Berkas"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-80 overflow-y-auto border border-[#D4AF37]/20 rounded-xl bg-[#12100E]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#1E1916] z-10 border-b border-[#D4AF37]/20 text-[#D4AF37] font-cinzel">
                <tr>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Kode Buku</th>
                  <th className="py-2.5 px-3">Judul Buku</th>
                  <th className="py-2.5 px-3">Penulis</th>
                  <th className="py-2.5 px-3">Penerbit (Tahun)</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3 text-center">Stok Fisik</th>
                  <th className="py-2.5 px-3 text-center">Format</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {parsedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3">
                      {row.isUpdate ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Update
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Baru
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#D4AF37] font-semibold">
                      {row.kodeBuku}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#F4E8C1] max-w-[200px] truncate">
                      {row.title}
                    </td>
                    <td className="py-2.5 px-3 text-[#A89F91]">
                      {row.author}
                    </td>
                    <td className="py-2.5 px-3 text-[#A89F91]">
                      {row.publisher} ({row.publicationYear})
                    </td>
                    <td className="py-2.5 px-3 text-[#D4AF37]">
                      {row.category}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-400">
                      {row.totalStock}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.pdfUrl ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                          Ada PDF
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-500/20 text-slate-300 border border-slate-500/30">
                          Hanya Fisik
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CONFIRMATION IMPORT BUTTON */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-xs text-[#A89F91]">
              Sistem akan menambahkan <strong>{newCount}</strong> buku baru dan memperbarui <strong>{updateCount}</strong> buku tanpa menghapus data koleksi yang telah ada sebelumnya.
            </p>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmImport}
              className={`px-6 py-3 rounded-xl font-cinzel font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl transition-all ${
                isProcessing
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 cursor-wait'
                  : 'bg-gradient-to-r from-emerald-500 via-amber-500 to-emerald-600 text-[#12100E] hover:brightness-110'
              }`}
            >
              <Database className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>
                {isProcessing
                  ? 'Menyimpan ke Database...'
                  : `Simpan ${parsedRows.length} Buku ke Database Perpustakaan`}
              </span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
