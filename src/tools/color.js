/* ============================================================
   TOOLS: color.js — Color Picker & Palette [Generator]
   Konversi HEX/RGB/HSL + palette: pure/color-helpers.js (TB.Color)
   ============================================================ */
function renderColor(){
  return `
    <div class="tool-layout">
      <div class="panel">
        <div class="panel-title">${ICONS.color} Pilih Warna</div>
        <div class="field">
          <label class="field-label">Pemilih Warna</label>
          <div style="display:flex;gap:10px;align-items:center">
            <input type="color" id="cl-picker" value="#a8421c" aria-label="Color picker"
                   style="width:64px;height:44px;padding:3px;border:1px solid var(--border);border-radius:10px;background:var(--surface);cursor:pointer">
            <div class="input-group" style="flex:1"><span class="suffix">#</span><input type="text" class="input mono" id="cl-hex" value="a8421c" maxlength="7" spellcheck="false" aria-label="Nilai HEX"></div>
          </div>
          <div class="field-hint" id="cl-hex-status" style="margin-top:6px" role="status"></div>
        </div>
        <div class="field"><label class="field-label">HEX</label>
          <div class="input-group"><input type="text" class="input mono" id="cl-v-hex" readonly style="font-size:13px"><button class="copy-btn" id="cl-c-hex">${ICONS.copy}</button></div>
        </div>
        <div class="field"><label class="field-label">RGB</label>
          <div class="input-group"><input type="text" class="input mono" id="cl-v-rgb" readonly style="font-size:13px"><button class="copy-btn" id="cl-c-rgb">${ICONS.copy}</button></div>
        </div>
        <div class="field"><label class="field-label">HSL</label>
          <div class="input-group"><input type="text" class="input mono" id="cl-v-hsl" readonly style="font-size:13px"><button class="copy-btn" id="cl-c-hsl">${ICONS.copy}</button></div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-title">${ICONS.color} Palette Otomatis <button class="copy-btn" id="cl-copy-all" style="float:right">${ICONS.copy} Salin Semua</button></div>
        <div id="cl-palettes"></div>
        <p class="field-hint" style="margin-top:10px">Klik warna mana pun untuk menjadikannya warna utama.</p>
      </div>
    </div>`;
}

function mountColor(root){
  const picker = $('#cl-picker', root), hexIn = $('#cl-hex', root), hexStatus = $('#cl-hex-status', root);
  const vHex = $('#cl-v-hex', root), vRgb = $('#cl-v-rgb', root), vHsl = $('#cl-v-hsl', root);
  const palettesEl = $('#cl-palettes', root);

  const SCHEMES = [
    ['complementary', 'Komplementer'],
    ['analogous', 'Analogous'],
    ['triadic', 'Triadic'],
    ['monochromatic', 'Monokromatik'],
    ['shadesTints', 'Shades & Tints']
  ];

  let hex = '#a8421c';   // mulai dari warna aksen aplikasi
  let lastPalettes = null;

  function renderValues(){
    const rgb = TB.Color.hexToRgb(hex);
    const hsl = TB.Color.rgbToHsl(rgb.r, rgb.g, rgb.b);
    vHex.value = hex;
    vRgb.value = TB.Color.formatRgb(rgb);
    vHsl.value = TB.Color.formatHsl(hsl);
  }
  function renderPalettes(){
    lastPalettes = TB.Color.generatePalettes(hex);
    palettesEl.innerHTML = SCHEMES.map(([key, label]) => `
      <div style="margin-bottom:14px">
        <div class="field-label" style="margin-bottom:8px">${label}</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${lastPalettes[key].map(c => `<button type="button" data-c="${c}" title="${c}" aria-label="Jadikan ${c} warna utama"
            style="width:44px;height:44px;border-radius:10px;border:1px solid var(--border);background:${c};cursor:pointer"></button>`).join('')}
        </div>
      </div>`).join('');
    palettesEl.querySelectorAll('[data-c]').forEach(btn => {
      btn.onclick = () => { setColor(btn.dataset.c); toast(`Warna ${btn.dataset.c} dijadikan warna utama`); };
    });
  }
  /** Set warna utama & segarkan seluruh tampilan. @param {string} h HEX ternormalisasi */
  function setColor(h){
    hex = h;
    picker.value = hex;
    hexIn.value = hex.slice(1);
    hexStatus.textContent = '';
    renderValues();
    renderPalettes();
  }

  /* ---------- input warna ---------- */
  picker.addEventListener('input', () => setColor(TB.Color.normalizeHex(picker.value)));
  hexIn.addEventListener('input', () => {
    const n = TB.Color.normalizeHex(hexIn.value);
    if(n){ setColor(n); }
    else { hexStatus.textContent = 'HEX belum valid (3 atau 6 digit heksadesimal)'; hexStatus.style.color = 'var(--warning)'; }
  });

  /* ---------- salin ---------- */
  const copyValue = el => { if(el.value) copyText(el.value); };
  $('#cl-c-hex', root).onclick = () => copyValue(vHex);
  $('#cl-c-rgb', root).onclick = () => copyValue(vRgb);
  $('#cl-c-hsl', root).onclick = () => copyValue(vHsl);
  $('#cl-copy-all', root).onclick = () => {
    if(!lastPalettes){ toast('Belum ada palette'); return; }
    const text = SCHEMES.map(([key, label]) => `${label}: ${lastPalettes[key].join(', ')}`).join('\n');
    copyText(text);
  };

  setColor(hex); // state awal
}
