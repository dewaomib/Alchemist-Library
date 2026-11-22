import express from 'express';
import cookieParser from 'cookie-parser';
import { Readable } from 'node:stream';
import { Role } from '@prisma/client';
import prisma from './prisma.js';
import {
  extractGoogleDriveId,
  formatGoogleDriveDirectUrl
} from '../src/utils/urlHelpers.js';
import {
  attachSessionUser,
  clearSessionCookie,
  hashPassword,
  requireAuth,
  requireRoles,
  serializeUser,
  setSessionCookie,
  signSessionToken,
  verifyPassword
} from './auth.js';
import {
  enrichBook,
  matchesCurriculumFilter,
  normalizeNisn
} from '../src/utils/libraryUtils.js';
import {
  addDays,
  formatDateID,
  getDaysUntil,
  toISODate
} from '../src/utils/loanUtils.js';
import {
  buildClassLeaderboard,
  countWords,
  MIN_SUMMARY_WORDS
} from '../src/utils/readingUtils.js';
import { getDigitalTomeContent } from '../src/data/digitalTomesContent.js';

const VISUAL_BY_CATEGORY = {
  'Bards Tales': {
    coverRune: '☽',
    coverGradient: 'from-indigo-950 via-purple-900 to-slate-900',
    coverGradientStyle: 'linear-gradient(135deg, #1e1145 0%, #3b1d70 50%, #0f172a 100%)',
    accentColor: '#8B5CF6',
    ingredients: ['wind', 'shadow', 'ember']
  },
  Alchemy: {
    coverRune: '☉',
    coverGradient: 'from-emerald-950 via-teal-950 to-zinc-950',
    coverGradientStyle: 'linear-gradient(135deg, #062e22 0%, #064e3b 50%, #091a13 100%)',
    accentColor: '#10B981',
    ingredients: ['spark', 'craft']
  },
  'Artificers Craft': {
    coverRune: '✧',
    coverGradient: 'from-cyan-950 via-blue-950 to-neutral-950',
    coverGradientStyle: 'linear-gradient(135deg, #082f49 0%, #0369a1 50%, #091728 100%)',
    accentColor: '#06B6D4',
    ingredients: ['craft', 'spark']
  },
  'Ancient Lore': {
    coverRune: '🜃',
    coverGradient: 'from-yellow-950 via-amber-900 to-neutral-950',
    coverGradientStyle: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #1c1917 100%)',
    accentColor: '#D4AF37',
    ingredients: ['wisdom', 'ember']
  },
  Philosophy: {
    coverRune: '🜂',
    coverGradient: 'from-amber-950 via-stone-900 to-neutral-950',
    coverGradientStyle: 'linear-gradient(135deg, #2e1e12 0%, #573318 50%, #171311 100%)',
    accentColor: '#D4AF37',
    ingredients: ['wisdom', 'craft']
  }
};

const BOOK_INCLUDE = {
  reviews: {
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          role: true,
          kelas_label: true
        }
      }
    }
  },
  _count: { select: { loans: true } }
};

async function recalculateBookRating(db, bookId) {
  const agg = await db.review.aggregate({
    where: {
      bookId,
      rating: { not: null }
    },
    _avg: { rating: true },
    _count: { rating: true }
  });

  const ratedCount = Number(agg._count?.rating || 0);
  const nextRating =
    ratedCount > 0 ? Number((Number(agg._avg?.rating) || 0).toFixed(1)) : 0;

  return db.book.update({
    where: { id: bookId },
    data: { rating: nextRating },
    include: BOOK_INCLUDE
  });
}

function serializeBook(book, index = 0) {
  const category = book.category || 'Literasi & Umum';
  const visual = VISUAL_BY_CATEGORY[category] || {
    coverRune: '✦',
    coverGradient: 'from-amber-950 via-stone-900 to-neutral-950',
    accentColor: '#D4AF37',
    ingredients: ['wisdom', 'spark']
  };
  const digitalContent =
    Array.isArray(book.chapters) && book.chapters.length > 0
      ? book.chapters
      : getDigitalTomeContent({
          title: book.judul,
          author: book.penulis,
          category
        });
  const totalStock = Math.max(Number(book.total_stok || 0), Number(book.stok_fisik || 0));
  const stokFisik = Math.max(0, Number(book.stok_fisik || 0));

  const rawReviews = Array.isArray(book.reviews) ? book.reviews : [];
  const ratedReviews = rawReviews.filter(
    (r) => r.rating !== null && r.rating !== undefined && Number(r.rating) >= 1
  );
  const computedRating =
    ratedReviews.length > 0
      ? Number(
          (
            ratedReviews.reduce((sum, r) => sum + Number(r.rating), 0) /
            ratedReviews.length
          ).toFixed(1)
        )
      : book.rating !== null && book.rating !== undefined && Number.isFinite(Number(book.rating))
        ? Number(Number(book.rating).toFixed(1))
        : 0;

  return enrichBook(
    {
      id: book.id,
      kodeBuku: book.kode_buku,
      kode_buku: book.kode_buku,
      title: book.judul,
      judul: book.judul,
      subtitle: book.subtitle || `${book.jenis_buku || 'Pustaka'} • ${book.jenjang || 'Umum'}`,
      author: book.penulis,
      penulis: book.penulis,
      publisher: book.penerbit || '-',
      penerbit: book.penerbit || '-',
      publicationYear: Number(book.tahun_terbit) || 2024,
      tahun_terbit: Number(book.tahun_terbit) || 2024,
      jenjang: book.jenjang || 'Umum',
      kelas: book.kelas || 'Semua',
      jurusan: book.jurusan || 'Semua Jurusan',
      jenisBuku: book.jenis_buku || 'Umum',
      jenis_buku: book.jenis_buku || 'Umum',
      category,
      categoryLabel: `${category} (${book.jenis_buku || 'Pustaka Sekolah'})`,
      rating: computedRating,
      ratingCount: ratedReviews.length,
      xpReward: Number(book.xp_reward) || 120,
      pages: Number(book.pages) || 240,
      isbn: book.isbn || '',
      ddc: book.ddc || '000',
      callNumber: book.call_number || undefined,
      shelf: book.shelf || 'Rak Utama',
      status: stokFisik > 0 ? 'available' : 'borrowed',
      available: stokFisik > 0,
      totalStock,
      total_stok: totalStock,
      availableStock: stokFisik,
      stokFisik,
      stok_fisik: stokFisik,
      hasDigital: Boolean(book.link_pdf || (digitalContent && digitalContent.length > 0)),
      coverUrl: book.link_cover || '',
      link_cover: book.link_cover || '',
      pdfUrl: book.link_pdf || '',
      link_pdf: book.link_pdf || '',
      synopsis: book.synopsis || `${book.judul} oleh ${book.penulis}.`,
      digitalContent,
      coverRune: visual.coverRune,
      coverGradient: visual.coverGradient,
      coverGradientStyle: visual.coverGradientStyle,
      accentColor: visual.accentColor,
      ingredients: visual.ingredients,
      popular: (book._count?.loans || 0) > 1 || totalStock - stokFisik > 0,
      loanCount: book._count?.loans || 0,
      reviews: rawReviews.map((r) => ({
        id: r.id,
        userId: r.userId || null,
        user: r.reviewer_name,
        username: r.user?.username || null,
        role: r.user?.role ? String(r.user.role).toLowerCase() : null,
        rating: r.rating !== null && r.rating !== undefined ? Number(r.rating) : null,
        comment: r.comment,
        createdAt: r.createdAt,
        date: new Date(r.createdAt).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      }))
    },
    index
  );
}

function mapLoanStatusToUi(status) {
  const value = String(status || '').toUpperCase();
  if (value === 'ACTIVE' || value === 'OVERDUE' || value === 'APPROVED') return 'approved';
  if (value === 'RETURNED') return 'returned';
  if (value === 'REJECTED') return 'rejected';
  return 'pending';
}

function serializeLoan(loan) {
  const borrower = serializeUser(loan.user);
  const dueIso = loan.jatuh_tempo ? toISODate(loan.jatuh_tempo) : null;
  const borrowedDateObj = loan.tanggal_pinjam ? new Date(loan.tanggal_pinjam) : new Date();
  const borrowedDateISO = toISODate(borrowedDateObj);
  const statusUi = mapLoanStatusToUi(loan.status);

  return {
    id: loan.id,
    bookId: loan.bookId,
    kodeBuku: loan.book?.kode_buku || '',
    bookTitle: loan.book?.judul || 'Buku Pustaka',
    borrowerId: loan.userId,
    borrowerName: borrower?.name || 'Anggota',
    requesterName: borrower?.name || 'Anggota',
    requesterUsername: borrower?.username || '',
    requesterRole: borrower?.role || 'siswa',
    profileId: borrower?.id || loan.userId,
    borrowerCard: borrower?.cardCode || borrower?.nisn || '',
    borrowerNisn: borrower?.nisn || '',
    borrowerLevel: borrower?.level || '',
    borrowerPhone: borrower?.phone || '',
    className: loan.kelas_sasaran || borrower?.className || 'Umum',
    classLabel: borrower?.classLabel || 'Umum',
    loanType: loan.loan_type,
    loan_type: loan.loan_type,
    isPackage: loan.loan_type === 'CLASS_PACKAGE',
    targetClass: loan.kelas_sasaran || '',
    kelas_sasaran: loan.kelas_sasaran || '',
    lessonHours: loan.jam_pelajaran || '',
    jam_pelajaran: loan.jam_pelajaran || '',
    quantity: Number(loan.jumlah_eksemplar) || 1,
    jumlah_eksemplar: Number(loan.jumlah_eksemplar) || 1,
    borrowedDate: formatDateID(borrowedDateObj),
    borrowedDateISO,
    dueDate: dueIso,
    daysLeft: dueIso ? getDaysUntil(dueIso) : Number(loan.durasi_hari) || 7,
    maxDays: Number(loan.durasi_hari) || 7,
    status: statusUi,
    dbStatus: loan.status,
    notes: loan.catatan || '',
    rejectionReason: loan.alasan_tolak || '',
    returnedAt: loan.tanggal_kembali ? toISODate(loan.tanggal_kembali) : null,
    transactionMethod: loan.metode_transaksi || 'CATALOG',
    createdAt: loan.createdAt
  };
}

function mapLogStatusToUi(status) {
  const value = String(status || '').toUpperCase();
  if (value === 'DINILAI' || value === 'GRADED') return 'graded';
  if (value === 'PERLU_REVISI' || value === 'NEEDS_REVISION') return 'needs_revision';
  return 'submitted';
}

function serializeReadingLog(log) {
  const user = serializeUser(log.user);
  const wordCount = Number(log.jumlah_kata) || countWords(log.ringkasan_hikmah || '');
  return {
    id: log.id,
    profileId: log.userId,
    studentId: log.userId,
    studentCard: user?.cardCode || user?.nisn || '',
    studentNisn: user?.nisn || '',
    studentName: user?.name || 'Siswa',
    className: user?.className || 'Umum',
    jenjang: user?.jenjang || 'SMK',
    kelas: user?.kelas || '10',
    jurusan: user?.jurusan || 'Semua Jurusan',
    bookId: log.bookId,
    kodeBuku: log.book?.kode_buku || '',
    bookTitle: log.book?.judul || 'Buku Pustaka',
    bookAuthor: log.book?.penulis || '',
    halaman_terakhir: Number(log.halaman_terakhir) || 0,
    lastPageRead: Number(log.halaman_terakhir) || 0,
    kutipan_favorit: log.kutipan_favorit || '',
    favoriteQuote: log.kutipan_favorit || '',
    ringkasan_hikmah: log.ringkasan_hikmah || '',
    summary: log.ringkasan_hikmah || '',
    wordCount,
    nilai_guru: log.nilai_guru != null ? Number(log.nilai_guru) : null,
    score: log.nilai_guru != null ? Number(log.nilai_guru) : null,
    catatan_guru: log.catatan_guru || '',
    feedback: log.catatan_guru || '',
    status_penilaian: log.status_penilaian,
    status: mapLogStatusToUi(log.status_penilaian),
    gradedBy: log.dinilai_oleh || '',
    submittedAt: log.tanggal_baca ? new Date(log.tanggal_baca).toISOString() : new Date().toISOString(),
    createdAt: log.createdAt
  };
}

function serializeBookmark(bm) {
  if (!bm) return null;
  return {
    id: bm.id,
    userId: bm.userId,
    bookId: bm.bookId,
    halaman_terakhir: Number(bm.halaman_terakhir) || 1,
    lastPageRead: Number(bm.halaman_terakhir) || 1,
    source: bm.source || 'text',
    chapterIndex: Number(bm.chapter_index) || 0,
    chapterTitle: bm.chapter_title || '',
    totalChapters: Math.max(1, Number(bm.total_chapters) || 1),
    scrollRatio: Number(bm.scroll_ratio) || 0,
    progressPercent: Number(bm.progress_percent) || 0,
    updatedAt: bm.updatedAt ? new Date(bm.updatedAt).toISOString() : new Date().toISOString()
  };
}

function buildApiRouter() {
  const router = express.Router();

  router.get('/health', async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, database: 'postgresql', orm: 'prisma' });
  });

  // ===========================================================================
  // AUTH: PURE USERNAME & PASSWORD + HTTP-ONLY COOKIE JWT
  // ===========================================================================
  router.get('/auth/me', (req, res) => {
    res.json({ user: serializeUser(req.user) });
  });

  router.post('/auth/login', async (req, res) => {
    const cleanUsername = String(req.body?.username || '')
      .trim()
      .replace(/^@+/, '');
    const password = String(req.body?.password || '');

    if (!cleanUsername || !password) {
      return res.status(400).json({
        error: 'Username dan password wajib diisi.'
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: cleanUsername,
          mode: 'insensitive'
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Username tidak terdaftar di database perpustakaan.'
      });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return res.status(401).json({
        error: 'Password salah. Periksa kembali kredensial akun Anda.'
      });
    }

    const token = await signSessionToken(user);
    setSessionCookie(res, token, req);

    return res.json({ user: serializeUser(user) });
  });

  router.post('/auth/register', async (req, res) => {
    const rawUsername = String(req.body?.username || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/[^a-z0-9._-]/g, '');
    const password = String(req.body?.password || '');
    const nama = String(req.body?.nama || req.body?.name || '').trim();
    const rawNisn = normalizeNisn(req.body?.nisn || '');
    const jenjang = String(req.body?.jenjang || 'SMK').trim();
    const kelas = String(req.body?.kelas || '10').trim();
    const jurusan = String(req.body?.jurusan || 'Semua Jurusan').trim();

    if (!rawUsername || rawUsername.length < 3) {
      return res.status(400).json({
        error: 'Username minimal 3 karakter huruf/angka.'
      });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({
        error: 'Password minimal 6 karakter.'
      });
    }
    if (!nama) {
      return res.status(400).json({
        error: 'Nama lengkap wajib diisi.'
      });
    }
    if (rawNisn && !/^\d{6,20}$/.test(rawNisn)) {
      return res.status(400).json({
        error: 'NISN harus berupa teks digit angka (6–20 digit), contoh: 0081234567.'
      });
    }

    const existingUsername = await prisma.user.findFirst({
      where: { username: { equals: rawUsername, mode: 'insensitive' } }
    });
    if (existingUsername) {
      return res.status(409).json({
        error: `Username "${rawUsername}" sudah digunakan. Pilih username lain.`
      });
    }

    if (rawNisn) {
      const existingNisn = await prisma.user.findUnique({ where: { nisn: rawNisn } });
      if (existingNisn) {
        return res.status(409).json({
          error: `NISN "${rawNisn}" sudah terdaftar atas nama ${existingNisn.nama}.`
        });
      }
    }

    const passwordHash = await hashPassword(password);
    const jurusanSuffix =
      jenjang === 'SMK' && jurusan && jurusan !== 'Semua Jurusan' ? ` ${jurusan}` : '';
    const kelasLabel = `${jenjang} Kelas ${kelas}${jurusanSuffix}`;
    const cardCode = rawNisn
      ? `ARC-${rawNisn.slice(-6)}`
      : `ARC-${Math.floor(100000 + Math.random() * 899999)}`;

    const createdUser = await prisma.user.create({
      data: {
        username: rawUsername,
        password: passwordHash,
        role: Role.SISWA,
        nama,
        nisn: rawNisn || null,
        jenjang,
        kelas,
        jurusan,
        kelas_label: kelasLabel,
        guild_id: cardCode,
        title: `Siswa ${kelasLabel}`,
        phone: String(req.body?.phone || '').trim() || null
      }
    });

    const token = await signSessionToken(createdUser);
    setSessionCookie(res, token, req);

    return res.status(201).json({ user: serializeUser(createdUser) });
  });

  router.post('/auth/logout', (req, res) => {
    clearSessionCookie(res, req);
    res.json({ ok: true });
  });

  router.post('/auth/xp', requireAuth, async (req, res) => {
    const delta = Math.max(0, Math.min(1000, Number(req.body?.delta || 0)));
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { xp: { increment: delta } }
    });
    res.json({ user: serializeUser(updated) });
  });

  // ===========================================================================
  // BOOKS CATALOG, SEARCH, FILTERS & EXCEL BULK IMPORT
  // ===========================================================================
  router.get('/books', async (req, res) => {
    const normFilter = (val) => {
      const s = String(val || '').trim();
      if (!s || s === 'Semua') return 'All';
      return s;
    };
    const jenjang = normFilter(req.query.jenjang);
    const kelas = normFilter(req.query.kelas);
    const jurusan = normFilter(req.query.jurusan);
    const jenisBuku = normFilter(req.query.jenis_buku || req.query.jenisBuku);
    const category = normFilter(req.query.category);
    const search = String(req.query.search || '').trim();
    const kodeBuku = String(req.query.kode_buku || '').trim();

    const where = {};
    if (kodeBuku) {
      where.kode_buku = { equals: kodeBuku, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { judul: { contains: search, mode: 'insensitive' } },
        { penulis: { contains: search, mode: 'insensitive' } },
        { kode_buku: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } },
        { synopsis: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (category && category !== 'All') {
      where.category = category;
    }

    const dbBooks = await prisma.book.findMany({
      where,
      include: BOOK_INCLUDE,
      orderBy: [{ createdAt: 'asc' }]
    });

    const serialized = dbBooks
      .map((b, idx) => serializeBook(b, idx))
      .filter((book) =>
        matchesCurriculumFilter(book, {
          jenjang,
          kelas,
          jurusan,
          jenisBuku
        })
      );

    res.json({ books: serialized });
  });

  router.post('/books', requireRoles('ADMIN'), async (req, res) => {
    const body = req.body || {};
    const kodeBuku = String(body.kode_buku || body.kodeBuku || '')
      .trim()
      .toUpperCase();
    const judul = String(body.judul || body.title || '').trim();
    const penulis = String(body.penulis || body.author || '').trim();

    if (!kodeBuku || !judul || !penulis) {
      return res.status(400).json({
        error: 'Kode_Buku, Judul_Buku, dan Penulis wajib diisi.'
      });
    }

    const existing = await prisma.book.findUnique({ where: { kode_buku: kodeBuku } });
    if (existing) {
      return res.status(409).json({
        error: `Kode buku "${kodeBuku}" sudah terdaftar untuk judul "${existing.judul}".`
      });
    }

    const stok = Math.max(0, Number(body.stok_fisik ?? body.totalStock ?? 1));
    const created = await prisma.book.create({
      data: {
        kode_buku: kodeBuku,
        judul,
        subtitle: body.subtitle || null,
        penulis,
        penerbit: String(body.penerbit || body.publisher || '-').trim(),
        tahun_terbit: Number(body.tahun_terbit || body.publicationYear) || 2024,
        jenjang: String(body.jenjang || 'Umum').trim(),
        kelas: String(body.kelas || 'Semua').trim(),
        jurusan: String(body.jurusan || 'Semua Jurusan').trim(),
        jenis_buku: String(body.jenis_buku || body.jenisBuku || 'Umum').trim(),
        category: String(body.category || 'Literasi & Umum').trim(),
        stok_fisik: stok,
        total_stok: stok,
        link_cover: body.link_cover || body.coverUrl || null,
        link_pdf: body.link_pdf || body.pdfUrl || null,
        shelf: body.shelf || 'Rak Baru',
        isbn: body.isbn || null,
        ddc: body.ddc || '000',
        call_number: body.callNumber || null,
        pages: Number(body.pages) || 240,
        xp_reward: Number(body.xpReward) || 120,
        synopsis: body.synopsis || null,
        chapters: Array.isArray(body.digitalContent) ? body.digitalContent : null
      },
      include: BOOK_INCLUDE
    });

    return res.status(201).json({ book: serializeBook(created) });
  });

  router.post('/books/bulk', requireRoles('ADMIN'), async (req, res) => {
    const incoming = Array.isArray(req.body?.books) ? req.body.books : [];
    if (incoming.length === 0) {
      return res.status(400).json({ error: 'Tidak ada data buku yang dikirim.' });
    }

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const row of incoming) {
      const kodeBuku = String(row.kode_buku || row.kodeBuku || '')
        .trim()
        .toUpperCase();
      const judul = String(row.judul || row.title || '').trim();
      const penulis = String(row.penulis || row.author || 'Anonim').trim();

      if (!kodeBuku || !judul) {
        skippedCount += 1;
        continue;
      }

      const stok = Math.max(0, Number(row.stok_fisik ?? row.availableStock ?? row.totalStock ?? 1));
      const existing = await prisma.book.findUnique({ where: { kode_buku: kodeBuku } });

      if (existing) {
        // Append stock tanpa menghapus atau merusak buku lama
        await prisma.book.update({
          where: { kode_buku: kodeBuku },
          data: {
            judul,
            penulis,
            penerbit: String(row.penerbit || row.publisher || existing.penerbit),
            tahun_terbit: Number(row.tahun_terbit || row.publicationYear) || existing.tahun_terbit,
            jenjang: String(row.jenjang || existing.jenjang),
            kelas: String(row.kelas || existing.kelas),
            jurusan: String(row.jurusan || existing.jurusan),
            jenis_buku: String(row.jenis_buku || row.jenisBuku || existing.jenis_buku),
            category: String(row.category || existing.category),
            stok_fisik: existing.stok_fisik + stok,
            total_stok: existing.total_stok + stok,
            link_cover: row.link_cover || row.coverUrl || existing.link_cover,
            link_pdf: row.link_pdf || row.pdfUrl || existing.link_pdf,
            shelf: row.shelf || existing.shelf,
            isbn: row.isbn || existing.isbn
          }
        });
        updatedCount += 1;
      } else {
        await prisma.book.create({
          data: {
            kode_buku: kodeBuku,
            judul,
            subtitle: row.subtitle || null,
            penulis,
            penerbit: String(row.penerbit || row.publisher || '-'),
            tahun_terbit: Number(row.tahun_terbit || row.publicationYear) || 2024,
            jenjang: String(row.jenjang || 'Umum'),
            kelas: String(row.kelas || 'Semua'),
            jurusan: String(row.jurusan || 'Semua Jurusan'),
            jenis_buku: String(row.jenis_buku || row.jenisBuku || 'Umum'),
            category: String(row.category || 'Literasi & Umum'),
            stok_fisik: stok,
            total_stok: stok,
            link_cover: row.link_cover || row.coverUrl || null,
            link_pdf: row.link_pdf || row.pdfUrl || null,
            shelf: row.shelf || 'Rak Baru',
            isbn: row.isbn || null,
            ddc: row.ddc || '000',
            call_number: row.callNumber || null,
            pages: Number(row.pages) || 240,
            xp_reward: Number(row.xpReward) || 120,
            synopsis: row.synopsis || `${judul} — ${penulis}`
          }
        });
        insertedCount += 1;
      }
    }

    const allBooks = await prisma.book.findMany({
      include: BOOK_INCLUDE,
      orderBy: [{ createdAt: 'asc' }]
    });

    return res.json({
      insertedCount,
      updatedCount,
      skippedCount,
      books: allBooks.map((b, idx) => serializeBook(b, idx))
    });
  });

  router.patch('/books/:id/stock', requireRoles('ADMIN'), async (req, res) => {
    const delta = Number(req.body?.delta || 0);
    const stockType = String(req.body?.stockType || 'available');
    const existing = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Buku tidak ditemukan.' });
    }

    let nextTotal = existing.total_stok;
    let nextAvailable = existing.stok_fisik;

    if (stockType === 'total') {
      nextTotal = Math.max(1, existing.total_stok + delta);
      if (nextAvailable > nextTotal) nextAvailable = nextTotal;
    } else {
      nextAvailable = Math.max(0, Math.min(nextTotal, existing.stok_fisik + delta));
    }

    const updated = await prisma.book.update({
      where: { id: existing.id },
      data: {
        total_stok: nextTotal,
        stok_fisik: nextAvailable
      },
      include: BOOK_INCLUDE
    });

    res.json({ book: serializeBook(updated) });
  });

  // ===========================================================================
  // USERS / MEMBERS MANAGEMENT & NISN LOOKUP
  // ===========================================================================
  router.get('/users', requireRoles('ADMIN', 'GURU'), async (req, res) => {
    const nisnQuery = normalizeNisn(req.query.nisn || '');
    const search = String(req.query.search || '').trim();

    const where = {};
    if (nisnQuery) {
      where.OR = [
        { nisn: { equals: nisnQuery } },
        { guild_id: { equals: String(req.query.nisn).trim(), mode: 'insensitive' } }
      ];
    } else if (search) {
      where.OR = [
        { nisn: { contains: search } },
        { nama: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { guild_id: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: [{ role: 'asc' }, { nama: 'asc' }]
    });

    res.json({ users: users.map(serializeUser) });
  });

  router.post('/users', requireRoles('ADMIN'), async (req, res) => {
    const body = req.body || {};
    const nama = String(body.nama || body.name || '').trim();
    const rawNisn = normalizeNisn(body.nisn || '');
    const rawRole = String(body.role || 'SISWA').toUpperCase();
    const roleEnum = rawRole === 'ADMIN' ? Role.ADMIN : rawRole === 'GURU' ? Role.GURU : Role.SISWA;
    const rawUsername = String(
      body.username || (rawNisn ? `siswa.${rawNisn}` : nama.toLowerCase().replace(/[^a-z0-9]+/g, '.'))
    )
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '');
    const plainPassword = String(body.password || 'password123');
    const jenjang = String(body.jenjang || 'SMK').trim();
    const kelas = String(body.kelas || '10').trim();
    const jurusan = String(body.jurusan || 'Semua Jurusan').trim();

    if (!nama || !rawUsername) {
      return res.status(400).json({ error: 'Nama dan username wajib diisi.' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: rawUsername, mode: 'insensitive' } },
          ...(rawNisn ? [{ nisn: rawNisn }] : [])
        ]
      }
    });
    if (existingUser) {
      return res.status(409).json({
        error: `Username "${rawUsername}" atau NISN "${rawNisn}" sudah terdaftar.`
      });
    }

    const passwordHash = await hashPassword(plainPassword);
    const jurusanSuffix =
      jenjang === 'SMK' && jurusan && jurusan !== 'Semua Jurusan' ? ` ${jurusan}` : '';
    const kelasLabel = body.className || `${jenjang} Kelas ${kelas}${jurusanSuffix}`;
    const cardCode =
      body.cardCode ||
      (rawNisn ? `ARC-${rawNisn.slice(-6)}` : `ARC-${Math.floor(100000 + Math.random() * 899999)}`);

    const created = await prisma.user.create({
      data: {
        username: rawUsername,
        password: passwordHash,
        role: roleEnum,
        nama,
        nisn: rawNisn || null,
        jenjang,
        kelas,
        jurusan,
        kelas_label: kelasLabel,
        guild_id: cardCode,
        phone: String(body.phone || '').trim() || null
      }
    });

    res.status(201).json({ user: serializeUser(created) });
  });

  router.post('/users/bulk', requireRoles('ADMIN'), async (req, res) => {
    const incoming = Array.isArray(req.body?.users) ? req.body.users : [];
    if (incoming.length === 0) {
      return res.status(400).json({ error: 'Data anggota Excel kosong.' });
    }

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const row of incoming) {
      const nama = String(row.nama || row.name || '').trim();
      const rawNisn = normalizeNisn(row.nisn || '');
      const rawUsername = String(
        row.username ||
          (rawNisn ? `siswa.${rawNisn}` : nama.toLowerCase().replace(/[^a-z0-9]+/g, '.'))
      )
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '');

      if (!nama || !rawUsername) {
        skippedCount += 1;
        continue;
      }

      const jenjang = String(row.jenjang || 'SMK').trim();
      const kelas = String(row.kelas || '10').trim();
      const jurusan = String(row.jurusan || 'Semua Jurusan').trim();
      const jurusanSuffix =
        jenjang === 'SMK' && jurusan && jurusan !== 'Semua Jurusan' ? ` ${jurusan}` : '';
      const kelasLabel = row.className || `${jenjang} Kelas ${kelas}${jurusanSuffix}`;

      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: rawUsername, mode: 'insensitive' } },
            ...(rawNisn ? [{ nisn: rawNisn }] : [])
          ]
        }
      });

      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            nama,
            nisn: rawNisn || existing.nisn,
            jenjang,
            kelas,
            jurusan,
            kelas_label: kelasLabel,
            phone: row.phone ? String(row.phone) : existing.phone
          }
        });
        updatedCount += 1;
      } else {
        const passwordHash = await hashPassword(String(row.password || 'password123'));
        await prisma.user.create({
          data: {
            username: rawUsername,
            password: passwordHash,
            role: Role.SISWA,
            nama,
            nisn: rawNisn || null,
            jenjang,
            kelas,
            jurusan,
            kelas_label: kelasLabel,
            guild_id: row.cardCode || (rawNisn ? `ARC-${rawNisn.slice(-6)}` : null),
            phone: row.phone ? String(row.phone) : null
          }
        });
        insertedCount += 1;
      }
    }

    const users = await prisma.user.findMany({
      orderBy: [{ role: 'asc' }, { nama: 'asc' }]
    });

    res.json({
      insertedCount,
      updatedCount,
      skippedCount,
      users: users.map(serializeUser)
    });
  });

  // ===========================================================================
  // LOANS: STUDENT LOANS, CLASS PACKAGES (GURU), & BARCODE/NISN QUICK SCANNER
  // ===========================================================================
  router.get('/loans', requireAuth, async (req, res) => {
    const isStaff = req.user.role === Role.ADMIN || req.user.role === Role.GURU;
    const loans = await prisma.loan.findMany({
      where: isStaff ? {} : { userId: req.user.id },
      include: {
        user: true,
        book: true
      },
      orderBy: [{ createdAt: 'desc' }]
    });

    res.json({ loans: loans.map(serializeLoan) });
  });

  router.post('/loans', requireAuth, async (req, res) => {
    const body = req.body || {};
    const bookId = String(body.bookId || '').trim();
    const quantity = Math.max(1, Number(body.quantity ?? body.jumlah_eksemplar ?? 1));
    const durasiHari = Math.max(1, Number(body.durasi_hari ?? body.maxDays ?? 7));
    const notes = String(body.notes || body.catatan || '').trim();
    const isTeacherOrAdmin = req.user.role === Role.GURU || req.user.role === Role.ADMIN;
    const loanType = String(
      body.loan_type || (isTeacherOrAdmin && quantity > 1 ? 'CLASS_PACKAGE' : isTeacherOrAdmin ? 'TEACHER_SELF' : 'STUDENT_PHYSICAL')
    );
    const shouldAutoApprove = Boolean(body.autoApprove && isTeacherOrAdmin);

    if (!bookId) {
      return res.status(400).json({ error: 'ID buku wajib disertakan.' });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const book = await tx.book.findUnique({ where: { id: bookId } });
        if (!book) {
          throw Object.assign(new Error('Buku tidak ditemukan di database.'), { status: 404 });
        }
        if (book.stok_fisik < quantity) {
          const errorMessage =
            req.user?.role === 'ADMIN'
              ? `Stok fisik tidak mencukupi. Tersisa ${book.stok_fisik} eksemplar.`
              : 'Permintaan peminjaman fisik belum dapat dipenuhi saat ini. Silakan hubungi pustakawan atau gunakan fitur Baca Digital.';
          throw Object.assign(new Error(errorMessage), { status: 409 });
        }

        if (!isTeacherOrAdmin) {
          const duplicate = await tx.loan.findFirst({
            where: {
              userId: req.user.id,
              bookId,
              status: { in: ['PENDING', 'ACTIVE', 'OVERDUE'] }
            }
          });
          if (duplicate) {
            throw Object.assign(
              new Error('Anda masih memiliki pengajuan/pinjaman aktif untuk buku ini.'),
              { status: 409 }
            );
          }
        }

        let updatedBook = book;
        if (shouldAutoApprove) {
          updatedBook = await tx.book.update({
            where: { id: bookId },
            data: { stok_fisik: { decrement: quantity } },
            include: BOOK_INCLUDE
          });
        }

        const now = new Date();
        const createdLoan = await tx.loan.create({
          data: {
            userId: req.user.id,
            bookId,
            loan_type: loanType,
            status: shouldAutoApprove ? 'ACTIVE' : 'PENDING',
            jumlah_eksemplar: quantity,
            kelas_sasaran: body.kelas_sasaran || body.targetClass || null,
            jam_pelajaran: body.jam_pelajaran || body.lessonHours || null,
            durasi_hari: durasiHari,
            tanggal_pinjam: now,
            tanggal_disetujui: shouldAutoApprove ? now : null,
            jatuh_tempo: shouldAutoApprove ? addDays(now, durasiHari) : null,
            catatan: notes || null,
            metode_transaksi: 'CATALOG'
          },
          include: { user: true, book: true }
        });

        return { loan: createdLoan, book: updatedBook };
      });

      const fullBook = await prisma.book.findUnique({
        where: { id: result.book.id },
        include: BOOK_INCLUDE
      });

      return res.status(201).json({
        loan: serializeLoan(result.loan),
        book: fullBook ? serializeBook(fullBook) : null
      });
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  router.post('/loans/quick', requireRoles('ADMIN', 'GURU'), async (req, res) => {
    const body = req.body || {};
    const memberCode = String(body.memberCode || body.nisn || '').trim();
    const bookCode = String(body.bookCode || body.kode_buku || '').trim();
    const memberId = String(body.memberId || '').trim();
    const bookId = String(body.bookId || '').trim();
    const quantity = Math.max(1, Number(body.quantity ?? body.jumlah_eksemplar ?? 1));
    const requestedDays = body.durasi_hari ? Number(body.durasi_hari) : null;
    const notes = String(body.notes || '').trim();

    if ((!memberId && !memberCode) || (!bookId && !bookCode)) {
      return res.status(400).json({
        error: 'NISN/Kartu Anggota dan Kode Buku/ISBN wajib dipindai atau dipilih.'
      });
    }

    const normalizedMemberNisn = normalizeNisn(memberCode);
    const targetUser = memberId
      ? await prisma.user.findUnique({ where: { id: memberId } })
      : await prisma.user.findFirst({
          where: {
            OR: [
              { nisn: { equals: normalizedMemberNisn || memberCode } },
              { guild_id: { equals: memberCode, mode: 'insensitive' } },
              { username: { equals: memberCode, mode: 'insensitive' } }
            ]
          }
        });

    if (!targetUser) {
      return res.status(404).json({
        error: `Anggota dengan NISN/Kode "${memberCode}" tidak ditemukan di database.`
      });
    }

    const targetBook = bookId
      ? await prisma.book.findUnique({ where: { id: bookId } })
      : await prisma.book.findFirst({
          where: {
            OR: [
              { kode_buku: { equals: bookCode, mode: 'insensitive' } },
              { isbn: { equals: bookCode, mode: 'insensitive' } }
            ]
          }
        });

    if (!targetBook) {
      return res.status(404).json({
        error: `Buku dengan kode/ISBN "${bookCode}" tidak ditemukan.`
      });
    }

    try {
      const durasi =
        requestedDays || (targetUser.role === Role.GURU ? 14 : 7);

      const txResult = await prisma.$transaction(async (tx) => {
        const freshBook = await tx.book.findUnique({ where: { id: targetBook.id } });
        if (!freshBook || freshBook.stok_fisik < quantity) {
          throw Object.assign(
            new Error(
              `Stok fisik "${targetBook.judul}" tidak cukup (tersedia ${freshBook?.stok_fisik ?? 0} eks).`
            ),
            { status: 409 }
          );
        }

        await tx.book.update({
          where: { id: freshBook.id },
          data: { stok_fisik: { decrement: quantity } }
        });

        const now = new Date();
        const createdLoan = await tx.loan.create({
          data: {
            userId: targetUser.id,
            bookId: freshBook.id,
            loan_type: targetUser.role === Role.GURU ? 'TEACHER_SELF' : 'STUDENT_PHYSICAL',
            status: 'ACTIVE',
            jumlah_eksemplar: quantity,
            durasi_hari: durasi,
            tanggal_pinjam: now,
            tanggal_disetujui: now,
            jatuh_tempo: addDays(now, durasi),
            catatan: notes || 'Transaksi kilat meja sirkulasi (Scan NISN & Barcode Buku)',
            metode_transaksi: 'QUICK_SCAN'
          },
          include: { user: true, book: true }
        });

        const updatedBook = await tx.book.findUnique({
          where: { id: freshBook.id },
          include: BOOK_INCLUDE
        });

        return { createdLoan, updatedBook };
      });

      return res.status(201).json({
        loan: serializeLoan(txResult.createdLoan),
        book: serializeBook(txResult.updatedBook),
        member: serializeUser(targetUser)
      });
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  router.patch('/loans/:id/approve', requireRoles('ADMIN', 'GURU'), async (req, res) => {
    try {
      const txResult = await prisma.$transaction(async (tx) => {
        const loan = await tx.loan.findUnique({
          where: { id: req.params.id },
          include: { book: true, user: true }
        });
        if (!loan) throw Object.assign(new Error('Pinjaman tidak ditemukan.'), { status: 404 });
        if (loan.status !== 'PENDING') {
          throw Object.assign(new Error('Hanya pengajuan berstatus PENDING yang dapat disetujui.'), {
            status: 409
          });
        }
        if (loan.book.stok_fisik < loan.jumlah_eksemplar) {
          throw Object.assign(
            new Error(`Stok buku "${loan.book.judul}" tersisa ${loan.book.stok_fisik}.`),
            { status: 409 }
          );
        }

        await tx.book.update({
          where: { id: loan.bookId },
          data: { stok_fisik: { decrement: loan.jumlah_eksemplar } }
        });

        const now = new Date();
        const updatedLoan = await tx.loan.update({
          where: { id: loan.id },
          data: {
            status: 'ACTIVE',
            tanggal_disetujui: now,
            jatuh_tempo: addDays(now, Number(loan.durasi_hari) || 7)
          },
          include: { user: true, book: true }
        });

        const updatedBook = await tx.book.findUnique({
          where: { id: loan.bookId },
          include: BOOK_INCLUDE
        });

        return { updatedLoan, updatedBook };
      });

      return res.json({
        loan: serializeLoan(txResult.updatedLoan),
        book: serializeBook(txResult.updatedBook)
      });
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  router.patch('/loans/:id/reject', requireRoles('ADMIN', 'GURU'), async (req, res) => {
    const reason = String(req.body?.reason || req.body?.alasan_tolak || 'Ditolak oleh pustakawan.').trim();
    const existing = await prisma.loan.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Pinjaman tidak ditemukan.' });

    const updatedLoan = await prisma.loan.update({
      where: { id: existing.id },
      data: {
        status: 'REJECTED',
        alasan_tolak: reason
      },
      include: { user: true, book: true }
    });

    return res.json({ loan: serializeLoan(updatedLoan) });
  });

  router.patch('/loans/:id/return', requireRoles('ADMIN', 'GURU'), async (req, res) => {
    try {
      const txResult = await prisma.$transaction(async (tx) => {
        const loan = await tx.loan.findUnique({
          where: { id: req.params.id },
          include: { book: true, user: true }
        });
        if (!loan) throw Object.assign(new Error('Pinjaman tidak ditemukan.'), { status: 404 });
        if (loan.status === 'RETURNED') {
          throw Object.assign(new Error('Pinjaman sudah dikembalikan sebelumnya.'), { status: 409 });
        }

        await tx.book.update({
          where: { id: loan.bookId },
          data: { stok_fisik: { increment: loan.jumlah_eksemplar } }
        });

        const updatedLoan = await tx.loan.update({
          where: { id: loan.id },
          data: {
            status: 'RETURNED',
            tanggal_kembali: new Date()
          },
          include: { user: true, book: true }
        });

        await tx.user.update({
          where: { id: loan.userId },
          data: { xp: { increment: Number(loan.book?.xp_reward || 50) } }
        });

        const updatedBook = await tx.book.findUnique({
          where: { id: loan.bookId },
          include: BOOK_INCLUDE
        });

        return { updatedLoan, updatedBook };
      });

      return res.json({
        loan: serializeLoan(txResult.updatedLoan),
        book: serializeBook(txResult.updatedBook)
      });
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // ===========================================================================
  // READING LOGS (GLS LITERACY JOURNAL) & CLASS LEADERBOARD
  // ===========================================================================
  router.get('/reading-logs', requireAuth, async (req, res) => {
    const isStaff = req.user.role === Role.ADMIN || req.user.role === Role.GURU;
    const logs = await prisma.readingLog.findMany({
      where: isStaff ? {} : { userId: req.user.id },
      include: { user: true, book: true },
      orderBy: [{ tanggal_baca: 'desc' }]
    });

    res.json({ readingLogs: logs.map(serializeReadingLog) });
  });

  router.post('/reading-logs', requireAuth, async (req, res) => {
    const body = req.body || {};
    const bookId = String(body.bookId || '').trim();
    const lastPageRead = Number(body.halaman_terakhir ?? body.lastPageRead ?? 0);
    const favoriteQuote = String(body.kutipan_favorit ?? body.favoriteQuote ?? '').trim();
    const summary = String(body.ringkasan_hikmah ?? body.summary ?? '').trim();
    const words = countWords(summary);

    if (!bookId || !favoriteQuote || !summary) {
      return res.status(400).json({
        error: 'Buku, kutipan favorit, dan ringkasan hikmah wajib diisi.'
      });
    }
    if (words < MIN_SUMMARY_WORDS) {
      return res.status(400).json({
        error: `Ringkasan refleksi minimal ${MIN_SUMMARY_WORDS} kata (saat ini baru ${words} kata).`
      });
    }

    const existingBook = await prisma.book.findUnique({ where: { id: bookId } });
    if (!existingBook) {
      return res.status(404).json({ error: 'Buku tidak ditemukan di database.' });
    }

    let saved;
    if (body.logId) {
      const existingLog = await prisma.readingLog.findUnique({ where: { id: String(body.logId) } });
      if (!existingLog || existingLog.userId !== req.user.id) {
        return res.status(403).json({ error: 'Tidak dapat mengubah jurnal siswa lain.' });
      }
      saved = await prisma.readingLog.update({
        where: { id: existingLog.id },
        data: {
          halaman_terakhir: lastPageRead,
          kutipan_favorit: favoriteQuote,
          ringkasan_hikmah: summary,
          jumlah_kata: words,
          status_penilaian: 'MENUNGGU_VALIDASI',
          tanggal_baca: new Date()
        },
        include: { user: true, book: true }
      });
    } else {
      saved = await prisma.readingLog.create({
        data: {
          userId: req.user.id,
          bookId,
          halaman_terakhir: lastPageRead,
          kutipan_favorit: favoriteQuote,
          ringkasan_hikmah: summary,
          jumlah_kata: words,
          status_penilaian: 'MENUNGGU_VALIDASI'
        },
        include: { user: true, book: true }
      });
    }

    res.status(201).json({ readingLog: serializeReadingLog(saved) });
  });

  router.patch('/reading-logs/:id/grade', requireRoles('GURU', 'ADMIN'), async (req, res) => {
    const body = req.body || {};
    const statusRaw = String(body.status || body.status_penilaian || 'graded').toLowerCase();
    const dbStatus =
      statusRaw === 'needs_revision' || statusRaw === 'perlu_revisi'
        ? 'PERLU_REVISI'
        : 'DINILAI';
    const score = body.score != null || body.nilai_guru != null
      ? Number(body.score ?? body.nilai_guru)
      : null;
    const feedback = String(body.feedback ?? body.catatan_guru ?? '').trim();

    const existing = await prisma.readingLog.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Jurnal baca tidak ditemukan.' });
    }

    const updated = await prisma.readingLog.update({
      where: { id: existing.id },
      data: {
        nilai_guru: score,
        catatan_guru: feedback || null,
        status_penilaian: dbStatus,
        dinilai_oleh: req.user.nama
      },
      include: { user: true, book: true }
    });

    if (dbStatus === 'DINILAI' && existing.status_penilaian !== 'DINILAI') {
      await prisma.user.update({
        where: { id: existing.userId },
        data: { xp: { increment: 50 } }
      });
    }

    res.json({ readingLog: serializeReadingLog(updated) });
  });

  router.get('/leaderboard', async (_req, res) => {
    const [logs, loans] = await Promise.all([
      prisma.readingLog.findMany({ include: { user: true, book: true } }),
      prisma.loan.findMany({ include: { user: true, book: true } })
    ]);

    const serializedLogs = logs.map(serializeReadingLog);
    const serializedLoans = loans.map(serializeLoan);

    const leaderboard = buildClassLeaderboard({
      loans: serializedLoans,
      readingLogs: serializedLogs
    });
    res.json({ leaderboard });
  });

  // ===========================================================================
  // BOOKMARKS (AUTO-RESUME POSISI BACA TERAKHIR USER)
  // ===========================================================================
  router.get('/bookmarks', requireAuth, async (req, res) => {
    const bookId = req.query.bookId ? String(req.query.bookId) : null;
    const source = req.query.source ? String(req.query.source) : 'text';

    if (bookId) {
      const bm = await prisma.bookmark.findUnique({
        where: {
          userId_bookId_source: {
            userId: req.user.id,
            bookId,
            source
          }
        }
      });
      return res.json({ bookmark: serializeBookmark(bm) });
    }

    const list = await prisma.bookmark.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' }
    });
    return res.json({ bookmarks: list.map(serializeBookmark) });
  });

  router.put('/bookmarks', requireAuth, async (req, res) => {
    const body = req.body || {};
    const bookId = String(body.bookId || '').trim();
    const source = String(body.source || 'text').trim();

    if (!bookId) {
      return res.status(400).json({ error: 'bookId wajib disertakan untuk bookmark.' });
    }

    const chapterIndex = Math.max(0, Number(body.chapterIndex ?? body.chapter_index ?? 0));
    const totalChapters = Math.max(1, Number(body.totalChapters ?? body.total_chapters ?? 1));
    const scrollRatio = Math.max(0, Math.min(1, Number(body.scrollRatio ?? body.scroll_ratio ?? 0)));
    const progressPercent = Math.max(
      0,
      Math.min(100, Number(body.progressPercent ?? body.progress_percent ?? 0))
    );
    const halamanTerakhir = Math.max(
      1,
      Number(body.halaman_terakhir ?? body.lastPageRead ?? chapterIndex + 1)
    );

    const saved = await prisma.bookmark.upsert({
      where: {
        userId_bookId_source: {
          userId: req.user.id,
          bookId,
          source
        }
      },
      update: {
        halaman_terakhir: halamanTerakhir,
        chapter_index: chapterIndex,
        chapter_title: String(body.chapterTitle ?? body.chapter_title ?? ''),
        total_chapters: totalChapters,
        scroll_ratio: scrollRatio,
        progress_percent: progressPercent
      },
      create: {
        userId: req.user.id,
        bookId,
        source,
        halaman_terakhir: halamanTerakhir,
        chapter_index: chapterIndex,
        chapter_title: String(body.chapterTitle ?? body.chapter_title ?? ''),
        total_chapters: totalChapters,
        scroll_ratio: scrollRatio,
        progress_percent: progressPercent
      }
    });

    return res.json({ bookmark: serializeBookmark(saved) });
  });

  // ===========================================================================
  // REVIEWS & ADMIN MODERATION (KOMENTAR & RATING)
  // ===========================================================================
  router.post('/reviews', requireAuth, async (req, res) => {
    const bookId = String(req.body?.bookId || '').trim();
    const rawRating = Number(req.body?.rating);
    const rating = Number.isFinite(rawRating)
      ? Math.max(1, Math.min(5, Math.round(rawRating)))
      : 5;
    const comment = String(req.body?.comment || '').trim();

    if (!bookId || !comment) {
      return res.status(400).json({ error: 'bookId dan ulasan wajib diisi.' });
    }

    const existingBook = await prisma.book.findUnique({ where: { id: bookId } });
    if (!existingBook) {
      return res.status(404).json({ error: 'Buku tidak ditemukan.' });
    }

    const created = await prisma.review.create({
      data: {
        userId: req.user.id,
        bookId,
        reviewer_name: req.user.nama,
        rating,
        comment
      }
    });

    const updatedBook = await recalculateBookRating(prisma, bookId);

    res.status(201).json({
      review: {
        id: created.id,
        userId: created.userId,
        user: created.reviewer_name,
        username: req.user.username,
        role: String(req.user.role || '').toLowerCase(),
        rating: created.rating,
        comment: created.comment,
        createdAt: created.createdAt,
        date: 'Baru saja'
      },
      book: updatedBook ? serializeBook(updatedBook) : null
    });
  });

  // ADMIN: Hapus komentar / ulasan secara permanen & hitung ulang rating buku
  router.delete('/reviews/:id', requireRoles('ADMIN'), async (req, res) => {
    const reviewId = String(req.params.id || '').trim();
    const existing = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!existing) {
      return res.status(404).json({ error: 'Ulasan/komentar tidak ditemukan.' });
    }

    await prisma.review.delete({ where: { id: reviewId } });
    const updatedBook = await recalculateBookRating(prisma, existing.bookId);

    return res.json({
      deletedId: reviewId,
      book: updatedBook ? serializeBook(updatedBook) : null
    });
  });

  // ADMIN: Hapus rating tidak wajar pada satu ulasan & hitung ulang rata-rata rating
  router.patch('/reviews/:id/clear-rating', requireRoles('ADMIN'), async (req, res) => {
    const reviewId = String(req.params.id || '').trim();
    const existing = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!existing) {
      return res.status(404).json({ error: 'Ulasan tidak ditemukan.' });
    }

    await prisma.review.update({
      where: { id: reviewId },
      data: { rating: null }
    });

    const updatedBook = await recalculateBookRating(prisma, existing.bookId);

    return res.json({
      reviewId,
      book: updatedBook ? serializeBook(updatedBook) : null
    });
  });

  // ADMIN: Reset rating buku (ratings_only | all | recalculate)
  router.post('/books/:id/reviews/reset', requireRoles('ADMIN'), async (req, res) => {
    const bookId = String(req.params.id || '').trim();
    const mode = String(req.body?.mode || 'all').trim().toLowerCase();

    const existingBook = await prisma.book.findUnique({ where: { id: bookId } });
    if (!existingBook) {
      return res.status(404).json({ error: 'Buku tidak ditemukan.' });
    }

    let affectedCount = 0;

    if (mode === 'ratings_only') {
      const updated = await prisma.review.updateMany({
        where: { bookId, rating: { not: null } },
        data: { rating: null }
      });
      affectedCount = updated.count;
    } else if (mode === 'recalculate') {
      // Hapus rating di luar rentang 1..5 jika ada, lalu hitung ulang
      const fixed = await prisma.review.updateMany({
        where: {
          bookId,
          OR: [{ rating: { lt: 1 } }, { rating: { gt: 5 } }]
        },
        data: { rating: null }
      });
      affectedCount = fixed.count;
    } else {
      const deleted = await prisma.review.deleteMany({ where: { bookId } });
      affectedCount = deleted.count;
    }

    const updatedBook = await recalculateBookRating(prisma, bookId);

    return res.json({
      mode,
      affectedCount,
      book: updatedBook ? serializeBook(updatedBook) : null
    });
  });

  // ===========================================================================
  // PDF STREAMING PROXY (BEBAS CORS + AUTO-KONVERSI GOOGLE DRIVE DIRECT STREAM)
  // ===========================================================================
  function isBlockedProxyHostname(hostname = '') {
    const host = String(hostname || '').trim().toLowerCase();
    if (!host) return true;
    if (
      host === 'localhost' ||
      host === '::1' ||
      host === '0.0.0.0' ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return true;
    }
    if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) {
      return true;
    }
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) {
      return true;
    }
    return false;
  }

  function extractDriveConfirmUrl(html = '', driveId = '') {
    if (!html || !driveId) return null;
    const uuidMatch = html.match(/name="uuid"\s+value="([^"]+)"/i);
    const confirmMatch = html.match(/name="confirm"\s+value="([^"]+)"/i);
    const actionMatch = html.match(/action="(https:\/\/drive\.usercontent\.google\.com\/download[^"]*)"/i);

    const base = actionMatch ? actionMatch[1] : 'https://drive.usercontent.google.com/download';
    const nextUrl = new URL(base);
    nextUrl.searchParams.set('id', driveId);
    nextUrl.searchParams.set('export', 'download');
    nextUrl.searchParams.set('confirm', confirmMatch ? confirmMatch[1] : 't');
    if (uuidMatch && uuidMatch[1]) {
      nextUrl.searchParams.set('uuid', uuidMatch[1]);
    }
    return nextUrl.toString();
  }

  router.get('/pdf-proxy', async (req, res) => {
    try {
      let rawUrl = String(req.query.link_pdf || req.query.url || '').trim();
      const bookId = String(req.query.bookId || '').trim();

      if (!rawUrl && bookId) {
        const dbBook = await prisma.book.findUnique({
          where: { id: bookId },
          select: { link_pdf: true }
        });
        rawUrl = String(dbBook?.link_pdf || '').trim();
      }

      if (!rawUrl) {
        return res.status(400).json({ error: 'Parameter link_pdf atau url wajib diisi.' });
      }

      let parsedInput;
      try {
        parsedInput = new URL(rawUrl);
      } catch {
        return res.status(400).json({ error: 'Format URL PDF tidak valid.' });
      }

      if (parsedInput.protocol !== 'http:' && parsedInput.protocol !== 'https:') {
        return res.status(400).json({ error: 'Hanya protokol HTTP/HTTPS yang didukung.' });
      }

      if (isBlockedProxyHostname(parsedInput.hostname)) {
        return res.status(403).json({ error: 'Alamat host tujuan tidak diizinkan.' });
      }

      const driveId = extractGoogleDriveId(rawUrl);
      const targetUrl = driveId ? formatGoogleDriveDirectUrl(rawUrl) : rawUrl;

      const forwardHeaders = {
        Accept: 'application/pdf,application/octet-stream,*/*;q=0.8'
      };
      if (driveId) {
        forwardHeaders['User-Agent'] =
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
      }
      if (req.headers.range) {
        forwardHeaders.Range = String(req.headers.range);
      }

      const abortController = new AbortController();
      res.on('close', () => {
        if (!res.writableEnded) {
          abortController.abort();
        }
      });

      let upstream = await fetch(targetUrl, {
        method: 'GET',
        headers: forwardHeaders,
        redirect: 'follow',
        signal: abortController.signal
      });

      // Fallback retry with alternate User-Agent if upstream WAF rejects initial headers
      if (upstream.status === 403 || upstream.status === 406) {
        const retryHeaders = { Accept: '*/*' };
        if (req.headers.range) retryHeaders.Range = String(req.headers.range);
        if (!forwardHeaders['User-Agent']) {
          retryHeaders['User-Agent'] =
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
        }
        upstream = await fetch(targetUrl, {
          method: 'GET',
          headers: retryHeaders,
          redirect: 'follow',
          signal: abortController.signal
        });
      }

      // Handle Google Drive large-file confirmation HTML page automatically
      if (driveId && upstream.ok) {
        const contentType = String(upstream.headers.get('content-type') || '').toLowerCase();
        if (contentType.includes('text/html')) {
          const html = await upstream.text();
          const confirmUrl = extractDriveConfirmUrl(html, driveId);
          if (confirmUrl) {
            upstream = await fetch(confirmUrl, {
              method: 'GET',
              headers: forwardHeaders,
              redirect: 'follow',
              signal: abortController.signal
            });
          }
        }
      }

      if (!upstream.ok && upstream.status !== 206) {
        return res.status(upstream.status === 404 ? 404 : 502).json({
          error: `Gagal mengambil file PDF dari sumber (${upstream.status}).`
        });
      }

      const finalContentType = String(upstream.headers.get('content-type') || '').toLowerCase();
      if (finalContentType.includes('text/html')) {
        return res.status(422).json({
          error: driveId
            ? 'File Google Drive tidak dapat diunduh langsung. Pastikan akses berbagi diubah menjadi "Siapa saja yang memiliki link" (Publik).'
            : 'Tautan tidak mengarah langsung ke dokumen PDF yang valid.'
        });
      }

      res.status(upstream.status === 206 ? 206 : 200);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      const acceptRanges = upstream.headers.get('accept-ranges');
      const contentLength = upstream.headers.get('content-length');
      const contentRange = upstream.headers.get('content-range');
      if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);
      if (contentLength) res.setHeader('Content-Length', contentLength);
      if (contentRange) res.setHeader('Content-Range', contentRange);

      if (!upstream.body) {
        const arrayBuf = await upstream.arrayBuffer();
        return res.end(Buffer.from(arrayBuf));
      }

      const nodeStream = Readable.fromWeb(upstream.body);
      nodeStream.on('error', (streamErr) => {
        if (!res.headersSent) {
          res.status(502).json({ error: streamErr?.message || 'Streaming PDF terputus.' });
        } else if (!res.writableEnded) {
          res.end();
        }
      });

      return nodeStream.pipe(res);
    } catch (err) {
      if (err?.name === 'AbortError') return undefined;
      console.error('[PDF Proxy Error]', err?.message || err);
      if (!res.headersSent) {
        return res.status(502).json({
          error: 'Tidak dapat memuat stream PDF dari server sumber.'
        });
      }
      return undefined;
    }
  });

  return router;
}

export function createApiMiddlewareApp() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  app.use(cookieParser());
  app.use(attachSessionUser);

  const apiRouter = buildApiRouter();
  app.use('/api', apiRouter);
  app.use('/Alchemist-Library/api', apiRouter);
  app.use('/', apiRouter);

  app.use((err, _req, res, _next) => {
    console.error('[API Error]', err);
    res.status(err.status || 500).json({
      error: err.message || 'Terjadi kesalahan internal server perpustakaan.'
    });
  });

  return app;
}
