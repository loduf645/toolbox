/* ============================================================
   PURE: text-transforms.js
   Transformasi teks murni — TANPA DOM. Diuji di tests/text-transforms.test.js
   Berisi: mode Text Transformer (reverse/mirror/flip dll) + operasi
   editor Markdown milik Prompt Studio (wrap, prefix, numbering, insert).
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();                    // Node (unit test)
  } else {
    root.TB = root.TB || {};
    root.TB.TextTransforms = factory();            // Browser (bundel)
  }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  /* ==========================================================
     1. TEXT TRANSFORMER — mapping Unicode
     Karakter yang tidak punya pasangan dibiarkan apa adanya.
     ========================================================== */
  const MIRROR_MAP = {
    a:'ɒ', b:'d', c:'ɔ', d:'b', e:'ɘ', f:'Ꮈ', g:'ǫ', h:'ʜ', i:'i', j:'ʝ', k:'ʞ', l:'l', m:'m', n:'n', o:'o', p:'q', q:'p', r:'ɿ', s:'s', t:'ƚ', u:'n', v:'v', w:'w', x:'x', y:'ʎ', z:'z',
    A:'Ɐ', B:'ᙠ', C:'Ɔ', D:'ᗡ', E:'Ǝ', F:'Ⅎ', G:'ᵷ', H:'H', I:'I', J:'ᒐ', K:'ꓘ', L:'Ⴊ', M:'M', N:'N', O:'O', P:'Ԁ', Q:'Ⴓ', R:'ᴚ', S:'S', T:'Ʇ', U:'∩', V:'Λ', W:'M', X:'X', Y:'⅄', Z:'Z',
    '0':'0', '1':'Ɩ', '2':'2', '3':'Ɛ', '4':'ᔭ', '5':'5', '6':'9', '7':'7', '8':'8', '9':'6',
    '.':'˙', ',':'،', "'":',', '"':'„', '!':'¡', '?':'¿', '(':')', ')':'(', '[':']', ']':'[', '{':'}', '}':'{', '<':'>', '>':'<', '/':'\\', '\\':'/', '_':'‾', '&':'⅋', ';':'؛', ':':'ː', '-':'‾'
  };

  const FLIP_MAP = {
    a:'ɐ', b:'q', c:'ɔ', d:'p', e:'ǝ', f:'ɟ', g:'ƃ', h:'ɥ', i:'ᴉ', j:'ɾ', k:'ʞ', l:'ן', m:'ɯ', n:'u', o:'o', p:'d', q:'b', r:'ɹ', s:'s', t:'ʇ', u:'n', v:'ʌ', w:'ʍ', x:'x', y:'ʎ', z:'z',
    A:'∀', B:'𐐒', C:'Ɔ', D:'ᗡ', E:'Ǝ', F:'Ⅎ', G:'⅁', H:'H', I:'I', J:'ſ', K:'ʞ', L:'˥', M:'W', N:'N', O:'O', P:'Ԁ', Q:'Ό', R:'ᴚ', S:'S', T:'⊥', U:'∩', V:'Λ', W:'M', X:'X', Y:'⅄', Z:'Z',
    '0':'0', '1':'Ɩ', '2':'ᄅ', '3':'Ɛ', '4':'ㄣ', '5':'ގ', '6':'9', '7':'ㄥ', '8':'8', '9':'6',
    '.':'˙', ',':'‘', "'":',', '"':'„', '!':'¡', '?':'¿', '(':')', ')':'(', '[':']', ']':'[', '{':'}', '}':'{', '<':'>', '>':'<', '/':'\\', '\\':'/', '_':'‾', '&':'⅋', ';':'؛', ':':'ː', '`':'‚', '*':'˙', '~':'～'
  };

  /**
   * Mode transformasi Text Transformer. Tiap mode: {hint, fn}.
   * fn: (text:string) => string — murni, tanpa DOM.
   */
  const MODES = {
    reverse: {
      hint: 'Membalik seluruh karakter — contoh: “Hello World” → “dlroW olleH”.',
      fn: t => Array.from(t).reverse().join('')
    },
    mirror: {
      hint: 'Mengubah tiap karakter ke padanan Unicode yang tampak seperti cermin. Karakter tanpa padanan dibiarkan apa adanya.',
      fn: t => Array.from(t).map(c => MIRROR_MAP[c] || c).join('')
    },
    reverseWords: {
      hint: 'Membalik urutan kata, bukan hurufnya — contoh: “Saya suka makan nasi” → “nasi makan suka Saya”.',
      fn: t => t.split(/\s+/).filter(Boolean).reverse().join(' ')
    },
    reverseEachWord: {
      hint: 'Membalik huruf di dalam tiap kata, urutan kata tetap — contoh: “Hello World” → “olleH dlroW”.',
      fn: t => t.split(/(\s+)/).map(seg => /^\s+$/.test(seg) ? seg : Array.from(seg).reverse().join('')).join('')
    },
    flip: {
      hint: 'Mengubah karakter ke Unicode upside-down lalu membalik urutannya — contoh: “Hello” → “oןןǝH”.',
      fn: t => Array.from(t).map(c => FLIP_MAP[c] || c).reverse().join('')
    }
  };

  /* ==========================================================
     2. OPERASI EDITOR MARKDOWN (Prompt Studio)
     Semua fungsi menerima (value, selStart, selEnd, ...) dan
     mengembalikan {value, start, end} — murni, mudah di-test.
     ========================================================== */

  /**
   * Bungkus seleksi dengan before/after (mis. **bold**).
   * Seleksi kosong memakai placeholder.
   * @returns {{value:string, start:number, end:number}}
   */
  function mdWrapSelection(value, s, e, before, after, placeholder){
    const core = value.slice(s, e) || placeholder;
    const nv = value.slice(0, s) + before + core + after + value.slice(e);
    return { value: nv, start: s + before.length, end: s + before.length + core.length };
  }

  /**
   * Tambah/hapus prefix pada semua baris yang tersentuh seleksi
   * (toggle: bila semua baris sudah ber-prefix, prefix dihapus).
   * @returns {{value:string, start:number, end:number}}
   */
  function mdLinePrefix(value, s, e, prefix){
    const ls = value.lastIndexOf('\n', Math.max(0, s - 1)) + 1;
    let le = value.indexOf('\n', e);
    if(le === -1) le = value.length;
    const block = value.slice(ls, le);
    const lines = block.split('\n');
    const allPrefixed = lines.every(l => l.startsWith(prefix));
    const out = lines.map(l => allPrefixed ? l.slice(prefix.length) : prefix + l).join('\n');
    const nv = value.slice(0, ls) + out + value.slice(le);
    return { value: nv, start: ls, end: ls + out.length };
  }

  /**
   * Tambah/hapus penomoran "1. 2. 3." pada baris yang tersentuh seleksi.
   * Baris kosong dibiarkan; toggle bila semua baris sudah bernomor.
   * @returns {{value:string, start:number, end:number}}
   */
  function mdNumberedList(value, s, e){
    const ls = value.lastIndexOf('\n', Math.max(0, s - 1)) + 1;
    let le = value.indexOf('\n', e);
    if(le === -1) le = value.length;
    const block = value.slice(ls, le);
    const lines = block.split('\n');
    const numbered = lines.filter(l => l.trim()).every(l => /^\d+\.\s/.test(l));
    let i = 1;
    const out = lines.map(l => {
      if(!l.trim()) return l;
      if(numbered) return l.replace(/^\d+\.\s/, '');
      return `${i++}. ${l}`;
    }).join('\n');
    const nv = value.slice(0, ls) + out + value.slice(le);
    return { value: nv, start: ls, end: ls + out.length };
  }

  /**
   * Kode inline (`...`) untuk seleksi pendek, fenced block untuk
   * seleksi multi-baris / panjang (> 24 karakter).
   * @returns {{value:string, start:number, end:number}}
   */
  function mdCodeAction(value, s, e){
    const sel = value.slice(s, e);
    if(!sel) return mdWrapSelection(value, s, e, '`', '`', 'kode');
    if(sel.includes('\n') || sel.length > 24){
      const fence = '\n```\n' + sel + '\n```\n';
      const nv = value.slice(0, s) + fence + value.slice(e);
      const pos = s + fence.length;
      return { value: nv, start: pos, end: pos };
    }
    return mdWrapSelection(value, s, e, '`', '`');
  }

  /**
   * Sisipkan teks pada posisi kursor, diapit baris baru bila perlu.
   * @returns {{value:string, start:number, end:number}} posisi akhir kursor
   */
  function mdInsertAtCursor(value, s, e, text){
    const before = s > 0 && value[s - 1] !== '\n' ? '\n' : '';
    const after = e < value.length && value[e] !== '\n' ? '\n' : '';
    const nv = value.slice(0, s) + before + text + after + value.slice(e);
    const pos = s + before.length + text.length;
    return { value: nv, start: pos, end: pos };
  }

  return {
    MIRROR_MAP, FLIP_MAP, MODES,
    mdWrapSelection, mdLinePrefix, mdNumberedList, mdCodeAction, mdInsertAtCursor
  };
});
