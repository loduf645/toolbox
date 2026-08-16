/* Unit test: pure/text-transforms.js (Text Transformer + operasi editor MD)
   Jalankan: node tests/run.js */
'use strict';
const { suite, test, eq, ok } = require('./harness.js');
const TT = require('../src/pure/text-transforms.js');

suite('Text Transformer — mode transformasi');

test('reverse: Hello World', () => {
  eq(TT.MODES.reverse.fn('Hello World'), 'dlroW olleH');
});

test('reverse: emoji tidak terbelah', () => {
  eq(TT.MODES.reverse.fn('a😀b'), 'b😀a');
});

test('mirror: pasangan karakter cermin', () => {
  eq(TT.MODES.mirror.fn('ab'), 'ɒd');
  eq(TT.MODES.mirror.fn('A('), 'Ɐ)');
});

test('mirror: karakter tanpa padanan dibiarkan', () => {
  eq(TT.MODES.mirror.fn('ñ'), 'ñ');
});

test('reverseWords: urutan kata dibalik', () => {
  eq(TT.MODES.reverseWords.fn('Saya suka makan nasi'), 'nasi makan suka Saya');
});

test('reverseEachWord: huruf per kata dibalik', () => {
  eq(TT.MODES.reverseEachWord.fn('Hello World'), 'olleH dlroW');
});

test('reverseEachWord: spasi ganda dipertahankan', () => {
  eq(TT.MODES.reverseEachWord.fn('ab  cd'), 'ba  dc');
});

test('flip upside down', () => {
  eq(TT.MODES.flip.fn('Hello'), 'oןןǝH');
});

test('semua mode punya hint', () => {
  Object.values(TT.MODES).forEach(m => ok(typeof m.hint === 'string' && m.hint.length > 0));
});

suite('Operasi editor Markdown (Prompt Studio)');

test('mdWrapSelection: bungkus seleksi', () => {
  const r = TT.mdWrapSelection('Hello world', 0, 5, '**', '**', 'teks tebal');
  eq(r.value, '**Hello** world');
  eq(r.start, 2); eq(r.end, 7);
});

test('mdWrapSelection: seleksi kosong pakai placeholder', () => {
  const r = TT.mdWrapSelection('abc', 1, 1, '*', '*', 'x');
  eq(r.value, 'a*x*bc');
});

test('mdLinePrefix: tambah prefix ke semua baris', () => {
  const r = TT.mdLinePrefix('a\nb\nc', 0, 5, '- ');
  eq(r.value, '- a\n- b\n- c');
});

test('mdLinePrefix: toggle menghapus prefix', () => {
  const r1 = TT.mdLinePrefix('a\nb', 0, 3, '- ');
  const r2 = TT.mdLinePrefix(r1.value, 0, r1.value.length, '- ');
  eq(r2.value, 'a\nb');
});

test('mdNumberedList: penomoran berurutan', () => {
  const r = TT.mdNumberedList('satu\ndua', 0, 8);
  eq(r.value, '1. satu\n2. dua');
});

test('mdNumberedList: baris kosong dilewati', () => {
  const r = TT.mdNumberedList('a\n\nb', 0, 4);
  eq(r.value, '1. a\n\n2. b');
});

test('mdNumberedList: toggle menghapus nomor', () => {
  const r1 = TT.mdNumberedList('satu\ndua', 0, 8);
  const r2 = TT.mdNumberedList(r1.value, 0, r1.value.length);
  eq(r2.value, 'satu\ndua');
});

test('mdCodeAction: seleksi kosong -> inline + placeholder', () => {
  const r = TT.mdCodeAction('abc', 1, 1);
  eq(r.value, 'a`kode`bc');
});

test('mdCodeAction: seleksi pendek -> inline', () => {
  const r = TT.mdCodeAction('a x b', 2, 3);
  eq(r.value, 'a `x` b');
});

test('mdCodeAction: multi-baris -> fenced block', () => {
  const r = TT.mdCodeAction('a\nb', 0, 3);
  eq(r.value, '\n```\na\nb\n```\n');
});

test('mdInsertAtCursor: apit baris baru bila perlu', () => {
  const r = TT.mdInsertAtCursor('abc', 3, 3, 'X');
  eq(r.value, 'abc\nX');
  eq(r.start, 5);
});

test('mdInsertAtCursor: di awal teks tetap ditutup baris baru (perilaku asli)', () => {
  const r = TT.mdInsertAtCursor('abc', 0, 0, 'X');
  eq(r.value, 'X\nabc');
});

test('mdInsertAtCursor: setelah baris baru tidak menambah baris ekstra', () => {
  const r = TT.mdInsertAtCursor('abc\n', 4, 4, 'X');
  eq(r.value, 'abc\nX');
});


