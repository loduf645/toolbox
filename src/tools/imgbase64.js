/* ============================================================
   TOOLS: imgbase64.js — Image to Base64 [Konverter]
   Base64/Data URI: pure/base64.js (TB.Base64) · ukuran: TB.Calc.formatBytes
   ============================================================ */
function renderImgBase64(){
  return `
    <div class="tool-layout single">
      <div class="panel">
        <div class="panel-title">${ICONS.imgbase64} Upload Gambar</div>
        <div class="dropzone" id="ib-drop" tabindex="0" role="button" aria-label="Upload gambar">
          <input type="file" id="ib-file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/bmp" class="sr-only">
          <div class="dz-icon">${ICONS.imgbase64}</div>
          <div class="dz-title">Tarik &amp; letakkan gambar di sini</div>
          <div class="dz-sub">atau klik untuk memilih — PNG, JPG, WEBP, GIF, SVG</div>
          <div class="dz-hint">maks 50 MB · 100% lokal, gambar tidak diunggah ke server mana pun</div>
        </div>
      </div>

      <div class="panel" id="ib-empty">
        <div class="empty">Upload gambar untuk melihat hasil Base64 di sini.</div>
      </div>

      <div class="panel" id="ib-result-panel" style="display:none">
        <div class="panel-title">${ICONS.imgbase64} Hasil</div>
        <div class="ir-cmp" style="margin-bottom:16px">
          <div class="ir-cmp-label">Preview</div>
          <img class="ir-cmp-img" id="ib-img" alt="Preview gambar">
          <div class="ir-cmp-meta"><span id="ib-name" style="word-break:break-all"></span></div>
        </div>
        <div class="stat-grid" style="margin-bottom:16px">
          <div class="stat-card"><div class="label">Ukuran File</div><div class="value" id="ib-size" style="font-size:18px">—</div><div class="sub">file asli</div></div>
          <div class="stat-card"><div class="label">Panjang Base64</div><div class="value" id="ib-len" style="font-size:18px">—</div><div class="sub">karakter</div></div>
          <div class="stat-card"><div class="label">Selisih Ukuran</div><div class="value" id="ib-ratio" style="font-size:18px">—</div><div class="sub">string vs file</div></div>
        </div>
        <div class="field">
          <label class="field-label">Data URI Lengkap</label>
          <textarea class="textarea mono" id="ib-uri" style="min-height:110px" readonly aria-label="Data URI"></textarea>
        </div>
        <div class="tt-actions">
          <button type="button" class="btn" id="ib-copy-uri">${ICONS.copy} Salin Data URI</button>
          <button type="button" class="btn btn-secondary" id="ib-copy-b64">Salin Base64</button>
          <button type="button" class="btn btn-ghost" id="ib-clear">Bersihkan</button>
        </div>
      </div>
    </div>`;
}

function mountImgBase64(root){
  const drop = $('#ib-drop', root), fileInput = $('#ib-file', root);
  const emptyPanel = $('#ib-empty', root), resultPanel = $('#ib-result-panel', root);
  const img = $('#ib-img', root), nameEl = $('#ib-name', root);
  const sizeEl = $('#ib-size', root), lenEl = $('#ib-len', root), ratioEl = $('#ib-ratio', root);
  const uriEl = $('#ib-uri', root);

  const MAX_FILE = 50 * 1024 * 1024;   // sama dengan Image Resizer
  let urls = [];                       // ObjectURL aktif (untuk cleanup)
  let current = { b64: '', uri: '' };

  function revokeAll(){ urls.forEach(u => { try{ URL.revokeObjectURL(u); }catch(_){} }); urls = []; }

  async function handleFile(f){
    if(!f || !f.type || !f.type.startsWith('image/')){ toast('File bukan gambar'); return; }
    if(f.size > MAX_FILE){ toast('File lebih dari 50 MB'); return; }
    try{
      // Baca sebagai byte lalu encode manual (bukan FileReader.readAsDataURL)
      // agar string Base64 murni & Data URI bisa dikelola terpisah.
      const buf = await f.arrayBuffer();
      const b64 = TB.Base64.bytesToBase64(new Uint8Array(buf));
      revokeAll();
      const url = URL.createObjectURL(f); urls.push(url);
      img.src = url;
      current.b64 = b64;
      current.uri = TB.Base64.dataUri(f.type, b64);
      nameEl.textContent = f.name;
      sizeEl.textContent = TB.Calc.formatBytes(f.size);
      lenEl.textContent = TB.TextUtils.formatNumberID(b64.length, 0);
      const pct = Math.round((b64.length - f.size) / f.size * 100);
      ratioEl.textContent = (pct >= 0 ? '+' : '') + pct + '%';
      uriEl.value = current.uri;
      emptyPanel.style.display = 'none';
      resultPanel.style.display = '';
    }catch(e){
      console.warn('Gagal membaca gambar:', e);
      toast('Gagal membaca gambar — coba file lain');
    }
  }

  /* ---------- upload: klik, keyboard, drag & drop ---------- */
  drop.addEventListener('click', () => fileInput.click());
  drop.addEventListener('keydown', e => {
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fileInput.click(); }
  });
  ['dragenter','dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('dragover'); }));
  ['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('dragover'); }));
  drop.addEventListener('drop', e => handleFile(e.dataTransfer.files[0]));
  fileInput.addEventListener('change', () => { handleFile(fileInput.files[0]); fileInput.value = ''; });
  // Cegah browser membuka file bila pengguna menjatuhkan di luar dropzone.
  const prevent = e => e.preventDefault();
  window.addEventListener('dragover', prevent);
  window.addEventListener('drop', prevent);
  const removeWindowListeners = () => { window.removeEventListener('dragover', prevent); window.removeEventListener('drop', prevent); };

  /* ---------- aksi ---------- */
  $('#ib-copy-uri', root).onclick = () => {
    if(!current.uri){ toast('Belum ada gambar diproses'); return; }
    copyText(current.uri);
  };
  $('#ib-copy-b64', root).onclick = () => {
    if(!current.b64){ toast('Belum ada gambar diproses'); return; }
    copyText(current.b64);
  };
  $('#ib-clear', root).onclick = () => {
    revokeAll();
    current = { b64: '', uri: '' };
    uriEl.value = ''; img.removeAttribute('src');
    resultPanel.style.display = 'none';
    emptyPanel.style.display = '';
  };

  /* ---------- cleanup: revoke ObjectURL + lepas listener window ---------- */
  _toolCleanup = () => { revokeAll(); removeWindowListeners(); current = { b64: '', uri: '' }; };
}


