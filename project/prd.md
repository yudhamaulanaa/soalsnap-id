# PRD — Product Requirements Document
**Produk:** SoalSnap · **Versi:** 1.0 · **Cakupan:** MVP web

## 1. Pernyataan masalah
Guru punya soal, bukan waktu. Alat latihan interaktif meminta pengetikan ulang seluruh isi soal sebelum memberi nilai tambah apa pun. SoalSnap membalik urutannya: unggah dulu, mesin yang mengetik, manusia yang memeriksa.

## 2. Persona
**Bu Rina — guru IPA SMP.** Punya lembar soal cetak per bab. Ingin latihan digital untuk 10 menit terakhir pelajaran. Tidak mau mendaftarkan siswa satu-satu.
**Pak Adi — tutor bimbel.** Punya arsip PDF bank soal. Butuh variasi format latihan dari materi yang sama.
**Dinda — pembuat konten edukasi.** Membuat latihan untuk audiens daring; peduli tampilan dan mudah dibagikan.

## 3. Tujuan produk
- Mengubah dokumen soal menjadi latihan siap main dalam satu alur tanpa jeda.
- Menjadikan pemeriksaan draft cepat dan yakin: pengguna tahu bagian mana yang berisiko.
- Membuat satu bank soal dapat dimainkan dalam banyak format.

**Non-tujuan v1:** penilaian esai, manajemen kelas penuh, integrasi LMS, kolaborasi multi-guru.

## 4. User stories

### Unggah & parsing
- U1. Sebagai guru, saya memfoto halaman soal dan mengunggah beberapa foto sekaligus, agar satu bab selesai dalam sekali proses.
- U2. Sebagai guru, saya mengunggah PDF atau DOCX bank soal, agar arsip lama bisa dipakai.
- U3. Sebagai guru, saya menempel teks soal, agar tidak perlu file.
- U4. Sebagai guru, saya melihat kemajuan pemrosesan, agar tahu proses berjalan.

### Review
- U5. Sebagai guru, saya melihat semua soal hasil AI sebelum publikasi, agar tidak ada kesalahan tersebar ke siswa.
- U6. Sebagai guru, saya melihat tanda pada soal berkeyakinan rendah, agar tahu mana yang perlu dicek.
- U7. Sebagai guru, saya mengubah kunci jawaban dengan satu klik pada opsi.
- U8. Sebagai guru, saya mengedit teks, menambah, dan menghapus soal.
- U9. Sebagai guru, saya membuat soal manual dari nol tanpa mengunggah apa pun.

### Template & bagikan
- U10. Sebagai guru, saya memilih satu dari delapan template untuk set soal yang sama.
- U11. Sebagai guru, saya mengganti template tanpa mengetik ulang soal.
- U12. Sebagai guru, saya mengatur acak urutan dan timer per soal.
- U13. Sebagai guru, saya menyalin tautan atau menampilkan QR di proyektor.
- U14. Sebagai guru, saya mencoba versi siswa sebelum membagikan.

### Main
- U15. Sebagai siswa, saya membuka tautan dan langsung main tanpa akun.
- U16. Sebagai siswa, saya melihat benar/salah beserta kunci setelah menjawab.
- U17. Sebagai siswa, saya melihat skor akhir dan bisa mengulang.

## 5. Prioritas (MoSCoW)
**Must:** U1, U3, U4, U5, U6, U7, U8, U9, U10, U13, U15, U16, U17 · template Kuis, Benar/Salah, Isian.
**Should:** U2, U11, U12, U14 · template Menjodohkan, Flashcard, Susun Kata, Cari Kata, Kuis Cepat.
**Could:** ekspor cetak, duplikat aktivitas, folder aktivitas.
**Won't (v1):** akun siswa, leaderboard, laporan nilai, kelas & deadline.

## 6. Alur pengguna
Dashboard → Unggah (atau Manual) → Proses AI → Review Draft → Pilih Template → Bagikan → Pratinjau Main → Hasil.
Semua langkah dapat dimundurkan; keluar dari alur mengembalikan pengguna ke Dashboard tanpa kehilangan draft.

## 7. Aturan produk penting
- Tidak ada hasil AI yang dipublikasikan tanpa melewati layar Review.
- Soal dengan keyakinan di bawah 80% selalu ditandai dan diberi catatan penyebab.
- Setiap template harus bisa dijalankan dari bank soal yang sama; template yang tidak memenuhi syarat data menampilkan alasannya, bukan gagal senyap.
- Halaman main siswa tidak pernah meminta login.

## 8. Kebutuhan non-fungsional
| Aspek | Target |
|---|---|
| Waktu proses AI | ≤ 20 detik untuk 2 halaman foto |
| Muat halaman main siswa | ≤ 1,5 detik pada 3G |
| Responsif | 360px–1920px; area ketuk siswa ≥ 44px |
| Aksesibilitas | kontras teks ≥ 4.5:1, navigasi papan tombol, tanpa ketergantungan warna tunggal |
| Privasi | aktivitas privat secara default; file mentah dapat dihapus pengguna |

## 9. Metrik
Median waktu foto→publish · rasio soal diedit per aktivitas · aktivitas per guru aktif per bulan · sesi main per aktivitas · retensi guru minggu ke-4.

## 10. Pertanyaan terbuka
Berapa halaman maksimum per unggahan di paket gratis? Apakah versi cetak diperlukan pada v1.1? Perlukah mode kolaborasi antar guru satu sekolah lebih awal?
