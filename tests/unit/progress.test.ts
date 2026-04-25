import { COMPLETED_THRESHOLD_PCT, areAllLessonsCompleted, isCompletedPct } from "@/lib/progress";
import { describe, expect, it } from "vitest";

describe("areAllLessonsCompleted", () => {
  const lessons = [{ id: "l1" }, { id: "l2" }, { id: "l3" }];

  it("returns false when there are no lessons", () => {
    expect(areAllLessonsCompleted([], [])).toBe(false);
  });

  it("returns true only when every lesson has a completed view", () => {
    expect(
      areAllLessonsCompleted(lessons, [
        { lessonId: "l1", completed: true },
        { lessonId: "l2", completed: true },
        { lessonId: "l3", completed: true },
      ]),
    ).toBe(true);
  });

  it("returns false when at least one lesson is missing or incomplete", () => {
    expect(
      areAllLessonsCompleted(lessons, [
        { lessonId: "l1", completed: true },
        { lessonId: "l2", completed: false },
        { lessonId: "l3", completed: true },
      ]),
    ).toBe(false);

    expect(
      areAllLessonsCompleted(lessons, [
        { lessonId: "l1", completed: true },
        { lessonId: "l2", completed: true },
      ]),
    ).toBe(false);
  });

  it("ignores completed views for lessons not in the course", () => {
    expect(
      areAllLessonsCompleted(
        [{ id: "l1" }],
        [
          { lessonId: "l1", completed: true },
          { lessonId: "ghost", completed: true },
        ],
      ),
    ).toBe(true);
  });
});

describe("isCompletedPct", () => {
  it("uses the 90% threshold", () => {
    expect(COMPLETED_THRESHOLD_PCT).toBe(90);
    expect(isCompletedPct(89)).toBe(false);
    expect(isCompletedPct(90)).toBe(true);
    expect(isCompletedPct(100)).toBe(true);
  });
});
