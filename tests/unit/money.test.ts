import { formatCentsToBRL, parseBRLToCents } from "@/lib/money";
import { describe, expect, it } from "vitest";

describe("formatCentsToBRL", () => {
  it("formats integer cents", () => {
    expect(formatCentsToBRL(9900)).toMatch(/^R\$\s?99,00$/);
  });

  it("formats zero", () => {
    expect(formatCentsToBRL(0)).toMatch(/^R\$\s?0,00$/);
  });

  it("formats large amounts with thousands separator", () => {
    expect(formatCentsToBRL(1_234_567)).toMatch(/^R\$\s?12\.345,67$/);
  });
});

describe("parseBRLToCents", () => {
  it("parses formatted BRL", () => {
    expect(parseBRLToCents("R$ 99,00")).toBe(9900);
  });

  it("parses BRL with thousands separator", () => {
    expect(parseBRLToCents("R$ 12.345,67")).toBe(1_234_567);
  });

  it("parses plain decimal", () => {
    expect(parseBRLToCents("99,00")).toBe(9900);
    expect(parseBRLToCents("0,50")).toBe(50);
  });

  it("returns NaN for invalid input", () => {
    expect(parseBRLToCents("abc")).toBeNaN();
    expect(parseBRLToCents("")).toBeNaN();
  });

  it("rejects negative numbers", () => {
    expect(parseBRLToCents("-10,00")).toBeNaN();
  });
});
