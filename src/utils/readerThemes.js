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
  },
  modern: {
    container: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',
    muted: '#475569',
    border: '#E2E8F0',
    accent: '#2563EB',
    accentSoft: '#EFF6FF',
    dot: 'rgba(37, 99, 235, 0.05)',
    pdfFilter: 'none',
    iframeBackground: '#FFFFFF'
  }
};

export function getReaderThemeTokens(theme) {
  return READER_THEME_TOKENS[theme] || READER_THEME_TOKENS.obsidian;
}
