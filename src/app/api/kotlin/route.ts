import path from "path";
import { getExerciseForLesson } from "@/lib/content/fs-loader";
import { isCodeExercise } from "@/lib/content/client-exercise";
import { gradeKotlinExercise } from "@/lib/kotlin-grader";
import type { KotlinExerciseRequest } from "@/lib/kotlin-grader-types";

const CONTENT_DIR = path.resolve(process.cwd(), "content");
const MAX_CODE_LENGTH = 50_000;

function isExerciseRequest(value: unknown): value is KotlinExerciseRequest {
  if (typeof value !== "object" || value === null) return false;

  const request = value as Record<string, unknown>;
  if (
    (request.action !== "grade" && request.action !== "solution") ||
    typeof request.lessonSlug !== "string" ||
    typeof request.exerciseId !== "string"
  ) {
    return false;
  }

  return request.action === "solution" || typeof request.code === "string";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isExerciseRequest(body)) {
    return Response.json({ error: "Invalid exercise request." }, { status: 400 });
  }

  if (body.action === "grade" && body.code.length > MAX_CODE_LENGTH) {
    return Response.json(
      { error: "Code is too large to run in the tutorial." },
      { status: 413 }
    );
  }

  const exercise = await getExerciseForLesson(
    "playground",
    body.lessonSlug,
    body.exerciseId,
    CONTENT_DIR
  );

  if (!exercise || !isCodeExercise(exercise)) {
    return Response.json({ error: "Exercise not found." }, { status: 404 });
  }

  if (body.action === "solution") {
    return Response.json({ solutionCode: exercise.solutionCode });
  }

  const result = await gradeKotlinExercise(exercise, body.code);
  return Response.json(result, {
    status: result.errors.some((error) => error.includes("configured"))
      ? 500
      : 200,
  });
}
