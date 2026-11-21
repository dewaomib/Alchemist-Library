function splitLongSegment(segment, limit) {
  const words = segment.split(' ').filter(Boolean);
  const parts = [];
  let current = '';

  for (const word of words) {
    if (word.length > limit) {
      if (current) {
        parts.push(current);
        current = '';
      }
      for (let index = 0; index < word.length; index += limit) {
        parts.push(word.slice(index, index + limit));
      }
      continue;
    }

    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= limit) {
      current += ` ${word}`;
    } else {
      parts.push(current);
      current = word;
    }
  }

  if (current) parts.push(current);
  return parts;
}

export function splitIntoSpeechChunks(text, maxLength = 200) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const limit = Math.max(1, Math.floor(Number(maxLength) || 200));
  const sentences = normalized.match(/[^.!?…]+[.!?…]+["”']?|[^.!?…]+$/g) || [normalized];
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    const parts = trimmed.length > limit ? splitLongSegment(trimmed, limit) : [trimmed];

    for (const part of parts) {
      if (!part) continue;
      if (!current) {
        current = part;
      } else if (current.length + 1 + part.length <= limit) {
        current += ` ${part}`;
      } else {
        chunks.push(current);
        current = part;
      }
    }
  }

  if (current) chunks.push(current);
  return chunks;
}
