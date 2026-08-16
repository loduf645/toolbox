/* Unit test: pure/gradient.js
   Jalankan: node tests/run.js */
'use strict';
const { suite, test, eq, ok, throws } = require('./harness.js');
const G = require('../src/pure/gradient.js');

suite('Gradient — builder CSS');

test('linear dengan arah keyword', () => {
  eq(
    G.buildGradientCSS({ type: 'linear', direction: 'to right', stops: [{ color: '#ff0000', pos: 0 }, { color: '#0000ff', pos: 100 }] }),
    'linear-gradient(to right, #ff0000 0%, #0000ff 100%)'
  );
});

test('linear sudut custom', () => {
  eq(
    G.buildGradientCSS({ type: 'linear', direction: 'custom', angle: 45, stops: [{ color: '#111111', pos: 0 }, { color: '#222222', pos: 100 }] }),
    'linear-gradient(45deg, #111111 0%, #222222 100%)'
  );
});

test('radial memakai circle', () => {
  eq(
    G.buildGradientCSS({ type: 'radial', stops: [{ color: '#ffffff', pos: 0 }, { color: '#000000', pos: 100 }] }),
    'radial-gradient(circle, #ffffff 0%, #000000 100%)'
  );
});

test('kurang dari 2 stop -> error', () => {
  throws(() => G.buildGradientCSS({ type: 'linear', stops: [{ color: '#ffffff', pos: 0 }] }));
  throws(() => G.buildGradientCSS({ type: 'linear', stops: [] }));
});

suite('Gradient — utilitas');

test('clampPos menahan di 0..100 dan menangani NaN', () => {
  eq(G.clampPos(-20), 0);
  eq(G.clampPos(150), 100);
  eq(G.clampPos('abc'), 0);
  eq(G.clampPos('55.5'), 55.5);
});

test('stopsToCSS multi-stop', () => {
  eq(G.stopsToCSS([{ color: '#aaa', pos: 0 }, { color: '#bbb', pos: 50 }, { color: '#ccc', pos: 100 }]),
     '#aaa 0%, #bbb 50%, #ccc 100%');
});

test('posisi di luar rentang di-clamp pada output', () => {
  eq(
    G.buildGradientCSS({ type: 'linear', direction: 'to top', stops: [{ color: '#000', pos: -10 }, { color: '#fff', pos: 999 }] }),
    'linear-gradient(to top, #000 0%, #fff 100%)'
  );
});

test('arah keyword lengkap tersedia', () => {
  eq(G.LINEAR_DIRECTIONS.length, 8);
  ok(G.LINEAR_DIRECTIONS.includes('to right'));
});

test('preset punya minimal 2 warna & hex valid', () => {
  ok(G.GRADIENT_PRESETS.length >= 5);
  G.GRADIENT_PRESETS.forEach(p => {
    ok(p.colors.length >= 2, `preset ${p.name}`);
    p.colors.forEach(c => ok(/^#[0-9a-f]{6}$/i.test(c), `warna ${c} di ${p.name}`));
  });
});


