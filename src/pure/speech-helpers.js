/* ============================================================
   PURE: speech-helpers.js
   Helper Text-to-Speech murni — TANPA DOM & tanpa Web Speech API.
   Berisi: clamp parameter, pemecah teks panjang jadi potongan aman,
   pengelompokan voice per bahasa, dan label bahasa.
   Dipakai oleh tools/tts.js.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();                    // Node (unit test)
  } else {
    root.TB = root.TB || {};
    root.TB.Speech = factory();                    // Browser (bundel)
  }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  /* Batas parameter SpeechSynthesisUtterance sesuai spesifikasi Web Speech API. */
  const LIMITS = {
    rate:   { min: 0.5, max: 2,  step: 0.1,  def: 1 },
    pitch:  { min: 0,   max: 2,  step: 0.1,  def: 1 },
    volume: { min: 0,   max: 1,  step: 0.05, def: 1 }
  };

  /** Panjang maksimal satu potongan ucapan (Chrome memotong utterance panjang). */
  const CHUNK_SIZE = 200;

  /**
   * Batasi nilai ke rentang parameter tertentu; nilai tidak valid -> default.
   * @param {*} value @param {'rate'|'pitch'|'volume'} kind @returns {number}
   */
  function clampParam(value, kind) {
    const lim = LIMITS[kind];
    if (!lim) return Number(value) || 0;
    const n = parseFloat(value);
    if (!isFinite(n)) return lim.def;
    return Math.max(lim.min, Math.min(lim.max, n));
  }

  /**
   * Pecah teks panjang menjadi potongan <= maxLen tanpa memotong kata.
   * Prioritas pemisah: batas kalimat -> spasi -> paksa potong.
   * Teks TIDAK pernah dibuang; gabungan seluruh potongan = teks asli (trim).
   * @param {string} text @param {number} [maxLen=CHUNK_SIZE] @returns {string[]}
   */
  function chunkText(text, maxLen = CHUNK_SIZE) {
    const src = String(text).replace(/\r\n?/g, '\n').trim();
    if (!src) return [];
    const limit = Math.max(20, Math.floor(maxLen) || CHUNK_SIZE);

    // Pecah dulu per kalimat (mempertahankan tanda baca & baris baru).
    const sentences = src.match(/[^.!?\n]+[.!?]*\n*|\n+/g) || [src];
    const chunks = [];
    let buf = '';

    const push = s => { const v = s.trim(); if (v) chunks.push(v); };

    for (const raw of sentences) {
      let s = raw;
      // Kalimat tunggal yang terlalu panjang dipotong di batas spasi.
      while (s.length > limit) {
        const slice = s.slice(0, limit);
        const cut = slice.lastIndexOf(' ');
        const at = cut > limit * 0.5 ? cut : limit;
        push(buf); buf = '';
        push(slice.slice(0, at));
        s = s.slice(at);
      }
      if ((buf + s).length > limit) { push(buf); buf = s; }
      else { buf += s; }
    }
    push(buf);
    return chunks;
  }

  /**
   * Ambil daftar bahasa unik dari daftar voice, terurut.
   * @param {Array<{lang:string}>} voices
   * @returns {string[]} mis. ['en-US', 'id-ID']
   */
  function uniqueLangs(voices) {
    const set = new Set((voices || []).map(v => v && v.lang).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b));
  }

  /**
   * Saring voice berdasarkan kode bahasa. 'all' -> semua voice.
   * @param {Array<{lang:string}>} voices @param {string} lang
   * @returns {Array} voice yang cocok
   */
  function filterByLang(voices, lang) {
    if (!lang || lang === 'all') return (voices || []).slice();
    return (voices || []).filter(v => v && v.lang === lang);
  }

  /**
   * Label bahasa yang ramah dibaca; memakai Intl.DisplayNames bila tersedia.
   * @param {string} lang mis. 'id-ID' @returns {string} mis. 'Indonesia (id-ID)'
   */
  function langLabel(lang) {
    if (!lang) return 'Tidak diketahui';
    try {
      const dn = new Intl.DisplayNames(['id'], { type: 'language' });
      const name = dn.of(lang);
      return name && name !== lang ? `${name} (${lang})` : lang;
    } catch (e) {
      return lang;
    }
  }

  /**
   * Pilih voice default: utamakan bahasa Indonesia, lalu voice default browser,
   * lalu voice pertama. Mengembalikan null bila daftar kosong.
   * @param {Array<{lang:string, default?:boolean}>} voices @returns {Object|null}
   */
  function pickDefaultVoice(voices) {
    const list = voices || [];
    if (!list.length) return null;
    return list.find(v => v && /^id\b/i.test(v.lang || '')) ||
           list.find(v => v && v.default) ||
           list[0];
  }

  return { LIMITS, CHUNK_SIZE, clampParam, chunkText, uniqueLangs, filterByLang, langLabel, pickDefaultVoice };
});
