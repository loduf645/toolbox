/* ============================================================
   TOOLS: zakat.js — Kalkulator Zakat [Kalkulator]
   Rumus zakat & nisab: pure/calculators.js
   ============================================================ */
function renderZakat(){ return `<div class="tool-layout"><div class="panel"><div class="panel-title">${ICONS.zakat} Input</div><div class="field"><label class="field-label">Jenis Zakat</label><div class="segmented"><button type="button" class="active" data-z="maal">Maal</button><button type="button" data-z="penghasilan">Penghasilan</button><button type="button" data-z="fitrah">Fitrah</button></div></div><div class="field" id="z-asset"><label class="field-label">Total Harta</label><div class="input-group"><span class="suffix">Rp</span><input type="number" class="input" id="z-amount" value="100000000"></div></div><div class="field" id="z-gold"><label class="field-label">Harga Emas/gr</label><div class="input-group"><span class="suffix">Rp</span><input type="number" class="input" id="z-goldv" value="1350000"></div></div><div class="field" id="z-rice" style="display:none"><label class="field-label">Harga Beras/kg</label><div class="input-group"><span class="suffix">Rp</span><input type="number" class="input" id="z-ricev" value="15000"></div></div><div class="field" id="z-fam" style="display:none"><label class="field-label">Jumlah Jiwa</label><input type="number" class="input" id="z-famv" value="4"></div><button class="btn btn-block" id="z-c">Hitung</button></div><div class="panel"><div class="panel-title">${ICONS.zakat} Hasil</div><div class="result-display"><div class="result-value" id="z-v">—</div></div></div></div>`; }
function mountZakat(root){ 
  let z = 'maal'; 
  function ui(){ $('#z-asset', root).style.display = z==='fitrah'?'none':''; $('#z-gold', root).style.display = z==='fitrah'?'none':''; $('#z-rice', root).style.display = z==='fitrah'?'':'none'; $('#z-fam', root).style.display = z==='fitrah'?'':'none'; } 
  $$('[data-z]', root).forEach(b => b.onclick = () => { $$('[data-z]', root).forEach(x => x.classList.remove('active')); b.classList.add('active'); z = b.dataset.z; ui(); }); 
  function c(){ 
    // Rumus zakat (nisab 85 gr emas, 2,5%, fitrah 2,5 kg/jiwa) ada di
    // pure/calculators.js (TB.Calc) — teruji unit.
    if(z === 'fitrah'){
      const f = parseInt($('#z-famv', root).value)||1; const r = parseFloat($('#z-ricev', root).value)||0;
      const el = $('#z-v', root);
      // Guard input negatif: tanpa ini "Jumlah Jiwa"/"Harga Beras" negatif
      // menghasilkan nominal "Rp -xxx" yang tidak masuk akal.
      if(!(f >= 1) || !(r >= 0)){ el.textContent = 'Rp 0'; el.title = 'Jumlah jiwa harus ≥ 1 dan harga beras tidak boleh negatif'; return; }
      el.title = '';
      el.textContent = `Rp ${fmtNum(TB.Calc.zakatFitrahDue(f, r),0)}`; return;
    } 
    const g = parseFloat($('#z-goldv', root).value)||0, a = parseFloat($('#z-amount', root).value)||0;
    const el = $('#z-v', root);
    // Harga emas 0 membuat nisab 0, sehingga harta berapa pun dianggap wajib zakat.
    // Perlakukan sebagai input belum lengkap, bukan sebagai "wajib zakat".
    const res = TB.Calc.zakatMaalDue(a, g, { monthly: z === 'penghasilan' });
    if(res.incomplete){ el.textContent = 'Rp 0'; el.title = 'Isi harga emas per gram untuk menghitung nisab'; return; }
    el.title = '';
    el.textContent = res.wajib ? `Rp ${fmtNum(res.due,0)}` : 'Rp 0';
  } 
  $('#z-c', root).onclick = c; ui(); c(); 
}

