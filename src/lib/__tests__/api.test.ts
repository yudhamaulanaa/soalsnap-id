import { describe, expect, it } from "vitest";
import { buatEditSlug, buatPlaySlug } from "../slug";
import {
  buatAktivitasSchema,
  katalogQuerySchema,
  kontakSchema,
  sesiSchema,
  ubahAktivitasSchema,
} from "../validasi";
import { kelasValid, mapelValid } from "../kategori";

const soalContoh = {
  type: "pg" as const,
  q: "Ibu kota Indonesia?",
  opts: ["Jakarta", "Bandung"],
  correct: 0,
  conf: 90,
  sumber: "manual" as const,
};

describe("tautan rahasia", () => {
  it("tautan sunting jauh lebih panjang daripada tautan peserta", () => {
    expect(buatPlaySlug()).toHaveLength(6);
    expect(buatEditSlug()).toHaveLength(22);
  });

  it("tidak memakai huruf yang mudah tertukar", () => {
    const contoh = Array.from({ length: 50 }, () => buatEditSlug()).join("");
    expect(contoh).not.toMatch(/[IO01]/);
  });

  it("tidak berulang pada seratus pembuatan", () => {
    const set = new Set(Array.from({ length: 100 }, () => buatEditSlug()));
    expect(set.size).toBe(100);
  });
});

describe("validasi pembuatan aktivitas", () => {
  const dasar = {
    template: "kuis",
    acak: false,
    timerOn: true,
    timerDetik: 20,
    visibility: "private" as const,
    kelas: null,
    mapel: null,
    questions: [soalContoh],
  };

  it("menerima payload yang benar", () => {
    expect(buatAktivitasSchema.safeParse(dasar).success).toBe(true);
  });

  it("menolak aktivitas tanpa soal", () => {
    expect(
      buatAktivitasSchema.safeParse({ ...dasar, questions: [] }).success,
    ).toBe(false);
  });

  it("menolak template yang tidak dikenal", () => {
    expect(
      buatAktivitasSchema.safeParse({ ...dasar, template: "teka-teki" })
        .success,
    ).toBe(false);
  });

  it("menolak timer di luar 5–60 detik", () => {
    expect(
      buatAktivitasSchema.safeParse({ ...dasar, timerDetik: 90 }).success,
    ).toBe(false);
    expect(
      buatAktivitasSchema.safeParse({ ...dasar, timerDetik: 3 }).success,
    ).toBe(false);
  });

  it("menolak kategori di luar daftar", () => {
    expect(
      buatAktivitasSchema.safeParse({ ...dasar, kelas: "Kelas 99" }).success,
    ).toBe(false);
    expect(
      buatAktivitasSchema.safeParse({ ...dasar, mapel: "Sihir" }).success,
    ).toBe(false);
  });

  it("membiarkan seluruh field kosong pada penyuntingan sebagian", () => {
    expect(ubahAktivitasSchema.safeParse({ title: "Judul baru" }).success).toBe(
      true,
    );
    expect(ubahAktivitasSchema.safeParse({}).success).toBe(true);
  });

  it("menerima pilihan jawaban berupa gambar", () => {
    const bergambar = {
      ...soalContoh,
      opts: [
        { gambar: "soal/a.webp", gambarAlt: "segitiga" },
        { teks: "Lingkaran", gambar: "soal/b.webp" },
        "Bujur sangkar",
      ],
    };
    expect(
      buatAktivitasSchema.safeParse({ ...dasar, questions: [bergambar] })
        .success,
    ).toBe(true);
  });

  it("menolak kunci gambar pilihan di luar ruang namanya", () => {
    // Pilihan datang dari klien sama seperti gambar soal, jadi kuncinya
    // diperiksa — bukan sekadar panjangnya.
    for (const jahat of [
      "unggahan/rahasia.pdf",
      "soal/../rahasia.webp",
      "/etc/passwd",
    ]) {
      const soal = { ...soalContoh, opts: [{ gambar: jahat }, "Lingkaran"] };
      expect(
        buatAktivitasSchema.safeParse({ ...dasar, questions: [soal] }).success,
      ).toBe(false);
    }
  });
});

describe("kontak pembuat", () => {
  it("menerima kontak kosong — memang opsional", () => {
    expect(kontakSchema.safeParse({}).success).toBe(true);
    expect(
      kontakSchema.safeParse({ name: "Bu Sinta", email: "" }).success,
    ).toBe(true);
  });

  it("menolak email yang jelas salah bentuk", () => {
    expect(kontakSchema.safeParse({ email: "bukan-email" }).success).toBe(
      false,
    );
  });
});

describe("penyimpanan hasil peserta", () => {
  it("menerima nama kosong sebagai anonim", () => {
    expect(sesiSchema.safeParse({ score: 3, total: 5 }).success).toBe(true);
  });

  it("menolak skor negatif", () => {
    expect(sesiSchema.safeParse({ score: -1, total: 5 }).success).toBe(false);
  });

  it("menolak mode yang tidak dikenal", () => {
    expect(
      sesiSchema.safeParse({ score: 1, total: 5, mode: "catur" }).success,
    ).toBe(false);
  });
});

describe("filter katalog", () => {
  it("mengabaikan halaman tidak wajar dan memakai bawaan", () => {
    expect(katalogQuerySchema.safeParse({}).data?.halaman).toBe(1);
    expect(katalogQuerySchema.safeParse({ halaman: "0" }).success).toBe(false);
  });

  it("hanya menerima kategori dari daftar", () => {
    expect(kelasValid("Kelas 8")).toBe(true);
    expect(kelasValid("Kelas 13")).toBe(false);
    expect(mapelValid("IPA")).toBe(true);
    expect(mapelValid("Ramalan")).toBe(false);
  });
});
