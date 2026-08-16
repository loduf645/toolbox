/* ============================================================
   TOOLS: case.js — Case Converter [Text]
   Seluruh logika konversi huruf: pure/case-convert.js (TB.CaseConvert)
   ============================================================ */
function renderCase(){
  const modes = Object.entries(TB.CaseConvert.MODES);
  return `
    <div class="tool-layout">
      <div class="panel" style="grid-column:1/-1">
        <div class="panel-title">${ICONS.case} Mode Konversi</div>
        <div class="segmented tt-mode" id="case-mode">
          ${modes.map(([id, m], i) =>
            `<button type="button" class="${i === 0 ? 'active' : ''}" data-mode="${id}">${esc(m.label)}</button>`
          ).join('')}
        </div>
        <p class="field-hint" id="case-hint" style="margin-top:12px"></p>
      </div>
      <div class="panel">
        <div class="panel-title">${ICONS.case} Input</div>
        <textarea class="textarea" id="case-input" style="min-height:240px" placeholder="Ketik atau tempel teks di sini…" aria-label="Input teks"></textarea>
        <div class="tt-count" id="case-in-count"></div>
      </div>
      <div class="panel">
        <div class="panel-title">${ICONS.case} Hasil</div>
        <textarea class="textarea" id="case-output" style="min-height:240px" readonly placeholder="Hasil konversi muncul otomatis saat mengetik…" aria-label="Hasil konversi"></textarea>
        <div class="tt-count" id="case-out-count"></div>
        <div class="tt-actions">
          <button type="button" class="btn" id="case-copy">${ICONS.copy} Salin</button>
          <button type="button" class="btn btn-secondary" id="case-swap">${ICONS.refresh} Swap</button>
          <button type="button" class="btn btn-ghost" id="case-clear">Clear</button>
        </div>
      </div>
    </div>`;
}

function mountCase(root){
  const MODES = TB.CaseConvert.MODES;
  const input = $('#case-input', root), output = $('#case-output', root);
  const inCount = $('#case-in-count', root), outCount = $('#case-out-count', root);
  const hint = $('#case-hint', root);

  let mode = 'upper';

  function stats(text){
    return {
      chars: TB.TextUtils.countCodePoints(text),
      words: TB.TextUtils.countWords(String(text).trim())
    };
  }
  function renderCounts(){
    const i = stats(input.value), o = stats(output.value);
    inCount.textContent  = `${fmtNum(i.chars, 0)} karakter · ${fmtNum(i.words, 0)} kata`;
    outCount.textContent = `${fmtNum(o.chars, 0)} karakter · ${fmtNum(o.words, 0)} kata`;
  }
  function update(){
    output.value = TB.CaseConvert.convert(input.value, mode);
    renderCounts();
  }
  function setMode(m){
    if(!MODES[m]) return;
    mode = m;
    $$('#case-mode button', root).forEach(b => b.classList.toggle('active', b.dataset.mode === m));
    hint.textContent = MODES[m].hint;
    update();
  }

  $$('#case-mode button', root).forEach(btn => { btn.onclick = () => setMode(btn.dataset.mode); });
  input.addEventListener('input', update);   // live convert saat mengetik

  $('#case-copy', root).onclick = () => {
    if(!output.value){ toast('Tidak ada hasil untuk disalin'); return; }
    copyText(output.value);
  };
  $('#case-swap', root).onclick = () => {
    // Hasil dipindah ke input agar bisa dirantai ke mode lain.
    input.value = output.value;
    update();
    toast('Hasil dipindah ke input');
  };
  $('#case-clear', root).onclick = () => {
    input.value = ''; output.value = '';
    update();
    input.focus();
  };

  setMode('upper');   // state awal: hint + live preview
}
