/**
 * Aturan sirkulasi, status jatuh tempo, dan pengingat WhatsApp.
 * Semua tanggal diperlakukan sebagai tanggal lokal (bukan UTC) agar
 * status H-1 / terlambat tidak bergeser satu hari di zona waktu Indonesia.
 */

export const LIBRARY_NAME = 'Perpustakaan SMA Nusantara';
export const LIBRARY_TAGLINE = 'The Grand Alchemist\u2019s Archive';

export const STUDENT_LOAN_DAYS = 7;
export const TEACHER_LOAN_DAYS_OPTIONS = [14, 21, 30];
export const DEFAULT_TEACHER_LOAN_DAYS = 14;

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des'
];

const LONG_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

const MONTH_LOOKUP = {
  jan: 0,
  januari: 0,
  feb: 1,
  februari: 1,
  mar: 2,
  maret: 2,
  apr: 3,
  april: 3,
  mei: 4,
  may: 4,
  jun: 5,
  juni: 5,
  jul: 6,
  juli: 6,
  agu: 7,
  ags: 7,
  agustus: 7,
  aug: 7,
  sep: 8,
  september: 8,
  okt: 9,
  oktober: 9,
  oct: 9,
  nov: 10,
  november: 10,
  des: 11,
  desember: 11,
  dec: 11
};

export function startOfDay(value = new Date()) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(value, amount) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + Number(amount || 0));
  return date;
}

export function toISODate(value) {
  const date = value instanceof Date ? value : parseDateValue(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateValue(value) {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const text = String(value).trim();
  if (!text) return null;

  // ISO: 2026-11-17 atau 2026-11-17T08:30:00Z
  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  // 17 Nov 2026 / 17 November 2026
  match = text.match(/^(\d{1,2})\s+([A-Za-z\u00C0-\u024F]+)\s+(\d{4})$/);
  if (match) {
    const monthIndex = MONTH_LOOKUP[match[2].toLowerCase()];
    if (monthIndex !== undefined) {
      return new Date(Number(match[3]), monthIndex, Number(match[1]));
    }
  }

  // 17/11/2026 atau 17-11-2026
  match = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export function formatDateID(value, variant = 'short') {
  const date = value instanceof Date ? value : parseDateValue(value);
  if (!date) return '-';
  const months = variant === 'long' ? LONG_MONTHS : SHORT_MONTHS;
  return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateFullID(value) {
  const date = value instanceof Date ? value : parseDateValue(value);
  if (!date) return '-';
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return `${dayNames[date.getDay()]}, ${formatDateID(date, 'long')}`;
}

export function getDaysBetween(fromValue, toValue) {
  const from = parseDateValue(fromValue);
  const to = parseDateValue(toValue);
  if (!from || !to) return 0;
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

export function getDaysUntil(dueDate, fromDate = new Date()) {
  return getDaysBetween(startOfDay(fromDate), dueDate);
}

export function getLoanDurationDays(role = 'siswa', requestedDays) {
  if (role === 'guru') {
    const numeric = Number(requestedDays);
    return TEACHER_LOAN_DAYS_OPTIONS.includes(numeric)
      ? numeric
      : DEFAULT_TEACHER_LOAN_DAYS;
  }
  return STUDENT_LOAN_DAYS;
}

export function getReturnedLateDays(loan) {
  if (!loan || (!loan.returnedAt && !loan.returned_at)) return 0;
  const returned = loan.returnedAt || loan.returned_at;
  const due = loan.dueDate || loan.due_date;
  if (!returned || !due) return 0;
  return Math.max(0, getDaysBetween(due, returned));
}

/**
 * Status otomatis untuk tampilan & laporan.
 * tone: emerald (aktif), amber (H-1 / menunggu), rose (terlambat / ditolak),
 * slate (selesai).
 */
export function getLoanTiming(loan, now = new Date()) {
  const status = String(loan?.status || 'pending').toLowerCase();

  if (status === 'pending') {
    return {
      key: 'pending',
      label: 'Menunggu Persetujuan',
      shortLabel: 'Menunggu',
      tone: 'amber',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
      dotClass: 'bg-amber-400',
      daysLeft: null,
      overdueDays: 0,
      isLate: false
    };
  }

  if (status === 'rejected') {
    return {
      key: 'rejected',
      label: 'Ditolak',
      shortLabel: 'Ditolak',
      tone: 'rose',
      badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
      dotClass: 'bg-rose-400',
      daysLeft: null,
      overdueDays: 0,
      isLate: false
    };
  }

  if (status === 'returned' || status === 'recalled') {
    const lateDays = getReturnedLateDays(loan);
    return {
      key: lateDays > 0 ? 'returned_late' : 'returned',
      label:
        lateDays > 0
          ? `Dikembalikan \u2022 Telat ${lateDays} hari`
          : status === 'recalled'
          ? 'Ditarik Kembali'
          : 'Sudah Dikembalikan',
      shortLabel: lateDays > 0 ? `Telat ${lateDays} hari` : 'Selesai',
      tone: lateDays > 0 ? 'rose' : 'slate',
      badgeClass:
        lateDays > 0
          ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
          : 'bg-slate-500/15 text-slate-300 border-slate-500/40',
      dotClass: lateDays > 0 ? 'bg-rose-400' : 'bg-slate-400',
      daysLeft: null,
      overdueDays: lateDays,
      isLate: lateDays > 0
    };
  }

  // approved / active
  const due = parseDateValue(loan?.dueDate || loan?.due_date);
  const today = startOfDay(now);
  const daysLeft = due ? getDaysBetween(today, due) : Number(loan?.daysLeft ?? 0);

  if (daysLeft < 0) {
    const overdueDays = Math.abs(daysLeft);
    return {
      key: 'overdue',
      label: `Terlambat ${overdueDays} hari`,
      shortLabel: `Telat ${overdueDays} hr`,
      tone: 'rose',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
      dotClass: 'bg-rose-400',
      daysLeft,
      overdueDays,
      isLate: true
    };
  }

  if (daysLeft <= 1) {
    return {
      key: 'due_soon',
      label: daysLeft === 0 ? 'Jatuh tempo hari ini' : 'H-1 \u2022 Jatuh tempo besok',
      shortLabel: daysLeft === 0 ? 'Hari ini' : 'H-1',
      tone: 'amber',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
      dotClass: 'bg-amber-400',
      daysLeft,
      overdueDays: 0,
      isLate: false
    };
  }

  return {
    key: 'active',
    label: `Aktif \u2022 ${daysLeft} hari lagi`,
    shortLabel: `${daysLeft} hari`,
    tone: 'emerald',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    dotClass: 'bg-emerald-400',
    daysLeft,
    overdueDays: 0,
    isLate: false
  };
}

export function getLoanStatusPriority(loan) {
  const timing = getLoanTiming(loan);
  if (timing.key === 'overdue') return 0;
  if (timing.key === 'due_soon') return 1;
  if (timing.key === 'active') return 2;
  if (timing.key === 'pending') return 3;
  return 4;
}

export function normalizeWhatsAppPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

export function getContactOptions(loan, member) {
  const studentPhone = normalizeWhatsAppPhone(
    loan?.borrowerPhone || loan?.borrower_phone || member?.phone
  );
  const guardianPhone = normalizeWhatsAppPhone(
    loan?.guardianPhone || loan?.guardian_phone || member?.guardianPhone
  );
  const homeroomPhone = normalizeWhatsAppPhone(
    loan?.homeroomPhone || loan?.homeroom_phone || member?.homeroomPhone
  );

  return [
    {
      id: 'student',
      label: 'Siswa / Peminjam',
      name: member?.name || loan?.borrowerName || loan?.requesterName || 'Peminjam',
      phone: studentPhone,
      description: studentPhone ? `+${studentPhone}` : 'Nomor belum tersedia'
    },
    {
      id: 'guardian',
      label: 'Orang Tua / Wali',
      name:
        loan?.guardianName ||
        member?.guardianName ||
        'Orang Tua / Wali',
      phone: guardianPhone,
      description: guardianPhone ? `+${guardianPhone}` : 'Nomor belum tersedia'
    },
    {
      id: 'homeroom',
      label: 'Wali Kelas',
      name:
        loan?.homeroomName ||
        member?.homeroomName ||
        'Wali Kelas',
      phone: homeroomPhone,
      description: homeroomPhone ? `+${homeroomPhone}` : 'Nomor belum tersedia'
    }
  ].filter((option) => option.phone);
}

export function buildReminderMessage({
  loan,
  book,
  member,
  recipient = 'student',
  libraryName = LIBRARY_NAME
}) {
  const timing = getLoanTiming(loan);
  const dateText = formatDateID(loan?.dueDate || loan?.due_date, 'long');
  const title = book?.title || loan?.bookTitle || 'Buku Perpustakaan';
  const code = book?.kodeBuku || book?.kode_buku || book?.isbn || '-';
  const studentName =
    member?.name || loan?.borrowerName || loan?.requesterName || 'Peminjam';
  const className = member?.classLabel || loan?.className || '-';

  let recipientName = studentName;
  if (recipient === 'guardian') {
    recipientName = member?.guardianName || loan?.guardianName || 'Bapak/Ibu Wali';
  } else if (recipient === 'homeroom') {
    recipientName = member?.homeroomName || loan?.homeroomName || 'Bapak/Ibu Wali Kelas';
  }

  let statusLine = `Batas pengembalian: *${dateText}*`;
  if (timing.key === 'overdue') {
    statusLine = `\u26A0\uFE0F Sudah *TERLAMBAT ${timing.overdueDays} hari* (jatuh tempo ${dateText}).`;
  } else if (timing.key === 'due_soon') {
    statusLine =
      timing.daysLeft === 0
        ? `\u23F0 Jatuh tempo *HARI INI* (${dateText}).`
        : `\u23F0 Tinggal *1 hari lagi* (jatuh tempo ${dateText}).`;
  } else if (timing.key === 'returned') {
    statusLine = `\u2705 Buku sudah dikembalikan pada ${formatDateID(
      loan.returnedAt || loan.returned_at
    )}.`;
  }

  const greeting = `Halo ${recipientName},`;
  const body = [
    `*PENGINGAT PERPUSTAKAAN*`,
    libraryName,
    '',
    greeting,
    `Kami mengingatkan peminjaman buku berikut:`,
    '',
    `\uD83D\uDCDA Judul: *${title}*`,
    `\uD83D\uDD16 Kode: ${code}`,
    `\uD83D\uDC64 Peminjam: ${studentName}`,
    `\uD83C\uDFEB Kelas: ${className}`,
    '',
    statusLine,
    '',
    'Mohon segera mengembalikan buku ke perpustakaan agar dapat dipinjam oleh siswa lain.',
    'Terima kasih atas kerja sama Bapak/Ibu. \uD83D\uDE4F'
  ];

  return body.join('\n');
}

export function buildWhatsAppUrl(phone, message) {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return '';
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function getClassLevel(className = '') {
  const value = String(className).toUpperCase();
  if (/\bXII\b/.test(value)) return 'XII';
  if (/\bXI\b/.test(value)) return 'XI';
  if (/\bX\b/.test(value)) return 'X';
  if (/GURU|MENTOR|FAKULTAS|DEWAN/.test(value)) return 'Guru';
  return 'Lainnya';
}

export function getMonthKey(value) {
  const date = value instanceof Date ? value : parseDateValue(value);
  if (!date) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthID(monthKey) {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return 'Semua Periode';
  const [year, month] = monthKey.split('-').map(Number);
  return `${LONG_MONTHS[month - 1]} ${year}`;
}

export function getMonthOptions(count = 18) {
  const now = new Date();
  const options = [];
  for (let index = 0; index < count; index += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    options.push({ key, label: formatMonthID(key) });
  }
  return options;
}

export function isLoanInMonth(loan, monthKey) {
  if (!monthKey) return true;
  const borrowed = loan?.borrowedDateISO || loan?.borrowed_date || loan?.borrowedDate;
  return getMonthKey(borrowed) === monthKey;
}

export function sortLoansByUrgency(loans = []) {
  return [...loans].sort((a, b) => {
    const priority = getLoanStatusPriority(a) - getLoanStatusPriority(b);
    if (priority !== 0) return priority;
    return String(a.dueDate || '').localeCompare(String(b.dueDate || ''));
  });
}
