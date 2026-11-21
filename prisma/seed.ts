import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { INITIAL_BOOKS } from '../src/data/initialBooks.js';
import { SAMPLE_MEMBERS } from '../src/data/sampleMembers.js';
import { buildInitialLoans } from '../src/data/sampleLoans.js';
import { buildInitialReadingLogs } from '../src/data/sampleReadingLogs.js';
import { enrichBook } from '../src/utils/libraryUtils.js';

const prisma = new PrismaClient();

function mapStatusToDb(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'approved' || value === 'active') return 'ACTIVE';
  if (value === 'returned') return 'RETURNED';
  if (value === 'rejected') return 'REJECTED';
  if (value === 'overdue') return 'OVERDUE';
  return 'PENDING';
}

function mapLogStatusToDb(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'graded' || value === 'dinilai') return 'DINILAI';
  if (value === 'needs_revision' || value === 'perlu_revisi') return 'PERLU_REVISI';
  return 'MENUNGGU_VALIDASI';
}

async function main() {
  console.log('Memulai seeding database PostgreSQL Perpustakaan Sekolah...');

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const memberPasswordHash = await bcrypt.hash('password123', 10);

  // 1. Seed Default ADMIN
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      nama: 'Administrator Perpustakaan',
      role: Role.ADMIN,
      title: 'Grand Archivist & Pustakawan Utama',
      guild_id: 'ADM-2026-001',
      jenjang: 'SMK',
      kelas: '12',
      jurusan: 'Semua Jurusan',
      kelas_label: 'Pengurus Perpustakaan Sekolah'
    },
    create: {
      id: 'user-admin',
      username: 'admin',
      password: adminPasswordHash,
      role: Role.ADMIN,
      nama: 'Administrator Perpustakaan',
      nisn: null,
      jenjang: 'SMK',
      kelas: '12',
      jurusan: 'Semua Jurusan',
      kelas_label: 'Pengurus Perpustakaan Sekolah',
      guild_id: 'ADM-2026-001',
      title: 'Grand Archivist & Pustakawan Utama',
      phone: '081200000001',
      xp: 9999,
      level: 50,
      streak_days: 99
    }
  });

  // 2. Seed Guru & Siswa from SAMPLE_MEMBERS
  for (const member of SAMPLE_MEMBERS) {
    const roleEnum = member.role === 'guru' ? Role.GURU : Role.SISWA;
    const isGuru = roleEnum === Role.GURU;

    await prisma.user.upsert({
      where: { username: member.username },
      update: {
        nama: member.name,
        role: roleEnum,
        nisn: isGuru ? null : member.nisn || null,
        jenjang: member.jenjang || (isGuru ? 'SMK' : 'SMK'),
        kelas: member.kelas || (isGuru ? null : '10'),
        jurusan: member.jurusan && member.jurusan !== 'Semua Jurusan' ? member.jurusan : member.jurusan || null,
        kelas_label: member.className || member.classLabel || null,
        guild_id: member.cardCode || null,
        title: isGuru ? 'Guild Mentor (Guru Pengampu)' : 'Apprentice Scholar',
        phone: member.phone || null
      },
      create: {
        id: member.id,
        username: member.username,
        password: memberPasswordHash,
        role: roleEnum,
        nama: member.name,
        nisn: isGuru ? null : member.nisn || null,
        jenjang: member.jenjang || null,
        kelas: member.kelas || null,
        jurusan: member.jurusan || null,
        kelas_label: member.className || member.classLabel || null,
        guild_id: member.cardCode || null,
        title: isGuru ? 'Guild Mentor (Guru Pengampu)' : 'Apprentice Scholar',
        phone: member.phone || null,
        xp: member.username === 'arya' ? 450 : 180,
        level: member.username === 'arya' ? 4 : 2,
        streak_days: member.username === 'arya' ? 6 : 2
      }
    });
  }

  // 3. Seed Books (termasuk buku SMK TKJ, BM, TKR/TR, SMA, SMP, & Fiksi/Referensi)
  const enrichedBooks = INITIAL_BOOKS.map((book, idx) => enrichBook(book, idx));
  for (const rawBook of enrichedBooks) {
    const savedBook = await prisma.book.upsert({
      where: { kode_buku: rawBook.kodeBuku },
      update: {
        judul: rawBook.title,
        subtitle: rawBook.subtitle || null,
        penulis: rawBook.author,
        penerbit: rawBook.publisher || '-',
        tahun_terbit: Number(rawBook.publicationYear) || 2024,
        jenjang: rawBook.jenjang || 'Umum',
        kelas: rawBook.kelas || 'Semua',
        jurusan: rawBook.jurusan || 'Semua Jurusan',
        jenis_buku: rawBook.jenisBuku || 'Umum',
        category: rawBook.category || 'Literasi & Umum',
        stok_fisik: Number(rawBook.availableStock ?? rawBook.stokFisik ?? 1),
        total_stok: Number(rawBook.totalStock ?? rawBook.availableStock ?? 1),
        link_cover: rawBook.coverUrl || null,
        link_pdf: rawBook.pdfUrl || null,
        ddc: rawBook.ddc || '000',
        call_number: rawBook.callNumber || null,
        shelf: rawBook.shelf || 'Rak A1',
        isbn: rawBook.isbn || null,
        pages: Number(rawBook.pages) || 120,
        xp_reward: Number(rawBook.xpReward) || 50,
        rating: Number(rawBook.rating) || 4.8,
        synopsis: rawBook.synopsis || null,
        chapters: rawBook.digitalContent || null
      },
      create: {
        id: rawBook.id,
        kode_buku: rawBook.kodeBuku,
        judul: rawBook.title,
        subtitle: rawBook.subtitle || null,
        penulis: rawBook.author,
        penerbit: rawBook.publisher || '-',
        tahun_terbit: Number(rawBook.publicationYear) || 2024,
        jenjang: rawBook.jenjang || 'Umum',
        kelas: rawBook.kelas || 'Semua',
        jurusan: rawBook.jurusan || 'Semua Jurusan',
        jenis_buku: rawBook.jenisBuku || 'Umum',
        category: rawBook.category || 'Literasi & Umum',
        stok_fisik: Number(rawBook.availableStock ?? rawBook.stokFisik ?? 1),
        total_stok: Number(rawBook.totalStock ?? rawBook.availableStock ?? 1),
        link_cover: rawBook.coverUrl || null,
        link_pdf: rawBook.pdfUrl || null,
        ddc: rawBook.ddc || '000',
        call_number: rawBook.callNumber || null,
        shelf: rawBook.shelf || 'Rak A1',
        isbn: rawBook.isbn || null,
        pages: Number(rawBook.pages) || 120,
        xp_reward: Number(rawBook.xpReward) || 50,
        rating: Number(rawBook.rating) || 4.8,
        synopsis: rawBook.synopsis || null,
        chapters: rawBook.digitalContent || null
      }
    });

    if (Array.isArray(rawBook.reviews)) {
      const existingReviewCount = await prisma.review.count({ where: { bookId: savedBook.id } });
      if (existingReviewCount === 0 && rawBook.reviews.length > 0) {
        await prisma.review.createMany({
          data: rawBook.reviews.map((rev) => ({
            bookId: savedBook.id,
            reviewer_name: rev.user || 'Pembaca Pustaka',
            rating: Number(rev.rating) || 5,
            comment: rev.comment || ''
          }))
        });
      }
    }
  }

  // Map user by cardCode / nisn / id
  const dbUsers = await prisma.user.findMany();
  const userByCard = new Map();
  for (const u of dbUsers) {
    if (u.guild_id) userByCard.set(u.guild_id, u);
    if (u.nisn) userByCard.set(u.nisn, u);
    userByCard.set(u.id, u);
  }

  // 4. Seed initial Loans (only if loans table is empty to stay idempotent)
  const existingLoansCount = await prisma.loan.count();
  if (existingLoansCount === 0) {
    const sampleLoans = buildInitialLoans(enrichedBooks);
    for (const loan of sampleLoans) {
      const targetUser = userByCard.get(loan.borrowerCard) || userByCard.get(loan.profileId);
      if (!targetUser) continue;
      const qty = Number(loan.quantity) || 1;
      const isGuru = targetUser.role === Role.GURU;
      const isClassPackage = isGuru && qty > 1;
      await prisma.loan.create({
        data: {
          id: loan.id,
          userId: targetUser.id,
          bookId: loan.bookId,
          loan_type: isClassPackage ? 'CLASS_PACKAGE' : isGuru ? 'TEACHER_SELF' : 'STUDENT_PHYSICAL',
          status: mapStatusToDb(loan.status),
          jumlah_eksemplar: qty,
          kelas_sasaran: isClassPackage ? loan.className || 'X TKJ 1' : null,
          jam_pelajaran: isClassPackage ? 'Jam 1-3' : null,
          durasi_hari: Number(loan.maxDays) || 7,
          tanggal_pinjam: loan.borrowedDateISO ? new Date(loan.borrowedDateISO) : new Date(),
          tanggal_disetujui: loan.status !== 'pending' && loan.borrowedDateISO ? new Date(loan.borrowedDateISO) : null,
          jatuh_tempo: loan.dueDate ? new Date(loan.dueDate) : null,
          tanggal_kembali: loan.returnedAt ? new Date(loan.returnedAt) : null,
          catatan: loan.notes || null,
          alasan_tolak: loan.rejectionReason || null,
          metode_transaksi: 'CATALOG'
        }
      });
    }
  }

  // 5. Seed initial Reading Logs (GLS)
  const existingLogsCount = await prisma.readingLog.count();
  if (existingLogsCount === 0) {
    const sampleLogs = buildInitialReadingLogs(enrichedBooks);
    for (const log of sampleLogs) {
      const targetUser = userByCard.get(log.studentCard) || userByCard.get(log.profileId);
      if (!targetUser) continue;
      await prisma.readingLog.create({
        data: {
          id: log.id,
          userId: targetUser.id,
          bookId: log.bookId,
          halaman_terakhir: Number(log.lastPageRead) || 0,
          kutipan_favorit: log.favoriteQuote || '',
          ringkasan_hikmah: log.summary || '',
          jumlah_kata: Number(log.wordCount) || 0,
          nilai_guru: log.score != null ? Number(log.score) : null,
          catatan_guru: log.feedback || null,
          status_penilaian: mapLogStatusToDb(log.status),
          dinilai_oleh: log.gradedBy || null,
          tanggal_baca: log.submittedAt ? new Date(log.submittedAt) : new Date()
        }
      });
    }
  }

  // 6. Seed default Bookmark for Arya on book-1
  const aryaUser = dbUsers.find((u) => u.username === 'arya');
  if (aryaUser) {
    await prisma.bookmark.upsert({
      where: {
        userId_bookId_source: {
          userId: aryaUser.id,
          bookId: 'book-1',
          source: 'text'
        }
      },
      update: {},
      create: {
        userId: aryaUser.id,
        bookId: 'book-1',
        halaman_terakhir: 24,
        source: 'text',
        chapter_index: 1,
        chapter_title: 'Bab II: Menyeberangi Portal Menuju Klan Bulan',
        total_chapters: 3,
        scroll_ratio: 0.35,
        progress_percent: 45
      }
    });
  }

  console.log('Seed PostgreSQL selesai:');
  console.log(`- Total Users: ${await prisma.user.count()}`);
  console.log(`- Total Books: ${await prisma.book.count()}`);
  console.log(`- Total Loans: ${await prisma.loan.count()}`);
  console.log(`- Total ReadingLogs: ${await prisma.readingLog.count()}`);
  console.log(`- Total Bookmarks: ${await prisma.bookmark.count()}`);
}

main()
  .catch((error) => {
    console.error('Seed gagal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
