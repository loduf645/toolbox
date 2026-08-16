#!/usr/bin/env node
/* ============================================================
   build.js — Bundler Toolbox (Node, TANPA dependensi npm)

   Menggabungkan modul-modul src/ menjadi SATU file index.html
   siap distribusi (bisa dibuka langsung via file:// tanpa server).

   Pakai:   node build.js
   Output:  ./index.html
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');

/* Urutan modul = urutan concatenation di dalam bundel.
   pure/*  : logic murni (UMD -> window.TB.*, bisa di-require Node)
   data/*  : data statis (ikon, registrasi tool, alias, kosakata)
   core/*  : util DOM, lifecycle, router, search UI, home
   tools/* : satu file per tool (render + mount)
   app.js  : bootstrap — WAJIB terakhir */
const MODULES = [
  'pure/text-utils.js',
  'pure/calculators.js',
  'pure/diff-engine.js',
  'pure/text-transforms.js',
  'pure/crypto-helpers.js',
  'pure/json-helpers.js',
  'pure/search-engine.js',
  'pure/base64.js',
  'pure/color-helpers.js',
  'pure/gradient.js',

  'data/icons.js',
  'data/aliases.js',
  'data/tools.js',
  'data/fake-db.js',
  'data/prompt-data.js',

  'core/utils.js',
  'core/lifecycle.js',
  'core/router.js',
  'core/search.js',
  'core/home.js',

  'tools/qr.js',
  'tools/password.js',
  'tools/unit.js',
  'tools/image-resizer.js',
  'tools/bmi.js',
  'tools/zakat.js',
  'tools/loan.js',
  'tools/age.js',
  'tools/name.js',
  'tools/decision.js',
  'tools/lorem.js',
  'tools/gacha.js',
  'tools/mc.js',
  'tools/uuid.js',
  'tools/fake.js',
  'tools/slug.js',
  'tools/hash.js',
  'tools/diff.js',
  'tools/markdown.js',
  'tools/json.js',
  'tools/word.js',
  'tools/text-transformer.js',
  'tools/prompt-studio.js',
  'tools/base64.js',
  'tools/gradient.js',
  'tools/imgbase64.js',
  'tools/color.js',

  'app.js'
];

/* Judul singkat per modul untuk daftar isi */
const TITLES = {
  'pure/text-utils.js':        'TB.TextUtils — escape, slug, penghitung teks, format angka',
  'pure/calculators.js':       'TB.Calc — loan, zakat, BMI, unit, umur, MC, image resize',
  'pure/diff-engine.js':       'TB.Diff — algoritma Myers, statistik, pairing baris',
  'pure/text-transforms.js':   'TB.TextTransforms — reverse/mirror/flip + operasi editor MD',
  'pure/crypto-helpers.js':    'TB.Crypto — MD5, password, UUID/random ID',
  'pure/json-helpers.js':      'TB.Json — format/minify/highlight JSON',
  'pure/search-engine.js':     'TB.SearchEngine — matching fuzzy, skoring, saran',
  'pure/base64.js':            'TB.Base64 — encode/decode UTF-8 aman, deteksi, data URI',
  'pure/color-helpers.js':     'TB.Color — konversi HEX/RGB/HSL + generator palette',
  'pure/gradient.js':          'TB.Gradient — builder CSS gradient + preset',
  'data/icons.js':             'ICONS — ikon SVG inline',
  'data/aliases.js':           'ALIASES — sinonim pencarian per tool',
  'data/tools.js':             'TOOLS + CATEGORIES — registrasi tool',
  'data/fake-db.js':           'FAKE_DB — kosakata fake data',
  'data/prompt-data.js':       'PS_STARTER/PS_BLOCKS/PS_CATEGORIES — data Prompt Studio',
  'core/utils.js':             'sanitize, $, $$, esc, fmtNum, toast, copyText',
  'core/lifecycle.js':         '_toolCleanup / runToolCleanup',
  'core/router.js':            'router hash + dispatcher render()',
  'core/search.js':            'UI live search (panel, riwayat, keyboard)',
  'core/home.js':              'renderHome, recent, renderTool',
  'tools/qr.js':               'Tool 01 — QR Code Generator',
  'tools/password.js':         'Tool 02 — Password Generator',
  'tools/unit.js':             'Tool 03 — Konverter Unit',
  'tools/image-resizer.js':    'Tool 04 — Image Resizer',
  'tools/bmi.js':              'Tool 05 — Kalkulator BMI & Kalori',
  'tools/zakat.js':            'Tool 06 — Kalkulator Zakat',
  'tools/loan.js':             'Tool 07 — Kalkulator Cicilan & KPR',
  'tools/age.js':              'Tool 08 — Kalkulator Umur & Countdown',
  'tools/name.js':             'Tool 09 — Generator Nama Acak',
  'tools/decision.js':         'Tool 10 — Pengambil Keputusan Acak',
  'tools/lorem.js':            'Tool 11 — Lorem Ipsum Indonesia',
  'tools/gacha.js':            'Tool 12 — Simulator Gacha',
  'tools/mc.js':               'Tool 13 — Minecraft Coordinate Converter',
  'tools/uuid.js':             'Tool 14 — UUID / ID Generator',
  'tools/fake.js':             'Tool 15 — Fake Data Generator',
  'tools/slug.js':             'Tool 16 — Slug Generator',
  'tools/hash.js':             'Tool 17 — Hash Generator',
  'tools/diff.js':             'Tool 18 — Text Diff Checker',
  'tools/markdown.js':         'Tool 19 — Markdown Previewer',
  'tools/json.js':             'Tool 20 — JSON Formatter',
  'tools/word.js':             'Tool 21 — Word & Reading Time',
  'tools/text-transformer.js': 'Tool 22 — Text Transformer',
  'tools/prompt-studio.js':    'Tool 23 — Prompt Studio',
  'tools/base64.js':           'Tool 24 — Base64 Encoder / Decoder',
  'tools/gradient.js':         'Tool 25 — CSS Gradient Generator',
  'tools/imgbase64.js':        'Tool 26 — Image to Base64',
  'tools/color.js':            'Tool 27 — Color Picker & Palette',
  'app.js':                    'INIT — bootstrap aplikasi'
};

function buildToc(entries) {
  const rows = entries.map(e =>
    '   ' + String(e.line).padStart(5) + '  ' + e.file.padEnd(26) + ' ' + e.title
  );
  return [
    '/* ============================================================',
    '   DAFTAR ISI — dibuat otomatis oleh build.js (jangan edit manual)',
    '   Nomor baris = posisi section pada file hasil bundel ini.',
    '   Sumber modular: src/pure, src/data, src/core, src/tools + src/app.js',
    '   ------------------------------------------------------------',
    ...rows,
    '   ============================================================ */'
  ].join('\n');
}

function main() {
  const template = fs.readFileSync(path.join(SRC, 'template.html'), 'utf8');
  const css = fs.readFileSync(path.join(SRC, 'styles.css'), 'utf8');

  // 1) Gabungkan semua modul dengan banner penanda.
  const chunks = MODULES.map((rel, i) => {
    const src = fs.readFileSync(path.join(SRC, rel), 'utf8').replace(/\s+$/, '');
    const banner = `/* ===== [${i + 1}/${MODULES.length}] ${rel} ===== */`;
    return banner + '\n' + src;
  });
  let scripts = chunks.join('\n\n');

  // 2) Pasang CSS & script ke template.
  let out = template.replace('/*@@CSS@@*/', () => css.trim());
  out = out.replace('/*@@TOC@@*/', () => buildToc(MODULES.map(m => ({ line: 0, file: m, title: TITLES[m] || '' }))));
  out = out.replace('/*@@SCRIPTS@@*/', () => scripts);

  // 3) Hitung nomor baris nyata tiap banner, lalu bangun TOC final.
  //    (TOC dummy di atas menjamin jumlah baris sama dengan TOC final,
  //     sehingga nomor baris yang dihitung sudah pasti benar.)
  const lines = out.split('\n');
  const entries = MODULES.map(m => ({
    line: lines.findIndex(l => l.endsWith(`] ${m} ===== */`)) + 1,
    file: m,
    title: TITLES[m] || ''
  }));
  const missing = entries.filter(e => e.line === 0);
  if (missing.length) {
    console.error('Banner tidak ditemukan untuk:', missing.map(e => e.file).join(', '));
    process.exit(1);
  }
  out = out.replace(buildToc(MODULES.map(m => ({ line: 0, file: m, title: TITLES[m] || '' }))), buildToc(entries));

  const target = path.join(__dirname, 'index.html');
  fs.writeFileSync(target, out);
  const nLines = out.split('\n').length;
  console.log(`✓ Bundel ditulis: ${path.relative(process.cwd(), target)} (${nLines} baris, ${(out.length / 1024).toFixed(1)} KB)`);
}

main();
