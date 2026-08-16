/* ============================================================
   PURE: color-helpers.js
   Konversi warna & generator palette — TANPA DOM.
   Diuji di tests/color.test.js. Dipakai oleh tools/color.js.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();                    // Node (unit test)
  } else {
    root.TB = root.TB || {};
    root.TB.Color = factory();                     // Browser (bundel)
  }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  /**
   * Normalisasi HEX: terima '#abc', 'abc', '#AABBCC' -> '#aabbcc'.
   * @param {string} hex @returns {?string} null bila tidak valid
   */
  function normalizeHex(hex) {
    let h = String(hex).trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(h)) h = h.split('').map(c => c + c).join('');
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    return '#' + h.toLowerCase();
  }

  /** HEX -> RGB (0..255). @param {string} hex @returns {?{r:number,g:number,b:number}} */
  function hexToRgb(hex) {
    const n = normalizeHex(hex);
    if (!n) return null;
    return { r: parseInt(n.slice(1, 3), 16), g: parseInt(n.slice(3, 5), 16), b: parseInt(n.slice(5, 7), 16) };
  }

  /** RGB (0..255, boleh pecahan) -> HEX lowercase. */
  function rgbToHex(r, g, b) {
    const p = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return '#' + p(r) + p(g) + p(b);
  }

  /**
   * RGB (0..255) -> HSL.
   * @returns {{h:number, s:number, l:number}} h: 0..360, s/l: 0..100
   */
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h, s: s * 100, l: l * 100 };
  }

  /**
   * HSL -> RGB.
   * @param {number} h 0..360 (di-wrap otomatis) @param {number} s 0..100 @param {number} l 0..100
   * @returns {{r:number,g:number,b:number}} masing-masing 0..255 (dibulatkan)
   */
  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let rp, gp, bp;
    if (h < 60)       { rp = c; gp = x; bp = 0; }
    else if (h < 120) { rp = x; gp = c; bp = 0; }
    else if (h < 180) { rp = 0; gp = c; bp = x; }
    else if (h < 240) { rp = 0; gp = x; bp = c; }
    else if (h < 300) { rp = x; gp = 0; bp = c; }
    else              { rp = c; gp = 0; bp = x; }
    return { r: Math.round((rp + m) * 255), g: Math.round((gp + m) * 255), b: Math.round((bp + m) * 255) };
  }

  /** Geser hue sejumlah derajat (wrap 0..360), saturasi & lightness tetap. @returns {string} HEX baru */
  function shiftHue(hex, deg) {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return rgbToHex(...Object.values(hslToRgb(hsl.h + deg, hsl.s, hsl.l)));
  }

  /** Ubah lightness (hue & saturasi tetap). @param {number} lightness 0..100 @returns {string} HEX */
  function withLightness(hex, lightness) {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const l = Math.max(0, Math.min(100, lightness));
    return rgbToHex(...Object.values(hslToRgb(hsl.h, hsl.s, l)));
  }

  /** Format tampilan: `rgb(r, g, b)`. */
  function formatRgb(rgb) { return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`; }

  /** Format tampilan: `hsl(h, s%, l%)` (dibulatkan). */
  function formatHsl(hsl) { return `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`; }

  /**
   * Generate semua skema palette untuk satu warna dasar.
   * @param {string} hex
   * @returns {{complementary:string[], analogous:string[], triadic:string[],
   *            monochromatic:string[], shadesTints:string[]}}
   */
  function generatePalettes(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    // Monokromatik: 5 tingkat lightness tetap, hue & saturasi sama.
    const monochromatic = [12, 31, 50, 69, 88].map(l => rgbToHex(...Object.values(hslToRgb(hsl.h, hsl.s, l))));
    // Shades (menuju hitam) & tints (menuju putih) relatif terhadap lightness warna dasar.
    const shades = [0.25, 0.5, 0.75, 1].map(f => withLightness(hex, hsl.l * f));
    const tints = [0.25, 0.5, 0.75, 1].map(f => withLightness(hex, hsl.l + (100 - hsl.l) * f));
    return {
      complementary: [hex, shiftHue(hex, 180)],
      analogous: [shiftHue(hex, -30), hex, shiftHue(hex, 30)],
      triadic: [hex, shiftHue(hex, 120), shiftHue(hex, 240)],
      monochromatic,
      shadesTints: shades.concat(tints)
    };
  }

  return {
    normalizeHex, hexToRgb, rgbToHex, rgbToHsl, hslToRgb,
    shiftHue, withLightness, formatRgb, formatHsl, generatePalettes
  };
});


