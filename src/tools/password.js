/* ============================================================
   TOOLS: password.js — Password Generator [Generator]
   Logika inti (charset, build, entropi): pure/crypto-helpers.js
   ============================================================ */
function renderPassword(){
  return `
    <div class="tool-layout single">
      <div class="panel">
        <div class="panel-title">${ICONS.password} Konfigurasi</div>
        <div class="field"><label class="field-label">Panjang <span id="pw-len-display">16</span></label><input type="range" class="slider" id="pw-length" min="4" max="64" value="16"></div>
        <div class="field"><div class="check-grid">
          <label class="check-card active"><input type="checkbox" data-charset="lower" checked><span class="check-box"></span>a-z</label>
          <label class="check-card active"><input type="checkbox" data-charset="upper" checked><span class="check-box"></span>A-Z</label>
          <label class="check-card active"><input type="checkbox" data-charset="number" checked><span class="check-box"></span>0-9</label>
          <label class="check-card active"><input type="checkbox" data-charset="symbol" checked><span class="check-box"></span>!@#</label>
        </div></div>
        <div class="field"><label class="toggle"><input type="checkbox" id="pw-exclude"><span class="toggle-track"></span><span>Exclude ambigu (0/O, 1/l)</span></label></div>
        <button class="btn btn-block" id="pw-generate">Generate</button>
      </div>
      <div class="panel">
        <div class="panel-title">${ICONS.password} Hasil</div>
        <div class="result-display" style="text-align:left">
          <div class="result-value mono" id="pw-output" style="font-size:18px;text-align:center;word-break:break-all;min-height:32px">—</div>
          <div class="strength"><div class="strength-bars"><div class="strength-bar"></div><div class="strength-bar"></div><div class="strength-bar"></div><div class="strength-bar"></div></div><span class="strength-label" id="pw-strength-label">—</span></div>
        </div>
        <div style="display:flex;gap:8px;margin-top:14px"><button class="btn btn-secondary" style="flex:1" id="pw-copy">${ICONS.copy} Salin</button><button class="btn btn-secondary" id="pw-regen">Ulangi</button></div>
      </div>
    </div>`;
}
function mountPassword(root){
  // Batas panjang password — harus sinkron dengan min/max slider di renderPassword().
  const PW_LEN_MIN = 4, PW_LEN_MAX = 64;
  const lS = $('#pw-length', root), lD = $('#pw-len-display', root), out = $('#pw-output', root), exc = $('#pw-exclude', root), cbs = $$('input[data-charset]', root);
  // Charset, build password & klasifikasi kekuatan ada di pure/crypto-helpers.js
  // (TB.Crypto) — murni dan teruji unit. Di sini hanya sumber acak + wiring UI.
  /** Integer acak aman [0, max) via CSPRNG (rejection sampling anti modulo bias). */
  function secRand(max){ const range = 2**32; const lim = range - (range % max) - 1; const a = new Uint32Array(1); let x; do { crypto.getRandomValues(a); x = a[0]; } while (x > lim); return x % max; }
  function gen(){
    // Kumpulkan tiap set yang aktif SECARA TERPISAH, supaya bisa menjamin
    // minimal satu karakter dari masing-masing set muncul di hasil akhir.
    const sets = [];
    cbs.forEach(c => {
      if(!c.checked) return;
      let chars = TB.Crypto.PASSWORD_CHARSETS[c.dataset.charset];
      if(exc.checked) chars = chars.replace(TB.Crypto.AMBIGUOUS_CHARS, '');
      if(chars.length) sets.push(chars);
    });
    if(!sets.length){ toast('Pilih minimal 1 set karakter'); return; }
    const pool = sets.join('');
    const len = Math.max(PW_LEN_MIN, Math.min(PW_LEN_MAX, parseInt(lS.value) || 16));
    out.textContent = TB.Crypto.buildPassword({ sets, length: len, randInt: secRand });
    updateStrength(len, pool.length);
  }
  /** Kekuatan berbasis entropi: log2(ukuran pool) * panjang (rumus di TB.Crypto). */
  function updateStrength(len, poolSize){
    const s = TB.Crypto.passwordStrength(len, poolSize);
    const bars = $$('.strength-bar', root);
    const label = $('#pw-strength-label', root);
    bars.forEach((b, i) => {
      b.classList.remove('active','weak','medium','strong');
      if(i < s.level) b.classList.add('active', s.cls);
    });
    if(label) label.textContent = `${s.label} · ${Math.round(s.bits)} bit`;
  }
  lS.oninput = () => lD.textContent = lS.value;
  cbs.forEach(c => c.onchange = () => c.closest('.check-card').classList.toggle('active', c.checked));
  $('#pw-generate', root).onclick = gen; 
  $('#pw-regen', root).onclick = gen;
  $('#pw-copy', root).onclick = () => { if(out.textContent === '—') return; copyText(out.textContent); };
  gen();
}

