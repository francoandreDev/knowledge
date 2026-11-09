import { describe, expect, test } from "bun:test";
import { STUDY_MISSIONS, isStudyDone, newlyCompletedStudy } from "./missions";

describe("study missions", () => {
  test("nothing is done before any study", () => {
    for (const m of STUDY_MISSIONS)
      expect(isStudyDone(m, { passed: 0, reviewed: 0 })).toBe(false);
  });

  test("one pass wins the first mission only", () => {
    const won = newlyCompletedStudy({ passed: 1, reviewed: 0 }, []);
    expect(won.map((m) => m.id)).toEqual(["study-pass-1"]);
  });

  test("three passes win both pass missions, and a review the third", () => {
    expect(
      newlyCompletedStudy({ passed: 3, reviewed: 0 }, []).map((m) => m.id),
    ).toEqual(["study-pass-1", "study-pass-3"]);
    expect(
      newlyCompletedStudy({ passed: 3, reviewed: 1 }, []).map((m) => m.id),
    ).toEqual(["study-pass-1", "study-pass-3", "study-review"]);
  });

  test("a mission already claimed is never paid twice", () => {
    const won = newlyCompletedStudy({ passed: 3, reviewed: 1 }, [
      "study-pass-1",
      "study-pass-3",
    ]);
    expect(won.map((m) => m.id)).toEqual(["study-review"]);
    expect(
      newlyCompletedStudy(
        { passed: 9, reviewed: 9 },
        STUDY_MISSIONS.map((m) => m.id),
      ),
    ).toEqual([]);
  });

  test("progress never exceeds its target", () => {
    for (const m of STUDY_MISSIONS) {
      const [cur, target] = m.progress({ passed: 99, reviewed: 99 });
      expect(cur).toBe(target);
    }
  });
});
