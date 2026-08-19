import { beforeEach, describe, expect, it } from "vitest";
import { ambilJatah, lupakanSemuaJatah } from "../admin/laju";
import { bandingTetap, buatTiket, tiketSah } from "../admin/token";
import { labelAlasan, labelStatus } from "../laporan";
import { adminQuerySchema } from "../validasi";

const RAHASIA = "sandi-admin-yang-panjang";
const T0 = 1_700_000_000_000;

describe("tiket sesi admin", () => {
  it("menerima tiket yang baru dibuat", async () => {
    const tiket = await buatTiket(RAHASIA, T0);
    expect(await tiketSah(tiket.nilai, RAHASIA, T0)).toBe(true);
  });

  it("menolak tiket bertanda tangan rahasia lain", async () => {
    const tiket = await buatTiket(RAHASIA, T0);
    expect(await tiketSah(tiket.nilai, "sandi-lain", T0)).toBe(false);
  });

  it("menolak tiket yang sudah kedaluwarsa", async () => {
    const tiket = await buatTiket(RAHASIA, T0);
    const setelahKedaluwarsa = tiket.kedaluwarsa.getTime() + 1;
    expect(await tiketSah(tiket.nilai, RAHASIA, setelahKedaluwarsa)).toBe(false);
  });

  it("menolak tanda tangan yang diutak-atik", async () => {
    const tiket = await buatTiket(RAHASIA, T0);
    expect(await tiketSah(`${tiket.nilai}x`, RAHASIA, T0)).toBe(false);
  });

  it("menolak masa berlaku yang dipanjangkan sendiri", async () => {
    const tiket = await buatTiket(RAHASIA, T0);
    const tanda = tiket.nilai.slice(tiket.nilai.indexOf(".") + 1);
    const palsu = `${T0 + 999_999_999}.${tanda}`;
    expect(await tiketSah(palsu, RAHASIA, T0)).toBe(false);
  });

  it("menolak bentuk yang tidak dikenal", async () => {
    for (const buruk of [undefined, "", ".", "abc", "abc.def"]) {
      expect(await tiketSah(buruk, RAHASIA, T0)).toBe(false);
    }
  });
});

describe("perbandingan waktu-tetap", () => {
  it("membedakan isi maupun panjang", () => {
    expect(bandingTetap("rahasia", "rahasia")).toBe(true);
    expect(bandingTetap("rahasia", "rahasib")).toBe(false);
    expect(bandingTetap("rahasia", "rahasia-panjang")).toBe(false);
    expect(bandingTetap("", "")).toBe(true);
  });
});

describe("pembatas laju", () => {
  beforeEach(() => lupakanSemuaJatah());

  it("memberi jatah sebanyak batasnya lalu menolak", () => {
    for (let i = 0; i < 3; i++) {
      expect(ambilJatah("uji", 3, 1000, T0).boleh).toBe(true);
    }
    const tertolak = ambilJatah("uji", 3, 1000, T0);
    expect(tertolak.boleh).toBe(false);
    expect(tertolak.tungguDetik).toBeGreaterThan(0);
  });

  it("memulihkan jatah setelah jendelanya lewat", () => {
    ambilJatah("uji", 1, 1000, T0);
    expect(ambilJatah("uji", 1, 1000, T0).boleh).toBe(false);
    expect(ambilJatah("uji", 1, 1000, T0 + 1001).boleh).toBe(true);
  });

  it("menghitung tiap kunci secara terpisah", () => {
    ambilJatah("a", 1, 1000, T0);
    expect(ambilJatah("a", 1, 1000, T0).boleh).toBe(false);
    expect(ambilJatah("b", 1, 1000, T0).boleh).toBe(true);
  });
});

describe("label laporan", () => {
  it("menerjemahkan alasan dan status yang dikenal", () => {
    expect(labelAlasan("tidak-pantas")).toBe("Tidak pantas atau kasar");
    expect(labelStatus("baru")).toBe("Baru");
  });

  it("memakai nilai apa adanya untuk yang tidak dikenal", () => {
    expect(labelAlasan("entah-apa")).toBe("entah-apa");
    expect(labelStatus("entah")).toBe("entah");
  });
});

describe("filter daftar aktivitas admin", () => {
  it("tidak menggugurkan kata kunci saat status dibiarkan “Semua”", () => {
    const hasil = adminQuerySchema.safeParse({
      q: "fotosintesis",
      visibility: "",
      dilaporkan: "",
      halaman: "",
    });
    expect(hasil.success).toBe(true);
    expect(hasil.success && hasil.data).toMatchObject({
      q: "fotosintesis",
      visibility: undefined,
      dilaporkan: undefined,
      halaman: 1,
    });
  });

  it("membaca filter yang memang dipilih", () => {
    const hasil = adminQuerySchema.safeParse({
      visibility: "public",
      dilaporkan: "ya",
      halaman: "3",
    });
    expect(hasil.success && hasil.data).toMatchObject({
      visibility: "public",
      dilaporkan: "ya",
      halaman: 3,
    });
  });

  it("menolak nilai filter yang tidak dikenal", () => {
    expect(adminQuerySchema.safeParse({ visibility: "semua-orang" }).success).toBe(false);
    expect(adminQuerySchema.safeParse({ halaman: "0" }).success).toBe(false);
  });
});
