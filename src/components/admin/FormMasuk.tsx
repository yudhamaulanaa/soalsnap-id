"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FormMasuk() {
  const router = useRouter();
  const [sandi, setSandi] = useState("");
  const [mengirim, setMengirim] = useState(false);
  const [gagal, setGagal] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (mengirim) return;
        setMengirim(true);
        setGagal(null);
        try {
          const res = await fetch("/api/admin/masuk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sandi }),
          });
          const data: { error?: string } = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error ?? "Gagal masuk");
          router.replace("/admin");
          router.refresh();
        } catch (e: unknown) {
          setGagal(e instanceof Error ? e.message : "Gagal masuk");
          setMengirim(false);
        }
      }}
    >
      <label htmlFor="sandi" className="text-[11px] font-bold tracking-[.08em] text-dim">
        SANDI ADMIN
      </label>
      <input
        id="sandi"
        type="password"
        autoComplete="current-password"
        value={sandi}
        onChange={(e) => setSandi(e.target.value)}
        className="w-full rounded-xl border-[1.5px] border-line px-4 py-3 text-[15px] outline-none focus:border-teal"
      />
      <button
        type="submit"
        disabled={mengirim || sandi.length === 0}
        className="rounded-full bg-teal px-6 py-3 font-display text-[15px] font-bold text-surface transition-colors hover:bg-teal-dark disabled:cursor-not-allowed disabled:bg-dim"
      >
        {mengirim ? "Memeriksa…" : "Masuk"}
      </button>
      {gagal && (
        <p role="alert" className="m-0 text-[13px] font-semibold text-wrong-fg">
          {gagal}
        </p>
      )}
    </form>
  );
}
