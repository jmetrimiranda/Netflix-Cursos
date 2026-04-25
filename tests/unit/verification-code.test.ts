import { describe, expect, it } from "vitest";
import { VERIFICATION_CODE_REGEX, generateVerificationCode } from "../../src/lib/verification-code";

describe("generateVerificationCode", () => {
  it("gera código no formato EC-XXXXXXXX", () => {
    const code = generateVerificationCode();
    expect(code).toMatch(VERIFICATION_CODE_REGEX);
    expect(code.length).toBe(11);
  });

  it("não usa caracteres ambíguos (0, O, I, L)", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateVerificationCode();
      const tail = code.slice(3);
      expect(tail).not.toMatch(/[0OIL1]/);
    }
  });

  it("gera códigos únicos (200 amostras)", () => {
    const set = new Set<string>();
    for (let i = 0; i < 200; i++) set.add(generateVerificationCode());
    expect(set.size).toBe(200);
  });
});
