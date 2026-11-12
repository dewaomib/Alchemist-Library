import React, { useState, useRef, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import TomeModal from './components/TomeModal';
import ReturnTomeModal from './components/ReturnTomeModal';
import NotificationToast from './components/NotificationToast';

import GreatHallView from './views/GreatHallView';
import VaultOfTomesView from './views/VaultOfTomesView';
import AlchemicalMixerView from './views/AlchemicalMixerView';
import ScholarSanctumView from './views/ScholarSanctumView';
import ArchivistChamberView from './views/ArchivistChamberView';

import { INITIAL_BOOKS, GUILD_QUESTS, INITIAL_SCHOLAR } from './data/mockData';
import { archiveService } from './services/archiveService';
import { playArcaneSound } from './utils/soundEffects';
import confetti from 'canvas-confetti';

function getGuildRoleForLevel(level) {
  if (level <= 1) return 'Novice Initiate - Level 1';
  if (level === 2) return 'Apprentice Scribe - Level 2';
  if (level === 3) return 'Arcane Seeker - Level 3';
  if (level === 4) return 'Adept Alchemist - Level 4';
  if (level === 5) return 'Master Alchemist - Level 5';
  return `Grand Archmage - Level ${level}`;
}

function calculateXpProgression(currentScholar, xpGain) {
  const nextXP = currentScholar.xp + xpGain;
  let nextLevel = currentScholar.level;
  let nextMaxXP = currentScholar.maxXP;

  while (nextXP >= nextMaxXP) {
    nextLevel += 1;
    nextMaxXP = Math.round(nextMaxXP * 1.5);
  }

  const leveledUp = nextLevel > currentScholar.level;
  return {
    nextXP,
    nextLevel,
    nextMaxXP,
    nextRole: leveledUp ? getGuildRoleForLevel(nextLevel) : currentScholar.guildRole,
    leveledUp,
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState('hall'); // 'hall', 'vault', 'mixer', 'sanctum', 'archivist'
  const [books, setBooks] = useState(INITIAL_BOOKS);
  const [quests, setQuests] = useState(GUILD_QUESTS);
  const [scholar, setScholar] = useState({ id: 'scholar-arya', ...INITIAL_SCHOLAR });
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dataMode, setDataMode] = useState(archiveService.isLive() ? 'syncing' : 'mock');

  // Modals & Toasts
  const [inspectingTome, setInspectingTome] = useState(null);
  const [returningTome, setReturningTome] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (title, message, type = 'success', xp = null) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    playArcaneSound(type, soundEnabled);
    setToast({ title, message, type, xp });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // Load persisted data from Supabase (with automatic fallback to mock data)
  useEffect(() => {
    let isMounted = true;

    async function loadArchive() {
      try {
        const snapshot = await archiveService.fetchArchiveData();
        if (!isMounted) return;
        setBooks(snapshot.books);
        setQuests(snapshot.quests);
        setScholar(snapshot.scholar);
        setDataMode(snapshot.mode);
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load Supabase archive data, falling back to mock data:', err);
        setDataMode('mock-fallback');
        showToast(
          'Mode Lokal Aktif (Fallback)',
          'Koneksi Supabase gagal atau skema belum dijalankan. Menggunakan data arsip lokal.',
          'error'
        );
      }
    }

    loadArchive();
    return () => {
      isMounted = false;
    };
  }, []);

  // Keep inspecting modal synced with latest books state (e.g., reviews/status updates)
  const activeInspectingTome = inspectingTome
    ? books.find((b) => b.id === inspectingTome.id) || inspectingTome
    : null;

  // Filter books currently borrowed by our scholar
  const mySummonedBooks = books.filter(
    (b) => b.status === 'borrowed' && b.loanInfo?.borrower === scholar.name
  );
  const mySummonedIds = mySummonedBooks.map((b) => b.id);

  // 1. Summon / Borrow Book
  const handleSummonTome = async (tome) => {
    if (tome.status !== 'available') {
      showToast('Grimoire Sedang Dipinjam', 'Kitab ini sedang dalam genggaman scholar lain.', 'error');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const previousBooks = books;
    const previousQuests = quests;

    const updatedBooks = books.map((b) => {
      if (b.id === tome.id) {
        return {
          ...b,
          status: 'borrowed',
          loanInfo: {
            borrower: scholar.name,
            borrowedDate: todayStr,
            dueDate: dueDateStr,
            daysLeft: 14,
          },
        };
      }
      return b;
    });

    const updatedQuests = quests.map((q) => {
      if (q.category === tome.school && !q.completed) {
        const nextProgress = q.progress + 1;
        const isDone = nextProgress >= q.target;
        return {
          ...q,
          progress: nextProgress,
          completed: isDone,
        };
      }
      return q;
    });

    setBooks(updatedBooks);
    setQuests(updatedQuests);

    try {
      await archiveService.summonTome({
        tome,
        scholar,
        borrowedDate: todayStr,
        dueDate: dueDateStr,
        updatedQuests,
      });
    } catch (err) {
      console.error('Supabase summonTome error:', err);
      setBooks(previousBooks);
      setQuests(previousQuests);
      showToast('Gagal Menyimpan Peminjaman', 'Terjadi kendala saat menyinkronkan ke Supabase.', 'error');
      return;
    }

    // Confetti effect
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#D4AF37', '#10B981', '#8B5CF6'],
      });
    } catch (e) {}

    showToast(
      'Tome Berhasil Disummon!',
      `"${tome.title}" telah ditambahkan ke Scholar's Sanctum Anda selama 14 hari.`,
      'borrow'
    );
  };

  // 2. Return Book & Claim XP
  const handleConfirmReturn = async ({ tomeId, bookTitle, rating, note, xpAwarded }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetBook = books.find((b) => b.id === tomeId);
    if (!targetBook) return;

    const prevCount = targetBook.reviewsCount || 0;
    const newReviewsCount = prevCount + 1;
    const newBookRating = Number(
      (((targetBook.rating || rating) * prevCount + rating) / newReviewsCount).toFixed(1)
    );

    const xpProgress = calculateXpProgression(scholar, xpAwarded);

    const previousBooks = books;
    const previousScholar = scholar;

    const tempReviewId = `note-${Date.now()}`;
    const newBookNote = {
      id: tempReviewId,
      scholarName: scholar.name,
      scholarRank: scholar.guildRole,
      rating,
      date: todayStr,
      note,
    };

    const updatedBooks = books.map((b) => {
      if (b.id === tomeId) {
        return {
          ...b,
          status: 'available',
          loanInfo: null,
          reviewsCount: newReviewsCount,
          rating: newBookRating,
          reviews: [newBookNote, ...(b.reviews || [])],
        };
      }
      return b;
    });

    const newReview = {
      id: tempReviewId,
      bookTitle,
      rating,
      date: todayStr,
      note,
      xpAwarded,
    };

    setBooks(updatedBooks);
    setScholar((prev) => ({
      ...prev,
      xp: xpProgress.nextXP,
      level: xpProgress.nextLevel,
      maxXP: xpProgress.nextMaxXP,
      guildRole: xpProgress.nextRole,
      tomesReadCount: prev.tomesReadCount + 1,
      reviewsPennedCount: prev.reviewsPennedCount + 1,
      reviews: [newReview, ...prev.reviews],
    }));

    try {
      await archiveService.returnTome({
        tome: targetBook,
        scholar: previousScholar,
        rating,
        note,
        xpAwarded,
        reviewDate: todayStr,
        newBookRating,
        newReviewsCount,
        xpProgress,
      });
    } catch (err) {
      console.error('Supabase returnTome error:', err);
      setBooks(previousBooks);
      setScholar(previousScholar);
      showToast('Gagal Mengembalikan Grimoire', 'Perubahan tidak tersimpan ke Supabase.', 'error');
      return;
    }

    if (xpProgress.leveledUp) {
      try {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.55 },
          colors: ['#D4AF37', '#F3D87E', '#10B981', '#8B5CF6'],
        });
      } catch (e) {}

      showToast(
        `✦ LEVEL UP! Naik ke Level ${xpProgress.nextLevel}!`,
        `Selamat! Pangkat baru Anda: ${xpProgress.nextRole}. Ulasan "${bookTitle}" juga tersimpan di arsip.`,
        'levelup',
        xpAwarded
      );
    } else {
      showToast(
        'Grimoire Berhasil Dikembalikan!',
        `Scholar's Note untuk "${bookTitle}" tersimpan dan Anda mengklaim +${xpAwarded} Scholar XP.`,
        'xp',
        xpAwarded
      );
    }
  };

  // 3. Claim Quest Reward
  const handleClaimQuest = async (questId) => {
    const quest = quests.find((q) => q.id === questId);
    if (!quest || quest.claimed) return;

    const xpProgress = calculateXpProgression(scholar, quest.xpReward);
    const updatedBadges = scholar.badges.map((b) => {
      if (b.name.toLowerCase().includes(quest.badgeReward.toLowerCase())) {
        return { ...b, unlocked: true };
      }
      return b;
    });

    const previousQuests = quests;
    const previousScholar = scholar;

    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, claimed: true } : q))
    );
    setScholar((prev) => ({
      ...prev,
      xp: xpProgress.nextXP,
      level: xpProgress.nextLevel,
      maxXP: xpProgress.nextMaxXP,
      guildRole: xpProgress.nextRole,
      badges: updatedBadges,
    }));

    try {
      await archiveService.claimQuestReward({
        questId,
        scholar: previousScholar,
        xpProgress,
        updatedBadges,
      });
    } catch (err) {
      console.error('Supabase claimQuestReward error:', err);
      setQuests(previousQuests);
      setScholar(previousScholar);
      showToast('Gagal Mengklaim Quest', 'Tidak dapat menyimpan progres quest ke Supabase.', 'error');
      return;
    }

    try {
      confetti({
        particleCount: xpProgress.leveledUp ? 120 : 90,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#10B981', '#8B5CF6'],
      });
    } catch (e) {}

    if (xpProgress.leveledUp) {
      showToast(
        `✦ LEVEL UP ke Level ${xpProgress.nextLevel} & Quest Selesai!`,
        `Lencana "${quest.badgeReward}" terbuka dan pangkat naik menjadi ${xpProgress.nextRole}!`,
        'levelup',
        quest.xpReward
      );
    } else {
      showToast(
        'Quest Literasi Selesai!',
        `Selamat! Anda memperoleh +${quest.xpReward} XP dan lencana "${quest.badgeReward}".`,
        'xp',
        quest.xpReward
      );
    }
  };

  // 4. Inscribe New Book (Archivist Admin)
  const handleAddNewBook = async (newBook) => {
    const previousBooks = books;
    setBooks((prev) => [newBook, ...prev]);

    try {
      await archiveService.inscribeNewBook(newBook);
    } catch (err) {
      console.error('Supabase inscribeNewBook error:', err);
      setBooks(previousBooks);
      showToast('Gagal Mendaftarkan Grimoire', 'Terjadi kesalahan saat menyimpan ke Supabase.', 'error');
      return;
    }

    showToast(
      'Grimoire Baru Berhasil Diinskripsikan!',
      `"${newBook.title}" kini telah resmi masuk ke dalam Vault of Tomes.`,
      'success'
    );
  };

  // 5. Recall Tome (Archivist Admin)
  const handleRecallTome = async (bookId) => {
    const previousBooks = books;
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === bookId) {
          return {
            ...b,
            status: 'available',
            loanInfo: null,
          };
        }
        return b;
      })
    );

    try {
      await archiveService.recallTome(bookId);
    } catch (err) {
      console.error('Supabase recallTome error:', err);
      setBooks(previousBooks);
      showToast('Gagal Menarik Grimoire', 'Tidak dapat memperbarui status di Supabase.', 'error');
      return;
    }

    showToast(
      'Tome Telah Ditarik',
      'Grimoire telah dikembalikan secara paksa ke dalam rak vault.',
      'success'
    );
  };

  // 6. Extend Loan
  const handleExtendLoan = async (bookId) => {
    const targetBook = books.find((b) => b.id === bookId);
    if (!targetBook?.loanInfo) return;

    const baseDue = targetBook.loanInfo.dueDate
      ? new Date(`${targetBook.loanInfo.dueDate}T00:00:00`)
      : new Date();
    baseDue.setDate(baseDue.getDate() + 7);
    const newDueDateStr = baseDue.toISOString().split('T')[0];

    const previousBooks = books;
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === bookId && b.loanInfo) {
          return {
            ...b,
            loanInfo: {
              ...b.loanInfo,
              dueDate: newDueDateStr,
              daysLeft: (b.loanInfo.daysLeft || 7) + 7,
            },
          };
        }
        return b;
      })
    );

    try {
      await archiveService.extendLoan({ bookId, newDueDate: newDueDateStr });
    } catch (err) {
      console.error('Supabase extendLoan error:', err);
      setBooks(previousBooks);
      showToast('Gagal Memperpanjang Pinjaman', 'Tidak dapat memperbarui jatuh tempo di Supabase.', 'error');
      return;
    }

    showToast('Peminjaman Diperpanjang', 'Masa peminjaman ditambahkan +7 hari.', 'success');
  };

  // 7. Increment Brew Count & Trigger Magical Brew Scroll Toast
  const handleIncrementBrewCount = async (potionName, matchCount = 0) => {
    const nextCount = scholar.potionsBrewedCount + 1;
    setScholar((prev) => ({
      ...prev,
      potionsBrewedCount: nextCount,
    }));

    try {
      await archiveService.incrementPotionsBrewed({ scholar, nextCount });
    } catch (err) {
      console.error('Supabase incrementPotionsBrewed error:', err);
    }

    showToast(
      `${potionName || 'Ramuan Rekomendasi'} Berhasil Diracik!`,
      matchCount > 0
        ? `Kuali arkanum menyingkap ${matchCount} grimoire yang selaras dengan komposisi reagen Anda.`
        : 'Transmutasi selesai! Coba kombinasi reagen lain untuk hasil lebih banyak.',
      'brew'
    );
  };

  return (
    <div className="min-h-screen bg-obsidian text-parchment flex flex-col selection:bg-gold-alchemy selection:text-obsidian">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        scholar={scholar}
        activeLoansCount={mySummonedBooks.length}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
      />

      {/* Subtle Persistence Mode Status Bar */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 flex justify-end">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono border ${
            dataMode === 'supabase'
              ? 'bg-emerald-950/60 text-potion-emerald border-potion-emerald/40'
              : dataMode === 'syncing'
                ? 'bg-purple-950/60 text-potion-purple border-potion-purple/40 animate-pulse'
                : 'bg-leather-dark/80 text-parchment-muted border-gold-alchemy/25'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              dataMode === 'supabase'
                ? 'bg-potion-emerald'
                : dataMode === 'syncing'
                  ? 'bg-potion-purple'
                  : 'bg-gold-alchemy'
            }`}
          />
          {dataMode === 'supabase'
            ? 'Supabase Archive Live'
            : dataMode === 'syncing'
              ? 'Menghubungkan Supabase...'
              : 'Local Mock Archive (Fallback)'}
        </span>
      </div>

      {/* Main Content View Switcher */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {activeTab === 'hall' && (
          <GreatHallView
            books={books}
            quests={quests}
            onInspectTome={(tome) => setInspectingTome(tome)}
            onSummonTome={handleSummonTome}
            onClaimQuest={handleClaimQuest}
            setActiveTab={setActiveTab}
            setSearchQuery={setSearchQuery}
            mySummonedIds={mySummonedIds}
          />
        )}

        {activeTab === 'vault' && (
          <VaultOfTomesView
            books={books}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onInspectTome={(tome) => setInspectingTome(tome)}
            onSummonTome={handleSummonTome}
            mySummonedIds={mySummonedIds}
          />
        )}

        {activeTab === 'mixer' && (
          <AlchemicalMixerView
            books={books}
            onInspectTome={(tome) => setInspectingTome(tome)}
            onSummonTome={handleSummonTome}
            mySummonedIds={mySummonedIds}
            onIncrementBrewCount={handleIncrementBrewCount}
          />
        )}

        {activeTab === 'sanctum' && (
          <ScholarSanctumView
            scholar={scholar}
            summonedBooks={mySummonedBooks}
            onOpenReturnModal={(tome) => setReturningTome(tome)}
            onInspectTome={(tome) => setInspectingTome(tome)}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'archivist' && (
          <ArchivistChamberView
            books={books}
            onAddNewBook={handleAddNewBook}
            onRecallTome={handleRecallTome}
            onExtendLoan={handleExtendLoan}
            onInspectTome={(tome) => setInspectingTome(tome)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer setActiveTab={setActiveTab} />

      {/* Inspect Tome Detail Modal */}
      <TomeModal
        tome={activeInspectingTome}
        isOpen={!!activeInspectingTome}
        onClose={() => setInspectingTome(null)}
        onSummon={handleSummonTome}
        isSummonedByMe={activeInspectingTome ? mySummonedIds.includes(activeInspectingTome.id) : false}
      />

      {/* Return Tome Modal (Review & Claim XP) */}
      <ReturnTomeModal
        tome={returningTome}
        isOpen={!!returningTome}
        onClose={() => setReturningTome(null)}
        onConfirmReturn={handleConfirmReturn}
      />

      {/* Magical Scroll Toast Notification */}
      <NotificationToast
        toast={toast}
        onDismiss={() => setToast(null)}
      />

    </div>
  );
}
