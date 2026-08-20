"use client";

import Link from "next/link";
import { StatusAkun } from "./auth/StatusAkun";
import { KameraIcon, TambahIcon } from "./Icons";

const LANGKAH = ["Unggah", "Review AI", "Template", "Bagikan"];

interface Props {
  /** Indeks langkah aktif; `undefined` di Dashboard (design.md §3). */
  step?: 0 | 1 | 2 | 3;
}

export function AppHeader({ step }: Props) {
  const inFlow = step !== undefined;

  return (
    // Tinggi 64px sudah termasuk garis bawah (border-box), sama seperti desain.
    <header className="sticky top-0 z-50 h-16 border-b border-line bg-surface">
      {/* Isi header melebar penuh dengan padding 24px, seperti berkas desain. */}
      <div className="flex h-full items-center gap-4 px-6">
        <Link href="/" className="flex items-center gap-2.5 no-underline hover:no-underline">
          <span className="grid h-[34px] w-[34px] place-items-center rounded-[11px] bg-teal text-surface">
            <KameraIcon size={18} />
          </span>
          <span className="font-display text-[21px] font-extrabold text-ink">
            Soal<span className="text-teal">Snap</span>
          </span>
        </Link>

        <div className="flex flex-1 justify-center">
          {inFlow && <StepIndicator active={step} />}
        </div>

        {inFlow ? (
          <Link
            href="/dashboard"
            className="rounded-full border border-line px-[18px] py-[9px] text-sm font-semibold text-ink-3 no-underline transition-colors hover:border-line-hover hover:text-ink hover:no-underline"
          >
            Keluar
          </Link>
        ) : (
          <>
            <Link
              href="/kumpulan"
              className="rounded-full px-3 py-2 text-sm font-semibold text-ink-2 no-underline transition-colors hover:text-teal hover:no-underline"
            >
              Kumpulan soal
            </Link>
            <StatusAkun />
          </>
        )}

        {!inFlow && (
          <Link
            href="/buat"
            className="flex items-center gap-2 rounded-full bg-teal px-5 py-[11px] font-display text-[15px] font-bold text-surface no-underline transition-colors hover:bg-teal-dark hover:text-surface hover:no-underline"
          >
            <TambahIcon size={16} />
            Buat dari Foto
          </Link>
        )}
      </div>
    </header>
  );
}

function StepIndicator({ active }: { active: number }) {
  return (
    <ol className="m-0 hidden list-none items-center gap-2 p-0 md:flex">
      {LANGKAH.map((label, i) => {
        const done = i < active;
        const isActive = i === active;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full font-display text-xs font-bold ${
                done || isActive ? "bg-teal text-surface" : "bg-fill-2 text-dim"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span
              className={`text-[13px] ${
                isActive ? "font-bold text-ink" : "font-semibold text-dim"
              }`}
            >
              {label}
            </span>
            {i < LANGKAH.length - 1 && (
              <span
                className={`h-0.5 w-6 rounded-sm ${done ? "bg-teal" : "bg-fill-2"}`}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
