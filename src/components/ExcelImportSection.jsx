import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Database,
  Info,
  BookOpen,
  Users
} from 'lucide-react';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import {
  JENJANG_OPTIONS,
  KELAS_BY_JENJANG,
  SMK_JURUSAN_OPTIONS,
  JENIS_BUKU_OPTIONS,
  normalizeJenjang,
  normalizeKelas,
  normalizeJurusan,
  normalizeJenisBuku,
  normalizeNisn
} from '../utils/libraryUtils';

// ==========================================
// 1. TEMPLATE KOLOM BUKU KURIKULUM BERTINGKAT
// ==========================================
const BOOK_TEMPLATE_COLUMNS = [
  'Kode_Buku',
  'Judul_Buku',
  'Penulis',
  'Penerbit',
  'Tahun_Terbit',
  'Jenjang',
  'Kelas',
  'Jurusan',
  'Jenis_Buku',
  'Kategori',
  'Stok_Fisik',
  'Link_Cover',
  'Link_PDF'
];

const SAMPLE_BOOK_TEMPLATE_ROWS = [
  {
    Kode_Buku: 'BK-TKJ-101',
    Judul_Buku: 'Dasar Sistem Komputer & Jaringan Dasar Kelas 10 TKJ',
    Penulis: 'Ir. Faisal Akbar, M.Kom.',
    Penerbit: 'Andi Offset',
    Tahun_Terbit: 2024,
    Jenjang: 'SMK',
    Kelas: '10',
    Jurusan: 'TKJ',
    Jenis_Buku: 'Buku Paket Wajib',
    Kategori: "Artificer's Craft",
    Stok_Fisik: 15,
    Link_Cover: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400',
    Link_PDF: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  {
    Kode_Buku: 'BK-TKJ-102',
    Judul_Buku: 'Modul Praktik Konfigurasi Mikrotik & Jaringan LAN Kelas 10',
    Penulis: 'Tim Produktif TKJ',
    Penerbit: 'Informatika Bandung',
    Tahun_Terbit: 2024,
    Jenjang: 'SMK',
    Kelas: '10',
    Jurusan: 'TKJ',
    Jenis_Buku: 'Modul Praktik',
    Kategori: "Artificer's Craft",
    Stok_Fisik: 12,
    Link_Cover: '',
    Link_PDF: ''
  },
  {
    Kode_Buku: 'BK-SMK-103',
    Judul_Buku: 'Matematika Kurikulum Merdeka SMK Kelas 10 (Muatan Nasional)',
    Penulis: 'Dr. Bambang Subagyo',
    Penerbit: 'Erlangga',
    Tahun_Terbit: 2024,
    Jenjang: 'SMK',
    Kelas: '10',
    Jurusan: 'Semua Jurusan',
    Jenis_Buku: 'Buku Paket Wajib',
    Kategori: 'Alchemy',
    Stok_Fisik: 25,
    Link_Cover: '',
    Link_PDF: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  {
    Kode_Buku: 'BK-BM-104',
    Judul_Buku: 'Pengantar Akuntansi & Manajemen Perkantoran Kelas 10 BM',
    Penulis: 'Dra. Ratna Sari, M.M.',
    Penerbit: 'Salemba Empat',
    Tahun_Terbit: 2023,
    Jenjang: 'SMK',
    Kelas: '10',
    Jurusan: 'BM',
    Jenis_Buku: 'Buku Paket Wajib',
    Kategori: 'Philosophy',
    Stok_Fisik: 14,
    Link_Cover: '',
    Link_PDF: ''
  },
  {
    Kode_Buku: 'BK-TKR-105',
    Judul_Buku: 'Modul Praktik Teknologi Dasar Otomotif & Mesin Kelas 10 TKR/TR',
    Penulis: 'Ir. Hendro Wibowo',
    Penerbit: 'Pustaka Otomotif',
    Tahun_Terbit: 2024,
    Jenjang: 'SMK',
    Kelas: '10',
    Jurusan: 'TKR/TR',
    Jenis_Buku: 'Modul Praktik',
    Kategori: "Artificer's Craft",
    Stok_Fisik: 10,
    Link_Cover: '',
    Link_PDF: ''
  },
  {
    Kode_Buku: 'BK-SMP-071',
    Judul_Buku: 'Ilmu Pengetahuan Alam (IPA) Terpadu SMP Kelas 7',
    Penulis: 'Prof. Sri Rahayu',
    Penerbit: 'Kemendikbudristek',
    Tahun_Terbit: 2023,
    Jenjang: 'SMP',
    Kelas: '7',
    Jurusan: 'Semua Jurusan',
    Jenis_Buku: 'Buku Paket Wajib',
    Kategori: 'Alchemy',
    Stok_Fisik: 20,
    Link_Cover: '',
    Link_PDF: ''
  }
];

// ==========================================
// 2. TEMPLATE KOLOM SISWA BERBASIS NISN & USERNAME
// ==========================================
const STUDENT_TEMPLATE_COLUMNS = [
  'NISN',
  'Nama_Lengkap',
  'Username',
  'Password',
  'Jenjang',
  'Kelas',
  'Jurusan'
];

const SAMPLE_STUDENT_TEMPLATE_ROWS = [
  {
    NISN: '0081234567',
    Nama_Lengkap: 'Reza Rahadian Putra',
    Username: 'reza.tkj10',
    Password: 'password123',
    Jenjang: 'SMK',
    Kelas: '10',
    Jurusan: 'TKJ'
  },
  {
    NISN: '0089876543',
    Nama_Lengkap: 'Putri Ayu Wulandari',
    Username: 'putri.bm10',
    Password: 'password123',
    Jenjang: 'SMK',
    Kelas: '10',
    Jurusan: 'BM'
  },
  {
    NISN: '0075554321',
    Nama_Lengkap: 'Rangga Pratama Saputra',
    Username: 'rangga.tkr11',
    Password: 'password123',
    Jenjang: 'SMK',
    Kelas: '11',
    Jurusan: 'TKR/TR'
  },
  {
    NISN: '0091122334',
    Nama_Lengkap: 'Zahra Aulia Rahma',
    Username: 'zahra.smp7',
    Password: 'password123',
    Jenjang: 'SMP',
    Kelas: '7',
    Jurusan: 'Semua Jurusan'
  }
];

export default function ExcelImportSection({
  existingBooks = [],
  existingMembers = [],
  onImportBooks,
  onImportMembers,
  isProcessing = false
}) {
  const [importType, setImportType] = useState('books'); // 'books' | 'students'
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedBookRows, setParsedBookRows] = useState([]);
  const [parsedStudentRows, setParsedStudentRows] = useState([]);
  const [parseError, setParseError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleClear = () => {
    setSelectedFile(null);
    setParsedBookRows([]);
    setParsedStudentRows([]);
    setParseError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Download Template .xlsx
  const handleDownloadXlsxTemplate = () => {
    try {
      if (importType === 'books') {
        const worksheet = XLSX.utils.json_to_sheet(SAMPLE_BOOK_TEMPLATE_ROWS, {
          header: BOOK_TEMPLATE_COLUMNS
        });
        worksheet['!cols'] = [
          { wch: 15 }, // Kode_Buku
          { wch: 42 }, // Judul_Buku
          { wch: 22 }, // Penulis
          { wch: 20 }, // Penerbit
          { wch: 13 }, // Tahun_Terbit
          { wch: 10 }, // Jenjang
          { wch: 10 }, // Kelas
          { wch: 16 }, // Jurusan
          { wch: 18 }, // Jenis_Buku
          { wch: 18 }, // Kategori
          { wch: 12 }, // Stok_Fisik
          { wch: 35 }, // Link_Cover
          { wch: 45 }  // Link_PDF
        ];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Buku_Kurikulum');
        XLSX.writeFile(workbook, 'Template_Import_Buku_Kurikulum.xlsx');
      } else {
        const worksheet = XLSX.utils.json_to_sheet(SAMPLE_STUDENT_TEMPLATE_ROWS, {
          header: STUDENT_TEMPLATE_COLUMNS
        });
        // Pastikan sel NISN diformat sebagai teks ('s') agar angka nol di awal (0081234567) tidak hilang di Excel
        SAMPLE_STUDENT_TEMPLATE_ROWS.forEach((row, index) => {
          const cellRef = `A${index + 2}`;
          if (worksheet[cellRef]) {
            worksheet[cellRef].t = 's';
            worksheet[cellRef].z = '@';
          }
        });
        worksheet['!cols'] = [
          { wch: 16 }, // NISN
          { wch: 28 }, // Nama_Lengkap
          { wch: 18 }, // Username
          { wch: 16 }, // Password
          { wch: 10 }, // Jenjang
          { wch: 10 }, // Kelas
          { wch: 16 }  // Jurusan
        ];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Siswa_NISN');
        XLSX.writeFile(workbook, 'Template_Import_Siswa_NISN.xlsx');
      }
    } catch (err) {
      console.error('Error downloading xlsx template:', err);
    }
  };

  // Download Template .csv
  const handleDownloadCsvTemplate = () => {
    try {
      if (importType === 'books') {
        const headerRow = BOOK_TEMPLATE_COLUMNS.join(',');
        const rows = SAMPLE_BOOK_TEMPLATE_ROWS.map((r) =>
          [
            `"${r.Kode_Buku}"`,
            `"${r.Judul_Buku.replace(/"/g, '""')}"`,
            `"${r.Penulis.replace(/"/g, '""')}"`,
            `"${r.Penerbit.replace(/"/g, '""')}"`,
            r.Tahun_Terbit,
            `"${r.Jenjang}"`,
            `"${r.Kelas}"`,
            `"${r.Jurusan}"`,
            `"${r.Jenis_Buku}"`,
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
        link.setAttribute('download', 'Template_Import_Buku_Kurikulum.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const headerRow = STUDENT_TEMPLATE_COLUMNS.join(',');
        const rows = SAMPLE_STUDENT_TEMPLATE_ROWS.map((r) =>
          [
            `"${r.NISN}"`,
            `"${r.Nama_Lengkap.replace(/"/g, '""')}"`,
            `"${r.Username}"`,
            `"${r.Password}"`,
            `"${r.Jenjang}"`,
            `"${r.Kelas}"`,
            `"${r.Jurusan}"`
          ].join(',')
        );
        const csvContent = '\uFEFF' + [headerRow, ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Template_Import_Siswa_NISN.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error downloading csv template:', err);
    }
  };

  const getFieldValue = (row, fieldName) => {
    if (row[fieldName] !== undefined && row[fieldName] !== '') return row[fieldName];
    const cleanTarget = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const key of Object.keys(row)) {
      const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanKey === cleanTarget) {
        return row[key];
      }
    }
    return '';
  };

  // Process Uploaded File (Books or Students)
  const processFile = (file) => {
    setParseError('');
    setSelectedFile(file);
    setParsedBookRows([]);
    setParsedStudentRows([]);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target.result;
        const workbook = XLSX.read(buffer, { type: 'array', raw: false });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('Berkas Excel kosong atau tidak memiliki lembar kerja (worksheet).');
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawJson = XLSX.utils.sheet_to_json(firstSheet, { defval: '', raw: false });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('Tidak ada data baris yang ditemukan di dalam lembar kerja.');
        }

        if (importType === 'books') {
          const existingCodesSet = new Set(
            existingBooks.map((b) => (b.kodeBuku || b.id || '').toLowerCase().trim())
          );

          const parsedList = [];

          rawJson.forEach((row, idx) => {
            const judul = String(
              getFieldValue(row, 'Judul_Buku') || getFieldValue(row, 'Judul') || ''
            ).trim();
            if (!judul) return;

            const rawKode = String(
              getFieldValue(row, 'Kode_Buku') || getFieldValue(row, 'Kode') || ''
            ).trim();
            const kodeBuku = rawKode || `BK-IMP-${Date.now()}-${idx + 1}`;
            const penulis = String(
              getFieldValue(row, 'Penulis') || getFieldValue(row, 'Author') || 'Tim Penyusun Kurikulum'
            ).trim();
            const penerbit = String(
              getFieldValue(row, 'Penerbit') || getFieldValue(row, 'Publisher') || 'Pustaka Sekolah'
            ).trim();
            const tahunRaw = parseInt(
              getFieldValue(row, 'Tahun_Terbit') || getFieldValue(row, 'Tahun') || '2024',
              10
            );
            const tahunTerbit = isNaN(tahunRaw) ? 2024 : tahunRaw;

            const rawJenjang = String(getFieldValue(row, 'Jenjang') || 'Umum').trim();
            const jenjang = normalizeJenjang(rawJenjang);

            const rawKelas = String(getFieldValue(row, 'Kelas') || '').trim();
            const kelas = normalizeKelas(rawKelas, jenjang);

            const rawJurusan = String(getFieldValue(row, 'Jurusan') || '').trim();
            const jurusan = normalizeJurusan(rawJurusan, jenjang);

            const rawJenisBuku = String(
              getFieldValue(row, 'Jenis_Buku') || getFieldValue(row, 'Jenis') || 'Buku Paket Wajib'
            ).trim();
            const jenisBuku = normalizeJenisBuku(rawJenisBuku);

            const kategori = String(
              getFieldValue(row, 'Kategori') || getFieldValue(row, 'Category') || 'Alchemy'
            ).trim();
            const stokRaw = parseInt(
              getFieldValue(row, 'Stok_Fisik') || getFieldValue(row, 'Stok') || '5',
              10
            );
            const stokFisik = isNaN(stokRaw) || stokRaw < 0 ? 0 : stokRaw;
            const linkCover = String(
              getFieldValue(row, 'Link_Cover') || getFieldValue(row, 'Cover') || ''
            ).trim();
            const linkPdf = String(
              getFieldValue(row, 'Link_PDF') || getFieldValue(row, 'PDF') || ''
            ).trim();

            const isExisting = existingCodesSet.has(kodeBuku.toLowerCase());

            parsedList.push({
              id: kodeBuku,
              kodeBuku,
              title: judul,
              subtitle: `${jenisBuku} • ${jenjang} Kelas ${kelas} (${jurusan})`,
              author: penulis,
              publisher: penerbit,
              publicationYear: tahunTerbit,
              jenjang,
              kelas,
              jurusan,
              jenisBuku,
              category: kategori,
              categoryLabel: `${kategori} (${jenjang} • ${jenisBuku})`,
              totalStock: stokFisik,
              availableStock: stokFisik,
              status: stokFisik > 0 ? 'available' : 'borrowed',
              available: stokFisik > 0,
              coverUrl: linkCover || null,
              pdfUrl: linkPdf || null,
              hasDigital: Boolean(linkPdf),
              shelf: `Rak ${jenjang} Kls ${kelas} • ${jurusan}`,
              isbn: `978-602-${Math.floor(100 + Math.random() * 899)}-${Math.floor(100 + Math.random() * 899)}`,
              pages: 240 + Math.floor(Math.random() * 180),
              xpReward: 110,
              rating: 5.0,
              synopsis: `${jenisBuku} "${judul}" untuk jenjang ${jenjang} Kelas ${kelas} (${jurusan}). Karya ${penulis}, diterbitkan oleh ${penerbit} (${tahunTerbit}).`,
              reviews: [],
              isUpdate: isExisting
            });
          });

          if (parsedList.length === 0) {
            throw new Error(
              'Tidak ditemukan baris buku yang valid. Pastikan kolom "Judul_Buku" terisi.'
            );
          }

          setParsedBookRows(parsedList);
        } else {
          // PARSE & VALIDATE STUDENT ROWS PER BARIS
          const existingNisnSet = new Set(
            existingMembers.map((m) => String(m.nisn || '').trim()).filter(Boolean)
          );
          const existingUsernameSet = new Set(
            existingMembers.map((m) => String(m.username || '').toLowerCase().trim()).filter(Boolean)
          );
          const seenNisnInFile = new Set();
          const seenUsernameInFile = new Set();

          const parsedStudents = [];

          rawJson.forEach((row, idx) => {
            const rawNisnVal = String(
              getFieldValue(row, 'NISN') || getFieldValue(row, 'Kode_Kartu') || ''
            ).trim();
            const rawName = String(
              getFieldValue(row, 'Nama_Lengkap') ||
                getFieldValue(row, 'Nama') ||
                getFieldValue(row, 'Name') ||
                ''
            ).trim();
            const rawUsername = String(getFieldValue(row, 'Username') || '').trim();
            const rawPassword = String(getFieldValue(row, 'Password') || '').trim();
            const rawJenjang = String(getFieldValue(row, 'Jenjang') || 'SMK')
              .trim()
              .toUpperCase();
            const rawKelas = String(getFieldValue(row, 'Kelas') || '10').trim();
            const rawJurusan = String(getFieldValue(row, 'Jurusan') || 'Semua Jurusan').trim();

            if (!rawNisnVal && !rawName && !rawUsername) return;

            const nisn = normalizeNisn(rawNisnVal);
            const username = rawUsername
              .toLowerCase()
              .replace(/\s+/g, '')
              .replace(/[^a-z0-9._-]/g, '');
            const name = rawName || username || `Siswa ${idx + 1}`;
            const password = rawPassword || 'password123';

            const errors = [];

            if (!nisn) {
              errors.push('NISN kosong');
            } else if (!/^\d{5,15}$/.test(nisn)) {
              errors.push('NISN harus berupa digit teks (5-15 karakter)');
            } else if (seenNisnInFile.has(nisn)) {
              errors.push('NISN duplikat di dalam file');
            }
            if (nisn) seenNisnInFile.add(nisn);

            if (!username || username.length < 3) {
              errors.push('Username minimal 3 karakter');
            } else if (seenUsernameInFile.has(username)) {
              errors.push('Username duplikat di dalam file');
            }
            if (username) seenUsernameInFile.add(username);

            if (!rawPassword || rawPassword.length < 4) {
              errors.push('Password minimal 4 karakter');
            }

            if (!['SMP', 'SMA', 'SMK'].includes(rawJenjang)) {
              errors.push(`Jenjang "${rawJenjang}" tidak valid (gunakan SMP, SMA, atau SMK)`);
            }

            const normJenjang = ['SMP', 'SMA', 'SMK'].includes(rawJenjang) ? rawJenjang : 'SMK';
            const allowedKelas = KELAS_BY_JENJANG[normJenjang] || ['10', '11', '12'];
            const normKelas = normalizeKelas(rawKelas, normJenjang);
            if (!allowedKelas.includes(String(rawKelas).replace(/[^0-9]/g, '') || normKelas)) {
              errors.push(`Kelas "${rawKelas}" tidak sesuai untuk jenjang ${normJenjang}`);
            }

            const normJurusan = normalizeJurusan(rawJurusan, normJenjang);
            const isUpdate =
              existingNisnSet.has(nisn) || existingUsernameSet.has(username);

            parsedStudents.push({
              rowNumber: idx + 2,
              id: `student-${nisn || Date.now()}-${idx}`,
              cardCode: nisn,
              nisn,
              name,
              username,
              password,
              role: 'siswa',
              jenjang: normJenjang,
              kelas: normKelas,
              jurusan: normJurusan,
              level: normKelas,
              className: `${normJenjang} Kelas ${normKelas}${
                normJenjang === 'SMK' ? ` ${normJurusan}` : ''
              }`,
              classLabel: `${normJenjang} • Kelas ${normKelas} • Jurusan ${normJurusan}`,
              avatar: '⚔️',
              color: '#10B981',
              isUpdate,
              isValid: errors.length === 0,
              errors
            });
          });

          if (parsedStudents.length === 0) {
            throw new Error(
              'Tidak ditemukan baris data siswa. Pastikan kolom NISN, Username, Password, Jenjang, Kelas, dan Jurusan terisi.'
            );
          }

          setParsedStudentRows(parsedStudents);
        }
      } catch (err) {
        console.error('Error parsing file:', err);
        setParseError(
          err.message || 'Gagal membaca berkas Excel. Pastikan format sesuai template.'
        );
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleConfirmBookImport = () => {
    if (parsedBookRows.length === 0) return;
    onImportBooks?.(parsedBookRows);
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

  const handleConfirmStudentImport = () => {
    const validStudents = parsedStudentRows.filter((r) => r.isValid);
    if (validStudents.length === 0) return;
    onImportMembers?.(validStudents);
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#D4AF37', '#38BDF8']
      });
    } catch {}
    handleClear();
  };

  const newBookCount = parsedBookRows.filter((r) => !r.isUpdate).length;
  const updateBookCount = parsedBookRows.filter((r) => r.isUpdate).length;

  const validStudentCount = parsedStudentRows.filter((r) => r.isValid).length;
  const invalidStudentCount = parsedStudentRows.filter((r) => !r.isValid).length;

  return (
    <div className="space-y-6">
      {/* MODE SWITCHER: IMPORT BUKU vs IMPORT SISWA (NISN & USERNAME) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D4AF37]/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#D4AF37] font-cinzel tracking-widest uppercase">
            <FileSpreadsheet className="w-4 h-4" />
            <span>BULK DATA INGESTION • KURIKULUM &amp; AKUN SISWA NISN</span>
          </div>
          <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-[#F4E8C1] mt-0.5">
            {importType === 'books'
              ? 'Import Koleksi Buku Kurikulum Bertingkat (Excel / CSV)'
              : 'Import Data Siswa & Akun NISN (Username & Password)'}
          </h2>
          <p className="text-xs text-[#A89F91] mt-1 max-w-2xl leading-relaxed">
            {importType === 'books'
              ? 'Mendukung atribut kurikulum bertingkat: Jenjang (SMP, SMA, SMK, Umum), Kelas (7-12), Jurusan (BM, TKR/TR, TKJ, Semua Jurusan), dan Jenis Buku.'
              : 'Mendukung kolom NISN (teks utuh dengan angka nol di awal seperti 0081234567), Username, Password, Jenjang, Kelas, dan Jurusan lengkap dengan validasi per baris.'}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-[#D4AF37]/25">
          <button
            type="button"
            onClick={() => {
              setImportType('books');
              handleClear();
            }}
            className={`px-3.5 py-2 rounded-lg font-cinzel font-bold text-xs flex items-center gap-1.5 transition-all ${
              importType === 'books'
                ? 'bg-[#D4AF37] text-[#12100E] shadow'
                : 'text-[#A89F91] hover:text-[#F4E8C1]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>1. Import Buku Kurikulum</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setImportType('students');
              handleClear();
            }}
            className={`px-3.5 py-2 rounded-lg font-cinzel font-bold text-xs flex items-center gap-1.5 transition-all ${
              importType === 'students'
                ? 'bg-emerald-500 text-[#12100E] shadow'
                : 'text-[#A89F91] hover:text-[#F4E8C1]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2. Import Siswa (NISN &amp; Username)</span>
          </button>
        </div>
      </div>

      {/* TEMPLATE DOWNLOAD BAR */}
      <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[#D4AF37] font-cinzel font-bold">
            <Info className="w-4 h-4" />
            <span>
              {importType === 'books'
                ? 'Format Kolom Template Buku Kurikulum (13 Kolom):'
                : 'Format Kolom Template Siswa Berbasis NISN (7 Kolom — Tanpa Email):'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadXlsxTemplate}
              className="px-4 py-2 rounded-xl font-cinzel font-semibold text-xs bg-[#1E1916] border border-[#D4AF37]/40 hover:bg-[#D4AF37]/15 text-[#F4E8C1] transition-all flex items-center gap-2 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>
                Download Template {importType === 'books' ? 'Buku' : 'Siswa'} (.xlsx)
              </span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCsvTemplate}
              className="px-3.5 py-2 rounded-xl font-cinzel font-semibold text-xs bg-[#1E1916] border border-white/10 hover:border-[#D4AF37]/40 text-[#A89F91] hover:text-[#F4E8C1] transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Template .CSV</span>
            </button>
          </div>
        </div>

        {importType === 'books' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] text-[#A89F91]">
            <div className="p-2 rounded-lg bg-[#12100E] border border-white/5">
              <strong className="text-[#F4E8C1]">Kode_Buku &amp; Judul_Buku:</strong> ID unik &amp; judul buku.
            </div>
            <div className="p-2 rounded-lg bg-[#12100E] border border-emerald-500/25">
              <strong className="text-emerald-300">Jenjang &amp; Kelas:</strong>{' '}
              <code>{JENJANG_OPTIONS.join(' / ')}</code> • Kelas <code>7-9</code>, <code>10-12</code>, <code>Semua</code>.
            </div>
            <div className="p-2 rounded-lg bg-[#12100E] border border-sky-500/25">
              <strong className="text-sky-300">Jurusan (SMK):</strong>{' '}
              <code>{SMK_JURUSAN_OPTIONS.join(' / ')}</code>.
            </div>
            <div className="p-2 rounded-lg bg-[#12100E] border border-purple-500/25">
              <strong className="text-purple-300">Jenis_Buku:</strong>{' '}
              <code>{JENIS_BUKU_OPTIONS.join(' / ')}</code>.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px] text-[#A89F91]">
            <div className="p-2 rounded-lg bg-[#12100E] border border-emerald-500/25">
              <strong className="text-emerald-300">1. NISN (Teks):</strong> Nomor Induk Siswa Nasional (angka 0 di awal seperti <code>0081234567</code> aman terjaga).
            </div>
            <div className="p-2 rounded-lg bg-[#12100E] border border-white/5">
              <strong className="text-[#F4E8C1]">2. Nama_Lengkap:</strong> Nama lengkap siswa pada kartu pelajar.
            </div>
            <div className="p-2 rounded-lg bg-[#12100E] border border-[#D4AF37]/25">
              <strong className="text-[#D4AF37]">3. Username &amp; 4. Password:</strong> Kredensial login siswa (tanpa email).
            </div>
            <div className="p-2 rounded-lg bg-[#12100E] border border-white/5">
              <strong className="text-[#F4E8C1]">5. Jenjang:</strong> <code>SMP</code>, <code>SMA</code>, atau <code>SMK</code>.
            </div>
            <div className="p-2 rounded-lg bg-[#12100E] border border-white/5">
              <strong className="text-[#F4E8C1]">6. Kelas:</strong> <code>7, 8, 9</code> (SMP) atau <code>10, 11, 12</code> (SMA/SMK).
            </div>
            <div className="p-2 rounded-lg bg-[#12100E] border border-sky-500/25">
              <strong className="text-sky-300">7. Jurusan:</strong> <code>TKJ</code>, <code>BM</code>, <code>TKR/TR</code>, atau <code>Semua Jurusan</code>.
            </div>
          </div>
        )}
      </div>

      {/* DROPZONE / FILE UPLOAD */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
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
            {selectedFile
              ? selectedFile.name
              : `Pilih Berkas Excel ${importType === 'books' ? 'Buku Kurikulum' : 'Data Siswa NISN'} atau Seret ke Sini`}
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

      {/* PREVIEW TABLE 1: PARSED BOOK ROWS */}
      {importType === 'books' && parsedBookRows.length > 0 && (
        <section className="space-y-4 pt-2 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#171311] p-4 rounded-xl border border-[#D4AF37]/25">
            <div>
              <h3 className="font-cinzel font-bold text-base text-[#F4E8C1] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#D4AF37]" />
                <span>Pratinjau Import Buku Kurikulum ({parsedBookRows.length} Baris)</span>
              </h3>
              <p className="text-xs text-[#A89F91] mt-0.5">
                Periksa pemetaan Jenjang, Kelas, Jurusan, dan Jenis Buku sebelum menyimpan ke database.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                +{newBookCount} Baru (Append)
              </span>
              {updateBookCount > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {updateBookCount} Update Stok
                </span>
              )}
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-lg text-[#A89F91] hover:text-[#F4E8C1] hover:bg-white/5"
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
                  <th className="py-2.5 px-3">Jenjang / Kelas</th>
                  <th className="py-2.5 px-3">Jurusan</th>
                  <th className="py-2.5 px-3">Jenis Buku</th>
                  <th className="py-2.5 px-3 text-center">Stok</th>
                  <th className="py-2.5 px-3 text-center">Format</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {parsedBookRows.map((row, idx) => (
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
                    <td className="py-2.5 px-3 font-semibold text-[#F4E8C1] max-w-[220px] truncate">
                      {row.title}
                      <span className="block text-[10px] text-[#A89F91] font-normal">
                        {row.author} • {row.publisher} ({row.publicationYear})
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                        {row.jenjang} • Kelas {row.kelas}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                        {row.jurusan}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-purple-300 font-medium">
                      {row.jenisBuku}
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
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-stone-800/70 text-[#A89F91] border border-[#D4AF37]/20">
                          Hanya Fisik
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-xs text-[#A89F91]">
              Sistem akan menambahkan <strong>{newBookCount}</strong> buku baru dan memperbarui{' '}
              <strong>{updateBookCount}</strong> buku tanpa menghapus koleksi lama.
            </p>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmBookImport}
              className="px-6 py-3 rounded-xl font-cinzel font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl transition-all bg-gradient-to-r from-emerald-500 via-amber-500 to-emerald-600 text-[#12100E] hover:brightness-110"
            >
              <Database className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>Simpan {parsedBookRows.length} Buku Kurikulum ke Database</span>
            </button>
          </div>
        </section>
      )}

      {/* PREVIEW TABLE 2: PARSED STUDENT ROWS WITH PER-ROW VALIDATION */}
      {importType === 'students' && parsedStudentRows.length > 0 && (
        <section className="space-y-4 pt-2 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#171311] p-4 rounded-xl border border-emerald-500/30">
            <div>
              <h3 className="font-cinzel font-bold text-base text-[#F4E8C1] flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Validasi Import Siswa per Baris ({parsedStudentRows.length} Siswa)</span>
              </h3>
              <p className="text-xs text-[#A89F91] mt-0.5">
                NISN disimpan sebagai teks utuh (angka nol di awal seperti 0081234567 terjaga). Akun langsung bisa login dengan Username &amp; Password.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {validStudentCount} Baris Valid
              </span>
              {invalidStudentCount > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  {invalidStudentCount} Baris Error
                </span>
              )}
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-lg text-[#A89F91] hover:text-[#F4E8C1] hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-80 overflow-y-auto border border-[#D4AF37]/20 rounded-xl bg-[#12100E]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#1E1916] z-10 border-b border-[#D4AF37]/20 text-[#D4AF37] font-cinzel">
                <tr>
                  <th className="py-2.5 px-3">Baris</th>
                  <th className="py-2.5 px-3">Validasi</th>
                  <th className="py-2.5 px-3">NISN (Teks)</th>
                  <th className="py-2.5 px-3">Nama Siswa</th>
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3">Jenjang &amp; Kelas</th>
                  <th className="py-2.5 px-3">Jurusan</th>
                  <th className="py-2.5 px-3">Keterangan Validasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {parsedStudentRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      row.isValid ? 'hover:bg-white/5' : 'bg-rose-950/20'
                    }`}
                  >
                    <td className="py-2.5 px-3 text-[#A89F91]">#{row.rowNumber}</td>
                    <td className="py-2.5 px-3">
                      {row.isValid ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {row.isUpdate ? 'Valid (Update)' : 'Valid (Baru)'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Error
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-300">
                      {row.nisn || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#F4E8C1]">{row.name}</td>
                    <td className="py-2.5 px-3 font-mono text-[#D4AF37]">@{row.username}</td>
                    <td className="py-2.5 px-3">
                      {row.jenjang} • Kelas {row.kelas}
                    </td>
                    <td className="py-2.5 px-3 text-sky-300">{row.jurusan}</td>
                    <td className="py-2.5 px-3">
                      {row.isValid ? (
                        <span className="text-emerald-400 text-[11px]">
                          Siap di-import &amp; aktif untuk scan NISN
                        </span>
                      ) : (
                        <span className="text-rose-300 text-[11px]">
                          {row.errors.join(', ')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-xs text-[#A89F91]">
              Hanya baris berstatus <strong>Valid ({validStudentCount} siswa)</strong> yang akan disimpan ke database anggota perpustakaan.
            </p>

            <button
              type="button"
              disabled={isProcessing || validStudentCount === 0}
              onClick={handleConfirmStudentImport}
              className={`px-6 py-3 rounded-xl font-cinzel font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl transition-all ${
                validStudentCount > 0
                  ? 'bg-gradient-to-r from-emerald-500 to-amber-500 text-[#12100E] hover:brightness-110'
                  : 'bg-white/10 text-[#A89F91] cursor-not-allowed'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Simpan {validStudentCount} Akun Siswa (NISN) ke Database</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
