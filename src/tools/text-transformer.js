/* ============================================================
   TOOLS: text-transformer.js — Text Transformer [Text]
   Map Unicode & fungsi transformasi: pure/text-transforms.js
   ============================================================ */

/* Mapping Unicode (MIRROR_MAP & FLIP_MAP) + seluruh fungsi transformasi dipindah
   ke pure/text-transforms.js (TB.TextTransforms) — murni dan teruji unit. */


function renderTextTransformer(){
  return `
    <div class="tool-layout">
      <div class="panel" style="grid-column:1/-1">
        <div class="panel-title">${ICONS.texttransformer} Mode Transformasi</div>
        <div class="segmented tt-mode" id="tt-mode">
          <button type="button" class="active" data-mode="reverse">Reverse Text</button>
          <button type="button" data-mode="mirror">Mirror Text</button>
          <button type="button" data-mode="reverseWords">Reverse Words</button>
          <button type="button" data-mode="reverseEachWord">Reverse Each Word</button>
          <button type="button" data-mode="flip">Flip Upside Down</button>
        </div>
        <p class="field-hint" id="tt-hint" style="margin-top:12px"></p>
      </div>
      <div class="panel">
        <div class="panel-title">${ICONS.texttransformer} Input</div>
        <textarea class="textarea mono" id="tt-input" style="min-height:240px" placeholder="Ketik atau tempel teks di sini…" aria-label="Input teks"></textarea>
        <div class="tt-count" id="tt-in-count"></div>
      </div>
      <div class="panel">
        <div class="panel-title">${ICONS.texttransformer} Hasil</div>
        <textarea class="textarea mono" id="tt-output" style="min-height:240px" readonly placeholder="Hasil transformasi muncul di sini…" aria-label="Hasil transformasi"></textarea>
        <div class="tt-count" id="tt-out-count"></div>
        <div class="tt-actions">
          <button type="button" class="btn" id="tt-copy">${ICONS.copy} Salin</button>
          <button type="button" class="btn btn-secondary" id="tt-swap">${ICONS.refresh} Swap</button>
          <button type="button" class="btn btn-ghost" id="tt-clear">Clear</button>
        </div>
      </div>
    </div>`;
}

function mountTextTransformer(root){
  const input = $('#tt-input', root), output = $('#tt-output', root);
  const inCount = $('#tt-in-count', root), outCount = $('#tt-out-count', root);
  const hint = $('#tt-hint', root);

  /* Konfigurasi mode (hint + fn transformasi) dari modul pure. */
  const MODES = TB.TextTransforms.MODES;

  let mode = 'reverse';

  function countStats(text){
    // Hitung per code point agar emoji tidak terbelah jadi dua karakter (TB.TextUtils).
    return { chars: TB.TextUtils.countCodePoints(text), words: TB.TextUtils.countWords(text) };
  }
  function renderCounts(){
    const ic = countStats(input.value), oc = countStats(output.value);
    inCount.textContent = `${fmtNum(ic.chars, 0)} karakter · ${fmtNum(ic.words, 0)} kata`;
    outCount.textContent = `${fmtNum(oc.chars, 0)} karakter · ${fmtNum(oc.words, 0)} kata`;
  }
  function update(){
    output.value = MODES[mode].fn(input.value);
    renderCounts();
  }
  function setMode(m){
    if(!MODES[m]) return;
    mode = m;
    $$('#tt-mode button', root).forEach(b => b.classList.toggle('active', b.dataset.mode === m));
    hint.textContent = MODES[m].hint;
    update();
  }

  $$('#tt-mode button', root).forEach(btn => { btn.onclick = () => setMode(btn.dataset.mode); });
  input.addEventListener('input', update);

  $('#tt-copy', root).onclick = () => {
    if(!output.value){ toast('Tidak ada hasil untuk disalin'); return; }
    copyText(output.value); // menyalin + toast sukses
  };
  $('#tt-swap', root).onclick = () => {
    const i = input.value, o = output.value;
    input.value = o;   // hasil menjadi input
    output.value = i;  // input menjadi hasil
    renderCounts();
    toast('Input dan hasil ditukar');
  };
  $('#tt-clear', root).onclick = () => {
    input.value = ''; output.value = '';
    update();
    input.focus();
  };

  setMode('reverse'); // state awal: hint + live preview
}

