/* ============================================================
   PURE: calculators.js
   Semua rumus kalkulator — TANPA DOM. Diuji di tests/calculators.test.js
   Berisi: Loan/KPR (anuitas + amortisasi), Zakat, BMI/BMR/TDEE,
   konversi unit, umur & countdown, koordinat Minecraft,
   dan perhitungan Image Resizer (dimensi target, format, ukuran file).
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory(require('./text-utils.js'));   // Node (unit test)
  } else {
    root.TB = root.TB || {};
    root.TB.Calc = factory(root.TB.TextUtils);              // Browser (bundel)
  }
})(typeof self !== 'undefined' ? self : globalThis, function (TU) {
  'use strict';

  /* ==========================================================
     1. LOAN / KPR — cicilan anuitas + tabel amortisasi
     ========================================================== */

  /**
   * Cicilan bulanan anuitas.
   * @param {number} principal - pokok pinjaman (> 0)
   * @param {number} annualPct - bunga per tahun dalam persen (mis. 6 = 6%)
   * @param {number} months - jumlah bulan
   * @returns {number} cicilan per bulan (bunga 0% => pokok dibagi rata)
   */
  function loanMonthlyPayment(principal, annualPct, months) {
    // Guard defensif: tanpa ini months <= 0 menghasilkan Infinity/NaN
    // (pembagian nol). Caller UI membatasi tenor 1..50 tahun.
    if (!(principal > 0) || !(months > 0)) return 0;
    const r = annualPct / 100 / 12;
    if (r === 0) return principal / months;
    const f = Math.pow(1 + r, months);
    return principal * r * f / (f - 1);
  }

  /**
   * Ringkasan pinjaman: cicilan, total bayar, total bunga.
   * @param {number} principal @param {number} annualPct @param {number} years
   * @returns {{months:number, monthly:number, totalPay:number, totalInterest:number}}
   */
  function loanSummary(principal, annualPct, years) {
    const n = years * 12;
    const monthly = loanMonthlyPayment(principal, annualPct, n);
    const totalPay = monthly * n;
    return { months: n, monthly, totalPay, totalInterest: totalPay - principal };
  }

  /**
   * Tabel amortisasi per bulan. Cicilan terakhir disesuaikan agar saldo
   * tepat nol (menghindari sisa pembulatan).
   * @returns {Array<{month:number, payment:number, principal:number, interest:number, balance:number}>}
   */
  function amortizationMonthly(principal, annualPct, years) {
    const r = annualPct / 100 / 12;
    const n = years * 12;
    const m = loanMonthlyPayment(principal, annualPct, n);
    let balance = principal;
    const rows = [];
    for (let i = 1; i <= n; i++) {
      const interest = balance * r;
      const payment = (i === n) ? balance + interest : m;
      const principalPart = payment - interest;
      balance = Math.max(0, balance - principalPart);
      rows.push({ month: i, payment, principal: principalPart, interest, balance });
    }
    return rows;
  }

  /**
   * Agregasi baris amortisasi bulanan menjadi ringkasan tahunan
   * (kelompok 12 bulan; kelompok terakhir bisa < 12).
   * @param {Array} monthlyRows - hasil amortizationMonthly()
   * @returns {Array<{year:number, payment:number, principal:number, interest:number, balance:number}>}
   */
  function aggregateYearly(monthlyRows) {
    const out = [];
    let accPay = 0, accPrincipal = 0, accInterest = 0;
    monthlyRows.forEach((row, idx) => {
      accPay += row.payment; accPrincipal += row.principal; accInterest += row.interest;
      if ((idx + 1) % 12 === 0 || idx === monthlyRows.length - 1) {
        out.push({ year: Math.ceil((idx + 1) / 12), payment: accPay, principal: accPrincipal, interest: accInterest, balance: row.balance });
        accPay = 0; accPrincipal = 0; accInterest = 0;
      }
    });
    return out;
  }

  /* ==========================================================
     2. ZAKAT — maal, penghasilan (nisab emas 85 gr), fitrah
     ========================================================== */

  /**
   * Nisab berdasarkan harga emas per gram.
   * @param {number} goldPerGram - harga emas per gram (Rp)
   * @param {{monthly?:boolean}} [opts] - monthly=true untuk zakat penghasilan (85 gr / 12 bulan)
   * @returns {number} nilai nisab (Rp)
   */
  function zakatNisab(goldPerGram, opts = {}) {
    return opts.monthly ? 85 * goldPerGram / 12 : 85 * goldPerGram;
  }

  /**
   * Zakat maal / penghasilan: 2,5% bila harta >= nisab, selain itu 0.
   * @param {number} amount - total harta/penghasilan
   * @param {number} goldPerGram - harga emas per gram; <= 0 dianggap input belum lengkap
   * @param {{monthly?:boolean}} [opts]
   * @returns {{nisab:number, due:number, wajib:boolean, incomplete:boolean}}
   */
  function zakatMaalDue(amount, goldPerGram, opts = {}) {
    if (!(goldPerGram > 0)) return { nisab: 0, due: 0, wajib: false, incomplete: true };
    const nisab = zakatNisab(goldPerGram, opts);
    const wajib = amount >= nisab;
    return { nisab, due: wajib ? amount * 0.025 : 0, wajib, incomplete: false };
  }

  /**
   * Zakat fitrah: 2,5 kg beras (atau nilai uangnya) per jiwa.
   * @param {number} people - jumlah jiwa @param {number} ricePricePerKg - harga beras/kg (Rp)
   * @returns {number} nominal zakat (Rp)
   */
  function zakatFitrahDue(people, ricePricePerKg) {
    return people * 2.5 * ricePricePerKg;
  }

  /* ==========================================================
     3. BMI / BMR / TDEE (rumus Mifflin-St Jeor)
     ========================================================== */

  /** @param {number} weightKg @param {number} heightCm @returns {number} nilai BMI */
  function bmiValue(weightKg, heightCm) {
    const hm = heightCm / 100;
    return weightKg / (hm * hm);
  }

  /**
   * Kategori BMI beserta tone warna pill UI.
   * @param {number} bmi
   * @returns {{label:'Kurus'|'Normal'|'Gemuk'|'Obesitas', tone:'warning'|'success'|'danger'}}
   */
  function bmiCategory(bmi) {
    if (bmi < 18.5) return { label: 'Kurus', tone: 'warning' };
    if (bmi < 25)   return { label: 'Normal', tone: 'success' };
    if (bmi < 30)   return { label: 'Gemuk', tone: 'warning' };
    return { label: 'Obesitas', tone: 'danger' };
  }

  /**
   * BMR (Basal Metabolic Rate) rumus Mifflin-St Jeor.
   * @param {'male'|'female'} gender @param {number} weightKg @param {number} heightCm @param {number} ageYears
   * @returns {number} kalori basal per hari
   */
  function bmrMifflin(gender, weightKg, heightCm, ageYears) {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
    return gender === 'male' ? base + 5 : base - 161;
  }

  /** TDEE = BMR x faktor aktivitas. @param {number} bmr @param {number} activityFactor */
  function tdeeFromBmr(bmr, activityFactor) {
    return bmr * activityFactor;
  }

  /* ==========================================================
     4. KONVERSI UNIT
     Semua faktor relatif terhadap satuan dasar kategori (nilai 1).
     ========================================================== */
  const UNIT_DATA = {
    panjang:  { u:{ m:1, km:1000, cm:0.01, mm:0.001, mi:1609.344, ft:0.3048, in:0.0254, yd:0.9144 } },
    berat:    { u:{ kg:1, g:0.001, mg:0.000001, t:1000, lb:0.45359237, oz:0.028349523125 } },
    suhu:     { u:['C','F','K'] },
    volume:   { u:{ L:1, mL:0.001, m3:1000, cm3:0.001, gal:3.785411784, qt:0.946352946, cup:0.2365882365 } },
    kecepatan:{ u:{ 'm/s':1, 'km/h':0.277777778, mph:0.44704, knot:0.514444444, 'ft/s':0.3048 } },
    data:     { u:{ B:1, KB:1024, MB:1048576, GB:1073741824, TB:1099511627776 } }
  };

  /**
   * Konversi satu nilai antar satuan dalam kategori yang sama.
   * @param {string} cat - kunci UNIT_DATA ('panjang'|'berat'|'suhu'|'volume'|'kecepatan'|'data')
   * @param {number} value @param {string} from @param {string} to
   * @returns {number} hasil konversi
   */
  function convertUnit(cat, value, from, to) {
    if (cat === 'suhu') {
      let k;
      if (from === 'C') k = value;
      else if (from === 'F') k = (value - 32) * 5 / 9;
      else k = value - 273.15;
      if (to === 'C') return k;
      if (to === 'F') return k * 9 / 5 + 32;
      return k + 273.15;
    }
    return value * UNIT_DATA[cat].u[from] / UNIT_DATA[cat].u[to];
  }

  /* ==========================================================
     5. UMUR & COUNTDOWN
     ========================================================== */

  /**
   * Hitung selisih umur dalam tahun/bulan/hari dengan logika "pinjam"
   * jumlah hari bulan kalender (akurat untuk tanggal lahir akhir bulan).
   * @param {Date} birth @param {Date} now
   * @returns {{years:number, months:number, days:number}}
   */
  function ageParts(birth, now) {
    let y = now.getFullYear() - birth.getFullYear(),
        mo = now.getMonth() - birth.getMonth(),
        d = now.getDate() - birth.getDate();
    if (d < 0) { d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); mo--; }
    if (d < 0) { d += new Date(now.getFullYear(), now.getMonth() - 1, 0).getDate(); mo--; }
    if (mo < 0) { y--; mo += 12; }
    return { years: y, months: mo, days: d };
  }

  /**
   * Pecah durasi (ms) menjadi hari/jam/menit/detik untuk countdown.
   * @param {number} diffMs - sisa waktu dalam milidetik (> 0)
   * @returns {{days:number, hours:number, minutes:number, seconds:number}}
   */
  function countdownParts(diffMs) {
    return {
      days:    Math.floor(diffMs / 86400000),
      hours:   Math.floor(diffMs % 86400000 / 3600000),
      minutes: Math.floor(diffMs % 3600000 / 60000),
      seconds: Math.floor(diffMs % 60000 / 1000)
    };
  }

  /* ==========================================================
     6. MINECRAFT COORDINATE (rasio Overworld:Nether = 8:1)
     ========================================================== */

  /**
   * Konversi koordinat antar dimensi Minecraft (pembulatan ke bawah,
   * seperti perilaku koordinat blok di game).
   * @param {number} x @param {number} z
   * @param {'o2n'|'n2o'} direction - o2n = dibagi 8, n2o = dikali 8
   * @returns {{x:number, z:number}}
   */
  function minecraftCoords(x, z, direction) {
    const f = direction === 'o2n' ? 1 / 8 : 8;
    return { x: Math.floor(x * f), z: Math.floor(z * f) };
  }

  /* ==========================================================
     7. IMAGE RESIZER — perhitungan murni (tanpa canvas/DOM)
     ========================================================== */

  /** Clamp integer; input tak valid kembali ke min. @param {*} v @param {number} min @param {number} max */
  function clampInt(v, min, max) {
    const n = parseInt(v, 10);
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
  }

  /** Tabel format output image resizer. */
  const IMAGE_FORMATS = {
    png:  { ext:'png',  mime:'image/png' },
    jpeg: { ext:'jpg',  mime:'image/jpeg' },
    webp: { ext:'webp', mime:'image/webp' }
  };

  /** Pemetaan ekstensi file -> format saat mode Auto. */
  const IMAGE_AUTO_EXT = { png:'png', jpg:'jpeg', jpeg:'jpeg', webp:'webp' };

  /**
   * Tentukan format output gambar.
   * @param {string} fileExt - ekstensi file sumber (tanpa titik, lowercase)
   * @param {'auto'|'png'|'jpeg'|'webp'} format
   * @returns {{ext:string, mime:string}}
   */
  function resolveImageFormat(fileExt, format) {
    if (format !== 'auto') return IMAGE_FORMATS[format];
    return IMAGE_FORMATS[IMAGE_AUTO_EXT[fileExt] || 'png'];
  }

  /**
   * Hitung dimensi target satu gambar berdasarkan konfigurasi resize.
   * @param {{w:number, h:number}} item - dimensi asli gambar
   * @param {{mode:'pixel'|'percent'|'preset', w?:number, h?:number, lock?:boolean,
   *          lastEdited?:'w'|'h', pct?:number, preset?:string,
   *          presetW?:number, presetH?:number}} cfg
   * @returns {{w:number, h:number}} dimensi target (>= 1)
   */
  function imageTargetDims(item, cfg) {
    if (cfg.mode === 'pixel') {
      let w = cfg.w, h = cfg.h;
      if (cfg.lock) {
        if (cfg.lastEdited === 'w') h = Math.max(1, Math.round(w * item.h / item.w));
        else w = Math.max(1, Math.round(h * item.w / item.h));
      }
      return { w, h };
    }
    if (cfg.mode === 'percent') {
      return { w: Math.max(1, Math.round(item.w * cfg.pct / 100)), h: Math.max(1, Math.round(item.h * cfg.pct / 100)) };
    }
    let pw, ph;
    if (cfg.preset === 'custom') { pw = cfg.presetW; ph = cfg.presetH; }
    else { const [a, b] = cfg.preset.split('x').map(Number); pw = a; ph = b; }
    // Fit: sesuaikan di dalam bingkai preset agar tidak terdistorsi.
    const scale = Math.min(pw / item.w, ph / item.h);
    return { w: Math.max(1, Math.round(item.w * scale)), h: Math.max(1, Math.round(item.h * scale)) };
  }

  /**
   * Persentase penghematan ukuran file (negatif = malah membesar).
   * @param {number} originalSize @param {number} newSize
   */
  function savingsPercent(originalSize, newSize) {
    return Math.round((1 - newSize / originalSize) * 100);
  }

  /**
   * Format ukuran byte menjadi string manusiawi (B/KB/MB).
   * @param {number} n @returns {string}
   */
  function formatBytes(n) {
    if (!isFinite(n)) return '—';
    if (n < 1024) return n + ' B';
    if (n < 1048576) return TU.formatNumberID(n / 1024, 1) + ' KB';
    return TU.formatNumberID(n / 1048576, 2) + ' MB';
  }

  return {
    loanMonthlyPayment, loanSummary, amortizationMonthly, aggregateYearly,
    zakatNisab, zakatMaalDue, zakatFitrahDue,
    bmiValue, bmiCategory, bmrMifflin, tdeeFromBmr,
    UNIT_DATA, convertUnit,
    ageParts, countdownParts,
    minecraftCoords,
    clampInt, IMAGE_FORMATS, IMAGE_AUTO_EXT, resolveImageFormat,
    imageTargetDims, savingsPercent, formatBytes
  };
});


