/* Unit test: pure/speech-helpers.js
   Jalankan: node tests/run.js */
'use strict';
const { suite, test, eq, ok } = require('./harness.js');
const S = require('../src/pure/speech-helpers.js');

suite('Text-to-Speech — parameter');

test('clampParam menahan nilai di rentang & menangani input invalid', () => {
  eq(S.clampParam(9, 'rate'), 2);
  eq(S.clampParam(-3, 'rate'), 0.5);
  eq(S.clampParam('abc', 'pitch'), 1);
  eq(S.clampParam(-1, 'volume'), 0);
});

suite('Text-to-Speech — chunking teks panjang');

test('teks pendek tidak dipecah', () => {
  eq(S.chunkText('Halo dunia.'), ['Halo dunia.']);
});

test('teks kosong menghasilkan array kosong', () => {
  eq(S.chunkText('   \n  '), []);
});

test('teks panjang dipecah tanpa kehilangan kata', () => {
  const src = Array.from({ length: 60 }, (_, i) =>
    `Ini kalimat nomor ${i + 1} yang cukup panjang untuk menguji pemecahan teks.`).join(' ');
  const chunks = S.chunkText(src);
  ok(chunks.length > 1, 'harus terpecah menjadi beberapa bagian');
  ok(chunks.every(c => c.length <= S.CHUNK_SIZE), 'tiap bagian <= CHUNK_SIZE');
  eq(chunks.join(' ').replace(/\s+/g, ' ').trim(), src.replace(/\s+/g, ' ').trim());
});

test('kata tunggal sangat panjang tetap dipotong & utuh', () => {
  const word = 'A'.repeat(700);
  const chunks = S.chunkText(word);
  ok(chunks.every(c => c.length <= S.CHUNK_SIZE));
  eq(chunks.join(''), word);
});

suite('Text-to-Speech — daftar voice');

const VOICES = [
  { name: 'Alex', lang: 'en-US', voiceURI: 'alex', default: true },
  { name: 'Damayanti', lang: 'id-ID', voiceURI: 'damayanti' },
  { name: 'Samantha', lang: 'en-US', voiceURI: 'samantha' }
];

test('uniqueLangs mengembalikan bahasa unik terurut', () => {
  eq(S.uniqueLangs(VOICES), ['en-US', 'id-ID']);
});

test('filterByLang menyaring per bahasa, "all" mengembalikan semua', () => {
  eq(S.filterByLang(VOICES, 'en-US').map(v => v.name), ['Alex', 'Samantha']);
  eq(S.filterByLang(VOICES, 'all').length, 3);
});

test('pickDefaultVoice mengutamakan bahasa Indonesia', () => {
  eq(S.pickDefaultVoice(VOICES).name, 'Damayanti');
  eq(S.pickDefaultVoice([]), null);
});

test('langLabel selalu mengembalikan string non-kosong', () => {
  ok(typeof S.langLabel('id-ID') === 'string' && S.langLabel('id-ID').includes('id-ID'));
  ok(S.langLabel('') === 'Tidak diketahui');
});
