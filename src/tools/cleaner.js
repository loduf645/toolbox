/* ============================================================
   TOOLS: cleaner.js — Text Cleaner [Text]
   Seluruh operasi pembersihan: pure/text-cleaner.js (TB.TextCleaner)
   ============================================================ */
function renderCleaner(){
  const opts = TB.TextCleaner.OPTIONS;
  return `
    <div class="tool-layout">
      <div class="panel" style="grid-column:1/-1">
        <div class="panel-title">${ICONS.cleaner} Opsi Pembersihan</div>
        <div class="check-grid" id="tc-options">
          ${opts.map(o => `
            <label class="check-card" title="${esc(o.hint)}">
              <input type="checkbox" data-opt="${esc(o.id)}"><span class="check-box"></span>${esc(o.label)}
            </label>`).join('')}
        </div>
        <p class="field-hint" style="margin-top:12px">Beberapa opsi bisa dicentang sekaligus — dijalankan berurutan sesuai daftar di atas. Opsi urut A–Z dan Z–A saling menggantikan.</p>
        <div class="tt-actions">
          <button type="button" class="btn" id="tc-run">${ICONS.check} Bersihkan</button>
          <button type="button" class="btn btn-secondary" id="tc-all">Pilih semua dasar</button>
          <button type="button" class="btn btn-ghost" id="tc-none">Kosongkan opsi</button>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">${ICONS.cleaner} Input</div>
        <textarea class="textarea mono" id="tc-input" style="min-height:260px" placeholder="Tempel teks berantakan di sini…" aria-label="Input teks"></textarea>
        <div class="tt-count" id="tc-in-count"></div>
      </div>

      <div class="panel">
        <div class="panel-title">${ICONS.cleaner} Hasil</div>
        <textarea class="textarea mono" id="tc-output" style="min-height:260px" readonly placeholder="Hasil pembersihan muncul di sini setelah menekan Bersihkan…" aria-label="Hasil pembersihan"></textarea>
        <div class="tt-count" id="tc-out-count"></div>
        <div class="field-hint" id="tc-status" role="status" style="margin-top:8px"></div>
        <div class="tt-actions">
          <button type="button" class="btn" id="tc-copy">${ICONS.copy} Salin</button>
          <button type="button" class="btn btn-secondary" id="tc-swap">${ICONS.refresh} Jadikan input</button>
          <button type="button" class="btn btn-ghost" id="tc-clear">Clear</button>
        </div>
      </div>
    </div>`;
}

function mountCleaner(root){
  const input = $('#tc-input', root), output = $('#tc-output', root);
  const inCount = $('#tc-in-count', root), outCount = $('#tc-out-count', root);
  const status = $('#tc-status', root);
  const boxes = $$('#tc-options input[data-opt]', root);

  /* Opsi yang dipakai tombol "Pilih semua dasar" — sengaja tanpa sort,
     hapus baris baru, dan hapus karakter spesial (perubahan besar). */
  const BASIC = ['extraSpaces', 'trim', 'emptyLines'];

  function selected(){
    return boxes.filter(b => b.checked).map(b => b.dataset.opt);
  }
  function stats(text){
    return {
      chars: TB.TextUtils.countCodePoints(text),
      lines: TB.TextUtils.countLines(text)
    };
  }
  function renderCounts(){
    const i = stats(input.value), o = stats(output.value);
    inCount.textContent  = `${fmtNum(i.chars, 0)} karakter · ${fmtNum(i.lines, 0)} baris`;
    outCount.textContent = `${fmtNum(o.chars, 0)} karakter · ${fmtNum(o.lines, 0)} baris`;
  }
  function setStatus(msg, tone){
    status.textContent = msg;
    status.style.color = tone ? `var(--${tone})` : '';
  }
  function syncCards(){
    boxes.forEach(b => b.closest('.check-card').classList.toggle('active', b.checked));
  }

  function run(){
    const opts = selected();
    if(!input.value.trim()){ setStatus('Teks masih kosong.', 'warning'); toast('Teks masih kosong'); return; }
    if(!opts.length){ setStatus('Pilih minimal satu opsi pembersihan.', 'warning'); toast('Pilih minimal 1 opsi'); return; }
    const before = input.value;
    output.value = TB.TextCleaner.clean(before, opts);
    renderCounts();
    const saved = TB.TextUtils.countCodePoints(before) - TB.TextUtils.countCodePoints(output.value);
    setStatus(
      `${fmtNum(opts.length, 0)} opsi diterapkan · ${saved > 0 ? `${fmtNum(saved, 0)} karakter dihapus` : 'tidak ada karakter yang dihapus'}.`,
      'success'
    );
  }

  boxes.forEach(b => { b.onchange = () => { syncCards(); if(output.value) run(); }; });
  input.addEventListener('input', renderCounts);

  $('#tc-run', root).onclick = run;
  $('#tc-all', root).onclick = () => { boxes.forEach(b => b.checked = BASIC.includes(b.dataset.opt)); syncCards(); run(); };
  $('#tc-none', root).onclick = () => { boxes.forEach(b => b.checked = false); syncCards(); setStatus(''); };
  $('#tc-copy', root).onclick = () => {
    if(!output.value){ toast('Tidak ada hasil untuk disalin'); return; }
    copyText(output.value);
  };
  $('#tc-swap', root).onclick = () => {
    if(!output.value){ toast('Belum ada hasil'); return; }
    input.value = output.value;
    renderCounts();
    toast('Hasil dipindah ke input');
  };
  $('#tc-clear', root).onclick = () => {
    input.value = ''; output.value = '';
    renderCounts(); setStatus('');
    input.focus();
  };

  // State awal: opsi dasar tercentang agar sekali klik langsung berguna.
  boxes.forEach(b => b.checked = BASIC.includes(b.dataset.opt));
  syncCards();
  renderCounts();
  setStatus('');
}
