/* ============================================================
   TOOLS: base64.js — Base64 Encoder / Decoder [Developer]
   Encode/decode Unicode-aman & deteksi: pure/base64.js (TB.Base64)
   ============================================================ */
function renderBase64(){
  return `
    <div class="tool-layout">
      <div class="panel" style="grid-column:1/-1">
        <div class="panel-title">${ICONS.base64} Mode</div>
        <div class="segmented tt-mode" id="b64-mode">
          <button type="button" class="active" data-mode="encode">Encode</button>
          <button type="button" data-mode="decode">Decode</button>
        </div>
        <p class="field-hint" id="b64-hint" style="margin-top:12px"></p>
      </div>
      <div class="panel">
        <div class="panel-title">${ICONS.base64} Input</div>
        <textarea class="textarea mono" id="b64-input" style="min-height:220px" placeholder="Ketik atau tempel teks di sini…" aria-label="Input teks"></textarea>
        <div class="tt-count" id="b64-in-count"></div>
      </div>
      <div class="panel">
        <div class="panel-title">${ICONS.base64} Hasil</div>
        <textarea class="textarea mono" id="b64-output" style="min-height:220px" readonly placeholder="Hasil muncul otomatis saat mengetik…" aria-label="Hasil konversi"></textarea>
        <div class="tt-count" id="b64-out-count"></div>
        <div class="field-hint" id="b64-status" style="margin-top:8px" role="status"></div>
        <div class="tt-actions">
          <button type="button" class="btn" id="b64-copy">${ICONS.copy} Salin</button>
          <button type="button" class="btn btn-secondary" id="b64-swap">${ICONS.refresh} Swap</button>
          <button type="button" class="btn btn-ghost" id="b64-clear">Clear</button>
        </div>
      </div>
    </div>`;
}

function mountBase64(root){
  const input = $('#b64-input', root), output = $('#b64-output', root);
  const hint = $('#b64-hint', root), status = $('#b64-status', root);
  const inCount = $('#b64-in-count', root), outCount = $('#b64-out-count', root);

  const HINTS = {
    encode: 'Mengubah teks menjadi Base64 — aman untuk Unicode & emoji (encoding UTF-8). Konversi berjalan langsung saat mengetik.',
    decode: 'Mengubah Base64 kembali menjadi teks. Spasi/baris baru pada input diabaikan; input dideteksi otomatis apakah Base64 valid.'
  };

  let mode = 'encode';

  function renderCounts(){
    const ic = TB.TextUtils.countCodePoints(input.value), oc = TB.TextUtils.countCodePoints(output.value);
    inCount.textContent = `${TB.TextUtils.formatNumberID(ic, 0)} karakter`;
    outCount.textContent = `${TB.TextUtils.formatNumberID(oc, 0)} karakter`;
  }
  function setStatus(msg, tone){
    status.textContent = msg;
    status.style.color = tone ? `var(--${tone})` : '';
  }
  /** Live convert — encode tidak pernah gagal; decode menampilkan error ramah. */
  function update(){
    const src = input.value;
    if(!src){ output.value = ''; setStatus(''); renderCounts(); return; }
    if(mode === 'encode'){
      output.value = TB.Base64.encode(src);
      setStatus('');
    } else {
      // Deteksi otomatis: hanya coba decode bila input terlihat seperti Base64.
      if(!TB.Base64.isLikelyBase64(src)){
        output.value = '';
        setStatus('Input belum terlihat seperti Base64 yang valid', 'warning');
      } else {
        try { output.value = TB.Base64.decode(src); setStatus('✓ Base64 valid — berhasil didecode', 'success'); }
        catch(e){ output.value = ''; setStatus('✗ ' + e.message, 'danger'); }
      }
    }
    renderCounts();
  }
  function setMode(m){
    if(m !== 'encode' && m !== 'decode') return;
    mode = m;
    $$('#b64-mode button', root).forEach(b => b.classList.toggle('active', b.dataset.mode === m));
    hint.textContent = HINTS[m];
    update();
  }

  $$('#b64-mode button', root).forEach(btn => { btn.onclick = () => setMode(btn.dataset.mode); });
  input.addEventListener('input', update);

  $('#b64-copy', root).onclick = () => {
    if(!output.value){ toast('Tidak ada hasil untuk disalin'); return; }
    copyText(output.value);
  };
  $('#b64-swap', root).onclick = () => {
    const i = input.value, o = output.value;
    input.value = o; output.value = i;
    // Mode ikut dibalik agar hasil langsung "dikembalikan" (encode->decode /
    // sebaliknya) — tanpa ini swap di mode encode justru encode ulang hasilnya.
    setMode(mode === 'encode' ? 'decode' : 'encode');
    toast('Input dan hasil ditukar');
  };
  $('#b64-clear', root).onclick = () => {
    input.value = ''; output.value = '';
    update();
    input.focus();
  };

  setMode('encode'); // state awal: hint + counter
}
