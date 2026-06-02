import { parseScopeTopics } from "@/lib/pdf/scope";
import { describe, expect, it } from "vitest";

describe("parseScopeTopics", () => {
  it("splits topics one per line", () => {
    expect(parseScopeTopics("Introdução\nErgonomia\nPostura")).toEqual([
      "Introdução",
      "Ergonomia",
      "Postura",
    ]);
  });

  it("handles CRLF line endings", () => {
    expect(parseScopeTopics("A\r\nB\r\nC")).toEqual(["A", "B", "C"]);
  });

  it("trims each line and drops empty lines", () => {
    expect(parseScopeTopics("  Tópico 1  \n\n   \n Tópico 2 ")).toEqual(["Tópico 1", "Tópico 2"]);
  });

  it("returns empty array for null/undefined/blank", () => {
    expect(parseScopeTopics(null)).toEqual([]);
    expect(parseScopeTopics(undefined)).toEqual([]);
    expect(parseScopeTopics("")).toEqual([]);
    expect(parseScopeTopics("   \n  \n")).toEqual([]);
  });
});
