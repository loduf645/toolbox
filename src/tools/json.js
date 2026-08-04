/* ============================================================
   TOOLS: json.js — JSON Formatter [Developer]
   Parse/format/highlight: pure/json-helpers.js
   ============================================================ */
function renderJSON(){
  return `
    <div class="tool-layout single">
      <div class="panel">
        <div class="panel-title">${ICONS.json} Input JSON</div>
        <textarea class="textarea mono" id="json-input" style="min-height:200px">{"name":"Budi","age":25,"city":"Jakarta","hobbies":["coding","reading"]}</textarea>
        <div class="field-row" style="margin-top:16px">
          <div class="field"><label class="field-label">Indentasi</label><div class="segmented"><button type="button" data-indent="2">2 Spasi</button><button type="button" class="active" data-indent="4">4 Spasi</button><button type="button" data-indent="tab">Tab</button></div></div>
          <div class="field" style="justify-content:flex-end"><button class="btn btn-secondary" id="json-minify" style="margin-bottom:0">Minify</button></div>
        </div>
        <button class="btn btn-block" id="json-format" style="margin-top:16px">${ICONS.refresh} Format & Validasi</button>
      </div>
      <div class="panel"><div class="panel-title">${ICONS.json} Hasil <span id="json-status" class="pill neutral" style="margin-left:auto">—</span></div><div id="json-output" class="json-output" style="min-height:200px"></div></div>
    </div>`;
}
function mountJSON(root){
  let indent = 4; const input = $('#json-input', root); const out = $('#json-output', root); const status = $('#json-status', root);
  $$('[data-indent]', root).forEach(b => b.onclick = () => { $$('[data-indent]', root).forEach(x => x.classList.remove('active')); b.classList.add('active'); indent = b.dataset.indent === 'tab' ? '\t' : parseInt(b.dataset.indent); format(); });
  // Parse/format/minify + syntax highlight ada di pure/json-helpers.js (TB.Json) — teruji unit.
  function format(minify = false){
    const str = input.value.trim();
    if(!str){ out.textContent = ''; status.textContent = 'Kosong'; status.className = 'pill neutral'; return; }
    try {
      const outStr = minify ? TB.Json.minifyJson(str) : TB.Json.formatJson(str, indent);
      out.innerHTML = TB.Json.highlightJson(outStr); status.textContent = 'Valid JSON'; status.className = 'pill success'; out.classList.remove('json-error');
    } catch(e) { out.textContent = e.message; status.textContent = 'Error'; status.className = 'pill danger'; out.classList.add('json-error'); }
  }
  $('#json-format', root).onclick = () => format(false);
  $('#json-minify', root).onclick = () => format(true);
  format(false);
}

