import fs from "fs/promises";
import path from "path";
import type { LessonMeta, Part, Exercise } from "@/lib/progress/types";
import { parseExercise, parseLessonMeta } from "./loader";

/**
 * Recursively find all directories containing a meta.json file
 * under the given base directory.
 */
async function findLessonDirs(baseDir: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(dir: string) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    const hasMetaJson = entries.some(
      (e) => e.isFile() && e.name === "meta.json"
    );
    if (hasMetaJson) {
      results.push(dir);
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        await walk(path.join(dir, entry.name));
      }
    }
  }

  await walk(baseDir);
  return results;
}

/**
 * Load all lesson metadata for a given part by scanning the content directory.
 * Returns lessons sorted by sectionOrder then order.
 */
export async function getAllLessonMetas(
  part: Part,
  contentDir: string
): Promise<LessonMeta[]> {
  const partDir = path.join(contentDir, part);
  const lessonDirs = await findLessonDirs(partDir);

  const metas: LessonMeta[] = [];
  for (const dir of lessonDirs) {
    const metaPath = path.join(dir, "meta.json");
    const raw = JSON.parse(await fs.readFile(metaPath, "utf-8"));

    // Count exercises
    const exercisesDir = path.join(dir, "exercises");
    let exerciseCount = 0;
    try {
      const exerciseFiles = await fs.readdir(exercisesDir);
      exerciseCount = exerciseFiles.filter((f) => f.endsWith(".json")).length;
    } catch {
      // No exercises directory
    }

    const meta = parseLessonMeta(
      { ...raw, exerciseCount },
      part,
      path.relative(contentDir, metaPath)
    );
    metas.push(meta);
  }

  return metas.sort(
    (a, b) => a.sectionOrder - b.sectionOrder || a.order - b.order
  );
}

/**
 * Load all exercises for a specific lesson.
 * Returns exercises sorted by order.
 */
export async function getExercisesForLesson(
  part: Part,
  slug: string,
  contentDir: string
): Promise<Exercise[]> {
  const partDir = path.join(contentDir, part);
  const lessonDir = await findLessonDirBySlug(partDir, slug);
  if (!lessonDir) return [];

  const exercisesDir = path.join(lessonDir, "exercises");
  let files: string[];
  try {
    files = (await fs.readdir(exercisesDir)).filter((f) =>
      f.endsWith(".json")
    );
  } catch {
    return [];
  }

  const exercises: Exercise[] = [];
  for (const file of files) {
    const exercisePath = path.join(exercisesDir, file);
    const raw = JSON.parse(await fs.readFile(exercisePath, "utf-8"));
    exercises.push(
      parseExercise(raw, path.relative(contentDir, exercisePath))
    );
  }

  return exercises.sort((a, b) => a.order - b.order);
}

/** Load one exercise while keeping its grader fields on the server. */
export async function getExerciseForLesson(
  part: Part,
  slug: string,
  exerciseId: string,
  contentDir: string
): Promise<Exercise | null> {
  const exercises = await getExercisesForLesson(part, slug, contentDir);
  return exercises.find((exercise) => exercise.id === exerciseId) ?? null;
}

/**
 * Load the raw MDX content for a lesson.
 */
export async function getLessonMdx(
  part: Part,
  slug: string,
  contentDir: string
): Promise<string> {
  const partDir = path.join(contentDir, part);
  const lessonDir = await findLessonDirBySlug(partDir, slug);
  if (!lessonDir) return "";

  const mdxPath = path.join(lessonDir, "lesson.mdx");
  try {
    return await fs.readFile(mdxPath, "utf-8");
  } catch {
    return "";
  }
}

/**
 * Find the lesson directory for a given slug by scanning for meta.json
 * files and matching the slug field.
 */
async function findLessonDirBySlug(
  partDir: string,
  slug: string
): Promise<string | null> {
  const dirs = await findLessonDirs(partDir);
  for (const dir of dirs) {
    const metaPath = path.join(dir, "meta.json");
    try {
      const raw = JSON.parse(await fs.readFile(metaPath, "utf-8"));
      if (raw.slug === slug) return dir;
    } catch {
      continue;
    }
  }
  return null;
}
