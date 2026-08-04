/* ============================================================
   TOOLS: diff.js — Text Diff Checker [Text]
   Algoritma Myers & statistik: pure/diff-engine.js
   ============================================================ */
function renderDiff(){
  return `
    <div class="tool-layout">
      <div class="panel" style="grid-column:1/-1">
        <div class="panel-title">${ICONS.diff} Mode Perbandingan</div>
        <div class="df-controls">
          <div class="field" style="margin-bottom:0">
            <span class="field-label">Bandingkan <span class="field-hint">tingkat detail</span></span>
            <div class="segmented df-mode" id="df-mode" role="group" aria-label="Mode perbandingan">
              <button type="button" class="active" data-mode="word" aria-pressed="true">Per Kata</button>
              <button type="button" data-mode="line" aria-pressed="false">Per Baris</button>
              <button type="button" data-mode="char" aria-pressed="false">Per Karakter</button>
            </div>
          </div>
          <div class="field" style="margin-bottom:0">
            <span class="field-label">Tampilan <span class="field-hint">cara hasil disusun</span></span>
            <div class="segmented df-view" id="df-view" role="group" aria-label="Tampilan hasil">
              <button type="button" class="active" data-view="unified" aria-pressed="true">Unified</button>
              <button type="button" data-view="split" aria-pressed="false">Split View</button>
            </div>
          </div>
        </div>
        <p class="field-hint" id="df-hint" style="margin-top:12px"></p>
        <div class="disclaimer" style="margin-top:14px">
          ${ICONS.info} <span><strong>Cara pakai:</strong> tempel teks versi lama di kolom kiri, versi baru di kolom kanan. Keduanya diisi manual — kolom kanan tidak ikut berubah saat kolom kiri diisi. Hasil perbandingan muncul otomatis di panel bawah.</span>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">${ICONS.diff} Versi Lama (Original)</div>
        <textarea class="textarea mono" id="diff-old" style="min-height:200px" placeholder="Tempel teks versi lama di sini…" aria-label="Teks versi lama">Hari ini adalah hari yang cerah.\nBurung terbang di langit biru.\nKita pergi ke pasar minggu pagi.</textarea>
        <div class="field-hint" id="df-old-count" style="margin-top:8px"></div>
      </div>
      <div class="panel">
        <div class="panel-title">${ICONS.diff} Versi Baru (Revisi)</div>
        <textarea class="textarea mono" id="diff-new" style="min-height:200px" placeholder="Tempel teks versi baru di sini…" aria-label="Teks versi baru">Hari ini adalah hari yang mendung.\nBurung terbang di langit biru.\nKita pergi ke pasar senin pagi.</textarea>
        <div class="field-hint" id="df-new-count" style="margin-top:8px"></div>
      </div>

      <div class="panel" style="grid-column:1/-1">
        <div class="panel-title">${ICONS.diff} Hasil Perbandingan</div>
        <div class="df-stats" id="df-stats"></div>
        <div id="df-result"></div>
        <div class="df-actions">
          <button type="button" class="btn" id="df-copy">${ICONS.copy} Salin Hasil Diff</button>
          <button type="button" class="btn btn-secondary" id="df-swap">${ICONS.refresh} Tukar</button>
          <button type="button" class="btn btn-ghost" id="df-clear">Clear</button>
        </div>
      </div>
    </div>`;
}
function mountDiff(root){
  const oldEl = $('#diff-old', root); const newEl = $('#diff-new', root);
  const statsEl = $('#df-stats', root); const resultEl = $('#df-result', root); const hintEl = $('#df-hint', root);
  const oldCountEl = $('#df-old-count', root); const newCountEl = $('#df-new-count', root);
  function escapeHtml(s){ return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  /* ---------- mesin diff (Myers) ----------
     Seluruh algoritma & struktur data diff dipindah ke pure/diff-engine.js
     (TB.Diff) — murni, tanpa DOM, dan teruji unit di tests/diff.test.js.
     File ini hanya render HTML + wiring interaksi. */
  const MODES = TB.Diff.MODES;
  function cls(type){ return type === 'add' ? 'diff-add' : type === 'del' ? 'diff-del' : ''; }
  function lineRow(text, type, no, side){
    if(type === 'empty') return '<span class="df-line empty"><span class="df-gutter"></span>&nbsp;</span>';
    const gutter = no === null ? (type === 'add' ? '+' : type === 'del' ? '−' : '') : no;
    const body = escapeHtml(text) || '&nbsp;';
    return `<span class="df-line ${type === 'same' ? '' : type}"><span class="df-gutter">${gutter}</span>${body}</span>`;
  }

  /* ---------- render hasil ---------- */
  function unifiedHtml(parts, modeKey){
    if(modeKey === 'line'){
      const html = parts.map(p => lineRow(p.text, p.type, null)).join('');
      return `<div class="diff-output df-pane">${html}</div>`;
    }
    const html = parts.map(p => {
      const safe = escapeHtml(p.text);
      return p.type === 'same' ? safe : `<span class="${cls(p.type)}">${safe}</span>`;
    }).join('');
    return `<div class="diff-output df-pane">${html}</div>`;
  }
  function splitHtml(parts, modeKey){
    let left = '', right = '', nowrap = '';
    if(modeKey === 'line'){
      nowrap = ' df-nowrap';   // tanpa wrap agar baris kiri & kanan tetap sejajar
      TB.Diff.pairLineRows(parts).forEach(r => {
        left += lineRow(r.l, r.tl, r.na);
        right += lineRow(r.r, r.tr, r.nb);
      });
    } else {
      parts.forEach(p => {
        const safe = escapeHtml(p.text);
        if(p.type === 'same'){ left += safe; right += safe; }
        else if(p.type === 'del') left += `<span class="diff-del">${safe}</span>`;
        else right += `<span class="diff-add">${safe}</span>`;
      });
    }
    return `
      <div class="df-split">
        <div class="df-side">
          <div class="df-side-label">Versi Lama — yang dihapus</div>
          <div class="diff-output df-pane${nowrap}">${left}</div>
        </div>
        <div class="df-side">
          <div class="df-side-label">Versi Baru — yang ditambahkan</div>
          <div class="diff-output df-pane${nowrap}">${right}</div>
        </div>
      </div>`;
  }

  /* ---------- state & alur update ---------- */
  const DEBOUNCE_MS = 300;      // jeda sebelum diff dihitung ulang saat mengetik
  const BUSY_CHARS = 4000;      // di atas ini, tampilkan indikator "menghitung"
  let mode = 'word', view = 'unified';
  let inputTimer = null, computeTimer = null, runId = 0;
  let lastParts = null, lastMode = 'word';

  function describe(text){
    // Konsisten dengan modul pure yang sama dipakai tool lain.
    const chars = TB.TextUtils.countCodePoints(text);
    const words = TB.TextUtils.countWords(text);
    const lines = TB.TextUtils.countLines(text);
    return `${fmtNum(chars, 0)} karakter · ${fmtNum(words, 0)} kata · ${fmtNum(lines, 0)} baris`;
  }
  function renderCounts(){
    oldCountEl.textContent = describe(oldEl.value);
    newCountEl.textContent = describe(newEl.value);
  }
  function renderStats(st, cfg, simplified){
    statsEl.innerHTML = `
      <span class="pill success">+${fmtNum(st.add, 0)} ${cfg.label} ditambahkan</span>
      <span class="pill danger">−${fmtNum(st.del, 0)} ${cfg.label} dihapus</span>
      <span class="pill neutral">${fmtNum(st.same, 0)} ${cfg.label} tetap</span>
      ${simplified ? '<span class="pill warning">Hasil disederhanakan</span>' : ''}
      ${st.add === 0 && st.del === 0 ? '<span class="pill success">Kedua teks identik</span>' : ''}
      <span class="df-summary">${st.pct}% sama</span>`;
  }
  function renderResult(parts, modeKey){
    resultEl.innerHTML = view === 'split' ? splitHtml(parts, modeKey) : unifiedHtml(parts, modeKey);
    if(view === 'split') syncPanes();
  }
  /** Samakan posisi scroll kedua panel split agar baris kiri-kanan tetap sebaris. */
  function syncPanes(){
    const panes = $$('.df-split .df-pane', root);
    if(panes.length !== 2) return;
    let locked = false;
    panes.forEach((pane, idx) => {
      pane.addEventListener('scroll', () => {
        if(locked) return;          // cegah pantulan balik antar panel
        locked = true;
        const other = panes[1 - idx];
        other.scrollTop = pane.scrollTop;
        other.scrollLeft = pane.scrollLeft;
        requestAnimationFrame(() => { locked = false; });
      });
    });
  }
  function showEmpty(msg, warn){
    statsEl.innerHTML = ''; lastParts = null;
    resultEl.innerHTML = `<div class="empty"${warn ? ' style="color:var(--warning)"' : ''}>${msg}</div>`;
  }
  /** Hitung + render diff. Dipanggil lewat update() agar debounce tetap terjaga. */
  function compute(id){
    const oldStr = oldEl.value, newStr = newEl.value;
    const cfg = MODES[mode];
    const res = TB.Diff.runDiff(oldStr, newStr, mode);
    if(id !== runId || !root.isConnected) return;   // hasil sudah kadaluarsa
    if(res.overLimit){
      showEmpty(`Teks terlalu panjang untuk mode ini (maks ${res.limit} per sisi). Perpendek teksnya, atau pakai mode Per Baris yang jauh lebih ringan.`, true);
      return;
    }
    renderStats(TB.Diff.computeStats(res.parts, cfg), cfg, res.simplified);
    // Statistik dihitung dari bagian mentah, penggabungan hanya untuk render.
    lastParts = mode === 'line' ? res.parts : TB.Diff.mergeParts(res.parts);
    lastMode = mode;
    renderResult(lastParts, lastMode);
  }
  function isHeavy(){ return oldEl.value.length + newEl.value.length > BUSY_CHARS; }
  function showBusy(){ statsEl.innerHTML = '<span class="df-busy">Menghitung perbedaan…</span>'; }
  function update(){
    clearTimeout(computeTimer); computeTimer = null;
    const id = ++runId;
    renderCounts();
    if(!oldEl.value && !newEl.value){ showEmpty('Isi kedua kolom di atas untuk melihat perbandingan.'); return; }
    if(isHeavy()){
      // Beri browser satu kesempatan menggambar indikator dulu, baru hitung —
      // tanpa jeda ini indikator tidak pernah benar-benar terlihat.
      showBusy();
      computeTimer = setTimeout(() => compute(id), 30);
      return;
    }
    compute(id);
  }
  function scheduleUpdate(){
    clearTimeout(inputTimer);
    // Teks panjang: tampilkan indikator sejak awal jeda, jadi user langsung tahu
    // hasilnya sedang menunggu diperbarui — bukan tool-nya yang macet.
    if(isHeavy()) showBusy();
    inputTimer = setTimeout(update, DEBOUNCE_MS);   // debounce: tidak menghitung tiap ketikan
  }
  function setMode(m){
    if(!MODES[m]) return;
    mode = m;
    $$('#df-mode button', root).forEach(b => {
      const on = b.dataset.mode === m;
      b.classList.toggle('active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    hintEl.textContent = MODES[m].hint;
    update();
  }
  function setView(v){
    view = v;
    $$('#df-view button', root).forEach(b => {
      const on = b.dataset.view === v;
      b.classList.toggle('active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    // Ganti tampilan tidak perlu menghitung ulang diff — cukup render ulang.
    if(lastParts) renderResult(lastParts, lastMode); else update();
  }

  $$('#df-mode button', root).forEach(btn => { btn.onclick = () => setMode(btn.dataset.mode); });
  $$('#df-view button', root).forEach(btn => { btn.onclick = () => setView(btn.dataset.view); });
  oldEl.addEventListener('input', scheduleUpdate);
  newEl.addEventListener('input', scheduleUpdate);

  $('#df-copy', root).onclick = () => {
    if(!lastParts || !lastParts.length){ toast('Belum ada hasil diff untuk disalin'); return; }
    copyText(TB.Diff.plainDiff(lastParts, lastMode));
  };
  $('#df-swap', root).onclick = () => {
    const a = oldEl.value; oldEl.value = newEl.value; newEl.value = a;
    clearTimeout(inputTimer); inputTimer = null;
    update();
    toast('Teks lama dan baru ditukar');
  };
  $('#df-clear', root).onclick = () => {
    if(!oldEl.value && !newEl.value){ toast('Kedua kolom sudah kosong'); return; }
    oldEl.value = ''; newEl.value = '';
    clearTimeout(inputTimer); inputTimer = null;
    update();
    oldEl.focus();
  };

  setMode('word');   // state awal: hint + hasil perbandingan contoh

  /* ---------- cleanup ---------- */
  _toolCleanup = () => {
    clearTimeout(inputTimer); inputTimer = null;
    clearTimeout(computeTimer); computeTimer = null;
  };
}

