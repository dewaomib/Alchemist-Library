import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildJumpRiffleSequence,
  clampPageNumber,
  computeFlipbookPageDimensions,
  isPageInLazyWindow
} from './flipbookUtils.js';
import { formatGoogleDriveDirectUrl } from './urlHelpers.js';
import { createPdfProgress, normalizeReadingProgress } from './readingProgressCore.js';

test('converts Google Drive URLs to direct download URLs', () => {
  assert.equal(
    formatGoogleDriveDirectUrl('https://drive.google.com/file/d/1AbCdEfGhIjKlMn/view?usp=sharing'),
    'https://drive.google.com/uc?export=download&id=1AbCdEfGhIjKlMn&confirm=t'
  );
  assert.equal(
    formatGoogleDriveDirectUrl('https://example.com/books/sample.pdf'),
    'https://example.com/books/sample.pdf'
  );
});

test('lazy window only includes current spread +/- 3 pages and optional jump target', () => {
  // Desktop 2-page spread open at page 11-12
  assert.equal(isPageInLazyWindow(7, 11, 3, true), false);
  assert.equal(isPageInLazyWindow(8, 11, 3, true), true);
  assert.equal(isPageInLazyWindow(11, 11, 3, true), true);
  assert.equal(isPageInLazyWindow(12, 11, 3, true), true);
  assert.equal(isPageInLazyWindow(15, 11, 3, true), true);
  assert.equal(isPageInLazyWindow(16, 11, 3, true), false);

  // Pre-renders destination pages when jumping to page 200
  assert.equal(isPageInLazyWindow(200, 11, 3, true, 200), true);
  assert.equal(isPageInLazyWindow(199, 11, 3, true, 200), true);
  assert.equal(isPageInLazyWindow(150, 11, 3, true, 200), false);
});

test('builds 4 to 5 intermediate riffle steps before landing on distant target page', () => {
  const forward = buildJumpRiffleSequence(12, 200, 248, true);
  assert.equal(forward.at(-1), 200);
  // 5 intermediate pages + final target = 6 steps
  assert.ok(forward.length >= 5 && forward.length <= 6);
  for (let i = 1; i < forward.length; i += 1) {
    assert.ok(forward[i] > forward[i - 1], 'forward riffle must strictly increase');
  }

  const backward = buildJumpRiffleSequence(200, 12, 248, true);
  assert.equal(backward.at(-1), 12);
  assert.ok(backward.length >= 5 && backward.length <= 6);
  for (let i = 1; i < backward.length; i += 1) {
    assert.ok(backward[i] < backward[i - 1], 'backward riffle must strictly decrease');
  }
});

test('clamps jump target and handles same-page no-op', () => {
  assert.equal(clampPageNumber(999, 248), 248);
  assert.equal(clampPageNumber(-5, 248), 1);
  assert.deepEqual(buildJumpRiffleSequence(12, 12, 248, true), []);
});

test('computes responsive page dimensions for desktop 2-page spread and mobile 1-page', () => {
  const desktop = computeFlipbookPageDimensions(1400, 800, 0.707, false);
  assert.ok(desktop.pageWidth * 2 <= 1400);
  assert.ok(desktop.pageHeight <= 800);

  const mobile = computeFlipbookPageDimensions(390, 720, 0.707, true);
  assert.ok(mobile.pageWidth <= 390);
  assert.ok(mobile.pageHeight <= 720);
});

test('createPdfProgress and normalizeReadingProgress preserve exact PDF page numbers', () => {
  const progress = createPdfProgress({ pageNumber: 42, totalPages: 248 });
  assert.equal(progress.source, 'pdf');
  assert.equal(progress.pageNumber, 42);
  assert.equal(progress.chapterIndex, 41);
  assert.equal(progress.totalChapters, 248);
  assert.equal(progress.progressPercent, Math.round((42 / 248) * 100));

  const restored = normalizeReadingProgress(progress, 248);
  assert.equal(restored.pageNumber, 42);
  assert.equal(restored.chapterIndex, 41);
  assert.equal(restored.totalChapters, 248);
});
