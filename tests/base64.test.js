/* Unit test: pure/base64.js
   Jalankan: node tests/run.js */
'use strict';
const { suite, test, eq, ok, throws } = require('./harness.js');
const B = require('../src/pure/base64.js');

suite('Base64 — encode');

test('encode ASCII dasar', () => {
  eq(B.encode('Halo Dunia!'), 'SGFsbyBEdW5pYSE=');
});

test('encode string kosong', () => {
  eq(B.encode(''), '');
});

test('encode padding 1 dan 2', () => {
  eq(B.encode('a'), 'YQ==');      // 1 byte -> 2 padding
  eq(B.encode('ab'), 'YWI=');     // 2 byte -> 1 padding
  eq(B.encode('abc'), 'YWJj');    // 3 byte -> tanpa padding
});

test('encode Unicode (UTF-8, emoji utuh)', () => {
  eq(B.encode('Halo ✨'), Buffer.from('Halo ✨', 'utf8').toString('base64'));
  eq(B.encode('🌏'), Buffer.from('🌏', 'utf8').toString('base64'));
});

suite('Base64 — decode');

test('decode ASCII', () => {
  eq(B.decode('SGFsbyBEdW5pYSE='), 'Halo Dunia!');
});

test('decode mengabaikan whitespace/baris baru', () => {
  eq(B.decode('SGFs\nbyBE dW5pYSE='), 'Halo Dunia!');
});

test('round-trip teks Unicode', () => {
  ['Halo Dunia!', 'Halo ✨ dunia 🌏', 'パスワード', 'a=1&b=2'].forEach(s => {
    eq(B.decode(B.encode(s)), s, `roundtrip ${JSON.stringify(s)}`);
  });
});

test('decode byte biner: round-trip 500 array acak vs Buffer', () => {
  for(let t = 0; t < 500; t++){
    const len = Math.floor(Math.random() * 32);
    const bytes = new Uint8Array(len);
    for(let i = 0; i < len; i++) bytes[i] = Math.floor(Math.random() * 256);
    eq(B.bytesToBase64(bytes), Buffer.from(bytes).toString('base64'), 'encode vs Buffer');
    eq([...B.base64ToBytes(B.bytesToBase64(bytes))], [...bytes], 'roundtrip bytes');
  }
});

suite('Base64 — validasi & deteksi');

test('panjang bukan kelipatan 4 -> error ramah', () => {
  throws(() => B.decode('abc'));
  ok(/kelipatan 4/.test((() => { try { B.decode('abc'); } catch(e){ return e.message; } })()));
});

test('karakter di luar alfabet Base64 -> error', () => {
  throws(() => B.decode('AB=C'));
  throws(() => B.decode('!!!!'));
});

test('padding "=" di tengah -> error', () => {
  throws(() => B.decode('A==='));
});

test('byte bukan UTF-8 -> error informatif, bukan crash ambigu', () => {
  // 0xff 0xfe bukan urutan UTF-8 yang valid
  throws(() => B.decode(B.bytesToBase64(new Uint8Array([255, 254, 253]))));
});

test('isLikelyBase64: benar untuk Base64, salah untuk teks biasa', () => {
  eq(B.isLikelyBase64('SGFsbyBEdW5pYSE='), true);
  eq(B.isLikelyBase64('SGFs byB\nEdW5 pYSE='), true);   // whitespace diabaikan
  eq(B.isLikelyBase64('Halo Dunia!'), false);
  eq(B.isLikelyBase64(''), false);
});

test('dataUri tersusun benar', () => {
  eq(B.dataUri('image/png', 'QUJD'), 'data:image/png;base64,QUJD');
});


