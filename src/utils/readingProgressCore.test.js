import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTextProgress,
  formatResumeMessage,
  getProgressStorageKey,
  getUserKey,
  normalizeReaderTheme,
  normalizeReadingProgress,
  resolveRemoteRestoreAction,
  shouldApplyRemoteProgress,
  shouldMarkNavigationFromScroll,
  shouldShowResume
} from './readingProgressCore.js';

test('maps legacy midnight to obsidian and rejects unknown themes', () => {
  assert.equal(normalizeReaderTheme('midnight'), 'obsidian');
  assert.equal(normalizeReaderTheme('parchment'), 'parchment');
  assert.equal(normalizeReaderTheme('bogus'), 'obsidian');
});

test('builds a clamped progress object', () => {
  const progress = createTextProgress({
    chapterIndex: 99,
    chapterTitle: 'Bab III: Akhir',
    scrollRatio: 0.5,
    totalChapters: 3,
    updatedAt: '2026-11-17T00:00:00.000Z'
  });
  assert.equal(progress.chapterIndex, 2);
  assert.equal(progress.pageNumber, 3);
  assert.equal(progress.progressPercent, 100);
  assert.equal(progress.scrollRatio, 0.5);
  assert.equal(progress.updatedAt, '2026-11-17T00:00:00.000Z');
});

test('rejects corrupt progress', () => {
  assert.equal(normalizeReadingProgress(null), null);
  assert.equal(normalizeReadingProgress('nope'), null);
  assert.equal(normalizeReadingProgress({ chapterIndex: 'x' }), null);
});

test('remote progress wins only when newer and user has not navigated', () => {
  const local = createTextProgress({
    chapterIndex: 0, chapterTitle: 'A', scrollRatio: 0, totalChapters: 3,
    updatedAt: '2026-11-17T00:00:00.000Z'
  });
  const remote = createTextProgress({
    chapterIndex: 1, chapterTitle: 'B', scrollRatio: 0, totalChapters: 3,
    updatedAt: '2026-11-17T01:00:00.000Z'
  });
  assert.equal(shouldApplyRemoteProgress(local, remote, false), true);
  assert.equal(shouldApplyRemoteProgress(local, remote, true), false);
  assert.equal(shouldApplyRemoteProgress(remote, local, false), false);
  assert.equal(shouldApplyRemoteProgress(null, remote, false), true);
});

test('suppresses resume toast at the start of chapter one', () => {
  const start = createTextProgress({ chapterIndex: 0, chapterTitle: 'A', scrollRatio: 0, totalChapters: 3 });
  const scrolled = createTextProgress({ chapterIndex: 0, chapterTitle: 'A', scrollRatio: 0.2, totalChapters: 3 });
  assert.equal(shouldShowResume(start), false);
  assert.equal(shouldShowResume(scrolled), true);
});

test('formats the resume message', () => {
  const progress = createTextProgress({
    chapterIndex: 1, chapterTitle: 'Bab II: Portal', scrollRatio: 0, totalChapters: 3,
    updatedAt: '2026-11-17T00:00:00.000Z'
  });
  assert.equal(formatResumeMessage(progress, 3), 'Melanjutkan dari halaman 2 dari 3 — Bab II: Portal');
});

test('separates user keys and falls back to guest', () => {
  assert.equal(getUserKey({ id: 'user-siswa' }), 'user-siswa');
  assert.notEqual(getUserKey({ id: 'user-siswa' }), getUserKey({ id: 'user-guru' }));
  assert.equal(getUserKey(null), 'guest');
});

test('separates text and pdf progress keys', () => {
  assert.notEqual(
    getProgressStorageKey('user-siswa', 'book-1', 'text'),
    getProgressStorageKey('user-siswa', 'book-1', 'pdf')
  );
  assert.match(getProgressStorageKey('user-siswa', 'book-1', 'pdf'), /:pdf$/);
});

test('marks scroll as navigation except during programmatic restoration', () => {
  assert.equal(shouldMarkNavigationFromScroll(true), false);
  assert.equal(shouldMarkNavigationFromScroll(false), true);
  assert.equal(shouldMarkNavigationFromScroll(undefined), true);
});

test('scrolls inline when a remote bookmark is on the visible chapter', () => {
  assert.equal(resolveRemoteRestoreAction(1, 1), 'scroll');
  assert.equal(resolveRemoteRestoreAction(1, 2), 'chapter');
  assert.equal(resolveRemoteRestoreAction('1', 1), 'scroll');
});
