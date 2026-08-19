# FRD — Functional Requirements Document
**Produk:** SoalSnap · **Versi:** 1.0
Penomoran: `FR-<modul>-<n>`. Semua persyaratan mengikat kecuali ditandai *opsional*.

## 1. Modul Unggah (UP)
| ID | Persyaratan |
|---|---|
| FR-UP-1 | Sistem menerima JPG, PNG, PDF, DOCX, dan input teks tempel. |
| FR-UP-2 | Pengguna dapat menambahkan beberapa file dalam satu unggahan; setiap file tampil sebagai baris dengan nama, ukuran, dan status. |
| FR-UP-3 | Setiap baris file dapat dihapus sebelum proses dimulai. Menghapus baris tidak memicu aksi lain pada area unggah. |
| FR-UP-4 | Tombol proses menampilkan jumlah file dan hanya aktif bila ≥ 1 file/teks ada. |
| FR-UP-5 | Ukuran maksimum 10 MB per file, 20 halaman per unggahan; pelanggaran ditolak dengan pesan yang menyebut batas. |
| FR-UP-6 | Tersedia jalur "ketik soal manual" yang melewati unggah dan langsung membuka editor dengan satu soal kosong. |
| FR-UP-7 | Klik pada kontrol di dalam area seret-dan-lepas tidak boleh memicu pemilihan file (propagasi event dihentikan). |

## 2. Modul Pemrosesan AI (AI)
| ID | Persyaratan |
|---|---|
| FR-AI-1 | Sistem menampilkan progres 0–100% beserta tahap aktif: baca teks, deteksi nomor & tipe, cocokkan kunci, susun draft. |
| FR-AI-2 | Setiap soal keluaran memuat: `tipe`, `pertanyaan`, `opsi[]`, `kunci`, `confidence` (0–100), `halaman`. |
| FR-AI-3 | Tipe yang dideteksi: `pg`, `bs`, `isian`, `jodoh`. Tipe tak dikenal jatuh ke `isian`. |
| FR-AI-4 | Bila kunci tidak ditemukan di dokumen, sistem mengusulkan kunci dan menurunkan `confidence` di bawah ambang tanda. |
| FR-AI-5 | Soal dengan `confidence` < 80 ditandai `low` dan diberi catatan penyebab. |
| FR-AI-6 | Validasi keluaran: opsi ≥ 2 untuk `pg`, indeks kunci valid, teks tidak kosong, nomor tidak duplikat. Soal gagal validasi tetap ditampilkan dengan tanda, tidak dibuang senyap. |
| FR-AI-7 | Kegagalan pemrosesan menampilkan pesan dan mempertahankan file agar dapat dicoba ulang. |
| FR-AI-8 | Hasil AI tidak boleh dipublikasikan tanpa melewati layar Review. |

## 3. Modul Review Draft (RV)
| ID | Persyaratan |
|---|---|
| FR-RV-1 | Semua soal tampil dalam satu daftar dengan nomor urut, label tipe, dan (opsional) skor keyakinan. |
| FR-RV-2 | Ringkasan atas menampilkan jumlah soal dan jumlah soal bertanda periksa. |
| FR-RV-3 | Mode edit per soal mengubah teks soal menjadi bidang teks yang dapat diubah dan kembali saat selesai. |
| FR-RV-4 | Klik pada satu opsi menjadikannya kunci jawaban; kunci sebelumnya otomatis dilepas. |
| FR-RV-5 | Soal tipe `isian` menampilkan bidang kunci jawaban teks yang dapat diedit. |
| FR-RV-6 | Soal dapat dihapus; menghapus tidak mengubah nomor soal lain selain penomoran ulang tampilan. |
| FR-RV-7 | Tombol tambah soal manual membuat soal `pg` baru dengan 4 opsi kosong dalam mode edit. |
| FR-RV-8 | Panel sumber unggahan hanya tampil bila draft berasal dari unggahan; pada jalur manual panel disembunyikan dan judul menyesuaikan. |
| FR-RV-9 | Tombol lanjut menampilkan jumlah soal dan menuju Pilih Template; nonaktif bila 0 soal. |

## 4. Modul Template (TP)
| ID | Persyaratan |
|---|---|
| FR-TP-1 | Delapan template tersedia: Kuis, Benar/Salah, Isian, Menjodohkan, Flashcard, Susun Kata, Cari Kata, Kuis Cepat. |
| FR-TP-2 | Setiap kartu template menampilkan pratinjau visual, nama, dan satu baris penjelasan. |
| FR-TP-3 | Sistem menandai satu template sebagai disarankan berdasarkan komposisi tipe soal. |
| FR-TP-4 | Memilih template menyimpan pilihan pada aktivitas dan menuju layar Bagikan. |
| FR-TP-5 | Template dapat diganti kapan saja tanpa mengubah bank soal. |
| FR-TP-6 | Syarat data per template: Menjodohkan butuh ≥ 3 pasangan kunci unik; Susun Kata dan Cari Kata butuh kunci satu kata 4–10 huruf; bila tidak terpenuhi, kartu menampilkan alasan dan tidak dapat dipilih. |

## 5. Modul Bagikan (SH)
| ID | Persyaratan |
|---|---|
| FR-SH-1 | Judul aktivitas dapat diedit; nilai awal diusulkan dari isi soal. |
| FR-SH-2 | Sistem membuat tautan publik pendek dan QR yang mengarah ke tautan itu. |
| FR-SH-3 | Tombol salin menyalin tautan dan memberi konfirmasi sesaat. |
| FR-SH-4 | Pengaturan: acak urutan soal (aktif/nonaktif), timer per soal (aktif/nonaktif + durasi 5–60 detik). |
| FR-SH-5 | Pratinjau siswa membuka mode main sesuai template terpilih dengan pengaturan saat ini. |
| FR-SH-6 | Membuka tautan publik tidak boleh meminta autentikasi. |

## 6. Modul Main (PL)
Umum: penghitung posisi, indikator skor, dan tombol keluar tampil di semua mode.

| ID | Persyaratan |
|---|---|
| FR-PL-1 | **Kuis / Benar-Salah:** memilih opsi mengunci jawaban, menandai kunci hijau dan pilihan salah merah, menampilkan umpan balik, lalu maju otomatis setelah 1,4 detik. |
| FR-PL-2 | **Isian:** jawaban dibandingkan tanpa peka huruf besar-kecil dan tanpa spasi tepi. |
| FR-PL-3 | **Timer:** bila aktif, bilah waktu menyusut; waktu habis dihitung salah dan menampilkan kunci. Kuis Cepat memakai maksimum 8 detik per soal. |
| FR-PL-4 | **Menjodohkan:** klik istilah lalu klik jawaban; pasangan benar terkunci, salah berkedip merah; skor hanya dihitung untuk pasangan yang benar pada percobaan pertama; selesai saat semua pasangan terkunci. |
| FR-PL-5 | **Flashcard:** kartu dibalik dengan klik; navigasi maju/mundur; titik progres menandai posisi; kartu yang sudah dilihat dihitung. |
| FR-PL-6 | **Susun Kata:** huruf acak disusun ke slot; susunan benar memberi konfirmasi dan maju ke kata berikut; salah mengosongkan slot. |
| FR-PL-7 | **Cari Kata:** kisi 10×10 dibuat dari kunci satu kata, arah horizontal dan vertikal, sisa sel diisi huruf acak. Pemain klik sel awal lalu sel akhir; hanya garis lurus diterima; kata ditemukan disorot dan dicoret di daftar. |
| FR-PL-8 | Layar hasil menampilkan skor akhir, pesan sesuai capaian, serta aksi main lagi dan kembali. |
| FR-PL-9 | Keluar dari mode main menghentikan semua timer yang berjalan. |

## 7. Modul Dashboard (DB)
| ID | Persyaratan |
|---|---|
| FR-DB-1 | Daftar aktivitas menampilkan judul, template, jumlah soal, dan jumlah dimainkan. |
| FR-DB-2 | Setiap kartu menyediakan aksi mainkan dan salin tautan. |
| FR-DB-3 | Kartu ajakan "buat dari foto" selalu berada di posisi pertama. |
| FR-DB-4 | Aktivitas yang baru dipublikasikan ditandai dan tampil di awal daftar. |

## 8. Aturan data
`Activity(id, judul, template, acak, timerOn, timerDetik, status, slug)` · `Question(id, activityId, tipe, teks, opsi[], kunciIndex|kunciTeks, confidence, sumber, halaman)` · `Upload(id, activityId, file[], status, ocrRaw)` · `PlaySession(id, activityId, skor, total, durasi, mulai)`.
Menghapus Activity menghapus Question dan Upload terkait; PlaySession dipertahankan sebagai data agregat anonim.

## 9. Penanganan kesalahan
Format tak didukung, file terlalu besar, halaman melebihi batas, tidak ada soal terdeteksi, kegagalan model, tautan tidak ditemukan, aktivitas tanpa soal. Setiap kasus menampilkan penyebab dan satu tindakan pemulihan.
