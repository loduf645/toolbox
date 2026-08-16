/* Unit test: pure/search-engine.js (matching, skoring, saran)
   Jalankan: node tests/run.js */
'use strict';
const { suite, test, eq, ok } = require('./harness.js');
const SE = require('../src/pure/search-engine.js');

/* Fixture kecil — bentuknya sama dengan TOOLS/CATEGORIES/ALIASES aplikasi. */
const tools = [
  { id: 'password', name: 'Password Generator', cat: 'generator', desc: 'Hasilkan password acak dengan aman.' },
  { id: 'loan', name: 'Kalkulator Cicilan & KPR', cat: 'kalkulator', desc: 'Hitung cicilan anuitas dan bunga.' },
  { id: 'diff', name: 'Text Diff Checker', cat: 'text', desc: 'Cek perbedaan antara dua teks.' }
];
const aliases = { password: ['sandi', 'pw'], loan: ['kpr', 'bunga', 'kredit'], diff: ['banding', 'compare'] };
const categories = [ { id: 'generator', name: 'Generator' }, { id: 'kalkulator', name: 'Kalkulator' }, { id: 'text', name: 'Text' } ];
const ctx = { categories, aliases };

suite('Pencarian tool — matching');

test('alias: "sandi" -> Password Generator', () => {
  const r = SE.searchTools('sandi', tools, ctx);
  eq(r[0].tool.id, 'password');
});

test('substring nama: "kpr" -> Kalkulator Cicilan & KPR', () => {
  const r = SE.searchTools('kpr', tools, ctx);
  eq(r[0].tool.id, 'loan');
});

test('case-insensitive & diakritik dinormalisasi', () => {
  ok(SE.searchTools('SANDI', tools, ctx).length > 0);
  ok(SE.searchTools('cícilan', tools, ctx).length > 0);
});

test('typo toleran: "pasword" tetap menemukan password', () => {
  const r = SE.searchTools('pasword', tools, ctx);
  ok(r.length > 0);
  eq(r[0].tool.id, 'password');
});

test('multi-token = AND: "kalkulator bunga" hanya loan', () => {
  const r = SE.searchTools('kalkulator bunga', tools, ctx);
  eq(r.length, 1);
  eq(r[0].tool.id, 'loan');
});

test('tidak ada hasil untuk sampah', () => {
  eq(SE.searchTools('zzzzqqq', tools, ctx), []);
});

test('query kosong -> hasil kosong', () => {
  eq(SE.searchTools('   ', tools, ctx), []);
});

suite('Pencarian tool — komponen inti');

test('editDistance Levenshtein', () => {
  eq(SE.editDistance('kitten', 'sitting', 5), 3);
  eq(SE.editDistance('sama', 'sama', 2), 0);
});

test('editDistance berhenti dini bila melebihi max', () => {
  eq(SE.editDistance('abcdef', 'xyz', 1), 2); // max+1
});

test('fuzzyMatch subsequence + tolak yang berserakan', () => {
  ok(SE.fuzzyMatch('Kalkulator', 'klk'));
  eq(SE.fuzzyMatch('abc', 'xyz'), null);
});

test('highlight menandai range & escape HTML', () => {
  eq(SE.highlight('Password', [[0, 3]]), '<mark>Pas</mark>sword');
  eq(SE.highlight('<b>', []), '&lt;b&gt;');
});

test('mergeRanges menggabungkan range tumpang tindih', () => {
  eq(SE.mergeRanges([[0, 3], [2, 5], [8, 9]]), [[0, 5], [8, 9]]);
});

test('defensif: pool/tools/aliases kosong tidak melempar', () => {
  eq(SE.searchTools('apa saja', null, null), []);
  eq(SE.searchTools('apa saja', undefined, undefined), []);
  eq(SE.suggestTerms('apa saja', null, null), []);
});

test('typo toleran: "kalkultor" tetap menemukan kalkulator', () => {
  const r = SE.searchTools('kalkultor', tools, ctx);
  ok(r.length > 0, 'seharusnya ada hasil');
  eq(r[0].tool.id, 'loan');
});

test('suggestTerms: "sand" menyarankan "sandi" (prefix)', () => {
  const s = SE.suggestTerms('sand', tools, aliases);
  ok(s.some(t => t.toLowerCase() === 'sandi'));
});

test('suggestTerms: toleransi typo "sanndi" -> "sandi"', () => {
  const s = SE.suggestTerms('sanndi', tools, aliases);
  ok(s.some(t => t.toLowerCase() === 'sandi'));
});


