/* ============================================================
   PURE: diff-engine.js
   Inti algoritma diff (Myers O((n+m)·d)) — TANPA DOM.
   Diuji di tests/diff.test.js
   Mengembalikan struktur data netral ({type,text}); render HTML
   dilakukan di tools/diff.js.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();                    // Node (unit test)
  } else {
    root.TB = root.TB || {};
    root.TB.Diff = factory();                      // Browser (bundel)
  }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  /* ---------- konfigurasi per mode ----------
     maxUnits : batas jumlah unit per sisi (rem darurat agar tab tidak membeku)
     maxD     : batas jumlah perbedaan yang masih dicari algoritma Myers;
                di atas itu hasil disederhanakan jadi "blok lama diganti blok baru".
     key      : pemetaan unit -> nilai pembanding (baris dipetakan ke ID angka). */
  const MODES = {
    word: {
      label: 'kata',
      hint: 'Membandingkan kata per kata — cocok untuk artikel, caption, atau naskah biasa.',
      maxUnits: 8000, maxHuman: '4.000 kata', maxD: 1000,
      split: s => s.split(/(\s+)/),      // pemisah ikut disimpan agar spasi tetap utuh
      key: arr => arr,   // token string dibandingkan langsung
      countable: t => /\S/.test(t)       // token spasi tidak dihitung sebagai kata
    },
    line: {
      label: 'baris',
      hint: 'Membandingkan baris per baris — paling ringan dan paling pas untuk kode, log, atau daftar panjang.',
      maxUnits: 5000, maxHuman: '5.000 baris', maxD: 800,
      split: s => s.split('\n'),
      // Baris dipetakan ke ID angka sekali di awal, jadi algoritma cukup
      // membandingkan integer — bukan mencocokkan string panjang berulang kali.
      // Map-nya WAJIB dipakai bersama kedua sisi; kalau tiap sisi punya map
      // sendiri, baris berbeda bisa kebagian ID sama dan dikira identik.
      key: (arr, map) => arr.map(line => { let id = map.get(line); if(id === undefined){ id = map.size; map.set(line, id); } return id; }),
      countable: () => true
    },
    char: {
      label: 'karakter',
      hint: 'Membandingkan karakter per karakter — untuk menangkap perubahan kecil seperti typo atau tanda baca.',
      maxUnits: 15000, maxHuman: '15.000 karakter', maxD: 1000,
      split: s => Array.from(s),         // per code point agar emoji tidak terbelah
      key: arr => arr,   // karakter dibandingkan langsung
      countable: () => true
    }
  };

  /* ---------- inti algoritma: Myers O((n+m)·d) ----------
     Biaya mengikuti JUMLAH PERBEDAAN (d), bukan panjang teks, sehingga dua
     teks yang mirip selesai hampir instan meski panjang. */
  function myersOps(a, b, maxD){
    const n = a.length, m = b.length;
    if(!n && !m) return [];
    if(!n) return b.map((_, j) => ({ type:'add', i:0, j }));
    if(!m) return a.map((_, i) => ({ type:'del', i, j:0 }));
    const offset = n + m, limit = Math.min(n + m, maxD);
    const v = new Int32Array(2 * offset + 1);
    const trace = [];
    for(let d = 0; d <= limit; d++){
      // Simpan hanya potongan diagonal yang relevan (k = -d..d) agar hemat memori.
      trace.push(v.slice(offset - d, offset + d + 1));
      for(let k = -d; k <= d; k += 2){
        let x = (k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1]))
          ? v[offset + k + 1]        // turun  = ambil token dari teks baru
          : v[offset + k - 1] + 1;   // ke kanan = lewati token teks lama
        let y = x - k;
        while(x < n && y < m && a[x] === b[y]){ x++; y++; }   // telusuri bagian yang sama
        v[offset + k] = x;
        if(x >= n && y >= m) return backtrackOps(trace, n, m);
      }
    }
    return null; // perbedaan melebihi batas -> caller memakai hasil sederhana
  }

  /** Telusuri balik jejak Myers menjadi daftar operasi berurutan. */
  function backtrackOps(trace, n, m){
    const ops = []; let x = n, y = m;
    for(let d = trace.length - 1; d >= 0; d--){
      const v = trace[d], k = x - y;
      let prevX = 0, prevY = 0;
      if(d > 0){
        const prevK = (k === -d || (k !== d && v[d + k - 1] < v[d + k + 1])) ? k + 1 : k - 1;
        prevX = v[d + prevK]; prevY = prevX - prevK;
      }
      while(x > prevX && y > prevY){ x--; y--; ops.push({ type:'same', i:x, j:y }); }
      if(d > 0){
        if(x === prevX){ y--; ops.push({ type:'add', i:x, j:y }); }
        else { x--; ops.push({ type:'del', i:x, j:y }); }
      }
      x = prevX; y = prevY;
    }
    return ops.reverse();
  }

  /** Potong bagian awal & akhir yang identik dulu — bagian termurah dan paling efektif. */
  function diffUnits(a, b, ka, kb, maxD){
    const n = ka.length, m = kb.length;
    let start = 0;
    while(start < n && start < m && ka[start] === kb[start]) start++;
    let endA = n, endB = m;
    while(endA > start && endB > start && ka[endA - 1] === kb[endB - 1]){ endA--; endB--; }
    const mid = myersOps(ka.slice(start, endA), kb.slice(start, endB), maxD);
    if(mid === null) return null;
    const parts = [];
    for(let i = 0; i < start; i++) parts.push({ type:'same', text:a[i] });
    mid.forEach(op => parts.push({ type:op.type, text: op.type === 'add' ? b[op.j + start] : a[op.i + start] }));
    for(let i = endA; i < n; i++) parts.push({ type:'same', text:a[i] });
    return parts;
  }

  /* ---------- API diff per level ---------- */

  /**
   * Bandingkan dua teks pada level tertentu.
   * @param {string} oldStr @param {string} newStr
   * @param {'word'|'line'|'char'} modeKey
   * @returns {{parts:Array<{type:'same'|'add'|'del', text:string}>,
   *            simplified:boolean, overLimit:boolean, limit:string}}
   */
  function runDiff(oldStr, newStr, modeKey){
    const cfg = MODES[modeKey];
    // Sisi kosong -> array kosong (bukan [''] hasil split) agar tidak terhitung
    // sebagai satu unit hantu di statistik.
    const a = oldStr ? cfg.split(oldStr) : [], b = newStr ? cfg.split(newStr) : [];
    if(a.length > cfg.maxUnits || b.length > cfg.maxUnits){
      return { parts:[], simplified:false, overLimit:true, limit:cfg.maxHuman };
    }
    const shared = new Map();   // interner dipakai bersama kedua sisi
    const parts = diffUnits(a, b, cfg.key(a, shared), cfg.key(b, shared), cfg.maxD);
    if(parts) return { parts, simplified:false, overLimit:false, limit:cfg.maxHuman };
    // Terlalu banyak perbedaan: tampilkan sebagai penggantian blok, jauh lebih
    // cepat daripada memaksa pencocokan yang hasilnya juga tidak informatif.
    const simple = a.map(text => ({ type:'del', text })).concat(b.map(text => ({ type:'add', text })));
    return { parts:simple, simplified:true, overLimit:false, limit:cfg.maxHuman };
  }

  /** Level kata — API asli tool ini, mengembalikan array {type,text}. */
  function diffWords(oldStr, newStr){ return runDiff(oldStr, newStr, 'word').parts; }
  /** Level baris — ringan karena membandingkan ID baris, bukan karakter. */
  function diffLines(oldStr, newStr){ return runDiff(oldStr, newStr, 'line').parts; }
  /** Level karakter — untuk perubahan kecil seperti typo. */
  function diffChars(oldStr, newStr){ return runDiff(oldStr, newStr, 'char').parts; }

  /* ---------- statistik & utilitas ---------- */

  /**
   * Hitung statistik add/del/same dari parts.
   * Persentase dibulatkan ke bawah dan ditahan di 99% selama masih ada
   * perubahan, supaya tidak pernah tertulis "100% sama" padahal berbeda.
   * @param {Array} parts @param {{countable:(t:string)=>boolean}} cfg
   * @returns {{add:number, del:number, same:number, pct:number}}
   */
  function computeStats(parts, cfg){
    let add = 0, del = 0, same = 0;
    parts.forEach(p => {
      if(!cfg.countable(p.text)) return;
      if(p.type === 'add') add++; else if(p.type === 'del') del++; else same++;
    });
    const total = add + del + same;
    if(!total) return { add, del, same, pct: 100 };
    const pct = Math.floor(same / total * 100);
    return { add, del, same, pct: (add || del) ? Math.min(pct, 99) : 100 };
  }

  /** Gabungkan bagian sejenis yang berdampingan agar span yang dirender jauh lebih sedikit. */
  function mergeParts(parts){
    const out = [];
    parts.forEach(p => {
      const last = out[out.length - 1];
      if(last && last.type === p.type) last.text += p.text;
      else out.push({ type:p.type, text:p.text });
    });
    return out;
  }

  /**
   * Susun baris hasil diff jadi pasangan kiri-kanan yang sejajar untuk split view.
   * @param {Array} parts - parts mode 'line'
   * @returns {Array<{l:string, r:string, na:number|null, nb:number|null, tl:string, tr:string}>}
   */
  function pairLineRows(parts){
    const rows = []; let i = 0, noA = 0, noB = 0;
    while(i < parts.length){
      if(parts[i].type === 'same'){
        rows.push({ l:parts[i].text, r:parts[i].text, na:++noA, nb:++noB, tl:'same', tr:'same' });
        i++; continue;
      }
      const dels = [], adds = [];
      while(i < parts.length && parts[i].type !== 'same'){ (parts[i].type === 'del' ? dels : adds).push(parts[i].text); i++; }
      for(let k = 0; k < Math.max(dels.length, adds.length); k++){
        rows.push({
          l: k < dels.length ? dels[k] : '', r: k < adds.length ? adds[k] : '',
          na: k < dels.length ? ++noA : null, nb: k < adds.length ? ++noB : null,
          tl: k < dels.length ? 'del' : 'empty', tr: k < adds.length ? 'add' : 'empty'
        });
      }
    }
    return rows;
  }

  /**
   * Versi teks polos dari hasil diff (untuk tombol salin).
   * @param {Array} parts @param {'word'|'line'|'char'} modeKey
   * @returns {string}
   */
  function plainDiff(parts, modeKey){
    if(modeKey === 'line') return parts.map(p => (p.type === 'add' ? '+ ' : p.type === 'del' ? '- ' : '  ') + p.text).join('\n');
    return parts.map(p => p.type === 'add' ? `{+${p.text}+}` : p.type === 'del' ? `[-${p.text}-]` : p.text).join('');
  }

  return {
    MODES, runDiff, diffWords, diffLines, diffChars,
    computeStats, mergeParts, pairLineRows, plainDiff
  };
});
