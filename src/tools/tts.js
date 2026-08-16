/* ============================================================
   TOOLS: tts.js — Text-to-Speech [Text]
   Helper murni (clamp, chunking, filter voice): pure/speech-helpers.js
   Suara dihasilkan oleh Web Speech API bawaan browser — tanpa server.
   ============================================================ */
function renderTTS(){
  const L = TB.Speech.LIMITS;
  return `
    <div class="tool-layout">
      <div class="panel" style="grid-column:1/-1">
        <div class="panel-title">${ICONS.tts} Teks yang Dibacakan</div>
        <textarea class="textarea" id="tts-input" style="min-height:200px" placeholder="Ketik atau tempel teks di sini… Teks panjang otomatis dibacakan sampai habis." aria-label="Teks yang akan dibacakan">Halo! Ini adalah contoh pembacaan teks otomatis menggunakan suara bawaan browser Anda. Silakan ubah teks ini, pilih suara, lalu tekan tombol Putar.</textarea>
        <div class="tt-count" id="tts-count"></div>
        <div class="tt-actions">
          <button type="button" class="btn" id="tts-play">${ICONS.play} Putar</button>
          <button type="button" class="btn btn-secondary" id="tts-pause">${ICONS.pause} Jeda</button>
          <button type="button" class="btn btn-secondary" id="tts-stop">${ICONS.stop} Berhenti</button>
          <button type="button" class="btn btn-ghost" id="tts-clear">Clear</button>
        </div>
        <div class="field-hint" id="tts-status" role="status" aria-live="polite" style="margin-top:12px">Siap.</div>
      </div>

      <div class="panel">
        <div class="panel-title">${ICONS.tts} Suara</div>
        <div class="field">
          <label class="field-label" for="tts-lang">Bahasa</label>
          <select class="select" id="tts-lang"><option value="all">Semua bahasa</option></select>
        </div>
        <div class="field">
          <label class="field-label" for="tts-voice">Voice</label>
          <select class="select" id="tts-voice"></select>
          <p class="field-hint" id="tts-voice-hint">Daftar suara berasal dari sistem operasi &amp; browser Anda.</p>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">${ICONS.tts} Pengaturan Suara</div>
        <div class="field">
          <label class="field-label" for="tts-rate">Kecepatan <span id="tts-rate-val">1.0×</span></label>
          <input type="range" class="slider" id="tts-rate" min="${L.rate.min}" max="${L.rate.max}" step="${L.rate.step}" value="${L.rate.def}">
        </div>
        <div class="field">
          <label class="field-label" for="tts-pitch">Nada (pitch) <span id="tts-pitch-val">1.0</span></label>
          <input type="range" class="slider" id="tts-pitch" min="${L.pitch.min}" max="${L.pitch.max}" step="${L.pitch.step}" value="${L.pitch.def}">
        </div>
        <div class="field">
          <label class="field-label" for="tts-volume">Volume <span id="tts-volume-val">100%</span></label>
          <input type="range" class="slider" id="tts-volume" min="${L.volume.min}" max="${L.volume.max}" step="${L.volume.step}" value="${L.volume.def}">
        </div>
        <button type="button" class="btn btn-secondary btn-block" id="tts-reset">${ICONS.refresh} Reset pengaturan</button>
      </div>

      <div class="panel" style="grid-column:1/-1">
        <div class="disclaimer">${ICONS.info}
          <span>Suara diproses sepenuhnya oleh browser (Web Speech API) — teks tidak dikirim ke server kami. Ketersediaan dan kualitas suara berbeda-beda tiap perangkat; sebagian browser membutuhkan koneksi internet untuk suara online.</span>
        </div>
      </div>
    </div>`;
}

function mountTTS(root){
  const S = TB.Speech;
  const input   = $('#tts-input', root);
  const count   = $('#tts-count', root);
  const status  = $('#tts-status', root);
  const langSel = $('#tts-lang', root);
  const voiceSel= $('#tts-voice', root);
  const vHint   = $('#tts-voice-hint', root);
  const rate    = $('#tts-rate', root),   rateVal   = $('#tts-rate-val', root);
  const pitch   = $('#tts-pitch', root),  pitchVal  = $('#tts-pitch-val', root);
  const volume  = $('#tts-volume', root), volumeVal = $('#tts-volume-val', root);
  const btnPlay = $('#tts-play', root), btnPause = $('#tts-pause', root), btnStop = $('#tts-stop', root);

  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  const supported = !!(synth && typeof window.SpeechSynthesisUtterance === 'function');

  let voices = [];        // daftar voice dari browser
  let queue = [];         // potongan teks yang belum dibacakan
  let idx = 0;            // indeks potongan yang sedang dibacakan
  let speaking = false;   // sedang dalam sesi baca (termasuk saat dijeda)
  let stopping = false;   // penanda cancel manual agar onend tidak lanjut

  /* ---------- status & tombol ---------- */
  function setStatus(msg, tone){
    status.textContent = msg;
    status.style.color = tone ? `var(--${tone})` : '';
  }
  function syncButtons(){
    const paused = !!(synth && synth.paused) && speaking;
    btnPlay.disabled  = !supported || (speaking && !paused);
    btnPause.disabled = !supported || !speaking;
    btnStop.disabled  = !supported || !speaking;
    btnPause.innerHTML = paused ? `${ICONS.play} Lanjut` : `${ICONS.pause} Jeda`;
  }
  function renderCount(){
    const chars = TB.TextUtils.countCodePoints(input.value);
    const words = TB.TextUtils.countWords(input.value.trim());
    count.textContent = `${fmtNum(chars, 0)} karakter · ${fmtNum(words, 0)} kata`;
  }

  /* ---------- daftar voice ---------- */
  function renderVoiceOptions(){
    const lang = langSel.value;
    const list = S.filterByLang(voices, lang);
    voiceSel.innerHTML = list.length
      ? list.map(v => `<option value="${esc(v.voiceURI)}">${esc(v.name)} — ${esc(v.lang)}${v.default ? ' (default)' : ''}</option>`).join('')
      : '<option value="">Tidak ada suara untuk bahasa ini</option>';
    voiceSel.disabled = list.length === 0;
    vHint.textContent = list.length
      ? `${fmtNum(list.length, 0)} suara tersedia di perangkat ini.`
      : 'Tidak ada suara yang cocok — pilih bahasa lain.';
  }
  function loadVoices(){
    if(!supported) return;
    const next = synth.getVoices() || [];
    if(!next.length) return;                       // beberapa browser memuat asinkron
    const prevVoice = voiceSel.value, prevLang = langSel.value;
    voices = next;

    langSel.innerHTML = '<option value="all">Semua bahasa</option>' +
      S.uniqueLangs(voices).map(l => `<option value="${esc(l)}">${esc(S.langLabel(l))}</option>`).join('');
    // Pertahankan pilihan bahasa lama bila masih ada; jika belum pernah memilih,
    // ikuti bahasa voice default (utamakan Indonesia).
    const def = S.pickDefaultVoice(voices);
    const wantLang = prevLang && prevLang !== 'all' && [...langSel.options].some(o => o.value === prevLang)
      ? prevLang : (def ? def.lang : 'all');
    langSel.value = [...langSel.options].some(o => o.value === wantLang) ? wantLang : 'all';

    renderVoiceOptions();
    if(prevVoice && [...voiceSel.options].some(o => o.value === prevVoice)) voiceSel.value = prevVoice;
    else if(def && [...voiceSel.options].some(o => o.value === def.voiceURI)) voiceSel.value = def.voiceURI;
  }
  function currentVoice(){
    return voices.find(v => v.voiceURI === voiceSel.value) || null;
  }

  /* ---------- pemutaran ---------- */
  /** Bacakan potongan ke-i; teks panjang dibaca berurutan sampai habis. */
  function speakChunk(i){
    if(i >= queue.length){
      speaking = false; syncButtons();
      setStatus('Selesai membacakan teks.', 'success');
      return;
    }
    idx = i;
    const u = new SpeechSynthesisUtterance(queue[i]);
    const v = currentVoice();
    if(v){ u.voice = v; u.lang = v.lang; }
    u.rate   = S.clampParam(rate.value, 'rate');
    u.pitch  = S.clampParam(pitch.value, 'pitch');
    u.volume = S.clampParam(volume.value, 'volume');
    u.onstart = () => {
      if(stopping) return;
      setStatus(`Sedang berbicara… bagian ${fmtNum(i + 1, 0)} dari ${fmtNum(queue.length, 0)}.`);
      syncButtons();
    };
    u.onend = () => { if(!stopping) speakChunk(i + 1); };
    u.onerror = e => {
      if(stopping || (e && e.error === 'interrupted')) return;
      speaking = false; syncButtons();
      setStatus(`Gagal membacakan: ${(e && e.error) || 'terjadi kesalahan'}.`, 'danger');
    };
    synth.speak(u);
  }

  function play(){
    if(!supported) return;
    if(speaking && synth.paused){        // lanjutkan dari jeda
      synth.resume(); syncButtons();
      setStatus('Melanjutkan pembacaan…');
      return;
    }
    if(speaking) return;
    const text = input.value.trim();
    if(!text){ toast('Teks masih kosong'); setStatus('Teks masih kosong.', 'warning'); return; }
    stopping = true; synth.cancel(); stopping = false;   // bersihkan antrean lama
    queue = S.chunkText(text);
    if(!queue.length){ setStatus('Tidak ada teks yang bisa dibacakan.', 'warning'); return; }
    speaking = true;
    setStatus('Memulai pembacaan…');
    syncButtons();
    speakChunk(0);
  }
  function pause(){
    if(!supported || !speaking) return;
    if(synth.paused){ synth.resume(); setStatus('Melanjutkan pembacaan…'); }
    else { synth.pause(); setStatus('Dijeda. Tekan Lanjut untuk meneruskan.', 'warning'); }
    syncButtons();
  }
  function stop(){
    if(!supported) return;
    stopping = true;
    synth.cancel();
    stopping = false;
    speaking = false; queue = []; idx = 0;
    syncButtons();
    setStatus('Dihentikan. Siap dibacakan ulang.');
  }

  /* ---------- wiring ---------- */
  const fmtRate  = () => rateVal.textContent  = `${S.clampParam(rate.value, 'rate').toFixed(1)}×`;
  const fmtPitch = () => pitchVal.textContent = S.clampParam(pitch.value, 'pitch').toFixed(1);
  const fmtVol   = () => volumeVal.textContent= `${Math.round(S.clampParam(volume.value, 'volume') * 100)}%`;

  input.addEventListener('input', renderCount);
  langSel.onchange = renderVoiceOptions;
  rate.oninput = fmtRate; pitch.oninput = fmtPitch; volume.oninput = fmtVol;
  btnPlay.onclick = play; btnPause.onclick = pause; btnStop.onclick = stop;
  $('#tts-clear', root).onclick = () => { stop(); input.value = ''; renderCount(); input.focus(); };
  $('#tts-reset', root).onclick = () => {
    rate.value = S.LIMITS.rate.def; pitch.value = S.LIMITS.pitch.def; volume.value = S.LIMITS.volume.def;
    fmtRate(); fmtPitch(); fmtVol();
    toast('Pengaturan suara dikembalikan');
  };

  // Daftar voice sering baru siap setelah event 'voiceschanged'.
  const onVoicesChanged = () => loadVoices();
  if(supported && typeof synth.addEventListener === 'function'){
    synth.addEventListener('voiceschanged', onVoicesChanged);
  }

  renderCount(); fmtRate(); fmtPitch(); fmtVol();
  if(!supported){
    setStatus('Browser ini tidak mendukung Web Speech API. Coba Chrome, Edge, atau Safari terbaru.', 'danger');
    voiceSel.disabled = langSel.disabled = true;
  } else {
    loadVoices();
    setStatus('Siap. Tekan Putar untuk mulai membacakan.');
  }
  syncButtons();

  // Wajib: hentikan suara & lepas listener saat pindah tool / kembali ke beranda.
  _toolCleanup = () => {
    if(supported){
      stopping = true;
      try { synth.cancel(); } catch(e){ console.warn('tts cancel error:', e); }
      stopping = false;
      if(typeof synth.removeEventListener === 'function'){
        synth.removeEventListener('voiceschanged', onVoicesChanged);
      }
    }
    speaking = false; queue = []; idx = 0;
  };
}
