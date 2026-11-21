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
