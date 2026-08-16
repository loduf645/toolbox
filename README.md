# Toolbox — Koleksi Alat Bantu Online (hasil refactor modular)

27 alat bantu client-side (QR, password, kalkulator, diff, image resizer, Base64,
gradient CSS, color picker, dll.)
yang didistribusikan sebagai **satu file `index.html`** — bisa dibuka langsung dari
`file://` tanpa server. Kode sumbernya dipecah per modul agar mudah dinavigasi,
dengan **logic murni terpisah dari DOM** dan **unit test** sebagai jaring pengaman.

Refactor ini *behavior-preserving*: CSS, markup HTML, teks UI (Bahasa Indonesia),
alur navigasi, dan perilaku setiap tool sama persis dengan versi sebelum refactor
(diverifikasi lewat golden comparison otomatis — lihat `tests/smoke-dom.js`).

---

## Struktur proyek

```
toolbox/
├── index.html              ← HASIL BUNDEL (satu-satunya file untuk distribusi)
├── build.js                ← bundler sederhana (Node, tanpa dependensi npm)
├── package.json            ← hanya shortcut `npm run build` / `npm test`
├── src/
│   ├── template.html       ← kerangka HTML (head + body), placeholder diisi build.js
│   ├── styles.css          ← seluruh CSS (tidak berubah dari versi lama)
│   ├── app.js              ← bootstrap: initSearch(); render();
│   ├── pure/               ← LOGIC MURNI: tanpa document/window/localStorage/event.
│   │   │                      Semua memakai pola UMD → window.TB.* di browser,
│   │   │                      module.exports di Node (bisa di-unit-test).
│   │   ├── text-utils.js       TB.TextUtils  — esc, slug, penghitung teks, fmt angka
│   │   ├── calculators.js      TB.Calc       — loan/KPR, zakat, BMI/BMR/TDEE, unit,
│   │   │                                       umur/countdown, Minecraft, image resize
│   │   ├── diff-engine.js      TB.Diff       — algoritma Myers, statistik, pairing
│   │   ├── text-transforms.js  TB.TextTransforms — reverse/mirror/flip + operasi
│   │   │                                       string editor Markdown (Prompt Studio)
│   │   ├── crypto-helpers.js   TB.Crypto     — MD5, inti password, UUID/random ID
│   │   ├── json-helpers.js     TB.Json       — format/minify/highlight JSON
│   │   ├── search-engine.js    TB.SearchEngine — fuzzy matching, skoring, saran
│   │   ├── base64.js           TB.Base64     — encode/decode UTF-8 aman, deteksi, data URI
│   │   ├── color-helpers.js    TB.Color      — konversi HEX/RGB/HSL + generator palette
│   │   └── gradient.js         TB.Gradient   — builder CSS gradient + preset
│   ├── data/               ← data statis
│   │   ├── icons.js, aliases.js, tools.js, fake-db.js, prompt-data.js
│   ├── core/               ← lapisan DOM/infrastruktur
│   │   ├── utils.js            sanitizeHTML, $, $$, esc, fmtNum, toast, copyText
│   │   ├── lifecycle.js        cleanup tool aktif (interval/rAF/observer)
│   │   ├── router.js           hash routing (#tool/<id>) + dispatcher render()
│   │   ├── search.js           UI live search (panel, riwayat, keyboard nav)
│   │   └── home.js             grid beranda, recent tools, wrapper tool view
│   └── tools/              ← SATU FILE PER TOOL (render + mount)
│       └── qr.js, password.js, unit.js, image-resizer.js, bmi.js, zakat.js,
│           loan.js, age.js, name.js, decision.js, lorem.js, gacha.js, mc.js,
│           uuid.js, fake.js, slug.js, hash.js, diff.js, markdown.js, json.js,
│           word.js, text-transformer.js, prompt-studio.js, base64.js,
│           gradient.js, imgbase64.js, color.js
└── tests/
    ├── run.js              ← jalankan SEMUA unit test:  node tests/run.js
    ├── harness.js          ← micro-framework assert (tanpa dependensi)
    ├── calculators.test.js, diff.test.js, text-transforms.test.js,
    ├── crypto.test.js, search.test.js, json.test.js
    └── smoke-dom.js        ← (opsional, butuh jsdom) buka semua tool di DOM
                              virtual + golden comparison dua versi HTML
```

File hasil bundel diberi **daftar isi otomatis bernomor baris** di bagian atas
`<script>` (dibuat oleh `build.js`) sehingga navigasi `index.html` tetap enak.

## Cara build (bundling jadi satu file)

```bash
node build.js        # menulis ./index.html
```

Tanpa dependensi npm apa pun (Node ≥ 18). Urutan concatenation modul ada di
konstanta `MODULES` dalam `build.js` — file di `src/tools/` boleh ditambah
sesuai kebutuhan.

## Cara menjalankan test

```bash
node tests/run.js    # 122 unit test untuk semua modul pure — exit code 0 bila lulus
```

Test hanya memakai Node bawaan (tanpa Jest/Mocha). File `pure/*.js` di-require
langsung dari Node berkat pola UMD-nya.

Test opsional tingkat DOM (membutuhkan jsdom, hanya untuk development):

```bash
npm install jsdom
node tests/smoke-dom.js index.html                         # smoke test satu file
node tests/smoke-dom.js versi-lama.html index.html         # golden comparison
```

Golden comparison membuka beranda + 23 tool + 15 skenario interaksi (klik
Hitung, ganti input, dsb.) pada KEDUA file dan menuntut output byte-identik.

## Aturan main (konvensi)

1. **Pure vs DOM.** Semua perhitungan/transformasi data hidup di `src/pure/`
   dan tidak boleh menyentuh `document`, `window`, `localStorage`, atau event.
   Wiring UI (baca input, tulis DOM, listener) hidup di `src/tools/<tool>.js`
   dan `src/core/`.
2. **Perilaku adalah kontrak.** Mengubah isi `src/pure/` wajib tetap meluluskan
   `tests/run.js`. Mengubah wiring tool sebaiknya diverifikasi ulang dengan
   `tests/smoke-dom.js` terhadap versi sebelumnya.
3. **Tambah tool baru:** buat `src/tools/<id>.js` berisi `render<Name>()` +
   `mount<Name>(root)`, daftarkan di `src/data/tools.js` (+ ikon di
   `icons.js`, alias di `aliases.js`), tambahkan ke `MODULES` di `build.js`,
   lalu `node build.js`.
4. Fungsi pure diberi **JSDoc singkat** (input → output) agar mudah dipakai
   ulang dan di-test.

## Changelog — v4.4: 4 tool baru

Ditambahkan mengikuti pola proyek yang sudah mapan (entry `tools.js`, ikon
`icons.js`, alias `aliases.js`, satu file per tool, logic murni di `pure/`,
terdaftar di `MODULES` build.js):

| Tool | Kategori | Logic murni |
|------|----------|-------------|
| **Base64 Encoder / Decoder** (`base64`) | dev | `TB.Base64` — encode/decode UTF-8 aman Unicode, deteksi otomatis Base64 di mode Decode, live convert, swap yang membalik mode |
| **CSS Gradient Generator** (`gradient`) | generator | `TB.Gradient` — builder linear/radial, arah keyword + sudut custom, clamp posisi stop, 6 preset |
| **Image to Base64** (`imgbase64`) | konverter | `TB.Base64` (bytes + data URI) + `TB.Calc.formatBytes`; ObjectURL dibersihkan lewat `_toolCleanup` |
| **Color Picker & Palette** (`color`) | generator | `TB.Color` — HEX/RGB/HSL dua arah + palette komplementer, analogous, triadic, monokromatik, shades & tints (klik swatch = jadi warna utama) |

Catatan implementasi:
- Encoder Base64 ditulis manual (bukan `btoa`) agar identik di browser & Node
  dan lolos fuzz test 2.000 kasus terhadap `Buffer` Node. (Bug shift-bit pada
  draft awal ditemukan & diperbaiki lewat test ini.)
- Hero/meta diperbarui 23 → 27 alat; badge versi v4.3 → v4.4.
- Unit test 131 → 169 (`base64.test.js`, `color.test.js`, `gradient.test.js`).
- Smoke test memperluas `TOOL_IDS` ke 27 + interaksi `base64Encode/Decode`,
  `gradientCss`, `colorValues`; golden comparison vs versi lama tetap lulus
  (23 tool lama identik, 4 tool baru diverifikasi terpisah).

## Changelog — tahap QA (perbaikan bug)

Refactor awal (122 test hijau) belum menjamin bebas bug. Tahap QA ini menemukan
dan memperbaiki 9 bug nyata; semua diverifikasi ulang dengan build + 131 unit
test + golden comparison terhadap versi asli.

**Bug prioritas (laporan awal):**

1. `core/search.js` — `renderSearchPanel` memanggil `suggestTerms(q)` tanpa
   namespace `TB.SearchEngine` dan tanpa argumen wajib `tools`/`aliases` →
   `ReferenceError` setiap panel pencarian menampilkan "Tidak ditemukan".
2. `tools/zakat.js` — mode Fitrah menerima "Jumlah Jiwa"/"Harga Beras" negatif
   dan menampilkan "Rp -xxx" (terbukti: input -4 jiwa menghasilkan
   "Rp -150.000" di versi lama). Kini divalidasi → "Rp 0" + hint.
3. `tools/prompt-studio.js` — `_toolCleanup` membatalkan autosave (debounce
   400 ms) tanpa flush → draft hilang bila user pindah tool < 400 ms setelah
   ketikan terakhir. Kini flush `localStorage.setItem` sinkron di cleanup
   (terbukti oleh smoke test: `fail` → `ok`).
4. `data/icons.js` — `promptstudio` tidak punya entri ikon (grid & search
   menampilkan panah generik). Ditambah ikon sparkle/star bergaya sama.

**Bug tambahan yang ditemukan audit:**

5. `core/search.js` — `addSearchHistory` masih memanggil `norm()` yang sudah
   tidak ada sebagai global (pindah ke `TB.TextUtils.normalizeText`) →
   `ReferenceError` setiap pencarian disimpan ke riwayat (tekan Enter / buka
   tool dari hasil pencarian).
6. `tools/loan.js` — pokok pinjaman ekstrem (mis. `1e400`) menjadi `Infinity`
   dan dirender "Rp -". Kini guard `!isFinite(P)` → fallback tampilan pokok 0.
7. `tools/image-resizer.js` — race async `addFiles`: hasil decode bisa menulis
   state/DOM tool yang sudah dibongkar bila user berpindah tool di tengah
   proses. Kini guard `root.isConnected` setelah fase async.
8. `pure/calculators.js` — `loanMonthlyPayment(P, r, months)` membagi nol bila
   `months <= 0` (Infinity/NaN). Guard defensif → 0.
9. `pure/search-engine.js` — `searchTools`/`suggestTerms` melempar `TypeError`
   bila pool/daftar tool kosong. Default defensif → hasil kosong.

**Konsistensi & maintainability:**

- `describe()` di diff.js dan `renderStats()` di prompt-studio.js masih memakai
  logic inline → disamakan memakai `TB.TextUtils` (satu implementasi teruji).
- Magic number → konstanta bernama: `PW_LEN_MIN/MAX` (password),
  `QR_SIZE_MIN/MAX` (QR), `THUMB_MAX_PX`, `DIM_MAX`, `PCT_MAX` (image resizer).

**Penguatan test (122 → 131 unit test):**
guard loan months≤0, zakat harga emas negatif, ambang batas kategori BMI
(18.5/25/30), diff teks-spasi-saja & 4.000 baris, `randomId` crypto bawaan,
keunikan 100 UUID, search defensif + typo "kalkultor". `smoke-dom.js` mendapat
5 interaksi regresi baru (`searchEmpty`, `searchEnter`, `psAutosaveFlush`,
`zakatFitrahNeg`, `loanExtreme`) — dua di antaranya membuktikan perbaikan bug
secara end-to-end saat dibandingkan dengan versi asli.

**Hasil verifikasi tahap ini:** build OK · 131/131 unit test lulus · golden
comparison: 23/23 tool identik dengan versi asli, semua interaksi identik
kecuali dua yang memang sengaja diperbaiki (lihat poin 2 & 3) · TOC bundel
akurat (39/39 entri).

## Catatan perilaku yang dipertahankan apa adanya

- Implementasi MD5 klasik memproses string per UTF-16 code unit; karakter di
  luar BMP (mis. emoji) mengikuti encoding lama itu — sama dengan versi
  sebelumnya, tetapi bukan MD5 UTF-8 standar (didokumentasikan di test).
- `slugify` hanya men-strip pemisah aktif dari tepi (perilaku asli).
- Cicilan terakhir amortisasi loan disesuaikan agar saldo tepat nol.
- `targetsValid()` pada image resizer secara praktis selalu lolos karena
  `clampInt` sudah menjamin nilai ≥ 1 — dipertahankan sama dengan versi asli
  sebagai pemeriksaan defensif.
