/* ============================================================
   PURE: base64.js
   Encode/decode Base64 murni — TANPA DOM (TextEncoder/TextDecoder
   adalah API runtime, bukan DOM). Diuji di tests/base64.test.js
   Dipakai oleh tools/base64.js dan tools/imgbase64.js.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();                    // Node (unit test)
  } else {
    root.TB = root.TB || {};
    root.TB.Base64 = factory();                    // Browser (bundel)
  }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  /**
   * Encode array byte menjadi string Base64 (padding '=').
   * Implementasi manual — tidak bergantung btoa, sehingga jalan di Node & browser.
   * @param {Uint8Array|number[]} bytes
   * @returns {string}
   */
  function bytesToBase64(bytes) {
    let out = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const b0 = bytes[i], b1 = bytes[i + 1], b2 = bytes[i + 2];
      out += B64_CHARS[b0 >> 2];
      out += B64_CHARS[((b0 & 3) << 4) | (b1 === undefined ? 0 : b1 >> 4)];
      out += b1 === undefined ? '=' : B64_CHARS[((b1 & 15) << 2) | (b2 === undefined ? 0 : b2 >> 6)];
      out += b2 === undefined ? '=' : B64_CHARS[b2 & 63];
    }
    return out;
  }

  /** Buang whitespace/baris baru (umum pada Base64 yang diformat). @param {string} input */
  function cleanInput(input) {
    return String(input).replace(/\s+/g, '');
  }

  /**
   * Decode string Base64 menjadi array byte.
   * @param {string} input
   * @returns {Uint8Array}
   * @throws {Error} pesan Bahasa Indonesia bila format tidak valid
   */
  function base64ToBytes(input) {
    const s = cleanInput(input);
    if (s.length === 0) return new Uint8Array(0);
    if (s.length % 4 !== 0) throw new Error('Panjang Base64 tidak valid (harus kelipatan 4 karakter)');
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(s)) throw new Error('Mengandung karakter di luar alfabet Base64');
    const pad = s.endsWith('==') ? 2 : s.endsWith('=') ? 1 : 0;
    const out = new Uint8Array((s.length / 4) * 3 - pad);
    let o = 0;
    for (let i = 0; i < s.length; i += 4) {
      const n = (B64_CHARS.indexOf(s[i]) << 18) |
                (B64_CHARS.indexOf(s[i + 1]) << 12) |
                ((s[i + 2] === '=' ? 0 : B64_CHARS.indexOf(s[i + 2])) << 6) |
                (s[i + 3] === '=' ? 0 : B64_CHARS.indexOf(s[i + 3]));
      if (o < out.length) out[o++] = (n >> 16) & 255;
      if (o < out.length) out[o++] = (n >> 8) & 255;
      if (o < out.length) out[o++] = n & 255;
    }
    return out;
  }

  /**
   * Encode teks (UTF-8 — aman untuk Unicode & emoji) menjadi Base64.
   * @param {string} text @returns {string}
   */
  function encode(text) {
    return bytesToBase64(new TextEncoder().encode(String(text)));
  }

  /**
   * Decode Base64 menjadi teks UTF-8.
   * @param {string} input @returns {string}
   * @throws {Error} bila format Base64 salah atau byte bukan UTF-8 valid
   */
  function decode(input) {
    const bytes = base64ToBytes(input);
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch (e) {
      throw new Error('Base64 valid, tetapi isinya bukan teks UTF-8 (mungkin data biner)');
    }
  }

  /**
   * Deteksi cepat apakah string terlihat seperti Base64 valid
   * (dipakai untuk hints otomatis pada mode Decode).
   * @param {string} input @returns {boolean}
   */
  function isLikelyBase64(input) {
    const s = cleanInput(input);
    return s.length > 0 && s.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(s);
  }

  /**
   * Susun Data URI lengkap.
   * @param {string} mime - mis. 'image/png' @param {string} base64
   * @returns {string} `data:<mime>;base64,<data>`
   */
  function dataUri(mime, base64) {
    return `data:${mime};base64,${base64}`;
  }

  return { bytesToBase64, base64ToBytes, encode, decode, isLikelyBase64, cleanInput, dataUri };
});
