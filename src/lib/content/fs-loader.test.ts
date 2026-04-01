import { describe, it, expect } from "vitest";
import path from "path";
import {
  getAllLessonMetas,
  getExercisesForLesson,
  getLessonMdx,
} from "./fs-loader";

const CONTENT_DIR = path.resolve(process.cwd(), "content");

describe("getAllLessonMetas", () => {
  it("loads playground lesson metas from content directory", async () => {
    const metas = await getAllLessonMetas("playground", CONTENT_DIR);
    expect(metas.length).toBeGreaterThanOrEqual(2);

    const hello = metas.find((m) => m.slug === "01-hello-kotlin");
    expect(hello).toBeDefined();
    expect(hello!.part).toBe("playground");
    expect(hello!.section).toBe("getting-started");
    expect(hello!.sectionTitle).toBe("Getting Started");
    expect(hello!.title).toBe("Hello, Kotlin!");
  });

  it("loads ide-projects lesson metas", async () => {
    const metas = await getAllLessonMetas("ide-projects", CONTENT_DIR);
    expect(metas.length).toBeGreaterThanOrEqual(1);

    const setup = metas.find((m) => m.slug === "01-project-setup");
    expect(setup).toBeDefined();
    expect(setup!.part).toBe("ide-projects");
  });

  it("returns lessons sorted by sectionOrder then order", async () => {
    const metas = await getAllLessonMetas("playground", CONTENT_DIR);
    for (let i = 1; i < metas.length; i++) {
      const prev = metas[i - 1];
      const curr = metas[i];
      expect(
        prev.sectionOrder < curr.sectionOrder ||
          (prev.sectionOrder === curr.sectionOrder && prev.order <= curr.order)
      ).toBe(true);
    }
  });
});

describe("getExercisesForLesson", () => {
  it("loads exercises for 01-hello-kotlin", async () => {
    const exercises = await getExercisesForLesson(
      "playground",
      "01-hello-kotlin",
      CONTENT_DIR
    );
    expect(exercises.length).toBe(4);
    expect(exercises[0].order).toBeLessThanOrEqual(exercises[1].order);
  });

  it("returns empty array for lesson with no exercises dir", async () => {
    const exercises = await getExercisesForLesson(
      "ide-projects",
      "01-project-setup",
      CONTENT_DIR
    );
    expect(exercises).toEqual([]);
  });
});

describe("getLessonMdx", () => {
  it("loads MDX content for a lesson", async () => {
    const mdx = await getLessonMdx(
      "playground",
      "01-hello-kotlin",
      CONTENT_DIR
    );
    expect(mdx).toContain("Hello");
    expect(mdx.length).toBeGreaterThan(0);
  });
});
