/* Unit test: pure/case-convert.js
   Jalankan: node tests/run.js */
'use strict';
const { suite, test, eq, ok } = require('./harness.js');
const C = require('../src/pure/case-convert.js');

suite('Case Converter — mode dasar');

test('UPPERCASE & lowercase', () => {
  eq(C.toUpperCase('halo Dunia'), 'HALO DUNIA');
  eq(C.toLowerCase('HaLo DUNIA'), 'halo dunia');
});

test('Title Case mengapitalkan tiap kata', () => {
  eq(C.toTitleCase('halo dunia yang indah'), 'Halo Dunia Yang Indah');
  eq(C.toTitleCase('hALO dUNIA'), 'Halo Dunia');
});

test('Title Case mempertahankan spasi & baris baru', () => {
  eq(C.toTitleCase('baris satu\nbaris  dua'), 'Baris Satu\nBaris  Dua');
});

test('Sentence case mengapitalkan awal tiap kalimat', () => {
  eq(C.toSentenceCase('halo dunia. apa kabar? baik!'), 'Halo dunia. Apa kabar? Baik!');
  eq(C.toSentenceCase('SAYA MAKAN NASI'), 'Saya makan nasi');
});

test('Sentence case menghormati baris baru', () => {
  eq(C.toSentenceCase('satu dua\ntiga empat'), 'Satu dua\nTiga empat');
});

test('aLtErNaTiNg CaSe berselang hanya pada huruf', () => {
  eq(C.toAlternatingCase('halo'), 'hAlO');
  eq(C.toAlternatingCase('ab cd'), 'aB cD');
});

suite('Case Converter — mode identifier');

test('camelCase & PascalCase', () => {
  eq(C.toCamelCase('nama depan user'), 'namaDepanUser');
  eq(C.toPascalCase('nama depan user'), 'NamaDepanUser');
});

test('snake_case & kebab-case', () => {
  eq(C.toSnakeCase('Nama Depan User'), 'nama_depan_user');
  eq(C.toKebabCase('Nama Depan User'), 'nama-depan-user');
});

test('memecah camelCase & PascalCase yang sudah ada', () => {
  eq(C.splitWords('namaDepanUser'), ['nama', 'depan', 'user']);
  eq(C.toKebabCase('HTTPServerError'), 'http-server-error');
});

test('tanda baca & underscore diperlakukan sebagai pemisah', () => {
  eq(C.toSnakeCase('halo-dunia, apa_kabar!'), 'halo_dunia_apa_kabar');
});

test('angka ikut dipertahankan', () => {
  eq(C.toCamelCase('user 2 login'), 'user2Login');
});

suite('Case Converter — convert() & MODES');

test('convert memakai id mode', () => {
  eq(C.convert('halo dunia', 'upper'), 'HALO DUNIA');
  eq(C.convert('halo dunia', 'pascal'), 'HaloDunia');
});

test('mode tidak dikenal mengembalikan teks apa adanya', () => {
  eq(C.convert('Halo', 'entahlah'), 'Halo');
});

test('teks kosong aman untuk semua mode', () => {
  Object.keys(C.MODES).forEach(m => eq(C.convert('', m), '', 'mode ' + m));
});

test('semua mode wajib punya label, hint, dan fn', () => {
  const ids = ['upper','lower','title','sentence','alternating','camel','pascal','snake','kebab'];
  ids.forEach(id => {
    const m = C.MODES[id];
    ok(m, 'mode ' + id + ' harus ada');
    ok(typeof m.label === 'string' && m.label, 'label ' + id);
    ok(typeof m.hint === 'string' && m.hint, 'hint ' + id);
    ok(typeof m.fn === 'function', 'fn ' + id);
  });
});
