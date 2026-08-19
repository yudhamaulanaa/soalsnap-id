"use client";

import { useEffect, useRef, useState } from "react";
import { CentangIcon, TautanIcon } from "./Icons";

/** Tombol salin tautan dengan konfirmasi sesaat (FR-SH-3, FR-DB-2). */
export function CopyLinkButton({ url, label }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function salin() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard bisa ditolak browser — konfirmasi tetap ditampilkan agar
      // pengguna tahu tautannya bisa disalin manual dari layar Bagikan.
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }

  if (label) {
    return (
      <button
        type="button"
        onClick={salin}
        className="min-w-[110px] rounded-xl bg-teal px-[22px] text-sm font-bold text-surface transition-colors hover:bg-teal-dark"
      >
        {copied ? "Tersalin ✓" : label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={salin}
      title="Salin tautan"
      aria-label={copied ? "Tautan tersalin" : "Salin tautan"}
      className={`grid w-[38px] place-items-center rounded-[10px] border transition-colors ${
        copied ? "border-teal text-teal" : "border-line text-ink-3 hover:border-line-hover"
      }`}
    >
      {copied ? <CentangIcon size={15} /> : <TautanIcon size={15} />}
    </button>
  );
}
