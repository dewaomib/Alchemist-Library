import { api } from '../lib/apiClient';
import {
  getProgressStorageKey,
  getThemeStorageKey,
  normalizeReaderTheme,
  normalizeReadingProgress
} from './readingProgressCore';

function readStoredValue(key) {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStoredValue(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage blocked or full: the reader still works without persistence.
  }
}

export function loadReaderTheme(userId) {
  return normalizeReaderTheme(readStoredValue(getThemeStorageKey(userId)));
}

export function saveReaderTheme(userId, theme) {
  writeStoredValue(getThemeStorageKey(userId), normalizeReaderTheme(theme));
}

export function loadLocalReadingProgress(userId, bookId, source = 'text', totalChapters) {
  const raw = readStoredValue(getProgressStorageKey(userId, bookId, source));
  if (!raw) return null;

  try {
    return normalizeReadingProgress(JSON.parse(raw), totalChapters);
  } catch {
    return null;
  }
}

export function saveLocalReadingProgress(userId, bookId, progress) {
  const normalized = normalizeReadingProgress(progress);
  if (!normalized) return;
  writeStoredValue(
    getProgressStorageKey(userId, bookId, normalized.source),
    JSON.stringify(normalized)
  );
}

function mapRemoteRow(row, source, totalChapters) {
  if (!row) return null;
  return normalizeReadingProgress({
    version: row.version || 1,
    source: row.source || source,
    chapterIndex: row.chapter_index,
    chapterTitle: row.chapter_title || '',
    pageNumber: row.page_number,
    scrollRatio: row.scroll_ratio,
    progressPercent: row.progress_percent,
    updatedAt: row.updated_at
  }, totalChapters);
}

export async function fetchRemoteReadingProgress(userId, bookId, source = 'text', totalChapters) {
  if (!userId || userId === 'guest' || !bookId) return null;

  try {
    const data = await api.getBookmark(bookId, source);
    if (!data?.bookmark) return null;
    const bm = data.bookmark;
    return normalizeReadingProgress(
      {
        source: bm.source || source,
        chapterIndex: bm.chapterIndex ?? 0,
        chapterTitle: bm.chapterTitle || '',
        pageNumber: bm.lastPageRead ?? bm.halaman_terakhir ?? 1,
        totalChapters: bm.totalChapters ?? totalChapters ?? 1,
        scrollRatio: bm.scrollRatio ?? 0,
        progressPercent: bm.progressPercent ?? 0,
        updatedAt: bm.updatedAt || new Date().toISOString()
      },
      totalChapters
    );
  } catch (error) {
    // 401 saat belum login dianggap normal (mode tamu lokal)
    if (error?.status !== 401) {
      console.warn('Reading progress fetch skipped:', error?.message || error);
    }
    return null;
  }
}

export async function pushRemoteReadingProgress(userId, bookId, progress) {
  if (!userId || userId === 'guest' || !bookId) return false;

  const normalized = normalizeReadingProgress(progress);
  if (!normalized) return false;

  try {
    await api.saveBookmark({
      bookId,
      source: normalized.source,
      halaman_terakhir: normalized.pageNumber || normalized.chapterIndex + 1,
      chapterIndex: normalized.chapterIndex,
      chapterTitle: normalized.chapterTitle || '',
      totalChapters: normalized.totalChapters || 1,
      scrollRatio: normalized.scrollRatio,
      progressPercent: normalized.progressPercent
    });
    return true;
  } catch (error) {
    if (error?.status !== 401) {
      console.warn('Reading progress sync skipped:', error?.message || error);
    }
    return false;
  }
}
