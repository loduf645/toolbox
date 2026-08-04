/* ============================================================
   TOOLS: decision.js — Pengambil Keputusan Acak [Simulasi]
   Parse opsi baris: pure/text-utils.js
   ============================================================ */
function renderDecision(){ return `<div class="tool-layout single"><div class="panel"><div class="panel-title">${ICONS.decision} Opsi</div><textarea class="textarea" id="d-o" style="min-height:140px">Nasi goreng\nMie ayam\nBakso</textarea><button class="btn btn-block" id="d-s" style="margin-top:16px">Putar</button></div><div class="panel"><div class="wheel-wrap"><canvas class="wheel" id="d-c" width="300" height="300"></canvas></div></div></div>`; }
function mountDecision(root){ 
  const c = $('#d-c', root), ctx = c.getContext('2d'), ta = $('#d-o', root); 
  let rot = 0, spin = false, sel = -1, opts = []; 
  function gO(){ return TB.TextUtils.splitNonEmptyLines(ta.value); } 
  function dr(o = opts){ 
    const w = c.width; 
    ctx.clearRect(0,0,w,w); 
    if(!o.length) return; 
    const colors = ['#A8421C','#D4A574','#8A3617','#C4976A','#6B3410','#B8895E']; 
    const sa = Math.PI*2/o.length; 
    ctx.font = `bold ${Math.max(11, Math.min(16, Math.floor(200/o.length)))}px Manrope, sans-serif`; 
    ctx.textBaseline = 'middle'; 
    for(let i=0; i<o.length; i++){ 
      const s = rot+i*sa-Math.PI/2; 
      ctx.beginPath(); 
      ctx.moveTo(w/2,w/2); 
      ctx.arc(w/2,w/2,w/2-20,s,s+sa); 
      ctx.fillStyle = colors[i%colors.length]; 
      ctx.fill(); 
      ctx.save(); 
      ctx.translate(w/2,w/2); 
      ctx.rotate(s+sa/2); 
      ctx.fillStyle = '#FFF'; 
      const maxLen = Math.max(6, Math.floor(180/o.length)); 
      ctx.fillText(o[i].slice(0,maxLen), 24, 0); 
      ctx.restore(); 
    } 
    // Draw pointer/triangle at top 
    ctx.fillStyle = '#1F1B14'; 
    ctx.beginPath(); 
    ctx.moveTo(w/2-12, 6); 
    ctx.lineTo(w/2+12, 6); 
    ctx.lineTo(w/2, 24); 
    ctx.closePath(); 
    ctx.fill(); 
  } 
  let rafId = null;
  function sp(){
    if(spin) return;
    opts = gO();
    if(opts.length < 2){ toast('Minimal 2 opsi untuk diputar'); return; }
    spin = true;
    sel = Math.floor(Math.random()*opts.length);
    const sa = Math.PI*2/opts.length, t = -sel*sa-sa/2+Math.PI*2*5;
    const st = rot, dur = 3000, n = performance.now();
    function an(now){
      // Hentikan animasi bila tool sudah dilepas dari DOM (cegah rAF loop yatim).
      if(!root.isConnected){ spin = false; rafId = null; return; }
      const e = (now-n)/dur;
      if(e >= 1){ spin = false; rafId = null; rot = t; dr(); toast(`🎯 ${opts[sel]}`); return; }
      rot = st+(t-st)*(1-Math.pow(1-e,3));
      dr(opts);
      rafId = requestAnimationFrame(an);
    }
    rafId = requestAnimationFrame(an);
  }
  _toolCleanup = () => { if(rafId !== null){ cancelAnimationFrame(rafId); rafId = null; } spin = false; };
  ta.oninput = () => { opts = gO(); dr(); }; 
  $('#d-s', root).onclick = sp; 
  opts = gO(); dr(); 
}

