"use client";

import { useState, useCallback } from "react";
import { CodeEditor } from "./CodeEditor";
import { runKotlin } from "@/lib/kotlin-api";
import { Play, Loader2 } from "lucide-react";

interface KotlinPlaygroundProps {
  code: string;
  exerciseId: string;
  hiddenDependency?: string;
  onExecutionEnd?: (output: string) => void;
}

export function KotlinPlayground({
  code,
  exerciseId,
  hiddenDependency,
  onExecutionEnd,
}: KotlinPlaygroundProps) {
  const [currentCode, setCurrentCode] = useState(code);
  const [output, setOutput] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setOutput(null);
    setErrors([]);

    const result = await runKotlin(currentCode, hiddenDependency);

    setOutput(result.output);
    setErrors(result.errors);
    setIsRunning(false);

    onExecutionEnd?.(result.output);
  }, [currentCode, hiddenDependency, onExecutionEnd]);

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <div className="relative">
        <CodeEditor value={currentCode} onChange={setCurrentCode} />
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="absolute top-2 right-2 p-1.5 rounded bg-success text-white hover:bg-success/90 disabled:opacity-50 transition-colors"
          title="Run (Ctrl+Enter)"
        >
          {isRunning ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Play size={16} fill="white" />
          )}
        </button>
      </div>

      {/* Output panel */}
      {(output !== null || errors.length > 0) && (
        <div className="border-t border-border bg-[#1e293b] p-3 text-sm font-mono max-h-48 overflow-y-auto">
          {errors.length > 0 ? (
            <div className="text-red-400 whitespace-pre-wrap">
              {errors.join("\n")}
            </div>
          ) : (
            <div className="text-green-300 whitespace-pre-wrap">
              {output || "(no output)"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
