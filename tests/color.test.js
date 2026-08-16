/* Unit test: pure/color-helpers.js
   Jalankan: node tests/run.js */
'use strict';
const { suite, test, eq, approx, ok } = require('./harness.js');
const C = require('../src/pure/color-helpers.js');

suite('Warna — normalisasi & konversi dasar');

test('normalizeHex: 6 digit, 3 digit, tanpa #, huruf besar', () => {
  eq(C.normalizeHex('#A8421C'), '#a8421c');
  eq(C.normalizeHex('#ABC'), '#aabbcc');
  eq(C.normalizeHex('ff0000'), '#ff0000');
});

test('normalizeHex: input tidak valid -> null', () => {
  eq(C.normalizeHex('xyz'), null);
  eq(C.normalizeHex('#12345'), null);
  eq(C.normalizeHex(''), null);
});

test('hexToRgb nilai benar', () => {
  eq(C.hexToRgb('#ff0000'), { r: 255, g: 0, b: 0 });
  eq(C.hexToRgb('#00ff00'), { r: 0, g: 255, b: 0 });
  eq(C.hexToRgb('#a8421c'), { r: 168, g: 66, b: 28 });
});

test('rgbToHex clamp di 0..255', () => {
  eq(C.rgbToHex(300, -5, 12.6), '#ff000d');
});

suite('Warna — HSL');

test('rgbToHsl warna primer', () => {
  eq(C.rgbToHsl(255, 0, 0), { h: 0, s: 100, l: 50 });
  eq(C.rgbToHsl(0, 255, 0), { h: 120, s: 100, l: 50 });
  eq(C.rgbToHsl(0, 0, 255), { h: 240, s: 100, l: 50 });
});

test('rgbToHsl abu-abu: saturasi 0', () => {
  const g = C.rgbToHsl(128, 128, 128);
  eq(g.s, 0);
  approx(g.l, 50.2, 0.01);
});

test('hslToRgb kebalikan rgbToHsl (round-trip)', () => {
  [[255, 0, 0], [168, 66, 28], [12, 200, 90], [0, 0, 0], [255, 255, 255]].forEach(([r, g, b]) => {
    const hsl = C.rgbToHsl(r, g, b);
    eq(C.hslToRgb(hsl.h, hsl.s, hsl.l), { r, g, b }, `roundtrip rgb(${r},${g},${b})`);
  });
});

test('hslToRgb wrap hue negatif & > 360', () => {
  eq(C.hslToRgb(-30, 100, 50), C.hslToRgb(330, 100, 50));
  eq(C.hslToRgb(390, 100, 50), C.hslToRgb(30, 100, 50));
});

test('formatRgb & formatHsl', () => {
  eq(C.formatRgb({ r: 255, g: 0, b: 128 }), 'rgb(255, 0, 128)');
  eq(C.formatHsl({ h: 210.4, s: 50.4, l: 40.4 }), 'hsl(210, 50%, 40%)');
});

suite('Warna — generator palette');

test('komplementer merah = cyan', () => {
  eq(C.generatePalettes('#ff0000').complementary, ['#ff0000', '#00ffff']);
});

test('triadic merah = merah, hijau, biru', () => {
  eq(C.generatePalettes('#ff0000').triadic, ['#ff0000', '#00ff00', '#0000ff']);
});

test('analogous merah: ±30 derajat', () => {
  eq(C.generatePalettes('#ff0000').analogous, ['#ff0080', '#ff0000', '#ff8000']);
});

test('monokromatik: 5 warna, hue & saturasi sama', () => {
  const pals = C.generatePalettes('#a8421c');
  eq(pals.monochromatic.length, 5);
  const base = C.rgbToHsl(...Object.values(C.hexToRgb('#a8421c')));
  pals.monochromatic.forEach(hex => {
    const hsl = C.rgbToHsl(...Object.values(C.hexToRgb(hex)));
    // Toleransi melebar: pembulatan RGB 0..255 menggeser sedikit s/h saat round-trip.
    approx(hsl.h, base.h, 1, 'hue tetap');
    approx(hsl.s, base.s, 1.5, 'saturasi tetap');
  });
});

test('shades & tints: 8 warna terurut gelap -> terang', () => {
  const st = C.generatePalettes('#a8421c').shadesTints;
  eq(st.length, 8);
  const ls = st.map(hex => C.rgbToHsl(...Object.values(C.hexToRgb(hex))).l);
  for(let i = 1; i < ls.length; i++) ok(ls[i] >= ls[i - 1], 'lightness naik');
});

test('generatePalettes input invalid -> null', () => {
  eq(C.generatePalettes('bukan-warna'), null);
});


