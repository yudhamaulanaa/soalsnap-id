"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  id: string;
  /** Aktivitas publik bisa diturunkan dari katalog. */
  publik: boolean;
  /** Sudah pernah diturunkan admin — hanya yang begini boleh dipulihkan. */
  diturunkan: boolean;
  /** Ke mana pengguna dibawa setelah aktivitasnya dihapus. */
  setelahHapus: string;
}

export function AksiModerasi({ id, publik, diturunkan, setelahHapus }: Props) {
  const router = useRouter();
  const [alasan, setAlasan] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [pastiHapus, setPastiHapus] = useState(false);
  const [gagal, setGagal] = useState<string | null>(null);

  async function panggil(init: RequestInit, sesudah: () => void) {
    if (sibuk) return;
    setSibuk(true);
    setGagal(null);
    try {
      const res = await fetch(`/api/admin/aktivitas/${id}`, init);
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Aksi gagal");
      sesudah();
    } catch (e: unknown) {
      setGagal(e instanceof Error ? e.message : "Aksi gagal");
    } finally {
      setSibuk(false);
    }
  }

  const moderasi = (aksi: "turunkan" | "pulihkan") =>
    panggil(
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aksi, alasan: alasan || undefined }),
      },
      () => {
        setAlasan("");
        router.refresh();
      },
    );

  return (
    <div className="flex flex-col gap-3">
      {publik && (
        <div className="flex flex-col gap-2">
          <input
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            placeholder="Alasan menurunkan (dicatat, opsional)"
            aria-label="Alasan menurunkan"
            className="w-full rounded-xl border-[1.5px] border-line px-4 py-2.5 text-[14px] outline-none focus:border-teal"
          />
          <button
            type="button"
            disabled={sibuk}
            onClick={() => moderasi("turunkan")}
            className="rounded-full bg-amber px-5 py-2.5 font-display text-sm font-bold text-surface transition-colors hover:bg-amber-dark disabled:opacity-60"
          >
            Turunkan dari katalog
          </button>
        </div>
      )}

      {diturunkan && (
        <button
          type="button"
          disabled={sibuk}
          onClick={() => moderasi("pulihkan")}
          className="rounded-full border-[1.5px] border-line px-5 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:border-line-hover disabled:opacity-60"
        >
          Pulihkan ke katalog
        </button>
      )}

      {pastiHapus ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-wrong-bg px-4 py-3">
          <span className="text-[13px] font-semibold text-wrong-fg">
            Hapus permanen beserta soal dan rekap pesertanya?
          </span>
          <button
            type="button"
            disabled={sibuk}
            onClick={() =>
              panggil({ method: "DELETE" }, () => {
                router.replace(setelahHapus);
                router.refresh();
              })
            }
            className="rounded-full bg-wrong px-4 py-2 text-[13px] font-bold text-surface transition-colors hover:bg-wrong-fg disabled:opacity-60"
          >
            Ya, hapus
          </button>
          <button
            type="button"
            onClick={() => setPastiHapus(false)}
            className="rounded-full px-3 py-2 text-[13px] font-semibold text-wrong-fg"
          >
            Batal
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPastiHapus(true)}
          className="self-start rounded-full border-[1.5px] border-wrong/40 px-5 py-2.5 text-sm font-semibold text-wrong-fg transition-colors hover:border-wrong"
        >
          Hapus permanen
        </button>
      )}

      {gagal && (
        <p role="alert" className="m-0 text-[13px] font-semibold text-wrong-fg">
          {gagal}
        </p>
      )}
    </div>
  );
}
