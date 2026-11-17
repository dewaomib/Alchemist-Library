import { SAMPLE_MEMBERS } from './sampleMembers.js';
import {
  addDays,
  formatDateID,
  getDaysUntil,
  toISODate
} from '../utils/loanUtils.js';

const TODAY = new Date();
const START_TODAY = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());

function memberByCard(cardCode) {
  return SAMPLE_MEMBERS.find((member) => member.cardCode === cardCode) || SAMPLE_MEMBERS[0];
}

function buildLoan({
  id,
  book,
  member,
  borrowed,
  due,
  returned = null,
  status = 'returned',
  quantity = 1,
  notes = '',
  rejectionReason = '',
  maxDays = 7,
  profileId
}) {
  if (!book || !member) return null;

  return {
    id,
    bookId: book.id,
    bookTitle: book.title,
    borrowerName: member.name,
    requesterName: member.name,
    requesterRole: member.role,
    profileId: profileId || member.cardCode || member.id,
    borrowerCard: member.cardCode,
    borrowerLevel: member.level,
    borrowerPhone: member.phone,
    guardianName: member.guardianName,
    guardianPhone: member.guardianPhone,
    homeroomName: member.homeroomName,
    homeroomPhone: member.homeroomPhone,
    className: member.className,
    classLabel: member.classLabel,
    quantity: Number(quantity) || 1,
    borrowedDate: formatDateID(borrowed),
    borrowedDateISO: toISODate(borrowed),
    dueDate: toISODate(due),
    daysLeft: getDaysUntil(due, START_TODAY),
    maxDays,
    status,
    notes,
    rejectionReason,
    returnedAt: returned ? toISODate(returned) : null
  };
}

function monthDate(monthOffset, day) {
  return new Date(TODAY.getFullYear(), TODAY.getMonth() - monthOffset, day);
}

/**
 * Data contoh sirkulasi:
 * - Pinjaman yang sedang aktif (termasuk contoh H-1 dan terlambat).
 * - Riwayat pengembalian 3 bulan terakhir untuk laporan bulanan/akreditasi.
 */
export function buildInitialLoans(books = []) {
  const bookById = Object.fromEntries(books.map((book) => [book.id, book]));
  const loans = [];

  const push = (spec) => {
    const loan = buildLoan({
      ...spec,
      book: bookById[spec.bookId],
      member: memberByCard(spec.memberCard)
    });
    if (loan) loans.push(loan);
  };

  // ---------------------------------------------------------------------------
  // Pinjaman demo yang masih berjalan / menunggu persetujuan
  // ---------------------------------------------------------------------------
  push({
    id: 'loan-demo-01',
    bookId: 'book-3',
    memberCard: 'ARC-2026-089',
    borrowed: addDays(START_TODAY, -10),
    due: addDays(START_TODAY, 4),
    status: 'approved',
    notes: 'Mempelajari dasar-dasar alkimia transmutasi Batu Bertuah.'
  });

  push({
    id: 'loan-demo-02',
    bookId: 'book-12',
    memberCard: 'ARC-2026-089',
    borrowed: addDays(START_TODAY, -6),
    due: addDays(START_TODAY, 1),
    status: 'approved',
    notes: 'Mengkaji mitos kerja sama dan tatanan sosial peradaban manusia.'
  });

  push({
    id: 'loan-demo-03',
    bookId: 'book-4',
    memberCard: 'GT-2026-001',
    borrowed: START_TODAY,
    due: addDays(START_TODAY, 14),
    status: 'pending',
    quantity: 4,
    maxDays: 14,
    notes: 'Peminjaman 4 eksemplar modul pegangan untuk eksperimen mekanika fluida di lab fisika.'
  });

  push({
    id: 'loan-demo-04',
    bookId: 'book-1',
    memberCard: 'ARC-2026-089',
    borrowed: START_TODAY,
    due: addDays(START_TODAY, 7),
    status: 'pending',
    notes: 'Ingin membaca petualangan dunia paralel klan bulan untuk resensi sastra.'
  });

  push({
    id: 'loan-demo-05',
    bookId: 'book-5',
    memberCard: 'ARC-2026-001',
    borrowed: addDays(START_TODAY, -20),
    due: addDays(START_TODAY, -6),
    status: 'approved',
    notes: 'Riset biologi seluler untuk proyek akhir semester.'
  });

  push({
    id: 'loan-demo-06',
    bookId: 'book-6',
    memberCard: 'ARC-2026-103',
    borrowed: addDays(START_TODAY, -4),
    due: addDays(START_TODAY, 3),
    status: 'approved',
    notes: 'Latihan struktur data untuk olimpiade informatika.'
  });

  push({
    id: 'loan-demo-07',
    bookId: 'book-2',
    memberCard: 'GT-2026-002',
    borrowed: addDays(START_TODAY, -2),
    due: addDays(START_TODAY, 12),
    status: 'approved',
    quantity: 2,
    maxDays: 14,
    notes: 'Buku pendamping pembelajaran sastra untuk kelas XI.'
  });

  push({
    id: 'loan-demo-08',
    bookId: 'book-9',
    memberCard: 'ARC-2026-204',
    borrowed: addDays(START_TODAY, -1),
    due: addDays(START_TODAY, 6),
    status: 'approved',
    notes: 'Membaca Filosofi Teras untuk tugas refleksi diri.'
  });

  push({
    id: 'loan-demo-09',
    bookId: 'book-8',
    memberCard: 'ARC-2026-105',
    borrowed: addDays(START_TODAY, -3),
    due: addDays(START_TODAY, 4),
    status: 'rejected',
    rejectionReason:
      'Buku sedang dialokasikan untuk kegiatan bedah buku kelas XI IPS 1 pada pekan yang sama.'
  });

  // ---------------------------------------------------------------------------
  // Riwayat pengembalian (untuk statistik popularitas & laporan bulanan)
  // [bookId, cardCode, monthOffset, borrowedDay, lateDays]
  // ---------------------------------------------------------------------------
  const historySpecs = [
    // Bulan ini
    ['book-4', 'ARC-2026-101', 0, 1, 0],
    ['book-4', 'ARC-2026-102', 0, 2, 1],
    ['book-1', 'ARC-2026-001', 0, 2, 0],
    ['book-3', 'ARC-2026-103', 0, 3, 2],
    ['book-5', 'ARC-2026-104', 0, 3, 0],
    ['book-12', 'ARC-2026-201', 0, 4, 0],
    ['book-2', 'ARC-2026-106', 0, 4, 3],
    ['book-9', 'ARC-2026-202', 0, 5, 0],
    ['book-7', 'ARC-2026-107', 0, 5, 1],
    ['book-4', 'ARC-2026-108', 0, 6, 0],
    ['book-1', 'ARC-2026-205', 0, 6, 2],
    ['book-6', 'ARC-2026-206', 0, 7, 0],
    ['book-11', 'ARC-2026-207', 0, 8, 0],
    ['book-10', 'ARC-2026-208', 0, 8, 1],

    // Bulan lalu
    ['book-4', 'ARC-2026-001', 1, 2, 0],
    ['book-1', 'ARC-2026-101', 1, 3, 1],
    ['book-3', 'ARC-2026-102', 1, 4, 0],
    ['book-2', 'ARC-2026-103', 1, 5, 2],
    ['book-5', 'ARC-2026-104', 1, 6, 0],
    ['book-8', 'ARC-2026-105', 1, 7, 3],
    ['book-7', 'ARC-2026-106', 1, 8, 0],
    ['book-12', 'ARC-2026-201', 1, 9, 1],
    ['book-6', 'ARC-2026-202', 1, 10, 0],
    ['book-9', 'ARC-2026-203', 1, 11, 4],
    ['book-4', 'ARC-2026-204', 1, 12, 0],
    ['book-1', 'ARC-2026-205', 1, 13, 0],
    ['book-11', 'ARC-2026-206', 1, 14, 2],
    ['book-10', 'ARC-2026-207', 1, 15, 0],

    // Dua bulan lalu
    ['book-3', 'ARC-2026-001', 2, 3, 0],
    ['book-1', 'ARC-2026-101', 2, 4, 2],
    ['book-4', 'ARC-2026-102', 2, 5, 0],
    ['book-2', 'ARC-2026-103', 2, 6, 1],
    ['book-5', 'ARC-2026-104', 2, 7, 0],
    ['book-12', 'ARC-2026-105', 2, 8, 3],
    ['book-6', 'ARC-2026-106', 2, 9, 0],
    ['book-7', 'ARC-2026-107', 2, 10, 1],
    ['book-8', 'ARC-2026-201', 2, 11, 0],
    ['book-9', 'ARC-2026-202', 2, 12, 2]
  ];

  historySpecs.forEach(([bookId, memberCard, monthOffset, borrowedDay, lateDays], index) => {
    const borrowed = monthDate(monthOffset, borrowedDay);
    const due = addDays(borrowed, 7);
    const returned = addDays(due, Number(lateDays) || 0);
    push({
      id: `loan-history-${String(index + 1).padStart(2, '0')}`,
      bookId,
      memberCard,
      borrowed,
      due,
      returned,
      status: 'returned',
      quantity: 1,
      notes: 'Peminjaman selesai (data contoh laporan).'
    });
  });

  // Riwayat pinjaman kolektif guru
  const teacherHistory = [
    ['book-4', 'GT-2026-001', 1, 8, 4, 4],
    ['book-2', 'GT-2026-001', 0, 5, 2, 2],
    ['book-8', 'GT-2026-003', 2, 7, 3, 1]
  ];

  teacherHistory.forEach(([bookId, memberCard, monthOffset, borrowedDay, lateDays, quantity], index) => {
    const borrowed = monthDate(monthOffset, borrowedDay);
    const due = addDays(borrowed, 14);
    const returned = addDays(due, Number(lateDays) || 0);
    push({
      id: `loan-history-teacher-${index + 1}`,
      bookId,
      memberCard,
      borrowed,
      due,
      returned,
      status: 'returned',
      quantity,
      maxDays: 14,
      notes: 'Peminjaman paket kelas (data contoh laporan).'
    });
  });

  return loans;
}

export function getMemberForLoan(loan) {
  if (!loan) return null;
  return (
    SAMPLE_MEMBERS.find(
      (member) =>
        (loan.borrowerCard && member.cardCode === loan.borrowerCard) ||
        member.name === loan.borrowerName ||
        member.name === loan.requesterName
    ) || null
  );
}
