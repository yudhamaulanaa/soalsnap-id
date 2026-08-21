import type { Metadata } from "next";
import Link from "next/link";
import { TombolKeluar } from "@/components/admin/TombolKeluar";
import { PerisaiIcon } from "@/components/Icons";
import { sesiAdminSah } from "@/lib/admin/sesi";

export const metadata: Metadata = {
  title: "Admin — SoalSnap",
  // Halaman moderasi tidak boleh masuk indeks mesin pencari.
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/aktivitas", label: "Aktivitas" },
  { href: "/admin/laporan", label: "Laporan" },
  { href: "/admin/unggahan", label: "Unggahan" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const masuk = await sesiAdminSah();

  return (
    <div className="flex min-h-screen flex-col bg-app">
      <header className="sticky top-0 z-50 bg-forest">
        {/* Di layar sempit navigasinya turun ke baris kedua; memaksakan satu
            baris membuat tombol keluar terdorong ke luar layar. */}
        <div className="flex min-h-16 flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2 sm:flex-nowrap sm:px-6 sm:py-0">
          <Link
            href={masuk ? "/admin" : "/"}
            className="flex shrink-0 items-center gap-2.5 no-underline hover:no-underline"
          >
            <span className="grid h-[34px] w-[34px] place-items-center rounded-[11px] bg-mint text-forest">
              <PerisaiIcon size={18} />
            </span>
            <span className="font-display text-[19px] font-extrabold text-surface">
              SoalSnap <span className="text-mint">Admin</span>
            </span>
          </Link>

          {masuk && (
            <nav className="order-last flex w-full items-center gap-1 overflow-x-auto sm:order-none sm:w-auto sm:flex-1 sm:overflow-visible">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[13.5px] font-semibold text-mint-dim no-underline transition-colors hover:text-mint-bright hover:no-underline"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <Link
              href="/"
              className="whitespace-nowrap text-[13px] font-semibold text-mint-dim no-underline hover:text-mint-bright hover:no-underline"
            >
              Ke aplikasi
            </Link>
            {masuk && <TombolKeluar />}
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
