"use client";

import Link from "next/link";
import { activityMeta, tautanPenuh } from "@/lib/format";
import { templateMeta } from "@/lib/templates";
import type { Activity } from "@/lib/types";
import { CopyLinkButton } from "./CopyLinkButton";

export function ActivityCard({ activity }: { activity: Activity }) {
  const meta = templateMeta(activity.template);
  const baru = activity.fresh;

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-panel bg-surface transition-shadow hover:shadow-card-hover ${
        baru ? "animate-popin border-2 border-teal" : "border border-line"
      }`}
    >
      <div
        className="relative grid h-[86px] place-items-center"
        style={{ background: meta.band }}
      >
        {baru && (
          <span className="absolute left-3 top-2.5 rounded-full bg-teal px-2.5 py-[3px] text-[11px] font-bold text-surface">
            BARU
          </span>
        )}
        <span
          className={`rounded-full bg-surface px-3.5 py-[5px] text-xs font-bold ${
            baru ? "text-teal" : "text-ink-2"
          }`}
        >
          {meta.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="m-0 text-base font-bold">{activity.title}</h3>
        <p className="m-0 text-[13px] text-ink-3">{activityMeta(activity)}</p>

        <div className="mt-auto flex gap-2 pt-3">
          <Link
            href={`/main/${activity.slug}`}
            className={`flex-1 rounded-[10px] py-[9px] text-center text-[13px] font-bold no-underline transition-colors ${
              baru
                ? "bg-teal text-surface hover:bg-teal-dark hover:text-surface"
                : "bg-fill text-forest hover:text-forest"
            } hover:no-underline`}
          >
            Mainkan
          </Link>
          {baru ? (
            <Link
              href={`/buat/bagikan?id=${activity.id}`}
              className="flex-1 rounded-[10px] border border-line py-[9px] text-center text-[13px] font-semibold text-ink-2 no-underline transition-colors hover:border-line-hover hover:text-ink-2 hover:no-underline"
            >
              Bagikan
            </Link>
          ) : (
            <CopyLinkButton url={tautanPenuh(activity.slug)} />
          )}
        </div>
      </div>
    </article>
  );
}
