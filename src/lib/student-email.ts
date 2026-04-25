export const STUDENT_EMAIL_KEY = "ativa_engenharia_email";
export const LEGACY_STUDENT_EMAIL_KEY = "netflix_cursos_email";

export function readStudentEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const current = window.localStorage.getItem(STUDENT_EMAIL_KEY);
    if (current) return current;

    const legacy = window.localStorage.getItem(LEGACY_STUDENT_EMAIL_KEY);
    if (legacy) {
      window.localStorage.setItem(STUDENT_EMAIL_KEY, legacy);
      window.localStorage.removeItem(LEGACY_STUDENT_EMAIL_KEY);
      return legacy;
    }

    return null;
  } catch {
    return null;
  }
}

export function writeStudentEmail(email: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STUDENT_EMAIL_KEY, email);
  } catch {
    /* ignore quota / private mode failures */
  }
}
