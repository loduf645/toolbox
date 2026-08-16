/* Unit test: pure/calculators.js + pure/text-utils.js
   Jalankan: node tests/run.js  (atau file ini sendiri) */
'use strict';
const { suite, test, eq, approx, ok } = require('./harness.js');
const Calc = require('../src/pure/calculators.js');
const TU = require('../src/pure/text-utils.js');

/* ================= LOAN / KPR ================= */
suite('Loan / KPR (anuitas + amortisasi)');

test('cicilan anuitas: 500jt, 6%/thn, 10 thn', () => {
  approx(Calc.loanMonthlyPayment(500000000, 6, 120), 5551025.10, 0.5);
});

test('ringkasan: total bayar & total bunga konsisten', () => {
  const s = Calc.loanSummary(500000000, 6, 10);
  eq(s.months, 120);
  approx(s.totalPay, s.monthly * 120, 1e-6);
  approx(s.totalInterest, s.totalPay - 500000000, 1e-6);
});

test('guard defensif: pokok/tenor tidak valid -> 0 (anti division-by-zero)', () => {
  eq(Calc.loanMonthlyPayment(1000000, 6, 0), 0);
  eq(Calc.loanMonthlyPayment(1000000, 6, -5), 0);
  eq(Calc.loanMonthlyPayment(0, 6, 12), 0);
  eq(Calc.loanMonthlyPayment(-1000, 6, 12), 0);
});

test('edge case bunga 0%: pokok dibagi rata, bunga nol', () => {
  eq(Calc.loanMonthlyPayment(12000000, 0, 12), 1000000);
  const s = Calc.loanSummary(12000000, 0, 1);
  eq(s.totalInterest, 0);
  const rows = Calc.amortizationMonthly(12000000, 0, 1);
  eq(rows.length, 12);
  rows.forEach(r => approx(r.principal, 1000000, 1e-9));
  eq(rows[rows.length - 1].balance, 0);
});

test('amortisasi: saldo akhir tepat nol (cicilan terakhir disesuaikan)', () => {
  const rows = Calc.amortizationMonthly(1000000, 12, 0.25); // 3 bulan
  eq(rows.length, 3);
  approx(rows[rows.length - 1].balance, 0, 1e-9);
  const sumPrincipal = rows.reduce((a, r) => a + r.principal, 0);
  approx(sumPrincipal, 1000000, 1e-6);
});

test('amortisasi: porsi bunga menurun, porsi pokok naik', () => {
  const rows = Calc.amortizationMonthly(100000000, 12, 2);
  ok(rows[0].interest > rows[23].interest, 'bunga bulan pertama > bulan terakhir');
  ok(rows[0].principal < rows[23].principal, 'pokok bulan pertama < bulan terakhir');
});

test('agregasi tahunan: kelompok 12 bulan (sisa < 12 ikut)', () => {
  const rows = Calc.amortizationMonthly(100000000, 6, 2.5); // 30 bulan
  const yearly = Calc.aggregateYearly(rows);
  eq(yearly.length, 3);
  eq(yearly.map(y => y.year), [1, 2, 3]);
  approx(yearly[2].balance, 0, 1e-6);
});

/* ================= ZAKAT ================= */
suite('Zakat (maal, penghasilan, fitrah)');

test('maal di bawah nisab -> Rp 0', () => {
  const r = Calc.zakatMaalDue(100000000, 1350000);
  eq(r.nisab, 85 * 1350000);          // 114.750.000
  eq(r.wajib, false);
  eq(r.due, 0);
});

test('maal di atas nisab -> 2,5%', () => {
  const r = Calc.zakatMaalDue(200000000, 1350000);
  eq(r.wajib, true);
  eq(r.due, 5000000);
});

test('penghasilan: nisab = 85 gr emas / 12 bulan', () => {
  const r = Calc.zakatMaalDue(10000000, 1350000, { monthly: true });
  eq(r.nisab, 85 * 1350000 / 12);      // 9.562.500
  eq(r.due, 250000);
});

test('harga emas 0 dianggap input belum lengkap', () => {
  const r = Calc.zakatMaalDue(999999999, 0);
  eq(r.incomplete, true);
  eq(r.due, 0);
});

test('harga emas negatif juga dianggap belum lengkap', () => {
  const r = Calc.zakatMaalDue(1e12, -100);
  eq(r.incomplete, true);
  eq(r.due, 0);
});

test('fitrah: 2,5 kg beras per jiwa', () => {
  eq(Calc.zakatFitrahDue(4, 15000), 150000);
  eq(Calc.zakatFitrahDue(1, 0), 0);
});

/* ================= BMI / BMR / TDEE ================= */
suite('BMI, BMR, TDEE (Mifflin-St Jeor)');

test('nilai BMI 60 kg / 170 cm', () => {
  approx(Calc.bmiValue(60, 170), 20.7612, 1e-4);
});

test('kategori + tone pill', () => {
  eq(Calc.bmiCategory(17.3), { label: 'Kurus', tone: 'warning' });
  eq(Calc.bmiCategory(22),   { label: 'Normal', tone: 'success' });
  eq(Calc.bmiCategory(27.7), { label: 'Gemuk', tone: 'warning' });
  eq(Calc.bmiCategory(33),   { label: 'Obesitas', tone: 'danger' });
});

test('kategori tepat di ambang batas (18.5 / 25 / 30)', () => {
  eq(Calc.bmiCategory(18.5).label, 'Normal');   // < 18.5 barulah Kurus
  eq(Calc.bmiCategory(25).label, 'Gemuk');      // < 25 barulah Normal
  eq(Calc.bmiCategory(30).label, 'Obesitas');   // < 30 barulah Gemuk
});

test('BMR laki-laki & perempuan', () => {
  eq(Calc.bmrMifflin('male', 60, 170, 25), 1542.5);
  eq(Calc.bmrMifflin('female', 60, 170, 25), 1376.5);
});

test('TDEE = BMR x faktor aktivitas', () => {
  approx(Calc.tdeeFromBmr(1542.5, 1.55), 2390.875, 1e-9);
});

/* ================= KONVERSI UNIT ================= */
suite('Konversi unit');

test('panjang: km -> m, mi -> km', () => {
  eq(Calc.convertUnit('panjang', 1, 'km', 'm'), 1000);
  eq(Calc.convertUnit('panjang', 1, 'mi', 'km'), 1.609344);
});

test('suhu: C->F, C->K, F->C', () => {
  eq(Calc.convertUnit('suhu', 100, 'C', 'F'), 212);
  eq(Calc.convertUnit('suhu', 0, 'C', 'K'), 273.15);
  approx(Calc.convertUnit('suhu', 72, 'F', 'C'), 22.222222, 1e-5);
});

test('berat: kg -> lb', () => {
  approx(Calc.convertUnit('berat', 1, 'kg', 'lb'), 2.2046226, 1e-6);
});

test('data: GB -> MB (basis 1024)', () => {
  eq(Calc.convertUnit('data', 1, 'GB', 'MB'), 1024);
});

test('kecepatan: km/h -> m/s', () => {
  approx(Calc.convertUnit('kecepatan', 100, 'km/h', 'm/s'), 27.7777778, 1e-6);
});

test('volume: galon US -> liter', () => {
  eq(Calc.convertUnit('volume', 1, 'gal', 'L'), 3.785411784);
});

/* ================= UMUR & COUNTDOWN ================= */
suite('Umur & countdown');

test('umur dasar', () => {
  eq(Calc.ageParts(new Date(2000, 0, 1), new Date(2026, 7, 4)), { years: 26, months: 7, days: 3 });
});

test('umur dengan pinjam hari (lahir akhir bulan)', () => {
  eq(Calc.ageParts(new Date(2000, 0, 31), new Date(2026, 2, 1)), { years: 26, months: 0, days: 29 });
});

test('pecah durasi countdown', () => {
  eq(Calc.countdownParts(90061000), { days: 1, hours: 1, minutes: 1, seconds: 1 });
});

/* ================= MINECRAFT ================= */
suite('Minecraft coordinate');

test('overworld -> nether dibagi 8', () => {
  eq(Calc.minecraftCoords(192, -352, 'o2n'), { x: 24, z: -44 });
});

test('nether -> overworld dikali 8', () => {
  eq(Calc.minecraftCoords(24, -44, 'n2o'), { x: 192, z: -352 });
});

test('pembulatan ke bawah utk koordinat negatif', () => {
  eq(Calc.minecraftCoords(-5, 0, 'o2n'), { x: -1, z: 0 });
});

/* ================= IMAGE RESIZER ================= */
suite('Image resizer (perhitungan murni)');

test('clampInt', () => {
  eq(Calc.clampInt('abc', 1, 100), 1);
  eq(Calc.clampInt('50', 1, 100), 50);
  eq(Calc.clampInt('999', 1, 100), 100);
});

test('mode pixel + kunci rasio (edit lebar)', () => {
  eq(Calc.imageTargetDims({ w: 1600, h: 900 }, { mode: 'pixel', w: 800, h: 720, lock: true, lastEdited: 'w' }), { w: 800, h: 450 });
});

test('mode pixel + kunci rasio (edit tinggi)', () => {
  eq(Calc.imageTargetDims({ w: 1920, h: 1080 }, { mode: 'pixel', w: 800, h: 540, lock: true, lastEdited: 'h' }), { w: 960, h: 540 });
});

test('mode persentase', () => {
  eq(Calc.imageTargetDims({ w: 1600, h: 900 }, { mode: 'percent', pct: 50 }), { w: 800, h: 450 });
});

test('preset fit tidak mendistorsi', () => {
  eq(Calc.imageTargetDims({ w: 1600, h: 900 }, { mode: 'preset', preset: '1080x1080' }), { w: 1080, h: 608 });
});

test('preset custom', () => {
  eq(Calc.imageTargetDims({ w: 200, h: 200 }, { mode: 'preset', preset: 'custom', presetW: 100, presetH: 50 }), { w: 50, h: 50 });
});

test('resolusi format auto & manual', () => {
  eq(Calc.resolveImageFormat('jpg', 'auto'), { ext: 'jpg', mime: 'image/jpeg' });
  eq(Calc.resolveImageFormat('png', 'auto'), { ext: 'png', mime: 'image/png' });
  eq(Calc.resolveImageFormat('gif', 'auto'), { ext: 'png', mime: 'image/png' }); // fallback
  eq(Calc.resolveImageFormat('png', 'webp'), { ext: 'webp', mime: 'image/webp' });
});

test('persentase penghematan', () => {
  eq(Calc.savingsPercent(1000, 400), 60);
  eq(Calc.savingsPercent(1000, 1200), -20);
});

test('formatBytes', () => {
  eq(Calc.formatBytes(500), '500 B');
  eq(Calc.formatBytes(2048), '2 KB');
  eq(Calc.formatBytes(5 * 1048576), '5 MB');
});

/* ================= TEXT UTILS ================= */
suite('Text utils (penghitung, slug, escape)');

test('hitung kata', () => {
  eq(TU.countWords('  satu  dua   tiga '), 3);
  eq(TU.countWords(''), 0);
});

test('hitung karakter per code point (emoji utuh)', () => {
  eq(TU.countCodePoints('a😀b'), 3);
});

test('hitung baris', () => {
  eq(TU.countLines(''), 0);
  eq(TU.countLines('a\nb'), 2);
});

test('hitung kalimat', () => {
  eq(TU.countSentences('Satu. Dua! Tiga?'), 3);
  eq(TU.countSentences('tanpa pemutus'), 1);
  eq(TU.countSentences(''), 0);
});

test('hitung paragraf', () => {
  eq(TU.countParagraphs('a\n\nb\n\n\nc'), 3);
});

test('waktu baca (200 kata/menit, dibulatkan ke atas)', () => {
  eq(TU.readingTimeSeconds(400), 120);
  eq(TU.readingTimeSeconds(1), 1);
});

test('slugify: judul artikel', () => {
  eq(TU.slugify('10 Cara Mudah Membuat Website Pada 2024!', '-', 'lower'), '10-cara-mudah-membuat-website-pada-2024');
});

test('slugify: underscore + uppercase + tanda baca', () => {
  eq(TU.slugify('Halo Dunia!!', '_', 'upper'), 'HALO_DUNIA');
});

test('slugify: strip karakter hanya untuk pemisah aktif (perilaku asli)', () => {
  // '-' bukan pemisah aktif di sini sehingga TIDAK ikut dibuang dari tepi.
  eq(TU.slugify('  --Halo?? Dunia--  ', '_', 'upper'), '--HALO_DUNIA--');
});

test('escapeHtml', () => {
  eq(TU.escapeHtml('<b>&"\''), '&lt;b&gt;&amp;&quot;&#39;');
});

test('normalisasi pencarian', () => {
  eq(TU.normalizeText('  Hàlo  '), 'halo');
});

test('pecah baris tanpa baris kosong', () => {
  eq(TU.splitNonEmptyLines('a\n   \nb '), ['a', 'b']);
});

test('format angka id-ID', () => {
  eq(TU.formatNumberID(1234567.891, 2), '1.234.567,89');
  eq(TU.formatNumberID(NaN), '-');
});


