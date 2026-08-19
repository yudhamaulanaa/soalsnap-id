"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { seedActivities } from "./seed";
import { validateQuestions } from "./ai/parser";
import type {
  Activity,
  Draft,
  Question,
  SourcePage,
  TemplateId,
  UploadFileRef,
} from "./types";
import { TIMER_DEFAULT, TIMER_KUIS_CEPAT } from "./types";

const KODE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function buatSlug(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += KODE[Math.floor(Math.random() * KODE.length)];
  return s;
}

function buatId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function soalKosong(sumber: Question["sumber"] = "manual"): Question {
  return {
    id: buatId("q"),
    type: "pg",
    q: "Soal baru — ketik pertanyaanmu di sini.",
    opts: ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
    correct: 0,
    conf: 100,
    sumber,
  };
}

interface State {
  activities: Activity[];
  draft: Draft | null;
  /** Aktivitas terakhir yang dipublikasikan — dipakai layar Bagikan. */
  lastActivityId: string | null;
  hydrated: boolean;
}

interface Actions {
  setHydrated: () => void;

  // — Alur unggah —
  mulaiUnggah: () => void;
  tambahFile: (files: UploadFileRef[]) => void;
  hapusFile: (id: string) => void;
  simpanHasilAI: (questions: Question[], sourcePages: SourcePage[]) => void;
  mulaiManual: () => void;

  // — Editor review —
  ubahSoal: (id: string, patch: Partial<Question>) => void;
  hapusSoal: (id: string) => void;
  tambahSoal: () => void;
  ubahModeEdit: (id: string | null) => void;

  // — Publikasi & dashboard —
  publikasikan: (template: TemplateId) => Activity | null;
  ubahAktivitas: (id: string, patch: Partial<Activity>) => void;
  catatSesiMain: (id: string) => void;
  buangTandaBaru: () => void;
}

export type Store = State & Actions;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      activities: seedActivities(),
      draft: null,
      lastActivityId: null,
      hydrated: false,

      setHydrated: () => set({ hydrated: true }),

      mulaiUnggah: () =>
        set((s) =>
          s.draft?.origin === "upload" && s.draft.questions.length === 0
            ? s
            : { draft: { origin: "upload", files: [], questions: [] } },
        ),

      tambahFile: (files) =>
        set((s) => {
          // Menambahkan file berarti meninggalkan jalur manual.
          const draft: Draft =
            s.draft && s.draft.origin === "upload"
              ? s.draft
              : { origin: "upload", files: [], questions: [] };
          const known = new Set(draft.files.map((f) => f.name));
          const baru = files.filter((f) => !known.has(f.name));
          return { draft: { ...draft, origin: "upload", files: [...draft.files, ...baru] } };
        }),

      hapusFile: (id) =>
        set((s) =>
          s.draft
            ? { draft: { ...s.draft, files: s.draft.files.filter((f) => f.id !== id) } }
            : s,
        ),

      simpanHasilAI: (questions, sourcePages) =>
        set((s) => ({
          draft: {
            origin: "upload",
            files: s.draft?.files ?? [],
            questions,
            sourcePages,
          },
        })),

      mulaiManual: () => {
        // Jalur manual membuka editor dengan satu soal kosong (FR-UP-6).
        const q = soalKosong();
        set({
          draft: { origin: "manual", files: [], questions: [q], editingId: q.id },
        });
      },

      ubahSoal: (id, patch) =>
        set((s) =>
          s.draft
            ? {
                draft: {
                  ...s.draft,
                  questions: s.draft.questions.map((q) =>
                    q.id === id ? { ...q, ...patch } : q,
                  ),
                },
              }
            : s,
        ),

      hapusSoal: (id) =>
        set((s) =>
          s.draft
            ? {
                draft: {
                  ...s.draft,
                  questions: s.draft.questions.filter((q) => q.id !== id),
                  editingId: s.draft.editingId === id ? null : s.draft.editingId,
                },
              }
            : s,
        ),

      // Soal baru langsung terbuka dalam mode edit (FR-RV-7).
      tambahSoal: () => {
        const q = soalKosong(get().draft?.origin ?? "manual");
        set((s) =>
          s.draft
            ? {
                draft: {
                  ...s.draft,
                  questions: [...s.draft.questions, q],
                  editingId: q.id,
                },
              }
            : s,
        );
      },

      ubahModeEdit: (id) => set((s) => (s.draft ? { draft: { ...s.draft, editingId: id } } : s)),

      publikasikan: (template) => {
        const draft = get().draft;
        if (!draft || draft.questions.length === 0) return null;

        const activity: Activity = {
          id: buatId("act"),
          slug: buatSlug(),
          title: judulUsulan(draft.questions),
          template,
          acak: false,
          timerOn: true,
          timerDetik: template === "cepat" ? TIMER_KUIS_CEPAT : TIMER_DEFAULT,
          status: "published",
          plays: 0,
          questions: validateQuestions(draft.questions),
          createdAt: Date.now(),
          fresh: true,
          sourcePages: draft.sourcePages,
        };

        set((s) => ({
          activities: [activity, ...s.activities.map((a) => ({ ...a, fresh: false }))],
          lastActivityId: activity.id,
          draft: null,
        }));
        return activity;
      },

      ubahAktivitas: (id, patch) =>
        set((s) => ({
          activities: s.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),

      catatSesiMain: (id) =>
        set((s) => ({
          activities: s.activities.map((a) => (a.id === id ? { ...a, plays: a.plays + 1 } : a)),
        })),

      buangTandaBaru: () =>
        set((s) => ({ activities: s.activities.map((a) => ({ ...a, fresh: false })) })),
    }),
    {
      name: "soalsnap-v1",
      storage: createJSONStorage(() => localStorage),
      // Render pertama di klien harus sama dengan HTML dari server; rehidrasi
      // dijalankan manual oleh <StoreHydration /> setelah mount.
      skipHydration: true,
      partialize: ({ activities, draft, lastActivityId }) => ({
        activities,
        draft,
        lastActivityId,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

/** Judul awal diusulkan dari isi soal (FR-SH-1). */
function judulUsulan(questions: Question[]): string {
  const first = questions[0]?.q ?? "";
  const kata = first
    .replace(/[…_]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 4)
    .join(" ");
  return kata ? `Latihan: ${kata}` : "Latihan baru";
}

export const useActivities = () => useStore((s) => s.activities);

export function useActivity(id: string | null | undefined): Activity | undefined {
  return useStore((s) => s.activities.find((a) => a.id === id));
}

export function useActivityBySlug(slug: string): Activity | undefined {
  return useStore((s) => s.activities.find((a) => a.slug === slug));
}
