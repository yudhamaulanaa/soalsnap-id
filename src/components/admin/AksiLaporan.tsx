"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Tombol penutup satu laporan di antrean admin. */
export function AksiLaporan({ id }: { id: string }) {
  const router = useRouter();
  const [sibuk, setSibuk] = useState(false);
  const [gagal, setGagal] = useState<string | null>(null);

  async function tutup(status: "ditangani" | "diabaikan") {
    if (sibuk) return;
    setSibuk(true);
    setGagal(null);
    try {
      const res = await fetch(`/api/admin/laporan/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Aksi gagal");
      router.refresh();
    } catch (e: unknown) {
      setGagal(e instanceof Error ? e.message : "Aksi gagal");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={sibuk}
        onClick={() => tutup("ditangani")}
        className="rounded-full bg-teal px-4 py-2 text-[13px] font-bold text-surface transition-colors hover:bg-teal-dark disabled:opacity-60"
      >
        Tandai ditangani
      </button>
      <button
        type="button"
        disabled={sibuk}
        onClick={() => tutup("diabaikan")}
        className="rounded-full border-[1.5px] border-line px-4 py-2 text-[13px] font-semibold text-ink-2 transition-colors hover:border-line-hover disabled:opacity-60"
      >
        Abaikan
      </button>
      {gagal && <span className="text-[13px] font-semibold text-wrong-fg">{gagal}</span>}
    </div>
  );
}
