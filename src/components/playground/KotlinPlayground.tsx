"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CodeEditor } from "./CodeEditor";
import type {
  KotlinGradeRequest,
  KotlinGradeResult,
} from "@/lib/kotlin-grader-types";
import {
  CheckCircle,
  Loader2,
  Play,
  RotateCcw,
  XCircle,
} from "lucide-react";

const DRAFT_KEY_PREFIX = "frc-kotlin-draft:";

interface KotlinPlaygroundProps {
  code: string;
  exerciseId: string;
  lessonSlug: string;
  onGradeResult?: (result: KotlinGradeResult) => void;
}

export function KotlinPlayground({
  code,
  exerciseId,
  lessonSlug,
  onGradeResult,
}: KotlinPlaygroundProps) {
  const [currentCode, setCurrentCode] = useState(code);
  const [result, setResult] = useState<KotlinGradeResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const draftKey = useMemo(
    () => `${DRAFT_KEY_PREFIX}${exerciseId}`,
    [exerciseId]
  );

  useEffect(() => {
    const savedDraft = window.localStorage.getItem(draftKey);
    if (savedDraft && savedDraft !== code) {
      queueMicrotask(() => setCurrentCode(savedDraft));
    }
  }, [code, draftKey]);

  const handleCodeChange = useCallback(
    (nextCode: string) => {
      setCurrentCode(nextCode);
      window.localStorage.setItem(draftKey, nextCode);
      setResult(null);
    },
    [draftKey]
  );

  const handleReset = useCallback(() => {
    setCurrentCode(code);
    setResult(null);
    window.localStorage.removeItem(draftKey);
  }, [code, draftKey]);

  const handleRun = useCallback(async () => {
    if (isRunning) return;

    setIsRunning(true);
    setResult(null);

    const request: KotlinGradeRequest = {
      action: "grade",
      lessonSlug,
      exerciseId,
      code: currentCode,
    };

    let gradeResult: KotlinGradeResult;
    try {
      const response = await fetch("/api/kotlin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data: unknown = await response.json();

      if (!response.ok || !isGradeResult(data)) {
        gradeResult = failedRequestResult(
          getResponseError(data) ?? "The grader returned an invalid response."
        );
      } else {
        gradeResult = data;
      }
    } catch {
      gradeResult = failedRequestResult(
        "The grader is unavailable right now. Check your connection and try again."
      );
    }

    setResult(gradeResult);
    setIsRunning(false);
    onGradeResult?.(gradeResult);
  }, [currentCode, exerciseId, isRunning, lessonSlug, onGradeResult]);

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <div className="relative">
        <CodeEditor
          value={currentCode}
          onChange={handleCodeChange}
          onRun={handleRun}
        />
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isRunning || currentCode === code}
            className="inline-flex items-center gap-1 rounded bg-slate-700 px-2 py-1.5 text-xs text-white transition-colors hover:bg-slate-600 disabled:opacity-40"
            title="Reset to starter code"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning}
            className="inline-flex items-center gap-1 rounded bg-success px-2 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-success/90 disabled:opacity-50"
            title="Run (Ctrl+Enter or Command+Enter)"
          >
            {isRunning ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} fill="white" />
            )}
            {isRunning ? "Checking" : "Run"}
          </button>
        </div>
      </div>

      {result && <GradeResultPanel result={result} />}
    </div>
  );
}

function GradeResultPanel({ result }: { result: KotlinGradeResult }) {
  return (
    <div
      aria-live="polite"
      className="max-h-56 space-y-2 overflow-y-auto border-t border-border bg-[#1e293b] p-3 font-mono text-sm"
    >
      {result.errors.length > 0 && (
        <div className="space-y-2 text-red-300">
          {result.errors.map((error, index) => {
            const friendlyMessage = explainCompilerError(error);
            return (
              <div key={`${index}:${error}`}>
                {friendlyMessage && (
                  <p className="font-sans text-sm font-medium">
                    {friendlyMessage}
                  </p>
                )}
                <p className="whitespace-pre-wrap text-xs opacity-85">
                  {error}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {result.tests.map((test, index) => (
        <div
          key={`${index}:${test.name}`}
          className={`flex items-start gap-2 ${
            test.passed ? "text-green-300" : "text-red-300"
          }`}
        >
          {test.passed ? (
            <CheckCircle size={14} className="mt-0.5 shrink-0" />
          ) : (
            <XCircle size={14} className="mt-0.5 shrink-0" />
          )}
          <span>
            {formatTestName(test.name)}
            {test.message && (
              <span className="block text-xs opacity-80">{test.message}</span>
            )}
          </span>
        </div>
      ))}

      {result.output && (
        <div className="whitespace-pre-wrap text-slate-200">
          <span className="text-slate-400">Output:</span>{"\n"}
          {result.output}
        </div>
      )}

      {result.passed && result.tests.length === 0 && !result.output && (
        <div className="flex items-center gap-2 text-green-300">
          <CheckCircle size={14} /> Your code passed.
        </div>
      )}
    </div>
  );
}

function formatTestName(name: string): string {
  return name
    .replace(/^test/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/^./, (character) => character.toUpperCase());
}

function explainCompilerError(error: string): string | null {
  if (/unresolved reference/i.test(error)) {
    return "Kotlin cannot find one of the names in your code. Check its spelling and where it was declared.";
  }
  if (/type mismatch/i.test(error)) {
    return "A value has a different type than Kotlin expected. Compare the expected and actual types below.";
  }
  if (/expecting|unexpected tokens?/i.test(error)) {
    return "Kotlin found a syntax problem. Check nearby parentheses, braces, commas, and quotation marks.";
  }
  if (/timed out/i.test(error)) {
    return "The compiler took too long to respond; your draft is saved, so it is safe to try again.";
  }
  return null;
}

function isGradeResult(value: unknown): value is KotlinGradeResult {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Record<string, unknown>;
  return (
    typeof result.passed === "boolean" &&
    typeof result.output === "string" &&
    Array.isArray(result.errors) &&
    result.errors.every((error) => typeof error === "string") &&
    Array.isArray(result.tests)
  );
}

function getResponseError(value: unknown): string | null {
  if (typeof value !== "object" || value === null) return null;
  const error = (value as Record<string, unknown>).error;
  return typeof error === "string" ? error : null;
}

function failedRequestResult(message: string): KotlinGradeResult {
  return { passed: false, output: "", errors: [message], tests: [] };
}
