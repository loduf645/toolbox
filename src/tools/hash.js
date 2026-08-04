/* ============================================================
   TOOLS: hash.js — Hash Generator [Developer]
   MD5 pure-JS: pure/crypto-helpers.js (SHA via crypto.subtle)
   ============================================================ */
function renderHash(){
  return `
    <div class="tool-layout single">
      <div class="panel"><div class="panel-title">${ICONS.hash} Input</div><div class="field"><label class="field-label">Teks</label><textarea class="textarea" id="hash-input" style="min-height:120px">Halo Dunia!</textarea></div></div>
      <div class="panel">
        <div class="panel-title">${ICONS.hash} Hasil Hash</div>
        <div class="field"><label class="field-label">SHA-256</label><div class="input-group"><input type="text" class="input mono" id="hash-sha256" readonly style="font-size:13px"><button class="copy-btn" data-target="hash-sha256">${ICONS.copy}</button></div></div>
        <div class="field"><label class="field-label">SHA-1</label><div class="input-group"><input type="text" class="input mono" id="hash-sha1" readonly style="font-size:13px"><button class="copy-btn" data-target="hash-sha1">${ICONS.copy}</button></div></div>
        <div class="field"><label class="field-label">MD5 <span class="field-hint">(Pure JS)</span></label><div class="input-group"><input type="text" class="input mono" id="hash-md5" readonly style="font-size:13px"><button class="copy-btn" data-target="hash-md5">${ICONS.copy}</button></div></div>
      </div>
    </div>`;
}
async function mountHash(root){
  const input = $('#hash-input', root);
  async function calcHash(algo, text){
    if(window.crypto && window.crypto.subtle){
      const encoder = new TextEncoder(); const data = encoder.encode(text);
      const hashBuffer = await crypto.subtle.digest(algo, data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      return 'Tidak didukung di file:// (HTTPS only)';
    }
  }
  // Setiap pemanggilan diberi token; hanya hasil dari token terbaru yang boleh
  // menulis ke DOM. Tanpa ini, mengetik cepat bisa membuat hash dari teks LAMA
  // (yang selesai belakangan) menimpa hash teks terbaru.
  let reqToken = 0;
  async function update(){
    const token = ++reqToken;
    const text = input.value;
    if(!text){
      $('#hash-sha256', root).value = ''; $('#hash-sha1', root).value = ''; $('#hash-md5', root).value = '';
      return;
    }
    try {
      const [sha256, sha1] = await Promise.all([calcHash('SHA-256', text), calcHash('SHA-1', text)]);
      if(token !== reqToken || !root.isConnected) return;   // hasil basi -> buang
      $('#hash-sha256', root).value = sha256;
      $('#hash-sha1', root).value = sha1;
      $('#hash-md5', root).value = TB.Crypto.md5(text);
    } catch(e){
      if(token !== reqToken || !root.isConnected) return;
      console.warn('hash error:', e);
      $('#hash-sha256', root).value = 'Gagal menghitung hash';
      $('#hash-sha1', root).value = ''; $('#hash-md5', root).value = '';
    }
  }
  input.addEventListener('input', update);
  root.querySelectorAll('.copy-btn[data-target]').forEach(btn => btn.onclick = () => { const val = $(`#${btn.dataset.target}`, root).value; if(val) copyText(val); });
  update();
}
/* Implementasi MD5 dipindah ke src/pure/crypto-helpers.js (TB.Crypto.md5)
   agar bisa di-unit-test tanpa DOM. Lihat tests/crypto.test.js */

