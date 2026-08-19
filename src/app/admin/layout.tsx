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
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const masuk = await sesiAdminSah();

  return (
    <div className="flex min-h-screen flex-col bg-app">
      <header className="sticky top-0 z-50 h-16 bg-forest">
        <div className="flex h-full items-center gap-5 px-6">
          <Link
            href={masuk ? "/admin" : "/"}
            className="flex items-center gap-2.5 no-underline hover:no-underline"
          >
            <span className="grid h-[34px] w-[34px] place-items-center rounded-[11px] bg-mint text-forest">
              <PerisaiIcon size={18} />
            </span>
            <span className="font-display text-[19px] font-extrabold text-surface">
              SoalSnap <span className="text-mint">Admin</span>
            </span>
          </Link>

          {masuk && (
            <nav className="flex flex-1 items-center gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-full px-3.5 py-2 text-[13.5px] font-semibold text-mint-dim no-underline transition-colors hover:text-mint-bright hover:no-underline"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/"
              className="text-[13px] font-semibold text-mint-dim no-underline hover:text-mint-bright hover:no-underline"
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
