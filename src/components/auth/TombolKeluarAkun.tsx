"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TombolKeluarAkun() {
  const router = useRouter();
  const [keluar, setKeluar] = useState(false);

  return (
    <button
      type="button"
      disabled={keluar}
      onClick={async () => {
        setKeluar(true);
        await fetch("/api/auth/keluar", { method: "POST" }).catch(() => null);
        router.replace("/");
        router.refresh();
      }}
      className="rounded-full border-[1.5px] border-line px-5 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:border-line-hover disabled:opacity-60"
    >
      {keluar ? "Keluar…" : "Keluar"}
    </button>
  );
}
