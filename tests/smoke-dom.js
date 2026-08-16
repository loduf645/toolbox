/* ============================================================
   tests/smoke-dom.js — smoke test & golden comparison via jsdom.

   Memuat file HTML Toolbox di DOM virtual, membuka beranda + ke-23 tool,
   lalu membandingkan output dua file (mis. versi asli vs hasil refactor).

   Pakai:
     node tests/smoke-dom.js <fileA.html> [fileB.html]
     - 1 argumen : smoke test saja (semua tool harus mount tanpa error)
     - 2 argumen : golden comparison — output tool A vs B harus identik

   jsdom adalah dependensi DEV ONLY (tidak dibutuhkan aplikasi / test utama):
     npm install jsdom
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const TOOL_IDS = [
  'qr','password','unit','imageresizer','bmi','zakat','loan','age','name',
  'decision','lorem','gacha','mc','uuid','fake','slug','hash','diff',
  'markdown','json','word','texttransformer','promptstudio',
  'base64','gradient','imgbase64','color','tts','case','cleaner'
];
const EXPECTED_TOOL_COUNT = 30;

// Tool dengan output acak tidak bisa dibandingkan byte-per-byte.
const RANDOM_TOOLS = new Set(['password', 'name', 'uuid', 'fake', 'gacha']);
// decision wheel butuh <canvas> 2D (tidak ada di jsdom) — hanya dicek simetri error.
const CANVAS_TOOLS = new Set(['decision']);

// Output yang SENGAJA berbeda dari versi asli pra-refactor karena merupakan
// bug yang diperbaiki pada tahap QA (lihat changelog di README). Saat golden
// comparison melawan versi lama, perbedaan pada kunci ini dilaporkan sebagai
// "sesuai harapan", bukan kegagalan.
const KNOWN_FIX_DIFFS = new Set(['zakatFitrahNeg', 'loanExtreme', 'psAutosaveFlush', 'searchEmpty', 'searchEnter']);
// Interaksi milik tool yang baru ditambahkan (tidak ada di versi pembanding lama).
const NEW_TOOL_INTERACTIONS = new Set(['base64Encode', 'base64Decode', 'gradientCss', 'colorValues', 'caseSnake', 'cleanerBasic']);
// Error di versi lama yang hilang karena bugnya sudah diperbaiki.
const KNOWN_FIX_ERROR_PATTERNS = [/suggestTerms is not defined/, /norm is not defined/];
// Keterbatasan lingkungan jsdom (bukan bug aplikasi): scrollIntoView tidak
// diimplementasikan dan canvas 2D butuh paket npm 'canvas'.
const JSDOM_ARTIFACT_PATTERNS = [/scrollIntoView is not a function/, /reading 'clearRect'/];

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

async function runSmoke(htmlPath){
  const html = fs.readFileSync(htmlPath, 'utf8');
  const errors = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'https://localhost/',
    pretendToBeVisual: true,
    beforeParse(window){
      window.addEventListener('error', e => errors.push('window error: ' + e.message));
    }
  });
  const { window } = dom;
  await new Promise(res => window.addEventListener('load', res));
  await sleep(30);

  const doc = window.document;
  const snap = { errors: [], home: null, tools: {} };

  // ---------- beranda ----------
  const grid = doc.getElementById('tools-grid');
  snap.home = {
    toolCount: grid ? grid.querySelectorAll('.tool-card').length : -1,
    toolIds: grid ? [...grid.querySelectorAll('.tool-card')].map(c => c.dataset.id) : [],
    countLabel: (doc.getElementById('tools-count') || {}).textContent
  };

  // ---------- pencarian (lewat UI, memicu alur asli) ----------
  const searchInput = doc.getElementById('search-input');
  if(searchInput){
    searchInput.value = 'sandi';
    searchInput.dispatchEvent(new window.Event('input', { bubbles: true }));
    await sleep(150); // debounce 90ms
    snap.searchSandi = grid.querySelectorAll('.tool-card').length;
    searchInput.value = '';
    searchInput.dispatchEvent(new window.Event('input', { bubbles: true }));
    await sleep(150);
  }

  // ---------- buka tiap tool ----------
  // Elemen berisi nilai acak dimask agar tool acak tetap bisa dibandingkan
  // secara struktur (ID/class/wiring) antara dua versi.
  const RANDOM_MASKS = {
    password: ['#pw-output', '#pw-strength-label'],
    name: ['#n-l'],
    uuid: ['#uuid-list'],
    fake: ['#fake-output'],
    gacha: ['#g-l', '#g-stats']
  };
  for(const id of TOOL_IDS){
    window.location.hash = 'tool/' + id;
    await sleep(20);
    const content = doc.getElementById('tool-content');
    const rec = {};
    try {
      rec.ok = !!content && content.innerHTML.length > 0;
      (RANDOM_MASKS[id] || []).forEach(sel => {
        const el = doc.querySelector(sel);
        if(el){ el.innerHTML = '<RANDOM>'; el.textContent = '<RANDOM>'; }
      });
      rec.html = content ? content.innerHTML : '';
      // Nilai hasil yang terlihat (untuk tool kalkulator)
      const grab = sel => { const el = doc.querySelector(sel); return el ? (el.textContent || el.value || '') : null; };
      rec.values = {
        loanMonthly: grab('#l-m'), loanTotal: grab('#l-total'), loanInterest: grab('#l-interest'),
        bmiValue: grab('#bmi-v'), bmiPill: grab('#bmi-p'), bmr: grab('#bmi-bmr'), tdee: grab('#bmi-tdee'),
        zakat: grab('#z-v'), unitResult: grab('#ures'),
        mcResult: grab('#mc-r'), slugOutput: grab('#slug-output'),
        sha256: grab('#hash-sha256'), md5: grab('#hash-md5'),
        wordWords: grab('#word-words'), wordTime: grab('#word-time'),
        dfStats: grab('#df-stats'), dfOldCount: grab('#df-old-count')
      };
    } catch(e){
      rec.ok = false;
      rec.error = String(e);
    }
    snap.tools[id] = rec;
  }

  // ---------- interaksi deterministik (menguji event wiring) ----------
  const interact = {};
  const setInput = (sel, val) => {
    const el = doc.querySelector(sel);
    if(!el) return;
    el.value = val;
    el.dispatchEvent(new window.Event('input', { bubbles: true }));
  };
  const click = sel => { const el = doc.querySelector(sel); if(el) el.click(); };
  const grab = sel => { const el = doc.querySelector(sel); return el ? (el.textContent || el.value || '') : null; };
  const go = async id => { window.location.hash = 'tool/' + id; await sleep(20); };

  try {
    // Regresi bug panel pencarian: empty state "Tidak ditemukan" memakai
    // suggestTerms — versi lama melempar ReferenceError di sini.
    const si = doc.getElementById('search-input');
    if(si){
      si.focus();
      si.value = 'zzzzqqxx';
      si.dispatchEvent(new window.Event('input', { bubbles: true }));
      await sleep(150);
      interact.searchEmpty = (doc.getElementById('search-panel').textContent || '').includes('Tidak ditemukan') ? 'ok' : 'fail';
      // Regresi addSearchHistory (versi lama memanggil norm() yang sudah tidak ada):
      // Enter pada hasil pencarian harus membuka tool tanpa error.
      si.value = 'sandi';
      si.dispatchEvent(new window.Event('input', { bubbles: true }));
      await sleep(150);
      si.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await sleep(50);
      interact.searchEnter = window.location.hash === '#tool/password' ? 'ok' : 'fail:' + window.location.hash;
      window.location.hash = '';
      await sleep(30);
    }

    // Regresi autosave Prompt Studio: pindah tool < 400 ms setelah ketikan
    // terakhir harus tetap menyimpan draft (flush sinkron di cleanup).
    await go('promptstudio');
    const psEditor = doc.querySelector('#ps-input');
    if(psEditor){
      psEditor.value = 'FLUSH-TEST-DRAFT';
      psEditor.dispatchEvent(new window.Event('input', { bubbles: true }));
      window.location.hash = '';   // langsung pergi (< 400 ms)
      await sleep(30);
      interact.psAutosaveFlush = window.localStorage.getItem('toolbox-prompt-studio') === 'FLUSH-TEST-DRAFT' ? 'ok' : 'fail';
    }

    await go('bmi');
    setInput('#bmi-w', '95'); click('#bmi-c');
    interact.bmi95 = grab('#bmi-v') + '|' + grab('#bmi-p');

    await go('zakat');
    click('[data-z="fitrah"]'); setInput('#z-ricev', '15000'); setInput('#z-famv', '4'); click('#z-c');
    interact.zakatFitrah = grab('#z-v');
    click('[data-z="penghasilan"]'); setInput('#z-amount', '10000000'); setInput('#z-goldv', '1350000'); click('#z-c');
    interact.zakatPenghasilan = grab('#z-v');
    // Regresi bug fitrah: input negatif harus jadi 'Rp 0', bukan 'Rp -xxx'.
    click('[data-z="fitrah"]'); setInput('#z-ricev', '15000'); setInput('#z-famv', '-4'); click('#z-c');
    interact.zakatFitrahNeg = grab('#z-v');

    await go('loan');
    setInput('#l-p', '12000000'); setInput('#l-r', '0'); setInput('#l-t', '1'); click('#l-c');
    interact.loanNol = grab('#l-m') + '|' + grab('#l-interest');
    // Edge case ekstrem: pokok 1e400 = Infinity; harus jatuh ke guard 'Rp 0'.
    setInput('#l-p', '1e400'); click('#l-c');
    interact.loanExtreme = grab('#l-m');

    await go('unit');
    const radio = doc.querySelector('input[name="cat"][value="berat"]');
    if(radio){ radio.checked = true; radio.dispatchEvent(new window.Event('change', { bubbles: true })); }
    setInput('#ufv', '2');
    const fu = doc.querySelector('#ufu'), tu = doc.querySelector('#utu');
    if(fu && tu){ fu.value = 'kg'; tu.value = 'lb'; fu.dispatchEvent(new window.Event('input', { bubbles: true })); }
    interact.unitKgLb = grab('#ures');

    await go('slug');
    setInput('#slug-input', 'Halo Dunia! 2026');
    interact.slug = grab('#slug-output');

    await go('json');
    setInput('#json-input', '{"nama": "Budi"}'); click('#json-format');
    interact.jsonValid = grab('#json-status') + '|' + (grab('#json-output') || '').slice(0, 60);
    setInput('#json-input', '{rusak'); click('#json-format');
    interact.jsonError = grab('#json-status');

    await go('word');
    setInput('#word-input', 'satu dua tiga empat. Lima!');
    interact.word = grab('#word-words') + '|' + grab('#word-sentences') + '|' + grab('#word-time');

    await go('diff');
    setInput('#diff-old', 'satu dua tiga'); setInput('#diff-new', 'satu empat tiga');
    await sleep(450); // debounce 300ms
    interact.diffStats = grab('#df-stats');
    interact.diffResult = (grab('#df-result') || '').slice(0, 300);

    await go('texttransformer');
    setInput('#tt-input', 'Halo Dunia');
    interact.ttReverse = grab('#tt-output');
    click('[data-mode="reverseWords"]');
    interact.ttReverseWords = grab('#tt-output');

    await go('mc');
    setInput('#mc-x', '100'); setInput('#mc-z', '-100');
    interact.mc = grab('#mc-r');

    await go('age');
    click('#a-c');
    interact.age = grab('#a-out');

    /* ---------- tool baru (v4.4) — hanya direkam bila tool-nya ada ---------- */
    await go('base64');
    if(doc.querySelector('#b64-input')){
      setInput('#b64-input', 'Halo Dunia!');
      interact.base64Encode = grab('#b64-output');
      click('#b64-swap');   // swap membalik mode encode->decode: hasil kembali ke teks asal
      interact.base64Decode = grab('#b64-output');
    }

    await go('gradient');
    if(doc.querySelector('#gr-css')) interact.gradientCss = grab('#gr-css');

    await go('color');
    if(doc.querySelector('#cl-v-rgb')) interact.colorValues = grab('#cl-v-rgb') + '|' + grab('#cl-v-hsl');
    // imgbase64 butuh File API — cukup diverifikasi mount lewat loop tool di atas.

    await go('case');
    if(doc.querySelector('#case-input')){
      setInput('#case-input', 'nama depan user');
      click('#case-mode button[data-mode="snake"]');
      interact.caseSnake = grab('#case-output');
    }

    await go('cleaner');
    if(doc.querySelector('#tc-input')){
      setInput('#tc-input', '  halo   dunia  \n\n  halo   dunia  \n  apa kabar ');
      click('#tc-run');
      interact.cleanerBasic = grab('#tc-output');
    }
    // tts memakai Web Speech API yang tidak ada di jsdom — cukup dicek mount-nya
    // lewat loop tool di atas (tool harus tetap render & menampilkan status).
  } catch(e){
    interact.error = String(e);
  }
  snap.interact = interact;

  snap.errors = errors;
  dom.window.close();
  return snap;
}

function norm(rec, id){
  if(CANVAS_TOOLS.has(id)) return rec.ok ? 'canvas-ok' : 'canvas-error:' + (rec.error || rec.html || '').slice(0, 80);
  return JSON.stringify({ html: rec.html, values: rec.values });
}

async function main(){
  const [a, b] = process.argv.slice(2);
  if(!a){ console.error('Pakai: node tests/smoke-dom.js <fileA.html> [fileB.html]'); process.exit(1); }

  console.log('Smoke test:', a);
  const snapA = await runSmoke(path.resolve(a));
  let fail = 0;

  console.log(`\nBeranda: ${snapA.home.toolCount} tool di grid (label: ${JSON.stringify(snapA.home.countLabel)})`);
  if(snapA.home.toolCount !== EXPECTED_TOOL_COUNT){
    if(b) console.log(`  (info) file pertama punya ${snapA.home.toolCount} tool (versi lama); ${EXPECTED_TOOL_COUNT} tool dicek pada file kedua`);
    else { console.log(`  ✗ jumlah tool != ${EXPECTED_TOOL_COUNT} (dapat ${snapA.home.toolCount})`); fail++; }
  }
  if(snapA.searchSandi !== undefined){
    console.log(`Pencarian "sandi": ${snapA.searchSandi} hasil (diharapkan 1)`);
    if(snapA.searchSandi !== 1) fail++;
  }
  for(const id of TOOL_IDS){
    const r = snapA.tools[id];
    if(r.ok){ console.log('  ✓ tool terbuka: ' + id); }
    else if(b && !(snapA.home.toolIds || []).includes(id)){ console.log('  (info) tool tidak ada di versi lama: ' + id); }
    else { console.log(`  ✗ tool GAGAL: ${id} — ${r.error || snapA.errors.join('; ')}`); fail++; }
  }
  const realErrors = snapA.errors.filter(e => !JSDOM_ARTIFACT_PATTERNS.some(re => re.test(e)));
  const artifacts = snapA.errors.length - realErrors.length;
  if(artifacts) console.log(`  (info) ${artifacts} error adalah artifact keterbatasan jsdom, diabaikan`);
  if(realErrors.length){
    console.log('  ✗ error global aplikasi:', realErrors);
    fail++;
  }

  if(b){
    console.log('\nGolden comparison dengan:', b);
    const snapB = await runSmoke(path.resolve(b));
    // Error runtime harus SIMETRIS: refactor tidak boleh menambah/mengurangi error.
    // Pengecualian: error versi lama yang memang hilang karena bugnya sudah
    // diperbaiki pada tahap QA (KNOWN_FIX_ERROR_PATTERNS).
    const knownOnly = arr => arr.filter(e => !KNOWN_FIX_ERROR_PATTERNS.some(re => re.test(e)));
    const fixedAway = arr => arr.filter(e => KNOWN_FIX_ERROR_PATTERNS.some(re => re.test(e)));
    const ea = [...knownOnly(snapA.errors)].sort().join(' | '), eb = [...knownOnly(snapB.errors)].sort().join(' | ');
    if(ea === eb){ console.log('  ✓ error runtime simetris (' + knownOnly(snapA.errors).length + ' artifact lingkungan)'); }
    else { fail++; console.log('  ✗ error runtime berbeda!\n    A: ' + ea + '\n    B: ' + eb); }
    if(fixedAway(snapA.errors).length && !fixedAway(snapB.errors).length){
      console.log('  ✓ error versi lama hilang karena perbaikan bug: ' + fixedAway(snapA.errors).length + ' kasus');
    } else if(fixedAway(snapB.errors).length){
      fail++; console.log('  ✗ bug yang seharusnya sudah diperbaiki masih muncul di file B');
    }
    const idsA = new Set(snapA.home.toolIds || []);
    if(snapA.home.toolCount !== snapB.home.toolCount){
      const missing = (snapA.home.toolIds || []).filter(id => !snapB.home.toolIds.includes(id));
      const added = snapB.home.toolIds.filter(id => !idsA.has(id));
      if(missing.length){ fail++; console.log('  ✗ tool lama hilang di B: ' + missing.join(', ')); }
      if(added.length) console.log(`  ✓ tool baru ditambahkan (${added.length}): ` + added.join(', '));
      if(!missing.length && !added.length){ fail++; console.log('  ✗ jumlah tool berbeda tanpa penambahan/pengurangan jelas'); }
    }
    if(snapB.home.toolCount !== EXPECTED_TOOL_COUNT){
      fail++; console.log(`  ✗ jumlah tool file kedua != ${EXPECTED_TOOL_COUNT} (dapat ${snapB.home.toolCount})`);
    }
    if(snapA.searchSandi !== snapB.searchSandi){
      console.log(`  ✗ hasil pencarian berbeda: ${snapA.searchSandi} vs ${snapB.searchSandi}`); fail++;
    }
    for(const id of TOOL_IDS){
      // Tool yang tidak ada di versi A (tool baru) diharapkan hanya ada di B.
      if(!idsA.has(id)){
        if(snapB.tools[id] && snapB.tools[id].ok) console.log('  ✓ tool baru di B terbuka normal: ' + id);
        else { fail++; console.log('  ✗ tool baru gagal terbuka di B: ' + id); }
        continue;
      }
      const na = norm(snapA.tools[id], id), nb = norm(snapB.tools[id], id);
      if(na === nb){ console.log('  ✓ identik: ' + id); }
      else {
        fail++;
        console.log('  ✗ BERBEDA: ' + id);
        // cari titik beda pertama untuk memudahkan debugging
        const max = Math.min(na.length, nb.length);
        let i = 0; while(i < max && na[i] === nb[i]) i++;
        console.log('    A …' + na.slice(Math.max(0, i - 40), i + 80));
        console.log('    B …' + nb.slice(Math.max(0, i - 40), i + 80));
      }
    }
    // Bandingkan hasil interaksi (event wiring)
    const keysA = Object.keys(snapA.interact || {}).sort();
    const keysB = Object.keys(snapB.interact || {}).sort();
    const onlyB = keysB.filter(k => !keysA.includes(k));
    const onlyA = keysA.filter(k => !keysB.includes(k));
    const unexpectedOnlyB = onlyB.filter(k => !NEW_TOOL_INTERACTIONS.has(k));
    if(onlyA.length || unexpectedOnlyB.length){
      fail++; console.log('  ✗ kunci interaksi berbeda tak terduga. hanya A:', onlyA, '| hanya B:', unexpectedOnlyB);
    }
    if(onlyB.length) console.log('  ✓ interaksi tool baru (hanya di B): ' + onlyB.join(', '));
    {
      for(const k of keysA){
        if(snapA.interact[k] === snapB.interact[k]){
          console.log('  ✓ interaksi identik: ' + k);
        } else if(KNOWN_FIX_DIFFS.has(k)){
          console.log(`  ✓ interaksi berbeda SESUAI HARAPAN (perbaikan bug): ${k} [${JSON.stringify(snapA.interact[k])} -> ${JSON.stringify(snapB.interact[k])}]`);
        } else {
          fail++; console.log(`  ✗ interaksi BERBEDA: ${k}\n    A: ${JSON.stringify(snapA.interact[k])}\n    B: ${JSON.stringify(snapB.interact[k])}`);
        }
      }
    }
  }

  console.log(fail === 0 ? '\nSEMUA CEK LULUS ✓' : `\n${fail} cek gagal ✗`);
  process.exitCode = fail === 0 ? 0 : 1;
}

main().catch(e => { console.error(e); process.exit(1); });


