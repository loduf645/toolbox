/* ============================================================
   TOOLS: slug.js — Slug Generator [Developer]
   slugify: pure/text-utils.js
   ============================================================ */
function renderSlug(){
  return `
    <div class="tool-layout single">
      <div class="panel">
        <div class="panel-title">${ICONS.slug} Input Teks</div>
        <div class="field"><label class="field-label">Judul / Teks</label><textarea class="textarea" id="slug-input" style="min-height:100px">10 Cara Mudah Membuat Website Pada 2024!</textarea></div>
        <div class="field-row">
          <div class="field"><label class="field-label">Pemisah</label><div class="segmented"><button type="button" class="active" data-sep="-">Strip (-)</button><button type="button" data-sep="_">Underscore (_)</button></div></div>
          <div class="field"><label class="field-label">Case</label><div class="segmented"><button type="button" class="active" data-case="lower">lowercase</button><button type="button" data-case="upper">UPPERCASE</button></div></div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-title">${ICONS.slug} Hasil Slug <button class="copy-btn" id="slug-copy" style="float:right">${ICONS.copy} Salin</button></div>
        <div class="result-display" style="text-align:left"><div class="result-value mono" id="slug-output" style="font-size:18px;text-align:left;word-break:break-all"></div></div>
      </div>
    </div>`;
}
function mountSlug(root){
  let sep = '-', casing = 'lower'; const input = $('#slug-input', root); const output = $('#slug-output', root);
  $$('[data-sep]', root).forEach(b => b.onclick = () => { $$('[data-sep]', root).forEach(x => x.classList.remove('active')); b.classList.add('active'); sep = b.dataset.sep; gen(); });
  $$('[data-case]', root).forEach(b => b.onclick = () => { $$('[data-case]', root).forEach(x => x.classList.remove('active')); b.classList.add('active'); casing = b.dataset.case; gen(); });
  function gen(){
    // Rumus slug ada di pure/text-utils.js (TB.TextUtils) — teruji unit.
    const s = TB.TextUtils.slugify(input.value, sep, casing);
    output.textContent = s || '—'; $('#slug-copy', root).onclick = () => { if(!s) return; copyText(s); };
  }
  input.addEventListener('input', gen); gen();
}



