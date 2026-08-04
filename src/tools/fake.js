/* ============================================================
   TOOLS: fake.js — Fake Data Generator [Developer]
   Tidak ada logic murni yang diekstrak (dominan wiring UI/CDN).
   ============================================================ */

function renderFake(){
  return `
    <div class="tool-layout single">
      <div class="panel">
        <div class="panel-title">${ICONS.fake} Konfigurasi</div>
        <div class="field-row">
          <div class="field"><label class="field-label">Format Output</label><select class="select" id="fake-type"><option value="json">JSON Object (Lengkap)</option><option value="name">Hanya Nama</option><option value="email">Hanya Email</option><option value="phone">Hanya Telepon</option><option value="address">Hanya Alamat</option></select></div>
          <div class="field"><label class="field-label">Jumlah Data</label><input type="number" class="input" id="fake-count" value="5" min="1" max="50"></div>
        </div>
        <button class="btn btn-block" id="fake-gen">${ICONS.refresh} Generate Data</button>
      </div>
      <div class="panel">
        <div class="panel-title">${ICONS.fake} Hasil <button class="copy-btn" id="fake-copy" style="float:right">${ICONS.copy} Salin</button></div>
        <div id="fake-output" class="json-output" style="max-height:400px"></div>
      </div>
    </div>`;
}
function mountFake(root){
  function pk(a){ return a[Math.floor(Math.random() * a.length)]; }
  function genName(){ return `${pk(FAKE_DB.depan)} ${pk(FAKE_DB.belakang)}`; }
  function genEmail(name){ const [d, b] = name.toLowerCase().split(' '); return `${d}.${b}${Math.floor(Math.random()*99)}@${pk(FAKE_DB.domain)}`; }
  function genPhone(){ return `08${Math.floor(100000000 + Math.random() * 899999999)}`; }
  function genAddress(){ return `${pk(FAKE_DB.jalan)} No. ${Math.floor(Math.random()*200)}, ${pk(FAKE_DB.kota)}`; }
  function generate(){
    const type = $('#fake-type', root).value; const count = Math.min(50, Math.max(1, parseInt($('#fake-count', root).value) || 5)); let out = [];
    for(let i=0; i<count; i++){
      if(type === 'json'){ const name = genName(); out.push({ id: i+1, name, email: genEmail(name), phone: genPhone(), address: genAddress() }); }
      else if(type === 'name') out.push(genName());
      else if(type === 'email') out.push(genEmail(genName()));
      else if(type === 'phone') out.push(genPhone());
      else if(type === 'address') out.push(genAddress());
    }
    const str = type === 'json' ? JSON.stringify(out, null, 2) : out.join('\n');
    const el = $('#fake-output', root); el.textContent = str; el.className = type === 'json' ? 'json-output' : 'diff-output';
    $('#fake-copy', root).onclick = () => copyText(str);
  }
  $('#fake-gen', root).onclick = generate; generate();
}

