import {
  LEGACY_STUDENT_EMAIL_KEY,
  STUDENT_EMAIL_KEY,
  readStudentEmail,
  writeStudentEmail,
} from "@/lib/student-email";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("readStudentEmail — F3.5 localStorage migration", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("returns the new key when it already exists", () => {
    window.localStorage.setItem(STUDENT_EMAIL_KEY, "aluno@ativa.dev");
    expect(readStudentEmail()).toBe("aluno@ativa.dev");
    expect(window.localStorage.getItem(LEGACY_STUDENT_EMAIL_KEY)).toBeNull();
  });

  it("migrates the legacy netflix_cursos_email key on first read", () => {
    window.localStorage.setItem(LEGACY_STUDENT_EMAIL_KEY, "antigo@ativa.dev");

    const email = readStudentEmail();

    expect(email).toBe("antigo@ativa.dev");
    expect(window.localStorage.getItem(STUDENT_EMAIL_KEY)).toBe("antigo@ativa.dev");
    expect(window.localStorage.getItem(LEGACY_STUDENT_EMAIL_KEY)).toBeNull();
  });

  it("returns null when neither key is present", () => {
    expect(readStudentEmail()).toBeNull();
    expect(window.localStorage.getItem(STUDENT_EMAIL_KEY)).toBeNull();
    expect(window.localStorage.getItem(LEGACY_STUDENT_EMAIL_KEY)).toBeNull();
  });

  it("writeStudentEmail stores under the new key only", () => {
    writeStudentEmail("novo@ativa.dev");
    expect(window.localStorage.getItem(STUDENT_EMAIL_KEY)).toBe("novo@ativa.dev");
    expect(window.localStorage.getItem(LEGACY_STUDENT_EMAIL_KEY)).toBeNull();
  });
});
