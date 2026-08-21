import type { ReactNode } from "react";
import Link from "next/link";
import { KameraIcon } from "@/components/Icons";
import { MyActivities } from "@/components/MyActivities";

export const metadata = {
  title: "SoalSnap — Foto soalnya, jadi latihannya",
  description:
    "Unggah foto buku, lembar kerja, atau PDF soal. AI memecahnya menjadi latihan interaktif yang siap dimainkan siswa lewat satu tautan.",
};

/**
 * Landing page — transkripsi dari berkas desain `SoalSnap_Landing_Page`.
 *
 * Seluruh nilai px, warna, dan bayangan disalin apa adanya dari berkas itu.
 * Warnanya kebetulan sudah menjadi token di `globals.css`, jadi yang dipakai
 * token; yang tidak punya token ditulis sebagai nilai literal.
 *
 * Satu penyimpangan yang disengaja: pada artboard semua tombol menunjuk ke
 * jangkar `#cta` karena memang tidak bisa menuju ke mana-mana. Di aplikasi
 * tujuannya diarahkan ke halaman yang sesungguhnya.
 */
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-[60] border-b border-line bg-app/[.88] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[70px] w-full max-w-[1160px] items-center gap-2 px-3 md:gap-7 md:px-6">
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="grid h-[34px] w-[34px] place-items-center rounded-[11px] bg-teal text-surface">
              <KameraIcon size={18} />
            </span>
            <span className="font-display text-[21px] font-extrabold">
              Soal<span className="text-teal">Snap</span>
            </span>
          </div>

          {/* Nav disembunyikan di layar sempit — seluruh butirnya masih ada di
              footer, dan ruang header lebih dibutuhkan tombol utama. */}
          <nav className="hidden flex-1 items-center gap-6 md:flex">
            <TautanNav href="#cara">Cara kerja</TautanNav>
            <TautanNav href="#template">Template</TautanNav>
            <TautanNav href="#harga">Harga</TautanNav>
            <TautanNav href="/kumpulan">Kumpulan soal</TautanNav>
          </nav>

          <span className="flex-1 md:hidden" />
          <Link
            href="/masuk"
            className="shrink-0 text-[14.5px] font-semibold text-ink-2 no-underline hover:text-ink-2 hover:no-underline"
          >
            Masuk
          </Link>
          <Link
            href="/buat"
            className="shrink-0 whitespace-nowrap rounded-full bg-teal px-3.5 py-[11px] font-display text-[15px] font-bold text-surface no-underline transition-colors hover:bg-teal-dark hover:text-surface hover:no-underline md:px-[22px]"
          >
            Coba Gratis
          </Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto flex w-full max-w-[1160px] flex-wrap items-center gap-8 px-6 pb-10 pt-10 sm:gap-12 sm:pt-16">
        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-5">
          <div className="flex items-center gap-2 self-start rounded-full bg-ai-light px-4 py-[7px] text-[13px] font-bold text-ai-dark">
            <IkonKilau />
            Soal dipecah otomatis oleh AI
          </div>

          <h1 className="m-0 font-display text-[34px] font-extrabold leading-[1.05] tracking-[-.02em] text-pretty sm:text-[44px] md:text-[56px]">
            Foto soalnya,
            <br />
            jadi latihannya.
          </h1>

          <p className="m-0 max-w-[480px] text-[16px] leading-[1.6] text-ink-2 text-pretty sm:text-[18px]">
            Unggah foto buku, lembar kerja, atau PDF soal. AI memecahnya menjadi latihan
            interaktif yang siap dimainkan siswa lewat satu tautan — tanpa mengetik ulang satu
            nomor pun.
          </p>

          <div className="mt-1 flex flex-wrap gap-3">
            <Link
              href="/buat"
              className="flex items-center gap-2.5 rounded-full bg-teal px-[30px] py-4 font-display text-[17px] font-bold text-surface no-underline transition-all hover:-translate-y-0.5 hover:bg-teal-dark hover:text-surface hover:no-underline"
            >
              <KameraIcon size={18} />
              Unggah Soal Pertama
            </Link>
            <a
              href="#template"
              className="rounded-full border-[1.5px] border-fill-4 px-[26px] py-4 text-[16px] font-semibold text-ink-2 no-underline transition-colors hover:border-teal hover:text-teal hover:no-underline"
            >
              Lihat 8 template
            </a>
          </div>

          <div className="mt-2 flex flex-wrap gap-[22px]">
            <Janji>Gratis tanpa syarat</Janji>
            <Janji>Siswa main tanpa login</Janji>
            <Janji>Bahasa Indonesia</Janji>
          </div>
        </div>

        <div className="relative flex min-w-0 flex-[1_1_420px] items-center justify-center gap-0 pb-14 pt-6 lg:justify-end">
          {/* Lembar soal yang sedang dipindai. */}
          <div
            className="relative flex h-[284px] w-[38%] max-w-[212px] shrink-0 flex-col gap-[11px] overflow-hidden rounded-2xl border border-paper-edge bg-paper p-[22px]"
            style={{ transform: "rotate(-6deg)", boxShadow: "0 22px 50px rgba(24,36,32,.16)" }}
            aria-hidden="true"
          >
            <div className="h-[10px] w-[62%] shrink-0 rounded-[5px] bg-paper-head" />
            <BarisKertas lebar="95%" />
            <BarisKertas lebar="88%" />
            <BarisKertas lebar="92%" sorot />
            <BarisKertas lebar="56%" />
            <BarisKertas lebar="90%" />
            <BarisKertas lebar="78%" sorot />
            <BarisKertas lebar="85%" />
            <BarisKertas lebar="70%" sorot />
            <BarisKertas lebar="92%" />
            <div
              className="absolute left-[10px] right-[10px] h-[3px] animate-scanline-lp rounded-[2px] bg-teal"
              style={{ boxShadow: "0 0 16px rgba(14,138,123,.85)" }}
            />
          </div>

          <div
            className="z-[3] mx-[-13px] grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ai text-surface"
            style={{ boxShadow: "0 10px 24px rgba(109,90,230,.5)" }}
            aria-hidden="true"
          >
            <IkonPanah />
          </div>

          {/* Hasilnya: satu soal siap dimainkan. */}
          <div
            className="relative w-[56%] max-w-[290px] shrink-0 animate-floaty-lp flex-col gap-3.5 rounded-[20px] bg-surface p-[22px] [display:flex]"
            style={{ transform: "rotate(3deg)", boxShadow: "0 22px 50px rgba(24,36,32,.18)" }}
            aria-hidden="true"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-ai-light px-3 py-1 text-[11px] font-bold text-ai">
                SOAL 1/8
              </span>
              <span className="text-[11px] font-bold text-dim">SKOR 0</span>
            </div>
            <div className="h-[6px] rounded-full bg-fill-3">
              <div className="h-full w-[14%] rounded-full bg-mint" />
            </div>
            <div className="font-display text-[17px] font-bold leading-[1.35] text-pretty">
              Proses fotosintesis pada tumbuhan terutama berlangsung di bagian …
            </div>
            <div className="grid gap-2">
              <OpsiHero>A. Akar</OpsiHero>
              <OpsiHero kunci>B. Daun</OpsiHero>
              <OpsiHero>C. Batang</OpsiHero>
              <OpsiHero>D. Bunga</OpsiHero>
            </div>
          </div>

          <div
            className="absolute bottom-0 right-4 z-[4] flex items-center gap-3 rounded-2xl bg-forest px-[18px] py-3.5 text-surface"
            style={{ boxShadow: "0 16px 36px rgba(0,0,0,.24)" }}
            aria-hidden="true"
          >
            <span className="font-display text-[26px] font-extrabold text-mint">1:48</span>
            <span className="max-w-[120px] text-[12.5px] font-semibold leading-[1.35] text-mint-soft">
              dari foto sampai siap dibagikan
            </span>
          </div>
        </div>
      </section>

      {/* ── Aktivitas dari peramban ini ──────────────────────────────────── */}
      {/* Jalan pulang bagi yang membuat soal tanpa akun: tanpa bagian ini,
          satu-satunya jejak ke soal mereka adalah tautan sunting di email.
          Tidak tampil sama sekali bagi pengunjung baru, jadi halaman depan
          tetap seperti artboard-nya. */}
      <div className="mx-auto w-full max-w-[1160px] px-6 py-4 empty:hidden">
        <MyActivities />
      </div>

      {/* ── Cara kerja ───────────────────────────────────────────────────── */}
      <section
        id="cara"
        className="mx-auto flex w-full max-w-[1160px] flex-col gap-7 px-6 py-10 sm:py-14"
      >
        <div className="flex max-w-[600px] flex-col gap-2">
          <Kapital>CARA KERJA</Kapital>
          <JudulBagian>Tiga langkah, tanpa mengetik ulang</JudulBagian>
        </div>

        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
          <KartuLangkah nomor="1" judul="Unggah" warna="bg-teal-light text-teal-dark">
            <p className="m-0 text-[14.5px] leading-[1.6] text-ink-3">
              Foto halaman soal dari kamera, atau pilih JPG, PNG, PDF, dan DOCX. Beberapa
              halaman sekaligus juga bisa.
            </p>
            <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
              {["JPG", "PNG", "PDF", "DOCX"].map((f) => (
                <span
                  key={f}
                  className="rounded-md bg-fill px-2.5 py-1 text-[11px] font-bold text-ink-3"
                >
                  {f}
                </span>
              ))}
            </div>
          </KartuLangkah>

          <KartuLangkah nomor="2" judul="Periksa draft" warna="bg-ai-light text-ai-dark">
            <p className="m-0 text-[14.5px] leading-[1.6] text-ink-3">
              AI memecah per nomor, menebak tipe soal, dan mencocokkan kunci jawaban. Yang
              meragukan ditandai supaya Anda tahu mana yang perlu dilihat.
            </p>
            <div className="mt-auto flex flex-wrap gap-2 pt-2">
              <span className="rounded-full bg-teal-light px-3 py-1 text-[12px] font-bold text-teal-dark">
                98% yakin
              </span>
              <span className="rounded-full bg-warn-bg px-3 py-1 text-[12px] font-bold text-warn-fg">
                Periksa · 74%
              </span>
            </div>
          </KartuLangkah>

          <KartuLangkah nomor="3" judul="Bagikan" warna="bg-teal-light text-teal-dark">
            <p className="m-0 text-[14.5px] leading-[1.6] text-ink-3">
              Pilih template, salin tautan atau tampilkan QR di proyektor. Siswa langsung main
              tanpa membuat akun.
            </p>
            <div className="mt-auto rounded-[10px] bg-app px-3.5 py-2.5 text-[13.5px] font-semibold text-teal-dark">
              soalsnap.id/m/X7K2E9
            </div>
          </KartuLangkah>
        </div>
      </section>

      {/* ── Delapan template ─────────────────────────────────────────────── */}
      <section
        id="template"
        className="border-y border-line bg-surface py-10 sm:py-16"
      >
        <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-7 px-6">
          <div className="flex flex-wrap items-end gap-6">
            <div className="flex min-w-0 sm:min-w-[300px] flex-1 flex-col gap-2">
              <Kapital>TEMPLATE</Kapital>
              <JudulBagian>Satu bank soal, delapan cara bermain</JudulBagian>
              <p className="m-0 max-w-[520px] text-[16px] leading-[1.6] text-ink-3 text-pretty">
                Ganti template kapan saja. Soal yang sudah diperiksa tetap sama — hanya cara
                mainnya yang berubah.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KartuTemplate judul="Kuis" isi="Pilihan ganda klasik" latar="bg-teal-light">
              <div
                className="flex w-[104px] flex-col gap-[5px] rounded-[9px] bg-surface p-2"
                style={{ boxShadow: "0 4px 12px rgba(24,36,32,.08)" }}
              >
                <div className="h-[6px] w-[75%] rounded-[3px] bg-ink opacity-80" />
                <div className="grid grid-cols-2 gap-1">
                  <div className="h-[13px] rounded-[4px] border-[1.5px] border-line" />
                  <div className="h-[13px] rounded-[4px] bg-teal" />
                  <div className="h-[13px] rounded-[4px] border-[1.5px] border-line" />
                  <div className="h-[13px] rounded-[4px] border-[1.5px] border-line" />
                </div>
              </div>
            </KartuTemplate>

            <KartuTemplate
              judul="Benar / Salah"
              isi="Tebak cepat dua pilihan"
              latar="bg-ai-light flex items-center justify-center gap-2.5"
            >
              <div
                className="grid h-10 w-[42px] place-items-center rounded-[11px] bg-teal font-display text-[18px] font-extrabold text-surface"
                style={{ transform: "rotate(-4deg)", boxShadow: "0 6px 14px rgba(14,138,123,.35)" }}
              >
                B
              </div>
              <div
                className="grid h-10 w-[42px] place-items-center rounded-[11px] bg-wrong font-display text-[18px] font-extrabold text-surface"
                style={{ transform: "rotate(4deg)", boxShadow: "0 6px 14px rgba(214,69,69,.35)" }}
              >
                S
              </div>
            </KartuTemplate>

            <KartuTemplate judul="Isian" isi="Lengkapi dengan mengetik" latar="bg-sand">
              <div
                className="flex w-[118px] items-center gap-[5px] rounded-[9px] bg-surface px-[9px] py-[11px]"
                style={{ boxShadow: "0 4px 12px rgba(24,36,32,.08)" }}
              >
                <div className="h-[6px] w-[30px] rounded-[3px] bg-dim" />
                <div className="h-[18px] w-10 rounded-md border-[1.5px] border-dashed border-teal bg-tint-2" />
                <div className="h-[6px] w-[22px] rounded-[3px] bg-dim" />
              </div>
            </KartuTemplate>

            <KartuTemplate
              judul="Menjodohkan"
              isi="Pasangkan soal & jawaban"
              latar="bg-teal-light flex items-center justify-center gap-5"
            >
              <div className="flex flex-col gap-[7px]">
                <div className="h-3 w-10 rounded-md bg-teal" />
                <div className="h-3 w-10 rounded-md bg-ai" />
                <div className="h-3 w-10 rounded-md bg-amber" />
              </div>
              <div className="flex flex-col gap-[7px]">
                <div className="h-3 w-10 rounded-md bg-ai opacity-45" />
                <div className="h-3 w-10 rounded-md bg-amber opacity-45" />
                <div className="h-3 w-10 rounded-md bg-teal opacity-45" />
              </div>
            </KartuTemplate>

            <KartuTemplate judul="Flashcard" isi="Kartu bolak-balik" latar="bg-ai-light">
              <div className="relative h-14 w-20">
                <div
                  className="absolute inset-0 rounded-[9px] bg-ai-soft"
                  style={{ transform: "rotate(-7deg)" }}
                />
                <div
                  className="absolute inset-0 rounded-[9px] bg-ai-mid"
                  style={{ transform: "rotate(-2deg)" }}
                />
                <div
                  className="absolute inset-0 grid place-items-center rounded-[9px] bg-surface"
                  style={{ transform: "rotate(3deg)", boxShadow: "0 6px 14px rgba(24,36,32,.15)" }}
                >
                  <div className="h-[6px] w-11 rounded-[3px] bg-ai" />
                </div>
              </div>
            </KartuTemplate>

            <KartuTemplate
              judul="Susun Kata"
              isi="Urutkan huruf acak"
              latar="bg-sand flex items-center justify-center gap-[5px]"
            >
              <UbinHuruf putar="-5deg">T</UbinHuruf>
              <UbinHuruf putar="3deg">A</UbinHuruf>
              <UbinHuruf putar="-2deg" sorot>
                K
              </UbinHuruf>
              <UbinHuruf putar="6deg">A</UbinHuruf>
            </KartuTemplate>

            <KartuTemplate judul="Cari Kata" isi="Temukan di kisi huruf" latar="bg-teal-light">
              <div
                className="grid grid-cols-[repeat(4,16px)] gap-[3px] rounded-[9px] bg-surface p-[7px] text-center text-[9px] font-bold text-ink-2"
                style={{ boxShadow: "0 4px 12px rgba(24,36,32,.08)" }}
              >
                {KISI.map(([huruf, sorot], i) => (
                  <span
                    key={i}
                    className={`leading-4 ${sorot ? "rounded-[4px] bg-teal text-surface" : ""}`}
                  >
                    {huruf}
                  </span>
                ))}
              </div>
            </KartuTemplate>

            <KartuTemplate
              judul="Kuis Cepat"
              isi="Balapan sebelum waktu habis"
              latar="bg-ai-light flex items-center justify-center gap-[11px]"
            >
              <div className="relative h-10 w-10 rounded-full border-4 border-ai bg-surface">
                <div
                  className="absolute left-1/2 top-1/2 h-3 w-[3px] rounded-[2px] bg-ai"
                  style={{
                    transform: "translate(-50%,-100%) rotate(40deg)",
                    transformOrigin: "bottom center",
                  }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="h-2 w-[46px] rounded-[4px] bg-ai" />
                <div className="h-2 w-[34px] rounded-[4px] bg-ai-mid" />
                <div className="h-2 w-5 rounded-[4px] bg-ai-soft" />
              </div>
            </KartuTemplate>
          </div>
        </div>
      </section>

      {/* ── Sisi siswa ───────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1160px] px-6 py-10 sm:py-16">
        <div className="relative grid grid-cols-1 items-center gap-8 overflow-hidden rounded-hero bg-forest p-6 text-surface sm:gap-11 sm:p-12 lg:grid-cols-[1fr_.8fr]">
          <div
            className="pointer-events-none absolute -right-20 -top-[140px] h-[420px] w-[420px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(109,90,230,.45), transparent 65%)" }}
            aria-hidden="true"
          />

          <div className="relative flex flex-col gap-4">
            <span className="self-start rounded-full border border-white/20 bg-white/12 px-3.5 py-1.5 text-[13px] font-semibold text-mint-bright">
              Sisi siswa
            </span>
            <h2 className="m-0 font-display text-[26px] font-extrabold leading-[1.15] text-pretty sm:text-[34px]">
              Siswa cukup buka tautan. Tidak ada pendaftaran.
            </h2>
            <p className="m-0 max-w-[440px] text-[16px] leading-[1.65] text-mint-soft text-pretty">
              Bagikan tautan di grup kelas atau tampilkan QR di proyektor. Latihan jalan di
              ponsel apa pun, dengan skor dan umpan balik langsung setelah tiap jawaban.
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2.5">
              {["Acak urutan soal", "Timer per soal", "Skor otomatis"].map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-white/12 px-4 py-[9px] text-[13.5px] font-semibold"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div
            className="relative flex flex-wrap items-center justify-center gap-[18px]"
            aria-hidden="true"
          >
            <div
              className="flex w-[220px] flex-col gap-[11px] rounded-[20px] bg-surface p-[18px]"
              style={{ boxShadow: "0 18px 44px rgba(0,0,0,.28)" }}
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-ai-light px-2.5 py-[3px] text-[10px] font-bold text-ai">
                  SOAL 4/8
                </span>
                <span className="rounded-full bg-score px-2.5 py-[3px] text-[10px] font-bold text-ink">
                  SKOR 3
                </span>
              </div>
              <div className="h-[5px] rounded-full bg-fill-3">
                <div className="h-full w-[48%] rounded-full bg-mint" />
              </div>
              <div className="font-display text-[14px] font-bold leading-[1.4] text-ink">
                Zat hijau daun yang menangkap cahaya matahari disebut …
              </div>
              <div className="grid gap-1.5">
                <OpsiSiswa kunci>Klorofil</OpsiSiswa>
                <OpsiSiswa>Karoten</OpsiSiswa>
                <OpsiSiswa>Xantofil</OpsiSiswa>
              </div>
              <div className="self-center rounded-full bg-teal-light px-4 py-[7px] text-[12px] font-bold text-teal-dark">
                Benar! +1 poin
              </div>
            </div>

            <div
              className="relative h-24 w-24 shrink-0 rounded-xl bg-surface"
              style={{ boxShadow: "0 12px 28px rgba(0,0,0,.24)" }}
            >
              <PenandaQr posisi="left-2.5 top-2.5" />
              <PenandaQr posisi="right-2.5 top-2.5" />
              <PenandaQr posisi="bottom-2.5 left-2.5" />
              <div className="absolute bottom-3.5 right-3.5 h-2.5 w-2.5 bg-ink" />
              <div className="absolute right-4 top-[42px] h-2 w-2 bg-ink" />
              <div className="absolute left-[42px] top-12 h-2 w-2 bg-ink" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Harga ────────────────────────────────────────────────────────── */}
      <section
        id="harga"
        className="mx-auto flex w-full max-w-[1160px] flex-col gap-7 px-6 pb-10 pt-2 sm:pb-16"
      >
        <div className="flex max-w-[600px] flex-col gap-2">
          <Kapital>HARGA</Kapital>
          <JudulBagian>Gratis, tanpa syarat</JudulBagian>
        </div>

        <div
          className="grid grid-cols-1 items-center gap-8 rounded-hero border-2 border-teal bg-surface p-6 sm:grid-cols-[auto_1fr] sm:gap-11 sm:p-11"
          style={{ boxShadow: "0 12px 32px rgba(24,36,32,.1)" }}
        >
          <div className="flex flex-col gap-1.5">
            <span className="font-display text-[52px] font-black leading-none text-teal sm:text-[72px]">
              Rp 0
            </span>
            <span className="text-[15px] font-semibold text-ink-3">
              selamanya, untuk semua fitur
            </span>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 text-[15px] text-ink-2 sm:grid-cols-2">
            {[
              "Aktivitas tanpa batas",
              "Unggahan tanpa batas",
              "Semua 8 template",
              "Siswa main tanpa login",
              "Tanpa kartu kredit",
              "Tanpa iklan",
            ].map((t) => (
              <div key={t} className="flex gap-2.5">
                <span className="font-extrabold text-teal">✓</span>
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pertanyaan yang sering muncul ────────────────────────────────── */}
      <section className="border-t border-line bg-surface py-10 sm:py-16">
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-[26px] px-6">
          <h2 className="m-0 font-display text-[26px] font-extrabold leading-[1.15] sm:text-[34px]">
            Pertanyaan yang sering muncul
          </h2>
          <div className="flex flex-col gap-3.5">
            <ItemFaq tanya="Bagaimana kalau hasil AI-nya salah?">
              Semua hasil masuk layar review dulu, tidak pernah langsung terbit. Soal yang
              keyakinannya rendah ditandai kuning beserta alasannya, dan kunci jawaban bisa
              diubah dengan satu klik pada opsi.
            </ItemFaq>
            <ItemFaq tanya="Apakah tulisan tangan bisa dibaca?">
              Bisa, tetapi hasilnya bergantung kerapian tulisan dan kualitas foto. Tulisan
              tangan biasanya mendapat skor keyakinan lebih rendah, jadi pastikan memeriksa
              nomor yang ditandai.
            </ItemFaq>
            <ItemFaq tanya="Siswa perlu membuat akun?">
              Tidak. Mereka membuka tautan atau memindai QR, lalu langsung bermain. Hanya guru
              yang punya akun.
            </ItemFaq>
            <ItemFaq tanya="Bisa mengetik soal sendiri tanpa unggah?">
              Bisa. Ada jalur &quot;ketik soal manual&quot; yang langsung membuka editor
              kosong, dengan editor dan template yang sama seperti hasil unggahan.
            </ItemFaq>
          </div>
        </div>
      </section>

      {/* ── Ajakan penutup ───────────────────────────────────────────────── */}
      <section
        id="cta"
        className="mx-auto flex w-full max-w-[1160px] flex-col items-center gap-5 px-6 py-12 text-center sm:py-[72px]"
      >
        <h2 className="m-0 max-w-[620px] font-display text-[30px] font-extrabold leading-[1.1] text-pretty sm:text-[42px]">
          Lembar soal di meja Anda sudah cukup untuk mulai.
        </h2>
        <p className="m-0 max-w-[480px] text-[17px] leading-[1.6] text-ink-2 text-pretty">
          Foto satu halaman sekarang, lihat hasilnya sebelum menit kedua.
        </p>
        <Link
          href="/buat"
          className="mt-1.5 flex items-center gap-2.5 rounded-full bg-teal px-[34px] py-[17px] font-display text-[18px] font-bold text-surface no-underline transition-all hover:-translate-y-0.5 hover:bg-teal-dark hover:text-surface hover:no-underline"
        >
          <KameraIcon size={19} />
          Coba Gratis Sekarang
        </Link>
        <div className="text-[13.5px] font-semibold text-dim">
          Tanpa kartu kredit · tanpa batas aktivitas
        </div>
      </section>

      <footer className="bg-forest py-10 text-mint-soft">
        <div className="mx-auto flex w-full max-w-[1160px] flex-wrap items-center gap-6 px-6">
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="grid h-[30px] w-[30px] place-items-center rounded-[10px] bg-teal text-surface">
              <KameraIcon size={16} />
            </span>
            <span className="font-display text-[18px] font-extrabold text-surface">SoalSnap</span>
          </div>
          <span className="flex-1" />
          {/* Boleh turun baris: di 320px empat butir tidak muat sebaris, dan
              tiap butirnya sendiri ditahan agar tidak patah di tengah kata. */}
          <div className="flex flex-wrap gap-x-[22px] gap-y-2 text-[14px] font-semibold">
            <TautanFooter href="#cara">Cara kerja</TautanFooter>
            <TautanFooter href="#template">Template</TautanFooter>
            <TautanFooter href="#harga">Harga</TautanFooter>
            <TautanFooter href="/kumpulan">Kumpulan soal</TautanFooter>
          </div>
          <div className="text-[13px] text-mint-dim">© 2026 SoalSnap</div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Jangkar bagian tetap `<a>` biasa; tujuan yang berupa rute memakai `Link` supaya
 * perpindahannya di sisi klien. `whitespace-nowrap` menahan butir dua kata agar
 * tidak patah menjadi dua baris di lebar sedang.
 */
function TautanNav({ href, children }: { href: string; children: ReactNode }) {
  const kelas =
    "whitespace-nowrap text-[14.5px] font-semibold text-ink-2 no-underline hover:text-ink-2 hover:no-underline";
  return href.startsWith("#") ? (
    <a href={href} className={kelas}>{children}</a>
  ) : (
    <Link href={href} className={kelas}>{children}</Link>
  );
}

function Janji({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[14px] font-semibold text-ink-3">
      <span className="text-teal">✓</span> {children}
    </div>
  );
}

function BarisKertas({ lebar, sorot }: { lebar: string; sorot?: boolean }) {
  return (
    <div
      className={`h-[7px] shrink-0 rounded-[4px] ${sorot ? "bg-paper-hl-2" : "bg-paper-line"}`}
      style={{ width: lebar }}
    />
  );
}

function OpsiHero({ children, kunci }: { children: ReactNode; kunci?: boolean }) {
  return (
    <div
      className={`rounded-xl border-2 px-3.5 py-[11px] text-[14px] ${
        kunci
          ? "border-teal bg-teal-light font-bold text-teal-dark"
          : "border-line font-semibold text-ink-2"
      }`}
    >
      {children}
    </div>
  );
}

function Kapital({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-bold tracking-[.1em] text-teal">{children}</span>
  );
}

function JudulBagian({ children }: { children: ReactNode }) {
  return (
    <h2 className="m-0 font-display text-[26px] font-extrabold leading-[1.15] text-pretty sm:text-[36px]">
      {children}
    </h2>
  );
}

function KartuLangkah({
  nomor,
  judul,
  warna,
  children,
}: {
  nomor: string;
  judul: string;
  warna: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3.5 rounded-[22px] border border-line bg-surface p-7">
      <span
        className={`grid h-11 w-11 place-items-center rounded-[14px] font-display text-[19px] font-extrabold ${warna}`}
      >
        {nomor}
      </span>
      <div className="font-display text-[20px] font-bold">{judul}</div>
      {children}
    </div>
  );
}

function IkonKilau() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" />
    </svg>
  );
}

function IkonPanah() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** Kisi Cari Kata pada kartu template; nilai kedua menandai huruf yang tersorot. */
const KISI: [string, boolean][] = [
  ["K", false], ["D", true], ["R", false], ["M", false],
  ["P", false], ["A", false], ["A", true], ["E", false],
  ["S", false], ["L", false], ["G", false], ["U", true],
  ["B", false], ["O", false], ["T", false], ["I", false],
];

function KartuTemplate({
  judul,
  isi,
  latar,
  children,
}: {
  judul: string;
  isi: string;
  latar: string;
  children: ReactNode;
}) {
  const berlapis = latar.includes("flex");
  return (
    <div className="flex flex-col overflow-hidden rounded-[18px] border border-line">
      <div className={`h-24 ${berlapis ? "" : "grid place-items-center"} ${latar}`}>
        {children}
      </div>
      <div className="px-4 py-3.5">
        <div className="font-display text-[16px] font-bold">{judul}</div>
        <div className="mt-0.5 text-[13px] text-ink-3">{isi}</div>
      </div>
    </div>
  );
}

function UbinHuruf({
  children,
  putar,
  sorot,
}: {
  children: ReactNode;
  putar: string;
  sorot?: boolean;
}) {
  return (
    <div
      className={`grid h-[27px] w-[27px] place-items-center rounded-[7px] font-display text-[14px] font-extrabold ${
        sorot ? "bg-amber text-surface" : "bg-surface text-amber-dark"
      }`}
      style={{ transform: `rotate(${putar})`, boxShadow: "0 4px 10px rgba(24,36,32,.12)" }}
    >
      {children}
    </div>
  );
}

function OpsiSiswa({ children, kunci }: { children: ReactNode; kunci?: boolean }) {
  return (
    <div
      className={`rounded-[9px] border-[1.5px] px-[11px] py-[9px] text-[12.5px] ${
        kunci
          ? "border-teal bg-teal-light font-bold text-teal-dark"
          : "border-line font-semibold text-ink-2"
      }`}
    >
      {children}
    </div>
  );
}

/** Kotak sudut kode QR — tiga di antaranya menjadi penanda posisi. */
function PenandaQr({ posisi }: { posisi: string }) {
  return (
    <div className={`absolute h-[22px] w-[22px] border-4 border-ink ${posisi}`}>
      <div className="absolute inset-1 bg-ink" />
    </div>
  );
}

function ItemFaq({ tanya, children }: { tanya: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[7px] rounded-2xl border border-line px-[22px] py-5">
      <div className="font-display text-[17px] font-bold">{tanya}</div>
      <div className="text-[14.5px] leading-[1.6] text-ink-3">{children}</div>
    </div>
  );
}

function TautanFooter({ href, children }: { href: string; children: ReactNode }) {
  const kelas = "whitespace-nowrap text-mint-soft no-underline hover:text-surface hover:no-underline";
  return href.startsWith("#") ? (
    <a href={href} className={kelas}>{children}</a>
  ) : (
    <Link href={href} className={kelas}>{children}</Link>
  );
}
