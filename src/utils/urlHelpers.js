/**
 * Helper utilities for normalising Google Drive and external file links
 * for covers (images) and e-book PDFs (embed iframe).
 */

/**
 * Extracts Google Drive file ID if present.
 * Matches:
 * - https://drive.google.com/file/d/{FILE_ID}/view...
 * - https://drive.google.com/open?id={FILE_ID}
 * - https://drive.google.com/uc?id={FILE_ID}
 */
export function extractGoogleDriveId(url) {
  if (!url || typeof url !== 'string') return null;
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1 && match1[1]) return match1[1];

  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2 && match2[1]) return match2[1];

  return null;
}

/**
 * Formats a PDF link for embedding in a browser iframe.
 * Google Drive links are transformed to /preview so they can be viewed without CORS errors.
 */
export function formatPdfEmbedUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  const driveId = extractGoogleDriveId(trimmed);

  if (driveId) {
    return `https://drive.google.com/file/d/${driveId}/preview`;
  }

  return trimmed;
}

/**
 * Formats a cover image URL.
 * If it's a Google Drive link, converts to direct thumbnail/view URL.
 */
export function formatCoverImageUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const driveId = extractGoogleDriveId(trimmed);
  if (driveId) {
    // lh3.googleusercontent.com or uc?export=view
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w600`;
  }

  return trimmed;
}
