"use client";

import Link from "next/link";
import { ActivityCard } from "@/components/ActivityCard";
import { KameraIcon } from "@/components/Icons";
import { useStore } from "@/lib/store";
import { templateMeta } from "@/lib/templates";

/**
 * Aktivitas yang dibuat dari peramban ini. Tanpa akun, daftar ini hanya
 * catatan tautan sunting di localStorage — bukan data server.
 */
export function MyActivities() {
  const mine = useStore((s) => s.mine);
  const baruId = useStore((s) => s.mine[0]?.editSlug);

  // Kosong berarti peramban ini belum pernah membuat apa pun — di halaman depan
  // bagian bertuliskan "0 aktivitas" cuma mengganggu, dan ajakan membuat soal
  // sudah ada di hero. Store sengaja tidak dihidrasi pada render pertama
  // (`skipHydration`), jadi menyembunyikannya di sini tidak membuat HTML server
  // dan klien berbeda.
  if (mine.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="m-0 font-display text-2xl font-bold">Aktivitas Saya</h2>
        <span className="rounded-full bg-fill-2 px-3 py-1 text-[13px] font-bold text-ink-2">
          {mine.length} aktivitas
        </span>
        <span className="text-[12.5px] text-dim">tersimpan di peramban ini</span>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-[18px]">
        {/* Kartu ajakan tetap di posisi pertama (FR-DB-3). */}
        <Link
          href="/buat"
          className="flex min-h-[230px] flex-col items-center justify-center gap-3 rounded-panel border-2 border-dashed border-line-hover bg-white/60 no-underline transition-colors hover:border-teal hover:bg-surface hover:no-underline"
        >
          <span className="grid h-13 w-13 place-items-center rounded-2xl bg-teal-light text-teal">
            <KameraIcon size={24} />
          </span>
          <span className="font-display text-[17px] font-bold text-ink">Buat dari Foto</span>
          <span className="text-[13px] text-ink-3">JPG · PNG · PDF · DOCX · Teks</span>
        </Link>

        {mine.map((m) => (
          <ActivityCard
            key={m.editSlug}
            kartu={{
              title: m.title,
              template: m.template,
              meta: `${templateMeta(m.template).label} · simpan tautannya baik-baik`,
              playSlug: m.playSlug,
              editSlug: m.editSlug,
              baru: m.editSlug === baruId,
            }}
          />
        ))}
      </div>

      {mine.length === 0 && (
        <p className="m-0 text-[13.5px] text-ink-3">
          Belum ada aktivitas dari peramban ini. Soal yang kamu buat akan muncul di sini —
          simpan juga tautan suntingnya, karena tanpa akun tautan itulah satu-satunya kunci.
        </p>
      )}
    </section>
  );
}
