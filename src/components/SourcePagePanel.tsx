import type { SourcePage } from "@/lib/types";

/**
 * "Sumber unggahan di kiri sebagai bukti asal" (design.md §4).
 * Pratinjau halaman digambar geometris — file mentahnya tidak dirender.
 */
export function SourcePagePanel({ pages }: { pages: SourcePage[] }) {
  if (pages.length === 0) return null;

  return (
    <aside className="top-[88px] flex flex-col gap-3 lg:sticky">
      <h2 className="m-0 text-[11px] font-bold tracking-[.08em] text-dim">
        SUMBER UNGGAHAN
      </h2>
      {pages.map((p, i) => (
        <div
          key={p.page}
          className={`flex flex-col gap-1.5 rounded-card bg-surface p-3.5 ${
            i === 0 ? "border-2 border-teal" : "border border-line"
          }`}
        >
          {(i === 0
            ? ["60%", "95%", "88%", "92%", "70%", "90%", "82%"]
            : ["90%", "75%", "88%", "65%", "80%"]
          ).map((w, j) => (
            <div
              key={j}
              className="rounded-sm"
              style={{
                width: w,
                height: i === 0 && j === 0 ? 7 : 5,
                background:
                  i === 0 && j === 0
                    ? "var(--color-paper-head)"
                    : j % 2 === (i === 0 ? 0 : 1)
                      ? "var(--color-paper-mute)"
                      : "var(--color-paper-mute-2)",
              }}
              aria-hidden="true"
            />
          ))}
          <p className="m-0 mt-1.5 text-xs font-semibold text-ink-2">
            hal {p.page} · {p.count} soal
          </p>
        </div>
      ))}
    </aside>
  );
}
