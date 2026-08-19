/**
 * Kertas dengan garis pindai — "menunggu diberi bentuk" (design.md §4).
 * Satu-satunya animasi berulang di aplikasi.
 */
export function ScanPaper() {
  const baris: Array<[string, "line" | "head" | "hl"]> = [
    ["65%", "head"],
    ["95%", "line"],
    ["88%", "line"],
    ["92%", "hl"],
    ["55%", "line"],
    ["90%", "line"],
    ["78%", "hl"],
    ["85%", "line"],
    ["70%", "hl"],
  ];

  return (
    <div
      className="relative flex h-[200px] w-[150px] flex-col gap-[9px] overflow-hidden rounded-xl border border-paper-edge bg-paper p-4"
      aria-hidden="true"
    >
      {baris.map(([w, tone], i) => (
        <div
          key={i}
          className="rounded-sm"
          style={{
            width: w,
            height: tone === "head" ? 8 : 6,
            background:
              tone === "head"
                ? "var(--color-paper-head)"
                : tone === "hl"
                  ? "var(--color-paper-hl-2)"
                  : "var(--color-paper-line)",
          }}
        />
      ))}
      <div className="absolute inset-x-2 h-[3px] animate-scanline rounded-sm bg-teal shadow-[0_0_14px_rgba(14,138,123,.8)]" />
    </div>
  );
}
