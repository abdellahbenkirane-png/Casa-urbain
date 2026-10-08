import { describe, expect, it } from "vitest";
import { fmtDh, fmtDhShort, fmtDhSigned, fmtPct, fmtPctSigned } from "./format";

// Intl insère des espaces insécables : on les normalise pour comparer.
const n = (s: string) => s.replace(/[  ]/g, " ");

describe("formats français", () => {
  it("montants en DH avec séparateur de milliers", () => {
    expect(n(fmtDh(1234567.4))).toBe("1 234 567 DH");
  });

  it("montants compacts", () => {
    expect(n(fmtDhShort(27_391_304))).toBe("27,4 M DH");
    expect(n(fmtDhShort(850_000))).toBe("850 k DH");
    expect(n(fmtDhShort(-3_100_000))).toBe("−3,1 M DH");
    expect(n(fmtDhShort(950))).toBe("950 DH");
  });

  it("pourcentages avec virgule et vrai signe moins", () => {
    expect(n(fmtPct(0.345))).toBe("34,5 %");
    expect(n(fmtPct(-0.112))).toBe("−11,2 %");
    expect(n(fmtPctSigned(0.1, 0))).toBe("+10 %");
    expect(n(fmtPctSigned(-0.1, 0))).toBe("−10 %");
  });

  it("montants signés", () => {
    expect(n(fmtDhSigned(1500))).toBe("+1 500");
    expect(n(fmtDhSigned(-1500))).toBe("−1 500");
  });
});
