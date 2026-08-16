/* ============================================================
   PURE: text-utils.js
   Utilitas teks & angka murni — TANPA DOM, TANPA localStorage,
   TANPA event. Bisa di-require dari Node untuk unit test.
   Berisi: escape HTML, normalisasi pencarian, format angka id-ID,
   penghitung kata/karakter/baris/kalimat/paragraf, slug, dll.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();                    // Node (unit test)
  } else {
    root.TB = root.TB || {};
    root.TB.TextUtils = factory();                 // Browser (bundel)
  }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  /**
   * Escape karakter HTML berbahaya.
   * @param {*} s - input apa pun (dikoersi ke string)
   * @returns {string} teks aman untuk innerHTML
   */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  /**
   * Normalisasi teks untuk pencarian: lowercase + buang diakritik + trim.
   * @param {*} s
   * @returns {string}
   */
  function normalizeText(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  }

  /**
   * Format angka gaya Indonesia (pemisah ribuan titik, desimal koma).
   * @param {number} n
   * @param {number} [dec=2] - jumlah desimal maksimum
   * @returns {string} '-' bila bukan angka finite
   */
  function formatNumberID(n, dec = 2) {
    if(!isFinite(n)) return '-';
    return Number(n.toFixed(dec)).toLocaleString('id-ID', { maximumFractionDigits: dec });
  }

  /** @param {number} n @returns {string} dua digit dengan nol di depan */
  function pad2(n) { return String(n).padStart(2, '0'); }

  /** Jumlah kata (trim dulu; string kosong = 0). @param {string} text */
  function countWords(text) {
    const t = String(text).trim();
    return t ? t.split(/\s+/).length : 0;
  }

  /** Jumlah karakter per code point (emoji tidak terbelah). @param {string} text */
  function countCodePoints(text) { return Array.from(String(text)).length; }

  /** Jumlah baris; string kosong = 0. @param {string} text */
  function countLines(text) { return text ? String(text).split('\n').length : 0; }

  /**
   * Estimasi jumlah kalimat (dihitung dari pemutus . ! ?).
   * Teks tak kosong tanpa pemutus dihitung 1 kalimat.
   * @param {string} trimmedText - teks yang sudah di-trim
   */
  function countSentences(trimmedText) {
    return trimmedText ? (trimmedText.match(/[.!?]+(\s|$)/g) || []).length || 1 : 0;
  }

  /** Jumlah paragraf (blok dipisah baris kosong). @param {string} trimmedText */
  function countParagraphs(trimmedText) {
    return trimmedText ? String(trimmedText).split(/\n+/).filter(p => p.trim()).length : 0;
  }

  /**
   * Estimasi waktu baca dalam DETIK (dibulatkan ke atas).
   * @param {number} words - jumlah kata
   * @param {number} [wpm=200] - kecepatan baca kata/menit
   */
  function readingTimeSeconds(words, wpm = 200) {
    return Math.ceil(words / wpm * 60);
  }

  /** Pecah teks jadi baris, trim tiap baris, buang yang kosong. @param {string} text */
  function splitNonEmptyLines(text) {
    return String(text).split('\n').map(s => s.trim()).filter(Boolean);
  }

  /**
   * Konversi judul/teks menjadi slug URL.
   * @param {string} text
   * @param {string} [sep='-'] - pemisah ('-' atau '_')
   * @param {string} [casing='lower'] - 'lower' | 'upper'
   * @returns {string} slug (bisa kosong bila tidak ada karakter valid)
   */
  function slugify(text, sep = '-', casing = 'lower') {
    let s = String(text).trim().replace(/\s+/g, sep).replace(/[^a-zA-Z0-9\-_]/g, '');
    s = s.replace(new RegExp(`\\${sep}+`, 'g'), sep);
    s = s.replace(new RegExp(`^\\${sep}+|\\${sep}+$`, 'g'), '');
    return casing === 'lower' ? s.toLowerCase() : s.toUpperCase();
  }

  return {
    escapeHtml, normalizeText, formatNumberID, pad2,
    countWords, countCodePoints, countLines, countSentences, countParagraphs,
    readingTimeSeconds, splitNonEmptyLines, slugify
  };
});


