"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PlayShell } from "@/components/play/PlayShell";
import { useStore } from "@/lib/store";
import { eligibility } from "@/lib/templates";

/**
 * Halaman main siswa — dibuka lewat tautan publik, tanpa autentikasi
 * (FR-SH-6, PRD §7).
 */
export default function MainPage() {
  return (
    <Suspense fallback={<Pesan judul="Memuat latihan…" />}>
      <MainIsi />
    </Suspense>
  );
}

function MainIsi() {
  const { slug } = useParams<{ slug: string }>();
  const pratinjau = useSearchParams().get("pratinjau") === "1";
  const hydrated = useStore((s) => s.hydrated);
  const activity = useStore((s) => s.activities.find((a) => a.slug === slug));

  if (!activity) {
    // Sebelum store direhidrasi, aktivitas buatan pengguna belum terbaca.
    if (!hydrated) return <Pesan judul="Memuat latihan…" />;
    return (
      <Pesan
        judul="Latihan tidak ditemukan"
        isi="Tautannya mungkin salah ketik atau aktivitasnya sudah dihapus."
      />
    );
  }

  if (activity.questions.length === 0) {
    return <Pesan judul="Latihan ini belum punya soal" isi="Minta pembuatnya menambahkan soal." />;
  }

  const syarat = eligibility(activity.template, activity.questions);
  if (!syarat.ok) {
    return <Pesan judul="Latihan belum bisa dimainkan" isi={syarat.reason} />;
  }

  return <PlayShell activity={activity} pratinjau={pratinjau} />;
}

function Pesan({ judul, isi }: { judul: string; isi?: string }) {
  return (
    <div
      data-surface="dark"
      className="grid min-h-screen place-items-center px-6"
      style={{
        background:
          "radial-gradient(800px 500px at 85% -10%, rgba(109,90,230,.4), transparent 60%), var(--color-forest)",
      }}
    >
      <div className="flex max-w-[420px] flex-col items-center gap-3 rounded-[28px] bg-surface px-10 py-12 text-center">
        <h1 className="m-0 font-display text-[26px] font-extrabold">{judul}</h1>
        {isi && <p className="m-0 text-[15px] text-ink-3">{isi}</p>}
        <Link
          href="/"
          className="mt-3 rounded-full bg-teal px-7 py-3.5 font-display text-[15px] font-bold text-surface no-underline hover:text-surface hover:no-underline"
        >
          Ke Dashboard
        </Link>
      </div>
    </div>
  );
}
