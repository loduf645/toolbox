/* ============================================================
   TOOLS: word.js — Word & Reading Time [Text]
   Penghitung & waktu baca: pure/text-utils.js
   ============================================================ */
function renderWord(){
  return `
    <div class="tool-layout single">
      <div class="panel"><div class="panel-title">${ICONS.word} Input Teks</div><textarea class="textarea" id="word-input" style="min-height:200px">Internet telah mengubah cara kita berkomunikasi, bekerja, dan belajar. Informasi yang dulu butuh berhari-hari untuk didapatkan, kini tersedia dalam hitungan detik. Namun, kemudahan ini juga membawa tantangan baru seperti misinformasi dan kecanduan digital. Penting bagi kita untuk memiliki literasi digital yang baik agar dapat memfilter informasi yang benar dan bermanfaat.</textarea></div>
      <div class="panel">
        <div class="panel-title">${ICONS.word} Statistik</div>
        <div class="stat-grid">
          <div class="stat-card"><div class="label">Kata</div><div class="value" id="word-words">0</div><div class="sub">Total kata</div></div>
          <div class="stat-card"><div class="label">Karakter</div><div class="value" id="word-chars">0</div><div class="sub">Termasuk spasi</div></div>
          <div class="stat-card"><div class="label">Kalimat</div><div class="value" id="word-sentences">0</div><div class="sub">Estimasi</div></div>
          <div class="stat-card"><div class="label">Paragraf</div><div class="value" id="word-paragraphs">0</div><div class="sub">Blok teks</div></div>
        </div>
        <div class="result-display" style="margin-top:20px"><div class="result-value" id="word-time">0:00</div><div class="result-label">Estimasi Waktu Baca</div></div>
        <div class="field-hint" style="margin-top:12px;text-align:center">Asumsi kecepatan baca rata-rata: 200 kata/menit</div>
      </div>
    </div>`;
}
function mountWord(root){
  const input = $('#word-input', root);
  function update(){
    // Penghitung kata/kalimat/paragraf & waktu baca ada di pure/text-utils.js
    // (TB.TextUtils) — teruji unit.
    const text = input.value.trim();
    const words = TB.TextUtils.countWords(text);
    const chars = input.value.length;   // karakter dihitung dari teks mentah (termasuk spasi)
    const sentences = TB.TextUtils.countSentences(text);
    const paragraphs = TB.TextUtils.countParagraphs(text);
    $('#word-words', root).textContent = fmtNum(words, 0); $('#word-chars', root).textContent = fmtNum(chars, 0);
    $('#word-sentences', root).textContent = fmtNum(sentences, 0); $('#word-paragraphs', root).textContent = fmtNum(paragraphs, 0);
    // Hitung dalam detik lalu pecah, agar tidak pernah muncul "0:60"
    // (pembulatan terpisah pada menit & detik menyebabkan detik bisa jadi 60).
    const totalSeconds = TB.TextUtils.readingTimeSeconds(words);
    const m = Math.floor(totalSeconds / 60), sec = totalSeconds % 60;
    $('#word-time', root).textContent = `${m}:${String(sec).padStart(2, '0')}`;
  }
  input.addEventListener('input', update); update();
}

