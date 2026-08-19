import { describe, expect, it } from "vitest";
import {
  MAX_BERKAS,
  MAX_UKURAN_BYTE,
  jenisDari,
  kunciObjek,
  namaAman,
  periksaBerkas,
  periksaDaftar,
  periksaTotalHalaman,
  tipeBerkas,
} from "../unggah/berkas";

const pdf = { nama: "soal.pdf", contentType: "application/pdf", ukuran: 1024 };

describe("jenis berkas", () => {
  it("mengenali jenis yang diterima", () => {
    expect(jenisDari("image/jpeg")).toBe("image");
    expect(jenisDari("application/pdf")).toBe("pdf");
    expect(jenisDari("text/plain")).toBe("text");
  });

  it("mengabaikan parameter di belakang tipe", () => {
    expect(jenisDari("text/plain; charset=utf-8")).toBe("text");
    expect(jenisDari("  IMAGE/PNG  ")).toBe("image");
  });

  it("menolak jenis yang tidak didukung", () => {
    expect(jenisDari("application/zip")).toBeNull();
    expect(jenisDari("video/mp4")).toBeNull();
    expect(jenisDari("")).toBeNull();
  });

  it("menebak dari ekstensi saat peramban tidak memberi tipe", () => {
    expect(tipeBerkas("lembar.pdf", "")).toBe("application/pdf");
    expect(tipeBerkas("foto.JPG", undefined)).toBe("image/jpeg");
    expect(tipeBerkas("entah.xyz", null)).toBe("application/octet-stream");
  });

  it("mengutamakan tipe dari peramban bila ada", () => {
    expect(tipeBerkas("soal.pdf", "image/png")).toBe("image/png");
  });
});

describe("nama dan kunci objek", () => {
  it("membuang komponen direktori", () => {
    expect(namaAman("../../etc/passwd")).toBe("passwd");
    expect(namaAman("C:\\Users\\rina\\soal.pdf")).toBe("soal.pdf");
  });

  it("mempertahankan huruf dan angka, merapikan sisanya", () => {
    expect(namaAman("Soal IPA Kelas 7.pdf")).toBe("Soal-IPA-Kelas-7.pdf");
    expect(namaAman("soal   ujian!!.pdf")).toBe("soal-ujian-.pdf");
  });

  it("selalu menghasilkan nama, bahkan dari masukan aneh", () => {
    expect(namaAman("")).toBe("berkas");
    expect(namaAman("///")).toBe("berkas");
    expect(namaAman("...")).toBe("berkas");
  });

  it("memberi awalan job dan urutan berpadding pada kunci", () => {
    expect(kunciObjek("job123", 0, "soal.pdf")).toBe("unggahan/job123/00-soal.pdf");
    expect(kunciObjek("job123", 11, "../rahasia")).toBe("unggahan/job123/11-rahasia");
  });
});

describe("pemeriksaan berkas", () => {
  it("menerima berkas yang wajar", () => {
    expect(periksaBerkas(pdf)).toEqual({ ok: true, jenis: "pdf" });
  });

  it("menolak berkas kosong dan yang kelewat besar", () => {
    expect(periksaBerkas({ ...pdf, ukuran: 0 }).ok).toBe(false);
    expect(periksaBerkas({ ...pdf, ukuran: MAX_UKURAN_BYTE + 1 }).ok).toBe(false);
    expect(periksaBerkas({ ...pdf, ukuran: MAX_UKURAN_BYTE }).ok).toBe(true);
  });

  it("menyebut nama berkas pada alasannya", () => {
    const hasil = periksaBerkas({ ...pdf, contentType: "application/zip" });
    expect(hasil.ok).toBe(false);
    expect(hasil.ok === false && hasil.alasan).toContain("soal.pdf");
  });

  it("menolak daftar kosong dan daftar kelewat panjang", () => {
    expect(periksaDaftar([]).ok).toBe(false);
    expect(periksaDaftar(Array.from({ length: MAX_BERKAS }, () => pdf)).ok).toBe(true);
    expect(periksaDaftar(Array.from({ length: MAX_BERKAS + 1 }, () => pdf)).ok).toBe(false);
  });

  it("mengembalikan jenis tiap berkas sesuai urutannya", () => {
    const hasil = periksaDaftar([pdf, { ...pdf, contentType: "image/png" }]);
    expect(hasil.ok && hasil.jenis).toEqual(["pdf", "image"]);
  });
});

describe("batas halaman", () => {
  it("meloloskan yang masih di dalam batas", () => {
    expect(periksaTotalHalaman([1, 1, 1]).ok).toBe(true);
    expect(periksaTotalHalaman([20]).ok).toBe(true);
  });

  it("menolak yang melewati batas dan menyebut jumlahnya", () => {
    const hasil = periksaTotalHalaman([18, 5]);
    expect(hasil.ok).toBe(false);
    expect(hasil.ok === false && hasil.alasan).toContain("23");
  });
});
