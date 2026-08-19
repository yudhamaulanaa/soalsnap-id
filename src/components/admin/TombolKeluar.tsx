"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TombolKeluar() {
  const router = useRouter();
  const [keluar, setKeluar] = useState(false);

  return (
    <button
      type="button"
      disabled={keluar}
      onClick={async () => {
        setKeluar(true);
        await fetch("/api/admin/keluar", { method: "POST" }).catch(() => null);
        router.replace("/admin/masuk");
        router.refresh();
      }}
      className="rounded-full border border-mint-dim/40 px-4 py-2 text-[13px] font-semibold text-mint transition-colors hover:border-mint hover:text-mint-bright disabled:opacity-60"
    >
      {keluar ? "Keluar…" : "Keluar"}
    </button>
  );
}
