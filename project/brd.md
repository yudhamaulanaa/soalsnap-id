# BRD — Business Requirements Document
**Produk:** SoalSnap · **Versi:** 1.0 · **Status:** draft untuk review

## 1. Latar belakang
Pembuatan latihan interaktif hari ini menuntut pengetikan ulang: satu per satu nomor, opsi, dan kunci jawaban. Guru sudah memiliki materi dalam bentuk buku cetak, lembar kerja, dan file lama, tetapi tidak memiliki waktu memindahkannya. Akibatnya alat latihan interaktif dipakai sesekali, bukan sebagai kebiasaan mengajar.

## 2. Peluang
Kemampuan model multimodal membaca foto dokumen sudah cukup akurat untuk memecah soal berstruktur. Jika beban pengetikan hilang, hambatan terbesar adopsi hilang bersamanya: guru cukup memfoto halaman yang sudah dipakai di kelas.

## 3. Tujuan bisnis
| Kode | Tujuan | Indikator |
|---|---|---|
| B1 | Menurunkan waktu pembuatan satu latihan | dari ±20 menit ketik manual menjadi < 2 menit |
| B2 | Mengubah pemakaian sesekali menjadi rutin | ≥ 4 aktivitas dibuat per guru aktif per bulan |
| B3 | Tumbuh lewat siswa | ≥ 30% guru baru datang dari tautan yang dimainkan siswa |
| B4 | Menjaga biaya inferensi sehat | biaya AI < 20% pendapatan per pengguna berbayar |

## 4. Ruang lingkup
**Masuk lingkup (v1):** unggah multi-format, parsing AI, editor review, 8 template latihan, bagikan tautan + QR, main tanpa login, dashboard aktivitas, buat soal manual.
**Di luar lingkup (v1):** akun siswa, penilaian esai, integrasi LMS, kolaborasi tim, aplikasi mobile native, marketplace soal.

## 5. Pemangku kepentingan
| Peran | Kepentingan |
|---|---|
| Guru / tutor | pembuat konten; menilai kecepatan dan akurasi |
| Siswa | pemain; menilai kemudahan tanpa login |
| Sekolah / bimbel | pembeli lisensi kelompok pada tahap berbayar |
| Tim produk & desain | alur, kualitas hasil parsing |
| Tim AI/ML | akurasi, biaya per unggahan |

## 6. Asumsi
- Sebagian besar soal yang diunggah adalah soal berstruktur (bernomor), bukan esai bebas.
- Guru bersedia memeriksa draft; mereka tidak menuntut akurasi 100% asalkan koreksi mudah.
- Siswa memainkan latihan di ponsel, sering pada koneksi lambat.

## 7. Batasan
Anggaran inferensi per unggahan terbatas; halaman per unggahan dibatasi. Bahasa v1 hanya Indonesia. Tulisan tangan didukung sebagai upaya terbaik, bukan jaminan.

## 8. Model bisnis
Gratis: 5 aktivitas dan 20 halaman unggahan per bulan. Berbayar (guru): kuota lebih besar, laporan nilai, ekspor. Lisensi sekolah: per rombongan guru, penagihan tahunan. Halaman main siswa selalu gratis — ia adalah kanal akuisisi.

## 9. Kriteria sukses peluncuran
Median foto→publish < 2 menit · ≥ 90% soal hasil AI diterima tanpa koreksi berat · ≥ 60% guru yang membuat aktivitas pertama membuat yang kedua dalam 14 hari.

## 10. Risiko bisnis
| Risiko | Dampak | Mitigasi |
|---|---|---|
| Akurasi parsing di bawah harapan | kepercayaan turun, churn | tanda keyakinan, review wajib, panduan foto |
| Biaya AI membengkak | margin tergerus | batas halaman, cache OCR, model bertingkat |
| Sengketa hak cipta materi | hukum, reputasi | konten milik pengguna, default privat, tanpa distribusi publik di v1 |
| Pesaing menambah fitur serupa | diferensiasi menipis | kualitas review-editor dan kecepatan sebagai keunggulan operasional |
