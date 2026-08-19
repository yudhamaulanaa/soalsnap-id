"use client";

import Link from "next/link";
import { ActivityCard } from "@/components/ActivityCard";
import { AppHeader } from "@/components/AppHeader";
import { HeroArt } from "@/components/HeroArt";
import { KameraIcon } from "@/components/Icons";
import { useActivities } from "@/lib/store";

/** Page 01 — Dashboard. */
export default function DashboardPage() {
  const activities = useActivities();
  const urut = [...activities].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-[1160px] flex-col gap-8 px-6 pb-[72px] pt-9">
        <section className="relative flex flex-wrap items-center gap-10 overflow-hidden rounded-hero bg-forest p-12 text-surface">
          <div
            className="pointer-events-none absolute -right-[60px] -top-[120px] h-[380px] w-[380px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(109,90,230,.45), transparent 65%)",
            }}
            aria-hidden="true"
          />
          <div className="relative flex min-w-[300px] flex-1 flex-col gap-4">
            <span className="self-start rounded-full border border-white/20 bg-white/12 px-3.5 py-1.5 text-[13px] font-semibold text-mint-bright">
              Didukung AI — tanpa ketik manual
            </span>
            <h1 className="m-0 font-display text-[42px] font-extrabold leading-[1.1] text-pretty">
              Foto soalnya,
              <br />
              jadi latihannya.
            </h1>
            <p className="m-0 max-w-[440px] text-base leading-[1.6] text-mint-soft text-pretty">
              Unggah foto, PDF, atau dokumen soal — AI memecahnya menjadi latihan
              interaktif yang siap dimainkan siswa lewat satu tautan.
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Link
                href="/buat"
                className="flex items-center gap-2.5 rounded-full bg-surface px-[26px] py-3.5 font-display text-base font-bold text-forest no-underline transition-transform hover:-translate-y-0.5 hover:text-forest hover:no-underline"
              >
                <KameraIcon size={18} />
                Buat dari Foto
              </Link>
              <Link
                href={`/main/${urut[0]?.slug ?? "X7K2E9"}`}
                className="rounded-full border-[1.5px] border-white/35 px-6 py-3.5 text-[15px] font-semibold text-surface no-underline transition-colors hover:border-white hover:bg-white/8 hover:text-surface hover:no-underline"
              >
                Lihat contoh hasil
              </Link>
            </div>
          </div>
          <HeroArt />
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h2 className="m-0 font-display text-2xl font-bold">Aktivitas Saya</h2>
            <span className="rounded-full bg-fill-2 px-3 py-1 text-[13px] font-bold text-ink-2">
              {activities.length} aktivitas
            </span>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-[18px]">
            {/* Kartu ajakan selalu di posisi pertama (FR-DB-3). */}
            <Link
              href="/buat"
              className="flex min-h-[230px] flex-col items-center justify-center gap-3 rounded-panel border-2 border-dashed border-line-hover bg-white/60 no-underline transition-colors hover:border-teal hover:bg-surface hover:no-underline"
            >
              <span className="grid h-13 w-13 place-items-center rounded-2xl bg-teal-light text-teal">
                <KameraIcon size={24} />
              </span>
              <span className="font-display text-[17px] font-bold text-ink">
                Buat dari Foto
              </span>
              <span className="text-[13px] text-ink-3">JPG · PNG · PDF · DOCX · Teks</span>
            </Link>

            {urut.map((a) => (
              <ActivityCard key={a.id} activity={a} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
