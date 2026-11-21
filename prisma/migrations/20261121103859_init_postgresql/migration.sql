-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'GURU', 'SISWA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SISWA',
    "nama" TEXT NOT NULL,
    "nisn" TEXT,
    "jenjang" TEXT,
    "kelas" TEXT,
    "jurusan" TEXT,
    "kelas_label" TEXT,
    "guild_id" TEXT,
    "title" TEXT,
    "phone" TEXT,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "streak_days" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "kode_buku" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "subtitle" TEXT,
    "penulis" TEXT NOT NULL,
    "penerbit" TEXT NOT NULL DEFAULT '-',
    "tahun_terbit" INTEGER NOT NULL DEFAULT 2024,
    "jenjang" TEXT NOT NULL DEFAULT 'Umum',
    "kelas" TEXT NOT NULL DEFAULT 'Semua',
    "jurusan" TEXT NOT NULL DEFAULT 'Semua Jurusan',
    "jenis_buku" TEXT NOT NULL DEFAULT 'Umum',
    "category" TEXT NOT NULL DEFAULT 'Literasi & Umum',
    "stok_fisik" INTEGER NOT NULL DEFAULT 1,
    "total_stok" INTEGER NOT NULL DEFAULT 1,
    "link_cover" TEXT,
    "link_pdf" TEXT,
    "ddc" TEXT NOT NULL DEFAULT '000',
    "call_number" TEXT,
    "shelf" TEXT NOT NULL DEFAULT 'Rak A1',
    "isbn" TEXT,
    "pages" INTEGER NOT NULL DEFAULT 120,
    "xp_reward" INTEGER NOT NULL DEFAULT 50,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.8,
    "synopsis" TEXT,
    "chapters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "loan_type" TEXT NOT NULL DEFAULT 'STUDENT_PHYSICAL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "jumlah_eksemplar" INTEGER NOT NULL DEFAULT 1,
    "kelas_sasaran" TEXT,
    "jam_pelajaran" TEXT,
    "durasi_hari" INTEGER NOT NULL DEFAULT 7,
    "tanggal_pinjam" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggal_disetujui" TIMESTAMP(3),
    "jatuh_tempo" TIMESTAMP(3),
    "tanggal_kembali" TIMESTAMP(3),
    "catatan" TEXT,
    "alasan_tolak" TEXT,
    "metode_transaksi" TEXT NOT NULL DEFAULT 'CATALOG',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "halaman_terakhir" INTEGER NOT NULL DEFAULT 0,
    "kutipan_favorit" TEXT NOT NULL,
    "ringkasan_hikmah" TEXT NOT NULL,
    "jumlah_kata" INTEGER NOT NULL DEFAULT 0,
    "nilai_guru" INTEGER,
    "catatan_guru" TEXT,
    "status_penilaian" TEXT NOT NULL DEFAULT 'MENUNGGU_VALIDASI',
    "dinilai_oleh" TEXT,
    "tanggal_baca" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "halaman_terakhir" INTEGER NOT NULL DEFAULT 1,
    "source" TEXT NOT NULL DEFAULT 'text',
    "chapter_index" INTEGER NOT NULL DEFAULT 0,
    "chapter_title" TEXT,
    "total_chapters" INTEGER NOT NULL DEFAULT 1,
    "scroll_ratio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "progress_percent" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "bookId" TEXT NOT NULL,
    "reviewer_name" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_nisn_key" ON "User"("nisn");

-- CreateIndex
CREATE UNIQUE INDEX "User_guild_id_key" ON "User"("guild_id");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_jenjang_kelas_jurusan_idx" ON "User"("jenjang", "kelas", "jurusan");

-- CreateIndex
CREATE UNIQUE INDEX "Book_kode_buku_key" ON "Book"("kode_buku");

-- CreateIndex
CREATE INDEX "Book_jenjang_kelas_jurusan_idx" ON "Book"("jenjang", "kelas", "jurusan");

-- CreateIndex
CREATE INDEX "Book_jenis_buku_idx" ON "Book"("jenis_buku");

-- CreateIndex
CREATE INDEX "Loan_userId_status_idx" ON "Loan"("userId", "status");

-- CreateIndex
CREATE INDEX "Loan_bookId_status_idx" ON "Loan"("bookId", "status");

-- CreateIndex
CREATE INDEX "Loan_loan_type_status_idx" ON "Loan"("loan_type", "status");

-- CreateIndex
CREATE INDEX "ReadingLog_userId_status_penilaian_idx" ON "ReadingLog"("userId", "status_penilaian");

-- CreateIndex
CREATE INDEX "ReadingLog_bookId_idx" ON "ReadingLog"("bookId");

-- CreateIndex
CREATE INDEX "Bookmark_userId_bookId_idx" ON "Bookmark"("userId", "bookId");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_bookId_source_key" ON "Bookmark"("userId", "bookId", "source");

-- CreateIndex
CREATE INDEX "Review_bookId_idx" ON "Review"("bookId");

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingLog" ADD CONSTRAINT "ReadingLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingLog" ADD CONSTRAINT "ReadingLog_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
