/* ============================================================
   PURE: text-cleaner.js
   Operasi pembersihan teks murni — TANPA DOM.
   Diuji di tests/text-cleaner.test.js
   Dipakai oleh tools/cleaner.js (Text Cleaner).
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();                    // Node (unit test)
  } else {
    root.TB = root.TB || {};
    root.TB.TextCleaner = factory();               // Browser (bundel)
  }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  /** Pecah teks menjadi baris (mendukung CRLF). @param {string} t @returns {string[]} */
  function toLines(t) { return String(t).replace(/\r\n?/g, '\n').split('\n'); }

  /** Hapus spasi/tab berlebih di dalam baris menjadi satu spasi. @param {string} t */
  function removeExtraSpaces(t) {
    return toLines(t).map(l => l.replace(/[^\S\n]+/g, ' ')).join('\n');
  }

  /** Buang baris yang kosong atau hanya berisi whitespace. @param {string} t */
  function removeEmptyLines(t) {
    return toLines(t).filter(l => l.trim() !== '').join('\n');
  }

  /** Buang baris duplikat, kemunculan pertama dipertahankan (case-sensitive). @param {string} t */
  function removeDuplicateLines(t) {
    const seen = new Set();
    return toLines(t).filter(l => {
      const key = l.trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).join('\n');
  }

  /** Trim whitespace di awal & akhir tiap baris, serta di ujung teks. @param {string} t */
  function trimWhitespace(t) {
    return toLines(t).map(l => l.trim()).join('\n').trim();
  }

  /**
   * Urutkan baris secara alfabetis memakai perbandingan locale id-ID
   * (huruf besar/kecil & aksen diperlakukan natural).
   * @param {string} t @param {'asc'|'desc'} [dir='asc'] @returns {string}
   */
  function sortLines(t, dir) {
    const cmp = (a, b) => a.localeCompare(b, 'id', { sensitivity: 'base', numeric: true });
    const lines = toLines(t).slice().sort(cmp);
    if (dir === 'desc') lines.reverse();
    return lines.join('\n');
  }

  /** Gabungkan semua baris menjadi satu baris, dipisah satu spasi. @param {string} t */
  function removeLineBreaks(t) {
    return toLines(t).join(' ').replace(/[^\S\n]+/g, ' ').trim();
  }

  /**
   * Buang karakter spesial — sisakan huruf, angka, spasi, dan baris baru.
   * Mendukung Unicode (huruf beraksen tetap dipertahankan).
   * @param {string} t @returns {string}
   */
  function removeSpecialChars(t) {
    return String(t).replace(/[^\p{L}\p{N}\s]/gu, '');
  }

  /**
   * Daftar opsi pembersihan (urutan = urutan eksekusi pipeline).
   * Tiap opsi: {id, label, hint, fn}. fn: (text:string) => string.
   * Catatan: 'sortAsc' dan 'sortDesc' saling meniadakan — bila keduanya
   * aktif, hasil akhir mengikuti 'sortDesc' karena dijalankan belakangan.
   */
  const OPTIONS = [
    { id:'extraSpaces',  label:'Hapus spasi berlebih',   hint:'Spasi/tab beruntun menjadi satu spasi.',           fn: removeExtraSpaces },
    { id:'trim',         label:'Trim whitespace',        hint:'Buang spasi di awal & akhir tiap baris.',          fn: trimWhitespace },
    { id:'emptyLines',   label:'Hapus baris kosong',     hint:'Baris tanpa isi dibuang.',                         fn: removeEmptyLines },
    { id:'duplicates',   label:'Hapus baris duplikat',   hint:'Baris yang sama hanya disisakan satu.',            fn: removeDuplicateLines },
    { id:'specialChars', label:'Hapus karakter spesial', hint:'Sisakan huruf, angka, dan spasi saja.',            fn: removeSpecialChars },
    { id:'sortAsc',      label:'Urutkan baris A–Z',      hint:'Urutkan baris menaik secara alfabetis.',           fn: t => sortLines(t, 'asc') },
    { id:'sortDesc',     label:'Urutkan baris Z–A',      hint:'Urutkan baris menurun secara alfabetis.',          fn: t => sortLines(t, 'desc') },
    { id:'lineBreaks',   label:'Hapus baris baru',       hint:'Gabungkan semua baris menjadi satu paragraf.',     fn: removeLineBreaks }
  ];

  /** Peta id -> opsi, untuk lookup cepat. */
  const OPTION_MAP = OPTIONS.reduce((acc, o) => { acc[o.id] = o; return acc; }, {});

  /**
   * Jalankan beberapa opsi pembersihan sekaligus, mengikuti urutan OPTIONS
   * (bukan urutan pemilihan pengguna) agar hasil selalu deterministik.
   * Id yang tidak dikenal diabaikan.
   * @param {string} text
   * @param {string[]|Object<string,boolean>} selected - array id atau map {id:true}
   * @returns {string}
   */
  function clean(text, selected) {
    const active = Array.isArray(selected)
      ? new Set(selected)
      : new Set(Object.keys(selected || {}).filter(k => selected[k]));
    return OPTIONS.reduce((acc, o) => active.has(o.id) ? o.fn(acc) : acc, String(text));
  }

  return {
    OPTIONS, OPTION_MAP, clean,
    removeExtraSpaces, removeEmptyLines, removeDuplicateLines, trimWhitespace,
    sortLines, removeLineBreaks, removeSpecialChars
  };
});
