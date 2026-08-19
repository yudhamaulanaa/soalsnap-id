/** Lencana status moderasi satu aktivitas. */
export function StatusBadge({ publik, diturunkan }: { publik: boolean; diturunkan: boolean }) {
  if (diturunkan) {
    return (
      <span className="rounded-full bg-wrong-bg px-2.5 py-1 text-[12px] font-bold text-wrong-fg">
        Diturunkan
      </span>
    );
  }
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${
        publik ? "bg-teal-light text-teal-dark" : "bg-fill-2 text-ink-3"
      }`}
    >
      {publik ? "Publik" : "Privat"}
    </span>
  );
}
