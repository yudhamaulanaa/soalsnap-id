import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { FormMasukAkun } from "@/components/auth/FormMasukAkun";
import { authDikonfigurasi, penggunaSaatIni } from "@/lib/auth/sesi";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Masuk — SoalSnap",
  description: "Masuk lewat tautan yang dikirim ke email, tanpa kata sandi.",
};

/** Halaman masuk. Akun bersifat tambahan — membuat soal tetap bisa tanpa ini. */
export default async function MasukPage() {
  if (await penggunaSaatIni()) redirect("/soal-saya");

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-[460px] flex-col gap-5 px-6 pb-20 pt-14">
        <div>
          <h1 className="m-0 font-display text-[28px] font-extrabold">Masuk ke SoalSnap</h1>
          <p className="m-0 mt-1.5 text-[14.5px] leading-[1.6] text-ink-3 text-pretty">
            Tanpa kata sandi — kami kirim tautan masuk ke emailmu. Gunanya untuk
            mengumpulkan soal yang sudah kamu buat supaya bisa dikelola dari perangkat
            mana pun.
          </p>
        </div>

        <div className="rounded-panel border border-line bg-surface p-7">
          {authDikonfigurasi() ? (
            <FormMasukAkun />
          ) : (
            <div className="flex flex-col gap-2">
              <p className="m-0 font-display text-[17px] font-bold">Fitur masuk belum aktif</p>
              <p className="m-0 text-[14px] leading-[1.6] text-ink-3">
                Isi <code className="rounded bg-app px-1.5 py-0.5 text-[13px]">AUTH_SECRET</code> di
                environment server, lalu jalankan ulang aplikasinya.
              </p>
            </div>
          )}
        </div>

        <p className="m-0 text-[13.5px] leading-[1.6] text-dim text-pretty">
          Tidak ingin punya akun? Tidak masalah —{" "}
          <Link href="/buat" className="font-semibold text-teal-dark no-underline hover:underline">
            buat soal tanpa masuk
          </Link>
          . Tautan sunting yang kamu simpan tetap menjadi kunci untuk mengubahnya.
        </p>
      </main>
    </div>
  );
}
