"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { CentangIcon, MainIcon, PensilIcon } from "@/components/Icons";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { KategoriPicker } from "@/components/KategoriPicker";
import { QrCode } from "@/components/QrCode";
import { Switch } from "@/components/Switch";
import { kabarKontak, type Kabar } from "@/lib/email/kabar";
import { tautanEdit, tautanMain } from "@/lib/format";
import { templateCount, templateLabel } from "@/lib/templates";
import { useActivity, type HasilSimpan } from "@/lib/useActivity";
import { TIMER_MAX, TIMER_MIN } from "@/lib/types";

/** Page 06 — Bagikan. */
export default function BagikanPage() {
  return (
    <Suspense fallback={<AppHeader step={3} />}>
      <BagikanIsi />
    </Suspense>
  );
}

function BagikanIsi() {
  const editSlug = useSearchParams().get("edit") ?? "";
  const { activity, status, pesan, simpan } = useActivity(editSlug);

  if (!editSlug || status === "hilang") {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader step={3} />
        <main className="mx-auto flex w-full max-w-[620px] flex-col items-center gap-4 px-6 pt-20 text-center">
          <h1 className="m-0 font-display text-2xl font-bold">Aktivitas tidak ditemukan</h1>
          <p className="m-0 text-[15px] text-ink-3">
            Tautannya mungkin salah ketik atau aktivitasnya sudah dihapus.
          </p>
          <Link
            href="/"
            className="rounded-full bg-teal px-7 py-3.5 font-display text-base font-bold text-surface no-underline hover:text-surface hover:no-underline"
          >
            Ke Dashboard
          </Link>
        </main>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader step={3} />
        <main className="mx-auto w-full max-w-[620px] px-6 pt-20 text-center text-[15px] text-ink-3">
          Memuat aktivitas…
        </main>
      </div>
    );
  }

  const urlMain = tautanMain(activity.playSlug);
  const urlEdit = tautanEdit(editSlug);
  const jumlah = templateCount(activity.template, activity.questions);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader step={3} />

      <main className="mx-auto grid w-full max-w-[1020px] grid-cols-1 items-start gap-7 px-6 pb-20 pt-11 lg:grid-cols-[1.25fr_.75fr]">
        <section className="flex animate-popin flex-col gap-5 rounded-hero border border-line bg-surface p-9">
          <div className="flex items-center gap-4">
            <span className="grid h-[54px] w-[54px] shrink-0 place-items-center rounded-full bg-teal-light text-teal">
              <CentangIcon size={26} />
            </span>
            <div>
              <h1 className="m-0 font-display text-[26px] font-extrabold">
                Aktivitas siap dibagikan!
              </h1>
              <p className="m-0 mt-0.5 text-sm text-ink-3">
                Template: <strong className="text-teal-dark">{templateLabel(activity.template)}</strong>{" "}
                · {jumlah} soal · siswa main tanpa login
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="judul" className="text-[11px] font-bold tracking-[.08em] text-dim">
              JUDUL AKTIVITAS
            </label>
            <input
              id="judul"
              value={activity.title}
              onChange={(e) => simpan({ title: e.target.value })}
              className="w-full rounded-xl border-[1.5px] border-line px-4 py-3 font-display text-[19px] font-bold text-ink outline-none focus:border-teal"
            />
          </div>

          {/* Dua tautan: satu untuk peserta, satu untuk pemilik soal. */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold tracking-[.08em] text-dim">
              TAUTAN SISWA — bagikan ini
            </span>
            <div className="flex gap-2.5">
              <div className="flex-1 truncate rounded-xl bg-app px-4 py-[13px] text-[15px] font-semibold text-teal-dark">
                {urlMain}
              </div>
              <CopyLinkButton url={urlMain} label="Salin" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold tracking-[.08em] text-warn-fg">
              TAUTAN EDIT — simpan, jangan dibagikan
            </span>
            <div className="flex gap-2.5">
              <div className="flex-1 truncate rounded-xl bg-warn-bg px-4 py-[13px] text-[13.5px] font-semibold text-warn-fg">
                {urlEdit}
              </div>
              <CopyLinkButton url={urlEdit} label="Salin" />
            </div>
            <p className="m-0 text-[12.5px] text-dim">
              Tanpa akun, tautan inilah satu-satunya kunci untuk mengubah soal ini nanti.
            </p>
          </div>

          <div className="flex flex-col gap-3.5 border-t border-line-soft pt-5">
            <div className="flex items-center gap-3.5">
              <Switch
                on={activity.acak}
                onToggle={() => simpan({ acak: !activity.acak })}
                label="Acak urutan soal"
              />
              <div>
                <div className="text-[14.5px] font-semibold">Acak urutan soal</div>
                <div className="text-[12.5px] text-dim">Tiap siswa mendapat urutan berbeda</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <Switch
                on={activity.timerOn}
                onToggle={() => simpan({ timerOn: !activity.timerOn })}
                label="Timer per soal"
              />
              <div className="flex-1">
                <div className="text-[14.5px] font-semibold">
                  Timer per soal ({activity.timerDetik} detik)
                </div>
                <div className="text-[12.5px] text-dim">Waktu habis dihitung salah</div>
              </div>
            </div>

            {activity.timerOn && (
              <label className="flex items-center gap-3 pl-[60px] text-xs font-semibold text-ink-3">
                {TIMER_MIN} dtk
                <input
                  type="range"
                  min={TIMER_MIN}
                  max={TIMER_MAX}
                  step={1}
                  value={activity.timerDetik}
                  onChange={(e) => simpan({ timerDetik: Number(e.target.value) })}
                  aria-label="Durasi timer per soal"
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-fill-3 accent-teal"
                />
                {TIMER_MAX} dtk
              </label>
            )}
          </div>

          <KategoriPicker
            visibility={activity.visibility}
            kelas={activity.kelas}
            mapel={activity.mapel}
            onChange={simpan}
          />

          <KontakForm
            awal={activity.creator ?? null}
            onSimpan={(creator) => simpan({ creator })}
          />

          <div className="flex flex-wrap gap-3 border-t border-line-soft pt-5">
            <Link
              href={`/main/${activity.playSlug}?pratinjau=1`}
              className="flex flex-1 items-center justify-center gap-2.5 rounded-[14px] bg-ai px-4 py-[15px] font-display text-base font-bold text-surface no-underline transition-all hover:-translate-y-0.5 hover:bg-ai-hover hover:text-surface hover:no-underline"
            >
              <MainIcon size={16} />
              Coba Mainkan — Pratinjau Siswa
            </Link>
            <Link
              href={`/edit/${editSlug}`}
              className="flex items-center gap-2 rounded-[14px] border-[1.5px] border-line px-[22px] py-[15px] text-sm font-semibold text-ink-2 no-underline transition-colors hover:border-line-hover hover:text-ink-2 hover:no-underline"
            >
              <PensilIcon size={15} />
              Kelola soal
            </Link>
          </div>

          <p className="m-0 text-right text-xs font-semibold text-dim" role="status">
            {status === "menyimpan" ? "Menyimpan…" : status === "gagal" ? (pesan ?? "Gagal menyimpan") : "Tersimpan"}
          </p>
        </section>

        <aside className="top-[88px] flex flex-col gap-4 lg:sticky">
          <div className="flex flex-col gap-3 rounded-3xl bg-forest p-5">
            <div className="text-[11px] font-bold tracking-[.08em] text-mint-dim">
              TAMPILAN SISWA
            </div>
            <StudentPreview
              total={jumlah}
              soal={activity.questions[0]?.q ?? "Soal pertama akan tampil di sini"}
            />
          </div>

          <div className="flex items-center gap-4 rounded-panel border border-line bg-surface p-5">
            <QrCode url={urlMain} />
            <div>
              <div className="text-[14.5px] font-bold">Pindai untuk main</div>
              <div className="mt-0.5 text-[12.5px] text-dim">
                Tampilkan QR ini di proyektor kelas
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function KontakForm({
  awal,
  onSimpan,
}: {
  awal: { name: string | null; email: string | null; phone: string | null } | null;
  onSimpan: (creator: {
    name?: string;
    email?: string;
    phone?: string;
  }) => Promise<HasilSimpan | undefined>;
}) {
  const [name, setName] = useState(awal?.name ?? "");
  const [email, setEmail] = useState(awal?.email ?? "");
  const [phone, setPhone] = useState(awal?.phone ?? "");
  const [mengirim, setMengirim] = useState(false);
  const [kabar, setKabar] = useState<Kabar | null>(null);

  const input =
    "w-full rounded-xl border-[1.5px] border-line px-4 py-2.5 text-[15px] outline-none focus:border-teal";

  return (
    <form
      className="flex flex-col gap-3 border-t border-line-soft pt-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (mengirim) return;
        setMengirim(true);
        setKabar(null);
        const hasil = await onSimpan({ name, email, phone });
        setMengirim(false);
        setKabar(
          kabarKontak({ tersimpan: Boolean(hasil), email, notifikasi: hasil?.notifikasi }),
        );
      }}
    >
      <div>
        <div className="text-[14.5px] font-semibold">Kirimkan tautannya ke saya</div>
        <div className="text-[12.5px] text-dim">
          Supaya tautan edit tidak hilang. Email &amp; telepon opsional.
        </div>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama"
          aria-label="Nama pembuat"
          className={input}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (opsional)"
          aria-label="Email pembuat"
          className={input}
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Telepon (opsional)"
          aria-label="Telepon pembuat"
          className={input}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={mengirim}
          className="rounded-full bg-teal px-6 py-2.5 font-display text-sm font-bold text-surface transition-colors hover:bg-teal-dark disabled:cursor-not-allowed disabled:bg-dim"
        >
          {mengirim ? "Mengirim…" : "Simpan kontak"}
        </button>
        {kabar && (
          <span
            role="status"
            className={`text-[13px] font-semibold ${kabar.baik ? "text-teal-dark" : "text-warn-fg"}`}
          >
            {kabar.teks}
          </span>
        )}
      </div>
    </form>
  );
}

function StudentPreview({ total, soal }: { total: number; soal: string }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-ai-light px-2.5 py-[3px] text-[10px] font-bold text-ai">
          SOAL 1/{total}
        </span>
        <span className="text-[10px] font-bold text-dim">SKOR 0</span>
      </div>
      <div className="h-[5px] rounded-full bg-fill-3">
        <div className="h-full w-[70%] rounded-full bg-mint" />
      </div>
      <p className="m-0 line-clamp-2 font-display text-[13px] font-bold leading-[1.4]">{soal}</p>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="h-6 rounded-[7px] border-[1.5px] border-line" />
        <div className="h-6 rounded-[7px] border-[1.5px] border-teal bg-teal-light" />
        <div className="h-6 rounded-[7px] border-[1.5px] border-line" />
        <div className="h-6 rounded-[7px] border-[1.5px] border-line" />
      </div>
    </div>
  );
}
