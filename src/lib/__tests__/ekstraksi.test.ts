import { describe, expect, it } from "vitest";
import {
  bboxSah,
  gabungBbox,
  keKotakPiksel,
  rapikanBbox,
} from "../ekstraksi/bbox";
import { gabungkan } from "../ekstraksi/gabung";
import { kunciPotonganSoal, kunciRenderHalaman } from "../ekstraksi/kunci";
import { keQuestion } from "../ekstraksi/keSoal";
import { uraiEkstraksi, type PageExtractionWire } from "../ekstraksi/skema";
import { periksaSoal } from "../ekstraksi/tinjau";

const kotak = { x: 0.1, y: 0.2, width: 0.5, height: 0.3 };

describe("bbox ternormalisasi", () => {
  it("menerima kotak yang wajar", () => {
    expect(bboxSah(kotak)).toBe(true);
    expect(bboxSah({ x: 0, y: 0, width: 1, height: 1 })).toBe(true);
  });

  it("menolak lebar atau tinggi yang tidak positif", () => {
    expect(bboxSah({ ...kotak, width: 0 })).toBe(false);
    expect(bboxSah({ ...kotak, height: -0.1 })).toBe(false);
  });

  it("menolak koordinat negatif dan bukan angka", () => {
    expect(bboxSah({ ...kotak, x: -0.2 })).toBe(false);
    expect(bboxSah({ ...kotak, y: Number.NaN })).toBe(false);
    expect(bboxSah({ ...kotak, width: Number.POSITIVE_INFINITY })).toBe(false);
  });

  it("memaafkan pergeseran kecil, menolak yang benar-benar meluber", () => {
    // 1.005 masih dalam toleransi pembulatan model.
    expect(bboxSah({ x: 0.5, y: 0, width: 0.505, height: 0.5 })).toBe(true);
    expect(bboxSah({ x: 0.5, y: 0, width: 0.7, height: 0.5 })).toBe(false);
  });

  it("merapikan pergeseran itu ke dalam 0..1", () => {
    const rapi = rapikanBbox({ x: 0.5, y: 0, width: 0.505, height: 0.5 });
    expect(rapi).not.toBeNull();
    expect(rapi!.x + rapi!.width).toBeLessThanOrEqual(1);
  });

  it("mengembalikan null untuk kotak yang tidak mungkin", () => {
    expect(rapikanBbox({ ...kotak, width: 0 })).toBeNull();
  });

  it("menggabungkan beberapa kotak menjadi kotak terkecil yang memuat semuanya", () => {
    const gabung = gabungBbox([
      { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
      { x: 0.5, y: 0.4, width: 0.2, height: 0.1 },
    ]);
    expect(gabung).toEqual({ x: 0.1, y: 0.1, width: 0.6, height: 0.4 });
  });

  it("mengabaikan kotak rusak saat menggabung", () => {
    const gabung = gabungBbox([kotak, { x: 0, y: 0, width: -1, height: 1 }]);
    expect(gabung).toEqual(kotak);
  });
});

describe("bbox ke piksel", () => {
  it("mengalikan dengan ukuran halaman", () => {
    expect(
      keKotakPiksel({ x: 0.5, y: 0.5, width: 0.25, height: 0.25 }, 1000, 800),
    ).toEqual({
      kiri: 500,
      atas: 400,
      kanan: 750,
      bawah: 600,
    });
  });

  it("melebarkan dengan padding tanpa keluar dari halaman", () => {
    const p = keKotakPiksel({ x: 0, y: 0, width: 1, height: 1 }, 100, 100, 16);
    expect(p).toEqual({ kiri: 0, atas: 0, kanan: 100, bawah: 100 });
  });

  it("menolak halaman tanpa ukuran", () => {
    expect(keKotakPiksel(kotak, 0, 100)).toBeNull();
  });
});

const halamanWire: PageExtractionWire = {
  page: 1,
  warnings: [],
  questions: [
    {
      temp_id: "q1",
      number: 1,
      question_type: "single_choice",
      question_bbox: { x: 0.1, y: 0.1, width: 0.8, height: 0.3 },
      stem: { text: "Ibu kota Indonesia?", bbox: null },
      assets: [],
      options: [
        {
          key: "A",
          text: "Jakarta",
          content_type: "text",
          bbox: null,
          assets: [],
        },
        {
          key: "B",
          text: "Bandung",
          content_type: "text",
          bbox: null,
          assets: [],
        },
      ],
      correct_answer: ["A"],
      continues_from_previous: false,
      continues_to_next: false,
      confidence: 0.95,
      needs_review: false,
      review_reasons: [],
      full_crop_key: "soal/potongan1.webp",
    },
  ],
};

describe("penguraian keluaran model", () => {
  it("menerima keluaran yang sesuai skema", () => {
    const hasil = uraiEkstraksi(halamanWire);
    expect(hasil.ok).toBe(true);
    expect(hasil.ok && hasil.halaman.soal[0]!.nomor).toBe(1);
  });

  it("menanam nomor halaman ke tiap soal agar asalnya terbawa", () => {
    const hasil = uraiEkstraksi({ ...halamanWire, page: 7 });
    expect(hasil.ok && hasil.halaman.soal[0]!.halaman).toBe(7);
  });

  it("menyeragamkan label pilihan menjadi huruf besar", () => {
    const hasil = uraiEkstraksi({
      ...halamanWire,
      questions: [
        {
          ...halamanWire.questions[0]!,
          options: [
            {
              key: " a ",
              text: "Jakarta",
              content_type: "text",
              bbox: null,
              assets: [],
            },
          ],
          correct_answer: ["a"],
        },
      ],
    });
    expect(hasil.ok && hasil.halaman.soal[0]!.opsi[0]!.kunci).toBe("A");
    expect(hasil.ok && hasil.halaman.soal[0]!.kunciJawaban).toEqual(["A"]);
  });

  it("menolak keluaran yang tidak sesuai skema beserta alasannya", () => {
    const hasil = uraiEkstraksi({ ...halamanWire, page: 0 });
    expect(hasil.ok).toBe(false);
    expect(hasil.ok === false && hasil.alasan).toContain("page");
  });

  it("menolak bbox yang tidak masuk akal", () => {
    const hasil = uraiEkstraksi({
      ...halamanWire,
      questions: [
        {
          ...halamanWire.questions[0]!,
          question_bbox: { x: 0, y: 0, width: 0, height: 0.5 },
        },
      ],
    });
    expect(hasil.ok).toBe(false);
  });

  it("tidak menerima kunci jawaban karangan berbentuk bukan larik", () => {
    const hasil = uraiEkstraksi({
      ...halamanWire,
      questions: [
        {
          ...halamanWire.questions[0]!,
          correct_answer: "A" as unknown as string[],
        },
      ],
    });
    expect(hasil.ok).toBe(false);
  });
});

function soal(ubah: Partial<PageExtractionWire["questions"][number]> = {}) {
  return { ...halamanWire.questions[0]!, ...ubah };
}
function halaman(page: number, questions: PageExtractionWire["questions"]) {
  const hasil = uraiEkstraksi({ page, questions, warnings: [] });
  if (!hasil.ok) throw new Error(hasil.alasan);
  return hasil.halaman;
}

describe("penggabungan fragmen antarhalaman", () => {
  it("menyatukan soal yang terpotong ke halaman berikutnya", () => {
    const hasil = gabungkan(
      [
        halaman(1, [
          soal({
            temp_id: "a",
            number: 5,
            continues_to_next: true,
            stem: { text: "Bagian awal", bbox: null },
            options: [],
          }),
        ]),
        halaman(2, [
          soal({
            temp_id: "b",
            number: 5,
            continues_from_previous: true,
            stem: { text: "lanjutannya", bbox: null },
          }),
        ]),
      ],
      { dokumenId: "dok1" },
    );
    expect(hasil).toHaveLength(1);
    expect(hasil[0]!.stemTeks).toBe("Bagian awal\nlanjutannya");
    expect(hasil[0]!.halamanDari).toBe(1);
    expect(hasil[0]!.halamanSampai).toBe(2);
    expect(hasil[0]!.bboxPerHalaman).toHaveLength(2);
  });

  it("membawa pilihan yang berada di halaman berikutnya", () => {
    const hasil = gabungkan(
      [
        halaman(1, [
          soal({
            temp_id: "a",
            number: 5,
            continues_to_next: true,
            options: [],
          }),
        ]),
        halaman(2, [
          soal({ temp_id: "b", number: 5, continues_from_previous: true }),
        ]),
      ],
      { dokumenId: "dok1" },
    );
    expect(hasil[0]!.opsi.map((o) => o.kunci)).toEqual(["A", "B"]);
  });

  it("tidak menyatukan nomor sama yang halamannya berjauhan", () => {
    const hasil = gabungkan(
      [
        halaman(1, [soal({ temp_id: "a", number: 5 })]),
        halaman(4, [soal({ temp_id: "b", number: 5 })]),
      ],
      { dokumenId: "dok1" },
    );
    expect(hasil).toHaveLength(2);
  });

  it("menandai fragmen yang mengaku lanjutan tetapi tidak ada pendahulunya", () => {
    const hasil = gabungkan(
      [halaman(3, [soal({ temp_id: "a", continues_from_previous: true })])],
      { dokumenId: "dok1" },
    );
    expect(hasil[0]!.perluTinjau).toBe(true);
    expect(hasil[0]!.alasanTinjau.join(" ")).toContain(
      "tidak ada soal sebelumnya",
    );
  });

  it("mengambil keyakinan terendah saat menyatukan", () => {
    const hasil = gabungkan(
      [
        halaman(1, [
          soal({
            temp_id: "a",
            number: 5,
            confidence: 0.99,
            continues_to_next: true,
          }),
        ]),
        halaman(2, [
          soal({
            temp_id: "b",
            number: 5,
            confidence: 0.4,
            continues_from_previous: true,
          }),
        ]),
      ],
      { dokumenId: "dok1" },
    );
    expect(hasil[0]!.konfidensi).toBeCloseTo(0.4);
    expect(hasil[0]!.perluTinjau).toBe(true);
  });

  it("menandai nomor soal yang kembar", () => {
    const hasil = gabungkan(
      [
        halaman(1, [
          soal({ temp_id: "a", number: 5 }),
          soal({ temp_id: "b", number: 5 }),
        ]),
      ],
      { dokumenId: "dok1" },
    );
    expect(hasil).toHaveLength(2);
    expect(
      hasil.every((s) =>
        s.alasanTinjau.some((a) => a.includes("lebih dari sekali")),
      ),
    ).toBe(true);
  });

  it("mengurutkan fragmen menurut posisinya di halaman, bukan urutan kedatangan", () => {
    const bawah = soal({
      temp_id: "bawah",
      number: 2,
      question_bbox: { x: 0.1, y: 0.6, width: 0.8, height: 0.2 },
    });
    const atas = soal({
      temp_id: "atas",
      number: 1,
      question_bbox: { x: 0.1, y: 0.1, width: 0.8, height: 0.2 },
    });
    const hasil = gabungkan([halaman(1, [bawah, atas])], { dokumenId: "dok1" });
    expect(hasil.map((s) => s.nomor)).toEqual([1, 2]);
  });

  it("memberi identitas stabil agar pengulangan job tidak menggandakan", () => {
    const sekali = gabungkan([halaman(1, [soal({ number: 5 })])], {
      dokumenId: "dok1",
    });
    const lagi = gabungkan([halaman(1, [soal({ number: 5 })])], {
      dokumenId: "dok1",
    });
    expect(sekali[0]!.externalRef).toBe(lagi[0]!.externalRef);
    expect(sekali[0]!.externalRef).toBe("dok1:p1:q5");
  });
});

describe("aturan penandaan tinjau", () => {
  const dasar = halaman(1, [soal()]).soal[0]!;

  it("meloloskan soal yang meyakinkan dan lengkap", () => {
    expect(periksaSoal(dasar).perluTinjau).toBe(false);
  });

  it("menandai keyakinan di bawah ambang", () => {
    const hasil = periksaSoal({ ...dasar, konfidensi: 0.5 });
    expect(hasil.perluTinjau).toBe(true);
    expect(hasil.alasan.join(" ")).toContain("50%");
  });

  it("menandai tipe yang tidak dikenali", () => {
    expect(
      periksaSoal({ ...dasar, tipe: "unknown" }).alasan.join(" "),
    ).toContain("tidak dikenali");
  });

  it("menandai pilihan kurang dari dua", () => {
    expect(
      periksaSoal({ ...dasar, opsi: [dasar.opsi[0]!] }).alasan.join(" "),
    ).toContain("kurang dari dua");
  });

  it("menandai label pilihan yang kembar", () => {
    const kembar = {
      ...dasar,
      opsi: [dasar.opsi[0]!, { ...dasar.opsi[1]!, kunci: "A" }],
    };
    expect(periksaSoal(kembar).alasan.join(" ")).toContain("kembar");
  });

  it("menandai pilihan bergambar yang potongannya tidak ada", () => {
    const bergambar = {
      ...dasar,
      opsi: [
        { ...dasar.opsi[0]!, teks: null, jenisIsi: "image" as const, aset: [] },
        dasar.opsi[1]!,
      ],
    };
    expect(periksaSoal(bergambar).alasan.join(" ")).toContain(
      "tidak terpotong",
    );
  });

  it("menandai soal tanpa teks maupun gambar", () => {
    const kosong = { ...dasar, stem: { teks: "  ", bbox: null }, aset: [] };
    expect(periksaSoal(kosong).alasan.join(" ")).toContain("tidak punya teks");
  });

  it("menandai kunci jawaban yang menunjuk pilihan tak ada", () => {
    expect(
      periksaSoal({ ...dasar, kunciJawaban: ["D"] }).alasan.join(" "),
    ).toContain("tidak ada");
  });
});

function gabung(
  ubah: Partial<PageExtractionWire["questions"][number]> = {},
  page = 1,
) {
  return gabungkan([halaman(page, [soal(ubah)])], { dokumenId: "dok1" })[0]!;
}

describe("pemetaan ke tipe Question aplikasi", () => {
  it("memetakan tipe yang punya padanan langsung", () => {
    expect(keQuestion(gabung({ question_type: "single_choice" })).type).toBe(
      "pg",
    );
    expect(keQuestion(gabung({ question_type: "true_false" })).type).toBe("bs");
    expect(keQuestion(gabung({ question_type: "short_answer" })).type).toBe(
      "isian",
    );
  });

  it("tidak membuang tipe tanpa padanan, tetapi menandainya", () => {
    for (const [tipe, harusnya] of [
      ["multiple_choice", "pg"],
      ["essay", "isian"],
      ["unknown", "isian"],
    ] as const) {
      const q = keQuestion(gabung({ question_type: tipe }));
      expect(q.type).toBe(harusnya);
      expect(q.low).toBe(true);
      expect(q.note).toBeTruthy();
    }
  });

  it("mengubah keyakinan 0..1 menjadi 0..100", () => {
    expect(keQuestion(gabung({ confidence: 0.91 })).conf).toBe(91);
  });

  it("mengambil kunci jawaban hanya bila sumbernya menandai", () => {
    expect(keQuestion(gabung({ correct_answer: ["B"] })).correct).toBe(1);
    expect(
      keQuestion(gabung({ correct_answer: null })).correct,
    ).toBeUndefined();
  });

  it("mengabaikan kunci jawaban yang menunjuk pilihan tak ada", () => {
    expect(
      keQuestion(gabung({ correct_answer: ["Z"] })).correct,
    ).toBeUndefined();
  });

  it("tidak memakai potongan soal utuh sebagai gambar soal", () => {
    // Potongan utuh memuat stem dan pilihan sekaligus; memakainya di sini
    // membuat soal teks biasa membawa foto dirinya sendiri ke latihan siswa.
    expect(keQuestion(gabung()).gambar).toBeUndefined();
  });

  it("mengutamakan aset yang paling mewakili soal", () => {
    const q = keQuestion(
      gabung({
        assets: [
          {
            temp_id: "a1",
            role: "reference_image",
            bbox: kotak,
            storage_key: "soal/rujukan.webp",
          },
          {
            temp_id: "a2",
            role: "stimulus",
            bbox: kotak,
            storage_key: "soal/stimulus.webp",
            alt_text: "diagram daun",
          },
        ],
      }),
    );
    expect(q.gambar).toBe("soal/stimulus.webp");
    expect(q.gambarAlt).toBe("diagram daun");
  });

  it("mengabaikan aset yang potongannya belum terunggah", () => {
    const q = keQuestion(
      gabung({ assets: [{ temp_id: "a1", role: "stimulus", bbox: kotak }] }),
    );
    expect(q.gambar).toBeUndefined();
  });

  it("menandai pilihan bergambar yang belum bisa ditampilkan", () => {
    const q = keQuestion(
      gabung({
        options: [
          {
            key: "A",
            text: null,
            content_type: "image",
            bbox: null,
            assets: [
              {
                temp_id: "o1",
                role: "option_image",
                bbox: kotak,
                storage_key: "soal/a.webp",
              },
            ],
          },
          {
            key: "B",
            text: null,
            content_type: "image",
            bbox: null,
            assets: [
              {
                temp_id: "o2",
                role: "option_image",
                bbox: kotak,
                storage_key: "soal/b.webp",
              },
            ],
          },
        ],
      }),
    );
    expect(q.opts).toEqual(["(gambar pilihan A)", "(gambar pilihan B)"]);
    expect(q.note).toContain("belum bisa ditampilkan");
    expect(q.low).toBe(true);
  });

  it("membawa halaman asal sebagai provenance", () => {
    expect(keQuestion(gabung({}, 7)).page).toBe(7);
    expect(keQuestion(gabung()).sumber).toBe("upload");
  });

  it("memberi teks pengganti saat stem tidak terbaca", () => {
    expect(
      keQuestion(gabung({ stem: { text: null, bbox: null } })).q,
    ).toContain("tidak terbaca");
  });

  it("tidak memberi opsi pada soal isian", () => {
    expect(
      keQuestion(gabung({ question_type: "short_answer" })).opts,
    ).toBeUndefined();
  });
});

describe("kunci objek hasil worker", () => {
  // Satu unggahan boleh memuat beberapa berkas, dan nomor halamannya dihitung
  // ulang dari 1 pada tiap berkas. Tanpa urutan berkas di dalam kunci, halaman 1
  // berkas kedua akan menimpa halaman 1 berkas pertama tanpa ada yang tahu.
  it("membedakan halaman yang bernomor sama dari berkas berbeda", () => {
    expect(kunciRenderHalaman("job1", 0, 1)).not.toBe(
      kunciRenderHalaman("job1", 1, 1),
    );
    expect(kunciPotonganSoal("job1", 0, 1, "p1q1")).not.toBe(
      kunciPotonganSoal("job1", 1, 1, "p1q1"),
    );
  });

  it("tetap sama saat job diulang, supaya objeknya ditimpa bukan ditumpuk", () => {
    expect(kunciPotonganSoal("job1", 0, 2, "p2q3")).toBe(
      kunciPotonganSoal("job1", 0, 2, "p2q3"),
    );
  });

  it("menaruh potongan soal di ruang nama yang dilayani penyaji gambar", () => {
    expect(kunciPotonganSoal("job1", 0, 1, "p1q1")).toMatch(
      /^soal\/[A-Za-z0-9._-]+$/,
    );
  });

  it("menjinakkan tempId yang membentuk jalur", () => {
    const kunci = kunciPotonganSoal("job1", 0, 1, "../../etc/passwd");
    expect(kunci).not.toContain("..");
    expect(kunci).not.toContain("/etc/");
  });

  it("tidak menaruh render halaman di ruang nama gambar soal", () => {
    // Render halaman adalah foto dokumen orang, bukan gambar soal; rute penyaji
    // umum tidak boleh bisa melayaninya.
    expect(kunciRenderHalaman("job1", 0, 1).startsWith("soal/")).toBe(false);
  });
});
