/* ============================================================
   TOOLS: image-resizer.js — Image Resizer [Konverter]
   Dimensi target, format, ukuran: pure/calculators.js
   ============================================================ */
function renderImageResizer(){
  return `
    <div class="tool-layout single">
      <div class="panel">
        <div class="panel-title">${ICONS.imageresizer} Upload Gambar</div>
        <div class="dropzone" id="ir-drop" tabindex="0" role="button" aria-label="Upload gambar">
          <input type="file" id="ir-file" accept="image/*" multiple class="sr-only">
          <div class="dz-icon">${ICONS.imageresizer}</div>
          <div class="dz-title">Tarik &amp; letakkan gambar di sini</div>
          <div class="dz-sub">atau klik untuk memilih — mendukung banyak file sekaligus</div>
          <div class="dz-hint">PNG · JPG · WEBP · GIF · BMP · SVG — maks 50 MB per file</div>
        </div>
        <div id="ir-preview" class="ir-preview" style="display:none">
          <div class="ir-preview-head">
            <span class="field-hint" id="ir-count"></span>
            <button type="button" class="btn btn-ghost" id="ir-clear" style="padding:4px 10px;font-size:12px">Bersihkan</button>
          </div>
          <div class="ir-grid" id="ir-grid"></div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">${ICONS.imageresizer} Pengaturan</div>

        <div class="field">
          <label class="field-label">Mode Resize</label>
          <div class="segmented" id="ir-mode">
            <button type="button" class="active" data-mode="pixel">Pixel</button>
            <button type="button" data-mode="percent">Persentase</button>
            <button type="button" data-mode="preset">Preset</button>
          </div>
        </div>

        <div id="ir-pixel-panel">
          <div class="field-row">
            <div class="field"><label class="field-label">Lebar</label><div class="input-group"><input type="number" class="input" id="ir-w" value="1280" min="1" step="1"><span class="suffix">px</span></div></div>
            <div class="field"><label class="field-label">Tinggi</label><div class="input-group"><input type="number" class="input" id="ir-h" value="720" min="1" step="1"><span class="suffix">px</span></div></div>
          </div>
          <div class="field" style="margin-top:4px">
            <label class="toggle"><input type="checkbox" id="ir-lock" checked><span class="toggle-track"></span><span>Pertahankan rasio aspek</span></label>
          </div>
        </div>

        <div id="ir-percent-panel" style="display:none">
          <div class="field">
            <label class="field-label">Skala Cepat</label>
            <div class="ir-quick" id="ir-quick">
              <button type="button" class="chip-btn" data-pct="50">50%</button>
              <button type="button" class="chip-btn" data-pct="75">75%</button>
              <button type="button" class="chip-btn active" data-pct="100">100%</button>
              <button type="button" class="chip-btn" data-pct="150">150%</button>
              <button type="button" class="chip-btn" data-pct="200">200%</button>
            </div>
          </div>
          <div class="field">
            <label class="field-label">Skala Custom</label>
            <div class="input-group"><input type="number" class="input" id="ir-pct" value="100" min="1" max="1000" step="1"><span class="suffix">%</span></div>
          </div>
        </div>

        <div id="ir-preset-panel" style="display:none">
          <div class="check-grid ir-preset-grid">
            <label class="check-card active"><input type="radio" name="ir-preset" value="1920x1080" checked><span class="check-box"></span><span class="preset-name">1920 × 1080</span><small>Full HD</small></label>
            <label class="check-card"><input type="radio" name="ir-preset" value="1280x720"><span class="check-box"></span><span class="preset-name">1280 × 720</span><small>HD</small></label>
            <label class="check-card"><input type="radio" name="ir-preset" value="1080x1080"><span class="check-box"></span><span class="preset-name">1080 × 1080</span><small>Instagram</small></label>
            <label class="check-card"><input type="radio" name="ir-preset" value="1080x1920"><span class="check-box"></span><span class="preset-name">1080 × 1920</span><small>Story</small></label>
            <label class="check-card"><input type="radio" name="ir-preset" value="800x800"><span class="check-box"></span><span class="preset-name">800 × 800</span></label>
            <label class="check-card"><input type="radio" name="ir-preset" value="640x640"><span class="check-box"></span><span class="preset-name">640 × 640</span></label>
            <label class="check-card"><input type="radio" name="ir-preset" value="512x512"><span class="check-box"></span><span class="preset-name">512 × 512</span></label>
            <label class="check-card"><input type="radio" name="ir-preset" value="custom"><span class="check-box"></span><span class="preset-name">Custom</span></label>
          </div>
          <div class="field-row" id="ir-custom-preset" style="display:none;margin-top:12px">
            <div class="field"><label class="field-label">Lebar</label><div class="input-group"><input type="number" class="input" id="ir-preset-w" value="800" min="1" step="1"><span class="suffix">px</span></div></div>
            <div class="field"><label class="field-label">Tinggi</label><div class="input-group"><input type="number" class="input" id="ir-preset-h" value="800" min="1" step="1"><span class="suffix">px</span></div></div>
          </div>
          <p class="field-hint" style="margin-top:8px">Preset memakai mode <em>fit</em> (disesuaikan di dalam bingkai) agar proporsi gambar tetap terjaga.</p>
        </div>

        <div class="field" style="margin-top:18px">
          <label class="field-label">Format Output</label>
          <div class="segmented" id="ir-format">
            <button type="button" class="active" data-fmt="auto">Auto</button>
            <button type="button" data-fmt="png">PNG</button>
            <button type="button" data-fmt="jpeg">JPG</button>
            <button type="button" data-fmt="webp">WEBP</button>
          </div>
        </div>

        <div class="field" id="ir-quality-field">
          <label class="field-label">Kualitas <span class="field-hint" id="ir-quality-val">90%</span></label>
          <input type="range" class="slider" id="ir-quality" min="60" max="100" step="5" value="90">
        </div>

        <button type="button" class="btn btn-block" id="ir-run" style="margin-top:4px">Resize Sekarang</button>
        <p class="field-hint" style="margin-top:10px;text-align:center">100% lokal — gambar tidak pernah diunggah ke server mana pun.</p>
      </div>

      <div class="panel" id="ir-result-panel" style="display:none">
        <div class="panel-title">${ICONS.imageresizer} Hasil</div>
        <div id="ir-result-body"></div>
      </div>

      <div class="disclaimer">
        ${ICONS.info} <span>GIF animasi diproses sebagai gambar statis (frame pertama). Untuk output JPG, area transparan diisi warna putih.</span>
      </div>
    </div>`;
}

function mountImageResizer(root){
  const drop = $('#ir-drop', root), fileInput = $('#ir-file', root);
  const wInput = $('#ir-w', root), hInput = $('#ir-h', root), lockToggle = $('#ir-lock', root);
  const pctInput = $('#ir-pct', root);
  const qualityInput = $('#ir-quality', root), qualityVal = $('#ir-quality-val', root);
  const runBtn = $('#ir-run', root);
  const previewWrap = $('#ir-preview', root), previewGrid = $('#ir-grid', root), countEl = $('#ir-count', root);
  const resultPanel = $('#ir-result-panel', root), resultBody = $('#ir-result-body', root);

  const RUN_LABEL = 'Resize Sekarang';
  const MAX_FILE = 50 * 1024 * 1024;   // batas ukuran file upload (byte)
  const THUMB_MAX_PX = 160;            // sisi terpanjang thumbnail preview
  const DIM_MAX = 10000;               // batas atas dimensi (px) pada semua input angka
  const PCT_MAX = 1000;                // batas atas skala persentase (%)
  // Tabel format (IMAGE_FORMATS / IMAGE_AUTO_EXT) & semua perhitungan murni
  // dipindah ke pure/calculators.js (TB.Calc) — teruji unit.

  let items = [];        // daftar file terpilih
  let results = [];      // hasil proses
  let urls = [];         // semua objectURL yang dibuat (untuk cleanup)
  let processing = false;
  let cancelled = false;
  let lastEdited = 'w';  // dimensi mana yang terakhir diedit di mode pixel

  const state = { mode:'pixel', format:'auto', quality:90, percent:100, preset:'1920x1080' };

  /* ---------- util ----------
     Implementasi murni ada di pure/calculators.js (TB.Calc); wrapper tipis di
     sini hanya agar nama panggilan lama tetap terbaca di konteks UI. */
  function fmtSize(n){ return TB.Calc.formatBytes(n); }
  function extLabel(ext){
    const m = { png:'PNG', jpg:'JPG', jpeg:'JPG', webp:'WEBP', gif:'GIF', bmp:'BMP', svg:'SVG' };
    return m[ext] || (ext || '').toUpperCase();
  }
  function revokeAllUrls(){ urls.forEach(u => { try{ URL.revokeObjectURL(u); }catch(_){} }); urls = []; }
  function clampi(v, min, max){ return TB.Calc.clampInt(v, min, max); }

  /* ---------- decode & thumb ---------- */
  function decodeMeta(file){
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve({ w: img.naturalWidth, h: img.naturalHeight }); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
      img.src = url;
    });
  }
  function buildThumb(file, w, h){
    return new Promise(resolve => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, THUMB_MAX_PX / Math.max(w, h));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(w * scale));
        c.height = Math.max(1, Math.round(h * scale));
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  /* ---------- preview ---------- */
  function renderPreview(){
    previewWrap.style.display = items.length ? '' : 'none';
    countEl.textContent = items.length === 1 ? '1 gambar' : `${items.length} gambar`;
    previewGrid.innerHTML = items.map((it, i) => `
      <div class="ir-card">
        <img class="ir-card-img" src="${it.thumb || ''}" alt="Preview ${esc(it.name)}">
        <button type="button" class="ir-card-del" data-idx="${i}" aria-label="Hapus ${esc(it.name)}">×</button>
        <div class="ir-card-body">
          <div class="ir-card-name" title="${esc(it.name)}">${esc(it.name)}</div>
          <div class="ir-card-meta">${fmtNum(it.w, 0)} × ${fmtNum(it.h, 0)} · ${fmtSize(it.size)}<br>${extLabel(it.ext)}</div>
        </div>
      </div>`).join('');
    previewGrid.querySelectorAll('.ir-card-del').forEach(btn => {
      btn.onclick = () => { items.splice(+btn.dataset.idx, 1); renderPreview(); syncFromFirstItem(); updateRunLabel(); };
    });
  }
  function syncFromFirstItem(){
    const it = items[0];
    if(!it) return;
    if(items.length === 1){ wInput.value = it.w; hInput.value = it.h; }
    else syncLocked();
  }
  function syncLocked(){
    // Saat kunci rasio aktif: dimensi kedua mengikuti dimensi pertama yang diedit
    // (rasio dihitung per gambar saat diproses).
    if(!lockToggle.checked || !items.length) return;
    const it = items[0];
    if(lastEdited === 'w'){ hInput.value = Math.max(1, Math.round(clampi(wInput.value,1,DIM_MAX) * it.h / it.w)); }
    else { wInput.value = Math.max(1, Math.round(clampi(hInput.value,1,DIM_MAX) * it.w / it.h)); }
  }
  function updateRunLabel(){
    runBtn.textContent = items.length > 1 ? `Resize ${items.length} Gambar` : items.length === 1 ? 'Resize 1 Gambar' : RUN_LABEL;
  }

  /* ---------- upload ---------- */
  async function addFiles(fileList){
    const files = [...fileList];
    if(!files.length) return;
    let skippedType = 0, skippedBig = 0;
    const fresh = [];
    for(const f of files){
      if(!f.type || !f.type.startsWith('image/')){ skippedType++; continue; }
      if(f.size > MAX_FILE){ skippedBig++; continue; }
      try{
        const meta = await decodeMeta(f);
        const ext = (f.name.split('.').pop() || '').toLowerCase();
        const thumb = await buildThumb(f, meta.w, meta.h);
        fresh.push({ file: f, name: f.name, ext, w: meta.w, h: meta.h, size: f.size, type: f.type, thumb });
      }catch(e){
        console.warn('Gambar tidak dapat dibaca:', f.name, e);
        skippedType++;
      }
    }
    // Guard race condition: proses decode bersifat async; bila user berpindah
    // tool di tengah proses, tool sudah dibongkar (cleanup) dan hasil decode
    // tidak boleh lagi menulis state/DOM yang sudah tidak terpakai.
    if(!root.isConnected) return;
    if(fresh.length){
      const wasEmpty = items.length === 0;
      items = items.concat(fresh);
      resetResults();
      renderPreview();
      if(wasEmpty && state.mode === 'pixel'){ wInput.value = fresh[0].w; hInput.value = fresh[0].h; }
      syncFromFirstItem();
      updateRunLabel();
    }
    const msgs = [];
    if(skippedType) msgs.push(`${skippedType} file dilewati (bukan gambar / tidak didukung)`);
    if(skippedBig) msgs.push(`${skippedBig} file dilewati (lebih dari 50 MB)`);
    if(msgs.length) toast(msgs.join(' · '));
  }
  function onFiles(fileList){
    if(processing){ toast('Tunggu proses selesai'); return; }
    addFiles(fileList);
    fileInput.value = '';
  }
  function wireDrop(){
    drop.addEventListener('click', () => fileInput.click());
    drop.addEventListener('keydown', e => {
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fileInput.click(); }
    });
    ['dragenter','dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('dragover'); }));
    ['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('dragover'); }));
    drop.addEventListener('drop', e => onFiles(e.dataTransfer.files));
    fileInput.addEventListener('change', () => onFiles(fileInput.files));
    // Cegah browser membuka file bila pengguna menjatuhkan di luar dropzone
    const prevent = e => { if(!processing) e.preventDefault(); };
    window.addEventListener('dragover', prevent);
    window.addEventListener('drop', prevent);
    return () => { window.removeEventListener('dragover', prevent); window.removeEventListener('drop', prevent); };
  }

  /* ---------- target dimensi ---------- */
  /**
   * Bekukan seluruh pengaturan resize (mode, dimensi, format, kualitas, preset)
   * jadi satu objek. Dipanggil SEKALI di awal runAll() dan dipakai untuk seluruh
   * item dalam batch itu -- supaya perubahan pengaturan oleh user di tengah proses
   * (mis. ganti format/kualitas/dimensi saat batch masih berjalan) tidak membuat
   * sebagian gambar dalam satu batch diproses dengan target yang berbeda.
   */
  function snapshotConfig(){
    return {
      mode: state.mode,
      format: state.format,
      quality: state.quality,
      w: clampi(wInput.value, 1, DIM_MAX),
      h: clampi(hInput.value, 1, DIM_MAX),
      lock: lockToggle.checked,
      lastEdited,
      pct: clampi(pctInput.value, 1, PCT_MAX),
      preset: state.preset,
      presetW: clampi($('#ir-preset-w', root).value, 1, DIM_MAX),
      presetH: clampi($('#ir-preset-h', root).value, 1, DIM_MAX)
    };
  }
  /** Dimensi target dihitung oleh fungsi murni TB.Calc.imageTargetDims (teruji unit). */
  function targetDims(item, cfg){ return TB.Calc.imageTargetDims(item, cfg); }
  function targetsValid(){
    if(state.mode === 'pixel'){
      return clampi(wInput.value, 1, DIM_MAX) > 0 && clampi(hInput.value, 1, DIM_MAX) > 0;
    }
    if(state.mode === 'percent') return clampi(pctInput.value, 1, PCT_MAX) > 0;
    if(state.preset === 'custom'){
      return clampi($('#ir-preset-w', root).value, 1, DIM_MAX) > 0 && clampi($('#ir-preset-h', root).value, 1, DIM_MAX) > 0;
    }
    return true;
  }

  /* ---------- proses satu gambar ---------- */
  function resolveFormat(item, cfg){ return TB.Calc.resolveImageFormat(item.ext, cfg.format); }
  async function decodeBitmap(file){
    try{ return await createImageBitmap(file); }
    catch(e){
      // Fallback untuk format yang belum didukung createImageBitmap (mis. SVG):
      // decode via <img> lalu salin ke canvas.
      const url = URL.createObjectURL(file);
      try{
        const img = await new Promise((res, rej) => {
          const im = new Image();
          im.onload = () => res(im);
          im.onerror = () => rej(new Error('decode gagal'));
          im.src = url;
        });
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        return c;
      } finally { URL.revokeObjectURL(url); }
    }
  }
  function paintScaled(ctx, bmp, tw, th){
    // Step-down scaling: bagi dua bertahap saat memperkecil jauh,
    // agar hasil lebih tajam daripada drawImage satu langkah.
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    let src = bmp, sw = bmp.width, sh = bmp.height;
    if(tw >= sw && th >= sh){
      ctx.drawImage(src, 0, 0, tw, th);
      ctx.restore();
      return;
    }
    while(sw / 2 >= tw && sh / 2 >= th){
      const off = document.createElement('canvas');
      const nw = Math.max(1, Math.round(sw / 2)), nh = Math.max(1, Math.round(sh / 2));
      off.width = nw; off.height = nh;
      const octx = off.getContext('2d');
      octx.imageSmoothingEnabled = true; octx.imageSmoothingQuality = 'high';
      octx.drawImage(src, 0, 0, nw, nh);
      src = off; sw = nw; sh = nh;
    }
    ctx.drawImage(src, 0, 0, tw, th);
    ctx.restore();
  }
  function encodeBlob(canvas, mime, quality){
    return new Promise((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('encode gagal')), mime, quality);
    });
  }
  async function processItem(item, cfg){
    const bmp = await decodeBitmap(item.file);
    try{
      const { w: tw, h: th } = targetDims(item, cfg);
      const fmt = resolveFormat(item, cfg);
      const canvas = document.createElement('canvas');
      canvas.width = tw; canvas.height = th;
      const ctx = canvas.getContext('2d');
      if(fmt.ext === 'jpg'){ ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, tw, th); }
      paintScaled(ctx, bmp, tw, th);
      const q = (fmt.ext === 'jpg' || fmt.ext === 'webp') ? cfg.quality / 100 : undefined;
      const blob = await encodeBlob(canvas, fmt.mime, q);
      const url = URL.createObjectURL(blob);
      if(cancelled){ URL.revokeObjectURL(url); }
      else { urls.push(url); }
      const base = item.name.replace(/\.[^.]+$/, '') || 'image';
      return { item, url, blob, name: `${base}-${tw}x${th}.${fmt.ext}`, w: tw, h: th, size: blob.size, format: fmt.ext.toUpperCase() };
    } finally {
      if(bmp && bmp.close) bmp.close(); // bebaskan ImageBitmap
    }
  }

  /* ---------- hasil ---------- */
  function downloadBlob(blob, name){
    const url = URL.createObjectURL(blob);
    urls.push(url);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }
  function savingsPct(r){ return TB.Calc.savingsPercent(r.item.size, r.size); }
  function renderSingle(r){
    const pct = savingsPct(r);
    const pill = pct >= 0
      ? `<span class="pill success">Ukuran berkurang ${pct}%</span>`
      : `<span class="pill warning">Ukuran bertambah ${Math.abs(pct)}%</span>`;
    resultBody.innerHTML = `
      <div class="ir-compare">
        <div class="ir-cmp">
          <div class="ir-cmp-label">Sebelum</div>
          <img class="ir-cmp-img" src="${r.item.thumb || ''}" alt="Sebelum">
          <div class="ir-cmp-meta"><span>${fmtNum(r.item.w, 0)} × ${fmtNum(r.item.h, 0)}</span><span class="ir-cmp-size">${fmtSize(r.item.size)} · ${extLabel(r.item.ext)}</span></div>
        </div>
        <div class="ir-cmp-arrow">${ICONS.arrow}</div>
        <div class="ir-cmp">
          <div class="ir-cmp-label">Sesudah</div>
          <img class="ir-cmp-img" src="${r.url}" alt="Sesudah">
          <div class="ir-cmp-meta"><span>${fmtNum(r.w, 0)} × ${fmtNum(r.h, 0)}</span><span class="ir-cmp-size">${fmtSize(r.size)} · ${r.format}</span></div>
        </div>
      </div>
      <div class="ir-savings">${pill}</div>
      <button type="button" class="btn btn-block" id="ir-dl-single">${ICONS.download} Download ${esc(r.name)}</button>`;
    $('#ir-dl-single', root).onclick = () => { downloadBlob(r.blob, r.name); toast('Gambar diunduh'); };
  }
  function renderBatch(failed){
    const n = results.length;
    resultBody.innerHTML = `
      <div class="ir-batch-head">
        <span>${n} gambar berhasil diproses</span>
        <button type="button" class="btn" id="ir-zip">${ICONS.download} Download ZIP</button>
      </div>
      <div class="ir-list">
        ${results.map((r, i) => `
          <div class="ir-row">
            <img class="ir-row-img" src="${r.url}" alt="">
            <div class="ir-row-info">
              <div class="ir-row-name" title="${esc(r.name)}">${esc(r.name)}</div>
              <div class="ir-row-meta">${fmtNum(r.item.w, 0)}×${fmtNum(r.item.h, 0)} · ${fmtSize(r.item.size)} → ${fmtNum(r.w, 0)}×${fmtNum(r.h, 0)} · ${fmtSize(r.size)}</div>
            </div>
            <button type="button" class="btn btn-secondary" data-idx="${i}" aria-label="Download ${esc(r.name)}">${ICONS.download}</button>
          </div>`).join('')}
      </div>
      ${failed ? `<p class="field-hint" style="margin-top:10px">${failed} gambar gagal diproses dan dilewati.</p>` : ''}`;
    resultBody.querySelectorAll('[data-idx]').forEach(btn => {
      btn.onclick = () => { const r = results[+btn.dataset.idx]; downloadBlob(r.blob, r.name); toast('Gambar diunduh'); };
    });
    const zipBtn = $('#ir-zip', root);
    if(zipBtn) zipBtn.onclick = makeZip;
  }
  function renderResults(failed){
    if(results.length === 0){
      resultBody.innerHTML = `<div class="empty">Tidak ada gambar yang berhasil diproses${failed ? ` — ${failed} gagal` : ''}.</div>`;
      return;
    }
    results.length === 1 ? renderSingle(results[0]) : renderBatch(failed);
    toast(results.length === 1 ? '1 gambar berhasil diproses' : `${results.length} gambar berhasil diproses`);
  }
  async function makeZip(){
    if(typeof JSZip === 'undefined'){ toast('JSZip tidak tersedia — cek koneksi internet'); return; }
    const zipBtn = $('#ir-zip', root);
    if(!zipBtn || zipBtn.disabled) return;
    zipBtn.disabled = true; zipBtn.textContent = 'Membuat ZIP…';
    try{
      const zip = new JSZip();
      results.forEach(r => zip.file(r.name, r.blob));
      const blob = await zip.generateAsync({ type:'blob' });
      downloadBlob(blob, `hasil-resize-${Date.now()}.zip`);
      toast('File ZIP diunduh');
    }catch(e){ console.warn('ZIP error:', e); toast('Gagal membuat ZIP'); }
    finally { zipBtn.disabled = false; zipBtn.textContent = 'Download ZIP'; }
  }

  /* ---------- batch run ---------- */
  async function runAll(){
    if(processing) return;
    if(!items.length){ toast('Upload gambar dulu'); return; }
    if(!targetsValid()){ toast('Periksa kembali dimensi target'); return; }
    processing = true; cancelled = false;
    const cfg = snapshotConfig(); // bekukan pengaturan untuk seluruh batch ini
    runBtn.disabled = true; runBtn.textContent = 'Memproses…';
    resetResults(); // revoke hasil run sebelumnya
    resultPanel.style.display = '';
    resultBody.innerHTML = `
      <div class="ir-progress">
        <div class="ir-progress-top"><span id="ir-prog-label">Memproses…</span><span id="ir-prog-pct">0%</span></div>
        <div class="progress-track"><div class="progress-fill" id="ir-prog-fill" style="width:0%"></div></div>
      </div>`;
    const label = $('#ir-prog-label', root), pctEl = $('#ir-prog-pct', root), fill = $('#ir-prog-fill', root);
    const total = items.length;
    let done = 0, failed = 0;
    for(const item of items){
      if(cancelled) break;
      label.textContent = `Memproses ${done + 1} dari ${total}…`;
      pctEl.textContent = `${Math.round(done / total * 100)}%`;
      fill.style.width = `${Math.round(done / total * 100)}%`;
      try{
        const r = await processItem(item, cfg);
        if(!cancelled) results.push(r);
      }catch(e){
        console.warn('Gagal memproses:', item.name, e);
        failed++;
      }
      done++;
    }
    fill.style.width = '100%'; pctEl.textContent = '100%';
    if(!cancelled) renderResults(failed);
    processing = false;
    runBtn.disabled = false;
    updateRunLabel();
  }
  function resetResults(revoke = true){
    if(revoke) revokeAllUrls();
    results = [];
    resultPanel.style.display = 'none';
    resultBody.innerHTML = '';
  }

  /* ---------- events ---------- */
  const removeDropListeners = wireDrop();

  $$('#ir-mode button', root).forEach(btn => {
    btn.onclick = () => {
      if(processing) return;
      state.mode = btn.dataset.mode;
      $$('#ir-mode button', root).forEach(b => b.classList.toggle('active', b === btn));
      $('#ir-pixel-panel', root).style.display = state.mode === 'pixel' ? '' : 'none';
      $('#ir-percent-panel', root).style.display = state.mode === 'percent' ? '' : 'none';
      $('#ir-preset-panel', root).style.display = state.mode === 'preset' ? '' : 'none';
    };
  });

  $$('#ir-format button', root).forEach(btn => {
    btn.onclick = () => {
      state.format = btn.dataset.fmt;
      $$('#ir-format button', root).forEach(b => b.classList.toggle('active', b === btn));
      // Kualitas hanya relevan untuk JPG/WEBP (dan Auto yang bisa menghasilkan keduanya).
      $('#ir-quality-field', root).style.display = state.format === 'png' ? 'none' : '';
    };
  });

  wInput.addEventListener('input', () => { lastEdited = 'w'; syncLocked(); });
  hInput.addEventListener('input', () => { lastEdited = 'h'; syncLocked(); });

  $('#ir-quick', root).querySelectorAll('.chip-btn').forEach(btn => {
    btn.onclick = () => {
      pctInput.value = btn.dataset.pct;
      $('#ir-quick', root).querySelectorAll('.chip-btn').forEach(b => b.classList.toggle('active', b === btn));
    };
  });
  pctInput.addEventListener('input', () => {
    $('#ir-quick', root).querySelectorAll('.chip-btn').forEach(b => b.classList.toggle('active', b.dataset.pct === pctInput.value));
  });

  $$('#ir-preset-panel input[name="ir-preset"]', root).forEach(radio => {
    radio.addEventListener('change', () => {
      if(!radio.checked) return;
      state.preset = radio.value;
      $$('#ir-preset-panel .check-card', root).forEach(c => c.classList.toggle('active', c.contains(radio)));
      $('#ir-custom-preset', root).style.display = state.preset === 'custom' ? '' : 'none';
    });
  });

  qualityInput.addEventListener('input', () => { state.quality = clampi(qualityInput.value, 60, 100); qualityVal.textContent = `${state.quality}%`; });

  $('#ir-clear', root).onclick = () => {
    if(processing){ toast('Tunggu proses selesai'); return; }
    items = [];
    resetResults();
    renderPreview();
    updateRunLabel();
  };
  runBtn.onclick = runAll;

  _toolCleanup = () => {
    cancelled = true;
    processing = false;
    revokeAllUrls();
    removeDropListeners();
    items = []; results = [];
  };
}

