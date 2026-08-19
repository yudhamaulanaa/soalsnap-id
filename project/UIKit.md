# UIKit.md — Token & Komponen
Nilai di bawah ini adalah nilai yang benar-benar dipakai pada berkas desain SoalSnap. Gaya ditulis inline pada setiap komponen; tidak ada kelas CSS bersama.

## 1. Warna
| Peran | Hex | Pemakaian |
|---|---|---|
| Teal produk | `#0E8A7B` | aksi utama, kunci benar, aksen |
| Teal gelap | `#0A6E62` | hover aksi utama, teks di atas latar teal muda |
| Teal muda | `#DCF1EC` | latar penanda benar, chip, band kartu |
| Teal pucat | `#CDEBE4` | seleksi teks |
| Hijau tua | `#0E3F39` | hero, latar mode main |
| Ungu AI | `#6D5AE6` | penanda proses AI, pratinjau siswa, seleksi |
| Ungu gelap | `#4A3DB8` | teks pada chip ungu |
| Ungu muda | `#ECE8FC` | latar chip AI, band kartu |
| Kuning skor | `#F6C445` | chip skor, aksi pada latar gelap |
| Kuning peringatan | `#FDF0D5` / `#92610A` | latar & teks soal perlu diperiksa |
| Krem kartu risiko | `#FFFCF4` + border `#E8B75A` | kartu soal keyakinan rendah |
| Merah salah | `#D64545` / `#FCE9E9` / `#B03030` | jawaban salah, hapus |
| Teks utama | `#182420` | judul, isi |
| Teks sekunder | `#41544E` | label kontrol |
| Teks tersier | `#5B6963` | penjelasan |
| Teks redup | `#8A968F` / `#9AA6A1` | label kecil, ikon nonaktif |
| Latar aplikasi | `#F2F4F1` | halaman |
| Permukaan | `#FFFFFF` | kartu, panel |
| Garis | `#E3E7E2` | batas kartu & kontrol |
| Garis hover | `#B8CFC9` | batas saat hover |
| Netral isi | `#EEF3F1` / `#E1EAE7` / `#E7EDEA` | tombol sekunder, bilah kosong |

## 2. Tipografi
- Judul & label tombol: **Gabarito** 500–900.
- Teks & isi soal: **Onest** 400–700.
- Muat: `https://fonts.googleapis.com/css2?family=Gabarito:wght@500;600;700;800;900&family=Onest:wght@400;500;600;700&display=swap`

| Peran | Font | Ukuran / bobot |
|---|---|---|
| Judul hero | Gabarito | 42px / 800, line-height 1.1 |
| Judul halaman | Gabarito | 30–32px / 800 |
| Judul bagian | Gabarito | 24px / 700 |
| Judul kartu | Gabarito | 17px / 700 |
| Soal (mode main) | Gabarito | 26px / 700, line-height 1.35 |
| Skor akhir | Gabarito | 52px / 900 |
| Isi & penjelasan | Onest | 13–16px / 400–600, line-height 1.55–1.6 |
| Label kecil | Onest | 11px / 700, letter-spacing .08em, huruf besar |
| Chip | Onest | 12–13px / 700 |

## 3. Ruang & bentuk
Skala jarak: 4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 24 · 26 · 32 · 36 · 40 · 44 · 48px.
Radius: kontrol kecil 8–12px · kartu 14–20px · panel besar 22–26px · pil `999px`.
Bayangan: kartu hover `0 8px 24px rgba(24,36,32,.08)` · kartu terangkat `0 12px 28px rgba(24,36,32,.1)` · bilah lengket `0 12px 32px rgba(24,36,32,.12)` · kartu di latar gelap `0 18px 44px rgba(0,0,0,.28)`.
Lebar isi: 1160px (dashboard, review) · 1020px (bagikan) · 780px (mode main) · 740px (unggah) · 620px (proses).

## 4. Komponen

**Tombol utama** — latar `#0E8A7B`, teks putih, Gabarito 700 15–16px, padding `13px 26px`, radius `999px`; hover `#0A6E62`, sebagian mengangkat `translateY(-2px)`.
**Tombol sekunder** — latar transparan, border `1.5px solid #E3E7E2`, teks `#41544E`, radius `999px` atau `14px`; hover border `#B8CFC9`.
**Tombol pada latar gelap** — latar `rgba(255,255,255,.12)`, teks putih; hover `.22`. Aksi utama di latar gelap memakai putih penuh atau `#F6C445`.
**Chip** — radius `999px`, padding `4px 12px`, 12px/700. Varian: teal (`#DCF1EC`/`#0A6E62`), ungu (`#ECE8FC`/`#4A3DB8`), kuning (`#FDF0D5`/`#92610A`), netral (`#EEF3F1`/`#5B6963`).
**Kartu** — putih, border `1px solid #E3E7E2`, radius 18–20px. Kartu aktivitas memiliki band warna 86px di atas berisi nama template.
**Slot kosong** — border `2px dashed #B8CFC9`, radius 20–22px; hover border `#0E8A7B`, latar putih.
**Kartu soal (review)** — putih + border tipis; varian risiko: latar `#FFFCF4`, border `1.5px solid #E8B75A`, plus catatan kuning di bawah.
**Tombol opsi (review)** — kiri rata, radius 11px, padding `11px 14px`; terpilih: latar `#DCF1EC`, border `1.5px solid #0E8A7B`, teks `#0A6E62`, awalan tanda centang.
**Tombol opsi (main)** — radius 16px, padding `18px 20px`, 17px/600, border `2px solid #E3E7E2`; benar `#DCF1EC`+`#0E8A7B`; salah `#FCE9E9`+`#D64545`; lainnya opacity .45.
**Bidang teks** — border `1.5px solid #E3E7E2`, radius 12–14px, padding `12px 16px`; fokus border `#0E8A7B`.
**Sakelar** — jalur 46×26px radius `999px`, mati `#D6DDD9`, hidup `#0E8A7B`; tombol 20px putih, transisi `left .2s`.
**Bilah progres** — tinggi 10px, radius `999px`, latar `#E7EDEA`; isi gradien `#0E8A7B → #6D5AE6` (proses AI) atau `#7FD9C8`, berubah `#F6C445` saat ≤ 5 detik (timer).
**Indikator langkah** — lingkaran 24px berisi nomor atau centang; aktif/selesai `#0E8A7B` putih, belum `#E1EAE7` `#8A968F`; penghubung garis 24×2px.
**Ubin huruf** — 46×52px, radius 12px, Gabarito 800 20–22px; slot kosong `2px dashed #C3CCC7` latar `#F2F4F1`; ubin tersedia putih dengan bayangan; terpakai `#E7EDEA`.
**Sel kisi cari kata** — rasio 1:1, radius 8px, Gabarito 700 15px; normal `#F2F4F1`, terpilih `#6D5AE6`, ditemukan `#0E8A7B`, salah `#D64545` (teks putih pada ketiganya).

## 5. Animasi
```
popin     0.25–0.35s ease   scale(.94)→1, opacity 0→1   kartu & umpan balik masuk
scanline  2.2s ease-in-out  garis pindai naik-turun     layar proses AI
floaty    5s ease-in-out    translateY 0→-7px           ilustrasi hero
```
Transisi kontrol: `all .12–.2s`. Bilah timer: `width 1s linear`.

## 6. Ikon
Garis luar, `stroke-width` 2–2.5, `stroke-linecap: round`, ukuran 13–28px, mewarisi `currentColor`. Set yang dipakai: kamera, unggah, dokumen, tautan, tempat sampah, pensil, centang, silang, panah kanan, panah kiri, putar, jam.
