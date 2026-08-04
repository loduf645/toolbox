/* ============================================================
   TOOLS: lorem.js — Lorem Ipsum Indonesia [Generator]
   Tidak ada logic murni yang diekstrak (dominan wiring UI/CDN).
   ============================================================ */
function renderLorem(){ return `<div class="tool-layout single"><div class="panel"><div class="panel-title">${ICONS.lorem} Pengaturan</div><div class="field"><label class="field-label">Paragraf</label><input type="number" class="input" id="l-c" value="3"></div><button class="btn btn-block" id="l-g">Generate</button></div><div class="panel"><div class="panel-title">${ICONS.lorem} Hasil</div><div id="l-o" style="min-height:150px"></div></div></div>`; }
function mountLorem(root){ 
  function g(){ 
    const c = parseInt($('#l-c', root).value)||3; 
    let h = ''; 
    for(let i=0; i<c; i++) h += `<p>Ini adalah teks dummy paragraf ${i+1} untuk mengisi kekosongan halaman. Konten ini murni contoh dan tidak bermakna.</p>`; 
    $('#l-o', root).innerHTML = h; 
  } 
  $('#l-g', root).onclick = g; g(); 
}

