/* ============================================================
   TOOLS: qr.js — QR Code Generator [Generator]
   Tidak ada logic murni yang diekstrak (dominan wiring UI/CDN).
   ============================================================ */
function renderQR(){
  return `
    <div class="tool-layout">
      <div class="panel">
        <div class="panel-title">${ICONS.qr} Input</div>
        <div class="field"><label class="field-label">Teks atau URL</label><textarea class="textarea" id="qr-input" placeholder="https://contoh.com"></textarea></div>
        <div class="field-row">
          <div class="field"><label class="field-label">Koreksi Error</label><select class="select" id="qr-ec"><option value="L">L</option><option value="M">M</option><option value="Q" selected>Q</option><option value="H">H</option></select></div>
          <div class="field"><label class="field-label">Ukuran</label><select class="select" id="qr-size"><option value="256">256px</option><option value="512" selected>512px</option><option value="1024">1024px</option></select></div>
        </div>
        <button class="btn btn-block" id="qr-generate">Generate</button>
      </div>
      <div class="panel">
        <div class="panel-title">${ICONS.qr} Hasil</div>
        <div id="qrcode"><div class="empty" style="border:none;background:transparent">Hasil QR muncul di sini</div></div>
        <button class="btn btn-secondary btn-block" id="qr-download" style="margin-top:16px;display:none">Unduh PNG</button>
      </div>
    </div>`;
}
function mountQR(root){
  const input=$('#qr-input',root), ec=$('#qr-ec',root), size=$('#qr-size',root), container=$('#qrcode',root), dlBtn=$('#qr-download',root);
  // Kapasitas maksimum QR (byte mode, versi 40) berbeda per level EC.
  // Sebelumnya guard dikalibrasi hanya untuk level L, padahal default UI
  // adalah Q dan H yang kapasitasnya jauh lebih kecil.
  const QR_MAX_BYTES = { L: 2900, M: 2280, Q: 1600, H: 1220 };
  let obs = null;
  function gen(){
    const t = input.value.trim();
    if(!t){ toast('Input tidak boleh kosong'); return; }
    // Tanpa guard ini library melempar "Cannot read properties of undefined".
    const bytes = new TextEncoder().encode(t).length;
    const maxBytes = QR_MAX_BYTES[ec.value] || QR_MAX_BYTES.L;
    if(bytes > maxBytes){
      toast(`Teks terlalu panjang untuk level ${ec.value} (${bytes} byte, maks ~${maxBytes})`);
      return;
    }
    if(obs){ obs.disconnect(); obs = null; }
    dlBtn.style.display = 'none';
    container.innerHTML = '';
    const m = { L:QRCode.CorrectLevel.L, M:QRCode.CorrectLevel.M, Q:QRCode.CorrectLevel.Q, H:QRCode.CorrectLevel.H };
    obs = new MutationObserver(() => {
      const c = container.querySelector('canvas');
      if(c){
        dlBtn.style.display = '';
        dlBtn.onclick = () => {
          const l = document.createElement('a');
          l.download = `qr-${Date.now()}.png`;
          l.href = c.toDataURL('image/png');
          l.click();
          toast('QR code diunduh');
        };
        obs.disconnect(); obs = null;
      }
    });
    obs.observe(container, { childList: true, subtree: true });
    const QR_SIZE_MIN = 64, QR_SIZE_MAX = 1024;   // harus sinkron dengan opsi <select> ukuran
    const px = Math.min(QR_SIZE_MAX, Math.max(QR_SIZE_MIN, parseInt(size.value) || 256));
    try {
      new QRCode(container, { text: t, width: px, height: px, colorDark: '#1F1B14', colorLight: '#ffffff', correctLevel: m[ec.value] });
    } catch(err){
      console.warn('QR generate error:', err);
      if(obs){ obs.disconnect(); obs = null; }
      container.innerHTML = '<div class="empty">Gagal membuat QR. Coba perpendek teks atau turunkan level koreksi error.</div>';
    }
  }
  $('#qr-generate', root).onclick = gen;
  // Lepas observer bila pengguna meninggalkan tool saat QR belum selesai dirender.
  _toolCleanup = () => { if(obs){ obs.disconnect(); obs = null; } };
}



