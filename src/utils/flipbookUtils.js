/**
 * Pure utilities for the Interactive 3D Flipbook PDF Reader.
 * No browser/DOM imports so these run directly under Node's test runner.
 */

export const FLIPBOOK_LAZY_RADIUS = 3;
export const FLIPBOOK_RIFFLE_STEP_MS = 80;

/**
 * Clamps a 1-based page number to [1, totalPages].
 */
export function clampPageNumber(page, totalPages) {
  const safeTotal = Number.isFinite(Number(totalPages)) && Number(totalPages) > 0
    ? Math.floor(Number(totalPages))
    : 1;
  const parsed = Number(page);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(safeTotal, Math.max(1, Math.floor(parsed)));
}

/**
 * Returns the 0-based spread index for a 1-based page number.
 * In desktop 2-page spread mode (showCover=false): pages 1-2 -> spread 0, 3-4 -> spread 1, etc.
 * In mobile 1-page mode: page 1 -> spread 0, page 2 -> spread 1, etc.
 */
export function getSpreadIndex(pageNumber, isSpread = true) {
  const idx = Math.max(0, Math.floor(Number(pageNumber) || 1) - 1);
  return isSpread ? Math.floor(idx / 2) : idx;
}

/**
 * Determines whether a 1-based pageNumber falls inside the lazy rendering window
 * (currently open page +/- 3 pages, plus optional pre-rendered jump target).
 */
export function isPageInLazyWindow(
  pageNumber,
  currentPage,
  windowRadius = FLIPBOOK_LAZY_RADIUS,
  isSpread = true,
  extraTargetPage = null
) {
  const p = Math.floor(Number(pageNumber) || 0);
  const cur = Math.floor(Number(currentPage) || 1);
  if (p < 1) return false;

  // In 2-page spread mode, the open spread covers [leftPage, rightPage]
  const spreadStart = isSpread ? (cur % 2 === 0 ? Math.max(1, cur - 1) : cur) : cur;
  const spreadEnd = isSpread ? spreadStart + 1 : cur;

  if (p >= spreadStart - windowRadius && p <= spreadEnd + windowRadius) {
    return true;
  }

  if (extraTargetPage != null && Number.isFinite(Number(extraTargetPage))) {
    const target = Math.floor(Number(extraTargetPage));
    if (p >= target - 2 && p <= target + 2) {
      return true;
    }
  }

  return false;
}

/**
 * Builds an ordered list of 1-based page numbers for the rapid page-flip ("kibasan cepat")
 * jump animation when jumping to a distant page.
 *
 * - Passes through 4 to 5 intermediate spreads spaced smoothly toward targetPage
 *   before landing cleanly on targetPage.
 * - Guarantees every consecutive step lands on a distinct spread so PageFlip animates
 *   an unmistakable curling sheet on each ~80ms tick.
 */
export function buildJumpRiffleSequence(
  currentPage,
  targetPage,
  totalPages,
  isSpread = true
) {
  const safeTotal = Math.max(1, Math.floor(Number(totalPages) || 1));
  const start = clampPageNumber(currentPage, safeTotal);
  const target = clampPageNumber(targetPage, safeTotal);

  const startSpread = getSpreadIndex(start, isSpread);
  const targetSpread = getSpreadIndex(target, isSpread);

  if (startSpread === targetSpread) {
    return start === target ? [] : [target];
  }

  const spreadDiff = Math.abs(targetSpread - startSpread);
  const direction = targetSpread > startSpread ? 1 : -1;

  // Immediate neighbor spread -> single smooth flip
  if (spreadDiff === 1) {
    return [target];
  }

  // Up to 5 total spreads away -> flip across each intermediate spread directly
  if (spreadDiff <= 5) {
    const seq = [];
    for (let step = 1; step < spreadDiff; step += 1) {
      const s = startSpread + direction * step;
      const pageNum = isSpread ? Math.min(safeTotal, s * 2 + 1) : s + 1;
      seq.push(pageNum);
    }
    seq.push(target);
    return seq;
  }

  // Distant jump (e.g. page 12 -> 200): pick 4 intermediate spreads + final landing (5 flips total)
  // Using 5 intermediate pages when distance is large (>= 40 spreads) for a lush riffle feel
  const intermediateCount = spreadDiff >= 40 ? 5 : 4;
  const chosenSpreads = new Set([startSpread, targetSpread]);
  const sequence = [];

  for (let i = 1; i <= intermediateCount; i += 1) {
    // Ease-out spacing so riffling feels brisk at the start and settles smoothly into target
    const fraction = i / (intermediateCount + 1);
    let candidateSpread = Math.round(startSpread + (targetSpread - startSpread) * fraction);

    // Ensure strict forward/backward progress onto an unused spread
    while (
      chosenSpreads.has(candidateSpread) &&
      candidateSpread !== targetSpread
    ) {
      candidateSpread += direction;
    }

    if (!chosenSpreads.has(candidateSpread)) {
      chosenSpreads.add(candidateSpread);
      const pageNum = isSpread
        ? clampPageNumber(candidateSpread * 2 + 1, safeTotal)
        : clampPageNumber(candidateSpread + 1, safeTotal);
      sequence.push(pageNum);
    }
  }

  sequence.push(target);
  return sequence;
}

/**
 * Computes responsive single-page width & height for the flipbook stage so that:
 * - Desktop (>= 768px): two pages fit comfortably side-by-side within available stage area.
 * - Mobile (< 768px): one page fills the viewport cleanly without horizontal overflow.
 */
export function computeFlipbookPageDimensions(
  stageWidth,
  stageHeight,
  aspectRatio = 0.707,
  isMobile = false
) {
  const safeRatio =
    Number.isFinite(aspectRatio) && aspectRatio > 0.35 && aspectRatio < 2.2
      ? aspectRatio
      : 0.707;

  const horizontalPadding = isMobile ? 28 : 96;
  const verticalPadding = isMobile ? 28 : 48;

  const maxTotalWidth = Math.max(240, (Number(stageWidth) || 960) - horizontalPadding);
  const maxHeight = Math.max(300, (Number(stageHeight) || 680) - verticalPadding);

  const maxSinglePageWidth = isMobile
    ? Math.min(540, maxTotalWidth)
    : Math.min(560, Math.floor(maxTotalWidth / 2));

  let pageHeight = Math.min(780, maxHeight);
  let pageWidth = Math.floor(pageHeight * safeRatio);

  if (pageWidth > maxSinglePageWidth) {
    pageWidth = maxSinglePageWidth;
    pageHeight = Math.floor(pageWidth / safeRatio);
  }

  return {
    pageWidth: Math.max(200, Math.round(pageWidth)),
    pageHeight: Math.max(280, Math.round(pageHeight))
  };
}
