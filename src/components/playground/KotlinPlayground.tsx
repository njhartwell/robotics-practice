"use client";

import { useEffect, useRef } from "react";

interface KotlinPlaygroundProps {
  code: string;
  exerciseId: string;
  theme?: "darcula" | "default";
  onExecutionEnd?: (output: string) => void;
  onTestPassed?: () => void;
  onTestFailed?: (error: string) => void;
  targetPlatform?: "jvm" | "junit";
  hiddenDependency?: string;
}

export function KotlinPlayground({
  code,
  exerciseId,
  theme = "darcula",
  onExecutionEnd,
  onTestPassed,
  onTestFailed,
  targetPlatform = "jvm",
  hiddenDependency,
}: KotlinPlaygroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const onExecutionEndRef = useRef(onExecutionEnd);
  onExecutionEndRef.current = onExecutionEnd;

  useEffect(() => {
    if (!containerRef.current || initialized.current) return;
    initialized.current = true;

    import("kotlin-playground").then((module) => {
      const playground = module.default || module;
      if (!containerRef.current) return;

      // Track whether the playground is currently executing code.
      // onRun fires when execution starts; we then watch for the
      // loader element to disappear, which signals completion.
      let running = false;

      playground(containerRef.current, {
        onTestPassed: () => onTestPassed?.(),
        onTestFailed: (error: string) => onTestFailed?.(error),
        onRun: () => {
          running = true;
        },
        callback: (_targetNode: HTMLElement, mountNode: HTMLElement) => {
          if (!mountNode) return;

          let debounceTimer: ReturnType<typeof setTimeout> | null = null;

          const observer = new MutationObserver(() => {
            if (!running) return;

            // Debounce DOM updates — the playground may mutate
            // several times during a single execution cycle.
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
              // Still loading — wait for it to finish
              if (mountNode.querySelector(".loader")) return;

              // Execution is done (loader gone). Read the output.
              const outputEl = mountNode.querySelector(".code-output");
              if (!outputEl) {
                // Console never opened — empty execution (e.g. compile error
                // with no output). Report empty output.
                running = false;
                onExecutionEndRef.current?.("");
                return;
              }

              const stdSpans = outputEl.querySelectorAll(".standard-output");
              const text = Array.from(stdSpans)
                .map((span) => span.textContent ?? "")
                .join("");

              running = false;
              onExecutionEndRef.current?.(text);
            }, 150);
          });

          observer.observe(mountNode, {
            childList: true,
            subtree: true,
            characterData: true,
          });
        },
      });
    });
  }, [onTestPassed, onTestFailed]);

  return (
    <div ref={containerRef} key={exerciseId}>
      <code
        data-autocomplete="true"
        data-highlight-only="false"
        data-target-platform={targetPlatform}
        data-theme={theme}
      >
        {code}
      </code>
      {hiddenDependency && (
        <textarea className="hidden-dependency" style={{ display: "none" }}>
          {hiddenDependency}
        </textarea>
      )}
    </div>
  );
}
