-- ============================================================================
-- The Grand Alchemist's Archive - Supabase PostgreSQL Schema & Seed Data
-- Run this script in your Supabase Project -> SQL Editor
-- ============================================================================

-- Enable UUID generation extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE (Scholars, XP, Level, Rank & Badges)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL,
  guild_id TEXT DEFAULT 'ARC-2026-089',
  name TEXT NOT NULL,
  academy_class TEXT NOT NULL DEFAULT 'Akademi Sains & Arkanum',
  guild_role TEXT NOT NULL DEFAULT 'Novice Initiate - Level 1',
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  max_xp INTEGER NOT NULL DEFAULT 500 CHECK (max_xp > 0),
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  potions_brewed_count INTEGER NOT NULL DEFAULT 0,
  tomes_read_count INTEGER NOT NULL DEFAULT 0,
  books_read INTEGER NOT NULL DEFAULT 0,
  reviews_penned_count INTEGER NOT NULL DEFAULT 0,
  badges JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure columns exist if table was already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guild_id TEXT DEFAULT 'ARC-2026-089';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS books_read INTEGER NOT NULL DEFAULT 0;

-- ----------------------------------------------------------------------------
-- 2. BOOKS TABLE (Grimoires / School Library Catalog)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  fantasy_subtitle TEXT NOT NULL DEFAULT 'Manuskrip Rahasia Pengetahuan',
  author TEXT NOT NULL,
  isbn TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 75 CHECK (xp_reward > 0),
  school TEXT NOT NULL,
  school_name TEXT NOT NULL,
  rating NUMERIC(2, 1) NOT NULL DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  reviews_count INTEGER NOT NULL DEFAULT 0,
  pages INTEGER NOT NULL DEFAULT 300,
  arcane_level TEXT NOT NULL DEFAULT 'Adept',
  shelf TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'borrowed')),
  available BOOLEAN NOT NULL DEFAULT TRUE,
  total_stock INTEGER NOT NULL DEFAULT 5 CHECK (total_stock >= 0),
  available_stock INTEGER NOT NULL DEFAULT 5 CHECK (available_stock >= 0),
  has_digital BOOLEAN NOT NULL DEFAULT TRUE,
  digital_content JSONB NOT NULL DEFAULT '[]'::jsonb,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  cover TEXT NOT NULL,
  synopsis TEXT NOT NULL,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure stock & digital columns exist if table was already created
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS available BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS total_stock INTEGER NOT NULL DEFAULT 5;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS available_stock INTEGER NOT NULL DEFAULT 5;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS has_digital BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS digital_content JSONB DEFAULT '[]'::jsonb;

-- ----------------------------------------------------------------------------
-- 3. LOANS TABLE (Borrowing Circulation & Mana Timer Tracking)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  profile_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  borrower_name TEXT NOT NULL,
  requester_name TEXT,
  requester_role TEXT NOT NULL DEFAULT 'siswa',
  class_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  notes TEXT,
  rejection_reason TEXT,
  borrowed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '14 days')::DATE,
  returned_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'returned', 'recalled', 'active')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS requester_name TEXT;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS requester_role TEXT NOT NULL DEFAULT 'siswa';
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS class_name TEXT;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_loans_book_status ON public.loans(book_id, status);
CREATE INDEX IF NOT EXISTS idx_loans_profile_status ON public.loans(profile_id, status);

-- ----------------------------------------------------------------------------
-- 4. REVIEWS TABLE (Scholar's Notes & Star Ratings)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY DEFAULT ('rev-' || gen_random_uuid()::TEXT),
  book_id TEXT NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  profile_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  scholar_name TEXT NOT NULL,
  scholar_rank TEXT NOT NULL DEFAULT 'Arcane Seeker',
  book_title TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  note TEXT NOT NULL,
  xp_awarded INTEGER NOT NULL DEFAULT 75,
  review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON public.reviews(book_id);
CREATE INDEX IF NOT EXISTS idx_reviews_profile_id ON public.reviews(profile_id);

-- ----------------------------------------------------------------------------
-- 5. QUESTS TABLE (Guild Reading Challenges)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  category TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 150,
  badge_reward TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL DEFAULT 1,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  claimed BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- Note: Permissive policies below allow the school demo SPA to work directly
-- with the Supabase anon key. Tighten these with auth.uid() when adding Auth.
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public demo read/write profiles" ON public.profiles;
CREATE POLICY "Public demo read/write profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public demo read/write books" ON public.books;
CREATE POLICY "Public demo read/write books" ON public.books FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public demo read/write loans" ON public.loans;
CREATE POLICY "Public demo read/write loans" ON public.loans FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public demo read/write reviews" ON public.reviews;
CREATE POLICY "Public demo read/write reviews" ON public.reviews FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public demo read/write quests" ON public.quests;
CREATE POLICY "Public demo read/write quests" ON public.quests FOR ALL USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- SEED DATA (Default Scholar, 14 Books, Active Loans, Reviews, 3 Quests)
-- ----------------------------------------------------------------------------
INSERT INTO public.profiles (
  id, student_id, name, academy_class, guild_role, xp, max_xp, level,
  potions_brewed_count, tomes_read_count, reviews_penned_count, badges
) VALUES (
  'scholar-arya',
  'SCH-7749-ARK',
  'Raden Arya Al-Ghazali',
  'Akademi Sains & Arkanum - Tingkat XII-IPA 1',
  'Adept Alchemist - Level 4',
  850,
  1200,
  4,
  14,
  28,
  12,
  '[
    {"id":"novice","name":"Novice Inscriptor","icon":"Scroll","desc":"Meminjam grimoire perdana di The Grand Alchemist’s Archive","color":"text-potion-amber","border":"border-potion-amber/40","unlocked":true},
    {"id":"potion_master","name":"Master Transmuter","icon":"FlaskConical","desc":"Meracik minimal 5 rekomendasi akurat menggunakan Alchemical Cauldron","color":"text-potion-emerald","border":"border-potion-emerald/40","unlocked":true},
    {"id":"midnight_scholar","name":"Midnight Scholar","icon":"Sparkles","desc":"Membaca dan meneliti hingga larut malam di kubah arsip","color":"text-potion-purple","border":"border-potion-purple/40","unlocked":true},
    {"id":"timekeeper","name":"Timekeeper of Lore","icon":"Compass","desc":"Menyelesaikan tantangan pembacaan kronik sejarah kuno tepat waktu","color":"text-potion-cyan","border":"border-potion-cyan/40","unlocked":false},
    {"id":"grand_polymath","name":"Grand Polymath","icon":"Shield","desc":"Meminjam buku dari seluruh 5 cabang keilmuan arsip","color":"text-gold-alchemy","border":"border-gold-alchemy/40","unlocked":false}
  ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.books (
  id, title, fantasy_subtitle, author, isbn, xp_reward, school, school_name,
  rating, reviews_count, pages, arcane_level, shelf, status, ingredients, cover, synopsis, featured
) VALUES
  ('tome-01', 'Bumi', 'Gerbang Rahasia Klan Bulan & Pengendali Cuaca', 'Tere Liye', '978-602-03-0112-9', 85, 'fiction', 'Bard''s Tales (Fiksi)', 4.9, 142, 440, 'Adept', 'Kubah Barat - Lemari Ilusi #04', 'borrowed', '["mysterious_shadow","fast_paced_wind","heartwarming_ember"]'::jsonb, 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?q=80&w=800&auto=format&fit=crop', 'Kisah Raib, murid SMA yang mampu menghilang dengan menutup wajahnya dengan kedua telapak tangan. Bersama Seli yang mengendalikan petir dan Ali sang jenius yang menyembunyikan intelek luar biasa, mereka terlempar melintasi portal menuju Klan Bulan, mengungkap konspirasi purba Tamus.', true),
  ('tome-02', 'Bulan', 'Turnamen Bertarung Klan Matahari & Bunga Matahari Pertama', 'Tere Liye', '978-602-03-1452-5', 80, 'fiction', 'Bard''s Tales (Fiksi)', 4.8, 119, 400, 'Adept', 'Kubah Barat - Lemari Ilusi #05', 'available', '["fast_paced_wind","mysterious_shadow","heartwarming_ember"]'::jsonb, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop', 'Petualangan berlanjut saat ketiga sahabat diundang ke Festival Bunga Matahari di Klan Matahari. Sebuah turnamen pertempuran akbar yang menyembunyikan bahaya mematikan di balik keindahan kota berkilau emas.', false),
  ('tome-03', 'Laskar Pelangi', 'Bintang Belitung & Cahaya Tekad Cendekiawan', 'Andrea Hirata', '978-979-3062-79-2', 95, 'fiction', 'Bard''s Tales (Fiksi)', 5.0, 230, 529, 'Master', 'Kubah Selatan - Sayap Inspirasi #01', 'available', '["heartwarming_ember","ancient_wisdom"]'::jsonb, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop', 'Epik kehangatan 10 murid di SD Muhammadiyah Gantong, Belitung. Di tengah keterbatasan gedung reot yang nyaris runtuh, Ikal, Lintang sang jenius alam, Mahar sang seniman batin, dan Bu Muslimah membuktikan bahwa api pengetahuan tak pernah dapat dipadamkan oleh kemiskinan.', true),
  ('tome-04', 'Harry Potter dan Batu Bertuah', 'Sang Terpilih dan Batu Alkimia Abadi', 'J.K. Rowling', '978-979-655-851-3', 75, 'fiction', 'Bard''s Tales (Fiksi)', 4.9, 310, 384, 'Novice', 'Kubah Barat - Menara Gryffindor #07', 'available', '["mysterious_shadow","fast_paced_wind","heartwarming_ember"]'::jsonb, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop', 'Anak yatim piatu yang mengira dirinya biasa saja menerima surat penerimaan dari Hogwarts. Menjelajahi Lorong Diagon, cermin Erised, dan rahasia Batu Alkimia ciptaan Nicolas Flamel yang mampu memberikan keabadian dan mengubah logam menjadi emas murni.', true),
  ('tome-05', 'Fisika Semesta: Dari Newton hingga Kuantum', 'Prinsip Alkimia Gravitasi & Resonansi Kuantum Alam', 'Dr. Engkos Kosasih, M.Sc.', '978-602-244-710-8', 100, 'alchemy', 'Alchemy & Natural Science', 4.8, 88, 480, 'Master', 'Menara Timur - Rak Alkimia B4', 'borrowed', '["scientific_spark","ancient_wisdom"]'::jsonb, 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop', 'Membongkar rumus-rumus gaya mekanika, elektromagnetik, hingga dualisme gelombang partikel dalam bahasa visual yang memesona. Dilengkapi eksperimen laboratorium sekolah dan analogi medan energi gaib semesta.', true),
  ('tome-06', 'Biologi Seluler & Rahasia DNA', 'Eliksir Kehidupan: Kode Genetik & Transmutasi Sel Alami', 'Prof. Sri Rahayu', '978-602-8811-44-2', 80, 'alchemy', 'Alchemy & Natural Science', 4.7, 74, 412, 'Adept', 'Menara Alkimia - Lemari Botani & Sel #03', 'available', '["nature_elixir","scientific_spark"]'::jsonb, 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=800&auto=format&fit=crop', 'Menelusuri mikrokosmos sel eukariotik, mitokondria sang tungku tenaga sel, hingga replikasi kode ganda heliks DNA. Mengajarkan bagaimana sel melakukan sintesis protein layaknya pabrik alkimia hayati tercanggih di bumi.', false),
  ('tome-07', 'Kimia Dasar: Reaksi & Stoikiometri', 'Manuskrip Ikatan Zat & Transmutasi Unsur Kimiawi', 'Dr. Bambang Sugiarto', '978-979-075-922-0', 70, 'alchemy', 'Alchemy & Natural Science', 4.6, 62, 390, 'Novice', 'Menara Alkimia - Meja Tabung Reaksi #01', 'available', '["scientific_spark","nature_elixir"]'::jsonb, 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?q=80&w=800&auto=format&fit=crop', 'Pedoman lengkap bagi murid sekolah memahami tabel periodik mendeleev, ikatan kovalen, hukum kekekalan massa Lavoisier, dan kesetimbangan kimiawi dengan diagram percobaan yang sangat gamblang.', false),
  ('tome-08', 'Nusantara: Sejarah Kerajaan Kuno & Rempah', 'Kronik Kemaharajaan Kuno: Jalur Rempah & Maritim', 'Dr. I Made Sujana', '978-602-481-330-9', 95, 'history', 'Ancient Lore & Chronicles', 4.9, 95, 512, 'Master', 'Kubah Kuno - Peti Sriwijaya & Majapahit #09', 'available', '["ancient_wisdom","mysterious_shadow"]'::jsonb, 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?q=80&w=800&auto=format&fit=crop', 'Mengungkap diplomasi maritim Sriwijaya, kehebatan armada kapal Jung Majapahit karya Mpu Nala, serta aroma pala dan cengkeh Maluku yang mengundang penjelajah lintas samudra ke tanah air berabad-abad silam.', true),
  ('tome-09', 'Sejarah Dunia: Runtuhnya Imperium', 'Hikayat Bangkit dan Jatuhnya Imperium Abadi', 'H. Suhartono, M.Hum.', '978-602-391-508-8', 85, 'history', 'Ancient Lore & Chronicles', 4.7, 68, 460, 'Adept', 'Kubah Kuno - Rak Kronik Eropa & Asia #04', 'available', '["ancient_wisdom","mysterious_shadow"]'::jsonb, 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=800&auto=format&fit=crop', 'Dari kejayaan Romawi, Dinasti Abbasiyah di Baghdad, hingga revolusi industri. Pelajaran berharga bagaimana perebutan kekuasaan, krisis moral, dan kemajuan ilmu pengetahuan mengubah peta peradaban bumi.', false),
  ('tome-10', 'Clean Code & Algoritma Tingkat Mahir', 'Seni Mantra Artificer Bersih & Skrip Nir-Kutukan', 'Robert C. Martin / Tim Artificer', '978-0-13-235088-4', 110, 'artificer', 'Artificer & Digital Weave', 4.9, 184, 464, 'Archmage', 'Kamar Artificer - Konsol Biner #08', 'available', '["artificer_gear","scientific_spark"]'::jsonb, 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop', 'Kitab wajib bagi para pemahat kode digital. Mengajarkan prinsip SOLID, penamaan variabel yang bermakna, refactoring fungsi beracun, dan etika membangun sistem piranti lunak yang elegan dan abadi sepanjang zaman.', true),
  ('tome-11', 'Struktur Data & Arsitektur Jaringan', 'Labirin Arsitektur Digital & Transmisi Sinyal Gaib', 'Ir. Faisal Akbar', '978-623-01-1982-4', 90, 'artificer', 'Artificer & Digital Weave', 4.8, 91, 430, 'Adept', 'Kamar Artificer - Rak Protokol Jaringan #02', 'available', '["artificer_gear","scientific_spark"]'::jsonb, 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop', 'Menyelami pohon biner (Binary Tree), graf Dijkstra untuk pencarian rute tercepat, protokol TCP/IP, dan enkripsi asimetris yang menjaga keamanan pesan di dunia maya.', false),
  ('tome-12', 'Filosofi Teras: Stoisisme Masa Kini', 'Mantra Ketenangan Jiwa: Stoisisme & Perisai Pikiran', 'Henry Manampiring', '978-602-412-518-9', 75, 'philosophy', 'High Philosophy & Mind', 4.9, 205, 346, 'Adept', 'Sanctum Refleksi - Meja Meditasi Marmer #03', 'available', '["arcane_philosophy","ancient_wisdom","heartwarming_ember"]'::jsonb, 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop', 'Ajaran filsafat Stoa Yunani-Romawi kuno (Epictetus, Seneca, Marcus Aurelius) yang disajikan ringan untuk generasi muda. Membedakan hal-hal yang berada di bawah kendali kita dan hal di luar kendali agar terbebas dari kecemasan berlebih.', true),
  ('tome-13', 'Dunia Sophie: Sejarah Filsafat', 'Pencarian Hakikat: Dialog Sang Pengembara Kebijaksanaan', 'Jostein Gaarder', '978-979-433-574-1', 105, 'philosophy', 'High Philosophy & Mind', 4.8, 167, 560, 'Master', 'Sanctum Refleksi - Kotak Pos Filosofis #01', 'available', '["arcane_philosophy","mysterious_shadow","ancient_wisdom"]'::jsonb, 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=800&auto=format&fit=crop', 'Seorang gadis muda tiba-tiba menerima surat misterius berisi satu pertanyaan mendasar: "Siapakah kamu?". Berangkatlah ia dalam pengembaraan menyusuri pemikiran Socrates, Plato, Descartes, hingga masa modern.', false),
  ('tome-14', 'Negeri 5 Menara', 'Man Jadda Wajada: Sumpah Menara & Membelah Cakrawala', 'A. Fuadi', '978-979-22-4861-6', 85, 'fiction', 'Bard''s Tales (Fiksi)', 4.9, 178, 423, 'Adept', 'Kubah Selatan - Menara Sahibul Menara #02', 'available', '["heartwarming_ember","ancient_wisdom","fast_paced_wind"]'::jsonb, 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop', 'Kisah enam santri dari berbagai pelosok nusantara di Pondok Madani. Di bawah bayangan menara masjid, mereka menggantungkan impian setinggi langit dengan mantra sakti: "Man Jadda Wajada" — Siapa yang bersungguh-sungguh, ia akan berhasil.', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.loans (book_id, profile_id, borrower_name, borrowed_date, due_date, status)
SELECT 'tome-01', 'scholar-arya', 'Raden Arya Al-Ghazali', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '4 days', 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.loans WHERE book_id = 'tome-01' AND status = 'active');

INSERT INTO public.loans (book_id, profile_id, borrower_name, borrowed_date, due_date, status)
SELECT 'tome-05', 'scholar-arya', 'Raden Arya Al-Ghazali', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '7 days', 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.loans WHERE book_id = 'tome-05' AND status = 'active');

INSERT INTO public.reviews (id, book_id, profile_id, scholar_name, scholar_rank, book_title, rating, note, xp_awarded, review_date)
VALUES
  ('note-01-1', 'tome-01', NULL, 'Nadia Putri Lestari', 'Arcane Seeker - Lv. 3', 'Bumi', 5, 'Pembangunan dunia Klan Bulan terasa magis namun tetap dekat dengan kehidupan anak SMA Indonesia. Karakter Ali selalu jadi favorit!', 85, '2026-11-01'),
  ('note-04-1', 'tome-04', 'scholar-arya', 'Raden Arya Al-Ghazali', 'Adept Alchemist - Lv. 4', 'Harry Potter dan Batu Bertuah', 5, 'Bab mengenai cermin Erised dan Nicolas Flamel sangat filosofis! Mengingatkan bahwa hasrat terdalam manusia seringkali menjadi ujian terberat.', 50, '2026-10-28'),
  ('note-05-1', 'tome-05', NULL, 'Kevin Wijaya', 'Adept Alchemist - Lv. 4', 'Fisika Semesta: Dari Newton hingga Kuantum', 5, 'Penjelasan mekanika kuantumnya tidak bikin pusing karena ilustrasi eksperimen celah gandanya sangat jernih.', 100, '2026-10-22'),
  ('note-12-1', 'tome-12', 'scholar-arya', 'Raden Arya Al-Ghazali', 'Adept Alchemist - Lv. 4', 'Filosofi Teras: Stoisisme Masa Kini', 5, 'Sangat ampuh meredakan kecemasan saat menghadapi ujian akhir semester. Konsep dikotomi kendali wajib dipelajari setiap cendekiawan.', 75, '2026-11-02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quests (id, title, subtitle, category, xp_reward, badge_reward, progress, target, completed, claimed, description)
VALUES
  ('quest-01', 'Trial of the Elemental Physicist', 'Membaca 1 Grimoire Ilmu Fisika & Sains Alami', 'alchemy', 150, 'Elemental Novice', 1, 1, true, false, 'Pahami gaya tarik semesta dan hukum energi kuantum untuk memperkuat pemahaman kodrat materi.'),
  ('quest-02', 'Chronicles of Nusantara', 'Membaca 1 Kitab Sejarah Kuno / Kemaharajaan', 'history', 200, 'Timekeeper of Lore', 0, 1, false, false, 'Gali kejayaan kemaritiman Sriwijaya atau Majapahit untuk membangkitkan kearifan masa lampau.'),
  ('quest-03', 'Alchemist of the Digital Weave', 'Mempelajari 1 Naskah Pemrograman & Artificer', 'artificer', 250, 'Arcane Artificer', 0, 1, false, false, 'Bebaskan skrip algoritma dari kutukan bug dan bangun arsitektur sistem digital yang kokoh.')
ON CONFLICT (id) DO NOTHING;

