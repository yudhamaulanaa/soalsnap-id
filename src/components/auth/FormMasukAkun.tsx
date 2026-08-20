"use client";

import { useState } from "react";

/** Meminta tautan masuk dikirim ke sebuah alamat surel. */
export function FormMasukAkun() {
  const [email, setEmail] = useState("");
  const [mengirim, setMengirim] = useState(false);
  const [terkirim, setTerkirim] = useState(false);
  const [kabar, setKabar] = useState<string | null>(null);
  const [gagal, setGagal] = useState<string | null>(null);

  if (terkirim) {
    return (
      <div className="flex flex-col gap-2" role="status">
        <p className="m-0 font-display text-[17px] font-bold">Tautannya sudah dikirim</p>
        <p className="m-0 text-[14px] leading-[1.6] text-ink-3">
          Cek kotak masuk <strong className="text-ink-2">{email}</strong>. Tautannya berlaku 15
          menit dan hanya bisa dipakai sekali. Kalau tidak muncul, lihat folder spam.
        </p>
        {kabar && <p className="m-0 text-[13px] font-semibold text-warn-fg">{kabar}</p>}
        <button
          type="button"
          onClick={() => {
            setTerkirim(false);
            setKabar(null);
          }}
          className="mt-1 self-start rounded-full border-[1.5px] border-line px-5 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:border-line-hover"
        >
          Pakai alamat lain
        </button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (mengirim) return;
        setMengirim(true);
        setGagal(null);
        try {
          const res = await fetch("/api/auth/minta", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const data: { error?: string; notifikasi?: { kode?: string } } = await res
            .json()
            .catch(() => ({}));
          if (!res.ok) throw new Error(data.error ?? "Gagal mengirim tautan masuk");

          // Dikatakan apa adanya kalau penyedia surel belum dipasang, supaya
          // orang tidak menunggu surel yang tidak akan pernah datang.
          setKabar(
            data.notifikasi?.kode === "belum-dikonfigurasi"
              ? "Pengiriman surel belum aktif di server ini — tautannya hanya tercatat di log server."
              : data.notifikasi?.kode === "gagal"
                ? "Surelnya gagal dikirim. Coba minta ulang sebentar lagi."
                : null,
          );
          setTerkirim(true);
        } catch (e: unknown) {
          setGagal(e instanceof Error ? e.message : "Gagal mengirim tautan masuk");
        } finally {
          setMengirim(false);
        }
      }}
    >
      <label htmlFor="email" className="text-[11px] font-bold tracking-[.08em] text-dim">
        ALAMAT EMAIL
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="nama@sekolah.id"
        className="w-full rounded-xl border-[1.5px] border-line px-4 py-3 text-[15px] outline-none focus:border-teal"
      />
      <button
        type="submit"
        disabled={mengirim || email.trim().length === 0}
        className="rounded-full bg-teal px-6 py-3 font-display text-[15px] font-bold text-surface transition-colors hover:bg-teal-dark disabled:cursor-not-allowed disabled:bg-dim"
      >
        {mengirim ? "Mengirim…" : "Kirim tautan masuk"}
      </button>
      {gagal && (
        <p role="alert" className="m-0 text-[13px] font-semibold text-wrong-fg">
          {gagal}
        </p>
      )}
    </form>
  );
}
