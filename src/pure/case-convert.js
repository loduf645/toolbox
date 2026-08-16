/* ============================================================
   PURE: case-convert.js
   Konversi huruf/kapitalisasi murni — TANPA DOM.
   Diuji di tests/case-convert.test.js
   Dipakai oleh tools/case.js (Case Converter).
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();                    // Node (unit test)
  } else {
    root.TB = root.TB || {};
    root.TB.CaseConvert = factory();               // Browser (bundel)
  }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  /**
   * Pecah teks menjadi daftar "kata" untuk gaya gabungan
   * (camel/pascal/snake/kebab). Pemisah: spasi, tanda baca, underscore,
   * strip, dan batas camelCase / PascalCase / rentetan HURUF+kata.
   * @param {string} text
   * @returns {string[]} kata-kata dalam huruf kecil (tanpa entri kosong)
   */
  function splitWords(text) {
    return String(text)
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')        // camelCase  -> camel Case
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')     // HTTPServer -> HTTP Server
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean)
      .map(w => w.toLowerCase());
  }

  /** Kapitalkan huruf pertama sebuah kata, sisanya dibiarkan. @param {string} w */
  function upperFirst(w) {
    if (!w) return '';
    const chars = Array.from(w);
    return chars[0].toUpperCase() + chars.slice(1).join('');
  }

  /* ---------- Mode dasar (mempertahankan spasi & tanda baca) ---------- */

  /** HURUF BESAR SEMUA. @param {string} t @returns {string} */
  function toUpperCase(t) { return String(t).toUpperCase(); }

  /** huruf kecil semua. @param {string} t @returns {string} */
  function toLowerCase(t) { return String(t).toLowerCase(); }

  /**
   * Title Case — setiap kata diawali huruf kapital, sisanya kecil.
   * Spasi & baris baru asli dipertahankan.
   * @param {string} t @returns {string}
   */
  function toTitleCase(t) {
    return String(t).replace(/\p{L}[\p{L}\p{N}'’]*/gu,
      w => upperFirst(w.toLowerCase()));
  }

  /**
   * Sentence case — huruf pertama tiap kalimat kapital, sisanya kecil.
   * Batas kalimat: awal teks, setelah . ! ? atau baris baru.
   * @param {string} t @returns {string}
   */
  function toSentenceCase(t) {
    const lower = String(t).toLowerCase();
    return lower.replace(/(^|[.!?]\s+|\n\s*)(\p{L})/gu,
      (m, lead, ch) => lead + ch.toUpperCase());
  }

  /**
   * aLtErNaTiNg CaSe — huruf berselang kecil/besar.
   * Hanya huruf yang dihitung, sehingga spasi/tanda baca tidak menggeser pola.
   * @param {string} t @returns {string}
   */
  function toAlternatingCase(t) {
    let i = 0;
    return Array.from(String(t)).map(ch => {
      if (ch.toLowerCase() === ch.toUpperCase()) return ch;  // bukan huruf
      const out = i % 2 === 0 ? ch.toLowerCase() : ch.toUpperCase();
      i++;
      return out;
    }).join('');
  }

  /* ---------- Mode gabungan (identifier) ---------- */

  /** camelCase. @param {string} t @returns {string} */
  function toCamelCase(t) {
    const w = splitWords(t);
    if (!w.length) return '';
    return w[0] + w.slice(1).map(upperFirst).join('');
  }

  /** PascalCase. @param {string} t @returns {string} */
  function toPascalCase(t) {
    return splitWords(t).map(upperFirst).join('');
  }

  /** snake_case. @param {string} t @returns {string} */
  function toSnakeCase(t) { return splitWords(t).join('_'); }

  /** kebab-case. @param {string} t @returns {string} */
  function toKebabCase(t) { return splitWords(t).join('-'); }

  /**
   * Daftar mode Case Converter. Tiap mode: {label, hint, fn}.
   * fn: (text:string) => string — murni, tanpa DOM.
   */
  const MODES = {
    upper: {
      label: 'UPPERCASE',
      hint: 'Mengubah seluruh huruf menjadi kapital — contoh: “halo dunia” → “HALO DUNIA”.',
      fn: toUpperCase
    },
    lower: {
      label: 'lowercase',
      hint: 'Mengubah seluruh huruf menjadi kecil — contoh: “Halo Dunia” → “halo dunia”.',
      fn: toLowerCase
    },
    title: {
      label: 'Title Case',
      hint: 'Setiap kata diawali huruf kapital — contoh: “halo dunia” → “Halo Dunia”.',
      fn: toTitleCase
    },
    sentence: {
      label: 'Sentence case',
      hint: 'Huruf pertama tiap kalimat kapital, sisanya kecil — cocok untuk paragraf.',
      fn: toSentenceCase
    },
    alternating: {
      label: 'aLtErNaTiNg',
      hint: 'Huruf berselang kecil dan besar — contoh: “halo” → “hAlO”.',
      fn: toAlternatingCase
    },
    camel: {
      label: 'camelCase',
      hint: 'Digabung tanpa spasi, kata pertama kecil — contoh: “nama depan user” → “namaDepanUser”.',
      fn: toCamelCase
    },
    pascal: {
      label: 'PascalCase',
      hint: 'Digabung tanpa spasi, semua kata kapital — contoh: “nama depan user” → “NamaDepanUser”.',
      fn: toPascalCase
    },
    snake: {
      label: 'snake_case',
      hint: 'Kata dipisah underscore, huruf kecil — contoh: “Nama Depan” → “nama_depan”.',
      fn: toSnakeCase
    },
    kebab: {
      label: 'kebab-case',
      hint: 'Kata dipisah strip, huruf kecil — contoh: “Nama Depan” → “nama-depan”.',
      fn: toKebabCase
    }
  };

  /**
   * Konversi teks memakai id mode. Mode tidak dikenal -> teks dikembalikan apa adanya.
   * @param {string} text @param {string} mode @returns {string}
   */
  function convert(text, mode) {
    const m = MODES[mode];
    return m ? m.fn(String(text)) : String(text);
  }

  return {
    MODES, convert, splitWords,
    toUpperCase, toLowerCase, toTitleCase, toSentenceCase, toAlternatingCase,
    toCamelCase, toPascalCase, toSnakeCase, toKebabCase
  };
});
