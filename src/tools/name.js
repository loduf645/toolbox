/* ============================================================
   TOOLS: name.js — Generator Nama Acak [Generator]
   Fisher-Yates: pure/crypto-helpers.js
   ============================================================ */
function renderName(){ return `<div class="tool-layout single"><div class="panel"><div class="panel-title">${ICONS.name} Konfigurasi</div><div class="field"><label class="field-label">Gaya</label><select class="select" id="n-s"><option value="fantasi">Fantasi</option><option value="gaming">Gaming</option></select></div><div class="field"><label class="field-label">Jumlah</label><input type="number" class="input" id="n-c" value="5"></div><button class="btn btn-block" id="n-g">Generate</button></div><div class="panel"><div class="panel-title">${ICONS.name} Hasil</div><div id="n-l"></div></div></div>`; }
function mountName(root){ 
  const D = { fantasi:{p:['Aer','Bron','Cael','Dra','Elan','Fen','Gal','Har','Ior','Kel'],s:['dor','win','eth','ius','wen','mir','oth','an','is','ra']}, gaming:{p:['xX','Dr','Pro','GG','Noob','Epic','Mr','Its','The','Ultra'],s:['Sniper','Killer','God','Master','Legend','Pro','Gamer','Boss','King','Slayer']} }; 
  // Bangun semua kombinasi lalu shuffle & slice: deterministik, selalu tepat
  // `c` hasil bila c <= maxPossible. Pendekatan random+retry sebelumnya bisa
  // under-deliver diam-diam saat c mendekati maxPossible (coupon collector problem).
  // Fisher-Yates dipakai dari TB.Crypto.shuffleWith (murni, teruji unit).
  function g(){ 
    const s = $('#n-s', root).value, d = D[s]; 
    const all = []; 
    for(const p of d.p) for(const suf of d.s) all.push(p + suf); 
    const maxPossible = all.length; 
    const requested = parseInt($('#n-c', root).value) || 5; 
    const c = Math.min(Math.max(1, requested), maxPossible); 
    if(requested > maxPossible) toast(`Maks ${maxPossible} kombinasi unik untuk gaya ini`); 
    const names = TB.Crypto.shuffleWith(all, n => Math.floor(Math.random() * n)).slice(0, c); 
    $('#n-l', root).innerHTML = names.map(n => `<div style="padding:10px;border-bottom:1px solid var(--border)">${n}</div>`).join(''); 
  } 
  $('#n-g', root).onclick = g; g(); 
}

