/* ============================================================
   DATA: tools.js — Registrasi tool (TOOLS) & kategori (CATEGORIES)
   ============================================================ */
const TOOLS = [
  { id:'qr', name:'QR Code Generator', cat:'generator', desc:'Ubah teks, tautan, atau kontak menjadi QR code yang bisa diunduh.', render:renderQR, mount:mountQR },
  { id:'password', name:'Password Generator', cat:'generator', desc:'Hasilkan password acak dengan aman menggunakan crypto API browser.', render:renderPassword, mount:mountPassword },
  { id:'unit', name:'Konverter Unit', cat:'konverter', desc:'Konversi satuan dengan cepat — panjang, berat, suhu, volume, kecepatan, dan data.', render:renderUnit, mount:mountUnit },
  { id:'imageresizer', name:'Image Resizer', cat:'konverter', desc:'Ubah ukuran, format, dan kompresi gambar secara lokal di browser. Support batch & download ZIP.', render:renderImageResizer, mount:mountImageResizer },
  { id:'bmi', name:'Kalkulator BMI & Kalori', cat:'kalkulator', desc:'Hitung BMI dan estimasi kebutuhan kalori harian berdasarkan rumus Mifflin-St Jeor.', render:renderBMI, mount:mountBMI },
  { id:'zakat', name:'Kalkulator Zakat', cat:'kalkulator', desc:'Hitung nominal zakat yang wajib dikeluarkan berdasarkan nisab emas.', render:renderZakat, mount:mountZakat },
  { id:'loan', name:'Kalkulator Cicilan & KPR', cat:'kalkulator', desc:'Hitung cicilan anuitas, total bunga, dan lihat tabel amortisasi lengkap.', render:renderLoan, mount:mountLoan },
  { id:'age', name:'Kalkulator Umur & Countdown', cat:'kalkulator', desc:'Hitung umur secara presisi atau hitung mundur menuju tanggal target secara live.', render:renderAge, mount:mountAge },
  { id:'name', name:'Generator Nama Acak', cat:'generator', desc:'Hasilkan nama acak untuk karakter, OC, atau username dengan berbagai gaya.', render:renderName, mount:mountName },
  { id:'decision', name:'Pengambil Keputusan Acak', cat:'simulasi', desc:'Masukkan opsi, putar roda, dan biarkan peluang memutuskan untuk Anda.', render:renderDecision, mount:mountDecision },
  { id:'lorem', name:'Lorem Ipsum Indonesia', cat:'generator', desc:'Hasilkan teks pengisi bahasa Indonesia yang natural — formal atau santai.', render:renderLorem, mount:mountLorem },
  { id:'gacha', name:'Simulator Gacha', cat:'simulasi', desc:'Simulasi probability sistem gacha dengan pity — untuk edukasi sebelum pull asli.', render:renderGacha, mount:mountGacha },
  { id:'mc', name:'Minecraft Coordinate Converter', cat:'konverter', desc:'Konversi koordinat antar dimensi Minecraft dengan rasio 1:8 yang akurat.', render:renderMC, mount:mountMC },
  { id:'uuid', name:'UUID / ID Generator', cat:'dev', desc:'Hasilkan UUID v4 atau ID acak untuk keperluan testing dan development.', render:renderUUID, mount:mountUUID },
  { id:'fake', name:'Fake Data Generator', cat:'dev', desc:'Buat nama, email, alamat, dan nomor telepon dummy untuk testing database.', render:renderFake, mount:mountFake },
  { id:'slug', name:'Slug Generator', cat:'dev', desc:'Konversi judul artikel atau teks menjadi URL slug yang aman dan SEO friendly.', render:renderSlug, mount:mountSlug },
  { id:'hash', name:'Hash Generator', cat:'dev', desc:'Hitung nilai hash dari teks untuk cek integritas atau belajar kriptografi dasar.', render:renderHash, mount:mountHash },
  { id:'diff', name:'Text Diff Checker', cat:'text', desc:'Cek perbedaan antara dua teks dengan highlight kata yang ditambah/dihapus.', render:renderDiff, mount:mountDiff },
  { id:'markdown', name:'Markdown Previewer', cat:'text', desc:'Ketik sintaks Markdown dan lihat hasil render HTML-nya secara real-time.', render:renderMarkdown, mount:mountMarkdown },
  { id:'json', name:'JSON Formatter', cat:'dev', desc:'Format JSON berantakan, validasi error, dan lihat struktur dengan syntax highlighting.', render:renderJSON, mount:mountJSON },
  { id:'word', name:'Word & Reading Time', cat:'text', desc:'Hitung jumlah kata, karakter, kalimat, dan estimasi waktu baca suatu teks.', render:renderWord, mount:mountWord },
  { id:'texttransformer', name:'Text Transformer', cat:'text', desc:'Balik, cermin, dan transformasi teks dengan berbagai mode. Live preview & copy dengan mudah.', render:renderTextTransformer, mount:mountTextTransformer },
  { id:'promptstudio', name:'Prompt Studio', cat:'text', desc:'Editor Markdown + pembuat prompt AI. Template siap pakai, blok prompt, live preview, dan export.', render:renderPromptStudio, mount:mountPromptStudio }
];

const CATEGORIES = [
  { id:'all', name:'Semua' },
  { id:'generator', name:'Generator' },
  { id:'kalkulator', name:'Kalkulator' },
  { id:'konverter', name:'Konverter' },
  { id:'simulasi', name:'Simulasi' },
  { id:'dev', name:'Developer' },
  { id:'text', name:'Text & Produktivitas' }
];

let currentFilter = 'all';

