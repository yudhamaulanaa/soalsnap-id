import { labelStatusJob } from "@/lib/laporan";

const WARNA: Record<string, string> = {
  menyusun: "bg-fill-2 text-ink-3",
  antre: "bg-warn-bg text-warn-fg",
  diproses: "bg-ai-light text-ai-dark",
  terbaca: "bg-teal-light text-teal-dark",
  gagal: "bg-wrong-bg text-wrong-fg",
};

/** Lencana status satu job pembacaan dokumen. */
export function StatusJob({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${WARNA[status] ?? "bg-fill-2 text-ink-3"}`}
    >
      {labelStatusJob(status)}
    </span>
  );
}
