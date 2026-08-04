/* ============================================================
   PURE: search-engine.js
   Mesin pencarian tool — bagian inti yang MURNI (tanpa DOM & tanpa
   localStorage), sehingga bisa di-unit-test. Diuji di tests/search.test.js
   - multi-field, multi-token, fuzzy (subsequence + typo tolerant)
   Data TOOLS / CATEGORIES / ALIASES diinjeksikan lewat parameter `ctx`
   agar fungsi tetap murni dan mudah di-test dengan fixture kecil.
   Bagian UI (riwayat, panel, keyboard nav) ada di core/search.js.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory(require('./text-utils.js'));   // Node (unit test)
  } else {
    root.TB = root.TB || {};
    root.TB.SearchEngine = factory(root.TB.TextUtils);      // Browser (bundel)
  }
})(typeof self !== 'undefined' ? self : globalThis, function (TU) {
  'use strict';

  const norm = TU.normalizeText;

  /* Cari kemunculan token sebagai substring -> daftar range [start,end) */
  function substrRanges(text, token){
    const t = norm(text), out = [];
    let i = t.indexOf(token);
    while(i !== -1 && token){ out.push([i, i+token.length]); i = t.indexOf(token, i+token.length); }
    return out;
  }

  /* Fuzzy subsequence: semua huruf token muncul berurutan (boleh berjarak).
     Mengembalikan {score, ranges} atau null. */
  function fuzzyMatch(text, token){
    const t = norm(text);
    if(!token) return null;
    let ti = 0, prev = -2, score = 0, gaps = 0;
    const ranges = [];
    for(const ch of token){
      const idx = t.indexOf(ch, ti);
      if(idx === -1) return null;
      if(idx === prev + 1){ score += 6; const last = ranges[ranges.length-1]; last[1] = idx+1; }
      else { score += 2; gaps++; ranges.push([idx, idx+1]); }
      if(idx === 0 || /[\s\-_/]/.test(t[idx-1])) score += 4; // bonus awal kata
      prev = idx; ti = idx + 1;
    }
    // tolak match yang terlalu berserakan (kualitas > kuantitas)
    const span = ranges[ranges.length-1][1] - ranges[0][0];
    if(gaps > Math.ceil(token.length / 2)) return null;
    if(span > token.length * 3 + 4) return null;
    return { score: score - gaps * 1.5, ranges };
  }

  /* Levenshtein dibatasi (untuk toleransi typo per-kata) */
  function editDistance(a, b, max){
    if(Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({length: b.length+1}, (_,i) => i);
    for(let i = 1; i <= a.length; i++){
      const cur = [i]; let best = i;
      for(let j = 1; j <= b.length; j++){
        cur[j] = Math.min(prev[j]+1, cur[j-1]+1, prev[j-1] + (a[i-1] === b[j-1] ? 0 : 1));
        if(cur[j] < best) best = cur[j];
      }
      if(best > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  }

  function typoHit(text, token){
    if(token.length < 4) return false;
    const max = token.length <= 5 ? 1 : 2;
    return norm(text).split(/[\s\-_/,.]+/).some(w =>
      w.length >= token.length - max && editDistance(w, token, max) <= max);
  }

  function mergeRanges(ranges){
    if(!ranges.length) return [];
    const s = ranges.slice().sort((a,b) => a[0]-b[0]), out = [s[0].slice()];
    for(let i = 1; i < s.length; i++){
      const last = out[out.length-1];
      if(s[i][0] <= last[1]) last[1] = Math.max(last[1], s[i][1]);
      else out.push(s[i].slice());
    }
    return out;
  }

  /* Sorot range pada teks asli (sudah di-escape, aman dari XSS) */
  function highlight(text, ranges){
    if(!ranges || !ranges.length) return TU.escapeHtml(text);
    let out = '', pos = 0;
    for(const [a,b] of mergeRanges(ranges)){
      if(a >= text.length) break;
      const end = Math.min(b, text.length);
      out += TU.escapeHtml(text.slice(pos, a)) + '<mark>' + TU.escapeHtml(text.slice(a, end)) + '</mark>';
      pos = end;
    }
    return out + TU.escapeHtml(text.slice(pos));
  }

  /**
   * Skoring satu tool terhadap satu token.
   * @param {object} tool - {id,name,cat,desc}
   * @param {string} token - token yang sudah dinormalkan
   * @param {object} ctx - {categories:[{id,name}], aliases:{id:[...]}}
   * @returns {?{score:number, matches:{name:Array,desc:Array}}} null bila tak cocok
   */
  function scoreToken(tool, token, ctx){
    const catName = ((ctx.categories || []).find(c => c.id === tool.cat) || {}).name || tool.cat;
    const aliases = (ctx.aliases || {})[tool.id] || [];
    const m = { name: [], desc: [] };
    let score = 0, matched = false;

    const nameHits = substrRanges(tool.name, token);
    if(nameHits.length){
      matched = true; m.name.push(...nameHits);
      score += norm(tool.name).startsWith(token) ? 120 : (nameHits[0][0] === 0 ? 110 : 80);
      score += Math.round((token.length / Math.max(norm(tool.name).length,1)) * 20);
    }
    if(!matched && substrRanges(tool.id, token).length){ matched = true; score += 70; }
    const aliasHit = aliases.find(a => norm(a).includes(token));
    if(aliasHit){ matched = true; score += norm(aliasHit).startsWith(token) ? 65 : 45; }
    if(substrRanges(catName, token).length){ matched = true; score += 30; }
    const descHits = substrRanges(tool.desc, token);
    if(descHits.length){ matched = true; m.desc.push(...descHits); score += 22; }

    if(!matched){ // fuzzy fallback
      const fName = fuzzyMatch(tool.name, token);
      if(fName){ matched = true; m.name.push(...fName.ranges); score += 18 + fName.score; }
      if(!matched && aliases.some(a => fuzzyMatch(a, token))){ matched = true; score += 12; }
      if(!matched && (typoHit(tool.name, token) || aliases.some(a => typoHit(a, token)))){ matched = true; score += 15; }
      // catatan: deskripsi sengaja TIDAK di-fuzzy — terlalu panjang, menghasilkan
      // banyak false positive. Substring pada deskripsi sudah ditangani di atas.
    }
    return matched ? { score, matches: m } : null;
  }

  /**
   * Semua token harus cocok (AND). Hasil diurutkan menurun berdasar skor.
   * @param {string} query @param {object[]} pool - daftar tool
   * @param {object} ctx - {categories, aliases}
   * @returns {Array<{tool:object, score:number, matches:{name:Array,desc:Array}}>}
   */
  function searchTools(query, pool, ctx){
    const tokens = norm(query).split(/\s+/).filter(Boolean);
    if(!tokens.length) return [];
    pool = pool || []; ctx = ctx || {};   // defensif: pool/ctx kosong = hasil kosong
    const results = [];
    for(const tool of pool){
      let total = 0; const matches = { name: [], desc: [] }; let ok = true;
      for(const tk of tokens){
        const r = scoreToken(tool, tk, ctx);
        if(!r){ ok = false; break; }
        total += r.score; matches.name.push(...r.matches.name); matches.desc.push(...r.matches.desc);
      }
      if(ok) results.push({ tool, score: total, matches });
    }
    return results.sort((a,b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name));
  }

  /**
   * Saran "mungkin maksud Anda": token terdekat dari kamus alias+nama.
   * @param {string} query @param {object[]} tools @param {object} aliases
   * @param {number} [limit=3]
   * @returns {string[]} daftar istilah yang disarankan
   */
  function suggestTerms(query, tools, aliases, limit = 3){
    tools = tools || []; aliases = aliases || {};   // defensif
    const tokens = norm(query).split(/\s+/).filter(Boolean);
    const last = tokens[tokens.length-1] || '';
    const vocab = new Set();
    tools.forEach(t => {
      vocab.add(t.name.toLowerCase());
      (aliases[t.id] || []).forEach(a => vocab.add(a));
    });
    const scored = [];
    for(const term of vocab){
      const n = norm(term);
      if(!n || n === last) continue;
      // toleransi typo menyesuaikan panjang kata (kata panjang boleh salah lebih banyak)
      const tol = last.length >= 8 ? 3 : last.length >= 5 ? 2 : 1;
      let d;
      if(last.length >= 2 && n.startsWith(last)) d = 0.5;
      else if(last.length >= 3 && n.includes(last)) d = 0.75;
      else d = Math.min(
        editDistance(n, last, tol),
        ...n.split(' ').map(w => editDistance(w, last, tol))
      );
      if(d <= tol) scored.push({ term, d });
    }
    scored.sort((a,b) => a.d - b.d || a.term.length - b.term.length);
    const seen = new Set(), out = [];
    for(const s of scored){
      const key = norm(s.term);
      if(seen.has(key)) continue;
      seen.add(key); out.push(s.term);
      if(out.length >= limit) break;
    }
    return out;
  }

  return {
    norm, substrRanges, fuzzyMatch, editDistance, typoHit, mergeRanges,
    highlight, scoreToken, searchTools, suggestTerms
  };
});
