import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  INITIAL_BOOKS,
  GUILD_QUESTS,
  INITIAL_SCHOLAR,
} from '../data/mockData';

const DEFAULT_PROFILE_ID = 'scholar-arya';

function computeDaysLeft(dueDateStr) {
  if (!dueDateStr) return 14;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDateStr}T00:00:00`);
  const diffMs = due.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function mapReviewForBook(row) {
  return {
    id: row.id,
    scholarName: row.scholar_name,
    scholarRank: row.scholar_rank,
    rating: row.rating,
    date: row.review_date,
    note: row.note,
  };
}

function mapReviewForScholar(row) {
  return {
    id: row.id,
    bookTitle: row.book_title,
    rating: row.rating,
    date: row.review_date,
    note: row.note,
    xpAwarded: row.xp_awarded,
  };
}

function mapBookRow(row, activeLoansByBook, reviewsByBook) {
  const activeLoan = activeLoansByBook[row.id];
  const bookReviews = reviewsByBook[row.id] || [];

  return {
    id: row.id,
    title: row.title,
    fantasySubtitle: row.fantasy_subtitle,
    author: row.author,
    isbn: row.isbn,
    xpReward: row.xp_reward,
    school: row.school,
    schoolName: row.school_name,
    rating: Number(row.rating),
    reviewsCount: row.reviews_count,
    pages: row.pages,
    arcaneLevel: row.arcane_level,
    shelf: row.shelf,
    status: activeLoan ? 'borrowed' : row.status,
    loanInfo: activeLoan
      ? {
          id: activeLoan.id,
          borrower: activeLoan.borrower_name,
          borrowedDate: activeLoan.borrowed_date,
          dueDate: activeLoan.due_date,
          daysLeft: computeDaysLeft(activeLoan.due_date),
        }
      : null,
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    cover: row.cover,
    synopsis: row.synopsis,
    reviews: bookReviews,
    featured: Boolean(row.featured),
  };
}

function mapQuestRow(row) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    category: row.category,
    xpReward: row.xp_reward,
    badgeReward: row.badge_reward,
    progress: row.progress,
    target: row.target,
    completed: Boolean(row.completed),
    claimed: Boolean(row.claimed),
    description: row.description,
  };
}

function mapProfileRow(row, scholarReviews) {
  return {
    id: row.id,
    name: row.name,
    studentId: row.student_id,
    guildRole: row.guild_role,
    academyClass: row.academy_class,
    xp: row.xp,
    maxXP: row.max_xp,
    level: row.level,
    potionsBrewedCount: row.potions_brewed_count,
    tomesReadCount: row.tomes_read_count,
    reviewsPennedCount: row.reviews_penned_count,
    badges: Array.isArray(row.badges) ? row.badges : INITIAL_SCHOLAR.badges,
    reviews: scholarReviews,
  };
}

export const archiveService = {
  isLive() {
    return isSupabaseConfigured;
  },

  async fetchArchiveData(profileId = DEFAULT_PROFILE_ID) {
    if (!isSupabaseConfigured || !supabase) {
      return {
        mode: 'mock',
        books: INITIAL_BOOKS,
        quests: GUILD_QUESTS,
        scholar: { id: DEFAULT_PROFILE_ID, ...INITIAL_SCHOLAR },
      };
    }

    const [booksRes, loansRes, reviewsRes, questsRes, profileRes] = await Promise.all([
      supabase.from('books').select('*').order('created_at', { ascending: false }),
      supabase.from('loans').select('*').eq('status', 'active').order('created_at', { ascending: false }),
      supabase.from('reviews').select('*').order('created_at', { ascending: false }),
      supabase.from('quests').select('*').order('id', { ascending: true }),
      supabase.from('profiles').select('*').eq('id', profileId).maybeSingle(),
    ]);

    const firstError =
      booksRes.error || loansRes.error || reviewsRes.error || questsRes.error || profileRes.error;

    if (firstError) {
      throw firstError;
    }

    // If database tables exist but seed SQL has not been executed yet, fallback safely
    if (!booksRes.data?.length && !profileRes.data) {
      return {
        mode: 'mock-fallback',
        books: INITIAL_BOOKS,
        quests: GUILD_QUESTS,
        scholar: { id: DEFAULT_PROFILE_ID, ...INITIAL_SCHOLAR },
      };
    }

    const activeLoansByBook = {};
    for (const loan of loansRes.data || []) {
      if (!activeLoansByBook[loan.book_id]) {
        activeLoansByBook[loan.book_id] = loan;
      }
    }

    const reviewsByBook = {};
    const scholarReviews = [];
    for (const rev of reviewsRes.data || []) {
      if (!reviewsByBook[rev.book_id]) {
        reviewsByBook[rev.book_id] = [];
      }
      reviewsByBook[rev.book_id].push(mapReviewForBook(rev));

      if (rev.profile_id === profileId || rev.scholar_name === profileRes.data?.name) {
        scholarReviews.push(mapReviewForScholar(rev));
      }
    }

    const books = (booksRes.data || []).map((row) =>
      mapBookRow(row, activeLoansByBook, reviewsByBook)
    );
    const quests = (questsRes.data || []).map(mapQuestRow);
    const scholar = profileRes.data
      ? mapProfileRow(profileRes.data, scholarReviews)
      : { id: DEFAULT_PROFILE_ID, ...INITIAL_SCHOLAR };

    return {
      mode: 'supabase',
      books,
      quests,
      scholar,
    };
  },

  async summonTome({ tome, scholar, borrowedDate, dueDate, updatedQuests }) {
    if (!isSupabaseConfigured || !supabase) {
      return { mode: 'mock' };
    }

    const profileId = scholar.id || DEFAULT_PROFILE_ID;

    const { error: loanError } = await supabase.from('loans').insert({
      book_id: tome.id,
      profile_id: profileId,
      borrower_name: scholar.name,
      borrowed_date: borrowedDate,
      due_date: dueDate,
      status: 'active',
    });
    if (loanError) throw loanError;

    const { error: bookError } = await supabase
      .from('books')
      .update({ status: 'borrowed', updated_at: new Date().toISOString() })
      .eq('id', tome.id);
    if (bookError) throw bookError;

    // Sync any quests whose progress changed
    const changedQuests = (updatedQuests || []).filter((q) => q.category === tome.school && !q.claimed);
    for (const quest of changedQuests) {
      const { error: questError } = await supabase
        .from('quests')
        .update({ progress: quest.progress, completed: quest.completed })
        .eq('id', quest.id);
      if (questError) throw questError;
    }

    return { mode: 'supabase' };
  },

  async returnTome({
    tome,
    scholar,
    rating,
    note,
    xpAwarded,
    reviewDate,
    newBookRating,
    newReviewsCount,
    xpProgress,
  }) {
    const reviewId = `rev-${Date.now()}`;
    if (!isSupabaseConfigured || !supabase) {
      return { mode: 'mock', reviewId };
    }

    const profileId = scholar.id || DEFAULT_PROFILE_ID;

    const { error: loanError } = await supabase
      .from('loans')
      .update({ status: 'returned', returned_at: new Date().toISOString() })
      .eq('book_id', tome.id)
      .eq('status', 'active');
    if (loanError) throw loanError;

    const { error: reviewError } = await supabase.from('reviews').insert({
      id: reviewId,
      book_id: tome.id,
      profile_id: profileId,
      scholar_name: scholar.name,
      scholar_rank: scholar.guildRole,
      book_title: tome.title,
      rating,
      note,
      xp_awarded: xpAwarded,
      review_date: reviewDate,
    });
    if (reviewError) throw reviewError;

    const { error: bookError } = await supabase
      .from('books')
      .update({
        status: 'available',
        rating: newBookRating,
        reviews_count: newReviewsCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tome.id);
    if (bookError) throw bookError;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        xp: xpProgress.nextXP,
        level: xpProgress.nextLevel,
        max_xp: xpProgress.nextMaxXP,
        guild_role: xpProgress.nextRole,
        tomes_read_count: scholar.tomesReadCount + 1,
        reviews_penned_count: scholar.reviewsPennedCount + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId);
    if (profileError) throw profileError;

    return { mode: 'supabase', reviewId };
  },

  async claimQuestReward({ questId, scholar, xpProgress, updatedBadges }) {
    if (!isSupabaseConfigured || !supabase) {
      return { mode: 'mock' };
    }

    const profileId = scholar.id || DEFAULT_PROFILE_ID;

    const { error: questError } = await supabase
      .from('quests')
      .update({ claimed: true })
      .eq('id', questId);
    if (questError) throw questError;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        xp: xpProgress.nextXP,
        level: xpProgress.nextLevel,
        max_xp: xpProgress.nextMaxXP,
        guild_role: xpProgress.nextRole,
        badges: updatedBadges,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId);
    if (profileError) throw profileError;

    return { mode: 'supabase' };
  },

  async inscribeNewBook(newBook) {
    if (!isSupabaseConfigured || !supabase) {
      return { mode: 'mock' };
    }

    const { error } = await supabase.from('books').insert({
      id: newBook.id,
      title: newBook.title,
      fantasy_subtitle: newBook.fantasySubtitle,
      author: newBook.author,
      isbn: newBook.isbn,
      xp_reward: newBook.xpReward,
      school: newBook.school,
      school_name: newBook.schoolName,
      rating: newBook.rating,
      reviews_count: newBook.reviewsCount,
      pages: newBook.pages,
      arcane_level: newBook.arcaneLevel,
      shelf: newBook.shelf,
      status: newBook.status,
      ingredients: newBook.ingredients,
      cover: newBook.cover,
      synopsis: newBook.synopsis,
      featured: newBook.featured,
    });
    if (error) throw error;

    return { mode: 'supabase' };
  },

  async recallTome(bookId) {
    if (!isSupabaseConfigured || !supabase) {
      return { mode: 'mock' };
    }

    const { error: loanError } = await supabase
      .from('loans')
      .update({ status: 'recalled', returned_at: new Date().toISOString() })
      .eq('book_id', bookId)
      .eq('status', 'active');
    if (loanError) throw loanError;

    const { error: bookError } = await supabase
      .from('books')
      .update({ status: 'available', updated_at: new Date().toISOString() })
      .eq('id', bookId);
    if (bookError) throw bookError;

    return { mode: 'supabase' };
  },

  async extendLoan({ bookId, newDueDate }) {
    if (!isSupabaseConfigured || !supabase) {
      return { mode: 'mock' };
    }

    const { error } = await supabase
      .from('loans')
      .update({ due_date: newDueDate })
      .eq('book_id', bookId)
      .eq('status', 'active');
    if (error) throw error;

    return { mode: 'supabase' };
  },

  async incrementPotionsBrewed({ scholar, nextCount }) {
    if (!isSupabaseConfigured || !supabase) {
      return { mode: 'mock' };
    }

    const profileId = scholar.id || DEFAULT_PROFILE_ID;

    const { error } = await supabase
      .from('profiles')
      .update({
        potions_brewed_count: nextCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId);
    if (error) throw error;

    return { mode: 'supabase' };
  },
};

