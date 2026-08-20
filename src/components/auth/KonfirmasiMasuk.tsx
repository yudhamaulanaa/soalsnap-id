"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";

/**
 * Langkah terakhir tautan masuk.
 *
 * Tombol, bukan verifikasi otomatis saat halaman dibuka: pemindai tautan pada
 * surel korporat kerap memuat tautan lebih dulu, dan itu akan memakai habis
 * token sekali-pakai sebelum pemiliknya sempat mengklik.
 */
export function KonfirmasiMasuk({ token }: { token: string }) {
  const router = useRouter();
  const [sibuk, setSibuk] = useState(false);
  const [gagal, setGagal] = useState<string | null>(null);

  async function masuk() {
    if (sibuk) return;
    setSibuk(true);
    setGagal(null);
    try {
      const res = await fetch("/api/auth/verifikasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Tautan masuk tidak berlaku");

      // Aktivitas yang tautan suntingnya masih tersimpan di peramban ini ikut
      // dikumpulkan; kegagalannya tidak boleh menggagalkan proses masuk.
      const editSlugs = useStore.getState().mine.map((m) => m.editSlug);
      if (editSlugs.length > 0) {
        await fetch("/api/auth/klaim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ editSlugs }),
        }).catch(() => null);
      }

      router.replace("/soal-saya");
      router.refresh();
    } catch (e: unknown) {
      setGagal(e instanceof Error ? e.message : "Tautan masuk tidak berlaku");
      setSibuk(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={sibuk}
        onClick={masuk}
        className="rounded-full bg-teal px-7 py-3.5 font-display text-base font-bold text-surface transition-colors hover:bg-teal-dark disabled:cursor-not-allowed disabled:bg-dim"
      >
        {sibuk ? "Memasukkan…" : "Lanjutkan masuk"}
      </button>
      {gagal && (
        <p role="alert" className="m-0 text-[13.5px] font-semibold text-wrong-fg">
          {gagal}
        </p>
      )}
    </div>
  );
}
