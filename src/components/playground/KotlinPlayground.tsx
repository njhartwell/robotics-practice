"use client";

import { useEffect, useRef } from "react";

interface KotlinPlaygroundProps {
  code: string;
  exerciseId: string;
  theme?: "darcula" | "default";
  onOutput?: (output: string) => void;
  onTestPassed?: () => void;
  onTestFailed?: (error: string) => void;
  targetPlatform?: "jvm" | "junit";
  hiddenDependency?: string;
}

export function KotlinPlayground({
  code,
  exerciseId,
  theme = "darcula",
  onOutput,
  onTestPassed,
  onTestFailed,
  targetPlatform = "jvm",
  hiddenDependency,
}: KotlinPlaygroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  // Use refs so the MutationObserver closure always sees current callbacks
  const onOutputRef = useRef(onOutput);
  onOutputRef.current = onOutput;

  useEffect(() => {
    if (!containerRef.current || initialized.current) return;
    initialized.current = true;

    import("kotlin-playground").then((module) => {
      const playground = module.default || module;
      if (!containerRef.current) return;

      playground(containerRef.current, {
        onTestPassed: () => onTestPassed?.(),
        onTestFailed: (error: string) => onTestFailed?.(error),
        callback: (_targetNode: HTMLElement, mountNode: HTMLElement) => {
          if (!mountNode) return;

          // The playground renders execution output into .standard-output
          // spans inside a .code-output div. We use a MutationObserver to
          // detect when output appears after the user clicks "Run".
          let debounceTimer: ReturnType<typeof setTimeout> | null = null;

          const observer = new MutationObserver(() => {
            // Debounce: the playground may update the DOM multiple times
            // during a single render cycle.
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
              const outputEl = mountNode.querySelector(".code-output");
              if (!outputEl) return;

              // Collect text from standard-output spans (ignoring error output)
              const stdSpans = outputEl.querySelectorAll(".standard-output");
              if (stdSpans.length > 0) {
                const text = Array.from(stdSpans)
                  .map((span) => span.textContent ?? "")
                  .join("");
                if (text.trim()) {
                  onOutputRef.current?.(text);
                }
              }
            }, 100);
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
