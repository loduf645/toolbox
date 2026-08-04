/* Unit test: pure/crypto-helpers.js (MD5, password, UUID/random ID)
   Jalankan: node tests/run.js */
'use strict';
const { suite, test, eq, ok } = require('./harness.js');
const C = require('../src/pure/crypto-helpers.js');
const nodeCrypto = require('crypto'); // implementasi pembanding independen

suite('MD5');

test('vektor uji RFC: string kosong', () => {
  eq(C.md5(''), 'd41d8cd98f00b204e9800998ecf8427e');
});

test('vektor uji RFC: "abc"', () => {
  eq(C.md5('abc'), '900150983cd24fb0d6963f7d28e17f72');
});

test('vektor uji klasik: quick brown fox', () => {
  eq(C.md5('The quick brown fox jumps over the lazy dog'), '9e107d9d372bb6826bd81d3542a419d6');
});

test('cross-check dengan crypto Node (Unicode BMP)', () => {
  // Catatan: implementasi MD5 klasik ini memproses string per UTF-16 code unit,
  // sehingga karakter di luar BMP (mis. emoji) mengikuti encoding lama — sama
  // persis dengan perilaku SEBELUM refactor (behavior-preserving), tetapi tidak
  // sama dengan MD5 UTF-8 standar. Karena itu emoji tidak ikut di-cross-check.
  const samples = ['Halo Dunia!', 'パスワード', 'a'.repeat(1000), 'spasi  dan\ttab'];
  samples.forEach(s => {
    const want = nodeCrypto.createHash('md5').update(s, 'utf8').digest('hex');
    eq(C.md5(s), want, `input: ${JSON.stringify(s.slice(0, 30))}`);
  });
});

suite('Password generator (inti murni)');

test('charset bawaan utuh', () => {
  eq(C.PASSWORD_CHARSETS.lower.length, 26);
  eq(C.PASSWORD_CHARSETS.upper.length, 26);
  eq(C.PASSWORD_CHARSETS.number.length, 10);
  eq(C.PASSWORD_CHARSETS.symbol, '!@#$%^&*()');
});

test('exclude ambigu membuang 0 O 1 l I', () => {
  eq('a0O1lIb'.replace(C.AMBIGUOUS_CHARS, ''), 'ab');
});

test('buildPassword deterministik (rng=0): panjang & jaminan satu char per set', () => {
  const out = C.buildPassword({ sets: ['ab', '12'], length: 6, randInt: () => 0 });
  // set1->'a', set2->'1', sisanya pool[0]='a'; Fisher-Yates dgn rng 0
  // memindahkan posisi 0 ke akhir: hasil deterministik '1aaaaa'.
  eq(out, '1aaaaa');
});

test('buildPassword mempertahankan multiset karakter (shuffle tak bias bentuk)', () => {
  const out = C.buildPassword({ sets: ['ab', '12'], length: 8, randInt: m => m - 1 });
  eq([...out].sort().join(''), '2222222b');
});

test('klasifikasi kekuatan berbasis entropi', () => {
  const weak = C.passwordStrength(6, 10);      // ~19.9 bit
  eq(weak.level, 1); eq(weak.cls, 'weak'); eq(weak.label, 'Lemah');
  const medium = C.passwordStrength(8, 94);    // ~52.4 bit
  eq(medium.level, 2); eq(medium.label, 'Sedang');
  const strong = C.passwordStrength(12, 62);   // ~71.5 bit
  eq(strong.level, 3); eq(strong.label, 'Kuat');
  const vstrong = C.passwordStrength(16, 94);  // ~104.9 bit
  eq(vstrong.level, 4); eq(vstrong.label, 'Sangat kuat');
});

test('shuffleWith mempertahankan isi array', () => {
  const arr = [1, 2, 3, 4, 5];
  const out = C.shuffleWith(arr.slice(), m => Math.floor(m / 2));
  eq([...out].sort((a, b) => a - b), [1, 2, 3, 4, 5]);
});

suite('UUID & Random ID');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test('uuidV4 (native Node) sesuai format v4', () => {
  ok(UUID_RE.test(C.uuidV4()), 'format UUID v4');
});

test('uuidV4Fallback deterministik: versi 4 & varian benar', () => {
  let i = 0;
  const fill = a => { for(let k = 0; k < a.length; k++) a[k] = i++; return a; };
  const id = C.uuidV4Fallback(fill);
  ok(UUID_RE.test(id), 'format: ' + id);
  eq(id[14], '4');
});

test('randomId: panjang & charset benar', () => {
  let i = 0;
  const fill = a => { for(let k = 0; k < a.length; k++) a[k] = i++; return a; };
  const id = C.randomId(16, fill);
  eq(id.length, 16);
  ok(/^[a-z0-9]+$/.test(id), 'hanya a-z0-9');
});

test('randomId memakai crypto bawaan bila fillBytes tidak diberikan', () => {
  const id = C.randomId(12);
  eq(id.length, 12);
  ok(/^[a-z0-9]+$/.test(id), 'hanya a-z0-9');
});

test('uuidV4 unik antar pemanggilan (100 sampel)', () => {
  const s = new Set(Array.from({ length: 100 }, () => C.uuidV4()));
  eq(s.size, 100);
});

test('randomId: rejection sampling membuang byte >= 252', () => {
  // 4 byte pertama 255 (dibuang), lalu byte valid
  const seq = [255, 255, 255, 255, 0, 1, 2, 3, 4, 5];
  let i = 0;
  const fill = a => { for(let k = 0; k < a.length; k++) a[k] = seq[i++ % seq.length]; return a; };
  const id = C.randomId(4, fill);
  eq(id.length, 4);
  eq(id, 'abcd');
});
