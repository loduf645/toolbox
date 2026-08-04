/* ============================================================
   TOOLS: loan.js — Kalkulator Cicilan & KPR [Kalkulator]
   Anuitas & amortisasi: pure/calculators.js
   ============================================================ */
function renderLoan(){ return `<div class="tool-layout"><div class="panel"><div class="panel-title">${ICONS.loan} Input Pinjaman</div><div class="field"><label class="field-label">Pokok Pinjaman</label><div class="input-group"><span class="suffix">Rp</span><input type="number" class="input" id="l-p" value="500000000"></div></div><div class="field-row"><div class="field"><label class="field-label">Bunga / Tahun</label><div class="input-group"><input type="number" class="input" id="l-r" value="6"><span class="suffix">%</span></div></div><div class="field"><label class="field-label">Tenor (Tahun)</label><input type="number" class="input" id="l-t" value="10"></div></div><button class="btn btn-block" id="l-c">Hitung</button></div><div class="panel"><div class="panel-title">${ICONS.loan} Ringkasan</div><div class="result-display"><div class="result-value" id="l-m">—</div><div class="result-label">Cicilan / Bulan</div></div><div class="stat-grid" style="margin-top:16px"><div class="stat-card"><div class="label">Total Bayar</div><div class="value" id="l-total" style="font-size:18px">—</div></div><div class="stat-card"><div class="label">Total Bunga</div><div class="value" id="l-interest" style="font-size:18px">—</div></div></div></div></div><div class="panel" style="grid-column:1/-1"><div class="panel-title">${ICONS.loan} Tabel Amortisasi</div><div class="table-wrap" id="l-table"><div class="empty">Klik Hitung untuk melihat tabel</div></div></div>`; }
function mountLoan(root){ 
  function c(){
    let P = Math.max(0, parseFloat($('#l-p', root).value) || 0);
    const annualPct = Math.max(0, parseFloat($('#l-r', root).value) || 0);
    // Batasi tenor 1..50 tahun: mencegah n=0 (pembagian nol) dan tabel raksasa.
    const years = Math.min(50, Math.max(1, parseInt($('#l-t', root).value) || 1));
    // Guard nilai ekstrem: input seperti 1e400 menjadi Infinity dan menghasilkan
    // cicilan Infinity yang dirender sebagai "Rp -".
    if(!isFinite(P)) P = 0;
    if(P <= 0){
      $('#l-m', root).textContent = 'Rp 0';
      $('#l-total', root).textContent = 'Rp 0';
      $('#l-interest', root).textContent = 'Rp 0';
      $('#l-table', root).innerHTML = '<div class="empty">Masukkan pokok pinjaman lebih dari 0</div>';
      return;
    }
    // Rumus anuitas + amortisasi ada di pure/calculators.js (TB.Calc) — teruji unit.
    const s = TB.Calc.loanSummary(P, annualPct, years);
    $('#l-m', root).textContent = `Rp ${fmtNum(s.monthly,0)}`; 
    $('#l-total', root).textContent = `Rp ${fmtNum(s.totalPay,0)}`; 
    $('#l-interest', root).textContent = `Rp ${fmtNum(s.totalInterest,0)}`; 
    // Tabel amortisasi: iterasi WAJIB per bulan agar saldo akurat; agregasi tahunan
    // dilakukan dengan mengakumulasi, bukan dengan melompati bulan.
    const monthly = TB.Calc.amortizationMonthly(P, annualPct, years);
    const showMonthly = s.months <= 24;   // tampilkan detail bulanan bila <= 2 tahun
    const rows = showMonthly
      ? monthly.map(r => `<tr><td>Bulan ${r.month}</td><td>Rp ${fmtNum(r.payment,0)}</td><td>Rp ${fmtNum(r.principal,0)}</td><td>Rp ${fmtNum(r.interest,0)}</td><td>Rp ${fmtNum(r.balance,0)}</td></tr>`).join('')
      : TB.Calc.aggregateYearly(monthly).map(r => `<tr><td>Tahun ${r.year}</td><td>Rp ${fmtNum(r.payment,0)}</td><td>Rp ${fmtNum(r.principal,0)}</td><td>Rp ${fmtNum(r.interest,0)}</td><td>Rp ${fmtNum(r.balance,0)}</td></tr>`).join('');
    $('#l-table', root).innerHTML = `<table><thead><tr><th>Periode</th><th>Cicilan</th><th>Pokok</th><th>Bunga</th><th>Sisa</th></tr></thead><tbody>${rows}</tbody></table>`; 
  } 
  $('#l-c', root).onclick = c; c(); 
}

