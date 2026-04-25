export const STUDENT_EMAIL_KEY = "netflix_cursos_email";

export function readStudentEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STUDENT_EMAIL_KEY);
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
