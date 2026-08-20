import { describe, expect, it } from "vitest";
import {
  bentukTokenSah,
  buatTokenMasuk,
  hashTokenMasuk,
  normalkanEmail,
} from "../auth/magic";
import { susunPesanMasuk } from "../email/pesan";
import { bacaTiket, buatTiket } from "../tiket";
import { mintaMasukSchema } from "../validasi";

const RAHASIA = "rahasia-sesi-yang-panjang";
const T0 = 1_700_000_000_000;
const SEJAM = 60 * 60 * 1000;

describe("tiket bertanda tangan", () => {
  it("mengembalikan muatannya kembali utuh", async () => {
    const tiket = await buatTiket("cmt0abc123", RAHASIA, SEJAM, T0);
    expect(await bacaTiket(tiket.nilai, RAHASIA, T0)).toBe("cmt0abc123");
  });

  it("aman untuk muatan yang mengandung pemisah", async () => {
    const tiket = await buatTiket("a.b.c", RAHASIA, SEJAM, T0);
    expect(await bacaTiket(tiket.nilai, RAHASIA, T0)).toBe("a.b.c");
  });

  it("menolak tanda tangan dari rahasia lain", async () => {
    const tiket = await buatTiket("pengguna", RAHASIA, SEJAM, T0);
    expect(await bacaTiket(tiket.nilai, "rahasia-lain", T0)).toBeNull();
  });

  it("menolak tiket yang kedaluwarsa", async () => {
    const tiket = await buatTiket("pengguna", RAHASIA, SEJAM, T0);
    expect(await bacaTiket(tiket.nilai, RAHASIA, T0 + SEJAM + 1)).toBeNull();
  });

  it("menolak muatan yang ditukar tanpa tanda tangan baru", async () => {
    const tiket = await buatTiket("pengguna-a", RAHASIA, SEJAM, T0);
    const [, exp, tanda] = tiket.nilai.split(".");
    const lain = btoa("pengguna-b").replace(/=+$/, "");
    expect(await bacaTiket(`${lain}.${exp}.${tanda}`, RAHASIA, T0)).toBeNull();
  });

  it("menolak masa berlaku yang dipanjangkan sendiri", async () => {
    const tiket = await buatTiket("pengguna", RAHASIA, SEJAM, T0);
    const [muatan, , tanda] = tiket.nilai.split(".");
    expect(await bacaTiket(`${muatan}.${T0 + 999_999_999}.${tanda}`, RAHASIA, T0)).toBeNull();
  });

  it("menolak bentuk yang tidak dikenal", async () => {
    for (const buruk of [undefined, null, "", ".", "..", "a.b", "a.b.c.d"]) {
      expect(await bacaTiket(buruk, RAHASIA, T0)).toBeNull();
    }
  });
});

describe("token tautan masuk", () => {
  it("membuat token dengan bentuk yang diterima", () => {
    for (let i = 0; i < 20; i++) {
      expect(bentukTokenSah(buatTokenMasuk())).toBe(true);
    }
  });

  it("tidak pernah mengulang token", () => {
    const set = new Set(Array.from({ length: 200 }, () => buatTokenMasuk()));
    expect(set.size).toBe(200);
  });

  it("menolak bentuk token yang tidak wajar", () => {
    expect(bentukTokenSah("")).toBe(false);
    expect(bentukTokenSah("pendek")).toBe(false);
    expect(bentukTokenSah(`${"a".repeat(40)}/../etc`)).toBe(false);
    expect(bentukTokenSah("a".repeat(65))).toBe(false);
  });

  it("menghasilkan hash yang tetap dan berbeda antar token", async () => {
    const token = buatTokenMasuk();
    const a = await hashTokenMasuk(token);
    const b = await hashTokenMasuk(token);
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
    expect(await hashTokenMasuk(buatTokenMasuk())).not.toBe(a);
  });

  it("menyatukan alamat yang hanya beda huruf besar dan spasi", () => {
    expect(normalkanEmail("  Bu.Rina@Sekolah.ID ")).toBe("bu.rina@sekolah.id");
  });
});

describe("surel tautan masuk", () => {
  const tautan = "https://soalsnap.web.id/masuk/AbC123_-xyz";

  it("memuat tautannya pada teks maupun HTML", () => {
    const pesan = susunPesanMasuk({ nama: "Bu Rina", tautan, umurMenit: 15 });
    expect(pesan.teks).toContain(tautan);
    expect(pesan.html).toContain(`href="${tautan}"`);
    expect(pesan.subjek).toContain("Tautan masuk");
  });

  it("menyebutkan masa berlaku dan sifat sekali pakai", () => {
    const pesan = susunPesanMasuk({ nama: null, tautan, umurMenit: 15 });
    expect(pesan.teks).toContain("15 menit");
    expect(pesan.teks).toContain("sekali");
  });

  it("memberi tahu cara mengabaikan bila tidak merasa meminta", () => {
    const pesan = susunPesanMasuk({ nama: null, tautan, umurMenit: 15 });
    expect(pesan.teks).toContain("abaikan");
    expect(pesan.html).toContain("abaikan");
  });

  it("meloloskan markup pada nama buatan pengguna", () => {
    const pesan = susunPesanMasuk({ nama: '<script>alert(1)</script>', tautan, umurMenit: 15 });
    expect(pesan.html).not.toContain("<script>");
    expect(pesan.html).toContain("&lt;script&gt;");
  });
});

describe("permintaan tautan masuk", () => {
  it("menerima alamat yang terbawa spasi dari papan ketik ponsel", () => {
    const hasil = mintaMasukSchema.safeParse({ email: "  Bu.Rina@Sekolah.ID  " });
    expect(hasil.success).toBe(true);
    expect(hasil.success && normalkanEmail(hasil.data.email)).toBe("bu.rina@sekolah.id");
  });

  it("tetap menolak yang memang bukan alamat surel", () => {
    for (const buruk of ["", "   ", "bukan-email", "a@", "@b.id"]) {
      expect(mintaMasukSchema.safeParse({ email: buruk }).success).toBe(false);
    }
  });
});
