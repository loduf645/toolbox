/* ============================================================
   TOOLS: uuid.js — UUID / ID Generator [Developer]
   UUID v4 & rejection sampling: pure/crypto-helpers.js
   ============================================================ */
function renderUUID(){
  return `
    <div class="tool-layout single">
      <div class="panel">
        <div class="panel-title">${ICONS.uuid} Konfigurasi</div>
        <div class="field-row">
          <div class="field"><label class="field-label">Tipe ID</label><select class="select" id="uuid-type"><option value="v4">UUID v4 (Standard)</option><option value="nano">Random ID (16 karakter)</option><option value="short">Short ID (8 karakter)</option></select></div>
          <div class="field"><label class="field-label">Jumlah</label><input type="number" class="input" id="uuid-count" value="5" min="1" max="100"></div>
        </div>
        <button class="btn btn-block" id="uuid-gen">${ICONS.refresh} Generate ID</button>
      </div>
      <div class="panel">
        <div class="panel-title">${ICONS.uuid} Hasil <button class="copy-btn" id="uuid-copy" style="float:right">${ICONS.copy} Salin Semua</button></div>
        <div id="uuid-list" style="display:flex;flex-direction:column;gap:8px"></div>
      </div>
    </div>`;
}
function mountUUID(root){
  // Inti pembuatan ID (UUID v4 + rejection sampling anti modulo-bias) ada di
  // pure/crypto-helpers.js (TB.Crypto) — murni dan teruji unit.
  function genV4(){ return TB.Crypto.uuidV4(); }
  function genNano(len){ return TB.Crypto.randomId(len); }
  function generate(){
    const type = $('#uuid-type', root).value; const count = Math.min(100, Math.max(1, parseInt($('#uuid-count', root).value) || 5));
    const list = $('#uuid-list', root); const ids = [];
    for(let i=0; i<count; i++){ let id; if(type === 'v4') id = genV4(); else if(type === 'nano') id = genNano(16); else id = genNano(8); ids.push(id); }
    list.innerHTML = ids.map(id => `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface-alt);border:1px solid var(--border);border-radius:8px"><span style="font-family:var(--font-mono);font-size:14px;word-break:break-all">${id}</span><button class="copy-btn" data-id="${id}">${ICONS.copy}</button></div>`).join('');
    list.querySelectorAll('.copy-btn[data-id]').forEach(b => b.onclick = () => copyText(b.dataset.id));
    $('#uuid-copy', root).onclick = () => copyText(ids.join('\n'));
  }
  $('#uuid-gen', root).onclick = generate; generate();
}



