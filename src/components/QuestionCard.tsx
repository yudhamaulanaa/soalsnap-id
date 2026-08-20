"use client";

import { EditorGambar } from "./EditorGambar";
import { GambarSoal } from "./GambarSoal";
import { SampahIcon } from "./Icons";
import type { Question } from "@/lib/types";

const BADGE: Record<Question["type"], string> = {
  pg: "Pilihan Ganda",
  bs: "Benar / Salah",
  isian: "Isian",
};

interface Props {
  question: Question;
  no: number;
  editing: boolean;
  onToggleEdit: () => void;
  onChange: (patch: Partial<Question>) => void;
  onDelete: () => void;
}

/** Kartu soal pada layar Review (UIKit.md §4, FR-RV-1 … FR-RV-6). */
export function QuestionCard({
  question: q,
  no,
  editing,
  onToggleEdit,
  onChange,
  onDelete,
}: Props) {
  const isIsian = q.type === "isian";

  function setOpsi(i: number, teks: string) {
    const opts = [...(q.opts ?? [])];
    opts[i] = teks;
    onChange({ opts });
  }

  return (
    <article
      className={`rounded-[18px] p-5 ${
        q.low ? "border-[1.5px] border-risk-line bg-risk-bg" : "border border-line bg-surface"
      }`}
    >
      <header className="flex flex-wrap items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-[9px] bg-teal-light font-display text-sm font-bold text-teal-dark">
          {no}
        </span>
        <span className="rounded-full bg-ai-light px-3 py-1 text-xs font-bold text-ai-dark">
          {BADGE[q.type]}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            q.low ? "bg-warn-bg text-warn-fg" : "bg-teal-light text-teal-dark"
          }`}
        >
          {q.low ? `Periksa · ${q.conf}%` : `${q.conf}% yakin`}
        </span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={onToggleEdit}
          className="rounded-lg border border-line px-3.5 py-1.5 text-[12.5px] font-semibold text-ink-2 transition-colors hover:border-teal hover:text-teal"
        >
          {editing ? "Selesai" : "Edit"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Hapus soal"
          aria-label={`Hapus soal nomor ${no}`}
          className="grid place-items-center rounded-lg p-1.5 text-dim-2 transition-colors hover:bg-wrong-bg hover:text-wrong"
        >
          <SampahIcon size={16} />
        </button>
      </header>

      {editing ? (
        <textarea
          value={q.q}
          onChange={(e) => onChange({ q: e.target.value })}
          aria-label={`Teks soal nomor ${no}`}
          // rows=1 agar tinggi ditentukan `min-height` 64px seperti desain,
          // bukan tinggi dua baris bawaan textarea.
          rows={1}
          // `block` menghilangkan celah baseline bawaan elemen inline.
          className="mt-3 block min-h-16 w-full resize-y rounded-[10px] border-[1.5px] border-teal px-3 py-2.5 text-[15px] leading-[1.5] outline-none"
        />
      ) : (
        <p className="m-0 mt-3 text-base font-semibold leading-[1.5] text-pretty">{q.q}</p>
      )}

      {editing ? (
        <EditorGambar gambar={q.gambar} gambarAlt={q.gambarAlt} nomor={no} onChange={onChange} />
      ) : (
        q.gambar && <GambarSoal kunci={q.gambar} alt={q.gambarAlt} className="mt-3" />
      )}

      {!isIsian && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(q.opts ?? []).map((o, i) => {
            const kunci = i === q.correct;
            const prefix = q.type === "pg" ? `${"ABCD"[i] ?? ""}.  ` : "";
            return editing ? (
              // Kotak mode edit dibuat setinggi kotak baca agar tinggi kartu
              // tidak berubah saat masuk/keluar mode edit.
              <div
                key={i}
                className={`flex items-center gap-2 rounded-[11px] border-[1.5px] px-3.5 py-[11px] text-sm font-semibold ${
                  kunci
                    ? "border-teal bg-teal-light text-teal-dark"
                    : "border-line bg-surface text-ink-2"
                }`}
              >
                {/* FR-RV-4: menandai kunci melepas kunci sebelumnya. */}
                <button
                  type="button"
                  onClick={() => onChange({ correct: i })}
                  title="Jadikan kunci jawaban"
                  aria-label={`Jadikan opsi ${i + 1} kunci jawaban`}
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[10px] leading-none ${
                    kunci ? "bg-teal text-surface" : "bg-fill-2 text-dim"
                  }`}
                >
                  ✓
                </button>
                <input
                  value={o}
                  onChange={(e) => setOpsi(i, e.target.value)}
                  aria-label={`Opsi ${i + 1}`}
                  className="w-full bg-transparent p-0 text-sm font-semibold text-inherit outline-none"
                />
              </div>
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => onChange({ correct: i })}
                title="Klik untuk jadikan kunci jawaban"
                className={`rounded-[11px] border-[1.5px] px-3.5 py-[11px] text-left text-sm font-semibold transition-all ${
                  kunci
                    ? "border-teal bg-teal-light text-teal-dark"
                    : "border-line bg-surface text-ink-2 hover:border-line-hover"
                }`}
              >
                {kunci ? "✓  " : ""}
                {prefix}
                {o}
              </button>
            );
          })}
        </div>
      )}

      {isIsian && (
        <div className="mt-3 flex items-center gap-2.5">
          <label
            htmlFor={`kunci-${q.id}`}
            className="text-[13px] font-semibold text-ink-3"
          >
            Kunci jawaban:
          </label>
          <input
            id={`kunci-${q.id}`}
            value={q.key ?? ""}
            onChange={(e) => onChange({ key: e.target.value })}
            className="w-40 rounded-[9px] border-[1.5px] border-transparent bg-teal-light px-3 py-[7px] text-sm font-bold text-teal-dark outline-none focus:border-teal"
          />
        </div>
      )}

      {q.low && (
        <p className="m-0 mt-3 rounded-[10px] bg-warn-bg px-[14px] py-[9px] text-[13px] font-semibold text-warn-fg">
          {q.note ??
            "Foto agak buram di nomor ini — pastikan kunci jawabannya sudah benar."}
        </p>
      )}
    </article>
  );
}
