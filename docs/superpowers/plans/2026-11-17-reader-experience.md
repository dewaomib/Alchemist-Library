# Reader Experience Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persisted Obsidian/Parchment theme toggle, Indonesian Web Speech narration, and automatic reading-progress bookmarks to the student reader, with LocalStorage as the reliable store and Supabase sync that activates when configured.

**Architecture:** Pure helpers own validation/storage-key logic and speech chunking; a React hook owns `speechSynthesis`; the reader and PDF viewer consume shared theme tokens and progress helpers. LocalStorage is written first, Supabase is best-effort and error-checked. The PDF viewer remains an iframe: theme/anti-glare and "last opened" only.

**Tech Stack:** React 19, Vite 6, Tailwind 3, Supabase JS, Web Speech API, Node 22 built-in test runner. No new npm dependencies.

**Spec:** `docs/superpowers/specs/2026-11-17-reader-experience-design.md`

## Global Constraints

- **No new npm dependencies** (runtime or dev). Tests use Node's built-in `node:test`.
- **Do not create Git commits.** The workspace already contains unrelated uncommitted user changes; never stage or commit them.
- **Do not use PDF.js or replace the PDF iframe.** PDF page-number/TTS features are out of scope.
- Default reader theme is `obsidian`; Parchment is exactly `#F4ECD8` background and `#2C241B` text.
- LocalStorage prefix and keys are exactly:
  - `alchemist-archive:v2:reader-theme:<userId>`
  - `alchemist-archive:v2:reading-progress:<userId>:<bookId>:<source>` where `<source>` is `text` or `pdf`
- All React hooks in `EGrimoireReaderModal` must run before any early `return null`.
- Every Supabase call must inspect and log `{ error }`; never rely on thrown exceptions.
- Supabase demo identity is `currentUser.id`; never invent a UUID or `auth.uid()`.
- PDF viewer must not claim a page number it cannot read.
- Verification commands: `node --test <test files>` and `npm run build`. There is no lint script.

## Review Focus

- **Cross-user/cross-mode progress leakage:** switching from `user-siswa` to `user-guru`, or reading a book in text vs PDF mode, must not restore the other user's/mode's position. Task 1 tests key isolation; Tasks 6 and 8 use source-aware keys.
- **Misleading resume toast:** reopening a book at chapter 1, scroll 0 must not say "Melanjutkan". Task 1 tests `shouldShowResume`; Task 6 branches on it.
- **Ghost narration:** speech must stop on chapter change, book change, and modal close. Task 5 adds stop effects; Task 11 manually verifies.
- **Corrupt or blocked LocalStorage:** invalid JSON/blocked storage must never crash the reader. Task 1 tests normalization; Task 2 wraps all storage access in `try/catch`.
- **Cloud progress overwriting active reading:** a newer remote row must not jump the reader after the student has navigated. Task 1 tests `shouldApplyRemoteProgress`; Task 7 passes the navigation flag.

---

### Task 1: Pure Progress Core + Tests

**Files:**
- Create: `src/utils/readingProgressCore.js`
- Test: `src/utils/readingProgressCore.test.js`

**Interfaces:**
- Produces:
  - `DEFAULT_READER_THEME = 'obsidian'`
  - `normalizeReaderTheme(value: unknown): 'obsidian' | 'parchment'`
  - `getUserKey(user: object | null | undefined): string`
  - `getBookKey(book: object | null | undefined): string`
  - `getThemeStorageKey(userId: string): string`
  - `getProgressStorageKey(userId: string, bookId: string, source?: 'text' | 'pdf'): string`
  - `clampChapterIndex(index: number, totalChapters: number): number`
  - `clampScrollRatio(value: unknown): number`
  - `computeProgressPercent(chapterIndex: number, totalChapters: number): number`
  - `normalizeReadingProgress(raw: unknown, totalChapters?: number): ReadingProgress | null`
  - `createTextProgress(input: { chapterIndex: number, chapterTitle?: string, scrollRatio?: number, totalChapters: number, updatedAt?: string }): ReadingProgress`
  - `createPdfProgress(updatedAt?: string): ReadingProgress`
  - `shouldShowResume(progress: ReadingProgress | null): boolean`
  - `shouldApplyRemoteProgress(local: ReadingProgress | null, remote: ReadingProgress | null, hasUserNavigated: boolean): boolean`
  - `formatResumeMessage(progress: ReadingProgress, totalChapters: number): string`
- `ReadingProgress` shape:
  ```js
  {
    version: 1,
    source: 'text' | 'pdf',
    chapterIndex: number,
    chapterTitle: string,
    pageNumber: number | null,
    scrollRatio: number,
    progressPercent: number,
    updatedAt: string
  }
  ```

- [ ] **Step 1: Write the failing test file**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTextProgress,
  formatResumeMessage,
  getProgressStorageKey,
  getUserKey,
  normalizeReaderTheme,
  normalizeReadingProgress,
  shouldApplyRemoteProgress,
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test src/utils/readingProgressCore.test.js`
Expected: FAIL because `readingProgressCore.js` does not exist.

- [ ] **Step 3: Implement `src/utils/readingProgressCore.js`**

Implement the exported functions above. Required behavior:

- `normalizeReaderTheme`: accept only `obsidian` / `parchment`; map `midnight` to `obsidian`; everything else returns `obsidian`.
- `getUserKey`: `user.id`, then `user.guildId`, then `user.email`, then `'guest'`; trim and lowercase.
- `getBookKey`: `book.id`, then `book.kodeBuku`, then a title slug (`lowercase`, non-alphanumeric to `-`, trim `-`), then `'unknown-book'`.
- `getProgressStorageKey`: `alchemist-archive:v2:reading-progress:<userId>:<bookId>:<source>`; `source` defaults to `text` and is coerced to `pdf` only when exactly `pdf`.
- `clampChapterIndex`: integer, minimum 0, maximum `max(0, totalChapters - 1)`.
- `clampScrollRatio`: finite number clamped to `0..1`, otherwise `0`.
- `computeProgressPercent`: `totalChapters > 0 ? round(((clampedIndex + 1) / totalChapters) * 100) : 0`, clamped `0..100`.
- `normalizeReadingProgress`: return `null` for non-objects or a non-numeric `chapterIndex`; normalize all fields; for `pdf` force `chapterIndex 0`, `pageNumber null`, `scrollRatio 0`, `progressPercent 0`; for `text` derive `pageNumber = chapterIndex + 1` and recompute percent when `totalChapters` is provided.
- `createTextProgress`: clamp inputs, default `updatedAt` to `new Date().toISOString()`.
- `createPdfProgress`: return the PDF shape with the supplied/default timestamp.
- `shouldShowResume`: true only when progress exists and (`chapterIndex > 0` or `scrollRatio > 0.05`).
- `shouldApplyRemoteProgress`: false when `hasUserNavigated` is true or remote is null; true when local is null; otherwise compare `Date.parse(remote.updatedAt) > Date.parse(local.updatedAt)`.
- `formatResumeMessage`: `Melanjutkan dari halaman <pageNumber> dari <totalChapters> — <chapterTitle>`; omit the em-dash title when empty.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test src/utils/readingProgressCore.test.js`
Expected: all tests PASS.

---

### Task 2: LocalStorage + Supabase Helpers

**Files:**
- Create: `src/utils/readingProgress.js`
- Consumes: `readingProgressCore.js` exports from Task 1; `supabase`, `isSupabaseConfigured` from `src/lib/supabaseClient.js`.

**Interfaces:**
- Produces:
  - `loadReaderTheme(userId: string): 'obsidian' | 'parchment'`
  - `saveReaderTheme(userId: string, theme: unknown): void`
  - `loadLocalReadingProgress(userId: string, bookId: string, source?: 'text' | 'pdf', totalChapters?: number): ReadingProgress | null`
  - `saveLocalReadingProgress(userId: string, bookId: string, progress: ReadingProgress): void` (source comes from `progress.source`)
  - `fetchRemoteReadingProgress(userId: string, bookId: string, source?: 'text' | 'pdf', totalChapters?: number): Promise<ReadingProgress | null>`
  - `pushRemoteReadingProgress(userId: string, bookId: string, progress: ReadingProgress): Promise<boolean>` (source comes from `progress.source`)

- [ ] **Step 1: Implement safe LocalStorage helpers**

Use `typeof window === 'undefined'` guards and `try/catch` around every `localStorage` call. Store the theme as a raw normalized string and progress as JSON. Read/write progress through `getProgressStorageKey(userId, bookId, source)` and `normalizeReadingProgress` so corrupt values return `null`.

- [ ] **Step 2: Implement the Supabase read**

`fetchRemoteReadingProgress`:

```js
if (!isSupabaseConfigured || !supabase) return null;
const { data, error } = await supabase
  .from('reading_progress')
  .select('*')
  .eq('user_id', userId)
  .eq('book_id', bookId)
  .eq('source', source)
  .maybeSingle();
if (error) {
  console.warn('Reading progress fetch skipped:', error.message);
  return null;
}
```

Map snake_case columns to the `ReadingProgress` shape (`chapter_index` → `chapterIndex`, etc.) and pass through `normalizeReadingProgress`.

- [ ] **Step 3: Implement the Supabase write**

`pushRemoteReadingProgress` upserts one row with `onConflict: 'user_id,book_id,source'`, maps camelCase to snake_case, and returns `false` on `{ error }` or exception. Log only `error.message`; never throw.

- [ ] **Step 4: Syntax-check the module**

Run: `node --check src/utils/readingProgress.js`
Expected: exit code 0, no output.

---

### Task 3: Speech Chunking + Narrator Hook

**Files:**
- Create: `src/utils/speechChunks.js`
- Test: `src/utils/speechChunks.test.js`
- Create: `src/hooks/useSpeechNarrator.js`

**Interfaces:**
- Produces:
  - `splitIntoSpeechChunks(text: string, maxLength?: number): string[]`
  - `useSpeechNarrator(): { status, isSupported, voiceLabel, play, pause, resume, stop }`
  - `status` is `'idle' | 'playing' | 'paused' | 'unsupported'`.

- [ ] **Step 1: Write the failing chunking tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { splitIntoSpeechChunks } from './speechChunks.js';

test('returns an empty array for blank text', () => {
  assert.deepEqual(splitIntoSpeechChunks('   \n  '), []);
});

test('collapses whitespace and keeps short sentences together', () => {
  assert.deepEqual(
    splitIntoSpeechChunks('Halo.   Apa kabar?\nBaik!', 200),
    ['Halo. Apa kabar? Baik!']
  );
});

test('splits long text into chunks no longer than the limit', () => {
  const text = 'Satu dua tiga empat lima enam tujuh delapan sembilan sepuluh. '.repeat(8);
  const chunks = splitIntoSpeechChunks(text, 60);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.length <= 60));
});

test('splits an overlong sentence without dropping words', () => {
  const words = Array.from({ length: 40 }, (_, index) => `kata${index}`).join(' ');
  const chunks = splitIntoSpeechChunks(words, 40);
  assert.deepEqual(chunks.join(' '), words);
  assert.ok(chunks.every((chunk) => chunk.length <= 40));
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test src/utils/speechChunks.test.js`
Expected: FAIL because `speechChunks.js` does not exist.

- [ ] **Step 3: Implement `splitIntoSpeechChunks`**

Algorithm:

1. Normalize `String(text || '').replace(/\s+/g, ' ').trim()`; return `[]` when empty.
2. Split into sentences with `const sentences = normalized.match(/[^.!?…]+[.!?…]+["”']?|[^.!?…]+$/g) || [normalized];`
3. For each sentence longer than `maxLength`, split on spaces into parts no longer than `maxLength`; if a single word exceeds the limit, hard-slice it.
4. Greedily accumulate parts while `current.length + 1 + part.length <= maxLength`; flush before exceeding.
5. Return non-empty chunks.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test src/utils/speechChunks.test.js`
Expected: all tests PASS.

- [ ] **Step 5: Implement `src/hooks/useSpeechNarrator.js`**

Requirements:

- Import `useCallback`, `useEffect`, `useRef`, `useState` from React and `splitIntoSpeechChunks`.
- `isSupported` is true only when `typeof window !== 'undefined' && 'speechSynthesis' in window`.
- Voice selection: prefer `lang.toLowerCase() === 'id-id'`, then `startsWith('id')`; otherwise `null` and set `utterance.lang = 'id-ID'`.
- Listen to `voiceschanged` and clean up the listener.
- `play(text)`: cancel any current speech, build chunks with max 200, store queue/index in refs, set status `playing`, and start the first utterance after a 50 ms `setTimeout` (Chrome needs a tick after `cancel()`).
- `speakNext`: on `onend`, advance the index and speak the next chunk; set status `idle` when the queue is exhausted. On `onerror`, set status `idle` unless the error is `interrupted`/`canceled`.
- `pause`: only when playing and `speechSynthesis.speaking`; call `pause()` and set status `paused`.
- `resume`: only when paused; call `resume()` and set status `playing`.
- `stop`: clear the queue/index, call `speechSynthesis.cancel()`, set status `idle`.
- Cleanup on unmount cancels speech and clears timers/listeners.
- `voiceLabel` is the selected voice name or `'Suara bawaan'`.

- [ ] **Step 6: Syntax-check the hook**

Run: `node --check src/hooks/useSpeechNarrator.js`
Expected: exit code 0, no output.

---

### Task 4: Shared Theme Tokens + Reader Theme

**Files:**
- Create: `src/utils/readerThemes.js`
- Modify: `src/components/EGrimoireReaderModal.jsx`

**Interfaces:**
- Consumes: `getUserKey` from Task 1; `loadReaderTheme`, `saveReaderTheme` from Task 2.
- Produces:
  - `READER_THEME_TOKENS` keyed by `obsidian` / `parchment`
  - `getReaderThemeTokens(theme: unknown): ReaderThemeTokens`
- Token keys: `container`, `surface`, `text`, `muted`, `border`, `accent`, `accentSoft`, `dot`, `pdfFilter`, `iframeBackground`.

- [ ] **Step 1: Create the token module**

Use these exact values:

```js
export const READER_THEME_TOKENS = {
  obsidian: {
    container: '#14110F',
    surface: '#1A1613',
    text: '#F4E8C1',
    muted: '#A89F91',
    border: 'rgba(212, 175, 55, 0.25)',
    accent: '#D4AF37',
    accentSoft: 'rgba(212, 175, 55, 0.1)',
    dot: 'rgba(212, 175, 55, 0.04)',
    pdfFilter: 'invert(0.92) hue-rotate(180deg) brightness(0.86) contrast(0.94)',
    iframeBackground: '#0B0A08'
  },
  parchment: {
    container: '#F4ECD8',
    surface: '#EDE2C8',
    text: '#2C241B',
    muted: '#6B5B45',
    border: 'rgba(122, 92, 47, 0.28)',
    accent: '#8C6700',
    accentSoft: 'rgba(212, 175, 55, 0.2)',
    dot: 'rgba(122, 92, 47, 0.12)',
    pdfFilter: 'sepia(0.22) brightness(0.98) contrast(0.97)',
    iframeBackground: '#F4ECD8'
  }
};
```

`getReaderThemeTokens` falls back to `obsidian` for unknown values.

- [ ] **Step 2: Wire theme state in the reader**

- Import `useEffect`, `useRef`, `useCallback` from React; import `Sun`, `Moon` (already present), the token helpers, `getUserKey`, and `loadReaderTheme` / `saveReaderTheme`.
- Add prop `showToast`.
- Derive `const userId = getUserKey(currentUser);`.
- Initialize `readerTheme` with `useState(() => loadReaderTheme(userId))`.
- Add an effect that reloads the theme when `userId` changes.
- Replace the old `'parchment' | 'midnight'` logic with `'obsidian' | 'parchment'`.
- Toggle handler computes the next theme, sets state, and calls `saveReaderTheme(userId, next)`.
- Button label: when current is `obsidian`, show `Sun` + `Warm Parchment`; when current is `parchment`, show `Moon` + `Obsidian`. Hide the text below `md`. Add an `aria-label` and a title that names the current theme.
- Apply `tokens.container`, `tokens.surface`, `tokens.text`, `tokens.border`, `tokens.accent`, `tokens.accentSoft`, and `tokens.dot` to the existing container, header, footer, chapter divider, badge, and dotted background.
- Keep the completion banner readable in both themes: parchment `#EFE2C6`, obsidian `rgba(18, 16, 14, 0.85)`.

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: `vite build` succeeds with no errors.

- [ ] **Step 4: Manual theme check**

With the dev server running, open any digital book:
- Default is dark Obsidian.
- Toggle shows Warm Parchment with `#F4ECD8` background and dark text.
- Refresh the page and reopen; the last theme is retained.
- On a 360 px viewport, the header controls do not overflow.

---

### Task 5: Narrator Controls in the Reader

**Files:**
- Modify: `src/components/EGrimoireReaderModal.jsx`

**Interfaces:**
- Consumes: `useSpeechNarrator()` from Task 3.

- [ ] **Step 1: Call the hook before the early return**

Add:

```js
const { status: speechStatus, isSupported, voiceLabel, play, pause, resume, stop } = useSpeechNarrator();
const narrationText = useMemo(
  () => [currentChapter?.title, currentChapter?.content].filter(Boolean).join('. '),
  [currentChapter]
);
```

All hook calls must sit above `if (!isOpen || !book) return null;`. Move the `currentChapter` declaration (`chapters[currentPageIndex] || chapters[0] || null`) above that early return and remove the later duplicate. Keep the rest of the derived values where they are.

- [ ] **Step 2: Add stop effects and handlers**

- On `currentPageIndex` change, `book?.id` change, and `isOpen === false`, call `stop()`.
- `handleNarrate`: if unsupported return; if `speechStatus === 'playing'` call `pause()`; if `'paused'` call `resume()`; otherwise call `play(narrationText)`.
- `handleStopNarration`: call `stop()`.
- When closing the reader, call `stop()` before `onClose()`.

- [ ] **Step 3: Add responsive toolbar controls**

Place the narrator group after the font-size control and before fullscreen:

- Idle: one button with `Play` (or `Headphones`) icon and label **"Dengarkan Bab Ini"**.
- Playing: button with `Pause` icon and label **"Jeda"**, plus a `Square` stop button.
- Paused: button with `Play` icon and label **"Lanjutkan"**, plus the stop button.
- Labels use `hidden lg:inline`; every icon button has `aria-label`.
- When `!isSupported`, render a disabled button with title "Narator tidak didukung peramban ini".
- Add a small `aria-live="polite"` status span (hidden below `lg`) showing `Membacakan bab X dari Y` while playing/paused, and `voiceLabel` in the title attribute.

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: success.

- [ ] **Step 5: Manual TTS check**

Open a book with chapters:
- "Dengarkan Bab Ini" starts Indonesian narration.
- Pause stops speech; "Lanjutkan" resumes.
- Stop cancels.
- Pressing Next/Prev or closing the modal stops narration immediately.
- On a browser without `speechSynthesis`, controls are disabled and the reader still works.

---

### Task 6: Local Bookmark Save + Restore

**Files:**
- Modify: `src/components/EGrimoireReaderModal.jsx`
- Consumes: Task 1 core helpers and Task 2 local storage helpers.

**Interfaces:**
- Uses `loadLocalReadingProgress`, `saveLocalReadingProgress`, `createTextProgress`, `formatResumeMessage`, `shouldShowResume`.

- [ ] **Step 1: Add refs and derived identity**

Inside the component, before the early return:

```js
const mainRef = useRef(null);
const pendingScrollRef = useRef(null);
const userNavigatedRef = useRef(false);
const resumeToastShownRef = useRef(false);
const saveTimerRef = useRef(null);
const showToastRef = useRef(showToast);
showToastRef.current = showToast;

const userId = getUserKey(currentUser);
const bookId = getBookKey(book);
const totalPages = chapters.length;
```

`totalPages` must be declared exactly once before the early return; remove the existing later declaration. Use `mainRef` on the `<main>` scroll container.

- [ ] **Step 2: Implement local `persistProgress(chapterIndex, scrollRatio)`**

Use `useCallback`:

```js
const persistProgress = useCallback((chapterIndex, scrollRatio) => {
  if (!book) return;
  const progress = createTextProgress({
    chapterIndex,
    chapterTitle: chapters[chapterIndex]?.title || '',
    scrollRatio,
    totalChapters: chapters.length
  });
  saveLocalReadingProgress(userId, bookId, progress);
}, [book, bookId, chapters, userId]);
```

Task 7 extends this function with the remote push; this task is local-only.

- [ ] **Step 3: Restore on open/book/user change**

Add an effect keyed by `[isOpen, bookId, userId, chapters.length]`:

- If closed or no book, return.
- Reset `hasClaimedXp` to `false`, `isFullscreen` to `false`, `userNavigatedRef` to `false`, `resumeToastShownRef` to `false`.
- Load local progress with `loadLocalReadingProgress(userId, bookId, 'text', chapters.length)`.
- If found: clamp the chapter index, set it, set `pendingScrollRef.current` to `scrollRatio`, and if `shouldShowResume(progress)` call `showToastRef.current?.('Melanjutkan Bacaan', formatResumeMessage(progress, chapters.length), 'gold')` and set `resumeToastShownRef` to `true`.
- If not found: set index 0 and `pendingScrollRef.current = 0`.

- [ ] **Step 4: Restore the scroll position after render**

Add an effect keyed by `[currentPageIndex, isOpen, bookId]`:

- Read `mainRef.current`.
- Take `pendingScrollRef.current`; reset it to `null`.
- In `requestAnimationFrame`, set `scrollTop = ratio * max(0, scrollHeight - clientHeight)`, or `0` when ratio is null.

- [ ] **Step 5: Save on navigation, scroll, close, and page hide**

- `handleNextPage` / `handlePrevPage`: set `userNavigatedRef.current = true`, set `pendingScrollRef.current = 0`, update the index, and call `persistProgress(nextIndex, 0)`.
- `handleScroll` on `<main>`: set `userNavigatedRef.current = true`; clear the previous timer; debounce 400 ms; save the current index with the measured `scrollRatio` (local only).
- `handleClose`: compute the current scroll ratio, call `persistProgress(currentPageIndex, ratio)`, call `stop()`, then `onClose()`.
- Add a `keydown` listener: Escape exits fullscreen if active, otherwise calls `handleClose`.
- Add `pagehide` and `visibilitychange` listeners that save local progress when the page is hidden; clean them up.
- Clear `saveTimerRef` and the scroll debounce on unmount.
- Replace the close button's `onClick` with `handleClose`.
- On `handleCompleteReading`, persist the last chapter before claiming XP.

- [ ] **Step 6: Guard empty chapters and reset state on book change**

- Set `currentChapter` to `chapters[currentPageIndex] || chapters[0] || null`.
- After the early return, if `!currentChapter`, render the modal shell with a centered message "Naskah digital belum tersedia untuk buku ini."
- Ensure `hasClaimedXp` and `currentPageIndex` reset when `bookId` changes.

- [ ] **Step 7: Verify the build**

Run: `npm run build`
Expected: success.

- [ ] **Step 8: Manual bookmark check**

- Open a book, go to chapter 2, close, reopen: toast says "Melanjutkan dari halaman 2 dari 3", and chapter 2 is shown.
- Scroll within chapter 2, close, reopen: the scroll position is approximately restored.
- Open a fresh book: no resume toast at chapter 1.
- Switch roles and reopen: the other role's progress is not shown.

---

### Task 7: Supabase Remote Sync + Merge

**Files:**
- Modify: `src/components/EGrimoireReaderModal.jsx`
- Consumes: `fetchRemoteReadingProgress`, `pushRemoteReadingProgress` from Task 2; `shouldApplyRemoteProgress` from Task 1.

**Interfaces:**
- Uses `isSupabaseConfigured` only indirectly through the helper functions.

- [ ] **Step 1: Push on chapter changes and close**

- Import `fetchRemoteReadingProgress`, `pushRemoteReadingProgress`, and `shouldApplyRemoteProgress`.
- Extend `persistProgress` to `(chapterIndex, scrollRatio, syncRemote = false)`: after `saveLocalReadingProgress`, call `void pushRemoteReadingProgress(userId, bookId, progress)` when `syncRemote` is true.
- Call `persistProgress` with `syncRemote = true` from Next/Prev, `handleClose`, and `handleCompleteReading`.
- Keep scroll saves local-only.

- [ ] **Step 2: Fetch and merge remote progress on open**

Add an effect keyed by `[isOpen, bookId, userId, chapters.length]`:

- Return early when closed or no book.
- Set `userNavigatedRef.current = false`.
- Call `fetchRemoteReadingProgress(userId, bookId, 'text', chapters.length)`.
- On resolve, if the effect is cancelled or `userNavigatedRef.current` is true, do nothing.
- Load the current local progress and call `shouldApplyRemoteProgress(local, remote, userNavigatedRef.current)`.
- If true: set `pendingScrollRef.current = remote.scrollRatio`, set the chapter index, and show the resume toast only when `resumeToastShownRef.current` is false and `shouldShowResume(remote)` is true.
- Clean up with a `cancelled` flag.

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: success.

- [ ] **Step 4: Verify offline behavior**

Supabase is currently unconfigured:
- Reader works normally; no console errors from progress sync.
- LocalStorage still saves and restores.
- Check DevTools Application → Local Storage for the two exact keys.

---

### Task 8: PDF Viewer Theme + Last Opened

**Files:**
- Modify: `src/components/FullScreenPdfViewerModal.jsx`
- Consumes: `getReaderThemeTokens` from Task 4; `loadReaderTheme`, `saveReaderTheme`, `loadLocalReadingProgress`, `saveLocalReadingProgress`, `createPdfProgress`, `pushRemoteReadingProgress`, `fetchRemoteReadingProgress` from Task 2; `getUserKey`, `getBookKey` from Task 1.

**Interfaces:**
- New prop: `currentUser`.
- Consumes `shouldApplyRemoteProgress` from Task 1.

- [ ] **Step 1: Add theme state and controls**

- Initialize `readerTheme` from `loadReaderTheme(getUserKey(currentUser))`; reload when the user changes.
- Add a theme toggle button in the header near reload/fullscreen. Use `Sun`/`Moon`; hide the label below `sm`.
- Toggle saves the preference with `saveReaderTheme`.
- Apply `tokens.surface`, `tokens.text`, `tokens.muted`, `tokens.border`, and `tokens.container` to the header, notice bar, and viewer background.
- Set the iframe wrapper background to `tokens.iframeBackground` and the iframe style to `filter: tokens.pdfFilter`.
- Keep the existing fullscreen, reload, external-open, download, and close behavior unchanged.

- [ ] **Step 2: Add "last opened" read/write**

- On open, load local progress with `loadLocalReadingProgress(userId, bookId, 'pdf')`; if a progress object exists, store it in `lastOpened` state and render `Terakhir dibuka: <toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }>` in the notice bar.
- On open, also fetch remote progress with `fetchRemoteReadingProgress(userId, bookId, 'pdf')` and call `shouldApplyRemoteProgress(local, remote, false)`; when true, replace `lastOpened` with the remote value.
- Add a `handleClose` wrapper: build `createPdfProgress()`, save local, push remote best-effort, then call `onClose()`.
- Route the header close button and Escape handler through `handleClose`; keep Escape's fullscreen-exit behavior first.
- Add `pagehide`/`visibilitychange` local save handlers that use `createPdfProgress()`.
- Do not display or infer a page number.

- [ ] **Step 3: Update the notice text**

Use a subtle line such as:

> Tema berfungsi sebagai filter anti-silau. Narator dan nomor halaman PDF belum tersedia untuk tautan eksternal.

Keep it single-line and truncating on mobile; do not add a fake TTS button.

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: success.

- [ ] **Step 5: Manual PDF check**

Open a PDF book:
- Toggle Obsidian/Parchment; the iframe tint changes and the header follows the theme.
- Reopen the PDF; the previous close time appears as "Terakhir dibuka".
- No page number or narrator claim is shown.

---

### Task 9: App Wiring + Toast Layer

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: new props from Tasks 4–8.

- [ ] **Step 1: Pass the reader props**

At the `EGrimoireReaderModal` mount, add:

```jsx
showToast={showToast}
```

Keep `book`, `isOpen`, `onClose`, `onFinishReading`, and `currentUser`.

- [ ] **Step 2: Pass the PDF user**

At the `FullScreenPdfViewerModal` mount, add:

```jsx
currentUser={currentUser}
```

- [ ] **Step 3: Raise the toast above modals**

Change the toast container's `z-50` to `z-[60]`. Do not change its position or animation.

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: success.

---

### Task 10: Supabase Schema, Migration, README

**Files:**
- Modify: `supabase/schema.sql`
- Create: `supabase/reading_progress.sql`
- Modify: `README.md`

- [ ] **Step 1: Append the table and policy to `schema.sql`**

Add an idempotent section:

```sql
-- ----------------------------------------------------------------------------
-- 6. READING PROGRESS TABLE (Bookmark per user + book)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reading_progress (
  user_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'text' CHECK (source IN ('text', 'pdf')),
  chapter_index INTEGER NOT NULL DEFAULT 0 CHECK (chapter_index >= 0),
  chapter_title TEXT,
  page_number INTEGER CHECK (page_number IS NULL OR page_number >= 0),
  scroll_ratio NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (scroll_ratio >= 0 AND scroll_ratio <= 1),
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, book_id, source)
);

ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public demo read/write reading_progress" ON public.reading_progress;
CREATE POLICY "Public demo read/write reading_progress"
  ON public.reading_progress FOR ALL
  USING (true) WITH CHECK (true);
```

Add a comment above the policy: demo-only, replace with auth-scoped policy before real deployment.

- [ ] **Step 2: Create the standalone migration**

Copy the same idempotent SQL into `supabase/reading_progress.sql` with a header comment:

```sql
-- Run this file if the database was created before the reading_progress table existed.
```

- [ ] **Step 3: Document the features in README**

Add a short section covering:
- Obsidian/Parchment toggle and persistence.
- Narrator controls and the `id-ID` preference.
- Automatic bookmark + "Melanjutkan dari halaman X".
- PDF limitation: iframe links cannot expose pages/text; only theme filter and last-opened are supported.
- The Supabase table/script name.

- [ ] **Step 4: Review SQL for idempotency**

Confirm every statement can be re-run: `CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS` before `CREATE POLICY`, and no destructive `ALTER`.

---

### Task 11: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Run the pure tests**

Run:

```bash
node --test src/utils/readingProgressCore.test.js src/utils/speechChunks.test.js
```

Expected: all tests PASS.

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: `vite build` succeeds. The existing chunk-size warning is acceptable; no new errors.

- [ ] **Step 3: Review the diff**

Run: `git status --short` and `git diff --stat`.
Expected: only the planned files are touched. Do not stage or commit. Confirm no unrelated user file was overwritten.

- [ ] **Step 4: Manual end-to-end checklist**

In the running dev server at `http://localhost:5173/Alchemist-Library/`:

- Theme default is Obsidian; Parchment toggle persists after refresh.
- Narrator plays, pauses, resumes, stops, and stops on chapter change/close.
- Chapter bookmark restores with the toast; scroll is approximately restored.
- Fresh book shows no resume toast.
- Role switch does not leak progress.
- Text and PDF progress for the same book do not overwrite each other.
- PDF theme filter works; "Terakhir dibuka" appears; no fake page/TTS claims.
- Toolbar fits at 360 px and on desktop.

- [ ] **Step 5: Report evidence**

Report the exact test/build command output and any manual checks the user still needs to perform in their browser. Do not claim UI behavior was verified if it was not actually observed.
