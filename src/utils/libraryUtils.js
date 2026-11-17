/**
 * Utilitas koleksi: kode buku, nomor panggil (DDC), dan pencocokan hasil scan.
 */

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
    indo: 'Teknologi & Koding'
  },
  'Philosophy': {
    code: 'FIL',
    ddc: '100',
    label: 'High Philosophy & Mind',
    indo: 'Filsafat & Budi Pekerti'
  }
};

export function normalizeCategory(rawCategory) {
  const value = String(rawCategory || '').trim();
  const lower = value.toLowerCase();

  if (!partOfKnownCategory(lower)) return value || 'Alchemy';
  if (lower.includes('bard') || lower.includes('fiksi') || lower.includes('fiction') || lower.includes('sastra')) {
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
    lower.includes('koding')
  ) {
    return 'Artificers Craft';
  }
  if (lower.includes('philosoph') || lower.includes('filsafat') || lower.includes('filosofi')) {
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
    'ancient',
    'sejarah',
    'history',
    'peradaban',
    'artificer',
    'teknologi',
    'komputer',
    'coding',
    'koding',
    'philosoph',
    'filsafat',
    'filosofi'
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
  if (title.includes('struktur data') || title.includes('algoritma') || title.includes('clean code')) {
    return '005.1';
  }
  if (title.includes('jaringan')) return '004.6';
  if (title.includes('nusantara') || title.includes('kerajaan')) return '959.8';
  if (title.includes('sapiens') || title.includes('sejarah dunia')) return '900';
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

  const ddc = inferDDC({ ...book, category });
  const cutter = getAuthorCutter(book.author);
  const callNumber = book.callNumber || `${ddc}\n${cutter}`;
  const barcode = book.barcode || kodeBuku;

  return {
    ...book,
    category,
    categoryLabel: book.categoryLabel || getCategoryLabel(category),
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
  const code = normalizeCode(rawCode);
  if (!code) return null;

  return (
    members.find((member) =>
      [member.cardCode, member.studentId, member.nisn, member.id]
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
    book.shelf,
    book.publisher
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function buildMemberSearchText(member) {
  return [member.name, member.cardCode, member.nisn, member.className, member.classLabel, member.role]
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
