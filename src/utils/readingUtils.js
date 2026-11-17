/**
 * Utilitas Gerakan Literasi Sekolah (GLS):
 * validasi jurnal refleksi, normalisasi kelas, dan agregasi leaderboard.
 */

import { getMonthKey } from './loanUtils.js';

export const MIN_SUMMARY_WORDS = 100;
export const RECOMMENDED_SUMMARY_WORDS = 200;

export const LOAN_STATUSES_FOR_LITERACY = ['approved', 'active', 'returned', 'recalled'];

export function countWords(text = '') {
  return String(text)
    .trim()
    .split(/\s+/)
    .filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

export function getSummaryValidation(text = '') {
  const wordCount = countWords(text);
  const remaining = Math.max(0, MIN_SUMMARY_WORDS - wordCount);
  const isValid = wordCount >= MIN_SUMMARY_WORDS;

  let tone = 'amber';
  let message = `Kurang ${remaining} kata lagi (minimal ${MIN_SUMMARY_WORDS} kata).`;

  if (wordCount >= MIN_SUMMARY_WORDS) {
    tone = wordCount > RECOMMENDED_SUMMARY_WORDS ? 'sky' : 'emerald';
    message =
      wordCount > RECOMMENDED_SUMMARY_WORDS
        ? `${wordCount} kata • memenuhi syarat, namun melebihi rekomendasi ${RECOMMENDED_SUMMARY_WORDS} kata.`
        : `${wordCount} kata • memenuhi syarat (ideal ${MIN_SUMMARY_WORDS}–${RECOMMENDED_SUMMARY_WORDS} kata).`;
  }

  return {
    wordCount,
    remaining,
    isValid,
    tone,
    message
  };
}

/**
 * Mengubah "Kelas XI MIPA 2 • Akademi..." / "XI MIPA 2" menjadi
 * "Kelas XI MIPA 2". Mengembalikan string kosong untuk kelas non-siswa
 * seperti fakultas/dewan agar tidak masuk leaderboard.
 */
export function normalizeClassName(value = '') {
  const raw = String(value)
    .split('\u2022')[0]
    .replace(/\s+/g, ' ')
    .trim();

  if (!raw) return '';
  if (/^(fakultas|guru|mentor|dewan|akademi)\b/i.test(raw)) return '';

  const withoutPrefix = raw.replace(/^kelas\s+/i, '').trim();
  if (!withoutPrefix) return '';

  return `Kelas ${withoutPrefix}`;
}

export function getClassDisplayName(className = '') {
  return String(className).replace(/^kelas\s+/i, '').trim();
}

export function getReadingLogWordCount(log) {
  return Number(log?.wordCount || log?.word_count) || countWords(log?.summary || '');
}

export function isReadingLogInMonth(log, monthKey) {
  if (!monthKey) return true;
  const stamp = log?.createdAt || log?.created_at || log?.createdDate;
  return getMonthKey(stamp) === monthKey;
}

export function isLoanInLiteracyMonth(loan, monthKey) {
  if (!monthKey) return true;
  const stamp =
    loan?.borrowedDateISO ||
    loan?.borrowed_date ||
    loan?.borrowedDate ||
    loan?.createdAt ||
    loan?.created_at;
  return getMonthKey(stamp) === monthKey;
}

export function getReadingLogStatusMeta(status) {
  return status === 'graded'
    ? {
        label: 'Sudah Dinilai',
        tone: 'emerald',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
      }
    : {
        label: 'Belum Dinilai',
        tone: 'amber',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40'
      };
}

/**
 * Agregasi bulan berjalan per kelas:
 * - total eksemplar buku yang dipinjam/dibaca
 * - jumlah jurnal literasi yang diselesaikan
 */
export function buildClassLeaderboard({
  loans = [],
  readingLogs = [],
  monthKey = getMonthKey(new Date())
} = {}) {
  const classes = new Map();

  const ensureClass = (rawClassName) => {
    const className = normalizeClassName(rawClassName);
    if (!className) return null;
    if (!classes.has(className)) {
      classes.set(className, {
        className,
        shortName: getClassDisplayName(className),
        borrowedBooks: 0,
        journals: 0,
        readers: new Set(),
        books: new Set()
      });
    }
    return classes.get(className);
  };

  loans.forEach((loan) => {
    if (!loan || !LOAN_STATUSES_FOR_LITERACY.includes(String(loan.status))) return;
    if (loan.requesterRole === 'guru' && !loan.isPackage) {
      // Pinjaman guru reguler tidak selalu memiliki kelas rombel target.
      const targetLooksLikeClass = /kelas\s+(x|xi|xii)\b/i.test(String(loan.className || ''));
      if (!targetLooksLikeClass) return;
    }
    if (!isLoanInLiteracyMonth(loan, monthKey)) return;

    const entry = ensureClass(loan.className);
    if (!entry) return;

    entry.borrowedBooks += Math.max(1, Number(loan.quantity) || 1);
    if (loan.borrowerName && loan.requesterRole !== 'guru') {
      entry.readers.add(String(loan.borrowerName).toLowerCase());
    }
    if (loan.bookId) entry.books.add(loan.bookId);
  });

  readingLogs.forEach((log) => {
    if (!log || !isReadingLogInMonth(log, monthKey)) return;
    const entry = ensureClass(log.className);
    if (!entry) return;

    entry.journals += 1;
    if (log.studentName) entry.readers.add(String(log.studentName).toLowerCase());
    if (log.bookId) entry.books.add(log.bookId);
  });

  return [...classes.values()]
    .map((entry) => ({
      className: entry.className,
      shortName: entry.shortName,
      borrowedBooks: entry.borrowedBooks,
      journals: entry.journals,
      totalBooks: entry.borrowedBooks + entry.journals,
      uniqueBooks: entry.books.size,
      readers: entry.readers.size
    }))
    .sort(
      (a, b) =>
        b.totalBooks - a.totalBooks ||
        b.journals - a.journals ||
        a.className.localeCompare(b.className)
    );
}
