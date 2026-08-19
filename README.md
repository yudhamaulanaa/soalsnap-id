# SoalSnap

**Foto soalnya, jadi latihannya.** Unggah foto, PDF, atau dokumen soal — AI memecahnya
menjadi latihan interaktif yang siap dimainkan siswa lewat satu tautan, tanpa login.

Implementasi dari paket desain Claude Design di `project/` (lihat [Asal desain](#asal-desain)).

## Menjalankan

```bash
npm install
cp .env.example .env      # DATABASE_URL, APP_URL, dan (opsional) kunci Resend
npm run db:migrate        # membuat tabel
npm run db:seed           # delapan contoh publik (opsional)
npm run dev               # http://localhost:3000
```

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | server pengembangan |
| `npm run build` / `npm start` | build & jalankan versi produksi |
| `npm test` | tes logika permainan & validasi API (Vitest) |
| `npm run db:migrate` / `db:seed` / `db:studio` | Prisma |
| `npm run typecheck` · `npm run lint` | TypeScript · ESLint |

## Tanpa akun: dua tautan rahasia

Tidak ada pendaftaran. Setiap aktivitas punya dua tautan acak, dan tautan itulah
yang menggantikan akun:

| Tautan | Panjang | Untuk |
|---|---|---|
| `/main/[playSlug]` | 6 karakter (~30 bit) | dibagikan ke peserta; cukup pendek untuk didikte di kelas |
| `/edit/[editSlug]` | 22 karakter (~110 bit) | dipegang pembuat soal: menyunting, mengatur, melihat rekap |

`editSlug` tidak pernah ikut dalam respons API publik maupun katalog. Peramban
pembuat menyimpan daftar tautan suntingnya di `localStorage` supaya muncul di
Dashboard — itu satu-satunya "kepemilikan" yang ada, jadi kalau tautannya hilang
dan penyimpanan peramban terhapus, aktivitas tidak bisa disunting lagi.

## Halaman

| Rute | Halaman desain |
|---|---|
| `/` | 01 Dashboard — aktivitas peramban ini + soal publik terbaru |
| `/buat` | 02 Unggah |
| `/buat/proses` | 03 Proses AI |
| `/buat/review` | 04 Review Draft |
| `/buat/template` | 05 Pilih Template — memilih template sekaligus menyimpan ke server |
| `/buat/bagikan` | 06 Bagikan — dua tautan, privat/publik, kategori, kontak pembuat |
| `/main/[playSlug]` | 07 Main Kuis · 08 Mode main lainnya · 09 Hasil |
| `/edit/[editSlug]` | halaman pemilik: sunting soal, rekap peserta, hapus |
| `/kumpulan` | katalog soal publik, difilter per kelas & mata pelajaran |

Peserta membuka `/main/[playSlug]`, mengisi nama (boleh dikosongkan), mengerjakan,
lalu melihat skornya sendiri beserta papan skor. Tambahkan `?pratinjau=1` untuk
mencoba tanpa hasilnya ikut tercatat.

## Basis data

SQLite lewat Prisma 7 (`prisma/schema.prisma`) dengan tiga tabel sesuai `frd.md` §8:
`Activity`, `Question`, `PlaySession`. Pindah ke Postgres cukup mengganti
`provider` beserta adapter-nya — skema dan kueri tidak berubah.

**Catatan penilaian.** Sama seperti prototype, penilaian dihitung di peramban,
sehingga kunci jawaban ikut terkirim ke halaman peserta. Memadai untuk latihan,
tetapi bukan untuk ujian bernilai; untuk itu penilaian harus dipindah ke server.

## Katalog & privasi

Aktivitas bersifat **privat** secara bawaan — hanya bisa dibuka lewat tautan.
Bila dijadikan **publik**, ia tampil di `/kumpulan` dan dapat difilter per kelas
dan mata pelajaran. Nama peserta yang mengisi papan skor terlihat oleh siapa pun
yang memegang tautan peserta; kontak pembuat (nama/email/telepon) hanya disimpan
untuk mengirimkan kembali tautannya dan tidak pernah ditampilkan di katalog.

## Pengiriman tautan lewat email

Di halaman Bagikan, pembuat soal bisa menitipkan alamatnya lewat "Kirimkan
tautannya ke saya"; kedua tautan lalu dikirim ke sana sebagai surel. Penyedianya
Resend, dipanggil lewat `fetch` tanpa dependensi tambahan:

| Variabel | Kegunaan |
|---|---|
| `RESEND_API_KEY` | kunci API Resend |
| `EMAIL_FROM` | alamat pengirim terverifikasi, mis. `SoalSnap <tautan@soalsnap.id>` |
| `APP_URL` | asal aplikasi untuk tautan absolut di surel |

Bila `RESEND_API_KEY` atau `EMAIL_FROM` kosong, aplikasi tetap berjalan: tautannya
dicatat ke log server dan halaman Bagikan mengatakan apa adanya bahwa pengiriman
belum aktif. Penyedia lain (SMTP) cukup memenuhi antarmuka `Pengirim` yang sama di
`src/lib/notify.ts`.

`APP_URL` sebaiknya diisi di produksi. Tanpa itu tautan disusun dari header `Host`
permintaan, yang bisa dipalsukan sehingga surel memuat tautan ke domain lain.

Tautan dikirim sekali per alamat — kolom `linkSentTo` menjadi penjaganya, jadi
menyimpan kontak berulang kali tidak memicu surel kedua, sementara memperbaiki
alamat yang salah ketik tetap memicu kiriman ke alamat baru. Pengiriman hanya
dicoba pada penyimpanan yang memang membawa email, dan kegagalannya tidak pernah
menggagalkan penyimpanan aktivitas.

## Delapan template, satu bank soal

Semua template membaca bank soal yang sama; `src/lib/derive.ts` yang menafsirkannya
berbeda-beda — pasangan untuk Menjodohkan, kartu untuk Flashcard, kata 4–10 huruf untuk
Susun Kata dan Cari Kata. Mengganti template tidak pernah mengubah soal.

Template yang syarat datanya tidak terpenuhi tampil nonaktif beserta alasannya, bukan
gagal senyap (FR-TP-6).

## Pemrosesan AI

Parsing dokumen **disimulasikan**: `src/lib/ai/mockParser.ts` memajukan progres
bertahap lalu mengembalikan bank soal contoh, lengkap dengan skor keyakinan dan tanda
"perlu diperiksa" untuk soal di bawah ambang 80 (FR-AI-5).

Kontraknya dipisah di `src/lib/ai/parser.ts` (`QuestionParser`, `validateQuestions`,
`STAGES`). Untuk memakai model vision sungguhan, tukar implementasi parser tersebut —
sisa aplikasi tidak perlu berubah. Tidak ada hasil AI yang bisa melewati layar Review
(FR-AI-8).

## Struktur

```
prisma/             skema, migrasi, dan data contoh
src/app/            rute (App Router) — satu berkas per halaman desain
src/app/api/        route handler: aktivitas, main, sesi peserta
src/components/     komponen bersama; components/play/ berisi 5 mode main
src/lib/            tipe, akses basis data, validasi, turunan bank soal, parser AI
src/lib/email/      penyusunan & pengiriman surel tautan
src/lib/__tests__/  tes logika permainan & validasi API
```

**Penyimpanan.** Aktivitas, soal, dan hasil peserta ada di basis data. Yang tersisa
di `localStorage` hanya draft yang belum disimpan dan daftar tautan sunting milik
peramban ini (`src/lib/store.ts`).

**Gaya.** Tailwind v4. Seluruh token warna, radius, bayangan, dan animasi di
`src/app/globals.css` disalin apa adanya dari `project/UIKit.md`.

## Yang belum ada

- **Unggahan berkas sungguhan.** Berkas dipilih dan divalidasi di klien, lalu
  parsing-nya disimulasikan; berkasnya sendiri tidak dikirim ke server.
- **Moderasi katalog.** Soal publik langsung tampil tanpa peninjauan.
- **Pembatasan laju.** Belum ada rate limit pada pembuatan aktivitas maupun
  penyimpanan hasil — perlu ditambahkan sebelum dibuka untuk umum.

Lihat `project/blueprint.md` §11 untuk rencana rilis.

## Asal desain

Repositori ini berawal dari paket handoff Claude Design. Berkas aslinya tetap ada:

- `project/` — prototipe `.dc.html` (9 halaman + prototipe interaktif `SoalSnap.dc.html`)
  dan dokumen produk: `blueprint.md`, `brd.md`, `prd.md`, `frd.md`, `design.md`, `UIKit.md`.
- `chats/` — transkrip percakapan desain.

Kode di `src/` mengikuti dokumen-dokumen itu; nomor persyaratan (`FR-…`) yang muncul di
komentar merujuk ke `project/frd.md`.
