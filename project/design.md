# design.md — Rasional Desain
**Produk:** SoalSnap · **Versi:** 1.0 · Token & komponen lengkap ada di `UIKit.md`.

## 1. Prinsip
1. **Kamera dulu, keyboard nanti.** Aksi utama di setiap layar mengarah ke unggah, bukan ke formulir kosong.
2. **AI harus jujur.** Setiap keluaran mesin membawa tanda keyakinan. Yang meragukan diberi warna berbeda, bukan disembunyikan.
3. **Satu bank soal, banyak wajah.** Layar template menjual keleluasaan mengganti format tanpa biaya ketik ulang.
4. **Sisi siswa tanpa gesekan.** Tanpa login, tanpa instruksi panjang, target ketuk besar.
5. **Ruang kosong dijaga.** Tidak ada hiasan yang tidak menyampaikan status, isi, atau aksi.

## 2. Arah visual
Teal tua sebagai warna produk, ungu sebagai penanda "ini bagian AI", kuning hanya untuk skor dan urgensi waktu. Latar hijau-abu hangat menjauhkan tampilan dari kesan dasbor korporat tanpa menjadi mainan. Sudut membulat besar (16–26px) pada wadah, sedang (8–14px) pada kontrol. Bayangan hanya dipakai untuk elemen yang benar-benar mengapung: bilah aksi lengket, kartu flashcard, dialog.

Tipografi dua keluarga: **Gabarito** untuk judul, angka, dan label tombol — bentuknya lebar dan ramah, cocok untuk konteks sekolah; **Onest** untuk teks berjalan dan isi soal, netral dan mudah dibaca pada ukuran kecil.

## 3. Sistem layout
Lebar isi maksimum 1160px untuk layar dashboard dan review, 740px untuk layar bertugas tunggal (unggah, publikasi), 620px untuk layar proses. Grid kartu memakai `repeat(auto-fill, minmax(240px, 1fr))` agar dashboard rapi dari ponsel sampai monitor lebar. Semua kelompok sejajar memakai flex/grid dengan `gap`, tidak margin per elemen.

Indikator langkah hanya tampil selama alur pembuatan (Unggah → Review → Template → Bagikan) dan hilang di Dashboard serta mode main — konteks datang dari posisi, bukan dari label tambahan.

## 4. Catatan per halaman
| Halaman | Keputusan desain |
|---|---|
| 01 Dashboard | Hero gelap sekali saja di seluruh aplikasi, sebagai titik masuk. Kartu "Buat dari Foto" bergaris putus-putus agar terbaca sebagai slot kosong, bukan aktivitas. |
| 02 Unggah | Satu area seret besar; tiga cara masuk (file, kamera, teks) sejajar; jalur manual dipisah garis "atau" agar tidak bersaing dengan aksi utama. |
| 03 Proses AI | Menunggu diberi bentuk: kertas dengan garis pindai, persen besar, daftar tahap. Tidak ada spinner tanpa arti. |
| 04 Review Draft | Sumber unggahan di kiri sebagai bukti asal, daftar soal di kanan. Kartu soal berkeyakinan rendah memakai latar krem dan garis kuning. Bilah aksi lengket di bawah agar tombol lanjut selalu terjangkau. |
| 05 Pilih Template | Setiap kartu memakai pratinjau geometris yang menjelaskan mekanika mainnya, bukan ikon dekoratif. |
| 06 Bagikan | Dua kolom: pengaturan di kiri, bukti hasil di kanan (tampilan siswa + QR). QR ditampilkan besar untuk proyektor. |
| 07–08 Mode main | Latar gelap memisahkan dunia guru dan dunia siswa. Kartu putih di tengah, satu tugas per layar, umpan balik selalu di tempat yang sama. |
| 09 Hasil | Angka skor sebagai elemen terbesar; dua aksi saja: main lagi, kembali. |

## 5. Gerak
Transisi masuk kartu 250–350ms (`popin`), umpan balik jawaban 250ms, bilah timer bergerak linear per detik. Garis pindai pada layar proses adalah satu-satunya animasi berulang. Tidak ada gerak yang menunda interaksi.

## 6. Aksesibilitas
Kontras teks utama ≥ 4.5:1 di semua latar. Benar/salah tidak hanya dibedakan warna: kunci diberi tanda centang, pilihan salah diberi teks umpan balik. Target ketuk sisi siswa ≥ 44px. Semua kontrol adalah elemen `button` atau `input` yang dapat dijangkau papan tombol.

## 7. Bahasa antarmuka
Indonesia, kalimat pendek, sapaan netral. Label tombol memakai kata kerja ("Mainkan", "Bagikan", "Proses"). Pesan AI menyebut tindakan yang diminta ("Foto agak buram di nomor ini — pastikan kunci jawabannya sudah benar"), bukan istilah teknis.
