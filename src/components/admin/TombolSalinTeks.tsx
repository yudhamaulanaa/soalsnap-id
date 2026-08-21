"use client";

import { useEffect, useRef, useState } from "react";

/** Menyalin teks apa adanya — dipakai mengambil hasil OCR mentah dari layar. */
export function TombolSalinTeks({ teks, label = "Salin teks" }: { teks: string; label?: string }) {
  const [tersalin, setTersalin] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(teks);
        } catch {
          // Peramban bisa menolak akses papan klip; teksnya tetap bisa diblok manual.
        }
        setTersalin(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setTersalin(false), 1600);
      }}
      className="rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] font-semibold text-ink-2 transition-colors hover:border-teal hover:text-teal"
    >
      {tersalin ? "Tersalin ✓" : label}
    </button>
  );
}
