# SoalSnap

**Foto soalnya, jadi latihannya.** Unggah foto, PDF, atau dokumen soal — AI memecahnya
menjadi latihan interaktif yang siap dimainkan siswa lewat satu tautan, tanpa login.

Implementasi dari paket desain Claude Design di `project/` (lihat [Asal desain](#asal-desain)).

## Menjalankan

```bash
npm install
cp .env.example .env      # DATABASE_URL, APP_URL, dan (opsional) kunci Mailgun
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
Dashboard — itu satu-satunya "kepemilikan" yang ada bagi tamu, jadi kalau tautannya
hilang dan penyimpanan peramban terhapus, aktivitas tidak bisa disunting lagi.
[Masuk lewat tautan email](#masuk-lewat-tautan-email-opsional) ada justru untuk
menutup celah itu, dan tetap opsional.

## Landing page

`/` adalah halaman pengenalan untuk pengunjung baru, ditranskripsi dari
`project/Page 10 Landing.dc.html`. Nilai px, warna, dan bayangannya disalin apa
adanya; warnanya kebetulan sudah menjadi token di `globals.css`, jadi yang dipakai
token. Dashboard pindah ke `/dashboard`.

Dua hal berbeda dari artboard-nya, keduanya disengaja:

- **Tujuan tombol.** Di artboard semua tombol menunjuk jangkar `#cta` karena memang
  tidak bisa menuju ke mana pun. Di aplikasi diarahkan ke `/buat` dan `/masuk`.
- **Warna teks pertanyaan pada kartu "Sisi siswa".** Di artboard teks itu mewarisi
  `color:#FFFFFF` dari panel gelap di belakangnya, sehingga menjadi putih di atas
  kartu putih dan tidak terbaca. Di sini warnanya dikembalikan ke warna teks biasa.

Selain itu tata letaknya dibuat responsif — artboard hanya menggambarkan lebar
desktop, sedangkan grid template dan langkah ikut menyusut di layar sempit.

## Layar kecil

Seluruh halaman diperiksa pada 320, 375, 414, dan 768px: tidak ada satu pun yang
menggeser mendatar. Aturan yang dipakai — nilai dasar untuk ponsel, nilai desain
dipulihkan di breakpoint — sehingga tampilan desktop tidak ikut berubah sedikit pun.

Tiga keputusan yang perlu diketahui:

- **Header aplikasi** menyembunyikan tautan "Kumpulan soal" di bawah 640px supaya
  tombol utama tetap muat. Katalog tetap terjangkau dari hero Dashboard dan footer
  landing.
- **Header admin** membungkus ke baris kedua di layar sempit, karena memaksakan satu
  baris mendorong tombol keluar ke luar layar.
- **Tabel admin dan Soal Saya** menggeser mendatar di dalam wadahnya sendiri, bukan
  ikut melebarkan halaman. Kolomnya memang banyak dan menyusutkannya membuat isinya
  tak terbaca.

`min-width` dari berkas desain hanya berlaku sejak 640px ke atas; di bawah itu ia
justru memaksa halaman melebar melebihi layar.

## Masuk lewat tautan email (opsional)

Akun bersifat **tambahan**, bukan syarat: membuat, membagikan, dan menyunting soal
tetap bisa dilakukan tanpa masuk, dan tautan sunting tetap menjadi kunci menyunting
satu aktivitas. Yang ditambahkan akun hanya satu hal — mengumpulkan soal supaya
bertahan lintas perangkat dan tidak ikut hilang saat penyimpanan peramban dibersihkan.

Tidak ada kata sandi. Alamat surel ditukar dengan tautan masuk sekali pakai:

1. `POST /api/auth/minta` — membuat akun bila belum ada, lalu mengirim tautan.
   Token 32 byte acak; yang disimpan di basis data hanya **hash SHA-256**-nya,
   sehingga basis data yang bocor tidak berubah menjadi izin masuk. Tautan lama yang
   belum terpakai langsung dilumpuhkan — hanya satu tautan boleh hidup per akun.
2. `/masuk/[token]` — halaman konfirmasi dengan tombol, lalu
   `POST /api/auth/verifikasi` menukarnya dengan cookie sesi `httpOnly` (30 hari).

**Kenapa ada tombol, bukan langsung masuk saat tautannya dibuka?** Pemindai tautan
pada surel korporat kerap memuat tautan lebih dulu untuk diperiksa. Kalau verifikasi
terjadi pada GET, pemindai itulah yang memakai habis token sekali-pakai, dan
pemiliknya menerima tautan yang sudah mati.

Tautan berlaku **15 menit**, sekali pakai, dan permintaannya dibatasi dua arah:
5 kali per alamat dan 10 kali per pemanggil tiap jam — per alamat supaya satu orang
tidak dibanjiri surel, per pemanggil supaya fiturnya tidak dipakai membanjiri banyak
alamat sekaligus.

**Mengumpulkan soal lama.** Saat masuk, dua hal ikut terkumpul ke akun:

- aktivitas yang dulu dibuat dengan alamat surel yang sama (`creatorEmail`);
- aktivitas yang tautan suntingnya masih tersimpan di peramban yang dipakai masuk
  (`POST /api/auth/klaim`).

Keduanya hanya mengambil aktivitas yang **belum bertuan**. Memegang tautan sunting
memang sudah berarti boleh menyunting dan menghapus, jadi mengaitkannya ke akun
tidak menambah wewenang — tetapi aktivitas yang sudah punya pemilik tidak ikut
berpindah, supaya tautan yang terlanjur dibagikan tidak bisa dipakai mengambil alih.

`AUTH_SECRET` adalah kunci tanda tangan sesinya. Selama kosong, fitur masuk tertutup
dan aplikasi tetap berjalan penuh tanpa akun. Menggantinya membatalkan semua sesi
yang sedang berjalan.

## Halaman

| Rute | Halaman desain |
|---|---|
| `/` | 10 Landing — halaman pengenalan untuk pengunjung baru |
| `/dashboard` | 01 Dashboard — aktivitas peramban ini + soal publik terbaru |
| `/buat` | 02 Unggah |
| `/buat/proses` | 03 Proses AI |
| `/buat/review` | 04 Review Draft |
| `/buat/template` | 05 Pilih Template — memilih template sekaligus menyimpan ke server |
| `/buat/bagikan` | 06 Bagikan — dua tautan, privat/publik, kategori, kontak pembuat |
| `/main/[playSlug]` | 07 Main Kuis · 08 Mode main lainnya · 09 Hasil |
| `/edit/[editSlug]` | halaman pemilik: sunting soal, rekap peserta, hapus |
| `/kumpulan` | katalog soal publik, difilter per kelas & mata pelajaran |
| `/masuk` · `/masuk/[token]` | minta tautan masuk, lalu konfirmasi dari surel |
| `/soal-saya` | kumpulan soal milik akun, lintas perangkat |
| `/admin` · `/admin/aktivitas` · `/admin/laporan` | audit & moderasi, di balik sandi |

Peserta membuka `/main/[playSlug]`, mengisi nama (boleh dikosongkan), mengerjakan,
lalu melihat skornya sendiri beserta papan skor. Tambahkan `?pratinjau=1` untuk
mencoba tanpa hasilnya ikut tercatat.

## Basis data

SQLite lewat Prisma 7 (`prisma/schema.prisma`): tiga tabel sesuai `frd.md` §8 —
`Activity`, `Question`, `PlaySession` — ditambah `Report` untuk antrean laporan
konten, `ParseJob`/`Upload` untuk antrean pemrosesan dokumen, serta `User`/`LoginToken`
untuk akun opsional dan tautan masuknya. Pindah ke Postgres cukup mengganti `provider` beserta adapter-nya — skema
dan kueri tidak berubah.

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
**Mailgun**, dipanggil lewat `fetch` tanpa dependensi tambahan:

| Variabel | Kegunaan |
|---|---|
| `MAILGUN_API_KEY` | kunci API Mailgun (dipakai sebagai Basic auth `api:<kunci>`) |
| `MAILGUN_DOMAIN` | domain pengirim terverifikasi, mis. `mail.soalsnap.web.id` |
| `EMAIL_FROM` | alamat From lengkap, mis. `SoalSnap <tautan@mail.soalsnap.web.id>` |
| `EMAIL_REPLY_TO` | opsional; dikirim sebagai header `Reply-To`, mis. `noreply@soalsnap.web.id` |
| `MAILGUN_BASE_URL` | opsional; isi `https://api.eu.mailgun.net` untuk akun region Eropa |
| `APP_URL` | asal aplikasi untuk tautan absolut di surel |

Bila `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, atau `EMAIL_FROM` kosong, aplikasi tetap
berjalan: tautannya dicatat ke log server dan halaman Bagikan mengatakan apa
adanya bahwa pengiriman belum aktif. Penyedia lain cukup memenuhi antarmuka
`Pengirim` di `src/lib/email/pesan.ts`; pemilihannya ada di `src/lib/notify.ts`.

Kunci API tidak pernah dibaca di `src/lib/email/mailgun.ts` — konfigurasinya masuk
sebagai parameter, sehingga modul penyedia bebas rahasia dan penyusunan
permintaannya bisa diuji tanpa jaringan.

`APP_URL` sebaiknya diisi di produksi. Tanpa itu tautan disusun dari header `Host`
permintaan, yang bisa dipalsukan sehingga surel memuat tautan ke domain lain.

Tautan dikirim sekali per alamat — kolom `linkSentTo` menjadi penjaganya, jadi
menyimpan kontak berulang kali tidak memicu surel kedua, sementara memperbaiki
alamat yang salah ketik tetap memicu kiriman ke alamat baru. Pengiriman hanya
dicoba pada penyimpanan yang memang membawa email, dan kegagalannya tidak pernah
menggagalkan penyimpanan aktivitas.

## Admin: audit soal & moderasi

`/admin` adalah halaman peninjauan untuk pemilik layanan — bukan untuk guru. Di
sana seluruh aktivitas terlihat, **termasuk yang privat**, lengkap dengan isi
soal dan kunci jawabannya; itu memang tujuannya, supaya penyalahgunaan bisa
diperiksa. Yang bisa dilakukan:

- menelusuri semua aktivitas, dicari per judul dan disaring per status atau
  "hanya yang dilaporkan";
- membaca seluruh soal beserta **gambarnya**, kunci, catatan keyakinan AI, kontak
  pembuat, dan rekap peserta satu aktivitas;
- **menurunkan** aktivitas dari katalog (jadi privat, dengan alasan tercatat),
  **memulihkannya**, atau **menghapusnya** beserta soal dan rekapnya;
- menutup laporan yang masuk sebagai "ditangani" atau "diabaikan".

Tautan sunting pemilik sengaja tidak ditampilkan di halaman admin: untuk audit,
membaca sudah cukup, dan menampilkannya berarti menyebarkan rahasia pemilik soal.

**Masuk.** Tidak ada tabel pengguna. Sandinya satu, dari `ADMIN_PASSWORD`, ditukar
dengan cookie `httpOnly` bertanda tangan HMAC yang berlaku 8 jam. Selama variabel
itu kosong, `/admin` tertutup dan tidak ada sandi bawaan. `ADMIN_SECRET` boleh
diisi sebagai kunci tanda tangan terpisah; bila dikosongkan, sandinya sendiri yang
menjadi kunci, sehingga mengganti sandi langsung membatalkan sesi yang berjalan.
Percobaan masuk dibatasi 8 kali per 10 menit per pemanggil, dan sandinya
dibandingkan dengan cara waktu-tetap. Setiap halaman `/admin` memeriksa sesinya
sendiri, tidak menitipkannya ke layout.

## Laporan konten

Di halaman soal ada tombol **Laporkan** yang bisa dipakai siapa saja yang
memegang tautannya — siswa maupun guru lain — tanpa akun. Laporan masuk ke
antrean `/admin/laporan` beserta alasan baku (`src/lib/laporan.ts`) dan catatan
bebas.

Pelapor dikenali lewat hash satu arah dari alamat dan peramban (`src/lib/sidik.ts`)
semata-mata untuk dua hal: laporan berulang atas aktivitas yang sama tidak
menumpuk di antrean, dan pengiriman dibatasi 5 laporan per jam per pemanggil.
Nilainya tidak bisa dikembalikan menjadi alamat IP dan tidak ditampilkan di
halaman admin.

## Soal bergambar

Satu soal boleh membawa satu gambar — misalnya diagram yang pertanyaannya merujuk
ke situ. Gambar disimpan di R2 pada ruang nama tersendiri (`soal/…`), terpisah dari
dokumen unggahan (`unggahan/…`), dan `Question.gambar` menyimpan kuncinya.

Pemisahan ruang nama itu bukan kerapian belaka: rute penyaji hanya melayani prefiks
`soal/`, sehingga kunci karangan tidak bisa dipakai membaca dokumen sumber milik
orang lain. Kunci juga ditentukan server, bukan klien, supaya gambar milik soal lain
tidak bisa ditimpa — dan validasi `soalSchema` menolak kunci di luar ruang nama itu.

**Disajikan lewat proxy, bukan bucket publik.** `GET /api/gambar/[…kunci]`
menyalurkan gambar dari R2, dan itu keputusan yang disengaja: dengan URL bucket
publik, menurunkan aktivitas dari katalog tidak akan menghentikan gambarnya
tersaji. Lewat proxy, gambar berhenti dilayani begitu **seluruh** soal yang
memakainya berada di aktivitas yang diturunkan admin.

Dua perilaku yang menyertainya:

- **Admin tetap dilayani.** Kalau gambar konten yang diturunkan ikut hilang dari
  halaman audit, moderasinya jadi buta persis pada konten yang paling perlu
  diperiksa. Sesi admin karenanya menembus penjaga itu, dengan `Cache-Control:
  no-store` supaya tidak mengendap di cache bersama.
- **Cache pendek** (60 detik) untuk gambar yang masih tayang. Itulah jeda maksimum
  antara admin menurunkan konten dan gambarnya berhenti tampil di peramban yang
  sudah memuatnya.

Gambar yang belum dipakai soal mana pun tetap dilayani — itu draft yang sedang
disusun guru di layar Review. Saat aktivitas dihapus (oleh pemiliknya maupun admin),
gambarnya ikut disapu dari R2, tetapi hanya yang benar-benar tidak dipakai soal lain.

Teks alternatif (`gambarAlt`) bisa diisi guru di layar Review; tanpa itu pembaca
layar tetap diberi tahu bahwa ada gambar, karena soal bergambar sering tidak bisa
dijawab tanpa melihatnya.

## Delapan template, satu bank soal

Semua template membaca bank soal yang sama; `src/lib/derive.ts` yang menafsirkannya
berbeda-beda — pasangan untuk Menjodohkan, kartu untuk Flashcard, kata 4–10 huruf untuk
Susun Kata dan Cari Kata. Mengganti template tidak pernah mengubah soal.

Template yang syarat datanya tidak terpenuhi tampil nonaktif beserta alasannya, bukan
gagal senyap (FR-TP-6).

## Unggahan berkas & antrean pemrosesan

Berkas diunggah **peramban langsung ke Cloudflare R2**, tidak melewati server
aplikasi. Server hanya menandatangani izin unggah lalu memeriksa hasilnya:

1. `POST /api/unggah` — memvalidasi metadata (jenis, ukuran, jumlah), membuka
   satu `ParseJob`, dan mengembalikan URL `PUT` bertanda tangan per berkas.
2. Peramban mengunggah tiap berkas ke R2 (`src/lib/unggah/klien.ts`, memakai XHR
   agar kemajuannya terlihat).
3. `POST /api/unggah/[token]/mulai` — server memastikan objeknya benar ada di R2,
   membaca **ukuran sebenarnya**, menghitung **jumlah halaman PDF sungguhan**
   dengan `pdf-lib`, menegakkan batas 20 halaman, lalu memasukkan job ke antrean.
4. `GET /api/unggah/[token]` — status untuk layar Proses AI.

Laporan klien tidak dipercaya di langkah 3: yang dipegangnya hanya izin unggah,
bukan wewenang menyatakan isi. Job yang ditolak menghapus kembali berkasnya dari
R2 supaya tidak ada objek menganggur.

| Variabel | Kegunaan |
|---|---|
| `R2_ACCOUNT_ID` | akun Cloudflare; membentuk endpoint `<akun>.r2.cloudflarestorage.com` |
| `R2_BUCKET` | nama bucket |
| `R2_ACCESS_KEY_ID` · `R2_SECRET_ACCESS_KEY` | token API R2 |
| `R2_ENDPOINT` | opsional; menimpa endpoint untuk jurisdiksi khusus atau server tiruan saat uji |

Bucket-nya perlu **CORS** yang mengizinkan `PUT` dari asal aplikasi, karena
peramban mengunggah langsung ke sana.

**Antrean.** `ParseJob` adalah antrean di basis data: job masuk berstatus `antre`,
dan kolom `workerId`/`klaimAt` disediakan supaya worker bisa mengklaim satu job
secara atomik — beberapa worker boleh berjalan paralel tanpa mengerjakan job yang
sama. Di Postgres nanti pakai `FOR UPDATE SKIP LOCKED`; di SQLite satu `UPDATE …
RETURNING` sudah atomik di bawah kunci tulisnya.

## Pembacaan dokumen oleh worker

Dokumen yang diunggah masuk antrean `ParseJob`, lalu diambil worker terpisah di
`worker/` yang menjalankan PaddleOCR. Hasilnya disimpan **apa adanya** ke
`OcrHalaman` — satu baris per halaman, berisi teks urut baca beserta konfidensi
dan kotak tiap barisnya.

Menyimpan yang mentah lebih dulu itu disengaja: kalau penyusunan soalnya nanti
salah, bahan aslinya masih ada untuk diperiksa tanpa perlu mengulang OCR.

Worker berbicara lewat tiga endpoint bersandi `WORKER_TOKEN`:

| Endpoint | Kegunaan |
|---|---|
| `POST /api/worker/klaim` | Mengambil satu job; balasannya memuat URL unduh bertanda tangan |
| `POST /api/worker/[id]/progres` | Kabar kemajuan, sekaligus memperbarui klaim |
| `POST /api/worker/[id]/hasil` | Menyimpan hasil OCR mentah, atau menutup job sebagai gagal |

Worker **tidak diberi kredensial basis data maupun kunci R2**. Kalau mesin
worker jebol, yang bocor hanya token worker. Ini juga yang membuat worker bisa
berjalan di mesin lain sementara basis datanya masih SQLite — berkas SQLite
tidak bisa dibuka lewat jaringan.

**Klaim job atomik.** Kolom `workerId`/`klaimAt` diisi lewat pembaruan
bersyarat, sehingga dari enam worker yang meminta bersamaan hanya satu yang
berhasil menandai job. Job yang klaimnya basi lebih dari sepuluh menit kembali
ke antrean dengan `percobaan` bertambah, dan berhenti dicoba setelah tiga kali.

Statusnya berhenti di **`terbaca`**, bukan `selesai`: dokumennya sudah dibaca,
tetapi belum disusun menjadi soal.

Hasilnya bisa diperiksa di `/admin/unggahan` — teks per halaman, konfidensi tiap
baris, dan posisi kotaknya. Isinya juga bisa diambil utuh lewat
`GET /api/admin/unggahan/[id]/mentah` (`?format=teks` untuk teks polos), berguna
saat menyiapkan langkah penyusunan soal. Halaman yang konfidensi terendahnya di bawah ambang
80 ditandai, sama seperti penandaan soal di layar Review.

## Pemrosesan AI

Dokumennya kini sungguhan dibaca worker sampai menjadi teks (lihat bagian di
atas), **tetapi teks itu belum disusun menjadi soal**: layar Proses AI masih
memakai simulasi `src/lib/ai/mockParser.ts` — progres bertahap lalu bank soal
contoh, lengkap dengan skor keyakinan dan tanda "perlu diperiksa" di bawah ambang 80
(FR-AI-5).

Kontraknya dipisah di `src/lib/ai/parser.ts` (`QuestionParser`, `validateQuestions`,
`STAGES`). Worker sungguhan tinggal membaca berkas job dari R2, menjalankan OCR dan
perapian teks, lalu menulis hasilnya ke `ParseJob.hasil`. Tidak ada hasil AI yang
bisa melewati layar Review (FR-AI-8).

## Struktur

```
prisma/             skema, migrasi, dan data contoh
src/app/            rute (App Router) — satu berkas per halaman desain
src/app/api/        route handler: aktivitas, main, sesi peserta
src/components/     komponen bersama; components/play/ berisi 5 mode main
src/lib/            tipe, akses basis data, validasi, turunan bank soal, parser AI
src/lib/email/      penyusunan & pengiriman surel tautan
src/lib/unggah/     aturan berkas, hitung halaman, dan alur unggah di peramban
worker/             worker Python pembaca dokumen (PaddleOCR)
src/lib/auth/       sesi pengguna dan token tautan masuk
src/lib/admin/      sesi admin, pembatas laju, kueri audit
src/lib/__tests__/  tes logika permainan & validasi API
```

**Penyimpanan.** Aktivitas, soal, dan hasil peserta ada di basis data. Yang tersisa
di `localStorage` hanya draft yang belum disimpan dan daftar tautan sunting milik
peramban ini (`src/lib/store.ts`).

**Gaya.** Tailwind v4. Seluruh token warna, radius, bayangan, dan animasi di
`src/app/globals.css` disalin apa adanya dari `project/UIKit.md`.

## Yang belum ada

- **Penyusunan soal dari teks OCR.** Dokumen sudah dibaca menjadi teks mentah dan
  bisa diperiksa di `/admin/unggahan`, tetapi mengubahnya menjadi soal terstruktur
  belum ada; soal yang muncul di layar Review masih dari simulasi.
- **Berkas `.docx`.** Worker menandai job yang memuatnya sebagai gagal.
- **Pemotongan gambar otomatis.** Guru menambahkan gambar soal sendiri di layar
  Review; memotong gambar dari halaman dokumen sumber dan menentukan gambar itu
  milik soal nomor berapa adalah pekerjaan worker, dan belum ada.
- **Peninjauan sebelum tayang.** Soal publik langsung tampil di katalog; moderasi
  berjalan setelahnya, lewat laporan dan halaman admin.
- **Pembatasan laju yang menyeluruh.** Masuk admin dan pengiriman laporan sudah
  dibatasi, tetapi pembuatan aktivitas dan penyimpanan hasil peserta belum.
  Hitungannya juga disimpan di memori proses (`src/lib/admin/laju.ts`), jadi kalau
  aplikasi berjalan di banyak instans, batasnya terpisah per instans — untuk itu
  perlu penyimpanan bersama.

Lihat `project/blueprint.md` §11 untuk rencana rilis.

## Asal desain

Repositori ini berawal dari paket handoff Claude Design. Berkas aslinya tetap ada:

- `project/` — prototipe `.dc.html` (9 halaman aplikasi + landing page + prototipe
  interaktif `SoalSnap.dc.html`) dan dokumen produk: `blueprint.md`, `brd.md`, `prd.md`,
  `frd.md`, `design.md`, `UIKit.md`.
- `chats/` — transkrip percakapan desain.

Kode di `src/` mengikuti dokumen-dokumen itu; nomor persyaratan (`FR-…`) yang muncul di
komentar merujuk ke `project/frd.md`.
