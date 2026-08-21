import { describe, expect, it } from "vitest";
import { tokenCocok } from "../worker/token";

const BENAR = "token-worker-rahasia";

describe("izin worker", () => {
  it("menerima token yang benar, apa pun huruf skemanya", () => {
    expect(tokenCocok(`Bearer ${BENAR}`, BENAR)).toBe(true);
    expect(tokenCocok(`bearer ${BENAR}`, BENAR)).toBe(true);
    expect(tokenCocok(`BEARER ${BENAR}`, BENAR)).toBe(true);
  });

  it("tertutup selama token servernya belum diisi", () => {
    expect(tokenCocok(`Bearer ${BENAR}`, null)).toBe(false);
    expect(tokenCocok(`Bearer apa-pun`, null)).toBe(false);
  });

  it("menolak header yang salah bentuk atau salah isi", () => {
    for (const header of [
      null,
      undefined,
      "",
      "Bearer",
      "Bearer ",
      "Bearer token-lain",
      BENAR,
      `Basic ${BENAR}`,
    ]) {
      expect(tokenCocok(header, BENAR)).toBe(false);
    }
  });

  it("tidak meloloskan token yang hanya berawalan sama", () => {
    expect(tokenCocok(`Bearer ${BENAR}-tambahan`, BENAR)).toBe(false);
    expect(tokenCocok(`Bearer ${BENAR.slice(0, -1)}`, BENAR)).toBe(false);
  });
});
