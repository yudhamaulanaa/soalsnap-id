"use client";

import { useRef, useState, type ChangeEvent, type DragEvent, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { DokumenIcon, PanahKananIcon, PensilIcon, SilangIcon, UnggahIcon } from "@/components/Icons";
import { formatUkuran } from "@/lib/format";
import { useStore } from "@/lib/store";
import { unggahBerkas } from "@/lib/unggah/klien";
import { MAX_FILE_MB, MAX_PAGES_PER_UPLOAD, type UploadFileRef } from "@/lib/types";

const TERIMA = ".jpg,.jpeg,.png,.pdf,.docx,image/*,application/pdf";

function kindOf(name: string): UploadFileRef["kind"] {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "docx" || ext === "doc") return "docx";
  if (ext === "txt") return "text";
  return "image";
}

/** Page 02 — Unggah. */
export default function UnggahPage() {
  const router = useRouter();
  const draft = useStore((s) => s.draft);
  const tambahFile = useStore((s) => s.tambahFile);
  const hapusFile = useStore((s) => s.hapusFile);
  const catatUnggahan = useStore((s) => s.catatUnggahan);
  const mulaiManual = useStore((s) => s.mulaiManual);

  const files = draft?.origin === "upload" ? draft.files : [];
  const [error, setError] = useState<string | null>(null);
  const [tempelTerbuka, setTempelTerbuka] = useState(false);
  const [teks, setTeks] = useState("");
  const [seret, setSeret] = useState(false);
  const [mengunggah, setMengunggah] = useState(false);
  const [kemajuan, setKemajuan] = useState<Record<string, number>>({});

  const inputFile = useRef<HTMLInputElement>(null);
  const inputKamera = useRef<HTMLInputElement>(null);

  /**
   * Isi berkasnya hanya hidup selama halaman ini terbuka — daftar di store
   * ikut tersimpan di localStorage, sedangkan objek File tidak bisa.
   */
  const isiBerkas = useRef(new Map<string, File>());

  function terimaFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const masuk: UploadFileRef[] = [];
    const tolak: string[] = [];

    for (const f of Array.from(list)) {
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        tolak.push(`${f.name} melebihi ${MAX_FILE_MB} MB`);
        continue;
      }
      const id = `${f.name}-${f.size}-${f.lastModified}`;
      isiBerkas.current.set(id, f);
      masuk.push({
        id,
        name: f.name,
        size: formatUkuran(f.size),
        kind: kindOf(f.name),
        pages: 1,
      });
    }

    const totalHalaman =
      files.reduce((n, f) => n + f.pages, 0) + masuk.reduce((n, f) => n + f.pages, 0);
    if (totalHalaman > MAX_PAGES_PER_UPLOAD) {
      setError(`Satu unggahan maksimal ${MAX_PAGES_PER_UPLOAD} halaman.`);
      return;
    }

    setError(tolak.length ? `${tolak.join(" · ")}. Maksimal ${MAX_FILE_MB} MB per file.` : null);
    if (masuk.length) tambahFile(masuk);
  }

  function simpanTeks() {
    const isi = teks.trim();
    if (!isi) return;
    const baris = isi.split("\n").filter(Boolean).length;
    const id = `teks-${Date.now()}`;
    // Teks tempelan diperlakukan sama seperti berkas lain supaya ikut terunggah.
    isiBerkas.current.set(id, new File([isi], "soal-tempel.txt", { type: "text/plain" }));
    tambahFile([
      {
        id,
        name: "soal-tempel.txt",
        size: `teks · ${baris} baris`,
        kind: "text",
        pages: 1,
      },
    ]);
    setTeks("");
    setTempelTerbuka(false);
    setError(null);
  }

  async function prosesDenganAI() {
    if (mengunggah) return;

    const daftar = files.map((f) => ({ id: f.id, file: isiBerkas.current.get(f.id) }));
    const hilang = daftar.filter((d) => !d.file);
    if (hilang.length > 0) {
      setError("Berkasnya perlu dipilih ulang — isinya tidak ikut tersimpan saat halaman dimuat ulang.");
      return;
    }

    setMengunggah(true);
    setError(null);
    setKemajuan({});
    try {
      const { token } = await unggahBerkas(
        daftar.map((d) => ({ id: d.id, file: d.file! })),
        { onKemajuan: (id, persen) => setKemajuan((k) => ({ ...k, [id]: persen })) },
      );
      catatUnggahan(token);
      router.push("/buat/proses");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah berkas");
      setMengunggah(false);
    }
  }

  /** FR-UP-7: klik kontrol di dalam dropzone tidak boleh membuka pemilih file. */
  const tahan = (fn: () => void) => (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    fn();
  };

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setSeret(false);
    terimaFiles(e.dataTransfer.files);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader step={0} />

      <main className="mx-auto flex w-full max-w-[740px] flex-col gap-[22px] px-6 pb-[72px] pt-10">
        <div>
          <h1 className="m-0 mb-1.5 font-display text-[32px] font-extrabold">Unggah soal</h1>
          <p className="m-0 text-[15px] leading-[1.55] text-ink-3">
            Foto buku, lembar kerja, PDF, atau dokumen — beberapa halaman sekaligus juga bisa.
          </p>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => inputFile.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputFile.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setSeret(true);
          }}
          onDragLeave={() => setSeret(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center gap-3 rounded-[22px] border-2 border-dashed px-6 py-11 text-center transition-colors ${
            seret ? "border-teal bg-tint" : "border-line-hover bg-surface hover:border-teal hover:bg-tint"
          }`}
        >
          <span className="grid h-15 w-15 place-items-center rounded-[18px] bg-teal-light text-teal">
            <UnggahIcon size={28} />
          </span>
          <div className="font-display text-[19px] font-bold">Seret &amp; letakkan file di sini</div>
          <div className="text-sm text-ink-3">atau pilih salah satu cara di bawah</div>

          <div className="mt-1 flex flex-wrap justify-center gap-2.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                inputFile.current?.click();
              }}
              className="rounded-full bg-teal px-[22px] py-[11px] font-display text-sm font-bold text-surface transition-colors hover:bg-teal-dark"
            >
              Pilih File
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                inputKamera.current?.click();
              }}
              className="rounded-full border-[1.5px] border-fill-4 px-5 py-[11px] text-sm font-semibold text-ink-2 transition-colors hover:border-teal hover:text-teal"
            >
              Ambil Foto
            </button>
            <button
              type="button"
              onClick={tahan(() => setTempelTerbuka((v) => !v))}
              className="rounded-full border-[1.5px] border-fill-4 px-5 py-[11px] text-sm font-semibold text-ink-2 transition-colors hover:border-teal hover:text-teal"
            >
              Tempel Teks
            </button>
          </div>

          <div className="mt-2.5 flex w-full max-w-[320px] items-center gap-2.5">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs font-semibold text-dim-2">atau</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          {/* Jalur manual melewati unggah sepenuhnya (FR-UP-6). */}
          <button
            type="button"
            onClick={tahan(() => {
              mulaiManual();
              router.push("/buat/review");
            })}
            className="flex items-center gap-2 rounded-full border-[1.5px] border-fill-4 px-5 py-[11px] text-sm font-semibold text-ink-2 transition-colors hover:border-ai hover:text-ai"
          >
            <PensilIcon size={15} />
            Ketik soal manual tanpa upload
          </button>

          <div className="mt-2 flex gap-1.5">
            {["JPG", "PNG", "PDF", "DOCX"].map((f) => (
              <span
                key={f}
                className="rounded-md bg-fill px-[9px] py-[3px] text-[11px] font-bold text-ink-3"
              >
                {f}
              </span>
            ))}
          </div>

          <input
            ref={inputFile}
            type="file"
            multiple
            accept={TERIMA}
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              terimaFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={inputKamera}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              terimaFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {tempelTerbuka && (
          <div className="flex animate-popin-fast flex-col gap-2.5 rounded-card border border-line bg-surface p-4">
            <label htmlFor="tempel" className="text-[11px] font-bold tracking-[.08em] text-dim">
              TEMPEL TEKS SOAL
            </label>
            <textarea
              id="tempel"
              value={teks}
              onChange={(e) => setTeks(e.target.value)}
              rows={6}
              placeholder={"1. Proses fotosintesis berlangsung di …\na. Akar\nb. Daun"}
              className="w-full resize-y rounded-xl border-[1.5px] border-line px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-teal"
            />
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setTempelTerbuka(false)}
                className="rounded-full border-[1.5px] border-line px-5 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:border-line-hover"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={simpanTeks}
                disabled={!teks.trim()}
                className="rounded-full bg-teal px-5 py-2.5 font-display text-sm font-bold text-surface transition-colors hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                Tambahkan
              </button>
            </div>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="m-0 rounded-xl bg-wrong-bg px-4 py-3 text-sm font-semibold text-wrong-fg"
          >
            {error}
          </p>
        )}

        {files.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {files.map((f) => (
              <div
                key={f.id}
                className="flex animate-popin-fast items-center gap-3 rounded-card border border-line bg-surface px-4 py-3"
              >
                <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] bg-ai-light text-ai">
                  <DokumenIcon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{f.name}</div>
                  <div className="text-xs text-ink-3">{f.size}</div>
                </div>
                <span className="rounded-full bg-teal-light px-3 py-1 text-xs font-bold text-teal-dark">
                  {mengunggah ? `${kemajuan[f.id] ?? 0}%` : "Siap"}
                </span>
                {/* Menghapus baris tidak memicu aksi lain pada area unggah (FR-UP-3). */}
                <button
                  type="button"
                  aria-label={`Hapus ${f.name}`}
                  disabled={mengunggah}
                  onClick={(e) => {
                    e.stopPropagation();
                    isiBerkas.current.delete(f.id);
                    hapusFile(f.id);
                  }}
                  className="grid h-[30px] w-[30px] place-items-center rounded-lg text-dim-2 transition-colors hover:bg-wrong-bg hover:text-wrong"
                >
                  <SilangIcon size={15} />
                </button>
              </div>
            ))}

            <button
              type="button"
              disabled={mengunggah}
              onClick={prosesDenganAI}
              className="mt-1.5 flex items-center gap-2.5 self-end rounded-full bg-teal px-7 py-3.5 font-display text-base font-bold text-surface transition-all hover:-translate-y-0.5 hover:bg-teal-dark disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-dim"
            >
              {mengunggah ? "Mengunggah…" : `Proses ${files.length} file dengan AI`}
              <PanahKananIcon size={17} />
            </button>
          </div>
        )}

        <aside className="flex flex-col gap-2 rounded-2xl bg-ai-light px-5 py-[18px]">
          <div className="text-sm font-bold text-ai-dark">Tips hasil terbaik</div>
          <div className="text-[13.5px] leading-[1.6] text-ai-dark opacity-85">
            Pastikan teks terbaca jelas dan tidak terpotong · Kunci jawaban di dokumen ikut
            terdeteksi otomatis · Satu unggahan boleh berisi banyak nomor dan halaman
          </div>
        </aside>
      </main>
    </div>
  );
}
