# SoalSnap

**Foto soalnya, jadi latihannya.** Unggah foto, PDF, atau dokumen soal — AI memecahnya
menjadi latihan interaktif yang siap dimainkan siswa lewat satu tautan, tanpa login.

Implementasi dari paket desain Claude Design di `project/` (lihat [Asal desain](#asal-desain)).

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
```

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | server pengembangan |
| `npm run build` / `npm start` | build & jalankan versi produksi |
| `npm test` | tes logika permainan (Vitest) |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |

## Halaman

| Rute | Halaman desain |
|---|---|
| `/` | 01 Dashboard |
| `/buat` | 02 Unggah |
| `/buat/proses` | 03 Proses AI |
| `/buat/review` | 04 Review Draft |
| `/buat/template` | 05 Pilih Template |
| `/buat/bagikan` | 06 Bagikan |
| `/main/[slug]` | 07 Main Kuis · 08 Mode main lainnya · 09 Hasil |

`/main/[slug]` adalah halaman siswa: tautan publik, tanpa autentikasi (FR-SH-6).
Tambahkan `?pratinjau=1` agar tombol Keluar kembali ke layar Bagikan.

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
src/app/            rute (App Router) — satu berkas per halaman desain
src/components/     komponen bersama; components/play/ berisi 5 mode main
src/lib/            tipe, store, turunan bank soal, kisi cari kata, parser AI
src/lib/__tests__/  tes logika permainan
```

**Penyimpanan.** Aktivitas dan draft disimpan di `localStorage` lewat Zustand
(`src/lib/store.ts`); delapan aktivitas contoh disemai saat pertama dibuka. Belum ada
backend, database, atau unggahan berkas ke server.

**Gaya.** Tailwind v4. Seluruh token warna, radius, bayangan, dan animasi di
`src/app/globals.css` disalin apa adanya dari `project/UIKit.md`.

## Yang belum ada

Backend & database · unggahan berkas sungguhan (file dipilih dan divalidasi di klien,
tetapi tidak dikirim ke mana pun) · akun pengguna · laporan nilai & leaderboard.
Lihat `project/blueprint.md` §11 untuk rencana rilis.

## Asal desain

Repositori ini berawal dari paket handoff Claude Design. Berkas aslinya tetap ada:

- `project/` — prototipe `.dc.html` (9 halaman + prototipe interaktif `SoalSnap.dc.html`)
  dan dokumen produk: `blueprint.md`, `brd.md`, `prd.md`, `frd.md`, `design.md`, `UIKit.md`.
- `chats/` — transkrip percakapan desain.

Kode di `src/` mengikuti dokumen-dokumen itu; nomor persyaratan (`FR-…`) yang muncul di
komentar merujuk ke `project/frd.md`.
