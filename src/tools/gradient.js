/* ============================================================
   TOOLS: gradient.js — CSS Gradient Generator [Generator]
   Builder CSS & preset: pure/gradient.js (TB.Gradient)
   ============================================================ */
function renderGradient(){
  return `
    <div class="tool-layout">
      <div class="panel">
        <div class="panel-title">${ICONS.gradient} Pengaturan</div>
        <div class="field">
          <label class="field-label">Tipe Gradient</label>
          <div class="segmented" id="gr-type">
            <button type="button" class="active" data-type="linear">Linear</button>
            <button type="button" data-type="radial">Radial</button>
          </div>
        </div>
        <div class="field" id="gr-dir-field">
          <label class="field-label">Arah</label>
          <select class="select" id="gr-dir"></select>
        </div>
        <div class="field" id="gr-angle-field" style="display:none">
          <label class="field-label">Sudut Custom</label>
          <div class="input-group"><input type="number" class="input" id="gr-angle" value="45" min="0" max="360" step="1"><span class="suffix">deg</span></div>
        </div>
        <div class="field">
          <label class="field-label">Color Stops <span class="field-hint">minimal 2</span></label>
          <div id="gr-stops" style="display:flex;flex-direction:column;gap:8px"></div>
          <button type="button" class="btn btn-secondary btn-block" id="gr-add" style="margin-top:10px">+ Tambah Color Stop</button>
        </div>
        <div class="field">
          <label class="field-label">Preset</label>
          <div class="ir-quick" id="gr-presets"></div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-title">${ICONS.gradient} Preview &amp; Kode CSS</div>
        <div id="gr-preview" style="height:200px;border:1px solid var(--border);border-radius:var(--radius-md);margin-bottom:16px"></div>
        <div class="field"><label class="field-label">Kode CSS</label>
          <textarea class="textarea mono" id="gr-css" style="min-height:96px" readonly aria-label="Kode CSS gradient"></textarea>
        </div>
        <div class="tt-actions">
          <button type="button" class="btn btn-block" id="gr-copy">${ICONS.copy} Salin CSS</button>
        </div>
      </div>
    </div>`;
}

function mountGradient(root){
  const dirSel = $('#gr-dir', root), angleField = $('#gr-angle-field', root), angleIn = $('#gr-angle', root);
  const dirField = $('#gr-dir-field', root), stopsWrap = $('#gr-stops', root);
  const preview = $('#gr-preview', root), cssOut = $('#gr-css', root);

  const state = { type: 'linear', direction: 'to bottom right', angle: 45 };
  // Default memakai warna aksen aplikasi agar preview pertama langsung enak dilihat.
  let stops = [{ color: '#a8421c', pos: 0 }, { color: '#d4a574', pos: 100 }];

  /* ---------- opsi arah ---------- */
  dirSel.innerHTML = TB.Gradient.LINEAR_DIRECTIONS
      .map(d => `<option value="${d}"${d === state.direction ? ' selected' : ''}>${d}</option>`).join('')
    + '<option value="custom">Custom (sudut)…</option>';

  /* ---------- preset ---------- */
  const presetsWrap = $('#gr-presets', root);
  presetsWrap.innerHTML = TB.Gradient.GRADIENT_PRESETS
    .map((p, i) => `<button type="button" class="chip-btn" data-preset="${i}">${p.name}</button>`).join('');
  function markPreset(idx){
    $$('#gr-presets .chip-btn', root).forEach(b => b.classList.toggle('active', +b.dataset.preset === idx));
  }
  presetsWrap.querySelectorAll('.chip-btn').forEach(btn => {
    btn.onclick = () => {
      const p = TB.Gradient.GRADIENT_PRESETS[+btn.dataset.preset];
      stops = p.colors.map((c, i) => ({ color: c.toLowerCase(), pos: Math.round(i * 100 / (p.colors.length - 1)) }));
      markPreset(+btn.dataset.preset);
      renderStops();
      refresh();
    };
  });

  /* ---------- daftar color stop ---------- */
  function renderStops(){
    stopsWrap.innerHTML = stops.map((s, i) => `
      <div class="field-row" style="grid-template-columns:auto 1fr auto;align-items:center;gap:8px" data-idx="${i}">
        <input type="color" value="${s.color}" aria-label="Warna stop ${i + 1}"
               style="width:48px;height:40px;padding:3px;border:1px solid var(--border);border-radius:8px;background:var(--surface);cursor:pointer">
        <div class="input-group"><input type="number" class="input pos" value="${s.pos}" min="0" max="100" step="1" aria-label="Posisi stop ${i + 1}"><span class="suffix">%</span></div>
        <button type="button" class="btn btn-ghost del" style="padding:9px 12px" aria-label="Hapus stop ${i + 1}">✕</button>
      </div>`).join('');
    stopsWrap.querySelectorAll('[data-idx]').forEach(row => {
      const idx = +row.dataset.idx;
      row.querySelector('input[type="color"]').addEventListener('input', e => {
        stops[idx].color = e.target.value; markPreset(-1); refresh();
      });
      row.querySelector('.pos').addEventListener('input', e => {
        stops[idx].pos = TB.Gradient.clampPos(e.target.value); markPreset(-1); refresh();
      });
      row.querySelector('.del').onclick = () => {
        if(stops.length <= 2){ toast('Minimal 2 color stop'); return; }
        stops.splice(idx, 1); markPreset(-1); renderStops(); refresh();
      };
    });
  }

  $('#gr-add', root).onclick = () => {
    // Stop baru: posisi di tengah rentang saat ini, warna netral yang kontras.
    const pos = Math.round((stops[0].pos + stops[stops.length - 1].pos) / 2);
    stops.push({ color: '#ffffff', pos: TB.Gradient.clampPos(pos) });
    markPreset(-1); renderStops(); refresh();
  };

  /* ---------- tipe & arah ---------- */
  $$('#gr-type button', root).forEach(btn => {
    btn.onclick = () => {
      state.type = btn.dataset.type;
      $$('#gr-type button', root).forEach(b => b.classList.toggle('active', b === btn));
      dirField.style.display = state.type === 'linear' ? '' : 'none';
      if(state.type !== 'linear') angleField.style.display = 'none';
      else if(dirSel.value === 'custom') angleField.style.display = '';
      refresh();
    };
  });
  dirSel.onchange = () => {
    state.direction = dirSel.value;
    angleField.style.display = dirSel.value === 'custom' ? '' : 'none';
    refresh();
  };
  angleIn.oninput = () => { state.angle = TB.Calc.clampInt(angleIn.value, 0, 360); refresh(); };

  /* ---------- generate & preview ---------- */
  function refresh(){
    const css = TB.Gradient.buildGradientCSS({ type: state.type, direction: state.direction, angle: state.angle, stops });
    preview.style.background = css;
    cssOut.value = `background: ${css};`;
  }

  $('#gr-copy', root).onclick = () => {
    if(!cssOut.value){ toast('Belum ada kode CSS untuk disalin'); return; }
    copyText(cssOut.value);
  };

  renderStops();
  refresh();
}
