import { describe, expect, it } from "vitest";
import { kabarKontak } from "../email/kabar";
import { alamatKirim, susunFormMailgun } from "../email/mailgun";
import { alamatSama, perluKirim, susunPesanTautan } from "../email/pesan";

const isi = {
  nama: "Bu Rina",
  judul: "Fotosintesis",
  tautanEdit: "https://soalsnap.id/edit/RAHASIAPANJANG22CHR",
  tautanMain: "https://soalsnap.id/main/ABC123",
};

describe("penjaga kirim tautan", () => {
  it("tidak mengirim kalau email tidak diisi", () => {
    expect(perluKirim(null, null)).toMatchObject({ kirim: false, kode: "tanpa-email" });
    expect(perluKirim("   ", null).kirim).toBe(false);
  });

  it("mengirim saat alamat baru pertama kali disimpan", () => {
    expect(perluKirim("bu.rina@sekolah.id", null).kirim).toBe(true);
  });

  it("tidak mengirim dua kali ke alamat yang sama", () => {
    const hasil = perluKirim("bu.rina@sekolah.id", "bu.rina@sekolah.id");
    expect(hasil.kirim).toBe(false);
    expect(hasil.kode).toBe("sudah-dikirim");
    expect(hasil.alasan).toContain("sudah pernah dikirim");
  });

  it("beda huruf besar bukan alamat baru", () => {
    expect(perluKirim("Bu.Rina@Sekolah.id", "bu.rina@sekolah.id").kirim).toBe(false);
    expect(alamatSama(" A@B.id ", "a@b.id")).toBe(true);
  });

  it("mengirim ulang kalau alamatnya diperbaiki", () => {
    expect(perluKirim("rina@sekolah.id", "rina@sekolh.id").kirim).toBe(true);
  });
});

describe("isi surel tautan", () => {
  it("memuat judul pada subjek dan kedua tautan pada badan teks", () => {
    const pesan = susunPesanTautan(isi);
    expect(pesan.subjek).toContain("Fotosintesis");
    expect(pesan.teks).toContain(isi.tautanMain);
    expect(pesan.teks).toContain(isi.tautanEdit);
    expect(pesan.html).toContain(`href="${isi.tautanEdit}"`);
  });

  it("menyapa dengan nama bila ada, tanpa nama bila kosong", () => {
    expect(susunPesanTautan(isi).teks.startsWith("Halo Bu Rina,")).toBe(true);
    expect(susunPesanTautan({ ...isi, nama: null }).teks.startsWith("Halo,")).toBe(true);
  });

  it("memberi judul cadangan saat judul kosong", () => {
    expect(susunPesanTautan({ ...isi, judul: "  " }).subjek).toContain("Latihan tanpa judul");
  });

  it("meloloskan markup pada judul buatan pengguna", () => {
    const pesan = susunPesanTautan({ ...isi, judul: '<script>alert("x")</script>' });
    expect(pesan.html).not.toContain("<script>");
    expect(pesan.html).toContain("&lt;script&gt;");
  });

  it("mengingatkan bahwa tautan edit tidak boleh dibagikan", () => {
    const pesan = susunPesanTautan(isi);
    expect(pesan.teks).toContain("jangan dibagikan");
    expect(pesan.html).toContain("jangan dibagikan");
  });
});

describe("kabar untuk pembuat soal", () => {
  const email = "bu.rina@sekolah.id";

  it("mengabari kalau penyimpanan gagal", () => {
    expect(kabarKontak({ tersimpan: false, email }).baik).toBe(false);
  });

  it("meminta email saat kolomnya dibiarkan kosong", () => {
    const kabar = kabarKontak({ tersimpan: true, email: "" });
    expect(kabar.baik).toBe(true);
    expect(kabar.teks).toContain("Isi email");
  });

  it("menyebut alamat tujuan saat tautan terkirim", () => {
    const kabar = kabarKontak({
      tersimpan: true,
      email,
      notifikasi: { terkirim: true, kode: "terkirim" },
    });
    expect(kabar).toMatchObject({ baik: true });
    expect(kabar.teks).toContain(email);
  });

  it("menyuruh menyalin tautan saat penyedia belum dipasang", () => {
    const kabar = kabarKontak({
      tersimpan: true,
      email,
      notifikasi: { terkirim: false, kode: "belum-dikonfigurasi" },
    });
    expect(kabar.baik).toBe(false);
    expect(kabar.teks).toContain("salin");
  });

  it("tidak menjanjikan surel kedua untuk alamat yang sama", () => {
    const kabar = kabarKontak({
      tersimpan: true,
      email,
      notifikasi: { terkirim: false, kode: "sudah-dikirim" },
    });
    expect(kabar.baik).toBe(true);
    expect(kabar.teks).toContain("sudah pernah dikirim");
  });

  it("mengaku terus terang saat pengiriman gagal", () => {
    const kabar = kabarKontak({
      tersimpan: true,
      email,
      notifikasi: { terkirim: false, kode: "gagal" },
    });
    expect(kabar.baik).toBe(false);
    expect(kabar.teks).toContain("gagal dikirim");
  });
});

describe("permintaan Mailgun", () => {
  const surat = susunPesanTautan(isi);

  it("menyusun alamat kirim dari domain pengirim", () => {
    expect(alamatKirim("mail.soalsnap.web.id")).toBe(
      "https://api.mailgun.net/v3/mail.soalsnap.web.id/messages",
    );
  });

  it("menghormati pangkal API region lain", () => {
    expect(alamatKirim("mail.soalsnap.web.id", "https://api.eu.mailgun.net")).toBe(
      "https://api.eu.mailgun.net/v3/mail.soalsnap.web.id/messages",
    );
  });

  it("tidak menghasilkan garis miring ganda", () => {
    expect(alamatKirim("d.contoh.id", "https://api.mailgun.net/")).toBe(
      "https://api.mailgun.net/v3/d.contoh.id/messages",
    );
  });

  it("membawa pengirim, tujuan, dan kedua bentuk badan surel", () => {
    const form = susunFormMailgun({
      dari: "SoalSnap <tautan@mail.soalsnap.web.id>",
      tujuan: "bu.rina@sekolah.id",
      surat,
    });
    expect(form.get("from")).toBe("SoalSnap <tautan@mail.soalsnap.web.id>");
    expect(form.get("to")).toBe("bu.rina@sekolah.id");
    expect(form.get("subject")).toContain("Fotosintesis");
    expect(form.get("text")).toContain(isi.tautanEdit);
    expect(form.get("html")).toContain("jangan dibagikan");
  });

  it("memasang Reply-To sebagai header Mailgun", () => {
    const form = susunFormMailgun({
      dari: "SoalSnap <tautan@mail.soalsnap.web.id>",
      tujuan: "bu.rina@sekolah.id",
      balasKe: "  noreply@soalsnap.web.id  ",
      surat,
    });
    expect(form.get("h:Reply-To")).toBe("noreply@soalsnap.web.id");
  });

  it("melewatkan Reply-To kalau tidak diisi", () => {
    for (const balasKe of [undefined, "", "   "]) {
      const form = susunFormMailgun({
        dari: "SoalSnap <tautan@mail.soalsnap.web.id>",
        tujuan: "bu.rina@sekolah.id",
        balasKe,
        surat,
      });
      expect(form.has("h:Reply-To")).toBe(false);
    }
  });
});
