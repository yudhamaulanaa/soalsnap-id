/**
 * Ilustrasi hero: lembar soal cetak → kartu kuis, dihubungkan panah ungu
 * (Page 01 Dashboard). Murni dekoratif.
 */
export function HeroArt() {
  return (
    <div
      className="relative h-[220px] w-[300px] shrink-0 animate-floaty"
      aria-hidden="true"
    >
      <div className="absolute left-0 top-[14px] flex h-[176px] w-[132px] -rotate-[5deg] flex-col gap-[7px] rounded-xl bg-paper p-3.5 shadow-[0_16px_36px_rgba(0,0,0,.3)]">
        <Baris w="70%" h={8} tone="head" />
        <Baris w="95%" />
        <Baris w="88%" />
        <Baris w="92%" tone="hl" />
        <Baris w="60%" />
        <Baris w="90%" />
        <Baris w="75%" tone="hl" />
        <Baris w="85%" />
      </div>

      <div className="absolute left-[118px] top-[86px] z-[2] grid h-11 w-11 place-items-center rounded-full bg-ai text-surface shadow-[0_8px_20px_rgba(109,90,230,.5)]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </div>

      <div className="absolute right-0 top-0 flex h-[190px] w-[150px] rotate-[4deg] flex-col gap-2 rounded-[14px] bg-surface p-3.5 shadow-[0_16px_36px_rgba(0,0,0,.3)]">
        <span className="self-start rounded-full bg-ai-light px-2 py-[3px] text-[9px] font-bold text-ai">
          KUIS · SOAL 1/8
        </span>
        <div className="h-2 w-[90%] rounded-sm bg-ink opacity-85" />
        <div className="h-2 w-[65%] rounded-sm bg-ink opacity-85" />
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          <div className="h-[26px] rounded-lg border-[1.5px] border-line" />
          <div className="h-[26px] rounded-lg bg-teal" />
          <div className="h-[26px] rounded-lg border-[1.5px] border-line" />
          <div className="h-[26px] rounded-lg border-[1.5px] border-line" />
        </div>
      </div>
    </div>
  );
}

function Baris({ w, h = 6, tone = "line" }: { w: string; h?: number; tone?: "line" | "head" | "hl" }) {
  const bg =
    tone === "head"
      ? "var(--color-paper-head)"
      : tone === "hl"
        ? "var(--color-paper-hl)"
        : "var(--color-paper-line)";
  return <div className="rounded-sm" style={{ width: w, height: h, background: bg }} />;
}
