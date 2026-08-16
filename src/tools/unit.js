/* ============================================================
   TOOLS: unit.js — Konverter Unit [Konverter]
   Tabel faktor & rumus: pure/calculators.js
   ============================================================ */
function renderUnit(){
  return `
    <div class="tool-layout single">
      <div class="panel">
        <div class="panel-title">${ICONS.unit} Kategori</div>
        <div class="check-grid" id="uc">
          <label class="check-card active"><input type="radio" name="cat" value="panjang" checked><span class="check-box"></span>Panjang</label>
          <label class="check-card"><input type="radio" name="cat" value="berat"><span class="check-box"></span>Berat</label>
          <label class="check-card"><input type="radio" name="cat" value="suhu"><span class="check-box"></span>Suhu</label>
          <label class="check-card"><input type="radio" name="cat" value="volume"><span class="check-box"></span>Volume</label>
          <label class="check-card"><input type="radio" name="cat" value="kecepatan"><span class="check-box"></span>Kecepatan</label>
          <label class="check-card"><input type="radio" name="cat" value="data"><span class="check-box"></span>Data</label>
        </div>
      </div>
      <div class="panel">
        <div class="panel-title">${ICONS.unit} Konversi</div>
        <div class="field-row" style="grid-template-columns:1fr auto 1fr;align-items:end">
          <div class="field"><label class="field-label">Dari</label><input type="number" class="input" id="ufv" value="1" step="any"><select class="select" id="ufu"></select></div>
          <button class="btn btn-secondary" id="uswap" style="margin-bottom:0;padding:12px">⇄</button>
          <div class="field"><label class="field-label">Ke</label><input type="number" class="input" id="utv" readonly style="background:var(--surface-alt)"><select class="select" id="utu"></select></div>
        </div>
        <div class="result-display" style="margin-top:20px"><div class="result-value" id="ures">—</div></div>
      </div>
    </div>`;
}
function mountUnit(root){
  const cats = $$('input[name="cat"]', root); 
  const fv = $('#ufv', root), tv = $('#utv', root), fu = $('#ufu', root), tu = $('#utu', root), res = $('#ures', root);
  // Tabel faktor & rumus konversi ada di pure/calculators.js (TB.Calc) — teruji unit.
  const D = TB.Calc.UNIT_DATA;
  function up(){ 
    const c = $$('input[name="cat"]:checked', root)[0].value; 
    const u = Array.isArray(D[c].u) ? D[c].u : Object.keys(D[c].u); 
    fu.innerHTML = u.map(x => `<option>${x}</option>`).join(''); 
    tu.innerHTML = u.map((x,i) => `<option ${i===1?'selected':''}>${x}</option>`).join(''); 
    conv(); 
  }
  function conv(){ 
    const c = $$('input[name="cat"]:checked', root)[0].value; 
    const v = parseFloat(fv.value); 
    if(isNaN(v)){ tv.value = ''; res.textContent = '—'; return; } 
    const f = fu.value, t = tu.value; 
    const o = TB.Calc.convertUnit(c, v, f, t); 
    tv.value = o.toFixed(6).replace(/\.?0+$/, ''); 
    res.textContent = `${fmtNum(o,6)} ${t}`; 
  }
  cats.forEach(r => r.onchange = () => { $$('.check-card', root).forEach(c => c.classList.remove('active')); r.closest('.check-card').classList.add('active'); up(); });
  [fv, fu, tu].forEach(e => e.oninput = conv);
  $('#uswap', root).onclick = () => { const f = fu.value; fu.value = tu.value; tu.value = f; fv.value = tv.value; conv(); };
  up();
}



