import { formatTanggal } from "@/lib/format";
import type { PlaySession } from "@/lib/types";

/** Rekap hasil peserta — hanya terlihat lewat tautan sunting. */
export function RekapPeserta({ sessions }: { sessions: PlaySession[] }) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col gap-1.5 rounded-panel border border-line bg-surface p-5">
        <span className="text-[11px] font-bold tracking-[.08em] text-dim">HASIL PESERTA</span>
        <p className="m-0 text-[13.5px] text-ink-3">
          Belum ada yang mengerjakan. Hasil akan muncul di sini begitu tautan siswa dimainkan.
        </p>
      </div>
    );
  }

  const rata =
    sessions.reduce((n, s) => n + (s.total ? s.score / s.total : 0), 0) / sessions.length;

  return (
    <div className="flex flex-col gap-3 rounded-panel border border-line bg-surface p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-bold tracking-[.08em] text-dim">HASIL PESERTA</span>
        <span className="text-[12.5px] font-semibold text-ink-2">
          {sessions.length} peserta · rata-rata {Math.round(rata * 100)}%
        </span>
      </div>

      <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
        {sessions.map((s, i) => (
          <li key={s.id} className="flex items-center gap-2.5 text-[13.5px]">
            <span className="w-5 shrink-0 text-right font-display font-bold text-dim">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 truncate font-semibold">
              {s.playerName || "Anonim"}
            </span>
            <span className="shrink-0 text-[11.5px] text-dim">{formatTanggal(s.createdAt)}</span>
            <span className="shrink-0 rounded-full bg-teal-light px-2.5 py-1 font-display text-[12.5px] font-bold text-teal-dark">
              {s.score}/{s.total}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
