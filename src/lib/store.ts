"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Draft, Question, SourcePage, TemplateId, UploadFileRef } from "./types";

/**
 * Tanpa akun pengguna, satu-satunya jejak kepemilikan adalah tautan sunting
 * yang disimpan di peramban pembuatnya. Draft yang belum tersimpan ke server
 * juga tinggal di sini.
 */

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

/** Catatan aktivitas yang dibuat dari peramban ini. */
export interface Milikku {
  editSlug: string;
  playSlug: string;
  title: string;
  template: TemplateId;
  createdAt: number;
}

interface State {
  draft: Draft | null;
  mine: Milikku[];
  hydrated: boolean;
}

interface Actions {
  setHydrated: () => void;

  // — Alur unggah —
  tambahFile: (files: UploadFileRef[]) => void;
  hapusFile: (id: string) => void;
  catatUnggahan: (token: string) => void;
  simpanHasilAI: (questions: Question[], sourcePages: SourcePage[]) => void;
  mulaiManual: () => void;
  buangDraft: () => void;

  // — Editor review —
  ubahSoal: (id: string, patch: Partial<Question>) => void;
  hapusSoal: (id: string) => void;
  tambahSoal: () => void;
  ubahModeEdit: (id: string | null) => void;

  // — Daftar milik peramban ini —
  catatMilikku: (entry: Milikku) => void;
  perbaruiMilikku: (editSlug: string, patch: Partial<Milikku>) => void;
  lupakanMilikku: (editSlug: string) => void;
}

export type Store = State & Actions;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      draft: null,
      mine: [],
      hydrated: false,

      setHydrated: () => set({ hydrated: true }),

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

      catatUnggahan: (token) =>
        set((s) => (s.draft ? { draft: { ...s.draft, token } } : s)),

      hapusFile: (id) =>
        set((s) =>
          s.draft
            ? { draft: { ...s.draft, files: s.draft.files.filter((f) => f.id !== id) } }
            : s,
        ),

      simpanHasilAI: (questions, sourcePages) =>
        set((s) => ({
          draft: { origin: "upload", files: s.draft?.files ?? [], questions, sourcePages },
        })),

      mulaiManual: () => {
        // Jalur manual membuka editor dengan satu soal kosong (FR-UP-6).
        const q = soalKosong();
        set({ draft: { origin: "manual", files: [], questions: [q], editingId: q.id } });
      },

      buangDraft: () => set({ draft: null }),

      ubahSoal: (id, patch) =>
        set((s) =>
          s.draft
            ? {
                draft: {
                  ...s.draft,
                  questions: s.draft.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
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
            ? { draft: { ...s.draft, questions: [...s.draft.questions, q], editingId: q.id } }
            : s,
        );
      },

      ubahModeEdit: (id) => set((s) => (s.draft ? { draft: { ...s.draft, editingId: id } } : s)),

      catatMilikku: (entry) =>
        set((s) => ({
          mine: [entry, ...s.mine.filter((m) => m.editSlug !== entry.editSlug)].slice(0, 60),
        })),

      perbaruiMilikku: (editSlug, patch) =>
        set((s) => ({
          mine: s.mine.map((m) => (m.editSlug === editSlug ? { ...m, ...patch } : m)),
        })),

      lupakanMilikku: (editSlug) =>
        set((s) => ({ mine: s.mine.filter((m) => m.editSlug !== editSlug) })),
    }),
    {
      name: "soalsnap-v2",
      storage: createJSONStorage(() => localStorage),
      // Render pertama di klien harus sama dengan HTML dari server; rehidrasi
      // dijalankan manual oleh <StoreHydration /> setelah mount.
      skipHydration: true,
      partialize: ({ draft, mine }) => ({ draft, mine }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
