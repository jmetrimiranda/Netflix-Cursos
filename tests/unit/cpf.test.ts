import { describe, expect, it } from "vitest";
import { maskCpf, stripCpfMask, validateCpf } from "../../src/lib/cpf";

describe("validateCpf", () => {
  it("aceita CPF válido sem máscara", () => {
    expect(validateCpf("12345678909")).toBe(true);
  });

  it("aceita CPF válido com máscara", () => {
    expect(validateCpf("123.456.789-09")).toBe(true);
  });

  it("rejeita DV1 errado", () => {
    expect(validateCpf("12345678919")).toBe(false);
  });

  it("rejeita DV2 errado", () => {
    expect(validateCpf("12345678900")).toBe(false);
  });

  it("rejeita todos dígitos iguais", () => {
    for (const d of "0123456789") {
      expect(validateCpf(d.repeat(11))).toBe(false);
    }
  });

  it("rejeita string vazia", () => {
    expect(validateCpf("")).toBe(false);
  });

  it("rejeita CPF curto", () => {
    expect(validateCpf("123")).toBe(false);
  });
});

describe("stripCpfMask", () => {
  it("remove pontos e hífen", () => {
    expect(stripCpfMask("123.456.789-09")).toBe("12345678909");
  });
  it("ignora valores vazios", () => {
    expect(stripCpfMask("")).toBe("");
  });
  it("preserva dígitos em valor sem máscara", () => {
    expect(stripCpfMask("12345678909")).toBe("12345678909");
  });
});

describe("maskCpf", () => {
  it("aplica máscara progressiva", () => {
    expect(maskCpf("123")).toBe("123");
    expect(maskCpf("12345")).toBe("123.45");
    expect(maskCpf("123456")).toBe("123.456");
    expect(maskCpf("123456789")).toBe("123.456.789");
    expect(maskCpf("12345678909")).toBe("123.456.789-09");
  });
  it("trunca em 11 dígitos", () => {
    expect(maskCpf("123456789091234")).toBe("123.456.789-09");
  });
});
