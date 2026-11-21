/**
 * Utilitas koleksi: kode buku, nomor panggil (DDC), pemetaan kurikulum bertingkat
 * (SMP, SMA, SMK 3 Jurusan: BM, TKR/TR, TKJ), dan pencocokan hasil scan NISN/barcode.
 */

export const JENJANG_OPTIONS = ['SMP', 'SMA', 'SMK', 'Umum'];

export const KELAS_BY_JENJANG = {
  SMP: ['7', '8', '9'],
  SMA: ['10', '11', '12'],
  SMK: ['10', '11', '12'],
  Umum: ['Semua']
};

export const SMK_JURUSAN_OPTIONS = ['TKJ', 'BM', 'TKR/TR', 'Semua Jurusan'];

export const JENIS_BUKU_OPTIONS = [
  'Buku Paket Wajib',
  'Modul Praktik',
  'Fiksi / Novel',
  'Referensi'
];

export const JURUSAN_LABELS = {
  TKJ: 'TKJ (Teknik Komputer & Jaringan)',
  BM: 'BM (Bisnis & Manajemen)',
  'TKR/TR': 'TKR/TR (Teknik Kendaraan Ringan / Rekayasa)',
  'Semua Jurusan': 'Semua Jurusan (Muatan Nasional)'
};

export function normalizeJenjang(raw) {
  const val = String(raw || '').trim().toUpperCase();
  if (val === 'SMP' || val.includes('SMP') || val.includes('MTS')) return 'SMP';
  if (val === 'SMA' || val.includes('SMA') || val.includes('MA')) return 'SMA';
  if (val === 'SMK' || val.includes('SMK') || val.includes('KEJURUAN')) return 'SMK';
  if (val === 'UMUM' || val === 'GENERAL' || val === 'SEMUA') return 'Umum';
  return 'Umum';
}

export function normalizeKelas(raw, jenjang = 'Umum') {
  const normJenjang = normalizeJenjang(jenjang);
  if (normJenjang === 'Umum') return 'Semua';

  const val = String(raw || '').trim().toUpperCase();
  if (val === 'SEMUA' || val === 'ALL' || !val) {
    return normJenjang === 'SMP' ? '7' : '10';
  }
  if (val === 'VII' || val === '7' || val.includes('7')) return '7';
  if (val === 'VIII' || val === '8' || val.includes('8')) return '8';
  if (val === 'IX' || val === '9' || val.includes('9')) return '9';
  if (val === 'XII' || val === '12' || val.includes('12')) return '12';
  if (val === 'XI' || val === '11' || val.includes('11')) return '11';
  if (val === 'X' || val === '10' || val.includes('10')) return '10';

  const allowed = KELAS_BY_JENJANG[normJenjang] || ['Semua'];
  return allowed.includes(val) ? val : allowed[0];
}

export function normalizeJurusan(raw, jenjang = 'Umum') {
  const normJenjang = normalizeJenjang(jenjang);
  if (normJenjang !== 'SMK') return 'Semua Jurusan';

  const val = String(raw || '').trim().toUpperCase();
  if (!val || val === '-' || val === 'SEMUA' || val.includes('SEMUA JURUSAN') || val.includes('UMUM') || val.includes('NASIONAL')) {
    return 'Semua Jurusan';
  }
  if (val === 'TKJ' || val.includes('TKJ') || val.includes('KOMPUTER') || val.includes('JARINGAN')) {
    return 'TKJ';
  }
  if (val === 'BM' || val.includes('BISNIS') || val.includes('MANAJEMEN') || val.includes('AKUNTANSI') || val.includes('PERKANTORAN')) {
    return 'BM';
  }
  if (
    val === 'TKR/TR' ||
    val === 'TKR' ||
    val === 'TR' ||
    val.includes('TKR') ||
    val.includes('KENDARAAN') ||
    val.includes('OTOMOTIF') ||
    val.includes('REKAYASA')
  ) {
    return 'TKR/TR';
  }
  return 'Semua Jurusan';
}

export function normalizeJenisBuku(raw) {
  const val = String(raw || '').trim().toLowerCase();
  if (val.includes('paket') || val.includes('wajib') || val.includes('teks')) {
    return 'Buku Paket Wajib';
  }
  if (val.includes('modul') || val.includes('praktik') || val.includes('praktikum') || val.includes('jobsheet')) {
    return 'Modul Praktik';
  }
  if (val.includes('fiksi') || val.includes('novel') || val.includes('cerita') || val.includes('sastra')) {
    return 'Fiksi / Novel';
  }
  if (val.includes('referensi') || val.includes('ensiklopedia') || val.includes('kamus') || val.includes('pengayaan')) {
    return 'Referensi';
  }
  return 'Referensi';
}

export function normalizeNisn(raw) {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return '';
  // Pertahankan leading zero seperti '0081234567'
  const digitsOnly = trimmed.replace(/\s+/g, '');
  if (/^\d+$/.test(digitsOnly) && digitsOnly.length >= 7 && digitsOnly.length < 10) {
    return digitsOnly.padStart(10, '0');
  }
  return digitsOnly;
}



/**
 * Filter kurikulum bertingkat untuk halaman Katalog Siswa & Guru:
 * Saat pengguna memilih SMK -> Kelas 10 -> TKJ, otomatis menampilkan buku kelas 10 TKJ
 * TERMASUK buku kelas 10 SMK yang berlabel 'Semua Jurusan'.
 * Berlaku sama untuk BM, TKR/TR, serta seluruh tingkat kelas di SMP dan SMA.
 */
export function matchesCurriculumFilter(
  book,
  {
    jenjang = 'All',
    kelas = 'All',
    jurusan = 'All',
    jenisBuku = 'All'
  } = {}
) {
  if (!book) return false;
  const bookJenjang = book.jenjang || 'Umum';
  const bookKelas = String(book.kelas || 'Semua');
  const bookJurusan = book.jurusan || 'Semua Jurusan';
  const bookJenis = book.jenisBuku || book.jenis_buku || 'Referensi';

  if (jenjang && jenjang !== 'All') {
    if (bookJenjang !== jenjang) return false;
  }

  if (kelas && kelas !== 'All') {
    if (bookKelas !== String(kelas) && bookKelas !== 'Semua') {
      return false;
    }
  }

  if (jurusan && jurusan !== 'All') {
    if (jurusan === 'Semua Jurusan') {
      if (bookJurusan !== 'Semua Jurusan') return false;
    } else {
      // Ketika memilih TKJ, BM, atau TKR/TR, tampilkan buku jurusan tersebut + buku 'Semua Jurusan'
      if (bookJurusan !== jurusan && bookJurusan !== 'Semua Jurusan') {
        return false;
      }
    }
  }

  if (jenisBuku && jenisBuku !== 'All') {
    if (bookJenis !== jenisBuku) return false;
  }

  return true;
}

export const CATEGORY_META = {
  'Alchemy': {
    code: 'SAI',
    ddc: '500',
    label: 'Alchemy & Natural Science',
    indo: 'Sains & Alam'
  },
  'Ancient Lore': {
    code: 'SEJ',
    ddc: '900',
    label: 'Ancient Lore & Chronicles',
    indo: 'Sejarah & Peradaban'
  },
  'Bards Tales': {
    code: 'FIK',
    ddc: '813',
    label: "Bard's Tales & Fiksi Populer",
    indo: 'Fiksi & Sastra'
  },
  'Artificers Craft': {
    code: 'TEK',
    ddc: '005.1',
    label: "Artificer's Craft & Digital Weave",
    indo: 'Teknologi & Rekayasa'
  },
  'Philosophy': {
    code: 'FIL',
    ddc: '100',
    label: 'High Philosophy & Mind',
    indo: 'Bisnis, Bahasa & Karakter'
  }
};

export function normalizeCategory(rawCategory) {
  const value = String(rawCategory || '').trim();
  const lower = value.toLowerCase();

  if (!partOfKnownCategory(lower)) return value || 'Alchemy';
  if (lower.includes('bard') || lower.includes('fiksi') || lower.includes('fiction') || lower.includes('sastra') || lower.includes('novel')) {
    return 'Bards Tales';
  }
  if (lower.includes('ancient') || lower.includes('sejarah') || lower.includes('history') || lower.includes('peradaban')) {
    return 'Ancient Lore';
  }
  if (
    lower.includes('artificer') ||
    lower.includes('teknologi') ||
    lower.includes('komputer') ||
    lower.includes('coding') ||
    lower.includes('koding') ||
    lower.includes('tkj') ||
    lower.includes('tkr') ||
    lower.includes('otomotif') ||
    lower.includes('jaringan')
  ) {
    return 'Artificers Craft';
  }
  if (
    lower.includes('philosoph') ||
    lower.includes('filsafat') ||
    lower.includes('filosofi') ||
    lower.includes('bisnis') ||
    lower.includes('manajemen') ||
    lower.includes('akuntansi')
  ) {
    return 'Philosophy';
  }
  return 'Alchemy';
}

function partOfKnownCategory(lower) {
  return [
    'alchemy',
    'sains',
    'science',
    'alam',
    'bard',
    'fiksi',
    'fiction',
    'sastra',
    'novel',
    'ancient',
    'sejarah',
    'history',
    'peradaban',
    'artificer',
    'teknologi',
    'komputer',
    'coding',
    'koding',
    'tkj',
    'tkr',
    'otomotif',
    'jaringan',
    'philosoph',
    'filsafat',
    'filosofi',
    'bisnis',
    'manajemen',
    'akuntansi'
  ].some((keyword) => lower.includes(keyword));
}

export function getCategoryMeta(category) {
  return CATEGORY_META[normalizeCategory(category)] || CATEGORY_META['Alchemy'];
}

export function getCategoryLabel(category) {
  const meta = getCategoryMeta(category);
  return `${meta.label} (${meta.indo})`;
}

function inferDDC(book) {
  if (book?.ddc) return String(book.ddc);
  const title = String(book?.title || '').toLowerCase();
  const category = normalizeCategory(book?.category);

  if (title.includes('fisika')) return '530';
  if (title.includes('biologi') || title.includes('genetika') || title.includes('dna')) return '570';
  if (title.includes('kimia') || title.includes('stoikiometri')) return '540';
  if (title.includes('matematika')) return '510';
  if (title.includes('struktur data') || title.includes('algoritma') || title.includes('clean code')) {
    return '005.1';
  }
  if (title.includes('jaringan') || title.includes('mikrotik') || title.includes('server') || title.includes('tkj')) {
    return '004.6';
  }
  if (title.includes('otomotif') || title.includes('kendaraan') || title.includes('mesin') || title.includes('sasis')) {
    return '629.2';
  }
  if (title.includes('akuntansi') || title.includes('bisnis') || title.includes('manajemen') || title.includes('perkantoran')) {
    return '657';
  }
  if (title.includes('nusantara') || title.includes('kerajaan')) return '959.8';
  if (title.includes('sapiens') || title.includes('sejarah')) return '900';
  if (category === 'Bards Tales') return '813';

  return getCategoryMeta(category).ddc;
}

export function getAuthorCutter(author = '') {
  const words = String(author)
    .replace(/[^A-Za-z\u00C0-\u024F\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((word) => !['dan', 'and', 'the', 'bin', 'binti', 'bapak', 'ibu', 'dr', 'prof', 'ir'].includes(word.toLowerCase()));

  if (words.length === 0) return 'XXX';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return `${words[0][0]}${words[words.length - 1].slice(0, 2)}`.toUpperCase();
}

export function shortenTitle(title = '', maxLength = 38) {
  const clean = String(title).replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, Math.max(0, maxLength - 1)).trimEnd()}\u2026`;
}

export function enrichBook(book, index = 0) {
  if (!book) return book;
  const category = normalizeCategory(book.category || book.school);
  const meta = getCategoryMeta(category);
  const numericId = String(book.id || '').match(/(\d+)$/);
  const fallbackNumber = String(index + 1).padStart(3, '0');
  const identity = numericId ? String(numericId[1]).padStart(3, '0') : fallbackNumber;

  const kodeBuku =
    book.kodeBuku ||
    book.kode_buku ||
    book.bookCode ||
    `BK-${meta.code}-${identity}`;

  const jenjang = book.jenjang ? normalizeJenjang(book.jenjang) : 'Umum';
  const kelas = book.kelas ? normalizeKelas(book.kelas, jenjang) : jenjang === 'Umum' ? 'Semua' : jenjang === 'SMP' ? '7' : '10';
  const jurusan = book.jurusan ? normalizeJurusan(book.jurusan, jenjang) : 'Semua Jurusan';
  const jenisBuku = book.jenisBuku || book.jenis_buku
    ? normalizeJenisBuku(book.jenisBuku || book.jenis_buku)
    : category === 'Bards Tales'
    ? 'Fiksi / Novel'
    : 'Referensi';

  const ddc = inferDDC({ ...book, category });
  const cutter = getAuthorCutter(book.author);
  const callNumber = book.callNumber || `${ddc}\n${cutter}`;
  const barcode = book.barcode || kodeBuku;

  return {
    ...book,
    category,
    categoryLabel: book.categoryLabel || getCategoryLabel(category),
    jenjang,
    kelas,
    jurusan,
    jenisBuku,
    kodeBuku,
    ddc,
    cutter,
    callNumber,
    barcode,
    shortTitle: book.shortTitle || shortenTitle(book.title),
    shelfCode: book.shelfCode || String(book.shelf || '').split('\u2022').pop().trim()
  };
}

export function cleanScannedCode(rawValue) {
  let value = String(rawValue || '').trim();
  if (!value) return '';

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      value =
        url.searchParams.get('nisn') ||
        url.searchParams.get('code') ||
        url.searchParams.get('id') ||
        url.searchParams.get('barcode') ||
        url.pathname.split('/').filter(Boolean).pop() ||
        value;
    } catch {
      // Biarkan nilai mentah jika URL tidak dapat diparse.
    }
  }

  return value.replace(/^["']+|["']+$/g, '').trim();
}

export function normalizeCode(value) {
  return cleanScannedCode(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function matchBookByCode(books = [], rawCode) {
  const code = normalizeCode(rawCode);
  if (!code) return null;

  const exact = books.find((book) =>
    [book.kodeBuku, book.kode_buku, book.isbn, book.barcode, book.id]
      .filter(Boolean)
      .some((candidate) => normalizeCode(candidate) === code)
  );
  if (exact) return exact;

  // Label eksemplar: BK-FIK-001-01 tetap merujuk ke BK-FIK-001.
  return (
    books.find((book) => {
      const base = normalizeCode(book.kodeBuku || book.kode_buku || book.barcode);
      return base.length >= 5 && code.startsWith(base);
    }) || null
  );
}

export function matchMemberByCode(members = [], rawCode) {
  const cleaned = cleanScannedCode(rawCode);
  if (!cleaned) return null;

  // 1. Prioritas utama: cocokkan NISN persis sebagai string (termasuk angka 0 di awal seperti '0081234567')
  const normalizedNisn = normalizeNisn(cleaned);
  const byExactNisn = members.find(
    (member) =>
      member.nisn &&
      (String(member.nisn).trim() === cleaned ||
        normalizeNisn(member.nisn) === normalizedNisn)
  );
  if (byExactNisn) return byExactNisn;

  // 2. Cocokkan berdasarkan username, cardCode, atau ID anggota
  const code = normalizeCode(cleaned);
  if (!code) return null;

  return (
    members.find((member) =>
      [member.nisn, member.cardCode, member.studentId, member.username, member.id]
        .filter(Boolean)
        .some((candidate) => normalizeCode(candidate) === code)
    ) || null
  );
}

export function buildBookSearchText(book) {
  return [
    book.title,
    book.author,
    book.kodeBuku,
    book.isbn,
    book.category,
    book.jenjang,
    book.kelas,
    book.jurusan,
    book.jenisBuku,
    book.shelf,
    book.publisher
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function buildMemberSearchText(member) {
  return [
    member.nisn,
    member.name,
    member.username,
    member.jenjang,
    member.kelas,
    member.jurusan,
    member.cardCode,
    member.className,
    member.classLabel,
    member.role
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function getInitials(name = '') {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}
