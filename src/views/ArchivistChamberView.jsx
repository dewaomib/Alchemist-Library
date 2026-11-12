import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  BookOpen, 
  Users, 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  FileText, 
  MapPin, 
  Sparkles, 
  Layers,
  AlertCircle,
  TrendingUp,
  SlidersHorizontal
} from 'lucide-react';
import { SCHOOLS_OF_LORE, ALCHEMICAL_INGREDIENTS } from '../data/mockData';

export default function ArchivistChamberView({
  books,
  onAddNewBook,
  onRecallTome,
  onExtendLoan,
  onInspectTome
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    fantasySubtitle: '',
    author: '',
    school: 'alchemy',
    pages: 380,
    arcaneLevel: 'Adept',
    shelf: 'Arsip Menara Sentral - Rak A-01',
    synopsis: '',
    cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop',
    ingredients: ['scientific_spark', 'mysterious_shadow'],
  });

  const activeLoans = books.filter(b => b.status === 'borrowed');
  const availableBooks = books.filter(b => b.status === 'available');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleIngredientToggle = (id) => {
    setFormData(prev => {
      const exists = prev.ingredients.includes(id);
      if (exists) {
        return { ...prev, ingredients: prev.ingredients.filter(i => i !== id) };
      } else {
        return { ...prev, ingredients: [...prev.ingredients, id] };
      }
    });
  };

  const handleSubmitNewBook = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.author) return;

    const schoolObj = SCHOOLS_OF_LORE.find(s => s.id === formData.school);

    const pageNum = parseInt(formData.pages) || 350;
    const newBook = {
      id: `tome-${Date.now()}`,
      title: formData.title,
      fantasySubtitle: formData.fantasySubtitle || 'Manuskrip Rahasia Pengetahuan',
      author: formData.author,
      isbn: `978-602-${Math.floor(100 + Math.random() * 899)}-${Math.floor(100 + Math.random() * 899)}-${Math.floor(Math.random() * 9)}`,
      xpReward: Math.max(60, Math.min(120, Math.round(pageNum / 5))),
      school: formData.school,
      schoolName: schoolObj?.name || 'Aliran Ilmu Akademi',
      rating: 5.0,
      reviewsCount: 0,
      pages: pageNum,
      arcaneLevel: formData.arcaneLevel,
      shelf: formData.shelf,
      status: 'available',
      ingredients: formData.ingredients.length > 0 ? formData.ingredients : ['mysterious_shadow'],
      cover: formData.cover,
      synopsis: formData.synopsis || 'Naskah berharga baru yang baru saja diinskripsikan ke dalam lemari arsip agung.',
      reviews: [],
      featured: true,
    };

    onAddNewBook(newBook);
    setShowAddForm(false);
    setFormData({
      title: '',
      fantasySubtitle: '',
      author: '',
      school: 'alchemy',
      pages: 380,
      arcaneLevel: 'Adept',
      shelf: 'Arsip Menara Sentral - Rak A-01',
      synopsis: '',
      cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop',
      ingredients: ['scientific_spark', 'mysterious_shadow'],
    });
  };

  // Sample school distribution calculations
  const schoolCounts = SCHOOLS_OF_LORE.filter(s => s.id !== 'all').map(school => ({
    name: school.name,
    count: books.filter(b => b.school === school.id).length,
  }));

  return (
    <div className="space-y-12 pb-16 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold-alchemy/20 pb-6">
        <div>
          <div className="flex items-center gap-2 text-gold-alchemy">
            <ShieldCheck className="w-6 h-6 text-potion-purple" />
            <h1 className="font-cinzel text-3xl font-extrabold text-parchment gold-glow">
              Archivist's Chamber
            </h1>
          </div>
          <p className="text-sm text-parchment-muted font-sans mt-1">
            Panel Kurator & Administrasi Perpustakaan. Kelola sirkulasi tomes, penarikan buku, dan daftarkan grimoire baru.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-alchemy to-amber-600 hover:from-amber-500 hover:to-gold-alchemy text-obsidian text-xs font-bold font-cinzel shadow-alchemy transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Tutup Formulir' : 'Inscribe New Grimoire (Tambah Buku)'}</span>
        </button>
      </div>


      {/* Quick Admin Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="parchment-card p-4 rounded-2xl border border-gold-alchemy/20">
          <div className="flex items-center justify-between text-gold-alchemy mb-1">
            <BookOpen className="w-5 h-5" />
            <span className="text-xs font-mono text-stone-400">Total</span>
          </div>
          <div className="font-cinzel text-2xl font-bold text-parchment">
            {books.length} Tomes
          </div>
          <p className="text-[11px] text-stone-400 font-sans mt-0.5">Katalog Terdaftar</p>
        </div>

        <div className="parchment-card p-4 rounded-2xl border border-potion-amber/30">
          <div className="flex items-center justify-between text-potion-amber mb-1">
            <Clock className="w-5 h-5" />
            <span className="text-xs font-mono text-potion-amber">Aktif</span>
          </div>
          <div className="font-cinzel text-2xl font-bold text-potion-amber">
            {activeLoans.length} Dipinjam
          </div>
          <p className="text-[11px] text-stone-400 font-sans mt-0.5">Sirkulasi Murid</p>
        </div>

        <div className="parchment-card p-4 rounded-2xl border border-potion-emerald/30">
          <div className="flex items-center justify-between text-potion-emerald mb-1">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-xs font-mono text-potion-emerald">Tersedia</span>
          </div>
          <div className="font-cinzel text-2xl font-bold text-potion-emerald">
            {availableBooks.length} di Vault
          </div>
          <p className="text-[11px] text-stone-400 font-sans mt-0.5">Siap Dipinjam</p>
        </div>

        <div className="parchment-card p-4 rounded-2xl border border-purple-500/30">
          <div className="flex items-center justify-between text-potion-purple mb-1">
            <Users className="w-5 h-5" />
            <span className="text-xs font-mono text-stone-400">Siswa</span>
          </div>
          <div className="font-cinzel text-2xl font-bold text-parchment">
            342 Scholars
          </div>
          <p className="text-[11px] text-stone-400 font-sans mt-0.5">Akademi Aktif</p>
        </div>
      </div>


      {/* FORM: INSCRIBE NEW GRIMOIRE (Add Book Modal/Accordion) */}
      {showAddForm && (
        <section className="parchment-card rounded-3xl border-2 border-gold-alchemy/50 p-6 sm:p-8 shadow-2xl space-y-6 animate-slideUp">
          <div className="flex items-center justify-between border-b border-gold-alchemy/20 pb-4">
            <div className="flex items-center gap-2 text-gold-alchemy">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-cinzel text-xl font-bold text-parchment">
                Inscribe New Grimoire (Pendaftaran Kitab Baru)
              </h3>
            </div>
            <span className="text-xs text-potion-emerald font-cinzel font-semibold">
              ✦ Arsip Sentral Akademi
            </span>
          </div>

          <form onSubmit={handleSubmitNewBook} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Title */}
              <div>
                <label className="block text-xs font-cinzel font-semibold text-parchment mb-1.5">
                  Judul Utama Grimoire / Buku:
                </label>
                <input
                  type="text"
                  required
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Misal: Biologi Evolusi & Rahasia Hayati"
                  className="w-full rounded-xl bg-obsidian-deep border border-gold-alchemy/30 p-2.5 text-sm text-parchment focus:outline-none focus:border-gold-alchemy font-sans"
                />
              </div>

              {/* Fantasy Subtitle */}
              <div>
                <label className="block text-xs font-cinzel font-semibold text-parchment mb-1.5">
                  Sub-judul Fantasi Alkimia:
                </label>
                <input
                  type="text"
                  name="fantasySubtitle"
                  value={formData.fantasySubtitle}
                  onChange={handleInputChange}
                  placeholder="Misal: Transmutasi Genetik & Pohon Kehidupan Purba"
                  className="w-full rounded-xl bg-obsidian-deep border border-gold-alchemy/30 p-2.5 text-sm text-parchment focus:outline-none focus:border-gold-alchemy font-sans"
                />
              </div>

              {/* Author */}
              <div>
                <label className="block text-xs font-cinzel font-semibold text-parchment mb-1.5">
                  Mpu Pengarang / Penulis:
                </label>
                <input
                  type="text"
                  required
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  placeholder="Misal: Prof. Budi Hartono"
                  className="w-full rounded-xl bg-obsidian-deep border border-gold-alchemy/30 p-2.5 text-sm text-parchment focus:outline-none focus:border-gold-alchemy font-sans"
                />
              </div>

              {/* School of Lore */}
              <div>
                <label className="block text-xs font-cinzel font-semibold text-parchment mb-1.5">
                  Aliran Ilmu (School of Lore):
                </label>
                <select
                  name="school"
                  value={formData.school}
                  onChange={handleInputChange}
                  className="w-full rounded-xl bg-obsidian-deep border border-gold-alchemy/30 p-2.5 text-sm text-parchment focus:outline-none focus:border-gold-alchemy font-sans"
                >
                  <option value="alchemy">Alchemy & Natural Science (Sains Alam)</option>
                  <option value="fiction">Bard's Tales & Fiksi Populer</option>
                  <option value="history">Ancient Lore & Chronicles (Sejarah)</option>
                  <option value="artificer">Artificer & Digital Weave (Teknologi/Coding)</option>
                  <option value="philosophy">High Philosophy & Mind (Filsafat)</option>
                </select>
              </div>

              {/* Pages & Arcane Level */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-cinzel font-semibold text-parchment mb-1.5">
                    Jumlah Halaman:
                  </label>
                  <input
                    type="number"
                    name="pages"
                    value={formData.pages}
                    onChange={handleInputChange}
                    className="w-full rounded-xl bg-obsidian-deep border border-gold-alchemy/30 p-2.5 text-sm text-parchment focus:outline-none focus:border-gold-alchemy font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-cinzel font-semibold text-parchment mb-1.5">
                    Tingkat Kesulitan:
                  </label>
                  <select
                    name="arcaneLevel"
                    value={formData.arcaneLevel}
                    onChange={handleInputChange}
                    className="w-full rounded-xl bg-obsidian-deep border border-gold-alchemy/30 p-2.5 text-sm text-parchment focus:outline-none focus:border-gold-alchemy font-sans"
                  >
                    <option value="Novice">Novice (Pemula)</option>
                    <option value="Adept">Adept (Menengah)</option>
                    <option value="Master">Master (Tinggi)</option>
                    <option value="Archmage">Archmage (Mahir)</option>
                  </select>
                </div>
              </div>

              {/* Shelf Location */}
              <div>
                <label className="block text-xs font-cinzel font-semibold text-parchment mb-1.5">
                  Lokasi Rak Fisik di Perpustakaan:
                </label>
                <input
                  type="text"
                  name="shelf"
                  value={formData.shelf}
                  onChange={handleInputChange}
                  placeholder="Misal: Kubah Barat - Rak Sains #14"
                  className="w-full rounded-xl bg-obsidian-deep border border-gold-alchemy/30 p-2.5 text-sm text-parchment focus:outline-none focus:border-gold-alchemy font-sans"
                />
              </div>

            </div>

            {/* Synopsis */}
            <div>
              <label className="block text-xs font-cinzel font-semibold text-parchment mb-1.5">
                Sinopsis & Ringkasan Manuskrip:
              </label>
              <textarea
                rows={3}
                name="synopsis"
                value={formData.synopsis}
                onChange={handleInputChange}
                placeholder="Tuliskan intisari pembahasan buku ini..."
                className="w-full rounded-xl bg-obsidian-deep border border-gold-alchemy/30 p-2.5 text-sm text-parchment focus:outline-none focus:border-gold-alchemy font-sans resize-none"
              />
            </div>

            {/* Reagents / Ingredients for Alchemical Mixer */}
            <div>
              <label className="block text-xs font-cinzel font-semibold text-parchment mb-1.5">
                Pilih Reagen Suasana Hati (Untuk Alchemical Mixer):
              </label>
              <div className="flex flex-wrap gap-2">
                {ALCHEMICAL_INGREDIENTS.map((ing) => {
                  const isChecked = formData.ingredients.includes(ing.id);
                  return (
                    <button
                      type="button"
                      key={ing.id}
                      onClick={() => handleIngredientToggle(ing.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-sans transition-all flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-potion-emerald text-obsidian font-bold shadow'
                          : 'bg-leather-dark text-stone-400 border border-gold-alchemy/20 hover:border-gold-alchemy/50'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{ing.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="pt-3 border-t border-gold-alchemy/20 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl bg-leather hover:bg-leather-light text-parchment text-xs font-semibold border border-gold-alchemy/20 transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-alchemy to-amber-600 hover:from-amber-500 hover:to-gold-alchemy text-obsidian text-xs font-bold font-cinzel shadow-alchemy transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Inskripsikan ke Katalog Vault</span>
              </button>
            </div>
          </form>
        </section>
      )}


      {/* ACTIVE LOANS LEDGER TABLE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-gold-alchemy/20 pb-3">
          <div>
            <h3 className="font-cinzel text-xl font-bold text-parchment">
              Active Loan Ledger (Buku Besar Peminjaman)
            </h3>
            <p className="text-xs text-parchment-muted font-sans">
              Pantau sirkulasi peminjaman siswa dan kelola penarikan naskah
            </p>
          </div>
          <span className="text-xs font-bold text-potion-amber font-mono">
            {activeLoans.length} Peminjaman Aktif
          </span>
        </div>

        <div className="parchment-card rounded-2xl border border-gold-alchemy/25 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-leather-dark/90 text-gold-light font-cinzel border-b border-gold-alchemy/20">
                <tr>
                  <th className="p-3.5 pl-4">Judul Grimoire</th>
                  <th className="p-3.5">Cendekiawan (Peminjam)</th>
                  <th className="p-3.5">Tanggal Pinjam</th>
                  <th className="p-3.5">Sisa Mana / Tempo</th>
                  <th className="p-3.5 text-right pr-4">Aksi Kurator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-alchemy/10 text-stone-300">
                {activeLoans.map((book) => {
                  const daysLeft = book.loanInfo?.daysLeft ?? 7;
                  return (
                    <tr key={book.id} className="hover:bg-leather/40 transition-colors">
                      <td className="p-3.5 pl-4">
                        <div className="font-cinzel font-bold text-parchment">
                          {book.title}
                        </div>
                        <div className="text-[11px] text-stone-400 font-sans">
                          {book.author} • {book.schoolName}
                        </div>
                      </td>
                      <td className="p-3.5 font-medium text-parchment">
                        {book.loanInfo?.borrower || 'Raden Arya Al-Ghazali'}
                      </td>
                      <td className="p-3.5 font-mono text-stone-400">
                        {book.loanInfo?.borrowedDate || '2026-11-06'}
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 text-potion-amber border border-potion-amber/40">
                          <Clock className="w-3 h-3" />
                          <span>{daysLeft} Hari</span>
                        </span>
                      </td>
                      <td className="p-3.5 text-right pr-4 space-x-2">
                        <button
                          onClick={() => onExtendLoan(book.id)}
                          className="px-2.5 py-1 rounded-lg bg-leather hover:bg-leather-light text-gold-light border border-gold-alchemy/30 text-[11px] transition-colors"
                          title="Perpanjang Peminjaman 7 Hari"
                        >
                          + Perpanjang
                        </button>
                        <button
                          onClick={() => onRecallTome(book.id)}
                          className="px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-700/50 text-[11px] font-medium transition-colors"
                          title="Tarik Kembali ke Vault"
                        >
                          Tarik (Recall)
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>


      {/* LIBRARY ANALYTICS & DISTRIBUTION */}
      <section className="parchment-card rounded-3xl border border-gold-alchemy/25 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-gold-alchemy/15 pb-3">
          <div className="flex items-center gap-2 text-gold-alchemy">
            <TrendingUp className="w-5 h-5" />
            <h3 className="font-cinzel text-lg font-bold text-parchment">
              Distribusi Koleksi Berdasarkan Aliran Keilmuan
            </h3>
          </div>
          <span className="text-xs text-stone-400 font-sans">
            Statistik Realtime Arsip
          </span>
        </div>

        <div className="space-y-4">
          {schoolCounts.map((item) => {
            const pct = Math.round((item.count / books.length) * 100);
            return (
              <div key={item.name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-sans">
                  <span className="font-semibold text-parchment">{item.name}</span>
                  <span className="text-gold-light font-mono font-bold">
                    {item.count} Tomes ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-obsidian rounded-full overflow-hidden border border-stone-800">
                  <div 
                    className="h-full bg-gradient-to-r from-gold-alchemy to-potion-emerald rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
