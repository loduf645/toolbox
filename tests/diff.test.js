/* Unit test: pure/diff-engine.js (algoritma Myers + statistik)
   Jalankan: node tests/run.js */
'use strict';
const { suite, test, eq, approx, ok } = require('./harness.js');
const Diff = require('../src/pure/diff-engine.js');

suite('Diff — kasus dasar');

test('teks identik -> semua same, 100% sama', () => {
  const res = Diff.runDiff('abc def', 'abc def', 'word');
  ok(res.parts.every(p => p.type === 'same'));
  const st = Diff.computeStats(res.parts, Diff.MODES.word);
  eq(st.add, 0); eq(st.del, 0); eq(st.pct, 100);
});

test('kedua sisi kosong -> parts kosong, pct 100', () => {
  const res = Diff.runDiff('', '', 'word');
  eq(res.parts, []);
  eq(Diff.computeStats(res.parts, Diff.MODES.word).pct, 100);
});

test('satu sisi kosong -> semua del / semua add', () => {
  const res = Diff.runDiff('satu dua', '', 'word');
  ok(res.parts.filter(p => p.type === 'del').length >= 2);
  ok(res.parts.every(p => p.type !== 'add'));
});

test('beda sedikit (satu kata diganti)', () => {
  const res = Diff.runDiff('Hari ini adalah hari yang cerah.', 'Hari ini adalah hari yang mendung.', 'word');
  const st = Diff.computeStats(res.parts, Diff.MODES.word);
  eq(st.add, 1);
  eq(st.del, 1);
  ok(res.parts.some(p => p.type === 'del' && p.text === 'cerah.'));
  ok(res.parts.some(p => p.type === 'add' && p.text === 'mendung.'));
});

test('urutan parts merekonstruksi teks lama & baru', () => {
  const a = 'alpha beta gamma', b = 'alpha delta gamma';
  const parts = Diff.diffWords(a, b);
  eq(parts.filter(p => p.type !== 'add').map(p => p.text).join(''), a);
  eq(parts.filter(p => p.type !== 'del').map(p => p.text).join(''), b);
});

suite('Diff — mode baris & karakter');

test('mode baris: satu baris diganti', () => {
  const parts = Diff.diffLines('a\nb\nc', 'a\nx\nc');
  const st = Diff.computeStats(parts, Diff.MODES.line);
  eq(st.add, 1); eq(st.del, 1); eq(st.same, 2);
});

test('mode karakter: typo satu huruf', () => {
  const parts = Diff.diffChars('kucing', 'kucin');
  eq(parts[parts.length - 1], { type: 'del', text: 'g' });
});

test('mode karakter: emoji tidak terbelah', () => {
  const parts = Diff.diffChars('a😀b', 'a😁b');
  ok(parts.some(p => p.type === 'del' && p.text === '😀'));
  ok(parts.some(p => p.type === 'add' && p.text === '😁'));
});

suite('Diff — pengaman performa');

test('melebihi maxUnits -> overLimit', () => {
  const huge = Array.from({ length: 8001 }, (_, i) => 'x' + i).join(' ');
  const res = Diff.runDiff(huge, huge, 'word');
  eq(res.overLimit, true);
  eq(res.parts, []);
});

test('beda terlalu banyak -> hasil disederhanakan (blok del+add)', () => {
  const a = Array.from({ length: 1200 }, (_, i) => 'aa' + i).join(' ');
  const b = Array.from({ length: 1200 }, (_, i) => 'bb' + i).join(' ');
  const res = Diff.runDiff(a, b, 'word');
  eq(res.simplified, true);
  const st = Diff.computeStats(res.parts, Diff.MODES.word);
  eq(st.add, 1200); eq(st.del, 1200); eq(st.same, 0);
});

suite('Diff — statistik & utilitas');

test('pct ditahan di 99 selama ada perubahan', () => {
  const parts = [];
  for(let i = 0; i < 999; i++) parts.push({ type: 'same', text: 'w' + i });
  parts.push({ type: 'add', text: 'baru' });
  eq(Diff.computeStats(parts, Diff.MODES.word).pct, 99);
});

test('token spasi tidak dihitung sebagai kata', () => {
  const res = Diff.runDiff('a  b', 'a  b', 'word');
  const st = Diff.computeStats(res.parts, Diff.MODES.word);
  eq(st.same, 2);
});

test('mergeParts menggabungkan bagian sejenis', () => {
  eq(Diff.mergeParts([{ type: 'same', text: 'a' }, { type: 'same', text: 'b' }, { type: 'del', text: 'c' }]),
     [{ type: 'same', text: 'ab' }, { type: 'del', text: 'c' }]);
});

test('pairLineRows menyejajarkan del/add', () => {
  const parts = [
    { type: 'same', text: 'x' },
    { type: 'del', text: 'a' },
    { type: 'add', text: 'b' },
    { type: 'add', text: 'c' },
    { type: 'same', text: 'y' }
  ];
  const rows = Diff.pairLineRows(parts);
  eq(rows.length, 4);
  eq(rows[0], { l: 'x', r: 'x', na: 1, nb: 1, tl: 'same', tr: 'same' });
  eq(rows[1].l, 'a'); eq(rows[1].tl, 'del'); eq(rows[1].tr, 'add');
  eq(rows[2].tl, 'empty'); eq(rows[2].tr, 'add'); eq(rows[2].r, 'c');
  eq(rows[3].na, 3); eq(rows[3].nb, 4);
});

test('plainDiff mode kata', () => {
  eq(Diff.plainDiff([{ type: 'same', text: 'a' }, { type: 'del', text: 'b' }, { type: 'add', text: 'c' }], 'word'),
     'a[-b-]{+c+}');
});

test('plainDiff mode baris', () => {
  eq(Diff.plainDiff([{ type: 'same', text: 'x' }, { type: 'del', text: 'a' }, { type: 'add', text: 'b' }], 'line'),
     '  x\n- a\n+ b');
});

test('teks hanya spasi: spasi tidak dihitung sebagai unit', () => {
  const res = Diff.runDiff('   ', 'a', 'word');
  const st = Diff.computeStats(res.parts, Diff.MODES.word);
  eq(st.add, 1);
  eq(st.del, 0);   // spasi di sisi lama di-del tapi tidak countable
  eq(st.same, 0);
  eq(st.pct, 0);
});

test('mode baris dalam jumlah besar tetap di bawah limit', () => {
  const a = Array.from({ length: 4000 }, (_, i) => 'baris ' + i).join('\n');
  const b = a.replace('baris 100', 'BARIS 100');
  const res = Diff.runDiff(a, b, 'line');
  eq(res.overLimit, false);
  const st = Diff.computeStats(res.parts, Diff.MODES.line);
  eq(st.add, 1);
  eq(st.del, 1);
  eq(st.same, 3999);
});

test('simetri: tukar posisi menukar add/del', () => {
  const f = Diff.runDiff('lama sekali', 'baru sekali', 'word');
  const r = Diff.runDiff('baru sekali', 'lama sekali', 'word');
  eq(Diff.computeStats(f.parts, Diff.MODES.word).add, Diff.computeStats(r.parts, Diff.MODES.word).del);
});
