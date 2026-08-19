# SoalSnap — Blueprint Produk

**Tagline:** Foto soalnya, jadi latihannya.
Ubah foto, PDF, atau dokumen soal menjadi latihan interaktif dalam satu menit — tanpa mengetik ulang satu per satu.

## 1. Ringkasan
Aplikasi web pembuat soal & latihan interaktif seperti Wordwall, dengan satu pembeda utama: soal tidak perlu diketik manual. Pengguna mengunggah foto, gambar, PDF, atau DOCX berisi soal — AI membaca, memecah, dan menyusunnya menjadi draft soal terstruktur yang tinggal direview, lalu dipasang ke template permainan. Jalur manual tetap tersedia bagi yang ingin mengetik dari nol.

## 2. Masalah yang diselesaikan
Guru sudah memiliki soal — di buku, lembar kerja, atau file lama. Membuat versi interaktifnya berarti mengetik ulang setiap nomor, setiap opsi, dan setiap kunci jawaban. Beban ketik itulah yang membuat sebagian besar guru berhenti sebelum selesai. SoalSnap memindahkan pekerjaan itu ke AI dan menyisakan tugas yang memang butuh manusia: memeriksa.

## 3. Pengguna
Guru SD–SMA, dosen, tutor bimbel, pembuat konten edukasi, dan umum. Siswa adalah pengguna sekunder — mereka hanya memainkan tautan, tanpa akun. Bahasa antarmuka: Indonesia. Platform: web dulu.

## 4. Alur utama (5 langkah)
1. **Unggah** — foto kamera, JPG/PNG, PDF, DOCX, atau tempel teks; multi halaman sekaligus. Alternatif: **buat manual** — lewati upload, langsung ketik soal di editor.
2. **Proses AI** — OCR + vision membaca dokumen, memecah per nomor soal.
3. **Review draft** — semua hasil AI masuk editor draft dulu (bukan langsung jadi): edit teks, ubah kunci, hapus/tambah soal. Soal dengan keyakinan rendah ditandai.
4. **Pilih template** — satu set soal bisa dipasang ke template mana pun, ganti kapan saja tanpa mengetik ulang.
5. **Bagikan** — link publik + QR; siswa main lewat link **tanpa login**.

## 5. Fitur MVP
- **Upload multi-format**: kamera, JPG/PNG, PDF, DOCX, tempel teks; banyak halaman per unggahan.
- **Mesin AI**: deteksi otomatis tipe soal (PG, benar/salah, isian, menjodohkan), deteksi kunci jawaban bila ada di dokumen, skor keyakinan per soal, saran jawaban bila kunci tidak ditemukan.
- **Editor review**: edit inline, klik opsi untuk mengubah kunci, hapus/tambah soal manual, gabung/pisah soal yang salah pecah. Editor yang sama dipakai untuk membuat soal manual dari nol.
- **8 template latihan**: Kuis, Benar/Salah, Isian, Menjodohkan, Flashcard, Susun Kata, Cari Kata, Kuis Cepat.
- **Bagikan & main**: link publik + QR, tanpa akun siswa; acak urutan & timer per soal; skor di akhir.
- **Dashboard**: daftar aktivitas, jumlah dimainkan, salin tautan, ganti template.

## 6. Delapan template & sumber datanya
Semua template membaca satu bank soal yang sama; masing-masing hanya menafsirkannya berbeda.

| Template | Cara main | Butuh dari soal |
|---|---|---|
| Kuis | Pilih 1 dari 4 | teks + opsi + kunci |
| Benar / Salah | Dua pilihan | pernyataan + kunci |
| Isian | Ketik jawaban | teks + kunci teks |
| Menjodohkan | Klik kiri, klik kanan | pasangan soal–kunci unik |
| Flashcard | Kartu bolak-balik | teks (depan) + kunci (belakang) |
| Susun Kata | Urutkan huruf acak | kunci 4–10 huruf |
| Cari Kata | Kisi 10×10 | kunci satu kata |
| Kuis Cepat | Kuis, timer 8 detik | sama seperti Kuis |

## 7. Pipeline AI
1. Pra-proses gambar: perbaiki orientasi, kontras, potong tepi.
2. OCR/vision (model multimodal) membaca teks + tata letak.
3. Strukturisasi ke JSON: `{tipe, pertanyaan, opsi[], kunci, confidence, halaman}`.
4. Validasi: dedup nomor, opsi minimal 2, kunci valid; soal di bawah ambang keyakinan ditandai "perlu diperiksa".
5. Draft masuk editor review — tidak ada yang dipublikasikan tanpa persetujuan pengguna.

## 8. Model data (ringkas)
- **Activity**: id, judul, template, pengaturan (acak, timer), status, link publik.
- **Question**: id, activityId, tipe, teks, opsi[], kunci, confidence, sumber (upload/manual).
- **Upload**: id, file[], status proses, hasil mentah OCR.
- **PlaySession**: id, activityId, nama pemain (opsional), skor, durasi.

## 9. Halaman (satu halaman satu file desain)
| # | Halaman | File |
|---|---|---|
| 01 | Dashboard | `Page 01 Dashboard.dc.html` |
| 02 | Unggah | `Page 02 Unggah.dc.html` |
| 03 | Proses AI | `Page 03 Proses AI.dc.html` |
| 04 | Review Draft | `Page 04 Review Draft.dc.html` |
| 05 | Pilih Template | `Page 05 Pilih Template.dc.html` |
| 06 | Bagikan | `Page 06 Bagikan.dc.html` |
| 07 | Main — Kuis | `Page 07 Main Kuis.dc.html` |
| 08 | Main — mode lain | `Page 08 Mode Main Lainnya.dc.html` |
| 09 | Hasil | `Page 09 Hasil.dc.html` |

Prototype interaktif seluruh alur: `SoalSnap.dc.html`.

## 10. Arsitektur teknis
Frontend web (React/Next.js) · API backend + antrian pemrosesan unggahan · penyimpanan file (S3-like) · model vision via API · DB Postgres. Halaman main siswa ringan, tanpa auth, dengan rate-limit.

## 11. Rilis
- **v1 (MVP)** — alur unggah→AI→review→template→bagikan, 8 template, main tanpa login.
- **v1.1** — leaderboard, laporan nilai per siswa.
- **v2** — kelas & tugas berdeadline, ekspor cetak/PDF, bank soal publik.
- **v3** — aplikasi mobile, kolaborasi antar guru.

## 12. Metrik sukses
Waktu foto→publish < 2 menit · akurasi parsing ≥ 90% · % soal yang diedit manual (makin kecil makin baik) · jumlah aktivitas dimainkan per minggu · retensi guru minggu ke-4.

## 13. Risiko & mitigasi
- Foto buram / tulisan tangan → panduan pemotretan + skor keyakinan + review wajib.
- Kunci jawaban salah tebak → soal tanpa kunci selalu ditandai, tidak auto-publish.
- Biaya inferensi per unggahan → batasi halaman per unggahan, cache hasil OCR.
- Hak cipta soal → konten milik pengguna, aktivitas privat secara default.

## 14. Dokumen terkait
`brd.md` (bisnis) · `prd.md` (produk) · `frd.md` (fungsional) · `design.md` (rasional desain) · `UIKit.md` (token & komponen).
