/* ============================================================
   TOOLS: age.js — Kalkulator Umur & Countdown [Kalkulator]
   Hitung umur & pecah durasi: pure/calculators.js
   ============================================================ */
function renderAge(){ return `<div class="tool-layout single"><div class="panel"><div class="panel-title">${ICONS.age} Mode</div><div class="segmented"><button type="button" class="active" data-m="age">Hitung Umur</button><button type="button" data-m="countdown">Countdown</button></div></div><div class="panel" id="a-in"></div><div class="panel" id="a-out"></div></div>`; }
function mountAge(root){ 
  let m = 'age', timer = null;
  const inP = $('#a-in', root), outP = $('#a-out', root);
  function stopTimer(){ if(timer){ clearInterval(timer); timer = null; } }
  function rIn(){ 
    if(m === 'age'){ inP.innerHTML = `<div class="panel-title">Tanggal Lahir</div><input type="date" class="input" id="a-d" value="2000-01-01"><button class="btn btn-block" id="a-c" style="margin-top:16px">Hitung</button>`; $('#a-c', root).onclick = cA; } 
    else { inP.innerHTML = `<div class="panel-title">Target</div><input type="datetime-local" class="input" id="a-t" value="${toLocalDateTimeInput(new Date(Date.now()+7*86400000))}"><button class="btn btn-block" id="a-s" style="margin-top:16px">Mulai</button>`; $('#a-s', root).onclick = sC; }
  } 
  function cA(){
    const raw = $('#a-d', root).value;
    const b = new Date(raw), n = new Date();
    if(!raw || isNaN(b.getTime())){
      outP.innerHTML = '<div class="empty">Masukkan tanggal lahir yang valid</div>';
      return;
    }
    if(b > n){
      outP.innerHTML = '<div class="empty">Tanggal lahir tidak boleh di masa depan</div>';
      return;
    }
    // Logika "pinjam hari" kalender ada di pure/calculators.js (TB.Calc) — teruji unit.
    const age = TB.Calc.ageParts(b, n);
    outP.innerHTML = `<div class="result-display"><div class="result-value">${age.years} thn ${age.months} bln ${age.days} hr</div></div>`; 
  } 
  function sC(){
    stopTimer();
    const t = new Date($('#a-t', root).value);
    if(isNaN(t.getTime())){ toast('Tanggal target tidak valid'); return; }
    if(t <= new Date()){
      outP.innerHTML = '<div class="empty">Target sudah terlewati. Pilih waktu di masa depan.</div>';
      return;
    }
    function u(){
      if(!root.isConnected){ stopTimer(); return; }
      const diff = t - new Date();
      // Target tercapai: berhenti tepat di nol, jangan menghitung naik lagi.
      if(diff <= 0){
        stopTimer();
        outP.innerHTML = `<div class="result-display"><div class="result-value mono">0:00:00:00</div><div class="result-label">Waktu tercapai</div></div>`;
        toast('Countdown selesai');
        return;
      }
      const p = TB.Calc.countdownParts(diff);
      outP.innerHTML = `<div class="result-display"><div class="result-value mono">${p.days}:${TB.TextUtils.pad2(p.hours)}:${TB.TextUtils.pad2(p.minutes)}:${TB.TextUtils.pad2(p.seconds)}</div><div class="result-label">hari : jam : menit : detik</div></div>`;
    }
    u(); timer = setInterval(u, 1000);
  }
  $$('[data-m]', root).forEach(b => b.onclick = () => {
    $$('[data-m]', root).forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    m = b.dataset.m;
    stopTimer();
    outP.innerHTML = '';
    rIn();
  });
  // Didaftarkan sekali di sini (bukan di dalam sC) agar interval tetap dibersihkan
  // walau pengguna berpindah tool tanpa pernah menekan "Mulai" lagi.
  _toolCleanup = stopTimer;
  rIn();
}

