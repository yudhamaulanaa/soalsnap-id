"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { PlayShell } from "@/components/play/PlayShell";
import { MainIcon } from "@/components/Icons";
import { TombolLapor } from "@/components/TombolLapor";
import { eligibility, templateCount, templateLabel } from "@/lib/templates";
import type { Activity } from "@/lib/types";

/**
 * Halaman peserta — dibuka lewat tautan publik, tanpa autentikasi
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
  const { playSlug } = useParams<{ playSlug: string }>();
  const pratinjau = useSearchParams().get("pratinjau") === "1";

  const [activity, setActivity] = useState<Activity | null>(null);
  const [status, setStatus] = useState<"memuat" | "siap" | "hilang" | "gagal">("memuat");
  const [nama, setNama] = useState("");
  const [mulai, setMulai] = useState(false);

  useEffect(() => {
    let batal = false;
    fetch(`/api/play/${playSlug}`)
      .then(async (res) => {
        const data = await res.json();
        if (batal) return;
        if (res.status === 404) return setStatus("hilang");
        if (!res.ok) return setStatus("gagal");
        setActivity(data.activity);
        setStatus("siap");
      })
      .catch(() => {
        if (!batal) setStatus("gagal");
      });
    return () => {
      batal = true;
    };
  }, [playSlug]);

  if (status === "memuat") return <Pesan judul="Memuat latihan…" />;
  if (status === "hilang") {
    return (
      <Pesan
        judul="Latihan tidak ditemukan"
        isi="Tautannya mungkin salah ketik atau latihannya sudah dihapus."
      />
    );
  }
  if (status === "gagal" || !activity) {
    return <Pesan judul="Gagal memuat latihan" isi="Coba muat ulang halaman ini." />;
  }
  if (activity.questions.length === 0) {
    return <Pesan judul="Latihan ini belum punya soal" isi="Minta pembuatnya menambahkan soal." />;
  }

  const syarat = eligibility(activity.template, activity.questions);
  if (!syarat.ok) return <Pesan judul="Latihan belum bisa dimainkan" isi={syarat.reason} />;

  if (!mulai) {
    return (
      <Sambutan
        activity={activity}
        nama={nama}
        onNama={setNama}
        onMulai={() => setMulai(true)}
        pratinjau={pratinjau}
      />
    );
  }

  return <PlayShell activity={activity} playerName={nama.trim()} pratinjau={pratinjau} />;
}

/** Layar sambutan: nama peserta opsional, lalu mulai (tanpa login). */
function Sambutan({
  activity,
  nama,
  onNama,
  onMulai,
  pratinjau,
}: {
  activity: Activity;
  nama: string;
  onNama: (v: string) => void;
  onMulai: () => void;
  pratinjau: boolean;
}) {
  const jumlah = templateCount(activity.template, activity.questions);

  return (
    <Latar>
      <div className="flex w-full flex-col items-center gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onMulai();
          }}
          className="flex w-full max-w-[520px] animate-popin flex-col items-center gap-4 rounded-[28px] bg-surface px-9 py-11 text-center"
        >
          <span className="rounded-full bg-ai-light px-3.5 py-[5px] text-xs font-bold text-ai-dark">
            {templateLabel(activity.template)} · {jumlah} soal
          </span>
          <h1 className="m-0 font-display text-[28px] font-extrabold leading-[1.2] text-pretty">
            {activity.title}
          </h1>
          <p className="m-0 text-[15px] text-ink-3">
            Tulis namamu supaya nilaimu muncul di papan skor — boleh juga dikosongkan.
          </p>

          <input
            value={nama}
            onChange={(e) => onNama(e.target.value)}
            maxLength={60}
            placeholder="Nama kamu (opsional)"
            aria-label="Nama peserta"
            className="w-full rounded-[14px] border-2 border-line px-[18px] py-[15px] text-center text-[17px] font-semibold outline-none focus:border-teal"
          />

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2.5 rounded-[14px] bg-teal px-6 py-[15px] font-display text-base font-bold text-surface transition-colors hover:bg-teal-dark"
          >
            <MainIcon size={16} />
            {nama.trim() ? "Mulai mengerjakan" : "Mulai sebagai Anonim"}
          </button>

          {pratinjau && (
            <p className="m-0 text-[12.5px] font-semibold text-dim">
              Mode pratinjau — hasilmu tidak akan tercatat.
            </p>
          )}
        </form>

        {/* Siapa pun yang melihat soal ini bisa menandainya untuk ditinjau admin. */}
        <TombolLapor playSlug={activity.playSlug} />
      </div>
    </Latar>
  );
}

function Pesan({ judul, isi }: { judul: string; isi?: string }) {
  return (
    <Latar>
      <div className="flex max-w-[420px] flex-col items-center gap-3 rounded-[28px] bg-surface px-10 py-12 text-center">
        <h1 className="m-0 font-display text-[26px] font-extrabold">{judul}</h1>
        {isi && <p className="m-0 text-[15px] text-ink-3">{isi}</p>}
        <Link
          href="/kumpulan"
          className="mt-3 rounded-full bg-teal px-7 py-3.5 font-display text-[15px] font-bold text-surface no-underline hover:text-surface hover:no-underline"
        >
          Lihat kumpulan soal
        </Link>
      </div>
    </Latar>
  );
}

function Latar({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-surface="dark"
      className="grid min-h-screen place-items-center px-6 py-10"
      style={{
        background:
          "radial-gradient(800px 500px at 85% -10%, rgba(109,90,230,.4), transparent 60%), var(--color-forest)",
      }}
    >
      {children}
    </div>
  );
}
