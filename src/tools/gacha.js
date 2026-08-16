/* ============================================================
   TOOLS: gacha.js — Simulator Gacha [Simulasi]
   Tidak ada logic murni yang diekstrak (dominan wiring UI/CDN).
   ============================================================ */
function renderGacha(){ return `<div class="tool-layout single"><div class="panel"><div class="panel-title">${ICONS.gacha} Konfigurasi</div><div class="field"><label class="field-label">Game</label><select class="select" id="g-g"><option value="genshin">Genshin</option><option value="wuwa">Wuwa</option></select></div><button class="btn btn-block" id="g-p" style="margin-top:16px">Pull 1x</button><button class="btn btn-secondary btn-block" id="g-p10" style="margin-top:8px">Pull 10x</button><div class="stat-grid" style="margin-top:16px"><div class="stat-card"><div class="label">Pity 5★</div><div class="value" id="g-pity">0/90</div></div><div class="stat-card"><div class="label">Pity 4★</div><div class="value" id="g-pity4">0/10</div></div><div class="stat-card"><div class="label">Jaminan rate-up</div><div class="value" id="g-guar" style="font-size:18px">Tidak</div></div></div><button class="btn btn-ghost btn-block" id="g-reset" style="margin-top:8px">Reset</button></div><div class="panel"><div class="panel-title">${ICONS.gacha} Hasil</div><div id="g-stats" style="font-size:13px;color:var(--muted);margin-bottom:12px">Belum ada pull</div><div id="g-l" style="display:flex;flex-wrap:wrap;gap:6px"></div><p class="field-hint" style="margin-top:14px">Simulasi edukatif: 50/50, jaminan rate-up, soft &amp; hard pity. Angka adalah model komunitas, bukan rate resmi.</p></div></div>`; }
function mountGacha(root){
  // Parameter per game (banner karakter). Angka mengikuti model yang lazim
  // dipakai komunitas untuk mendekati rate resmi.
  const GAMES = {
    genshin: { name:'Genshin Impact', base5:0.006, soft5:74, hard5:90, base4:0.051, hard4:10, inc5:0.062 },
    wuwa:    { name:'Wuthering Waves', base5:0.008, soft5:66, hard5:80, base4:0.060, hard4:10, inc5:0.078 }
  };
  const MAX_HISTORY = 100;   // batasi DOM agar tidak berat setelah ribuan pull

  let cfg = GAMES.genshin;
  let pity5 = 0, pity4 = 0, guaranteed = false;
  let stats = { pulls:0, c5:0, c4:0, c3:0, wins:0, losses:0 };
  const listEl = $('#g-l', root);

  function rate5(){
    if(pity5 + 1 >= cfg.hard5) return 1;
    if(pity5 + 1 >= cfg.soft5) return Math.min(1, cfg.base5 + (pity5 + 1 - cfg.soft5 + 1) * cfg.inc5);
    return cfg.base5;
  }
  function pull(){
    pity5++; pity4++;
    if(Math.random() < rate5()){
      pity5 = 0; pity4 = 0;
      // 50/50: kalah -> karakter standar, dan pull 5★ berikutnya dijamin rate-up.
      let rateUp;
      // Pull terjamin BUKAN hasil coin-flip 50/50 asli -> jangan dihitung ke stats,
      // supaya "menang 50/50" tetap merepresentasikan rate menang yang sebenarnya.
      if(guaranteed){ rateUp = true; guaranteed = false; }
      else if(Math.random() < 0.5){ rateUp = true; stats.wins++; }
      else { rateUp = false; guaranteed = true; stats.losses++; }
      return { star:5, rateUp };
    }
    if(pity4 >= cfg.hard4 || Math.random() < cfg.base4){ pity4 = 0; return { star:4 }; }
    return { star:3 };
  }
  function render(r){
    stats.pulls++;
    if(r.star === 5) stats.c5++; else if(r.star === 4) stats.c4++; else stats.c3++;
    const bg = r.star === 5 ? (r.rateUp ? '#D4A574' : '#B08D57') : r.star === 4 ? '#8B6BB1' : '#7A6F5E';
    const el = document.createElement('div');
    el.style.cssText = `width:40px;height:50px;background:${bg};border-radius:4px;display:grid;place-items:center;color:#fff;font-size:12px;font-weight:700;flex:none`;
    el.textContent = `${r.star}★`;
    if(r.star === 5) el.title = r.rateUp ? 'Rate-up (menang 50/50)' : 'Standar (kalah 50/50)';
    // prepend elemen DOM: tidak mem-parse ulang seluruh history seperti innerHTML.
    listEl.prepend(el);
    while(listEl.children.length > MAX_HISTORY) listEl.lastElementChild.remove();
    update();
    if(r.star === 5) toast(r.rateUp ? '🌟 5★ rate-up!' : '⭐ 5★ standar (kalah 50/50)');
  }
  function update(){
    $('#g-pity', root).textContent = `${pity5}/${cfg.hard5}`;
    const g4 = $('#g-pity4', root); if(g4) g4.textContent = `${pity4}/${cfg.hard4}`;
    const gg = $('#g-guar', root); if(gg) gg.textContent = guaranteed ? 'Ya' : 'Tidak';
    const gs = $('#g-stats', root);
    if(gs) gs.textContent = stats.pulls
      ? `${stats.pulls} pull · 5★ ${stats.c5} (${(stats.c5/stats.pulls*100).toFixed(1)}%) · 4★ ${stats.c4} · menang 50/50 ${stats.wins}/${stats.wins+stats.losses}`
      : 'Belum ada pull';
  }
  function reset(){
    pity5 = 0; pity4 = 0; guaranteed = false;
    stats = { pulls:0, c5:0, c4:0, c3:0, wins:0, losses:0 };
    listEl.innerHTML = ''; update();
  }

  $('#g-g', root).onchange = e => { cfg = GAMES[e.target.value] || GAMES.genshin; reset(); };
  $('#g-p', root).onclick  = () => render(pull());
  const b10 = $('#g-p10', root);
  if(b10) b10.onclick = () => { for(let i=0;i<10;i++) render(pull()); };
  const br = $('#g-reset', root); if(br) br.onclick = reset;
  update();
}



