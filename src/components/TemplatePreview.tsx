import type { TemplateId } from "@/lib/types";

/**
 * "Setiap kartu memakai pratinjau geometris yang menjelaskan mekanika
 * mainnya, bukan ikon dekoratif" (design.md §4).
 */
export function TemplatePreview({ id }: { id: TemplateId }) {
  return (
    <div
      className="grid h-28 place-items-center"
      style={{ background: BAND[id] }}
      aria-hidden="true"
    >
      {ISI[id]}
    </div>
  );
}

const BAND: Record<TemplateId, string> = {
  kuis: "var(--color-teal-light)",
  bs: "var(--color-ai-light)",
  isian: "var(--color-sand)",
  jodoh: "var(--color-teal-light)",
  flashcard: "var(--color-ai-light)",
  susun: "var(--color-sand)",
  cari: "var(--color-teal-light)",
  cepat: "var(--color-ai-light)",
};

const KUIS = (
  <div className="flex w-[120px] flex-col gap-1.5 rounded-[10px] bg-surface p-[9px] shadow-[0_4px_12px_rgba(24,36,32,.08)]">
    <div className="h-[7px] w-3/4 rounded-sm bg-ink opacity-80" />
    <div className="grid grid-cols-2 gap-1">
      <div className="h-[15px] rounded-[5px] border-[1.5px] border-line" />
      <div className="h-[15px] rounded-[5px] bg-teal" />
      <div className="h-[15px] rounded-[5px] border-[1.5px] border-line" />
      <div className="h-[15px] rounded-[5px] border-[1.5px] border-line" />
    </div>
  </div>
);

const BS = (
  <div className="flex items-center justify-center gap-2.5">
    <div className="grid h-11 w-12 -rotate-[4deg] place-items-center rounded-xl bg-teal font-display text-xl font-extrabold text-surface shadow-[0_6px_14px_rgba(14,138,123,.35)]">
      B
    </div>
    <div className="grid h-11 w-12 rotate-[4deg] place-items-center rounded-xl bg-wrong font-display text-xl font-extrabold text-surface shadow-[0_6px_14px_rgba(214,69,69,.35)]">
      S
    </div>
  </div>
);

const ISIAN = (
  <div className="flex w-[130px] items-center gap-[5px] rounded-[10px] bg-surface px-2.5 py-3 shadow-[0_4px_12px_rgba(24,36,32,.08)]">
    <div className="h-[7px] w-[34px] rounded-sm bg-dim" />
    <div className="h-5 w-11 rounded-md border-[1.5px] border-dashed border-teal bg-tint-2" />
    <div className="h-[7px] w-[26px] rounded-sm bg-dim" />
  </div>
);

const JODOH = (
  <div className="flex items-center justify-center gap-[22px]">
    <div className="flex flex-col gap-2">
      <Bar color="var(--color-teal)" />
      <Bar color="var(--color-ai)" />
      <Bar color="var(--color-amber)" />
    </div>
    <div className="flex flex-col gap-2">
      <Bar color="var(--color-ai)" faded />
      <Bar color="var(--color-amber)" faded />
      <Bar color="var(--color-teal)" faded />
    </div>
  </div>
);

const FLASHCARD = (
  <div className="relative h-16 w-[90px]">
    <div className="absolute inset-0 -rotate-[7deg] rounded-[10px] bg-ai-soft" />
    <div className="absolute inset-0 -rotate-[2deg] rounded-[10px] bg-ai-mid" />
    <div className="absolute inset-0 grid rotate-[3deg] place-items-center rounded-[10px] bg-surface shadow-[0_6px_14px_rgba(24,36,32,.15)]">
      <div className="h-[7px] w-[50px] rounded-sm bg-ai" />
    </div>
  </div>
);

const SUSUN = (
  <div className="flex items-center justify-center gap-1.5">
    {[
      ["T", "-rotate-[5deg]", false],
      ["A", "rotate-[3deg]", false],
      ["K", "-rotate-[2deg]", true],
      ["A", "rotate-[6deg]", false],
    ].map(([ch, rot, aktif], i) => (
      <div
        key={i}
        className={`grid h-[30px] w-[30px] place-items-center rounded-lg font-display font-extrabold shadow-[0_4px_10px_rgba(24,36,32,.12)] ${rot} ${
          aktif ? "bg-amber text-surface" : "bg-surface text-amber-dark"
        }`}
      >
        {ch}
      </div>
    ))}
  </div>
);

const CARI = (
  <div className="grid grid-cols-[repeat(4,18px)] gap-[3px] rounded-[10px] bg-surface p-2 text-center text-[10px] font-bold text-ink-2 shadow-[0_4px_12px_rgba(24,36,32,.08)]">
    {["K", "D", "R", "M", "P", "A", "A", "E", "S", "L", "G", "U", "B", "O", "T", "I"].map(
      (ch, i) => (
        <span
          key={i}
          className={`leading-[18px] ${
            i === 1 || i === 6 || i === 11 ? "rounded bg-teal text-surface" : ""
          }`}
        >
          {ch}
        </span>
      ),
    )}
  </div>
);

const CEPAT = (
  <div className="flex items-center justify-center gap-3">
    <div className="relative h-[46px] w-[46px] rounded-full border-4 border-ai bg-surface">
      <div className="absolute left-1/2 top-1/2 h-3.5 w-[3px] origin-bottom -translate-x-1/2 -translate-y-full rotate-[40deg] rounded-sm bg-ai" />
    </div>
    <div className="flex flex-col gap-[5px]">
      <div className="h-[9px] w-[52px] rounded-[5px] bg-ai" />
      <div className="h-[9px] w-[38px] rounded-[5px] bg-ai-mid" />
      <div className="h-[9px] w-6 rounded-[5px] bg-ai-soft" />
    </div>
  </div>
);

const ISI: Record<TemplateId, React.ReactNode> = {
  kuis: KUIS,
  bs: BS,
  isian: ISIAN,
  jodoh: JODOH,
  flashcard: FLASHCARD,
  susun: SUSUN,
  cari: CARI,
  cepat: CEPAT,
};

function Bar({ color, faded }: { color: string; faded?: boolean }) {
  return (
    <div
      className="h-3.5 w-11 rounded-[7px]"
      style={{ background: color, opacity: faded ? 0.45 : 1 }}
    />
  );
}
