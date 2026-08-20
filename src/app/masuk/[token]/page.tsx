import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { KonfirmasiMasuk } from "@/components/auth/KonfirmasiMasuk";
import { bentukTokenSah } from "@/lib/auth/magic";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lanjutkan masuk — SoalSnap",
  robots: { index: false, follow: false },
};

type Ctx = { params: Promise<{ token: string }> };

/** Layar konfirmasi tautan masuk dari surel. */
export default async function LanjutMasukPage({ params }: Ctx) {
  const { token } = await params;
  const bentuknyaBenar = bentukTokenSah(token);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-[460px] flex-col gap-5 px-6 pb-20 pt-16 text-center">
        {bentuknyaBenar ? (
          <>
            <div>
              <h1 className="m-0 font-display text-[26px] font-extrabold">Tinggal satu langkah</h1>
              <p className="m-0 mt-1.5 text-[14.5px] leading-[1.6] text-ink-3 text-pretty">
                Klik tombol di bawah untuk menyelesaikan proses masuk di perangkat ini.
              </p>
            </div>
            <KonfirmasiMasuk token={token} />
          </>
        ) : (
          <>
            <div>
              <h1 className="m-0 font-display text-[26px] font-extrabold">
                Tautan masuk tidak berlaku
              </h1>
              <p className="m-0 mt-1.5 text-[14.5px] leading-[1.6] text-ink-3 text-pretty">
                Tautannya mungkin terpotong saat disalin, sudah dipakai, atau sudah lewat
                masa berlakunya.
              </p>
            </div>
            <Link
              href="/masuk"
              className="self-center rounded-full bg-teal px-7 py-3.5 font-display text-[15px] font-bold text-surface no-underline hover:bg-teal-dark hover:text-surface hover:no-underline"
            >
              Minta tautan baru
            </Link>
          </>
        )}
      </main>
    </div>
  );
}
