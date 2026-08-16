/* ============================================================
   TOOLS: mc.js — Minecraft Coordinate Converter [Konverter]
   Rasio 1:8 + floor: pure/calculators.js
   ============================================================ */
function renderMC(){ return `<div class="tool-layout single"><div class="panel"><div class="panel-title">${ICONS.mc} Input</div><div class="field-row"><div class="field"><label class="field-label">X</label><input type="number" class="input" id="mc-x" value="192"></div><div class="field"><label class="field-label">Z</label><input type="number" class="input" id="mc-z" value="-352"></div></div><div class="segmented" style="margin-top:16px"><button type="button" class="active" data-d="o2n">Overworld → Nether</button><button type="button" data-d="n2o">Nether → Overworld</button></div></div><div class="panel"><div class="panel-title">${ICONS.mc} Hasil</div><div class="result-display"><div class="result-value mono" id="mc-r">—</div><div class="result-label" id="mc-hint"></div></div></div></div>`; }
function mountMC(root){ 
  let d = 'o2n'; 
  function c(){ 
    const x = parseFloat($('#mc-x', root).value)||0, z = parseFloat($('#mc-z', root).value)||0; 
    // Overworld -> Nether = DIBAGI 8; Nether -> Overworld = DIKALI 8.
    // (Sebelumnya terbalik: 192 menghasilkan 1536, seharusnya 24.)
    // Rumus + pembulatan ke bawah khas koordinat blok: TB.Calc (teruji unit).
    const cv = TB.Calc.minecraftCoords(x, z, d);
    $('#mc-r', root).textContent = `X: ${cv.x}, Z: ${cv.z}`;
    const hint = $('#mc-hint', root);
    if(hint) hint.textContent = d === 'o2n'
      ? 'Overworld → Nether (koordinat dibagi 8)'
      : 'Nether → Overworld (koordinat dikali 8)';
  } 
  $$('[data-d]', root).forEach(b => b.onclick = () => { $$('[data-d]', root).forEach(x => x.classList.remove('active')); b.classList.add('active'); d = b.dataset.d; c(); }); 
  $$('input', root).forEach(i => i.oninput = c); 
  c(); 
}



