import { DIGITAL_TOMES_CATALOG, getDigitalTomeContent } from './digitalTomesContent.js';

export const INITIAL_BOOKS = [
  {
    id: 'book-1',
    kodeBuku: 'BK-FIK-001',
    title: 'Bumi',
    subtitle: 'Chronicles of the Parallel Clan',
    author: 'Tere Liye',
    publisher: 'Gramedia Pustaka Utama',
    publicationYear: 2014,
    jenjang: 'Umum',
    kelas: 'Semua',
    jurusan: 'Semua Jurusan',
    jenisBuku: 'Fiksi / Novel',
    category: 'Bards Tales',
    categoryLabel: "Bard's Tales (Fiksi & Sastra)",
    rating: 4.9,
    xpReward: 120,
    pages: 440,
    isbn: '978-602-03-0112-9',
    shelf: 'Menara Barat • Rak Sastra Nusantara A1',
    totalStock: 5,
    availableStock: 3,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    digitalContent: DIGITAL_TOMES_CATALOG['book-1'],
    synopsis:
      'Kisah Raib, murid SMA yang mampu menghilang dengan menutup wajahnya dengan kedua telapak tangan. Bersama Seli yang mengendalikan petir dan Ali sang jenius yang menyembunyikan intelek luar biasa, mereka terlempar melintasi portal menuju Klan Bulan, mengungkap konspirasi purba Tamus.',
    reviews: [
      {
        id: 'r1',
        user: 'Nadia • Apprentice Kelas X',
        rating: 5,
        comment: 'Dunia paralelnya terasa hidup sekali! Cocok buat yang suka petualangan sihir modern.'
      },
      {
        id: 'r2',
        user: 'Dimas • Adept Scholar XI',
        rating: 5,
        comment: 'Karakter Ali benar-benar definisi Artificer sejati. Wajib baca!'
      }
    ]
  },
  {
    id: 'book-2',
    kodeBuku: 'BK-FIK-002',
    title: 'Laskar Pelangi',
    subtitle: 'Scroll of the Ten Belitung Scholars',
    author: 'Andrea Hirata',
    publisher: 'Bentang Pustaka',
    publicationYear: 2005,
    jenjang: 'Umum',
    kelas: 'Semua',
    jurusan: 'Semua Jurusan',
    jenisBuku: 'Fiksi / Novel',
    category: 'Bards Tales',
    categoryLabel: "Bard's Tales (Fiksi & Sastra)",
    rating: 5.0,
    xpReward: 130,
    pages: 529,
    isbn: '978-979-3062-79-2',
    shelf: 'Menara Barat • Rak Sastra Nusantara A2',
    totalStock: 6,
    availableStock: 4,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    digitalContent: DIGITAL_TOMES_CATALOG['book-2'],
    synopsis:
      'Perjuangan sepuluh anak di Pulau Belitung yang menimba ilmu di sekolah Muhammadiyah yang nyaris roboh bersama guru inspiratif Ibu Muslimah. Sebuah grimoire tentang mimpi, persahabatan, dan ketekunan tanpa batas.',
    reviews: [
      {
        id: 'r3',
        user: 'Raka • Scholar Kelas XII',
        rating: 5,
        comment: 'Membaca kisah Lintang membuat semangat belajarku langsung naik 200%!'
      }
    ]
  },
  {
    id: 'book-3',
    kodeBuku: 'BK-FIK-003',
    title: "Harry Potter & the Philosopher's Stone",
    subtitle: 'The Alchemist Prophecy of Hogwarts',
    author: 'J.K. Rowling',
    publisher: 'Gramedia Pustaka Utama',
    publicationYear: 2000,
    jenjang: 'Umum',
    kelas: 'Semua',
    jurusan: 'Semua Jurusan',
    jenisBuku: 'Fiksi / Novel',
    category: 'Bards Tales',
    categoryLabel: "Bard's Tales (Fiksi & Sastra)",
    rating: 4.9,
    xpReward: 140,
    pages: 384,
    isbn: '978-602-03-0305-5',
    shelf: 'Menara Barat • Rak Fantasi Klasik B1',
    totalStock: 4,
    availableStock: 2,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    digitalContent: DIGITAL_TOMES_CATALOG['book-3'],
    synopsis:
      'Harry Potter mengetahui bahwa ia adalah penyihir dan diundang ke Sekolah Sihir Hogwarts. Di sana ia mempelajari rahasia Batu Bertuah—artefak alkimia purba karya Nicolas Flamel yang mampu mengubah logam menjadi emas murni serta memberikan keabadian.',
    reviews: [
      {
        id: 'r4',
        user: 'Arya Pendragon • Scholar',
        rating: 5,
        comment: 'Konsep ramuan alkimia Snape dan Batu Bertuah Flamel luar biasa menarik!'
      }
    ]
  },
  {
    id: 'book-4',
    kodeBuku: 'BK-SMA-101',
    title: 'Fisika Dasar: Mekanika & Termodinamika Kelas 10 SMA',
    subtitle: 'Buku Paket Wajib Fisika Kurikulum Merdeka SMA Kelas 10',
    author: 'Halliday, Resnick & Walker',
    publisher: 'Erlangga',
    publicationYear: 2023,
    jenjang: 'SMA',
    kelas: '10',
    jurusan: 'Semua Jurusan',
    jenisBuku: 'Buku Paket Wajib',
    category: 'Alchemy',
    categoryLabel: 'Alchemy (Sains & Misteri)',
    rating: 4.7,
    xpReward: 160,
    pages: 680,
    isbn: '978-979-075-812-4',
    shelf: 'Menara Timur • Rak SMA Kelas 10 Fisika A1',
    totalStock: 10,
    availableStock: 6,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    digitalContent: DIGITAL_TOMES_CATALOG['book-4'],
    synopsis:
      'Buku Paket Wajib Fisika SMA Kelas 10: Prinsip fundamental gerak partikel, hukum kekekalan energi mekanik, dinamika fluida, hingga hukum termodinamika semesta.',
    reviews: [
      {
        id: 'r5',
        user: 'Gilang • Peneliti Muda XII',
        rating: 5,
        comment: 'Soal-soalnya menantang logika, penjelasannya sangat mendalam.'
      }
    ]
  },
  {
    id: 'book-5',
    kodeBuku: 'BK-SMA-111',
    title: 'Biologi Seluler & Genetika Molekuler Kelas 11 SMA',
    subtitle: 'Buku Paket Wajib Biologi SMA Kelas 11',
    author: 'Neil A. Campbell & Jane Reece',
    publisher: 'Erlangga',
    publicationYear: 2023,
    jenjang: 'SMA',
    kelas: '11',
    jurusan: 'Semua Jurusan',
    jenisBuku: 'Buku Paket Wajib',
    category: 'Alchemy',
    categoryLabel: 'Alchemy (Sains & Misteri)',
    rating: 4.8,
    xpReward: 155,
    pages: 620,
    isbn: '978-979-075-430-0',
    shelf: 'Menara Timur • Rak SMA Kelas 11 Bio B2',
    totalStock: 8,
    availableStock: 5,
    digitalContent: getDigitalTomeContent({
      title: 'Biologi Seluler & Genetika Molekuler',
      author: 'Neil A. Campbell',
      category: 'Alchemy'
    }),
    synopsis:
      'Buku Paket Wajib Biologi SMA Kelas 11: Eksplorasi kode kehidupan di dalam heliks ganda DNA, sintesis protein seluler, pembelahan mitosis-meiosis, serta rekayasa genetika modern.',
    reviews: [
      {
        id: 'r6',
        user: 'Citra • Tim Olimpiade Bio',
        rating: 5,
        comment: 'Ilustrasi membran sel dan replikasi DNA sangat jernih.'
      }
    ]
  },
  {
    id: 'book-6',
    kodeBuku: 'BK-TKJ-101',
    title: 'Dasar Sistem Komputer, Struktur Data & Jaringan Dasar Kelas 10 TKJ',
    subtitle: 'Buku Paket Wajib Produktif SMK Kelas 10 Jurusan TKJ',
    author: 'Rinaldi Munir & Ir. Faisal Akbar',
    publisher: 'Informatika Bandung',
    publicationYear: 2024,
    jenjang: 'SMK',
    kelas: '10',
    jurusan: 'TKJ',
    jenisBuku: 'Buku Paket Wajib',
    category: 'Artificers Craft',
    categoryLabel: "Artificer's Craft (Teknologi & Koding)",
    rating: 4.9,
    xpReward: 145,
    pages: 410,
    isbn: '978-602-8758-87-1',
    shelf: 'Ruang Artificer • Rak SMK Kelas 10 TKJ D1',
    totalStock: 18,
    availableStock: 14,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    digitalContent: DIGITAL_TOMES_CATALOG['book-6'],
    synopsis:
      'Buku Paket Wajib SMK Kelas 10 Jurusan TKJ: Arsitektur sistem komputer, topologi jaringan LAN/WAN, pengalamatan IPv4/IPv6, model OSI 7 Layer, serta dasar logika algoritma pemrograman.',
    reviews: [
      {
        id: 'r7',
        user: 'Farhan • Siswa Kelas 10 TKJ',
        rating: 5,
        comment: 'Wajib dipelajari anak Kelas 10 TKJ untuk dasar jaringan dan pemrograman.'
      }
    ]
  },
  {
    id: 'book-7',
    kodeBuku: 'BK-REF-007',
    title: 'Atomic Habits',
    subtitle: 'Transmutation of Small Deeds',
    author: 'James Clear',
    publisher: 'Gramedia Pustaka Utama',
    publicationYear: 2019,
    jenjang: 'Umum',
    kelas: 'Semua',
    jurusan: 'Semua Jurusan',
    jenisBuku: 'Referensi',
    category: 'Philosophy',
    categoryLabel: 'Philosophy (Filsafat & Budi Pekerti)',
    rating: 4.9,
    xpReward: 125,
    pages: 352,
    isbn: '978-602-06-3317-6',
    shelf: 'Aula Utama • Rak Pengembangan Diri C4',
    totalStock: 6,
    availableStock: 5,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    digitalContent: DIGITAL_TOMES_CATALOG['book-7'],
    synopsis:
      'Perubahan kecil 1% setiap hari yang berlipat ganda menjadi hasil luar biasa. Sistem praktis membangun kebiasaan baik, memutus rantai kebiasaan buruk, dan menguasai disiplin diri dalam menuntut ilmu.',
    reviews: [
      {
        id: 'r8',
        user: 'Anisa • Dewan Ambalan XI',
        rating: 5,
        comment: 'Konsep 1% better every day sangat mengubah cara saya membagi waktu belajar.'
      }
    ]
  },
  {
    id: 'book-8',
    kodeBuku: 'BK-FIK-008',
    title: 'Laut Bercerita',
    subtitle: 'Voices from the Depths of Truth',
    author: 'Leila S. Chudori',
    publisher: 'Kepustakaan Populer Gramedia',
    publicationYear: 2017,
    jenjang: 'Umum',
    kelas: 'Semua',
    jurusan: 'Semua Jurusan',
    jenisBuku: 'Fiksi / Novel',
    category: 'Ancient Lore',
    categoryLabel: 'Ancient Lore (Sejarah & Peradaban)',
    rating: 4.9,
    xpReward: 135,
    pages: 394,
    isbn: '978-602-424-694-5',
    shelf: 'Menara Barat • Rak Sejarah & Sastra B3',
    totalStock: 4,
    availableStock: 3,
    digitalContent: getDigitalTomeContent({
      title: 'Laut Bercerita',
      author: 'Leila S. Chudori',
      category: 'Ancient Lore'
    }),
    synopsis:
      'Kronik emosional aktivis mahasiswa era 1998 yang diculik dan dihilangkan. Bagian pertama disuarakan oleh Biru Laut dari dasar samudera, bagian kedua diisi oleh Asmara Jati yang mencari kepastian keluarganya.',
    reviews: [
      {
        id: 'r9',
        user: 'Bagas • Ekskul Jurnalistik XII',
        rating: 5,
        comment: 'Sangat menyentuh hati. Mengajarkan arti keberanian memperjuangkan keadilan.'
      }
    ]
  },
  {
    id: 'book-9',
    kodeBuku: 'BK-REF-009',
    title: 'Filosofi Teras',
    subtitle: 'Stoic Armor of the Young Mind',
    author: 'Henry Manampiring',
    publisher: 'Kompas Penerbit Buku',
    publicationYear: 2018,
    jenjang: 'Umum',
    kelas: 'Semua',
    jurusan: 'Semua Jurusan',
    jenisBuku: 'Referensi',
    category: 'Philosophy',
    categoryLabel: 'Philosophy (Filsafat & Budi Pekerti)',
    rating: 4.8,
    xpReward: 120,
    pages: 346,
    isbn: '978-602-412-518-9',
    shelf: 'Aula Utama • Rak Filsafat Populer C2',
    totalStock: 5,
    availableStock: 4,
    digitalContent: getDigitalTomeContent({
      title: 'Filosofi Teras',
      author: 'Henry Manampiring',
      category: 'Philosophy'
    }),
    synopsis:
      'Penerapan filsafat Stoa kuno Yunani-Romawi yang disesuaikan untuk generasi muda Indonesia menghadapi kekhawatiran, overthinking, dan emosi negatif melalui dikotomi kendali mental.',
    reviews: [
      {
        id: 'r10',
        user: 'Maya • Konselor Sebaya XI',
        rating: 5,
        comment: 'Membantu sekali meredakan cemas saat musim ujian sekolah!'
      }
    ]
  },
  {
    id: 'book-10',
    kodeBuku: 'BK-SMA-121',
    title: 'Kimia Organik & Reaksi Transmutasi Zat Kelas 12 SMA',
    subtitle: 'Buku Paket Wajib Kimia SMA Kelas 12',
    author: 'Fessenden & Fessenden',
    publisher: 'Erlangga',
    publicationYear: 2023,
    jenjang: 'SMA',
    kelas: '12',
    jurusan: 'Semua Jurusan',
    jenisBuku: 'Buku Paket Wajib',
    category: 'Alchemy',
    categoryLabel: 'Alchemy (Sains & Misteri)',
    rating: 4.7,
    xpReward: 165,
    pages: 580,
    isbn: '978-979-075-920-6',
    shelf: 'Menara Timur • Rak SMA Kelas 12 Kimia B3',
    totalStock: 8,
    availableStock: 4,
    digitalContent: getDigitalTomeContent({
      title: 'Kimia Organik & Reaksi Transmutasi Zat',
      author: 'Fessenden & Fessenden',
      category: 'Alchemy'
    }),
    synopsis:
      'Buku Paket Wajib Kimia SMA Kelas 12: Membongkar struktur rantai hidrokarbon, ikatan kovalen molekul, polimer, dan reaksi esterifikasi.',
    reviews: [
      {
        id: 'r11',
        user: 'Tito • Scholar XII',
        rating: 5,
        comment: 'Diagram mekanismenya bikin rumus kimia organik jadi gampang diingat.'
      }
    ]
  },
  {
    id: 'book-11',
    kodeBuku: 'BK-FIK-011',
    title: 'The Adventures of Sherlock Holmes',
    subtitle: 'The Art of Deductive Scrying',
    author: 'Arthur Conan Doyle',
    publisher: 'Gramedia Pustaka Utama',
    publicationYear: 2016,
    jenjang: 'Umum',
    kelas: 'Semua',
    jurusan: 'Semua Jurusan',
    jenisBuku: 'Fiksi / Novel',
    category: 'Bards Tales',
    categoryLabel: "Bard's Tales (Fiksi & Sastra)",
    rating: 4.9,
    xpReward: 125,
    pages: 350,
    isbn: '978-602-03-2415-9',
    shelf: 'Menara Barat • Rak Detektif & Misteri A7',
    totalStock: 5,
    availableStock: 3,
    digitalContent: getDigitalTomeContent({
      title: 'The Adventures of Sherlock Holmes',
      author: 'Arthur Conan Doyle',
      category: 'Bards Tales'
    }),
    synopsis:
      'Kumpulan kasus legendaris Sherlock Holmes bersama Dr. Watson di London era Victoria. Pelajaran ketajaman observasi, logika deduktif murni, dan penguraian teka-teki kriminal terumit.',
    reviews: [
      {
        id: 'r12',
        user: 'Tania • Klub Sastra XII',
        rating: 5,
        comment: 'Melihat cara Holmes mengamati detail kecil adalah sihir logika murni!'
      }
    ]
  },
  {
    id: 'book-12',
    kodeBuku: 'BK-REF-012',
    title: 'Sapiens: Riwayat Singkat Umat Manusia',
    subtitle: 'Genesis of Mortal Civilizations',
    author: 'Yuval Noah Harari',
    publisher: 'Kepustakaan Populer Gramedia',
    publicationYear: 2017,
    jenjang: 'Umum',
    kelas: 'Semua',
    jurusan: 'Semua Jurusan',
    jenisBuku: 'Referensi',
    category: 'Ancient Lore',
    categoryLabel: 'Ancient Lore (Sejarah & Peradaban)',
    rating: 4.8,
    xpReward: 150,
    pages: 525,
    isbn: '978-602-424-416-3',
    shelf: 'Aula Kuno • Rak Sejarah Dunia C3',
    totalStock: 6,
    availableStock: 4,
    digitalContent: getDigitalTomeContent({
      title: 'Sapiens: Riwayat Singkat Umat Manusia',
      author: 'Yuval Noah Harari',
      category: 'Ancient Lore'
    }),
    synopsis:
      'Bagaimana Homo sapiens berhasil mendominasi planet Bumi, membangun kerajaan raksasa, menciptakan tatanan mitos uang dan hukum, serta membentuk sejarah manusia dari zaman berburu hingga era kecerdasan buatan.',
    reviews: [
      {
        id: 'r13',
        user: 'Arya Pendragon • Scholar',
        rating: 5,
        comment: 'Membuka wawasan baru tentang bagaimana mitos dan kerja sama membentuk peradaban.'
      }
    ]
  },
  {
    id: 'book-13',
    kodeBuku: 'BK-TKJ-102',
    title: 'Modul Praktik Konfigurasi Mikrotik, Crimping LAN & Perakitan PC Kelas 10 TKJ',
    subtitle: 'Modul Praktik Laboratorium Jaringan SMK Kelas 10 TKJ',
    author: 'Tim Instruktur Produktif TKJ',
    publisher: 'Andi Offset',
    publicationYear: 2024,
    jenjang: 'SMK',
    kelas: '10',
    jurusan: 'TKJ',
    jenisBuku: 'Modul Praktik',
    category: 'Artificers Craft',
    categoryLabel: "Artificer's Craft (Modul Praktik TKJ)",
    rating: 4.9,
    xpReward: 150,
    pages: 280,
    isbn: '978-623-01-2024-1',
    shelf: 'Ruang Artificer • Rak SMK Kelas 10 TKJ D2',
    totalStock: 16,
    availableStock: 12,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    digitalContent: getDigitalTomeContent({
      title: 'Modul Praktik Mikrotik & Perakitan PC Kelas 10 TKJ',
      author: 'Tim Instruktur TKJ',
      category: 'Artificers Craft'
    }),
    synopsis:
      'Jobsheet dan Modul Praktik resmi SMK Kelas 10 TKJ: Perakitan komputer, instalasi sistem operasi Linux/Windows Server, pengkabelan UTP Straight/Cross, hingga konfigurasi dasar RouterOS Mikrotik.',
    reviews: []
  },
  {
    id: 'book-14',
    kodeBuku: 'BK-SMK-103',
    title: 'Matematika Vokasi & Terapan SMK Kelas 10 (Muatan Nasional Semua Jurusan)',
    subtitle: 'Buku Paket Wajib Muatan Nasional SMK Kelas 10',
    author: 'Dr. Bambang Subagyo, M.Si.',
    publisher: 'Erlangga',
    publicationYear: 2024,
    jenjang: 'SMK',
    kelas: '10',
    jurusan: 'Semua Jurusan',
    jenisBuku: 'Buku Paket Wajib',
    category: 'Alchemy',
    categoryLabel: 'Alchemy (Matematika Muatan Nasional SMK)',
    rating: 4.8,
    xpReward: 140,
    pages: 340,
    isbn: '978-602-298-701-2',
    shelf: 'Aula Utama • Rak SMK Kelas 10 Muatan Nasional A1',
    totalStock: 30,
    availableStock: 24,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    digitalContent: getDigitalTomeContent({
      title: 'Matematika Vokasi SMK Kelas 10',
      author: 'Dr. Bambang Subagyo',
      category: 'Alchemy'
    }),
    synopsis:
      'Buku Paket Wajib Matematika Muatan Nasional untuk seluruh siswa SMK Kelas 10 (TKJ, BM, maupun TKR/TR): Eksponen, logaritma, barisan deret, matriks, dan trigonometri terapan.',
    reviews: []
  },
  {
    id: 'book-15',
    kodeBuku: 'BK-SMK-104',
    title: 'Bahasa Indonesia & Literasi Komunikasi Vokasi SMK Kelas 10 (Semua Jurusan)',
    subtitle: 'Buku Paket Wajib Muatan Nasional SMK Kelas 10',
    author: 'Dra. Ratna Kusuma, M.Pd.',
    publisher: 'Kemendikbudristek',
    publicationYear: 2024,
    jenjang: 'SMK',
    kelas: '10',
    jurusan: 'Semua Jurusan',
    jenisBuku: 'Buku Paket Wajib',
    category: 'Philosophy',
    categoryLabel: 'Philosophy (Bahasa & Literasi Nasional SMK)',
    rating: 4.8,
    xpReward: 130,
    pages: 310,
    isbn: '978-602-244-812-1',
    shelf: 'Aula Utama • Rak SMK Kelas 10 Muatan Nasional A2',
    totalStock: 28,
    availableStock: 22,
    digitalContent: getDigitalTomeContent({
      title: 'Bahasa Indonesia SMK Kelas 10',
      author: 'Dra. Ratna Kusuma',
      category: 'Philosophy'
    }),
    synopsis:
      'Buku Paket Wajib Bahasa Indonesia Muatan Nasional untuk seluruh jurusan SMK Kelas 10 (TKJ, BM, TKR/TR): Teks laporan hasil observasi, negosiasi bisnis, dan penulisan karya ilmiah vokasi.',
    reviews: []
  },
  {
    id: 'book-16',
    kodeBuku: 'BK-BM-101',
    title: 'Dasar-Dasar Akuntansi, Keuangan & Manajemen Perkantoran Kelas 10 BM',
    subtitle: 'Buku Paket Wajib SMK Kelas 10 Jurusan Bisnis & Manajemen (BM)',
    author: 'Dra. Siti Hajar, M.Ak.',
    publisher: 'Salemba Empat',
    publicationYear: 2024,
    jenjang: 'SMK',
    kelas: '10',
    jurusan: 'BM',
    jenisBuku: 'Buku Paket Wajib',
    category: 'Philosophy',
    categoryLabel: 'Philosophy (Bisnis & Manajemen SMK)',
    rating: 4.8,
    xpReward: 140,
    pages: 365,
    isbn: '978-979-061-901-5',
    shelf: 'Menara Bisnis • Rak SMK Kelas 10 BM C1',
    totalStock: 16,
    availableStock: 13,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    digitalContent: getDigitalTomeContent({
      title: 'Dasar-Dasar Akuntansi & Manajemen Perkantoran Kelas 10 BM',
      author: 'Dra. Siti Hajar',
      category: 'Philosophy'
    }),
    synopsis:
      'Buku Paket Wajib SMK Kelas 10 Jurusan Bisnis & Manajemen (BM): Siklus akuntansi perusahaan jasa, tata kelola administrasi perkantoran modern, pelayanan pelanggan, dan komunikasi bisnis.',
    reviews: []
  },
  {
    id: 'book-17',
    kodeBuku: 'BK-BM-102',
    title: 'Modul Praktik Spreadsheet Keuangan & Kearsipan Digital Kelas 10 BM',
    subtitle: 'Modul Praktik Laboratorium Perkantoran SMK Kelas 10 BM',
    author: 'Tim Produktif Bisnis & Manajemen',
    publisher: 'Andi Offset',
    publicationYear: 2024,
    jenjang: 'SMK',
    kelas: '10',
    jurusan: 'BM',
    jenisBuku: 'Modul Praktik',
    category: 'Philosophy',
    categoryLabel: 'Philosophy (Modul Praktik BM)',
    rating: 4.9,
    xpReward: 145,
    pages: 240,
    isbn: '978-979-061-905-3',
    shelf: 'Menara Bisnis • Rak SMK Kelas 10 BM C2',
    totalStock: 15,
    availableStock: 11,
    digitalContent: getDigitalTomeContent({
      title: 'Modul Praktik Spreadsheet & Kearsipan Kelas 10 BM',
      author: 'Tim Produktif BM',
      category: 'Philosophy'
    }),
    synopsis:
      'Modul Praktik SMK Kelas 10 Jurusan BM: Rumus finansial Excel/Spreadsheet, pembuatan jurnal dan neraca lajur otomatis, serta praktik tata naskah surat-menyurat dan pengarsipan elektronik.',
    reviews: []
  },
  {
    id: 'book-18',
    kodeBuku: 'BK-TKR-101',
    title: 'Teknologi Dasar Otomotif, Gambar Teknik & Kerja Bangku Kelas 10 TKR/TR',
    subtitle: 'Buku Paket Wajib SMK Kelas 10 Jurusan TKR/TR',
    author: 'Ir. Asep Saepudin, M.T.',
    publisher: 'Pustaka Rekayasa Otomotif',
    publicationYear: 2024,
    jenjang: 'SMK',
    kelas: '10',
    jurusan: 'TKR/TR',
    jenisBuku: 'Buku Paket Wajib',
    category: 'Artificers Craft',
    categoryLabel: "Artificer's Craft (Teknik Kendaraan Ringan TKR/TR)",
    rating: 4.8,
    xpReward: 145,
    pages: 380,
    isbn: '978-602-8811-90-1',
    shelf: 'Bengkel Artificer • Rak SMK Kelas 10 TKR/TR E1',
    totalStock: 16,
    availableStock: 12,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    digitalContent: getDigitalTomeContent({
      title: 'Teknologi Dasar Otomotif Kelas 10 TKR/TR',
      author: 'Ir. Asep Saepudin',
      category: 'Artificers Craft'
    }),
    synopsis:
      'Buku Paket Wajib SMK Kelas 10 Jurusan TKR/TR: Keselamatan dan Kesehatan Kerja (K3) bengkel, konversi energi motor bakar 4-tak, pembacaan alat ukur mekanik/pneumatik, dan gambar teknik otomotif.',
    reviews: []
  },
  {
    id: 'book-19',
    kodeBuku: 'BK-TKR-102',
    title: 'Modul Praktik Overhaul Mesin & Sistem Hidrolik Kelas 10 TKR/TR',
    subtitle: 'Modul Praktik Bengkel Otomotif SMK Kelas 10 TKR/TR',
    author: 'Tim Instruktur Otomotif TKR/TR',
    publisher: 'Erlangga Vokasi',
    publicationYear: 2024,
    jenjang: 'SMK',
    kelas: '10',
    jurusan: 'TKR/TR',
    jenisBuku: 'Modul Praktik',
    category: 'Artificers Craft',
    categoryLabel: "Artificer's Craft (Modul Praktik TKR/TR)",
    rating: 4.9,
    xpReward: 150,
    pages: 260,
    isbn: '978-602-8811-92-5',
    shelf: 'Bengkel Artificer • Rak SMK Kelas 10 TKR/TR E2',
    totalStock: 14,
    availableStock: 10,
    digitalContent: getDigitalTomeContent({
      title: 'Modul Praktik Overhaul Mesin Kelas 10 TKR/TR',
      author: 'Tim Instruktur TKR/TR',
      category: 'Artificers Craft'
    }),
    synopsis:
      'Modul Praktik Bengkel SMK Kelas 10 Jurusan TKR/TR: Langkah kerja penggunaan jangka sorong & mikrometer, pembongkaran kepala silinder, pemeriksaan celah katup, dan rangkaian kelistrikan dasar kendaraan.',
    reviews: []
  },
  {
    id: 'book-20',
    kodeBuku: 'BK-TKJ-111',
    title: 'Administrasi Infrastruktur Jaringan, VLAN & Routing Kelas 11 TKJ',
    subtitle: 'Buku Paket Wajib Produktif SMK Kelas 11 Jurusan TKJ',
    author: 'Ir. Faisal Akbar, M.Kom.',
    publisher: 'Informatika Bandung',
    publicationYear: 2024,
    jenjang: 'SMK',
    kelas: '11',
    jurusan: 'TKJ',
    jenisBuku: 'Buku Paket Wajib',
    category: 'Artificers Craft',
    categoryLabel: "Artificer's Craft (Jaringan Lanjut TKJ)",
    rating: 4.9,
    xpReward: 155,
    pages: 420,
    isbn: '978-602-8758-91-8',
    shelf: 'Ruang Artificer • Rak SMK Kelas 11 TKJ D3',
    totalStock: 15,
    availableStock: 11,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    digitalContent: getDigitalTomeContent({
      title: 'Administrasi Infrastruktur Jaringan Kelas 11 TKJ',
      author: 'Ir. Faisal Akbar',
      category: 'Artificers Craft'
    }),
    synopsis:
      'Buku Paket Wajib SMK Kelas 11 TKJ: Konfigurasi VLAN, Trunking, Static & Dynamic Routing (OSPF/BGP), Firewall NAT, manajemen bandwidth QoS, dan administrasi server Debian/Ubuntu.',
    reviews: []
  },
  {
    id: 'book-21',
    kodeBuku: 'BK-TKJ-121',
    title: 'Modul Praktik Cloud Server, Keamanan Jaringan & Fiber Optik Kelas 12 TKJ',
    subtitle: 'Modul Praktik Uji Kompetensi Keahlian (UKK) SMK Kelas 12 TKJ',
    author: 'Tim Penguji UKK TKJ',
    publisher: 'Andi Offset',
    publicationYear: 2024,
    jenjang: 'SMK',
    kelas: '12',
    jurusan: 'TKJ',
    jenisBuku: 'Modul Praktik',
    category: 'Artificers Craft',
    categoryLabel: "Artificer's Craft (UKK Kelas 12 TKJ)",
    rating: 5.0,
    xpReward: 170,
    pages: 310,
    isbn: '978-602-8758-99-4',
    shelf: 'Ruang Artificer • Rak SMK Kelas 12 TKJ D4',
    totalStock: 15,
    availableStock: 12,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    digitalContent: getDigitalTomeContent({
      title: 'Modul Praktik Cloud Server & Fiber Optik Kelas 12 TKJ',
      author: 'Tim Penguji UKK TKJ',
      category: 'Artificers Craft'
    }),
    synopsis:
      'Modul Praktik Persiapan Uji Kompetensi Keahlian (UKK) SMK Kelas 12 TKJ: Penyambungan kabel Fiber Optik (Fusion Splicing), konfigurasi VPN Server, Intrusion Detection System (IDS), dan deployment container cloud.',
    reviews: []
  },
  {
    id: 'book-22',
    kodeBuku: 'BK-BM-111',
    title: 'Akuntansi Keuangan, Perpajakan & Bisnis Digital Kelas 11-12 BM',
    subtitle: 'Buku Paket Wajib SMK Kelas 11 Jurusan Bisnis & Manajemen (BM)',
    author: 'Dr. Hendra Kusuma, S.E., M.Si.',
    publisher: 'Salemba Empat',
    publicationYear: 2024,
    jenjang: 'SMK',
    kelas: '11',
    jurusan: 'BM',
    jenisBuku: 'Buku Paket Wajib',
    category: 'Philosophy',
    categoryLabel: 'Philosophy (Akuntansi & Bisnis Digital BM)',
    rating: 4.8,
    xpReward: 150,
    pages: 390,
    isbn: '978-979-061-912-1',
    shelf: 'Menara Bisnis • Rak SMK Kelas 11 BM C3',
    totalStock: 14,
    availableStock: 10,
    digitalContent: getDigitalTomeContent({
      title: 'Akuntansi Keuangan & Bisnis Digital Kelas 11 BM',
      author: 'Dr. Hendra Kusuma',
      category: 'Philosophy'
    }),
    synopsis:
      'Buku Paket Wajib SMK Kelas 11 Jurusan BM: Akuntansi perusahaan dagang & manufaktur, perhitungan PPh/PPN, pemasaran digital (digital marketing), dan manajemen ritel modern.',
    reviews: []
  },
  {
    id: 'book-23',
    kodeBuku: 'BK-TKR-121',
    title: 'Modul Praktik Engine Management System (EFI) & Sasis Kelas 11-12 TKR/TR',
    subtitle: 'Modul Praktik Diagnostik Kendaraan SMK Kelas 12 TKR/TR',
    author: 'Ir. Suryadi & Tim Otomotif',
    publisher: 'Erlangga Vokasi',
    publicationYear: 2024,
    jenjang: 'SMK',
    kelas: '12',
    jurusan: 'TKR/TR',
    jenisBuku: 'Modul Praktik',
    category: 'Artificers Craft',
    categoryLabel: "Artificer's Craft (Diagnostik EFI TKR/TR)",
    rating: 4.9,
    xpReward: 165,
    pages: 320,
    isbn: '978-602-8811-98-7',
    shelf: 'Bengkel Artificer • Rak SMK Kelas 12 TKR/TR E3',
    totalStock: 12,
    availableStock: 9,
    digitalContent: getDigitalTomeContent({
      title: 'Modul Praktik Engine Management System Kelas 12 TKR/TR',
      author: 'Ir. Suryadi',
      category: 'Artificers Craft'
    }),
    synopsis:
      'Modul Praktik SMK Kelas 12 Jurusan TKR/TR: Penggunaan Engine Scanner OBD-II pada mesin Electronic Fuel Injection (EFI), perawatan transmisi otomatis, sistem pengereman ABS, dan spooring-balancing.',
    reviews: []
  },
  {
    id: 'book-24',
    kodeBuku: 'BK-SMP-071',
    title: 'Ilmu Pengetahuan Alam (IPA) Terpadu & Eksperimen Sains SMP Kelas 7',
    subtitle: 'Buku Paket Wajib Kurikulum Merdeka SMP Kelas 7',
    author: 'Prof. Sri Rahayu & Tim Sains',
    publisher: 'Kemendikbudristek',
    publicationYear: 2024,
    jenjang: 'SMP',
    kelas: '7',
    jurusan: 'Semua Jurusan',
    jenisBuku: 'Buku Paket Wajib',
    category: 'Alchemy',
    categoryLabel: 'Alchemy (IPA Terpadu SMP Kelas 7)',
    rating: 4.9,
    xpReward: 130,
    pages: 310,
    isbn: '978-602-244-501-4',
    shelf: 'Menara Timur • Rak SMP Kelas 7 A1',
    totalStock: 20,
    availableStock: 16,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    digitalContent: getDigitalTomeContent({
      title: 'IPA Terpadu SMP Kelas 7',
      author: 'Prof. Sri Rahayu',
      category: 'Alchemy'
    }),
    synopsis:
      'Buku Paket Wajib IPA SMP Kelas 7: Hakikat ilmu sains dan metode ilmiah, zat dan perubahannya, suhu dan kalor, klasifikasi makhluk hidup, ekologi, serta tata surya.',
    reviews: []
  },
  {
    id: 'book-25',
    kodeBuku: 'BK-SMP-081',
    title: 'Matematika Penalaran Logis, Aljabar & Geometri SMP Kelas 8',
    subtitle: 'Buku Paket Wajib Kurikulum Merdeka SMP Kelas 8',
    author: 'Dr. Engkos Kosasih, M.Pd.',
    publisher: 'Erlangga',
    publicationYear: 2024,
    jenjang: 'SMP',
    kelas: '8',
    jurusan: 'Semua Jurusan',
    jenisBuku: 'Buku Paket Wajib',
    category: 'Alchemy',
    categoryLabel: 'Alchemy (Matematika SMP Kelas 8)',
    rating: 4.8,
    xpReward: 135,
    pages: 330,
    isbn: '978-602-244-508-3',
    shelf: 'Menara Timur • Rak SMP Kelas 8 A2',
    totalStock: 18,
    availableStock: 15,
    digitalContent: getDigitalTomeContent({
      title: 'Matematika SMP Kelas 8',
      author: 'Dr. Engkos Kosasih',
      category: 'Alchemy'
    }),
    synopsis:
      'Buku Paket Wajib Matematika SMP Kelas 8: Pola bilangan, koordinat Kartesius, relasi dan fungsi, persamaan garis lurus, SPLDV, dan teorema Pythagoras.',
    reviews: []
  },
  {
    id: 'book-26',
    kodeBuku: 'BK-SMP-091',
    title: 'Sejarah Nasional Indonesia & Literasi Global SMP Kelas 9',
    subtitle: 'Buku Paket Wajib IPS & Sejarah SMP Kelas 9',
    author: 'Dr. I Made Sujana, M.Hum.',
    publisher: 'Kemendikbudristek',
    publicationYear: 2024,
    jenjang: 'SMP',
    kelas: '9',
    jurusan: 'Semua Jurusan',
    jenisBuku: 'Buku Paket Wajib',
    category: 'Ancient Lore',
    categoryLabel: 'Ancient Lore (IPS & Sejarah SMP Kelas 9)',
    rating: 4.8,
    xpReward: 140,
    pages: 345,
    isbn: '978-602-244-519-9',
    shelf: 'Aula Kuno • Rak SMP Kelas 9 B1',
    totalStock: 18,
    availableStock: 14,
    digitalContent: getDigitalTomeContent({
      title: 'Sejarah & IPS SMP Kelas 9',
      author: 'Dr. I Made Sujana',
      category: 'Ancient Lore'
    }),
    synopsis:
      'Buku Paket Wajib IPS & Sejarah SMP Kelas 9: Interaksi antarnegara benua Asia dan benua lainnya, perubahan sosial budaya di era globalisasi, perdagangan internasional, dan sejarah kemerdekaan Indonesia.',
    reviews: []
  }
];
