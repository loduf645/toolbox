/* ============================================================
   TOOLS: bmi.js — Kalkulator BMI & Kalori [Kalkulator]
   Rumus BMI/BMR/TDEE: pure/calculators.js
   ============================================================ */
function renderBMI(){ return `<div class="tool-layout"><div class="panel"><div class="panel-title">${ICONS.bmi} Data Diri</div><div class="field"><label class="field-label">Jenis Kelamin</label><div class="segmented"><button type="button" class="active" data-gender="male">Laki-laki</button><button type="button" data-gender="female">Perempuan</button></div></div><div class="field-row"><div class="field"><label class="field-label">Berat (kg)</label><div class="input-group"><input type="number" class="input" id="bmi-w" value="60" min="1"><span class="suffix">kg</span></div></div><div class="field"><label class="field-label">Tinggi (cm)</label><div class="input-group"><input type="number" class="input" id="bmi-h" value="170" min="50"><span class="suffix">cm</span></div></div></div><div class="field-row"><div class="field"><label class="field-label">Usia</label><input type="number" class="input" id="bmi-a" value="25"></div><div class="field"><label class="field-label">Aktivitas</label><select class="select" id="bmi-act"><option value="1.2">Sangat ringan</option><option value="1.375">Ringan</option><option value="1.55" selected>Sedang</option><option value="1.725">Berat</option><option value="1.9">Atlet</option></select></div></div><button class="btn btn-block" id="bmi-c">Hitung</button></div><div class="panel"><div class="panel-title">${ICONS.bmi} Hasil</div><div class="result-display"><div class="result-value" id="bmi-v">—</div><div class="pill neutral" id="bmi-p" style="margin-top:14px">—</div></div><div class="stat-grid" style="margin-top:20px"><div class="stat-card"><div class="label">BMR</div><div class="value" id="bmi-bmr">—</div><div class="sub">Kalori basal/hari</div></div><div class="stat-card"><div class="label">TDEE</div><div class="value" id="bmi-tdee">—</div><div class="sub">Total kebutuhan/hari</div></div></div></div></div>`; }
function mountBMI(root){ 
  let g = 'male'; 
  $$('[data-gender]', root).forEach(b => b.onclick = () => { $$('[data-gender]', root).forEach(x => x.classList.remove('active')); b.classList.add('active'); g = b.dataset.gender; }); 
  function c(){ 
    const w = parseFloat($('#bmi-w', root).value), h = parseFloat($('#bmi-h', root).value),
          a = parseInt($('#bmi-a', root).value), act = parseFloat($('#bmi-act', root).value) || 1.2;
    // Guard eksplisit: nilai <= 0 atau NaN sebelumnya lolos diam-diam dan
    // menghasilkan BMI negatif / hasil basi dari perhitungan sebelumnya.
    const invalid = !(w > 0) || !(h > 0) || !(a > 0) || w > 500 || h > 300 || a > 130;
    if(invalid){
      $('#bmi-v', root).textContent = '—';
      const pv = $('#bmi-p', root); pv.textContent = 'Input tidak valid'; pv.className = 'pill danger';
      $('#bmi-bmr', root).textContent = '—';
      $('#bmi-tdee', root).textContent = '—';
      return;
    }
    // Rumus BMI/BMR/TDEE + kategori ada di pure/calculators.js (TB.Calc) — teruji unit.
    const bmi = TB.Calc.bmiValue(w, h); 
    const { label: cat, tone: pc } = TB.Calc.bmiCategory(bmi); 
    const bmr = TB.Calc.bmrMifflin(g, w, h, a); 
    const tdee = TB.Calc.tdeeFromBmr(bmr, act); 
    $('#bmi-v', root).textContent = bmi.toFixed(1); 
    const p = $('#bmi-p', root); p.textContent = cat; p.className = `pill ${pc}`; 
    $('#bmi-bmr', root).textContent = fmtNum(bmr, 0) + ' kkal'; 
    $('#bmi-tdee', root).textContent = fmtNum(tdee, 0) + ' kkal'; 
  } 
  $('#bmi-c', root).onclick = c; c(); 
}



