// Pure helpers for reader theme and progress. No browser/Supabase imports,
// so these can run under Node's built-in test runner.

const STORAGE_PREFIX = 'alchemist-archive:v2';

export const DEFAULT_READER_THEME = 'obsidian';
export const READER_THEMES = ['obsidian', 'parchment'];

function safeString(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

export function normalizeReaderTheme(value) {
  const normalized = safeString(value).toLowerCase();
  if (normalized === 'midnight') return 'obsidian';
  if (normalized === 'parchment') return 'parchment';
  return DEFAULT_READER_THEME;
}

export function getUserKey(user) {
  if (!user || typeof user !== 'object') return 'guest';
  const raw = user.id || user.guildId || user.email;
  const value = safeString(raw).toLowerCase();
  return value || 'guest';
}

export function getBookKey(book) {
  if (!book || typeof book !== 'object') return 'unknown-book';

  if (book.id || book.kodeBuku) {
    return safeString(book.id || book.kodeBuku);
  }

  const slug = safeString(book.title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'unknown-book';
}

export function getThemeStorageKey(userId) {
  return `${STORAGE_PREFIX}:reader-theme:${safeString(userId) || 'guest'}`;
}

export function getProgressStorageKey(userId, bookId, source = 'text') {
  const safeSource = source === 'pdf' ? 'pdf' : 'text';
  const user = safeString(userId) || 'guest';
  const book = safeString(bookId) || 'unknown-book';
  return `${STORAGE_PREFIX}:reading-progress:${user}:${book}:${safeSource}`;
}

export function clampChapterIndex(index, totalChapters) {
  const total = Number(totalChapters);
  const max = Number.isFinite(total) ? Math.max(0, Math.floor(total) - 1) : 0;
  const parsed = Number(index);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(max, Math.max(0, Math.floor(parsed)));
}

export function clampScrollRatio(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(1, Math.max(0, parsed));
}

export function computeProgressPercent(chapterIndex, totalChapters) {
  const total = Number(totalChapters);
  if (!Number.isFinite(total) || total <= 0) return 0;
  const index = clampChapterIndex(chapterIndex, total);
  return Math.min(100, Math.max(0, Math.round(((index + 1) / total) * 100)));
}

export function normalizeReadingProgress(raw, totalChapters) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const chapterIndexRaw = Number(raw.chapterIndex);
  if (!Number.isFinite(chapterIndexRaw)) return null;

  const source = raw.source === 'pdf' ? 'pdf' : 'text';
  const total = Number(totalChapters);
  const hasTotal = Number.isFinite(total) && total > 0;
  const chapterIndex = hasTotal
    ? clampChapterIndex(chapterIndexRaw, total)
    : Math.max(0, Math.floor(chapterIndexRaw));

  const scrollRatio = source === 'pdf' ? 0 : clampScrollRatio(raw.scrollRatio);
  const pageNumber = source === 'pdf' ? null : chapterIndex + 1;
  const progressPercent = source === 'pdf'
    ? 0
    : hasTotal
      ? computeProgressPercent(chapterIndex, total)
      : Math.min(100, Math.max(0, Math.round(Number(raw.progressPercent) || 0)));

  return {
    version: 1,
    source,
    chapterIndex,
    chapterTitle: typeof raw.chapterTitle === 'string' ? raw.chapterTitle : '',
    pageNumber,
    scrollRatio,
    progressPercent,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : ''
  };
}

export function createTextProgress({
  chapterIndex,
  chapterTitle = '',
  scrollRatio = 0,
  totalChapters,
  updatedAt = new Date().toISOString()
}) {
  const total = Number(totalChapters);
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 0;
  const index = clampChapterIndex(chapterIndex, safeTotal);

  return {
    version: 1,
    source: 'text',
    chapterIndex: index,
    chapterTitle,
    pageNumber: index + 1,
    scrollRatio: clampScrollRatio(scrollRatio),
    progressPercent: computeProgressPercent(index, safeTotal),
    updatedAt
  };
}

export function createPdfProgress(updatedAt = new Date().toISOString()) {
  return {
    version: 1,
    source: 'pdf',
    chapterIndex: 0,
    chapterTitle: '',
    pageNumber: null,
    scrollRatio: 0,
    progressPercent: 0,
    updatedAt
  };
}

export function shouldShowResume(progress) {
  if (!progress) return false;
  return Number(progress.chapterIndex) > 0 || Number(progress.scrollRatio) > 0.05;
}

export function shouldMarkNavigationFromScroll(isRestoringScroll) {
  return isRestoringScroll !== true;
}

export function resolveRemoteRestoreAction(remoteChapterIndex, currentChapterIndex) {
  const remote = Number(remoteChapterIndex);
  const current = Number(currentChapterIndex);
  return Number.isFinite(remote) && remote === current ? 'scroll' : 'chapter';
}

export function shouldApplyRemoteProgress(local, remote, hasUserNavigated) {
  if (hasUserNavigated || !remote) return false;
  if (!local) return true;

  const remoteTime = Date.parse(remote.updatedAt);
  const localTime = Date.parse(local.updatedAt);

  if (!Number.isFinite(remoteTime)) return false;
  if (!Number.isFinite(localTime)) return true;

  return remoteTime > localTime;
}

export function formatResumeMessage(progress, totalChapters) {
  if (!progress) return '';

  const page = Number(progress.pageNumber) || Number(progress.chapterIndex) + 1;
  const total = Number(totalChapters);
  const pageText = Number.isFinite(total) && total > 0
    ? `halaman ${page} dari ${Math.floor(total)}`
    : `halaman ${page}`;
  const title = progress.chapterTitle ? ` — ${progress.chapterTitle}` : '';

  return `Melanjutkan dari ${pageText}${title}`;
}
