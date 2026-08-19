"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "./store";
import type { Activity, PlaySession, Question, Visibility } from "./types";

export interface UbahAktivitas {
  title?: string;
  acak?: boolean;
  timerOn?: boolean;
  timerDetik?: number;
  visibility?: Visibility;
  kelas?: string | null;
  mapel?: string | null;
  questions?: Question[];
  creator?: { name?: string; email?: string; phone?: string };
}

type Status = "memuat" | "siap" | "menyimpan" | "hilang" | "gagal";

/**
 * Memuat aktivitas lewat tautan sunting dan menyimpan perubahannya.
 * Tautan sunting itu sendiri yang menjadi izin akses — tidak ada sesi login.
 */
export function useActivity(editSlug: string) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [sessions, setSessions] = useState<PlaySession[]>([]);
  const [status, setStatus] = useState<Status>("memuat");
  const [pesan, setPesan] = useState<string | null>(null);
  const perbaruiMilikku = useStore((s) => s.perbaruiMilikku);
  const antre = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    let batal = false;
    fetch(`/api/activities/${editSlug}`)
      .then(async (res) => {
        const data = await res.json();
        if (batal) return;
        if (res.status === 404) {
          setStatus("hilang");
          return;
        }
        if (!res.ok) throw new Error(data.error ?? "Gagal memuat");
        setActivity(data.activity);
        setSessions(data.sessions ?? []);
        setStatus("siap");
      })
      .catch((e: unknown) => {
        if (batal) return;
        setPesan(e instanceof Error ? e.message : "Gagal memuat");
        setStatus("gagal");
      });
    return () => {
      batal = true;
    };
  }, [editSlug]);

  const simpan = useCallback(
    (patch: UbahAktivitas) => {
      // Tampilkan perubahan seketika, lalu kirim ke server berurutan agar
      // dua penyuntingan cepat tidak saling mendahului.
      setActivity((a) => {
        if (!a) return a;
        const { creator, questions, ...sisa } = patch;
        return {
          ...a,
          ...sisa,
          questions: questions ?? a.questions,
          creator: creator
            ? {
                name: creator.name ?? a.creator?.name ?? null,
                email: creator.email ?? a.creator?.email ?? null,
                phone: creator.phone ?? a.creator?.phone ?? null,
              }
            : a.creator,
        };
      });
      setStatus("menyimpan");
      setPesan(null);

      antre.current = antre.current
        .then(() =>
          fetch(`/api/activities/${editSlug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          }),
        )
        .then(async (res) => {
          const data = await (res as Response).json();
          if (!(res as Response).ok) throw new Error(data.error ?? "Gagal menyimpan");
          setActivity(data.activity);
          setStatus("siap");
          if (patch.title) perbaruiMilikku(editSlug, { title: data.activity.title });
        })
        .catch((e: unknown) => {
          setPesan(e instanceof Error ? e.message : "Gagal menyimpan");
          setStatus("gagal");
        });
      return antre.current;
    },
    [editSlug, perbaruiMilikku],
  );

  return { activity, sessions, status, pesan, simpan };
}
