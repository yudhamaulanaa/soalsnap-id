import { redirect } from "next/navigation";
import { FormMasuk } from "@/components/admin/FormMasuk";
import { adminDikonfigurasi, sesiAdminSah } from "@/lib/admin/sesi";

export const dynamic = "force-dynamic";

/** Gerbang masuk admin — satu-satunya halaman /admin yang terbuka. */
export default async function MasukPage() {
  if (await sesiAdminSah()) redirect("/admin");
  const siap = adminDikonfigurasi();

  return (
    <main className="mx-auto flex w-full max-w-[420px] flex-col gap-5 px-6 pb-20 pt-16">
      <div>
        <h1 className="m-0 font-display text-[26px] font-extrabold">Masuk sebagai admin</h1>
        <p className="m-0 mt-1.5 text-[14.5px] text-ink-3">
          Halaman ini untuk meninjau soal yang dilaporkan dan menurunkan konten yang
          menyalahgunakan katalog.
        </p>
      </div>

      <div className="rounded-panel border border-line bg-surface p-7">
        {siap ? (
          <FormMasuk />
        ) : (
          <div className="flex flex-col gap-2">
            <p className="m-0 font-display text-[17px] font-bold">Admin belum dikonfigurasi</p>
            <p className="m-0 text-[14px] text-ink-3">
              Isi <code className="rounded bg-app px-1.5 py-0.5 text-[13px]">ADMIN_PASSWORD</code>{" "}
              di environment server, lalu jalankan ulang aplikasinya. Selama variabel itu
              kosong, tidak ada sandi bawaan dan halaman admin tetap tertutup.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
