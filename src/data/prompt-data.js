/* ============================================================
   DATA: prompt-data.js — Starter, blok prompt & template Prompt Studio
   ============================================================ */
/* Starter prompt — dipakai saat belum ada draft di localStorage */
const PS_STARTER = [
  '# Role',
  '',
  'Kamu adalah seorang asisten AI yang membantu menulis dan menyusun konten.',
  '',
  '## Objective',
  '',
  '[Tuliskan tujuan utama di sini]',
  '',
  '## Rules',
  '',
  '1. Gunakan Bahasa Indonesia yang baik dan benar',
  '2. Berikan jawaban yang terstruktur',
  '3. Gunakan contoh konkret',
  '',
  '## Output Format',
  '',
  '- Ringkasan',
  '- Poin-poin utama',
  '- Kesimpulan'
].join('\n');

/* Blok prompt siap pakai (AI Prompt Blocks) */
const PS_BLOCKS = [
  { name:'Role',            insert:['## Role','','Kamu adalah seorang [sebutkan peran di sini].'].join('\n') },
  { name:'Task / Objective',insert:['## Objective','','[Tuliskan tujuan utama dari prompt ini secara spesifik.]'].join('\n') },
  { name:'Rules',           insert:['## Rules','','1. [Aturan pertama]','2. [Aturan kedua]','3. [Aturan ketiga]'].join('\n') },
  { name:'Context',         insert:['## Context','','[Tuliskan konteks atau latar belakang yang relevan.]'].join('\n') },
  { name:'Example',         insert:['## Example','','**Input:**','[contoh input]','','**Output yang diharapkan:**','[contoh output]'].join('\n') },
  { name:'Output Format',   insert:['## Output Format','','- [Format 1]','- [Format 2]','- [Format 3]'].join('\n') },
  { name:'Constraints',     insert:['## Constraints','','- [Batasan 1]','- [Batasan 2]'].join('\n') }
];

/* Kategori template + daftar template siap pakai */
const PS_CATEGORIES = [
  {
    id:'general', name:'General', emoji:'📁', templates:[
      { name:'Rangkuman', desc:'Ringkas teks jadi poin penting', content:[
        '# Tugas','',
        'Ringkas teks berikut menjadi poin-poin penting.','',
        '## Teks','',
        '[Tempel teks yang ingin diringkas di sini]','',
        '## Aturan','',
        '- Ringkas dalam 5–7 poin utama',
        '- Gunakan bahasa yang jelas dan mudah dipahami',
        '- Jangan menambahkan informasi yang tidak ada di teks'
      ].join('\n') },
      { name:'Brainstorming Ide', desc:'Hasilkan 10+ ide untuk topik', content:[
        '# Tugas','',
        'Bantu saya melakukan brainstorming ide tentang [topik].','',
        '## Aturan','',
        '1. Berikan minimal 10 ide yang beragam',
        '2. Kelompokkan ide berdasarkan kategori',
        '3. Tandai ide yang paling kreatif dan layak dieksekusi'
      ].join('\n') },
      { name:'Surat Formal', desc:'Tulis surat formal berbahasa Indonesia', content:[
        '# Tugas','',
        'Tuliskan surat formal untuk [keperluan surat].','',
        '## Konteks','',
        '- Pengirim: [nama]',
        '- Penerima: [nama / instansi]',
        '- Keperluan: [isi keperluan]','',
        '## Aturan','',
        '- Gunakan Bahasa Indonesia formal dan sopan',
        '- Struktur: salam pembuka, isi, penutup',
        '- Panjang sekitar 3–4 paragraf'
      ].join('\n') }
    ]
  },
  {
    id:'programming', name:'Programming', emoji:'💻', templates:[
      { name:'Perbaiki Bug', desc:'Jelaskan & perbaiki bug pada kode', content:[
        '# Tugas','',
        'Bantu saya menemukan dan memperbaiki bug pada kode berikut.','',
        '## Kode','',
        '```[bahasa]',
        '[tempel kode di sini]',
        '```','',
        '## Output','',
        '1. Jelaskan penyebab bug dengan singkat',
        '2. Tampilkan kode yang sudah diperbaiki',
        '3. Jelaskan perubahannya'
      ].join('\n') },
      { name:'Code Review', desc:'Review kode secara menyeluruh', content:[
        '# Tugas','',
        'Lakukan code review terhadap kode berikut.','',
        '## Kode','',
        '```[bahasa]',
        '[tempel kode di sini]',
        '```','',
        '## Fokus Review','',
        '- Kebenaran logika',
        '- Keamanan',
        '- Performa',
        '- Keterbacaan & best practice','',
        '## Output','',
        '- Daftar temuan dengan tingkat keparahan (kritis / utama / minor)',
        '- Saran perbaikan dengan contoh kode'
      ].join('\n') },
      { name:'Explain Code', desc:'Jelaskan cara kerja sebuah kode', content:[
        '# Tugas','',
        'Jelaskan kode berikut dengan bahasa yang mudah dipahami.','',
        '## Kode','',
        '```[bahasa]',
        '[tempel kode di sini]',
        '```','',
        '## Output','',
        '- Tujuan kode secara umum',
        '- Penjelasan baris per baris / bagian per bagian',
        '- Kompleksitas waktu dan ruang'
      ].join('\n') }
    ]
  },
  {
    id:'story', name:'Story', emoji:'📖', templates:[
      { name:'Cerita Pendek', desc:'Tulis cerita pendek dari premis', content:[
        '# Tugas','',
        'Tuliskan cerita pendek berdasarkan prompt berikut.','',
        '## Premis','',
        '[Deskripsi premis cerita]','',
        '## Elemen Cerita','',
        '- Tokoh utama: [nama & sifat]',
        '- Latar: [waktu & tempat]',
        '- Konflik: [konflik utama]',
        '- Panjang: [jumlah kata]','',
        '## Aturan','',
        '- Gunakan sudut pandang orang ketiga',
        '- Bangun klimaks yang menarik',
        '- Akhiri dengan resolusi yang memuaskan'
      ].join('\n') },
      { name:'Ide Alur Cerita', desc:'Kembangkan premis & plot twist', content:[
        '# Tugas','',
        'Buatkan ide alur cerita untuk [genre / tema].','',
        '## Output','',
        '- 5 premis singkat yang berbeda',
        '- Untuk masing-masing: konflik utama, plot twist, dan ending',
        '- Tandai ide yang paling kuat dan jelaskan alasannya'
      ].join('\n') },
      { name:'Karakter Tokoh', desc:'Kembangkan profil karakter fiksi', content:[
        '# Tugas','',
        'Kembangkan karakter fiksi untuk cerita saya.','',
        '## Informasi Dasar','',
        '- Nama: [nama]',
        '- Peran: [protagonis / antagonis / pendukung]',
        '- Umur: [umur]','',
        '## Output','',
        '- Latar belakang & motivasi',
        '- Kepribadian (kekuatan, kelemahan, kebiasaan)',
        '- Konflik internal',
        '- Cara berbicara & ciri khas'
      ].join('\n') }
    ]
  },
  {
    id:'translation', name:'Translation', emoji:'🌐', templates:[
      { name:'Terjemah ID → EN', desc:'Terjemah natural ke Bahasa Inggris', content:[
        '# Tugas','',
        'Terjemahkan teks berikut dari Bahasa Indonesia ke Bahasa Inggris.','',
        '## Teks','',
        '[tempel teks di sini]','',
        '## Aturan','',
        '- Terjemahan harus natural, bukan harfiah',
        '- Pertahankan nada dan gaya bahasa asli',
        '- Jika ada istilah khusus, berikan catatan di dalam kurung'
      ].join('\n') },
      { name:'Terjemah EN → ID', desc:'Terjemah natural ke Bahasa Indonesia', content:[
        '# Tugas','',
        'Terjemahkan teks berikut dari Bahasa Inggris ke Bahasa Indonesia.','',
        '## Teks','',
        '[tempel teks di sini]','',
        '## Aturan','',
        '- Gunakan Bahasa Indonesia yang baik dan benar',
        '- Pertahankan makna dan nuansa asli',
        '- Istilah teknis boleh dipertahankan dalam Bahasa Inggris bila lebih umum'
      ].join('\n') },
      { name:'Terjemah Formal', desc:'Ubah teks jadi lebih formal', content:[
        '# Tugas','',
        'Ubah teks berikut menjadi bahasa yang lebih formal dan profesional.','',
        '## Teks','',
        '[tempel teks di sini]','',
        '## Aturan','',
        '- Gunakan kosakata formal tanpa terkesan kaku',
        '- Perbaiki struktur kalimat yang ambigu',
        '- Pertahankan makna asli','',
        '## Output','',
        '- Versi formal',
        '- Daftar perubahan utama yang dilakukan'
      ].join('\n') }
    ]
  },
  {
    id:'promptai', name:'Prompt AI', emoji:'🤖', templates:[
      { name:'Prompt Master', desc:'Struktur prompt lengkap (Role–Rules–Output)', content:[
        '# Role','',
        'Kamu adalah seorang penulis konten profesional yang berpengalaman dalam [bidang].','',
        '# Objective','',
        '[Tuliskan tujuan utama dari prompt ini secara jelas dan spesifik]','',
        '# Rules','',
        '1. Gunakan Bahasa Indonesia yang baik dan benar',
        '2. Berikan jawaban yang terstruktur dengan heading dan bullet point',
        '3. Gunakan contoh konkret untuk memperjelas jawaban',
        '4. Jika informasi tidak lengkap, berikan asumsi yang masuk akal','',
        '# Output Format','',
        '- Ringkasan eksekutif (2–3 kalimat)',
        '- Poin-poin utama',
        '- Contoh penerapan',
        '- Kesimpulan'
      ].join('\n') },
      { name:'Analisis SWOT', desc:'Prompt analisis SWOT bisnis', content:[
        '# Role','',
        'Kamu adalah seorang analis bisnis profesional.','',
        '# Objective','',
        'Lakukan analisis SWOT untuk [deskripsi bisnis / produk / usaha].','',
        '# Output Format','',
        '- **Strengths** (Kekuatan): minimal 4 poin',
        '- **Weaknesses** (Kelemahan): minimal 4 poin',
        '- **Opportunities** (Peluang): minimal 4 poin',
        '- **Threats** (Ancaman): minimal 4 poin',
        '- Rekomendasi strategi berdasarkan hasil analisis','',
        '# Rules','',
        '- Berikan penjelasan singkat untuk setiap poin',
        '- Fokus pada faktor internal dan eksternal yang relevan'
      ].join('\n') },
      { name:'Penulis Blog', desc:'Prompt artikel blog ramah SEO', content:[
        '# Role','',
        'Kamu adalah seorang penulis blog profesional yang ahli dalam SEO.','',
        '# Objective','',
        'Tuliskan artikel blog tentang [topik] dengan target pembaca [audiens].','',
        '# Rules','',
        '1. Gunakan gaya bahasa yang hangat dan mudah dipahami',
        '2. Struktur: pendahuluan, isi dengan subheading, penutup',
        '3. Sertakan call-to-action di akhir artikel',
        '4. Panjang artikel sekitar [jumlah] kata','',
        '# Output Format','',
        '- Judul yang menarik (3 opsi)',
        '- Meta description',
        '- Artikel lengkap dengan heading H2/H3'
      ].join('\n') }
    ]
  },
  {
    id:'imageai', name:'Image AI', emoji:'🎨', templates:[
      { name:'Gambar Realistis', desc:'Prompt gambar realistis yang detail', content:[
        '# Tugas','',
        'Buatkan prompt gambar AI yang realistis dan detail.','',
        '## Subjek','',
        '[Deskripsi subjek utama]','',
        '## Detail yang Diinginkan','',
        '- Gaya: [fotorealistik / ilustrasi / lukisan]',
        '- Pencahayaan: [deskripsi cahaya]',
        '- Komposisi: [sudut kamera, framing]',
        '- Suasana: [mood / warna dominan]','',
        '## Aturan','',
        '- Tulis dalam Bahasa Inggris (lebih akurat untuk AI image generator)',
        '- Sebutkan kualitas gambar: "high resolution, sharp focus, 8k"',
        '- Hindari kata yang ambigu'
      ].join('\n') },
      { name:'Ilustrasi Karakter', desc:'Prompt desain karakter visual', content:[
        '# Tugas','',
        'Buatkan prompt untuk ilustrasi karakter.','',
        '## Karakter','',
        '- Nama & peran: [nama]',
        '- Penampilan: [rambut, mata, pakaian, aksesori]',
        '- Ekspresi: [mood wajah]','',
        '## Gaya','',
        '- [anime / cartoon / semi-realistic / pixel art]',
        '- Palet warna: [warna dominan]','',
        '## Aturan','',
        '- Tulis dalam Bahasa Inggris',
        '- Detailkan pose dan latar belakang',
        '- Tambahkan "character design sheet" bila ingin multi-angle'
      ].join('\n') },
      { name:'Logo Minimalis', desc:'Prompt desain logo yang bersih', content:[
        '# Tugas','',
        'Buatkan prompt untuk desain logo minimalis.','',
        '## Konsep','',
        '- Nama brand: [nama]',
        '- Simbol / ikon: [bentuk yang diinginkan]',
        '- Industri: [bidang usaha]','',
        '## Aturan','',
        '- Tulis dalam Bahasa Inggris',
        '- Sebutkan "minimalist flat vector logo, clean lines"',
        '- Spesifikasi: "white background, centered, no text" bila tanpa tulisan',
        '- Berikan 3 variasi konsep yang berbeda'
      ].join('\n') }
    ]
  }
];


