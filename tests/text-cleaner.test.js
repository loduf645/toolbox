/* Unit test: pure/text-cleaner.js
   Jalankan: node tests/run.js */
'use strict';
const { suite, test, eq, ok } = require('./harness.js');
const TC = require('../src/pure/text-cleaner.js');

suite('Text Cleaner — operasi tunggal');

test('hapus spasi berlebih di dalam baris', () => {
  eq(TC.removeExtraSpaces('halo    dunia   ini'), 'halo dunia ini');
  eq(TC.removeExtraSpaces('a  b\nc   d'), 'a b\nc d');
});

test('hapus baris kosong', () => {
  eq(TC.removeEmptyLines('a\n\nb\n   \nc'), 'a\nb\nc');
});

test('hapus baris duplikat (kemunculan pertama dipertahankan)', () => {
  eq(TC.removeDuplicateLines('a\nb\na\nc\nb'), 'a\nb\nc');
});

test('trim whitespace tiap baris', () => {
  eq(TC.trimWhitespace('  a  \n\t b\t '), 'a\nb');
});

test('urutkan baris A-Z dan Z-A', () => {
  eq(TC.sortLines('banana\napel\nceri', 'asc'), 'apel\nbanana\nceri');
  eq(TC.sortLines('banana\napel\nceri', 'desc'), 'ceri\nbanana\napel');
});

test('hapus baris baru menggabungkan jadi satu paragraf', () => {
  eq(TC.removeLineBreaks('satu\ndua\ntiga'), 'satu dua tiga');
});

test('hapus karakter spesial tapi pertahankan huruf & angka', () => {
  eq(TC.removeSpecialChars('halo, dunia! #2024 (test)'), 'halo dunia 2024 test');
});

test('CRLF diperlakukan sama dengan LF', () => {
  eq(TC.removeEmptyLines('a\r\n\r\nb'), 'a\nb');
});

suite('Text Cleaner — clean() gabungan');

test('beberapa opsi bisa dijalankan sekaligus', () => {
  const src = '  halo   dunia  \n\n  halo   dunia  \n  apa kabar ';
  eq(TC.clean(src, ['extraSpaces', 'trim', 'emptyLines', 'duplicates']),
     'halo dunia\napa kabar');
});

test('menerima map {id:true} selain array', () => {
  eq(TC.clean('a\n\nb', { emptyLines: true, duplicates: false }), 'a\nb');
});

test('tanpa opsi -> teks tidak berubah', () => {
  eq(TC.clean('  a  \n\n b ', []), '  a  \n\n b ');
});

test('id opsi tidak dikenal diabaikan', () => {
  eq(TC.clean('a\n\nb', ['emptyLines', 'tidakAda']), 'a\nb');
});

test('urutan eksekusi mengikuti OPTIONS, bukan urutan input', () => {
  const src = 'b\n\na';
  eq(TC.clean(src, ['sortAsc', 'emptyLines']), TC.clean(src, ['emptyLines', 'sortAsc']));
});

test('sortDesc menang bila keduanya aktif', () => {
  eq(TC.clean('a\nb\nc', ['sortAsc', 'sortDesc']), 'c\nb\na');
});

test('teks kosong tetap aman untuk semua opsi', () => {
  TC.OPTIONS.forEach(o => eq(typeof TC.clean('', [o.id]), 'string', 'opsi ' + o.id));
});

suite('Text Cleaner — metadata OPTIONS');

test('semua opsi wajib punya id, label, hint, dan fn', () => {
  TC.OPTIONS.forEach(o => {
    ok(typeof o.id === 'string' && o.id, 'id opsi');
    ok(typeof o.label === 'string' && o.label, 'label ' + o.id);
    ok(typeof o.hint === 'string' && o.hint, 'hint ' + o.id);
    ok(typeof o.fn === 'function', 'fn ' + o.id);
    ok(TC.OPTION_MAP[o.id] === o, 'OPTION_MAP ' + o.id);
  });
});

test('delapan opsi sesuai spesifikasi tersedia', () => {
  const ids = TC.OPTIONS.map(o => o.id).sort();
  eq(ids, ['duplicates','emptyLines','extraSpaces','lineBreaks','sortAsc','sortDesc','specialChars','trim']);
});
