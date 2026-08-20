import "server-only";
import type {
  ActivityModel as ActivityRow,
  PlaySessionModel as SessionRow,
  QuestionModel as QuestionRow,
} from "@/generated/prisma/models";
import { TEMPLATES } from "./templates";
import type {
  Activity,
  PlaySession,
  Question,
  QType,
  TemplateId,
  Visibility,
} from "./types";

/** Baris database → objek domain yang dipakai seluruh aplikasi. */

const TEMPLATE_IDS = new Set(TEMPLATES.map((t) => t.id as string));

export function templateOf(v: string): TemplateId {
  return (TEMPLATE_IDS.has(v) ? v : "kuis") as TemplateId;
}

function typeOf(v: string): QType {
  return v === "pg" || v === "bs" || v === "isian" ? v : "isian";
}

export function soalDari(row: QuestionRow): Question {
  let opts: string[] | undefined;
  if (row.opts) {
    try {
      const parsed: unknown = JSON.parse(row.opts);
      if (Array.isArray(parsed)) opts = parsed.map(String);
    } catch {
      // Baris rusak tidak boleh menjatuhkan seluruh aktivitas.
      opts = undefined;
    }
  }
  return {
    id: row.id,
    type: typeOf(row.type),
    q: row.q,
    opts,
    correct: row.correct ?? undefined,
    key: row.kunci ?? undefined,
    gambar: row.gambar ?? undefined,
    gambarAlt: row.gambarAlt ?? undefined,
    conf: row.conf,
    low: row.low,
    note: row.note ?? undefined,
    clue: row.clue ?? undefined,
    page: row.page ?? undefined,
    sumber: row.sumber === "upload" ? "upload" : "manual",
  };
}

type BarisLengkap = ActivityRow & { questions: QuestionRow[] };

export function aktivitasDari(
  row: BarisLengkap,
  opsi: { sertakanEditSlug?: boolean } = {},
): Activity {
  return {
    id: row.id,
    // Tautan sunting hanya disertakan bila pemanggil memang mengaksesnya
    // lewat tautan itu.
    editSlug: opsi.sertakanEditSlug ? row.editSlug : undefined,
    playSlug: row.playSlug,
    title: row.title,
    template: templateOf(row.template),
    acak: row.acak,
    timerOn: row.timerOn,
    timerDetik: row.timerDetik,
    visibility: (row.visibility === "public" ? "public" : "private") as Visibility,
    kelas: row.kelas,
    mapel: row.mapel,
    plays: row.plays,
    questions: row.questions.map(soalDari),
    createdAt: row.createdAt.getTime(),
    creator: opsi.sertakanEditSlug
      ? { name: row.creatorName, email: row.creatorEmail, phone: row.creatorPhone }
      : undefined,
  };
}

export function sesiDari(row: SessionRow): PlaySession {
  return {
    id: row.id,
    playerName: row.playerName,
    score: row.score,
    total: row.total,
    mode: row.mode,
    createdAt: row.createdAt.getTime(),
  };
}

/** Objek domain → kolom database untuk penulisan soal. */
export function soalKeBaris(q: Question, urutan: number) {
  return {
    urutan,
    type: q.type,
    q: q.q,
    opts: q.opts ? JSON.stringify(q.opts) : null,
    correct: q.correct ?? null,
    kunci: q.key ?? null,
    gambar: q.gambar ?? null,
    gambarAlt: q.gambarAlt ?? null,
    conf: q.conf,
    low: q.low ?? false,
    note: q.note ?? null,
    clue: q.clue ?? null,
    page: q.page ?? null,
    sumber: q.sumber,
  };
}
