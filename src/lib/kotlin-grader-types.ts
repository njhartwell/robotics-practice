export interface KotlinTestCase {
  name: string;
  passed: boolean;
  message?: string;
  expected?: string;
  actual?: string;
}

export interface KotlinGradeResult {
  passed: boolean;
  output: string;
  errors: string[];
  tests: KotlinTestCase[];
}

export interface KotlinGradeRequest {
  action: "grade";
  lessonSlug: string;
  exerciseId: string;
  code: string;
}

export interface KotlinSolutionRequest {
  action: "solution";
  lessonSlug: string;
  exerciseId: string;
}

export type KotlinExerciseRequest = KotlinGradeRequest | KotlinSolutionRequest;
