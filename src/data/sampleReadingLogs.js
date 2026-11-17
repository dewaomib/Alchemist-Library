import { SAMPLE_MEMBERS } from './sampleMembers.js';
import { countWords, normalizeClassName } from '../utils/readingUtils.js';

const TODAY = new Date();

function memberByCard(cardCode) {
  return SAMPLE_MEMBERS.find((member) => member.cardCode === cardCode) || null;
}

function currentMonthDate(daysAgo, hour = 9) {
  const day = Math.max(1, TODAY.getDate() - Number(daysAgo || 0));
  return new Date(TODAY.getFullYear(), TODAY.getMonth(), day, hour, 0, 0);
}

/**
 * Data contoh jurnal refleksi literasi bulan berjalan.
 * Tujuh jurnal tersebar di beberapa kelas, sebagian sudah dinilai guru
 * dan sebagian masih menunggu penilaian.
 */
export function buildInitialReadingLogs(books = []) {
  const bookById = Object.fromEntries(books.map((book) => [book.id, book]));

  const specs = [
    {
      id: 'reading-log-demo-01',
      cardCode: 'ARC-2026-089',
      bookId: 'book-3',
      daysAgo: 1,
      lastPageRead: 310,
      favoriteQuote:
        'Kebahagiaan dapat ditemukan bahkan di tempat paling gelap, jika seseorang ingat untuk menyalakan cahaya.',
      summary:
        'Buku ketiga ini mengajarkan bahwa keberanian bukan berarti tidak pernah merasa takut, melainkan tetap melangkah meskipun rasa takut itu ada. Harry, Ron, dan Hermione menghadapi banyak rintangan di Hogwarts, tetapi persahabatan mereka membuat beban berat terasa lebih ringan. Saya paling terkesan pada cara mereka saling melindungi ketika salah satu berada dalam bahaya. Bab yang membahas cermin keinginan juga membuat saya merenung tentang perbedaan antara mimpi dan kenyataan. Saya belajar bahwa keinginan besar perlu disertai usaha, kejujuran, dan keberanian untuk menghadapi konsekuensi. Sebagai siswa, saya ingin meniru semangat mereka dalam belajar dan bekerja sama dengan teman. Refleksi ini membuat saya lebih sadar bahwa pilihan kecil yang diambil dengan hati-hati dapat menentukan arah masa depan.',
      status: 'submitted'
    },
    {
      id: 'reading-log-demo-02',
      cardCode: 'ARC-2026-001',
      bookId: 'book-1',
      daysAgo: 3,
      lastPageRead: 440,
      favoriteQuote:
        'Dunia ini luas, tetapi yang paling sulit dijelajahi adalah isi hati manusia.',
      summary:
        'Novel Bumi membuka imajinasi saya tentang dunia paralel yang penuh misteri. Raib, Seli, dan Ali digambarkan sebagai remaja biasa dengan kelebihan luar biasa, tetapi mereka tetap menghadapi masalah persahabatan, kepercayaan, dan keberanian. Saya menyukai cara penulis membangun rasa ingin tahu melalui portal dan rahasia Klan Bulan. Bagian yang paling menyentuh menurut saya adalah ketika mereka harus memilih antara kepentingan pribadi dan keselamatan orang banyak. Dari bacaan ini saya belajar bahwa perbedaan kemampuan bukan alasan untuk saling merendahkan. Justru perbedaan dapat menjadi kekuatan jika setiap orang mau bekerja sama. Saya juga terdorong untuk lebih berani menyampaikan pendapat dan mendengarkan sudut pandang teman. Cerita ini membuat saya ingin membaca lanjutan seri untuk mengetahui rahasia dunia paralel lebih dalam. Pengalaman membaca ini terasa menyenangkan karena alurnya cepat sekaligus memberikan pesan moral yang jelas.',
      status: 'graded',
      score: 95,
      feedback:
        'Refleksi sangat baik. Kamu berhasil mengaitkan konflik cerita dengan pengalaman belajar dan sikap kerja sama. Pertahankan kebiasaan menulis kutipan beserta alasannya.',
      gradedBy: 'Ibu Ratna Kusuma, S.Pd.',
      gradedDaysAgo: 2
    },
    {
      id: 'reading-log-demo-03',
      cardCode: 'ARC-2026-002',
      bookId: 'book-4',
      daysAgo: 2,
      lastPageRead: 186,
      favoriteQuote:
        'Setiap gaya yang bekerja pada benda akan menghasilkan perubahan gerak yang dapat diprediksi.',
      summary:
        'Buku Fisika Dasar ini membantu saya memahami hubungan antara gaya, massa, dan percepatan. Selama ini saya sering menghafal rumus tanpa memahami maknanya, tetapi contoh soal pada bab mekanika membuat konsep tersebut lebih masuk akal. Saya belajar bahwa benda yang diam pun dapat memiliki beberapa gaya yang saling menyeimbangkan. Bagian termodinamika juga menarik karena menjelaskan bagaimana energi berpindah dari benda bersuhu tinggi ke benda bersuhu rendah. Saya menyadari bahwa fisika bukan hanya kumpulan angka, tetapi cara membaca kejadian di sekitar kita. Ketika mencoba latihan mandiri, saya masih sering keliru menentukan arah gaya, sehingga saya perlu memperbanyak latihan dan menggambar diagram bebas gaya. Catatan ini membantu saya merencanakan langkah belajar berikutnya. Saya ingin lebih aktif bertanya kepada guru dan mendiskusikan soal sulit bersama teman agar pemahaman saya semakin kuat.',
      status: 'submitted'
    },
    {
      id: 'reading-log-demo-04',
      cardCode: 'ARC-2026-003',
      bookId: 'book-2',
      daysAgo: 5,
      lastPageRead: 529,
      favoriteQuote:
        'Bermimpilah, karena Tuhan akan memeluk mimpi-mimpi itu.',
      summary:
        'Laskar Pelangi membuat saya menyadari betapa berharganya kesempatan untuk bersekolah. Anak-anak Belitung menghadapi keterbatasan fasilitas, tetapi semangat mereka untuk belajar tidak pernah padam. Karakter Lintang sangat menginspirasi karena mampu menunjukkan kecerdasan luar biasa meskipun harus menempuh perjalanan jauh setiap hari. Saya juga kagum pada Ibu Muslimah yang sabar dan tulus mendampingi murid-muridnya. Dari cerita ini saya belajar bahwa keterbatasan bukan alasan untuk berhenti bermimpi. Persahabatan dan saling mendukung membuat perjalanan belajar terasa lebih ringan. Saya jadi lebih bersyukur atas fasilitas yang saya miliki dan ingin memanfaatkannya dengan sungguh-sungguh. Refleksi ini mendorong saya untuk lebih rajin membaca dan tidak mudah mengeluh ketika menemukan pelajaran yang sulit. Buku ini pantas menjadi bacaan wajib bagi setiap pelajar karena pesan ketekunannya sangat kuat dan menyentuh.',
      status: 'graded',
      score: 88,
      feedback:
        'Pemaknaan tokoh dan nilai ketekunan sudah kuat. Tambahkan satu paragraf tentang bagian buku yang paling sulit kamu pahami agar refleksimu lebih kritis.',
      gradedBy: 'Ibu Ratna Kusuma, S.Pd.',
      gradedDaysAgo: 4
    },
    {
      id: 'reading-log-demo-05',
      cardCode: 'ARC-2026-004',
      bookId: 'book-9',
      daysAgo: 4,
      lastPageRead: 240,
      favoriteQuote:
        'Kita tidak bisa mengendalikan apa yang terjadi, tetapi kita bisa mengendalikan cara kita menanggapinya.',
      summary:
        'Filosofi Teras mengajarkan saya untuk membedakan hal yang berada dalam kendali dan hal yang berada di luar kendali. Sebelum membaca buku ini, saya sering merasa cemas tentang pendapat orang lain dan hasil yang belum pasti. Penulis menjelaskan bahwa ketenangan dapat dilatih dengan mengubah cara kita menilai suatu kejadian. Saya mencoba menerapkan prinsip tersebut ketika menghadapi tugas sekolah yang menumpuk. Alih-alih mengeluh, saya membuat daftar prioritas dan mengerjakan satu tugas pada satu waktu. Saya merasa lebih tenang dan fokus setelah mencobanya. Namun, saya juga menyadari bahwa sikap tenang bukan berarti pasif. Kita tetap perlu berusaha sebaik mungkin, lalu menerima hasil dengan lapang dada. Buku ini cocok dibaca oleh siswa yang mudah merasa tertekan. Saya ingin terus melatih kebiasaan merefleksikan pikiran setiap malam agar kesehatan mental saya tetap terjaga.',
      status: 'submitted'
    },
    {
      id: 'reading-log-demo-06',
      cardCode: 'ARC-2026-006',
      bookId: 'book-12',
      daysAgo: 6,
      lastPageRead: 498,
      favoriteQuote:
        'Sejarah manusia dibentuk oleh cerita-cerita yang dipercaya bersama.',
      summary:
        'Sapiens menjelaskan perjalanan manusia dari kelompok pemburu menjadi peradaban modern yang kompleks. Saya tertarik pada gagasan bahwa kemampuan manusia menciptakan cerita bersama menjadi kunci kerja sama dalam jumlah besar. Konsep uang, negara, dan perusahaan dijelaskan sebagai sesuatu yang dipercaya bersama, bukan benda alami. Dari buku ini saya belajar bahwa pengetahuan perlu dipandang secara kritis. Kemajuan teknologi tidak selalu berarti kemajuan kebahagiaan. Bagian tentang revolusi pertanian membuat saya berpikir ulang tentang arti hidup sederhana dan hubungan manusia dengan alam. Saya juga menyadari pentingnya menjaga empati ketika mempelajari sejarah, karena setiap angka dalam sejarah mewakili kehidupan manusia. Buku ini cukup padat, tetapi saya menikmati proses membacanya. Saya ingin mendiskusikan isi buku ini dengan guru sejarah dan membaca sumber lain agar pemahaman saya tidak bergantung pada satu sudut pandang.',
      status: 'graded',
      score: 90,
      feedback:
        'Analisis konsep cerita bersama sangat menarik. Gunakan kutipan halaman tertentu pada refleksi berikutnya agar argumenmu lebih kuat.',
      gradedBy: 'Bapak Ahmad Fauzi, S.Pd.',
      gradedDaysAgo: 3
    },
    {
      id: 'reading-log-demo-07',
      cardCode: 'ARC-2026-007',
      bookId: 'book-5',
      daysAgo: 2,
      lastPageRead: 210,
      favoriteQuote:
        'Sel adalah unit kehidupan terkecil yang mampu menjalankan seluruh proses hidup.',
      summary:
        'Buku Biologi Seluler membantu saya memahami bahwa setiap makhluk hidup tersusun dari unit kecil yang bekerja sangat teratur. Saya baru menyadari bahwa proses sederhana seperti penyembuhan luka melibatkan pembelahan sel, sinyal kimia, dan kerja sama berbagai jaringan. Bab tentang genetika juga menjelaskan mengapa sifat tertentu dapat diwariskan dari orang tua kepada anak. Saya merasa materi ini menantang karena banyak istilah baru, tetapi ilustrasi pada buku sangat membantu. Saya membuat tabel istilah dan mencocokkannya dengan gambar agar lebih mudah diingat. Dari pembelajaran ini saya belajar pentingnya kesabaran dan ketelitian ketika mempelajari proses yang rumit. Saya juga ingin mencoba membuat ringkasan visual sebelum ujian berikutnya. Ilmu tentang sel membuat saya semakin menghargai kompleksitas kehidupan dan mendorong saya menjaga kesehatan tubuh dengan lebih baik.',
      status: 'submitted'
    }
  ];

  return specs
    .map((spec) => {
      const member = memberByCard(spec.cardCode);
      const book = bookById[spec.bookId];
      if (!member || !book) return null;

      const createdAt = currentMonthDate(spec.daysAgo);
      const gradedAt =
        spec.status === 'graded'
          ? currentMonthDate(spec.gradedDaysAgo ?? Math.max(0, spec.daysAgo - 1), 13)
          : null;

      return {
        id: spec.id,
        studentId: member.cardCode,
        studentCard: member.cardCode,
        profileId: member.cardCode === 'ARC-2026-089' ? member.cardCode : null,
        studentName: member.name,
        className: normalizeClassName(member.className),
        bookId: book.id,
        bookTitle: book.title,
        lastPageRead: spec.lastPageRead,
        favoriteQuote: spec.favoriteQuote,
        summary: spec.summary,
        wordCount: countWords(spec.summary),
        status: spec.status,
        score: spec.score ?? null,
        feedback: spec.feedback || '',
        gradedAt: gradedAt ? gradedAt.toISOString() : null,
        gradedBy: spec.gradedBy || '',
        createdAt: createdAt.toISOString(),
        updatedAt: (gradedAt || createdAt).toISOString()
      };
    })
    .filter(Boolean);
}
