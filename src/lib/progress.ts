export const COMPLETED_THRESHOLD_PCT = 90;

export type LessonLike = { id: string };
export type LessonViewLike = { lessonId: string; completed: boolean };

export function areAllLessonsCompleted(
  lessons: ReadonlyArray<LessonLike>,
  views: ReadonlyArray<LessonViewLike>,
): boolean {
  if (lessons.length === 0) return false;
  const completedIds = new Set(views.filter((v) => v.completed).map((v) => v.lessonId));
  return lessons.every((l) => completedIds.has(l.id));
}

export function isCompletedPct(progressPct: number): boolean {
  return progressPct >= COMPLETED_THRESHOLD_PCT;
}
