import type { EnrollmentStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { type RecoverDeps, recoverEnrollment } from "../../src/lib/enrollment-recover";
import { enrollmentRecoverSchema } from "../../src/lib/validations/enrollment-recover";

const VALID_CPF = "12345678909";
const VALID_CPF_MASKED = "123.456.789-09";
const OTHER_VALID_CPF = "98765432100";

type DepsOverrides = Partial<RecoverDeps>;

function makeDeps(overrides: DepsOverrides = {}): RecoverDeps {
  return {
    findCourseWithFirstLesson: vi.fn(async (slug: string) => ({
      id: "course-1",
      slug,
      firstLessonId: "lesson-1",
    })),
    findEnrollmentByCourseAndEmail: vi.fn(async () => ({
      id: "enr-1",
      status: "active" as EnrollmentStatus,
      payment: { studentCpf: VALID_CPF },
    })),
    ...overrides,
  };
}

describe("recoverEnrollment", () => {
  it("retorna course_not_found quando o slug não existe", async () => {
    const deps = makeDeps({
      findCourseWithFirstLesson: vi.fn(async () => null),
    });
    const result = await recoverEnrollment(deps, {
      courseSlug: "inexistente",
      studentEmail: "a@b.com",
      studentCpf: VALID_CPF,
    });
    expect(result).toEqual({ ok: false, reason: "course_not_found" });
  });

  it("retorna not_found quando não há enrollment para o email", async () => {
    const deps = makeDeps({
      findEnrollmentByCourseAndEmail: vi.fn(async () => null),
    });
    const result = await recoverEnrollment(deps, {
      courseSlug: "curso-x",
      studentEmail: "outro@b.com",
      studentCpf: VALID_CPF,
    });
    expect(result).toEqual({ ok: false, reason: "not_found" });
  });

  it("retorna not_active quando enrollment existe mas status != active", async () => {
    const deps = makeDeps({
      findEnrollmentByCourseAndEmail: vi.fn(async () => ({
        id: "enr-1",
        status: "pending_payment" as EnrollmentStatus,
        payment: { studentCpf: VALID_CPF },
      })),
    });
    const result = await recoverEnrollment(deps, {
      courseSlug: "curso-x",
      studentEmail: "a@b.com",
      studentCpf: VALID_CPF,
    });
    expect(result).toEqual({ ok: false, reason: "not_active" });
  });

  it("retorna cpf_mismatch quando o CPF informado não bate com o do banco", async () => {
    const deps = makeDeps();
    const result = await recoverEnrollment(deps, {
      courseSlug: "curso-x",
      studentEmail: "a@b.com",
      studentCpf: OTHER_VALID_CPF,
    });
    expect(result).toEqual({ ok: false, reason: "cpf_mismatch" });
  });

  it("retorna cpf_mismatch quando o payment não existe (sem CPF pra comparar)", async () => {
    const deps = makeDeps({
      findEnrollmentByCourseAndEmail: vi.fn(async () => ({
        id: "enr-1",
        status: "active" as EnrollmentStatus,
        payment: null,
      })),
    });
    const result = await recoverEnrollment(deps, {
      courseSlug: "curso-x",
      studentEmail: "a@b.com",
      studentCpf: VALID_CPF,
    });
    expect(result).toEqual({ ok: false, reason: "cpf_mismatch" });
  });

  it("aceita CPF com máscara no input quando o banco armazena só dígitos", async () => {
    const deps = makeDeps();
    const result = await recoverEnrollment(deps, {
      courseSlug: "curso-x",
      studentEmail: "a@b.com",
      studentCpf: VALID_CPF_MASKED,
    });
    expect(result).toEqual({
      ok: true,
      redirectTo: "/cursos/curso-x/aulas/lesson-1",
    });
  });

  it("retorna redirect pra primeira aula no happy path", async () => {
    const deps = makeDeps();
    const result = await recoverEnrollment(deps, {
      courseSlug: "curso-x",
      studentEmail: "a@b.com",
      studentCpf: VALID_CPF,
    });
    expect(result).toEqual({
      ok: true,
      redirectTo: "/cursos/curso-x/aulas/lesson-1",
    });
  });

  it("redireciona pra página do curso quando não há aulas publicadas", async () => {
    const deps = makeDeps({
      findCourseWithFirstLesson: vi.fn(async (slug: string) => ({
        id: "course-1",
        slug,
        firstLessonId: null,
      })),
    });
    const result = await recoverEnrollment(deps, {
      courseSlug: "curso-vazio",
      studentEmail: "a@b.com",
      studentCpf: VALID_CPF,
    });
    expect(result).toEqual({ ok: true, redirectTo: "/cursos/curso-vazio" });
  });

  it("passa o email recebido pra dep (a normalização case/trim é responsabilidade do Zod e do repo)", async () => {
    const spy = vi.fn(async () => null);
    const deps = makeDeps({ findEnrollmentByCourseAndEmail: spy });
    await recoverEnrollment(deps, {
      courseSlug: "curso-x",
      studentEmail: "JORGE@Exemplo.COM",
      studentCpf: VALID_CPF,
    });
    expect(spy).toHaveBeenCalledWith("course-1", "JORGE@Exemplo.COM");
  });
});

describe("enrollmentRecoverSchema", () => {
  it("normaliza email pra lowercase e trim", () => {
    const parsed = enrollmentRecoverSchema.parse({
      courseSlug: "curso-x",
      studentEmail: "  JORGE@Exemplo.COM  ",
      studentCpf: VALID_CPF_MASKED,
    });
    expect(parsed.studentEmail).toBe("jorge@exemplo.com");
  });

  it("rejeita email inválido", () => {
    const result = enrollmentRecoverSchema.safeParse({
      courseSlug: "curso-x",
      studentEmail: "nao-eh-email",
      studentCpf: VALID_CPF,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita CPF inválido (dígito verificador)", () => {
    const result = enrollmentRecoverSchema.safeParse({
      courseSlug: "curso-x",
      studentEmail: "a@b.com",
      studentCpf: "11111111111",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita courseSlug vazio", () => {
    const result = enrollmentRecoverSchema.safeParse({
      courseSlug: "",
      studentEmail: "a@b.com",
      studentCpf: VALID_CPF,
    });
    expect(result.success).toBe(false);
  });

  it("aceita CPF com ou sem máscara", () => {
    expect(
      enrollmentRecoverSchema.safeParse({
        courseSlug: "curso-x",
        studentEmail: "a@b.com",
        studentCpf: VALID_CPF_MASKED,
      }).success,
    ).toBe(true);
    expect(
      enrollmentRecoverSchema.safeParse({
        courseSlug: "curso-x",
        studentEmail: "a@b.com",
        studentCpf: VALID_CPF,
      }).success,
    ).toBe(true);
  });
});
