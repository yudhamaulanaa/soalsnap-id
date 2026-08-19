"use client";

import Link from "next/link";
import { tautanMain } from "@/lib/format";
import { templateMeta } from "@/lib/templates";
import type { TemplateId } from "@/lib/types";
import { CopyLinkButton } from "./CopyLinkButton";

export interface KartuAktivitas {
  title: string;
  template: TemplateId;
  meta: string;
  playSlug: string;
  /** Bila ada, kartu menampilkan tombol "Kelola" ke tautan sunting. */
  editSlug?: string;
  /** Menandai aktivitas yang baru saja dibuat (FR-DB-4). */
  baru?: boolean;
  /** Label kategori pada band kartu katalog. */
  kategori?: string | null;
}

export function ActivityCard({ kartu }: { kartu: KartuAktivitas }) {
  const meta = templateMeta(kartu.template);

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-panel bg-surface transition-shadow hover:shadow-card-hover ${
        kartu.baru ? "animate-popin border-2 border-teal" : "border border-line"
      }`}
    >
      <div
        className="relative grid h-[86px] place-items-center gap-1"
        style={{ background: meta.band }}
      >
        {kartu.baru && (
          <span className="absolute left-3 top-2.5 rounded-full bg-teal px-2.5 py-[3px] text-[11px] font-bold text-surface">
            BARU
          </span>
        )}
        <span
          className={`rounded-full bg-surface px-3.5 py-[5px] text-xs font-bold ${
            kartu.baru ? "text-teal" : "text-ink-2"
          }`}
        >
          {meta.label}
        </span>
        {kartu.kategori && (
          <span className="text-[11px] font-bold text-ink-2 opacity-75">{kartu.kategori}</span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="m-0 text-base font-bold">{kartu.title}</h3>
        <p className="m-0 text-[13px] text-ink-3">{kartu.meta}</p>

        <div className="mt-auto flex gap-2 pt-3">
          <Link
            href={`/main/${kartu.playSlug}`}
            className={`flex-1 rounded-[10px] py-[9px] text-center text-[13px] font-bold no-underline transition-colors ${
              kartu.baru
                ? "bg-teal text-surface hover:bg-teal-dark hover:text-surface"
                : "bg-fill text-forest hover:text-forest"
            } hover:no-underline`}
          >
            Mainkan
          </Link>
          {kartu.editSlug ? (
            <Link
              href={`/edit/${kartu.editSlug}`}
              className="flex-1 rounded-[10px] border border-line py-[9px] text-center text-[13px] font-semibold text-ink-2 no-underline transition-colors hover:border-line-hover hover:text-ink-2 hover:no-underline"
            >
              Kelola
            </Link>
          ) : (
            <CopyLinkButton url={tautanMain(kartu.playSlug)} />
          )}
        </div>
      </div>
    </article>
  );
}
