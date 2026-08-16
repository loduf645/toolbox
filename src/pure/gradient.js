/* ============================================================
   PURE: gradient.js
   Builder kode CSS gradient + data preset — TANPA DOM.
   Diuji di tests/gradient.test.js. Dipakai oleh tools/gradient.js.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();                    // Node (unit test)
  } else {
    root.TB = root.TB || {};
    root.TB.Gradient = factory();                  // Browser (bundel)
  }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  /** Arah keyword CSS untuk linear-gradient. */
  const LINEAR_DIRECTIONS = [
    'to top', 'to top right', 'to right', 'to bottom right',
    'to bottom', 'to bottom left', 'to left', 'to top left'
  ];

  /** Preset gradient populer (nama + daftar warna). */
  const GRADIENT_PRESETS = [
    { name: 'Senja',      colors: ['#ff9966', '#ff5e62'] },
    { name: 'Lautan',     colors: ['#2E3192', '#1BFFFF'] },
    { name: 'Hutan',      colors: ['#134E5E', '#71B280'] },
    { name: 'Ungu Malam', colors: ['#41295a', '#2F0743'] },
    { name: 'Peach',      colors: ['#FFECD2', '#FCB69F'] },
    { name: 'Bumi',       colors: ['#A8421C', '#D4A574'] }
  ];

  /** Clamp posisi stop ke 0..100. @param {*} pos @returns {number} */
  function clampPos(pos) {
    const n = parseFloat(pos);
    if (!isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
  }

  /**
   * Susun daftar color stop menjadi fragmen CSS: `#fff 0%, #000 100%`.
   * @param {Array<{color:string, pos:number}>} stops
   * @returns {string}
   */
  function stopsToCSS(stops) {
    return stops.map(s => `${s.color} ${clampPos(s.pos)}%`).join(', ');
  }

  /**
   * Bangun nilai CSS gradient lengkap.
   * @param {{type:'linear'|'radial', direction?:string, angle?:number,
   *          stops:Array<{color:string, pos:number}>}} opts
   *   direction: salah satu LINEAR_DIRECTIONS, atau 'custom' untuk memakai angle.
   * @returns {string} mis. `linear-gradient(to right, #ff0000 0%, #0000ff 100%)`
   * @throws {Error} bila stop < 2
   */
  function buildGradientCSS(opts) {
    const stops = opts.stops || [];
    if (stops.length < 2) throw new Error('Minimal 2 color stop');
    const list = stopsToCSS(stops);
    if (opts.type === 'radial') return `radial-gradient(circle, ${list})`;
    const dir = (opts.direction && opts.direction !== 'custom')
      ? opts.direction
      : `${Number(opts.angle) || 0}deg`;
    return `linear-gradient(${dir}, ${list})`;
  }

  return { LINEAR_DIRECTIONS, GRADIENT_PRESETS, clampPos, stopsToCSS, buildGradientCSS };
});


